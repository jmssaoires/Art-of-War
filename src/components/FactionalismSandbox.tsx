import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, Send, Scale, Users, FileSignature, AlertCircle, Bookmark } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface FactionParty {
  id: string;
  name: string;
  influence: number; // 0-100 political power in court
  corruption: number; // 0-100 indicating how deeply they siphon state resources
  description: string;
}

const INITIAL_PARTIES: FactionParty[] = [
  { id: 'northern', name: '北方勋旧党', influence: 45, corruption: 50, description: '多出身军事世家，注重边功，但在朝中文采较弱，常受士大夫轻视。' },
  { id: 'southern', name: '江南清流党', influence: 75, corruption: 85, description: '科举大省出身，掌握帝国话语权，嘴上仁义道德，实则疯狂兼并土地免税。' },
  { id: 'eunuch_ally', name: '阉党附庸', influence: 30, corruption: 95, description: '投靠太监权臣的无耻投机者，办事效率极高但手段极度肮脏。' }
];

interface FactionalismResult {
  narrative: string;
  courtEfficiencyDelta: number; // 朝局效率变化
  emperorControlDelta: number; // 皇权制衡度变化
  partyUpdates: {
    id: string;
    influenceDelta: number;
    corruptionDelta: number;
  }[];
  ai_analysis: string;
}

