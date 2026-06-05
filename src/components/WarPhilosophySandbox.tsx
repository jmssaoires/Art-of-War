import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  Swords, 
  HelpCircle, 
  Activity, 
  Award, 
  Compass, 
  RotateCcw, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Stamp,
  Download,
  Share2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { soundManager } from '../utils/soundManager';

interface Scenario {
  id: string;
  title: string;
  background: string;
  troops: { regular: number; surprise: number };
  options: {
    key: string;
    text: string;
    philosophy: string;
    consequence: string;
    quoteStr: string;
    mandateDelta: number;
    troopLossPercent: number;
    winChanceDelta: number;
    comment: string;
  }[];
}

const DESPERATE_SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: '险恶死地 · 漕粮绝境合围',
    background: '大军孤军深入塞北戈壁，突遭五倍匈奴铁骑断绝交通，背后是大川天堑而不可越，仅剩三日之粮。守城绝险，战鼓轰天。',
    troops: { regular: 8000, surprise: 2000 },
    options: [
      {
        key: 'A',
        text: '【置之死地而战】焚毁全部辎重账房，投之亡地，陷之死地而后相率决死搏命。',
        philosophy: '九地哲学',
        consequence: '置之死地，士兵激发两百倍破甲血性！奇迹般向偏北侧翼突围，但折损剧烈。',
        quoteStr: '《孙子兵法·九地》：“投之亡地然后存，陷之死地然后生。”',
        mandateDelta: 15,
        troopLossPercent: 45,
        winChanceDelta: 30,
        comment: '置死求生。壮烈至极，天命值大振，唯王师骨干伤亡过半，代价极大。'
      },
      {
        key: 'B',
        text: '【示形诡道而守】多造烟尘火把，故作实兵数万之阵假象，大军沿东道缓行徐退。',
        philosophy: '虚实/示形',
        consequence: '敌酋疑心中伏，迟疑不敢进逼，我军借此良机连夜隐蔽沿河谷悄然撤回，保全三军。',
        quoteStr: '《孙子兵法·虚实》：“形人而我无形，则我专而敌分。”',
        mandateDelta: 5,
        troopLossPercent: 10,
        winChanceDelta: 15,
        comment: '形兵无常。以最小折损保全主力，善战之上者也！'
      },
      {
        key: 'C',
        text: '【策使求和而裂】遣使者携带朝廷宝玉纳币言降，在敌中帐重金赂买副单于散布反间。',
        philosophy: '反间/阀交',
        consequence: '单于内部发生猜忌分歧扯皮搁置，合围露开缺口。我军趁机突围，但折损了天威。',
        quoteStr: '《孙子兵法·用间》：“反间者，因其敌间而用之也。”',
        mandateDelta: -10,
        troopLossPercent: 5,
        winChanceDelta: 25,
        comment: '诡道外交。挽救了精锐生命，唯在名望清流中留下极重污点。'
      }
    ]
  },
  {
    id: 's2',
    title: '奇正博弈 · 狭隘关险阻截',
    background: '奇袭先锋在狭小的阴雨险涧中穿行，不幸遭敌寇先发伏击。先锋精骑两千已失隐蔽奇兵天利，面临中折。',
    troops: { regular: 5000, surprise: 2000 },
    options: [
      {
        key: 'A',
        text: '【奇正相济变阵】正兵冒死阻截正面防线，残存奇兵立即改弦更张从小岗陡壁衔枚夜袭绕后。',
        philosophy: '奇正相生',
        consequence: '两军相生相克。正面虽然蒙受血洗，但绕后的死士百夫长一举突袭寇营，斩毁其大旗。对方溃退。',
        quoteStr: '《孙子兵法·势》：“战者，以正合，以奇胜。”',
        mandateDelta: 8,
        troopLossPercent: 25,
        winChanceDelta: 20,
        comment: '战无常势。奇正无极，正面吸引了敌部全部感知，侧击斩首一锤定音。'
      },
      {
        key: 'B',
        text: '【忿速强攻突击】主帅勃然大怒，命正兵与奇兵并作一线，重装强击，誓死凿穿关隘。',
        philosophy: '将之五危',
        consequence: '主帅陷入“忿速可侮”之危。狂躁的指挥使全军拥挤在峡道内，承受山崖落石强弩箭雨，死伤极惨。',
        quoteStr: '《孙子兵法·九变》：“将有五危：... 忿速，可侮也。”',
        mandateDelta: -15,
        troopLossPercent: 60,
        winChanceDelta: -10,
        comment: '取死之道。顺遂了敌酋的挑衅胃口，王师精粹血落深谷，天命悲叹。'
      },
      {
        key: 'C',
        text: '【金蝉脱壳退避】抛弃战车旌旗假营，全军解去铁甲换装游衣，潜回山陵，伺机再举。',
        philosophy: '兵因敌变',
        consequence: '敌方白戮一阵，我军大部安全隐伏入山门，保留了军心元气。',
        quoteStr: '《孙子兵法·虚实》：“兵无常势，水无常形。”',
        mandateDelta: -2,
        troopLossPercent: 12,
        winChanceDelta: 10,
        comment: '避锐击惰。留蓄有用之精兵，在广阔的大战略内寻求二度战机。'
      }
    ]
  },
  {
    id: 's3',
    title: '五间反制 · 敌谍密布攻心',
    background: '边关守卒中传言京帅相国谋反，主将性格清廉，名节高贵。敌帅遣细作流言其贪墨，主将名誉将溃，全军心防破产。',
    troops: { regular: 12000, surprise: 1000 },
    options: [
      {
        key: 'A',
        text: '【反间将用诱中】面上假意“清高受辱”狂作买降书密通，暗中将贪腐罪信置于城墙耳目案头，诱敌出关瓮中捉鳖。',
        philosophy: '反间智胜',
        consequence: '敌将信以为真，误判其名节折服而率轻骑漏夜袭城。我方在护门、瓮城万弩齐发，大斩敌酋！',
        quoteStr: '《孙子兵法·用间》：“反间者，因其敌间而用之也。”',
        mandateDelta: 20,
        troopLossPercent: 5,
        winChanceDelta: 40,
        comment: '上贤能间。将反间计用到炉火纯青者，可令万军在无形间分崩离析。'
      },
      {
        key: 'B',
        text: '【死节阵前鸣冤】誓死保全名白。不顾副官阻谏，高鸣鸣放冤屈，率全家与亲随亲骑冲出关栅，决一胜死。',
        philosophy: '廉洁五危',
        consequence: '“廉洁，可辱也”。主帅在军前痛哭名节，受敌骑密击箭雨射崩跌亡。守军见主将战死，瞬间溃乱。',
        quoteStr: '《孙子兵法·九变》：“廉洁，可辱也；爱民，可烦也。”',
        mandateDelta: -20,
        troopLossPercent: 50,
        winChanceDelta: -25,
        comment: '圣人爱名之危。过度看重私德声名，反而落入敌谍最下作的激将诡理。'
      }
    ]
  }
];

interface Achievement {
  id: string;
  name: string;
  desc: string;
  req: string;
  icon: string;
  unlocked: boolean;
}

