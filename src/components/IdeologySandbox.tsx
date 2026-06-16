import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Send, Sparkles, Scale, AlertTriangle, EyeOff, BookText, ScrollText } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface SchoolOfThought {
  id: string;
  name: string;
  influence: number; // 0-100
  radicalness: number; // 0-100
  followers: string;
  coreBelief: string;
}

const INITIAL_SCHOOLS: SchoolOfThought[] = [
  { id: 'confucian', name: '儒家理学', influence: 85, radicalness: 10, followers: '太学生、士大夫、乡绅', coreBelief: '三纲五常，克己复礼，维护皇权正统。' },
  { id: 'mohist', name: '墨家游侠', influence: 30, radicalness: 70, followers: '工匠、底层游侠、死士', coreBelief: '兼爱非攻，极其抱团，常暗杀暴君酷吏。' },
  { id: 'buddhist', name: '大乘佛教', influence: 60, radicalness: 20, followers: '逃户、流民、信女', coreBelief: '因果轮回，大量圈占土地免税，易滑向弥勒教起义。' },
  { id: 'legalist', name: '法家酷吏', influence: 50, radicalness: 90, followers: '廷尉、监察御史', coreBelief: '严刑峻法，富国强兵，绝对服从君主。' }
];

interface IdeologyResult {
  narrative: string;
  stabilityDelta: number; // National stability change
  schoolUpdates: {
    id: string;
    influenceDelta: number;
    radicalnessDelta: number;
  }[];
  ai_analysis: string;
}

export default function IdeologySandbox() {
  const [schools, setSchools] = useState<SchoolOfThought[]>(INITIAL_SCHOOLS);
  const [nationalStability, setNationalStability] = useState(60);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<IdeologyResult | null>(null);

  const executeIdeologyAction = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/ideology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schools: schools.map(s => ({ id: s.id, name: s.name, influence: s.influence, radicalness: s.radicalness, coreBelief: s.coreBelief })),
          nationalStability,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as IdeologyResult;
      
      setSchools(prev => prev.map(s => {
        const update = outcome.schoolUpdates?.find(u => u.id === s.id);
        if (update) {
          return {
            ...s,
            influence: Math.max(0, Math.min(100, s.influence + update.influenceDelta)),
            radicalness: Math.max(0, Math.min(100, s.radicalness + (update.radicalnessDelta || 0)))
          };
        }
        return s;
      }));

      setNationalStability(prev => Math.max(0, Math.min(100, prev + (outcome.stabilityDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】思想禁锢令未能有效传达，民间私学依然昌盛。",
        stabilityDelta: -5,
        schoolUpdates: [],
        ai_analysis: "（无API环境）文网疏漏，百家争鸣未受影响。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getInfluenceColor = (val: number) => {
    if (val >= 70) return 'text-purple-400';
    if (val >= 40) return 'text-blue-400';
    return 'text-stone-400';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-teal-900/20 to-stone-900 border border-teal-500/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <BookOpen size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-teal-400 flex items-center gap-2 mb-2">
          <BookText className="w-6 h-6" /> 诸子百家与教派控制 (方向五)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          科举、焚书、灭佛或是尊儒。思想控制是帝国的最底层逻辑。当你扶植某种思想时，其他流派可能会转入地下。打压过狠可能激起游侠暗杀或宗教起义（如黄巾、白莲教）。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <ScrollText className="w-4 h-4 text-teal-500" /> 经筵与诏令 (文网)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-teal-500/80 font-bold flex justify-between">
                <span>颁布文化诏令 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n下令全国灭佛，没收寺庙土地，强迫僧侣还俗，将铜佛像熔铸为钱币... \n或者：\n开设武举和技击科，吸纳民间游侠和墨家工匠进入体制..."
                className="w-full min-h-[160px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-teal-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('罢黜百家，表章六经，确立儒家为唯一官方正统科举内容。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">独尊儒术</button>
                <button onClick={() => setActionInput('发起灭佛运动，拆毁全国三万座寺庙，逼迫百万僧尼还俗纳税。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">三武灭佛</button>
                <button onClick={() => setActionInput('推崇黄老之学，无为而治，废除所有严酷律法，轻徭薄赋。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">黄老无为</button>
              </div>
            </div>
            
            <button
              onClick={executeIdeologyAction}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-teal-900 to-[#121110] border border-teal-900/50 hover:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-teal-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-teal-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '思想演变中...' : '推行文教 (控制思想)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800">
             <div className="flex items-center justify-between text-xs font-mono">
               <span className="text-stone-500 flex items-center gap-1"><Scale className="w-4 h-4 text-teal-500"/>帝国凝结力 (社会安定)：</span>
               <span className={`text-xl font-black ${nationalStability >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{nationalStability} / 100</span>
             </div>
             <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden mt-2">
                <motion.div 
                  className={`h-full ${nationalStability >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${nationalStability}%` }}
                />
              </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-teal-500" /> 诸子百家潜流网
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schools.map(s => {
                const prevUpdate = result?.schoolUpdates?.find(u => u.id === s.id);

                return (
                  <motion.div 
                    key={s.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative"
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className="text-teal-400 font-serif font-black text-lg mb-1 flex items-center justify-between">
                        {s.name}
                        {s.radicalness >= 80 && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold mb-1">受众：{s.followers}</p>
                      <p className="text-[10px] text-stone-500 italic mb-3">{s.coreBelief}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>社会影响力</span>
                            <span className={`font-bold ${getInfluenceColor(s.influence)}`}>
                              {s.influence}
                              {prevUpdate && prevUpdate.influenceDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.influenceDelta > 0 ? 'text-teal-400' : 'text-stone-500'}`}>
                                  ({prevUpdate.influenceDelta > 0 ? '+' : ''}{prevUpdate.influenceDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-teal-600"
                              animate={{ width: `${s.influence}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>极端与排他性 (极化率)</span>
                            <span className={`font-bold ${s.radicalness >= 70 ? 'text-red-400' : 'text-amber-400'}`}>
                              {s.radicalness}
                              {prevUpdate && prevUpdate.radicalnessDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.radicalnessDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  ({prevUpdate.radicalnessDelta > 0 ? '+' : ''}{prevUpdate.radicalnessDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${s.radicalness >= 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                              animate={{ width: `${s.radicalness}%` }}
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
                    <BookOpen className="w-4 h-4" /> 礼部奏疏反馈
                  </p>
                  
                  <p className="text-teal-200 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#121110] border border-stone-800 rounded p-4 text-xs font-mono">
                    <p className="text-teal-500 font-bold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI 思想统治力演化溯源
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
