/**
 * combatEngine.ts — Lanchester combat formulas + terrain + morale modifiers
 *
 * Ported from MilitarySandbox.tsx and RealWorldMapBattle.tsx.
 * Implements:
 *   - Lanchester square-law damage calculation
 *   - Nine Lands (九地) terrain modifiers
 *   - Five Flaws (五危) general personality effects
 *   - Morale factor from supplyEngine's categories
 *   - Weather effects
 *
 * Comparable references:
 *   - TW:3K: terrain/weather modifiers + general abilities
 *   - CK3: commander traits affecting combat rolls
 */

import type { UnifiedUnit } from '../types';
import { getMoraleCategory } from './supplyEngine';

// ──────────────────────────────────────────────────────────
// Terrain types (九地 — the Nine Lands from Sun Tzu Chapter 11)
// ──────────────────────────────────────────────────────────

export type TerrainType =
  | 'SCATTERED'    // 散地 — scattered ground: morale penalty
  | 'LIGHT'        // 轻地 — light ground: minor disadvantage
  | 'CONTENTIOUS'  // 争地 — contentious ground: defense bonus
  | 'FACILE'       // 交地 — facile ground: free movement
  | 'FOCAL'        // 衢地 — focal ground: neutral
  | 'HEAVY'        // 重地 — heavy ground: supply penalty
  | 'ENTRAPPING'   // 圮地 — entrapping ground: attack penalty
  | 'FRONTIER'     // 围地 — frontier ground: defense bonus
  | 'DEATH';       // 死地 — death ground: desperate frenzy

export type WeatherType = 'CLEAR' | 'RAIN' | 'WIND' | 'FOG';

// ──────────────────────────────────────────────────────────
// Terrain combat modifiers
// ──────────────────────────────────────────────────────────

interface TerrainModifiers {
  attackMod: number;
  defenseMod: number;
  speedMod: number;
  moraleMod: number;
}

const TERRAIN_MODIFIERS: Record<TerrainType, TerrainModifiers> = {
  SCATTERED:   { attackMod: -15, defenseMod: 0,   speedMod: 1.0,  moraleMod: -10 },
  LIGHT:       { attackMod: -5,  defenseMod: -5,  speedMod: 1.0,  moraleMod: 0   },
  CONTENTIOUS: { attackMod: 5,   defenseMod: 35,  speedMod: 0.8,  moraleMod: 5   },
  FACILE:      { attackMod: 10,  defenseMod: -10, speedMod: 1.2,  moraleMod: 0   },
  FOCAL:       { attackMod: 0,   defenseMod: 0,   speedMod: 1.0,  moraleMod: 0   },
  HEAVY:       { attackMod: 10,  defenseMod: -5,  speedMod: 0.6,  moraleMod: -5  },
  ENTRAPPING:  { attackMod: -20, defenseMod: -10, speedMod: 0.5,  moraleMod: -15 },
  FRONTIER:    { attackMod: -10, defenseMod: 40,  speedMod: 0.7,  moraleMod: 5   },
  DEATH:       { attackMod: 30,  defenseMod: 30,  speedMod: 1.5,  moraleMod: 20  },
};

// ──────────────────────────────────────────────────────────
// Weather modifiers
// ──────────────────────────────────────────────────────────

interface WeatherModifiers {
  attackMod: number;
  defenseMod: number;
  speedMod: number;
  visibilityMod: number;  // affects scout confidence
}

const WEATHER_MODIFIERS: Record<WeatherType, WeatherModifiers> = {
  CLEAR: { attackMod: 0,   defenseMod: 0,   speedMod: 1.0,  visibilityMod: 1.0  },
  RAIN:  { attackMod: -5,  defenseMod: 5,   speedMod: 0.5,  visibilityMod: 0.6  },
  WIND:  { attackMod: -10, defenseMod: -5,  speedMod: 1.4,  visibilityMod: 0.7  },
  FOG:   { attackMod: -15, defenseMod: 10,  speedMod: 0.75, visibilityMod: 0.3  },
};

// ──────────────────────────────────────────────────────────
// Flaw effects (五危 — Five Flaws, Sun Tzu Chapter 8)
// ──────────────────────────────────────────────────────────

export type FlawType = '必死' | '必生' | '忿速' | '廉洁' | '爱民' | 'NONE';

interface FlawModifiers {
  attackMod: number;
  defenseMod: number;
  moraleMod: number;
}

const FLAW_MODIFIERS: Record<FlawType, FlawModifiers> = {
  NONE:   { attackMod: 1.0,  defenseMod: 1.0,  moraleMod: 0   },
  必死:   { attackMod: 1.30, defenseMod: 0.70, moraleMod: 10  },  // reckless: hits hard, defends poorly
  必生:   { attackMod: 0.75, defenseMod: 1.25, moraleMod: -5  },  // cautious: defends well, timid attack
  忿速:   { attackMod: 1.15, defenseMod: 0.60, moraleMod: -10 },  // hot-tempered: rash attacks
  廉洁:   { attackMod: 0.90, defenseMod: 0.90, moraleMod: 5   },  // honor-sensitive: easily provoked
  爱民:   { attackMod: 0.85, defenseMod: 0.85, moraleMod: 5   },  // people-pleasing: hesitant
};

// ──────────────────────────────────────────────────────────
// Combat resolution
// ──────────────────────────────────────────────────────────

export interface CombatInput {
  attacker: UnifiedUnit;
  defender: UnifiedUnit;
  terrain: TerrainType;
  weather: WeatherType;
  attackerFlaw?: FlawType;
  defenderFlaw?: FlawType;
}

