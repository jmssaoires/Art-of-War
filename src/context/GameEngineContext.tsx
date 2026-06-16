import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, ReactNode } from 'react';
import type {
  GamePhase,
  GameTurn,
  UnifiedUnit,
  SupplyNode,
  SupplyEdge,
  ScoutReport,
  VictoryScore,
  ScenarioDefinition,
  ScenarioState,
} from '../types';

// ──────────────────────────────────────────────────────────
// Action types — the ONLY way to mutate game state
// ──────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'ADVANCE_TURN' }
  | { type: 'UPDATE_UNIT'; unitId: string; patch: Partial<UnifiedUnit> }
  | { type: 'ADD_UNIT'; unit: UnifiedUnit }
  | { type: 'REMOVE_UNIT'; unitId: string }
  | { type: 'CUT_SUPPLY_EDGE'; edgeId: string }
  | { type: 'RESTORE_SUPPLY_EDGE'; edgeId: string }
  | { type: 'SET_EDGE_FAKE'; edgeId: string; isFake: boolean }
  | { type: 'SUBMIT_SCOUT_REPORT'; report: ScoutReport }
  | { type: 'ADD_COMBAT_LOG'; message: string }
  | { type: 'SET_VICTORY_SCORE'; score: VictoryScore }
  | { type: 'LOAD_SCENARIO'; scenario: ScenarioDefinition }
  | { type: 'RESET_SCENARIO' }
  | { type: 'SET_COMPLETE'; score: VictoryScore };

// ──────────────────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────────────────

function createInitialState(): ScenarioState {
  return {
    scenarioId: '',
    turnNumber: 0,
    phase: 'DEPLOY' as GamePhase,
    units: [],
    supplyGraph: { nodes: [], edges: [] },
    scoutReports: [],
    combatLog: [],
    isComplete: false,
  };
}

function gameReducer(state: ScenarioState, action: GameAction): ScenarioState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'ADVANCE_TURN':
      return {
        ...state,
        turnNumber: state.turnNumber + 1,
        phase: 'STRATEGIZE' as GamePhase,
        scoutReports: [], // fresh reports each turn
      };

    case 'UPDATE_UNIT':
      return {
        ...state,
        units: state.units.map(u =>
          u.id === action.unitId ? { ...u, ...action.patch } : u
        ),
      };

    case 'ADD_UNIT':
      return { ...state, units: [...state.units, action.unit] };

    case 'REMOVE_UNIT':
      return {
        ...state,
        units: state.units.filter(u => u.id !== action.unitId),
      };

    case 'CUT_SUPPLY_EDGE':
      return {
        ...state,
        supplyGraph: {
          ...state.supplyGraph,
          edges: state.supplyGraph.edges.map(e =>
            e.id === action.edgeId ? { ...e, isCut: true } : e
          ),
        },
      };

    case 'RESTORE_SUPPLY_EDGE':
      return {
        ...state,
        supplyGraph: {
          ...state.supplyGraph,
          edges: state.supplyGraph.edges.map(e =>
            e.id === action.edgeId ? { ...e, isCut: false } : e
          ),
        },
      };

    case 'SET_EDGE_FAKE':
      return {
        ...state,
        supplyGraph: {
          ...state.supplyGraph,
          edges: state.supplyGraph.edges.map(e =>
            e.id === action.edgeId ? { ...e, isFake: action.isFake } : e
          ),
        },
      };

    case 'SUBMIT_SCOUT_REPORT':
      return {
        ...state,
        scoutReports: [...state.scoutReports, action.report],
      };

    case 'ADD_COMBAT_LOG':
      return {
        ...state,
        combatLog: [action.message, ...state.combatLog].slice(0, 200),
      };

    case 'SET_VICTORY_SCORE':
      return { ...state, victoryScore: action.score };

    case 'LOAD_SCENARIO':
      return {
        scenarioId: action.scenario.id,
        turnNumber: 0,
        phase: 'DEPLOY',
        units: action.scenario.initialUnits.map(u => ({ ...u })),
        supplyGraph: {
          nodes: action.scenario.supplyGraph.nodes.map(n => ({ ...n })),
          edges: action.scenario.supplyGraph.edges.map(e => ({ ...e })),
        },
        scoutReports: [],
        combatLog: [
          `【系统】场景「${action.scenario.name}」载入完毕。共 ${action.scenario.initialUnits.length} 支部队待命。`,
        ],
        isComplete: false,
        victoryScore: undefined,
      };

    case 'RESET_SCENARIO':
      return createInitialState();

    case 'SET_COMPLETE':
      return {
        ...state,
        isComplete: true,
        phase: 'AFTERMATH',
        victoryScore: action.score,
      };

    default:
      return state;
  }
}

// ──────────────────────────────────────────────────────────
// Context shape
// ──────────────────────────────────────────────────────────

interface GameEngineContextValue {
  state: ScenarioState;
  dispatch: React.Dispatch<GameAction>;
  isActive: boolean;
  /** Callback refs for external state sinks (e.g. dynastyFate update) */
  onScenarioComplete: ((score: VictoryScore) => void) | null;
  setOnScenarioComplete: (cb: ((score: VictoryScore) => void) | null) => void;
}

const GameEngineCtx = createContext<GameEngineContextValue>({
  state: createInitialState(),
  dispatch: () => {},
  isActive: false,
  onScenarioComplete: null,
  setOnScenarioComplete: () => {},
});

// ──────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────

export function GameEngineProvider({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const isActive = active;
  const onCompleteRef = useRef<((score: VictoryScore) => void) | null>(null);

  const setOnScenarioComplete = useCallback(
    (cb: ((score: VictoryScore) => void) | null) => {
      onCompleteRef.current = cb;
    },
    []
  );

  // When inactive, keep state clean (no overhead for other sandboxes)
  useEffect(() => {
    if (!active) {
      // Optionally reset state when leaving the scenario tab
      // dispatch({ type: 'RESET_SCENARIO' });
    }
  }, [active]);

  const value: GameEngineContextValue = {
    state,
    dispatch: isActive ? dispatch : (() => {}),
    isActive,
    onScenarioComplete: onCompleteRef.current,
    setOnScenarioComplete,
  };

  return (
    <GameEngineCtx.Provider value={value}>{children}</GameEngineCtx.Provider>
  );
}

// ──────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────

export function useGameEngine() {
  return useContext(GameEngineCtx);
}

// ──────────────────────────────────────────────────────────
// Persistence helpers (used by the scenario component)
// ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'weijiu-scenario-state';

export function saveScenarioState(state: ScenarioState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* quota exceeded — ignore */ }
}

export function loadScenarioState(): ScenarioState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function clearScenarioState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) { /* ignore */ }
}