import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, FileText, Send, AlertTriangle, TrendingUp, TrendingDown, Hammer, Activity, BookOpen, Scaling } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface SocialStratum {
  id: string;
  name: string;
  support: number;
  wealth: number; // 0-100 indicating economic power
  description: string;
}

const INITIAL_STRATA: SocialStratum[] = [
  { id: 'bureaucrats', name: '官僚士大夫', support: 80, wealth: 70, description: '既得利益者，掌握朝政运作，极其排斥激进变法。' },
  { id: 'merchants', name: '商贾巨贾', support: 60, wealth: 90, description: '把控盐铁流通，对经济干预极为敏感。' },
  { id: 'peasants', name: '底层农户', support: 40, wealth: 15, description: '国运基石，承受着最重的赋税，极易爆发民变。' },
  { id: 'military', name: '军方将领', support: 70, wealth: 50, description: '戍边功臣，关心军饷与军功爵制，渴望战争或封赏。' }
];

interface ReformResult {
  narrative: string;
  stateCapacityDelta: number; // National strength change
  strataUpdates: {
    id: string;
    supportDelta: number;
    wealthDelta: number;
  }[];
  ai_analysis: string;
}

export default function ReformSandbox() {
  const [strata, setStrata] = useState<SocialStratum[]>(INITIAL_STRATA);
  const [stateCapacity, setStateCapacity] = useState(50);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReformResult | null>(null);

  const executeReform = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/reform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strata: strata.map(s => ({ id: s.id, name: s.name, support: s.support, wealth: s.wealth })),
          stateCapacity,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as ReformResult;
      
      setStrata(prev => prev.map(s => {
        const update = outcome.strataUpdates?.find(u => u.id === s.id);
        if (update) {
          return {
            ...s,
            support: Math.max(0, Math.min(100, s.support + update.supportDelta)),
            wealth: Math.max(0, Math.min(100, s.wealth + update.wealthDelta))
          };
        }
        return s;
      }));

      setStateCapacity(prev => Math.max(0, Math.min(100, prev + (outcome.stateCapacityDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】变法诏书遭到群臣强烈抵制，政令未出中书省。",
        stateCapacityDelta: -5,
        strataUpdates: [],
        ai_analysis: "（无API环境）未经AI演化，保守派发力导致变法流产并造成内耗。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getColor = (val: number) => {
    if (val >= 70) return 'text-emerald-400';
    if (val >= 40) return 'text-amber-400';
    return 'text-red-400 animate-pulse';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-emerald-900/20 to-stone-900 border border-emerald-500/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Hammer size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-emerald-400 flex items-center gap-2 mb-2">
          <Hammer className="w-6 h-6" /> 变法改革与新政反噬 (方向二)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          推行王安石变法、商鞅变法或一条鞭法级别的激进新政。AI将演算您的经济手段、军功政策如何触犯各大阶层利益，或如何强国。国家机器可能因此腾飞，也可能引发全面反噬内战。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <FileText className="w-4 h-4 text-emerald-500" /> 中枢朝台 (颁布变法)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-emerald-500/80 font-bold flex justify-between">
                <span>拟定新政条文 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n推行青苗法与市易法，由国家直接向农民发放低息贷款，并打击地方商船垄断... \n或者：\n建立军功授爵制，平民斩敌一首可获爵位，传统世家子弟若无军功一律降级..."
                className="w-full min-h-[160px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-emerald-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('推行盐铁官营，将民间煮盐炼铁的产业全部收归国有。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">盐铁官营</button>
                <button onClick={() => setActionInput('摊丁入亩，取消人头税，无论平民还是官僚，全部按拥有的土地面积纳税。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">摊丁入亩</button>
                <button onClick={() => setActionInput('废除世卿世禄，推行法家严刑峻法，以农战立国，禁绝儒家经典。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">法家农战</button>
              </div>
            </div>
            
            <button
              onClick={executeReform}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-900 to-[#121110] border border-emerald-900/50 hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-emerald-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '大棋局推演中...' : '盖印颁布 (推进新政)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800">
             <div className="flex items-center justify-between text-xs font-mono">
               <span className="text-stone-500 flex items-center gap-1"><BookOpen className="w-4 h-4 text-emerald-500"/>中央集权度 & 综合国力：</span>
               <span className={`text-xl font-black ${getColor(stateCapacity)}`}>{stateCapacity} / 100</span>
             </div>
             <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden mt-2">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stateCapacity}%` }}
                />
              </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> 各大阶层态势反馈
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {strata.map(s => {
                const prevStrata = result?.strataUpdates?.find(u => u.id === s.id);
                return (
                  <motion.div 
                    key={s.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative"
                  >
                    <div className="z-10 mb-4 h-full">
                      <h4 className="text-emerald-400 font-serif font-black text-lg mb-1 flex items-center justify-between">
                        {s.name}
                        {s.support < 30 && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold mb-3 break-words">{s.description}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>政权支持度</span>
                            <span className={`font-bold ${getColor(s.support)}`}>
                              {s.support}
                              {prevStrata && prevStrata.supportDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevStrata.supportDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ({prevStrata.supportDelta > 0 ? '+' : ''}{prevStrata.supportDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${s.support >= 60 ? 'bg-emerald-500' : s.support >= 35 ? 'bg-amber-500' : 'bg-red-500'}`}
                              animate={{ width: `${s.support}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>社会财富估值</span>
                            <span className="text-stone-300 font-bold">
                              {s.wealth}
                              {prevStrata && prevStrata.wealthDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevStrata.wealthDelta > 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                                  ({prevStrata.wealthDelta > 0 ? '+' : ''}{prevStrata.wealthDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-amber-600"
                              animate={{ width: `${s.wealth}%` }}
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
                  <p className="text-sm font-bold text-stone-500 uppercase flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="flex items-center gap-2">
                       <Landmark className="w-4 h-4" /> 变法后效战报
                    </span>
                    {result.stateCapacityDelta !== 0 && (
                      <span className={`text-xs font-mono font-black ${result.stateCapacityDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        综合国力 {result.stateCapacityDelta > 0 ? '+' : ''}{result.stateCapacityDelta}
                      </span>
                    )}
                  </p>
                  
                  <p className="text-emerald-100 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#121110] border border-stone-800 rounded p-4 text-xs font-mono">
                    <p className="text-emerald-500 font-bold mb-2 flex items-center gap-2">
                      <Scaling className="w-4 h-4" /> AI 社会阻力与宏观政治溯源
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
