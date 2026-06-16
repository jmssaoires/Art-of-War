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
  Crosshair, Skull, TrendingDown, TrendingUp, Heart,
  Layers, Thermometer, Globe, AlertCircle, Hash
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
import UnitCard from './UnitCard';
import { useLocale } from '../i18n/LocaleContext';

type MapMode = 'default' | 'supply' | 'morale' | 'territory';

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
  const { t } = useLocale();

  // Local UI state
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [viewerPerspective, setViewerPerspective] = useState<'allied' | 'hostile'>('allied');
  const [weather, setWeather] = useState<'CLEAR' | 'RAIN' | 'WIND' | 'FOG'>('CLEAR');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployIsFake, setDeployIsFake] = useState(false);
  const [deployFakeSize, setDeployFakeSize] = useState(5000);
  const [mapMode, setMapMode] = useState<MapMode>('default');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; unitId: string } | null>(null);
  const combatLogRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case '1': setMapMode('default'); break;
        case '2': setMapMode('supply'); break;
        case '3': setMapMode('morale'); break;
        case '4': setMapMode('territory'); break;
        case 'Escape':
          setSelectedUnitId(null);
          setContextMenu(null);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', close, { once: true });
      return () => window.removeEventListener('click', close);
    }
  }, [contextMenu]);

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
      <div className="panel-bamboo-dark bg-gradient-to-r from-[#8C2F39]/10 via-stone-900 to-[#4a7c4f]/10 border border-[#C5A059]/20 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-red-950/50 border border-red-500/30 flex items-center justify-center">
              <Swords className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-amber-200 tracking-wider">
                {t('scenario.title')}
              </h2>
              <p className="text-[10px] text-stone-500 font-mono">
                {t('scenario.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-stone-950 px-3 py-1.5 rounded border border-stone-800">
              <span className="text-stone-500">{t('scenario.turn')}</span>{' '}
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
                {viewerPerspective === 'allied' ? t('map.view.allied') : t('map.view.hostile')}
              </button>
              <button
                onClick={handleReset}
                className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-400 hover:text-red-400 text-[10px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> {t('ui.reset')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content: Map + CommandPanel + CombatLog ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* ── Game Map (left 7 cols) ── */}
        <div className="lg:col-span-7 bg-[#0d0c0b] border border-stone-800 rounded-lg p-0 relative overflow-hidden min-h-[450px] flex flex-col ink-dark">
          {/* Map header with mode toggles */}
          <div className="bg-stone-900/80 backdrop-blur border-b border-stone-800 p-2 flex items-center justify-between z-20 flex-shrink-0">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> {t('scenario.mapCenter')}
            </span>
            <div className="flex items-center gap-1">
              {/* Map mode toggles */}
              {([
                { mode: 'default' as MapMode, icon: Globe, label: t('map.mode.default'), key: '1' },
                { mode: 'supply' as MapMode, icon: Wheat, label: t('map.mode.supply'), key: '2' },
                { mode: 'morale' as MapMode, icon: Heart, label: t('map.mode.morale'), key: '3' },
                { mode: 'territory' as MapMode, icon: Layers, label: t('map.mode.territory'), key: '4' },
              ]).map(({ mode, icon: Icon, label, key }) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-0.5 transition-all ${
                    mapMode === mode
                      ? 'bg-amber-900/30 border border-amber-500/40 text-amber-300'
                      : 'bg-stone-800 border border-stone-700 text-stone-500 hover:text-stone-300'
                  }`}
                  title={`${label}模式 (${key})`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <span className="text-[8px] text-stone-600 ml-1 hidden md:block">{t('map.mode.hint')}</span>
            </div>
            <span className="text-[10px] text-stone-500">
              {activeUnits.length}{t('scenario.activeUnits')} | {state.supplyGraph.nodes.length}{t('scenario.supplyNodes')}
            </span>
          </div>

          {/* Map canvas with terrain background */}
          <div ref={mapContainerRef} className="flex-1 relative overflow-hidden bg-[#0d0c0b]">
            {/* ── Terrain background layer ── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 120 80">
              <defs>
                <pattern id="riceGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3" />
                </pattern>
                <radialGradient id="capitalGlowDaliang" cx="40%" cy="55%">
                  <stop offset="0%" stopColor="#c43a31" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#c43a31" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="capitalGlowHandan" cx="52%" cy="30%">
                  <stop offset="0%" stopColor="#4a7c4f" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#4a7c4f" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Rice-paper grid background */}
              <rect width="120" height="80" fill="url(#riceGrid)" />

              {/* Terrain zones */}
              <rect x="30" y="5" width="40" height="25" rx="2" fill="rgba(74,124,79,0.04)" stroke="rgba(74,124,79,0.08)" strokeWidth="0.2" />
              <text x="50" y="18" fill="rgba(74,124,79,0.12)" fontSize="3" textAnchor="middle" fontFamily="serif">齐地 (平原)</text>

              <rect x="10" y="35" width="35" height="35" rx="2" fill="rgba(196,58,49,0.04)" stroke="rgba(196,58,49,0.08)" strokeWidth="0.2" />
              <text x="27" y="54" fill="rgba(196,58,49,0.12)" fontSize="3" textAnchor="middle" fontFamily="serif">魏地 (中原)</text>

              <rect x="50" y="45" width="35" height="15" rx="2" fill="rgba(180,138,68,0.04)" stroke="rgba(180,138,68,0.08)" strokeWidth="0.2" />
              <text x="67" y="53" fill="rgba(180,138,68,0.12)" fontSize="3" textAnchor="middle" fontFamily="serif">战区 (争地)</text>

              {/* Capital glows */}
              <circle cx="32" cy="45" r="15" fill="url(#capitalGlowDaliang)" />
              <circle cx="55" cy="22" r="12" fill="url(#capitalGlowHandan)" />

              {/* Terrain hatches (mountain symbols) */}
              {[
                [20, 12], [75, 8], [85, 25], [10, 60], [80, 65], [60, 72],
              ].map(([cx, cy], i) => (
                <g key={`mt-${i}`} opacity={0.06}>
                  <polygon points={`${cx-2},${cy+2} ${cx},${cy-2} ${cx+2},${cy+2}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
                  <line x1={cx-3} y1={cy+2} x2={cx+3} y2={cy+2} stroke="rgba(255,255,255,0.2)" strokeWidth="0.2" />
                </g>
              ))}
            </svg>

            {/* ── Map mode overlay (supply / morale heatmap) ── */}
            {mapMode === 'supply' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 120 80">
                {state.units.filter(u => !u.isDestroyed).map(unit => {
                  const cx = ((unit.lng - 114.0) / 1.6) * 120;
                  const cy = 80 - ((unit.lat - 34.5) / 2.5) * 80;
                  const alpha = unit.provisions / 200;
                  return (
                    <circle key={unit.id} cx={cx} cy={cy} r={Math.max(3, unit.size / 8000)}
                      fill={unit.provisions > 50 ? '#4a7c4f' : unit.provisions > 20 ? '#b88a44' : '#c43a31'}
                      opacity={0.25 + alpha} />
                  );
                })}
              </svg>
            )}
            {mapMode === 'morale' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 120 80">
                {state.units.filter(u => !u.isDestroyed).map(unit => {
                  const cx = ((unit.lng - 114.0) / 1.6) * 120;
                  const cy = 80 - ((unit.lat - 34.5) / 2.5) * 80;
                  const alpha = unit.morale / 200;
                  return (
                    <circle key={unit.id} cx={cx} cy={cy} r={Math.max(3, unit.size / 8000)}
                      fill={unit.morale >= 80 ? '#10b981' : unit.morale >= 40 ? '#f59e0b' : '#ef4444'}
                      opacity={0.25 + alpha} />
                  );
                })}
              </svg>
            )}
            {mapMode === 'territory' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 120 80">
                {/* Simple voronoi-like territory split */}
                <polygon points="0,0 60,0 45,80 0,80" fill="rgba(196,58,49,0.06)" stroke="rgba(196,58,49,0.15)" strokeWidth="0.3" strokeDasharray="1 0.5" />
                <polygon points="60,0 120,0 120,80 45,80" fill="rgba(74,124,79,0.06)" stroke="rgba(74,124,79,0.15)" strokeWidth="0.3" strokeDasharray="1 0.5" />
                <text x="25" y="70" fill="rgba(196,58,49,0.2)" fontSize="4" textAnchor="middle" fontFamily="serif" fontWeight="bold">魏</text>
                <text x="83" y="15" fill="rgba(74,124,79,0.2)" fontSize="4" textAnchor="middle" fontFamily="serif" fontWeight="bold">齐</text>
              </svg>
            )}

            {/* ── Supply lines (SVG layer) ── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 120 80">
              {state.supplyGraph.edges.map(edge => {
                const srcNode = state.supplyGraph.nodes.find(n => n.id === edge.source);
                const tgtNode = state.supplyGraph.nodes.find(n => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                const toX = (lng: number) => ((lng - 114.0) / 1.6) * 120;
                const toY = (lat: number) => 80 - ((lat - 34.5) / 2.5) * 80;

                return (
                  <g key={edge.id}>
                    {/* Glow for active supply lines */}
                    {!edge.isCut && !edge.isFake && (
                      <line x1={toX(srcNode.lng)} y1={toY(srcNode.lat)}
                        x2={toX(tgtNode.lng)} y2={toY(tgtNode.lat)}
                        stroke="#4a7c4f" strokeWidth={2} opacity={0.12} />
                    )}
                    <line x1={toX(srcNode.lng)} y1={toY(srcNode.lat)}
                      x2={toX(tgtNode.lng)} y2={toY(tgtNode.lat)}
                      stroke={edge.isCut ? '#e0453a' : edge.isFake ? '#7c3aed' : '#5b8c5a'}
                      strokeWidth={edge.isCut ? 0.5 : 1}
                      strokeDasharray={edge.isCut ? '1 1' : edge.isFake ? '0.5 0.5' : 'none'}
                      opacity={edge.isCut ? 0.5 : 0.7}
                    />
                    {/* Animated supply dots */}
                    {!edge.isCut && !edge.isFake && (
                      <circle r="0.6" fill="#10B981">
                        <animateMotion dur="3s" repeatCount="indefinite"
                          path={`M${toX(srcNode.lng)},${toY(srcNode.lat)} L${toX(tgtNode.lng)},${toY(tgtNode.lat)}`} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* ── Clickable supply line cut zones (overlay) ── */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 120 80">
              {!state.isComplete && state.phase === 'STRATEGIZE' && state.supplyGraph.edges
                .filter(e => !e.isCut)
                .map(edge => {
                  const srcNode = state.supplyGraph.nodes.find(n => n.id === edge.source);
                  const tgtNode = state.supplyGraph.nodes.find(n => n.id === edge.target);
                  if (!srcNode || !tgtNode) return null;
                  const toX = (lng: number) => ((lng - 114.0) / 1.6) * 120;
                  const toY = (lat: number) => 80 - ((lat - 34.5) / 2.5) * 80;
                  return (
                    <line key={edge.id} x1={toX(srcNode.lng)} y1={toY(srcNode.lat)}
                      x2={toX(tgtNode.lng)} y2={toY(tgtNode.lat)}
                      stroke="transparent" strokeWidth={6}
                      className="cursor-pointer hover:stroke-red-500/20 transition-colors"
                      onClick={() => handleCutSupply(edge.id)}
                      title={`切断 ${srcNode.name} ↔ ${tgtNode.name}`} />
                  );
                })}
            </svg>

            {/* ── Supply nodes (city badges) ── */}
            {state.supplyGraph.nodes.map(node => {
              const xPct = ((node.lng - 114.0) / 1.6) * 100;
              const yPct = 100 - ((node.lat - 34.5) / 2.5) * 100;
              const isCapital = node.type === 'capital';
              return (
                <div
                  key={node.id}
                  className="absolute pointer-events-none"
                  style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`flex flex-col items-center ${isCapital ? 'scale-125' : ''}`}>
                    <div
                      className={`w-6 h-4 rounded-sm flex items-center justify-center text-[8px] font-black font-serif shadow-lg border ${
                        isCapital ? 'bg-[#8C2F39] border-[#C5A059] text-white' :
                        node.type === 'depot' ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200' :
                        'bg-stone-700 border-stone-500 text-stone-200'
                      }`}
                    >
                      {node.name.charAt(0)}
                    </div>
                    <span className="text-[8px] font-serif text-stone-400 mt-0.5 whitespace-nowrap">{node.name}</span>
                  </div>
                </div>
              );
            })}

            {/* ── Unit Cards (replaces SVG circles) ── */}
            {visibleUnits.map(unit => {
              const xPct = ((unit.lng - 114.0) / 1.6) * 100;
              const yPct = 100 - ((unit.lat - 34.5) / 2.5) * 100;
              return (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  isSelected={unit.id === selectedUnitId}
                  isEnemyView={viewerPerspective !== unit.side}
                  mapMode={mapMode}
                  x={xPct}
                  y={yPct}
                  onClick={() => setSelectedUnitId(unit.id === selectedUnitId ? null : unit.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, unitId: unit.id });
                  }}
                />
              );
            })}

            {/* ── Right-click context menu ── */}
            <AnimatePresence>
              {contextMenu && state.phase === 'STRATEGIZE' && (() => {
                const ctxUnit = state.units.find(u => u.id === contextMenu.unitId);
                if (!ctxUnit || ctxUnit.side !== 'allied' || ctxUnit.isRouted || ctxUnit.isFake) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed z-[100] bg-[#1a1917] border border-stone-700 rounded-md shadow-2xl py-1 min-w-[140px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                  >
                    <div className="text-[9px] text-stone-400 px-3 py-1 border-b border-stone-800 font-bold">
                      {ctxUnit.name}
                    </div>
                    {activeUnits.filter(u => u.side === 'hostile' && !u.isRouted).slice(0, 4).map(enemy => (
                      <button key={enemy.id}
                        onClick={() => { handleAttackUnit(ctxUnit.id, enemy.id); setContextMenu(null); }}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-red-300 hover:bg-red-950/20 flex items-center gap-2">
                        <Crosshair className="w-3 h-3" /> {t('context.attack')} {enemy.name}
                      </button>
                    ))}
                    <button onClick={() => { handleScout(contextMenu.unitId); setContextMenu(null); }}
                      className="w-full text-left px-3 py-1.5 text-[10px] text-blue-300 hover:bg-blue-950/20 flex items-center gap-2">
                      <Eye className="w-3 h-3" /> {t('context.scout')}
                    </button>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* ── Map legend ── */}
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur border border-stone-800 rounded p-1.5 text-[8px] font-mono space-y-0.5 z-10">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#4a7c4f]" /> {t('map.legend.allied')}</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#c43a31]" /> {t('map.legend.hostile')}</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#7c3aed]" /> {t('map.legend.deception')}</div>
            </div>

            {/* ── Map tips ── */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur border border-stone-800 rounded px-2 py-1 text-[9px] text-stone-500 z-10 pointer-events-none">
              {t('map.tip')}
            </div>
          </div>
        </div>

        {/* ── Command Panel (right 5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0">
          {/* Selected unit details */}
          <div className="panel-bamboo-dark p-4 flex-shrink-0">
            <h3 className="text-xs font-serif font-bold text-amber-500/80 uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">
              <Target className="w-3 h-3 inline mr-1" /> {t('unit.selected')}
            </h3>

            {selectedUnit ? (
              <div className="space-y-1.5 text-[10px]">
                {/* Unit identity */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-black text-white ${
                    selectedUnit.side === 'allied' ? 'bg-[#4a7c4f]' : 'bg-[#c43a31]'
                  }`}>
                    {selectedUnit.side === 'allied' ? '齐' : '魏'}
                  </div>
                  <div>
                    <div className="font-bold text-stone-100 text-xs flex items-center gap-1">
                      {selectedUnit.name}
                      {selectedUnit.isFake && <span className="text-[9px] px-1 bg-purple-900/50 text-purple-300 rounded">{t('unit.label.fake')}</span>}
                      {selectedUnit.isRouted && <span className="text-[9px] px-1 bg-red-900/50 text-red-300 rounded animate-pulse">{t('unit.label.routed')}</span>}
                    </div>
                    <div className="text-stone-500 font-mono">{selectedUnit.size.toLocaleString()} {t('unit.stat.size')}</div>
                  </div>
                </div>

                {/* Supply & Morale dual gauge */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-stone-500"><span className="flex items-center gap-0.5"><Wheat className="w-2.5 h-2.5" />{t('unit.stat.supply')}</span><span>{selectedUnit.provisions}%</span></div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ background: selectedUnit.provisions > 50 ? '#4a7c4f' : selectedUnit.provisions > 20 ? '#b88a44' : '#c43a31', width: `${selectedUnit.provisions}%` }} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-stone-500"><span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{t('unit.stat.morale')}</span><span>{selectedUnit.morale}</span></div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ background: selectedUnit.morale >= 80 ? '#10b981' : selectedUnit.morale >= 40 ? '#f59e0b' : '#ef4444', width: `${selectedUnit.morale}%` }} />
                    </div>
                  </div>
                </div>

                {/* Combat stats */}
                <div className="flex gap-3 text-stone-500 pt-1">
                  <span className="flex items-center gap-0.5"><Swords className="w-2.5 h-2.5 text-red-400" />{t('unit.stat.attack')} {selectedUnit.attackPower}</span>
                  <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-blue-400" />{t('unit.stat.defense')} {selectedUnit.defensePower}</span>
                  <span className="flex items-center gap-0.5"><Activity className="w-2.5 h-2.5" />{t('unit.stat.speed')} {selectedUnit.speed}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-stone-600 font-serif italic text-center py-6">
                {t('unit.none')}<br />{t('unit.none.sub')}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="panel-bamboo-dark p-4 flex-shrink-0">
            <h3 className="text-xs font-serif font-bold text-amber-500/80 uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">
              <Zap className="w-3 h-3 inline mr-1" /> {t('command.title')}
            </h3>

            {state.phase === 'DEPLOY' && (
              <div className="space-y-2">
                <p className="text-[10px] text-stone-500 mb-2">{t('command.deploy.hint')}</p>
                <div className="flex gap-2">
                  <input value={deployName} onChange={e => setDeployName(e.target.value)}
                    placeholder={t('command.deploy.placeholder')}
                    className="flex-1 bg-stone-950 border border-stone-700 text-stone-200 p-1.5 rounded text-[10px] outline-none focus:border-purple-500/50 font-serif" />
                  <select value={deployFakeSize} onChange={e => setDeployFakeSize(Number(e.target.value))}
                    className="bg-stone-950 border border-stone-700 text-stone-200 p-1.5 rounded text-[10px]">
                    <option value={5000}>{t('command.deploy.size.5k')}</option><option value={10000}>{t('command.deploy.size.10k')}</option><option value={20000}>{t('command.deploy.size.20k')}</option><option value={40000}>{t('command.deploy.size.40k')}</option>
                  </select>
                </div>
                <button onClick={handleDeployFakeUnit} disabled={!deployName.trim()}
                  className="w-full py-2 bg-purple-900/20 border border-purple-500/30 hover:border-purple-400 text-purple-200 text-[10px] font-bold rounded flex items-center justify-center gap-1 disabled:opacity-30 transition-colors">
                  <EyeOff className="w-3 h-3" /> {t('command.deploy.button')}
                </button>
              </div>
            )}

            {state.phase === 'STRATEGIZE' && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-stone-500 mb-1">{t('command.strategize.hint')}</p>

                {/* Preset command: Move */}
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { dir: [0, 1] as [number, number], label: t('command.move.north'), icon: ChevronRight, cls: 'rotate-[-90deg]' },
                    { dir: [0, -1] as [number, number], label: t('command.move.south'), icon: ChevronRight, cls: 'rotate-90' },
                    { dir: [-1, 0] as [number, number], label: t('command.move.west'), icon: ChevronRight, cls: 'rotate-180' },
                    { dir: [1, 0] as [number, number], label: t('command.move.east'), icon: ChevronRight, cls: '' },
                  ].map(({ dir, label, icon: Icon, cls }) => (
                    <button key={label}
                      onClick={() => selectedUnit && selectedUnit.side === 'allied' && !selectedUnit.isFake && !selectedUnit.isRouted && handleMoveUnit(selectedUnit.id, ...dir)}
                      disabled={!selectedUnit || selectedUnit.side !== 'allied' || selectedUnit.isFake || selectedUnit.isRouted}
                      className="py-1.5 bg-stone-900 border border-stone-800 hover:border-emerald-500/30 text-stone-300 text-[9px] rounded flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-serif">
                      <Icon className={`w-2.5 h-2.5 ${cls}`} /> {label}
                    </button>
                  ))}
                </div>

                {/* Preset command: Attack targets */}
                {selectedUnit && selectedUnit.side === 'allied' && !selectedUnit.isFake && !selectedUnit.isRouted && (
                  <>
                    <div className="text-[8px] text-stone-600 uppercase tracking-wider pt-1">{t('command.attack.targets')}</div>
                    {activeUnits.filter(u => u.side === 'hostile' && !u.isRouted).slice(0, 3).map(enemy => {
                      const dist = haversineDistance(selectedUnit.lat, selectedUnit.lng, enemy.lat, enemy.lng);
                      return (
                        <button key={enemy.id} onClick={() => handleAttackUnit(selectedUnit.id, enemy.id)}
                          className="w-full py-1.5 bg-red-950/15 border border-red-500/20 hover:border-red-400 hover:bg-red-950/30 text-red-300 text-[10px] rounded flex items-center justify-between px-2 transition-colors">
                          <span className="flex items-center gap-1"><Crosshair className="w-3 h-3" />{enemy.name}</span>
                          <span className="text-stone-600 font-mono text-[9px]">{dist.toFixed(0)}km</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Preset command: Special */}
                <div className="text-[8px] text-stone-600 uppercase tracking-wider pt-1">{t('command.special')}</div>
                <div className="grid grid-cols-2 gap-1">
                  <button onClick={() => { const enemies = activeUnits.filter(u => u.side === 'hostile'); if (enemies[0]) handleScout(enemies[0].id); }}
                    disabled={activeUnits.filter(u => u.side === 'hostile').length === 0}
                    className="py-1.5 bg-blue-950/15 border border-blue-500/20 hover:border-blue-400 text-blue-300 text-[9px] rounded flex items-center justify-center gap-1 disabled:opacity-30 transition-colors font-serif">
                    <Eye className="w-2.5 h-2.5" /> {t('command.scout')}
                  </button>
                  <button
                    onClick={() => { const cutEdge = state.supplyGraph.edges.find(e => !e.isCut); if (cutEdge) handleCutSupply(cutEdge.id); }}
                    disabled={!state.supplyGraph.edges.some(e => !e.isCut)}
                    className="py-1.5 bg-amber-950/15 border border-amber-500/20 hover:border-amber-400 text-amber-300 text-[9px] rounded flex items-center justify-center gap-1 disabled:opacity-30 transition-colors font-serif">
                    <AlertTriangle className="w-2.5 h-2.5" /> {t('command.cutSupply')}
                  </button>
                </div>
              </div>
            )}

            {state.phase === 'RESOLVE' && (
              <div className="text-center">
                <button onClick={handleResolve} disabled={isExecuting}
                  className="w-full py-3 bg-gradient-to-r from-red-900/40 to-amber-900/40 border border-red-500/30 hover:border-red-400 text-red-200 font-serif font-black text-sm rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg">
                  {isExecuting ? (
                    <span className="w-4 h-4 border-2 border-red-200 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isExecuting ? t('command.resolve.executing') : t('command.resolve')}
                </button>
              </div>
            )}

            {state.phase === 'AFTERMATH' && (
              <p className="text-[10px] text-amber-400 font-serif text-center italic">
                {t('command.aftermath')}
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
              className="w-full py-2.5 bg-gradient-to-r from-[#8C2F39]/20 via-amber-900/20 to-[#8C2F39]/20 border border-[#8C2F39]/30 hover:border-amber-400/50 text-amber-200 font-serif font-black text-xs rounded flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-amber-900/20"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {state.phase === 'STRATEGIZE' ? t('command.resolve.idle') : `${t('command.nextPhase')}: ${phaseDescription(nextPhase(state.phase))}`}
            </button>
          )}

          {/* Weather indicator */}
          <div className="flex items-center justify-between text-[9px] text-stone-600 px-1">
            <span className="flex items-center gap-1">
              <Thermometer className="w-2.5 h-2.5" />
              {t('command.weather')}: {weather === 'CLEAR' ? t('command.weather.clear') : weather === 'RAIN' ? t('command.weather.rain') : weather === 'WIND' ? t('command.weather.wind') : t('command.weather.fog')}
            </span>
            <button onClick={() => {
              const cycle: Array<'CLEAR' | 'RAIN' | 'WIND' | 'FOG'> = ['CLEAR', 'RAIN', 'WIND', 'FOG'];
              const idx = cycle.indexOf(weather);
              setWeather(cycle[(idx + 1) % cycle.length]);
            }} className="text-stone-500 hover:text-stone-300 underline cursor-pointer">{t('command.weather.change')}</button>
          </div>
        </div>
      </div>

      {/* ── Combat Log (bottom) ── */}
      <div className="panel-bamboo-dark flex flex-col overflow-hidden" style={{ maxHeight: '180px' }}>
        <div className="bg-stone-900/80 backdrop-blur border-b border-stone-800 p-2 flex justify-between items-center z-10 flex-shrink-0">
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('log.title')}
          </span>
          <span className="text-[9px] text-stone-600">{state.combatLog.length} {t('log.count')}</span>
        </div>
        <div
          ref={combatLogRef}
          className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[10px] leading-relaxed"
        >
          {state.combatLog.length === 0 && (
            <p className="text-stone-600 text-center py-4 font-serif">{t('log.waiting')}</p>
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
                {t('victory.title')} · {state.victoryScore.rank}
              </h2>

              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { label: t('victory.rank.military'), value: state.victoryScore.categories.militaryDominance, icon: Swords },
                  { label: t('victory.rank.supply'), value: state.victoryScore.categories.supplyIntegrity, icon: Wheat },
                  { label: t('victory.rank.deception'), value: state.victoryScore.categories.deceptionEfficacy, icon: EyeOff },
                  { label: t('victory.rank.mandate'), value: state.victoryScore.categories.mandatePreservation, icon: Heart },
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
                  <RefreshCw className="w-4 h-4" /> {t('ui.retry')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}