import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db, auth, loginAnonymously, handleFirestoreError, OperationType } from '../firebase';
import { 
  Users, 
  Sparkles, 
  ShieldAlert, 
  Crown, 
  Scroll, 
  Coins, 
  Flame, 
  Landmark, 
  Swords, 
  KeyRound, 
  Compass, 
  MessageSquare, 
  Send, 
  Trash2, 
  Info, 
  LogIn, 
  LogOut, 
  Plus, 
  RefreshCw, 
  UserPlus,
  Award,
  Calendar,
  Play,
  Pause,
  FastForward,
  TrendingUp,
  Wheat,
  Heart
} from 'lucide-react';

interface SharedRoomState {
  roomName: string;
  mandate: number;
  stability: number;
  coffers: number;
  emperorAge: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: any;
  updatedAt: any;
  enemyName?: string;
  enemyPower?: number;
  enemyMaxPower?: number;
  enemyMorale?: 'SHARP' | 'SLUGGISH' | 'RETREATING';
  enemyTerrain?: string;
  enemyFlaw?: string;
  ourRegular?: number;
  ourSurprise?: number;
  // Step 1 additions for Chronological and Environmental Ticker Engine
  gameYear?: number;
  gameSeason?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  timeSpeed?: 'PAUSED' | 'NORMAL' | 'FAST';
  agricultureIndex?: number;
  commerceIndex?: number;
  recentIncidents?: string[];
  hostId?: string;
  hostName?: string;
}

interface PlayerPresence {
  uid: string;
  username: string;
  role: string;
  online: boolean;
  joinedAt: any;
  contributionPoints?: number;
  actionsCount?: number;
  vigor?: number;
  lineageGeneration?: number;
  isDead?: boolean;
}

interface WarPlan {
  id: string;
  planner: string;
  plannerRole: string;
  strategyType: 'STRIKE' | 'DEFEND' | 'DEATH_RUSH';
  conditionSeason: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'ANY';
  description: string;
  effectText: string;
  triggeredCount: number;
  createdAt: any;
}

interface ScribeLog {
  id: string;
  text: string;
  username: string;
  role: string;
  timestamp: any;
}

interface SpyAgent {
  id: string;
  name: string;
  type: 'LOCAL' | 'INTERNAL' | '策反' | 'DEATH' | 'ACTIVE_SURVIVING';
  cost: number;
  credibility: number;
  motivation: 'MONEY' | 'HATRED' | 'IDEAL' | 'FORCED' | 'FAMILY';
  loyalty: number;
  isDiscovered: boolean;
  state: 'IDLE' | 'MISSION' | 'CAPTURED' | 'MARTYRED';
}

const FACTION_DEFINITIONS = [
  { 
    id: 'CHANCELLOR', 
    name: '咸阳相国 (Chancellor)', 
    desc: '百官之首，统御内政，精通赋税调阅与法家权术', 
    avatar: '🏮', 
    color: 'bg-purple-900 border-purple-400', 
    textColor: 'text-purple-400',
    decrees: [
      {
        id: 'CH_EXPAND_FAVORS',
        name: '📜 颁布《推恩令》',
        desc: '分割地方封邑，大幅稳固政治中枢，但耗资巨大',
        effectText: '大司农国库 -15000 贯，政治稳定度 +15 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          coffers: Math.max(0, state.coffers - 15000),
          stability: Math.min(100, state.stability + 15)
        }),
        log: '颁行名垂青史的《推恩令》，分削郡国诸侯，使天下英豪归流，朝堂政局趋于高度平稳，唯割补府库金银巨万。'
      },
      {
        id: 'CH_SOLOMON_GRAIN',
        name: '🌾 广开常平仓赈灾',
        desc: '开仓放粮收拢万民天命，可缓解反叛热潮',
        effectText: '天命值 +10 点，大司农国库 -8000 贯',
        apply: (state: SharedRoomState) => ({
          ...state,
          mandate: Math.min(100, state.mandate + 10),
          coffers: Math.max(0, state.coffers - 8000)
        }),
        log: '下令大开帝国常平义仓，放粮关外、安养流离饥民。黎庶仰颂神州盛德，天命值上升。'
      }
    ]
  },
  { 
    id: 'GENERAL', 
    name: '护国上将 (Grand General)', 
    desc: '掌兵马大权，戍卫边疆，善用奇正阵法，威震天下', 
    avatar: '⚔️', 
    color: 'bg-rose-950 border-rose-500', 
    textColor: 'text-rose-400',
    decrees: [
      {
        id: 'GEN_MARTIAL_LAW',
        name: '🛡️ 策行《军委锁止》',
        desc: '实行全面军事戒严，以铁腕恢复朝堂秩序，军用高昂',
        effectText: '大司农国库 -10000 贯，政治稳定度 +20 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          coffers: Math.max(0, state.coffers - 10000),
          stability: Math.min(100, state.stability + 20)
        }),
        log: '大将军下达咸阳军事宿卫戒严令，玄甲铁骑陈列各街市区角，以霹雳手段压制宵小叛乱苗头，政体强力重归铁血秩序。'
      },
      {
        id: 'GEN_CAMPAIGN',
        name: '🏹 发动灭国远征征伐',
        desc: '精锐开拔，开拓疆土极大地彰显皇恩天威',
        effectText: '天命值 +20 点，大司农国库 -20000 贯，政治稳定 -5 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          mandate: Math.min(100, state.mandate + 20),
          coffers: Math.max(0, state.coffers - 20000),
          stability: Math.max(0, state.stability - 5)
        }),
        log: '誓师远伐百越与北匈，铁甲洪流长枪如林，百战百捷。帝国开疆辟土，皇天厚土垂其荣光，宣威异域，朝廷威权天命倍增！'
      }
    ]
  },
  { 
    id: 'EUNUCH', 
    name: '内廷掌印 (Eunuch Regent)', 
    desc: '近侍天子，矫诏弄权，垄断宫禁密文，翻云覆雨', 
    avatar: '👁️', 
    color: 'bg-indigo-950 border-indigo-500', 
    textColor: 'text-indigo-400',
    decrees: [
      {
        id: 'EUN_FORGE_EDICT',
        name: '✍️ 矫造天子清算密诏',
        desc: '玩弄王法排除异己，趁机抄没财产充入外库，天下震动',
        effectText: '大司农国库 +25000 贯，政治稳定度 -15 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          coffers: state.coffers + 25000,
          stability: Math.max(0, state.stability - 15)
        }),
        log: '利用内廷朱砂御笔伪作惩贪中旨，强夺关外世家封邑资产并没入公库，中饱私囊，而朝堂百官自危、政体动荡惊心。'
      },
      {
        id: 'EUN_ELIXIR',
        name: '🧪 进奉“长生九转金丹”',
        desc: '进贡迷幻神仙药，掌控幼年或虚弱皇帝的命数',
        effectText: '幼帝年龄增加 +2 岁（幻梦速熟），大司农国库 -6000 贯',
        apply: (state: SharedRoomState) => ({
          ...state,
          emperorAge: state.emperorAge + 2,
          coffers: Math.max(0, state.coffers - 6000)
        }),
        log: '秘传方士向禁庭进奉太乙精金长生不老丹药。幼帝服用后终日处于仙阙幻旅，神明亢奋，身心呈衰颓拔节之势。'
      }
    ]
  },
  { 
    id: 'MERCHANT', 
    name: '神州巨贾 (Tycoon Guild)', 
    desc: '垄断山河盐铁，富可敌国，操纵天下物产命脉', 
    avatar: '🪙', 
    color: 'bg-amber-950 border-amber-600', 
    textColor: 'text-amber-400',
    decrees: [
      {
        id: 'MER_SALT_TAX',
        name: '🧂 代理盐政专卖转纳',
        desc: '巨贾垄断盐铁，将庞大特许专卖税银纳于政廷，但激增百姓负累',
        effectText: '大司农国库 +35000 贯，天命值 -10 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          coffers: state.coffers + 35000,
          mandate: Math.max(0, state.mandate - 10)
        }),
        log: '大商买断江南盐铁官专卖权，将巨量承包银两一次性纳入司农银库。虽然府廷金库富足，但黎民苦于高盐价，民间怨言升腾。'
      },
      {
        id: 'MER_BAILOUT',
        name: '🏮 捐资纾难平赋税',
        desc: '巨富捐输万金为社稷平息赋税，买取民间万世万代名节',
        effectText: '天命值 +15 点，政治稳定 +10 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          mandate: Math.min(100, state.mandate + 15),
          stability: Math.min(100, state.stability + 10)
        }),
        log: '盖世商会自损私藏金银三万金，向朝廷捐赠毁家纾难，使关中免于岁赋。万民欢歌颂德，社稷社稷稳态固若磐石。'
      }
    ]
  },
  { 
    id: 'STRATEGIST', 
    name: '连横策士 (Lobbyist Envoy)', 
    desc: '纵横捭阖，三寸不烂之舌，操纵六国攻伐制衡之术', 
    avatar: '🗺️', 
    color: 'bg-emerald-950 border-emerald-500', 
    textColor: 'text-emerald-400',
    decrees: [
      {
        id: 'STR_PACIFY',
        name: '🤝 促成合纵修好盟约',
        desc: '耗费微赀疏通六国重臣，缔结百年修好条约，安宁边陲',
        effectText: '政治稳定 +15 点，大司农国库 -5000 贯',
        apply: (state: SharedRoomState) => ({
          ...state,
          stability: Math.min(100, state.stability + 15),
          coffers: Math.max(0, state.coffers - 5000)
        }),
        log: '策士单车入六国朝堂，口若悬河，促成列土盟约。边陲安防息兵，庙宇社稷不战而固，国库开销极其微茫。'
      },
      {
        id: 'STR_DIVIDE_RULE',
        name: '⛓️ 施展离间反间秘谋',
        desc: '在天下诸侯间散布诡谲，使列国相互猜忌消耗，拱卫咸阳天权',
        effectText: '天命值 +12 点，大司农国库 -6000 贯',
        apply: (state: SharedRoomState) => ({
          ...state,
          mandate: Math.min(100, state.mandate + 12),
          coffers: Math.max(0, state.coffers - 6000)
        }),
        log: '策士布设暗钱，反间山东六地刺史和豪族，诸侯陷于相互指引内讧。朝廷无后顾之忧，尊严与天命大著。'
      }
    ]
  },
  { 
    id: 'REBEL', 
    name: '起义豪侠 (Rebel Commandant)', 
    desc: '斩木为兵，揭竿而起，视君王为土芥，以太行天险为凭', 
    avatar: '🔥', 
    color: 'bg-amber-900 border-amber-500', 
    textColor: 'text-amber-500',
    decrees: [
      {
        id: 'REB_RISE_UP',
        name: '📢 揭竿唱诺，烽火燎原',
        desc: '号召黔首饥民，掀起颠覆性的破袭，瓦解朝廷统治支柱',
        effectText: '政治稳定度 -25 点，天命值 +20 点（顺应天道民心）',
        apply: (state: SharedRoomState) => ({
          ...state,
          stability: Math.max(0, state.stability - 25),
          mandate: Math.min(100, state.mandate + 20)
        }),
        log: '义军领袖登高一呼，万千饥民揭竿响应。州郡关隘告急，朝廷封建官僚体系遭受重大动摇，革命怒潮冲击庙堂。'
      },
      {
        id: 'REB_RAID_GRANARY',
        name: '🏹 凿城掠夺官仓，劫富济贫',
        desc: '攻破地方官署并开掘司农粮仓，散尽金银，摧毁政廷财富基石',
        effectText: '大司农国库 -20000 贯，天命值 +10 点',
        apply: (state: SharedRoomState) => ({
          ...state,
          coffers: Math.max(0, state.coffers - 20000),
          mandate: Math.min(100, state.mandate + 10)
        }),
        log: '义军敢死队月夜奇击，攻占大郡常平仓，大举开仓分发金银给天下流民。朝府财富受重挫，而义旗民望高照。'
      }
    ]
  }
];

const PRESET_DIPLOMATIC_MESSAGES = [
  '【提议结盟】：“诸公休戚与共，合纵共御内患，大事可成！”',
  '【密谋暗弹】：“朝中某人横行跋扈，吾等应当联手密奏削其职权！”',
  '【勤王保驾】：“逆臣猖獗，天下有识之士当举戈入关勤王！”',
  '【讨寇靖乱】：“流民叛乱，朝政崩阻，大军听令，即刻移往剿除！”'
];

interface ActionHistoryItem {
  type: 'DECREE' | 'MESSAGE' | 'JOIN' | 'TACTICS';
  description: string;
  impact?: string;
  timestamp: string;
  eraName: string;
}

const getEraName = (emperorAge: number | undefined) => {
  const age = emperorAge || 14;
  if (age < 13) return `秦先王世`;
  const year = age - 12;
  return `秦王政 ${year} 年`;
};

const getRankTitle = (roleId: string, points: number) => {
  const pts = points || 0;
  if (roleId === 'CHANCELLOR') {
    if (pts >= 200) return '一品辅国上相';
    if (pts >= 100) return '朝堂上卿执宰';
    if (pts >= 50) return '御史中丞大夫';
    if (pts >= 20) return '参知政事郎';
    return '候选议曹少尹';
  }
  if (roleId === 'GENERAL') {
    if (pts >= 200) return '朝廷大司马元帅';
    if (pts >= 100) return '护国金吾大将';
    if (pts >= 50) return '骁骑振威将军';
    if (pts >= 20) return '平寇折冲校尉';
    return '御林羽林百夫长';
  }
  if (roleId === 'EUNUCH') {
    if (pts >= 200) return '秉笔太监总管';
    if (pts >= 100) return '内廷常侍侍郎';
    if (pts >= 50) return '司礼监少监都监';
    if (pts >= 20) return '掌扇传诏少监';
    return '掖庭洒扫侍者';
  }
  if (roleId === 'MERCHANT') {
    if (pts >= 200) return '神州盐铁商会大财阀';
    if (pts >= 100) return '富可敌国关中巨贾';
    if (pts >= 50) return '钱庄典当大掌柜';
    if (pts >= 20) return '川蜀马帮大队长';
    return '咸阳临街沿街商贩';
  }
  if (roleId === 'STRATEGIST') {
    if (pts >= 200) return '纵横捭阖鬼谷师祖';
    if (pts >= 100) return '咸阳第一金印客卿';
    if (pts >= 50) return '诸侯说客说客大夫';
    if (pts >= 20) return '执简游学策士书生';
    return '关外求仕之寒生';
  }
  if (roleId === 'REBEL') {
    if (pts >= 200) return '覆天起义义王';
    if (pts >= 100) return '太行羽绿林总首领';
    if (pts >= 50) return '揭竿折冲大都统';
    if (pts >= 20) return '劫掠公仓先锋百夫长';
    return '亡命斩木反秦豪侠';
  }
  return '关中布衣庶民';
};

const getRankProgress = (points: number) => {
  const thresholds = [0, 20, 50, 100, 200];
  let currentLevelMin = 0;
  let nextLevelMax = 20;
  
  for (let i = 0; i < thresholds.length; i++) {
    if (points >= thresholds[i]) {
      currentLevelMin = thresholds[i];
      nextLevelMax = thresholds[i + 1] || 999;
    }
  }
  
  if (points >= 200) {
    return {
      percent: 100,
      nextPoints: 0,
      currentPointsInLevel: points - 200,
      levelMaxPoints: 100
    };
  }
  
  const levelMaxPoints = nextLevelMax - currentLevelMin;
  const currentPointsInLevel = points - currentLevelMin;
  const percent = Math.min(100, Math.floor((currentPointsInLevel / levelMaxPoints) * 100));
  
  return {
    percent,
    nextPoints: nextLevelMax - points,
    currentPointsInLevel,
    levelMaxPoints
  };
};

