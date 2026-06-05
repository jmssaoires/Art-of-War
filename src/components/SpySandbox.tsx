import React, { useState } from 'react';
import { SpyAgent } from '../types';
import { Crown, Feather, User, MapPin, Wine, Gem, MessageSquare, Skull, Award, ScrollText, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sfx } from '../utils/sfx';

export default function SpySandbox() {
  const [gold, setGold] = useState<number>(800); // 金龙币
  const [influence, setInfluence] = useState<number>(40); // 影响力
  const [selectedSpyId, setSelectedSpyId] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Initial spies using new GoT-esque themes
  const [spies, setSpies] = useState<SpyAgent[]>([
    { id: 'spy-1', name: '君临小小鸟', type: 'WHISPERER', cost: 40, credibility: 95, motivation: 'WEALTH', loyalty: 60, isDiscovered: false, state: 'IDLE' },
    { id: 'spy-2', name: '黑白院学徒', type: 'ASSASSIN', cost: 150, credibility: 99, motivation: 'DEVOTION', loyalty: 90, isDiscovered: false, state: 'IDLE' },
    { id: 'spy-3', name: '王领弄臣', type: 'COURTIER', cost: 80, credibility: 75, motivation: 'POWER', loyalty: 40, isDiscovered: false, state: 'IDLE' }
  ]);

  const [activeLog, setActiveLog] = useState<string[]>([
    '【七国弈局】“混乱不是深渊，混乱是阶梯。”—— 御前会议沙盘已开启。',
    '注意：特务的【忠诚度】会随差事与欲望而波动。忠诚过低将导致致命背叛。'
  ]);

  const [activePopup, setActivePopup] = useState<{
    type: 'BETRAYAL' | 'CAUGHT' | 'SUCCESS' | 'RECRUIT';
    msg: string;
    charName: string;
    emoji: string;
  } | null>(null);

  const [recruitType, setRecruitType] = useState<'WHISPERER' | 'ASSASSIN' | 'COURTIER' | 'MAESTER'>('WHISPERER');
  const [recruitMotiv, setRecruitMotiv] = useState<'POWER' | 'WEALTH' | 'REVENGE' | 'FEAR' | 'DEVOTION'>('WEALTH');

  const handleRecruit = () => {
    sfx.playSelect();
    let cost = 0;
    let name = '';
    let cred = 0;

    if (recruitType === 'WHISPERER') {
      cost = 40; name = `情报总管网眼`; cred = 85; 
    } else if (recruitType === 'ASSASSIN') {
      cost = 200; name = `无面者刺客`; cred = 95;
    } else if (recruitType === 'COURTIER') {
      cost = 120; name = `宫廷权臣`; cred = 70;
    } else {
      cost = 80; name = `学城暗斗学士`; cred = 80;
    }

    if (gold < cost) {
      setActiveLog(prev => [`⚠️ 国库空虚！无足够金龙币招揽此人。`, ...prev]);
      return;
    }

    let initialLoyalty = 40 + Math.round(Math.random() * 40);
    if (recruitMotiv === 'DEVOTION') initialLoyalty = Math.min(100, initialLoyalty + 25);
    if (recruitMotiv === 'WEALTH') initialLoyalty = Math.max(0, initialLoyalty - 10);
    if (recruitMotiv === 'FEAR') initialLoyalty = Math.min(100, initialLoyalty + 15);

    const newSpy: SpyAgent = {
      id: `spy-${Date.now()}`,
      name,
      type: recruitType as any,
      cost,
      credibility: cred,
      motivation: recruitMotiv,
      loyalty: initialLoyalty,
      isDiscovered: false,
      state: 'IDLE'
    };

    setGold(prev => prev - cost);
    setSpies(prev => [...prev, newSpy]);
    const recruitMsg = `【暗局契约】出于对《${
      recruitMotiv === 'POWER' ? '权力' : 
      recruitMotiv === 'WEALTH' ? '金币' : 
      recruitMotiv === 'REVENGE' ? '复仇' : 
      recruitMotiv === 'FEAR' ? '恐惧的屈从' : '狂热信仰'
    }》的渴望，【${name}】加入麾下。`;
    setActiveLog(prev => [`📜 ${recruitMsg}`, ...prev]);

    setActivePopup({
      type: 'RECRUIT',
      msg: recruitMsg,
      charName: name,
      emoji: recruitType === 'ASSASSIN' ? '🥷' : recruitType === 'WHISPERER' ? '🐦' : recruitType === 'MAESTER' ? '🦉' : '🎭'
    });
    setTimeout(() => setActivePopup(null), 3500);
  };

  const executeMission = (id: string, missionType: 'POISON' | 'WHISPER' | 'FORGERY') => {
    sfx.playSword();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);

    const target = spies.find(s => s.id === id);
    if (!target) return;

    // Send to mission
    setSpies(prev => prev.map(s => s.id === id ? { ...s, state: 'MISSION' as const } : s));
    setSelectedSpyId(null);
    
    setTimeout(() => {
      let isBetrayal = false;
      let isCaught = false;
      let msg = '';
      
      // Loyalty Betrayal Check (Lower loyalty = highly likely to betray)
      const betrayalChance = Math.max(0, 80 - target.loyalty); 
      if (Math.random() * 100 < betrayalChance) {
        isBetrayal = true;
      } else {
        const risk = missionType === 'POISON' ? 45 : missionType === 'FORGERY' ? 25 : 10;
        // Assassin type has much lower poison risk, Whisperer has lower whisper risk
        let finalRisk = risk;
        if (missionType === 'POISON' && target.type === 'ASSASSIN') finalRisk = 15;
        if (missionType === 'WHISPER' && target.type === 'WHISPERER') finalRisk = 2;
        if (missionType === 'FORGERY' && target.type === 'MAESTER') finalRisk = 5;

        isCaught = (Math.random() * 100) < finalRisk;
      }

      const motivMap: Record<string, string> = { POWER: '权力', WEALTH: '贪婪', REVENGE: '仇恨', FEAR: '怯懦', DEVOTION: '狂热' };
      const mName = missionType === 'POISON' ? '暗杀投毒' : missionType === 'FORGERY' ? '书信伪造' : '散播流言';

      let popType: 'BETRAYAL' | 'CAUGHT' | 'SUCCESS' | 'RECRUIT' = 'SUCCESS';

      if (isBetrayal) {
         msg = `🗡️ 【血色背叛！】${target.name} 因忠诚涣散（受其${motivMap[target.motivation]}本性驱使），向【君临御前会议】告发了你的阴谋，甚至卷走行动资金！你的影响力暴跌！`;
         popType = 'BETRAYAL';
         setInfluence(i => Math.max(0, i - 25));
         setGold(g => Math.max(0, g - 100)); // Stole some gold
         setSpies(prev => prev.filter(s => s.id !== id));
      } else if (isCaught) {
         msg = `⛓️ 【阴谋败露】执行【${mName}】时，${target.name} 被地牢廷卫抓获。`;
         popType = 'CAUGHT';
         setInfluence(i => Math.max(0, i - 10));
         if (target.motivation === 'WEALTH' || target.motivation === 'FEAR') {
            msg += ` 狱中不堪酷刑拷打崩溃招供，直接牵连于你！`;
            setInfluence(i => Math.max(0, i - 15));
         } else if (target.motivation === 'DEVOTION' || target.motivation === 'REVENGE') {
            msg += ` 其忠硬似铁，咬舌自尽，未泄半字。`;
         }
         setSpies(prev => prev.filter(s => s.id !== id));
      } else {
         if (missionType === 'POISON') {
           msg = `🍷 【凛冬将至】“勒颈魔”发作！封建大领主在婚宴上暴毙，铁王座动荡。你扶植了傀儡，影响力大增。`;
           setInfluence(i => i + 30);
           setGold(g => g + 150);
         } else if (missionType === 'FORGERY') {
           msg = `📜 【权谋之术】一纸以领主印泥封缄的伪造书信，成功令北境与西境两大家族互相猜忌爆发冲突。`;
           setInfluence(i => i + 15);
           setGold(g => g + 80);
         } else {
           msg = `🗣️ 【市井暗语】关于王储血统乃乱伦所出的流言已传遍都城酒馆，教会开始弹劾王室。`;
           setInfluence(i => i + 8);
           setGold(g => g + 30);
         }
         
         let loyaltyChange = 0;
         if (target.motivation === 'WEALTH') loyaltyChange = 12; // Loves successful missions bringing gold
         else if (target.motivation === 'FEAR') loyaltyChange = -8; // Missions increase paranoia
         else if (target.motivation === 'POWER') loyaltyChange = 5;
         else loyaltyChange = 2;

         if (target.motivation === 'FEAR' && loyaltyChange < 0) {
           msg += ` （由于长期处于高压恐惧，该特务忠诚度下降了！）`;
         }

         setSpies(prev => prev.map(s => s.id === id ? { ...s, state: 'IDLE' as const, loyalty: Math.max(0, Math.min(100, s.loyalty + loyaltyChange)) } : s));
      }

      setActiveLog(prev => [msg, ...prev].slice(0, 8));
      setActivePopup({
        type: popType,
        msg,
        charName: target.name,
        emoji: popType === 'BETRAYAL' ? '🗡️' : popType === 'CAUGHT' ? '⛓️' : '🍷'
      });
      setTimeout(() => setActivePopup(null), 3500);
    }, 1500);
  };

  return (
    <div 
      className={`bg-[#0A0A0C] border border-[#2D3139] p-4 sm:p-6 rounded-lg text-[#C8CDD6] shadow-2xl relative overflow-hidden font-serif ${isShaking ? 'animate-shake' : ''}`} 
      id="intrigue-sandbox-root"
      onClick={() => sfx.init()}
    >
      {/* Dark fantasy noise overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] pointer-events-none mix-blend-overlay"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-[#2D3139] pb-4 relative z-10 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#D4AF37] flex items-center gap-2 tracking-widest drop-shadow-md">
            <Crown className="w-6 h-6 text-[#D4AF37]" />
            权力的游戏 · 王座密室
          </h2>
          <p className="text-xs text-[#8A95A5] mt-1 tracking-wide opacity-80">
            操纵各方势力，平衡金币与恐惧，提防手下的背叛。凡人皆有一死。
          </p>
        </div>
        <span className="text-[10px] border border-[#D4AF37]/40 px-3 py-1.5 text-[#D4AF37]/80 rounded bg-[#1A1A1A] shadow-inner uppercase tracking-widest">
          御前会议 · 绝密卷宗
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        
        {/* Recruitment office & Stats */}
        <div className="xl:col-span-4 space-y-6">
          
          <div className="bg-[#12141A] border border-[#2D3139] p-4 rounded text-[11px] shadow-inner flex justify-between">
            <div className="flex flex-col">
              <span className="text-[#8A95A5] mb-1">国库金龙币</span>
              <span className="text-[#D4AF37] text-xl font-bold flex items-center gap-1.5">{gold} <span className="text-xs opacity-60">枚</span></span>
            </div>
            <div className="w-px bg-[#2D3139]"></div>
            <div className="flex flex-col items-end">
              <span className="text-[#8A95A5] mb-1">家族影响力 (成王之基)</span>
              <span className={`text-xl font-bold flex items-center gap-1.5 ${influence > 70 ? 'text-[#D4AF37]' : influence < 30 ? 'text-[#8C2F39]' : 'text-[#C8CDD6]'}`}>
                {influence} <span className="text-xs opacity-60">/ 100</span>
              </span>
            </div>
          </div>

          <div className="bg-[#181A20] p-5 rounded border border-[#2D3139] shadow-lg relative">
            <h3 className="text-sm text-[#D4AF37] flex items-center gap-2 mb-4 font-black tracking-widest border-b border-[#2D3139] pb-2">
              <User className="w-4 h-4" /> 培植党羽 (雇佣)
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[11px] text-[#8A95A5] block mb-2 tracking-wider">身份阶层</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'WHISPERER', name: '小小鸟', cost: 40, desc: '擅长窃听流言' },
                    { key: 'ASSASSIN', name: '无面者', cost: 200, desc: '致命稳妥剧毒' },
                    { key: 'COURTIER', name: '王领弄臣', cost: 120, desc: '宫廷渗透极佳' },
                    { key: 'MAESTER', name: '灰衣学士', cost: 80, desc: '精通医药伪造' }
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setRecruitType(t.key as any)}
                      className={`p-2 rounded-md text-left transition-all duration-200 border ${
                        recruitType === t.key
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-[#2D3139] bg-[#12141A] text-[#8A95A5] hover:border-[#8A95A5]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{t.name}</span>
                        <span className="text-[10px] text-[#D4AF37]/70">{t.cost}G</span>
                      </div>
                      <div className="text-[9px] opacity-60">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#8A95A5] block mb-2 tracking-wider">人性欲念 (决定忠诚走向)</label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {[
                    { key: 'POWER', name: '对权力的渴望' },
                    { key: 'WEALTH', name: '嗜金如命' },
                    { key: 'REVENGE', name: '血海深仇' },
                    { key: 'FEAR', name: '慑于暴虐' },
                    { key: 'DEVOTION', name: '狂热崇拜' }
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setRecruitMotiv(m.key as any)}
                      className={`py-1.5 px-1 rounded-sm transition-all text-center border ${
                        recruitMotiv === m.key
                          ? 'bg-[#2D3139] text-[#D4AF37] border-[#D4AF37]/50'
                          : 'bg-[#12141A] border-[#2D3139] text-[#8A95A5] hover:text-[#C8CDD6]'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRecruit}
                className="w-full bg-gradient-to-r from-[#2A2416] to-[#1A1813] hover:from-[#3A3220] border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-black tracking-widest py-3 rounded shadow-lg mt-2 transition-all flex justify-center items-center gap-2"
              >
                缔结血誓 (招揽)
              </button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="xl:col-span-8 flex flex-col space-y-6">
          
          <div className="bg-[#12141A] p-5 rounded border border-[#2D3139] relative overflow-hidden">
             {/* Map overlay graphic */}
             <div className="absolute inset-y-0 right-0 w-2/3 opacity-5 pointer-events-none mix-blend-screen bg-contain bg-right bg-no-repeat" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/diagmonds-light.png")' }}></div>
            
            <h3 className="text-sm text-[#C8CDD6] mb-4 font-black tracking-widest flex items-center justify-between border-b border-[#2D3139] pb-3 relative z-10">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D4AF37]" /> 君临地图板</span>
              <span className="text-[10px] text-[#8A95A5] bg-[#0A0A0C] px-2 py-0.5 rounded border border-[#2D3139]">
                {selectedSpyId ? '请委派阴谋任务' : '点选下方棋子以行动'}
              </span>
            </h3>

            <div className="relative h-48 bg-[#0B0D12] rounded border border-[#2D3139] mt-2 p-4 flex justify-around items-center z-10 shadow-inner">
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!selectedSpyId || spies.find(s => s.id === selectedSpyId)?.state === 'MISSION'}
                onClick={() => selectedSpyId && executeMission(selectedSpyId, 'WHISPER')}
                className="flex flex-col items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group/node"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                  selectedSpyId ? 'border-cyan-700 bg-cyan-950/30' : 'border-[#2D3139] bg-[#12141A]'
                }`}>
                  <MessageSquare className={`w-5 h-5 ${selectedSpyId ? 'text-cyan-500' : 'text-[#8A95A5]'}`} />
                </div>
                <div className="text-center">
                  <span className={`text-[11px] block transition-colors ${selectedSpyId ? 'text-cyan-400 font-bold' : 'text-[#8A95A5]'}`}>市井酒馆</span>
                  <span className="text-[9px] text-[#A0A5B1]/50">散播流言</span>
                </div>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!selectedSpyId || spies.find(s => s.id === selectedSpyId)?.state === 'MISSION'}
                onClick={() => selectedSpyId && executeMission(selectedSpyId, 'FORGERY')}
                className="flex flex-col items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group/node"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                  selectedSpyId ? 'border-amber-700 bg-amber-950/30' : 'border-[#2D3139] bg-[#12141A]'
                }`}>
                  <ScrollText className={`w-6 h-6 ${selectedSpyId ? 'text-amber-500' : 'text-[#8A95A5]'}`} />
                </div>
                <div className="text-center">
                  <span className={`text-sm block transition-colors ${selectedSpyId ? 'text-amber-500 font-bold' : 'text-[#8A95A5]'}`}>列座封臣</span>
                  <span className="text-[10px] text-[#A0A5B1]/50">伪造挑拨密信</span>
                </div>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!selectedSpyId || spies.find(s => s.id === selectedSpyId)?.state === 'MISSION'}
                onClick={() => selectedSpyId && executeMission(selectedSpyId, 'POISON')}
                className="flex flex-col items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group/node"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                  selectedSpyId ? 'border-[#8C2F39] bg-[#8C2F39]/20' : 'border-[#2D3139] bg-[#12141A]'
                }`}>
                  <Wine className={`w-5 h-5 ${selectedSpyId ? 'text-[#EF4444]' : 'text-[#8A95A5]'}`} />
                </div>
                <div className="text-center">
                  <span className={`text-[11px] block transition-colors ${selectedSpyId ? 'text-[#EF4444] font-bold' : 'text-[#8A95A5]'}`}>红堡寝宫</span>
                  <span className="text-[9px] text-[#A0A5B1]/50">赐下毒酒</span>
                </div>
              </motion.button>

            </div>
          </div>

          {/* Roster */}
          <div className="bg-[#12141A] p-4 rounded border border-[#2D3139] flex-1">
            <h3 className="text-xs text-[#8A95A5] mb-3 flex justify-between border-b border-[#2D3139] pb-2">
              <span>手中暗子 (存活: {spies.length})</span>
            </h3>

            {spies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-[#8A95A5] text-[11px] gap-2">
                <Skull className="w-8 h-8 opacity-40 mb-2" />
                满盘皆输，无棋可用。
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                <AnimatePresence>
                  {spies.map(spy => {
                    const isSelected = selectedSpyId === spy.id;
                    const isMission = spy.state === 'MISSION';

                    // Danger coloring for loyalty
                    const loyColor = spy.loyalty < 30 ? 'text-[#EF4444]' : spy.loyalty > 80 ? 'text-[#10B981]' : 'text-[#D4AF37]';

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={spy.id}
                        onClick={() => {
                          sfx.playBlip();
                          setSelectedSpyId(isSelected ? null : spy.id);
                        }}
                        disabled={isMission}
                        className={`min-w-[180px] text-left p-3 rounded border relative flex flex-col justify-between transition-all group ${
                          isSelected 
                            ? 'bg-[#1A1A1A] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.15)]' 
                            : isMission
                              ? 'opacity-0 hidden'
                              : 'bg-[#0B0D12] border-[#2D3139] hover:border-[#5C6575]'
                        }`}
                        style={{ display: isMission ? 'none' : 'flex' }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className={`text-[13px] font-black block mb-0.5 ${isSelected ? 'text-[#D4AF37]' : 'text-[#C8CDD6]'}`}>{spy.name}</span>
                            <span className="text-[9px] text-[#8A95A5] flex gap-1 opacity-80">
                              欲望: {spy.motivation === 'POWER' ? '权力' : spy.motivation === 'WEALTH' ? '金流' : spy.motivation === 'REVENGE' ? '复仇' : spy.motivation === 'FEAR' ? '恐惧' : '狂热'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#12141A] p-2 rounded-sm border border-[#2D3139]">
                           <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[#8A95A5]">忠诚度</span>
                              <span className={`font-bold ${loyColor}`}>{spy.loyalty} / 100</span>
                           </div>
                           {spy.loyalty < 40 && <div className="text-[8px] text-[#EF4444] mt-1 animate-pulse">⚠️ 背叛风险极高</div>}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-[#0B0D12] p-4 rounded border border-[#2D3139]">
            <h4 className="text-[10px] text-[#D4AF37] mb-2 font-bold flex items-center gap-2">
              <Feather className="w-3.5 h-3.5" /> 暗网渡鸦卷宗
            </h4>
            <div className="space-y-1.5 text-[11px] leading-relaxed h-[110px] overflow-y-auto pr-2 custom-scrollbar flex flex-col">
              {activeLog.map((log, index) => (
                <div key={index} className={`border-l-2 pl-2.5 py-1 ${
                  log.includes('🗡️') || log.includes('⛓️') ? 'border-[#8C2F39] text-[#EF4444] bg-[#8C2F39]/10' :
                  log.includes('🍷') || log.includes('📜') ? 'border-[#D4AF37] text-[#D4AF37]/90' :
                  log.includes('🗣️') ? 'border-cyan-800 text-cyan-200' :
                  'border-[#5C6575] text-[#8A95A5]'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Animated Character Popup overlay */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className={`absolute z-50 bottom-8 md:bottom-auto md:top-1/3 left-1/2 -translate-x-1/2 min-w-[300px] max-w-[85vw] p-5 rounded-xl border border-[#2D3139] shadow-2xl backdrop-blur-xl ${
              activePopup.type === 'BETRAYAL' ? 'bg-[#8C2F39]/90 border-red-500/50' :
              activePopup.type === 'CAUGHT' ? 'bg-[#181A20]/90 border-[#A0A5B1]/30' :
              activePopup.type === 'SUCCESS' ? 'bg-[#162A1F]/90 border-emerald-700/50' :
              'bg-[#2A2416]/90 border-[#D4AF37]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl drop-shadow-md">
                <motion.div
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  {activePopup.emoji}
                </motion.div>
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-black mb-1.5 ${
                  activePopup.type === 'BETRAYAL' ? 'text-red-200' :
                  activePopup.type === 'CAUGHT' ? 'text-stone-300' :
                  activePopup.type === 'SUCCESS' ? 'text-emerald-200' :
                  'text-[#D4AF37]'
                }`}>
                  {activePopup.type === 'BETRAYAL' ? '⚠️ 背叛发生！' :
                   activePopup.type === 'CAUGHT' ? '⛓️ 情报官被捕' :
                   activePopup.type === 'SUCCESS' ? '🍷 密谋得手' :
                   '📜 新盟友效忠'}
                </h4>
                <p className="text-xs leading-relaxed text-stone-100/90 font-medium">
                  <span className="font-bold opacity-100 text-white">[{activePopup.charName}]</span> 
                  {' '} {activePopup.msg.replace(/^.*?[\]】]\s*/, '') /* Remove the prefix from msg */}
                </p>
              </div>
            </div>
            
            <div className="mt-3 text-[9px] text-right opacity-60 uppercase tracking-widest text-[#D4AF37]">
              君临密报局
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
