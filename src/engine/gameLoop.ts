/**
 * gameLoop.ts — Turn-based game loop engine
 *
 * Four-phase structure per turn:
 *   DEPLOY → STRATEGIZE → RESOLVE → AFTERMATH
 *
 * Each phase is a pure-ish function that takes ScenarioState
 * and returns patches (GameAction[]) to be dispatched.
 */

import type {
  GamePhase,
  UnifiedUnit,
  SupplyNode,
  SupplyEdge,
  ScenarioState,
  ScoutReport,
} from '../types';
import type { GameAction } from '../context/GameEngineContext';

// ──────────────────────────────────────────────────────────
// Phase transition logic
// ──────────────────────────────────────────────────────────

export function nextPhase(current: GamePhase): GamePhase {
  const order: GamePhase[] = ['DEPLOY', 'STRATEGIZE', 'RESOLVE', 'AFTERMATH'];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

export function phaseDescription(phase: GamePhase): string {
  switch (phase) {
    case 'DEPLOY':
      return '布阵 — 部署兵力、安插细作、布置疑兵';
    case 'STRATEGIZE':
      return '运筹 — 下达军令、调兵遣将、施计用间';
    case 'RESOLVE':
      return '决胜 — 天机演算、兵锋交加、粮道争锋';
    case 'AFTERMATH':
      return '论功 — 清算战果、天命流转、史笔如铁';
  }
}

// ──────────────────────────────────────────────────────────
// Unit helpers
// ──────────────────────────────────────────────────────────

export function getActiveUnits(units: UnifiedUnit[]): UnifiedUnit[] {
  return units.filter(u => !u.isDestroyed);
}

export function getAlliedUnits(units: UnifiedUnit[]): UnifiedUnit[] {
  return getActiveUnits(units).filter(u => u.side === 'allied');
}

export function getHostileUnits(units: UnifiedUnit[]): UnifiedUnit[] {
  return getActiveUnits(units).filter(u => u.side === 'hostile');
}

export function getVisibleUnits(
  units: UnifiedUnit[],
  viewerSide: 'allied' | 'hostile'
): UnifiedUnit[] {
  return getActiveUnits(units).map(u => {
    // Fake units appear real to the enemy
    if (u.isFake && u.side !== viewerSide) {
      return {
        ...u,
        size: u.fakeDisguiseAsSize ?? u.size,
        name: u.fakeDisguiseAsName ?? u.name,
      };
    }
    // Own fake units are invisible to the enemy (they're decoys for deception)
    // But visible to the owner
    return u;
  });
}

// ──────────────────────────────────────────────────────────
// Haversine distance (reusable)
// ──────────────────────────────────────────────────────────

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ──────────────────────────────────────────────────────────
// Scout range (for isFake revelation)
// ──────────────────────────────────────────────────────────

export const SCOUT_REVEAL_RANGE_KM = 5; // ≈ 0.045 degrees

// ──────────────────────────────────────────────────────────
// Check if a fake unit is revealed by enemy proximity
// ──────────────────────────────────────────────────────────

export function checkFakeRevelation(
  fakeUnit: UnifiedUnit,
  enemyUnits: UnifiedUnit[]
): { revealed: boolean; byUnit?: string } {
  if (!fakeUnit.isFake) return { revealed: false };

  for (const enemy of enemyUnits) {
    if (enemy.isDestroyed || enemy.isRouted) continue;
    const dist = haversineDistance(
      fakeUnit.lat, fakeUnit.lng,
      enemy.lat, enemy.lng
    );
    if (dist <= SCOUT_REVEAL_RANGE_KM) {
      return { revealed: true, byUnit: enemy.id };
    }
  }
  return { revealed: false };
}

// ──────────────────────────────────────────────────────────
// Check victory conditions for the default scenario
// ──────────────────────────────────────────────────────────

export interface VictoryCheckResult {
  isVictory: boolean;
  isDefeat: boolean;
  description: string;
}

export function checkScenarioEnd(
  state: ScenarioState,
  alliedCapitalId: string,
  hostileCapitalId: string,
  maxTurns: number
): VictoryCheckResult {
  const allied = getAlliedUnits(state.units);
  const hostile = getHostileUnits(state.units);

  const alliedTotalSize = allied.reduce((s, u) => s + u.size, 0);
  const hostileTotalSize = hostile.reduce((s, u) => s + u.size, 0);

  // Defeat: all allied units destroyed or routed
  const alliedCapable = allied.filter(u => !u.isRouted);
  if (alliedCapable.length === 0 || alliedTotalSize <= 0) {
    return {
      isVictory: false,
      isDefeat: true,
      description: '全军覆没，社稷沦丧！',
    };
  }

  // Victory: all hostile units destroyed or routed
  const hostileCapable = hostile.filter(u => !u.isRouted);
  if (hostileCapable.length === 0 || hostileTotalSize <= 0) {
    return {
      isVictory: true,
      isDefeat: false,
      description: '敌军尽墨，天命所归！',
    };
  }

  // Defeat by turn limit
  if (state.turnNumber >= maxTurns) {
    return {
      isVictory: false,
      isDefeat: true,
      description: `时限已至（${maxTurns}回合），贻误战机，无功而返。`,
    };
  }

  return { isVictory: false, isDefeat: false, description: '' };
}

// ──────────────────────────────────────────────────────────
// Generate a turn summary log entry
// ──────────────────────────────────────────────────────────

export function generateTurnSummary(state: ScenarioState): string {
  const allied = getAlliedUnits(state.units);
  const hostile = getHostileUnits(state.units);
  const totalAllied = allied.reduce((s, u) => s + u.size, 0);
  const totalHostile = hostile.reduce((s, u) => s + u.size, 0);
  const cutEdges = state.supplyGraph.edges.filter(e => e.isCut).length;
  const fakeUnits = state.units.filter(u => u.isFake && !u.isDestroyed).length;

  return (
    `【第${state.turnNumber}回合结算】` +
    ` 友军: ${allied.length}部 ${totalAllied.toLocaleString()}人` +
    ` | 敌军: ${hostile.length}部 ${totalHostile.toLocaleString()}人` +
    ` | 断粮: ${cutEdges}道` +
    ` | 疑兵: ${fakeUnits}支`
  );
}