export default function MultiplayerSandbox({ 
  onSyncState 
}: { 
  onSyncState?: (stats: { mandate: number; stability: number; coffers: number }) => void 
}) {
  // Authentication & Presence State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [customName, setCustomName] = useState<string>('');
  const [selectedFactionId, setSelectedFactionId] = useState<string>('CHANCELLOR');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Multiplayer Room State
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [roomConfigLocal, setRoomConfigLocal] = useState<string>('咸阳天命总坛');
  const [roomInput, setRoomInput] = useState<string>('xianyang-lobby');
  const [roomState, setRoomState] = useState<SharedRoomState | null>(null);
  const [playersList, setPlayersList] = useState<PlayerPresence[]>([]);
  const [activityLogs, setActivityLogs] = useState<ScribeLog[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');

  // Sub-tab state for tactics vs Decrees vs Profile vs Espionage
  const [subTab, setSubTab] = useState<'decrees' | 'profile' | 'tactics' | 'war_room' | 'spy_agency'>('tactics');
  
  // War Plans
  const [warPlans, setWarPlans] = useState<WarPlan[]>([]);
  
  // Step 3 additions for Espionage & Spies System
  const [spiesList, setSpiesList] = useState<SpyAgent[]>([]);
  const [newSpyName, setNewSpyName] = useState<string>('');
  const [newSpyType, setNewSpyType] = useState<'LOCAL' | 'INTERNAL' | '策反' | 'DEATH' | 'ACTIVE_SURVIVING'>('LOCAL');
  const [newSpyMotivation, setNewSpyMotivation] = useState<'MONEY' | 'HATRED' | 'IDEAL' | 'FORCED' | 'FAMILY'>('MONEY');
  const [newSpyLocationKey, setNewSpyLocationKey] = useState<string>('XIANYANG');

  // Local Personal Profile state & succession state variables
  const [successorNameInput, setSuccessorNameInput] = useState<string>('');
  const [heritageGift, setHeritageGift] = useState<'TREASURY_BONUS' | 'STABILITY_BONUS' | 'NONE'>('TREASURY_BONUS');
  
  // War Plan creation variables
  const [newPlanStrategy, setNewPlanStrategy] = useState<'STRIKE' | 'DEFEND'>('STRIKE');
  const [newPlanSeason, setNewPlanSeason] = useState<'ANY' | 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER'>('ANY');
  const [newPlanDesc, setNewPlanDesc] = useState<string>('');

  // Local Personal Profile & Timeline Chronological state
  const [localChronicle, setLocalChronicle] = useState<ActionHistoryItem[]>([]);

  // Option 1: Map Unit Synchronization & Deployment states
  const [mapUnitsList, setMapUnitsList] = useState<any[]>([]);
  const [deployMapUnitName, setDeployMapUnitName] = useState<string>('');
  const [deployMapUnitSize, setDeployMapUnitSize] = useState<number>(10000);
  const [deployMapUnitSide, setDeployMapUnitSide] = useState<'allied' | 'hostile'>('allied');
  const [deployBattlefieldPreset, setDeployBattlefieldPreset] = useState<string>('XIANYANG');

  // System States
  const [isActionCooldown, setIsActionCooldown] = useState<boolean>(false);
  const [isLobbyListLoading, setIsLobbyListLoading] = useState<boolean>(false);
  const [systemAlert, setSystemAlert] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Framer Motion shimmer/glow trigger states and refs
  const prevMandateRef = useRef<number | null>(null);
  const prevStabilityRef = useRef<number | null>(null);
  const prevCoffersRef = useRef<number | null>(null);
  const prevEmperorAgeRef = useRef<number | null>(null);

  const [mandateFlash, setMandateFlash] = useState<boolean>(false);
  const [stabilityFlash, setStabilityFlash] = useState<boolean>(false);
  const [coffersFlash, setCoffersFlash] = useState<boolean>(false);
  const [emperorAgeFlash, setEmperorAgeFlash] = useState<boolean>(false);

  useEffect(() => {
    if (!roomState) return;
    if (prevMandateRef.current !== null && Math.abs(roomState.mandate - prevMandateRef.current) >= 2) {
      setMandateFlash(true);
      const t = setTimeout(() => setMandateFlash(false), 1500);
      return () => clearTimeout(t);
    }
    prevMandateRef.current = roomState.mandate;
  }, [roomState?.mandate]);

  useEffect(() => {
    if (!roomState) return;
    if (prevStabilityRef.current !== null && Math.abs(roomState.stability - prevStabilityRef.current) >= 2) {
      setStabilityFlash(true);
      const t = setTimeout(() => setStabilityFlash(false), 1500);
      return () => clearTimeout(t);
    }
    prevStabilityRef.current = roomState.stability;
  }, [roomState?.stability]);

  useEffect(() => {
    if (!roomState) return;
    if (prevCoffersRef.current !== null && Math.abs(roomState.coffers - prevCoffersRef.current) >= 10) {
      setCoffersFlash(true);
      const t = setTimeout(() => setCoffersFlash(false), 1500);
      return () => clearTimeout(t);
    }
    prevCoffersRef.current = roomState.coffers;
  }, [roomState?.coffers]);

  useEffect(() => {
    if (!roomState) return;
    if (prevEmperorAgeRef.current !== null && Math.abs(roomState.emperorAge - prevEmperorAgeRef.current) >= 1) {
      setEmperorAgeFlash(true);
      const t = setTimeout(() => setEmperorAgeFlash(false), 1500);
      return () => clearTimeout(t);
    }
    prevEmperorAgeRef.current = roomState.emperorAge;
  }, [roomState?.emperorAge]);

  // Load and initialize local action history (personal chronicle)
  useEffect(() => {
    if (!activeRoomId || !currentUser) {
      setLocalChronicle([]);
      return;
    }
    const key = `dynasty-chronicle-${activeRoomId}-${currentUser.uid}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setLocalChronicle(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local chronicle history:', e);
      }
    } else {
      const initialHistory: ActionHistoryItem[] = [{
        type: 'JOIN',
        description: `拜将入相，宣誓加入朝廷推演沙盒大阵！`,
        impact: `受赐金符代天临凡，开启政道征途`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        eraName: getEraName(roomState?.emperorAge || 14)
      }];
      setLocalChronicle(initialHistory);
      localStorage.setItem(key, JSON.stringify(initialHistory));
    }
  }, [activeRoomId, currentUser]);

  const saveActionToLocalChronicle = (type: 'DECREE' | 'MESSAGE' | 'JOIN' | 'TACTICS', desc: string, impact: string, empAge: number) => {
    if (!activeRoomId || !currentUser) return;
    const key = `dynasty-chronicle-${activeRoomId}-${currentUser.uid}`;
    const item: ActionHistoryItem = {
      type,
      description: desc,
      impact,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      eraName: getEraName(empAge)
    };
    
    setLocalChronicle(prev => {
      const next = [item, ...prev];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        // Default anonymous display names to something dynastic
        if (!user.displayName) {
          setCustomName(user.displayName || `布衣九五_${user.uid.slice(0, 5)}`);
        } else {
          setCustomName(user.displayName);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Listen to Room States & players & log streams when Room joins
  useEffect(() => {
    if (!activeRoomId) return;

    // 1. Listen to shared counters
    const roomDocRef = doc(db, 'rooms', activeRoomId);
    const unsubRoom = onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SharedRoomState;
        setRoomState(data);
        if (onSyncState) {
          onSyncState({
            mandate: data.mandate,
            stability: data.stability,
            coffers: data.coffers
          });
        }
      } else {
        // If the room doesn't exist yet, we attempt to initialize it safely
        const defaultRoom: SharedRoomState = {
          roomName: roomConfigLocal || '咸阳大本营',
          mandate: 78,
          stability: 82,
          coffers: 45000,
          emperorAge: 14,
          status: 'ACTIVE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          enemyName: '塞外匈奴单于铁骑（精锐）',
          enemyPower: 45000,
          enemyMaxPower: 45000,
          enemyMorale: 'SHARP',
          enemyTerrain: 'KEY',
          enemyFlaw: 'TEMPERED',
          ourRegular: 35000,
          ourSurprise: 12000,
          // Step 1: Initial temporal and environmental states
          gameYear: 230,
          gameSeason: 'SPRING',
          timeSpeed: 'NORMAL',
          agricultureIndex: 60,
          commerceIndex: 50,
          recentIncidents: ['【始计演化】秦皇受天命继位，神州风调雨顺，百家争鸣，大业始封！'],
          hostId: '',
          hostName: '天机代行主持中'
        };
        try {
          setDoc(roomDocRef, defaultRoom);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `rooms/${activeRoomId}`);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${activeRoomId}`);
    });

    // 2. Listen to active player players (Active Presence List)
    const playersColRef = collection(db, 'rooms', activeRoomId, 'players');
    const unsubPlayers = onSnapshot(playersColRef, (snap) => {
      const players: PlayerPresence[] = [];
      snap.forEach((d) => {
        players.push(d.data() as PlayerPresence);
      });
      // Sort players by joined time
      players.sort((a, b) => {
        const t1 = a.joinedAt?.seconds || 0;
        const t2 = b.joinedAt?.seconds || 0;
        return t1 - t2;
      });
      setPlayersList(players);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `rooms/${activeRoomId}/players`);
    });

    // 3. Listen to activity logs
    const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
    const qLogs = query(logsColRef, orderBy('timestamp', 'desc'), limit(30));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const logs: ScribeLog[] = [];
      snap.forEach((docRef) => {
        const item = docRef.data();
        logs.push({
          id: docRef.id,
          text: item.text,
          username: item.username,
          role: item.role,
          timestamp: item.timestamp
        });
      });
      setActivityLogs(logs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `rooms/${activeRoomId}/logs`);
    });

    // 3b. Listen to active war plans
    const warPlansColRef = collection(db, 'rooms', activeRoomId, 'war_plans');
    const qWarPlans = query(warPlansColRef, orderBy('createdAt', 'desc'), limit(30));
    const unsubWarPlans = onSnapshot(qWarPlans, (snap) => {
      const plans: WarPlan[] = [];
      snap.forEach((docRef) => {
        const item = docRef.data();
        plans.push({
          id: docRef.id,
          planner: item.planner,
          plannerRole: item.plannerRole,
          strategyType: item.strategyType,
          conditionSeason: item.conditionSeason,
          description: item.description,
          effectText: item.effectText,
          triggeredCount: item.triggeredCount || 0,
          createdAt: item.createdAt
        });
      });
      setWarPlans(plans);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `rooms/${activeRoomId}/war_plans`);
    });

    // 3c. Listen to active spies (Step 3 addition)
    const spiesColRef = collection(db, 'rooms', activeRoomId, 'spies');
    const unsubSpies = onSnapshot(spiesColRef, (snap) => {
      const spies: SpyAgent[] = [];
      snap.forEach((docRef) => {
        const item = docRef.data();
        spies.push({
          id: docRef.id,
          name: item.name,
          type: item.type,
          cost: item.cost,
          credibility: item.credibility,
          motivation: item.motivation,
          loyalty: item.loyalty,
          isDiscovered: item.isDiscovered || false,
          state: item.state || 'IDLE'
        });
      });
      setSpiesList(spies);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `rooms/${activeRoomId}/spies`);
    });

    // Option 1: Map Unit Synchronization & live updates
    const mapUnitsColRef = collection(db, 'rooms', activeRoomId, 'mapUnits');
    const unsubMapUnits = onSnapshot(mapUnitsColRef, (snap) => {
      const units: any[] = [];
      snap.forEach((docRef) => {
        const item = docRef.data();
        units.push({
          id: docRef.id,
          name: item.name,
          side: item.side,
          lat: item.lat,
          lng: item.lng,
          size: item.size,
          creatorUid: item.creatorUid,
          creatorName: item.creatorName
        });
      });
      setMapUnitsList(units);
    }, (err) => {
      console.error("Failed to map live units:", err);
    });

    // 4. Track local user presence online in Room collection
    if (currentUser) {
      registerPlayerPresence(activeRoomId, currentUser.uid, customName, selectedFactionId);
    }

    return () => {
      unsubRoom();
      unsubWarPlans();
      unsubSpies();
      unsubPlayers();
      unsubLogs();
      unsubMapUnits();
    };
  }, [activeRoomId, currentUser]);

  // Handle automatic scrolling for logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLogs]);

  // ==================== Step 1 Code: Temporal Consensus & Ticker Engine ====================
  const onlinePlayers = playersList.filter(p => p.online);
  const hostPlayer = onlinePlayers.length > 0 
    ? [...onlinePlayers].sort((a, b) => a.uid.localeCompare(b.uid))[0] 
    : null;
  const isHost = hostPlayer && currentUser && hostPlayer.uid === currentUser.uid;

  // Sync hostId & hostName info to the shared db once consensus changes
  useEffect(() => {
    if (!activeRoomId || !roomState || !isHost) return;
    if (roomState.hostId !== currentUser?.uid) {
      const roomDocRef = doc(db, 'rooms', activeRoomId);
      updateDoc(roomDocRef, {
        hostId: currentUser.uid,
        hostName: customName || `大司马策士_${currentUser.uid.slice(0, 4)}`,
        updatedAt: serverTimestamp()
      }).catch(err => console.error('Failed to sync host role:', err));
    }
  }, [isHost, activeRoomId, roomState?.hostId]);

  // Host ticker runs interval based on speed and updates seasonal dynamics
  useEffect(() => {
    if (!activeRoomId || !roomState || !isHost) return;
    if (roomState.timeSpeed === 'PAUSED') return;

    const intervalMs = roomState.timeSpeed === 'FAST' ? 4000 : 8000;

    const handleTick = async () => {
      // Advance Season: Spring -> Summer -> Autumn -> Winter
      const seasons: ('SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER')[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
      const currentSeason = roomState.gameSeason || 'SPRING';
      const currentIndex = seasons.indexOf(currentSeason);
      const nextIndex = (currentIndex + 1) % 4;
      const nextSeason = seasons[nextIndex];
      
      let nextYear = roomState.gameYear !== undefined ? roomState.gameYear : 230;
      let nextEmperorAge = roomState.emperorAge;
      if (nextSeason === 'SPRING') {
        nextYear -= 1; // BC decreases as time moves forward (230 BC -> 229 BC)
        nextEmperorAge += 1; // emperor grows older
      }

      // Base indicators
      let nextMandate = roomState.mandate;
      let nextStability = roomState.stability;
      let nextCoffers = roomState.coffers;
      let nextAgri = roomState.agricultureIndex !== undefined ? roomState.agricultureIndex : 60;
      let nextComm = roomState.commerceIndex !== undefined ? roomState.commerceIndex : 50;
      
      let incidentLog = '';
      let impactText = '';

      // Perform seasonal financial accounting & out-of-battle micro environment simulation
      if (nextSeason === 'SPRING') {
        const seedCost = 2500;
        nextCoffers = Math.max(0, nextCoffers - seedCost);
        nextAgri = Math.min(100, nextAgri + 6);
        incidentLog = `🌸 【秦政纪元：公元前 ${nextYear} 年・春分】春耕始盛。大司农官仓拨发 ${seedCost} 贯购办铁犁耕牛，深翻阡陌陆田。`;
        impactText = `大司农帑银支出 ${seedCost} 贯，社稷农业指数上升 +6点`;
      } 
      else if (nextSeason === 'SUMMER') {
        const roll = Math.random();
        if (roll < 0.35) {
          const floodCost = 3500;
          nextStability = Math.max(0, nextStability - 14);
          nextMandate = Math.max(0, nextMandate - 8);
          incidentLog = `🌊 【秦政纪元：公元前 ${nextYear} 年・夏至】暴雨冲绝泾河两岸。河渠决口，关中、汉中两郡千顷沃土沦为泽国。`;
          impactText = `暴风水荒！朝政稳定度下降 -14 点，天心天命下降 -8 点`;
        } else {
          const tradeGain = Math.round(nextComm * 150);
          nextCoffers += tradeGain;
          nextComm = Math.min(100, nextComm + 3);
          incidentLog = `⚓ 【秦政纪元：公元前 ${nextYear} 年・夏至】六国商旅载谷通商。关西临淄、九江巨贾往来，商路水运大兴。`;
          impactText = `夏日商榷，司农大收天下关塞商税 +${tradeGain} 贯，商业繁荣度提升`;
        }
      } 
      else if (nextSeason === 'AUTUMN') {
        // Harvest proportional to agricultural development and mandate (peasant satisfaction!)
        const harvestBase = nextAgri * 350;
        const mandateMultiplier = nextMandate / 100;
        const totalHarvest = Math.round(harvestBase * (0.6 + mandateMultiplier));
        nextCoffers += totalHarvest;
        
        if (Math.random() > 0.7) {
          nextStability = Math.min(100, nextStability + 6);
          nextMandate = Math.min(100, nextMandate + 4);
          incidentLog = `🌾 【秦政纪元：公元前 ${nextYear} 年・秋分】仲秋神州大熟，五谷压仓。咸阳瑞云见兆，百姓安乐。`;
          impactText = `社稷大岁收！国家岁得税赋银钱 +${totalHarvest} 贯，稳定 +6，天命天心 +4！`;
        } else {
          incidentLog = `🌾 【秦政纪元：公元前 ${nextYear} 年・秋分】秋收开征。郡县流官督办赋税课役，漕粮归水。`;
          impactText = `税征归仓，大司农帑银进账 +${totalHarvest} 贯。`;
        }
      } 
      else if (nextSeason === 'WINTER') {
        const militaryCount = (roomState.ourRegular || 35000) + (roomState.ourSurprise || 12000);
        const upkeepCost = Math.round(militaryCount * 0.12);
        
        if (nextCoffers >= upkeepCost) {
          nextCoffers -= upkeepCost;
          incidentLog = `❄️ 【秦政纪元：公元前 ${nextYear} 年・冬至】大雪降临。发配朔北方阵、辽东关卡营垒冬散饷两钱袍服 ${upkeepCost} 贯。`;
          impactText = `三军饷劳按律发放，大兵不乱，边塞防线固若金汤。`;
        } else {
          // Destabilize army
          nextStability = Math.max(0, nextStability - 20);
          nextMandate = Math.max(0, nextMandate - 12);
          const unpaid = upkeepCost - nextCoffers;
          nextCoffers = 0;
          
          let regularFlee = Math.round((roomState.ourRegular || 35000) * 0.15);
          let surpriseFlee = Math.round((roomState.ourSurprise || 12000) * 0.15);
          
          roomState.ourRegular = Math.max(8000, (roomState.ourRegular || 35000) - regularFlee);
          roomState.ourSurprise = Math.max(2000, (roomState.ourSurprise || 12000) - surpriseFlee);
          
          incidentLog = `⚠️ 【秦政纪元：公元前 ${nextYear} 年・冬至】岁饷缺口巨漏！府库赤字空虚，无法开支冬役兵食，边塞戌卒哗逃落草！`;
          impactText = `拖负军费！稳定狂漏 -20点，天命 -12点！朝廷锐卒损耗：正兵逃亡 -${regularFlee}，羽林离营 -${surpriseFlee}！`;
        }
      }

      // Step 3 Integration: Query active Surviving Spies to reward continuous coffer profits
      const spiesSnapshot = await getDocs(collection(db, 'rooms', activeRoomId, 'spies'));
      const activeSurvivingSpies = spiesSnapshot.docs.filter(
        d => d.data().type === 'ACTIVE_SURVIVING' && d.data().state === 'IDLE'
      );
      const spyBonus = activeSurvivingSpies.length * 2000;
      if (spyBonus > 0) {
        nextCoffers += spyBonus;
        incidentLog += ` 👁️ 【生间回偿】我朝生间斥候成功盗取垄断敌寇私军饷金 +${spyBonus} 贯充实府库！`;
        impactText += ` 生间筹资 +${spyBonus} 贯`;
      }

      nextMandate = Math.max(0, Math.min(100, nextMandate));
      nextStability = Math.max(0, Math.min(100, nextStability));

      const recentArr = roomState.recentIncidents || [];
      const updatedIncidents = [
        `[${nextSeason === 'SPRING' ? '春分' : nextSeason === 'SUMMER' ? '夏至' : nextSeason === 'AUTUMN' ? '秋分' : '冬至'}] ${incidentLog.split('】')[1]} ${impactText}`,
        ...recentArr
      ].slice(0, 8);

      const roomDocRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomDocRef, {
        gameYear: nextYear,
        gameSeason: nextSeason,
        emperorAge: nextEmperorAge,
        mandate: nextMandate,
        stability: nextStability,
        coffers: nextCoffers,
        agricultureIndex: nextAgri,
        commerceIndex: nextComm,
        recentIncidents: updatedIncidents,
        ourRegular: roomState.ourRegular !== undefined ? roomState.ourRegular : 35000,
        ourSurprise: roomState.ourSurprise !== undefined ? roomState.ourSurprise : 12000,
        updatedAt: serverTimestamp()
      });

      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `${incidentLog} ✨（其果：${impactText}）`,
        username: '【圣皇紫微太史】',
        role: '天明律历天元神盘',
        timestamp: serverTimestamp()
      });
    };

    const timer = setInterval(() => {
      handleTick();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isHost, activeRoomId, roomState?.gameSeason, roomState?.gameYear, roomState?.timeSpeed, roomState?.emperorAge, roomState?.agricultureIndex, roomState?.commerceIndex, roomState?.coffers, roomState?.stability, roomState?.mandate, roomState?.ourRegular, roomState?.ourSurprise, roomState?.recentIncidents]);

  const registerPlayerPresence = async (roomId: string, uid: string, name: string, roleCode: string) => {
    try {
      const pDoc = doc(db, 'rooms', roomId, 'players', uid);
      const snap = await getDoc(pDoc);
      let initialPoints = 0;
      let initialCount = 0;
      let initialVigor = 100;
      let initialLineage = 1;
      let initialIsDead = false;
      if (snap.exists()) {
        const data = snap.data();
        initialPoints = data.contributionPoints || 0;
        initialCount = data.actionsCount || 0;
        initialVigor = data.vigor !== undefined ? data.vigor : 100;
        initialLineage = data.lineageGeneration || 1;
        initialIsDead = data.isDead || false;
      }
      
      await setDoc(pDoc, {
        uid,
        username: name || `流沙策士_${uid.slice(0, 4)}`,
        role: roleCode,
        online: true,
        joinedAt: serverTimestamp(),
        contributionPoints: initialPoints,
        actionsCount: initialCount,
        vigor: initialVigor,
        lineageGeneration: initialLineage,
        isDead: initialIsDead
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `rooms/${roomId}/players/${uid}`);
    }
  };

  const handleCustomLoginAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setLoginError('请输入执政推演雅号！');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const formattedName = customName.trim();
      const user = await loginAnonymously(formattedName);
      // Wait for auth update
      const lobbyId = roomInput.trim().toLowerCase() || 'xianyang-lobby';
      setActiveRoomId(lobbyId);
    } catch (err: any) {
      setLoginError(`鉴权大印开启失败: ${err.message || err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    // Set offline in current room before disconnect
    if (activeRoomId && currentUser) {
      try {
        const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        await setDoc(pDoc, {
          uid: currentUser.uid,
          username: customName,
          role: selectedFactionId,
          online: false,
          joinedAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Failed to set offline state prior to logout:', e);
      }
    }
    await auth.signOut();
    setActiveRoomId('');
    setRoomState(null);
  };

  const handleExecuteDecree = async (decree: any, faction: any) => {
    if (!activeRoomId || !roomState || isActionCooldown) return;

    // Check player health state
    if (currentUser) {
      const myP = playersList.find(p => p.uid === currentUser.uid);
      if (myP?.isDead) {
        setSystemAlert('🚨 悲怆！您当前的主政官家臣已经伤重殉国，请速去“主政官阶档案”页签举行继承尊典嗣位重来！');
        return;
      }
    }
    
    setIsActionCooldown(true);
    setTimeout(() => setIsActionCooldown(false), 2500); // 2.5s cooldown

    try {
      // 1. Calculate altered state
      const nextState = decree.apply(roomState);
      const roomDocRef = doc(db, 'rooms', activeRoomId);
      
      // Update shared database
      await updateDoc(roomDocRef, {
        mandate: nextState.mandate,
        stability: nextState.stability,
        coffers: nextState.coffers,
        emperorAge: nextState.emperorAge,
        updatedAt: serverTimestamp()
      });

      // 2. Log action to real-time chronological stream
      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `【${faction.avatar} ${faction.name} / ${customName}】发出：${decree.log}（影响：${decree.effectText}）`,
        username: customName,
        role: faction.name,
        timestamp: serverTimestamp()
      });

      // 3. Update player statistics and timeline
      if (currentUser) {
        const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        const pSnap = await getDoc(pDoc);
        let currPoints = 0;
        let currCount = 0;
        if (pSnap.exists()) {
          const data = pSnap.data();
          currPoints = data.contributionPoints || 0;
          currCount = data.actionsCount || 0;
        }
        
        const nextPoints = currPoints + 25;
        const nextCount = currCount + 1;
        
        await setDoc(pDoc, {
          uid: currentUser.uid,
          username: customName,
          role: selectedFactionId,
          online: true,
          joinedAt: serverTimestamp(),
          contributionPoints: nextPoints,
          actionsCount: nextCount
        });

        saveActionToLocalChronicle(
          'DECREE',
          `执掌大略敕命：${decree.name}`,
          `国祚变动：${decree.effectText}`,
          roomState?.emperorAge || 14
        );
        
        // Execute Action Health Risk for Chancellery / Court Purge
        applyActionHealthRisk(false);
      }

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${activeRoomId}`);
    }
  };

  const applyActionHealthRisk = async (isSevere: boolean = false) => {
    if (!currentUser || !activeRoomId) return;
    try {
      const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
      const snap = await getDoc(pDoc);
      if (!snap.exists()) return;
      const data = snap.data();
      let currentVigor = data.vigor !== undefined ? data.vigor : 100;
      let currentIsDead = data.isDead || false;

      if (currentIsDead) return;

      const cost = isSevere ? Math.floor(Math.random() * 30) + 40 : Math.floor(Math.random() * 10) + 6;
      let nextVigor = Math.max(0, currentVigor - cost);
      
      let deathTriggered = false;
      if (nextVigor <= 0) {
        deathTriggered = true;
        currentIsDead = true;
      }

      await updateDoc(pDoc, {
        vigor: nextVigor,
        isDead: currentIsDead,
      });

      if (deathTriggered) {
        await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
          text: `💀 【社稷惨报】主政名臣 【${customName}】 (${myFaction.name}) 因积劳成疾，不幸寿终殉职！传位大典诏书已下发！`,
          username: customName,
          role: selectedFactionId,
          timestamp: serverTimestamp()
        });
        
        saveActionToLocalChronicle(
          'MESSAGE',
          `【主政官寿终】家门功高，精魂凋零`,
          `主政官在朝劳瘁而驾崩，当前累计功勋清空，静待子嗣袭爵临朝。`,
          roomState?.emperorAge || 14
        );
        
        setSystemAlert('💀 【天命将终】极度悲痛！您当前的主政官在朝堂斗争和重托下积劳成疾，寿终告罄！请移步“主政官阶档案”举行承嗣位继鼎仪式！');
      }

    } catch (err) {
      console.error('Failed to update action health state:', err);
    }
  };

  const handleCreateWarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId || !newPlanDesc.trim()) return;

    try {
      const effectText = newPlanStrategy === 'STRIKE' 
        ? '攻势协同大计：辅战威力极大升华 (+35% 奇正破敌威能)，战死军勋共享。' 
        : '坚守护城战略：被动守战反噬伤亡削弱减免 -25%。';

      const warPlansColRef = collection(db, 'rooms', activeRoomId, 'war_plans');
      await addDoc(warPlansColRef, {
        planner: customName || '流沙策士',
        plannerRole: selectedFactionId,
        strategyType: newPlanStrategy,
        conditionSeason: newPlanSeason,
        description: newPlanDesc.trim(),
        effectText: effectText,
        triggeredCount: 0,
        createdAt: serverTimestamp()
      });

      saveActionToLocalChronicle(
        'TACTICS',
        `军机大备：编撰《${newPlanDesc}》`,
        `战略朝野特权：${newPlanStrategy === 'STRIKE' ? '攻势协攻' : '守城戍守'}，已呈交军机台！`,
        roomState?.emperorAge || 14
      );

      await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
        text: `📡 【秦政纪元：大设兵机】朝臣 【${customName}】 设下存续协作战备案：《${newPlanDesc.trim()}》，共期天命！`,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });

      setNewPlanDesc('');
      setSystemAlert('📐 军略大密编修成功！战备大计已呈交军事秘府！');

    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${activeRoomId}/war_plans`);
    }
  };

  // Option 1: Deploy map unit directly from the Multiplayer board
  const PRESET_BATTLEFIELDS = [
    { key: 'XIANYANG', name: '咸阳内卫关防 (Xianyang Center)', lat: 34.368, lng: 108.708 },
    { key: 'HANGU', name: '函谷咽喉雄关 (Hangu Pass)', lat: 34.619, lng: 110.158 },
    { key: 'YANMEN', name: '雁门塞外古道 (Yanmen Outer Pass)', lat: 39.191, lng: 112.871 },
    { key: 'JIUJIANG', name: '九江彭城沙洲 (Jiujiang Sands)', lat: 29.707, lng: 115.985 },
    { key: 'CHUPING', name: '楚豫相交平野 (Chuping Plains)', lat: 32.550, lng: 114.320 }
  ];

  const handleDeployMapUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId || !currentUser) {
      setSystemAlert('❌ 请先登入联机房间，再指派王师开赴神州疆场！');
      return;
    }
    if (!deployMapUnitName.trim()) {
      setSystemAlert('❌ 请为调遣的师团赐予旌旗名号！');
      return;
    }

    const preset = PRESET_BATTLEFIELDS.find(b => b.key === deployBattlefieldPreset) || PRESET_BATTLEFIELDS[0];
    const newUnitId = `multi_${Date.now()}`;
    const newUnit = {
      id: newUnitId,
      name: deployMapUnitName.trim(),
      side: deployMapUnitSide,
      lat: preset.lat,
      lng: preset.lng,
      size: Number(deployMapUnitSize),
      creatorUid: currentUser.uid,
      creatorName: customName || '天命佐政官'
    };

    try {
      setIsActionCooldown(true);
      const docRef = doc(db, 'rooms', activeRoomId, 'mapUnits', newUnitId);
      await setDoc(docRef, newUnit);

      // Add Room Scribe Log
      const scribeText = `🌍 【天命大舆图空投】在神州 [${preset.name}]（纬: ${preset.lat}, 经: ${preset.lng}）紧急空降了一师 【${deployMapUnitName.trim()}】 部队（统率: ${Number(deployMapUnitSize).toLocaleString()}人，归属: ${deployMapUnitSide === 'allied' ? '我方王师官防营' : '塞外犯寇营垒'}）！`;
      await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
        text: scribeText,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });

      // Deduct budget / Coffers
      const updatedCoffers = Math.max(0, (roomState?.coffers || 45000) - 2500);
      const roomRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomRef, {
        coffers: updatedCoffers,
        updatedAt: serverTimestamp()
      });

      // Reduce Vigor! Dynamic impact
      const playerDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
      const myPlayerStats = playersList.find(p => p.uid === currentUser.uid);
      const currentVigor = myPlayerStats?.vigor !== undefined ? myPlayerStats.vigor : 100;
      const nextVigor = Math.max(0, currentVigor - 15);
      await updateDoc(playerDoc, {
        vigor: nextVigor,
        actionsCount: (myPlayerStats?.actionsCount || 0) + 1
      });

      saveActionToLocalChronicle(
        'TACTICS',
        `神州古图协同誓师出兵《${deployMapUnitName.trim()}》`,
        `出征驻地：${preset.name}。付出大笔兵饷 2500 贯，个人气血精力体虚减 15% (Vigor)。`,
        roomState?.emperorAge || 14
      );

      setSystemAlert(`✨ 烽火兵符拜发！王师部曲已空投至：${preset.name}！可通过上方地图面板查看！`);
      setDeployMapUnitName('');

      // Check if vigor has depleted
      if (nextVigor <= 0) {
        await updateDoc(playerDoc, {
          isDead: true,
          vigor: 0
        });
        await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
          text: `💀 【佐臣积劳重光】由于昼夜布防神州各镇王师，佐政名宿 【${customName}】 积劳成疾、在帅账之中寿终告驾！`,
          username: customName,
          role: selectedFactionId,
          timestamp: serverTimestamp()
        });
        saveActionToLocalChronicle(
          'MESSAGE',
          `【主政官寿终】家门功高，精魂凋零`,
          `主政官在朝昼夜兵防大地图劳瘁驾崩，当前累计功勋清空，静待子嗣袭爵。`,
          roomState?.emperorAge || 14
        );
        setSystemAlert('💀 【天命将终】极度悲痛！您当前的主政官因大图军务操劳过度崩殂家去！请到“主政官阶”举行袭爵承鼎大典！');
      }

      setTimeout(() => {
        setIsActionCooldown(false);
      }, 1500);

    } catch (err) {
      console.error("Deploy map unit failed:", err);
      setIsActionCooldown(false);
      setSystemAlert('❌ 调兵失败：网络阻滞或文书撰写错误！');
    }
  };

  const handleRemoteSupportStrike = async (unitId: string, unitName: string, isAllied: boolean) => {
    if (!activeRoomId || !currentUser) return;
    try {
      setIsActionCooldown(true);
      const unitDocRef = doc(db, 'rooms', activeRoomId, 'mapUnits', unitId);

      if (!isAllied) {
        // Attack and wipe enemy unit
        await deleteDoc(unitDocRef);

        const scribeText = `🔥 【烽火连璧火攻】阁臣调拔塞外关塞烽火，引燃干草连环破，成功火攻湮灭大智图敌驻军 【${unitName}】！斩寇十里！`;
        await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
          text: scribeText,
          username: customName,
          role: selectedFactionId,
          timestamp: serverTimestamp()
        });

        // Add user contribution points!
        const playerDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        const myPlayerStats = playersList.find(p => p.uid === currentUser.uid);
        const currentPoints = myPlayerStats?.contributionPoints || 0;
        await updateDoc(playerDoc, {
          contributionPoints: currentPoints + 15,
          actionsCount: (myPlayerStats?.actionsCount || 0) + 1
        });

        saveActionToLocalChronicle(
          'TACTICS',
          `烽火焚灭地图贼寇营 《${unitName}》`,
          `行使奇计合兵绞贼，斩获朝署 15 点大功勋！`,
          roomState?.emperorAge || 14
        );

        setSystemAlert(`🔥 远程火攻大捷！已于地图远程剿灭寇营 [${unitName}]，获得 15 大政勋！`);
      } else {
        // Support and supply allied unit: add 5000 troops
        const currentUnit = mapUnitsList.find(u => u.id === unitId);
        const newSize = (currentUnit?.size || 10000) + 5000;
        await updateDoc(unitDocRef, { size: newSize });

        const scribeText = `🏰 【武备驰援协同】朝堂急发六百里加急军粮箭矢，为驻守边镇之我方师团 【${unitName}】 补充 5000 精锐新卒！`;
        await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
          text: scribeText,
          username: customName,
          role: selectedFactionId,
          timestamp: serverTimestamp()
        });

        setSystemAlert(`🏰 调兵驰援成功！防守王师 [${unitName}] 兵力紧急补给 5,000 人物！`);
      }

      setTimeout(() => {
        setIsActionCooldown(false);
      }, 1500);

    } catch (err) {
      console.error("Remote strike failed:", err);
      setIsActionCooldown(false);
    }
  };

  // Option 2: Wireless commanding of map dynamic simulations, stances, and generals
  const handleToggleMapSimulation = async () => {
    if (!activeRoomId || !currentUser) return;
    const currentSim = roomState?.mapBattleSimulating || false;
    const roomRef = doc(db, 'rooms', activeRoomId);
    
    try {
      setIsActionCooldown(true);
      await updateDoc(roomRef, {
        mapBattleSimulating: !currentSim,
        updatedAt: serverTimestamp()
      });
      
      const scribeText = !currentSim 
        ? `🎺 【军机太祖大擂鼓】阁臣 【${customName}】 隔空擂响了咸阳金殿紫铜战鼓，号令神州大舆图所有驻守防线：擂鼓出兵，实境开始交锋对打！`
        : `🛖 【朝中兵权鸣金】阁臣 【${customName}】 紧急下达太尉御林急符，边关金铤齐鸣，各营曲部暂停拼杀，拔营安垒！`;

      await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
        text: scribeText,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });

      setSystemAlert(!currentSim ? '⚔️ 隔空军令传达成功：大地图实境大决战已擂鼓开演！' : '🛖 隔空军令传达成功：传下退钲音，防线收战鸣金！');
      
      setTimeout(() => {
        setIsActionCooldown(false);
      }, 1000);
    } catch (err) {
      console.error("Toggle map simulation error:", err);
      setIsActionCooldown(false);
    }
  };

  const handleUpdateMapStance = async (stance: string) => {
    if (!activeRoomId) return;
    try {
      const roomRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomRef, {
        mapBattleStance: stance,
        updatedAt: serverTimestamp()
      });
      
      const stanceLabel = stance === 'offensive' ? '【大举攻势】' : stance === 'defensive' ? '【凭塞防守】' : '【伏兵拦截】';
      const scribeText = `🛡️ 【兵法大调整】朝廷调整大地图战区圣策：当前交锋王师主将听命：即刻调整为 ${stanceLabel} 指导方略！`;
      await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
        text: scribeText,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Update map stance failed:", err);
    }
  };

  const handleUpdateMapGeneral = async (general: string) => {
    if (!activeRoomId) return;
    try {
      const roomRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomRef, {
        mapBattleGeneral: general,
        updatedAt: serverTimestamp()
      });
      
      const genNames: Record<string, string> = {
        'caocao': '魏武孟德 (曹操)',
        'baiqi': '人屠杀神 (白起)',
        'hanxin': '背水兵仙 (韩信)',
        'caoren': '帝国铁卫 (曹仁)'
      };
      const scribeText = `🎖️ 【军机拜帅敕令】京城军机处重颁帅印给大舆图战区，委任名宿 【${genNames[general] || general}】 拜为三军统帅，阵前克敌！`;
      await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
        text: scribeText,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Update map general failed:", err);
    }
  };

  const handleGrandDynastyReset = async () => {
    if (!activeRoomId) return;
    const confirmReset = window.confirm('🧪 诸卿公执意开启太初金晶大重置，重归公元前 230 年天元起点，重新洗牌神州大陆气运吗？此动作将肃清全部留置密策！');
    if (!confirmReset) return;

    try {
      const roomDocRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomDocRef, {
        mandate: 78,
        stability: 82,
        coffers: 45000,
        emperorAge: 14,
        gameYear: 230,
        gameSeason: 'SPRING',
        timeSpeed: 'NORMAL',
        agricultureIndex: 60,
        commerceIndex: 50,
        recentIncidents: ['【太初天赦】时空更始，八荒俱靖，朝臣竭忠力将大势拨回大秦受命第一年。万物回春！'],
        updatedAt: serverTimestamp()
      });

      const warPlansSnapshot = await getDocs(collection(db, 'rooms', activeRoomId, 'war_plans'));
      const batchDeletes = warPlansSnapshot.docs.map(docRef => deleteDoc(docRef.ref));
      await Promise.all(batchDeletes);

      await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
        text: `⏳ 【极点浩劫 · 太初重置】诸臣合力重转浑天盘，大势强行回归天元原点！神州纪元鼎新开启！`,
        username: '【浑天回天仪】',
        role: 'SYSTEM',
        timestamp: serverTimestamp()
      });

      setSystemAlert('🧬 乾坤斗转！太初大重置成功，社稷江山更始，王师雄风重整！');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${activeRoomId}/reset`);
    }
  };

  // Handle Export Chronicle
  const exportChronicle = () => {
    const dataStr = JSON.stringify(localChronicle);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `dynasty-chronicle-${activeRoomId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Handle Import Chronicle
  const importChronicle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          // Simple validation
          if (Array.isArray(content)) {
            const key = `dynasty-chronicle-${activeRoomId}-${currentUser.uid}`;
            setLocalChronicle(content);
            localStorage.setItem(key, JSON.stringify(content));
            setSystemAlert('✅ 史册导入成功，纪元已载入。');
          } else {
            setSystemAlert('❌ 史册格式错误，无法载入。');
          }
        } catch (error) {
          setSystemAlert('❌ 史册解析失败：文件格式非合规 JSON。');
        }
      };
    }
  };

  const getRandomSpyName = () => {
    const spyNames = [
      '墨侠残墨', '黑水行密', '无影幽客', '侍女西子', '反使殷通', 
      '烈勇朱亥', '关中折冲甘罗', '大客卿甘信', '绝影姬', '黑沙客'
    ];
    return spyNames[Math.floor(Math.random() * spyNames.length)];
  };

  const getSpyTypeName = (type: string) => {
    switch (type) {
      case 'LOCAL': return '乡间 (Local Spies)';
      case 'INTERNAL': return '内间 (Internal Spies)';
      case '策反': return '反间 (Double Spies)';
      case 'DEATH': return '死间 (Doomed Spies)';
      case 'ACTIVE_SURVIVING': return '生间 (Surviving Spies)';
      default: return '外线密报员';
    }
  };

  const handleRecruitSpy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId || !roomState || isActionCooldown) return;
    
    // Check player health state
    if (currentUser) {
      const myP = playersList.find(p => p.uid === currentUser.uid);
      if (myP?.isDead) {
        setSystemAlert('🚨 悲怆！您当前的主政官家臣已经伤重殉国，请速去“主政官阶档案”页签举行继承尊典嗣位重来！');
        return;
      }
    }

    const spyName = newSpyName.trim() || getRandomSpyName();
    
    let cost = 3000;
    if (newSpyType === 'INTERNAL') cost = 5000;
    else if (newSpyType === '策反') cost = 6000;
    else if (newSpyType === 'DEATH') cost = 4000;
    else if (newSpyType === 'ACTIVE_SURVIVING') cost = 5000;

    if (roomState.coffers < cost) {
      setSystemAlert(`🚨 府库帑银不足！招募该类型细作间谍需要 ${cost} 贯，当前府库仅剩 ${roomState.coffers} 贯！`);
      return;
    }

    setIsActionCooldown(true);
    setTimeout(() => setIsActionCooldown(false), 2000);

    try {
      // 1. Spend coffers
      const roomDocRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomDocRef, {
        coffers: roomState.coffers - cost,
        updatedAt: serverTimestamp()
      });

      // 2. Generate random attributes
      let baseLoyalty = 50;
      if (newSpyMotivation === 'IDEAL') baseLoyalty = 85;
      else if (newSpyMotivation === 'HATRED') baseLoyalty = 70;
      else if (newSpyMotivation === 'MONEY') baseLoyalty = 45;
      
      const loyalty = Math.min(100, Math.max(10, baseLoyalty + Math.floor(Math.random() * 30) - 15));
      const credibility = Math.min(100, Math.max(20, 60 + Math.floor(Math.random() * 40)));

      const preset = PRESET_BATTLEFIELDS.find(b => b.key === newSpyLocationKey) || PRESET_BATTLEFIELDS[0];

      // 3. Save Spy to Firestore
      const spiesColRef = collection(db, 'rooms', activeRoomId, 'spies');
      await addDoc(spiesColRef, {
        name: spyName,
        type: newSpyType,
        cost: cost,
        credibility: credibility,
        motivation: newSpyMotivation,
        loyalty: loyalty,
        isDiscovered: false,
        state: 'IDLE',
        targetLat: preset.lat,
        targetLng: preset.lng,
        targetName: preset.name.split(' (')[0]
      });

      // 4. Log to Room Scriptor Logs
      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `👁️ 【秦廷密府·用间】朝臣 【${customName}】 斥帑银 ${cost} 贯招募 【${getSpyTypeName(newSpyType)}】 细作：【${spyName}】（设密潜点：${preset.name.split(' (')[0]}，忠信度: ${loyalty}，凭信度: ${credibility}），已潜伏定位！`,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });

      // 5. Update player stats
      if (currentUser) {
        const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        const pSnap = await getDoc(pDoc);
        let currPoints = 0;
        let currCount = 0;
        if (pSnap.exists()) {
          const data = pSnap.data();
          currPoints = data.contributionPoints || 0;
          currCount = data.actionsCount || 0;
        }

        await setDoc(pDoc, {
          uid: currentUser.uid,
          username: customName,
          role: selectedFactionId,
          online: true,
          joinedAt: serverTimestamp(),
          contributionPoints: currPoints + 15,
          actionsCount: currCount + 1
        });

        saveActionToLocalChronicle(
          'DECREE',
          `潜伏乱寇细作：【${spyName}】`,
          `国库消耗 -${cost}，用间大略展开，功勋绩值 +15 点`,
          roomState?.emperorAge || 14
        );
        
        applyActionHealthRisk(false);
      }

      setNewSpyName('');
      setSystemAlert(`✨ 细作密谋布署完毕！密探 【${spyName}】 已成功潜伏进入敌营地。`);

    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${activeRoomId}/spies`);
    }
  };

  const handleExecuteSpyMission = async (spy: SpyAgent) => {
    if (!activeRoomId || !roomState || isActionCooldown) return;

    if (currentUser) {
      const myP = playersList.find(p => p.uid === currentUser.uid);
      if (myP?.isDead) {
        setSystemAlert('🚨 悲怆！您当前的主政官家臣已经伤重殉国，请速去“主政官阶档案”页签举行继承尊典嗣位重来！');
        return;
      }
    }

    setIsActionCooldown(true);
    setTimeout(() => setIsActionCooldown(false), 2000);

    let logText = '';
    let successText = '';
    let isMartyred = false;
    let isCaptured = false;
    
    let nextStability = roomState.stability;
    let nextMandate = roomState.mandate;
    let nextCoffers = roomState.coffers;
    let nextEnemyPower = roomState.enemyPower !== undefined ? roomState.enemyPower : 45000;
    let nextEnemyMorale = roomState.enemyMorale || 'SHARP';
    let nextEnemyFlaw = roomState.enemyFlaw || 'TEMPERED';
    let nextOurRegular = roomState.ourRegular || 35000;
    let nextOurSurprise = roomState.ourSurprise || 12000;
    let pointsEarned = 25;

    try {
      switch (spy.type) {
        case 'LOCAL': {
          const intelDmg = Math.floor(Math.random() * 2000) + 1500;
          nextEnemyPower = Math.max(0, nextEnemyPower - intelDmg);
          logText = `启动乡间细作 【${spy.name}】！其买通敌营猎户，指认防线薄弱侧角。我军大兵包抄，斩获外寇 ${intelDmg} 人！`;
          successText = `外寇被袭击消耗 ${intelDmg} 人，其地舆边塞情势彻底暴露`;
          pointsEarned = 25;
          if (Math.random() < 0.20) {
            isMartyred = true;
          }
          break;
        }
        case 'INTERNAL': {
          const internalDamage = 4000;
          nextEnemyPower = Math.max(1000, nextEnemyPower - internalDamage);
          nextOurRegular = Math.min(100000, nextOurRegular + 2000);
          logText = `启动内间大细作 【${spy.name}】！其秘密贿买敌军裨将，暗中掺沙泄毁敌粮，敌军饥饿病死减散 ${internalDamage} 兵，更有正卒逃效 +2000 来朝投诚！`;
          successText = `暗消外寇精兵 ${internalDamage} 并获得勤王正兵 +2000 戈！`;
          pointsEarned = 30;
          if (Math.random() < 0.30) {
            isCaptured = true;
          }
          break;
        }
        case '策反': {
          nextEnemyFlaw = 'EXPOSED';
          logText = `启动反间双向刺客 【${spy.name}】！其篡改敌军将领往来密函，使敌主帅猜忌其麾下猛将，将相内讧。敌帅因惊惶惊怒，中其离间诡折，露出 [狂骄暴露] 架势！`;
          successText = `敌营中反间计，统帅惊暴防守架势暴露 (Exposed)！下一次正面和击享 2.0 倍终极暴击！`;
          pointsEarned = 35;
          if (Math.random() < 0.35) {
            isMartyred = true;
          }
          break;
        }
        case 'DEATH': {
          const randVal = Math.random();
          if (randVal < 0.50) {
            nextEnemyMorale = 'RETREATING';
            logText = `施展《孙子兵法》死间重策！死士 【${spy.name}】 携我军精兵在关内集结的假公文冲阵被俘，故意把假密报泄露。敌探之大为崩溃惊惶，坚营开始 [畏战退逃]！`;
            successText = `死间重计大获全胜！敌宿营盘士气跌溃为 [归气(2.5X 乘击暴击期)]！`;
            isMartyred = true;
            pointsEarned = 50;
          } else {
            isCaptured = true;
            logText = `痛烈！我方死士 【${spy.name}】 在传递虚假假兵书时，由于敌方谋士右贤王敏锐，不慎识破。死士大义凛然慷慨赴义，壮烈战死！`;
            successText = `死士间谍由于行迹毕露，不幸被搜捕壮烈牺牲。`;
            pointsEarned = 10;
          }
          break;
        }
        case 'ACTIVE_SURVIVING': {
          const spoils = Math.floor(Math.random() * 4000) + 4000;
          nextCoffers += spoils;
          logText = `生间密员 【${spy.name}】 潜形而动。其假托塞外行贾驼队，成功潜入劫夺了外敌输送犒劳的十车马车香金大箱，缴获大司农军资金银 ${spoils} 贯充实府库！`;
          successText = `成功索取寇边金银 +${spoils} 贯入库。`;
          pointsEarned = 25;
          if (Math.random() < 0.25) {
            isCaptured = true;
          }
          break;
        }
        default:
          break;
      }

      // Update Shared Room
      const roomDocRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomDocRef, {
        coffers: nextCoffers,
        enemyPower: nextEnemyPower,
        enemyMorale: nextEnemyMorale,
        enemyFlaw: nextEnemyFlaw,
        ourRegular: nextOurRegular,
        ourSurprise: nextOurSurprise,
        updatedAt: serverTimestamp()
      });

      // Update Spy state
      const spyDocRef = doc(db, 'rooms', activeRoomId, 'spies', spy.id);
      if (isMartyred) {
        await updateDoc(spyDocRef, { state: 'MARTYRED' });
      } else if (isCaptured) {
        await updateDoc(spyDocRef, { state: 'CAPTURED' });
      } else {
        await updateDoc(spyDocRef, { state: 'IDLE' });
      }

      // Scribe log
      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `👁️ 【用间奇策 · ${getSpyTypeName(spy.type).split(' ')[0]}】${logText}`,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });

      // Update player
      if (currentUser) {
        const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        const pSnap = await getDoc(pDoc);
        let currPoints = 0;
        let currCount = 0;
        if (pSnap.exists()) {
          const data = pSnap.data();
          currPoints = data.contributionPoints || 0;
          currCount = data.actionsCount || 0;
        }

        await setDoc(pDoc, {
          uid: currentUser.uid,
          username: customName,
          role: selectedFactionId,
          online: true,
          joinedAt: serverTimestamp(),
          contributionPoints: currPoints + pointsEarned,
          actionsCount: currCount + 1
        });

        saveActionToLocalChronicle(
          'TACTICS',
          `行使间道策：【${spy.name}】`,
          `成果：${successText}，功勋政治绩值 +${pointsEarned} 点`,
          roomState?.emperorAge || 14
        );

        applyActionHealthRisk(isMartyred || isCaptured);
      }

      setSystemAlert(`✨ 间谋奇捷！密探 【${spy.name}】 任务报毕：${successText}`);
    } catch (e) {
      console.error('Failed to run spy mission:', e);
    }
  };

  const handleDecommissionSpy = async (spyId: string, spyName: string) => {
    if (!activeRoomId) return;
    try {
      const spyDocRef = doc(db, 'rooms', activeRoomId, 'spies', spyId);
      await deleteDoc(spyDocRef);

      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `🕯️ 【用间·抚恤】司寇密府为细作探子 【${spyName}】 设白盖纛旗追赠后事超度，清理并销毁了其存墨档案。`,
        username: customName,
        role: selectedFactionId,
        timestamp: serverTimestamp()
      });

      setSystemAlert(`🕯️ 细作密探 【${spyName}】 资料清理撤挡完成。`);
    } catch (err) {
      console.error('Failed to decommission spy:', err);
    }
  };

  const handleExecuteTactics = async (tacticId: string) => {
    if (!activeRoomId || !roomState || isActionCooldown) return;
    setIsActionCooldown(true);
    setTimeout(() => setIsActionCooldown(false), 2000); // 2s tactics cooldown

    try {
      // Decode campaign parameters, defaulting them to avoid schema mismatch
      const currentEnemyName = roomState.enemyName || "塞外匈奴单于铁骑（精锐）";
      const enemyPower = roomState.enemyPower !== undefined ? roomState.enemyPower : 45000;
      const enemyMaxPower = roomState.enemyMaxPower !== undefined ? roomState.enemyMaxPower : 45000;
      const enemyMorale = roomState.enemyMorale || "SHARP";
      const enemyTerrain = roomState.enemyTerrain || "KEY";
      const enemyFlaw = roomState.enemyFlaw || "TEMPERED";
      const ourRegular = roomState.ourRegular !== undefined ? roomState.ourRegular : 35000;
      const ourSurprise = roomState.ourSurprise !== undefined ? roomState.ourSurprise : 12000;

      let nextEnemyName = currentEnemyName;
      let nextEnemyPower = enemyPower;
      let nextEnemyMaxPower = enemyMaxPower;
      let nextEnemyMorale = enemyMorale;
      let nextEnemyTerrain = enemyTerrain;
      let nextEnemyFlaw = enemyFlaw;
      let nextOurRegular = ourRegular;
      let nextOurSurprise = ourSurprise;
      let nextMandate = roomState.mandate;
      let nextStability = roomState.stability;
      let nextCoffers = roomState.coffers;

      let logText = '';
      let effectText = '';
      let pointsEarned = 25;

      if (tacticId === 'DEMONSTRATE_VOID') {
        // 《虚实篇》：示形诡道 (Chapter 6: Illusion deception)
        if (nextCoffers < 4000) {
          setSystemAlert('🚨 府粮空荡，三军主用不足，无法行此诡道！');
          return;
        }
        nextCoffers -= 4000;
        nextStability = Math.min(100, nextStability + 8);
        nextEnemyMorale = "SLUGGISH";
        logText = `实施《虚实篇》之“示形诡道”！多设空垒营火、布虚声疑兵。寇首【${currentEnemyName}】心生迟滞，士气跌落至 [惰气]！`;
        effectText = `大司农帑银 -4000 贯，政治稳定度 +8，寇边军士气降为惰阻`;
        pointsEarned = 30;
      }
      else if (tacticId === 'EXPLOIT_FLAW') {
        // 《将理篇》：挑动将危 (Chapter 8/12: Provoke General weaknesses)
        if (nextCoffers < 3000) {
          setSystemAlert('🚨 军资匮竭，无以贿赂敌统打探主官虚弱！');
          return;
        }
        nextCoffers -= 3000;
        nextEnemyFlaw = 'EXPOSED';
        logText = `用《孙子兵法·九变篇》“将有五危，忿速可侮”！军前遗送红妆罗衫百般讥刺。敌酋忿怒失理，卸下雄关防御，露出破绽状态！`;
        effectText = `大司农帑银 -3000 贯，敌寇防守架势暴露，后续强攻将承受 2.0 倍致命暴击`;
        pointsEarned = 25;
      }
      else if (tacticId === 'SHIFT_MORALE') {
        // 《军争篇》：治气规避之战 (Chapter 7: Morale Shift)
        const cycles: Record<string, 'SHARP' | 'SLUGGISH' | 'RETREATING'> = {
          'SHARP': 'SLUGGISH',
          'SLUGGISH': 'RETREATING',
          'RETREATING': 'SHARP'
        };
        const before = enemyMorale;
        nextEnemyMorale = cycles[enemyMorale] || 'SHARP';
        logText = `陈授《军争篇》之“治气”大略：“避其锐气，击其惰归”！我军闭垒不出，坐等风霜消磨贼军意志。其军阵士气由 [${before === 'SHARP' ? '锐气' : before === 'SLUGGISH' ? '惰气' : '归气'}] 偏转堕至 [${nextEnemyMorale === 'SHARP' ? '锐气' : nextEnemyMorale === 'SLUGGISH' ? '惰气' : '归气'}]！`;
        effectText = `推移战机，当前敌寇气势呈现为 ${nextEnemyMorale === 'SHARP' ? '锐气(高危)' : nextEnemyMorale === 'SLUGGISH' ? '惰气(趋疲)' : '归气(衰败大涣！击之良辰！)'}`;
        pointsEarned = 20;
      }
      else if (tacticId === 'DEATH_GROUND') {
        // 《九地篇》：投死地而生 (Chapter 11: Plunge into Death Ground)
        nextEnemyTerrain = 'DEATH';
        nextStability = Math.max(5, nextStability - 10);
        logText = `施《九地篇》绝略：“投之亡地然后存，陷之死地然后生”！诱导敌军及我偏师于狭窄死谷绝崖中血战。战场地缘强制改变为 [死地]，双方暴怒，不死不休！`;
        effectText = `朝政局面动荡稳定度 -10点，当前战场地缘切换为 [死地]，战局杀伤力高涨`;
        pointsEarned = 35;
      }
      else if (tacticId === 'COMBINED_STRIKE') {
        // 《兵势篇》：奇正和击之处 (Chapter 5: Regular & Surprise strike)
        if (ourRegular < 4000) {
          setSystemAlert('🚨 朝廷勤王本家正兵过于寒酸，难以正面御寇，请调拨粮饷重置战局！');
          return;
        }

        // Damage modifier
        let baseDmg = Math.round((ourRegular * 0.12) + (ourSurprise * 0.40));
        let multiplier = 1.0;

        if (enemyMorale === 'RETREATING') multiplier *= 2.5; // "击其惰归"
        if (enemyMorale === 'SLUGGISH') multiplier *= 1.3;
        if (enemyTerrain === 'DEATH') multiplier *= 1.8; // 死地战法爆发增加
        if (enemyFlaw === 'EXPOSED') multiplier *= 2.0; // Weakness bonus

        let totalDmg = Math.round(baseDmg * multiplier);
        nextEnemyPower = Math.max(0, enemyPower - totalDmg);

        // Calculate our suffering
        let casualtyBase = Math.round(enemyPower * 0.07);
        if (enemyMorale === 'SHARP') casualtyBase = Math.round(casualtyBase * 1.6); // charging sharp troop causes blood
        if (enemyTerrain === 'DEATH') casualtyBase = Math.round(casualtyBase * 1.5); // bloody death ground
        if (enemyFlaw === 'EXPOSED') casualtyBase = Math.round(casualtyBase * 0.6); // enemy in disarray deals less damage

        nextOurRegular = Math.max(2000, ourRegular - Math.round(casualtyBase * 0.7));
        nextOurSurprise = Math.max(500, ourSurprise - Math.round(casualtyBase * 0.3));

        if (enemyFlaw === 'EXPOSED') {
          // Consume exposed status
          nextEnemyFlaw = 'TEMPERED';
        }

        logText = `策应《兵势篇》：“战者，以正合，以奇胜”。在朝王师列阵正面牵制，大将军精骑奇袭后翼，破击【${currentEnemyName}】歼敌 ${totalDmg} 兵首！`;
        if (enemyMorale === 'RETREATING') {
          logText += ` 痛击敌部 [归气]，实现兵法乘衰击惰，战绩飙增！`;
        }
        if (enemyTerrain === 'DEATH') {
          logText += ` 于九地之 [死地] 背水一战狂暴斩贼多万。`;
        }

        effectText = `灭外寇之众 ${totalDmg} 人，帝廷兵家自伤亡折损 ${casualtyBase} 人 (正兵/奇兵)`;
        pointsEarned = 35;

        // Check victory
        if (nextEnemyPower === 0) {
          logText += ` 捷报！大胜并歼灭边关乱寇酋长！三军欢腾，社稷天命金瓯固顶！`;
          nextMandate = Math.min(100, nextMandate + 12);
          nextStability = Math.min(100, nextStability + 10);
          nextCoffers += 15000; // war spoils
          effectText += ` 🎖️ 寇部荡平！获得战利金 15000 贯，天命 +12点，政治稳定 +10点`;
        }
      }
      else if (tacticId === 'RESET_CAMPAIGN') {
        const threats = [
          { name: "塞外匈奴单于铁骑（来势汹汹）", power: 45000, flaw: 'TEMPERED' },
          { name: "九江楚国项王百战劲旅", power: 65000, flaw: 'RECKLESS' },
          { name: "山东六国残党游击连横联军", power: 35000, flaw: 'COWARDLY' },
          { name: "关外白家溃勇与旧秦抗旨军", power: 50000, flaw: 'TEMPERED' }
        ];
        const pick = threats[Math.floor(Math.random() * threats.length)];
        nextEnemyName = pick.name;
        nextEnemyPower = pick.power;
        nextEnemyMaxPower = pick.power;
        nextEnemyMorale = 'SHARP';
        nextEnemyTerrain = 'KEY';
        nextEnemyFlaw = pick.flaw;
        nextOurRegular = 38000;
        nextOurSurprise = 14000;
        logText = `召集庙堂诸公推演！御前重启山河边关推算：外乱【${pick.name}】精锐集结，狼烟寇关！`;
        effectText = `重置边患外寇，补充关中御林守兵及奇袭精骑。天命大盘严阵以待`;
        pointsEarned = 15;
      }

      // 1. Commit and update room variables to Firebase
      const roomDocRef = doc(db, 'rooms', activeRoomId);
      await updateDoc(roomDocRef, {
        mandate: nextMandate,
        stability: nextStability,
        coffers: nextCoffers,
        enemyName: nextEnemyName,
        enemyPower: nextEnemyPower,
        enemyMaxPower: nextEnemyMaxPower,
        enemyMorale: nextEnemyMorale,
        enemyTerrain: nextEnemyTerrain,
        enemyFlaw: nextEnemyFlaw,
        ourRegular: nextOurRegular,
        ourSurprise: nextOurSurprise,
        updatedAt: serverTimestamp()
      });

      // 2. Log to the global scribe
      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `🛡️【${FACTION_DEFINITIONS.find(f => f.id === selectedFactionId)?.name} / ${customName}】运用兵书：${logText}`,
        username: customName,
        role: `${FACTION_DEFINITIONS.find(f => f.id === selectedFactionId)?.avatar} (兵法治兵)`,
        timestamp: serverTimestamp()
      });

      // 3. Increment Points and local chronic
      if (currentUser) {
        const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        const pSnap = await getDoc(pDoc);
        let currPoints = 0;
        let currCount = 0;
        if (pSnap.exists()) {
          const data = pSnap.data();
          currPoints = data.contributionPoints || 0;
          currCount = data.actionsCount || 0;
        }

        const nextPoints = currPoints + pointsEarned;
        const nextCount = currCount + 1;

        await setDoc(pDoc, {
          uid: currentUser.uid,
          username: customName,
          role: selectedFactionId,
          online: true,
          joinedAt: serverTimestamp(),
          contributionPoints: nextPoints,
          actionsCount: nextCount
        });

        saveActionToLocalChronicle(
          'TACTICS',
          `兵法施展决意：${logText.split('！')[0].replace('【', '《').replace('】', '》')}`,
          `结果：${effectText}`,
          roomState?.emperorAge || 14
        );
      }

    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${activeRoomId}/tactics`);
    }
  };

  const handleSendCustomMessage = async (e?: React.FormEvent, customMsgText?: string) => {
    if (e) e.preventDefault();
    const finalMsg = customMsgText || chatMessage;
    if (!finalMsg.trim() || !activeRoomId) return;

    try {
      const activeFaction = FACTION_DEFINITIONS.find(f => f.id === selectedFactionId) || FACTION_DEFINITIONS[0];
      const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
      await addDoc(logsColRef, {
        text: `💬 【${activeFaction.avatar} ${customName}】：${finalMsg.trim()}`,
        username: customName,
        role: activeFaction.name,
        timestamp: serverTimestamp()
      });
      if (!customMsgText) {
        setChatMessage('');
      }

      // Increment points and append local timeline
      if (currentUser) {
        const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser.uid);
        const pSnap = await getDoc(pDoc);
        let currPoints = 0;
        let currCount = 0;
        if (pSnap.exists()) {
          const data = pSnap.data();
          currPoints = data.contributionPoints || 0;
          currCount = data.actionsCount || 0;
        }
        
        const nextPoints = currPoints + 5;
        const nextCount = currCount + 1;
        
        await setDoc(pDoc, {
          uid: currentUser.uid,
          username: customName,
          role: selectedFactionId,
          online: true,
          joinedAt: serverTimestamp(),
          contributionPoints: nextPoints,
          actionsCount: nextCount
        });

        saveActionToLocalChronicle(
          'MESSAGE',
          `发表廷议建言: "${finalMsg.trim()}"`,
          `得政声言威，功勋 +5 点`,
          roomState?.emperorAge || 14
        );
      }

    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${activeRoomId}/logs`);
    }
  };

  // Preset role details
  const myFaction = FACTION_DEFINITIONS.find(f => f.id === selectedFactionId) || FACTION_DEFINITIONS[0];

  return (
    <div className="bg-[#FAF8F5] border border-[#1A1A1A]/15 p-6 rounded-md shadow-sm text-[#1A1A1A]" id="multiplayer-sandbox-root">
      
      {/* Upper Title HUD */}
      <div className="border-b-2 border-[#8C2F39] pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-[#8C2F39] text-[#F5F2ED] text-[10px] font-mono rounded font-bold uppercase tracking-widest animate-pulse">
              LIVE MULTIPLAYER
            </span>
            <h2 className="text-xl font-serif font-black tracking-wider text-[#1A1A1A]">
              咸阳天命总坛 · 多人实时政略推演
            </h2>
          </div>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            Synchronous Dynastic Altar & Real-time Sovereign Co-Op System via Firebase
          </p>
        </div>
        
        {currentUser && (
          <button
            onClick={handleSignOut}
            className="text-xs bg-white border border-[#1A1A1A]/15 py-1.5 px-3 rounded hover:border-[#8C2F39] hover:text-[#8C2F39] transition-all flex items-center gap-1.5 font-mono font-bold"
            id="multiplayer-signout-btn"
          >
            <LogOut className="w-3.5 h-3.5" /> 挂靴解官 (Leave Sandbox)
          </button>
        )}
      </div>

      {!currentUser ? (
        /* Setup / Authentication Panel */
        <div className="p-2 max-w-xl mx-auto space-y-6" id="multiplayer-auth-form">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#8C2F39]/10 text-[#8C2F39] rounded-full border border-[#8C2F39]/30 shadow-md">
              <Scroll className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-black tracking-wider">
              篆刻你的执政金符·即刻入局
            </h3>
            <p className="text-xs text-[#1A1A1A]/75 px-4 leading-relaxed max-w-md mx-auto">
              在这里注册本届主政人，你将与同在大厅的诸公共同决策秦皇霸业。所有人的每一次“圣旨”、“决策”和“反叛起义”都将通过云端在所有人屏幕上实时相互传导。
            </p>
          </div>

          <form onSubmit={handleCustomLoginAndJoin} className="bg-white/70 border border-[#1A1A1A]/10 p-6 rounded shadow-xs space-y-4">
            
            {/* Custom Call Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-extrabold text-[#1A1A1A]/80 tracking-widest block uppercase">
                推演雅号 (Your Avatar Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="如: 白起, 李斯, 吕氏商帮"
                  maxLength={15}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-50 border border-[#1A1A1A]/20 rounded p-2.5 pl-3 text-xs tracking-wider outline-none focus:border-[#8C2F39] focus:bg-white focus:ring-1 focus:ring-[#8C2F39]/30 transition-all font-serif font-bold"
                />
              </div>
            </div>

            {/* Faction Class Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-extrabold text-[#1A1A1A]/80 tracking-widest block uppercase">
                选择你的社稷朝纲流派 (Select Path Faction)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {FACTION_DEFINITIONS.map((faction) => (
                  <button
                    type="button"
                    key={faction.id}
                    onClick={() => setSelectedFactionId(faction.id)}
                    className={`p-2.5 rounded border text-left transition-all duration-200 flex items-start gap-2.5 hover:border-black/35 ${
                      selectedFactionId === faction.id
                        ? 'border-[#8C2F39] bg-[#8C2F39]/5 shadow-xs'
                        : 'border-[#1A1A1A]/10 bg-transparent'
                    }`}
                  >
                    <span className="text-xl bg-white p-1 rounded border border-[#1A1A1A]/10 shadow-xs leading-none shrink-0">
                      {faction.avatar}
                    </span>
                    <div className="leading-tight">
                      <span className="text-[11px] font-bold block font-serif tracking-wide">{faction.name}</span>
                      <span className="text-[9px] text-[#1A1A1A]/60 block mt-0.5 font-sans line-clamp-2 leading-snug">{faction.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Room ID Passway */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-[11px] font-mono font-extrabold text-[#1A1A1A]/80 tracking-widest">
                <span className="uppercase">山居游说频道 (Room Code)</span>
                <span className="text-[9px] text-amber-600 font-bold">默认：咸阳公会总坛</span>
              </div>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="xianyang-lobby"
                className="w-full bg-slate-50 border border-[#1A1A1A]/20 rounded p-2 px-3 text-xs outline-none focus:border-[#8C2F39] focus:bg-white font-mono"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#8C2F39] text-[#F5F2ED] py-2.5 px-4 rounded text-xs font-mono font-bold tracking-widest uppercase hover:bg-[#8C2F39]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>正在颁授金符大印...</>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> 宣制旨意·纵横入世 (Join Push Altar)
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Joined Room Multiplayer Interface */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="multiplayer-room-dashboard">
          
          {/* LEFT COLUMN: Main HUD Table stats & Active Decrees play (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Real-time shared Celestial State dashboard */}
            <div className="bg-gradient-to-br from-slate-900 to-[#101524] text-white p-5 rounded-md border border-[#1A1A1A]/35 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none select-none font-serif font-black">
                秦
              </div>

              <div className="flex justify-between items-center border-b border-white/10 pb-3.5 mb-3.5">
                <div>
                  <span className="text-[9px] text-amber-400 font-mono tracking-widest block uppercase font-bold">
                    CELESTIAL GLOBAL STATE COUNTERS (REALTIME)
                  </span>
                  <p className="text-sm font-serif font-bold text-white tracking-widest">
                    【山河沙盒说 · 天命大星盘】频道: <span className="text-amber-300 font-mono font-bold uppercase">{activeRoomId}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  云端链接畅通 (Linked)
                </div>
              </div>

              {roomState ? (
                <div>
                  {/* Macro Fate Timeline & Clock Sync */}
                  <div className="bg-black/35 border border-white/5 rounded p-3 mb-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs font-serif">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-amber-950/80 border border-amber-500/40 text-amber-300 p-2 rounded flex flex-col items-center justify-center w-12 h-12 shrink-0 text-center relative overflow-hidden">
                        <span className="text-[13px] font-black leading-none">
                          {roomState.gameSeason === 'SPRING' ? '🌸 春' :
                           roomState.gameSeason === 'SUMMER' ? '🌊 夏' :
                           roomState.gameSeason === 'AUTUMN' ? '🌾 秋' : '❄️ 冬'}
                        </span>
                        <span className="text-[8px] font-mono mt-0.5 opacity-70">
                          {roomState.gameSeason || 'SPRING'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-black text-white tracking-widest leading-none">
                            秦政纪元 {roomState.gameYear !== undefined ? roomState.gameYear - 228 + 15 : 17} 年 
                            ({roomState.gameYear !== undefined ? `公元前 ${roomState.gameYear} 年` : '公元前 230 年'})
                          </span>
                          <span className="text-[9px] bg-red-955 text-amber-400 border border-red-900/40 px-1.5 py-0.2 rounded font-serif leading-none mt-0.5 md:mt-0">
                            {roomState.gameSeason === 'SPRING' ? '春分・万物春播' :
                             roomState.gameSeason === 'SUMMER' ? '夏至・大商通澜' :
                             roomState.gameSeason === 'AUTUMN' ? '秋分・社稷大获' : '冬至・冰封饷寒'}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 mt-1 font-sans leading-none">
                          {isHost ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1 font-mono text-[9px]">
                              🔮 司天仪盘由你主持中 — 驱动神州历法齿轮 ({(!roomState.timeSpeed || roomState.timeSpeed === 'NORMAL') ? '常流 8秒/季' : roomState.timeSpeed === 'FAST' ? '飞流 4秒/季' : '天演止步'})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-mono text-[9px]">
                              📜 司天主持：{roomState.hostName || '天机代行者'} 正在驱动历法流逝
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded border border-white/10 font-mono text-[9.5px]">
                      <button
                        type="button"
                        onClick={async () => {
                          const roomDocRef = doc(db, 'rooms', activeRoomId);
                          await updateDoc(roomDocRef, { timeSpeed: 'PAUSED', updatedAt: serverTimestamp() });
                          const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
                          await addDoc(logsColRef, {
                            text: `⏸️【${customName}】召集廷议：恳请暂停宏观天命演化时钟。`,
                            username: '朝堂疏',
                            role: myFaction.name.split(' (')[0],
                            timestamp: serverTimestamp()
                          });
                        }}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${roomState.timeSpeed === 'PAUSED' ? 'bg-red-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                      >
                        ⏸️ 停
                      </button>
                      <button
                        type="button"
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${(!roomState.timeSpeed || roomState.timeSpeed === 'NORMAL') ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        onClick={async () => {
                          const roomDocRef = doc(db, 'rooms', activeRoomId);
                          await updateDoc(roomDocRef, { timeSpeed: 'NORMAL', updatedAt: serverTimestamp() });
                          const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
                          await addDoc(logsColRef, {
                            text: `▶️【${customName}】合奏：疏请恢复神州大演正常流速 (8s/季)。`,
                            username: '朝堂疏',
                            role: myFaction.name.split(' (')[0],
                            timestamp: serverTimestamp()
                          });
                        }}
                      >
                        ▶️ 常速
                      </button>
                      <button
                        type="button"
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${roomState.timeSpeed === 'FAST' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        onClick={async () => {
                          const roomDocRef = doc(db, 'rooms', activeRoomId);
                          await updateDoc(roomDocRef, { timeSpeed: 'FAST', updatedAt: serverTimestamp() });
                          const logsColRef = collection(db, 'rooms', activeRoomId, 'logs');
                          await addDoc(logsColRef, {
                            text: `⏩【${customName}】颁行特敕：极速飞转历法齿轮 (4s/季)。`,
                            username: '朝堂疏',
                            role: myFaction.name.split(' (')[0],
                            timestamp: serverTimestamp()
                          });
                        }}
                      >
                        ⏩ 飞速
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    
                    {/* Share Stat 1: Mandate */}
                    <motion.div 
                      animate={{
                        boxShadow: mandateFlash ? [
                          "0px 0px 0px rgba(245,158,11,0)", 
                          "0px 0px 15px rgba(245,158,11,0.6)", 
                          "0px 0px 0px rgba(245,158,11,0)"
                        ] : "0px 0px 0px rgba(0,0,0,0)",
                        borderColor: mandateFlash ? ["rgba(255,255,255,0.05)", "rgba(245,158,11,0.8)", "rgba(255,255,255,0.05)"] : "rgba(255,255,255,0.05)",
                        scale: mandateFlash ? [1, 1.04, 1] : 1
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="bg-white/5 border border-white/5 p-3 rounded relative overflow-hidden"
                    >
                      {/* Golden shimmer line overlay */}
                      {mandateFlash && (
                        <motion.div 
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.0, ease: "easeInOut" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none"
                        />
                      )}
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-bold">神州天命值</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-mono font-black text-amber-300">{roomState.mandate}%</span>
                        <span className="text-[10px] text-slate-400">Mandate</span>
                      </div>
                      {/* Compact custom progress bar */}
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="bg-amber-400 h-full transition-all duration-500" 
                          style={{ width: `${roomState.mandate}%` }}
                        ></div>
                      </div>
                    </motion.div>

                    {/* Share Stat 2: Stability */}
                    <motion.div 
                      animate={{
                        boxShadow: stabilityFlash ? [
                          "0px 0px 0px rgba(168,85,247,0)", 
                          "0px 0px 15px rgba(168,85,247,0.6)", 
                          "0px 0px 0px rgba(168,85,247,0)"
                        ] : "0px 0px 0px rgba(0,0,0,0)",
                        borderColor: stabilityFlash ? ["rgba(255,255,255,0.05)", "rgba(168,85,247,0.8)", "rgba(255,255,255,0.05)"] : "rgba(255,255,255,0.05)",
                        scale: stabilityFlash ? [1, 1.04, 1] : 1
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="bg-white/5 border border-white/5 p-3 rounded relative overflow-hidden"
                    >
                      {/* Purple shimmer line overlay */}
                      {stabilityFlash && (
                        <motion.div 
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.0, ease: "easeInOut" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none"
                        />
                      )}
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-bold">朝堂政治稳定</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-mono font-black text-purple-300">{roomState.stability}%</span>
                        <span className="text-[10px] text-slate-400">Stability</span>
                      </div>
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="bg-purple-400 h-full transition-all duration-500" 
                          style={{ width: `${roomState.stability}%` }}
                        ></div>
                      </div>
                    </motion.div>

                    {/* Share Stat 3: Coffers */}
                    <motion.div 
                      animate={{
                        boxShadow: coffersFlash ? [
                          "0px 0px 0px rgba(16,185,129,0)", 
                          "0px 0px 15px rgba(16,185,129,0.6)", 
                          "0px 0px 0px rgba(16,185,129,0)"
                        ] : "0px 0px 0px rgba(0,0,0,0)",
                        borderColor: coffersFlash ? ["rgba(255,255,255,0.05)", "rgba(16,185,129,0.8)", "rgba(255,255,255,0.05)"] : "rgba(255,255,255,0.05)",
                        scale: coffersFlash ? [1, 1.04, 1] : 1
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="bg-white/5 border border-white/5 p-3 rounded relative overflow-hidden"
                    >
                      {/* Green shimmer line overlay */}
                      {coffersFlash && (
                        <motion.div 
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.0, ease: "easeInOut" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none"
                        />
                      )}
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-bold">大司农岁收国财</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[19px] font-mono font-black text-emerald-300">{roomState.coffers}</span>
                        <span className="text-[10px] text-slate-400">贯</span>
                      </div>
                      <div className="text-[9px] text-emerald-400/80 mt-1.5 font-mono truncate">
                        ★ 金石府库充实
                      </div>
                    </motion.div>

                    {/* Share Stat 4: Emperor Age */}
                    <motion.div 
                      animate={{
                        boxShadow: emperorAgeFlash ? [
                          "0px 0px 0px rgba(59,130,246,0)", 
                          "0px 0px 15px rgba(59,130,246,0.6)", 
                          "0px 0px 0px rgba(59,130,246,0)"
                        ] : "0px 0px 0px rgba(0,0,0,0)",
                        borderColor: emperorAgeFlash ? ["rgba(255,255,255,0.05)", "rgba(59,130,246,0.8)", "rgba(255,255,255,0.05)"] : "rgba(255,255,255,0.05)",
                        scale: emperorAgeFlash ? [1, 1.04, 1] : 1
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="bg-white/5 border border-white/5 p-3 rounded relative overflow-hidden"
                    >
                      {/* Blue shimmer line overlay */}
                      {emperorAgeFlash && (
                        <motion.div 
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ duration: 1.0, ease: "easeInOut" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none"
                        />
                      )}
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-bold">幼君天子寿命</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-mono font-black text-blue-300">{roomState.emperorAge}岁</span>
                        <span className="text-[10px] text-slate-400">Age</span>
                      </div>
                      <span className={`text-[9px] mt-1.5 block font-serif font-bold ${roomState.emperorAge < 16 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {roomState.emperorAge < 16 ? '⚠️ 傀儡幼帝 (Weak)' : '👑 天子辅熟精干'}
                      </span>
                    </motion.div>

                    {/* Share Stat 5: Agriculture Index */}
                    <motion.div className="bg-white/5 border border-white/5 p-3 rounded relative overflow-hidden">
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-bold">社稷农耕实力</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-mono font-black text-emerald-400">{roomState.agricultureIndex !== undefined ? roomState.agricultureIndex : 60}%</span>
                        <span className="text-[10px] text-slate-400">Agri</span>
                      </div>
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="bg-emerald-400 h-full transition-all duration-500" 
                          style={{ width: `${roomState.agricultureIndex !== undefined ? roomState.agricultureIndex : 60}%` }}
                        ></div>
                      </div>
                    </motion.div>

                    {/* Share Stat 6: Commerce Index */}
                    <motion.div className="bg-white/5 border border-white/5 p-3 rounded relative overflow-hidden">
                      <span className="text-[9px] text-slate-400 font-mono tracking-wider block font-bold">市籍商旅通达</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-mono font-black text-amber-200">{roomState.commerceIndex !== undefined ? roomState.commerceIndex : 50}%</span>
                        <span className="text-[10px] text-slate-400">Comm</span>
                      </div>
                      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="bg-amber-400 h-full transition-all duration-500" 
                          style={{ width: `${roomState.commerceIndex !== undefined ? roomState.commerceIndex : 50}%` }}
                        ></div>
                      </div>
                    </motion.div>

                  </div>

                  {/* Operational Incidents Ledger Feed ticker */}
                  {roomState.recentIncidents && roomState.recentIncidents.length > 0 && (
                    <div className="mt-4 bg-black/40 border border-white/5 rounded p-3 text-xs">
                      <span className="text-[10px] text-amber-500 font-mono tracking-widest block uppercase font-bold mb-1.5 flex items-center gap-1">
                        🚨 社稷天瑞地异自主演化简报 (AUTONOMOUS ENVIRONMENT RECENT LEDGER)
                      </span>
                      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 font-serif scrollbar-thin">
                        {roomState.recentIncidents.map((incident, idx) => (
                          <div key={idx} className="text-slate-300 flex items-start gap-1 py-1 border-b border-white/[0.03] last:border-0 leading-relaxed text-[10.5px]">
                            <span className="text-[#8C2F39] text-xs leading-none">🔸</span>
                            <span>{incident}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex items-center justify-center py-6 text-slate-400 font-mono text-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  听召中... 正在开启天命法阵...
                </div>
              )}
            </div>

            {/* Real-time character profile & actions toggle tab */}

            <div className="flex bg-[#FAF8F5] border border-[#1A1A1A]/15 rounded p-1 shadow-xs justify-between gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setSubTab('tactics')}
                className={`flex-1 py-2 px-2 text-[10.5px] font-serif font-black tracking-widest text-center rounded transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[110px] ${
                  subTab === 'tactics'
                    ? 'bg-[#8F1D2C] text-[#F5F2ED] shadow-sm'
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-slate-50'
                }`}
              >
                🛡️ 兵戈沙盘 (War Sandbox)
              </button>
              <button
                type="button"
                onClick={() => setSubTab('war_room')}
                className={`flex-1 py-2 px-2 text-[10.5px] font-serif font-black tracking-widest text-center rounded transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[110px] ${
                  subTab === 'war_room'
                    ? 'bg-[#8F1D2C] text-[#F5F2ED] shadow-sm'
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-slate-50'
                }`}
              >
                📡 战备密策局 (War Strategy Board)
              </button>
              <button
                type="button"
                onClick={() => setSubTab('decrees')}
                className={`flex-1 py-2 px-2 text-[10.5px] font-serif font-black tracking-widest text-center rounded transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[110px] ${
                  subTab === 'decrees'
                    ? 'bg-[#8F1D2C] text-[#F5F2ED] shadow-sm'
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-slate-50'
                }`}
              >
                📜 特权敕命 (Sovereign Decrees)
              </button>
              <button
                type="button"
                onClick={() => setSubTab('spy_agency')}
                className={`flex-1 py-2 px-2 text-[10.5px] font-serif font-black tracking-widest text-center rounded transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[110px] ${
                  subTab === 'spy_agency'
                    ? 'bg-[#8F1D2C] text-[#F5F2ED] shadow-sm'
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-slate-50'
                }`}
              >
                👁️ 用间大谍局 (Espionage Network)
              </button>
              <button
                type="button"
                onClick={() => setSubTab('profile')}
                className={`flex-1 py-2 px-2 text-[10.5px] font-serif font-black tracking-widest text-center rounded transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[110px] ${
                  subTab === 'profile'
                    ? 'bg-[#8F1D2C] text-[#F5F2ED] shadow-sm'
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-slate-50'
                }`}
              >
                👤 主政官阶 (Character Profile)
              </button>
            </div>

            {subTab === 'tactics' ? (
              /* Tactics sandbag board incorporating Sun Tzu's Art of War principles */
              <div className="bg-gradient-to-b from-[#131722] to-[#1C2130] text-slate-100 border border-slate-800 rounded-lg p-5 space-y-6 shadow-xl relative overflow-hidden" id="art-of-war-sandbox-board">
                
                {/* Background watermarks for atmospheric design */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-[180px] font-serif font-bold pointer-events-none select-none text-red-500">
                  兵
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] text-red-400 font-mono tracking-widest block uppercase font-bold">
                      SUN TZU’S ART OF WAR SURVIVAL CAMPAIGN (实时兵战)
                    </span>
                    <h3 className="font-serif font-extrabold text-white tracking-wider text-base flex items-center gap-1.5 mt-0.5">
                      ⚔️ 兵势生存：孙子兵法实操决局
                    </h3>
                  </div>
                  <span className="py-0.5 px-2 bg-red-950 border border-red-800/40 text-red-400 text-[10px] font-serif font-bold rounded-full self-start sm:self-auto uppercase tracking-wider">
                    五事评估/奇正攻防
                  </span>
                </div>

                {/* Section A: Sun Tzu’s Appraisal of Five Factors (始计篇-五事) */}
                <div className="space-y-2">
                  <h4 className="text-[10.5px] font-mono font-bold text-slate-400 block tracking-widest uppercase">
                    📐 《始计篇》· 庙算五事要素
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-300">
                    
                    {/* 道: Mandate based */}
                    <div className="bg-white/5 border border-white/5 p-2 rounded text-center">
                      <span className="text-[11px] font-serif font-black text-amber-400 block border-b border-white/10 pb-1 mb-1">
                        道 (Moral)
                      </span>
                      <span className="text-[10.5px] font-serif block min-h-[30px] flex items-center justify-center leading-tight">
                        {roomState ? (
                          roomState.mandate >= 70 ? '上下同欲生死不避' :
                          roomState.mandate >= 40 ? '群黎背德勉强随朝' : '逆反崩坏危在旦夕'
                        ) : '算无常策'}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase mt-1 block">天命主宰</span>
                    </div>

                    {/* 天: Age based seasonal indicator */}
                    <div className="bg-white/5 border border-white/5 p-2 rounded text-center">
                      <span className="text-[11px] font-serif font-black text-blue-400 block border-b border-white/10 pb-1 mb-1">
                        天 (Climate)
                      </span>
                      <span className="text-[10.5px] font-serif block min-h-[30px] flex items-center justify-center leading-tight">
                        {roomState ? (
                          roomState.emperorAge < 16 ? '春霜初融寒冻未退' :
                          roomState.emperorAge < 35 ? '冬雪藏锋乾坤肃穆' : '九鼎正盛金秋大吉'
                        ) : '时运未知'}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase mt-1 block">时运交替</span>
                    </div>

                    {/* 地: Terrain based */}
                    <div className="bg-white/5 border border-white/5 p-2 rounded text-center">
                      <span className="text-[11px] font-serif font-black text-emerald-400 block border-b border-white/10 pb-1 mb-1">
                        地 (Terrain)
                      </span>
                      <span className="text-[10.5px] font-serif block min-h-[30px] flex items-center justify-center leading-tight">
                        {roomState ? (
                          roomState.enemyTerrain === 'DEATH' ? '💀 死地：背水求生' :
                          roomState.enemyTerrain === 'KEY' ? '争地：险扼固防' : '散地：溃卒思归'
                        ) : '地舆平实'}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase mt-1 block">地理死生</span>
                    </div>

                    {/* 将: Active Presence based */}
                    <div className="bg-white/5 border border-white/5 p-2 rounded text-center">
                      <span className="text-[11px] font-serif font-black text-purple-400 block border-b border-white/10 pb-1 mb-1">
                        将 (General)
                      </span>
                      <span className="text-[10.5px] font-serif block min-h-[30px] flex items-center justify-center leading-tight">
                        {playersList.length > 2 ? '贤良云集智信仁勇' : '寡人宿卫独谋孤振'}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase mt-1 block">将领能动</span>
                    </div>

                    {/* 法: System logistics base on stability and coffers */}
                    <div className="bg-white/5 border border-white/5 p-2 rounded text-center">
                      <span className="text-[11px] font-serif font-black text-red-400 block border-b border-white/10 pb-1 mb-1">
                        法 (Logistics)
                      </span>
                      <span className="text-[10.5px] font-serif block min-h-[30px] flex items-center justify-center leading-tight">
                        {roomState ? (
                          roomState.coffers > 30000 && roomState.stability > 60 ? '法：辎重齐集退法纪' : '辎竭兵懈三军失统'
                        ) : '律法不行'}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase mt-1 block">财资法制</span>
                    </div>

                  </div>
                </div>

                {/* Section B: Active Warlord Threat details (戎寇犯关) */}
                {roomState ? (
                  <div className="bg-[#0f121d] border border-white/10 rounded-md p-4 space-y-4">
                    
                    {/* Enemy and forces progress info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[9.5px] font-mono text-rose-400 font-bold tracking-widest block uppercase">
                          ⚔️ CURRENT HOSTILE THREAT (边关犯敌态势)
                        </span>
                        <h4 className="text-sm font-serif font-black text-slate-100 flex items-center gap-1.5 mt-0.5">
                          {roomState.enemyName || '塞外匈奴单于铁骑（精锐）'}
                        </h4>
                      </div>
                      
                      <div className="bg-rose-950/40 border border-rose-900/50 px-2 py-1 rounded text-right shrink-0">
                        <span className="text-[9px] font-mono text-rose-300 block">寇边敌众</span>
                        <span className="text-[12px] font-mono font-black text-rose-400">
                          {roomState.enemyPower !== undefined ? roomState.enemyPower.toLocaleString() : '45,000'} 人
                        </span>
                      </div>
                    </div>

                    {/* Force progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span>寇部余党 (Remaining Strength)</span>
                        <span>{Math.round(((roomState.enemyPower !== undefined ? roomState.enemyPower : 45000) / (roomState.enemyMaxPower !== undefined ? roomState.enemyMaxPower : 45000)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-[#1A1E2E] h-2 rounded overflow-hidden">
                        <motion.div 
                          className="bg-red-500 h-full"
                          initial={{ width: '100%' }}
                          animate={{ width: `${Math.min(100, Math.max(0, (((roomState.enemyPower !== undefined ? roomState.enemyPower : 45000) / (roomState.enemyMaxPower !== undefined ? roomState.enemyMaxPower : 45000)) * 100)))}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>

                    {/* Flags row: Morale & Flaws */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                      
                      {/* Morale Control Flags */}
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-md">
                        <span className="text-[9.5px] text-slate-400 block font-mono font-bold uppercase mb-1">
                          🚩 《治气篇》敌寇气势
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`p-1 px-1.5 text-[11px] font-serif font-black rounded ${
                            roomState.enemyMorale === 'SHARP' ? 'bg-red-950 text-red-400 border border-red-900/40' :
                            roomState.enemyMorale === 'SLUGGISH' ? 'bg-amber-950/80 text-amber-300 border border-amber-900/40' :
                            'bg-emerald-950 text-emerald-400 border border-emerald-900/40 animate-pulse'
                          }`}>
                            {roomState.enemyMorale === 'SHARP' ? '锐气 (锋芒正盛)' :
                             roomState.enemyMorale === 'SLUGGISH' ? '惰气 (怠慢趋疲)' :
                             '归气 (暮竭待歼！★ 2.5X 暴击爆发期！)'}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#A0A2B0] leading-tight block mt-1.5 italic">
                          {roomState.enemyMorale === 'SHARP' ? '“早晨饱满，正午疲惫”。锐气当锋，极度不宜硬刚，请行治气周旋。' :
                           roomState.enemyMorale === 'SLUGGISH' ? '“惰气已露”。可尝试以奇正之策，寻机突袭。' :
                           '“归气如崩”。机不可失！此时发动【奇正掩攻】可施 250% 斩寇暴击！'}
                        </p>
                      </div>

                      {/* Flaw / Exposed Weakness */}
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-md">
                        <span className="text-[9.5px] text-slate-400 block font-mono font-bold uppercase mb-1">
                          🎯 《将危篇》统帅破绽
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`p-1 px-1.5 text-[11px] font-serif font-black rounded ${
                            roomState.enemyFlaw === 'EXPOSED' ? 'bg-[#5c2a1c] text-rose-300 border border-rose-600 animate-bounce' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {roomState.enemyFlaw === 'EXPOSED' ? '💥 怒形于色 (Exposed - 暴击翻倍！)' : '🛡️ 忿速暴躁 (Tempered - 空隙未显)'}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#A0A2B0] leading-tight block mt-1.5 italic">
                          {roomState.enemyFlaw === 'EXPOSED' ? '敌酋被我方书信、戏赠妇冠激怒丧失防守章法，强攻承受 2.0 倍终极破防！' :
                           '敌首暴躁但闭关拒战。可施展《挑动将危》行离间激怒诡计，扒其坚防！'}
                        </p>
                      </div>

                    </div>

                    {/* Our combat Forces deployment summary */}
                    <div className="bg-white/[0.01] border border-dashed border-white/10 p-3 rounded-md flex justify-around flex-wrap gap-3">
                      <div className="text-center">
                        <span className="text-[8.5px] font-mono text-slate-400 block">我王师 【正兵当面】</span>
                        <span className="text-sm font-mono font-black text-blue-400 block mt-0.5">
                          🛡️ {(roomState.ourRegular || 35000).toLocaleString()} 戈
                        </span>
                        <span className="text-[8px] text-slate-400 leading-none">正面牵制阻隔防线</span>
                      </div>
                      
                      <div className="w-[1px] bg-white/10 hidden sm:block self-stretch" />

                      <div className="text-center">
                        <span className="text-[8.5px] font-mono text-slate-400 block">我精骑 【奇兵迂回】</span>
                        <span className="text-sm font-mono font-black text-amber-400 block mt-0.5">
                          ⚔️ {(roomState.ourSurprise || 12000).toLocaleString()} 骑
                        </span>
                        <span className="text-[8px] text-slate-400 leading-none">合围后翼瞬秒杀招</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs">
                    正在调配关外御边山河图，请稍后...
                  </div>
                )}

                {/* Option 2: Precomputations for live dynamic balance of power */}
                {(() => {
                  const alliedTroopsCount = mapUnitsList.filter(u => u.side === 'allied').reduce((sum, u) => sum + u.size, 0);
                  const hostileTroopsCount = mapUnitsList.filter(u => u.side === 'hostile').reduce((sum, u) => sum + u.size, 0);
                  const totalTroopsCount = alliedTroopsCount + hostileTroopsCount;
                  const alliedPowerPct = totalTroopsCount > 0 ? (alliedTroopsCount / totalTroopsCount) * 100 : 50;
                  
                  return (
                    <div className="bg-[#121622]/90 border border-slate-800 rounded-md p-4 space-y-4">
                      {/* Title */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-2 gap-2">
                        <div>
                          <span className="text-[9px] text-[#5ce1b7] font-mono tracking-widest block uppercase font-bold">
                            Step 2 · MAP SYNERGY & EXPEDITIONARY COMMAND (大地图军戈连携)
                          </span>
                          <h4 className="text-xs font-serif font-black text-white flex items-center gap-1.5 mt-0.5">
                            🌍 神州实境大舆图·三军跨维度联动指挥雷达
                          </h4>
                        </div>
                        <span className="py-0.5 px-1.5 bg-emerald-950 text-emerald-400 text-[8.5px] font-mono rounded font-bold border border-emerald-900/40">
                          联客云端舆图连结：{mapUnitsList.length} 曲驻守
                        </span>
                      </div>

                      {/* Option 2: Battlefield Live Sync & Wireless Combat Controller */}
                      <div className="bg-[#182035]/80 border border-blue-900/40 p-4 rounded-lg flex flex-col gap-4 text-xs text-[#E2E8F0] shadow-md relative overflow-hidden">
                        {/* Decorative watermark */}
                        <div className="absolute right-4 bottom-4 opacity-[0.03] text-5xl font-mono select-none pointer-events-none">
                          CMD
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-3 gap-3">
                          <div className="space-y-1 text-left">
                            <span className="text-[9px] font-mono tracking-widest uppercase text-[#5ce1b7] font-black block">
                              📡 WIRELESS BATTLER ALTAR · 隔空军令指挥坛
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`h-2.5 w-2.5 rounded-full ${roomState?.mapBattleSimulating ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
                              <span className="font-bold text-[11px] text-white">
                                大图演武战局状况: {roomState?.mapBattleSimulating ? (
                                  <span className="text-rose-400 font-serif font-black animate-pulse">⚔️ 实境两军交锋推演中</span>
                                ) : (
                                  <span className="text-slate-400 font-serif font-normal">🛖 边境边防营垒静默</span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                              type="button"
                              disabled={isActionCooldown || !activeRoomId}
                              onClick={handleToggleMapSimulation}
                              className={`py-1.5 px-3 rounded text-[10.5px] font-serif font-bold tracking-wider cursor-pointer transition-all active:scale-95 shadow border ${
                                roomState?.mapBattleSimulating 
                                  ? 'bg-[#8F1D2C] text-[#F5F2ED] border-red-800/40 hover:bg-rose-900' 
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900'
                              }`}
                            >
                              {roomState?.mapBattleSimulating ? '🛖 隔空鸣金收兵' : '⚔️ 隔空擂鼓交兵'}
                            </button>
                          </div>
                        </div>

                        {/* Stance and General Selection Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-serif flex items-center gap-1 text-[11px] font-bold">
                              🛡️ 指导王师迎击方略 (Allied Tactical Stance)
                            </label>
                            <select
                              disabled={!activeRoomId}
                              value={roomState?.mapBattleStance || 'defensive'}
                              onChange={(e) => handleUpdateMapStance(e.target.value)}
                              className="w-full bg-slate-905 border border-white/10 rounded p-1.5 text-xs text-yellow-105 outline-none focus:border-blue-500 font-mono text-white/90 bg-slate-900"
                            >
                              <option value="offensive">⚔️ 主力大举攻势 (Allied Offensive Stance)</option>
                              <option value="defensive">🛡️ 凭高据隘死守 (Allied Defensive Stance)</option>
                              <option value="ambush">🏹 险途秘密伏击 (Allied Ambush Stance)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-serif flex items-center gap-1 text-[11px] font-bold">
                              🎖️ 拜委战区前沿大总帅 (Supreme Field Marshal)
                            </label>
                            <select
                              disabled={!activeRoomId}
                              value={roomState?.mapBattleGeneral || 'caocao'}
                              onChange={(e) => handleUpdateMapGeneral(e.target.value)}
                              className="w-full bg-slate-905 border border-white/10 rounded p-1.5 text-xs text-yellow-105 outline-none focus:border-blue-500 font-mono text-white/90 bg-slate-900"
                            >
                              <option value="caocao">曹操 (枭雄孟德 · 倚伏奇谋)</option>
                              <option value="baiqi">白起 (人屠杀神 · 围剿绝战)</option>
                              <option value="hanxin">韩信 (背水兵仙 · 多多益善)</option>
                              <option value="caoren">曹仁 (守卫铁壁 · 八门金锁)</option>
                            </select>
                          </div>
                        </div>

                        {/* Balance of Power Bar */}
                        <div className="space-y-2 mt-1 border-t border-white/[0.03] pt-3 text-left">
                          <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-400 uppercase">
                            <span className="text-blue-400 font-bold">🛡️ 朝廷王师: {alliedTroopsCount.toLocaleString()} 兵甲</span>
                            <span>边塞角峙均势</span>
                            <span className="text-red-400 font-bold">🏹 边境寇叛: {hostileTroopsCount.toLocaleString()} 贼戈</span>
                          </div>
                          
                          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden flex border border-white/5 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-blue-700 to-cyan-500 h-full transition-all duration-700" 
                              style={{ width: `${alliedPowerPct}%` }}
                            />
                            <div 
                              className="bg-gradient-to-r from-red-500 to-rose-700 h-full transition-all duration-700" 
                              style={{ width: `${100 - alliedPowerPct}%` }}
                            />
                          </div>

                          <div className="text-[10px] bg-slate-900/40 p-2 rounded leading-relaxed border border-white/[0.01]">
                            <span className="text-[#5ce1b7] font-mono">📡 军机处地缘宏观解密：</span>
                            <span className="text-slate-300">
                              {totalTroopsCount === 0 ? (
                                "前线旷古荒芜，尚无两军安营。寇探若袭，则烽燧易失，万望指派主力空降大舆图驻扎！"
                              ) : alliedPowerPct >= 70 ? (
                                "朝廷天策之师已呈绝对重兵合围！王师势崩雷鸣，可火速【隔空擂鼓交兵】犁庭扫穴！"
                              ) : alliedPowerPct >= 50 ? (
                                "两军关隘均势盘旋，我方略呈微弱地利优势。宜拜选前军大将军白起/韩信，发起总战役！"
                              ) : alliedPowerPct >= 30 ? (
                                "寇叛攻防势焰正隆，我军寡不敌众危矣，建议选换【凭塞防守】避战，并从下方出重金【驰援粮饷】！"
                              ) : (
                                "朝廷大营危在旦夕！贼兵已成压倒重重包围！急需各位内阁阁老下拨重金饷银紧急空投精锐王师部队！"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Live list of units */}
                    <div className="bg-black/30 p-3 rounded border border-white/5 space-y-3">
                      <h5 className="text-[10px] font-mono font-bold text-slate-400 border-b border-white/5 pb-1 flex justify-between items-center">
                        <span>📡 全境图上驻防师团雷达面板 ({mapUnitsList.length})</span>
                        <span className="text-[8px] text-slate-500 font-normal">宿定于同联机房间ID</span>
                      </h5>

                      <div className="max-h-[190px] overflow-y-auto space-y-2 pr-0.5" id="multiplayer-radar-scroller">
                        {mapUnitsList.length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-slate-500 font-mono italic leading-relaxed">
                            “神州边防，烽塞静默。”<br />
                            当前无任何三军部曲安营。请通过右侧落款，空掷兵符开赴疆土！
                          </div>
                        ) : (
                          mapUnitsList.map((unit) => {
                            const isAllied = unit.side === 'allied';
                            return (
                              <div key={unit.id} className="bg-[#0f121b] border border-white/[0.04] p-2 rounded flex justify-between items-center text-xs">
                                <div className="space-y-0.5 text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-serif font-black text-[11.5px] text-amber-200">
                                      【{unit.name}】
                                    </span>
                                    <span className={`px-1 py-0.2 text-[8px] font-mono rounded border ${isAllied ? 'bg-blue-950/60 text-blue-400 border-blue-900/40' : 'bg-red-950/60 text-red-400 border-red-900/40'}`}>
                                      {isAllied ? '🛡️ 朝廷王师' : '🏹 寇叛拦截'}
                                    </span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-300 font-mono">
                                    兵马: <strong className={isAllied ? 'text-blue-400' : 'text-red-400'}>{unit.size.toLocaleString()}</strong> 戈
                                  </p>
                                  <p className="text-[9px] text-slate-500 leading-none">
                                    纬纬: {unit.lat.toFixed(3)}, 经经: {unit.lng.toFixed(3)} | 参赞: {unit.creatorName}
                                  </p>
                                </div>

                                <div className="shrink-0 pl-1">
                                  {isAllied ? (
                                    <button
                                      type="button"
                                      disabled={isActionCooldown}
                                      onClick={() => handleRemoteSupportStrike(unit.id, unit.name, true)}
                                      className="py-1 px-2 bg-blue-950 hover:bg-blue-900 text-blue-300 hover:text-white border border-blue-800/40 text-[9px] font-serif rounded cursor-pointer transition-all active:scale-95"
                                      title="拨发辎重，驰援补充此王师 5,000 新召勇卒"
                                    >
                                      🏰 驰粮 (+5k)
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isActionCooldown}
                                      onClick={() => handleRemoteSupportStrike(unit.id, unit.name, false)}
                                      className="py-1 px-2 bg-red-950 hover:bg-red-900 text-red-300 hover:text-white border border-red-900/40 text-[9px] font-serif rounded cursor-pointer transition-all active:scale-95"
                                      title="引爆远程火药阵，从地球卫星实景图上全歼并抹除贼匪！"
                                    >
                                      🔥 剿天 (Wipe)
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right: Deploy Unit Form */}
                    <form onSubmit={handleDeployMapUnit} className="bg-black/35 p-3 rounded border border-white/5 space-y-3">
                      <h5 className="text-[10px] font-mono font-bold text-slate-400 border-b border-white/5 pb-1 text-left">
                        ⚔️ 飞符调将 · 跨维度空降大地图曲部 (Deploy Force)
                      </h5>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1 text-left">
                          <label className="text-slate-400 block font-serif">部曲军号 Banner Name</label>
                          <input
                            type="text"
                            required
                            placeholder="如: 羽林飞骑营"
                            value={deployMapUnitName}
                            onChange={(e) => setDeployMapUnitName(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded p-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500 font-serif"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-slate-400 block font-serif">神州边隘要冲 Sector</label>
                          <select
                            value={deployBattlefieldPreset}
                            onChange={(e) => setDeployBattlefieldPreset(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded p-1.5 text-[11px] text-slate-200 outline-none"
                          >
                            {PRESET_BATTLEFIELDS.map(b => (
                              <option key={b.key} value={b.key}>{b.name.split(' ')[0]}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-slate-400 block font-serif">募卒配额 Strength</label>
                          <select
                            value={deployMapUnitSize}
                            onChange={(e) => setDeployMapUnitSize(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-white/10 rounded p-1.5 text-[11px] text-slate-200 outline-none font-mono"
                          >
                            <option value="5000">5,000 先登轻卒</option>
                            <option value="10000">10,000 锐卒前锋</option>
                            <option value="20000">20,000 天策中甲</option>
                            <option value="40000">40,000 镇国神御</option>
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-slate-400 block font-serif">战阵所属政权 Alignment</label>
                          <select
                            value={deployMapUnitSide}
                            onChange={(e) => setDeployMapUnitSide(e.target.value as any)}
                            className="w-full bg-slate-900 border border-white/10 rounded p-1.5 text-[11px] text-slate-200 outline-none"
                          >
                            <option value="allied font-serif">🗡️ 守护我朝王师 (Allied)</option>
                            <option value="hostile font-serif">🏹 边关侵扰贼众 (Enemy Host)</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[10.5px] text-slate-400 leading-normal text-left bg-slate-900/60 p-2 rounded border border-white/[0.02]">
                        💡 <strong>天策开销</strong>：派遣将领折损 <strong>15% 气血精力 (Vigor)</strong>，起草大纛支度 <strong>2500 贯</strong> 辅币饷。此曲部可飞落至三维地图物理轨道，参与多人战略移防。
                      </div>

                      <button
                        type="submit"
                        disabled={isActionCooldown || (roomState?.coffers || 45000) < 2500}
                        className="w-full bg-gradient-to-r from-emerald-950 to-[#8F1D2C]/40 hover:from-emerald-900 hover:to-[#8F1D2C]/60 border border-emerald-900/40 text-[#F5F2ED] p-2 rounded text-xs font-serif font-black tracking-widest cursor-pointer transition-all text-center flex items-center justify-center gap-1 active:scale-95 shadow-md uppercase"
                      >
                        📐 起兵授符 · 紧急空投调发大舆图部署
                      </button>
                    </form>
                  </div>
                </div>
              );
            })()}

            {/* Section C: Art of War Survival Decisions buttons (孙子兵法推策决策) */}
                <div className="space-y-3">
                  <h4 className="text-[10.5px] font-mono font-bold text-slate-400 tracking-widest uppercase block mb-1">
                    📖 执子御敌：孙子十三篇推演抉择
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left text-slate-200">
                    
                    {/* 1. Chapter 6: Demonstrate Void / Create Illusions */}
                    <button
                      type="button"
                      onClick={() => handleExecuteTactics('DEMONSTRATE_VOID')}
                      disabled={isActionCooldown || !roomState || (roomState?.enemyPower === 0)}
                      className="cursor-pointer text-left border border-slate-700/60 hover:border-amber-500/50 p-3.5 rounded bg-white/[0.03] hover:bg-white/[0.05] transition-all group relative"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs block font-serif font-black text-amber-300 group-hover:text-amber-400 transition-colors">
                          ① 《虚实篇》：示形诡道 (Deceptive Phantoms)
                        </span>
                        <span className="text-[9px] bg-amber-950 text-amber-400 px-1.5 py-0.5 font-mono rounded">
                          虚诡之兵
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#C0C2D0] block mt-1.5 leading-normal">
                        多设灶火狼烟，虚设巨鼓空垒，欺敌迟疑。削磨敌军意气。
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-dashed border-white/10 flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span className="text-amber-400">⚡ 支出：4000 贯 (司农)</span>
                        <span className="text-emerald-400 font-bold">得：稳定性 +8 / 敌气转 [惰气]</span>
                      </div>
                    </button>

                    {/* 2. Chapter 3: Investigate & Exploit Flaws */}
                    <button
                      type="button"
                      onClick={() => handleExecuteTactics('EXPLOIT_FLAW')}
                      disabled={isActionCooldown || !roomState || (roomState?.enemyPower === 0) || (roomState?.enemyFlaw === 'EXPOSED')}
                      className="cursor-pointer text-left border border-slate-700/60 hover:border-orange-500/50 p-3.5 rounded bg-white/[0.03] hover:bg-white/[0.05] transition-all group relative"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs block font-serif font-black text-rose-300 group-hover:text-rose-400 transition-colors">
                          ② 《将理篇》：挑动将危 (Provoke Commander)
                        </span>
                        <span className="text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.5 font-mono rounded">
                          忿速可侮
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#C0C2D0] block mt-1.5 leading-normal">
                        派遣细作散播诋毁歌谣，军前赠送妇人红罗，激怒守堡敌酋露出杀伤破绽！
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-dashed border-white/10 flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span className="text-rose-400">⚡ 支出：3000 贯 (财备)</span>
                        <span className="text-rose-300 font-bold">得：诱激破甲，下次打击 2.0x 伤害</span>
                      </div>
                    </button>

                    {/* 3. Chapter 7: Shift Morale Strategy */}
                    <button
                      type="button"
                      onClick={() => handleExecuteTactics('SHIFT_MORALE')}
                      disabled={isActionCooldown || !roomState || (roomState?.enemyPower === 0)}
                      className="cursor-pointer text-left border border-slate-700/60 hover:border-emerald-500/50 p-3.5 rounded bg-white/[0.03] hover:bg-white/[0.05] transition-all group relative"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs block font-serif font-black text-[#5ce1b7] group-hover:text-emerald-400 transition-colors">
                          ③ 《军争篇》：避坚治气 (Wait & Deteriorate Morale)
                        </span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 font-mono rounded">
                          以逸待劳
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#C0C2D0] block mt-1.5 leading-normal">
                        朝堂三军闭关息噪，“以治己之心待贼之乱”。使敌方意气经历 锐、惰、归 递弱变换。
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-dashed border-white/10 flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span className="text-emerald-400">⚡ 消耗：零消耗 (休养)</span>
                        <span className="text-[#5ce1b7] font-bold">得：主动偏转敌冠士气，伺机绝杀</span>
                      </div>
                    </button>

                    {/* 4. Chapter 11: Shift Territory into Death Ground */}
                    <button
                      type="button"
                      onClick={() => handleExecuteTactics('DEATH_GROUND')}
                      disabled={isActionCooldown || !roomState || (roomState?.enemyPower === 0) || (roomState?.enemyTerrain === 'DEATH')}
                      className="cursor-pointer text-left border border-slate-700/60 hover:border-red-500/50 p-3.5 rounded bg-white/[0.03] hover:bg-white/[0.05] transition-all group relative"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs block font-serif font-black text-red-300 group-hover:text-red-400 transition-colors">
                          ④ 《九地篇》：绝地置死 (Plunge into Death Ground)
                        </span>
                        <span className="text-[9px] bg-red-950 text-red-500 px-1.5 py-0.5 font-mono rounded font-bold animate-pulse">
                          疾战则存
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[#C0C2D0] block mt-1.5 leading-normal">
                        绝我后援，“投之亡地而后存，陷之死地而后生”。将战局导入死地绞杀，极大激发偏师破坏力！
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-dashed border-white/10 flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span className="text-red-400">⚡ 代价：稳定性 -10</span>
                        <span className="text-rose-400 font-bold">得：战场化为死土，突袭破防力 +180% 爆发</span>
                      </div>
                    </button>

                    {/* 5. Chapter 5: Coordinated strike based on "Qi" & "Zheng" */}
                    <button
                      type="button"
                      onClick={() => handleExecuteTactics('COMBINED_STRIKE')}
                      disabled={isActionCooldown || !roomState || (roomState?.enemyPower === 0)}
                      className="cursor-pointer text-left border border-red-800 hover:border-red-500 p-3.5 rounded bg-red-950/20 hover:bg-red-950/40 transition-all group relative sm:col-span-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm block font-serif font-black text-rose-300 group-hover:text-white transition-colors">
                          💥 💥 《兵势篇》：奇正相生·全军合力破寇 (Coordinated Strike)
                        </span>
                        <span className="text-[10px] bg-red-500 text-white font-mono font-bold px-2 py-0.5 rounded uppercase">
                          全军突入
                        </span>
                      </div>
                      <p className="text-xs text-[#E1E3F0] block mt-1.5 leading-relaxed font-serif">
                        “战势不过奇正”。大纛正兵在关隘正面拖延消耗，偏师侧后大举合围掩杀。
                        <span className="text-amber-300 ml-1">若敌寇处于【归气】或我军处于【死地】，威力翻数倍！</span>
                      </p>
                      <div className="mt-3.5 pt-2 border-t border-dashed border-white/20 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-[#DCDCE5]">
                        <span className="text-rose-400">⚡ 兵员损失：随敌军顽强程度，正兵、奇兵会有相应耗死折返</span>
                        <span className="text-emerald-400 font-black text-right shrink-0">获胜大礼：荡平乱贼夺资 15000 贯，国享天命天瑞 +12点</span>
                      </div>
                    </button>

                    {/* 6. Chapter 1: Reset Campaign Altar */}
                    <button
                      type="button"
                      onClick={() => handleExecuteTactics('RESET_CAMPAIGN')}
                      disabled={isActionCooldown || !roomState}
                      className="cursor-pointer text-center border border-dashed border-slate-700/80 hover:border-slate-500/80 p-2.5 rounded bg-white/[0.01] hover:bg-white/[0.04] transition-all sm:col-span-2 text-[10.5px] font-mono text-slate-400"
                    >
                      🎪 《始计篇》：庙堂卜盘重置边患 (Regroup Forces & Next Incident)
                    </button>

                  </div>

                  {isActionCooldown && (
                    <div className="text-[10px] text-amber-500 font-mono animate-pulse font-bold mt-2 text-center bg-amber-500/5 border border-amber-500/20 py-1.5 rounded">
                      ⚡ 飞鸽传信塞外边庭，调兵遣将印信起草中，敕令冷却中... (Tactic In Flight)
                    </div>
                  )}

                </div>
              </div>
            ) : subTab === 'war_room' ? (
              /* Majestic War Strategy Board displaying dispatched war plans & global Chronoreset Altar */
              <div className="bg-[#1C2130] text-slate-100 border border-slate-800 rounded-lg p-5 space-y-6 shadow-xl relative overflow-hidden" id="war-room-panel">
                {/* Decorative background watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-[180px] font-serif font-bold pointer-events-none select-none text-blue-500">
                  策
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] text-blue-400 font-mono tracking-widest block uppercase font-bold">
                      ASYMMETRIC WAR ROOM PLANS & CHRONO ALTAR (离线策应与回溯)
                    </span>
                    <h3 className="font-serif font-extrabold text-white tracking-wider text-base flex items-center gap-1.5 mt-0.5">
                      📡 战备密策总局与太初重置浑天台
                    </h3>
                  </div>
                  <span className="py-0.5 px-2 bg-blue-950 border border-blue-800/40 text-blue-400 text-[10px] font-serif font-bold rounded-full self-start sm:self-auto uppercase tracking-wider">
                    朝署离线策应 / 浑天大赦
                  </span>
                </div>

                {/* Top explanation box responding directly to coordinates synchronization */}
                <div className="bg-[#101420]/70 border border-blue-900/30 p-3.5 rounded text-xs leading-relaxed text-slate-300 font-sans space-y-1.5 shadow-inner text-left">
                  <p className="font-bold text-[#F5F2ED] flex items-center gap-1">
                    💡 什么是离线策应与太初重置？
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    1. <strong>离线协同策应</strong>：由于玩家玩游戏的时间不同，您在此大本营布署一份《战略密记》，当其他同僚对楚交锋执行“主力合击”时，系统将<strong>自动自动匹配、触发并消耗</strong>您的战计，使破寇威力提升 35% 或受反震伤耗减免 25%！触发后<strong>无论您是否在线，系统都会自动为您异步注入 +15 点政治功勋！</strong>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    2. <strong>太初浑天重置</strong>：天地本是常运行，但寇乱至深，朝臣可强启浑天重置盘，重归公元前 230 年起源！
                  </p>
                </div>

                {/* Subsection 1: Create local War strategy Plan */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1 text-left">
                  
                  {/* Create form */}
                  <div className="bg-[#0e121e] border border-white/5 rounded-md p-4 space-y-4">
                    <h4 className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/5 pb-2">
                      📜 颁布战略密策指令草案
                    </h4>
                    
                    <form onSubmit={handleCreateWarPlan} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        
                        {/* Strategy selection */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-slate-400 font-serif font-bold block">密策战略方向</label>
                          <select
                            value={newPlanStrategy}
                            onChange={(e) => setNewPlanStrategy(e.target.value as any)}
                            className="w-full bg-slate-900 border border-white/10 rounded p-1.5 text-xs text-slate-200 outline-none"
                          >
                            <option value="STRIKE">攻势协攻 (+35% 战功威能)</option>
                            <option value="DEFEND">守备御寇 (-25% 师团伤亡)</option>
                          </select>
                        </div>

                        {/* Season trigger selection */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-slate-400 font-serif font-bold block">设定触发季物岁分</label>
                          <select
                            value={newPlanSeason}
                            onChange={(e) => setNewPlanSeason(e.target.value as any)}
                            className="w-full bg-slate-900 border border-white/10 rounded p-1.5 text-xs text-slate-200 outline-none"
                          >
                            <option value="ANY">任意季岁生效</option>
                            <option value="SPRING">🌱 仅在「春分」生效</option>
                            <option value="SUMMER">☀️ 仅在「夏至」生效</option>
                            <option value="AUTUMN">🍂 仅在「秋分」生效</option>
                            <option value="WINTER">❄️ 仅在「冬至」生效</option>
                          </select>
                        </div>

                      </div>

                      {/* Title text */}
                      <div className="space-y-1.5 text-left text-xs">
                        <label className="text-slate-400 font-serif font-bold block">军事策书密件代称 (15字以内)</label>
                        <input
                          type="text"
                          required
                          placeholder="如：秋收偏翼犄角破敌、冬季闭城坚戍抗匈"
                          value={newPlanDesc}
                          onChange={(e) => setNewPlanDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded p-2 text-xs text-white placeholder-slate-500 font-serif outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-900 hover:bg-blue-800 border border-blue-700/30 text-white p-2.5 rounded font-serif font-bold text-xs cursor-pointer transition-colors text-center uppercase"
                      >
                        📐 布防战算 · 呈交军机台 (Dispatch Strategy)
                      </button>
                    </form>
                  </div>

                  {/* Grand Reset parameters Altar */}
                  <div className="bg-[#121118] border border-white/5 rounded-md p-4 space-y-4 text-left">
                    <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2">
                      ⏳ 太初秦政天演浑天金晶回溯法盘
                    </h4>
                    
                    <div className="text-slate-400 text-xs leading-relaxed space-y-1.5">
                      <p className="text-[10.5px] italic font-serif text-slate-300">
                        “太始初一，大赦乾坤，天地更新。” 当战局遭遇极端崩坏（军资枯竭、大乱将至），朝臣可奏请回溯！
                      </p>
                      <p className="text-[10.5px]">
                        重置将令国祚回归至 <strong>公元前 230 年</strong> 春，恢复三军元气王师与 45,000 贯储备金。
                      </p>
                    </div>

                    <div className="bg-black/40 border border-red-950 p-2 text-center rounded">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">推演世界重置预设刻度</span>
                      <span className="text-red-400 text-xs font-serif font-bold mt-1 block">公元前 230 年 · 帝始受诏第一年</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGrandDynastyReset}
                      className="w-full bg-[#8F1D2C] hover:bg-[#8C2F39] border border-red-700/40 text-[#F5F2ED] p-2.5 rounded font-serif font-extrabold tracking-widest text-xs transition-all cursor-pointer shadow-lg text-center"
                    >
                      🧬 浑天回朔 · 执行太初天赦大重置
                    </button>
                  </div>

                </div>

                {/* Subsection 2: List current dispatched War plans */}
                <div className="space-y-3 text-left border-t border-white/10 pt-4">
                  <h4 className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    📡 咸阳军枢军机处 · 存续战备协作密案一览 ({warPlans.length})
                  </h4>
                  
                  {warPlans.length === 0 ? (
                    <div className="bg-[#101420]/40 border border-dashed border-white/10 rounded p-6 text-center text-slate-500 font-mono text-xs">
                      大本营秘府目前无任何留存协作密案。诸卿公速在上方颁布协作大策！
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {warPlans.map((plan) => (
                        <div key={plan.id} className="bg-black/35 border border-white/5 p-3 rounded flex flex-col justify-between hover:border-blue-950 transition-all text-xs">
                          <div>
                            <div className="flex justify-between items-center border-b border-white/[0.03] pb-1.5 mb-2">
                              <span className={`p-0.5 px-1.5 text-[9px] font-mono font-bold rounded ${
                                plan.strategyType === 'STRIKE' ? 'bg-red-950 text-red-300 border border-red-900/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-900/40'
                              }`}>
                                {plan.strategyType === 'STRIKE' ? '⚔️ 攻势协击' : '🛡️ 守备营垒'}
                              </span>
                              
                              <span className="text-[9px] font-mono text-slate-400 font-bold">
                                节候: {
                                  plan.conditionSeason === 'ANY' ? '通季' : 
                                  plan.conditionSeason === 'SPRING' ? '🌱 春生' : 
                                  plan.conditionSeason === 'SUMMER' ? '☀️ 夏温' : 
                                  plan.conditionSeason === 'AUTUMN' ? '🍂 秋收' : '❄️ 冬藏'
                                }
                              </span>
                            </div>

                            <p className="text-xs font-serif text-slate-100 font-extrabold mb-1">
                              《{plan.description}》
                            </p>
                            
                            <p className="text-[10px] text-slate-400 leading-normal italic font-mono">
                              效果: {plan.effectText}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-dashed border-white/5 pt-2 mt-2 text-[9px] font-mono text-slate-400 leading-none">
                            <span>布策臣: <strong className="text-blue-400 font-serif">{plan.planner}</strong></span>
                            <span className="text-amber-500 font-bold">已被触发协战: {plan.triggeredCount || 0} 次</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : subTab === 'decrees' ? (
              /* Decree Station for our own faction */
              <div className="bg-white border border-[#1A1A1A]/15 rounded p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-3">
                  <span className="p-1 px-2.5 bg-[#8C2F39] text-[#F5F2ED] text-[10px] uppercase font-mono font-bold rounded">
                    MY SOVEREIGN CONSOLE (流派行动)
                  </span>
                  <h3 className="font-serif font-black text-[#1A1A1A] tracking-wide text-sm flex items-center gap-1.5">
                    流派特权：<span className="text-[#8C2F39]">{myFaction.avatar} {myFaction.name}</span>
                  </h3>
                </div>

                <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 rounded p-4 flex flex-col md:flex-row gap-4 items-center">
                  <div className="text-2xl font-extrabold p-2.5 bg-white border border-black/10 rounded shrink-0 shadow-xs">
                    {myFaction.avatar}
                  </div>
                  <div className="leading-relaxed text-center md:text-left">
                    <h4 className="text-[12px] font-mono font-black text-[#1A1A1A]">
                      已宣誓加入之执政阵营
                    </h4>
                    <p className="text-xs text-[#1A1A1A]/70 mt-1 leading-relaxed">
                      {myFaction.desc}
                    </p>
                  </div>
                  <div className="shrink-0 bg-white border border-dashed border-[#1A1A1A]/20 p-2.5 px-4 rounded text-center">
                    <span className="text-[10px] font-mono block text-[#1A1A1A]/60 font-bold uppercase tracking-widest">代议角色</span>
                    <span className="text-[11px] font-serif font-extrabold text-[#8C2F39] mt-0.5 block tracking-wider">{customName}</span>
                  </div>
                </div>

                {/* Action Buttons to fire cloud actions */}
                <div>
                  <h4 className="text-[10px] font-mono font-extrabold text-[#1A1A1A]/60 tracking-widest uppercase mb-2">
                    国家大略敕命 (Faction Strategic Commands)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {myFaction.decrees.map((decree) => (
                      <button
                        key={decree.id}
                        onClick={() => handleExecuteDecree(decree, myFaction)}
                        disabled={isActionCooldown || !roomState}
                        className="cursor-pointer text-left border border-[#1A1A1A]/10 p-3.5 rounded bg-white hover:bg-slate-50 hover:border-[#8C2F39]/50 shadow-xs hover:shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
                      >
                        <span className="text-xs block font-serif font-black text-[#1A1A1A] group-hover:text-[#8C2F39] transition-all">
                          {decree.name}
                        </span>
                        <p className="text-[10px] text-[#1A1A1A]/60 block mt-1.5 leading-normal">
                          {decree.desc}
                        </p>
                        
                        {/* Cost text footer */}
                        <div className="mt-3 pt-2 border-t border-dashed border-[#1A1A1A]/10 flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#8C2F39] font-bold">
                            ⚡ 敕命消耗与得益:
                          </span>
                          <span className="text-[#5A5A40] font-bold shrink-0">
                            {decree.effectText}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {isActionCooldown && (
                    <div className="text-[10px] text-amber-600 font-mono animate-pulse font-bold mt-2 text-center bg-amber-50 border border-amber-100 p-1 rounded">
                      ⚡ 司墨太监正在书写国书诏书，敕命冷却中... (Cooldown)
                    </div>
                  )}
                </div>
              </div>
            ) : subTab === 'spy_agency' ? (
              /* Step 3: Espionage Spy Ring Tab Panel */
              <div className="bg-gradient-to-b from-[#0A0D15] to-[#121622] text-slate-100 border border-slate-800 rounded-lg p-5 space-y-6 shadow-2xl relative overflow-hidden" id="espionage-intel-network-panel">
                
                {/* Visual Watermarks */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-[180px] font-serif font-black pointer-events-none select-none text-amber-500">
                  间
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-3 gap-2 relative z-10">
                  <div>
                    <h3 className="font-serif font-black text-sm tracking-wider text-amber-400 flex items-center gap-1.5 uppercase">
                      👁️ 《孙子兵法 · 用间篇》 谍报信息总枢 (Espionage Intelligence Network)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      “三军之事，亲莫亲于间，赏莫厚于间，事莫密于间。非圣智不能用间，非仁义不能使间，非微妙不能得间之实。”
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="py-1 px-2.5 bg-amber-500/10 border border-amber-500/35 text-amber-400 font-mono text-[9px] rounded font-extrabold uppercase tracking-widest">
                      Step 3 · 特务网络
                    </span>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
                  
                  {/* Left panel: Recruitment Form (5 cols) */}
                  <form onSubmit={handleRecruitSpy} className="lg:col-span-5 bg-black/40 border border-slate-800/80 rounded-lg p-4 space-y-4">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 border-b border-slate-800/60 pb-1.5">
                      ⚔️ 秦相国暗影密诏 (Recruit New Secret Agent)
                    </h4>
                    
                    {/* Choose spy type */}
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] font-mono font-bold text-slate-400 block uppercase">
                        细作刺探派系 (Spy Category / System)
                      </label>
                      <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {[
                          { id: 'LOCAL', name: '乡间 (Local Spy)', cost: 3000, desc: '因其乡人而用之。派遣敌寇本地向导发掘弱点遭遇袭。' },
                          { id: 'INTERNAL', name: '内间 (Internal Spy)', cost: 5000, desc: '因其官人而用之。分化买通内侍将官，暗毁其制台兵辎。' },
                          { id: '策反', name: '反间 (Double Agent)', cost: 6000, desc: '因其敌间而用之。使敌探归其主并伪造朝廷王师虚信。' },
                          { id: 'DEATH', name: '死间 (Doomed Spy)', cost: 4000, desc: '外泄我军虚密。让死士直冲敌牢，散布假战报骗其溃退（50%概率成果）。' },
                          { id: 'ACTIVE_SURVIVING', name: '生间 (Surviving Agent)', cost: 5000, desc: '刺探虚实完身折返。每季自动为府库秘密掠夺 2000 贯 coffers！' }
                        ].map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setNewSpyType(t.id as any)}
                            className={`p-2 rounded text-left transition-all border text-xs block cursor-pointer w-full ${
                              newSpyType === t.id
                                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-xs shadow-amber-500/5'
                                : 'bg-transparent border-slate-800/60 text-slate-400 hover:border-slate-700/80'
                            }`}
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span>{t.name}</span>
                              <span className="text-amber-500 font-mono text-[9px]">{t.cost} 💰 贯</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-0.5 font-sans leading-relaxed">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spy Name input */}
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] font-mono font-bold text-slate-400 block uppercase">
                        细作名讳代号 (Spy Codename)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSpyName}
                          onChange={(e) => setNewSpyName(e.target.value)}
                          placeholder="留空即调拨天命随机代号..."
                          maxLength={10}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-100 outline-none focus:border-amber-500 font-serif"
                        />
                        <button
                          type="button"
                          onClick={() => setNewSpyName(getRandomSpyName())}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 text-[10px] font-mono border border-slate-700 cursor-pointer rounded"
                        >
                          👁️ 测字
                        </button>
                      </div>
                    </div>

                    {/* Motivation choice */}
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] font-mono font-bold text-slate-400 block uppercase">
                        收买动因诱饵 (Motivation Catalyst)
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'MONEY', name: '重金赎身' },
                          { id: 'HATRED', name: '宿怨恩仇' },
                          { id: 'IDEAL', name: '天下一统' },
                          { id: 'FORCED', name: '军法勒逼' },
                          { id: 'FAMILY', name: '荫庇遗孤' }
                        ].map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setNewSpyMotivation(m.id as any)}
                            className={`p-1 text-[9px] rounded text-center border font-mono cursor-pointer ${
                              newSpyMotivation === m.id
                                ? 'bg-amber-500/10 border-amber-500/55 text-amber-300'
                                : 'bg-transparent border-slate-850 text-slate-500 hover:border-slate-800'
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Choose map placement location (Infiltrated Post Location) */}
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[9.5px] font-mono font-bold text-[#5ce1b7] block uppercase">
                        🗺️ 地图设点潜伏 (Map Infiltration Post Preset)
                      </label>
                      <select
                        value={newSpyLocationKey}
                        onChange={(e) => setNewSpyLocationKey(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-100 outline-none focus:border-amber-500 font-serif"
                      >
                        {PRESET_BATTLEFIELDS.map((b) => (
                          <option key={b.key} value={b.key}>
                            📍 {b.name.split(' (')[0]} ({b.lat.toFixed(2)}°, {b.lng.toFixed(2)}°)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Primary action */}
                    <button
                      type="submit"
                      disabled={isActionCooldown}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-500/30 text-white font-serif font-black tracking-widest text-[11px] rounded transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      🔮 签押密诏 · 安置探子入瓮 (Dispatch Secret Agent)
                    </button>
                  </form>

                  {/* Right panel: Recruited Spies lists (7 cols) */}
                  <div className="lg:col-span-7 bg-black/40 border border-slate-800/80 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        📡 实时细作宿头与情报流 (Active Recruited Ring)
                      </h4>
                      <span className="text-[9px] font-mono text-slate-500">
                        潜夜密网: <strong className="text-amber-500">{spiesList.length}</strong> 员
                      </span>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1" id="active-spy-ring-dashboard">
                      {spiesList && spiesList.length > 0 ? (
                        spiesList.map((spy) => {
                          const isIdle = spy.state === 'IDLE';
                          const isCaptured = spy.state === 'CAPTURED';
                          const isMartyred = spy.state === 'MARTYRED';
                          
                          return (
                            <div 
                              key={spy.id} 
                              className={`p-3 rounded border transition-all ${
                                isMartyred 
                                  ? 'bg-red-950/20 border-red-950/40 text-slate-400' 
                                  : isCaptured 
                                  ? 'bg-amber-950/25 border-amber-950/40 text-slate-300 animate-pulse'
                                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900/90 hover:border-amber-500/30'
                              }`}
                            >
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-serif font-black text-xs text-amber-300">
                                      【{spy.name}】
                                    </span>
                                    <span className="py-0.5 px-1.5 bg-slate-950 text-slate-400 text-[8px] font-mono capitalize rounded border border-slate-800">
                                      {getSpyTypeName(spy.type).split(' ')[0]}
                                    </span>
                                    {isMartyred && (
                                      <span className="py-0.5 px-1 bg-red-900/30 text-red-500 text-[8px] rounded border border-red-900/40 font-mono">
                                        壮烈殉国 MARTYRED
                                      </span>
                                    )}
                                    {isCaptured && (
                                      <span className="py-0.5 px-1 bg-amber-900/30 text-amber-500 text-[8px] rounded border border-amber-900/40 font-mono">
                                        囚禁被捕 CAPTURED
                                      </span>
                                    )}
                                    {isIdle && (
                                      <span className="py-0.5 px-1 bg-emerald-950 text-emerald-400 text-[8px] rounded border border-emerald-900/40 font-mono">
                                        伏卧潜伏 ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Infiltration Station Map Location (Step 3 Addition) */}
                                  {spy.targetName && (
                                    <p className="text-[10px] text-cyan-400 font-sans flex items-center gap-1 my-1">
                                      <span>📍 潜伏要地：{spy.targetName}</span>
                                      {spy.targetLat !== undefined && (
                                        <span className="text-[8.5px] text-slate-500 font-mono">({spy.targetLat.toFixed(2)}°, {spy.targetLng?.toFixed(2)}°)</span>
                                      )}
                                    </p>
                                  )}

                                  {/* Stats details bar */}
                                  <div className="flex items-center gap-2.5 text-[9px] font-mono text-slate-400 flex-wrap">
                                    <span>动机: <strong className="text-slate-300">
                                      {spy.motivation === 'MONEY' ? '💰 重金纳饷' :
                                       spy.motivation === 'HATRED' ? '🔥 投报宿仇' :
                                       spy.motivation === 'IDEAL' ? '🌟 六国大一统' :
                                       spy.motivation === 'FORCED' ? '⛓️ 挟逼挟从' : '🌸 封庇遗孤'}
                                    </strong></span>
                                    <span>忠诚度: <strong className={spy.loyalty > 75 ? 'text-emerald-400' : 'text-amber-500'}>{spy.loyalty}%</strong></span>
                                    <span>凭信性: <strong className="text-amber-500">{spy.credibility}%</strong></span>
                                  </div>
                                </div>

                                <div className="shrink-0 flex gap-1 bg-slate-950/20 p-1 rounded">
                                  {isIdle && (
                                    <button
                                      type="button"
                                      disabled={isActionCooldown}
                                      onClick={() => handleExecuteSpyMission(spy)}
                                      className="py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif font-black text-[9.5px] rounded active:scale-[0.98] transition-all cursor-pointer border border-amber-600/30"
                                    >
                                      🗡️ 实施秘计用间 (Execute)
                                    </button>
                                  )}

                                  {(isMartyred || isCaptured) && (
                                    <button
                                      type="button"
                                      onClick={() => handleDecommissionSpy(spy.id, spy.name)}
                                      className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9.5px] rounded font-mono active:scale-[0.98] transition-all cursor-pointer border border-slate-750"
                                    >
                                      🕯️ 追设祭撤档 (Archive)
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center rounded border border-dashed border-slate-850 bg-slate-950/20">
                          <p className="text-slate-500 text-xs font-serif italic">
                            “五间俱起，莫知其道，是谓神纪，人君之宝也。”
                          </p>
                          <p className="text-[10px] text-slate-600 mt-2 font-mono">
                            当前游说局中暂无密探安插。请从左侧调签相阁令牌，招募死士刺探反间、以智取非对称军事大捷！
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (() => {
              const myPlayerStats = playersList.find(p => p.uid === currentUser?.uid) || {
                contributionPoints: 0,
                actionsCount: 0,
                vigor: 100,
                lineageGeneration: 1,
                isDead: false
              };
              const myPoints = myPlayerStats.contributionPoints || 0;
              const myActionsCount = myPlayerStats.actionsCount || 0;
              const myRankTitle = getRankTitle(selectedFactionId, myPoints);
              const progress = getRankProgress(myPoints);

              if (myPlayerStats.isDead) {
                return (
                  <div className="bg-[#121118] border-2 border-red-900/40 rounded-lg p-6 text-center space-y-6 shadow-xl" id="character-profile-panel">
                    <div className="space-y-2">
                      <div className="inline-block bg-red-950 text-red-400 p-4 rounded-full border border-red-800 animate-pulse text-3xl">
                        💀
                      </div>
                      <h3 className="font-serif font-black text-lg text-red-500 tracking-wider">
                        大勋归天 · 宗庙绝唱
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed font-serif">
                        朝廷惊悉，前代主政官 【{customName}】 恪尽职守，已英烈牺牲、委身社稷或不幸政治落败。
                        现在，家族的第 <strong className="text-amber-500">{(myPlayerStats.lineageGeneration || 1) + 1} 代</strong> 子嗣已捧诏袭爵，静候承其先人弘愿临朝称制！
                      </p>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-4 rounded text-left max-w-sm mx-auto space-y-2 font-mono text-[11px] text-slate-400">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>🏷️ 世代门阀:</span>
                        <span className="text-amber-500">第 {(myPlayerStats.lineageGeneration || 1)} 代 ➔ 第 {(myPlayerStats.lineageGeneration || 1) + 1} 代</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>🌟 袭爵勋功变动:</span>
                        <span className="text-red-400">先公业绩归零，香火重开</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🌱 新一任精力体质:</span>
                        <span className="text-emerald-400">100% 身命气血 (Full Vigor)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const pDoc = doc(db, 'rooms', activeRoomId, 'players', currentUser?.uid || '');
                          await updateDoc(pDoc, {
                            isDead: false,
                            vigor: 100,
                            lineageGeneration: (myPlayerStats.lineageGeneration || 1) + 1,
                            contributionPoints: 0,
                            actionsCount: 0
                          });

                          await addDoc(collection(db, 'rooms', activeRoomId, 'logs'), {
                            text: `✨ 【子嗣诏袭】臣下门第家学流传！名宿 【${customName}】 之后嗣 (第 ${(myPlayerStats.lineageGeneration || 1) + 1} 代) 奉旨临朝嗣承官印，继续重托！`,
                            username: customName,
                            role: selectedFactionId,
                            timestamp: serverTimestamp()
                          });

                          saveActionToLocalChronicle(
                            'DECREE',
                            `第 ${(myPlayerStats.lineageGeneration || 1) + 1} 代继嗣嗣承盛典`,
                            `香火永续，家族志业无断！立志重振乾坤社稷大任！`,
                            roomState?.emperorAge || 14
                          );

                          setSystemAlert('✨ 奉召袭嗣承大仪功满！新一任家臣宣示入阁！');
                        } catch (err) {
                          console.error('Failed succession:', err);
                        }
                      }}
                      className="inline-block bg-[#8C2F39] hover:bg-[#8C2F39]/90 border border-red-700/40 text-[#F5F2ED] py-2.5 px-6 rounded font-serif font-extrabold tracking-widest text-xs transition-all cursor-pointer shadow-lg hover:scale-[1.02] transform"
                    >
                      ⚔️ 祖宗有灵 · 奉诏登阶嗣位入阁
                    </button>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-[#1A1A1A]/15 rounded p-5 space-y-5" id="character-profile-panel">
                  {/* Profile HUD header card */}
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-[#FAF8F5] border border-[#1A1A1A]/10 rounded p-4 gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <span className="text-3xl bg-white p-2 rounded border border-[#1A1A1A]/10 shadow-xs leading-none shrink-0 block">
                        {myFaction.avatar}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                          <h3 className="font-serif font-black text-sm text-[#1A1A1A] tracking-wider">
                            {customName}
                          </h3>
                          <span className="py-0.5 px-2 bg-[#8C2F39]/10 text-[#8C2F39] text-[9.5px] font-mono rounded font-bold uppercase tracking-wider">
                            {myFaction.name}
                          </span>
                          <span className="py-0.5 px-1.5 bg-blue-50 text-blue-700 text-[8.5px] font-mono rounded font-bold">
                            第 {myPlayerStats.lineageGeneration || 1} 代传人
                          </span>
                        </div>
                        <p className="text-[11px] text-[#1A1A1A]/60 mt-1 leading-normal">
                          朝廷授任官衔：<strong className="text-[#8C2F39] font-serif font-bold text-[12px]">{myRankTitle}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Vigor meter & Faction contribution stats badges */}
                    <div className="flex flex-wrap gap-2 items-center justify-center">
                      {/* Vigor badge */}
                      <div className="flex items-center gap-2 bg-white border border-dashed border-[#1A1A1A]/20 p-2 rounded text-center min-w-[110px] justify-center shadow-xs">
                        <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <div className="text-left font-mono">
                          <span className="text-[8px] block text-[#1A1A1A]/50 font-bold uppercase tracking-widest leading-none">气血寿数 (Vigor)</span>
                          <span className="text-xs font-black block mt-0.5 tracking-tight">
                            <span className={myPlayerStats.vigor && myPlayerStats.vigor < 30 ? 'text-red-600 animate-pulse font-black font-mono' : 'text-emerald-600 font-extrabold font-mono'}>
                              {myPlayerStats.vigor !== undefined ? myPlayerStats.vigor : 100}%
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Contribution badge */}
                      <div className="flex items-center gap-2 bg-white border border-dashed border-[#1A1A1A]/20 p-2 rounded text-center min-w-[110px] justify-center shadow-xs">
                        <Award className="w-3.5 h-3.5 text-[#8C2F39] shrink-0" />
                        <div className="text-left">
                          <span className="text-[8px] font-mono block text-[#1A1A1A]/50 font-bold uppercase tracking-widest leading-none">政务功勋绩值</span>
                          <span className="text-xs font-mono font-black text-amber-600 block mt-0.5 tracking-wider leading-none">
                            {myPoints} <span className="text-[8px] text-[#1A1A1A]/50 font-sans font-semibold">功</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rank Progress Bar */}
                  <div className="space-y-2 border-b border-[#1A1A1A]/5 pb-4">
                    <div className="flex justify-between items-center text-[9.5px] font-mono text-[#1A1A1A]/70 uppercase tracking-widest">
                      <span>👑 官爵晋级历履 (Rank Advancement)</span>
                      <span className="text-[#8C2F39] font-bold">
                        {myPoints >= 200 ? '已跻身开国元首常班 (Grand Marshal)' : `登晋下阶资历差: ${progress.nextPoints} 功勋`}
                      </span>
                    </div>
                    
                    <div className="w-full bg-[#FAF8F5] border border-[#1A1A1A]/10 h-3 rounded-full overflow-hidden p-0.5 relative flex items-center shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-[#8C2F39] to-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress.percent}%` }}
                      ></div>
                      <span className="absolute inset-0 text-[8px] font-mono font-black text-center leading-none text-[#1A1A1A] flex items-center justify-center">
                        {progress.percent}% ({progress.currentPointsInLevel} / {progress.levelMaxPoints} 功阶)
                      </span>
                    </div>

                    {/* Progress Milestones labels */}
                    <div className="grid grid-cols-5 text-[8px] font-mono text-center text-[#1A1A1A]/50 pt-0.5">
                      <div>
                        <span>布衣</span>
                        <span className="block font-bold">0</span>
                      </div>
                      <div>
                        <span>见习</span>
                        <span className="block font-bold">20</span>
                      </div>
                      <div>
                        <span>中坚</span>
                        <span className="block font-bold">50</span>
                      </div>
                      <div>
                        <span>上卿</span>
                        <span className="block font-bold">100</span>
                      </div>
                      <div>
                        <span>大元帅</span>
                        <span className="block font-bold">200</span>
                      </div>
                    </div>
                  </div>

                  {/* Contribution breakdown statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 p-2.5 rounded shadow-2xs">
                      <span className="text-[9px] font-mono text-[#1A1A1A]/50 block">总主政频次</span>
                      <span className="text-base font-mono font-black text-slate-800 block mt-0.5">{myActionsCount} 次</span>
                    </div>
                    <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 p-2.5 rounded shadow-2xs">
                      <span className="text-[9px] font-mono text-[#1A1A1A]/50 block">估算影响国力</span>
                      <span className="text-base font-mono font-black text-purple-700 block mt-0.5">+{myPoints * 300} 万贯</span>
                    </div>
                    <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 p-2.5 rounded shadow-2xs">
                      <span className="text-[9px] font-mono text-[#1A1A1A]/50 block">社稷公论声望</span>
                      <span className="text-base font-mono font-black text-emerald-700 block mt-0.5">{Math.floor(myPoints * 3)} 阀</span>
                    </div>
                    <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 p-2.5 rounded shadow-2xs">
                      <span className="text-[9px] font-mono text-[#1A1A1A]/50 block">宗庙评价</span>
                      <span className="text-base font-mono font-black text-amber-700 block mt-0.5">功勋昭烈</span>
                    </div>
                  </div>

                  {/* Personal chronological timeline of honor */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-serif font-black text-[#1A1A1A] tracking-wider uppercase border-l-2 border-[#8C2F39] pl-2">
                        📜 圣谕起居注 · 个人推演大事编年 Chronicle
                      </h4>
                      <div className="flex gap-1">
                        <button onClick={exportChronicle} className="px-2 py-0.5 text-[8px] font-mono bg-slate-100 hover:bg-slate-200 rounded">导出史册</button>
                        <label className="px-2 py-0.5 text-[8px] font-mono bg-slate-100 hover:bg-slate-200 rounded cursor-pointer">
                          导入史册
                          <input type="file" onChange={importChronicle} accept=".json" className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="border border-[#1A1A1A]/10 rounded bg-[#FAF8F5]/50 overflow-hidden">
                      <div className="max-h-[160px] overflow-y-auto divide-y divide-[#1A1A1A]/5 pr-0.5 text-left">
                        {localChronicle && localChronicle.length > 0 ? (
                          localChronicle.map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-white/80 hover:bg-white transition-colors duration-150">
                              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                                <span className="text-[9.5px] font-serif font-bold text-[#8C2F39] px-1 bg-[#8C2F39]/5 border border-[#8C2F39]/10 rounded">
                                  {item.eraName} · {item.timestamp}
                                </span>
                                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">
                                  {item.type === 'DECREE' ? '⚡ 国政命令' : item.type === 'TACTICS' ? '🛡️ 兵法大计' : item.type === 'MESSAGE' ? '💬 策议建言' : '🌟 御前敕任命'}
                                </span>
                              </div>
                              
                              <p className="text-xs text-[#1A1A1A] mt-1.5 font-serif font-bold">
                                {item.description}
                              </p>
                              
                              {item.impact && (
                                <p className="text-[9.5px] text-[#5A5A40]/80 mt-1 italic font-mono leading-none">
                                  {item.impact}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-[10.5px] font-mono">
                            暂无起居大事记录。发布国政命令或于右下廷议中进言，即可书写社稷编年！
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick pre-made Messages for convenience */}
            <div className="bg-white border border-[#1A1A1A]/15 rounded p-4 space-y-2">
              <span className="text-[10px] font-mono font-extrabold text-[#1A1A1A]/60 tracking-widest uppercase">
                📜 快速呈递政令草案 (Quick Declarations & Strategy Calls)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PRESET_DIPLOMATIC_MESSAGES.map((msg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendCustomMessage(undefined, msg)}
                    className="cursor-pointer text-[10.5px] p-2 rounded bg-[#FAF8F5] hover:bg-[#8C2F39]/5 text-left border border-transparent hover:border-[#8C2F39]/20 transition-all font-serif italic text-[#1A1A1A]/80 truncate block"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Chronological Log Stream & Active online player list (4 cols) */}
          <div className="md:col-span-4 space-y-6 flex flex-col h-full">
            
            {/* Presence Colleague List */}
            <div className="bg-white border border-[#1A1A1A]/15 rounded p-4 space-y-3 shrink-0">
              <h3 className="text-xs font-serif font-black tracking-wide border-b border-[#1A1A1A]/10 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#8C2F39]" /> 朝堂同僚同修录 ({playersList.length}人)
                </span>
                <span className="text-[9px] font-mono text-slate-400">Court Presence</span>
              </h3>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {playersList.map((player) => {
                  const pDef = FACTION_DEFINITIONS.find(f => f.id === player.role) || { avatar: '👤', textColor: 'text-slate-400' };
                  return (
                    <div 
                      key={player.uid} 
                      className={`p-2 rounded flex justify-between items-center text-xs border ${
                        player.uid === currentUser?.uid 
                          ? 'bg-slate-50 border-[#8C2F39]/20' 
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm shrink-0 leading-none bg-slate-50 border p-1 rounded">
                          {pDef.avatar}
                        </span>
                        <div className="truncate leading-tight">
                          <span className={`font-serif font-extrabold ${player.uid === currentUser?.uid ? 'text-[#8C2F39]' : 'text-[#1A1A1A]'}`}>
                            {player.username} {player.uid === currentUser?.uid && <span className="text-[8px] font-sans font-normal text-slate-400 bg-slate-100 p-0.5 rounded ml-0.5">我</span>}
                          </span>
                          <span className={`text-[9px] block ${pDef.textColor} font-serif mt-0.5 font-bold`}>
                            {player.role === 'CHANCELLOR' ? '咸阳相国' : 
                             player.role === 'GENERAL' ? '护国大将' : 
                             player.role === 'EUNUCH' ? '内廷宦官' : 
                             player.role === 'MERCHANT' ? '神州巨贾' : 
                             player.role === 'STRATEGIST' ? '连横策士' : 
                             player.role === 'REBEL' ? '义军豪侠' : '六国流沙'}
                            {' · '}
                            <span className="text-[#8C2F39] text-[8.5px] font-sans font-bold">
                              {getRankTitle(player.role, player.contributionPoints || 0)}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <span className="text-[9.5px] font-mono font-bold text-amber-600 block">
                            {player.contributionPoints || 0} 功
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-400 block -mt-0.5">
                            {player.online ? '在朝' : '下野'}
                          </span>
                        </div>
                        {player.online ? (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scribe Log chronology streams */}
            <div className="bg-[#FAF8F5] border border-[#1A1A1A]/15 rounded p-4 flex flex-col flex-1 min-h-[300px] h-[480px]">
              
              <h3 className="text-xs font-serif font-black tracking-wide border-b border-[#1A1A1A]/10 pb-2.5 mb-2 shrink-0 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#8C2F39]">
                  <MessageSquare className="w-4 h-4" /> 朝政起居注大厅 (Imperial Logs & Council)
                </span>
                <span className="text-[9px] font-mono text-[#8C2F39] px-1.5 bg-[#8C2F39]/5 rounded py-0.5">LIVE</span>
              </h3>

              {/* Stream Logs */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 font-sans scroll-smooth" style={{ maxHeight: '380px' }}>
                {activityLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded border leading-relaxed text-xs transition-colors duration-200 ${
                      log.text.startsWith('💬')
                        ? 'bg-amber-50/40 border-amber-200/40'
                        : 'bg-white border-[#1A1A1A]/5 shadow-xs'
                    }`}
                  >
                    <p className="text-[11px] leading-relaxed select-text font-serif">
                      {log.text}
                    </p>
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                      <span className="font-bold">{log.role || '史宫'} Scribe</span>
                      <span>
                        {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'}) : '刚刚'}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Message composer */}
              <form onSubmit={handleSendCustomMessage} className="mt-3.5 pt-3.5 border-t border-[#1A1A1A]/10 shrink-0 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="写下上奏奏折, 或朝野建言..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-white border border-[#1A1A1A]/15 rounded p-1.5 px-2.5 text-xs outline-none focus:border-[#8C2F39] text-[#1A1A1A] font-serif"
                />
                <button
                  type="submit"
                  className="bg-[#8C2F39] text-[#F5F2ED] p-1.5 px-3 rounded hover:bg-[#8C2F39]/90 active:scale-[0.98] transition-all shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

      {/* Info notice block */}
      <div className="mt-5 p-3.5 bg-white border border-[#1A1A1A]/10 rounded flex items-start gap-4 text-xs leading-normal font-sans">
        <Info className="w-4 h-4 text-[#8C2F39] shrink-0 fill-[#8C2F39]/5 mt-0.5" />
        <p className="text-[#1A1A1A]/70 font-mono text-[11px]">
          🌟 <strong className="text-[#1A1A1A]">多人沙盒玩法建议：</strong>在其他浏览器或无痕模式下，使用不同的“雅号”和流派角色参与本推演频道，即可在两边屏幕上瞬间观测到状态和事件发生同步。共同辅佐（或谋朝逆位）大秦帝制的国运稳定吧！
        </p>
      </div>

    </div>
  );
}
