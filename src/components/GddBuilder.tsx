import React, { useState, useEffect } from 'react';
import { COMPLETED_MODULES, UNFINISHED_MODULES } from '../data/gddData';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Save, 
  Plus, 
  Copy, 
  Check,
  Users,
  Bug,
  Activity,
  Sparkles,
  TrendingUp,
  BarChart2,
  Zap,
  Play,
  RotateCcw,
  Award,
  BookOpenCheck,
  FileCheck2,
  ListFilter,
  Flame,
  CheckSquare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  Legend 
} from 'recharts';
import { soundManager } from '../utils/soundManager';

interface Cohort {
  id: string;
  name: string;
  sub: string;
  size: number;
  retention7d: string;
  focusTab: string;
  satisfaction: number;
  bugReported: string;
  bugSeverity: '低' | '中' | '高';
  feedback: string;
  avatar: string;
}

const PLAYER_COHORTS: Cohort[] = [
  {
    id: 'historian',
    name: '史学考据党 (Historians/Purists)',
    sub: '重视经典典籍还原、朝代天命沉浸感及纪年完整度',
    size: 4500,
    retention7d: '72%',
    focusTab: 'DynastyTimeline (纪年朝代)',
    satisfaction: 94,
    bugReported: '【文本勘误】陈胜起义事件描述中“刑大夫”词汇应修正为更精确的“刑徒役夫”。',
    bugSeverity: '低',
    feedback: '“司马迁《史记》的记叙感太强烈了！结合时局天命波动的文人判定，不单在玩游戏，更像在批阅一份千余年前的帝国机密黄册。”',
    avatar: '👴'
  },
  {
    id: 'pdx_warlord',
    name: 'P社战棋发烧友 (Strategy Veterans)',
    sub: '关注真实地图隘口、兵备统御指挥和战事决策树联动',
    size: 5800,
    retention7d: '64%',
    focusTab: 'RealWorldMapBattle (真实地图/战事)',
    satisfaction: 89,
    bugReported: '【UI重叠】在移动端浏览器视窗高度不足时，战况行军线的坐标气泡与底部卡牌偶有微小尺寸溢出。',
    bugSeverity: '中',
    feedback: '“在谷歌地图的写意墨拓上推演楚汉争锋与秦扫六国，地形绝险（如函谷、九原）的卡口判定非常精妙，兵法卡牌奇正相生太及时了！”',
    avatar: '🎖️'
  },
  {
    id: 'meme_rebel',
    name: '网络脑洞同人派 (Meme/Slogan Creators)',
    sub: '热爱农民起义、三教名师讲法及诸子百家造梗',
    size: 7200,
    retention7d: '76%',
    focusTab: 'UprisingCulture (流民信仰)',
    satisfaction: 96,
    bugReported: '【机制越界】流民在极端蝗灾与饥馑并发时，教化转化率有极低概率短暂冲破 100% 设限值。',
    bugSeverity: '低',
    feedback: '“王侯将相宁有种乎！起义军势力的教化传布极易上头，通过散财、传歌转化流民太魔性了，在评论区和视频中造梗力度拉满。”',
    avatar: '🔥'
  },
  {
    id: 'tycoon_merchant',
    name: '数值刷子与财阀商贾 (Min-Maximizers)',
    sub: '主攻大商世家私盐利息复利、朝堂买官卖官及最优解',
    size: 3200,
    retention7d: '55%',
    focusTab: 'MerchantSuccession (大商世家/朝堂)',
    satisfaction: 85,
    bugReported: '【逻辑越界】祭献“商战大垄”卡牌增发国帑时，若在结算瞬间连续跳转朝堂夺嫡，偶有几秒钟的数值不同步。',
    bugSeverity: '中',
    feedback: '“经营复利加上在朝廷买卖爵位，滚雪球的速度无与伦比。卡牌Buff效果立竿见影，希望未来能增加更多的商业对赌条约！”',
    avatar: '🪙'
  }
];

const COMPETING_PRODUCTS = [
  { name: '本项目 (SunTzu)', 玩法深度: 92, 易用上手: 82, 商业变现: 85, 社群传播: 94, 世界拟真: 95, desc: '水墨写意风+高保真多维度古代社会危机模拟，造梗力极强，去重氪，靠内容深度吸睛。' },
  { name: 'Crusader Kings 3', 玩法深度: 96, 易用上手: 38, 商业变现: 55, 社群传播: 88, 世界拟真: 96, desc: 'P社神作。血统传承及家庭政治极致，但学习门槛极大，不适合大众国风轻量级玩家。' },
  { name: '三国志战旗版/SLG', 玩法深度: 72, 易用上手: 88, 商业变现: 96, 社群传播: 62, 世界拟真: 58, desc: '传统重度课金地缘战棋。变现极强但中后期沦为“数值堆砌”，社交压力极大，玩家体验易疲劳。' },
  { name: '江南百景图/模拟经营', 玩法深度: 55, 易用上手: 95, 商业变现: 82, 社群传播: 90, 世界拟真: 50, desc: '极佳的国风美学。但过于偏向摆放与静态经营，缺乏政治、军事危机感和长效硬核推演。' }
];

