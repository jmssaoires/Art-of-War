import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Scale, ScrollText, Send, UserX, UserCheck, ShieldAlert, Brain, Activity, Crown } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Family {
  id: string;
  name: string;
  trait: string;
  influence: number;
  loyalty: number;
  description: string;
}

const INITIAL_FAMILIES: Family[] = [
  { id: 'wang', name: '琅琊王氏', trait: '门生故吏，垄断察举', influence: 75, loyalty: 60, description: '朝中一半文官皆出其门下，势力盘根错节。' },
  { id: 'cui', name: '清河崔氏', trait: '百年书香，清流领袖', influence: 60, loyalty: 70, description: '天下士子归心，掌握舆论与经学解释权。' },
  { id: 'yuan', name: '汝南袁氏', trait: '四世三公，地方豪强', influence: 85, loyalty: 30, description: '地方庄园主，隐匿大量人口与私兵部曲。' }
];

interface AristocratResult {
  narrative: string;
  familyUpdates: {
    id: string;
    influenceDelta: number;
    loyaltyDelta: number;
  }[];
  ai_analysis: string;
}

export default function AristocratEcosystemSandbox() {
  const [families, setFamilies] = useState<Family[]>(INITIAL_FAMILIES);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AristocratResult | null>(null);

  const totalInfluence = families.reduce((sum, f) => sum + f.influence, 0);

  const executeDecree = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/aristocrat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          families: families.map(f => ({ id: f.id, name: f.name, influence: f.influence, loyalty: f.loyalty, trait: f.trait })),
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as AristocratResult;
      
      // Update local state based on AI delta
      setFamilies(prev => prev.map(f => {
        const update = outcome.familyUpdates?.find(u => u.id === f.id);
        if (update) {
          return {
            ...f,
            influence: Math.max(0, Math.min(100, f.influence + update.influenceDelta)),
            loyalty: Math.max(0, Math.min(100, f.loyalty + update.loyaltyDelta))
          };
        }
        return f;
      }));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "政令在中书省被驳回，未能下达。",
        familyUpdates: [],
        ai_analysis: "网络或大模型解析出错，地方豪强未受影响。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getLoyaltyColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400';
    if (val >= 50) return 'text-amber-400';
    return 'text-red-400 animate-pulse';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Narrative Header */}
      <div className="bg-gradient-to-r from-amber-900/20 to-stone-900 border border-amber-500/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Landmark size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-amber-400 flex items-center gap-2 mb-2">
          <Scale className="w-6 h-6" /> 世家门阀与权力生态
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          皇权不下县。天下资源被几大门阀世家垄断。通过下达政治阳谋（联姻、推恩令、清流党锢、度田检籍），观察AI如何演算这些古老家族的权力反扑或臣服。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Decrees & Status */}
        <div className="lg:col-span-5 bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <ScrollText className="w-4 h-4 text-amber-500" /> 中枢朝台 (颁布政令)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-amber-500/80 font-bold flex justify-between">
                <span>拟定圣旨 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n实施‘度田令’，清查汝南袁氏侵占的良田与隐匿黑户... \n或者：\n将皇家公主下嫁给琅琊王氏的嫡长子，以拉拢其势力..."
                className="w-full min-h-[160px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-amber-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('推行九品中正制改革，试图削弱世家垄断官员提拔的特权。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">九品中正制改革</button>
                <button onClick={() => setActionInput('下旨斥责崔氏子弟骄奢淫逸，并将其几名旁系削职为民。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">打压清流</button>
                <button onClick={() => setActionInput('大举征发汝南袁氏所在地的壮丁劳役，修筑运河。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">征发劳役</button>
              </div>
            </div>
            
            <button
              onClick={executeDecree}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#8C2F39] to-[#121110] border border-red-900/50 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-red-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-red-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '大棋局推演中...' : '盖印颁布 (执行政令)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800">
             <div className="flex items-center gap-2 text-xs text-stone-500">
               <Crown className="w-4 h-4 text-amber-500" />
               【皇权基础提示】若某世家影响力过高且忠诚过低，可能会在地方掀起叛乱或在朝中废立皇帝。
             </div>
          </div>
        </div>

        {/* Right Column: Family Ecosystem Visuals */}
        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> 门阀势力地图
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            {/* The Families */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {families.map(family => {
                const prevFamily = result?.familyUpdates?.find(u => u.id === family.id);
                return (
                  <motion.div 
                    key={family.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative overflow-hidden"
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-stone-800/20 z-0"
                      style={{ height: `${family.influence}%`, transition: 'height 1s ease-in-out' }}
                    />
                    <div className="z-10 mb-4 h-full">
                      <h4 className="text-amber-500 font-serif font-black text-lg mb-1 flex items-center justify-between">
                        {family.name}
                        {family.loyalty < 40 && <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold mb-2 break-words">{family.trait}</p>
                      
                      <div className="space-y-4 mt-4">
                        {/* Influence */}
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>朝野影响力</span>
                            <span className="text-stone-300 font-bold">
                              {family.influence}
                              {prevFamily && prevFamily.influenceDelta !== 0 && (
                                <span className={prevFamily.influenceDelta > 0 ? 'text-emerald-400 ml-1' : 'text-red-400 ml-1'}>
                                  {prevFamily.influenceDelta > 0 ? '+' : ''}{prevFamily.influenceDelta}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-amber-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${family.influence}%` }}
                            />
                          </div>
                        </div>

                        {/* Loyalty */}
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>皇室忠诚度</span>
                            <span className={`font-bold ${getLoyaltyColor(family.loyalty)}`}>
                              {family.loyalty}
                              {prevFamily && prevFamily.loyaltyDelta !== 0 && (
                                <span className="ml-1 text-xs">
                                  ({prevFamily.loyaltyDelta > 0 ? '+' : ''}{prevFamily.loyaltyDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${family.loyalty >= 80 ? 'bg-emerald-500' : family.loyalty >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${family.loyalty}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* AI Result Area */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-900/50 border border-stone-800 rounded p-5 space-y-4 shadow-inner mt-auto"
                >
                  <p className="text-sm font-bold text-stone-500 uppercase flex items-center gap-2 border-b border-stone-800 pb-2">
                    <UserX className="w-4 h-4" /> 门阀反制与朝野动荡 (战报)
                  </p>
                  
                  <p className="text-amber-200 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#121110] border border-stone-800 rounded p-4 text-xs font-mono">
                    <p className="text-emerald-500 font-bold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" /> AI 政治逻辑溯源
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
