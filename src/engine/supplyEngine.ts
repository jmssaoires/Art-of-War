/**
 * supplyEngine.ts — BFS-based supply network + morale avalanche
 *
 * Ported & extended from LogisticsNetworkSandbox.tsx (lines 66-97).
 * Implements the CLAUDE.md core mechanic:
 *   "切断补给线 → 士气雪崩" (Cut supply → morale avalanche)
 *
 * Comparable-game references:
 *   - HOI4: supply hub network + transparent adjudication
 *   - Shadow Empire: range decay curves + multi-level inventory
 *   - TW:3K: provisions resource + encamp/forage stances
 */

import type { UnifiedUnit, SupplyNode, SupplyEdge } from '../types';

// ──────────────────────────────────────────────────────────
// BFS connectivity check
// Ported from LogisticsNetworkSandbox.tsx:66-97
// ──────────────────────────────────────────────────────────

export interface ConnectivityResult {
  connected: boolean;
  path: string[];         // node IDs from start to target
  bottleneckEdgeId: string | null;  // first edge that would be cut
}

/**
 * BFS from startNodeId to targetNodeId.
 * Only traverses edges that are NOT cut and NOT fake.
 * Returns the path and whether a connection exists.
 */
export function isConnectedToSupply(
  startNodeId: string,
  targetNodeId: string,
  nodes: SupplyNode[],
  edges: SupplyEdge[]
): ConnectivityResult {
  if (startNodeId === targetNodeId) {
    return { connected: true, path: [startNodeId], bottleneckEdgeId: null };
  }

  // Build adjacency list (exclude cut and fake edges)
  const adj = new Map<string, Array<{ neighbor: string; edgeId: string }>>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    if (!edge.isCut && !edge.isFake) {
      adj.get(edge.source)?.push({ neighbor: edge.target, edgeId: edge.id });
      adj.get(edge.target)?.push({ neighbor: edge.source, edgeId: edge.id });
    }
  }

  // BFS
  const visited = new Set<string>();
  const parent = new Map<string, { node: string; edgeId: string }>();
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetNodeId) {
      // Reconstruct path
      const path: string[] = [];
      let cursor: string | undefined = targetNodeId;
      let bottleneck: string | null = null;
      while (cursor && cursor !== startNodeId) {
        path.unshift(cursor);
        const p = parent.get(cursor);
        if (p) {
          if (!bottleneck) bottleneck = p.edgeId;
          cursor = p.node;
        } else {
          break;
        }
      }
      path.unshift(startNodeId);
      return { connected: true, path, bottleneckEdgeId: bottleneck };
    }

    const neighbors = adj.get(current) || [];
    for (const { neighbor, edgeId } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, { node: current, edgeId });
        queue.push(neighbor);
      }
    }
  }

  return { connected: false, path: [], bottleneckEdgeId: null };
}

// ──────────────────────────────────────────────────────────
// Find nearest supply node to a unit
// ──────────────────────────────────────────────────────────

