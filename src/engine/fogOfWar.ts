/**
 * fogOfWar.ts — Fog of War 2.0 engine
 *
 * Implements CLAUDE.md: "兵者诡道也" — Deception / Advanced Fog of War
 *
 * Handles:
 *   - isFake unit revelation (enemy proximity → auto-expose)
 *   - Scout report generation from the enemy's perspective
 *   - Confidence calculation based on deception quality
 *   - Reverse deception (real units disguised as fake)
 *
 * Comparable references:
 *   - DeceptionSandbox.tsx: AI-driven scout report pattern
 *   - MilitarySandbox.tsx: feignAttacker / feignDefender states
 */

import type { UnifiedUnit, ScoutReport } from '../types';
import { haversineDistance, SCOUT_REVEAL_RANGE_KM } from './gameLoop';

// ──────────────────────────────────────────────────────────
// Scout a target unit from a scout unit's perspective
// ──────────────────────────────────────────────────────────

export interface ScoutResult {
  report: ScoutReport;
  unitRevealed: boolean;     // true if fake unit is exposed
}

export function scoutUnit(
  targetUnit: UnifiedUnit,
  scoutUnit: UnifiedUnit,
  scoutCompetence: number = 50  // 0-100, higher = better at detecting fakes
): ScoutResult {
  const dist = haversineDistance(
    targetUnit.lat, targetUnit.lng,
    scoutUnit.lat, scoutUnit.lng
  );

  // Distance-based observation quality
  const distFactor = Math.max(0, 1 - dist / (SCOUT_REVEAL_RANGE_KM * 3));
  const effectiveConfidence = Math.min(100, Math.round(
    (distFactor * 60 + scoutCompetence * 0.4)
  ));

  let reportedSize: number;
  let reportedName: string;
  let reportedSide: 'allied' | 'hostile' | 'unknown';
  let isDeceived: boolean;
  let narrative: string;
  let unitRevealed = false;

  if (targetUnit.isFake) {
    // The target is a decoy
    if (effectiveConfidence >= 70) {
      // Scout sees through the deception
      reportedSize = 0;
      reportedName = `【识破】${targetUnit.name}（疑兵假人）`;
      reportedSide = 'unknown';
      isDeceived = false;
      unitRevealed = true;
      narrative = `斥候抵近侦察，发现${targetUnit.name}营中尽是草人虚旗，乃疑兵之计！`;
    } else {
      // Scout is fooled
      reportedSize = targetUnit.fakeDisguiseAsSize ?? targetUnit.size;
      reportedName = targetUnit.fakeDisguiseAsName ?? targetUnit.name;
      reportedSide = targetUnit.side;
      isDeceived = true;
      narrative = `斥候遥望${targetUnit.name}大营旌旗蔽日、烟尘滚滚，似有${reportedSize.toLocaleString()}之众！`;
    }
  } else {
    // Target is real
    reportedSize = targetUnit.size;
    reportedName = targetUnit.name;
    reportedSide = targetUnit.side;
    isDeceived = false;
    narrative = `斥候确见${targetUnit.name}实兵${reportedSize.toLocaleString()}人，阵型严整。`;
  }

  return {
    report: {
      unitId: targetUnit.id,
      reportedSize,
      reportedName,
      reportedSide,
      confidence: effectiveConfidence,
      isDeceived,
      scoutNarrative: narrative,
    },
    unitRevealed,
  };
}

// ──────────────────────────────────────────────────────────
// Generate scout reports for all visible enemy units
// ──────────────────────────────────────────────────────────

export function generateFactionScoutReports(
  allUnits: UnifiedUnit[],
  viewerSide: 'allied' | 'hostile',
  scoutCompetence: number = 50
): ScoutReport[] {
  const reports: ScoutReport[] = [];
  const viewerUnits = allUnits.filter(
    u => u.side === viewerSide && !u.isDestroyed && !u.isRouted
  );
  const targetUnits = allUnits.filter(
    u => u.side !== viewerSide && !u.isDestroyed
  );

  for (const target of targetUnits) {
    // Find nearest scout
    let bestScout: UnifiedUnit | null = null;
    let bestDist = Infinity;
    for (const scout of viewerUnits) {
      const dist = haversineDistance(
        target.lat, target.lng,
        scout.lat, scout.lng
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestScout = scout;
      }
    }

    if (bestScout) {
      const result = scoutUnit(target, bestScout, scoutCompetence);
      reports.push(result.report);
    }
  }

  return reports;
}

// ──────────────────────────────────────────────────────────
// Check all fake units for revelation by enemy proximity
// ──────────────────────────────────────────────────────────

export interface RevelationResult {
  unitId: string;
  revealed: boolean;
  revealedByUnitId?: string;
  revealedByUnitName?: string;
}

export function checkAllFakeRevelations(
  allUnits: UnifiedUnit[]
): RevelationResult[] {
  const results: RevelationResult[] = [];
  const fakeUnits = allUnits.filter(u => u.isFake && !u.isDestroyed);
  const realEnemyUnits = allUnits.filter(
    u => !u.isFake && !u.isDestroyed && u.side !== 'allied'
  );

  for (const fake of fakeUnits) {
    let revealed = false;
    let revealedBy: string | undefined;

    for (const enemy of realEnemyUnits) {
      // Only enemy units can reveal allied fake units
      if (enemy.side === fake.side) continue;
      const dist = haversineDistance(
        fake.lat, fake.lng,
        enemy.lat, enemy.lng
      );
      if (dist <= SCOUT_REVEAL_RANGE_KM) {
        revealed = true;
        revealedBy = enemy.id;
        break;
      }
    }

    results.push({
      unitId: fake.id,
      revealed,
      revealedByUnitId: revealedBy,
      revealedByUnitName: revealedBy
        ? allUnits.find(u => u.id === revealedBy)?.name
        : undefined,
    });
  }

  return results;
}

// ──────────────────────────────────────────────────────────
// Deception effectiveness scoring (for VictoryScore)
// ──────────────────────────────────────────────────────────

export function computeDeceptionStats(
  scoutReports: ScoutReport[],
  combatActions: Array<{ attackerId: string; defenderId: string }>,
  allUnits: UnifiedUnit[]
): {
  fakeUnitsDeployed: number;
  fakeUnitsThatFooled: number;
  attacksOnFakeUnits: number;
  realThreatsIgnored: number;
} {
  const fakeUnits = allUnits.filter(u => u.isFake && !u.isDestroyed);
  const fooledReports = scoutReports.filter(r => r.isDeceived);
  const fakeIds = new Set(fakeUnits.map(u => u.id));

  const attacksOnFakeUnits = combatActions.filter(
    a => fakeIds.has(a.defenderId)
  ).length;

  return {
    fakeUnitsDeployed: fakeUnits.length,
    fakeUnitsThatFooled: fooledReports.length,
    attacksOnFakeUnits,
    realThreatsIgnored: Math.max(0, combatActions.length - attacksOnFakeUnits),
  };
}