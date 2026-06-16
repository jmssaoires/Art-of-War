/**
 * victoryScoring.ts — Whole Victory (全胜) scoring engine
 *
 * 4-category scoring (0-25 each, 100 max):
 *   1. Military Dominance    — enemies destroyed / own preserved
 *   2. Supply Integrity      — own supply maintained / enemy supply cut
 *   3. Deception Efficacy    — fake units that fooled / spy successes
 *   4. Mandate Preservation  — dynastyFate stability after scenario
 *
 * References:
 *   - Total War: battle result ratings (Heroic / Decisive / Close / Pyrrhic)
 *   - CK3: war score system
 *   - 孙子: "不战而屈人之兵，善之善者也" — Whole Victory ideal
 */

import type { UnifiedUnit, SupplyEdge, ScoutReport, VictoryScore } from '../types';
import type { ScenarioState } from '../types';
import type { ScenarioDefinition } from '../types';

// ──────────────────────────────────────────────────────────
// Rank thresholds
// ──────────────────────────────────────────────────────────

const RANK_THRESHOLDS: Array<{ rank: VictoryScore['rank']; min: number; label: string }> = [
  { rank: 'S', min: 90, label: '全胜 — 不战而屈人之兵，善之善者也' },
  { rank: 'A', min: 75, label: '大捷 — 知彼知己，百战不殆' },
  { rank: 'B', min: 60, label: '小胜 — 胜可知而不可为' },
  { rank: 'C', min: 40, label: '惨胜 — 杀敌一千，自损八百' },
  { rank: 'D', min: 20, label: '败军 — 不知彼不知己，每战必殆' },
  { rank: 'F', min: 0,  label: '覆军 — 亡国不可以复存，死者不可以复生' },
];

// ──────────────────────────────────────────────────────────
// Sun Tzu quotes by rank
// ──────────────────────────────────────────────────────────

const QUOTES_BY_RANK: Record<VictoryScore['rank'], string> = {
  S: '不战而屈人之兵，善之善者也。故上兵伐谋，其次伐交，其次伐兵，其下攻城。',
  A: '知彼知己者，百战不殆。故善战者，立于不败之地，而不失敌之败也。',
  B: '胜可知而不可为。不可胜者，守也；可胜者，攻也。',
  C: '杀敌一千，自损八百。故兵贵胜，不贵久。',
  D: '不知彼不知己，每战必殆。主不可以怒而兴师，将不可以愠而致战。',
  F: '亡国不可以复存，死者不可以复生。故明君慎之，良将警之。',
};

// ──────────────────────────────────────────────────────────
// Main scoring function
// ──────────────────────────────────────────────────────────

export function computeVictoryScore(
  state: ScenarioState,
  scenario: ScenarioDefinition
): VictoryScore {
  const initialUnits = scenario.initialUnits;
  const currentUnits = state.units;

  // ── 1. Military Dominance (0-25) ──
  const initialAlliedSize = initialUnits
    .filter(u => u.side === 'allied')
    .reduce((s, u) => s + u.size, 0);
  const initialHostileSize = initialUnits
    .filter(u => u.side === 'hostile')
    .reduce((s, u) => s + u.size, 0);

  const currentAlliedSize = currentUnits
    .filter(u => u.side === 'allied' && !u.isDestroyed)
    .reduce((s, u) => s + u.size, 0);
  const currentHostileSize = currentUnits
    .filter(u => u.side === 'hostile' && !u.isDestroyed)
    .reduce((s, u) => s + u.size, 0);

  const enemiesDestroyedRatio = initialHostileSize > 0
    ? (initialHostileSize - currentHostileSize) / initialHostileSize
    : 1;
  const ownPreservedRatio = initialAlliedSize > 0
    ? currentAlliedSize / initialAlliedSize
    : 1;

  const militaryDominance = Math.round(
    Math.min(25, enemiesDestroyedRatio * 15 + ownPreservedRatio * 10)
  );

  // ── 2. Supply Integrity (0-25) ──
  const totalEdges = state.supplyGraph.edges.length;
  const cutEdges = state.supplyGraph.edges.filter(e => e.isCut).length;

  // Count how many turns our units were supplied vs unsupplied
  const alliedUnits = currentUnits.filter(u => u.side === 'allied' && !u.isDestroyed);
  const suppliedRatio = alliedUnits.length > 0
    ? alliedUnits.reduce((s, u) => s + (u.provisions > 30 ? 1 : 0), 0) / alliedUnits.length
    : 0;
  const enemyCutRatio = totalEdges > 0 ? cutEdges / totalEdges : 0;

  const supplyIntegrity = Math.round(
    Math.min(25, suppliedRatio * 15 + enemyCutRatio * 10)
  );

  // ── 3. Deception Efficacy (0-25) ──
  const fakeUnitsDeployed = currentUnits.filter(u => u.isFake).length;
  const fooledReports = state.scoutReports.filter(r => r.isDeceived).length;

  // Check if any combat was directed at fake units
  const deceptionEfficacy = Math.round(
    Math.min(25,
      Math.min(fakeUnitsDeployed * 5, 10) +
      Math.min(fooledReports * 3, 10) +
      5 // base credit for attempting deception
    )
  );

  // ── 4. Mandate Preservation (0-25) ──
  // Based on how well the player preserved their dynasty strength
  // We score higher if fewer own troops were lost and the enemy was decisively defeated
  const routingRatio = alliedUnits.length > 0
    ? alliedUnits.filter(u => u.isRouted).length / alliedUnits.length
    : 1;

  const mandatePreservation = Math.round(
    Math.min(25,
      (1 - routingRatio) * 15 +
      (enemiesDestroyedRatio > 0.8 ? 10 : enemiesDestroyedRatio > 0.5 ? 7 : 3)
    )
  );

  // ── Total and Rank ──
  const totalScore = Math.round(
    militaryDominance + supplyIntegrity + deceptionEfficacy + mandatePreservation
  );

  const rank = RANK_THRESHOLDS.find(t => totalScore >= t.min)?.rank ?? 'F';

  return {
    totalScore: Math.min(100, totalScore),
    categories: {
      militaryDominance,
      supplyIntegrity,
      deceptionEfficacy,
      mandatePreservation,
    },
    rank,
    sunTzuQuote: QUOTES_BY_RANK[rank],
  };
}

// ──────────────────────────────────────────────────────────
// Rank display helpers
// ──────────────────────────────────────────────────────────

export function getRankLabel(rank: VictoryScore['rank']): string {
  return RANK_THRESHOLDS.find(t => t.rank === rank)?.label ?? '未知';
}

export function getRankColor(rank: VictoryScore['rank']): string {
  switch (rank) {
    case 'S': return 'text-yellow-300';
    case 'A': return 'text-amber-400';
    case 'B': return 'text-emerald-400';
    case 'C': return 'text-blue-400';
    case 'D': return 'text-orange-400';
    case 'F': return 'text-red-500';
  }
}