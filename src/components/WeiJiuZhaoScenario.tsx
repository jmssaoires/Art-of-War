/**
 * WeiJiuZhaoScenario.tsx — 围魏救赵 (Relieve Zhao by Besieging Wei)
 *
 * The first vertically-integrated scenario that merges:
 *   - RealWorldMapBattle: Google Maps + A* pathfinding
 *   - LogisticsNetworkSandbox: BFS supply network + morale state machine
 *   - DeceptionSandbox: AI-driven fog of war + isFake units
 *   - Whole Victory scoring connected to dynastyFate
 *
 * Historical context (354 BCE):
 *   Wei besieges Zhao's capital Handan. Zhao asks Qi for help.
 *   Sun Bin advises: "Attack Wei's capital Daliang to force Wei to lift the siege."
 *   The strategy works — Wei army rushes back, Zhao is saved.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords, Shield, Eye, EyeOff, Send, MapPin, Activity,
  ChevronRight, AlertTriangle, Trophy, RefreshCw, Play,
  SkipForward, Sparkles, Wheat, Brain, Flag, Target, Zap,
  Crosshair, Skull, TrendingDown, TrendingUp, Heart
} from 'lucide-react';
import { useGameEngine, saveScenarioState } from '../context/GameEngineContext';
import type { GameAction } from '../context/GameEngineContext';
import type {
  UnifiedUnit,
  SupplyNode,
  SupplyEdge,
  VictoryScore,
  ScenarioDefinition,
} from '../types';
import {
  nextPhase,
  phaseDescription,
  haversineDistance,
  SCOUT_REVEAL_RANGE_KM,
  checkScenarioEnd,
  generateTurnSummary,
  getActiveUnits,
  getVisibleUnits,
} from '../engine/gameLoop';
import {
  runSupplyTick,
  computePanicContagion,
} from '../engine/supplyEngine';
import {
  checkAllFakeRevelations,
  generateFactionScoutReports,
} from '../engine/fogOfWar';
import {
  resolveCombat,
  classifyTerrainFromPosition,
} from '../engine/combatEngine';

// ──────────────────────────────────────────────────────────
// Scenario Definition
// ──────────────────────────────────────────────────────────

const WEI_JIU_ZHAO_SCENARIO: ScenarioDefinition = {
  id: 'weijiu-zhao',
  name: '围魏救赵',
  mapCenter: { lat: 35.7, lng: 114.5 },
  alliedCapitalId: 'handan',       // Zhao capital (friendly)
  hostileCapitalId: 'daliang',      // Wei capital (enemy)
  maxTurns: 20,
  victoryConditions: [], // checked manually via checkScenarioEnd
  initialUnits: [
    {
      id: 'qi_main',
      name: '齐军主力',
      side: 'allied',
      lat: 35.0, lng: 115.0,       // SE of Daliang
      size: 30000,
      provisions: 100,
      morale: 85,
      isFake: false,
      creatorUid: 'scenario',
      creatorName: '孙膑',
      attackPower: 75,
      defensePower: 60,
      speed: 12,
      isRouted: false,
      isDestroyed: false,
    },
    {
      id: 'zhao_garrison',
      name: '赵国防军',
      side: 'allied',
      lat: 36.61, lng: 114.49,      // Handan (besieged)
      size: 10000,
      provisions: 40,
      morale: 60,
      isFake: false,
      creatorUid: 'scenario',
      creatorName: '赵王',
      attackPower: 50,
      defensePower: 70,
      speed: 8,
      isRouted: false,
      isDestroyed: false,
    },
    {
      id: 'qi_supply',
      name: '齐军粮道',
      side: 'allied',
      lat: 35.3, lng: 114.6,        // midway between Qi and Daliang
      size: 2000,
      provisions: 100,
      morale: 90,
      isFake: false,
      creatorUid: 'scenario',
      creatorName: '齐军辎重营',
      attackPower: 20,
      defensePower: 30,
      speed: 8,
      isRouted: false,
      isDestroyed: false,
    },
    {
      id: 'wei_siege',
      name: '魏军围城主力',
      side: 'hostile',
      lat: 36.55, lng: 114.45,       // surrounding Handan
      size: 45000,
      provisions: 80,
      morale: 75,
      isFake: false,
      creatorUid: 'scenario',
      creatorName: '庞涓',
      attackPower: 80,
      defensePower: 65,
      speed: 10,
      isRouted: false,
      isDestroyed: false,
    },
    {
      id: 'wei_guard',
      name: '魏都守军',
      side: 'hostile',
      lat: 34.79, lng: 114.35,       // Daliang
      size: 15000,
      provisions: 60,
      morale: 70,
      isFake: false,
      creatorUid: 'scenario',
      creatorName: '魏王守将',
      attackPower: 55,
      defensePower: 75,
      speed: 6,
      isRouted: false,
      isDestroyed: false,
    },
    {
      id: 'wei_supply',
      name: '魏军粮道',
      side: 'hostile',
      lat: 35.67, lng: 114.40,       // road between Daliang and Handan
      size: 5000,
      provisions: 100,
      morale: 80,
      isFake: false,
      creatorUid: 'scenario',
      creatorName: '魏军辎重营',
      attackPower: 25,
      defensePower: 35,
      speed: 7,
      isRouted: false,
      isDestroyed: false,
    },
  ],
  supplyGraph: {
    nodes: [
      { id: 'daliang', name: '大梁 (魏都)', type: 'capital', lat: 34.79, lng: 114.35 },
      { id: 'handan', name: '邯郸 (赵都)', type: 'capital', lat: 36.61, lng: 114.49 },
      { id: 'qi_depot', name: '齐军补给站', type: 'depot', lat: 35.0, lng: 115.2 },
    ],
    edges: [
      { id: 'e_daliang_handan', source: 'daliang', target: 'handan', isCut: false, isFake: false, capacity: 100, currentFlow: 60 },
      { id: 'e_qi_handan', source: 'qi_depot', target: 'handan', isCut: false, isFake: false, capacity: 80, currentFlow: 40 },
      { id: 'e_qi_daliang', source: 'qi_depot', target: 'daliang', isCut: false, isFake: false, capacity: 60, currentFlow: 30 },
    ],
  },
};

// ──────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────

interface Props {
  onDynastyFateUpdate?: (stats: {
    mandate?: number;
    stability?: number;
    coffers?: number;
    emperorAge?: number;
  }) => void;
  onTimelineEntry?: (entry: any) => void;
}

export default function WeiJiuZhaoScenario({ onDynastyFateUpdate, onTimelineEntry }: Props) {
  const { state, dispatch, setOnScenarioComplete } = useGameEngine();

  // Local UI state
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [viewerPerspective, setViewerPerspective] = useState<'allied' | 'hostile'>('allied');
  const [weather, setWeather] = useState<'CLEAR' | 'RAIN' | 'WIND' | 'FOG'>('CLEAR');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployIsFake, setDeployIsFake] = useState(false);
  const [deployFakeSize, setDeployFakeSize] = useState(5000);
  const combatLogRef = useRef<HTMLDivElement>(null);

  // Load scenario on mount
  useEffect(() => {
    dispatch({ type: 'LOAD_SCENARIO', scenario: WEI_JIU_ZHAO_SCENARIO });
    setOnScenarioComplete((score: VictoryScore) => {
      if (onDynastyFateUpdate) {
        onDynastyFateUpdate({
          mandate: Math.min(100, Math.max(10, 78 + score.categories.mandatePreservation - 12)),
          stability: Math.min(100, Math.max(10, 82 + (score.totalScore > 75 ? 5 : -5))),
          coffers: 45000 - 10000 + score.totalScore * 200,
          emperorAge: 15,
        });
      }
    });

    return () => {
      setOnScenarioComplete(null);
    };
  }, []);

  // Persist state each turn
  useEffect(() => {
    if (state.turnNumber > 0) {
      saveScenarioState(state);
    }
  }, [state.turnNumber]);

  // Auto-scroll combat log
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = 0;
    }
  }, [state.combatLog]);

  // ──────────────────────────────────────────────────────
  // Unit helpers
  // ──────────────────────────────────────────────────────
  const visibleUnits = useMemo(
    () => getVisibleUnits(state.units, viewerPerspective),
    [state.units, viewerPerspective]
  );

  const selectedUnit = useMemo(
    () => state.units.find(u => u.id === selectedUnitId),
    [state.units, selectedUnitId]
  );

  const activeUnits = useMemo(() => getActiveUnits(state.units), [state.units]);

  // ──────────────────────────────────────────────────────
  // Phase actions
  // ──────────────────────────────────────────────────────

  const handleAdvancePhase = useCallback(() => {
    const next = nextPhase(state.phase);
    dispatch({ type: 'SET_PHASE', phase: next });
    dispatch({
      type: 'ADD_COMBAT_LOG',
      message: `⏭️ 进入「${phaseDescription(next)}」阶段`,
    });
  }, [state.phase, dispatch]);

  const handleDeployFakeUnit = useCallback(() => {
    if (!deployName.trim()) return;
    // Place fake unit near the selected unit or near allied capital
    const baseUnit = selectedUnit || state.units.find(u => u.id === 'qi_main');
    if (!baseUnit) return;

    const fakeUnit: UnifiedUnit = {
      id: `fake_${Date.now()}`,
      name: deployName.trim(),
      side: 'allied',
      lat: baseUnit.lat + (Math.random() - 0.5) * 0.02,
      lng: baseUnit.lng + (Math.random() - 0.5) * 0.02,
      size: 500, // actual troops needed to set up decoys
      provisions: 50,
      morale: 100, // fake units don't experience morale
      isFake: true,
      fakeDisguiseAsSize: deployFakeSize,
      fakeDisguiseAsName: deployName.trim(),
      creatorUid: 'player',
      creatorName: '孙膑',
      attackPower: 0,  // fake units deal 0 damage
      defensePower: 5,
      speed: 0,
      isRouted: false,
      isDestroyed: false,
    };

    dispatch({ type: 'ADD_UNIT', unit: fakeUnit });
    dispatch({
      type: 'ADD_COMBAT_LOG',
      message: `🎭 【疑兵】部署 ${fakeUnit.name}，在敌看来似有 ${deployFakeSize.toLocaleString()} 之众！`,
    });
    setDeployName('');
  }, [deployName, deployFakeSize, selectedUnit, state.units, dispatch]);

  const handleMoveUnit = useCallback((unitId: string, dLat: number, dLng: number) => {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return;

    const step = 0.03; // degrees per move action
    dispatch({
      type: 'UPDATE_UNIT',
      unitId,
      patch: {
        lat: unit.lat + dLat * step,
        lng: unit.lng + dLng * step,
        provisions: Math.max(0, unit.provisions - 5),
      },
    });
    dispatch({
      type: 'ADD_COMBAT_LOG',
      message: `🚶 ${unit.name} 机动转移至 (${(unit.lat + dLat * step).toFixed(2)}, ${(unit.lng + dLng * step).toFixed(2)})`,
    });
  }, [state.units, dispatch]);

  const handleAttackUnit = useCallback((attackerId: string, defenderId: string) => {
    const attacker = state.units.find(u => u.id === attackerId);
    const defender = state.units.find(u => u.id === defenderId);
    if (!attacker || !defender) return;

    const terrain = classifyTerrainFromPosition(defender.lat, defender.lng);
    const result = resolveCombat({
      attacker,
      defender,
      terrain,
      weather,
    });

    // Apply results
    dispatch({
      type: 'UPDATE_UNIT',
      unitId: attackerId,
      patch: {
        size: result.attackerSurvivingSize,
        morale: Math.max(0, Math.min(100, attacker.morale + result.attackerMoraleDelta)),
        provisions: Math.max(0, attacker.provisions - 10),
        isDestroyed: result.attackerSurvivingSize <= 0,
      },
    });
    dispatch({
      type: 'UPDATE_UNIT',
      unitId: defenderId,
      patch: {
        size: result.defenderSurvivingSize,
        morale: Math.max(0, Math.min(100, defender.morale + result.defenderMoraleDelta)),
        isDestroyed: result.defenderSurvivingSize <= 0,
      },
    });
    dispatch({ type: 'ADD_COMBAT_LOG', message: result.narrative });
  }, [state.units, weather, dispatch]);

  const handleCutSupply = useCallback((edgeId: string) => {
    dispatch({ type: 'CUT_SUPPLY_EDGE', edgeId });
    const edge = state.supplyGraph.edges.find(e => e.id === edgeId);
    dispatch({
      type: 'ADD_COMBAT_LOG',
      message: `🔪 【断粮】${edge?.source} ↔ ${edge?.target} 粮道已被切断！`,
    });
  }, [state.supplyGraph.edges, dispatch]);

  const handleScout = useCallback((targetUnitId: string) => {
    const reports = generateFactionScoutReports(state.units, 'allied');
    for (const report of reports) {
      if (report.unitId === targetUnitId) {
        dispatch({ type: 'SUBMIT_SCOUT_REPORT', report });
        dispatch({
          type: 'ADD_COMBAT_LOG',
          message: `🔭 【斥候】${report.scoutNarrative}（置信度: ${report.confidence}%）`,
        });
        break;
      }
    }
  }, [state.units, dispatch]);

  // ──────────────────────────────────────────────────────
  // RESOLVE phase — the big one
  // ──────────────────────────────────────────────────────

  const handleResolve = useCallback(async () => {
    if (state.phase !== 'RESOLVE') return;
    setIsExecuting(true);

    try {
      // 1. Supply tick — BFS + morale + provisions
      const supplyResult = runSupplyTick(
        state.units,
        state.supplyGraph.nodes,
        state.supplyGraph.edges,
        WEI_JIU_ZHAO_SCENARIO.alliedCapitalId,
        WEI_JIU_ZHAO_SCENARIO.hostileCapitalId
      );

      // Apply supply results to each unit
      const newlyRoutedIds = new Set<string>();
      for (const ur of supplyResult.unitResults) {
        const patch: Partial<UnifiedUnit> = {
          morale: ur.moraleResult.nextMorale,
          provisions: Math.max(0, (state.units.find(u => u.id === ur.unitId)?.provisions ?? 100) - ur.provisionsConsumed),
          isRouted: ur.moraleResult.isRouted,
        };
        if (ur.moraleResult.isRouted) newlyRoutedIds.add(ur.unitId);
        dispatch({ type: 'UPDATE_UNIT', unitId: ur.unitId, patch });
        for (const msg of ur.logMessages) {
          dispatch({ type: 'ADD_COMBAT_LOG', message: msg });
        }
      }

      // 2. Panic contagion
      if (newlyRoutedIds.size > 0) {
        const contagions = computePanicContagion(state.units, newlyRoutedIds);
        for (const c of contagions) {
          const unit = state.units.find(u => u.id === c.unitId);
          if (unit) {
            dispatch({
              type: 'UPDATE_UNIT',
              unitId: c.unitId,
              patch: { morale: Math.max(0, unit.morale + c.penalty) },
            });
            dispatch({
              type: 'ADD_COMBAT_LOG',
              message: `😱 【恐慌传染】${unit.name} ${c.reason} 士气 ${c.penalty}`,
            });
          }
        }
      }

      // 3. Fake unit revelation
      const revelations = checkAllFakeRevelations(state.units);
      for (const rev of revelations) {
        if (rev.revealed) {
          dispatch({
            type: 'UPDATE_UNIT',
            unitId: rev.unitId,
            patch: { isFake: false, isDestroyed: true, size: 0 },
          });
          dispatch({
            type: 'ADD_COMBAT_LOG',
            message: `💥 【识破】疑兵被 ${rev.revealedByUnitName || '敌军'} 抵近识破，草人虚旗尽毁！`,
          });
        }
      }

      // 4. Generate scout reports
      const reports = generateFactionScoutReports(state.units, 'allied');
      for (const r of reports) {
        dispatch({ type: 'SUBMIT_SCOUT_REPORT', report: r });
      }

      // 5. Turn summary
      dispatch({
        type: 'ADD_COMBAT_LOG',
        message: generateTurnSummary({ ...state, turnNumber: state.turnNumber + 1 }),
      });

      // 6. Check scenario end
      const endCheck = checkScenarioEnd(
        state,
        WEI_JIU_ZHAO_SCENARIO.alliedCapitalId,
        WEI_JIU_ZHAO_SCENARIO.hostileCapitalId,
        WEI_JIU_ZHAO_SCENARIO.maxTurns
      );

      if (endCheck.isVictory || endCheck.isDefeat) {
        // Compute victory score
        const { computeVictoryScore } = await import('../engine/victoryScoring');
        const score = computeVictoryScore(state, WEI_JIU_ZHAO_SCENARIO);
        dispatch({ type: 'SET_COMPLETE', score });
        setShowVictory(true);
        dispatch({
          type: 'ADD_COMBAT_LOG',
          message: endCheck.isVictory
            ? `🏆 【大捷】${endCheck.description} 评级: ${score.rank}`
            : `💀 【兵败】${endCheck.description}`,
        });
      } else {
        // Advance to next turn
        dispatch({ type: 'ADVANCE_TURN' });
        dispatch({ type: 'SET_PHASE', phase: 'STRATEGIZE' });
      }
    } catch (err) {
      console.error('Resolve error:', err);
      dispatch({
        type: 'ADD_COMBAT_LOG',
        message: '⚠️ 天机演算受阻，请重试。',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [state, dispatch]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'LOAD_SCENARIO', scenario: WEI_JIU_ZHAO_SCENARIO });
    setShowVictory(false);
    setSelectedUnitId(null);
  }, [dispatch]);

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ── Scenario HUD ── */}
      <div className="bg-gradient-to-r from-amber-950/30 via-stone-900 to-amber-950/30 border border-amber-500/20 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-red-950/50 border border-red-500/30 flex items-center justify-center">
              <Swords className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-amber-200 tracking-wider">
                围魏救赵
              </h2>
              <p className="text-[10px] text-stone-500 font-mono">
                公元前354年 · 齐魏争霸
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-stone-950 px-3 py-1.5 rounded border border-stone-800">
              <span className="text-stone-500">回合</span>{' '}
              <span className="text-amber-300 font-bold">{state.turnNumber}</span>
              <span className="text-stone-600">/{WEI_JIU_ZHAO_SCENARIO.maxTurns}</span>
            </div>
            <div className={`px-3 py-1.5 rounded border font-bold ${
              state.phase === 'RESOLVE' ? 'border-red-500/40 text-red-400 bg-red-950/20' :
              state.phase === 'STRATEGIZE' ? 'border-amber-500/40 text-amber-400 bg-amber-950/20' :
              'border-stone-700 text-stone-400'
            }`}>
              {phaseDescription(state.phase)}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewerPerspective(p => p === 'allied' ? 'hostile' : 'allied')}
                className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 text-[10px] flex items-center gap-1"
              >
                {viewerPerspective === 'allied' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {viewerPerspective === 'allied' ? '齐/赵视角' : '魏军视角'}
              </button>
              <button
                onClick={handleReset}
                className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-400 hover:text-red-400 text-[10px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> 重置
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content: Map + CommandPanel + CombatLog ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* ── Game Map (left 7 cols) ── */}
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-stone-800 rounded-lg p-0 relative overflow-hidden min-h-[400px] flex flex-col">
          {/* Map header */}
          <div className="bg-stone-900 border-b border-stone-800 p-2 flex items-center justify-between z-10">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> 魏赵边境 · 大梁—邯郸战区
            </span>
            <span className="text-[10px] text-stone-500">
              活跃部队: {activeUnits.length} | 补给节点: {state.supplyGraph.nodes.length}
            </span>
          </div>

          {/* SVG Map overlay */}
          <div className="flex-1 relative bg-[#0d0c0b] overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Background terrain gradient */}
              <defs>
                <radialGradient id="capitalGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C5A059" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="supplyLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#C5A059" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="supplyLineCut" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Grid lines for Chinese military map aesthetic */}
              {Array.from({ length: 10 }, (_, i) => (
                <React.Fragment key={`grid-${i}`}>
                  <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="#1a1a1a" strokeWidth={0.1} />
                  <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#1a1a1a" strokeWidth={0.1} />
                </React.Fragment>
              ))}

              {/* Supply edges */}
              {state.supplyGraph.edges.map(edge => {
                const srcNode = state.supplyGraph.nodes.find(n => n.id === edge.source);
                const tgtNode = state.supplyGraph.nodes.find(n => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                // Map lat/lng to SVG coordinates (crude linear mapping for the scenario area)
                const toX = (lng: number) => ((lng - 114.0) / 1.5) * 100;
                const toY = (lat: number) => 100 - ((lat - 34.5) / 2.5) * 100;

                return (
                  <g key={edge.id}>
                    <line
                      x1={toX(srcNode.lng)} y1={toY(srcNode.lat)}
                      x2={toX(tgtNode.lng)} y2={toY(tgtNode.lat)}
                      stroke={edge.isCut ? 'url(#supplyLineCut)' : edge.isFake ? '#9333EA' : 'url(#supplyLineGrad)'}
                      strokeWidth={edge.isCut ? 0.3 : 0.6}
                      strokeDasharray={edge.isCut ? '1 1' : edge.isFake ? '0.5 0.5' : 'none'}
                    />
                    {/* Animated supply dots on active edges */}
                    {!edge.isCut && !edge.isFake && (
                      <circle r="0.5" fill="#10B981">
                        <animateMotion dur="3s" repeatCount="indefinite"
                          path={`M${toX(srcNode.lng)},${toY(srcNode.lat)} L${toX(tgtNode.lng)},${toY(tgtNode.lat)}`} />
                      </circle>
                    )}
                    {/* Clickable area to cut supply */}
                    {!edge.isCut && state.phase === 'STRATEGIZE' && (
                      <line
                        x1={toX(srcNode.lng)} y1={toY(srcNode.lat)}
                        x2={toX(tgtNode.lng)} y2={toY(tgtNode.lat)}
                        stroke="transparent" strokeWidth={3}
                        className="cursor-pointer"
                        onClick={() => handleCutSupply(edge.id)}
                        title={`切断 ${srcNode.name} ↔ ${tgtNode.name} 粮道`}
                      />
                    )}
                  </g>
                );
              })}

              {/* Supply nodes */}
              {state.supplyGraph.nodes.map(node => {
                const toX = (lng: number) => ((lng - 114.0) / 1.5) * 100;
                const toY = (lat: number) => 100 - ((lat - 34.5) / 2.5) * 100;

                return (
                  <g key={node.id}>
                    {node.type === 'capital' && (
                      <circle cx={toX(node.lng)} cy={toY(node.lat)} r={8} fill="url(#capitalGlow)" />
                    )}
                    <rect
                      x={toX(node.lng) - 4} y={toY(node.lat) - 2.5}
                      width={8} height={5} rx={1}
                      fill={node.type === 'capital' ? '#8C2F39' : node.type === 'depot' ? '#1a4a1a' : '#1a1a2e'}
                      stroke={node.type === 'capital' ? '#C5A059' : '#4a5568'}
                      strokeWidth={0.3}
                    />
                    <text
                      x={toX(node.lng)} y={toY(node.lat) + 5}
                      textAnchor="middle"
                      fill="#a0aec0"
                      fontSize={2.5}
                      fontFamily="serif"
                      fontWeight="bold"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}

              {/* Units */}
              {visibleUnits.map(unit => {
                const toX = (lng: number) => ((lng - 114.0) / 1.5) * 100;
                const toY = (lat: number) => 100 - ((lat - 34.5) / 2.5) * 100;
                const isSelected = unit.id === selectedUnitId;
                const isRouted = unit.isRouted;

                return (
                  <g
                    key={unit.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedUnitId(unit.id)}
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <circle cx={toX(unit.lng)} cy={toY(unit.lat)} r={5}
                        fill="none" stroke="#C5A059" strokeWidth={0.5}
                        className="animate-pulse" />
                    )}
                    {/* Unit marker */}
                    <circle
                      cx={toX(unit.lng)} cy={toY(unit.lat)} r={3}
                      fill={unit.side === 'allied' ? (unit.isFake ? '#7c3aed' : '#10B981') : '#EF4444'}
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth={0.3}
                      opacity={isRouted ? 0.4 : 1}
                    />
                    {/* isFake indicator */}
                    {unit.isFake && (
                      <text x={toX(unit.lng)} y={toY(unit.lat) + 1}
                        textAnchor="middle" fill="#fff" fontSize={2} fontWeight="bold">
                        ?
                      </text>
                    )}
                    {/* Routed indicator */}
                    {isRouted && (
                      <text x={toX(unit.lng) + 3.5} y={toY(unit.lat)}
                        textAnchor="middle" fill="#EF4444" fontSize={2}>!</text>
                    )}
                    {/* Unit name */}
                    <text
                      x={toX(unit.lng)} y={toY(unit.lat) - 4}
                      textAnchor="middle"
                      fill={unit.side === 'allied' ? '#6EE7B7' : '#FCA5A5'}
                      fontSize={2.2}
                      fontFamily="serif"
                      fontWeight="bold"
                    >
                      {unit.name}
                    </text>
                    {/* Size */}
                    <text
                      x={toX(unit.lng)} y={toY(unit.lat) + 5.5}
                      textAnchor="middle"
                      fill="#78716c"
                      fontSize={1.8}
                      fontFamily="monospace"
                    >
                      {unit.size.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map legend */}
            <div className="absolute bottom-2 left-2 bg-black/80 border border-stone-800 rounded p-1.5 text-[8px] font-mono space-y-0.5 z-10">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> 齐/赵</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> 魏</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> 疑兵</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500/40" /> 溃散</div>
            </div>

            {/* Click instructions */}
            <div className="absolute top-2 right-2 bg-black/60 border border-stone-800 rounded px-2 py-1 text-[9px] text-stone-500 z-10">
              点击补给线切断粮道 | 点击单位查看详情
            </div>
          </div>
        </div>

        {/* ── Command Panel (right 5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0">
          {/* Selected unit details */}
          <div className="bg-[#121110] border border-stone-800 rounded-lg p-4 flex-shrink-0">
            <h3 className="text-xs font-serif font-bold text-amber-500/80 uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">
              <Target className="w-3 h-3 inline mr-1" /> 选中单位
            </h3>

            {selectedUnit ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">名称</span>
                  <span className="text-stone-200 font-bold">
                    {selectedUnit.name}
                    {selectedUnit.isFake && <span className="text-purple-400 ml-1">[疑兵]</span>}
                    {selectedUnit.isRouted && <span className="text-red-400 ml-1">[溃散]</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">阵营</span>
                  <span className={selectedUnit.side === 'allied' ? 'text-emerald-400' : 'text-red-400'}>
                    {selectedUnit.side === 'allied' ? '齐/赵联军' : '魏军'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">兵力</span>
                  <span className="text-stone-200">{selectedUnit.size.toLocaleString()} 人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">粮草</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${selectedUnit.provisions > 50 ? 'bg-emerald-500' : selectedUnit.provisions > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${selectedUnit.provisions}%` }}
                      />
                    </div>
                    <span className="text-stone-200">{selectedUnit.provisions}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">士气</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${selectedUnit.morale > 50 ? 'bg-emerald-500' : selectedUnit.morale > 20 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'}`}
                        style={{ width: `${selectedUnit.morale}%` }}
                      />
                    </div>
                    <span className="text-stone-200">{selectedUnit.morale}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">攻击/防御</span>
                  <span className="text-stone-200">{selectedUnit.attackPower}/{selectedUnit.defensePower}</span>
                </div>

                {/* Quick actions for selected unit */}
                {state.phase === 'STRATEGIZE' && selectedUnit.side === 'allied' && !selectedUnit.isRouted && !selectedUnit.isFake && (
                  <div className="grid grid-cols-4 gap-1 pt-2 border-t border-stone-800 mt-2">
                    <button onClick={() => handleMoveUnit(selectedUnit.id, 0, 1)} className="px-1 py-1 bg-stone-800 rounded text-[9px] text-stone-400 hover:text-emerald-400">↑北</button>
                    <button onClick={() => handleMoveUnit(selectedUnit.id, 0, -1)} className="px-1 py-1 bg-stone-800 rounded text-[9px] text-stone-400 hover:text-emerald-400">↓南</button>
                    <button onClick={() => handleMoveUnit(selectedUnit.id, -1, 0)} className="px-1 py-1 bg-stone-800 rounded text-[9px] text-stone-400 hover:text-emerald-400">←西</button>
                    <button onClick={() => handleMoveUnit(selectedUnit.id, 1, 0)} className="px-1 py-1 bg-stone-800 rounded text-[9px] text-stone-400 hover:text-emerald-400">→东</button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-stone-600 font-serif italic text-center py-4">
                点击地图上的单位以检视详情
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="bg-[#121110] border border-stone-800 rounded-lg p-4 flex-shrink-0">
            <h3 className="text-xs font-serif font-bold text-amber-500/80 uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">
              <Zap className="w-3 h-3 inline mr-1" /> 军令
            </h3>

            {state.phase === 'DEPLOY' && (
              <div className="space-y-2">
                <p className="text-[10px] text-stone-500 mb-2">部署疑兵（isFake单位）以迷惑魏军：</p>
                <div className="flex gap-2">
                  <input
                    value={deployName}
                    onChange={e => setDeployName(e.target.value)}
                    placeholder="疑兵名称，如：齐军右翼"
                    className="flex-1 bg-stone-950 border border-stone-800 text-stone-200 p-1.5 rounded text-[10px] outline-none focus:border-amber-500/50"
                  />
                  <select
                    value={deployFakeSize}
                    onChange={e => setDeployFakeSize(Number(e.target.value))}
                    className="bg-stone-950 border border-stone-800 text-stone-200 p-1.5 rounded text-[10px]"
                  >
                    <option value={5000}>5千</option>
                    <option value={10000}>1万</option>
                    <option value={20000}>2万</option>
                    <option value={40000}>4万</option>
                  </select>
                </div>
                <button
                  onClick={handleDeployFakeUnit}
                  disabled={!deployName.trim()}
                  className="w-full py-2 bg-purple-900/30 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-[10px] font-bold rounded flex items-center justify-center gap-1 disabled:opacity-30"
                >
                  <EyeOff className="w-3 h-3" /> 部署疑兵（消耗500人+50粮）
                </button>
              </div>
            )}

            {state.phase === 'STRATEGIZE' && (
              <div className="space-y-2">
                <p className="text-[10px] text-stone-500">
                  选择单位后使用方向键移动，或点击地图粮道切断补给。
                </p>
                {selectedUnit && selectedUnit.side === 'allied' && !selectedUnit.isFake && !selectedUnit.isRouted && (
                  <div className="space-y-1">
                    {/* Attack nearest enemy */}
                    {activeUnits.filter(u => u.side === 'hostile' && !u.isRouted).slice(0, 3).map(enemy => {
                      const dist = haversineDistance(selectedUnit.lat, selectedUnit.lng, enemy.lat, enemy.lng);
                      return (
                        <button
                          key={enemy.id}
                          onClick={() => handleAttackUnit(selectedUnit.id, enemy.id)}
                          className="w-full py-1.5 bg-red-950/20 border border-red-500/20 hover:border-red-400 text-red-300 text-[10px] rounded flex items-center justify-between px-2"
                        >
                          <span className="flex items-center gap-1">
                            <Crosshair className="w-3 h-3" /> 攻击 {enemy.name}
                          </span>
                          <span className="text-stone-500">{dist.toFixed(1)} km</span>
                        </button>
                      );
                    })}
                    {/* Scout enemy */}
                    <button
                      onClick={() => {
                        const enemies = activeUnits.filter(u => u.side === 'hostile');
                        if (enemies[0]) handleScout(enemies[0].id);
                      }}
                      className="w-full py-1.5 bg-blue-950/20 border border-blue-500/20 hover:border-blue-400 text-blue-300 text-[10px] rounded flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> 派遣斥候侦察
                    </button>
                  </div>
                )}
              </div>
            )}

            {state.phase === 'RESOLVE' && (
              <div className="text-center">
                <button
                  onClick={handleResolve}
                  disabled={isExecuting}
                  className="w-full py-3 bg-red-900/40 border border-red-500/30 hover:border-red-400 text-red-200 font-serif font-black text-sm rounded flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <span className="w-4 h-4 border-2 border-red-200 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isExecuting ? '天机演算中...' : '执行回合结算'}
                </button>
              </div>
            )}

            {state.phase === 'AFTERMATH' && (
              <p className="text-[10px] text-amber-400 font-serif text-center">
                战事已毕，史记入册。
              </p>
            )}
          </div>

          {/* Phase advance */}
          {!state.isComplete && state.phase !== 'RESOLVE' && (
            <button
              onClick={state.phase === 'STRATEGIZE'
                ? () => { dispatch({ type: 'SET_PHASE', phase: 'RESOLVE' }); }
                : handleAdvancePhase
              }
              className="w-full py-2.5 bg-gradient-to-r from-amber-900/30 to-stone-900 border border-amber-500/30 hover:border-amber-400 text-amber-200 font-serif font-black text-xs rounded flex items-center justify-center gap-2 transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {state.phase === 'STRATEGIZE' ? '完成部署，进入决胜阶段' : `进入下一阶段: ${phaseDescription(nextPhase(state.phase))}`}
            </button>
          )}
        </div>
      </div>

      {/* ── Combat Log (bottom) ── */}
      <div className="bg-[#0a0a0a] border border-stone-800 rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '180px' }}>
        <div className="bg-stone-900 border-b border-stone-800 p-2 flex justify-between items-center z-10 flex-shrink-0">
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            战报反馈流 (Combat Log)
          </span>
          <span className="text-[9px] text-stone-600">{state.combatLog.length} 条记录</span>
        </div>
        <div
          ref={combatLogRef}
          className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[10px] leading-relaxed"
        >
          {state.combatLog.length === 0 && (
            <p className="text-stone-600 text-center py-4 font-serif">等待回合开始...</p>
          )}
          {state.combatLog.slice(0, 50).map((log, idx) => {
            let color = 'text-stone-400';
            if (log.includes('【第') || log.includes('回合')) color = 'text-cyan-400 font-bold';
            if (log.includes('断粮') || log.includes('断绝')) color = 'text-red-400 font-bold bg-red-950/10 px-1 rounded';
            if (log.includes('补给') || log.includes('畅通') || log.includes('高昂')) color = 'text-emerald-400';
            if (log.includes('疑兵') || log.includes('识破')) color = 'text-purple-400';
            if (log.includes('溃散') || log.includes('恐慌')) color = 'text-red-500 font-bold';
            if (log.includes('⚔️')) color = 'text-amber-300 font-serif';
            if (log.includes('大捷') || log.includes('🏆')) color = 'text-yellow-400 font-bold text-sm';
            if (log.includes('兵败') || log.includes('💀')) color = 'text-red-500 font-bold';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={color}
              >
                {log}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Victory Modal ── */}
      <AnimatePresence>
        {showVictory && state.victoryScore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-b from-[#1b1a19] to-[#0f0e0d] border border-[#C5A059]/40 rounded-lg p-8 max-w-lg w-full shadow-2xl text-center space-y-5"
            >
              <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-serif font-black text-amber-200">
                围魏救赵 · {state.victoryScore.rank} 级
              </h2>

              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { label: '军事优势', value: state.victoryScore.categories.militaryDominance, icon: Swords },
                  { label: '补给完整', value: state.victoryScore.categories.supplyIntegrity, icon: Wheat },
                  { label: '欺骗效力', value: state.victoryScore.categories.deceptionEfficacy, icon: EyeOff },
                  { label: '天命保全', value: state.victoryScore.categories.mandatePreservation, icon: Heart },
                ].map(cat => (
                  <div key={cat.label} className="bg-stone-900/50 rounded p-3 border border-stone-800">
                    <div className="text-[10px] text-stone-400 flex items-center gap-1 mb-1">
                      <cat.icon className="w-3 h-3" /> {cat.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${(cat.value / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-amber-300">{cat.value}/25</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-3xl font-serif font-black text-amber-400">
                {state.victoryScore.totalScore} / 100
              </div>

              <blockquote className="text-xs text-stone-400 font-serif italic border-l-2 border-amber-500/30 pl-3 py-1">
                "{state.victoryScore.sunTzuQuote}"
              </blockquote>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-amber-900/20 border border-amber-500/30 hover:border-amber-400 text-amber-200 font-serif font-bold text-sm rounded flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> 再战一局
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}