export default function FactionalismSandbox() {
  const [parties, setParties] = useState<FactionParty[]>(INITIAL_PARTIES);
  const [courtEfficiency, setCourtEfficiency] = useState(50);
  const [emperorControl, setEmperorControl] = useState(60);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FactionalismResult | null>(null);

  const executeFactionPolicy = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/factionalism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parties: parties.map(p => ({ id: p.id, name: p.name, influence: p.influence, corruption: p.corruption })),
          courtEfficiency,
          emperorControl,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as FactionalismResult;
      
      setParties(prev => prev.map(p => {
        const update = outcome.partyUpdates?.find(x => x.id === p.id);
        if (update) {
          return {
            ...p,
            influence: Math.max(0, Math.min(100, p.influence + update.influenceDelta)),
            corruption: Math.max(0, Math.min(100, p.corruption + update.corruptionDelta))
          };
        }
        return p;
      }));

      setCourtEfficiency(prev => Math.max(0, Math.min(100, prev + (outcome.courtEfficiencyDelta || 0))));
      setEmperorControl(prev => Math.max(0, Math.min(100, prev + (outcome.emperorControlDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】皇帝的调和被朝臣无视，两党在朝堂上大打出手，朝政几乎停摆。",
        courtEfficiencyDelta: -10,
        emperorControlDelta: -5,
        partyUpdates: [],
        ai_analysis: "（无API环境）未能接入演化大模型，朋党之争彻底失控。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPartyColor = (id: string) => {
    if (id === 'northern') return 'bg-blue-500';
    if (id === 'southern') return 'bg-emerald-500';
    return 'bg-purple-500';
  };
  const getPartyTextColor = (id: string) => {
    if (id === 'northern') return 'text-blue-500';
    if (id === 'southern') return 'text-emerald-500';
    return 'text-purple-500';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#172A3A] to-stone-900 border border-blue-900/30 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Scale size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-blue-400 flex items-center gap-2 mb-2">
          <ScrollText className="w-6 h-6" /> 科举取士与朋党之争 (方向八)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          王朝中后期，科举带来的地域门生故吏形成巨大的“朋党”。党争往往导致“只问立场，不问对错”，忠臣良将成为牺牲品。AI将根据你的制衡或打压手段（如南北榜案、大兴党狱），演算朝庭陷入内耗死局还是重获生机。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#0F172A] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <FileSignature className="w-4 h-4 text-blue-400" /> 吏部与都察院 (制衡手段)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-blue-400/80 font-bold flex justify-between">
                <span>下达用人或整党诏令 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n科举分南北榜录取，强行提拔北方学子，严厉打击江南士族的科甲垄断... \n或者：\n任用阉党头目主持京察，把凡是带清流标签的大臣全部贬斥流放..."
                className="w-full min-h-[160px] bg-[#0B0F19] border border-blue-900/30 text-stone-200 p-4 rounded text-sm outline-none focus:border-blue-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('借科举舞弊案，将主考官及江南籍中榜学子全部下狱斩首，强推南北平分的录取制度。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">南北分榜斩首</button>
                <button onClick={() => setActionInput('皇上亲自下场做裁判，搞折中和稀泥，每个部门尚书侍郎名额由南北清流与阉党平分，互相牵制。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">帝王折中术</button>
                <button onClick={() => setActionInput('鼓励清流学子在太学和书院集会（如东林书院），疯狂上疏弹劾执政的内阁大臣，大造舆论。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">纵容清议</button>
              </div>
            </div>
            
            <button
              onClick={executeFactionPolicy}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-blue-950 to-[#0F172A] border border-blue-900/50 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-blue-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Bookmark className="w-4 h-4" /> 
              )}
              {isProcessing ? '廷推争议中...' : '大朝会廷推 (制衡党派)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800 space-y-4">
             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><Scale className="w-4 h-4 text-emerald-400"/>朝局运转效率 (国事推行度)：</span>
                 <span className={`text-lg font-black ${courtEfficiency < 40 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{courtEfficiency} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${courtEfficiency >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${courtEfficiency}%` }}
                  />
                </div>
             </div>

             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><Users className="w-4 h-4 text-purple-400"/>帝王制衡掌控力 (权柄)：</span>
                 <span className={`text-lg font-black ${emperorControl < 40 ? 'text-red-400' : 'text-purple-400'}`}>{emperorControl} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${emperorControl}%` }}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-blue-400" /> 朋党权势图谱
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {parties.map(p => {
                const prevUpdate = result?.partyUpdates?.find(x => x.id === p.id);
                return (
                  <motion.div 
                    key={p.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative"
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className={`text-stone-200 font-serif font-black text-lg mb-1 flex items-center justify-between`}>
                        {p.name}
                        {p.influence > 80 && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" title="权倾朝野" />}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold mb-3 break-words">{p.description}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>朝堂话语权 (影响力)</span>
                            <span className={`font-bold ${getPartyTextColor(p.id)}`}>
                              {p.influence}
                              {prevUpdate && prevUpdate.influenceDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.influenceDelta > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                  ({prevUpdate.influenceDelta > 0 ? '+' : ''}{prevUpdate.influenceDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${getPartyColor(p.id)}`}
                              animate={{ width: `${Math.min(100, p.influence)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>贪腐结营度 (挖国家墙角)</span>
                            <span className={`font-bold ${p.corruption > 75 ? 'text-red-400' : 'text-stone-400'}`}>
                              {p.corruption}
                              {prevUpdate && prevUpdate.corruptionDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.corruptionDelta > 0 ? 'text-red-400' : 'text-stone-400'}`}>
                                  ({prevUpdate.corruptionDelta > 0 ? '+' : ''}{prevUpdate.corruptionDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${p.corruption >= 70 ? 'bg-red-800' : 'bg-red-900/40'}`}
                              animate={{ width: `${p.corruption}%` }}
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
                  <p className="text-sm font-bold text-blue-900 bg-blue-500/20 px-2 py-1 uppercase flex items-center justify-between border-b border-blue-900/50 pb-2">
                    <span className="flex items-center gap-2 text-blue-400">
                       <ScrollText className="w-4 h-4" /> 都察院科道通报
                    </span>
                  </p>
                  
                  <p className="text-stone-300 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#0F172A] border border-blue-900/20 rounded p-4 text-xs font-mono">
                    <p className="text-blue-500 font-bold mb-2 flex items-center gap-2">
                      <Scale className="w-4 h-4" /> AI 党争国运衰变溯源
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
