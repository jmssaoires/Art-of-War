import React, { useState } from 'react';
import { EunuchGameState, QingliuActionState, Character } from '../types';
import { Sparkles, User, ShieldAlert, Award, FileSpreadsheet, ShieldX, Landmark, Swords, Scroll, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CourtSandboxProps {
  activeCardId?: string | null;
}

export default function CourtSandbox({ activeCardId = null }: CourtSandboxProps) {
  const [role, setRole] = useState<'EUNUCH' | 'QINGLIU'>('EUNUCH');
  
  // Eunuch state
  const [eunuchState, setEunuchState] = useState<EunuchGameState>({
    step: 'FAVORED',
    emperorType: 'YOUTH',
    yearsInPalace: 7,
    dValue: 40,
    sValue: 20,
    eunuchWealth: 500,
    eunuchInfluence: 30,
    cleansedWindowActive: false,
    courtLog: [
      '【得幸阶段】帝年幼。你长侍床前，为帝网罗异鸟奇珍，得其信重。',
      '清流官员已将目线暗中置入你的私邸。',
    ]
  });

  // Qingliu state
  const [qingliuState, setQingliuState] = useState<QingliuActionState>({
    phase: 'EVIDENCE',
    evidenceCollected: 10,
    publicOpinion: 25,
    courtAllies: 2,
    activeLog: [
      '【证据筹备】东林书院清流密盟，筹谋除邪。当前监视宦官外宅，彻错其私盐进项记录。'
    ]
  });

  // Emperor attributes for S/D multipliers
  const emperorConfigs = {
    YOUTH: { name: '少年天子', sMult: 0.8, dMult: 1.3, desc: 'D值易满，即位伊始不理政务，全赖大珰，亲政时猜忌突飞' },
    勤政明君: { name: '勤政明君', sMult: 1.5, dMult: 0.6, desc: '极难讨好，猜忌值每日自然成长5点，对越权零容忍' },
    多疑暴君: { name: '多疑暴君', sMult: 1.8, dMult: 0.9, desc: 'S值基础高且波动大。任何扩张权力的行为会成倍催化猜忌' },
    WEAK: { name: '怠政庸君', sMult: 0.5, dMult: 1.5, desc: '唯求声色犬马，将玉玺放手让渡，权力巅峰几乎无限期延长' },
    ROGUISH: { name: '鹰视狼顾', sMult: 1.2, dMult: 1.0, desc: '性格善变阴冷，时而大赏，时而重责，极难捉摸其心理' },
  };

  const currentEmp = emperorConfigs[eunuchState.emperorType as keyof typeof emperorConfigs] || emperorConfigs.YOUTH;

  // Eunuch actions
  const doEunuchAction = (action: 'TOYS' | 'INTEL' | 'BYPASS' | 'SELL_OFFICE' | 'ATTACK_QING') => {
    let { dValue, sValue, eunuchWealth, eunuchInfluence, courtLog, step } = eunuchState;
    const config = currentEmp;
    let deltaD = 0;
    let deltaS = 0;
    let deltaW = 0;
    let deltaI = 0;
    let msg = '';

    if (action === 'TOYS') {
      // Provide entertainment
      deltaD = Math.round(15 * config.dMult);
      deltaS = Math.round(-3 * config.sMult);
      deltaW = -50;
      msg = `🎭 声色娱乐：花费金50两，寻访民间绝技、百戏珍禽。皇帝沉迷声色，对你更加依赖（D+${deltaD}, S-3）。`;
    } else if (action === 'INTEL') {
      // Offer secret gossip/intelligence
      deltaD = Math.round(20 * config.dMult);
      deltaS = Math.round(-5 * config.sMult);
      deltaI = 5;
      msg = `👁️ 共享密报：将几位清流大员在私邸聚餐饮酒、非议朝政的名单递于皇帝。皇帝大怒，大珰忠诚重现（D+${deltaD}, 影响力+5）。`;
    } else if (action === 'BYPASS') {
      // Overreach / bypass memorials
      deltaD = Math.round(-5 * config.dMult);
      deltaS = Math.round(18 * config.sMult);
      deltaI = 15;
      msg = `📜 矫正上奏：将言官弹劾你的奏章行进截留销毁，并伪造密折。你专权扩张（D-5, 猜忌S+${deltaS}, 影响+15）。`;
    } else if (action === 'SELL_OFFICE') {
      // Sell office
      deltaS = Math.round(22 * config.sMult);
      deltaW = 200;
      deltaI = 10;
      msg = `💰 卖官鬻爵：高价出售盐运使司缺口。揽金200两，但外廷清流清议炸锅，皇帝猜忌大加剧（S+${deltaS}）。`;
    } else if (action === 'ATTACK_QING') {
      // Attack scholars
      if (qingliuState.evidenceCollected > 20) {
        deltaS = Math.round(10 * config.sMult);
        deltaI = 10;
        setQingliuState(p => ({
          ...p,
          evidenceCollected: Math.max(0, p.evidenceCollected - 30),
          activeLog: ['⚠️ 廷杖打压！宦官发动文字狱，几家书院被抄家，证据火种被销毁。', ...p.activeLog]
        }));
        msg = `🔨 党锢大网：掀起文字逆言案，流放数名言官，将清流的证据收集重创。猜忌上升（S+${deltaS}）。`;
      } else {
        msg = `⚠️ 难寻痛脚：清流儒臣在野并无实权，无法寻找致命错处，大珰在金殿上反被痛驳。`;
      }
    }

    // Accumulate structures
    const newD = Math.max(0, Math.min(100, dValue + deltaD));
    const newS = Math.max(0, Math.min(100, sValue + deltaS));
    const newW = Math.max(0, eunuchWealth + deltaW);
    const newI = Math.max(0, eunuchInfluence + deltaI);

    // Life cycles step update
    let newStep = step;
    if (newS > 75 && newS > newD) {
      newStep = 'CRISIS';
    } else if (newI > 70 && newD > 60) {
      newStep = 'DICTATOR';
    } else if (newS > 90) {
      newStep = 'PURGED';
    }

    const windowActive = newS > newD;

    setEunuchState({
      step: newStep,
      emperorType: eunuchState.emperorType,
      yearsInPalace: eunuchState.yearsInPalace + 1,
      dValue: newD,
      sValue: newS,
      eunuchWealth: newW,
      eunuchInfluence: newI,
      cleansedWindowActive: windowActive,
      courtLog: [msg, ...courtLog].slice(0, 6)
    });
  };

  // Qingliu actions 
  const doQingliuAction = (act: 'SEARCH_VOUCHER' | 'LECTURE' | 'IMPEACH' | 'CONNECT_GENERAL') => {
    let { phase, evidenceCollected, publicOpinion, courtAllies, activeLog } = qingliuState;
    let msg = '';

    if (act === 'SEARCH_VOUCHER') {
      evidenceCollected = Math.min(100, evidenceCollected + 25);
      msg = `🔍 暗探账目：东林书院弟子佯装行商，买通宦官偏宅管事，获得其贩卖私盐、克扣辽饷的第一手赃款单据（证据+25）。`;
    } else if (act === 'LECTURE') {
      publicOpinion = Math.min(100, publicOpinion + 20);
      msg = `🏫 理学清议：集结江南九大书院，讲学议政，直陈十常侍之祸。天下民心群起称赞，舆论声势浩大（民意+20）。`;
    } else if (act === 'CONNECT_GENERAL') {
      courtAllies = Math.min(6, courtAllies + 1);
      msg = `🛡️ 结纳九门：清流领袖拜会九门提督及驻军副将，向其宣讲忠义，为最后兵谏兵马清障（辅臣同盟+1）。`;
    } else if (act === 'IMPEACH') {
      if (evidenceCollected < 50 || publicOpinion < 40) {
        msg = `⚠️ 廷议搁置：清流证据不足或舆论平淡。宦官当庭巧舌如簧撒娇示弱，清流反被冠以“朋党误国”流放。`;
        evidenceCollected = Math.max(0, evidenceCollected - 20);
      } else {
        // Impeachment successful, push S value up dramatically!
        setEunuchState(p => ({
          ...p,
          sValue: Math.min(100, p.sValue + 45),
          step: p.sValue + 45 > p.dValue ? 'CRISIS' : p.step,
          courtLog: ['⚡ 惊天铁弹！清流当庭宣读三大罪状（假传密旨在先、私营私盐在后）。皇帝神情骤冷！', ...p.courtLog]
        }));
        msg = `⚡ 龙颜惊雷：言官言辞慷慨，携百姓万民联署、及私盐账册，在金殿死谏。皇帝对宦官的猜忌值暴增45！`;
        phase = 'BLOW';
      }
    }

    setQingliuState({
      phase: evidenceCollected > 60 && publicOpinion > 50 ? 'BLOW' : 'OPINION',
      evidenceCollected,
      publicOpinion,
      courtAllies,
      activeLog: [msg, ...activeLog].slice(0, 6)
    });
  };

  const triggerCleansing = () => {
    // Only works when S > D (the emperor is ready to purify)
    const win = eunuchState.sValue > eunuchState.dValue;
    let logMsg = '';
    
    if (win) {
      setEunuchState(p => ({
        ...p,
        step: 'PURGED',
        courtLog: ['💀 抄家清网：圣旨已出，九门步军星夜围剿魏督公府第。抄家搜出白银六十万两，魏党凌迟处死，其义子发配苦寒。', ...p.courtLog]
      }));
      logMsg = `🏆 清算大捷！皇帝信任天平在猜忌极点倾斜，密调羽林卫斩杀十常侍，十族清剿，朝纲重振，儒家法统胜利！`;
    } else {
      logMsg = `❌ 清算流产！由于皇帝对宦官的心理依赖（D值: ${eunuchState.dValue}）依然过重，皇帝在紧要关头收回密诏，并对发起行动的清流降旨在党禁中诛杀。`;
    }

    setQingliuState(p => ({
      ...p,
      activeLog: [logMsg, ...p.activeLog]
    }));
  };

  return (
    <div className="bg-gradient-to-b from-stone-900/90 to-stone-950/90 border border-amber-900/30 p-6 rounded-lg text-stone-300 shadow-2xl relative overflow-hidden" id="court-sandbox-root">
      {/* Background texture subtle effect */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      {activeCardId && (
        <div className="mb-6 bg-cyan-950/30 border border-cyan-800/40 p-3 rounded-md flex items-start sm:items-center justify-between text-xs animate-pulse text-cyan-200 font-serif shrink-0 shadow-lg relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-spin shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-black tracking-widest text-[#FAF8F5]">【极速朝堂法纪鸣震 · {
                activeCardId === 'qizheng' ? '《奇正相生》首级御宝' :
                activeCardId === 'huogong' ? '《火攻奇袭》烈炎秘卷' :
                activeCardId === 'wujian' ? '《五间妙连》通幽罗网' :
                '《商战大垄》国课税书'
              }】</span>
              <span className="text-cyan-300/80 font-sans tracking-wide">
                {activeCardId === 'wujian' 
                  ? '政局游说斗争获五间加权，力度 +45%势能！' 
                  : '朝堂正受兵法余威辅持，各院参政状态得解。'}
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-block font-mono text-[9px] bg-cyan-900 text-cyan-100 px-2.5 py-1 rounded-sm font-black uppercase tracking-widest border border-cyan-700">天命显现</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-amber-900/30 pb-4 relative z-10">
        <div>
          <h2 className="text-2xl font-serif font-black text-amber-500 flex items-center gap-2.5 tracking-widest drop-shadow-md">
            <Landmark className="text-amber-600 w-6 h-6" />
            禁宫朝堂 · 宦党与清流博弈
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 font-mono tracking-wide">
            模拟内廷中枢实战：极权宦官蒙蔽圣听，与在野清流结党构陷的生死罗网。
          </p>
        </div>
        
        {/* Role Toggle Selector */}
        <div className="flex border border-amber-900/50 bg-stone-900/80 shadow-inner rounded-md p-1 shrink-0">
          <button
            id="role-btn-eunuch"
            onClick={() => setRole('EUNUCH')}
            className={`px-6 py-1.5 text-xs font-serif rounded transition-all duration-300 ${
              role === 'EUNUCH' ? 'bg-gradient-to-r from-red-950 to-[#8C2F39] border border-red-800 text-amber-100 font-black shadow-md' : 'text-stone-500 hover:text-stone-300 transparent border border-transparent'
            }`}
          >
            掌大珰 (宦)
          </button>
          <button
            id="role-btn-qingliu"
            onClick={() => setRole('QINGLIU')}
            className={`px-6 py-1.5 text-xs font-serif rounded transition-all duration-300 ${
              role === 'QINGLIU' ? 'bg-gradient-to-r from-cyan-950 to-cyan-900 border border-cyan-700 text-cyan-100 font-black shadow-md' : 'text-stone-500 hover:text-stone-300 transparent border border-transparent'
            }`}
          >
            领清流 (儒)
          </button>
        </div>
      </div>

      {/* Trust Dual Axis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-stone-950/40 p-5 rounded-lg border border-stone-800 mb-8 shadow-inner relative z-10">
        {/* State meter */}
        <div className="lg:col-span-5 space-y-5">
          <div className="border-b border-amber-900/30 pb-2 flex justify-between items-end">
            <h3 className="text-sm font-serif font-black text-amber-500 tracking-widest flex items-center gap-2">
              <Scroll className="w-4 h-4 text-amber-600" />
              圣意测算面板
            </h3>
            <span className="text-[10px] bg-stone-800/80 border border-stone-700 px-2 py-0.5 rounded text-amber-200 font-mono tracking-wider">
              在位: {currentEmp.name}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1.5">
                <span className="text-amber-400 font-bold tracking-wider">皇恩依赖度 (D)</span>
                <span className="text-amber-500 font-bold font-serif">{eunuchState.dValue} / 100</span>
              </div>
              <div className="w-full bg-stone-900 h-3 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  style={{ width: `${eunuchState.dValue}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1.5">
                <span className="text-rose-400 font-bold tracking-wider flex items-center gap-1.5">
                  潜藏猜忌值 (S)
                  <span className="text-[8px] text-white bg-rose-900/80 border border-rose-700 px-1.5 py-0.5 rounded-sm font-bold uppercase">暗轴</span>
                </span>
                <span className="text-rose-500 font-bold font-serif">{eunuchState.sValue} / 100</span>
              </div>
              <div className="w-full bg-stone-900 h-3 rounded-full overflow-hidden border border-stone-800 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-red-900 to-rose-600 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(225,29,72,0.4)]"
                  style={{ width: `${eunuchState.sValue}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-stone-900/80 p-3 text-[11px] text-stone-300 rounded-md border border-stone-800 font-serif leading-relaxed shadow-sm">
            <span className="text-amber-500 font-bold mr-1">帝王秉性分析：</span> 
            <span className="opacity-80">{currentEmp.desc}</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-[10px] font-mono">
            {Object.keys(emperorConfigs).map((type) => (
              <button
                key={type}
                id={`emp-type-${type}`}
                onClick={() => setEunuchState(p => ({ ...p, emperorType: type }))}
                className={`py-1.5 rounded-sm text-center border transition-all duration-200 ${
                  eunuchState.emperorType === type
                    ? 'border-amber-500 bg-amber-900/20 text-amber-300 font-bold'
                    : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300 bg-stone-900/50'
                }`}
              >
                {emperorConfigs[type as keyof typeof emperorConfigs].name.substring(0, 2)}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Map of distrust balance */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-stone-900/50 rounded-lg border border-stone-800/50">
            <div className="absolute top-2 left-3 text-[9px] font-mono text-stone-500 tracking-wider">
              【皇权天平力学模型】
            </div>

            <div className="flex flex-col items-center justify-center w-full mt-2">
              <div className="flex items-center gap-3 bg-stone-950/80 border border-stone-800 py-1.5 px-3 rounded-md shadow-md">
                <span className="text-[11px] text-stone-400 font-mono tracking-wider">周期状态</span>
                <span className={`text-[12px] font-serif font-black tracking-widest ${
                  eunuchState.step === 'PURGED' ? 'text-rose-500 line-through' :
                  eunuchState.step === 'CRISIS' ? 'text-orange-500 animate-pulse' :
                  eunuchState.step === 'DICTATOR' ? 'text-amber-500' : 'text-emerald-400'
                }`}>
                  {eunuchState.step === 'FAVORED' && '宠冠庭闱 · 蛰伏'}
                  {eunuchState.step === 'DICTATOR' && '九千岁 · 极权巅峰'}
                  {eunuchState.step === 'CRISIS' && '龙颜将怒 · 空前危机'}
                  {eunuchState.step === 'PURGED' && '满门抄斩 · 阉党覆灭'}
                </span>
              </div>

              {/* Graphical Scale representing S/D comparison */}
              <div className="w-full max-w-md mt-6 space-y-2">
                <div className="flex justify-between text-[11px] text-stone-400 font-serif">
                  <span className="flex items-center gap-1.5"><ShieldX className="w-3.5 h-3.5 text-amber-500" /> 宦党专制</span>
                  <span className="flex items-center gap-1.5">清流绞杀 <Swords className="w-3.5 h-3.5 text-rose-500" /></span>
                </div>
                <div className="h-4 bg-stone-950 rounded-full flex overflow-hidden border border-stone-800 ring-1 ring-white/5 disabled">
                  <div className="bg-amber-600 transition-all duration-700 ease-out" style={{ width: `${(eunuchState.dValue / (eunuchState.dValue + eunuchState.sValue || 1)) * 100}%` }}></div>
                  <div className="bg-rose-600 transition-all duration-700 ease-out stripe-pattern" style={{ width: `${(eunuchState.sValue / (eunuchState.dValue + eunuchState.sValue || 1)) * 100}%` }}></div>
                </div>
                <div className="text-center pt-2 min-h-[24px]">
                  {eunuchState.sValue > eunuchState.dValue ? (
                    <span className="text-[11px] text-rose-400 font-black tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                      <ShieldAlert className="w-4 h-4" /> 皇帝清洗窗口正开启 (S &gt; D)！清流可立即发动廷诛。
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500/80 font-mono tracking-wider flex items-center justify-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> 皇恩庇护期，奸党安如泰山。
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-stone-900/60 py-2 px-4 rounded-md text-[11px] font-mono border border-stone-800">
            <div className="flex flex-col">
              <span className="text-stone-500">内帑私产</span>
              <span className="text-amber-400 font-bold text-sm">{eunuchState.eunuchWealth}两</span>
            </div>
            <div className="w-px h-6 bg-stone-800"></div>
            <div className="flex flex-col">
              <span className="text-stone-500">朝堂爪牙</span>
              <span className="text-emerald-400 font-bold text-sm">{eunuchState.eunuchInfluence}层</span>
            </div>
            <div className="w-px h-6 bg-stone-800"></div>
            <div className="flex flex-col">
              <span className="text-stone-500">掖庭专政</span>
              <span className="text-stone-300 font-bold text-sm">{eunuchState.yearsInPalace} 载</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Eunuch Panel */}
        <div className={`p-5 rounded-lg border transition-all duration-300 ${
          role === 'EUNUCH' ? 'bg-stone-900/80 border-[#8C2F39]/50 shadow-[0_0_15px_rgba(140,47,57,0.1)]' : 'bg-stone-950/50 opacity-60 border-stone-800/80 hover:opacity-80'
        }`}>
          <div className="flex justify-between items-center mb-4 border-b border-[#8C2F39]/30 pb-2">
            <h4 className="text-sm font-serif font-black text-amber-500 flex items-center gap-2 tracking-widest">
              <User className="w-4 h-4 text-[#8C2F39]" /> 阉党行动树
            </h4>
            <span className="text-[9px] text-[#8C2F39] font-mono border border-[#8C2F39]/30 px-1.5 py-0.5 rounded">残缺的皇权幽灵</span>
          </div>

          <p className="text-[11px] text-stone-400 mb-5 leading-relaxed font-serif text-justify">
            【谋主路线】建立对皇权的绝对粘连。一方面在掖庭为帝奉上声色犬马消磨圣智；另一方面矫诏越权，截留外朝奏折。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('TOYS')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-amber-600"></div>
              <div className="p-3 flex-1 flex flex-col">
                <span className="font-bold font-serif text-amber-500 group-hover:text-amber-400 text-sm mb-1">献奇珍异兽</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">寻访绝技百戏掩盖朝政，大幅消退君主猜忌。</span>
                <div className="mt-auto flex justify-end">
                  <span className="text-[10px] text-stone-300 font-black bg-stone-800 px-2 py-1 rounded-sm border border-stone-700 shadow-inner">-50金</span>
                </div>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('INTEL')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-emerald-600"></div>
              <div className="p-3 flex-1 flex flex-col">
                <span className="font-bold font-serif text-amber-500 group-hover:text-amber-400 text-sm mb-1">密奏百官</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">贩卖情报，构陷忠良，换取圣心与私人权势。</span>
                <div className="mt-auto flex justify-end">
                  <span className="text-[10px] text-emerald-400 font-black bg-stone-800 px-2 py-1 rounded-sm border border-stone-700 shadow-inner">+5影响</span>
                </div>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('BYPASS')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-rose-600 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden lg:col-span-2"
            >
              <div className="absolute top-0 w-full h-1 bg-rose-600"></div>
              <div className="p-3 flex-1 flex flex-col border-b border-stone-800">
                <span className="font-bold font-serif text-rose-500 group-hover:text-rose-400 text-sm mb-1">矫传圣旨截留奏折</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">极大扩张私权，架空外朝，但严重侵犯皇权底线引发暴怒累积。</span>
              </div>
              <div className="p-2 border-t border-stone-800 bg-stone-950 flex justify-between items-center px-3">
                <span className="text-[9px] text-stone-500 uppercase tracking-widest font-black">高风险高收益</span>
                <span className="text-[10px] text-rose-400 font-black bg-stone-800 px-2 py-1 rounded-sm shadow-inner">+18猜忌危局</span>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('SELL_OFFICE')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden lg:col-span-2"
            >
              <div className="absolute top-0 w-full h-1 bg-yellow-500"></div>
              <div className="p-3 flex-1 flex flex-col border-b border-stone-800">
                <span className="font-bold font-serif text-yellow-500 group-hover:text-yellow-400 text-sm mb-1">卖官鬻爵</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">疯狂敛财，出售盐运使司缺口，激化朝野民怨，猜忌骤升。</span>
              </div>
              <div className="p-2 border-t border-stone-800 bg-stone-950 flex justify-between items-center px-3">
                <span className="text-[9px] text-stone-500 uppercase tracking-widest font-black">财富掠夺</span>
                <span className="text-[10px] text-yellow-500 font-black bg-stone-800 px-2 py-1 rounded-sm shadow-inner">+200巨金</span>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('ATTACK_QING')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden lg:col-span-2"
            >
              <div className="absolute top-0 w-full h-1 bg-red-600"></div>
              <div className="p-3 flex-1 flex flex-col">
                <span className="font-black font-serif text-red-500 group-hover:text-red-400 text-sm mb-1">文字狱党锢之祸</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">掀起大网，销毁清流苦集半生的罪证，流放言官。</span>
                <div className="mt-auto flex justify-end">
                  <span className="text-[10px] text-red-400 font-black bg-stone-800 px-2 py-1 rounded-sm border border-stone-700 shadow-inner">摧毁30证</span>
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Qingliu Panel */}
        <div className={`p-5 rounded-lg border transition-all duration-300 ${
          role === 'QINGLIU' ? 'bg-stone-900/80 border-cyan-800/50 shadow-[0_0_15px_rgba(22,78,99,0.2)]' : 'bg-stone-950/50 opacity-60 border-stone-800/80 hover:opacity-80'
        }`}>
          <div className="flex justify-between items-center mb-4 border-b border-cyan-900/50 pb-2">
            <h4 className="text-sm font-serif font-black text-cyan-300 flex items-center gap-2 tracking-widest">
              <Award className="w-4 h-4 text-cyan-500" /> 清流大儒行动树
            </h4>
            <span className="text-[9px] text-cyan-400 font-mono border border-cyan-800 px-1.5 py-0.5 rounded">治国定邦之道统</span>
          </div>

          <p className="text-[11px] text-stone-400 mb-5 leading-relaxed font-serif text-justify">
            【正义必杀链】分阶段打击极权宦官。潜伏暗查积累铁证 → 书院讲学造舆论 → 待到皇帝猜忌极化时（S &gt; D），一击必杀血洗阉党。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('SEARCH_VOUCHER')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-cyan-600"></div>
              <div className="p-3 flex-1 flex flex-col">
                <span className="font-bold font-serif text-cyan-400 group-hover:text-cyan-300 text-sm mb-1">安插卧底取证</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">潜入阉党私盐暗库，获取致命把柄。</span>
                <div className="mt-auto flex justify-end">
                  <span className="text-[10px] text-cyan-200 font-black bg-stone-800 px-2 py-1 rounded-sm border border-stone-700 shadow-inner">+25密证</span>
                </div>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('LECTURE')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden"
            >
              <div className="absolute top-0 w-full h-1 bg-cyan-600"></div>
              <div className="p-3 flex-1 flex flex-col">
                <span className="font-bold font-serif text-cyan-400 group-hover:text-cyan-300 text-sm mb-1">东林讲学会审</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">散布异端凶兆，引发太学生与天下士子激愤。</span>
                <div className="mt-auto flex justify-end">
                  <span className="text-[10px] text-cyan-200 font-black bg-stone-800 px-2 py-1 rounded-sm border border-stone-700 shadow-inner">+20舆论</span>
                </div>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('CONNECT_GENERAL')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden lg:col-span-2"
            >
              <div className="absolute top-0 w-full h-1 bg-blue-600"></div>
              <div className="p-3 flex-1 flex flex-col">
                <span className="font-bold font-serif text-blue-400 group-hover:text-blue-300 text-sm mb-1">密会九门提督</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">手握京师卫戍，结纳军事将领，防阉党兵变。</span>
                <div className="mt-auto flex justify-end">
                  <span className="text-[10px] text-blue-200 font-black bg-stone-800 px-2 py-1 rounded-sm border border-stone-700 shadow-inner">+武将同盟</span>
                </div>
              </div>
            </motion.button>

            <motion.button
               whileHover={{ scale: 1.05, y: -5 }}
               whileTap={{ scale: 0.95 }}
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('IMPEACH')}
               className="bg-stone-900 border-2 border-stone-700 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] text-stone-300 rounded-xl text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40 relative overflow-hidden lg:col-span-4"
            >
              <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
              <div className="p-3 flex-1 flex flex-col border-b border-stone-800">
                <span className="font-black font-serif text-amber-500 group-hover:text-amber-400 text-sm mb-1">死谏伏阙惊天弹劾</span>
                <span className="text-[10px] text-stone-400 font-mono flex-1">携天下舆情与铁证，拼死弹劾。需证据&ge;50且舆论&ge;40，否则身首异处。一旦成功，皇帝暴怒，S值飙升！</span>
              </div>
              <div className="p-2 border-t border-stone-800 bg-stone-950 flex justify-between items-center px-3">
                <span className="text-[9px] text-stone-500 uppercase tracking-widest font-black">终极博弈</span>
                <span className="text-[10px] text-amber-400 font-black bg-stone-800 px-2 py-1 rounded-sm shadow-inner">引爆猜忌45+</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
              onClick={triggerCleansing}
              className={`w-full text-xs font-serif font-black py-4 px-4 rounded-xl lg:col-span-4 shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-widest ${
                eunuchState.sValue > eunuchState.dValue
                  ? 'bg-gradient-to-r from-red-800 to-rose-700 border border-rose-500 text-white hover:from-rose-700 hover:to-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)] cursor-pointer ring-2 ring-rose-500/30'
                  : 'bg-stone-900 border-2 border-stone-800 text-stone-600 cursor-not-allowed'
              }`}
            >
              <ShieldAlert className={`w-5 h-5 ${eunuchState.sValue > eunuchState.dValue ? 'animate-pulse' : ''}`} />
              奉天讨逆 · 启动【九门密诏血洗魏党】 (需猜忌 S &gt; 依赖 D)
            </motion.button>
          </div>
        </div>
      </div>

      {/* Interactive Log Console */}
      <div className="bg-stone-950/80 rounded-lg border border-stone-800 p-5 mt-8 shadow-inner relative z-10">
        <h4 className="text-[11px] font-mono text-stone-400 tracking-widest mb-3 font-bold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> 咸阳宫·太极殿 密卷日志 (Logs)
        </h4>
        <div className="space-y-2 text-xs font-mono leading-relaxed bg-black/40 p-3 rounded border border-stone-900 min-h-[120px]">
          {role === 'EUNUCH' ? (
            eunuchState.courtLog.length === 0 ? <span className="text-stone-600">廷内渊澄，尚无波动...</span> :
            eunuchState.courtLog.map((log, i) => (
              <div key={i} className="text-amber-100/90 border-l-2 border-[#8C2F39] pl-3 py-1 bg-gradient-to-r from-[#8C2F39]/10 to-transparent flex items-start break-words whitespace-normal">
                <span className="text-[#8C2F39] mr-2">▶</span> {log}
              </div>
            ))
          ) : (
            qingliuState.activeLog.length === 0 ? <span className="text-stone-600">朝野暗流，尚无回音...</span> :
            qingliuState.activeLog.map((log, i) => (
              <div key={i} className="text-cyan-100/90 border-l-2 border-cyan-600 pl-3 py-1 bg-gradient-to-r from-cyan-900/20 to-transparent flex items-start break-words whitespace-normal">
                <span className="text-cyan-500 mr-2">▶</span> {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
