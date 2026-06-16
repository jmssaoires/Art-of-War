export interface GddModule {
  id: string;
  number: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  summary: string;
  details: string[];
}

export type IdentityClass = 'REGENT' | 'CHANCELLOR' | 'EUNUCH' | 'SCHOLAR' | 'GENERAL' | 'MERCHANT' | 'STRATEGIST' | 'WANDERER';

export interface Character {
  name: string;
  identity: IdentityClass;
  generation: number;
  attributes: {
    authority: number; // 权力影响力
    prestige: number; // 声望名节
    wealth: number; // 财富
    dao: number; // 道义值
    military?: {
      command: number;
      bravery: number;
      tactics: number;
      training: number;
    };
  };
  flaw?: string;
  heritage?: string[];
}

// Court Trust Axis
export interface EunuchGameState {
  step: 'ROOKIE' | 'FAVORED' | 'DICTATOR' | 'CRISIS' | 'PURGED';
  emperorType: 'YOUTH' | '勤政明君' | '多疑暴君' | 'WEAK' | 'ROGUISH';
  yearsInPalace: number;
  dValue: number; // Dependency (0-100)
  sValue: number; // Suspicion (0-100, hidden)
  eunuchWealth: number;
  eunuchInfluence: number;
  cleansedWindowActive: boolean;
  courtLog: string[];
}

export interface QingliuActionState {
  phase: 'EVIDENCE' | 'OPINION' | 'BLOW';
  evidenceCollected: number; // 0-100
  publicOpinion: number; // 0-100
  courtAllies: number;
  activeLog: string[];
}

export interface UnitType {
  name: string;
  type: 'REGULAR' | 'SURPRISE'; // 正 or 奇
  count: number;
  morale: number; // 士气
}

export interface GeneralCharacter {
  name: string;
  command: number;
  bravery: number;
  tactics: number;
  training: number;
  flaw: '必死' | '必生' | '忿速' | '廉洁' | '爱民' | 'NONE';
  traits: string[];
}

export interface CombatState {
  attackerRegular: number;
  attackerSurprise: number;
  defenderRegular: number;
  defenderSurprise: number;
  terrain: 'SCATTERED' | 'LIGHT' | 'CONTENTIOUS' | 'FACILE' | 'FOCAL' | 'HEAVY' | 'ENTRAPPING' | 'FRONTIER' | 'DEATH'; // 九地
  weather: 'CLEAR' | 'RAIN' | 'WIND' | 'FOG';
  generalFlawTriggered: boolean;
  history: string[];
}

export interface SpyAgent {
  id: string;
  name: string;
  type: 'WHISPERER' | 'ASSASSIN' | 'COURTIER' | 'MAESTER' | 'DEFECTOR'; 
  cost: number;
  credibility: number; // 0-100
  motivation: 'POWER' | 'WEALTH' | 'REVENGE' | 'FEAR' | 'DEVOTION';
  loyalty: number; // 0-100
  isDiscovered: boolean;
  state: 'IDLE' | 'MISSION' | 'CAPTURED' | 'EXECUTED' | 'TURNED';
  location?: string;
  secretInfo?: string;
}

export interface DiplomaticNation {
  id: string;
  name: string;
  relationship: number; // -100 to +100
  distance: number; // 1-5 (far to close)
  treaty: 'NONE' | 'FRIENDLY' | 'NON_AGGRESSION' | 'ALLIANCE' | 'VASSAL';
  strength: number; // 1-10
}

export interface MarketCommodity {
  name: string;
  price: number;
  variance: number;
  supply: number; // 0-100
  demand: number; // 0-100
  historicalPrices: number[];
}

// ============================================================
// UNIFIED GAME ENGINE TYPES (Phase 0.1)
// Appended — no existing interfaces modified
// ============================================================

/** Four-phase turn structure for the unified game loop */
export type GamePhase = 'DEPLOY' | 'STRATEGIZE' | 'RESOLVE' | 'AFTERMATH';

export interface GameTurn {
  turnNumber: number;
  phase: GamePhase;
  timestamp: number;
}

/**
 * Unified Unit — the single source of truth for all map units.
 * Supersedes the simple MapUnit in firebase-blueprint.json
 * by adding isFake (CLAUDE.md core mechanic), morale, provisions,
 * routed/destroyed state, and combat stats.
 */
