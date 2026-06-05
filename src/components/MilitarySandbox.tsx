import React, { useState, useEffect } from 'react';
import { CombatState, GeneralCharacter } from '../types';
import { Shield, Sparkles, Swords, Compass, HelpCircle, Activity, Award, User, RotateCcw, Skull, Map, Sliders, X, Layers, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sfx } from '../utils/sfx';

interface TraitDetail {
  name: string;
  badge: string;
  effect: string;
  logic: string;
  formula: string;
  quote: string;
  chapter: string;
  strategicColor: string;
  combatBreakdown: string;
  terrainPenalties: string;
  strategyModification: string;
}

const TRAIT_DETAILS: Record<string, TraitDetail> = {
  '防守大师': {
    name: '防守大师',
    badge: '守 (Defense)',
    effect: '稳若重山。擅于依托坚卡堑垒消耗敌军，极大削减反弹之劲。',
    logic: '在推演时，将我方所受之反击折损降低 25%。',
    formula: '实际承受反击损耗 = 敌守军功力 * (1.1 - 统帅值/100) * 0.75',
    quote: '“善守者，藏于九地之下。”',
    chapter: '《孙子兵法·形篇》',
    strategicColor: 'text-[#5A5A40]',
    combatBreakdown: '依托坚卡巨壑、精算重甲守御。在决战模拟中，将我方所受的敌方反击及强攻折损扣减 25%，令侧翼及正面固若金汤。即便由于统率处于劣势蒙受围困，也能保全三军核心元气。',
    terrainPenalties: '在『散地』（Scattered Ground，士气极易松散瓦解之平原原野）行军对决时，能免疫地形自带的 15% 天然攻防松懈惩罚；并在面对江河、泥泞渡口等仰攻险境时，保持重盾如山，彻底化解敌军占领高地所释出的冲击压制罚值。',
    strategyModification: '完美强化『坚壁清野』与『示之以弱/诱敌深入』战法。当正面大军佯退或诱引敌方深入时，该特质保证后退阵列与两翼殿后防线无懈可击，极度防止敌骑追击反咬，是防守反击流派的终极基盘特质。'
  },
  '沉稳老将': {
    name: '沉稳老将',
    badge: '宁 (Patience)',
    effect: '老成持重。能严守号令与战线秩序，不受敌方以妇人巾帼衣服挑衅激怒。',
    logic: '言语激怒时，有 100% 概率触发“挑衅无效、安之若素”，杜绝因冲动丢失天险要区。',
    formula: '规避“忿速”或“必死”在激怒态下带来的全军冒进损伤变乘数。',
    quote: '“主不可以怒兴军，将不可以愠致战。”',
    chapter: '《孙子兵法·火攻篇》',
    strategicColor: 'text-amber-800',
    combatBreakdown: '心定气澄，宠辱不惊。在伤害及胜死概率演化中，彻底杜绝对手利用垃圾话流言或巾帼妇衣进行激怒，豁免因将领主帅暴毙、极怒、愤激冒进而带来的 30% 全军覆没型战力惩罚。',
    terrainPenalties: '在穿行狭长隘道、雨涧崖壁等高危险地时，该将领以极其高明持重的斥候刺探警戒网，将敌酋依托地利的十倍伏击或落石弩箭突袭伤害削低 80%，保全全军建制无伤通过。',
    strategyModification: '针对敌方『反间攻心计』、『虚假佯退诱敌』或『言语寻衅』具最高克制效能。能维系大军在长期枯燥的拉锯、持久、消耗战状态下的民生、饷银和心防稳态，守护社稷天命不坠。'
  },
  '逍遥津奇袭': {
    name: '逍遥津奇袭',
    badge: '奇',
    effect: '疾风迅雷。极度长于突陷阵、攻其无备，奇兵破坏力暴增。',
    logic: '使我方的战术奇兵突袭战力评估基底暴增 1.5 倍。',
    formula: '奇袭打击效能 = 奇兵实数 * 1.5 (突袭基数) * 1.5 (奇特质系数) = 2.25',
    quote: '“凡战者，以正合，以奇胜。故善出奇者，无穷如天地，不竭如江河。”',
    chapter: '《孙子兵法·势篇》',
    strategicColor: 'text-[#8C2F39]',
    combatBreakdown: '折冲决战！使我方迂回的奇袭铁骑的核心爆破穿透系数，由默认的 1.5 倍基础基底跃升至极高且暴烈的 2.25 倍计算。在侧后对决中能以摧枯拉朽之姿快速击溃守军核心指挥所。',
    terrainPenalties: '在隘口深谷、密雨山泽中运动作战时，完全无视深远山川所带来的重叠行军负荷，反而能借助死角发动局部十倍合围，大幅将狭窄复杂地形化为极速杀敌的天赐战场。',
    strategyModification: '绝配《兵势篇》『奇正相生』真谛。担任敌军侧翼奇袭、切断重甲漕运转运、强行刺杀敌阵统帅的核心尖刀。极擅发动『正兵正面牵引，奇兵长途衔枚突袭』的必杀策略。'
  },
  '虚实突击': {
    name: '虚实突击',
    badge: '实 (Strike)',
    effect: '避实而击虚。巧妙借助正面佯动声色（示之形），在敌军不备处发起决口突击。',
    logic: '若启动【示之形】伪装（feignAttacker 状态激活），正面伤害额外追加 20%。',
    formula: '我方全攻力 = 基础奇正战力合能 * 1.20 (佯攻虚实乘数)',
    quote: '“兵形象水，水之行，避高而趋下；兵之形，避实而击虚。”',
    chapter: '《孙子兵法·虚实篇》',
    strategicColor: 'text-blue-700',
    combatBreakdown: '神出鬼没，避实击虚。只要我军前敌军官策划并成功启动【示之形】伪装佯攻（feignAttacker 激活），正面正兵穿甲伤害立即获得额外 20% 复算翻番，让敌人在自顾不暇间被攻克命脉。',
    terrainPenalties: '直捣黄龙。面对敌方固据于『围地』、『险地』的高墙巨堑坚壁，通过佯鼓、假营多造风烟，蒙蔽驻守主帅并削低其多达 40% 的城墙驻守承伤奖励。',
    strategyModification: '深通《虚实篇》『致人而不致于人』之不二法门。与草人借箭、纸兵退敌、多点虚张等迷惑策略极度共鸣，最擅使敌处处戒守而兵力分散，是破解固若金汤之高守御敌阵的不二法器。'
  },
  '刚直廉洁': {
    name: '刚直廉洁',
    badge: '廉 (Honor)',
    effect: '洁身自好，视清白高悬于世。但这正是兵学中主帅致命心防缺口。',
    logic: '性格骄矜而顾惜名誉者，易在敌方密奏攻心（五间连环）时流露出失智反抗情绪。',
    formula: '在密牒间谍战中更容易激发极端言辞事件，致天命局势起伏剧烈。',
    quote: '“廉洁，可辱也；爱民，可烦也。”',
    chapter: '《孙子兵法·九变篇》',
    strategicColor: 'text-emerald-700',
    combatBreakdown: '名德如冰，誓死不苟。当受到敌方谣言、细作构陷或流言中辱时，其部曲义烈精锐战力额外激发 15% 愤兵突刺伤害。但由于爱惜羽毛，常令战事处于惨烈对冲中。',
    terrainPenalties: '陷身『死地』时打出超越生死的 130% 无双攻防转换力；然而，只要处于『散地』或『泥泞险涧』等民心飘摇处，一旦被敌反间攻心，极易诱发 30% 基底兵卒潜遁逃匿。',
    strategyModification: '对应主帅致命破绽『廉洁，可辱也』。易被敌方『反间计』或攻心谍报激将、迫其提前发起绝死反刺。在阵线布局中，需配合高才智副官或参赞居中协理调度，以防落入圈套。'
  },
  '冲锋猛将': {
    name: '冲锋猛将',
    badge: '猛 (Charge)',
    effect: '破阵前敌。猛打猛冲，白刃对决时极易打穿敌方当面据点。',
    logic: '提升我方主力正兵（Regular Troop）的基础穿透打击率 15%。',
    formula: '正兵基础输出值 = 正兵实数 * 1.15 (突进系数) * 奇计 / 10',
    quote: '“勇者不得独进，怯者不得独退，此用众之法也。”',
    chapter: '《孙子兵法·军争篇》',
    strategicColor: 'text-orange-700',
    combatBreakdown: '万军辟易，斩旗夺槊。统督主力当面正兵（Regular Troops）白刃穿透打击、攻守互搏穿透率永久 +15% 强力乘数。在大波次决战交锋时瞬间重创对方的主力线。',
    terrainPenalties: '在越水攻坚、攀缘险壁、斜谷迎敌等高势位惩罚地利中，拼将个人千钧勇力直接灌注三军精魄，抹消高达 25% 的高空和烂泥下陷所带给战卒的打击削弱负效应。',
    strategyModification: '与『全军乘胜死斗』策略一拍即合。适合配合中军处于锐气高燃、胜势在前的强击节奏。不留残兵，不留余手，在主力原野战中是摧毁并踩扁敌正面防御线不可或缺的霸道悍将。'
  }
};

interface AdviseDetails {
  assessment: string;
  threatLevel: 'CRITICAL' | 'WARN' | 'NORMAL';
  suggestedStrategy: string;
  counterRating: string;
  recommendedCounter: string;
  actions: {
    label: string;
    desc: string;
    actionType: 'SET_SCATTER' | 'SET_DEATH' | 'TOGGLE_FEIGN_ATTACK' | 'TOGGLE_FEIGN_DEFEND' | 'PROVOKE' | 'RESET';
    badge: string;
    helpText: string;
  }[];
}