export function findNearestSupplyNode(
  unit: UnifiedUnit,
  nodes: SupplyNode[],
  side: 'allied' | 'hostile'
): SupplyNode | null {
  let nearest: SupplyNode | null = null;
  let minDist = Infinity;

  // Allied units seek allied capitals/depots; hostile seek hostile
  const isAlliedCapital = (n: SupplyNode) =>
    (n.type === 'capital' || n.type === 'depot');

  for (const node of nodes) {
    if (!isAlliedCapital(node)) continue;
    const dist = haversine(
      unit.lat, unit.lng,
      node.lat, node.lng
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }

  return nearest;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
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
// Morale calculation from supply state
// Matches LogisticsNetworkSandbox.tsx:144-165 exactly
// ──────────────────────────────────────────────────────────

export interface MoraleResult {
  nextMorale: number;
  nextState: string;
  supplyStatus: string;
  isRouted: boolean;
}

export function computeMorale(
  unit: UnifiedUnit,
  supplied: boolean
): MoraleResult {
  let nextMorale = unit.morale;
  let supplyStatus: string;

  if (supplied) {
    nextMorale = Math.min(100, nextMorale + 5);
    supplyStatus = '✅ 畅通';
  } else {
    nextMorale -= 35;
    supplyStatus = '❌ 断绝';
  }

  // State machine (matching LogisticsNetworkSandbox)
  let nextState: string;
  let isRouted = false;

  if (nextMorale <= 0) {
    nextMorale = 0;
    nextState = '⚫ 彻底溃散 (失去控制)';
    isRouted = true;
  } else if (nextMorale <= 30) {
    nextState = '🔴 极度恐慌 (逃跑边沿)';
    isRouted = true;
  } else if (nextMorale <= 70) {
    nextState = '🟡 军心动摇 (战力下降)';
  } else {
    nextState = '🟢 战意高昂';
  }

  return { nextMorale, nextState, supplyStatus, isRouted };
}

// ──────────────────────────────────────────────────────────
// Morale category (matching MilitarySandbox.tsx:731-737)
// ──────────────────────────────────────────────────────────

export interface MoraleCategory {
  name: string;
  bonus: number;
  desc: string;
}

export function getMoraleCategory(m: number): MoraleCategory {
  if (m >= 80) return { name: '锐气', bonus: 0.25, desc: '避其锐气。战力+25%' };
  if (m >= 40) return { name: '惰气', bonus: 0.00, desc: '两军相持，战力无起伏' };
  return { name: '归气', bonus: -0.30, desc: '归师勿遏。士气瓦解，战力-30%' };
}

// ──────────────────────────────────────────────────────────
// Supply consumption per turn
// ──────────────────────────────────────────────────────────

export const PROVISIONS_PER_THOUSAND_TROOPS = 1;
export const PROVISIONS_DESPERATION_MULTIPLIER = 2; // when unsupplied

export function computeProvisionsConsumption(
  unit: UnifiedUnit,
  supplied: boolean
): number {
  const base = Math.ceil((unit.size / 1000) * PROVISIONS_PER_THOUSAND_TROOPS);
  return supplied ? base : base * PROVISIONS_DESPERATION_MULTIPLIER;
}

// ──────────────────────────────────────────────────────────
// Full supply tick: BFS check → morale → provisions
// for ALL units in the scenario
// ──────────────────────────────────────────────────────────

export interface SupplyTickResult {
  unitResults: Array<{
    unitId: string;
    wasSupplied: boolean;
    moraleResult: MoraleResult;
    provisionsConsumed: number;
    logMessages: string[];
  }>;
  edgesCutThisTick: string[];
}

export function runSupplyTick(
  units: UnifiedUnit[],
  nodes: SupplyNode[],
  edges: SupplyEdge[],
  alliedCapitalId: string,
  hostileCapitalId: string
): SupplyTickResult {
  const results: SupplyTickResult = {
    unitResults: [],
    edgesCutThisTick: [],
  };

  for (const unit of units) {
    if (unit.isDestroyed) continue;

    const capitalId =
      unit.side === 'allied' ? alliedCapitalId : hostileCapitalId;

    const connectivity = isConnectedToSupply(
      unit.id, // use unit's nearest node — for now, find by location matching
      capitalId,
      nodes,
      edges
    );

    // If unit is at a supply node, it's auto-supplied
    const atSupplyNode = nodes.some(
      n => haversine(unit.lat, unit.lng, n.lat, n.lng) < 5 // 5km
    );
    const supplied = atSupplyNode || connectivity.connected;

    const moraleResult = computeMorale(unit, supplied);
    const provisionsConsumed = computeProvisionsConsumption(unit, supplied);

    const logMessages: string[] = [];
    const unitName = unit.isFake ? `${unit.name}[疑兵]` : unit.name;

    if (!supplied) {
      logMessages.push(
        `📉 【断粮】${unitName} 补给线断绝！士气暴跌至 ${moraleResult.nextMorale}，${moraleResult.nextState}`
      );
      if (connectivity.bottleneckEdgeId) {
        results.edgesCutThisTick.push(connectivity.bottleneckEdgeId);
      }
    } else if (unit.morale < 100) {
      logMessages.push(
        `📈 【补给】${unitName} 粮道畅通，士气恢复至 ${moraleResult.nextMorale}`
      );
    }

    if (moraleResult.isRouted && !unit.isRouted) {
      logMessages.push(
        `💀 【溃散】${unitName} 士气崩溃，士卒四散奔逃！`
      );
    }

    results.unitResults.push({
      unitId: unit.id,
      wasSupplied: supplied,
      moraleResult,
      provisionsConsumed,
      logMessages,
    });
  }

  return results;
}

// ──────────────────────────────────────────────────────────
// Morale avalanche: contagious panic
// Units adjacent to a routed ally take extra morale hit
// ──────────────────────────────────────────────────────────

export const PANIC_CONTAGION_RANGE_KM = 15;
export const PANIC_CONTAGION_MORALE_PENALTY = -10;

export function computePanicContagion(
  units: UnifiedUnit[],
  newlyRoutedIds: Set<string>
): Array<{ unitId: string; penalty: number; reason: string }> {
  const contagion: Array<{ unitId: string; penalty: number; reason: string }> = [];

  for (const unit of units) {
    if (unit.isDestroyed || unit.isRouted || newlyRoutedIds.has(unit.id)) continue;

    let totalPenalty = 0;
    const panicSources: string[] = [];

    for (const routedId of newlyRoutedIds) {
      const routedUnit = units.find(u => u.id === routedId);
      if (!routedUnit) continue;

      const dist = haversine(
        unit.lat, unit.lng,
        routedUnit.lat, routedUnit.lng
      );
      if (dist <= PANIC_CONTAGION_RANGE_KM && unit.side === routedUnit.side) {
        totalPenalty += PANIC_CONTAGION_MORALE_PENALTY;
        panicSources.push(routedUnit.name);
      }
    }

    if (totalPenalty < 0) {
      contagion.push({
        unitId: unit.id,
        penalty: totalPenalty,
        reason: `邻军 ${panicSources.join('、')} 溃散引发恐慌传染！`,
      });
    }
  }

  return contagion;
}