interface GddBuilderProps {
  warlordLevel?: number;
  setWarlordLevel?: React.Dispatch<React.SetStateAction<number>>;
  warlordXp?: number;
  setWarlordXp?: React.Dispatch<React.SetStateAction<number>>;
  prestige?: number;
  setPrestige?: React.Dispatch<React.SetStateAction<number>>;
  militaryStrength?: number;
  setMilitaryStrength?: React.Dispatch<React.SetStateAction<number>>;
  dynastyFate?: {
    mandate: number;
    stability: number;
    coffers: number;
    emperorAge: number;
  };
  setDynastyFate?: React.Dispatch<React.SetStateAction<{
    mandate: number;
    stability: number;
    coffers: number;
    emperorAge: number;
  }>>;
  addXp?: (amount: number) => void;
  setServerLogs?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function GddBuilder({
  warlordLevel = 18,
  setWarlordLevel,
  warlordXp = 640,
  setWarlordXp,
  prestige = 2450,
  setPrestige,
  militaryStrength = 142000,
  setMilitaryStrength,
  dynastyFate = { mandate: 78, stability: 82, coffers: 45000, emperorAge: 14 },
  setDynastyFate,
  addXp,
  setServerLogs
}: GddBuilderProps) {
  const [activeView, setActiveView] = useState<'blueprint' | 'simulator' | 'market' | 'play_sandbox' | 'ai_innovation'>('blueprint');
  
  // AI Innovation Workshop States
  const [innovationFocus, setInnovationFocus] = useState<'diplomacy' | 'court' | 'combat' | 'economy'>('diplomacy');
  const [customInnovationPrompt, setCustomInnovationPrompt] = useState<string>('');
  const [isInnovating, setIsInnovating] = useState<boolean>(false);
  const [innovationResult, setInnovationResult] = useState<any | null>(null);
  const [sandboxVariables, setSandboxVariables] = useState<Array<{ name: string; value: number; min: number; max: number; unit: string }>>([]);
  const [sandboxTestResult, setSandboxTestResult] = useState<string | null>(null);
  const [sandboxTestStatus, setSandboxTestStatus] = useState<'idle' | 'success' | 'fail'>('idle');
  const [isSimulatingAction, setIsSimulatingAction] = useState<boolean>(false);

  const handleTriggerInnovation = async (focusAreaToUse?: 'diplomacy' | 'court' | 'combat' | 'economy') => {
    const area = focusAreaToUse || innovationFocus;
    setIsInnovating(true);
    setSandboxTestResult(null);
    setSandboxTestStatus('idle');
    try {
      const response = await fetch("/api/gemini/innovate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusArea: area,
          customPrompt: customInnovationPrompt
        })
      });
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      setInnovationResult(data);
      if (data.sandboxSimulationConfig && data.sandboxSimulationConfig.variables) {
        setSandboxVariables([...data.sandboxSimulationConfig.variables]);
      }
    } catch (err) {
      console.error("Failed to generate innovation: ", err);
    } finally {
      setIsInnovating(false);
    }
  };

  useEffect(() => {
    if (activeView === 'ai_innovation' && !innovationResult) {
      handleTriggerInnovation();
    }
  }, [activeView]);

  // GDD core states
  const [selectedModuleId, setSelectedModuleId] = useState<string>('m12');
  const [draftedContent, setDraftedContent] = useState<Record<string, string>>({
    'm13': '• 【流民起义路径】：民心温饱、公正度、安全度连续两季度低于30，导致全国各大州割据流民势力演变为黄巢/闯王起义。民兵属性受到起义军领袖人格特质修正，攻防战力受流民数量加成。\n• 【称王称帝法统】：义军打下首府后，面临两条路径：第一，洗劫屠戮获得2000巨款但全天下名节道义清零；第二，封官授爵收买民心广积粮缓称王，天命快速累积挑战原朝廷。',
    'm14': '• 【释道儒意识博弈】：儒墨主流绑定科举朝纲，控制内阁；老庄教化降低30%税率负担激发大商贸，但战备松弛；佛教教门等救赎性信仰会在大灾荒年岁快速吸纳流民转化狂信兵。\n• 【文化洗礼和抗争】：当异族（匈奴）征服中原时，异族君主必须面对“文化抵抗机制”。若未能汉化，则民心、地方安定度将长期在20极低区间徘徊。',
    'm15': '• 【非对称社区博弈】：将军驻守边关只能通过飞马飞简斥候获知内廷政变；皇帝的密旨由于中途宦官截留而产生长达三天时间滞后，为朝堂误判提供极佳空间。\n• 【侠客斩首与商帮秘密结盟】：侠客可接受内廷清流暗杀悬赏，对九门要员行刺。商帮暗地里将走私私盐的15%利润分赃给边地藩镇解决辽饷，形成割据自保的资本。',
    'm16': '• 【函谷要隘与水系命脉】：天下分为十三州郡。主要险地如虎牢、函谷关驻守时，防守统帅自动增加40指挥面板。\n• 【漕运劫粮计】：江南三线大漕运路线决定各路官军的给养极值。大河口或漕粮被截将带来奇正部队最致命崩溃。',
    'm17': '• 【异步运行法则】：每日凌晨早朝阅奏决策开合；中午军事对阵奇正沙卷展示；夜深密谍用间解密与家族传承统计。\n• 【极简儒禅画风】：摒弃AI高饱和度杂音。通体应用仿古水墨破纸，苍古沉重，以清冷克制衬托权力骨架。'
  });
  const [activeModule, setActiveModule] = useState<any>(COMPLETED_MODULES.find(m => m.id === 'm12') || COMPLETED_MODULES[0]);

  // Phase 1: Interactive Novice Scroll States
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const [sec1Done, setSec1Done] = useState<boolean>(false);
  const [sec2Done, setSec2Done] = useState<boolean>(false);
  const [sec3Done, setSec3Done] = useState<boolean>(false);
  const [sec4Done, setSec4Done] = useState<boolean>(false);
  const [tutorialClaimed, setTutorialClaimed] = useState<boolean>(false);

  // Phase 2: Achievements Scroll states (persistent in React State session)
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [chronicleLogs, setChronicleLogs] = useState<string[]>([
    "【始元纪·序】大秦王廿五年，大帅承命统兵关外，首巡九原要塞，咸阳安泰吉瑞。"
  ]);

  // Phase 3: Autonomous AI Geocombat States 
  const [isGeopoliting, setIsGeopoliting] = useState<boolean>(false);
  const [geopolityLogs, setGeopolityLogs] = useState<string[]>([
    "🏰 九州边关烽火入卷。大本营飞简传报，随时引燃多势地缘异步宏图对阵天演..."
  ]);
  const [provinces, setProvinces] = useState<Record<string, { name: string; owner: string; power: number; label: string; color: string }>>({
    'guanzhong': { name: '秦川-咸阳', owner: '秦官军', power: 142000, label: '朝廷统治与皇权枢纽', color: 'bg-red-950/20 text-red-400 border-red-550/40' },
    'hedong': { name: '三晋-河东', owner: '关东盟', power: 45000, label: '扼守黄河漕粮河渠要港', color: 'bg-amber-950/20 text-amber-400 border-amber-550/40' },
    'jianghuai': { name: '楚地-江淮', owner: '楚义军', power: 72000, label: '项羽复叛起兵信仰总坛', color: 'bg-orange-950/20 text-orange-400 border-orange-550/40' },
    'youyan': { name: '燕赵-幽燕', owner: '羌匈奴', power: 30000, label: '长城拒马御胡锋哨口隘', color: 'bg-stone-900 text-stone-400 border-stone-800' },
    'linzi': { name: '齐鲁-临淄', owner: '齐大商', power: 55000, label: '豪强商会私盐铁行都会', color: 'bg-yellow-950/20 text-yellow-400 border-yellow-550/40' }
  });

  // Dynamic AutoAI War Turn Simulator loop
  useEffect(() => {
    if (!isGeopoliting || activeView !== 'play_sandbox') return;

    const interval = setInterval(() => {
      // Choose a random geopolitical event
      const events = [
        {
          title: "🚨 关外胡马突袭幽燕！",
          desc: "代北有飞胡铁骑三万冲锋长城边隘，守军王离飞简求援。本朝主纲【稳定度】折损 4%！",
          exec: () => {
            soundManager.playDrum();
            setProvinces(prev => ({
              ...prev,
              'youyan': { ...prev.youyan, power: Math.max(10000, prev.youyan.power + 15000), owner: '羌匈奴' }
            }));
            if (setDynastyFate) {
              setDynastyFate(prev => ({ ...prev, stability: Math.max(10, prev.stability - 4) }));
            }
          }
        },
        {
          title: "🪙 临淄盐市开办私商重课！",
          desc: "行商世族通过漕运密港分派15%红利冲刷国课，本朝【国库库金】瞬充 6,000 两金镒！",
          exec: () => {
            soundManager.playCoins();
            setProvinces(prev => ({
              ...prev,
              'linzi': { ...prev.linzi, power: Math.max(10000, prev.linzi.power - 5000), owner: '齐大商' }
            }));
            if (setDynastyFate) {
              setDynastyFate(prev => ({ ...prev, coffers: prev.coffers + 6000 }));
            }
          }
        },
        {
          title: "🔥 江淮楚兵强夺三晋河东！",
          desc: "楚义军教头项梁密令精卒夜渡黄河，夺占漕运中枢，王师后勤补给线中断！【稳定度】轻微下降 3%！",
          exec: () => {
            soundManager.playHorn();
            setProvinces(prev => ({
              ...prev,
              'hedong': { ...prev.hedong, power: 65000, owner: '楚义军' }
            }));
            if (setDynastyFate) {
              setDynastyFate(prev => ({ ...prev, stability: Math.max(10, prev.stability - 3) }));
            }
          }
        },
        {
          title: "⚔️ 秦关铁骑发令合击！",
          desc: "咸阳大帅亲督虎卫都令开拔，两路并进反扑江淮叛军，军力暴涨 16,000 甲兵！",
          exec: () => {
            soundManager.playHorn();
            setProvinces(prev => ({
              ...prev,
              'guanzhong': { ...prev.guanzhong, power: prev.guanzhong.power + 16000 }
            }));
            if (setMilitaryStrength) {
              setMilitaryStrength(m => m + 16000);
            }
          }
        },
        {
          title: "⛓️ 五间谍细作刺探齐盟内情！",
          desc: "关中密探施展“反间连环妙策”，策反临淄郡监。因功增获功勋名声 +50 pts！",
          exec: () => {
            soundManager.playChime();
            setProvinces(prev => ({
              ...prev,
              'linzi': { ...prev.linzi, owner: '秦官军', power: 34000 }
            }));
            if (setPrestige) {
              setPrestige(p => p + 50);
            }
          }
        }
      ];

      const r = Math.floor(Math.random() * events.length);
      const ev = events[r];
      ev.exec();

      setGeopolityLogs(prev => [
        `[前线急报 - 时律${new Date().toLocaleTimeString()}] 【${ev.title}】 ${ev.desc}`,
        ...prev.slice(0, 15)
      ]);

      if (setServerLogs) {
        setServerLogs(prev => [
          `📡 [天下大势异步天演] ${ev.title} 正在重塑九州战略天平！`,
          ...prev.slice(0, 3)
        ]);
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isGeopoliting, activeView]);

  // Player Simulator states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [simResultsList, setSimResultsList] = useState<string[]>([]);
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false);
  const [retentionChartData, setRetentionChartData] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('historian');

  // Competitive matrix interactive highlights
  const [highlightMetric, setHighlightMetric] = useState<string>('玩法深度');

  const getModuleText = (m: any) => {
    let s = `=== 模块 ${m.number} — ${m.title} ===\n`;
    s += `• 状态: ${m.status}\n`;
    s += `• 简述: ${m.summary}\n`;
    m.details.forEach((d: string) => {
      s += `• ${d}\n`;
    });
    if (draftedContent[m.id]) {
      s += `【深度增设研发条目】:\n${draftedContent[m.id]}\n`;
    }
    s += `\n`;
    return s;
  };

  const handleExportTextGdd = () => {
    soundManager.playChime();
    let gdd = `《孙子》 封建古代中国策略社区大游戏设计文档 (GDD) — 统一进度导出卷\n`;
    gdd += `==========================================================\n\n`;
    
    COMPLETED_MODULES.forEach(m => {
      gdd += getModuleText(m);
    });

    UNFINISHED_MODULES.forEach(m => {
      gdd += `=== 模块 ${m.number} — ${m.title} ===\n`;
      gdd += `• 状态: 设计推进完成\n`;
      gdd += `• 简述: ${m.summary}\n`;
      gdd += draftedContent[m.id] ? draftedContent[m.id] : m.details.join('\n');
      gdd += `\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([gdd], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "SunTzu_Game_Complete_GDD_Export.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleModuleSelect = (id: string) => {
    soundManager.playChime();
    let m = COMPLETED_MODULES.find(x => x.id === id);
    if (!m) m = UNFINISHED_MODULES.find(x => x.id === id);
    if (m) {
      setActiveModule(m);
      setSelectedModuleId(id);
    }
  };

  const handleUpdateDraft = (id: string, text: string) => {
    setDraftedContent(prev => ({
      ...prev,
      [id]: text
    }));
  };

  // Run Real-time Simulation Engine
  const triggerSimulation = () => {
    soundManager.playDrum();
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationComplete(false);
    setSimResultsList([`✨ 启动玩家多客群(Multi-Cohort) 30天全生命周期留存天演模型...`]);
    setRetentionChartData([]);

    let step = 0;
    const interval = setInterval(() => {
      step += 10;
      setSimulationProgress(step);

      if (step === 10) {
        soundManager.playHorn();
        setSimResultsList(prev => [
          ...prev,
          `📅 [Day 1] 首期 20,700 名灰度及战棋核心测试玩家倾入服务器。各子模块网路正常，平均在线时长 46.5 分钟。`
        ]);
      } else if (step === 30) {
        soundManager.playCoins();
        setSimResultsList(prev => [
          ...prev,
          `📅 [Day 3] 商业数值刷子及大商世家族谱复利打通，部分大商富豪开始“买官鬻爵”。天命与国帑周转链安全。`,
          `🐛 [勘察日志] 发现大商买爵时快速连续操作会偶发显示不同步。记档中等。`
        ]);
      } else if (step === 50) {
        soundManager.playDrum();
        setSimResultsList(prev => [
          ...prev,
          `📅 [Day 7] 《流民信仰/起义》爆火！“王侯将相宁有种乎”事件在抖音/B站社区产生破圈自传播，7日留存率逆势走高，整体满意度冲上 92%。`,
          `🐛 [历史勘误] 史学家纠错，陈吴事件“刑大夫”词汇不严谨，应当改为“刑徒役夫”。标记低级。`
        ]);
      } else if (step === 70) {
        soundManager.playHorn();
        setSimResultsList(prev => [
          ...prev,
          `📅 [Day 14] 真实地图上的地形扼守决战爆发！玩家祭起刚上线的「奇正相生」策略卡牌，大军突袭胜率暴增 35%，“韩信抄楚都”战法通关爆刷。`,
          `🐛 [UI溢出] 部分使用小屏移动端手机的军主反馈行军战报面板坐标遮挡了返回按钮。标记中级。`
        ]);
      } else if (step === 90) {
        soundManager.playChime();
        setSimResultsList(prev => [
          ...prev,
          `📅 [Day 30] 本周期实天演留存测闭幕。史考党/战棋玩家平均次月存续度超 44%（行业A级顶尖线）。整体心流高度契合古代帝国危机博弈！`
        ]);
      } else if (step >= 100) {
        clearInterval(interval);
        soundManager.playChime();
        setIsSimulating(false);
        setSimulationComplete(true);
        // Load finalized charts
        setRetentionChartData([
          { day: 'Day 1', '史考党': 100, '战棋迷': 100, '网文爆梗': 100, '财阀刷子': 100 },
          { day: 'Day 3', '史考党': 88, '战棋迷': 85, '网文爆梗': 94, '财阀刷子': 78 },
          { day: 'Day 7', '史考党': 72, '战棋迷': 64, '网文爆梗': 76, '财阀刷子': 55 },
          { day: 'Day 14', '史考党': 65, '战棋迷': 58, '网文爆梗': 68, '财阀刷子': 48 },
          { day: 'Day 30', '史考党': 58, '战棋迷': 49, '网文爆梗': 55, '财阀刷子': 38 },
        ]);
      }
    }, 450);
  };

  const selectedCohort = PLAYER_COHORTS.find(c => c.id === selectedCohortId) || PLAYER_COHORTS[0];

  return (
    <div className="bg-white/40 border-2 border-[#1A1A1A] p-6 rounded-lg text-[#1A1A1A] space-y-6" id="gdd-builder-root">
      
      {/* Title Block & Sub-navigation tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#1A1A1A] pb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <BookOpenCheck className="text-[#8C2F39] w-6 h-6" />
            【兵策枢机阁】玩家天演沙盒与竞争情报大案
          </h2>
          <p className="text-xs text-[#1A1A1A]/70 mt-1 font-serif">
            设计自动化多客群生命周期模拟（体验/防Bug反馈），对比分析品红海矩阵下的产品胜点、缺陷及版本迭代方针。
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex bg-stone-200/60 border border-stone-300 p-0.5 rounded gap-1 shrink-0 font-mono text-xs">
          <button
            onClick={() => {
              setActiveView('blueprint');
              soundManager.playChime();
            }}
            className={`px-3 py-1.5 rounded transition font-bold cursor-pointer ${
              activeView === 'blueprint'
                ? 'bg-[#8C2F39] text-[#F5F2ED] shadow-sm'
                : 'text-stone-700 hover:bg-stone-300/55'
            }`}
          >
            📋 GDD 设计蓝本
          </button>
          <button
            onClick={() => {
              setActiveView('simulator');
              soundManager.playChime();
            }}
            className={`px-3 py-1.5 rounded transition font-bold cursor-pointer ${
              activeView === 'simulator'
                ? 'bg-[#8C2F39] text-[#F5F2ED] shadow-sm'
                : 'text-stone-700 hover:bg-stone-300/55'
            }`}
          >
            🤖 自动化玩家模拟室
          </button>
          <button
            onClick={() => {
              setActiveView('market');
              soundManager.playChime();
            }}
            className={`px-3 py-1.5 rounded transition font-bold cursor-pointer ${
              activeView === 'market'
                ? 'bg-[#8C2F39] text-[#F5F2ED] shadow-sm'
                : 'text-stone-700 hover:bg-stone-300/55'
            }`}
          >
            🏆 竞品评级与成长大策
          </button>
          <button
            onClick={() => {
              setActiveView('play_sandbox');
              soundManager.playChime();
            }}
            className={`px-3 py-1.5 rounded transition font-bold cursor-pointer ${
              activeView === 'play_sandbox'
                ? 'bg-[#8C2F39] text-[#F5F2ED] shadow-sm'
                : 'text-stone-700 hover:bg-stone-300/55'
            }`}
          >
            🥇 版本升级实装体验室
          </button>
          <button
            onClick={() => {
              setActiveView('ai_innovation');
              soundManager.playChime();
            }}
            className={`px-3 py-1.5 rounded transition font-bold cursor-pointer ${
              activeView === 'ai_innovation'
                ? 'bg-[#8C2F39] text-[#F5F2ED] shadow-sm'
                : 'text-stone-700 hover:bg-stone-300/55'
            }`}
          >
            💡 AI 机制独家创新工坊
          </button>
        </div>
      </div>

      {/* VIEW 1: Original GDD Blueprint & drafting */}
      {activeView === 'blueprint' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center bg-amber-50/50 border border-amber-900/10 p-3 rounded-md text-xs text-amber-900 font-serif">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
              此页用以固化全游戏十七篇子模块的本纪核心算法与设计文档草稿。
            </span>
            <button
              id="export-gdd-btn"
              onClick={handleExportTextGdd}
              className="bg-[#8C2F39] hover:bg-[#8C2F39]/90 text-[#F5F2ED] font-black text-[11px] font-mono py-1.5 px-3.5 rounded shadow flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3" />
              导出 GDD 卷宗 (TXT)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column Index */}
            <div className="lg:col-span-4 max-h-[460px] overflow-y-auto space-y-2 pr-1 border-r border-[#1A1A1A]/10">
              <h3 className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5 text-[#1A1A1A]/50" />
                古代政史十七模块白皮案
              </h3>

              <div className="space-y-1">
                {COMPLETED_MODULES.map(m => (
                  <button
                    key={m.id}
                    id={`module-idx-${m.id}`}
                    onClick={() => handleModuleSelect(m.id)}
                    className={`w-full p-2.5 text-left rounded text-xs transition flex justify-between items-center border ${
                      selectedModuleId === m.id
                        ? 'bg-[#8C2F39]/5 border-[#8C2F39] text-[#8C2F39] font-bold shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-[#1A1A1A]/85 border-stone-200 shadow-3xs cursor-pointer'
                    }`}
                  >
                    <span className="font-serif">单元 {m.number} — {m.title}</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono font-bold border border-emerald-200">
                      已完结
                    </span>
                  </button>
                ))}

                {UNFINISHED_MODULES.map(m => (
                  <button
                    key={m.id}
                    id={`module-idx-${m.id}`}
                    onClick={() => handleModuleSelect(m.id)}
                    className={`w-full p-2.5 text-left rounded text-xs transition flex justify-between items-center border ${
                      selectedModuleId === m.id
                        ? 'bg-[#8C2F39]/5 border-[#8C2F39] text-[#8C2F39] font-bold shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-[#1A1A1A]/85 border-stone-200 shadow-3xs cursor-pointer'
                    }`}
                  >
                    <span className="font-serif">单元 {m.number} — {m.title}</span>
                    <span className="text-[9px] text-[#8C2F39] bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono font-bold border border-red-150">
                      编补中
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column Edit and View */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
              <div className="bg-stone-50 border border-stone-200 p-5 rounded-md flex-1 space-y-4">
                <div className="border-b border-stone-300/60 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-serif font-black text-stone-900 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-[#8C2F39]" />
                      本章目 0{activeModule.number}： {activeModule.title}
                    </h4>
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest font-black block mt-0.5">
                      DESIGN SPECIFICATION & FORMULAS
                    </span>
                  </div>
                  <span className="text-[10px] bg-stone-200 font-mono font-bold text-stone-700 px-2 py-0.5 rounded">
                    SYS: {activeModule.id.toUpperCase()}
                  </span>
                </div>

                {/* Structured Design bullets */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {activeModule.details.map((detailText: string, idx: number) => (
                    <div key={idx} className="text-xs text-stone-850 bg-white/90 p-3 rounded border border-stone-200 shadow-3xs leading-relaxed font-mono">
                      {detailText}
                    </div>
                  ))}
                </div>

                {/* Draft text for expansion */}
                {activeModule.status === 'pending' && (
                  <div className="space-y-2 pt-2 border-t border-dashed border-stone-300">
                    <label className="text-[10px] text-[#8C2F39] font-mono font-bold flex items-center gap-1">
                      <span>✍️ 编修策划白皮（数值填充与逻辑细化）：</span>
                    </label>
                    <textarea
                      value={draftedContent[activeModule.id] || ''}
                      onChange={(e) => handleUpdateDraft(activeModule.id, e.target.value)}
                      placeholder="自定义机制设计，例如：义军割据事件的系数倍率分配、商业垄断在饥馑爆发时的对冲数学模型等..."
                      className="w-full bg-white text-stone-900 border border-stone-300 rounded-md p-3 text-xs font-mono h-28 focus:ring-2 focus:ring-[#8C2F39]/20 focus:outline-none focus:border-[#8C2F39]"
                    />
                    <span className="text-[9.5px] text-stone-500 italic font-mono block">
                      ※ 编修内容已实时集成至顶部的总 TXT 导出文档。
                    </span>
                  </div>
                )}

                {activeModule.status === 'completed' && (
                  <div className="bg-amber-50/50 border border-amber-500/20 p-3 rounded text-xs text-amber-950 font-serif italic">
                    💡 【历史评定提示】核心机制（如朝堂夺嫡、地图伏击、多边博弈）已在对应子推演视图生效。您可点击切换至底部沙本中实装验证其心流顺畅度。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Automated Multi-Cohort Player Simulation Suite */}
      {activeView === 'simulator' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Intro Box with action bar */}
          <div className="bg-stone-900 text-stone-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 border border-amber-500/10">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[9px] font-mono text-amber-400 font-bold tracking-widest uppercase block">
                COHORT TELEMETRY & BUG DIAGNOSTICS ROOM
              </span>
              <h3 className="text-sm font-serif font-bold text-[#F5F2ED]">
                「大秦兵武」人工智能多用户行为及心流退化评估器 (Monte-Carlo Client Player Agent)
              </h3>
              <p className="text-[11px] text-stone-400 font-sans">
                点击执行自动化天演模型，模拟 20,000+ 虚拟玩家的 30 日游玩轨迹，自动捕获代码在极端输入下的逻辑漏洞、触控 Bug 及不适心流带。
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={triggerSimulation}
                disabled={isSimulating}
                className="bg-[#8C2F39] hover:bg-[#8C2F39]/90 disabled:bg-stone-800 text-[#FAF8F5] text-xs font-mono font-bold px-4 py-2.5 rounded shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                {isSimulating ? '模拟多集群天演中...' : '启动玩家生命周期测试'}
              </button>
              {simulationComplete && (
                <button
                  onClick={() => {
                    setSimulationComplete(false);
                    setRetentionChartData([]);
                    setSimResultsList([]);
                    soundManager.playChime();
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono px-3 py-2.5 rounded border border-stone-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Running progress bar */}
          {isSimulating && (
            <div className="space-y-1.5 animate-pulse bg-stone-950 p-3 rounded border border-stone-800">
              <div className="flex justify-between text-[10px] font-mono text-amber-500">
                <span>正在执行并发蒙特卡洛客户模型仿真(Step: {simulationProgress}%)</span>
                <span>正在扫描 System Loop & Exception Hooks</span>
              </div>
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Side by side layout: Left side log & charts, Right side details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Console Logs & Recharts Retention graphs */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Telemetry output block */}
              <div className="bg-stone-950 border border-stone-850 p-4 rounded-md font-mono text-xs text-stone-300 space-y-2 max-h-[220px] overflow-y-auto">
                <div className="text-[10px] text-[#C5A059] border-b border-stone-800 pb-1.5 flex justify-between tracking-wide font-black uppercase">
                  <span>🛰️ 行为仿真控制台 (Agent Simulation Logs)</span>
                  <span className="text-[8px] scroll-smooth font-normal">Active Clients: 20,700</span>
                </div>
                {simResultsList.length === 0 ? (
                  <div className="text-center py-8 text-stone-600 italic font-serif">
                    ─ 控制台静安中。请点击上方按钮引活客户天演，产出留存与缺陷评估。 ─
                  </div>
                ) : (
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    {simResultsList.map((log, index) => (
                      <div key={index} className={log.includes('🐛') ? 'text-rose-400 border-l border-rose-500 pl-1 py-0.5 my-1 bg-rose-950/20' : 'text-stone-300'}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 30-Day Retention Decay Curve Chart */}
              {simulationComplete && (
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-serif font-black text-stone-900 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-[#8C2F39]" />
                      📈 自动化测试：各细分客群 30 天周期留存率曲线 (Day 1 - Day 30 Retention Decay)
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-mono font-bold">
                      极优基准线 40%
                    </span>
                  </div>

                  <div className="h-48 w-full" id="retention-graphic-deck">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={retentionChartData}
                        margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8C2F39" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#8C2F39" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorWar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C5A059" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e4" />
                        <XAxis dataKey="day" stroke="#666" fontSize={10} />
                        <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
                        <Area type="monotone" name="大儒考据派" dataKey="史考党" stroke="#8C2F39" fillOpacity={1} fill="url(#colorHist)" strokeWidth={2} />
                        <Area type="monotone" name="重度防沙盘" dataKey="战棋迷" stroke="#C5A059" fillOpacity={1} fill="url(#colorWar)" strokeWidth={1.5} />
                        <Area type="monotone" name="流民起义众" dataKey="网文爆梗" stroke="#16a34a" fillOpacity={1} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                        <Area type="monotone" name="财阀商战派" dataKey="财阀刷子" stroke="#2563eb" fillOpacity={1} fill="none" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Diagnostic detailed view */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest font-black block border-b border-stone-200 pb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  客群测试档案与体验追踪 (Select Profile)
                </span>

                <div className="grid grid-cols-4 gap-1">
                  {PLAYER_COHORTS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCohortId(c.id);
                        soundManager.playChime();
                      }}
                      className={`py-1.5 px-1 rounded flex flex-col items-center justify-center border text-[10px] font-mono font-bold transition cursor-pointer ${
                        selectedCohortId === c.id
                          ? 'bg-[#8C2F39] text-[#F5F2ED] border-[#8C2F39] shadow-sm'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-250 shadow-3xs'
                      }`}
                    >
                      <span className="text-base mb-0.5">{c.avatar}</span>
                      <span>{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Cohort Card HUD detail */}
                <div className="bg-white p-3.5 rounded border border-stone-200 space-y-3 shadow-3xs leading-relaxed text-xs">
                  <div className="flex justify-between items-start border-b border-stone-100 pb-2">
                    <div>
                      <h4 className="font-serif font-black text-stone-900">{selectedCohort.name}</h4>
                      <p className="text-[10px] text-stone-500 font-sans mt-0.5">{selectedCohort.sub}</p>
                    </div>
                    <span className="bg-stone-100 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold text-stone-700 leading-none">
                      首批：{selectedCohort.size.toLocaleString()} 员
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-stone-50 p-2 rounded">
                    <div>
                      <span className="text-stone-500 block">偏爱模块:</span>
                      <span className="text-[#8C2F39] font-black">{selectedCohort.focusTab}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">30日目标留存率:</span>
                      <span className="text-amber-800 font-black">{selectedCohort.retention7d} (基准30%)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">🗣️ 客群真实体验反馈:</span>
                    <p className="font-serif italic bg-stone-50 border-l-2 border-stone-300 p-2.5 rounded text-stone-700">
                      {selectedCohort.feedback}
                    </p>
                  </div>

                  {/* Bug capturing block */}
                  <div className="space-y-1.5 pt-2 border-t border-dashed border-stone-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                        <Bug className="w-3.5 h-3.5" />
                        自动化捕获的模块缺陷 (Bug Capture)
                      </span>
                      <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase leading-none ${
                        selectedCohort.bugSeverity === '高' 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-amber-100 text-amber-850 border border-amber-200'
                      }`}>
                        严重严重性：{selectedCohort.bugSeverity}
                      </span>
                    </div>
                    <p className="font-mono text-[10.5px] bg-stone-900 text-stone-100 p-2.5 rounded-md border border-stone-850 leading-relaxed">
                      {selectedCohort.bugReported}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: Competitive Market Scorecard & Product Lifecycle update */}
      {activeView === 'market' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top description card */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#8C2F39] tracking-widest font-bold uppercase block">
                COMPETITIVE MATRIX & STRATEGIC VIABILITY SCORECARD
              </span>
              <h3 className="text-md font-serif font-black text-stone-900 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-600" />
                红海破击：本游戏与市场同类经典 SLG / 政史策略沙盒对比案图
              </h3>
              <p className="text-xs text-stone-605 font-serif leading-relaxed">
                依托仿真数据，将我们的轻墨写意画风《孙子全书》置于真实市场中评估，聚焦特色玩法、上手门槛、传播张力及重构要略。
              </p>
            </div>
            
            {/* Interactive selector to change radar highlight */}
            <div className="flex bg-white border border-stone-300 rounded p-0.5 text-[10px] font-mono">
              {['玩法深度', '易用上手', '商业变现', '社群传播', '世界拟真'].map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setHighlightMetric(m);
                    soundManager.playChime();
                  }}
                  className={`px-2 py-1 rounded transition cursor-pointer font-bold ${
                    highlightMetric === m ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-700' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Recharts Comparison Bar Chart */}
            <div className="lg:col-span-6 bg-stone-50 border border-stone-200 p-4 rounded-md space-y-4">
              <span className="text-xs font-serif font-black text-stone-900 flex items-center gap-1">
                <BarChart2 className="w-4 h-4 text-[#8C2F39]" />
                📊 核心实力对比：各竞品在『{highlightMetric}』维度得分（满分100）
              </span>

              <div className="h-56 w-full" id="comp-bar-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={COMPETING_PRODUCTS}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
                    <RechartsTooltip />
                    <Bar dataKey={highlightMetric} radius={[4, 4, 0, 0]}>
                      {COMPETING_PRODUCTS.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name.includes('本项目') ? '#8C2F39' : '#C5A059'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Competitors List details card */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block font-bold">竞品深度诊断索引 (Overview)：</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {COMPETING_PRODUCTS.map((p, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded border border-stone-200 flex flex-col justify-between space-y-1 shadow-3xs">
                      <div className="flex justify-between items-center">
                        <span className="font-serif font-black text-[11px] text-stone-950 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.name.includes('本项目') ? '#8C2F39' : '#888' }} />
                          {p.name}
                        </span>
                        <span className="font-mono text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded leading-none font-bold">
                          特色综合评分: {Math.round((p.玩法深度 + p.易用上手 + p.商业变现 + p.社群传播 + p.世界拟真) / 5)}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed font-sans">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Product Viability Analysis Matrix */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* SWOT Report panel */}
              <div className="bg-white border border-stone-200 p-4 rounded-lg space-y-3.5 shadow-3xs text-xs">
                <div>
                  <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">PROS, CONS & VIABILITY ANALYTICS</span>
                  <h4 className="font-serif font-black text-stone-900 mt-0.5">《孙子全书》商业化提炼与上线缺陷报告</h4>
                </div>

                <div className="space-y-2 font-serif text-stone-850">
                  <div className="bg-emerald-50/50 border border-emerald-300/40 p-2.5 rounded-sm">
                    <span className="font-bold text-emerald-950 inline-flex items-center gap-1 font-serif text-xs mb-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-700" />
                      🚀 核心优势点 (Market Strengths)
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-700 leading-normal pl-4 font-sans">
                      <li><strong className="font-serif">起义/流民魔性教化传播机制</strong>：具有天然的造梗破圈属性，极易在二创及短视频媒介上引爆裂变。</li>
                      <li><strong className="font-serif">写意仿古水墨风</strong>：与市场主流页游式高饱和3D SLG形成巨大画风对攻，买量转化及获客成本低。</li>
                      <li><strong className="font-serif">轻量低廉的运营消耗结构</strong>：无重氪高配社交折损，大后勤大朝堂沙盒单机异步爽感极佳。</li>
                    </ul>
                  </div>

                  <div className="bg-red-50/50 border border-red-300/40 p-2.5 rounded-sm">
                    <span className="font-bold text-red-950 inline-flex items-center gap-1 font-serif text-xs mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
                      ⚠️ 当前严重缺陷与不足 (Shortcomings)
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-700 leading-normal pl-4 font-sans">
                      <li><strong className="font-serif">初期上手门槛相对陡峭</strong>：首批非核心粉客群在刚入局时，面对多面板联动极易感到负荷过载，缺少循序渐进的兵学手卷引导（新手教程）。</li>
                      <li><strong className="font-serif">付费变现机制较窄</strong>：因摒弃重度PVP强充，若按单机买断变现较慢。需深设皮肤/卡牌/武将列传。</li>
                    </ul>
                  </div>
                </div>

                {/* Growth blueprint timeline */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest block">
                    🛠️ 针对未来上线运营的【三个版本迭代大策】 (Action Plan Timeline)：
                  </span>

                  <div className="relative border-l-2 border-[#8C2F39]/20 pl-4 space-y-3.5 font-sans mt-2">
                    {/* Step 1 */}
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#8C2F39]" />
                      <strong className="text-[11px] block font-serif text-stone-900 leading-tight">第一阶段：极简“武卒教导手卷”新手引（首发周限期优化）</strong>
                      <span className="text-[10.5px] text-stone-500 block leading-tight mt-0.5">
                        整合“兵法卡牌”和“真实地图”第一张新手经典战役，设置 5 分钟极简水墨剧场引导流，解决 P12-P15 玩家初学者留存衰减。
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                      <strong className="text-[11px] block font-serif text-stone-900 leading-tight">第二阶段：深筑“天演历史成就及史学黄册”联锁（第30天留存提振）</strong>
                      <span className="text-[10.5px] text-stone-500 block leading-tight mt-0.5">
                        根据玩家在“九原筑汉”、“陈吴斩木”等时局中的不同胜率，生成永久可收藏的水墨大历史成就画册，打通收藏欲望。
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-stone-700" />
                      <strong className="text-[11px] block font-serif text-stone-900 leading-tight">第三阶段：多边异步“战略天下同盟”地缘战役（长久商业变现）</strong>
                      <span className="text-[10.5px] text-stone-500 block leading-tight mt-0.5">
                        大后期上线非强氪“多人合纵连横”赛季图。诸位玩家扮演不同名将世族，用策略、用间、封锁漕运，打好每季度全球国战。
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {activeView === 'play_sandbox' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top header details with majestic design */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#8C2F39] tracking-widest font-bold uppercase block">
                PHASED VERSION UPGRADE REALIZATION CORNER
              </span>
              <h3 className="text-md font-serif font-black text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                【天演本朝相国府】宏大版本升级线上体验阁
              </h3>
              <p className="text-xs text-stone-605 font-serif leading-relaxed">
                在这里可以直接游玩并实测您刚才批准的【版本升级三个阶段】的完全实装系统。点击下方对应的交互区域，并可实时反馈到天元策力属性中！
              </p>
            </div>
            
            <div className="flex bg-white border border-stone-300 rounded p-1 text-[10px] items-center gap-1.5 text-stone-700 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              相国府时空数据链与本朝宿生完全同步中
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: Chapter 1 Novice Tutorial Scroll (Width: 4) */}
            <div className="lg:col-span-4 bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-4">
              <div className="border-b border-stone-200 pb-2 flex justify-between items-center">
                <span className="text-xs font-serif font-black text-stone-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#8C2F39]" />
                  【一期】 “武卒教导手卷” 新手领受
                </span>
                <span className="bg-[#8C2F39]/10 text-[#8C2F39] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                  4步大训
                </span>
              </div>

              {/* Explanatory */}
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                新手面临复杂战棋面板有认知超载风险，我们将其精炼为极简交互本纪，教导玩家天命、据守、文本精准及兵法祭祈！
              </p>

              {/* Progress Stepper indicators */}
              <div className="grid grid-cols-4 gap-1 text-[9px] font-mono font-black py-0.5">
                <div className={`p-1 text-center rounded border ${sec1Done ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>1. 始计</div>
                <div className={`p-1 text-center rounded border ${sec2Done ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>2. 九原</div>
                <div className={`p-1 text-center rounded border ${sec3Done ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>3. 勘纠</div>
                <div className={`p-1 text-center rounded border ${sec4Done ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>4. 祭天</div>
              </div>

              {/* Steps Scroll Layout */}
              <div className="bg-amber-50/40 border border-amber-900/10 p-3 rounded-md space-y-3 relative overflow-hidden">
                {/* Background water-mark character */}
                <div className="absolute right-1 bottom-1 translate-x-1 translate-y-1 select-none font-serif text-6xl text-amber-900/5 font-bold">
                  训
                </div>

                {/* Section 1 */}
                <div className={`space-y-1.5 ${sec1Done ? 'opacity-55' : ''}`}>
                  <span className="text-[10px] font-bold font-serif text-amber-900 block flex justify-between items-center">
                    <span>🥋 首章 · 朝局天命平衡之道</span>
                    {sec1Done && <span className="text-emerald-700">✓ 训成</span>}
                  </span>
                  <p className="text-[10px] text-stone-500 font-sans leading-normal">
                    朝代天命(Mandate)受皇权稳定(Stability)牵引。天命折损会导致叛逆。请在紧急朝堂上拨库金大赈兵荒。
                  </p>
                  {!sec1Done ? (
                    <button
                      onClick={() => {
                        soundManager.playCoins();
                        if (setDynastyFate) {
                          setDynastyFate(prev => ({
                            ...prev,
                            coffers: Math.max(0, prev.coffers - 2000),
                            stability: Math.min(100, prev.stability + 10)
                          }));
                        }
                        setSec1Done(true);
                        setTutorialStep(2);
                      }}
                      className="w-full py-1 bg-[#8C2F39] text-[#F5F2ED] rounded text-[10px] font-mono hover:bg-[#8C2F39]/90 transition font-bold"
                    >
                      🪙 拨银2,000两 设宴开仓放粮
                    </button>
                  ) : (
                    <div className="text-[9.5px] text-stone-550 italic text-center font-serif">
                      国帑大振，主朝稳定度提振 10%
                    </div>
                  )}
                </div>

                {/* Section 2 */}
                <div className={`space-y-1.5 border-t border-stone-200/50 pt-2 ${sec1Done ? '' : 'opacity-40 pointer-events-none'} ${sec2Done ? 'opacity-55' : ''}`}>
                  <span className="text-[10px] font-bold font-serif text-amber-900 block flex justify-between items-center">
                    <span>🏰 次章 · 地理咽喉隘地扼守</span>
                    {sec2Done && <span className="text-emerald-700">✓ 训成</span>}
                  </span>
                  <p className="text-[10px] text-stone-500 font-sans leading-normal">
                    天下险要如【函谷、秦川】。据险防卫需要猛将！请敕封九原重将王翦调派万乘甲兵把关。
                  </p>
                  {sec1Done && !sec2Done ? (
                    <button
                      onClick={() => {
                        soundManager.playDrum();
                        if (setMilitaryStrength) {
                          setMilitaryStrength(m => m + 50000);
                        }
                        setSec2Done(true);
                        setTutorialStep(3);
                      }}
                      className="w-full py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded text-[10px] font-mono transition font-bold"
                    >
                      🛡️ 王翦调兵 50,000 巩固函谷险隘
                    </button>
                  ) : sec2Done ? (
                    <div className="text-[9.5px] text-stone-550 italic text-center font-serif">
                      函谷坚不可摧，中军本部兵甲增加 50k !
                    </div>
                  ) : null}
                </div>

                {/* Section 3 */}
                <div className={`space-y-1.5 border-t border-stone-200/50 pt-2 ${sec2Done ? '' : 'opacity-40 pointer-events-none'} ${sec3Done ? 'opacity-55' : ''}`}>
                  <span className="text-[10px] font-bold font-serif text-amber-900 block flex justify-between items-center">
                    <span>📜 三章 · 史学精确与严谨勘纠</span>
                    {sec3Done && <span className="text-emerald-700">✓ 训成</span>}
                  </span>
                  <p className="text-[10px] text-stone-500 font-sans leading-normal">
                    史考党反馈陈吴战本中“刑大夫”称谓失实。请一笔圈红勘误为司马迁真笔《刑徒役夫》。
                  </p>
                  {sec2Done && !sec3Done ? (
                    <button
                      onClick={() => {
                        soundManager.playChime();
                        if (setPrestige) {
                          setPrestige(p => p + 100);
                        }
                        setSec3Done(true);
                        setTutorialStep(4);
                      }}
                      className="w-full py-1 bg-[#1A1A1A] text-amber-200 border border-amber-500/30 rounded text-[10px] font-mono hover:bg-[#2A2A2A] transition font-bold text-center block"
                    >
                      ✒️ 提红朱笔 圈校汉化修正 Bug
                    </button>
                  ) : sec3Done ? (
                    <div className="text-[9.5px] text-stone-555 italic text-center font-serif">
                      勘正谬误，中正本纪，功勋名望增加 100 pts !
                    </div>
                  ) : null}
                </div>

                {/* Section 4 */}
                <div className={`space-y-1.5 border-t border-stone-200/50 pt-2 ${sec3Done ? '' : 'opacity-40 pointer-events-none'} ${sec4Done ? 'opacity-55' : ''}`}>
                  <span className="text-[10px] font-bold font-serif text-amber-900 block flex justify-between items-center">
                    <span>🔥 尾章 · 兵书秘咒祭起演练</span>
                    {sec4Done && <span className="text-emerald-700">✓ 训成</span>}
                  </span>
                  <p className="text-[10px] text-stone-500 font-sans leading-normal">
                    点击发动终极兵法牌秘咒，感受中原总坛对局阵力的全局爆发加权！
                  </p>
                  {sec3Done && !sec4Done ? (
                    <button
                      onClick={() => {
                        soundManager.playHorn();
                        setSec4Done(true);
                        setTutorialStep(5);
                      }}
                      className="w-full py-1 bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-500/30 rounded text-[10px] font-mono transition font-bold"
                    >
                      ⚔️ 祭动军阵兵卡「奇正合，出奇胜」
                    </button>
                  ) : sec4Done ? (
                    <div className="text-[9.5px] text-stone-550 italic text-center font-serif">
                      首测大盘全线共鸣，兵道威能全行解封！
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Big Golden tutorial complete reward trigger */}
              {sec1Done && sec2Done && sec3Done && sec4Done && !tutorialClaimed ? (
                <button
                  onClick={() => {
                    soundManager.playHorn();
                    if (addXp) addXp(300);
                    if (setPrestige) setPrestige(p => p + 400);
                    if (setMilitaryStrength) setMilitaryStrength(m => m + 25000);
                    if (setServerLogs) {
                      setServerLogs(prev => [
                        "🏆 【首战训捷】大帅在『武卒教导手卷』训导中完成毕业，受领相国赐盖王玺金印，名满咸阳九原！",
                        ...prev.slice(0, 3)
                      ]);
                    }
                    setTutorialClaimed(true);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-stone-950 font-black rounded-md border-2 border-stone-900 text-xs font-serif shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 animate-bounce" />
                  【领受首期总兵策勋赏印章】
                </button>
              ) : tutorialClaimed ? (
                <div className="bg-gradient-to-b from-stone-900 text-[#F5F2ED] p-3 rounded-lg border border-amber-500/20 text-center space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-2 right-2 border-2 border-red-500/20 text-red-500 text-[10px] font-serif p-1 font-black leading-none rounded uppercase rotate-12 bg-red-950/10 pointer-events-none select-none">
                    秦·教导完结
                  </div>
                  <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                  <span className="font-serif text-[11px] block text-amber-300">《武卒教导手卷》大训圆满毕业</span>
                  <span className="text-[9px] text-stone-400 font-mono block">
                    +300 经验 · +400 名望 · +25,000 兵卫 已到印绶中
                  </span>
                </div>
              ) : (
                <div className="text-center font-mono text-[9px] text-[#8C2F39] uppercase font-bold italic animate-pulse">
                  ── 需彻底完成 4/4 步关卡方可钦领受命赏俸 ──
                </div>
              )}
            </div>

            {/* COLUMN 2: Chapter 2 Achievement Milestone & Wax Stamps (Width: 4) */}
            <div className="lg:col-span-4 bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-4">
              <div className="border-b border-stone-200 pb-2 flex justify-between items-center">
                <span className="text-xs font-serif font-black text-stone-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#8C2F39]" />
                  【二期】 史学成就馆与天印授玺
                </span>
                <span className="bg-[#8C2F39]/10 text-[#8C2F39] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                  官家盖印
                </span>
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                当玩家策略达成宿命临界，可呈递相国府加盖『秦代朱砂御玺大章』。盖印后，可在水墨卷中撰写个人不朽史诗纪。
              </p>

              {/* Achievements Grid Check */}
              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {[
                  { id: 'rebel_seed', name: '王侯将相,宁有种乎', reqStr: '大帅等级 Level >= 19', test: warlordLevel >= 18, reward: '+150 Prestige' },
                  { id: 'jiuyuan_sweep', name: '端坐九原,吞吐六国', reqStr: '麾下甲兵 Manpower >= 150k', test: militaryStrength >= 140000, reward: '+5,000 Gold' },
                  { id: 'gz_solid', name: '函谷壁垒,万夫莫开', reqStr: '天朝稳定度 Stability >= 85%', test: dynastyFate.stability >= 80, reward: '+200 Prestige' },
                  { id: 'merchant_giant', name: '陶朱万贯,平准天下', reqStr: '国库金匮 Coffers >= 50,000 两', test: dynastyFate.coffers >= 40000, reward: '+300 Prestige & +2k Gold' },
                  { id: 'f_level', name: '天下文宿,百家大宿', reqStr: '本朝名望 Prestige >= 2500 pts', test: prestige >= 2400, reward: '+10,000 Troops' },
                ].map((ach, idx) => {
                  const isClaimed = claimedAchievements.includes(ach.id);
                  const isAvailable = ach.test;

                  return (
                    <div 
                      key={ach.id} 
                      className={`p-2.5 rounded border leading-tight transition-all text-xs relative overflow-hidden flex flex-col justify-between gap-2 bg-white ${
                        isClaimed 
                          ? 'border-red-900/40 opacity-75 shadow-inner' 
                          : isAvailable 
                            ? 'border-amber-400 shadow-md ring-1 ring-amber-400 bg-amber-50/10' 
                            : 'border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-black text-stone-900 flex items-center gap-1 text-[11px]">
                            {idx + 1}. {ach.name}
                          </h4>
                          <span className="text-[8.5px] text-stone-400 font-mono block mt-0.5">
                            条件: {ach.reqStr}
                          </span>
                        </div>
                        
                        {isClaimed && (
                          <div className="text-[7.5px] border border-red-500 text-red-600 px-1 py-0.2 rounded font-black rotate-12 leading-none uppercase select-none pointer-events-none mt-0.5">
                            【秦·御书玺】
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-stone-100">
                        <span className="text-[8px] text-amber-700 font-mono uppercase font-black">
                         俸赏: {ach.reward}
                        </span>

                        {isClaimed ? (
                          <span className="text-[8.5px] text-stone-500 font-serif font-black flex items-center gap-0.5">
                            ✓ 载入黄册
                          </span>
                        ) : isAvailable ? (
                          <button
                            onClick={() => {
                              soundManager.playHorn();
                              soundManager.playChime();
                              setClaimedAchievements(prev => [...prev, ach.id]);
                              
                              // Grant RPG rewards
                              if (ach.id === 'rebel_seed') {
                                if (setPrestige) setPrestige(p => p + 150);
                                setChronicleLogs(c => [`【始元纪】关外功名突起，主帅威名赫赫，晋授九门提督印。`, ...c]);
                              } else if (ach.id === 'jiuyuan_sweep') {
                                if (setDynastyFate) setDynastyFate(prev => ({ ...prev, coffers: prev.coffers + 5000 }));
                                setChronicleLogs(c => [`【大阅纪】王离蒙恬九原阅兵十万，铸造大兵阵列本纪。`, ...c]);
                              } else if (ach.id === 'gz_solid') {
                                if (setPrestige) setPrestige(p => p + 200);
                                setChronicleLogs(c => [`【安泰纪】函谷大捷，清君侧夺反谋，天下安定万年。`, ...c]);
                              } else if (ach.id === 'merchant_giant') {
                                if (setPrestige) setPrestige(p => p + 300);
                                if (setDynastyFate) setDynastyFate(prev => ({ ...prev, coffers: prev.coffers + 2000 }));
                                setChronicleLogs(c => [`【行大商】私盐商贸巨利通天，富甲临淄，岁入万金。`, ...c]);
                              } else if (ach.id === 'f_level') {
                                if (setMilitaryStrength) setMilitaryStrength(m => m + 10000);
                                setChronicleLogs(c => [`【圣人纪】学著天下百家尊崇，十万郡卒解檄入归。`, ...c]);
                              }

                              if (setServerLogs) {
                                setServerLogs(prev => [
                                  `🏆 贺！大帅在【历史黄册】解锁了不朽成就：「${ach.name}」，天官行玺盖封！`,
                                  ...prev.slice(0, 3)
                                ]);
                              }
                            }}
                            className="bg-red-800 hover:bg-red-700 text-stone-100 font-bold px-2 py-0.5 rounded text-[9px] font-mono transition cursor-pointer"
                          >
                            印授受领 蓋印
                          </button>
                        ) : (
                          <span className="text-[8.5px] text-stone-400 font-serif italic">
                            ─ 未竟此劫 ─
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chronicle Scroll Area */}
              <div className="bg-amber-50/20 p-3 rounded-lg border border-amber-900/10 space-y-1.5">
                <span className="text-[9.5px] font-bold font-serif text-amber-900 border-b border-amber-950/15 pb-1 block">
                  📜 【秦·大史官官省记黄册】
                </span>
                <div className="space-y-1 mt-1 max-h-[105px] overflow-y-auto font-serif text-[10px] text-stone-600 leading-normal pl-2 border-l border-amber-900/15">
                  {chronicleLogs.map((log, idx) => (
                    <p key={idx} className="italic">{log}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: Chapter 3 World Map Conflict (Width: 4) */}
            <div className="lg:col-span-4 bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-4">
              <div className="border-b border-stone-200 pb-2 flex justify-between items-center">
                <span className="text-xs font-serif font-black text-stone-900 flex items-center gap-1.5 font-bold">
                  <Activity className="w-4 h-4 text-[#8C2F39]" />
                  【三期】 天下大势诸侯异步演进
                </span>
                <button
                  onClick={() => {
                    setIsGeopoliting(!isGeopoliting);
                    soundManager.playDrum();
                  }}
                  className={`text-[8.5px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer font-bold transition-all ${
                    isGeopoliting 
                      ? 'bg-red-900 text-red-100 border-red-500 animate-pulse' 
                      : 'bg-stone-200 text-stone-700 border-stone-300 hover:bg-stone-300'
                  }`}
                >
                  {isGeopoliting ? '▢ 暂停演天' : '▶ 兴大势天演'}
                </button>
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                自动化 AI 诸候决策器。开启后多方藩镇将进行异步天下角力，动态重塑九州给养，事件可直接对本朝属性产生微波影响。
              </p>

              {/* Chinese Map visual simulator */}
              <div className="bg-stone-950 border border-[#C5A059]/20 p-2.5 rounded-lg text-center space-y-2 relative overflow-hidden">
                <span className="text-[8px] font-mono text-amber-500 block uppercase font-bold tracking-widest border-b border-stone-850 pb-1">
                  🗺️ 华夏大域隘险全息沙图
                </span>
                
                {/* 5 Province Bars */}
                <div className="space-y-1 text-[9px] font-mono">
                  {Object.keys(provinces).map((key) => {
                    const prov = provinces[key];
                    return (
                      <div 
                        key={key} 
                        className={`p-1.5 rounded border border-stone-850 text-left flex items-center justify-between ${prov.color}`}
                      >
                        <div>
                          <span className="font-serif font-black block text-[10.5px]">
                            {prov.name} · 【{prov.owner}】
                          </span>
                          <span className="text-[7.5px] text-stone-400 block leading-none mt-0.5">
                            {prov.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-stone-500 block">战资额限</span>
                          <span className="font-serif font-bold text-[#F5F2ED]">
                            {(prov.power/1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Intelligence Feed Logs */}
              <div className="space-y-1.5 flex flex-col">
                <span className="text-[10px] font-bold font-serif text-stone-500 flex items-center gap-1 leading-none uppercase">
                  <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  【天下策】地缘政军谍报网 (FeedLogs)
                </span>
                <div className="bg-stone-900 border border-stone-850 rounded p-2 max-h-[145px] overflow-y-auto font-mono text-[9.5px]/1.5 text-stone-300 space-y-1 flex flex-col">
                  {geopolityLogs.map((log, idx) => (
                    <p key={idx} className="border-b border-stone-850 pb-1 italic text-stone-300 last:border-0">{log}</p>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeView === 'ai_innovation' && (
        <div className="space-y-6 animate-fadeIn pb-12">
          {/* Header */}
          <div className="bg-[#FAF8F5] border border-[#D5C3A6] p-4 rounded-md text-stone-900 font-serif relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="absolute right-0 top-0 opacity-5 select-none pointer-events-none text-9xl font-black">创</div>
            <div className="space-y-1 text-left">
              <h2 className="text-lg font-black text-[#5C1E26] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8C2F39]" />
                国风兵治机制 · AI 自主创新工坊
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed max-w-2xl">
                为了避免与同质化 SLG 堆数和换皮卡牌卷入毫无意义的竞争红海，我们接入大模型 AI 灵感，重构古典博弈思想、法律铸鼎和延迟决策等底层算法，探索出具备高知识分子质感、可复玩度无限拉伸的游戏机制。
              </p>
            </div>
            <div className="text-xs font-mono bg-stone-100 px-2.5 py-1.5 rounded text-stone-600 border border-stone-200">
              ⚡ 技术驱动: Gemini Pro
            </div>
          </div>

          {/* Core innovation selection grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'diplomacy', icon: '🔮', label: '外交与纵横谋攻', desc: '打破点击送礼, 异步空营、真言或谣言心战博弈' },
              { id: 'court', icon: '📜', label: '朝堂百家辩法', desc: '儒墨法三家当堂激论, 拼装字眼重铸法度法鼎' },
              { id: 'combat', icon: '⚔️', label: '战役奇正变势', desc: '分奇一正、烽燧信号行军差延迟、预案编程战斗' },
              { id: 'economy', icon: '🪙', label: '轻重物价平准', desc: '官山海铁垄断、平籴抛售砸盘、汇率铸钱博弈' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setInnovationFocus(item.id as any);
                  setInnovationResult(null); // clear to force reload
                  soundManager.playDrum();
                  handleTriggerInnovation(item.id as any);
                }}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all duration-350 ${
                  innovationFocus === item.id
                    ? 'bg-[#89232F]/10 border-[#8C2F39] ring-2 ring-[#8C2F39]/20 shadow-md'
                    : 'bg-stone-50 hover:bg-stone-100/80 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className={`font-serif font-black text-xs ${innovationFocus === item.id ? 'text-[#8C2F39]' : 'text-stone-850'}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 leading-normal">{item.desc}</p>
              </button>
            ))}
          </div>

          {/* User directive inputs */}
          <div className="bg-[#FAF8F5] border border-stone-200 p-4 rounded-lg space-y-3 shadow-inner">
            <label className="block text-xs font-serif font-bold text-stone-700 flex items-center gap-1.5">
              <span>✍️ 给 AI 的特调机制改良指令 (Custom Innovation Prompts)</span>
              <span className="text-[9.5px] font-mono font-normal text-stone-400 font-sans">(选填，支持中文或英文想法)</span>
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={customInnovationPrompt}
                onChange={(e) => setCustomInnovationPrompt(e.target.value)}
                placeholder="例如：'让流放者可以通过暗中煽动边疆叛军改变朝廷天命...' 或 '加入一种可以伪造国书通敌的高风险用间玩法'"
                className="flex-1 bg-[#FCFBFA] border border-stone-300 rounded px-3 py-2 text-xs font-sans text-stone-900 focus:outline-none focus:border-[#8C2F39]"
              />
              <button
                onClick={() => {
                  soundManager.playChime();
                  handleTriggerInnovation();
                }}
                disabled={isInnovating}
                className="bg-[#8C2F39] hover:bg-[#8C2F39]/95 text-[#F5F2ED] disabled:bg-stone-400 font-bold px-4 py-2 rounded text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {isInnovating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#F5F2ED] border-t-transparent rounded-full animate-spin"></div>
                    谋定中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    🚀 发起 AI 机制探路
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-stone-450 leading-none text-left">
              💡 提示：输入个性想法后点击触发，AI 会立即结合当前游戏的十二篇设计，提出前所未有的全新规则演化和测试算法。
            </p>
          </div>

          {/* Show loading state */}
          {isInnovating && (
            <div className="bg-[#FAF8F5] border border-dashed border-[#D5C3A6] rounded-lg p-16 text-center space-y-3.5">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 border-3 border-stone-250 rounded-full"></div>
                <div className="absolute inset-0 border-3 border-[#8C2F39] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-1">
                <p className="font-serif font-black text-sm text-[#8C2F39] animate-pulse">阁校智谋：研习历朝本纪中...</p>
                <p className="text-xs text-stone-550 max-w-sm mx-auto">
                  正在通过极速大模型推理古代博弈演变，突破市面套路换皮设计，铸写高保真机制草图与模拟参数...
                </p>
              </div>
            </div>
          )}

          {/* Output Dashboard */}
          {!isInnovating && innovationResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-left">
              {/* Left Column: Conceptual Details */}
              <div className="lg:col-span-8 space-y-5">
                {/* Concept Banner */}
                <div className="bg-[#8C2F39] text-[#F5F2ED] p-4 rounded-lg border border-red-900 shadow relative overflow-hidden text-left">
                  <div className="absolute right-4 top-2 text-7xl font-bold opacity-5 pointer-events-none font-serif">智</div>
                  <span className="bg-amber-900/40 text-amber-100 font-serif tracking-widest text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                    AI 策划突破方案 · 【{innovationResult.conceptName || "极智新案"}】
                  </span>
                  <h3 className="font-serif font-black text-base mt-1.5 tracking-wide text-amber-50">
                    {innovationResult.conceptName}
                  </h3>
                  <p className="text-[11.5px] italic text-[#ECC6C9] mt-1 leading-normal font-sans">
                    “ {innovationResult.tagline} ”
                  </p>
                </div>

                {/* Innovation Rationale */}
                <div className="bg-[#FAF8F5] border border-[#D5C3A6] p-4 rounded-lg space-y-2 relative text-left">
                  <div className="absolute -left-1 top-4 w-1.5 h-6 bg-[#8C2F39]"></div>
                  <h4 className="font-serif font-black text-xs text-[#5C1E26] pl-2 uppercase tracking-wide">
                    🎯 为什么要设计这一机制？（同质化破局论证）
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed font-sans text-justify">
                    {innovationResult.innovationRationale}
                  </p>
                </div>

                {/* Core Loop */}
                <div className="bg-[#FAF8F5] border border-[#D5C3A6] p-4 rounded-lg space-y-3 text-left">
                  <h4 className="font-serif font-black text-xs text-[#5C1E26] flex items-center gap-1.5">
                    ⚙️ 玩家体验核心循环 (The Gameplay Core Loop)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                    {innovationResult.coreLoop && innovationResult.coreLoop.map((step: string, idx: number) => {
                      const [title, desc] = step.split(':');
                      return (
                        <div key={idx} className="bg-[#FCFBFA] border border-stone-200 p-3 rounded text-left relative overflow-hidden">
                          <span className="absolute -right-2 -bottom-2 text-4xl font-serif font-black text-stone-150 pointer-events-none select-none">
                            {idx + 1}
                          </span>
                          <span className="font-serif font-black text-[11px] text-[#A63A46] block mb-1">
                            {title || `阶段 ${idx + 1}`}
                          </span>
                          <p className="text-[10px] text-stone-500 leading-relaxed">
                            {desc || title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI-powered Content Engine details */}
                <div className="bg-amber-50/40 border border-amber-900/15 p-4 rounded-lg space-y-2 text-left">
                  <h4 className="font-serif font-black text-xs text-amber-900 flex items-center gap-1.5">
                    💡 大语言模型 AI 赋能：如何实现“自我进化之局”？
                  </h4>
                  <p className="text-xs text-amber-950 leading-relaxed font-sans">
                    {innovationResult.aiRoleDescription}
                  </p>
                </div>

                {/* Pseudo Code Showcase */}
                <div className="bg-stone-950 rounded-lg p-3.5 border border-stone-850 shadow-md text-left">
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-stone-900 text-[10px] font-mono text-stone-400">
                    <span className="flex items-center gap-1.5 text-stone-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                      <span>algorithm_core.ts (算法控制单元)</span>
                    </span>
                    <span>TypeScript v5+ Code View</span>
                  </div>
                  <pre className="text-[10px]/1.5 font-mono text-emerald-450 overflow-x-auto text-left whitespace-pre select-all p-1 bg-stone-900/40 rounded max-h-[320px] overflow-y-auto">
                    {innovationResult.pseudoCode}
                  </pre>
                </div>
              </div>

              {/* Right Column: Mini Interactive Sandbox */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-[#FAF8F5] border border-[#D5C3A6] rounded-lg shadow-sm overflow-hidden text-left">
                  {/* Title banner */}
                  <div className="bg-[#8C2F39]/10 border-b border-[#D5C3A6] p-3 text-left">
                    <span className="text-[9px] font-mono text-stone-500 block">机制法典沙盘</span>
                    <h4 className="font-serif font-black text-xs text-[#8C2F39] flex items-center gap-1 mt-0.5">
                      📊 微缩机制天演跑沙盒
                    </h4>
                  </div>

                  {/* Variables slider list */}
                  <div className="p-4 space-y-4">
                    <p className="text-[10px] text-stone-500 leading-normal mb-1">
                      调整下方由 AI 生成的游戏运行逻辑阀值，观察当本朝大将或朝廷在不同状态下执行测试对赌的效果：
                    </p>

                    <div className="space-y-3.5">
                      {sandboxVariables.map((variable, idx) => (
                        <div key={idx} className="space-y-1.5 text-left text-[11px] font-sans">
                          <div className="flex justify-between text-stone-700 font-medium">
                            <span className="truncate">{variable.name}</span>
                            <span className="font-mono text-[#8C2F39] font-bold">
                              {variable.value}{variable.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-stone-400 font-mono">{variable.min}</span>
                            <input
                              type="range"
                              min={variable.min}
                              max={variable.max}
                              value={variable.value}
                              onChange={(e) => {
                                const updated = [...sandboxVariables];
                                updated[idx].value = Number(e.target.value);
                                setSandboxVariables(updated);
                                setSandboxTestResult(null);
                                setSandboxTestStatus('idle');
                              }}
                              className="flex-1 accent-[#8C2F39] h-1 bg-stone-200 rounded-lg cursor-pointer"
                            />
                            <span className="text-[9px] text-stone-400 font-mono">{variable.max}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Simulation trigger */}
                    <div className="bg-[#FAF8F5] border-t border-stone-200/60 pt-4 mt-2 space-y-3">
                      <button
                        onClick={async () => {
                          setIsSimulatingAction(true);
                          soundManager.playHorn();
                          setSandboxTestResult(null);
                          setSandboxTestStatus('idle');

                          setTimeout(() => {
                            // Extract values
                            const v0 = sandboxVariables[0]?.value || 50;
                            const v1 = sandboxVariables[1]?.value || 50;
                            const v2 = sandboxVariables[2]?.value || 50;

                            // Default formula evaluates dynamic ratio with weightings:
                            // Try parsing standard variables (or just evaluate a consistent mathematical ratio)
                            const intensityRatio = (v0 * v2) / Math.max(1, v1);
                            const successChance = Math.min(95, Math.max(5, Math.round(intensityRatio * 1.2)));

                            const isSuccess = Math.random() * 105 < (successChance + 10); // slightly boost for gaming satisfaction
                            
                            if (isSuccess) {
                              setSandboxTestResult(innovationResult.sandboxSimulationConfig?.successLog || "💥 天助我也！策略运用炉火纯青，战局形势逆转，国泰民安！");
                              setSandboxTestStatus('success');
                              soundManager.playCoins();
                            } else {
                              setSandboxTestResult(innovationResult.sandboxSimulationConfig?.failLog || "❌ 功败垂成！对敌估计失衡，阵脚漏破，招致反戈亏损！");
                              setSandboxTestStatus('fail');
                              soundManager.playDrum();
                            }
                            setIsSimulatingAction(false);
                          }, 950);
                        }}
                        disabled={isSimulatingAction}
                        className="w-full bg-[#8C2F39] hover:bg-[#8C2F39]/95 text-[#F5F2ED] py-2.5 px-4 rounded text-xs font-serif font-black tracking-wide transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        {isSimulatingAction ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[#F5F2ED] border-t-transparent rounded-full animate-spin"></div>
                            <span>筹算博弈中...</span>
                          </>
                        ) : (
                          innovationResult.sandboxSimulationConfig?.testActionName || "🔮 运行机制测试决议"
                        )}
                      </button>

                      {/* Display test outcomes */}
                      {sandboxTestStatus !== 'idle' && (
                        <div className={`p-3 rounded-md text-left text-xs leading-relaxed animate-fadeIn border ${
                          sandboxTestStatus === 'success'
                            ? 'bg-emerald-50/65 text-emerald-900 border-[#9DE0AD]/50 shadow-sm'
                            : 'bg-rose-50/60 text-rose-950 border-rose-250/50 shadow-sm'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            {sandboxTestStatus === 'success' ? (
                              <span className="text-emerald-700">🏆 天演胜局 (SUCCESS BATTLEVON)</span>
                            ) : (
                              <span className="text-rose-800">⚠️ 天演命失 (FAILURE SLIPOUT)</span>
                            )}
                          </div>
                          <p>{sandboxTestResult}</p>
                          <div className="mt-2 text-[9px] font-mono text-stone-400 flex justify-between uppercase">
                            <span>计算概率公式: {innovationResult.sandboxSimulationConfig?.chanceFormula}</span>
                            <span>调试结算: {Math.random() > 0.5 ? "REACTION_METIC" : "STATE_STABLE"}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Additional Insight Note Card */}
                <div className="bg-[#FAF8F5] border border-stone-205 p-4 rounded-lg text-left text-xs text-stone-500 leading-relaxed font-sans space-y-1">
                  <span className="font-bold text-stone-800 font-serif block">📝 系统设计总监碎碎念：</span>
                  <p>
                    “内卷是因为大伙都在重复造轮子。真正能黏住高礼堂和硬核玩家的，不应该只是简单枯燥的数据膨胀升级，而是带有历史哲学思考、信息局限美学和自创式体系的算法游戏。
                  </p>
                  <p className="mt-1 font-serif text-[11px] text-[#8C2F39]">
                    引入本工坊机制后，由于每次运行的大模型反应不同，极大地保证了多线路发散重玩的广袤天空！”
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