interface WarPhilosophyProps {
  currentChronoYear?: number;
  dynastyStats?: {
    mandate: number;
    stability: number;
    coffers: number;
    emperorAge: number;
  };
  onSyncState?: (stats: any) => void;
  activeCardId?: string | null;
}

export default function WarPhilosophySandbox({ 
  currentChronoYear = -230, 
  dynastyStats = { mandate: 75, coffers: 45000, stability: 80, emperorAge: 14 }, 
  onSyncState,
  activeCardId = null
}: WarPhilosophyProps) {
  // Scenario simulation states
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [survivalHistory, setSurvivalHistory] = useState<any[]>([]);

  // Chronological military tactics scenario states
  const [selectedTacticPath, setSelectedTacticPath] = useState<string | null>(null);
  const [hasExecutedTactic, setHasExecutedTactic] = useState<boolean>(false);
  const [activeTacticYear, setActiveTacticYear] = useState<number>(currentChronoYear);

  // Trigger state reset if the master year shifts
  useEffect(() => {
    setSelectedTacticPath(null);
    setHasExecutedTactic(false);
    setActiveTacticYear(currentChronoYear);
  }, [currentChronoYear]);

  const getChronoTacticScenario = (year: number) => {
    if (year >= -230 && year <= -221) {
      return {
        epoch: "秦扫六国 · 百川东出",
        title: "合纵雄防与粮道奇变考评",
        description: `公元前 ${Math.abs(year)} 年，大军倾天东出，诸侯合纵阻击我督运漕饷之偏师。为全军之计，前方便道军粮忽遭六国精骑奇击死劫。偏师断薪仅剩三日，统帅应当如何出奇御危？`,
        options: [
          {
            key: 'A',
            text: '【避实击虚 · 瞒天过海】以大阵佯作主力拼死突围吸引敌军视线，暗中派遣死士一万由高地绝险鸟道，秘密转运漕口粮饷，奇兵突袭其防守虚弱侧后翼。',
            shortText: '避实击虚',
            mandateDelta: 12,
            coffersDelta: -8000,
            feedback: '妙极！敌军误认我军急于正面突围，倾主力追击，我精锐高地飞跃神兵天降，合围顿破，并得六国战利辎重无数！天命受大振！',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate + 6, 国库: (dynastyStats.coffers - 4000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate + 10, 国库: (dynastyStats.coffers + 8000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate + 15, 国库: (dynastyStats.coffers + 16000) / 1000 },
            ]
          },
          {
            key: 'B',
            text: '【以合待散 · 坚壁屯收】全军退守城郭壁垒，就地向周围郡县强征百姓降臣充军协防，竭泽搜扣口粮以逸待劳，静候敌寇自溃。',
            shortText: '坚壁清野',
            mandateDelta: -12,
            coffersDelta: -2000,
            feedback: '保求万全。虽借城堡击退游骑，但强征暴敛致使关东百姓恨声载道，民间反抗暗波沸腾，大丧王天命！',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate - 5, 国库: (dynastyStats.coffers - 1000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate - 10, 国库: (dynastyStats.coffers + 2000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate - 15, 国库: (dynastyStats.coffers + 5000) / 1000 },
            ]
          },
          {
            key: 'C',
            text: '【孤注一掷 · 绝地猛冲】倾出国帑大量黄金雇募关中刑大夫、死罪万骑与塞外胡虏，舍弃重型铁甲夜行数百里斩其正印将军。',
            shortText: '绝地冲决',
            mandateDelta: 20,
            coffersDelta: -16000,
            feedback: '狂悍大捷！重赏之下死士锐不可当，当夜横刀破开敌重甲中军，枭斩燕赵大将！如神之谋让天下大惊。然而赏金让国帑严重透支陷入亏空。',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate + 12, 国库: (dynastyStats.coffers - 12000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate + 16, 国库: (dynastyStats.coffers - 6000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate + 22, 国库: (dynastyStats.coffers + 2000) / 1000 },
            ]
          }
        ]
      };
    } else if (year >= -220 && year <= -210) {
      return {
        epoch: "始皇巡狩 · 海内皆臣",
        title: "徭役极点与暴洪失期危局",
        description: `公元前 ${Math.abs(year)} 年，帝国修长城、筑驰道、筑阿房耗竭关东民力。秋连暴洪，大批徭役在关东断送前程断路。失期者依秦法当极严追斩，陈吴等起义暴乱一触即发。如何抚平惊天浩劫？`,
        options: [
          {
            key: 'A',
            text: '【弛刑赦免 · 给田休养】上奏朝廷特请因连天暴洪赦免天下失期劳役，罢黜阿房徭役一年，授流民公田自养。',
            shortText: '放宽休养',
            mandateDelta: 18,
            coffersDelta: -5000,
            feedback: '大施天德！关东戍卒感激万分，散去长弓回归桑麻，万里烽烟之火胎死腹中，社会天命大振！',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate + 8, 国库: (dynastyStats.coffers - 3000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate + 14, 国库: (dynastyStats.coffers - 1000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate + 20, 国库: (dynastyStats.coffers + 4000) / 1000 },
            ]
          },
          {
            key: 'B',
            text: '【诡计伏诛 · 间杀反首】暗差帝国死间死士携千枚金镒贿买地方流民渠帅心腹，将其秘密绞杀以防举事，高悬首逆警告。',
            shortText: '诡间斩首',
            mandateDelta: 6,
            coffersDelta: -10000,
            feedback: '兵法诡道。借心腹之手将陈胜吴广秘密绝命，地方举事随之破灭。但国库花费重资贿赂豪强，花费剧烈。',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate + 2, 国库: (dynastyStats.coffers - 8000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate + 5, 国库: (dynastyStats.coffers - 4000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate + 8, 国库: (dynastyStats.coffers + 1000) / 1000 },
            ]
          },
          {
            key: 'C',
            text: '【严酷法峻 · 强力镇压】调遣三千铁鹰死士强弩严酷清洗失期抗徭之村庄，两侧长途连坐，树万尊血腥京观震慑海防。',
            shortText: '强厉镇捕',
            mandateDelta: -25,
            coffersDelta: 8000,
            feedback: '血海怒涛！抗命村庄遭血洗，严苛的法家镇压逼使流民更行绝境，暴乱烽火呈燎原之势！国帑虽抢劫罪财暴增，但海内天命几近崩殂。',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate - 10, 国库: (dynastyStats.coffers + 4000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate - 20, 国库: (dynastyStats.coffers + 8000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate - 30, 国库: (dynastyStats.coffers + 14000) / 1000 },
            ]
          }
        ]
      };
    } else {
      return {
        epoch: "楚汉相争 · 逐鹿中原",
        title: "荥阳鏖兵背水一战测试",
        description: `公元前 ${Math.abs(year)} 年，楚汉相持于荥阳鏖谷，项羽率三楚铁骑三度绝我甬粮，军中缺乏辎重已无一斗多余之粮。汉王高垒叹息，大势极险，大帅何等决策可抗霸王神威？`,
        options: [
          {
            key: 'A',
            text: '【背水死守 · 韩信抄彭】主力背水结死牢阻阵誓死撑持三万重骑，密遣兵仙韩信率三郡奇旅夜渡绝河，直袭楚都空虚之地。',
            shortText: '暗抄楚都',
            mandateDelta: 25,
            coffersDelta: -10000,
            feedback: '大功底定！项羽惊觉老巢危急，忙不迭折兵后撤，我军合围之危顷刻解除，天命大喜，长期天下归一根基由此筑定！',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate + 12, 国库: (dynastyStats.coffers - 6000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate + 20, 国库: (dynastyStats.coffers + 12000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate + 30, 国库: (dynastyStats.coffers + 28000) / 1000 },
            ]
          },
          {
            key: 'B',
            text: '【卑辞厚币 · 鸿沟议割】割弃成皋以东富庶之县让于项羽，遣使赠朝廷所存重宝与之讲和停战，各自休养。',
            shortText: '屈意讲和',
            mandateDelta: -10,
            coffersDelta: -18000,
            feedback: '权宜自辱。项羽接受了大量钱粮实力继续大壮。朝野文人见朝廷割地，无不感到大失望，天命重重滑落。',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate - 4, 国库: (dynastyStats.coffers - 12000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate - 8, 国库: (dynastyStats.coffers - 6000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate - 10, 国库: (dynastyStats.coffers + 2000) / 1000 },
            ]
          },
          {
            key: 'C',
            text: '【极端暴税 · 尽抽老弱】在关中强制征调一切幼龄、老弱士卒并强征十抽其五的军役税，死撑到底求决。',
            shortText: '竭泽求饷',
            mandateDelta: -22,
            coffersDelta: 20000,
            feedback: '涸泽而渔。虽然短时间内强征赋税使得国库财富陡升，但关中骨肉死离恨天动地，国家稳定天命大崩丧。',
            projection: [
              { name: '当前', 天命: dynastyStats.mandate, 国库: dynastyStats.coffers / 1000 },
              { name: '+3年', 天命: dynastyStats.mandate - 12, 国库: (dynastyStats.coffers + 15000) / 1000 },
              { name: '+7年', 天命: dynastyStats.mandate - 22, 国库: (dynastyStats.coffers + 10000) / 1000 },
              { name: '+12年', 天命: dynastyStats.mandate - 32, 国库: (dynastyStats.coffers - 3000) / 1000 },
            ]
          }
        ]
      };
    }
  };

  const handleExecuteTacticDecision = () => {
    if (!selectedTacticPath) return;
    const scenario = getChronoTacticScenario(activeTacticYear);
    const chosenOption = scenario.options.find(o => o.key === selectedTacticPath);
    if (!chosenOption) return;

    // Apply immediate changes to parent stats callback if present
    if (onSyncState) {
      const nextMandate = Math.min(100, Math.max(5, dynastyStats.mandate + chosenOption.mandateDelta));
      const nextCoffers = Math.max(0, dynastyStats.coffers + chosenOption.coffersDelta);
      onSyncState({
        mandate: nextMandate,
        coffers: nextCoffers
      });
    }

    setHasExecutedTactic(true);
    try {
      soundManager.playHorn();
    } catch (e) {}

    // Log this into survivalHistory list!
    const testEntry = {
      scenarioTitle: `🎓 【兵书历练】${scenario.epoch}:${chosenOption.shortText}`,
      actionTaken: chosenOption.text.slice(0, 100),
      verdict: chosenOption.mandateDelta > 10 ? '甲等上谋' : chosenOption.mandateDelta > 0 ? '乙等守势' : '丙等劣道',
      prestigeChange: `国帑 ${chosenOption.coffersDelta >= 0 ? '+' : ''}${chosenOption.coffersDelta.toLocaleString()}金`,
      expGain: `天命 ${chosenOption.mandateDelta >= 0 ? '+' : ''}${chosenOption.mandateDelta}%`,
      militaryExp: characterFate.militaryExp + 150,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextStats = {
      ...characterFate,
      militaryExp: characterFate.militaryExp + 150
    };
    setCharacterFate(nextStats);

    const nextHistory = [testEntry, ...survivalHistory];
    setSurvivalHistory(nextHistory);
    saveToLocal(nextHistory, nextStats);
  };

  // AI Scenario Advice states
  const [scenarioAdvice, setScenarioAdvice] = useState<any>(null);
  const [scenarioAdviceLoading, setScenarioAdviceLoading] = useState<boolean>(false);
  const [scenarioAdviceError, setScenarioAdviceError] = useState<string>('');

  const handleRetrieveScenarioAdvice = async () => {
    setScenarioAdviceLoading(true);
    setScenarioAdviceError('');
    setScenarioAdvice(null);

    const scenario = DESPERATE_SCENARIOS[currentScenarioIndex];

    try {
      const response = await fetch('/api/gemini/analyze-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle: scenario.title,
          scenarioBackground: scenario.background,
          troops: scenario.troops
        })
      });

      if (!response.ok) {
        throw new Error('军机参谋阁拒绝了兵法剖议。');
      }

      const data = await response.json();
      setScenarioAdvice(data);
    } catch (e: any) {
      console.error(e);
      setScenarioAdviceError(e.message || '系统释古中断，请等候片刻或检查 API。');
    } finally {
      setScenarioAdviceLoading(false);
    }
  };

  // AI strategy advisory states
  const [customAction, setCustomAction] = useState<string>('');
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  // Achievements/Lineage and Ladder states
  const [characterFate, setCharacterFate] = useState({
    name: '咸阳兵备相国府折冲使',
    authority: 80,
    prestige: 75,
    wealth: 35000,
    dao: 85,
    militaryExp: 1200,
    careerTier: '二品金吾卫上大夫'
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'a1', name: '避实击虚', desc: '以无形敌实，在战局决胜中运用诡诈伪装术保全实力超过3次', req: '完成3次示形诡道抉择', icon: '💨', unlocked: false },
    { id: 'a2', name: '投死求生', desc: '在极险死地中，置之死地激死决战成功保全社稷', req: '通过“兵危死地”决战抉择', icon: '🔥', unlocked: false },
    { id: 'a3', name: '反间师祖', desc: '大用敌谍，借力打力完美实现将反间密册之法', req: '通过“敌谍攻心”反间计关卡', icon: '👁️', unlocked: false },
    { id: 'a4', name: '圣贤无危', desc: '完美规避主帅“忿速”与“廉洁易辱”的盲怒心障', req: '在所有模拟中获得甲等评价', icon: '📜', unlocked: false }
  ]);

  const rankingLadder = [
    { title: '大圣兵尊', points: 1500, requirement: '达到1500点战史阅历', desc: '与孙武、吴起并耀，不战而屈人之兵。', current: false },
    { title: '二品金吾卫上大夫', points: 1200, requirement: '达到1200点战史阅历', desc: '执朝廷兵枢，奇正调配自如，制九地。', current: true },
    { title: '折冲营副统督', points: 800, requirement: '达到800点战史阅历', desc: '精熟五间诡道，敢于散地、死地临危。', current: false },
    { title: '三军百夫营校尉', points: 400, requirement: '达到400点战史阅历', desc: '能看透正奇之实，领老卒死斗不乱。', current: false },
    { title: '关中布衣新募斥候', points: 100, requirement: '达到100点战史阅历', desc: '偶闻始计十三篇。未登真正沙场。', current: false }
  ];

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('war-philosophy-timeline');
    if (saved) {
      try {
        setSurvivalHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    const savedStats = localStorage.getItem('war-philosophy-stats');
    if (savedStats) {
      try {
        setCharacterFate(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToLocal = (newHistory: any[], newStats: any) => {
    localStorage.setItem('war-philosophy-timeline', JSON.stringify(newHistory));
    localStorage.setItem('war-philosophy-stats', JSON.stringify(newStats));
  };

  const handleScenarioOptionChoose = (opt: any) => {
    setSelectedScenarioOption(opt.key);
    const scenario = DESPERATE_SCENARIOS[currentScenarioIndex];

    const result = {
      scenarioTitle: scenario.title,
      strategy: opt.philosophy,
      consequence: opt.consequence,
      quote: opt.quoteStr,
      mandateChange: opt.mandateDelta,
      troopSurvivorPercent: 100 - opt.troopLossPercent,
      tacticalRating: opt.mandateDelta > 10 ? '甲等 (Master)' : opt.mandateDelta > 0 ? '乙等 (Adequate)' : '丙等 (Deficit)',
      comment: opt.comment
    };

    setSimulationResult(result);

    // Update stats and history
    const isNewScenarioRun = !survivalHistory.some(h => h.scenarioTitle === scenario.title);
    let ptsGain = opt.mandateDelta > 10 ? 150 : opt.mandateDelta > 0 ? 80 : 30;
    
    const nextStats = {
      ...characterFate,
      prestige: Math.min(100, characterFate.prestige + Math.round(opt.mandateDelta * 0.8)),
      dao: Math.min(100, characterFate.dao + (opt.philosophy.includes('示形') ? 5 : -5)),
      militaryExp: characterFate.militaryExp + ptsGain
    };
    setCharacterFate(nextStats);

    const historyTimelineEntry = {
      scenarioTitle: scenario.title,
      actionTaken: opt.text,
      verdict: result.tacticalRating,
      prestigeChange: `声望 ${opt.mandateDelta >= 0 ? '+' : ''}${Math.round(opt.mandateDelta * 0.8)}`,
      expGain: `兵学历练 +${ptsGain}`,
      militaryExp: nextStats.militaryExp,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [historyTimelineEntry, ...survivalHistory];
    setSurvivalHistory(nextHistory);

    // Unlock achievements dynamically
    const nextAchievements = [...achievements];
    if (scenario.id === 's1' && opt.key === 'A') nextAchievements[1].unlocked = true; // 投死求生
    if (scenario.id === 's3' && opt.key === 'A') nextAchievements[2].unlocked = true; // 反间师祖
    if (opt.philosophy.includes('示形') || opt.philosophy.includes('虚实')) {
      const shownCount = nextHistory.filter(h => h.actionTaken.includes('示形') || h.actionTaken.includes('虚实') || h.actionTaken.includes('诡道')).length;
      if (shownCount >= 2) nextAchievements[0].unlocked = true; // 避实击虚
    }
    if (nextHistory.every(h => h.verdict.includes('甲等'))) {
      if (nextHistory.length >= 3) nextAchievements[3].unlocked = true; // 圣贤无危
    }
    setAchievements(nextAchievements);

    saveToLocal(nextHistory, nextStats);
  };

  const handleNextScenario = () => {
    setSelectedScenarioOption(null);
    setSimulationResult(null);
    setScenarioAdvice(null);
    setScenarioAdviceError('');
    setCurrentScenarioIndex((prev) => (prev + 1) % DESPERATE_SCENARIOS.length);
  };

  const handleRandomizeScenarioPrompt = () => {
    const customizedDisasters = [
      "敌帅王翦拥军八万，扼守函谷要隘拒不出战。我师虽众饥馑已露，侧翼山林恐防有合围大将李信。我方应如何布局“避实击虚”？",
      "出奇兵偷越子午谷奇袭咸阳，不料关前山体滑坡露兵踪，敌常侍精骑五百已在前峡结阵布防。我奇兵统帅暴怒决策在即。",
      "边境藩镇通敌之罪状落入敌反间细作之手，主帅性格高傲而清名天下，面对全城贪墨横流之舆论审判，应当如何解此死结？",
      "白起将军帅精锐三万合围楚都，楚王撕毁和盟结纳四国盟军五十万勤王。我军九地属‘重地’，无险足恃，战机何存？"
    ];
    const pick = customizedDisasters[Math.floor(Math.random() * customizedDisasters.length)];
    setCustomAction('');
    setAiReport(null);
    setAiError('');
    // Inject a customized situation to show rich interactivity
    setCustomAction(`战场危机：${pick}\n\n我的主帅应对战术：`);
  };

  const handleAskAIStrategist = async () => {
    if (!customAction.trim()) {
      setAiError('请拟定一份主帅应对大略奏章！');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiReport(null);

    try {
      const response = await fetch('/api/gemini/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: DESPERATE_SCENARIOS[currentScenarioIndex].title,
          troopStats: {
            ourTroop: DESPERATE_SCENARIOS[currentScenarioIndex].troops,
            careerExp: characterFate.militaryExp,
            daoScore: characterFate.dao
          },
          playerAction: customAction,
          history: survivalHistory.slice(0, 3).map(h => h.actionTaken)
        })
      });

      if (!response.ok) {
        throw new Error('API server rejected the consultation.');
      }

      const data = await response.json();
      setAiReport(data);

      // Log progress to timeline as AI consultation
      const historyTimelineEntry = {
        scenarioTitle: `AI 军机咨询: ${DESPERATE_SCENARIOS[currentScenarioIndex].title.split('·')[0]}`,
        actionTaken: customAction.slice(0, 100) + (customAction.length > 100 ? '...' : ''),
        verdict: `AI 评 ${data.verdict || '行军'}`,
        prestigeChange: `历练 +100`,
        expGain: `生存概率 ${data.survivalChance}%`,
        militaryExp: characterFate.militaryExp + 100,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const nextStats = {
        ...characterFate,
        militaryExp: characterFate.militaryExp + 100
      };
      setCharacterFate(nextStats);

      const nextHistory = [historyTimelineEntry, ...survivalHistory];
      setSurvivalHistory(nextHistory);
      saveToLocal(nextHistory, nextStats);

    } catch (e: any) {
      console.error(e);
      setAiError(e.message || '引擎解析中断，请检查 API 配置或稍候重试。');
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetAllPhilosophyProgress = () => {
    localStorage.removeItem('war-philosophy-timeline');
    localStorage.removeItem('war-philosophy-stats');
    setSurvivalHistory([]);
    setSelectedScenarioOption(null);
    setSimulationResult(null);
    setScenarioAdvice(null);
    setScenarioAdviceError('');
    setAiReport(null);
    setCustomAction('');
    setAiError('');
    setCurrentScenarioIndex(0);
    setCharacterFate({
      name: '咸阳兵备相国府折冲使',
      authority: 80,
      prestige: 75,
      wealth: 35000,
      dao: 85,
      militaryExp: 1200,
      careerTier: '二品金吾卫上大夫'
    });
    setAchievements([
      { id: 'a1', name: '避实击虚', desc: '以无形敌实，在战局决胜中运用诡诈伪装术保全实力超过3次', req: '完成3次示形诡道抉择', icon: '💨', unlocked: false },
      { id: 'a2', name: '投死求生', desc: '在极险死地中，置之死地激死决战成功保全社稷', req: '通过“兵危死地”决战抉择', icon: '🔥', unlocked: false },
      { id: 'a3', name: '反间师祖', desc: '大用敌谍，借力打力完美实现将反间密册之法', req: '通过“敌谍攻心”反间计关卡', icon: '👁️', unlocked: false },
      { id: 'a4', name: '圣贤无危', desc: '完美规避主帅“忿速”与“廉洁易辱”的盲怒心障', req: '在所有模拟中获得甲等评价', icon: '📜', unlocked: false }
    ]);
  };

  const handleCopyAiCritique = () => {
    if (!aiReport) return;
    const shareText = `【军机推演报告】\n国士判语：${aiReport.verdict}\n战圣对仗：${aiReport.classicQuote}\n主力生存几率：${aiReport.survivalChance}%\n深理剖析：${aiReport.critique}\n御防策原：${aiReport.remedy}`;
    navigator.clipboard.writeText(shareText);
    alert('📋 兵法奏对全文已复制到剪贴板，可在大战略社区发帖印证！');
  };

  const currentScen = DESPERATE_SCENARIOS[currentScenarioIndex];

  return (
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="war-philosophy-sandbox-root">
      
      {/* Title HUD Banner */}
      <div className="flex justify-between items-start md:items-center mb-6 border-b border-[#1A1A1A]/10 pb-4 flex-col md:flex-row gap-2">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <BookOpen className="text-[#8C2F39] w-5 h-5 font-bold" />
            【兵道生存】以兵法为生存哲学的军事推演场
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            《孙子》核心哲学：知己知彼，兵因敌变，示形诡道，置死求生。此乃封建乱世的安身立国至上秘妙。
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleResetAllPhilosophyProgress}
            className="text-[10px] bg-white border border-[#1A1A1A]/15 py-1 px-2 hover:bg-red-50 hover:text-[#8C2F39] rounded font-mono font-bold flex items-center gap-1 shadow-xs"
          >
            <RotateCcw className="w-3 h-3" /> 重载兵法史卷
          </button>
          <span className="text-[10px] border border-[#1A1A1A]/15 px-2 py-1 text-[#8C2F39] font-mono rounded bg-[#8C2F39]/5 font-bold shadow-xs">
            三大生存机制集成 · PRO VERSION
          </span>
        </div>
      </div>

      {activeCardId && (
        <div className="mb-4 bg-[#8C2F39]/5 border border-[#8C2F39]/30 p-3 rounded flex items-center justify-between text-xs animate-pulse text-[#8C2F39] font-serif shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C2F39] animate-spin" />
            <div>
              <span className="font-bold">【兵法符命加持生效中 · {
                activeCardId === 'qizheng' ? '《奇正相生》首级御宝' :
                activeCardId === 'huogong' ? '《火攻奇袭》烈炎秘卷' :
                activeCardId === 'wujian' ? '《五间妙连》通幽罗网' :
                '《商战大垄》国课税书'
              }】</span>
              <span className="text-[#1A1A1A]/80 ml-1.5 font-sans">
                {activeCardId === 'qizheng' 
                  ? '知彼知己而动，当前兵卷生存抉择及历史朝代判定成功概率和决策反馈奖励增加 35%！' 
                  : '本推演大殿受此战法加持，策功评定获得暂时增能。'}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] bg-[#8C2F39] text-[#F5F2ED] px-2 py-0.5 rounded font-black uppercase tracking-wider">加持中</span>
        </div>
      )}

      {/* Grid of 3 Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column Left (P1 + P2): Action Center */}
        <div className="lg:col-span-8 space-y-6">

          {/* Scheme 1: Interactive Survival Options Selection */}
          <div className="bg-white/60 p-5 rounded border border-[#1A1A1A]/15 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 p-2 bg-[#8C2F39]/5 text-[#8C2F39] text-[9px] font-mono font-bold uppercase tracking-widest border-l border-b border-[#1A1A1A]/15">
              方案一：兵法生存抉择
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="p-1 bg-[#8C2F39] text-white text-xs font-serif font-black rounded-xs">
                案 {currentScenarioIndex + 1}
              </span>
              <h3 className="text-md font-serif font-black text-[#1A1A1A]">
                {currentScen.title}
              </h3>
            </div>

            <p className="text-xs text-[#1A1A1A]/85 bg-[#FAF8F5] border border-black/5 p-3 rounded italic font-serif leading-relaxed mb-4">
              “ {currentScen.background} ”
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-white/50 p-2.5 rounded border border-[#1A1A1A]/10 text-xs font-mono">
                <span className="text-[#1A1A1A]/50 block text-[9px] tracking-wider uppercase">主帅直属亲卫兵力</span>
                ⚔️ 正兵: <strong className="text-[#1A1A1A] font-bold">{currentScen.troops.regular}</strong> • 奇袭铁骑: <strong className="text-[#8C2F39] font-bold">{currentScen.troops.surprise}</strong>
              </div>
              <div className="bg-white/50 p-2.5 rounded border border-[#1A1A1A]/10 text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-[#1A1A1A]/50 block text-[9px] tracking-wider uppercase">兵道阅历积点</span>
                  🎓 <strong className="text-[#8C2F39] font-bold">{characterFate.militaryExp}</strong> 点阅历
                </div>
                <span className="text-[10px] bg-[#8C2F39]/10 text-[#8C2F39] px-2 py-0.5 rounded font-bold font-serif">
                  {characterFate.careerTier}
                </span>
              </div>
            </div>

            {/* AI Custom Scenario Analysis trigger */}
            <div className="mb-4 mt-3">
              {!scenarioAdvice && !scenarioAdviceLoading && (
                <button
                  onClick={handleRetrieveScenarioAdvice}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded text-[11px] font-mono font-bold hover:bg-amber-100/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  📜 研读《孙子兵法十三篇》专章军机评释
                </button>
              )}

              {scenarioAdviceLoading && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded text-center text-xs text-amber-900/80 italic font-serif flex items-center justify-center gap-2 animate-pulse">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  中军谍骑与密使翻查兵书，正拟定泰勒化防御密疏...
                </div>
              )}

              {scenarioAdviceError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded font-mono">
                  ⚠️ {scenarioAdviceError}
                </div>
              )}

              {scenarioAdvice && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#FAF8F5] border-2 border-double border-[#5A5A40]/40 p-4 rounded text-neutral-800 space-y-3 relative overflow-hidden shadow font-serif"
                >
                  {/* Parchment background motif element */}
                  <div className="absolute -top-3 -right-3 w-16 h-16 border-4 border-dashed border-[#5A5A40]/10 rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-center border-b border-[#5A5A40]/25 pb-1.5">
                    <span className="text-[10px] font-mono font-black text-[#5A5A40] tracking-widest uppercase flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      孙子兵法专章战术研策 (Sun Tzu Tailored Advice)
                    </span>
                    <button
                      onClick={() => setScenarioAdvice(null)}
                      className="text-[9px] font-mono text-neutral-500 hover:text-[#8C2F39] cursor-pointer"
                    >
                      [收起密折]
                    </button>
                  </div>

                  {/* Chapter-by-chapter list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
                    {scenarioAdvice.applicableChapters?.map((chap: any, idx: number) => (
                      <div key={idx} className="space-y-1 bg-white/50 p-2.5 rounded border border-[#5A5A40]/15 shadow-2xs">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] bg-[#8C2F39]/10 text-[#8C2F39] px-1 rounded font-mono font-black">
                            {chap.chapterNum}
                          </span>
                          <h4 className="text-xs font-serif font-black text-neutral-900">
                            {chap.chapterName}
                          </h4>
                        </div>
                        <blockquote className="border-l-[2.5px] border-[#8C2F39] text-[#8C2F39] italic text-[10.5px] px-2 py-0.5 bg-[#8C2F39]/4 rounded-xs leading-relaxed">
                          “ {chap.quote} ”
                        </blockquote>
                        <p className="text-[10px] text-neutral-600 leading-relaxed text-justify pt-0.5">
                          {chap.guidance}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Strategic Advices bullets list */}
                  <div className="bg-[#8C2F39]/4 p-2.5 rounded border border-[#8C2F39]/15">
                    <span className="text-[9px] font-mono text-[#8C2F39] block font-black uppercase tracking-wider mb-1">
                      ⚔️ 变阵生克对策建议 (Recommended Tactics)
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {scenarioAdvice.strategicAdvices?.map((adv: string, idx: number) => (
                        <li key={idx} className="text-[10px] text-neutral-700 flex items-start gap-1 leading-normal font-medium">
                          <span className="text-amber-700 select-none font-sans shrink-0">✨</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hegemon Dict */}
                  {scenarioAdvice.hegemonDict && (
                    <div className="border-t border-dashed border-[#5A5A40]/25 pt-2 text-[10px] leading-relaxed text-[#5A5A40] italic text-justify flex gap-1 items-start bg-[#5A5A40]/5 px-2 py-1.5 rounded-sm">
                      <span className="text-amber-800 shrink-0 font-bold select-none font-sans text-xs mt-[-2px]">✍️</span>
                      <div>
                        <strong>军机省审批：</strong>{scenarioAdvice.hegemonDict}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest pl-1 block font-bold">
                请裁定生存兵略决对：
              </span>
              {currentScen.options.map((opt) => (
                <button
                  key={opt.key}
                  id={`philosophy-option-${opt.key}`}
                  onClick={() => handleScenarioOptionChoose(opt)}
                  disabled={!!simulationResult}
                  className={`w-full p-3 rounded text-left transition text-xs border flex items-start gap-2 ${
                    selectedScenarioOption === opt.key
                      ? 'bg-[#8C2F39]/10 border-[#8C2F39] text-[#1A1A1A] font-bold shadow-xs'
                      : 'bg-white/70 border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A] disabled:opacity-50'
                  }`}
                >
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-mono font-extrabold border shrink-0 ${
                    selectedScenarioOption === opt.key ? 'bg-[#8C2F39] text-[#F5F2ED] border-[#8C2F39]' : 'bg-white text-[#1A1A1A]/60 border-[#1A1A1A]/15'
                  }`}>
                    {opt.key}
                  </span>
                  <div>
                    <span className="block font-serif font-bold text-neutral-800">{opt.text}</span>
                    <span className="text-[9px] text-[#8C2F39] block mt-1 font-mono font-semibold uppercase">核心：{opt.philosophy}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Simulation Result Box */}
            <AnimatePresence mode="wait">
              {simulationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 bg-[#F5F2ED] border-2 border-[#8C2F39] p-4 rounded-md relative overflow-hidden"
                >
                  {/* Stamp Design Icon */}
                  <div className="absolute top-2 right-2 bg-[#8C2F39]/10 text-[#8C2F39] text-[10px] font-serif border border-[#8C2F39]/30 rounded-xs h-7 px-2 font-black tracking-widest flex items-center justify-center transform rotate-6 border-double border-4">
                    {simulationResult.tacticalRating}
                  </div>

                  <h4 className="text-xs font-mono text-[#8C2F39] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 animate-spin" />
                    中军大帅行简批议 (Historical Battle Resolution)
                  </h4>

                  <p className="text-xs leading-relaxed text-[#1A1A1A] font-serif pr-12">
                    {simulationResult.consequence}
                  </p>

                  <div className="mt-3 p-2 bg-[#1A1A1A]/5 rounded border border-black/5 text-[11px] font-serif italic text-[#8C2F39] font-semibold">
                    “ {simulationResult.quote} ”
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono border-t border-black/10 pt-3 justify-between items-center bg-[#FAF8F5]/50 px-2 py-1.5 rounded">
                    <div>
                      天命折波: <span className={`font-bold ${simulationResult.mandateChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {simulationResult.mandateChange >= 0 ? '+' : ''}{simulationResult.mandateChange}点
                      </span>
                    </div>
                    <div>
                      主力存活: <strong className="text-green-700">{simulationResult.troopSurvivorPercent}% 大部胜存</strong>
                    </div>
                    <div>
                      战略效益: <strong className="text-[#8C2F39]">{simulationResult.comment}</strong>
                    </div>
                    <button
                      id="next-scenario-btn"
                      onClick={handleNextScenario}
                      className="bg-[#8C2F39] text-[#F5F2ED] py-1 px-2.5 rounded font-bold text-[9px] font-mono uppercase tracking-widest hover:bg-[#8C2F39]/90 transition shadow-sm cursor-pointer"
                    >
                      研读下一卷 📜
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scheme 2: AI Strategic Counsel & Deep 推演 Room */}
          <div className="bg-white/60 p-5 rounded border border-[#1A1A1A]/15 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 p-2 bg-[#8C2F39]/5 text-[#8C2F39] text-[9px] font-mono font-bold uppercase tracking-widest border-l border-b border-[#1A1A1A]/15">
              方案二：军机智联参谋
            </div>

            <h3 className="text-md font-serif font-black text-[#8C2F39] mb-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500 font-bold" />
              军机处大内阁阁臣 AI 密折推演
            </h3>
            <p className="text-[11px] text-[#1A1A1A]/60 font-mono mb-3">
              输入你应对任何历史危机的自定义兵略（如诱敌、反间、据河合击等），AI 执笔阁臣将依据《孙子兵法十三篇》进行致命利害演算。
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  id="randomize-prompt-btn"
                  onClick={handleRandomizeScenarioPrompt}
                  className="bg-white hover:bg-neutral-50 text-[10px] text-[#8C2F39] font-mono font-bold px-2 py-1 border border-[#8C2F39]/20 rounded-xs cursor-pointer shadow-xs"
                >
                  🎲 宣示天下其它乱局
                </button>
                <button
                  id="clear-tactical-btn"
                  onClick={() => setCustomAction('')}
                  className="bg-white hover:bg-neutral-50 text-[10px] text-[#1A1A1A]/60 font-mono px-2 py-1 border border-[#1A1A1A]/15 rounded-xs cursor-pointer"
                >
                  重研
                </button>
              </div>

              <textarea
                id="custom-tactic-vessel"
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                placeholder="在此手书你的兵法决策。例如：“我部在白水谷关口假传旗鼓作突围之状诱敌重兵，亲率骁勇死骑深入西山高耸隘口截断其补给漕运...”"
                className="w-full h-24 p-3 bg-[#FAF8F5] border border-[#1A1A1A]/15 rounded text-xs font-serif leading-relaxed focus:outline-none focus:border-[#8C2F39] placeholder:text-[#1A1A1A]/30 resize-none shadow-inner"
              />

              <div className="flex justify-between items-center">
                <div className="text-[10px] text-[#1A1A1A]/60 font-mono flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3 text-[#5A5A40]" /> 
                  AI 耗用 100 阅历折，每次推演增益一纪天命
                </div>
                
                <button
                  id="ai-consultation-btn"
                  onClick={handleAskAIStrategist}
                  disabled={aiLoading || !customAction.trim()}
                  className="bg-[#8C2F39] hover:bg-[#8C2F39]/90 disabled:bg-neutral-200 disabled:text-[#1A1A1A]/40 text-[#F5F2ED] font-black pointer-events-auto text-xs py-2 px-6 rounded transition flex items-center gap-1 shadow-md cursor-pointer"
                >
                  {aiLoading ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin mr-1" />
                      军机参谋翻查十三篇中...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      呈递军机阁臣 AI 密折推演
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded font-mono">
                  {aiError}
                </div>
              )}

              {/* AI Strategic Scribe Result parchment */}
              <AnimatePresence mode="wait">
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-5 bg-[#FAF8F5] border-2 border-double border-[#5A5A40] rounded relative overflow-hidden text-neutral-800 shadow"
                    id="ai-scribe-parchment"
                  >
                    {/* Decorative Seal stamps */}
                    <div className="absolute top-4 right-4 text-[#8C2F39] flex flex-col items-center">
                      <Stamp className="w-10 h-10 rotate-12 opacity-80" />
                      <div className="text-[8px] font-serif border border-[#8C2F39] px-1 text-center font-bold bg-[#8C2F39]/5 mt-0.5 rotate-2">
                        军机奉旨
                      </div>
                    </div>

                    <div className="border-b border-dashed border-[#5A5A40]/30 pb-3 mb-3">
                      <span className="text-[10px] font-mono tracking-widest text-[#5A5A40] uppercase font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        宣皇谕旨 · 兵书合符评
                      </span>
                      <h4 className="text-lg font-serif font-black tracking-widest text-[#1A1A1A] mt-1 flex items-baseline gap-2">
                        决策宣判: <span className="text-[#8C2F39] text-xl font-bold">{aiReport.verdict || '上谋中用'}</span>
                        <span className="text-xs text-[#5A5A40] font-mono">
                          (主力生存概率: <strong className="text-green-700 text-sm">{aiReport.survivalChance || 80}%</strong>)
                        </span>
                      </h4>
                    </div>

                    <div className="space-y-3 font-serif">
                      <div className="p-2 bg-neutral-100 rounded text-xs leading-relaxed italic text-amber-900 border-l-4 border-amber-600 font-medium">
                        “ {aiReport.classicQuote || '《孙子兵法·谋攻篇》：“知彼知己者，百战不殆。”'} ”
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#5A5A40] block font-bold">● 【圣意深理批判】</span>
                        <p className="text-xs leading-relaxed text-neutral-700 text-justify">
                          {aiReport.critique || '爱将此决策在形势上甚得因变奇正。主力正卒牵制吸引了对方轻骑，侧后深入敌军要津。唯在漕粮与天时雨润防备上尚余瑕疵，切莫疏虞。'}
                        </p>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-dashed border-[#5A5A40]/20">
                        <span className="text-[10px] font-mono text-[#8C2F39] block font-bold">● 【临急变备良策】</span>
                        <p className="text-xs leading-relaxed text-[#8C2F39] text-justify font-semibold italic">
                          {aiReport.remedy || '建议偏将立刻增筑伏垒，撤营时缓鸣战鼓，以防敌轻骑因势反击。'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 flex justify-between items-center">
                      <span className="text-[9px] font-mono text-neutral-400">大魏咸阳相政机密奏册存档</span>
                      <button
                        onClick={handleCopyAiCritique}
                        className="bg-white hover:bg-neutral-50 px-2.5 py-1 rounded text-[10px] font-mono border border-neutral-300 text-neutral-700 flex items-center gap-1 hover:border-[#8C2F39] hover:text-[#8C2F39] cursor-pointer transition shadow-xs"
                      >
                        <Share2 className="w-3 h-3" /> 分享大战略社区阅目
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Scheme 3: Chronological Military Strategy Scenario Test */}
          <div className="bg-white/60 p-5 rounded border border-[#1A1A1A]/15 relative overflow-hidden shadow-xs space-y-4 text-[#1A1A1A]" id="temporal-military-tactics-test">
            <div className="absolute top-0 right-0 p-2 bg-[#8C2F39]/5 text-[#8C2F39] text-[9px] font-mono font-bold uppercase tracking-widest border-l border-b border-[#1A1A1A]/15">
              方案三：时局纪年兵学考评
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#8C2F39] text-[#F5F2ED] text-[9px] font-mono rounded-xs uppercase tracking-wider font-extrabold">
                  时局天演 · 公元前 {Math.abs(activeTacticYear)} 年
                </span>
                <span className="text-xs text-[#8C2F39] font-serif font-black">
                  【{getChronoTacticScenario(activeTacticYear).epoch}】
                </span>
              </div>
              <h3 className="text-md font-serif font-black text-stone-900 mt-1 flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-[#8C2F39]" />
                {getChronoTacticScenario(activeTacticYear).title}
              </h3>
            </div>

            <p className="text-xs text-[#1A1A1A]/80 leading-relaxed bg-stone-50 border border-stone-200/50 p-3 rounded italic font-serif">
              “ {getChronoTacticScenario(activeTacticYear).description} ”
            </p>

            {/* Decision options list */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider pl-1 font-bold block">
                请密授退敌、安澜兵略条陈：
              </span>
              {getChronoTacticScenario(activeTacticYear).options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    if (!hasExecutedTactic) {
                      setSelectedTacticPath(opt.key);
                    }
                  }}
                  disabled={hasExecutedTactic}
                  className={`w-full p-2.5 rounded text-left transition text-xs border flex items-start gap-2.5 cursor-pointer ${
                    selectedTacticPath === opt.key
                      ? 'bg-amber-50/70 border-amber-600/60 shadow-xs'
                      : 'bg-white/80 border-stone-200 hover:bg-stone-50 disabled:opacity-60'
                  }`}
                >
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                    selectedTacticPath === opt.key ? 'bg-amber-800 text-white border-amber-800' : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}>
                    {opt.key}
                  </span>
                  <div className="flex-1">
                    <span className="block font-serif font-bold text-stone-850 leading-tight">{opt.text}</span>
                    <span className="text-[8.5px] text-amber-800 block mt-1 font-mono uppercase font-semibold">
                      国策预计：天命 {opt.mandateDelta >= 0 ? '+' : ''}{opt.mandateDelta}% | 国库 {opt.coffersDelta >= 0 ? '+' : ''}{opt.coffersDelta.toLocaleString()} 金镒
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected tactic details & long-term chart projection visualization */}
            {selectedTacticPath && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3">
                <div className="flex justify-between items-center border-b border-stone-300/40 pb-2">
                  <span className="text-[10px] font-mono text-stone-600 tracking-wider font-bold">
                    🔮 【此谋长远天演轨迹】 十二年天命国库推演预测线
                  </span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                    国库折千单位(镒)
                  </span>
                </div>

                {/* Long-term trajectory line graph */}
                <div className="h-44 w-full" id="tactic-long-term-graphic">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={getChronoTacticScenario(activeTacticYear).options.find(o => o.key === selectedTacticPath)?.projection || []}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e1e1e1" />
                      <XAxis dataKey="name" stroke="#686868" fontSize={9} />
                      <YAxis stroke="#686868" fontSize={9} />
                      <RechartsTooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
                      <Line type="monotone" name="天命趋势值" dataKey="天命" stroke="#8C2F39" strokeWidth={2} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="国库储量(金)" dataKey="国库" stroke="#C5A059" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* If executed, show outcome narration and metrics block */}
                {hasExecutedTactic ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-amber-50/70 border border-amber-300/50 rounded-xs text-neutral-800 space-y-2 relative"
                  >
                    <div className="text-[11px] font-black text-amber-950 border-l-2 border-amber-600 pl-2 font-serif font-extrabold uppercase">
                      天演主谋审批答复报告:
                    </div>
                    <p className="text-[11px] font-serif leading-relaxed text-stone-700">
                      {getChronoTacticScenario(activeTacticYear).options.find(o => o.key === selectedTacticPath)?.feedback}
                    </p>
                    <div className="text-[9px] font-mono text-stone-500 italic pt-1.5 border-t border-dashed border-[#1A1A1A]/10 flex justify-between">
                      <span>已录入大秦兵备考评档案</span>
                      <span className="text-amber-800">★ 获得 150 点战史历练</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-stone-100 p-2.5 rounded border border-stone-200 gap-2">
                    <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      行策即同步影响核心『天命值』与『国库』状态！
                    </span>
                    <button
                      onClick={handleExecuteTacticDecision}
                      className="bg-[#8C2F39] text-[#F5F2ED] py-1.5 px-4 rounded text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-[#8C2F39]/90 active:scale-95 transition shadow-sm cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Stamp className="w-3.5 h-3.5" />
                      行此兵策决议
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Column Right (P3): Lineage Profile & Dynamic Hegemony Ladder */}
        <div className="lg:col-span-4 space-y-6">

          {/* Scheme 3a: Hegemony Ladder Status */}
          <div className="bg-white/60 p-5 rounded border border-[#1A1A1A]/15 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 p-2 bg-[#8C2F39]/5 text-[#8C2F39] text-[9px] font-mono font-bold uppercase tracking-widest border-l border-b border-[#1A1A1A]/15">
              方案三：天下战局天梯
            </div>

            <h3 className="text-xs font-mono text-[#1A1A1A]/80 uppercase tracking-widest border-b border-[#1A1A1A]/15 pb-1.5 font-bold">
              秦川雄主兵政阶位天梯榜
            </h3>

            <div className="space-y-2 mt-3">
              {rankingLadder.map((tier) => {
                const isCurrent = characterFate.militaryExp >= tier.points && characterFate.militaryExp < (tier.points + 400 || 9999);
                return (
                  <div
                    key={tier.title}
                    className={`p-2.5 rounded border text-xs relative ${
                      isCurrent 
                        ? 'bg-[#8C2F39]/5 border-[#8C2F39] shadow-sm' 
                        : 'bg-white/40 border-[#1A1A1A]/5 opacity-70'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-2 right-2 bg-[#8C2F39] text-white text-[8px] px-1 rounded uppercase font-mono font-black animate-pulse">
                        吾之尊位
                      </span>
                    )}
                    <h4 className={`font-serif font-bold ${isCurrent ? 'text-[#8C2F39]' : 'text-[#1A1A1A]'}`}>
                      {tier.title}
                    </h4>
                    <p className="text-[10px] text-[#1A1A1A]/60 font-mono mt-0.5">{tier.desc}</p>
                    <div className="flex justify-between items-center text-[9px] text-[#1A1A1A]/40 font-mono mt-1 border-t border-black/5 pt-1">
                      <span>要求: {tier.requirement}</span>
                      <span>位阶积分: {tier.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheme 3b: Tactical Heritage Achievements */}
          <div className="bg-white/60 p-5 rounded border border-[#1A1A1A]/15 relative overflow-hidden shadow-xs">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 uppercase tracking-widest border-b border-[#1A1A1A]/15 pb-1.5 font-bold flex items-center justify-between">
              <span>军事家生存谱系成就</span>
              <span className="text-[10px] text-[#8C2F39] font-bold font-mono">
                已斩获: {achievements.filter(a => a.unlocked).length} / {achievements.length}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-2 rounded border text-left flex flex-col justify-between h-20 transition ${
                    ach.unlocked 
                      ? 'bg-emerald-50/70 border-emerald-500/30' 
                      : 'bg-neutral-100/50 border-neutral-200 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-lg">{ach.icon}</span>
                    <span className={`text-[8px] px-1 rounded font-mono font-bold ${
                      ach.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {ach.unlocked ? '已解密' : '锁闭'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-serif font-black text-neutral-800 leading-tight">
                      {ach.name}
                    </h4>
                    <p className="text-[8px] text-neutral-500 truncate" title={ach.desc}>
                      {ach.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scribe Ledger Timeline */}
          <div className="bg-white/60 p-5 rounded border border-[#1A1A1A]/15 relative overflow-hidden shadow-xs h-60 flex flex-col justify-between">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 uppercase tracking-widest border-b border-[#1A1A1A]/15 pb-1.5 font-bold">
              中军兵备曲录时间轴
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1" id="philosophy-chronology">
              {survivalHistory.length === 0 ? (
                <div className="text-xs text-[#1A1A1A]/40 font-serif italic text-center py-6">
                  史册犹空。请至方案一或方案二中推演兵法抉择，著录个人乱世生存世系表。
                </div>
              ) : (
                survivalHistory.map((h, idx) => (
                  <div key={idx} className="text-[10px] font-mono border-l border-[#8C2F39] pl-2 space-y-0.5 relative">
                    <span className="w-1.5 h-1.5 bg-[#8C2F39] rounded-full absolute -left-[4px] top-1"></span>
                    <div className="flex justify-between text-[#8C2F39]/80 font-bold">
                      <span className="font-serif">{h.scenarioTitle}</span>
                      <span>{h.timestamp}</span>
                    </div>
                    <p className="text-neutral-600 line-clamp-1 italic">"{h.actionTaken}"</p>
                    <div className="flex justify-between text-neutral-400 text-[8px]">
                      <span>评价: <strong className="text-amber-800">{h.verdict}</strong></span>
                      <span>{h.prestigeChange}</span>
                      <span>{h.expGain}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {survivalHistory.length > 0 && (
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(survivalHistory);
                  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                  const link = document.createElement('a');
                  link.setAttribute('href', dataUri);
                  link.setAttribute('download', `art-of-war-survival-chronicle.json`);
                  link.click();
                  alert('📥 成功导出孙子生存谱记！可随时导入其它沙盒。');
                }}
                className="w-full mt-2 bg-[#8C2F39] text-[#F5F2ED] hover:bg-[#8C2F39]/90 py-1.5 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> 导出【孙子生存世家史册】
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