export interface UnifiedUnit {
  id: string;
  name: string;
  side: 'allied' | 'hostile';
  lat: number;
  lng: number;
  size: number;            // current manpower
  provisions: number;      // 0-100 supply level
  morale: number;          // 0-100 (锐气>=80, 惰气>=40, 归气<40)
  isFake: boolean;         // CLAUDE.md: deceptive decoy unit
  fakeDisguiseAsSize?: number;  // what the enemy sees
  fakeDisguiseAsName?: string;
  creatorUid: string;
  creatorName: string;
  // combat stats
  attackPower: number;
  defensePower: number;
  speed: number;
  // state flags
  isRouted: boolean;       // morale <= 0 → flees toward capital
  isDestroyed: boolean;    // size <= 0 → removed from play
}

/** Supply network node — a location that can source or relay provisions */
export interface SupplyNode {
  id: string;
  name: string;
  type: 'capital' | 'city' | 'pass' | 'depot';
  lat: number;
  lng: number;
}

/** Supply network edge — a link between two nodes that may be cut */
export interface SupplyEdge {
  id: string;
  source: string;          // SupplyNode.id
  target: string;          // SupplyNode.id
  isCut: boolean;          // physical severance (sabotage / enemy control)
  isFake: boolean;         // phantom supply line (visible to enemy, grants no real supply)
  capacity: number;        // max throughput (provisions per turn)
  currentFlow: number;     // actual flow this turn
}

/** Fog of War 2.0 — scout report for a single unit from enemy perspective */
export interface ScoutReport {
  unitId: string;
  reportedSize: number;
  reportedName: string;
  reportedSide: 'allied' | 'hostile' | 'unknown';
  confidence: number;      // 0-100; how reliable this report is
  isDeceived: boolean;     // true if an isFake unit fooled the scout
  scoutNarrative: string;
}

/** Whole Victory 4-category scoring */
export interface VictoryScore {
  totalScore: number;      // 0-100
  categories: {
    militaryDominance: number;    // 0-25: enemies destroyed / own troops preserved
    supplyIntegrity: number;      // 0-25: own supply maintained / enemy supply cut
    deceptionEfficacy: number;    // 0-25: fake units that fooled + spy successes
    mandatePreservation: number;  // 0-25: dynastyFate stability after scenario
  };
  rank: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  sunTzuQuote: string;
}

/**
 * Unified SpyAgent — reconciles the two incompatible SpyAgent interfaces
 * (one in types.ts, one in MultiplayerSandbox.tsx).
 */
export interface UnifiedSpyAgent {
  id: string;
  name: string;
  type: 'WHISPERER' | 'ASSASSIN' | 'COURTIER' | 'MAESTER' | 'DEFECTOR'
      | 'LOCAL' | 'INTERNAL' | 'DEATH' | 'ACTIVE_SURVIVING';
  cost: number;
  credibility: number;     // 0-100
  motivation: 'POWER' | 'WEALTH' | 'REVENGE' | 'FEAR' | 'DEVOTION'
            | 'MONEY' | 'HATRED' | 'IDEAL' | 'FORCED' | 'FAMILY';
  loyalty: number;         // 0-100
  isDiscovered: boolean;
  state: 'IDLE' | 'MISSION' | 'CAPTURED' | 'EXECUTED' | 'TURNED' | 'MARTYRED';
  location?: string;
  secretInfo?: string;
}

/** Scenario definition passed to GameEngineProvider */
export interface ScenarioDefinition {
  id: string;
  name: string;
  mapCenter: { lat: number; lng: number };
  initialUnits: UnifiedUnit[];
  supplyGraph: { nodes: SupplyNode[]; edges: SupplyEdge[] };
  alliedCapitalId: string;
  hostileCapitalId: string;
  maxTurns: number;
  victoryConditions: {
    description: string;
    check: (state: ScenarioState) => boolean;
  }[];
}

/** Full scenario state persisted to Firebase / localStorage */
export interface ScenarioState {
  scenarioId: string;
  turnNumber: number;
  phase: GamePhase;
  units: UnifiedUnit[];
  supplyGraph: { nodes: SupplyNode[]; edges: SupplyEdge[] };
  scoutReports: ScoutReport[];
  combatLog: string[];
  isComplete: boolean;
  victoryScore?: VictoryScore;
}
