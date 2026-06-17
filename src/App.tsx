import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Landmark, Swords, KeyRound, Coins, Compass, FileText, ChevronRight, Layers, Award, Heart, Shield, Sparkles, Flame, Users, Map as MapIcon, Volume2, VolumeX, Trophy, Activity, Crown, Clock, Target, Wifi, Sparkle, LogIn, LogOut, ShieldCheck, UserCheck, HelpCircle, EyeOff, Scale, Globe, Sprout, Fingerprint, ScrollText, Wheat, Castle, Network, Factory, Waypoints } from 'lucide-react';
import { soundManager } from './utils/soundManager';
import { GameEngineProvider } from './context/GameEngineContext';
import { useLocale } from './i18n/LocaleContext';
import zh from './i18n/zh';
import en from './i18n/en';
import type { Locale } from './i18n/LocaleContext';
import WeiJiuZhaoScenario from './components/WeiJiuZhaoScenario';
import LogisticsNetworkSandbox from './components/LogisticsNetworkSandbox';
import DeceptionSandbox from './components/DeceptionSandbox';
import AristocratEcosystemSandbox from './components/AristocratEcosystemSandbox';
import MilitarySandbox from './components/MilitarySandbox';
import MerchantSuccessionSandbox from './components/MerchantSuccessionSandbox';
import GddBuilder from './components/GddBuilder';
import UprisingCultureSandbox from './components/UprisingCultureSandbox';
import MultiplayerSandbox from './components/MultiplayerSandbox';
import WarPhilosophySandbox from './components/WarPhilosophySandbox';
import DynastyTimeline from './components/DynastyTimeline';
import RealWorldMapBattle from './components/RealWorldMapBattle';
import LoginTutorial from './components/LoginTutorial';
import LoginModuleIndex from './components/LoginModuleIndex';
import ReformSandbox from './components/ReformSandbox';
import RoyalSuccessionSandbox from './components/RoyalSuccessionSandbox';
import TributarySandbox from './components/TributarySandbox';
import IdeologySandbox from './components/IdeologySandbox';
import LandMergeSandbox from './components/LandMergeSandbox';
import SecretPoliceSandbox from './components/SecretPoliceSandbox';
import FactionalismSandbox from './components/FactionalismSandbox';
import FamineReliefSandbox from './components/FamineReliefSandbox';
import VassalRebellionSandbox from './components/VassalRebellionSandbox';

import CharacterNetworkSandbox from './components/CharacterNetworkSandbox';
import MacroEconomySandbox from './components/MacroEconomySandbox';
import PolicyTreeSandbox from './components/PolicyTreeSandbox';
import FactionParliamentSandbox from './components/FactionParliamentSandbox';
import ReignsSwipeSandbox from './components/ReignsSwipeSandbox';
import EU4DiplomaticSandbox from './components/EU4DiplomaticSandbox';

import { auth, loginAnonymously, onAuthStateChanged, signOut, updateProfile, loginWithEmailAndPassword, registerWithEmailAndPassword } from './firebase';
import OnboardingTutorial from './components/OnboardingTutorial';
type User = any;

type ActiveTab = 'gdd' | 'aristocrat' | 'reform' | 'succession' | 'tributary' | 'ideology' | 'landmerge' | 'secretpolice' | 'factionalism' | 'famine' | 'vassal' | 'characternetwork' | 'macroeconomy' | 'policy_tree' | 'faction_parliament' | 'reigns_swipe' | 'eu4_diplomacy' | 'logistics' | 'deception' | 'combat' | 'trade' | 'uprising_culture' | 'multiplayer' | 'war_philosophy' | 'timeline' | 'map_battle' | 'weijiu_scenario';

const TACTIC_CARDS = [
  {
    id: 'qizheng',
    icon: Swords,
    accent: 'text-red-400 border-red-500/20 bg-red-950/10 hover:border-red-500/40',
    activeColor: 'text-red-300 border-red-500 bg-red-950/60'
  },
  {
    id: 'huogong',
    icon: Flame,
    accent: 'text-orange-400 border-orange-500/20 bg-orange-950/10 hover:border-orange-500/40',
    activeColor: 'text-orange-300 border-orange-500 bg-orange-950/60'
  },
  {
    id: 'wujian',
    icon: KeyRound,
    accent: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40',
    activeColor: 'text-emerald-300 border-emerald-500 bg-emerald-950/60'
  },
  {
    id: 'shangzhan',
    icon: Coins,
    accent: 'text-yellow-400 border-yellow-500/20 bg-yellow-950/10 hover:border-yellow-500/40',
    activeColor: 'text-yellow-300 border-yellow-500 bg-yellow-950/60'
  }
];

const RANDOM_MONIKERS = ["诸葛孔明", "陆逊", "辛弃疾", "戚继光", "尉缭子", "张仪", "范蠡", "苏秦", "谢安"];

