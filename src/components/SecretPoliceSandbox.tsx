import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Send, Eye, Brain, Key, EyeOff, AlertTriangle, Fingerprint } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface BureaucratUnit {
  id: string;
  name: string;
  loyalty: number; // 0-100 indicating loyalty to emperor
  efficiency: number; // 0-100
  paranoia: number; // 0-100 feeling threatened by secret police
  description: string;
}

const INITIAL_UNITS: BureaucratUnit[] = [
  { id: 'civilian', name: '文官集团 (内阁/六部)', loyalty: 65, efficiency: 80, paranoia: 30, description: '负责帝国日常运转，害怕锦衣卫无孔不入的监视。' },
  { id: 'military', name: '军功勋贵 (五军都督府)', loyalty: 80, efficiency: 60, paranoia: 40, description: '手握重兵但头脑简单，经常被太监或都督诬陷谋反。' },
  { id: 'eunuch', name: '内廷宦官 (司礼监/东厂)', loyalty: 95, efficiency: 40, paranoia: 20, description: '皇帝家奴，特务统治的直接执行者，极度招揽仇恨。' }
];

interface SecretPoliceResult {
  narrative: string;
  emperorPowerDelta: number; // 皇权集中度
  terrorLevelDelta: number; // 恐怖指数
  unitUpdates: {
    id: string;
    loyaltyDelta: number;
    efficiencyDelta: number;
  }[];
  ai_analysis: string;
}

