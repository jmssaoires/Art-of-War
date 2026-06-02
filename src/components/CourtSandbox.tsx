import React, { useState } from 'react';
import { EunuchGameState, QingliuActionState, Character } from '../types';
import { Sparkles, Star, User, ShieldAlert, Award, FileSpreadsheet, Send, ShieldX, HelpCircle, Landmark, Swords, Scroll, UserCheck } from 'lucide-react';

export default function CourtSandbox() {
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
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="court-sandbox-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <Landmark className="text-[#8C2F39] w-5 h-5 font-bold" />
            【朝堂局】皇帝 × 宦官信任双轴沙盒
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            孙子兵法第六篇《虚实篇》朝堂变体：宦官卖弄虚实控制皇帝，清流水滴石穿暗中搜证准备致命弹劾。
          </p>
        </div>
        
        {/* Role Toggle Selector */}
        <div className="flex border border-[#1A1A1A]/15 bg-white/50 backdrop-blur-sm rounded p-0.5 self-end">
          <button
            id="role-btn-eunuch"
            onClick={() => setRole('EUNUCH')}
            className={`px-3 py-1 text-xs font-serif rounded transition ${
              role === 'EUNUCH' ? 'bg-[#8C2F39] text-[#F5F2ED] font-black' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            掌大珰 (Eunuch)
          </button>
          <button
            id="role-btn-qingliu"
            onClick={() => setRole('QINGLIU')}
            className={`px-3 py-1 text-xs font-serif rounded transition ${
              role === 'QINGLIU' ? 'bg-[#8C2F39] text-[#F5F2ED] font-black' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            领清流 (Qingliu)
          </button>
        </div>
      </div>

      {/* Trust Dual Axis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/50 p-4 rounded border border-[#1A1A1A]/15 mb-6 shadow-xs">
        {/* State meter */}
        <div className="md:col-span-4 space-y-4">
          <h3 className="text-xs font-mono text-[#1A1A1A]/80 uppercase tracking-widest border-b border-[#1A1A1A]/15 pb-1.5 flex justify-between font-bold">
            <span>天心圣意指标</span>
            <span className="text-[#5A5A40] font-bold">{currentEmp.name}</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[#5A5A40] font-bold flex items-center gap-1">皇恩依赖度 (D)</span>
              <span className="text-[#5A5A40] font-bold">{eunuchState.dValue} / 100</span>
            </div>
            <div className="w-full bg-[#1A1A1A]/5 h-2.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#5A5A40] rounded-full transition-all duration-300"
                style={{ width: `${eunuchState.dValue}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[#8C2F39] font-bold flex items-center gap-1">
                皇帝暗中猜忌值 (S)
                <span className="text-[9px] text-[#F5F2ED] bg-[#8C2F39] px-1 rounded font-bold">隐藏</span>
              </span>
              <span className="text-[#8C2F39] font-bold">{eunuchState.sValue} / 100</span>
            </div>
            <div className="w-full bg-[#1A1A1A]/5 h-2.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8C2F39] rounded-full transition-all duration-300"
                style={{ width: `${eunuchState.sValue}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/60 p-2 text-[11px] text-[#1A1A1A]/80 rounded border border-[#1A1A1A]/5 font-serif">
            <strong>皇帝性格点评:</strong> {currentEmp.desc}
          </div>

          <div className="grid grid-cols-5 gap-1 text-[9px] font-mono">
            {Object.keys(emperorConfigs).map((type) => (
              <button
                key={type}
                id={`emp-type-${type}`}
                onClick={() => setEunuchState(p => ({ ...p, emperorType: type }))}
                className={`py-1 rounded text-center border transition ${
                  eunuchState.emperorType === type
                    ? 'border-[#8C2F39] bg-[#8C2F39]/10 text-[#8C2F39] font-bold'
                    : 'border-[#1A1A1A]/10 text-[#1A1A1A]/50 hover:bg-black/5 hover:text-[#1A1A1A]'
                }`}
              >
                {emperorConfigs[type as keyof typeof emperorConfigs].name.substring(0, 2)}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Map of distrust balance */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div className="flex-1 flex gap-4 items-center justify-center p-3 relative h-36">
            <div className="absolute top-1 left-2 text-[9px] font-mono text-[#1A1A1A]/60 tracking-wider">
              【双轴博弈天平】D值重于S，宦官掌权；S值压倒D，清流可启动清洗窗口。
            </div>

            <div className="flex flex-col items-center justify-center w-full mt-4">
              <div className="text-xs uppercase font-mono font-bold px-2 py-1 bg-white/80 border border-[#1A1A1A]/15 rounded text-[#1A1A1A]">
                生命期状态：
                <span className={`px-1.5 py-0.5 rounded font-bold ${
                  eunuchState.step === 'PURGED' ? 'bg-red-100 text-[#8C2F39] line-through' :
                  eunuchState.step === 'CRISIS' ? 'bg-[#8C2F39]/10 text-[#8C2F39] animate-pulse' :
                  eunuchState.step === 'DICTATOR' ? 'bg-[#5A5A40]/10 text-[#5A5A40]' : 'bg-[#5A5A40] text-[#F5F2ED]'
                }`}>
                  {eunuchState.step === 'FAVORED' && '『宠冠内廷得幸』'}
                  {eunuchState.step === 'DICTATOR' && '『权倾天下专执』'}
                  {eunuchState.step === 'CRISIS' && '『危亡大谋危机』'}
                  {eunuchState.step === 'PURGED' && '『朝纲清算清洗』'}
                </span>
              </div>

              {/* Graphical Scale representing S/D comparison */}
              <div className="w-full max-w-sm mt-5 space-y-1">
                <div className="flex justify-between text-[10px] text-[#1A1A1A]/60 font-mono">
                  <span>宦官专断 (D)</span>
                  <span>清官反扑杀 (S)</span>
                </div>
                <div className="h-2 bg-[#1A1A1A]/10 rounded-full flex overflow-hidden">
                  <div className="bg-[#5A5A40]" style={{ width: `${(eunuchState.dValue / (eunuchState.dValue + eunuchState.sValue || 1)) * 100}%` }}></div>
                  <div className="bg-[#8C2F39] animate-pulse" style={{ width: `${(eunuchState.sValue / (eunuchState.dValue + eunuchState.sValue || 1)) * 100}%` }}></div>
                </div>
                <div className="text-center">
                  {eunuchState.sValue > eunuchState.dValue ? (
                    <span className="text-[10px] text-[#8C2F39] animate-pulse font-mono font-bold tracking-wider">● 皇帝清洗窗口正开启 (S &gt; D)！清流可发动【圣旨清抄】</span>
                  ) : (
                    <span className="text-[10px] text-[#5A5A40] font-mono tracking-wider">● 极权稳固 (D &gt; S) 皇帝心怀庇护，朝堂任予取予夺</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white/70 p-2 rounded text-[11px] font-mono border border-[#1A1A1A]/10">
            <span>魏珰财富：<strong className="text-[#8C2F39] text-xs font-bold">{eunuchState.eunuchWealth}两</strong></span>
            <span>武断势力：<strong className="text-[#5A5A40] text-xs font-bold">{eunuchState.eunuchInfluence}层</strong></span>
            <span>掖庭工龄：<strong className="text-[#1A1A1A] font-bold">{eunuchState.yearsInPalace} 回合</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eunuch Panel */}
        <div className={`p-4 rounded border transition ${
          role === 'EUNUCH' ? 'bg-white/60 border-[#8C2F39]/35 shadow-sm' : 'bg-white/20 opacity-60 border-[#1A1A1A]/10'
        }`}>
          <div className="flex justify-between items-center mb-3 border-b border-[#1A1A1A]/5 pb-1">
            <h4 className="text-xs font-serif font-black text-[#8C2F39]">
              魏大太监 · 惑主乱朝执掌枢要
            </h4>
            <span className="text-[9px] text-[#1A1A1A]/40 font-mono">第3、4模块专用</span>
          </div>

          <p className="text-xs text-[#1A1A1A]/70 mb-4 leading-relaxed font-serif">
            【谋主路线】建立对皇权的深切粘连。一方面在掖庭为帝奉上各种声色犬马（消磨圣智），一方面截留奏折控制真实战况。
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
               id="eunuch-action-toys"
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('TOYS')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#1A1A1A]">声色贡宠</span>
                <span className="text-[9px] text-[#8C2F39] font-bold">-50金</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">大幅上升帝依赖 抑制猜忌成长</span>
            </button>

            <button
               id="eunuch-action-intel"
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('INTEL')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#1A1A1A]">私递外朝密折</span>
                <span className="text-[9px] text-[#5A5A40] font-bold">+5影响</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">献上清流黑料 树立自身防卫</span>
            </button>

            <button
               id="eunuch-action-bypass"
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('BYPASS')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between col-span-2 shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full font-bold">
                <span className="font-bold text-[#1A1A1A]">中途截奏圣裁 (矫诏越权)</span>
                <span className="text-[9px] text-[#8C2F39]">+18猜忌</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">私自抽干下臣弹劾 扩充魏督公爪牙。由于侵害君主威权，引发极高猜忌积累</span>
            </button>

            <button
               id="eunuch-action-sell"
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('SELL_OFFICE')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#1A1A1A]">盐道授职</span>
                <span className="text-[9px] text-[#5A5A40] font-bold">+200金</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">出卖度支缺口 产生极高财富</span>
            </button>

            <button
               id="eunuch-action-attack"
               disabled={role !== 'EUNUCH' || eunuchState.step === 'PURGED'}
               onClick={() => doEunuchAction('ATTACK_QING')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#8C2F39] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full font-bold">
                <span>文字党锢清洗</span>
                <span className="text-[9px] text-[#1A1A1A]/50">压制</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">疯狂绞碎清流密谋的物证卷宗</span>
            </button>
          </div>
        </div>

        {/* Qingliu Panel */}
        <div className={`p-4 rounded border transition ${
          role === 'QINGLIU' ? 'bg-white/60 border-[#8C2F39]/35 shadow-sm' : 'bg-white/20 opacity-60 border-[#1A1A1A]/10'
        }`}>
          <div className="flex justify-between items-center mb-3 border-b border-[#1A1A1A]/5 pb-1">
            <h4 className="text-xs font-serif font-black text-[#5A5A40]">
              内阁清流大员 · 清议除奸百折死谏
            </h4>
            <span className="text-[9px] text-[#1A1A1A]/40 font-mono">第5模块专用</span>
          </div>

          <p className="text-xs text-[#1A1A1A]/70 mb-4 leading-relaxed font-serif">
            【致命行动树】分阶段打击极权宦官。积累证据 → 讲学造舆论 → 金殿死谏廷议弹劾。必须等猜忌（S）高于依赖（D）方可成功抄家。
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
               id="qingliu-action-search"
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('SEARCH_VOUCHER')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#1A1A1A]">暗置密探彻查</span>
                <span className="text-[9px] text-[#5A5A40] font-bold">+25证</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">搜集侵占辽饷、私营私盐铁证</span>
            </button>

            <button
               id="qingliu-action-lecture"
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('LECTURE')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#1A1A1A]">私人书院讲学</span>
                <span className="text-[9px] text-[#5A5A40] font-bold">+20舆</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">清议造神，散布异端灾星凶兆</span>
            </button>

            <button
               id="qingliu-action-impeach"
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('CONNECT_GENERAL')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#1A1A1A] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-[#1A1A1A]">游说卫戍将军</span>
                <span className="text-[9px] text-[#5A5A40] font-bold">+1同盟</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">结拜军事盟友，为兵谏预作准备</span>
            </button>

            <button
               id="qingliu-action-strike"
               disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
               onClick={() => doQingliuAction('IMPEACH')}
               className="bg-white hover:bg-neutral-50 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/50 text-[#8C2F39] text-xs py-2 px-3 rounded text-left transition flex flex-col justify-between shadow-xs disabled:opacity-40"
            >
              <div className="flex justify-between items-center w-full font-bold">
                <span>【致命狂弹弹劾】</span>
                <span className="text-[9px] text-[#1A1A1A]/50">死谏</span>
              </div>
              <span className="text-[9px] text-[#1A1A1A]/50 mt-1">需要积累50%以上证据及40%舆论</span>
            </button>

            <button
              id="qingliu-action-cleansing"
              disabled={role !== 'QINGLIU' || eunuchState.step === 'PURGED'}
              onClick={triggerCleansing}
              className={`w-full text-xs font-serif font-black py-2.5 px-3 rounded sm:col-span-2 shadow transition flex items-center justify-center gap-2 ${
                eunuchState.sValue > eunuchState.dValue
                  ? 'bg-[#8C2F39] text-[#F5F2ED] hover:bg-[#8C2F39]/90'
                  : 'bg-neutral-200 text-[#1A1A1A]/40 cursor-not-allowed'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              奉天讨邪 · 启动【九门密诏清算魏党】 (需要 S &gt; D)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Log Console */}
      <div className="bg-white/80 rounded border border-[#1A1A1A]/15 p-4 mt-6">
        <h4 className="text-[10px] font-mono text-[#1A1A1A]/60 tracking-wider mb-2 font-bold uppercase">咸阳宫·太极殿密闻秘卷 Logs</h4>
        <div className="space-y-1.5 text-xs font-mono">
          {role === 'EUNUCH' ? (
            eunuchState.courtLog.map((log, i) => (
              <div key={i} className="text-[#8C2F39] border-l-2 border-[#8C2F39]/20 pl-2 py-0.5">{log}</div>
            ))
          ) : (
            qingliuState.activeLog.map((log, i) => (
              <div key={i} className="text-[#5A5A40] border-l-2 border-[#5A5A40]/20 pl-2 py-0.5">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
