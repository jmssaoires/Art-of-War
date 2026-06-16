import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Send, ShieldAlert, HeartHandshake, Swords, Globe, Globe2, Coins } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface VassalState {
  id: string;
  name: string;
  culture: string;
  militaryPower: number;
  loyalty: number; // 0-100
  wealth: number;
  status: 'OBEDIENT' | 'REBELLIOUS' | 'INDEPENDENT' | 'HOSTILE';
}

const INITIAL_VASSALS: VassalState[] = [
  { id: 'xiongnu', name: '北狄匈奴', culture: '游牧骑射', militaryPower: 85, loyalty: 30, wealth: 40, status: 'HOSTILE' },
  { id: 'nanyue', name: '南越诸部', culture: '丛林水战', militaryPower: 50, loyalty: 70, wealth: 60, status: 'OBEDIENT' },
  { id: 'xiyu', name: '西域三十六国', culture: '绿洲商贸', militaryPower: 40, loyalty: 50, wealth: 90, status: 'INDEPENDENT' }
];

interface TributaryResult {
  narrative: string;
  vassalUpdates: {
    id: string;
    loyaltyDelta: number;
    militaryPowerDelta: number;
    wealthDelta: number;
    statusChange?: 'OBEDIENT' | 'REBELLIOUS' | 'INDEPENDENT' | 'HOSTILE';
  }[];
  nationalPrestigeDelta: number;
  ai_analysis: string;
}