export default function SecretPoliceSandbox() {
  const [units, setUnits] = useState<BureaucratUnit[]>(INITIAL_UNITS);
  const [emperorPower, setEmperorPower] = useState(60);
  const [terrorLevel, setTerrorLevel] = useState(25);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SecretPoliceResult | null>(null);

  const executeTerrorRule = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/secretpolice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units: units.map(u => ({ id: u.id, name: u.name, loyalty: u.loyalty, efficiency: u.efficiency })),
          emperorPower,
          terrorLevel,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as SecretPoliceResult;
      
      setUnits(prev => prev.map(u => {
        const update = outcome.unitUpdates?.find(x => x.id === u.id);
        if (update) {
          return {
            ...u,
            loyalty: Math.max(0, Math.min(100, u.loyalty + update.loyaltyDelta)),
            efficiency: Math.max(0, Math.min(100, u.efficiency + update.efficiencyDelta)),
            paranoia: Math.max(0, Math.min(100, u.paranoia + Math.max(0, outcome.terrorLevelDelta)))
          };
        }
        return u;
      }));

      setEmperorPower(prev => Math.max(0, Math.min(100, prev + (outcome.emperorPowerDelta || 0))));
      setTerrorLevel(prev => Math.max(0, Math.min(100, prev + (outcome.terrorLevelDelta || 0))));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】缇骑出动受阻，满朝文武集体罢工抗议。",
        emperorPowerDelta: -5,
        terrorLevelDelta: +2,
        unitUpdates: [],
        ai_analysis: "（无API环境）未能接入演化大模型，特务统治引发强烈反弹。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#1E1B18] to-stone-900 border border-red-900/30 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Eye size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-red-500 flex items-center gap-2 mb-2">
          <Fingerprint className="w-6 h-6" /> 酷吏缇骑与特务政治 (方向七)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          设立明朝厂卫或武周酷吏系统。特务政治能粉碎相权、集中皇权并震慑贪污，但极度恐怖会导致官员“不做事保命”（效率崩塌）或引发禁军兵变反噬。掌握杀人与宽恕的平衡是帝王心术的巅峰。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#0C0A09] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <Key className="w-4 h-4 text-red-500" /> 御前密旨 (东厂/锦衣卫)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-red-500/80 font-bold flex justify-between">
                <span>下达诏狱律令 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n设立锦衣卫，赋予法外审讯之权，在大朝会上当场杖毙异见的大臣... \n或者：\n平反冤假错案，凌迟处死跋扈的东厂督主以平息民愤..."
                className="w-full min-h-[160px] bg-[#1a1514] border border-red-900/30 text-stone-200 p-4 rounded text-sm outline-none focus:border-red-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('借胡惟庸案大兴连坐之法，株连文武百官一万五千余人，彻底废除丞相制度，六部直接对皇帝负责。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">大兴诏狱</button>
                <button onClick={() => setActionInput('任用酷吏实行检举揭发制度（如武则天铜铠），任何百姓可以向朝廷实名或匿名告密，官员一旦被查实立即抄家。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">密折检举</button>
                <button onClick={() => setActionInput('废除东厂与锦衣卫的诏狱审讯权，案件全部交由三法司（刑部、大理寺、都察院）按大明律公开审理。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">撤销厂卫</button>
              </div>
            </div>
            
            <button
              onClick={executeTerrorRule}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-red-950 to-[#0C0A09] border border-red-900/50 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-red-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-red-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <ShieldAlert className="w-4 h-4" /> 
              )}
              {isProcessing ? '批红用印中...' : '拟写朱批 (执行恐怖统治)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800 space-y-4">
             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><Brain className="w-4 h-4 text-purple-500"/>孤家寡人 (皇权集中度)：</span>
                 <span className={`text-lg font-black ${emperorPower >= 80 ? 'text-purple-400' : 'text-stone-300'}`}>{emperorPower} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${emperorPower}%` }}
                  />
                </div>
             </div>

             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><EyeOff className="w-4 h-4 text-red-500"/>朝野恐怖指数 (怠政风险)：</span>
                 <span className={`text-lg font-black ${terrorLevel >= 70 ? 'text-red-500 animate-pulse' : 'text-stone-300'}`}>{terrorLevel} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-800 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${terrorLevel}%` }}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-red-500" /> 特务监视臣僚面板
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {units.map(u => {
                const prevUpdate = result?.unitUpdates?.find(x => x.id === u.id);
                return (
                  <motion.div 
                    key={u.id}
                    layout
                    className="bg-[#1a1918] border border-stone-800 rounded-lg p-4 flex flex-col relative"
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className={`text-stone-200 font-serif font-black text-lg mb-1 flex items-center justify-between`}>
                        {u.name}
                        {u.efficiency < 30 && <AlertTriangle className="w-4 h-4 text-stone-500 animate-pulse" />}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold mb-3 break-words">{u.description}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>绝对忠诚 / 畏惧度</span>
                            <span className={`font-bold text-blue-400`}>
                              {u.loyalty}
                              {prevUpdate && prevUpdate.loyaltyDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.loyaltyDelta > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                  ({prevUpdate.loyaltyDelta > 0 ? '+' : ''}{prevUpdate.loyaltyDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full bg-blue-500`}
                              animate={{ width: `${Math.min(100, u.loyalty)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>官僚行政执行力 (怠政)</span>
                            <span className={`font-bold ${u.efficiency < 40 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {u.efficiency}
                              {prevUpdate && prevUpdate.efficiencyDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.efficiencyDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  ({prevUpdate.efficiencyDelta > 0 ? '+' : ''}{prevUpdate.efficiencyDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${u.efficiency >= 50 ? 'bg-emerald-600' : 'bg-red-600'}`}
                              animate={{ width: `${u.efficiency}%` }}
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
                  <p className="text-sm font-bold text-red-900 bg-red-500/20 px-2 py-1 uppercase flex items-center justify-between border-b border-red-900/50 pb-2">
                    <span className="flex items-center gap-2 text-red-500">
                       <Fingerprint className="w-4 h-4" /> 锦衣卫镇抚司密折
                    </span>
                  </p>
                  
                  <p className="text-stone-300 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#0C0A09] border border-red-900/20 rounded p-4 text-xs font-mono">
                    <p className="text-red-500 font-bold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" /> AI 帝王心术与权力制衡演算
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