const ADV_ADVISOR_DATA: Record<string, AdviseDetails> = {
  '防守大师': {
    assessment: '敌我对峙之重关固若金汤！该将领防守端极难正面攻破（反击损耗削减 25%）。若盲目投入全部主力发起硬拼，不仅无法瞬间刺穿其坚硬防御，反会被防守反击拖落泥潭。',
    threatLevel: 'WARN',
    suggestedStrategy: '采取孙子兵法《虚实》之「出其所不趋，趋其所不意」策略。避免正面交锋，利用佯攻伪装拉扯其重兵阵脚，或迁战于「散地」削减其主场据守天险加成。',
    counterRating: '92% 胜机 (战术合能)',
    recommendedCounter: '启用佯攻（示之形），或改变地形到「散地」分化。',
    actions: [
      {
        label: '诱敌动摇：启动我军【佯攻虚晃】',
        desc: '在正面扬尘伪造万马千军，逼其重兵偏转防御侧翼。',
        actionType: 'TOGGLE_FEIGN_ATTACK',
        badge: '佯攻错位',
        helpText: '点击激活【示之形】，为我方添加 20% 虚实正兵输出伤害乘数。'
      },
      {
        label: '诱敌离关：转战【平原散地】',
        desc: '撤下隘谷险隘，移师在开阔的原野散地包抄游斗。',
        actionType: 'SET_SCATTER',
        badge: '散地围歼',
        helpText: '点击将攻防地盘调整为【散地】，使其坚垒防守大师特质难以集结依托。'
      }
    ]
  },
  '沉稳老将': {
    assessment: '敌将老成持重，对言语谗言或丢掷巾帼衣服挑衅具有 100% 极强豁免。常规的下三滥激怒诡计毫无功效，其心防无懈可击，坚忍如古木。',
    threatLevel: 'NORMAL',
    suggestedStrategy: '「以退为进，拖垮其补给粮草」。该将稳固但往往行动偏向保守、行军序列周密而长。可换地形至「散地」借民心涣散压之，或者重整部署，等待更好奇袭节拍。',
    counterRating: '85% 胜机 (坚忍围遏)',
    recommendedCounter: '改变对阵地势至「散地」，并在长期拉锯相持中削磨敌方士气。',
    actions: [
      {
        label: '移防对决：引军至【平原散地】',
        desc: '利用散地天然的逃匿和无心死战惩罚，慢慢涣散沉稳老将的基层部曲。',
        actionType: 'SET_SCATTER',
        badge: '瓦解士卒',
        helpText: '点击锁定中军转移到【散地】。'
      },
      {
        label: '鸣金收兵：一键重整沙盘两军',
        desc: '双方精甲体力补给耗竭时，重置所有建置重新对弈。',
        actionType: 'RESET',
        badge: '重载兵息',
        helpText: '点击一键清空战损、满额拉回双方编制兵额。'
      }
    ]
  },
  '逍遥津奇袭': {
    assessment: '大魏疾风狂澜突击！奇袭部队侧翼爆破穿甲破坏力极速膨胀达 2.25 倍（225% 极限打击）！旦被突破偏师营地，瞬间主账崩裂，万劫不复。',
    threatLevel: 'CRITICAL',
    suggestedStrategy: '「遮蔽视野，瓮中设伏」。使用「难知如阴」彻底封锁其斥候探照网，令其致命奇兵失去斩首精度；或迁至「死地」，全军背水爆燃+30狂击对轰！',
    counterRating: '95% 胜机 (全军反阻击)',
    recommendedCounter: '开启敌御军「难知如阴」盲盒遮断，或诱其入「死地」以全军怒吼抗衡。',
    actions: [
      {
        label: '雾锁营道：开启敌军【难知如阴】',
        desc: '命三军暗布游骑干扰其长途斥候，遮蔽我军侧后弱防驻地。',
        actionType: 'TOGGLE_FEIGN_DEFEND',
        badge: '迷雾致盲',
        helpText: '点击让战场进入迷雾状态，使敌奇袭尖刀斩空，丧失奇兵奇锋。'
      },
      {
        label: '伏于绝境：中军退守入【死地】',
        desc: '背水一战（死地中两军均暴涨 30 基底攻力），以我军死士正面硬怼对撞其突袭。',
        actionType: 'SET_DEATH',
        badge: '决死相博',
        helpText: '点击将推演战场设为【死地】，唤醒背水怒气与奇兵血肉白刃对砍。'
      }
    ]
  },
  '虚实突击': {
    assessment: '深得避实击虚精髓！敌将依托正面高明莫测的佯攻妄动（示之形），正在令我正面守军处于精神极度紧绷、分散兵力的重创边沿（佯攻状态下其战力+20%）。',
    threatLevel: 'CRITICAL',
    suggestedStrategy: '「去伪存真，双向致盲」。派精骑直接强突斩其佯动大纛（重置佯攻状态），或对开「难知如阴」进入双方盲打拉大锯状态，完全抹平对方单向明视信息优势。',
    counterRating: '91% 胜机 (真幻皆破)',
    recommendedCounter: '强行解除其【示之形佯攻】伪装，或用「难知如阴」大雾同理遮天蔽日。',
    actions: [
      {
        label: '强派斥候：拆穿其【佯攻伪装】',
        desc: '斥候偏师硬撼交火核查，不被虚火假灶迷惑。',
        actionType: 'TOGGLE_FEIGN_ATTACK',
        badge: '直逼真身',
        helpText: '点击切换解除「示之形」，直接剥夺其 20% 的诡道攻打乘数加成。'
      },
      {
        label: '以毒攻毒：回敬敌方【难知如阴】',
        desc: '敌我双方均拉闸盲打。在迷雾下，敌方纵有多点佯攻也是盲人摸象。',
        actionType: 'TOGGLE_FEIGN_DEFEND',
        badge: '信息遮断',
        helpText: '点击启用难知如阴，使敌无法获取佯动视野优势。'
      }
    ]
  },
  '刚直廉洁': {
    assessment: '大将廉政洁德、顾惜羽毛过甚，常处于道德极端高点。但这在兵学《九变》中是极其狂暴易碎的软肋（可辱也，易激难克）。一旦激怒，拼死狂暴。',
    threatLevel: 'WARN',
    suggestedStrategy: '「言语极尽挑衅，诱出防御城防」。用妇人衣、侮辱词彻底激怒该将领，逼其鲁莽偏离险峻阵脚，或者将其赶至「散地」使其士卒潜逃溃败。',
    counterRating: '97% 胜机 (攻心大激将)',
    recommendedCounter: '点击激怒挑衅，迫其大将怒火攻心；或将推演地带推至「散地」分崩人心。',
    actions: [
      {
        label: '言语寻衅：诱使其【忿怒发誓】',
        desc: '将侮辱流言和嘲弄战报送入其中军大帐，极大扰乱其中军部署。',
        actionType: 'PROVOKE',
        badge: '心狂失策',
        helpText: '因刚不可折，诱使或逼迫大将提前进入出塞血斗，废弃山川要区。'
      },
      {
        label: '驱其下纛：切战局至【平原散地】',
        desc: '将其从誓死搏杀的必死死地驱离，在人心飘浮的散地彻底击沙。',
        actionType: 'SET_SCATTER',
        badge: '散地丧胆',
        helpText: '点击切入散地配合诱敌，使其在廉洁名德崩塌事件中引申兵卒遁走溃散。'
      }
    ]
  },
  '冲锋猛将': {
    assessment: '敌将武勇绝伦，持长槊纵横当面，白刃正攻冲击力额外狂掀 15% 怒势！甚至无须看天险水系，直接踏平高差仰攻惩罚。猛恶强压。',
    threatLevel: 'CRITICAL',
    suggestedStrategy: '「瓮中扣杀，决战死地」。既然其正面攻击力沛然不可挡且无视天险，便不可在平原地势与这猛将打消磨战，应当坚决布置于【死地】大火拼，凭我军死斗加成绞碎其锋线。',
    counterRating: '88% 胜机 (瓮城合围)',
    recommendedCounter: '将地盘置换为【死地】，并运用我方高统帅进行固防。',
    actions: [
      {
        label: '瓮城决死：逼战至【绝死死地】',
        desc: '拉近双方兵锋至决绝死地。我军悍卒借置于死地而复生的大怒气（+30点战力）将直接与猛将阵列正面绞肉碎骨。',
        actionType: 'SET_DEATH',
        badge: '绝境对决',
        helpText: '点击切换回【死地】，在兵狂相克中绞杀对战主力。'
      },
      {
        label: '以虚诱贪：开启【我军示之形】',
        desc: '伪造后翼大本营兵荒倒纛，诱使这憨猛大将偏离部曲大阵长驱直入，形成首尾断绝。',
        actionType: 'TOGGLE_FEIGN_ATTACK',
        badge: '诱捕脱节',
        helpText: '点击添加我方的佯装错判，使猛锋将孤军冒进拉长。'
      }
    ]
  }
};

const getRecommendedTerrain = (general: GeneralCharacter) => {
  if (general.traits.includes('刚直廉洁')) {
    return {
      type: 'DEATH' as const,
      reason: '【刚直廉洁】置之『死地』而能绝死求生、爆发出 130% 无双反击冲击力！而在『散地』军心浮散，士兵极易因间谋谣言溃逃。',
      zhTerrain: '死地'
    };
  }
  if (general.traits.includes('防守大师')) {
    return {
      type: 'SCATTERED' as const,
      reason: '【防守大师】可 100% 免疫『散地』带来的 -15% 天然士气松懈惩罚，借此开阔地势反越击虚、合围歼敌。',
      zhTerrain: '散地'
    };
  }
  if (general.traits.includes('冲锋猛将')) {
    return {
      type: 'DEATH' as const,
      reason: '【冲锋猛将】擅白刃破大阵。在『死地』攻势如虹，全军决死狂热更提 +30 攻击力。',
      zhTerrain: '死地'
    };
  }
  if (general.traits.includes('逍遥津奇袭')) {
    return {
      type: 'DEATH' as const,
      reason: '【逍遥津奇袭】利于背水一战。置之『死地』绝境猛攻，奇兵多路突陷、能爆发最高效穿透重伤。',
      zhTerrain: '死地'
    };
  }
  return {
    type: 'DEATH' as const,
    reason: '死地乃决死战地，两军战力齐增 +30 点，有利于主帅发挥最爆烈谋策搏命胜出。',
    zhTerrain: '死地'
  };
};

interface CombatLogProps {
  log: string;
  isLatest: boolean;
  flashClass: string;
}