export default function TributarySandbox() {
  const [vassals, setVassals] = useState<VassalState[]>(INITIAL_VASSALS);
  const [nationalPrestige, setNationalPrestige] = useState(60);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TributaryResult | null>(null);

  const executeDiplomacy = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/tributary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vassals: vassals.map(v => ({ id: v.id, name: v.name, loyalty: v.loyalty, militaryPower: v.militaryPower, status: v.status, culture: v.culture })),
          nationalPrestige,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as TributaryResult;
      
      setVassals(prev => prev.map(v => {
        const update = outcome.vassalUpdates?.find(u => u.id === v.id);
        if (update) {
          return {
            ...v,
            loyalty: Math.max(0, Math.min(100, v.loyalty + update.loyaltyDelta)),
            militaryPower: Math.max(0, Math.min(100, v.militaryPower + (update.militaryPowerDelta || 0))),
            wealth: Math.max(0, Math.min(100, v.wealth + (update.wealthDelta || 0))),
            status: update.statusChange || v.status
          };
        }
        return v;
      }));

      setNationalPrestige(prev => Math.max(0, Math.min(100, prev + (outcome.nationalPrestigeDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】使臣队伍在边境遭遇沙尘暴或被马匪劫掠，未能传达国书。",
        nationalPrestigeDelta: -2,
        vassalUpdates: [],
        ai_analysis: "（无API环境）未能接入朝贡博弈大模型，周边藩国不为所动。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getLoyaltyColor = (val: number) => {
    if (val >= 70) return 'text-emerald-400';
    if (val >= 40) return 'text-amber-400';
    return 'text-red-400 animate-pulse';
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'OBEDIENT': return <span className="text-emerald-500 font-bold">恭顺臣服 (纳贡)</span>;
      case 'REBELLIOUS': return <span className="text-red-500 font-bold animate-pulse">阴谋叛乱 (停贡)</span>;
      case 'INDEPENDENT': return <span className="text-stone-400 font-bold">听调不听宣/中立</span>;
      case 'HOSTILE': return <span className="text-orange-500 font-bold">全面敌对 (寇边)</span>;
      default: return status;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-blue-900/20 to-stone-900 border border-blue-500/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Globe size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-blue-400 flex items-center gap-2 mb-2">
          <Globe2 className="w-6 h-6" /> 羁縻朝贡与天下体系 (方向四)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          天朝上国与周边游牧、绿洲番邦的朝贡博弈。你可以选择和亲、互市、武力威慑或厚往薄来的朝贡路线。AI将演算边疆番邦对天朝的向背变化。过度对外用兵可能导致财政崩溃，而一味退让则威望扫地。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <HeartHandshake className="w-4 h-4 text-blue-500" /> 鸿胪寺 (外交国策)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-blue-500/80 font-bold flex justify-between">
                <span>拟定外交通书或军事行动 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n下旨派遣张骞出使西域，赏赐大量丝绸黄金，要求西域诸国与天朝夹击匈奴... \n或者：\n拒绝南越的朝贡，斥责其国王僭越称帝，并陈兵十万于边境..."
                className="w-full min-h-[160px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-blue-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('将皇室宗亲公主和亲至匈奴单于，并附送大量岁币以求边境安宁。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">和亲岁币</button>
                <button onClick={() => setActionInput('在边境开启互市机制，允许游牧民族用牛马换取中原的盐铁与茶叶。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">边关互市</button>
                <button onClick={() => setActionInput('发兵征讨反叛的藩国，展现天朝大国军威，震慑四夷！')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">武力宣化</button>
              </div>
            </div>
            
            <button
              onClick={executeDiplomacy}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-[#121110] border border-blue-900/50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-blue-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '沙盘推演中...' : '宣读国书 (执行外交)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800">
             <div className="flex items-center justify-between text-xs font-mono">
               <span className="text-stone-500 flex items-center gap-1"><Compass className="w-4 h-4 text-blue-500"/>天朝威望 (霸权值)：</span>
               <span className={`text-xl font-black ${nationalPrestige >= 70 ? 'text-emerald-400' : 'text-stone-300'}`}>{nationalPrestige} / 100</span>
             </div>
             <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden mt-2">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${nationalPrestige}%` }}
                />
              </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" /> 四夷宾服动态图
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vassals.map(v => {
                const prevUpdate = result?.vassalUpdates?.find(u => u.id === v.id);

                return (
                  <motion.div 
                    key={v.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative"
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className="text-blue-400 font-serif font-black text-lg mb-1 flex items-center justify-between">
                        {v.name}
                        {v.status === 'HOSTILE' && <Swords className="w-4 h-4 text-orange-500 animate-pulse" />}
                        {v.status === 'REBELLIOUS' && <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" />}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold mb-3">{v.culture} | 状态: {getStatusLabel(v.status)}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>武力常备军</span>
                            <span className="font-bold text-stone-300">
                              {v.militaryPower}
                              {prevUpdate && prevUpdate.militaryPowerDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.militaryPowerDelta > 0 ? 'text-orange-400' : 'text-stone-500'}`}>
                                  ({prevUpdate.militaryPowerDelta > 0 ? '+' : ''}{prevUpdate.militaryPowerDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-orange-600"
                              animate={{ width: `${v.militaryPower}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>向化忠诚度</span>
                            <span className={`font-bold ${getLoyaltyColor(v.loyalty)}`}>
                              {v.loyalty}
                              {prevUpdate && prevUpdate.loyaltyDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.loyaltyDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ({prevUpdate.loyaltyDelta > 0 ? '+' : ''}{prevUpdate.loyaltyDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${v.loyalty >= 70 ? 'bg-emerald-500' : v.loyalty >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              animate={{ width: `${v.loyalty}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-900/50 border border-stone-800 rounded p-5 space-y-4 shadow-inner mt-auto"
                >
                  <p className="text-sm font-bold text-stone-500 uppercase flex items-center gap-2 border-b border-stone-800 pb-2">
                    <Globe className="w-4 h-4" /> 藩务理藩院汇报
                  </p>
                  
                  <p className="text-blue-200 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#121110] border border-stone-800 rounded p-4 text-xs font-mono">
                    <p className="text-blue-500 font-bold mb-2 flex items-center gap-2">
                      <Coins className="w-4 h-4" /> AI 朝贡体系政治博弈复盘
                    </p>
                    <p className="text-stone-400 leading-relaxed">
                      {result.ai_analysis}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </div>
  );
}