/** Locale toggle — receives state directly from App, no Context needed */
function LocaleToggleButton({ locale, onToggle }: { locale: Locale; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-1.5 rounded border border-stone-700 bg-stone-900/40 text-stone-400 hover:text-stone-200 transition-all"
      title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <span className="text-[10px] font-mono font-bold">
        {locale === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginNickname, setLoginNickname] = useState<string>('');
  const [playerPassword, setPlayerPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [loginTab, setLoginTab] = useState<'player' | 'admin'>('player');
  const [loginError, setLoginError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<ActiveTab>('map_battle');
  const [appLocale, setAppLocale] = useState<Locale>(() => {
    try {
      const stored = localStorage.getItem('art-of-war-locale');
      if (stored === 'en' || stored === 'zh') return stored;
    } catch (_) {}
    return 'zh';
  });
  const appT = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const table = appLocale === 'zh' ? zh : en;
      let text = table[key] ?? zh[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [appLocale]
  );
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dynasty_admin_mode') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthLoading(false);
        if (!isMuted) {
          soundManager.startBGM(); // Start BG music if allowed
        }
        if (user.displayName === '天演大司马' || localStorage.getItem('dynasty_admin_mode') === 'true') {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
          const done = localStorage.getItem('dynasty_tutorial_completed') === 'true';
          if (!done) {
            setShowTutorial(true);
          }
        }
      } else {
        // Fallback to local storage user state if no Firebase Auth session exists
        try {
          const stored = localStorage.getItem('dynasty_local_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            setCurrentUser(parsed);
            if (!isMuted) {
              soundManager.startBGM(); // Start BG music if allowed
            }
            if (parsed.displayName === '天演大司马' || localStorage.getItem('dynasty_admin_mode') === 'true') {
              setIsAdminMode(true);
            } else {
              setIsAdminMode(false);
              const done = localStorage.getItem('dynasty_tutorial_completed') === 'true';
              if (!done) {
                setShowTutorial(true);
              }
            }
          } else {
            setCurrentUser(null);
            setIsAdminMode(false);
            localStorage.removeItem('dynasty_admin_mode');
          }
        } catch (_) {
          setCurrentUser(null);
          setIsAdminMode(false);
        }
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [isMuted]);

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNickname.trim() || !playerPassword.trim()) {
      setLoginError(appT('login.error.missing'));
      return;
    }
    if (playerPassword.length < 6) {
      setLoginError(appT('login.error.tooshort'));
      return;
    }
    setLoginError('');
    try {
      soundManager.playHorn();
      const pseudoEmail = `${loginNickname.trim()}@dynasty.local`;
      if (isRegistering) {
        await registerWithEmailAndPassword(auth, pseudoEmail, playerPassword, loginNickname.trim());
      } else {
        await loginWithEmailAndPassword(auth, pseudoEmail, playerPassword);
      }
      // Successful login updates state automatically via observer above
    } catch (err: any) {
      console.warn('Firebase Auth failed:', err);
      if (err.code === 'auth/email-already-in-use' || String(err.message).includes('已被册封')) {
        setLoginError(appT('login.error.alreadyRegistered'));
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || String(err.message).includes('密匙勘误')) {
        setLoginError(appT('login.error.wrongPassword'));
      } else if (err.code === 'auth/user-not-found') {
        setLoginError(appT('login.error.notFound'));
      } else {
        setLoginError('Error: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setLoginError('请输入大司马代领密令');
      return;
    }
    if (adminPasscode !== 'suntzu666' && adminPasscode !== 'admin' && adminPasscode !== 'suntzu999') {
      soundManager.playDrum();
      setLoginError('大司马密信符节不合，皇门回绝！');
      return;
    }
    setLoginError('');
    try {
      soundManager.playHorn();
      await loginAnonymously('天演大司马');
      setIsAdminMode(true);
      try {
        localStorage.setItem('dynasty_admin_mode', 'true');
      } catch (_) {}
      setServerLogs(prev => [
        "⚙️ [系统] 天演大司马入朝主事！已解锁特权后台与机制法典编辑系统。",
        ...prev.slice(0, 3)
      ]);
    } catch (err: any) {
      console.warn('Firebase Auth admin sign in failed, continuing with local executive privileges:', err);
      // Fallback: local executive session
      const mockUser = {
        uid: 'local_dasmia_' + Math.random().toString(36).substr(2, 9),
        displayName: '天演大司马',
        isAnonymous: true,
        email: null,
      };
      try {
        localStorage.setItem('dynasty_local_user', JSON.stringify(mockUser));
        localStorage.setItem('dynasty_admin_mode', 'true');
      } catch (_) {}
      setCurrentUser(mockUser);
      setIsAdminMode(true);
      setServerLogs(prev => [
        "⚙️ [系统] 大司马权符验证成功！已启用大司马主管总控，解锁全案机制法典设计文书与时控罗盘。",
        ...prev.slice(0, 3)
      ]);
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      // Toggle off is simple and instantaneous
      setIsAdminMode(false);
      try {
        localStorage.setItem('dynasty_admin_mode', 'false');
      } catch (_) {}
      soundManager.playChime();
      if (activeTab === 'gdd') {
        setActiveTab('map_battle');
      }
      setServerLogs(prev => [
        "🍃 [系统] 您已退出了「大司马主策划后台」，重置为「布衣策士」纯净游戏体验。",
        ...prev.slice(0, 3)
      ]);
    }
  };

  const [dynastyFate, setDynastyFate] = useState({
    mandate: 78,
    stability: 82,
    coffers: 45000,
    emperorAge: 14,
  });

  // Chrono Fork indicators for persistent HUD display
  const [currentChronoYear, setCurrentChronoYear] = useState(-230);
  const [dominantBranch, setDominantBranch] = useState("中华正史始祖轨");

  // Shared master time speed configuration
  const [chronoSpeedSeconds, setChronoSpeedSeconds] = useState(() => {
    try {
      const saved = localStorage.getItem('dynasty_chronometer_speed_seconds');
      if (saved) return Number(saved);
    } catch (e) {}
    return 5; // Default 5 seconds per year
  });

  // Keep it synchronized with localStorage
  useEffect(() => {
    localStorage.setItem('dynasty_chronometer_speed_seconds', String(chronoSpeedSeconds));
  }, [chronoSpeedSeconds]);

  // Sync speed from localStorage changes
  useEffect(() => {
    const handleSyncSpeed = () => {
      try {
        const saved = localStorage.getItem('dynasty_chronometer_speed_seconds');
        if (saved) {
          const val = Number(saved);
          if (val !== chronoSpeedSeconds) {
            setChronoSpeedSeconds(val);
          }
        }
      } catch (e) {}
    };
    const timer = setInterval(handleSyncSpeed, 1000);
    return () => clearInterval(timer);
  }, [chronoSpeedSeconds]);

  // Dynamically synchronize Chrono indicators with actual saved values in the sandbox
  useEffect(() => {
    const handleSync = () => {
      try {
        const lastRoom = localStorage.getItem('dynasty_last_room_id') || 'offline';
        const key = lastRoom && lastRoom !== 'offline' ? `branched-timeline-room-${lastRoom}` : 'branched-timeline-offline';
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const lastNode = parsed[parsed.length - 1];
            setCurrentChronoYear(lastNode.year);
            setDominantBranch(lastNode.branchLabel || "自定义平行世界");
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    handleSync();
    const updater = setInterval(handleSync, 2000);
    return () => clearInterval(updater);
  }, []);

  // Periodically check and ingest automatic chrono random events into MMO server log state
  useEffect(() => {
    const checkQueue = () => {
      try {
        const raw = localStorage.getItem('dynasty_chrono_ticker_queue');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setServerLogs(prev => {
              const nextLogs = [...parsed, ...prev];
              // Keep bounded (max 30 logs)
              return nextLogs.slice(0, 30);
            });
            // Clear queue
            localStorage.removeItem('dynasty_chrono_ticker_queue');
            // Play physical warning alert sound
            soundManager.playDrum();
          }
        }
      } catch (e) {}
    };
    const timer = setInterval(checkQueue, 1500);
    return () => clearInterval(timer);
  }, []);

  // Set the last room ID context for timeline if multiplayer active
  useEffect(() => {
    // Automatically preserve a room setting offline fallback if room is made active
    const lastRoom = localStorage.getItem('dynasty_last_room_id');
    if (!lastRoom) {
      localStorage.setItem('dynasty_last_room_id', 'offline');
    }
  }, []);

  // MMO RPG custom player stats
  const [warlordLevel, setWarlordLevel] = useState(18);
  const [warlordXp, setWarlordXp] = useState(640);
  const maxXp = 1000;
  const [warlordFaction, setWarlordFaction] = useState('ALLIED');// ALLIED (盟军), COURT (朝廷官军), REBEL (楚天义军)
  const [prestige, setPrestige] = useState(2450);
  const [militaryStrength, setMilitaryStrength] = useState(142000); // Manpower

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [cardTimeLeft, setCardTimeLeft] = useState<number>(0);

  const addXp = (amount: number) => {
    setWarlordXp(prev => {
      const nextXp = prev + amount;
      if (nextXp >= maxXp) {
        setWarlordLevel(l => l + 1);
        setServerLogs(log => [
          `🎉 贺！大帅在兵事推演中大有开悟，策力等级直晋一级！当前：十九阶`,
          ...log.slice(0, 3)
        ]);
        return nextXp - maxXp;
      }
      return nextXp;
    });
  };

  useEffect(() => {
    if (cardTimeLeft <= 0) {
      if (activeCardId) {
        setActiveCardId(null);
        setServerLogs(prev => [
          `⌛ 兵法卡牌「${appT(`card.${activeCardId}.name`)}」${appT('card.expired')}`,
          ...prev.slice(0, 3)
        ]);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCardTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cardTimeLeft, activeCardId]);

  // Simulated Online Lobby Stragegists
  const [onlineWarlords, setOnlineWarlords] = useState([
    { name: "白起后裔·杀神", level: "四十二阶", faction: "秦军中营", ping: "二分迟滞", active: "map_battle" },
    { name: "连环反间·张仪", level: "三十五阶", faction: "游侠说客", ping: "四分迟滞", active: "combat" },
    { name: "项王羽翼·虞公", level: "十九阶", faction: "楚地义军", ping: "一分迟滞", active: "uprising_culture" },
    { name: "咸阳大司农·章", level: "五十阶", faction: "朝廷命官", ping: "三分迟滞", active: "timeline" },
    { name: "江左商盟·陈生", level: "二十八阶", faction: "世家盐商", ping: "六分迟滞", active: "trade" }
  ]);

  // Live Edicts & Server-wide Battle Activity Tickers
  const [serverLogs, setServerLogs] = useState<string[]>([
    "📢 齐地诸侯向朝廷秘贡了5000金镒，试图修好修好宗室连襟外交利益。",
    "🔥 塞外临洮守军主控施展了《火攻篇》\"火地战术\"，强行割断匈奴两翼！",
    "⚔️ 咸阳中军朝堂因两派廷议分歧，当前天命稳定度受到了轻微撼动！",
    "🎭 斥候探报：敌营细作刚刚对[奇正军争板块]成功施展了一记\"反间连环计\"！"
  ]);

  const [activeLogIndex, setActiveLogIndex] = useState(0);

  // Auto-scrolling the MMO ticker bar
  useEffect(() => {
    const handle = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % serverLogs.length);
      // Randomly update online strategist properties to make the layout feel incredibly alive
      setOnlineWarlords(prev => prev.map(w => {
        if (Math.random() > 0.6) {
          const actives: ActiveTab[] = ['map_battle', 'combat', 'trade', 'uprising_culture'];
          return {
            ...w,
            ping: `${Math.floor(1 + Math.random() * 8)}分迟滞`,
            active: actives[Math.floor(Math.random() * actives.length)]
          };
        }
        return w;
      }));
    }, 6000);
    return () => clearInterval(handle);
  }, [serverLogs.length]);

  const quoteList = [
    { text: "兵者，国之大事，死生之地，存亡之道，不可不察也。", source: "《孙子兵法·始计篇》" },
    { text: "不战而屈人之兵，善之善者也。故上兵伐谋，其次伐交，其次伐兵。", source: "《孙子兵法·谋攻篇》" },
    { text: "故兵无常势，水无常形，能因敌变化而取胜者，谓之神。", source: "《孙子兵法·虚实篇》" },
    { text: "知彼知己者，百战不殆；不知彼而知己，一胜一负；不知彼不知己，每战必殆。", source: "《孙子兵法·谋攻篇》" }
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);

  const tabs = [
    { id: 'map_battle', name: appT('tab.map_battle.name'), desc: appT('tab.map_battle.desc'), icon: MapIcon, category: 'tactical', accent: 'text-orange-400 hover:text-orange-300' },
    { id: 'timeline', name: appT('tab.timeline.name'), desc: appT('tab.timeline.desc'), icon: Landmark, category: 'tactical', accent: 'text-amber-400 hover:text-amber-300' },
    { id: 'aristocrat', name: appT('tab.aristocrat.name'), desc: appT('tab.aristocrat.desc'), icon: Scale, category: 'tactical', accent: 'text-yellow-500 hover:text-yellow-400' },
    { id: 'reform', name: appT('tab.reform.name'), desc: appT('tab.reform.desc'), icon: Landmark, category: 'tactical', accent: 'text-emerald-500 hover:text-emerald-400' },
    { id: 'succession', name: appT('tab.succession.name'), desc: appT('tab.succession.desc'), icon: Crown, category: 'tactical', accent: 'text-purple-500 hover:text-purple-400' },
    { id: 'tributary', name: appT('tab.tributary.name'), desc: appT('tab.tributary.desc'), icon: Globe, category: 'tactical', accent: 'text-blue-500 hover:text-blue-400' },
    { id: 'ideology', name: appT('tab.ideology.name'), desc: appT('tab.ideology.desc'), icon: BookOpen, category: 'tactical', accent: 'text-teal-500 hover:text-teal-400' },
    { id: 'landmerge', name: appT('tab.landmerge.name'), desc: appT('tab.landmerge.desc'), icon: Sprout, category: 'tactical', accent: 'text-emerald-600 hover:text-emerald-500' },
    { id: 'secretpolice', name: appT('tab.secretpolice.name'), desc: appT('tab.secretpolice.desc'), icon: Fingerprint, category: 'tactical', accent: 'text-red-500 hover:text-red-400' },
    { id: 'factionalism', name: appT('tab.factionalism.name'), desc: appT('tab.factionalism.desc'), icon: ScrollText, category: 'tactical', accent: 'text-blue-400 hover:text-blue-300' },
    { id: 'famine', name: appT('tab.famine.name'), desc: appT('tab.famine.desc'), icon: Wheat, category: 'tactical', accent: 'text-yellow-500 hover:text-yellow-400' },
    { id: 'vassal', name: appT('tab.vassal.name'), desc: appT('tab.vassal.desc'), icon: Castle, category: 'tactical', accent: 'text-fuchsia-500 hover:text-fuchsia-400' },
    { id: 'characternetwork', name: appT('tab.characternetwork.name'), desc: appT('tab.characternetwork.desc'), icon: Network, category: 'tactical', accent: 'text-purple-400 hover:text-purple-300' },
    { id: 'macroeconomy', name: appT('tab.macroeconomy.name'), desc: appT('tab.macroeconomy.desc'), icon: Factory, category: 'tactical', accent: 'text-teal-400 hover:text-teal-300' },
    { id: 'policy_tree', name: appT('tab.policy_tree.name'), desc: appT('tab.policy_tree.desc'), icon: Waypoints, category: 'tactical', accent: 'text-slate-400 hover:text-slate-300' },
    { id: 'faction_parliament', name: appT('tab.faction_parliament.name'), desc: appT('tab.faction_parliament.desc'), icon: Landmark, category: 'tactical', accent: 'text-blue-400 hover:text-blue-300' },
    { id: 'reigns_swipe', name: appT('tab.reigns_swipe.name'), desc: appT('tab.reigns_swipe.desc'), icon: Layers, category: 'tactical', accent: 'text-amber-400 hover:text-amber-300' },
    { id: 'eu4_diplomacy', name: appT('tab.eu4_diplomacy.name'), desc: appT('tab.eu4_diplomacy.desc'), icon: Globe, category: 'tactical', accent: 'text-red-400 hover:text-red-300' },
    { id: 'logistics', name: appT('tab.logistics.name'), desc: appT('tab.logistics.desc'), icon: Shield, category: 'tactical', accent: 'text-emerald-400 hover:text-emerald-300' },
    { id: 'deception', name: appT('tab.deception.name'), desc: appT('tab.deception.desc'), icon: EyeOff, category: 'tactical', accent: 'text-purple-400 hover:text-purple-300' },
    { id: 'weijiu_scenario', name: appT('tab.weijiu_scenario.name'), desc: appT('tab.weijiu_scenario.desc'), icon: Swords, category: 'tactical', accent: 'text-red-400 hover:text-red-300 bg-red-950/20 border border-red-500/20' },
    { id: 'multiplayer', name: appT('tab.multiplayer.name'), desc: appT('tab.multiplayer.desc'), icon: Users, category: 'tactical', accent: 'text-cyan-400 hover:text-cyan-300' },
    { id: 'war_philosophy', name: appT('tab.war_philosophy.name'), desc: appT('tab.war_philosophy.desc'), icon: Compass, category: 'tactical', accent: 'text-rose-400 hover:text-rose-300' },

    { id: 'combat', name: appT('tab.combat.name'), desc: appT('tab.combat.desc'), icon: Swords, category: 'court', accent: 'text-red-400 hover:text-red-350' },
    { id: 'trade', name: appT('tab.trade.name'), desc: appT('tab.trade.desc'), icon: Coins, category: 'faction', accent: 'text-yellow-400 hover:text-yellow-300' },
    { id: 'uprising_culture', name: appT('tab.uprising_culture.name'), desc: appT('tab.uprising_culture.desc'), icon: Flame, category: 'faction', accent: 'text-orange-400 hover:text-orange-350' },
    { id: 'gdd', name: appT('tab.gdd.name'), desc: appT('tab.gdd.desc'), icon: BookOpen, category: 'faction', accent: 'text-amber-500 hover:text-amber-400' },
  ];

  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (tabId === 'map_battle' || tabId === 'combat') {
      soundManager.playHorn();
      setServerLogs(prev => [
        `⚔️ 您起兵巡视了「${tabs.find(t=>t.id===tabId)?.name}」前线！亲掌虎符，发号施令。`,
        ...prev.slice(0, 3)
      ]);
    } else if (tabId === 'trade') {
      soundManager.playCoins();
      setServerLogs(prev => [
        `🪙 您巡视了「大商世家」盐市总会！各省行商毕恭毕敬呈递岁纳金银。`,
        ...prev.slice(0, 3)
      ]);
    } else {
      soundManager.playChime();
      setServerLogs(prev => [
        `🏛️ 精妙朝歌萦绕，您移步至「${tabs.find(t=>t.id===tabId)?.name}」偏殿施政决策！`,
        ...prev.slice(0, 3)
      ]);
    }
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playChime();
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0e0d0c] text-stone-200 flex flex-col items-center justify-center font-serif">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs tracking-widest text-[#C5A059] uppercase animate-pulse">{appT('loading.text')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0c0b] text-[#F5F2ED] flex flex-col justify-center items-center p-4 relative font-sans overflow-hidden select-none" id="warlord-portal-auth-gate">
        {/* Background Subtle Watermark Overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8C2F39]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch animate-fadeIn">
          {/* Left Panel: Register or Custom Login */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#161514] to-[#0f0e0d] border border-[#C5A059]/30 rounded-lg shadow-2xl p-6 md:p-8 text-center flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="inline-flex w-12 h-12 rounded bg-[#8C2F39]/15 border border-[#8C2F39]/40 items-center justify-center text-amber-300 font-serif font-black text-xl mb-1 shadow-md">
                  孙子
                </div>
                <h2 className="text-xl md:text-2xl font-serif font-black text-amber-200 tracking-wider">
                  {appT('login.title')}
                </h2>
                <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase">
                  {appT('login.subtitle')}
                </p>
              </div>

              <p className="text-xs text-stone-400 font-serif leading-relaxed italic border-y border-stone-850 py-3">
                {appT('login.quote')}
              </p>

              {/* Login tab selector */}
              <div className="grid grid-cols-2 bg-stone-950 p-1 rounded border border-stone-900 text-xs shadow-inner">
                <button
                  type="button"
                  onClick={() => { setLoginTab('player'); setLoginError(''); soundManager.playChime(); }}
                  className={`py-2 rounded transition-all duration-200 font-serif font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginTab === 'player' ? 'bg-[#8C2F39] text-[#FAF8F5] shadow-md' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {appT('login.tab.player')}
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginTab('admin'); setLoginError(''); soundManager.playChime(); }}
                  className={`py-2 rounded transition-all duration-200 font-serif font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginTab === 'admin' ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {appT('login.tab.admin')}
                </button>
              </div>

              {loginTab === 'player' ? (
                <form onSubmit={handlePlayerLogin} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-serif font-bold text-amber-400/80 uppercase tracking-wider block">
                      {appT('login.field.nickname.label')}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder={appT('login.field.nickname.placeholder')}
                      value={loginNickname}
                      onChange={(e) => setLoginNickname(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-[#C5A059] rounded px-3 py-2 text-xs text-stone-200 placeholder-stone-600 outline-none font-serif font-semibold transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-serif font-bold text-amber-400/80 uppercase tracking-wider block">
                      {appT('login.field.password.label')}
                    </label>
                    <input
                      type="password"
                      placeholder={appT('login.field.password.placeholder')}
                      value={playerPassword}
                      onChange={(e) => setPlayerPassword(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-[#C5A059] rounded px-3 py-2 text-xs text-stone-200 placeholder-stone-600 outline-none font-mono transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="register-checkbox"
                      checked={isRegistering}
                      onChange={(e) => setIsRegistering(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#8C2F39] rounded cursor-pointer"
                    />
                    <label htmlFor="register-checkbox" className="text-[10.5px] text-stone-300 font-serif cursor-pointer select-none">
                      {appT('login.register.check')}
                    </label>
                  </div>

                  {/* Quick labels */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] text-[#C5A059]/80 font-serif uppercase tracking-widest block font-black">
                      {appT('login.monikers.label')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {RANDOM_MONIKERS.map((moniker) => (
                        <button
                          key={moniker}
                          type="button"
                          onClick={() => { setLoginNickname(moniker); soundManager.playCoins(); }}
                          className={`px-2 py-1 text-[9.5px] font-serif border rounded transition-all cursor-pointer ${
                            loginNickname === moniker
                              ? 'bg-[#8C2F39]/20 border-[#8C2F39] text-amber-300 font-bold'
                              : 'bg-stone-950 hover:bg-stone-900 border-stone-850 hover:border-amber-500/40 text-stone-400'
                          }`}
                        >
                          {moniker}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loginError && (
                    <div className="text-[9.5px] font-mono text-center text-red-400 border border-red-950/40 bg-red-950/15 p-2 rounded leading-relaxed animate-pulse">
                      ⚠️ {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#8C2F39] hover:bg-[#a32f3b] active:scale-[0.98] text-[#F5F2ED] font-serif font-black text-xs py-2.5 rounded transition-all shadow-[#8C2F39]/20 shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase select-none font-bold"
                  >
                    <LogIn className="w-3.5 h-3.5 shrink-0" /> {appT('login.button.submit')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-serif font-bold text-amber-400/80 uppercase tracking-wider block">
                      {appT('login.admin.label')}
                    </label>
                    <input
                      type="password"
                      placeholder={appT('login.admin.placeholder')}
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded px-3 py-2 text-xs text-stone-200 placeholder-stone-605 outline-none font-mono"
                    />
                  </div>

                  <div className="p-2.5 bg-amber-950/10 border border-amber-950/40 rounded text-[9.5px] text-stone-500 leading-relaxed font-sans space-y-1">
                    <p>
                      {appT('login.admin.hint')}
                    </p>
                    <p>
                      {appT('login.admin.hint2')}<b className="text-amber-400 font-mono text-[10.5px]">suntzu666</b> {appLocale === 'zh' ? '或' : 'or'} <b className="text-amber-400 font-mono text-[10.5px]">admin</b>。
                    </p>
                  </div>

                  {loginError && (
                    <div className="text-[9.5px] font-mono text-center text-red-400 border border-red-950/40 bg-red-950/15 p-2 rounded leading-relaxed animate-pulse">
                      ⚠️ {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-amber-400 hover:bg-amber-350 text-stone-950 font-serif font-black text-xs py-2.5 rounded transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase select-none font-extrabold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> {appT('login.admin.button')}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-3 border-t border-stone-850 text-[10px] text-stone-600 font-mono text-center">
              {appT('login.version')}
            </div>
          </div>

          {/* Center Panel: Immersive Gameplay Philosophy Details */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#1b1a19] to-[#121110] border border-[#C5A059]/25 rounded-lg shadow-2xl p-6 md:p-8 flex flex-col justify-between space-y-5 text-left text-[#FAF8F5]">
            <LoginTutorial />

            <div className="border-t border-stone-850 pt-3 flex items-center gap-2.5 text-[10.5px] text-amber-500/80 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8C2F39] animate-ping shrink-0"></span>
              <span className="text-amber-500/80 font-mono">{appT('login.ready')}</span>
            </div>
          </div>

          {/* Right Panel: Module Index View */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#1b1a19] to-[#121110] border border-cyan-900/30 rounded-lg shadow-2xl p-6 md:p-8 flex flex-col justify-between space-y-5 text-left text-[#FAF8F5]">
            <LoginModuleIndex />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0d0c] text-stone-200 flex flex-col font-sans selection:bg-[#8C2F39]/40 selection:text-amber-200 antialiased" id="sun-tzu-app-root">
      
      {/* MMO Server Ticker Message Banner */}
      <div className="bg-[#8C2F39] text-[#FAF8F5] text-xs font-serif font-black overflow-hidden py-1 border-b border-orange-500/30 shadow-inner select-none">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-stone-900/40 text-amber-300 font-mono text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-wider animate-pulse">
              [天下大势]
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={activeLogIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="truncate block max-w-[280px] sm:max-w-[600px] text-[11px] leading-none"
              >
                {serverLogs[activeLogIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-orange-200/95 font-mono">
            <span>在线策士: <b className="text-[#FAF8F5] animate-pulse">4,129 员</b></span>
            <span className="text-orange-300/40">|</span>
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>中原总坛连入稳定</span>
            </span>
          </div>
        </div>
      </div>

      {/* Epic Grand-Strategy MMO HUD Header */}
      <header className="border-b border-[#C5A059]/30 bg-stone-950/95 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-8 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            {/* Wax / Ink Seal Stamp Badge */}
            <motion.div 
              id="ink-seal-stamp"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.85, rotate: [0, -15, 15, -15, 0], filter: "brightness(1.3)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => {
                soundManager.playDrum();
                setServerLogs(prev => ["🥁 【振奋军威】大本营擂槌震天！策士士气如虹！", ...prev.slice(0, 3)]);
              }}
              className="bg-[#8C2F39] text-[#F5F2ED] font-serif font-black flex flex-col items-center justify-center w-12 h-12 rounded border border-black/20 shadow-[0_0_15px_rgba(239,68,68,0.35)] cursor-pointer select-none relative group overflow-hidden" 
              title="击鼓行令"
            >
              <span className="text-[9px] text-[#C5A059] leading-none tracking-widest font-sans mb-0.5 opacity-90 group-hover:scale-105 duration-100">兵法</span>
              <span className="text-base leading-none">孙子</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/35 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-xl font-serif font-black text-amber-200 tracking-wider">
                  {appT('app.title')}
                </h1>
                <div className="flex items-center gap-1 bg-[#8C2F39]/20 border border-red-900/60 text-red-400 px-1.5 py-0.2 rounded text-[7.5px] uppercase font-mono font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping"></span>
                  {appT('app.status')}
                </div>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                {appT('app.subtitle')}
              </p>
            </div>
          </div>

          {/* MMO Classical RPG Resource Counters */}
          <div id="empire-hud-counters" className="flex flex-wrap items-center gap-3 bg-stone-900/85 border border-[#C5A059]/25 p-2 px-3.5 rounded shadow-lg text-xs font-mono w-full md:w-auto justify-between md:justify-start">
            <div className="pr-3.5 border-r border-[#C5A059]/15">
              <span className="text-stone-500 block text-[8px] tracking-wider font-bold">{appT('hud.mandate')}</span>
              <span className="font-bold text-amber-400 flex items-center gap-1.5 mt-0.5 text-xs">
                <Crown className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="bg-amber-950/40 px-1 rounded border border-amber-500/20">{dynastyFate.mandate}%</span>
              </span>
            </div>
            
            <div className="pr-3.5 border-r border-[#C5A059]/15">
              <span className="text-stone-500 block text-[8px] tracking-wider font-bold">{appT('hud.coffers')}</span>
              <span className="font-bold text-yellow-500 flex items-center gap-1 mt-0.5 text-xs">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400">{dynastyFate.coffers.toLocaleString()} {appT('hud.coffers.unit')}</span>
              </span>
            </div>

            <div className="pr-3.5 border-r border-[#C5A059]/15 hidden sm:block">
              <span className="text-stone-500 block text-[8px] uppercase tracking-wider font-bold">{appT('hud.stability')}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-16 h-1.5 bg-stone-950 rounded overflow-hidden p-[1px] border border-stone-850">
                  <div className="h-full bg-emerald-500/80 rounded" style={{ width: `${dynastyFate.stability}%` }} />
                </div>
                <span className="font-bold text-emerald-400 text-[11px]">{dynastyFate.stability}%</span>
              </div>
            </div>

            {/* Traditional Audio Master Control UI */}
            <div className="pl-1 flex items-center gap-2">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playChime();
                    soundManager.stopBGM();
                    signOut(auth).catch(() => {});
                    try {
                      localStorage.removeItem('dynasty_local_user');
                      localStorage.removeItem('dynasty_admin_mode');
                      localStorage.removeItem('dynasty_tutorial_completed');
                    } catch (_) {}
                    setCurrentUser(null);
                    setIsAdminMode(false);
                  }}
                  className="px-3 py-1.5 rounded border border-[#8C2F39]/40 hover:border-red-500/50 text-[#F5F2ED] bg-[#8C2F39]/40 hover:bg-[#8C2F39] transition-all text-xs font-serif font-black flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 shadow-md"
                  title={appT('auth.logout.title')}
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-300" />
                  <span>{appT('auth.logout.button')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleSound}
                className={`p-1.5 rounded border transition-all ${
                  isMuted
                    ? 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
                    : 'border-amber-500/40 bg-[#8C2F39]/15 text-amber-400 hover:bg-[#8C2F39]/30 shadow-md shadow-orange-950/20'
                }`}
                title={isMuted ? appT('sound.unmute.title') : appT('sound.mute.title')}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
              </button>
              <LocaleToggleButton locale={appLocale} onToggle={() => setAppLocale(appLocale === 'zh' ? 'en' : 'zh')} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Menu & Player Character Deck Drawer */}
        <nav className="lg:col-span-3 space-y-4 flex flex-col" id="navigation-sidebar">
          
          {/* MMO Gamer Character Card */}
          <div id="warlord-char-card" className="bg-gradient-to-b from-stone-900/80 to-stone-950/95 border border-[#C5A059]/30 rounded-lg p-3.5 shadow-xl relative overflow-hidden">
            {/* Aesthetic Silk Pattern overlay */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none select-none font-serif text-6xl text-amber-500 font-black">
              玺
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-stone-800 border-2 border-amber-500/60 flex items-center justify-center text-xl font-bold font-serif text-amber-200">
                  {warlordFaction === 'ALLIED' ? '盟' : warlordFaction === 'COURT' ? '臣' : '叛'}
                </div>
                <span className="absolute -bottom-1.5 -right-1 bg-amber-500 text-stone-950 font-black font-mono text-[8px] px-1 rounded-full ring-1 ring-stone-950 shadow">
                  {warlordLevel}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-serif font-black text-xs text-amber-200 tracking-wider truncate max-w-[85px]" title={currentUser?.displayName || '布衣策士'}>
                    {currentUser?.displayName || '布衣策士'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[7px] font-mono bg-amber-950 text-amber-400 px-1 border border-amber-500/20 rounded leading-none py-0.5">
                      {isAdminMode ? '大司马' : '策士'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playChime();
                        setShowTutorial(true);
                      }}
                      className="p-1 px-1.5 rounded bg-[#8C2F39]/15 hover:bg-[#8C2F39]/30 border border-[#8C2F39]/40 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 transition-all text-[8px] font-serif font-bold cursor-pointer flex items-center justify-center gap-0.5"
                      title="重温讲武堂导学"
                    >
                      <HelpCircle className="w-2.5 h-2.5" />
                      <span>导学</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playChime();
                        soundManager.stopBGM();
                        signOut(auth).catch(() => {});
                        try {
                          localStorage.removeItem('dynasty_local_user');
                          localStorage.removeItem('dynasty_admin_mode');
                          localStorage.removeItem('dynasty_tutorial_completed');
                        } catch (_) {}
                        setCurrentUser(null);
                        setIsAdminMode(false);
                      }}
                      className="p-1 px-1.5 rounded bg-stone-950 hover:bg-red-950/30 border border-stone-800 hover:border-red-900 text-stone-400 hover:text-red-400 transition-all text-[8px] font-serif font-bold cursor-pointer flex items-center justify-center gap-0.5"
                      title="解甲归田 (退出账号并重启导学)"
                    >
                      <LogOut className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
                
                {/* XP Meter */}
                <div className="mt-1.5 flex items-center justify-between text-[7.5px] font-mono text-stone-500">
                  <span>策力经验</span>
                  <span>{warlordXp}/{maxXp}</span>
                </div>
                <div className="w-full h-1 bg-stone-950 rounded mt-0.5 overflow-hidden p-[1px] border border-stone-800">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-orange-400 rounded" style={{ width: `${(warlordXp/maxXp)*100}%` }} />
                </div>
              </div>
            </div>

            {/* RPG Detailed States */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 pt-3 border-t border-stone-800 text-[10px] font-mono">
              <div className="p-1 px-2 rounded bg-stone-900/60 border border-stone-800">
                <span className="text-stone-500 block text-[7px] uppercase font-bold">功勋名声</span>
                <span className="font-serif font-black text-amber-300 flex items-center gap-1 mt-0.5">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  {prestige.toLocaleString()} 点
                </span>
              </div>
              <div className="p-1 px-2 rounded bg-stone-900/60 border border-stone-800">
                <span className="text-stone-500 block text-[7px] uppercase font-bold">麾下御卫</span>
                <span className="font-serif font-black text-rose-300 flex items-center gap-1 mt-0.5">
                  <Swords className="w-3 h-3 text-rose-400" />
                  {(militaryStrength/1000).toFixed(0)}k 甲兵
                </span>
              </div>
            </div>

            {/* MMO Faction Banner Shifter Component (Changes Player Camp Accent) */}
            <div className="mt-3.5 pt-3 border-t border-stone-800">
              <span className="text-[8px] font-mono text-stone-500 block mb-1 uppercase font-black">归附大营</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'ALLIED', zh: '关外联军', style: 'border-amber-900 text-amber-500 hover:bg-amber-950/20 bg-amber-950/10' },
                  { id: 'COURT', zh: '大秦铁骑', style: 'border-red-900 text-red-400 hover:bg-red-950/20 bg-red-950/10' },
                  { id: 'REBEL', zh: '楚地义军', style: 'border-orange-950 text-orange-400 hover:bg-orange-950/20 bg-orange-950/10' }
                ].map(camp => {
                  const isCamp = warlordFaction === camp.id;
                  return (
                    <button
                      key={camp.id}
                      type="button"
                      onClick={() => {
                        setWarlordFaction(camp.id);
                        soundManager.playDrum();
                        const logs = {
                          ALLIED: `🛡️ 您更换了兵营印绶，归附「${camp.zh}」！合纵谋略，遥领奇功。`,
                          COURT: `👑 您向关内奏表，自负「${camp.zh}」前敌都尉！王师北定，军令如山。`,
                          REBEL: `🔥 您斩木为兵，加盟「${camp.zh}」项羽大军！楚人一炬，星火燎原。`
                        };
                        setServerLogs(prev => [logs[camp.id as 'ALLIED'|'COURT'|'REBEL'], ...prev.slice(0, 3)]);
                        if (camp.id === 'COURT') {
                          setPrestige(p => p + 50);
                        } else if (camp.id === 'REBEL') {
                          setMilitaryStrength(m => m + 15000);
                        }
                      }}
                      className={`text-[8.5px] font-serif py-1 px-1 rounded text-center border cursor-pointer font-bold transition-all ${
                        isCamp 
                          ? 'border-amber-400 text-stone-900 bg-amber-400 font-black shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                          : camp.style
                      }`}
                    >
                      {camp.zh}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chronological Fork HUD Widget with Interactive Speed Controller and Live Sandbox Impact Monitor */}
          <div className="bg-stone-900/95 border border-amber-500/35 rounded-lg p-3.5 shadow-xl relative overflow-hidden space-y-3.5" id="chrono-engine-widget">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#8C2F39]/15 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: `${chronoSpeedSeconds * 2}s` }} />
                天纲时纪仪
              </span>
              <span className="bg-[#8C2F39]/35 border border-red-900/50 text-amber-200 text-[7px] font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                岁时自决
              </span>
            </div>

            {/* BCE Year Status */}
            <div className="bg-stone-950 p-2.5 rounded border border-stone-850 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-stone-400 font-serif">当前天元岁朝:</span>
                <span className="text-[#FAF8F5] font-serif font-black flex items-center gap-1 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 shadow-inner">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                  前 {Math.abs(currentChronoYear)} 年
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] pt-1.5 border-t border-stone-900">
                <span className="text-stone-400 font-serif">主导命运世界线:</span>
                <span className="text-amber-500 font-bold font-serif truncate max-w-[130px] block" title={dominantBranch}>
                  {dominantBranch}
                </span>
              </div>
            </div>

            {/* Interactive Timeline Speed Controls (Admin Mode Only) */}
            {isAdminMode ? (
              <>
                <div className="space-y-1.5 pt-1.5 border-t border-stone-850">
                  <span className="text-[8px] font-semibold text-stone-500 font-mono uppercase tracking-wider block">
                    🛠️ 大司马调节时律流速
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '极速', seconds: 1, text: '1s=1年', desc: '极限朝代演进' },
                      { label: '倍速', seconds: 5, text: '5s=1年', desc: '经典测试倍率' },
                      { label: '温速', seconds: 60, text: '1m=1年', desc: '长时策略执政' },
                      { label: '正流', seconds: 86400, text: '1d=1年', desc: '常态同步天流' },
                    ].map((sp) => {
                      const isCurrent = chronoSpeedSeconds === sp.seconds;
                      return (
                        <button
                          key={sp.seconds}
                          type="button"
                          onClick={() => {
                            setChronoSpeedSeconds(sp.seconds);
                            soundManager.playCoins();
                            setServerLogs(prev => [
                              `⏳ [密令] 大司马调时时律流速设为「${sp.label} (${sp.text})」，加速 ${(86400 / sp.seconds).toLocaleString()} 倍。`,
                              ...prev.slice(0, 3)
                            ]);
                          }}
                          className={`text-[8px] font-serif py-1 rounded text-center border cursor-pointer font-black transition-all ${
                            isCurrent 
                              ? 'border-amber-400 text-stone-950 bg-amber-400 font-black shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                              : 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850 bg-stone-950'
                          }`}
                          title={sp.desc}
                        >
                          {sp.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[7.5px] text-stone-500 font-mono italic text-right">
                    速律放大系数: +{(86400 / chronoSpeedSeconds).toLocaleString()}x 瞬态缩合
                  </p>
                </div>

                {/* Dynamic Impacts on asynchronous sandtable modules */}
                <div className="space-y-1.5 pt-2 border-t border-stone-800">
                  <span className="text-[8px] font-black text-amber-500/80 font-mono uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-500" />
                    时间折叠对各异步沙盒模块即时影响计
                  </span>

                  <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-0.5" id="async-impacts-list">
                    {[
                      {
                        name: '朝堂夺嫡',
                        impact: `皇帝多疑年岁结算缩短至现实中每 ${chronoSpeedSeconds} 秒更新。朝堂依附纠纷概率在单秒内增加 ${(5 / chronoSpeedSeconds).toFixed(1)} 倍。`,
                        warning: chronoSpeedSeconds <= 5 ? '高频震荡' : '运转温和'
                      },
                      {
                        name: '奇正军争',
                        impact: `前线王师与匈奴集结军事判定每 ${chronoSpeedSeconds} 秒校验一次。一昼夜对应数百年变数，战役宿命极不稳定。`,
                        warning: chronoSpeedSeconds <= 5 ? '兵防骤变' : '阵营徐图'
                      },
                      {
                        name: '大商世家',
                        impact: `国库商课年利及盐场分红核算压缩至 ${chronoSpeedSeconds === 86400 ? '史诗真实日结算' : '现实 ' + chronoSpeedSeconds + ' 秒'}。金币通胀及垄断几率加权。`,
                        warning: '赋税高敏'
                      },
                      {
                        name: '起义信仰',
                        impact: `楚天起义触发积累以及百家学说传布以每秒 ${(86400 / chronoSpeedSeconds).toLocaleString()} 岁速率对决。星火燎原几率极速爆燃！`,
                        warning: chronoSpeedSeconds <= 5 ? '烽烟四起' : '学派潜修'
                      }
                    ].map((item, id) => (
                      <div key={id} className="bg-stone-950 p-1.5 rounded border border-stone-850 text-[8.5px] font-sans space-y-0.5 hover:border-stone-800 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="font-serif font-black text-stone-300">{item.name}</span>
                          <span className={`text-[7px] font-mono px-1 rounded-sm ${
                            item.warning.includes('高') || item.warning.includes('骤') || item.warning === '烽烟四起'
                              ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                              : 'bg-stone-900 text-stone-500 border border-stone-800'
                          }`}>
                            {item.warning}
                          </span>
                        </div>
                        <p className="text-stone-400 font-mono text-[7.5px] leading-relaxed">
                          {item.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[9px] text-[#C5A059]/80 font-serif leading-relaxed bg-stone-950 border border-stone-900 p-2.5 rounded text-center my-1.5 shadow-inner">
                📜 <b>策士修行：</b><br />
                时纪流速齿轮与后台折叠沙盒系统在布衣模式中已隐藏。请专注运筹帷幄！
              </div>
            )}

            <div className="flex justify-between items-center pt-0.5 text-[8.5px]">
              <span className="text-stone-500 font-mono">1 岁朝 = {chronoSpeedSeconds >= 60 ? (chronoSpeedSeconds/60).toFixed(0) + ' 分钟' : chronoSpeedSeconds + ' 现实秒'}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('timeline');
                  soundManager.playDrum();
                }}
                className="text-[9px] text-[#C5A059] hover:text-[#FAF8F5] cursor-pointer flex items-center gap-1 font-serif font-black group transition-all"
                title="开启多轴天命抉择沙盘"
              >
                策动分支史演
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* MMO Categorized Sandtable Tabs Layout */}
          <div className="bg-stone-950/90 border border-stone-900 rounded-lg p-2.5 flex-1 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              
              {/* Category 1: Tactical Map sandtable */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black font-serif text-amber-500/70 uppercase tracking-widest pl-1 block border-l-2 border-amber-500/50">
                  {appT('nav.category.tactical')}
                </span>
                <div className="space-y-1">
                  {tabs.filter(t => t.category === 'tactical').map((t) => {
                    const Icon = t.icon;
                    const isSelected = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        id={`tab-nav-${t.id}`}
                        type="button"
                        onClick={() => handleTabChange(t.id as ActiveTab)}
                        className={`w-full p-2 rounded text-left transition-all duration-150 border flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-stone-950 border-amber-400 font-bold font-serif shadow-md'
                            : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-stone-950' : 'text-stone-500'}`} />
                        <div className="truncate">
                          <span className="text-[11px] block font-semibold">{t.name}</span>
                          <span className={`${isSelected ? 'text-stone-800' : 'text-stone-500'} text-[8px] truncate block mt-0.5`}>{t.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Court command */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black font-serif text-purple-400/80 uppercase tracking-widest pl-1 block border-l-2 border-purple-400/60">
                  {appT('nav.category.court')}
                </span>
                <div className="space-y-1">
                  {tabs.filter(t => t.category === 'court').map((t) => {
                    const Icon = t.icon;
                    const isSelected = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        id={`tab-nav-${t.id}`}
                        type="button"
                        onClick={() => handleTabChange(t.id as ActiveTab)}
                        className={`w-full p-2 rounded text-left transition-all duration-150 border flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-900 border-purple-400/50 text-[#FAF8F5] font-bold font-serif shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                            : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-300' : 'text-stone-500'}`} />
                        <div className="truncate">
                          <span className="text-[11px] block font-semibold">{t.name}</span>
                          <span className={`${isSelected ? 'text-purple-200/70' : 'text-stone-500'} text-[8px] truncate block mt-0.5`}>{t.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: Regional intelligence & trade */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black font-serif text-emerald-400/80 uppercase tracking-widest pl-1 block border-l-2 border-emerald-400/60">
                  {appT('nav.category.faction')}
                </span>
                <div className="space-y-1">
                  {tabs.filter(t => t.category === 'faction' && (isAdminMode || t.id !== 'gdd')).map((t) => {
                    const Icon = t.icon;
                    const isSelected = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        id={`tab-nav-${t.id}`}
                        type="button"
                        onClick={() => handleTabChange(t.id as ActiveTab)}
                        className={`w-full p-1.5 rounded text-left transition-all duration-150 border flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                            : 'bg-transparent border-transparent text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-stone-500'}`} />
                        <div className="truncate">
                          <span className="text-[11.5px] block font-semibold font-serif">{t.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MMO Lobby Live Online Strategists panel */}
            <div className="mt-4 pt-3.5 border-t border-stone-900">
              <span className="text-[8px] font-mono text-stone-500 block mb-1.5 uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                同坛推演策士
              </span>
              <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                {onlineWarlords.map((warlord, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[8.5px] font-mono p-1 bg-stone-900/40 rounded border border-stone-950 hover:bg-stone-900/90 hover:border-stone-800 transition-all">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.2 h-1.2 rounded-full bg-emerald-500"></span>
                      <span className="font-serif font-black text-amber-200">{warlord.name}</span>
                      <span className="text-stone-500">{warlord.level}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-stone-950 text-stone-400 rounded-full px-1.5 py-[0.5px]">
                      <span>{tabs.find(t=>t.id===warlord.active)?.name.split(' ')[0] || "推演"}</span>
                      <span className="text-[7px] text-emerald-400 opacity-90">{warlord.ping}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Advice / Classical Sayings */}
          <div className="bg-stone-950/90 p-4 rounded-lg border border-stone-900 space-y-3 relative overflow-hidden shadow-xs">
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border border-amber-500/10 rounded-full opacity-30 select-none"></div>
            <h4 className="text-[10px] font-serif font-black text-amber-400 tracking-wider flex items-center gap-1">
              <Sparkle className="w-3 h-3 text-amber-400 animate-spin" />
              孙子兵法十三篇·本堂精要
            </h4>
            
            <p className="text-[11px] text-stone-300 leading-relaxed font-serif italic" id="sun-tzu-quote-display">
              " {quoteList[quoteIndex].text} "
            </p>

            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[#C5A059] font-mono">
                {quoteList[quoteIndex].source}
              </span>

              <button
                id="next-quote-btn"
                type="button"
                onClick={() => {
                  setQuoteIndex((prev) => (prev + 1) % quoteList.length);
                  soundManager.playDrum();
                }}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-0.5 font-bold cursor-pointer"
              >
                研读下篇 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Art of War Military Strategy Cards Widget */}
          <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border border-amber-500/20 rounded-lg p-3.5 shadow-xl relative overflow-hidden space-y-3" id="sun-tzu-strategy-cards">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-[9.5px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                军阵"兵法卡牌"
              </span>
              <span className="bg-[#8C2F39]/35 border border-red-900/50 text-amber-100 text-[8px] font-mono px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                瞬态御领
              </span>
            </div>

            {/* Explanatory subtitle */}
            <p className="text-[9px] text-stone-400 font-serif leading-relaxed">
              点击祭献兵法秘卷，可施加持续 <span className="text-amber-400 font-bold font-mono">30</span> 秒当前沙盒的特殊数理兵法加持，并瞬增本部的资政金镒或策经验！
            </p>

            {/* Active Card HUD */}
            {activeCardId ? (
              <div className="bg-[#8C2F39]/15 border border-[#8C2F39]/50 p-2 rounded flex items-center justify-between text-xs animate-pulse text-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <div>
                    <span className="font-serif font-black text-[11px] block text-amber-300">
                      【已祭起：{appT(`card.${activeCardId}.name`)}】
                    </span>
                    <span className="text-[8.5px] text-stone-400 block mt-0.5 font-mono">
                      {appT(`card.${activeCardId}.effect`)} (余 {cardTimeLeft}s)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardId(null);
                    setCardTimeLeft(0);
                    soundManager.playChime();
                  }}
                  className="text-[8px] bg-stone-900 text-stone-400 hover:text-red-400 px-1.5 py-0.5 rounded border border-stone-800 transition font-mono font-bold uppercase cursor-pointer"
                >
                  撤阵
                </button>
              </div>
            ) : (
              <div className="bg-stone-950 p-2 rounded border border-stone-850 text-center text-[9px] text-[#C5A059]/70 italic font-serif">
                ─ 空明无阵 · 待主帅祭起符檄 ─
              </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-2 gap-2">
              {TACTIC_CARDS.map(card => {
                const Icon = card.icon;
                const isActive = activeCardId === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      // Playing sound
                      soundManager.playDrum();
                      if (card.id === 'shangzhan') {
                        soundManager.playCoins();
                      } else {
                        soundManager.playHorn();
                      }

                      // Apply instantaneous RPG effect
                      let logs = '';
                      if (card.id === 'qizheng') {
                        setMilitaryStrength(m => m + 12000);
                        addXp(120);
                        logs = `⚔️ 您祭起了《奇正相生》卡牌！中军虎符瞬增 12,000 锐卒，并在当前模块永久加持 35% 攻防胜率！`;
                      } else if (card.id === 'huogong') {
                        setPrestige(p => p + 150);
                        addXp(120);
                        logs = `🔥 您吟诵并发动了《火攻奇袭》秘卷！火计连天，名声增加 150 点，并将起义转化速度提振 50%精度！`;
                      } else if (card.id === 'wujian') {
                        setPrestige(p => p + 150);
                        setDynastyFate(prev => ({ ...prev, stability: Math.min(100, prev.stability + 5) }));
                        logs = `⛓️ 您密发了《五间妙连》符节！安邦稳定提升 5%，游说及情报打探威能提升 45%！`;
                      } else if (card.id === 'shangzhan') {
                        setDynastyFate(prev => ({ ...prev, coffers: prev.coffers + 8000 }));
                        addXp(120);
                        logs = `🪙 您施展了《商战大垄》秘术！国帑库金瞬间搜括并充裕 8,000 金镒，商业大盘税率通享 +40% 红利！`;
                      }

                      setActiveCardId(card.id);
                      setCardTimeLeft(30);

                      setServerLogs(prev => [
                        logs,
                        ...prev.slice(0, 3)
                      ]);
                    }}
                    className={`p-2.5 rounded border flex flex-col items-center text-center transition-all cursor-pointer relative group ${
                      isActive
                        ? card.activeColor + ' ring-1 ring-amber-500 scale-[1.02] font-black shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : card.accent + ' hover:border-amber-500/50 hover:bg-stone-900/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 mb-1 ${isActive ? 'text-amber-400 animate-bounce' : 'text-stone-400'}`} />
                    <span className="text-[10px] font-serif font-black tracking-wide block">
                      {appT(`card.${card.id}.name`)}
                    </span>
                    <span className="text-[7.5px] text-stone-500 block mt-0.5 truncate max-w-full font-mono">
                      {appT('card.art')}
                    </span>

                    {/* Hover text block preview */}
                    <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 bottom-full mb-2 p-2.5 bg-stone-950 border border-amber-500/40 text-stone-200 text-[9px] rounded-md shadow-2xl w-48 text-left leading-relaxed z-50 pointer-events-none">
                      <div className="font-serif font-black text-amber-400 border-b border-stone-800 pb-1 flex items-center justify-between">
                        <span>{appT(`card.${card.id}.name`)}</span>
                        <span className="text-[7px] bg-[#8C2F39] text-[#FAF8F5] px-1 rounded font-mono">{appT('card.duration')}</span>
                      </div>
                      <p className="text-stone-400 font-serif italic my-1 font-bold">
                        " {appT(`card.${card.id}.quote`)} "
                      </p>
                      <p className="text-stone-305 font-sans leading-normal">
                        {appT(`card.${card.id}.desc`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin / Developer Settings Switcher */}
          {isAdminMode && (
            <div className={`rounded-lg p-3 border transition-all duration-300 relative overflow-hidden bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]`}>
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-full"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse animate-duration-1000"></span>
                  <span className="text-[10px] font-serif font-black tracking-wider text-stone-300">
                    ⚙️ 开发者主编后台
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAdminMode}
                  className="py-0.5 px-2 rounded-full text-[8.5px] font-mono cursor-pointer transition-all duration-200 border uppercase font-bold select-none bg-amber-400 text-stone-950 border-amber-400 font-extrabold shadow-sm hover:opacity-80"
                >
                  已启 / 关闭
                </button>
              </div>
              
              <p className="text-[8.5px] text-stone-500 leading-relaxed font-sans mt-1.5">
                已临时解锁「策划主编 [GDD] 标签页」！可在此查阅17篇玩法详情、量化测试算法、及发起 AI 兵道机制演进。点击上方关闭后，可重置为玩家模式。
              </p>
            </div>
          )}
        </nav>

        {/* Content Dynamic Panel inside a polished framer motion stage */}
        <section className="lg:col-span-9 h-full">
          <GameEngineProvider active={activeTab === 'weijiu_scenario'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -7 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'weijiu_scenario' && (
                <WeiJiuZhaoScenario
                  locale={appLocale}
                  t={appT}
                  onDynastyFateUpdate={(stats) => setDynastyFate(prev => ({ ...prev, ...stats }))}
                />
              )}
              {activeTab === 'map_battle' && <RealWorldMapBattle activeCardId={activeCardId} />}
              {activeTab === 'aristocrat' && <AristocratEcosystemSandbox />}
              {activeTab === 'reform' && <ReformSandbox />}
              {activeTab === 'succession' && <RoyalSuccessionSandbox />}
              {activeTab === 'tributary' && <TributarySandbox />}
              {activeTab === 'ideology' && <IdeologySandbox />}
              {activeTab === 'landmerge' && <LandMergeSandbox />}
              {activeTab === 'secretpolice' && <SecretPoliceSandbox />}
              {activeTab === 'factionalism' && <FactionalismSandbox />}
              {activeTab === 'famine' && <FamineReliefSandbox />}
              {activeTab === 'vassal' && <VassalRebellionSandbox />}
              {activeTab === 'characternetwork' && <CharacterNetworkSandbox />}
              {activeTab === 'macroeconomy' && <MacroEconomySandbox />}
              {activeTab === 'policy_tree' && <PolicyTreeSandbox />}
              {activeTab === 'faction_parliament' && <FactionParliamentSandbox />}
              {activeTab === 'reigns_swipe' && <ReignsSwipeSandbox />}
              {activeTab === 'eu4_diplomacy' && <EU4DiplomaticSandbox />}
              {activeTab === 'logistics' && <LogisticsNetworkSandbox />}
              {activeTab === 'deception' && <DeceptionSandbox />}
              {activeTab === 'timeline' && <DynastyTimeline dynastyStats={dynastyFate} onSyncState={(stats) => setDynastyFate(prev => ({ ...prev, ...stats }))} />}
              {activeTab === 'multiplayer' && <MultiplayerSandbox onSyncState={(stats) => setDynastyFate(prev => ({ ...prev, ...stats }))} />}
              {activeTab === 'war_philosophy' && (
                <WarPhilosophySandbox 
                  currentChronoYear={currentChronoYear}
                  dynastyStats={dynastyFate}
                  onSyncState={(stats) => setDynastyFate(prev => ({ ...prev, ...stats }))}
                  activeCardId={activeCardId}
                />
              )}
              {activeTab === 'gdd' && (
                <GddBuilder 
                  warlordLevel={warlordLevel}
                  setWarlordLevel={setWarlordLevel}
                  warlordXp={warlordXp}
                  setWarlordXp={setWarlordXp}
                  prestige={prestige}
                  setPrestige={setPrestige}
                  militaryStrength={militaryStrength}
                  setMilitaryStrength={setMilitaryStrength}
                  dynastyFate={dynastyFate}
                  setDynastyFate={setDynastyFate}
                  addXp={addXp}
                  setServerLogs={setServerLogs}
                />
              )}
              {activeTab === 'combat' && <MilitarySandbox activeCardId={activeCardId} />}
              {activeTab === 'trade' && <MerchantSuccessionSandbox />}
              {activeTab === 'uprising_culture' && <UprisingCultureSandbox activeCardId={activeCardId} />}
            </motion.div>
          </AnimatePresence>
          </GameEngineProvider>
        </section>
      </main>

      {/* Eastern Zen majestic MMO Footer */}
      <footer className="border-t border-[#C5A059]/20 py-4 px-4 bg-stone-950 text-center text-xs mt-auto font-serif text-[#C5A059]/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="tracking-wide">{appT('footer.copyright')}</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <span className="text-stone-500">{appT('footer.version')}</span>
            <span className="text-amber-400">{appT('footer.location')}</span>
          </div>
        </div>
      </footer>

      {/* Interactive Step-by-Step Tutorial / Onboarding Flow */}
      <AnimatePresence>
        {showTutorial && currentUser && (
          <OnboardingTutorial
            displayName={currentUser.displayName || '布衣策士'}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onComplete={(rewards) => {
              setShowTutorial(false);
              localStorage.setItem('dynasty_tutorial_completed', 'true');
              soundManager.playHorn();
              setPrestige(p => p + rewards.prestige);
              addXp(rewards.xp);
              setServerLogs(prev => [
                `🎉 [皇天生瑞] 策士「${currentUser.displayName || '布衣策士'}」顺利从讲武堂毕业，主政大局获得 ${rewards.xp} XP & ${rewards.prestige} 功勋！`,
                ...prev.slice(0, 3)
              ]);
            }}
            onSkip={() => {
              setShowTutorial(false);
              localStorage.setItem('dynasty_tutorial_completed', 'true');
              soundManager.playChime();
              setServerLogs(prev => [
                `🍃 [系统] 策士「${currentUser.displayName || '布衣策士'}」跳过了讲武堂基础导学，直接进入兵法总沙盘独立治策。`,
                ...prev.slice(0, 3)
              ]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