const CombatLog: React.FC<CombatLogProps> = ({ log, isLatest, flashClass }) => {
  // Check for traits in the log
  const hasDefenseMaster = log.includes('防守大师') || log.includes('🛡️防守大师');
  const hasChargeGeneral = log.includes('冲锋猛将') || log.includes('⚔️精锐正兵冲锋');
  const hasXiaoyaojin = log.includes('逍遥津奇袭') || log.includes('⚡逍遥津奇谋');
  const hasFeignStrike = log.includes('虚实突击') || log.includes('💨佯动作战');
  
  // Check for flaws in the log
  const hasFlawWrath = log.includes('忿速出动失察') || log.includes('忿速');
  const hasFlawDeath = log.includes('绝之死战突围') || (log.includes('必死') && !log.includes('防守大师'));

  // Check for terrains in the log
  const hasDeathTerrain = log.includes('【死地】') || log.includes('死地');
  const hasScatteredTerrain = log.includes('【平原散地】') || log.includes('散地');

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border-l-2 pl-2 py-1.5 transition-all duration-300 rounded-r flex flex-col gap-1 ${flashClass}`} id={`combat-log-item-${log.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')}`}>
      <span className="text-[#1A1A1A]/85 leading-normal font-medium flex items-center gap-1.5">
        <ArrowRight className="w-3 h-3 text-[#1A1A1A]/40 shrink-0" />
        {log}
      </span>
      
      {/* Structural Mechanical Counterpart Details */}
      {(hasDefenseMaster || hasChargeGeneral || hasXiaoyaojin || hasFeignStrike || hasFlawWrath || hasFlawDeath || hasDeathTerrain || hasScatteredTerrain) && (
        <div className="flex flex-wrap gap-1.5 mt-0.5" id="combat-log-tactical-impact-badges">
          {hasDefenseMaster && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
              🛡️ 防守大师：反击时承受战损扣减 25%
            </span>
          )}
          {hasChargeGeneral && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
              ⚔️ 冲锋猛将：正兵白刃拼杀冲击穿透力狂掀 15%
            </span>
          )}
          {hasXiaoyaojin && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-amber-600/10 text-amber-900 border border-amber-600/20 px-1.5 py-0.5 rounded font-mono font-bold">
              ⚡ 逍遥津奇袭：合击侧翼爆破！奇兵威能急遽爆发 225%
            </span>
          )}
          {hasFeignStrike && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-blue-50 text-blue-800 border border-blue-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
              💨 虚实突击：佯攻形式下额外强占 20% 诡道极伤
            </span>
          )}
          {hasFlawWrath && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-red-50 text-red-800 border border-red-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
              ⚠️ 忿速：将领狂暴易怒偏航，攻击减速 30%
            </span>
          )}
          {hasFlawDeath && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-rose-50 text-rose-800 border border-rose-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
              🔥 必死：将领必死决绝，全兵搏命攻势掀高 30%
            </span>
          )}
          {hasDeathTerrain && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-[#8C2F39]/5 text-[#8C2F39] border border-[#8C2F39]/20 px-1.5 py-0.5 rounded font-mono font-bold">
              🏟️ 死地：双方增加 +30 攻击力 (背水绝境，战力狂放决死狂热)
            </span>
          )}
          {hasScatteredTerrain && (
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-sky-50 text-sky-800 border border-sky-100 px-1.5 py-0.5 rounded font-mono font-bold">
              🏟️ 散地：人心浮散，士气松懈，全军战力扣减 15点
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

const NINE_LANDS_DATA = [
  {
    id: 'SCATTERED',
    name: '散地',
    classicDesc: '孙子曰：本土作战，将士怀恋家室，其心易散。',
    advise: '散地则无战：此时不宜强决死战，当固结军心、谨防哗变，非防守大师莫动。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🔴 己方承受 -15 战力松泄惩罚（除非主帅持有「防守大师」特质）',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('防守大师')) {
        return {
          status: 'SUCCESS',
          badge: '天赐神契 (Perfect Mirror)',
          desc: '【防守大师】曹仁领军绝佳匹配！能 100% 豁免散地带来的 15 点大捷惩罚，人心固、三军静，此地反而成为诱敌深入的最佳防线。'
        };
      }
      if (gen.traits.includes('刚直廉洁')) {
        return {
          status: 'DANGER',
          badge: '溃崩凶咎 (Extreme Risk)',
          desc: '极险！【刚直廉洁】夏侯惇生性刚烈易在平地被敌激怒。由于士气不稳，一旦被敌反间挑衅，极易诱发多至 30% 偏师离散崩遁。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '人心易动 (Cohesion Debuff)',
        desc: '无特殊庇护，本阵士兵因驻留桑梓故土精神易涣。不建议在此死守，若敌进攻则宜多施阻击并逐步后移。'
      };
    }
  },
  {
    id: 'LIGHT',
    name: '轻地',
    classicDesc: '孙子曰：入人之地不深，将士恋乡，其心不一，退意未绝。',
    advise: '轻地则无止：万莫流连扎营。当急行而过，或以游变斥候紧咬敌军侧翼，保持战力敏捷。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '⚡ 军心处于试探期，若无虚实突击，攻势折损 5 点',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('虚实突击')) {
        return {
          status: 'SUCCESS',
          badge: '奇行良配 (Tactically Advantaged)',
          desc: '张辽持【虚实突击】生克轻地。他可佯败佯攻，在敌退避之际多重劫掠骚扰，获取额外 10 点诡战机动加成。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '平庸移军 (Normal March)',
        desc: '本帅统御一般。前哨虽接、但主力意志不一，应速进勿留，以利占据咽喉高地。'
      };
    }
  },
  {
    id: 'CONTENTIOUS',
    name: '争地',
    classicDesc: '孙子曰：我得亦利，彼得亦利，兵家不相让之险关隘枢。',
    advise: '争地无攻：敌若已得，断不可直面强攻；当施诡谋牵引其退，或以侧翼伏兵使其腹背受袭。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🛡️ 防御方获 +35 坚城避伤，若无突袭突防强攻则扣减 10 点',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('防守大师')) {
        return {
          status: 'SUCCESS',
          badge: '巨阙据守 (Fortress Synergy)',
          desc: '坚城如铁。曹仁领衔一旦先行夺下争地，依托【防守大师】和重盾防线，可发挥数倍抗击爆发，一夫当关，万夫莫开。'
        };
      }
      if (gen.traits.includes('逍遥津奇袭') || gen.traits.includes('冲锋猛将')) {
        return {
          status: 'SUCCESS',
          badge: '电击疾夺 (Assault Preemption)',
          desc: '疾电一击！【逍遥津奇袭】或【冲锋猛将】长驱先发，能借猛冲锐度消弭要塞天险并强行获取 +20 攻坚加成。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '两虎拉锯 (Contested Status)',
        desc: '此地攻坚极难。若敌据守，强攻损失极大，需精擅微操与多兵种合击击其懈。'
      };
    }
  },
  {
    id: 'FACILE',
    name: '交地',
    classicDesc: '孙子曰：我不可以无路行，彼不可以无路来。道路交纵，两军均行方便。',
    advise: '交地无绝：大野平川，阵线易被分割。宜广设壁垒守备，确保侧后无后顾之忧。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '⚔️ 沙场平原拼正兵白刃，冲锋猛将战力狂飙升 25 点',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('冲锋猛将')) {
        return {
          status: 'SUCCESS',
          badge: '虎狼奔啸 (Charge Supremacy)',
          desc: '沙原平野极其有利于【冲锋猛将】夏侯惇。万马齐奔！正兵冲突威力获得基底 25 点狂掀加成，击破敌阵前锋防守。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '硬仗拉锯 (Direct Engagement)',
        desc: '两军中原鏖战。平野缺乏伏击点。将领指挥（Command）与训练（Training）在此起决定性作用，胜在扎实。'
      };
    }
  },
  {
    id: 'FOCAL',
    name: '衢地',
    classicDesc: '孙子曰：诸侯之地三通，先至而得天下之助者。诸国辐辏。',
    advise: '衢地合交：多谋外连、广设暗间、安抚周边各路客军，巧借盟军形成合击之势。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🤝 四通八达，极考验将领智谋。智将统军攻势提升 20 点',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.tactics >= 80) {
        return {
          status: 'SUCCESS',
          badge: '盟好智帅 (Strategic Alliance)',
          desc: '大才运筹。主帅奇计高达 {gen.tactics}，能够熟稔合纵连横，诱致敌军周边失序，增加 20 点奇谋成算。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '独木难支 (No Inter-Ally Buff)',
        desc: '主帅声名与合众手腕中规中矩，若无盟军呼应易遭敌多方合围。'
      };
    }
  },
  {
    id: 'HEAVY',
    name: '重地',
    classicDesc: '孙子曰：入人之地深，背城邑多，人马疲累，粮草全凭异地强断。',
    advise: '重地则掠：孤军涉险不可长驻。当借道夺其粮，或以极其刁钻的奇兵捣毁其屯粮险奥处。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🌾 深入敌境粮运艰难。除非持有奇袭特质，否则攻势承受 -15 拖累惩罚',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('逍遥津奇袭')) {
        return {
          status: 'SUCCESS',
          badge: '乌巢奇袭 (Surgical Supply Raid)',
          desc: '孤注奇锋！张辽【逍遥津奇袭】能乘重地乱象，对敌军防备薄弱处打出爆发攻袭，斩获粮秣辎重，化解危机并获 25 点攻势加成。'
        };
      }
      if (gen.traits.includes('沉稳老将')) {
        return {
          status: 'DANGER',
          badge: '迟滞遇阻 (Tactical Attrition)',
          desc: '谨慎将领深感忌惮！重地决战不利于久拖防御。由于过于持重，粮道受制，全军攻势受累削减 5 点。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '强弩孤军 (Unsupported Penetration)',
        desc: '深入虎穴。无稳妥退路，此后唯有连续保持高额攻破方可弥补孤悬负荷。'
      };
    }
  },
  {
    id: 'ENTRAPPING',
    name: '圮地',
    classicDesc: '孙子曰：山林、险阻、沮泽、凡难行、滞足而欲陷之泥涝。',
    advise: '圮地则行：行军不可怠慢。利用轻骑开道，坚盾收尾，一气通过，切忌在此旷日缠斗。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🌧️ 泥泞重涝导致全军机动退化。攻势削减 20 点（除非特质免除）',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('冲锋猛将')) {
        return {
          status: 'SUCCESS',
          badge: '踏平坎坷 (All-Terrain Charge)',
          desc: '【冲锋猛将】夏侯惇凭借霸绝猛力，可以彻底无视斜坡、深泽所带来的行军负荷，硬性维持前冲，在泥涝中斩获 10 点加成。'
        };
      }
      if (gen.traits.includes('沉稳老将')) {
        return {
          status: 'SUCCESS',
          badge: '步步设营 (Cautious Exploration)',
          desc: '老谋深算。曹仁以持重防守见长，在此地安设地基、步步为营，完美免除泥泞行军的攻防降星惩罚，战力归零。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '身陷足泥 (Muddy Disadvantage)',
        desc: '军马践踏泥淖。行军阻滞且极难运动，受累削减 20 点攻势强度。'
      };
    }
  },
  {
    id: 'FRONTIER',
    name: '围地',
    classicDesc: '孙子曰：进道狭隘，出路迂远，敌可以少数兵马扼杀我精甲万师。',
    advise: '围地则谋：狭关难退当用诡智。用空城计或佯降诱其骄，使其暴露出唯一的包抄缺口。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🛡️ 守城防御大幅拔高 40 点；奇袭奇击反伏击则有 25 点加权',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('防守大师')) {
        return {
          status: 'SUCCESS',
          badge: '天门重锁 (Unbreakable Defile)',
          desc: '神迹契合！【防守大师】曹仁依托狭道高墙结成盾阵。即使数万军团黑云压城，守御高垒稳健加防 40 点！'
        };
      }
      if (gen.traits.includes('虚实突击')) {
        return {
          status: 'SUCCESS',
          badge: '乱真诡谲 (Ambush Trigger)',
          desc: '奇诡！张辽【虚实突击】在此可用佯败佯攻在隘道内反设伏兵，诱使敌军先头部队在死角覆灭，获取 25 点奇袭伤害。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '困兽犹斗 (Narrow Entrapment)',
        desc: '狭窄走地。极度检验阵型的反包抄刺。若强行硬撼，攻势默认扣减 10 点。'
      };
    }
  },
  {
    id: 'DEATH',
    name: '死地',
    classicDesc: '孙子曰：疾战则存，不疾战则亡。无复有归，置之死地而生之绝境。',
    advise: '死地则战：士卒断绝生还之想。当焚舟碎釜，借血光之灾迫使三军爆发最大哀兵之威。',
    activeStatus: 'ACTIVE_AVAILABLE',
    effectText: '🟢 两军步入搏命大狂死，攻防各自强行飙增 30 点爆响伤害（极速减员！）',
    synergyFormula: (gen: GeneralCharacter) => {
      if (gen.traits.includes('刚直廉洁')) {
        return {
          status: 'SUCCESS',
          badge: '刚直死仇 (Undying Rage)',
          desc: '完美死狂！【刚直廉洁】夏侯惇于『死地』能百分百触发。激发大限超越死生暴动，反击伤害狂掀至基准的 130%！'
        };
      }
      if (gen.traits.includes('逍遥津奇袭')) {
        return {
          status: 'SUCCESS',
          badge: '背水强斩 (Desperate Breakthrough)',
          desc: '张辽持【逍遥津奇袭】于死地狂杀。他能利用士兵破釜之怒，强行将奇兵穿透几率撕开缺口，造成巨幅灭敌大捷。'
        };
      }
      return {
        status: 'NEUTRAL',
        badge: '破釜哀兵 (Desperate Combat)',
        desc: '置其死地，两军拼至精疲力尽。攻击全开但全无守备。此地可打出最血腥、战损数字成万攀升的极端乱战结果。'
      };
    }
  }
];

interface MilitarySandboxProps {
  activeCardId?: string | null;
}

