import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, FileText, Send, AlertTriangle, Activity, Users, Scaling, Layers } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface LandOwner {
  id: string;
  name: string;
  landPercentage: number;
  wealth: number; // 0-100 indicating economic power
  description: string;
}

const INITIAL_OWNERS: LandOwner[] = [
  { id: 'royal', name: '皇庄与官田', landPercentage: 20, wealth: 80, description: '皇室私产与边关屯田，朝廷直接掌控的经济命脉。' },
  { id: 'gentry', name: '世家与豪强', landPercentage: 45, wealth: 95, description: '拥有免税特权的特权阶级，疯狂侵吞并隐匿田亩。' },
  { id: 'peasants', name: '自耕农户', landPercentage: 35, wealth: 25, description: '帝国纳税的主力军，一旦破产便沦为流民或奴婢。' }
];

interface LandResult {
  narrative: string;
  refugeeDelta: number; // Refugee wave increase/decrease
  ownerUpdates: {
    id: string;
    landDelta: number;
    wealthDelta: number;
  }[];
  ai_analysis: string;
}

export default function LandMergeSandbox() {
  const [owners, setOwners] = useState<LandOwner[]>(INITIAL_OWNERS);
  const [refugees, setRefugees] = useState(15);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<LandResult | null>(null);

  const executeLandPolicy = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/landmerge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owners: owners.map(o => ({ id: o.id, name: o.name, landPercentage: o.landPercentage, wealth: o.wealth })),
          refugees,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as LandResult;
      
      setOwners(prev => prev.map(o => {
        const update = outcome.ownerUpdates?.find(u => u.id === o.id);
        if (update) {
          return {
            ...o,
            landPercentage: Math.max(0, Math.min(100, o.landPercentage + update.landDelta)),
            wealth: Math.max(0, Math.min(100, o.wealth + update.wealthDelta))
          };
        }
        return o;
      }));

      setRefugees(prev => Math.max(0, Math.min(100, prev + (outcome.refugeeDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】丈量土地的御史被地方豪强暗杀，兼并不可阻挡。",
        refugeeDelta: 5,
        ownerUpdates: [],
        ai_analysis: "（无API环境）豪绅阻挠导致田亩清丈失败，流灾四起。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getLandColor = (id: string) => {
    if (id === 'royal') return 'bg-amber-500';
    if (id === 'gentry') return 'bg-purple-500';
    return 'bg-emerald-500';
  };
  const getTextColor = (id: string) => {
    if (id === 'royal') return 'text-amber-500';
    if (id === 'gentry') return 'text-purple-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#2F3E46]/80 to-stone-900 border border-[#84A98C]/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Sprout size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-[#52796F] flex items-center gap-2 mb-2">
          <Layers className="w-6 h-6" /> 土地兼并与流民大潮 (方向六)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          王朝兴衰的终极底层密码："富者田连阡陌，贫者无立锥之地"。你可以强力清丈田亩、推行均田制，或者放化土地买卖。AI将演算土豪劣绅的抗税能力以及隐匿人口导致的流民爆发与起义风险。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <FileText className="w-4 h-4 text-[#84A98C]" /> 户部律令 (田制分配)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-[#84A98C]/80 font-bold flex justify-between">
                <span>拟定田制或户籍政令 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n彻底废除土地买卖限制，鼓励商人购买土地，只征收商业税... \n或者：\n推行全国清丈田亩（大明鱼鳞图册），隐匿土地的豪绅一律抄家流放..."
                className="w-full min-h-[160px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-[#84A98C]/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('清丈天下田亩，按鱼鳞图册严厉打击豪强隐匿的免税农庄，勒令其补缴欠税。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">清丈田亩</button>
                <button onClick={() => setActionInput('将所有无地流民收编为皇庄佃户，由皇家直接收租。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">扩充皇庄</button>
                <button onClick={() => setActionInput('效仿王莽改制，推行王田制，将天下土地收归国有，按丁男平均分配，禁止一切买卖。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">均田改制</button>
              </div>
            </div>
            
            <button
              onClick={executeLandPolicy}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#2F3E46] to-[#121110] border border-[#2F3E46]/50 hover:border-[#52796F] disabled:opacity-50 disabled:cursor-not-allowed text-[#CAD2C5] font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-[#CAD2C5] border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '底层推演中...' : '推行地政 (干预田产)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800">
             <div className="flex items-center justify-between text-xs font-mono">
               <span className="text-stone-500 flex items-center gap-1"><Users className="w-4 h-4 text-red-500"/>天下流民数量 (叛乱火药桶)：</span>
               <span className={`text-xl font-black ${refugees >= 60 ? 'text-red-500 animate-pulse' : refugees >= 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{refugees} / 100</span>
             </div>
             <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden mt-2">
                <motion.div 
                  className={`h-full ${refugees >= 60 ? 'bg-red-500' : refugees >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${refugees}%` }}
                />
              </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#52796F]" /> 帝国大略土地兼并雷达
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {owners.map(o => {
                const prevOwner = result?.ownerUpdates?.find(u => u.id === o.id);
                return (
                  <motion.div 
                    key={o.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative"
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className={`${getTextColor(o.id)} font-serif font-black text-lg mb-1 flex items-center justify-between`}>
                        {o.name}
                        {o.landPercentage < 10 && o.id === 'peasants' && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-bold mb-3 break-words">{o.description}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>掌控田亩比例 (兼并度)</span>
                            <span className={`font-bold ${getTextColor(o.id)}`}>
                              {o.landPercentage}%
                              {prevOwner && prevOwner.landDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevOwner.landDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  ({prevOwner.landDelta > 0 ? '+' : ''}{prevOwner.landDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${getLandColor(o.id)}`}
                              animate={{ width: `${Math.min(100, o.landPercentage)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>财富储蓄量</span>
                            <span className="text-stone-300 font-bold">
                              {o.wealth}
                              {prevOwner && prevOwner.wealthDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevOwner.wealthDelta > 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                                  ({prevOwner.wealthDelta > 0 ? '+' : ''}{prevOwner.wealthDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-amber-600"
                              animate={{ width: `${o.wealth}%` }}
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
                       <Sprout className="w-4 h-4" /> 兼并清丈后报
                    </span>
                  </p>
                  
                  <p className="text-[#CAD2C5] font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#121110] border border-stone-800 rounded p-4 text-xs font-mono">
                    <p className="text-[#52796F] font-bold mb-2 flex items-center gap-2">
                      <Scaling className="w-4 h-4" /> AI 王朝经济周期衰变溯源
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
