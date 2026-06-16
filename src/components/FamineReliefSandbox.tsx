import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wheat, Send, Waves, AlertTriangle, CloudRain, ShieldAlert, TrendingDown } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface RegionData {
  id: string;
  name: string;
  disasterLevel: number; // 0-100 (0=丰收, 100=大灾荒)
  grainReserve: number; // 0-100 地方仓储
  corruption: number; // 0-100 贪腐漂没率
}

const INITIAL_REGIONS: RegionData[] = [
  { id: 'jiangnan', name: '江南道 (帝国粮仓)', disasterLevel: 10, grainReserve: 90, corruption: 40 },
  { id: 'zhongyuan', name: '中原道 (四战之地)', disasterLevel: 80, grainReserve: 20, corruption: 60 },
  { id: 'guanzhong', name: '关中道 (京畿重地)', disasterLevel: 45, grainReserve: 50, corruption: 30 }
];

interface FamineResult {
  narrative: string;
  treasuryDelta: number; // 户部银钱消耗
  rebelRiskDelta: number; // 饥民起义风险变化
  regionUpdates: {
    id: string;
    grainDelta: number;
    corruptionDelta: number;
  }[];
  ai_analysis: string;
}

export default function FamineReliefSandbox() {
  const [regions, setRegions] = useState<RegionData[]>(INITIAL_REGIONS);
  const [treasury, setTreasury] = useState(60); // 帝国国库 0-100
  const [rebelRisk, setRebelRisk] = useState(40); // 饥民造反风险 0-100
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FamineResult | null>(null);

  const executeReliefPolicy = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/faminerelief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regions: regions.map(r => ({ id: r.id, name: r.name, disasterLevel: r.disasterLevel, grainReserve: r.grainReserve, corruption: r.corruption })),
          treasury,
          rebelRisk,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as FamineResult;
      
      setRegions(prev => prev.map(r => {
        const update = outcome.regionUpdates?.find(x => x.id === r.id);
        if (update) {
          return {
            ...r,
            grainReserve: Math.max(0, Math.min(100, r.grainReserve + update.grainDelta)),
            corruption: Math.max(0, Math.min(100, r.corruption + update.corruptionDelta)),
            disasterLevel: Math.max(0, r.disasterLevel - Math.max(0, update.grainDelta / 2)) // Grain reduces disaster impact
          };
        }
        return r;
      }));

      setTreasury(prev => Math.max(0, Math.min(100, prev + (outcome.treasuryDelta || 0))));
      setRebelRisk(prev => Math.max(0, Math.min(100, prev + (outcome.rebelRiskDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】赈灾粮队在途中遭遇灾民哄抢，地方官员中饱私囊，赈济失败。",
        treasuryDelta: -10,
        rebelRiskDelta: +15,
        regionUpdates: [],
        ai_analysis: "（无API环境）未能接入大模型，古代赈灾极其困难，没有严密的监督形同虚设。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#212529] to-stone-900 border border-yellow-900/30 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Wheat size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-yellow-500 flex items-center gap-2 mb-2">
          <Waves className="w-6 h-6" /> 漕运赈灾与常平仓 (方向九)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          灾荒是王朝倾覆的直接导火索。黄河泛滥、赤地千里，你必须调动漕粮赈济灾民。然而“火耗”与贪墨横行，赈灾粮往往变成沙土或半路失踪。AI将推演你的抗灾统筹、反贪手段以及饥民暴动的临界点。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#1C1A17] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-yellow-500" /> 户部与赈灾行营
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-yellow-500/80 font-bold flex justify-between">
                <span>下达赈灾与反贪调度令 (自然语言)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n派出钦差大臣携带尚方宝剑，发现克扣赈灾粮的官员就地正法；并在赈灾粥里掺沙子以防富贵人家冒领... \n或者：\n强令富商江南大户捐粮买官..."
                className="w-full min-h-[160px] bg-stone-950 border border-yellow-900/30 text-stone-200 p-4 rounded text-sm outline-none focus:border-yellow-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('在赈灾施粥时故意掺杂沙土麦麸，确保只有真正的饥民才会去吃，阻止豪绅冒领，以有限的粮食救活最多的人。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">赈粥掺沙 (和珅法)</button>
                <button onClick={() => setActionInput('大开杀戒，派遣锦衣卫随行漕粮船队，一旦发现沿途火耗漂没超过一成，官员连坐满门抄斩。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">铁血反贪</button>
                <button onClick={() => setActionInput('鼓励受灾灾民向江南富庶地区大规模逃荒，由南方地方财政负责吸纳流民。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">流民南渡</button>
              </div>
            </div>
            
            <button
              onClick={executeReliefPolicy}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-yellow-900/40 to-[#1C1A17] border border-yellow-900/50 hover:border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-yellow-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '赈灾快马传递中...' : '八百里加急 (拨付赈粮)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800 space-y-4">
             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><TrendingDown className="w-4 h-4 text-emerald-400"/>帝国户部存银 (国库)：</span>
                 <span className={`text-lg font-black ${treasury < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{treasury} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${treasury}%` }}
                  />
                </div>
             </div>

             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500"/>饥民揭竿而起风险：</span>
                 <span className={`text-lg font-black ${rebelRisk > 70 ? 'text-red-500 animate-pulse' : 'text-stone-300'}`}>{rebelRisk} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${rebelRisk >= 70 ? 'bg-red-600' : 'bg-red-900/60'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${rebelRisk}%` }}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-yellow-500" /> 各道灾情与常平仓底细
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {regions.map(r => {
                const prevUpdate = result?.regionUpdates?.find(x => x.id === r.id);
                return (
                  <motion.div 
                    key={r.id}
                    layout
                    className={`bg-[#1a1918] border ${r.disasterLevel > 60 ? 'border-red-900/50' : 'border-stone-800'} rounded-lg p-4 flex flex-col relative`}
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className={`text-stone-200 font-serif font-black text-lg mb-3 flex items-center justify-between`}>
                        {r.name}
                        {r.disasterLevel > 70 && <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded border border-red-800/50">大灾</span>}
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>常平仓余粮 (赈灾生命线)</span>
                            <span className={`font-bold ${r.grainReserve < 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {r.grainReserve}
                              {prevUpdate && prevUpdate.grainDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.grainDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ({prevUpdate.grainDelta > 0 ? '+' : ''}{prevUpdate.grainDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${r.grainReserve >= 40 ? 'bg-emerald-600' : 'bg-red-600'}`}
                              animate={{ width: `${Math.min(100, r.grainReserve)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>地方官贪墨/火耗漂没率</span>
                            <span className={`font-bold ${r.corruption > 60 ? 'text-red-400' : 'text-stone-400'}`}>
                              {r.corruption}%
                              {prevUpdate && prevUpdate.corruptionDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.corruptionDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  ({prevUpdate.corruptionDelta > 0 ? '+' : ''}{prevUpdate.corruptionDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${r.corruption >= 50 ? 'bg-amber-600' : 'bg-stone-600'}`}
                              animate={{ width: `${r.corruption}%` }}
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
                  <p className="text-sm font-bold text-yellow-900 bg-yellow-500/10 px-2 py-1 uppercase flex items-center justify-between border-b border-yellow-900/30 pb-2">
                    <span className="flex items-center gap-2 text-yellow-500">
                       <Wheat className="w-4 h-4" /> 赈灾御史回奏
                    </span>
                  </p>
                  
                  <p className="text-stone-300 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#1C1A17] border border-yellow-900/20 rounded p-4 text-xs font-mono">
                    <p className="text-yellow-600 font-bold mb-2 flex items-center gap-2">
                      <Waves className="w-4 h-4" /> AI 漕运与贪腐经济学演算
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