export default function MilitarySandbox({ activeCardId = null }: MilitarySandboxProps) {
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [generals, setGenerals] = useState<GeneralCharacter[]>([
    { name: '曹仁 (前锋主将)', command: 85, bravery: 70, tactics: 65, training: 80, flaw: '必生', traits: ['防守大师', '沉稳老将'] },
    { name: '张辽 (奇兵统帅)', command: 80, bravery: 92, tactics: 88, training: 75, flaw: '必死', traits: ['逍遥津奇袭', '虚实突击'] },
    { name: '夏侯惇 (城守大将)', command: 75, bravery: 85, tactics: 55, training: 70, flaw: '忿速', traits: ['刚直廉洁', '冲锋猛将'] },
  ]);

  const [selectedGenIndex, setSelectedGenIndex] = useState<number>(1); // Zhang Liao by default
  const [activeTrait, setActiveTrait] = useState<string | null>('逍遥津奇袭'); // Default show zhang liao trait log
  const [modalTrait, setModalTrait] = useState<string | null>(null); // Interactive modal detail view
  
  const [combat, setCombat] = useState<CombatState>({
    attackerRegular: 3000,
    attackerSurprise: 1500,
    defenderRegular: 3500,
    defenderSurprise: 500,
    terrain: 'DEATH', // Death ground gives attack bonus but locked
    weather: 'CLEAR',
    generalFlawTriggered: false,
    history: [
      '【始计评估】战旗已立。我军排置：3000 正兵当面牵制，1500 奇兵长途迂回绕后。',
      '敌我盘踞于【死地】（孙子曰：疾战则存，不疾战则亡。战力飙增）。'
    ]
  });

  const [feignedState, setFeignedState] = useState<{feignAttacker: boolean; feignDefender: boolean}>({
    feignAttacker: false,
    feignDefender: false
  });

  const [morale, setMorale] = useState<number>(85); // 0 - 100

  const [showNineLandsOverlay, setShowNineLandsOverlay] = useState<boolean>(false);
  const [handbookTerrainId, setHandbookTerrainId] = useState<string | null>(null);

  const [latestImpact, setLatestImpact] = useState<{
    type: 'attack' | 'defend' | 'flaw' | null;
    impactText: string;
    key: number;
  }>({
    type: null,
    impactText: '',
    key: 0
  });

  // Advisor action dynamics
  const handleAdvisorAction = (actionType: string) => {
    switch (actionType) {
      case 'SET_SCATTER':
        setCombat(p => ({
          ...p,
          terrain: 'SCATTERED',
          history: [
            `🧠 兵策军师：敌方大阵偏重特质发挥，建议主动换撤回【平原散地】，以拖损其据守天险加害！`,
            ...p.history
          ]
        }));
        break;
      case 'SET_DEATH':
        setCombat(p => ({
          ...p,
          terrain: 'DEATH',
          history: [
            `🧠 兵策军师：战术研判无误，中军前卫发起佯攻。成功诱敌进驻【死地】，激荡两翼兵将决死战意！`,
            ...p.history
          ]
        }));
        break;
      case 'TOGGLE_FEIGN_ATTACK': {
        const next = !feignedState.feignAttacker;
        setFeignedState(p => ({ ...p, feignAttacker: next }));
        setCombat(c => ({
          ...c,
          history: [
            next
              ? `🧠 兵策军师：大纛招展！启动【示之形佯攻】，虚晃一招致其防线兵力两分！`
              : `🧠 兵策军师：撤销【示之形】伪装，虚实合一，大魏大本营正兵收缩归队稳守。`,
            ...c.history
          ]
        }));
        break;
      }
      case 'TOGGLE_FEIGN_DEFEND': {
        const next = !feignedState.feignDefender;
        setFeignedState(p => ({ ...p, feignDefender: next }));
        setCombat(c => ({
          ...c,
          history: [
            next
              ? `🧠 兵策军师：命斥候封锁山口，启动【难知如阴】雾防！敌长驱奇兵彻底丧失刺点！`
              : `🧠 兵策军师：云散迷雾，敌我双方营马游击再归通透对射。`,
            ...c.history
          ]
        }));
        break;
      }
      case 'PROVOKE':
        handleProvoke();
        break;
      case 'RESET':
        handleReset();
        break;
      default:
        break;
    }
  };

  // Morale calculations
  const getMoraleCategory = (m: number) => {
    if (m >= 80) return { name: '锐气', bonus: 0.25, desc: '避其锐气，击其惰归。战力+25%' };
    if (m >= 40) return { name: '惰气', bonus: 0.00, desc: '两军相持，战力无起伏' };
    return { name: '归气', bonus: -0.30, desc: '归师勿遏。士气瓦解，战力-30%' };
  };

  const currentMorale = getMoraleCategory(morale);

  const handleFeignAction = (side: 'ATTACKER' | 'DEFENDER') => {
    if (side === 'ATTACKER') {
      setFeignedState(p => ({ ...p, feignAttacker: !p.feignAttacker }));
      setCombat(p => ({
        ...p,
        history: [`💨 虚实布控：我方伪造营火及旌旗声势。敌防攻防感知误差扩大至 ±50%！（“虚实佯动”特质增幅就绪）`, ...p.history]
      }));
    } else {
      setFeignedState(p => ({ ...p, feignDefender: !p.feignDefender }));
      setCombat(p => ({
        ...p,
        history: [`👁️ 敌方隐蔽：敌阵突然偃旗息鼓。我军极难看清其真假（对方发动“虚实难测”）。`, ...p.history]
      }));
    }
  };

  const handleProvoke = () => {
    sfx.playMagic();
    const general = generals[selectedGenIndex];
    if (general.traits.includes('沉稳老将')) {
      setCombat(p => ({
        ...p,
        history: [`🛡️ 【沉稳老将】神威：${general.name} 深藏兵道不怒。敌使虽极尽挑衅羞侮，主帅安之若素，据关死守，不受忿怒之危！`, ...p.history]
      }));
    } else if (general.flaw === '忿速') {
      setCombat(p => ({
        ...p,
        generalFlawTriggered: true,
        history: [`🔥 挑衅成功！敌使递送巾帼妇人之衣并嘲讽。夏侯惇将军性格【忿速】，暴怒，立即挥师强行冲锋出城，丧失了【死地】天险加成！`, ...p.history]
      }));
    } else if (general.flaw === '必死') {
      setCombat(p => ({
        ...p,
        generalFlawTriggered: true,
        history: [`🔥 性格暴露！ ${general.name} 将军性格【必死】，被军报合围吓退失败，反激起死地狂暴。强击+30%！`, ...p.history]
      }));
    } else {
      setCombat(p => ({
        ...p,
        history: [`🛡️ 挑衅无效：${general.name} 将军深藏兵法底盘，安之若素，闭城拒绝应战。`, ...p.history]
      }));
    }
  };

  const handleSimulateTurn = () => {
    const general = generals[selectedGenIndex];
    let attReg = combat.attackerRegular;
    let attSur = combat.attackerSurprise;
    let defReg = combat.defenderRegular;
    let defSur = combat.defenderSurprise;

    let combatLog = '';

    // Modifiers based on Interactive Traits
    let traitAttRegMult = 1.0;
    let traitAttSurMult = 1.5;
    let traitDefenseRed = 1.0;
    let traitFeignBonus = 1.0;

    if (general.traits.includes('冲锋猛将')) {
      traitAttRegMult = 1.15; // Positive regular modifier (+15% damage)
    }
    if (general.traits.includes('逍遥津奇袭')) {
      traitAttSurMult = 2.25; // Massive surprise damage
    }
    if (general.traits.includes('防守大师')) {
      traitDefenseRed = 0.75; // Suffer 25% less damage during counter-attack
    }
    if (general.traits.includes('虚实突击') && feignedState.feignAttacker) {
      traitFeignBonus = 1.20; // 20% bonus dmg under fake deployment
    }

    // Nine Lands terrain multiplier
    let terrainBonusAtt = 0;
    let terrainBonusDef = 0;
    
    switch (combat.terrain) {
      case 'DEATH':
        terrainBonusAtt = 30; // 死地战力+30
        terrainBonusDef = 30;
        break;
      case 'SCATTERED':
        if (general.traits.includes('防守大师')) {
          terrainBonusAtt = 0; // 防守大师豁免散地士气散逸
          terrainBonusDef = 10; // 甚至获得地利稳固加成
        } else {
          terrainBonusAtt = -15; // 散地士气衰退
        }
        break;
      case 'LIGHT':
        if (general.traits.includes('虚实突击')) {
          terrainBonusAtt = 10; // 虚实突击擅长轻地游袭
        } else {
          terrainBonusAtt = -5; // 稍显迟滞
        }
        break;
      case 'CONTENTIOUS':
        terrainBonusDef = 35; // 关隘要塞守备加成
        if (general.traits.includes('逍遥津奇袭') || general.traits.includes('冲锋猛将')) {
          terrainBonusAtt = 20; // 奇袭/猛冲能夺取要塞
        } else {
          terrainBonusAtt = -10; // 强攻困难
        }
        break;
      case 'FACILE':
        if (general.traits.includes('冲锋猛将')) {
          terrainBonusAtt = 25; // 冲锋战力爆发
        } else {
          terrainBonusAtt = 5;
        }
        break;
      case 'FOCAL':
        if (general.tactics >= 80) {
          terrainBonusAtt = 20; // 智谋高深，诱客军外援
        } else {
          terrainBonusAtt = 5;
        }
        break;
      case 'HEAVY':
        if (general.traits.includes('逍遥津奇袭')) {
          terrainBonusAtt = 25; // 乌巢劫粮大捷
        } else {
          terrainBonusAtt = -15; // 深入重地负运承损
        }
        break;
      case 'ENTRAPPING':
        if (general.traits.includes('冲锋猛将')) {
          terrainBonusAtt = 10; // 冲锋悍克泥水
        } else if (general.traits.includes('沉稳老将')) {
          terrainBonusAtt = 0; // 步步为营安然无损
        } else {
          terrainBonusAtt = -20; // 圮地水陆险阻泥水阻滞
        }
        break;
      case 'FRONTIER':
        if (general.traits.includes('防守大师')) {
          terrainBonusDef = 40; // 隘口极易封锁阻击
        } else if (general.traits.includes('虚实突击')) {
          terrainBonusAtt = 25; // 利用狭道多处埋伏
        } else {
          terrainBonusAtt = -10; // 出路迂远，不宜决战
        }
        break;
      default:
        break;
    }

    // General Flaw multipliers
    let flawMult = 1.0;
    if (combat.generalFlawTriggered) {
      if (general.flaw === '忿速') flawMult = 0.7; // bad move
      if (general.flaw === '必死') flawMult = 1.3; // extreme violent outcome
    }

    // Morale bonus
    const moraleFactor = 1.0 + currentMorale.bonus;

    // Baseline calculation (without traits/flaws active) to quantify specific influence
    const baseAttPower = Math.round((((attReg * 1.00) + (attSur * 1.50)) * (general.tactics / 100) * 1.00 * moraleFactor * 1.0) / 10);
    const baseDefPower = Math.round(((defReg + (defSur * 1.2)) * 0.7) / 10);
    const baseAttLoss = Math.max(100, Math.round(baseDefPower * (1.1 - (general.command / 100)) * 1.0));
    const baseDefLoss = Math.max(100, Math.round(baseAttPower * 1.2));

    // Simulate casual battle with traits factored in. Factoring in specific terrain bonus/penalty in real-time!
    const attPower = Math.max(10, Math.round((((attReg * traitAttRegMult) + (attSur * traitAttSurMult)) * (general.tactics / 100) * flawMult * moraleFactor * traitFeignBonus) / 10) + terrainBonusAtt);
    const defPower = Math.max(10, Math.round(((defReg + (defSur * 1.2)) * 0.7) / 10) + terrainBonusDef);

    const attLoss = Math.max(100, Math.round(defPower * (1.1 - (general.command / 100)) * traitDefenseRed));
    const defLoss = Math.max(100, Math.round(attPower * 1.2));

    const nextAttReg = Math.max(0, attReg - Math.round(attLoss * 0.7));
    const nextAttSur = Math.max(0, attSur - Math.round(attLoss * 0.3));
    const nextDefReg = Math.max(0, defReg - Math.round(defLoss * 0.8));
    const nextDefSur = Math.max(0, defSur - Math.round(defLoss * 0.2));

    let traitEffectsLog = '';
    if (general.traits.includes('防守大师')) {
      traitEffectsLog += `[🛡️防守大师减损 25%]`;
    }
    if (general.traits.includes('冲锋猛将')) {
      traitEffectsLog += `[⚔️精锐正兵冲锋穿透力提升]`;
    }
    if (general.traits.includes('逍遥津奇袭')) {
      traitEffectsLog += `[⚡逍遥津奇谋合击爆发]`;
    }
    if (general.traits.includes('虚实突击') && feignedState.feignAttacker) {
      traitEffectsLog += `[💨佯动作战佯虚击实]`;
    }

    combatLog = `⚔️ 决战拼杀：【${general.name}】领军发起冲击。${traitEffectsLog} 我军造成敌方损失约 ${defLoss} 人。我军受挫损耗降低折算承受 ${attLoss} 人。`;

    // Dynamic numeric and visual impact popup calculation
    let impactType: 'attack' | 'defend' | 'flaw' | null = null;
    let impactText = '';
    const extraDamageDealt = defLoss - baseDefLoss;
    const damageSaved = baseAttLoss - attLoss;

    if (extraDamageDealt > 80) {
      impactType = 'attack';
      impactText = `💥 奇攻大捷! 额外造成伤敌 +${extraDamageDealt}`;
    } else if (damageSaved > 30) {
      impactType = 'defend';
      impactText = `🛡️ 坚防御矢! 少折损兵额 -${damageSaved}`;
    } else if (combat.generalFlawTriggered && flawMult !== 1.0) {
      impactType = 'flaw';
      if (general.flaw === '忿速') {
        const flawLoss = baseDefLoss - defLoss;
        impactText = `⚠️ 忿速出动失察! 战损衰减 -${flawLoss}`;
      } else if (general.flaw === '必死') {
        const deathSurp = defLoss - baseDefLoss;
        impactText = `🔥 绝之死战突围! 斩首强化 +${deathSurp}`;
      }
    }

    if (impactType) {
      setLatestImpact({
        type: impactType,
        impactText,
        key: Date.now()
      });
    } else {
      setLatestImpact({
        type: null,
        impactText: '',
        key: Date.now()
      });
    }

    setCombat(p => ({
      ...p,
      attackerRegular: nextAttReg,
      attackerSurprise: nextAttSur,
      defenderRegular: nextDefReg,
      defenderSurprise: nextDefSur,
      history: [combatLog, ...p.history].slice(0, 6)
    }));

    // Morale decay
    setMorale(prev => Math.max(10, prev - 8));
    
    sfx.playImpact();
    sfx.playSword();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleReset = () => {
    sfx.playSelect();
    const recommended = getRecommendedTerrain(generals[selectedGenIndex]);
    setCombat({
      attackerRegular: 3000,
      attackerSurprise: 1500,
      defenderRegular: 3500,
      defenderSurprise: 500,
      terrain: recommended.type,
      weather: 'CLEAR',
      generalFlawTriggered: false,
      history: [
        `【重置演武】双方齐整兵力。依据当前主帅特质，已重设最合天利地利之【${recommended.zhTerrain}】主战场。`,
        '【重置演武】双方齐整兵力。战鼓再燃，回到中原大局。'
      ]
    });
    setMorale(90);
    setFeignedState({ feignAttacker: false, feignDefender: false });
  };

  const selectedGen = generals[selectedGenIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (combat.attackerRegular > 0) {
          handleSimulateTurn();
        }
      } else if (e.code === 'KeyP') {
        handleProvoke();
      } else if (e.code === 'KeyR') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combat.attackerRegular, handleSimulateTurn, handleProvoke, handleReset]);

  return (
    <div 
      className={`bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A] ${isShaking ? 'animate-shake' : ''}`} 
      id="military-sandbox-root"
      onClick={() => sfx.init()}
    >
      <style>{`
        @keyframes fadeUpOut {
          0% { transform: translate(0, 15px); opacity: 0; }
          15% { transform: translate(0, -6px); opacity: 1; }
          80% { transform: translate(0, -12px); opacity: 1; }
          100% { transform: translate(0, -26px); opacity: 0; }
        }
        @keyframes greenFlash {
          0% { background-color: rgba(16, 185, 129, 0.22); border-left-color: #10B981 !important; }
          100% { background-color: transparent; }
        }
        @keyframes redFlash {
          0% { background-color: rgba(239, 68, 68, 0.18); border-left-color: #EF4444 !important; }
          100% { background-color: transparent; }
        }
        @keyframes goldFlash {
          0% { background-color: rgba(245, 158, 11, 0.2); border-left-color: #F59E0B !important; }
          100% { background-color: transparent; }
        }
        .animate-fade-up-out {
          animation: fadeUpOut 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-green-flash {
          animation: greenFlash 1.8s ease-out forwards;
        }
        .animate-red-flash {
          animation: redFlash 1.8s ease-out forwards;
        }
        .animate-gold-flash {
          animation: goldFlash 1.8s ease-out forwards;
        }
      `}</style>
      <div className="flex justify-between items-center mb-6 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <Swords className="text-[#8C2F39] w-5 h-5 font-bold" />
            【军事演】奇正虚实战役推演沙盒
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            孙子第六篇《虚实》与第七篇《军争》印证：以奇击虚，避锐击惰，洞悉将领性格缺陷与特质增效。
          </p>
        </div>
        <span className="text-xs border border-[#1A1A1A]/15 px-2 py-1 text-[#8C2F39] font-mono rounded bg-white/50 backdrop-blur-xs font-bold shadow-xs">
          GDD 模块 06, 07 · 交互实验室
        </span>
      </div>

      {activeCardId && (
        <div className="mb-4 bg-[#8C2F39]/5 border border-[#8C2F39]/30 p-3 rounded flex items-center justify-between text-xs animate-pulse text-[#8C2F39] font-serif">
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
                  ? '大破敌方本阵，奇袭战术破坏力和正兵主力白刃突刺杀伤力自动获得 +35% 兵略倍乘！' 
                  : '副帅正持此兵法偏殿协佐，各路营卫士气大振，战损抗性提升。'}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] bg-[#8C2F39] text-[#F5F2ED] px-2 py-0.5 rounded font-black uppercase tracking-wider">加持中</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Commander Card Selection */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-mono text-[#1A1A1A]/80 uppercase tracking-widest border-b border-[#1A1A1A]/15 pb-1.5 font-bold">
            军账拜将（主帅特质选）
          </h3>

          <div className="space-y-2">
            {generals.map((gen, idx) => (
              <button
                key={gen.name}
                id={`general-card-${idx}`}
                onClick={() => {
                  setSelectedGenIndex(idx);
                  // Automatically set active trait to the first trait of this general for immediate focus
                  if (gen.traits.length > 0) {
                    setActiveTrait(gen.traits[0]);
                  }
                  const recommended = getRecommendedTerrain(gen);
                  setCombat(p => ({
                    ...p,
                    generalFlawTriggered: false,
                    terrain: recommended.type,
                    history: [
                      `💂 将领更替：【${gen.name}】于中军置地受篆，战术属性重载。`,
                      `🗺️ 自动调阵：根据本谋，主阵地已自适应变调至最称手之【${recommended.zhTerrain}】！`,
                      ...p.history
                    ].slice(0, 7)
                  }));
                }}
                className={`w-full p-3 text-left rounded border transition-all cursor-pointer ${
                  selectedGenIndex === idx
                    ? 'bg-[#8C2F39]/5 border-[#8C2F39] shadow-sm'
                    : 'bg-white/50 border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-serif font-bold ${selectedGenIndex === idx ? 'text-[#8C2F39]' : 'text-[#1A1A1A]'}`}>{gen.name}</span>
                  <span className="text-[10px] bg-[#8C2F39]/10 text-[#8C2F39] border border-[#8C2F39]/20 px-1 rounded font-mono font-bold">
                    弱点: {gen.flaw}
                  </span>
                </div>

                {/* Attributes display */}
                <div className="grid grid-cols-4 gap-1 text-[10px] text-[#1A1A1A]/70 font-mono mt-2 border-b border-dashed border-black/5 pb-2">
                  <div>统帅: <strong className="text-[#1A1A1A] font-bold">{gen.command}</strong></div>
                  <div>猛勇: <strong className="text-[#1A1A1A] font-bold">{gen.bravery}</strong></div>
                  <div>奇计: <strong className="text-[#1A1A1A] font-bold">{gen.tactics}</strong></div>
                  <div>练兵: <strong className="text-[#1A1A1A] font-bold">{gen.training}</strong></div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {gen.traits.map(t => {
                    const isCurrentActive = activeTrait === t;
                    return (
                      <span
                        key={t}
                        id={`trait-badge-${t}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTrait(t);
                          setModalTrait(t);
                          // Also make sure parent general is selected if trait clicked
                          if (selectedGenIndex !== idx) {
                            setSelectedGenIndex(idx);
                          }
                        }}
                        className={`text-[8px] font-sans font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 border relative group ${
                          isCurrentActive
                            ? 'bg-[#8C2F39] text-[#F5F2ED] border-[#8C2F39] scale-105 shadow-sm'
                            : 'bg-white/90 text-[#1A1A1A]/75 hover:bg-[#8C2F39]/10 hover:text-[#8C2F39] border-[#1A1A1A]/10'
                        }`}
                      >
                        ⚡ {t}

                        {/* Interactive Hover Tooltip */}
                        {TRAIT_DETAILS[t] && (
                          <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 delay-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 bg-[#FAF8F5] border border-[#8C2F39] text-[#1A1A1A] text-[10px] rounded-md shadow-md w-48 sm:w-56 z-50 pointer-events-none text-left font-normal flex flex-col gap-1.5 leading-snug">
                            <span className="font-serif font-black text-[#8C2F39] border-b border-[#8C2F39]/15 pb-1 flex items-center justify-between">
                              <span>{TRAIT_DETAILS[t].name}</span>
                              <span className="text-[8px] bg-[#8C2F39]/10 px-1 rounded uppercase tracking-wider font-mono font-bold">
                                {TRAIT_DETAILS[t].badge.split(' ')[0]}
                              </span>
                            </span>
                            <span className="font-serif italic text-stone-600 block leading-normal">
                              {TRAIT_DETAILS[t].effect}
                            </span>
                            <span className="font-mono bg-[#8C2F39]/5 text-[#8C2F39] p-1 rounded text-[9px] border border-[#8C2F39]/10 block font-semibold font-bold">
                              ⚖️ {TRAIT_DETAILS[t].logic}
                            </span>
                            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#8C2F39]" />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </button>
            ))}
          </div>

          {/* Scribe scroll for active trait */}
          <div className="bg-[#FAF8F5] border border-[#1A1A1A]/15 rounded p-3.5 shadow-xs relative overflow-hidden transition-all duration-300">
            <div className="absolute -top-10 -right-10 bg-[#8C2F39]/5 text-[#8C2F39] text-7xl font-serif font-black select-none pointer-events-none transform rotate-12 opacity-35">
              {activeTrait ? activeTrait.substring(0, 1) : '策'}
            </div>

            {activeTrait && TRAIT_DETAILS[activeTrait] ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center border-b border-dashed border-[#1A1A1A]/15 pb-1.5">
                  <span className="text-[10px] font-mono text-[#8C2F39] font-black uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#8C2F39]" />
                    兵道特质手记
                  </span>
                  <button 
                    onClick={() => setActiveTrait(null)}
                    className="text-[10px] text-[#1A1A1A]/40 hover:text-red-700 font-mono font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-serif font-black text-[#1A1A1A] flex items-center gap-1.5">
                    <span className="bg-[#8C2F39] text-[#F5F2ED] text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                      {TRAIT_DETAILS[activeTrait].badge}
                    </span>
                    {TRAIT_DETAILS[activeTrait].name}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-[#1A1A1A]/80 font-serif mt-1 font-medium italic">
                    特点描述: {TRAIT_DETAILS[activeTrait].effect}
                  </p>
                </div>

                <div className="bg-white/85 p-2 rounded border border-[#1A1A1A]/5 text-[10px] font-mono space-y-1">
                  <div className="text-[9px] text-[#8C2F39] font-bold">● 【兵道公式赋益】</div>
                  <div className="text-[#1A1A1A]/90 text-[10px] sm:text-xs leading-relaxed">{TRAIT_DETAILS[activeTrait].logic}</div>
                  <div className="text-[#5A5A40] text-[9px] font-semibold bg-neutral-100 p-1 rounded mt-1 font-mono">
                    算法公式: {TRAIT_DETAILS[activeTrait].formula}
                  </div>
                </div>

                <button
                  id={`expand-trait-detail-${activeTrait}`}
                  onClick={() => setModalTrait(activeTrait)}
                  className="w-full bg-[#8C2F39]/10 hover:bg-[#8C2F39]/20 text-[#8C2F39] text-[10px] sm:text-xs font-mono font-bold py-1.5 px-3 border border-[#8C2F39]/20 rounded transition flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-[#8C2F39]" />
                  展开此特质深度推演剖析
                </button>

                <div className="pt-2 border-t border-dashed border-[#1A1A1A]/10 text-right">
                  <p className="text-[11px] text-[#8C2F39] font-serif italic text-left">
                    {TRAIT_DETAILS[activeTrait].quote}
                  </p>
                  <span className="text-[8px] text-[#1A1A1A]/50 font-mono bg-stone-100 px-1 py-0.5 rounded mt-1 inline-block">
                    {TRAIT_DETAILS[activeTrait].chapter}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[11px] text-[#1A1A1A]/40 font-serif italic space-y-1">
                <HelpCircle className="w-5 h-5 mx-auto text-[#1A1A1A]/20" />
                <p>点击上方将领特质标签</p>
                <p>在此拆解该特质对局势计算的实质增益公式</p>
              </div>
            )}
          </div>

          {/* Morale Control */}
          <div className="bg-white/60 rounded border border-[#1A1A1A]/15 p-3 shadow-xs">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-[#1A1A1A]/70">两军士气波幅：</span>
              <span className="text-[#8C2F39] font-bold">{morale} 士气点</span>
            </div>
            
            <input
              type="range"
              id="morale-range-input"
              min="10"
              max="100"
              value={morale}
              onChange={(e) => setMorale(Number(e.target.value))}
              className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-lg appearance-none cursor-pointer accent-[#8C2F39]"
            />

            <div className="text-[10px] text-[#1A1A1A]/70 mt-2 font-mono font-serif">
              <strong>当前段位:</strong> {currentMorale.name} <br />
              <span className="text-[#1A1A1A]/60 italic">{currentMorale.desc}</span>
            </div>
          </div>
        </div>

        {/* Real Battle Arena */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 flex flex-col justify-between shadow-xs">
            {/* Top Stat row: True vs Feigned details */}
            <div className="grid grid-cols-2 gap-4 border-b border-[#1A1A1A]/10 pb-3 mb-3">
              {/* Attacker panel */}
              <div id="attacker-stats-panel" className="space-y-1">
                <span className="text-[10px] font-mono text-[#5A5A40] uppercase tracking-widest flex items-center gap-1 font-bold">
                  <span className="w-2.5 h-2.5 bg-[#5A5A40] rounded-full inline-block"></span>
                  大魏远征军 (我方)
                </span>
                
                <div className="text-xs font-mono">
                  真：正兵 <motion.strong key={combat.attackerRegular} initial={{ scale: 1.5, color: '#EF4444' }} animate={{ scale: 1, color: '#1A1A1A' }} className="text-[#1A1A1A] font-bold inline-block">{combat.attackerRegular}</motion.strong> • 奇兵{' '}
                  <motion.strong key={combat.attackerSurprise} initial={{ scale: 1.5, color: '#EF4444' }} animate={{ scale: 1, color: '#8C2F39' }} className="text-[#8C2F39] font-bold inline-block">{combat.attackerSurprise}</motion.strong>
                </div>

                <div className="text-[10px] text-[#1A1A1A]/50 font-mono">
                  敌感知测算：
                  {feignedState.feignAttacker ? (
                    <span className="text-[#5A5A40] italic font-bold">12,500兵马 (虚幻实兵)</span>
                  ) : (
                    <span className="font-bold text-[#1A1A1A]/70">~{Math.round((combat.attackerRegular + combat.attackerSurprise) * 0.95)} (精算)</span>
                  )}
                </div>
              </div>

              {/* Defender panel */}
              <div id="defender-stats-panel" className="space-y-1 text-right">
                <span className="text-[10px] font-mono text-[#8C2F39] uppercase tracking-widest flex items-center gap-1 justify-end font-bold">
                  敌御军防线
                  <span className="w-2.5 h-2.5 bg-[#8C2F39] rounded-full inline-block"></span>
                </span>

                <div className="text-xs font-mono">
                  真：正兵 <motion.strong key={combat.defenderRegular} initial={{ scale: 1.5, color: '#EF4444' }} animate={{ scale: 1, color: '#1A1A1A' }} className="text-[#1A1A1A] font-bold inline-block">{combat.defenderRegular}</motion.strong> • 奇袭{' '}
                  <motion.strong key={combat.defenderSurprise} initial={{ scale: 1.5, color: '#EF4444' }} animate={{ scale: 1, color: '#5A5A40' }} className="text-[#5A5A40] font-bold inline-block">{combat.defenderSurprise}</motion.strong>
                </div>

                <div className="text-[10px] text-[#1A1A1A]/50 font-mono">
                  我方侦讯感知：
                  {feignedState.feignDefender ? (
                    <span className="text-[#8C2F39] italic font-bold">迷雾覆盖 难以精算</span>
                  ) : (
                    <span className="font-bold text-[#1A1A1A]/70">~{Math.round((combat.defenderRegular + combat.defenderSurprise) * 1.05)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tactical actions and simulation trigger */}
            <div className="flex-1 flex flex-col justify-center items-center py-4 space-y-4">
              <div className="flex gap-4">
                <button
                  id="feign-attacker-btn"
                  onClick={() => handleFeignAction('ATTACKER')}
                  className={`px-3 py-1.5 text-xs font-mono border rounded transition shadow-xs ${
                    feignedState.feignAttacker
                      ? 'bg-[#5A5A40] text-[#F5F2ED] border-[#5A5A40] font-bold'
                      : 'bg-white border-[#1A1A1A]/15 text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/5'
                  }`}
                >
                  【我军】 示之形 (虚妄伪装)
                </button>

                <button
                  id="feign-defender-btn"
                  onClick={() => handleFeignAction('DEFENDER')}
                  className={`px-3 py-1.5 text-xs font-mono border rounded transition shadow-xs ${
                    feignedState.feignDefender
                      ? 'bg-[#8C2F39] text-[#F5F2ED] border-[#8C2F39] font-bold'
                      : 'bg-white border-[#1A1A1A]/15 text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/5'
                  }`}
                >
                  【敌军】 难知如阴 (战场盲盒)
                </button>
              </div>

              {/* Interactive buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id="provoke-general-btn"
                  onClick={handleProvoke}
                  className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 text-[#1A1A1A] font-bold text-xs py-2.5 px-4 rounded transition shadow-xs flex-1 flex justify-center items-center gap-1.5"
                >
                  <span className="text-amber-500">⚡</span> 言语激怒 <span className="text-[10px] text-[#1A1A1A]/50 font-normal ml-1 border border-[#1A1A1A]/20 rounded px-1">[P]</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id="simulate-combat-btn"
                  onClick={handleSimulateTurn}
                  disabled={combat.attackerRegular <= 0}
                  className="bg-[#8C2F39] hover:bg-[#8C2F39]/90 disabled:bg-neutral-200 disabled:text-[#1A1A1A]/40 text-[#F5F2ED] font-black text-xs py-2.5 px-6 rounded transition flex justify-center items-center gap-2 shadow flex-2"
                >
                  <Swords className="w-4 h-4" />
                  奇正进击决算 <span className="text-[10px] bg-white/20 text-white font-normal ml-1 border border-white/20 rounded px-1.5">[SPACE]</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  id="reset-combat-btn"
                  onClick={handleReset}
                  className="bg-white hover:bg-neutral-50 text-[#1A1A1A]/75 text-xs py-2.5 px-4 border border-[#1A1A1A]/15 rounded transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px] text-[#1A1A1A]/50 font-normal border border-[#1A1A1A]/20 rounded px-1">[R]</span>
                </motion.button>
              </div>
            </div>

            {/* Nine Lands display */}
            <div className="bg-white/60 border border-[#1A1A1A]/10 p-3 rounded text-[10px] font-mono flex flex-col gap-3 shadow-xs">
              {/* Active description row */}
              {(() => {
                const activeTerrainObj = NINE_LANDS_DATA.find(t => t.id === combat.terrain);
                const rec = getRecommendedTerrain(selectedGen);
                return (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 border-b border-dashed border-[#1A1A1A]/10 pb-2">
                    <div>
                      <span className="text-[#1A1A1A]/70 uppercase tracking-wider text-[9px] font-bold block mb-1">当前主战场</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-serif font-black text-[#8C2F39] bg-[#8C2F39]/5 border border-[#8C2F39]/15 px-2 py-0.5 rounded-sm">
                          🚩 {activeTerrainObj ? activeTerrainObj.name : '未知战地'}
                        </span>
                        {combat.terrain === rec.type && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8px] px-1.5 py-0.2 rounded font-black animate-pulse">
                            ⚔️ 地利神契
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right sm:max-w-md">
                      <span className="text-stone-500 text-[8px] uppercase tracking-wider block">地形战力矫正</span>
                      <p className="text-[#8C2F39] font-bold text-[10px] leading-tight font-sans mt-0.5">
                        {activeTerrainObj ? activeTerrainObj.effectText : ''}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Mini Map Grid / 3x3 Tactician Layout */}
              <div>
                <span className="text-[#1A1A1A]/50 text-[9px] uppercase tracking-wider block mb-1.5">九地天演图 (点击任意地块瞬间调遣并刷新历史记录)</span>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 md:gap-2 auto-rows-fr">
                  {NINE_LANDS_DATA.map((land, index) => {
                    const isSelected = combat.terrain === land.id;
                    const rec = getRecommendedTerrain(selectedGen);
                    const isRecommended = rec.type === land.id;
                    const synergy = land.synergyFormula(selectedGen);
                    
                    // Style indicators
                    let synergyBorder = 'border-[#1A1A1A]/15 hover:border-[#8C2F39]/35 bg-white';
                    if (isSelected) {
                      synergyBorder = 'border-[#8C2F39] bg-[#8C2F39]/5 shadow-sm ring-1 ring-[#8C2F39]';
                    } else if (isRecommended) {
                      synergyBorder = 'border-amber-400/40 bg-amber-50/10 hover:border-amber-500';
                    }

                    // Extract the first Chinese character of the name (e.g. "散" or "轻")
                    const char = land.name.substring(0, 1);
                    const restName = land.name.split(' ')[0];

                    return (
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        key={land.id}
                        id={`sandbox-map-cell-${land.id}`}
                        onClick={() => {
                          const detailedLog = `🗺️ 地理调度：主帅拨动筹谋，将前线阵地瞬间切换至【${land.name}】！地势天作数：${land.effectText}`;
                          setCombat(p => ({
                            ...p,
                            terrain: land.id as any,
                            history: [detailedLog, ...p.history].slice(0, 7)
                          }));
                        }}
                        className={`p-2 rounded border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer relative select-none group min-h-[64px] sm:min-h-[72px] outline-none ${synergyBorder}`}
                      >
                        <div className="space-y-0.5">
                          {/* Top indicator row */}
                          <div className="flex justify-between items-center">
                            <span className={`text-[12px] font-sans font-black flex items-center justify-center rounded w-4.5 h-4.5 ${
                              isSelected 
                                ? 'bg-[#8C2F39] text-[#FAF8F5]' 
                                : isRecommended 
                                ? 'bg-amber-500 text-white animate-pulse' 
                                : 'bg-stone-100 text-[#1A1A1A]/70 border border-[#1A1A1A]/10'
                            }`}>
                              {char}
                            </span>

                            {/* Synergy little dot indicator for super premium feels */}
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                              synergy.status === 'SUCCESS'
                                ? 'bg-emerald-500'
                                : synergy.status === 'DANGER'
                                ? 'bg-rose-500'
                                : 'bg-stone-300'
                            }`} />
                          </div>

                          {/* Primary label */}
                          <div className={`text-[9px] font-bold font-serif truncate leading-tight mt-1 ${
                            isSelected ? 'text-[#8C2F39]' : 'text-stone-800'
                          }`}>
                            {restName}
                          </div>
                        </div>

                        {/* Interactive dynamic mini status code labels */}
                        <div className="text-[7px] text-stone-400 font-mono flex justify-between items-center mt-1">
                          <span>0{index + 1}</span>
                          {isRecommended && (
                            <span className="text-amber-600 font-bold scale-90" title="神契：主帅最佳指挥匹配">契</span>
                          )}
                        </div>

                        {/* Hover Tooltip detailing each terrain and its specific synergy */}
                        <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 bg-[#FAF8F5] border border-[#8C2F39] text-[#1A1A1A] text-[10px] rounded shadow-lg w-52 sm:w-60 z-30 pointer-events-none normal-case leading-relaxed font-sans">
                          <span className="font-serif font-black text-[#8C2F39] border-b border-[#8C2F39]/15 pb-1 flex items-center justify-between block mb-1">
                            <span>{land.name}</span>
                            <span className="text-[7.5px] bg-[#8C2F39]/10 px-1 rounded uppercase font-mono font-bold text-[#8C2F39]">
                              {synergy.badge}
                            </span>
                          </span>
                          <span className="font-serif italic text-stone-600 block my-1 leading-normal">
                            "{land.classicDesc}"
                          </span>
                          <span className="text-[8.5px] bg-[#8C2F39]/5 text-[#8C2F39] p-1.5 rounded block text-left font-bold border border-[#8C2F39]/10">
                            {land.effectText}
                          </span>
                          <span className="text-[8.5px] text-stone-700 block leading-tight mt-1.5">
                            <b>领兵契合:</b> {synergy.desc}
                          </span>
                          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#8C2F39]" />
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

               {/* Bottom advice row (New geomorphic recommendation) */}
               {(() => {
                 const rec = getRecommendedTerrain(selectedGen);
                 return (
                   <div className="bg-[#FAF8F5] border border-amber-800/10 p-2.5 rounded text-[10px] leading-relaxed flex flex-col md:flex-row md:items-center justify-between gap-3" id="terrain-recommendation-panel">
                     <div className="flex items-start gap-2.5 flex-1">
                       <span className="bg-amber-600 text-amber-50 p-1 rounded text-[8px] font-black uppercase tracking-wider whitespace-nowrap self-start mt-0.5 shadow-3xs flex items-center gap-0.5">
                         🎖️ 兵略推荐
                       </span>
                       <div className="space-y-0.5">
                         <p className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                           主帅特质天契【{rec.zhTerrain}】
                           <span className="text-[9px] text-[#8C2F39] font-normal">
                             (匹配特质: {selectedGen.traits.join(' / ')})
                           </span>
                         </p>
                         <p className="font-serif italic text-stone-600 leading-normal">
                           "{rec.reason}"
                         </p>
                       </div>
                     </div>

                     <button
                       type="button"
                       onClick={() => setShowNineLandsOverlay(true)}
                       className="bg-[#8C2F39]/10 hover:bg-[#8C2F39]/15 text-[#8C2F39] border border-[#8C2F39]/20 font-bold py-1 px-2 rounded-sm text-[8px] sm:text-[9px] font-sans flex items-center gap-1 self-stretch md:self-auto justify-center transition-all cursor-pointer whitespace-nowrap outline-none"
                     >
                       <Map className="w-3 h-3" />
                       <span>探解《九地兵策图鉴》</span>
                     </button>
                   </div>
                 );
               })()}
            </div>
          </div>

          {/* Tactical AI Advisor Section */}
          <div className="mt-4 bg-[#FAF8F5] border border-amber-800/15 rounded-md p-4 shadow-xs relative overflow-hidden transition-all duration-300">
            {/* Background seal watermarks for authentic ancient military aura */}
            <div className="absolute -bottom-10 -left-10 bg-[#8C2F39]/5 text-[#8C2F39] text-7xl font-serif font-black select-none pointer-events-none transform -rotate-12 opacity-25">
              💡
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1A1A1A]/10 pb-2.5 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-[#8C2F39] text-[#F5F2ED] p-1.5 rounded shadow-sm">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-serif font-black text-[#1A1A1A] tracking-wide flex items-center gap-1.5">
                    兵法AI战术军师 · 实时破敌规划
                  </h4>
                  <p className="text-[9px] text-[#1A1A1A]/50 font-mono uppercase tracking-wider">
                    兵法AI战术军师 · 实时破敌规划
                  </p>
                </div>
              </div>

              {activeTrait && ADV_ADVISOR_DATA[activeTrait] && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-[#1A1A1A]/50">建议反制成算：</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/55 px-2 py-0.5 rounded font-bold font-mono">
                    {ADV_ADVISOR_DATA[activeTrait].counterRating}
                  </span>
                </div>
              )}
            </div>

            {activeTrait && ADV_ADVISOR_DATA[activeTrait] ? (
              <div className="space-y-3 font-sans">
                {/* Tactical assessment and status alert */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-8 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-[#1A1A1A]/75 font-mono text-[10px]">
                        拟诊军略:
                      </span>
                      <span className="bg-[#8C2F39]/5 text-[#8C2F39] font-serif font-bold px-2 py-0.5 rounded border border-[#8C2F39]/15 text-[10px]">
                        ⚡ {activeTrait} ({TRAIT_DETAILS[activeTrait].badge})
                      </span>
                      
                      {/* Threat Badge */}
                      {ADV_ADVISOR_DATA[activeTrait].threatLevel === 'CRITICAL' && (
                        <span className="bg-red-50 text-red-700 text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-200 font-bold flex items-center gap-1 animate-pulse">
                          ⚠️ 致命威胁
                        </span>
                      )}
                      {ADV_ADVISOR_DATA[activeTrait].threatLevel === 'WARN' && (
                        <span className="bg-amber-50 text-amber-700 text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-200 font-bold flex items-center gap-1">
                          ⚠️ 须得警惕 (WARN)
                        </span>
                      )}
                      {ADV_ADVISOR_DATA[activeTrait].threatLevel === 'NORMAL' && (
                        <span className="bg-slate-50 text-slate-600 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-200 font-bold flex items-center gap-1">
                          ✓ 局势平缓 (NORMAL)
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-[#1A1A1A]/85 font-serif bg-white p-2.5 rounded border border-[#1A1A1A]/10 shadow-3xs">
                      「{ADV_ADVISOR_DATA[activeTrait].assessment}」
                    </p>
                  </div>

                  <div className="md:col-span-4 bg-amber-50/60 p-2.5 rounded border border-amber-800/10 space-y-1 min-h-[90px] flex flex-col justify-center">
                    <span className="text-[9px] font-mono text-amber-850 font-black uppercase tracking-wider block">
                      💡 军师荐策
                    </span>
                    <p className="text-[10px] leading-relaxed text-stone-700 font-serif italic">
                      {ADV_ADVISOR_DATA[activeTrait].suggestedStrategy}
                    </p>
                  </div>
                </div>

                {/* Suggested actions (Active pills that execute tactics) */}
                <div className="space-y-1.5 pt-1.5 border-t border-dashed border-[#1A1A1A]/10 relative z-10">
                  <span className="text-[10px] font-mono text-[#8C2F39] font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Sliders className="w-3.5 h-3.5 text-[#8C2F39]" />
                    主帅反制行动舱
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ADV_ADVISOR_DATA[activeTrait].actions.map((act, index) => {
                      // Check state to see if active
                      let isCurrentlyToggled = false;
                      if (act.actionType === 'TOGGLE_FEIGN_ATTACK') isCurrentlyToggled = feignedState.feignAttacker;
                      if (act.actionType === 'TOGGLE_FEIGN_DEFEND') isCurrentlyToggled = feignedState.feignDefender;
                      if (act.actionType === 'SET_SCATTER') isCurrentlyToggled = combat.terrain === 'SCATTERED';
                      if (act.actionType === 'SET_DEATH') isCurrentlyToggled = combat.terrain === 'DEATH';

                      return (
                        <button
                          key={index}
                          onClick={() => handleAdvisorAction(act.actionType)}
                          className={`group text-left p-2.5 rounded border transition-all text-xs cursor-pointer flex justify-between items-start gap-2 relative overflow-hidden ${
                            isCurrentlyToggled
                              ? 'bg-emerald-50/90 border-emerald-500 font-bold text-emerald-950 shadow-xs'
                              : 'bg-white hover:bg-amber-50/20 border-[#1A1A1A]/10 text-[#1A1A1A] hover:border-[#8C2F39]/20'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold flex items-center gap-1 text-[11px]">
                              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isCurrentlyToggled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                              <span>{act.label}</span>
                            </div>
                            <p className="text-[10px] text-stone-500 leading-normal font-normal group-hover:text-[#1A1A1A] transition-colors">
                              {act.desc}
                            </p>
                          </div>
                          
                          <span className={`text-[9px] font-mono font-bold px-1 rounded whitespace-nowrap self-start ${
                            isCurrentlyToggled 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-neutral-100 text-[#8C2F39] text-[8px] sm:text-[9px]'
                          }`}>
                            {isCurrentlyToggled ? '已生效' : act.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional advice tips */}
                <div className="text-[9px] font-mono text-[#1A1A1A]/50 flex justify-between items-center bg-white/40 p-1.5 rounded border border-black/5 mt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#8C2F39]" />
                    小提示：点击反制按钮可在右侧演武沙盘中当即转换攻防环境、佯攻伪装或激怒局势！
                  </span>
                  <span className="italic">兵学神思 · 胜敌于未战</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-[11px] text-[#1A1A1A]/50 font-serif italic space-y-1.5 bg-white rounded border border-[#1A1A1A]/10 shadow-3xs">
                <HelpCircle className="w-6 h-6 mx-auto text-[#1A1A1A]/20" />
                <p>中军大营军师闭目静修中...</p>
                <p className="text-[10px] text-stone-450 font-sans max-w-md mx-auto px-4 mt-1 leading-relaxed">
                  请点击左方面板上的将领特质（或点击张辽、夏侯惇、曹仁的金色特质标签），即可唤醒兵圣军师。军师将当即为您进行实时兵谋拆解、并献上一键即达的战场克敌动作舱！
                </p>
              </div>
            )}
          </div>

          {/* Battle Narrative log */}
          <div className="bg-white/85 p-4 rounded border border-[#1A1A1A]/15 mt-4 shadow-xs relative overflow-visible">
            <h4 className="text-[10px] font-mono text-[#1A1A1A]/60 tracking-wider mb-1.5 font-bold flex items-center justify-between">
              <span>中军行军策简报</span>
              {latestImpact.type && (
                <span className="text-[9px] text-[#8C2F39]/80 font-serif font-black animate-pulse">
                  * 兵法乘数已实时结算
                </span>
              )}
            </h4>

            {/* Absolute Floaty Indicator Popup Bubble */}
            {latestImpact.type && (
              <div
                key={latestImpact.key}
                className={`absolute right-4 -top-3 z-30 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-black rounded border animate-fade-up-out shadow-md pointer-events-none select-none flex items-center gap-1 ${
                  latestImpact.type === 'attack'
                    ? 'bg-amber-600 border-amber-500 text-[#FAF8F5]'
                    : latestImpact.type === 'defend'
                    ? 'bg-emerald-600 border-emerald-500 text-[#FAF8F5]'
                    : 'bg-rose-600 border-rose-500 text-[#FAF8F5]'
                }`}
              >
                {latestImpact.impactText}
              </div>
            )}

            <div className="space-y-2 text-xs font-mono max-h-[260px] overflow-y-auto pr-1">
              {combat.history.map((h, i) => {
                const isLatest = i === 0;
                let flashClass = "border-[#8C2F39]/20 text-[#1A1A1A]/85 bg-transparent";
                if (isLatest && latestImpact.type === 'attack') {
                  flashClass = "animate-gold-flash border-l-[3px] border-l-[#F59E0B] text-amber-900 px-1 py-0.5";
                } else if (isLatest && latestImpact.type === 'defend') {
                  flashClass = "animate-green-flash border-l-[3px] border-l-[#10B981] text-emerald-900 px-1 py-0.5";
                } else if (isLatest && latestImpact.type === 'flaw') {
                  flashClass = "animate-red-flash border-l-[3px] border-l-[#EF4444] text-rose-950 px-1 py-0.5";
                }
                return (
                  <CombatLog
                    key={i}
                    log={h}
                    isLatest={isLatest}
                    flashClass={flashClass}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDABLE MODAL BREAKDOWN FOR GENERAL TRAIT */}
      {modalTrait && TRAIT_DETAILS[modalTrait] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto"
          onClick={() => setModalTrait(null)}
          id="trait-breakdown-modal-backdrop"
        >
          <div 
            className="bg-[#FAF8F5] border-2 border-[#8C2F39] rounded-lg max-w-2xl w-full text-[#1A1A1A] p-6 shadow-2xl relative overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            id={`trait-modal-${modalTrait}`}
          >
            {/* Decal Background Motif */}
            <div className="absolute -bottom-20 -right-20 bg-[#8C2F39]/5 text-[#8C2F39] text-[150px] font-serif font-black select-none pointer-events-none transform rotate-12 opacity-30">
              {TRAIT_DETAILS[modalTrait].badge.substring(0, 1)}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-[#8C2F39]/20 pb-4 mb-4">
              <div className="space-y-1.5">
                <span className="text-[10px] sm:text-xs font-mono text-[#8C2F39]/80 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#8C2F39]" />
                  兵道透鉴 · 主帅特质机理剖析 (TACTICAL ANALYSIS)
                </span>
                <div className="flex items-center gap-3">
                  <span className="bg-[#8C2F39] text-[#F5F2ED] text-xs font-mono px-2 py-0.5 rounded font-black tracking-wider shadow-sm">
                    {TRAIT_DETAILS[modalTrait].badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A] flex items-center gap-1">
                    {TRAIT_DETAILS[modalTrait].name}
                  </h3>
                </div>
              </div>
              <button 
                id="close-trait-modal-btn"
                onClick={() => setModalTrait(null)}
                className="text-gray-500 hover:text-red-700 bg-white/50 hover:bg-red-50 p-1.5 rounded-full border border-dashed border-[#1A1A1A]/15 cursor-pointer transition-all shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content body with scrolling */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 font-sans">
              
              {/* Quote & Script Scroll */}
              <div className="border-[#8C2F39]/10 bg-[#8C2F39]/5 rounded border p-3.5 space-y-1.5">
                <p className="text-xs sm:text-sm text-[#8C2F39] font-serif italic font-semibold leading-relaxed">
                  {TRAIT_DETAILS[modalTrait].quote}
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#1A1A1A]/50">
                  <span>兵圣遗书手记</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-[#1A1A1A]/5 text-[#8C2F39] font-semibold">
                    {TRAIT_DETAILS[modalTrait].chapter}
                  </span>
                </div>
              </div>

              {/* Essence description */}
              <div className="space-y-1">
                <h4 className="text-xs font-mono text-[#1A1A1A]/60 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" /> 特质本源 · Essence Description
                </h4>
                <p className="text-xs sm:text-sm text-[#1A1A1A]/85 font-serif leading-relaxed italic bg-white border border-[#1A1A1A]/15 rounded p-3">
                  {TRAIT_DETAILS[modalTrait].effect}
                </p>
              </div>

              {/* Core 3 Breakdown Modules (Modular layout) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Mechanical Combat Logic */}
                <div className="bg-white border-l-4 border-l-[#8C2F39] border border-stone-200 p-3.5 rounded shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#8C2F39] font-black tracking-wide">
                    <Swords className="w-3.5 h-3.5" />
                    <span>决战伤害机理</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#1A1A1A]/80 font-serif">
                    {TRAIT_DETAILS[modalTrait].combatBreakdown}
                  </p>
                </div>

                {/* 2. Terrain Penalty Mitigation */}
                <div className="bg-white border-l-4 border-l-[#5A5A40] border border-stone-200 p-3.5 rounded shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#5A5A40] font-black tracking-wide font-sans">
                    <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>九地地利规避</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#1A1A1A]/80 font-serif">
                    {TRAIT_DETAILS[modalTrait].terrainPenalties}
                  </p>
                </div>

                {/* 3. Strategy Modification & Synergies */}
                <div className="bg-white border-l-4 border-l-amber-700 border border-stone-200 p-3.5 rounded shadow-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-black tracking-wide">
                    <Layers className="w-3.5 h-3.5" />
                    <span>诡道奇谋协同</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#1A1A1A]/80 font-serif">
                    {TRAIT_DETAILS[modalTrait].strategyModification}
                  </p>
                </div>
              </div>

              {/* Algorithmic formulas and code integration */}
              <div className="bg-[#1A1A1A]/95 text-stone-300 p-3.5 rounded border border-[#1A1A1A] font-mono text-[10px] sm:text-xs space-y-2 shadow-inner">
                <div className="flex justify-between items-center text-[#8C2F39] font-bold border-b border-white/10 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 text-red-400" />
                    推演核心算式 (Simulation Algorithm Logic)
                  </span>
                  <span className="text-[9px] bg-white/10 text-white/70 px-1 rounded">
                    CPU V1.4
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-stone-400 font-semibold uppercase text-[9px] tracking-wider">
                    ● 兵道实装乘数 (Effect Applied):
                  </div>
                  <div className="text-white font-medium bg-black/40 p-1.5 rounded select-all font-mono leading-relaxed border border-white/5">
                    {TRAIT_DETAILS[modalTrait].logic}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="text-stone-400 font-semibold uppercase text-[9px] tracking-wider">
                    ● 数学公式原件 (Mathematical Formula):
                  </div>
                  <div className="text-amber-300 font-mono italic bg-black/40 p-1.5 rounded select-all font-mono leading-relaxed border border-white/5">
                    {TRAIT_DETAILS[modalTrait].formula}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-[#1A1A1A]/10 pt-4 mt-4 flex justify-between items-center text-[10px] font-mono text-[#1A1A1A]/40">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-[#8C2F39]" />
                点击外部暗影或右上角 ✕ 标志可退回兵战中军沙盘页。
              </span>
              <span>
                演武军事战术部 · 印制
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NINE LANDS STRATEGY INTERACTIVE HANDBOOK OVERLAY */}
      {showNineLandsOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity overflow-y-auto font-sans"
          onClick={() => setShowNineLandsOverlay(false)}
          id="nine-lands-handbook-backdrop"
        >
          <div 
            className="bg-[#FAF8F5] border-2 border-[#8C2F39] rounded-lg max-w-5xl w-full text-[#1A1A1A] p-5 sm:p-6 shadow-2xl relative overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
            id="nine-lands-handbook-container"
          >
            {/* Ambient Background Watermark - Calligraphy Aura */}
            <div className="absolute -bottom-32 -left-32 bg-[#8C2F39]/5 text-[#8C2F39] text-[280px] font-serif font-black select-none pointer-events-none transform -rotate-12 opacity-25">
              地
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-[#8C2F39]/20 pb-4 mb-4 gap-4 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-mono text-[#8C2F39] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Compass className="w-4 h-4 text-[#8C2F39]" />
                  孙子兵法 · 九地篇虚实战略图观
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
                    九地谋攻策论
                  </h3>
                  <span className="bg-[#8C2F39] text-[#F5F2ED] text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    地利自适应联动
                  </span>
                  <div className="text-[10px] sm:text-xs text-stone-600 font-serif flex flex-wrap items-center gap-1.5">
                    <span>当前参演主帅：</span>
                    <strong className="text-[#8C2F39] underline decoration-dotted font-sans">{selectedGen.name}</strong>
                    <span className="bg-amber-100 text-amber-900 border border-amber-200/50 px-1.5 py-0.2 rounded-xs text-[9px]">
                      特质: {selectedGen.traits.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                id="close-nine-lands-handbook-btn"
                onClick={() => setShowNineLandsOverlay(false)}
                className="text-gray-500 hover:text-red-700 bg-white hover:bg-red-50 p-1.5 rounded-full border border-[#1A1A1A]/15 cursor-pointer transition-all shadow-3xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Introductory scrolls with background styling */}
            <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed font-serif bg-stone-100/50 border border-stone-200/60 rounded p-2.5 mb-4 max-w-4xl shrink-0">
              孙子曰：<b>「用兵之法，有散地，有轻地，有争地，有交地，有衢地，有重地，有圮地，有围地，有死地。」</b> 
              本战例系统重构了地利因素。根据当前所选将领特质，系统将在下方图谱中进行智能同步天演。在地利卡片上，点击按钮可直接在推演盘中一键机变迁离或实装该地利状态。
            </p>

            {/* Grid display of Nine Lands - Master Detail Panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden flex-1 min-h-0" id="nine-lands-interactive-board">
              {/* Left Selector Panel */}
              <div className="md:col-span-5 flex flex-col min-h-0 bg-stone-100/40 border border-stone-200/50 rounded-lg p-3">
                <span className="text-[10px] font-mono text-stone-500 font-bold mb-2 uppercase tracking-tight block">
                  选择九地地利 (Select Terrain Type):
                </span>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1" id="nine-lands-handbook-list">
                  {NINE_LANDS_DATA.map((item) => {
                    const itemSynergy = item.synergyFormula(selectedGen);
                    const isFocus = item.id === (handbookTerrainId || combat.terrain);
                    const isArenaActive = combat.terrain === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHandbookTerrainId(item.id)}
                        className={`w-full text-left p-2.5 rounded-md border transition-all duration-200 flex items-center justify-between cursor-pointer select-none outline-none ${
                          isFocus
                            ? 'bg-[#8C2F39] border-[#8C2F39] text-[#FAF8F5] shadow-sm'
                            : 'bg-white hover:bg-stone-50 border-[#1A1A1A]/10 text-[#1A1A1A]'
                        }`}
                        id={`selector-item-${item.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                            isFocus 
                              ? 'bg-amber-100 text-[#8C2F39]' 
                              : isArenaActive 
                              ? 'bg-[#8C2F39] text-white' 
                              : 'bg-amber-600/10 text-amber-900 border border-amber-600/30'
                          }`}>
                            {item.name.substring(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-serif font-black text-xs leading-none">
                              {item.name.split(' (')[0]}
                            </p>
                            <p className={`text-[9px] truncate mt-0.5 ${isFocus ? 'text-stone-200' : 'text-stone-500 font-sans'}`}>
                              {item.classicDesc.replace('孙子曰：', '')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isArenaActive && (
                            <span className={`text-[8px] font-mono px-1 rounded-sm uppercase font-bold ${
                              isFocus ? 'bg-[#FAF8F5]/25 text-[#FAF8F5]' : 'bg-[#8C2F39] text-[#FAF8F5]'
                            }`}>
                              🚩 战
                            </span>
                          )}
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            itemSynergy.status === 'SUCCESS'
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-400/50'
                              : itemSynergy.status === 'DANGER'
                              ? 'bg-rose-500 shadow-sm shadow-rose-400/50 animate-pulse'
                              : 'bg-stone-400'
                          }`} title={itemSynergy.badge} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Detail Panel */}
              {(() => {
                const land = NINE_LANDS_DATA.find(t => t.id === (handbookTerrainId || combat.terrain)) || NINE_LANDS_DATA[0];
                const synergy = land.synergyFormula(selectedGen);
                const isActiveOption = land.activeStatus === 'ACTIVE_AVAILABLE';
                const isSelectedInSandbox = combat.terrain === land.id;

                return (
                  <div className="md:col-span-7 flex flex-col justify-between bg-white border border-[#1A1A1A]/10 rounded-lg p-4 sm:p-5 relative overflow-y-auto min-h-0">
                    {/* Visual calligraphy watermark overlay */}
                    <span className="absolute right-3 bottom-0 text-[110px] font-serif font-black text-stone-100/40 select-none pointer-events-none transform translate-y-6">
                      {land.name.substring(0, 1)}
                    </span>

                    <div className="space-y-4 relative z-10">
                      {/* Title and Badge rows */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div>
                          <h4 className="font-serif font-black text-base sm:text-lg text-[#8C2F39] flex items-center gap-1.5">
                            {land.name}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-mono tracking-wide uppercase">
                            Strategic Ground Blueprint · NINE_LANDS_{land.id}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 items-center">
                          {isSelectedInSandbox && (
                            <span className="bg-[#8C2F39] text-[#FAF8F5] text-[8px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold animate-pulse">
                              🚩 演武沙盘正实装
                            </span>
                          )}
                          <span className="bg-amber-500/10 text-amber-900 border border-amber-500/20 text-[8px] font-semibold px-1.5 py-0.5 rounded-sm">
                            📜 始自《九地篇》
                          </span>
                        </div>
                      </div>

                      {/* Classic Quote */}
                      <div className="bg-[#FAF8F5] border-l-4 border-[#8C2F39] p-3 rounded-r-md">
                        <p className="text-xs text-stone-700 leading-relaxed font-serif italic">
                          {land.classicDesc}
                        </p>
                      </div>

                      {/* Operational Wisdom */}
                      <div className="bg-stone-50 border border-stone-200/60 p-3 rounded-md space-y-2">
                        <div className="flex items-center gap-1 text-[10px] text-amber-800 font-black tracking-wide font-sans">
                          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                          <span>【兵学策论】</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed font-serif">
                          {land.advise}
                        </p>
                      </div>

                      {/* Base Stats and Terrain Rule Detail */}
                      <div className="bg-blue-50/40 border border-blue-100 p-3 rounded-md space-y-1">
                        <div className="text-[9px] text-[#8C2F39] font-black tracking-wider uppercase font-mono">
                          🌍 基本地利规则 / Environmental Modifier:
                        </div>
                        <p className="text-xs text-stone-800 font-sans leading-relaxed">
                          {land.effectText}
                        </p>
                      </div>

                      {/* Synergies Panel & Active Highlight */}
                      <div className={`border rounded-lg p-3.5 transition-all duration-300 ${
                        synergy.status === 'SUCCESS'
                          ? 'bg-emerald-50/70 border-emerald-500/40 ring-2 ring-emerald-500/10 shadow-xs'
                          : synergy.status === 'DANGER'
                          ? 'bg-rose-50/70 border-rose-500/40 ring-2 ring-rose-500/10 shadow-xs'
                          : 'bg-stone-50 border-stone-200'
                      }`} id="nine-lands-synergy-highlight">
                        <div className="flex items-center justify-between border-b border-dashed border-[#1A1A1A]/5 pb-2 mb-2">
                          <span className="text-[10px] font-mono text-stone-500 font-bold">
                            当前主帅【{selectedGen.name}】天心自适应
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-sm uppercase font-black font-mono tracking-wider shadow-1xs ${
                            synergy.status === 'SUCCESS' 
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : synergy.status === 'DANGER'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-stone-200 text-stone-800 border border-stone-300'
                          }`}>
                            {synergy.badge}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className={`text-xs font-serif leading-relaxed font-bold ${
                            synergy.status === 'SUCCESS'
                              ? 'text-emerald-950'
                              : synergy.status === 'DANGER'
                              ? 'text-rose-950'
                              : 'text-stone-800'
                          }`}>
                            {synergy.desc}
                          </p>

                          {/* Display matched general traits details cleanly for beautiful layout */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedGen.traits.map(trait => {
                              const isSpecialMatch = 
                                (land.id === 'SCATTERED' && trait === '防守大师') ||
                                (land.id === 'LIGHT' && trait === '虚实突击') ||
                                (land.id === 'CONTENTIOUS' && (trait === '防守大师' || trait === '逍遥津奇袭' || trait === '冲锋猛将')) ||
                                (land.id === 'FACILE' && trait === '冲锋猛将') ||
                                (land.id === 'FOCAL' && selectedGen.tactics >= 80) ||
                                (land.id === 'HEAVY' && (trait === '逍遥津奇袭' || trait === '沉稳老将')) ||
                                (land.id === 'ENTRAPPING' && (trait === '冲锋猛将' || trait === '沉稳老将')) ||
                                (land.id === 'FRONTIER' && (trait === '防守大师' || trait === '虚实突击')) ||
                                (land.id === 'DEATH' && (trait === '刚直廉洁' || trait === '逍遥津奇袭'));

                              return (
                                <span 
                                  key={trait} 
                                  className={`text-[9px] px-2 py-0.5 rounded-sm font-semibold transition-all duration-300 ${
                                    isSpecialMatch 
                                      ? 'bg-amber-600 text-amber-50 ring-2 ring-amber-300 shadow-xs font-bold' 
                                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                                  }`}
                                >
                                  {isSpecialMatch ? `★ 绝配契合特质: 【${trait}】` : `特质: ${trait}`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Foot Controls: Deploy Button */}
                    {isActiveOption && (
                      <div className="mt-5 border-t border-stone-100 pt-4" id="nine-lands-handbook-controls">
                        <button
                          type="button"
                          onClick={() => {
                            const detailLog = `🗺️ 兵书御敌：研学《九地篇》，中军主帅下大令瞬间将主阵地调遣至【${land.name}】！${land.effectText}`;
                            setCombat(p => ({
                              ...p,
                              terrain: land.id as any,
                              history: [detailLog, ...p.history].slice(0, 7)
                            }));
                            setShowNineLandsOverlay(false);
                          }}
                          className={`w-full py-2.5 px-4 text-center font-bold text-[10px] sm:text-xs rounded-md transition duration-250 cursor-pointer select-none outline-none flex items-center justify-center gap-1.5 shadow-sm transform hover:scale-[1.01] active:scale-[0.99] ${
                            isSelectedInSandbox
                              ? 'bg-amber-900/15 text-amber-950 border border-amber-900/30 shadow-inner cursor-not-allowed'
                              : 'bg-[#8C2F39] text-[#FAF8F5] hover:bg-[#8C2F39]/90 hover:shadow shadow'
                          }`}
                          disabled={isSelectedInSandbox}
                        >
                          <Map className="w-4 h-4 shrink-0" />
                          <span>
                            {isSelectedInSandbox 
                              ? '✓ 中军已于此安营扎寨完毕 (Arena Active)' 
                              : `调兵遣将：一键实装演练并将推演地形切换为【${land.name.split(' (')[0]}】`
                            }
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="border-t border-[#1A1A1A]/10 pt-3.5 mt-3 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-mono text-[#1A1A1A]/40 shrink-0">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#8C2F39]" />
                点击外部暗影、按右上角 ✕ 标志、或选择一键实装即可快速切回中军兵防演武沙盘。
              </span>
              <span>
                演武军事部九地地势局 · 编制
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
