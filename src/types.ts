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
  type: 'LOCAL' | 'INTERNAL' | '策反' | 'DEATH' | 'ACTIVE_SURVIVING'; // 五间: 乡、内、反、死、生
  cost: number;
  credibility: number; // 0-100
  motivation: 'MONEY' | 'HATRED' | 'IDEAL' | 'FORCED' | 'FAMILY';
  loyalty: number; // 0-100
  isDiscovered: boolean;
  state: 'IDLE' | 'MISSION' | 'CAPTURED' | 'MARTYRED';
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
