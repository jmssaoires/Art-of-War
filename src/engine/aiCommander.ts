/**
 * aiCommander.ts — Enemy AI commander (敌将)
 *
 * Implements the missing adversary so a scenario becomes a real contest
 * instead of a single-player puzzle. The AI plans a turn's worth of
 * intents (attack / maneuver / cut-supply) for one side, which the
 * scenario component then executes through the SAME engine paths the
 * player uses (resolveCombat, CUT_SUPPLY_EDGE).
 *
 * Design notes — tied to CLAUDE.md core mechanics:
 *   - 兵者诡道也: the AI evaluates targets by their *apparent* size
 *     (an isFake decoy shows fakeDisguiseAsSize). So a well-placed疑兵
 *     baits the enemy into wasting a turn — deception is rewarded by the
 *     AI's own greed. Higher difficulty resists the bait.
 *   - 不战而屈人之兵: AGGRESSIVE commanders also sever the player's
 *     supply lines, feeding the morale-avalanche loop in supplyEngine.
 *
 * Pure & deterministic (no Math.random) so turns are reproducible —
 * a hard requirement for a competitive sandbox.
 */

import type { UnifiedUnit, SupplyNode, SupplyEdge } from '../types';
import { haversineDistance } from './gameLoop';

export type AIDifficulty = 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';

export type EnemyActionKind = 'ATTACK' | 'MOVE' | 'CUT_SUPPLY';

export interface EnemyAction {
  kind: EnemyActionKind;
  unitId: string;
  /** ATTACK: defender unit id */
  targetId?: string;
  /** CUT_SUPPLY: edge id to sever */
  edgeId?: string;
  /** MOVE: delta in degrees */
  dLat?: number;
  dLng?: number;
  /** Chinese narrative log line (consistent with the rest of the engine). */
  log: string;
}

export interface EnemyPlan {
  actions: EnemyAction[];
}

interface DifficultyProfile {
  /** How many combat-capable units may attack this turn. */
  maxAttackers: number;
  /** Resist deception: ignore the largest apparent target if it is actually a decoy. */
  seesThroughDecoys: boolean;
  /** Also sever a player supply line each turn. */
  cutsSupply: boolean;
}

const PROFILES: Record<AIDifficulty, DifficultyProfile> = {
  CAUTIOUS:   { maxAttackers: 1, seesThroughDecoys: false, cutsSupply: false },
  BALANCED:   { maxAttackers: 2, seesThroughDecoys: false, cutsSupply: false },
  AGGRESSIVE: { maxAttackers: 99, seesThroughDecoys: true,  cutsSupply: true },
};

const MOVE_STEP_DEG = 0.03;

/** Size the enemy *believes* a unit to be (decoys inflate their apparent size). */
function apparentSize(u: UnifiedUnit): number {
  return u.isFake ? (u.fakeDisguiseAsSize ?? u.size) : u.size;
}

function isCombatCapable(u: UnifiedUnit): boolean {
  return !u.isDestroyed && !u.isRouted && !u.isFake && u.size > 0;
}

/**
 * Plan a full turn for `planSide` against `enemySide`.
 *
 * @param units        current units (post player actions)
 * @param nodes        supply nodes
 * @param edges        supply edges
 * @param planSide     the side the AI controls (e.g. 'hostile')
 * @param enemySide    the player's side (e.g. 'allied')
 * @param enemyCapitalId  capital of the player — supply-cut & advance target
 * @param difficulty   AI aggression profile
 */
export function planEnemyTurn(
  units: UnifiedUnit[],
  nodes: SupplyNode[],
  edges: SupplyEdge[],
  planSide: 'allied' | 'hostile',
  enemySide: 'allied' | 'hostile',
  enemyCapitalId: string,
  difficulty: AIDifficulty
): EnemyPlan {
  const profile = PROFILES[difficulty];
  const actions: EnemyAction[] = [];

  const ownUnits = units.filter(u => u.side === planSide && isCombatCapable(u));
  const targets = units.filter(
    u => u.side === enemySide && !u.isDestroyed && u.size > 0
  );

  if (ownUnits.length === 0) {
    return { actions };
  }

  // ── Target evaluation ────────────────────────────────────
  // Greedy commanders chase the *largest apparent* threat — which is
  // exactly how a convincing decoy lures them. A disciplined (AGGRESSIVE)
  // commander discounts targets it can tell are hollow.
  function scoreTarget(t: UnifiedUnit): number {
    const seen = apparentSize(t);
    if (profile.seesThroughDecoys && t.isFake) {
      return t.size; // sees the real (tiny) decoy strength → unattractive
    }
    return seen;
  }

  const realTargets = targets.filter(t => isCombatCapable(t) || t.isFake);

  // ── Attack orders ────────────────────────────────────────
  // Sort own units by strength so the strongest strike first.
  const attackers = [...ownUnits].sort((a, b) => b.size - a.size);
  let attacksIssued = 0;

  for (const attacker of attackers) {
    if (attacksIssued >= profile.maxAttackers) break;
    if (realTargets.length === 0) break;

    // Pick the highest-scoring target (closest breaks ties).
    let best: UnifiedUnit | null = null;
    let bestScore = -Infinity;
    let bestDist = Infinity;
    for (const t of realTargets) {
      const s = scoreTarget(t);
      const d = haversineDistance(attacker.lat, attacker.lng, t.lat, t.lng);
      if (s > bestScore || (s === bestScore && d < bestDist)) {
        best = t;
        bestScore = s;
        bestDist = d;
      }
    }
    if (!best) break;

    actions.push({
      kind: 'ATTACK',
      unitId: attacker.id,
      targetId: best.id,
      log: `【敌将】${attacker.name} 锁定 ${best.isFake ? best.fakeDisguiseAsName ?? best.name : best.name}，挥军进击！`,
    });
    attacksIssued++;
  }

  // ── Maneuver: units that did not attack advance toward the player capital ──
  const capital = nodes.find(n => n.id === enemyCapitalId);
  if (capital) {
    const attackerIds = new Set(actions.filter(a => a.kind === 'ATTACK').map(a => a.unitId));
    for (const u of ownUnits) {
      if (attackerIds.has(u.id)) continue;
      const dLatRaw = capital.lat - u.lat;
      const dLngRaw = capital.lng - u.lng;
      const mag = Math.hypot(dLatRaw, dLngRaw);
      if (mag < 1e-6) continue;
      actions.push({
        kind: 'MOVE',
        unitId: u.id,
        dLat: (dLatRaw / mag) * MOVE_STEP_DEG,
        dLng: (dLngRaw / mag) * MOVE_STEP_DEG,
        log: `【敌将】${u.name} 向 ${capital.name} 方向逼近。`,
      });
    }
  }

  // ── Supply interdiction (不战而屈人之兵) ──────────────────
  if (profile.cutsSupply) {
    const targetEdge = edges.find(
      e =>
        !e.isCut &&
        !e.isFake &&
        (e.source === enemyCapitalId || e.target === enemyCapitalId)
    );
    if (targetEdge) {
      const srcName = nodes.find(n => n.id === targetEdge.source)?.name ?? targetEdge.source;
      const tgtName = nodes.find(n => n.id === targetEdge.target)?.name ?? targetEdge.target;
      actions.push({
        kind: 'CUT_SUPPLY',
        unitId: ownUnits[0].id,
        edgeId: targetEdge.id,
        log: `【敌将】奇兵断道：${srcName} ↔ ${tgtName} 粮道被截！`,
      });
    }
  }

  return { actions };
}
