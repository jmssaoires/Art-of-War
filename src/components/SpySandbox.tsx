import React, { useState } from 'react';
import { SpyAgent } from '../types';
import { Shield, Sparkles, Compass, HelpCircle, Activity, Award, User, RotateCcw, AlertTriangle, KeyRound, Eye, Skull, Radio } from 'lucide-react';

export default function SpySandbox() {
  const [gold, setGold] = useState<number>(350);
  const [morality, setMorality] = useState<number>(80); // 道义值 (0-100)

  const [spies, setSpies] = useState<SpyAgent[]>([
    { id: 'spy-1', name: '老里役 (乡间)', type: 'LOCAL', cost: 10, credibility: 65, motivation: 'MONEY', loyalty: 70, isDiscovered: false, state: 'IDLE' },
    { id: 'spy-2', name: '李侍常 (内间)', type: 'INTERNAL', cost: 120, credibility: 91, motivation: 'FAMILY', loyalty: 85, isDiscovered: false, state: 'IDLE' },
    { id: 'spy-3', name: '苏谍 (反间)', type: '策反', cost: 80, credibility: 75, motivation: 'HATRED', loyalty: 55, isDiscovered: false, state: 'IDLE' },
    { id: 'spy-4', name: '赵姬 (生间)', type: 'ACTIVE_SURVIVING', cost: 200, credibility: 95, motivation: 'IDEAL', loyalty: 90, isDiscovered: false, state: 'IDLE' }
  ]);

  const [activeLog, setActiveLog] = useState<string[]>([
    '【用间部署】孙子曰：凡兴兵十万，出征千里...不急知敌之情者，不仁之至也。五间俱起，莫知其道。',
    '当前金元 350 两，本朝道义 80。请密令细作深入军情。'
  ]);

  const [recruitType, setRecruitType] = useState<'LOCAL' | 'INTERNAL' | 'DEATH' | 'ACTIVE_SURVIVING'>('LOCAL');
  const [recruitMotiv, setRecruitMotiv] = useState<'MONEY' | 'HATRED' | 'IDEAL' | 'FORCED' | 'FAMILY'>('MONEY');

  const handleRecruit = () => {
    let cost = 0;
    let name = '';
    let cred = 0;

    if (recruitType === 'LOCAL') {
      cost = 10;
      name = `山民细作 (乡间)`;
      cred = 50 + Math.round(Math.random() * 20);
    } else if (recruitType === 'INTERNAL') {
      cost = 120;
      name = `王室偏臣 (内间)`;
      cred = 80 + Math.round(Math.random() * 15);
    } else if (recruitType === 'DEATH') {
      cost = 60;
      name = `敢死敢亡 (死间)`;
      cred = 95; // highly convincing false scrolls
    } else {
      cost = 200;
      name = `歌姬名士 (生间)`;
      cred = 90 + Math.round(Math.random() * 10);
    }

    if (gold < cost) {
      setActiveLog(prev => [`⚠️ 铜钱不足！雇不起此级别的高级策密大员。`, ...prev]);
      return;
    }

    const newSpy: SpyAgent = {
      id: `spy-${Date.now()}`,
      name,
      type: recruitType === 'DEATH' ? 'DEATH' : recruitType,
      cost,
      credibility: cred,
      motivation: recruitMotiv,
      loyalty: 40 + Math.round(Math.random() * 50),
      isDiscovered: false,
      state: 'IDLE'
    };

    setGold(prev => prev - cost);
    setSpies(prev => [...prev, newSpy]);
    setActiveLog(prev => [`🕴️ 细作招募：新探子【${name}】怀着《${recruitMotiv}》动机签立死誓，混入死角。`, ...prev]);
  };

  const executeMission = (id: string, missionName: string) => {
    const target = spies.find(s => s.id === id);
    if (!target) return;

    let updatedSpies = spies.map(s => {
      if (s.id === id) {
        return { ...s, state: 'MISSION' as const };
      }
      return s;
    });

    setSpies(updatedSpies);
    
    // Simulate mission outcome out of random rolls
    setTimeout(() => {
      let isCaught = false;
      let msg = '';
      let goldEarned = 0;
      let daoLoss = 0;
      const roll = Math.random() * 100;

      // Local vs Internal catching curves
      if (target.type === 'LOCAL') {
        isCaught = roll < 15; // low risk
      } else if (target.type === 'INTERNAL') {
        isCaught = roll < 35; // high risk, high reward
      } else if (target.type === 'DEATH') {
        isCaught = true; // Death spy is DELIBERATELY caught to transmit false files!
      } else {
        isCaught = roll < 25;
      }

      if (isCaught) {
        if (target.type === 'DEATH') {
          daoLoss = 10;
          msg = `💀 死间成功受戮！ ${target.name} 携带假兵防防线图，在边境关卡故意被赵军截获并被斩首。敌军信任假图，将防区侧出破绽！我朝本纪【道义-10】。`;
        } else {
          msg = `🚨 噩耗！细作 ${target.name} 遭到盘讯搜身搜出本朝印玺，大牢逼讯下其气节溃退（由于动机为${target.motivation}）。其已被打入天牢，可能已经泄漏我方密局！`;
        }
        setSpies(prev => prev.filter(s => s.id !== id)); // dead/escaped
        if (daoLoss > 0) setMorality(m => Math.max(0, m - daoLoss));
      } else {
        // Mission success
        if (missionName === 'INTELLIGENCE') {
          msg = `📡 密报飞至：${target.name} 传回敌重地【赵国邯郸府】战时布署，信誉信赖值高企（精度: ±${Math.round(100 - target.credibility)}%）。报：敌军备虚假，后方粮草不足。`;
        } else {
          goldEarned = 40 + Math.round(Math.random() * 80);
          msg = `💰 反咬吞吐：${target.name} 暗中向敌军太守行贿倒卖劣铜，掠夺走私商饷金 ${goldEarned} 两，反哺我相国府内廷。`;
          setGold(g => g + goldEarned);
        }
        
        // Return spy to Idle
        setSpies(prev => prev.map(s => s.id === id ? { ...s, state: 'IDLE' as const, loyalty: Math.min(100, s.loyalty + 5) } : s));
      }

      setActiveLog(prev => [msg, ...prev].slice(0, 7));
    }, 900);
  };

  return (
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="spy-sandbox-root">
      <div className="flex justify-between items-center mb-6 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <Radio className="text-[#8C2F39] w-5 h-5 animate-pulse font-bold" />
            【情报局】五间策逆与谍报网络
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            孙子兵法第十三篇《用间篇》核心实现：乡、内、反、死、生，五间俱起，莫知其道，是谓神纪。
          </p>
        </div>
        <span className="text-xs border border-[#1A1A1A]/15 px-2 py-1 text-[#8C2F39] font-mono rounded bg-white/50 backdrop-blur-xs font-bold shadow-xs">
          GDD 模块 08 · 交互实验室
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recruitment office */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 shadow-xs">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-2 mb-3 font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-[#8C2F39]" />
              用间招募馆 (Motives & Spies Recruiter)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#1A1A1A]/50 font-mono block mb-1">九品间谍类型分类：</label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { key: 'LOCAL', name: '乡间 (Local)', cost: 10 },
                    { key: 'INTERNAL', name: '内间 (Internal)', cost: 120 },
                    { key: 'DEATH', name: '死间 (Death)', cost: 60 },
                    { key: 'ACTIVE_SURVIVING', name: '生间 (Sleeper)', cost: 200 }
                  ].map(t => (
                    <button
                      key={t.key}
                      id={`rec-type-btn-${t.key}`}
                      onClick={() => setRecruitType(t.key as any)}
                      className={`p-2 rounded text-left border transition ${
                        recruitType === t.key
                          ? 'border-[#8C2F39] bg-[#8C2F39]/5 text-[#8C2F39]'
                          : 'border-[#1A1A1A]/10 bg-white/50 text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      <div className="font-bold">{t.name}</div>
                      <div className="text-[9px] text-[#1A1A1A]/50 mt-0.5">工本: {t.cost}金</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#1A1A1A]/50 font-mono block mb-1">五大死命动机 (决定背叛率)：</label>
                <div className="grid grid-cols-5 gap-1 text-[9px]">
                  {[
                    { key: 'MONEY', name: '重利' },
                    { key: 'HATRED', name: '宿怨' },
                    { key: 'IDEAL', name: '信念' },
                    { key: 'FORCED', name: '胁迫' },
                    { key: 'FAMILY', name: '骨肉' }
                  ].map(m => (
                    <button
                      key={m.key}
                      id={`rec-motiv-btn-${m.key}`}
                      onClick={() => setRecruitMotiv(m.key as any)}
                      className={`py-1.5 rounded transition font-bold border border-[#1A1A1A]/10 ${
                        recruitMotiv === m.key
                          ? 'bg-[#8C2F39] text-[#F5F2ED] font-bold border-[#8C2F39]'
                          : 'bg-white text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="do-recruit-spy-btn"
                onClick={handleRecruit}
                className="w-full bg-[#8C2F39] hover:bg-[#8C2F39]/90 text-[#F5F2ED] text-xs font-black py-2 rounded shadow-sm mt-4 transition"
              >
                密发印信 · 委任细作
              </button>
            </div>
          </div>

          {/* Player stats box */}
          <div className="bg-white/60 border border-[#1A1A1A]/15 p-3.5 rounded flex justify-between items-center text-xs font-mono shadow-xs">
            <div>
              <span className="text-[#1A1A1A]/50 block">廷尉府秘密金帑:</span>
              <strong className="text-[#8C2F39] text-base">{gold} 金</strong>
            </div>
            <div className="text-right">
              <span className="text-[#1A1A1A]/50 block">朝堂万民道义 (DAO):</span>
              <strong className={morality > 50 ? 'text-[#5A5A40] text-base font-bold' : 'text-[#8C2F39] text-base font-bold'}>
                {morality} / 100
              </strong>
            </div>
          </div>
        </div>

        {/* Existing Spy Roster and Board */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 shadow-xs">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 mb-3 font-bold border-b border-[#1A1A1A]/10 pb-2">当前活跃谍网成员 ({spies.length} 名)</h3>

            {spies.length === 0 ? (
              <div id="empty-spy-grid" className="text-center py-8 text-[#1A1A1A]/40 text-xs italic">
                谍报网已被彻底端除！急切补充新鲜细作。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="spies-grid-container">
                {spies.map(spy => {
                  const isSleeper = spy.type === 'ACTIVE_SURVIVING';
                  const isDeath = spy.type === 'DEATH';

                  return (
                    <div
                      key={spy.id}
                      id={`spy-card-${spy.id}`}
                      className="bg-white/85 p-3 rounded border border-[#1A1A1A]/10 relative flex flex-col justify-between shadow-xs"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-serif font-black text-[#1A1A1A] block">{spy.name}</span>
                          <span className="text-[9px] text-[#8C2F39] font-mono font-bold">
                            动机: {spy.motivation === 'MONEY' ? '重利' : spy.motivation === 'IDEAL' ? '理想' : '家世'} • 忠臣度: {spy.loyalty}
                          </span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-mono font-bold ${
                          spy.state === 'MISSION' ? 'bg-[#8C2F39]/10 text-[#8C2F39] animate-pulse' : 'bg-[#1A1A1A]/5 text-[#1A1A1A]/50'
                        }`}>
                          {spy.state}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          id={`spy-miss-intel-btn-${spy.id}`}
                          disabled={spy.state === 'MISSION'}
                          onClick={() => executeMission(spy.id, 'INTELLIGENCE')}
                          className="bg-white hover:bg-neutral-50 text-[10px] text-[#1A1A1A]/80 py-1.5 rounded border border-[#1A1A1A]/15 hover:border-[#8C2F39]/40 transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-55"
                        >
                          <Eye className="w-3 h-3 text-[#5A5A40] font-bold" />
                          打探敌国设防
                        </button>

                        <button
                          id={`spy-miss-gold-btn-${spy.id}`}
                          disabled={spy.state === 'MISSION'}
                          onClick={() => executeMission(spy.id, '走私掠夺')}
                          className="bg-white hover:bg-neutral-50 text-[10px] text-[#1A1A1A]/80 py-1.5 rounded border border-[#1A1A1A]/15 hover:border-[#8C2F39]/40 transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-55"
                        >
                          <Skull className="w-3 h-3 text-[#8C2F39] font-bold" />
                          暗度金元倒卖
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Intercepted Logs */}
          <div className="bg-white/85 p-3.5 rounded border border-[#1A1A1A]/15 max-h-[140px] overflow-y-auto shadow-xs">
            <h4 className="text-[9px] font-mono text-[#1A1A1A]/60 tracking-wider mb-2 font-bold uppercase">秦晋飞简情报解譯 logs</h4>
            <div className="space-y-1.5 text-[11px] font-mono leading-relaxed">
              {activeLog.map((log, index) => (
                <div key={index} className="text-[#1A1A1A]/85 border-l-2 border-[#8C2F39]/20 pl-2">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