export interface CombatResult {
  attackerDamageDealt: number;
  defenderDamageDealt: number;
  attackerMoraleDelta: number;
  defenderMoraleDelta: number;
  attackerSurvivingSize: number;
  defenderSurvivingSize: number;
  narrative: string;
}

/**
 * Lanchester square-law combat resolution.
 * Damage = attacker.size² × attackPower × modifiers ÷ defender.defensePower
 */
export function resolveCombat(input: CombatInput): CombatResult {
  const { attacker, defender, terrain, weather, attackerFlaw, defenderFlaw } = input;

  const tMod = TERRAIN_MODIFIERS[terrain];
  const wMod = WEATHER_MODIFIERS[weather];
  const aFlaw = FLAW_MODIFIERS[attackerFlaw || 'NONE'];
  const dFlaw = FLAW_MODIFIERS[defenderFlaw || 'NONE'];

  // Morale categories
  const aMorale = getMoraleCategory(attacker.morale);
  const dMorale = getMoraleCategory(defender.morale);

  // Effective attack power
  function effectiveAttack(unit: UnifiedUnit, flaw: FlawModifiers): number {
    const moraleFactor = 1.0 + getMoraleCategory(unit.morale).bonus;
    const terrainFactor = 1.0 + tMod.attackMod / 100;
    const weatherFactor = 1.0 + wMod.attackMod / 100;
    const provisionFactor = unit.provisions > 30 ? 1.0 : 0.5 + (unit.provisions / 60);

    return Math.max(1, Math.round(
      unit.size *
      (unit.attackPower / 100) *
      flaw.attackMod *
      moraleFactor *
      terrainFactor *
      weatherFactor *
      provisionFactor
    ));
  }

  function effectiveDefense(unit: UnifiedUnit, flaw: FlawModifiers): number {
    const terrainFactor = 1.0 + tMod.defenseMod / 100;
    const weatherFactor = 1.0 + wMod.defenseMod / 100;

    return Math.max(1, Math.round(
      (unit.defensePower / 100) *
      flaw.defenseMod *
      terrainFactor *
      weatherFactor *
      (unit.isRouted ? 0.25 : 1.0)  // routed units defend at 25%
    ));
  }

  // Fake units deal 0 damage
  const aEffAtk = attacker.isFake ? 0 : effectiveAttack(attacker, aFlaw);
  const dEffAtk = defender.isFake ? 0 : effectiveAttack(defender, dFlaw);
  const aEffDef = effectiveDefense(attacker, aFlaw);
  const dEffDef = effectiveDefense(defender, dFlaw);

  // Lanchester: casualties = enemy_attack_power / own_defense
  const attackerLosses = Math.min(
    attacker.size - 1,
    Math.round(dEffAtk / Math.max(1, aEffDef / 10))
  );
  const defenderLosses = Math.min(
    defender.size - 1,
    Math.round(aEffAtk / Math.max(1, dEffDef / 10))
  );

  // Morale deltas
  const attackerMoraleDelta =
    (attackerLosses > defenderLosses ? -8 : +3) +
    tMod.moraleMod / 10 +
    (attacker.provisions < 30 ? -5 : 0);
  const defenderMoraleDelta =
    (defenderLosses > attackerLosses ? -8 : +3) +
    tMod.moraleMod / 10 +
    (defender.provisions < 30 ? -5 : 0);

  // Narrative
  const aName = attacker.isFake ? `${attacker.name}[疑兵]` : attacker.name;
  const dName = defender.isFake ? `${defender.name}[疑兵]` : defender.name;

  let narrative = '';
  if (attacker.isFake) {
    narrative = `⚔️ ${dName}攻击${aName}——发现营寨空虚无兵，白费力气！`;
  } else if (defender.isFake) {
    narrative = `⚔️ ${aName}突袭${dName}——草人虚旗应声而倒，此乃疑兵空营！`;
  } else {
    narrative =
      `⚔️ ${aName}与${dName}交锋！` +
      ` 我军折损${attackerLosses}人，敌损${defenderLosses}人。`;
    if (terrain === 'DEATH') {
      narrative += '（死地血战，士气暴涨！）';
    }
  }

  return {
    attackerDamageDealt: defenderLosses,
    defenderDamageDealt: attackerLosses,
    attackerMoraleDelta: Math.round(attackerMoraleDelta),
    defenderMoraleDelta: Math.round(defenderMoraleDelta),
    attackerSurvivingSize: Math.max(0, attacker.size - attackerLosses),
    defenderSurvivingSize: Math.max(0, defender.size - defenderLosses),
    narrative,
  };
}

// ──────────────────────────────────────────────────────────
// Utility: determine terrain from lat/lng context
// ──────────────────────────────────────────────────────────

export function classifyTerrainFromPosition(
  lat: number,
  lng: number
): TerrainType {
  // Simplified classification based on region
  // In a real implementation, this would use elevation data
  const absLat = Math.abs(lat);
  if (absLat > 40) return 'FRONTIER';      // northern frontier
  if (absLat > 38) return 'CONTENTIOUS';   // contested borderlands
  if (absLat > 36) return 'HEAVY';         // central plains (heavy ground)
  if (absLat > 34) return 'FOCAL';         // heartland
  if (absLat > 32) return 'FACILE';        // southern approach
  return 'SCATTERED';                       // distant lands
}

// ──────────────────────────────────────────────────────────
// Export modifier tables for UI display
// ──────────────────────────────────────────────────────────

export { TERRAIN_MODIFIERS, WEATHER_MODIFIERS, FLAW_MODIFIERS };