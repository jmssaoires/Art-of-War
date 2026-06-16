import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Castle, Send, MapPin, Swords, Crown, AlertTriangle, Crosshair } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface VassalClan {
  id: string;
  name: string;
  militaryPower: number; // 0-100 护卫兵力
  loyalty: number; // 0-100 对中央的忠诚
  domainSize: number; // 0-100 封地规模
}

const INITIAL_VASSALS: VassalClan[] = [
  { id: 'yan_king', name: '燕王 (九边重镇)', militaryPower: 85, loyalty: 40, domainSize: 70 },
  { id: 'chu_king', name: '楚王 (江南富庶)', militaryPower: 30, loyalty: 80, domainSize: 60 },
  { id: 'qin_king', name: '秦王 (关中屏障)', militaryPower: 65, loyalty: 65, domainSize: 50 }
];

interface VassalResult {
  narrative: string;
  centralPowerDelta: number; // 中央集权/兵力变化
  civilWarRiskDelta: number; // 内战爆发风险（削藩反叛）
  vassalUpdates: {
    id: string;
    loyaltyDelta: number;
    militaryDelta: number;
    domainDelta: number;
  }[];
  ai_analysis: string;
}

export default function VassalRebellionSandbox() {
  const [vassals, setVassals] = useState<VassalClan[]>(INITIAL_VASSALS);
  const [centralPower, setCentralPower] = useState(50); // 中央禁军实力 0-100
  const [civilWarRisk, setCivilWarRisk] = useState(30); // 削藩激变内战风险 0-100
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VassalResult | null>(null);

  const executeVassalPolicy = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/vassal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vassals: vassals.map(v => ({ id: v.id, name: v.name, militaryPower: v.militaryPower, loyalty: v.loyalty, domainSize: v.domainSize })),
          centralPower,
          civilWarRisk,
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as VassalResult;
      
      setVassals(prev => prev.map(v => {
        const update = outcome.vassalUpdates?.find(x => x.id === v.id);
        if (update) {
          return {
            ...v,
            loyalty: Math.max(0, Math.min(100, v.loyalty + update.loyaltyDelta)),
            militaryPower: Math.max(0, Math.min(100, v.militaryPower + update.militaryDelta)),
            domainSize: Math.max(0, Math.min(100, v.domainSize + update.domainDelta))
          };
        }
        return v;
      }));

      setCentralPower(prev => Math.max(0, Math.min(100, prev + (outcome.centralPowerDelta || 0))));
      setCivilWarRisk(prev => Math.max(0, Math.min(100, prev + (outcome.civilWarRiskDelta || 0))));

      setTimeout(() => {
        if (outcome.civilWarRiskDelta > 15) sfx.playImpact();
        else sfx.playImpact();
        setResult(outcome);
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】削藩诏书刚刚抵达，藩王便直接起兵“奉天靖难”，天下大乱。",
        centralPowerDelta: -10,
        civilWarRiskDelta: +30,
        vassalUpdates: [],
        ai_analysis: "（无API环境）简单的暴力削藩直接引爆了宗室的求生欲，演变成了全面内战。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#170F11] to-stone-900 border border-fuchsia-900/30 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Castle size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-fuchsia-500 flex items-center gap-2 mb-2">
          <Crown className="w-6 h-6" /> 宗室分封与削藩靖难 (方向十)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          开国皇帝往往大封同姓子弟以藩卫中央。但数代之后，诸侯尾大不掉。你是选择强制削夺兵权（如建文帝削藩引爆靖难之役），还是推行温水煮青蛙的“推恩令”兵不血刃瓦解藩国？AI将根据你的手段推演藩王反叛的几率。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#140E11] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <Crosshair className="w-4 h-4 text-fuchsia-500" /> 兵部与宗人府令
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-fuchsia-500/80 font-bold flex justify-between">
                <span>下达削藩或宗室政令 (自然语言)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n无借口暴力削藩，褫夺所有九边塞王的兵权，贬为庶人流放边疆，抵抗者杀无赦... \n或者：\n颁布推恩令，藩王死后必须将封地均分给所有子嗣，代代相传直到裂土为针..."
                className="w-full min-h-[160px] bg-stone-950 border border-fuchsia-900/30 text-stone-200 p-4 rounded text-sm outline-none focus:border-fuchsia-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('效仿汉武帝颁布《推恩令》，强制所有藩王必须将封土平分给所有的儿子，分立多个侯国，中央顺势收编。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">阳谋推恩令</button>
                <button onClick={() => setActionInput('武力强行削藩，调遣中央禁军包围主要藩王府邸，将其逼死或收押，强行裁撤护卫军。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">暴力削藩 (建文帝)</button>
                <button onClick={() => setActionInput('将藩王全部迁入京城集中圈养，作为富贵闲人，剥夺他们在地方的行政与军事权力。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">京城圈养</button>
              </div>
            </div>
            
            <button
              onClick={executeVassalPolicy}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-fuchsia-950/60 to-[#140E11] border border-fuchsia-900/50 hover:border-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed text-fuchsia-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-fuchsia-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '军机传达中...' : '驿站飞马 (颁布削藩令)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800 space-y-4">
             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><Castle className="w-4 h-4 text-emerald-400"/>中央禁军绝对武力：</span>
                 <span className={`text-lg font-black ${centralPower < 40 ? 'text-red-400' : 'text-emerald-400'}`}>{centralPower} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${centralPower}%` }}
                  />
                </div>
             </div>

             <div>
               <div className="flex items-center justify-between text-xs font-mono mb-1">
                 <span className="text-stone-500 flex items-center gap-1"><Swords className="w-4 h-4 text-red-500"/>藩镇起兵内战/宗室造反风险：</span>
                 <span className={`text-lg font-black ${civilWarRisk > 70 ? 'text-red-500 animate-pulse' : 'text-stone-300'}`}>{civilWarRisk} / 100</span>
               </div>
               <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${civilWarRisk >= 70 ? 'bg-red-600' : 'bg-red-900/60'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${civilWarRisk}%` }}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4 text-fuchsia-500" /> 天下诸侯藩镇实力盘点
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {vassals.map(v => {
                const prevUpdate = result?.vassalUpdates?.find(x => x.id === v.id);
                return (
                  <motion.div 
                    key={v.id}
                    layout
                    className={`bg-[#1a1918] border ${v.loyalty < 30 ? 'border-red-900/50' : 'border-stone-800'} rounded-lg p-4 flex flex-col relative`}
                  >
                    <div className="z-10 mb-2 h-full">
                      <h4 className={`text-stone-200 font-serif font-black text-lg mb-3 flex items-center justify-between`}>
                        {v.name}
                        {v.loyalty < 40 && v.militaryPower > 60 && <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded border border-red-800/50 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 有异心</span>}
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                            <span>地方护卫兵力 (拥兵自重)</span>
                            <span className={`font-bold ${v.militaryPower > 70 ? 'text-red-400' : 'text-stone-400'}`}>
                              {v.militaryPower}
                              {prevUpdate && prevUpdate.militaryDelta !== 0 && (
                                <span className={`ml-1 text-xs ${prevUpdate.militaryDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  ({prevUpdate.militaryDelta > 0 ? '+' : ''}{prevUpdate.militaryDelta})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${v.militaryPower >= 60 ? 'bg-red-600' : 'bg-stone-600'}`}
                              animate={{ width: `${Math.min(100, v.militaryPower)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                              <span>臣服忠诚度</span>
                              <span className={`font-bold ${v.loyalty < 50 ? 'text-red-400' : 'text-blue-400'}`}>
                                {v.loyalty}
                                {prevUpdate && prevUpdate.loyaltyDelta !== 0 && (
                                  <span className={`ml-1 text-[10px] ${prevUpdate.loyaltyDelta > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                    ({prevUpdate.loyaltyDelta > 0 ? '+' : ''}{prevUpdate.loyaltyDelta})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${v.loyalty > 50 ? 'bg-blue-600' : 'bg-red-600'}`}
                                animate={{ width: `${v.loyalty}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                              <span>封土兼并度</span>
                              <span className={`font-bold text-amber-500`}>
                                {v.domainSize}
                                {prevUpdate && prevUpdate.domainDelta !== 0 && (
                                  <span className={`ml-1 text-[10px] ${prevUpdate.domainDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    ({prevUpdate.domainDelta > 0 ? '+' : ''}{prevUpdate.domainDelta})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-amber-600"
                                animate={{ width: `${v.domainSize}%` }}
                              />
                            </div>
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
                  <p className="text-sm font-bold text-fuchsia-900 bg-fuchsia-500/10 px-2 py-1 uppercase flex items-center justify-between border-b border-fuchsia-900/30 pb-2">
                    <span className="flex items-center gap-2 text-fuchsia-500">
                       <Crown className="w-4 h-4" /> 宗人府秘奏
                    </span>
                  </p>
                  
                  <p className="text-stone-300 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#140E11] border border-fuchsia-900/20 rounded p-4 text-xs font-mono">
                    <p className="text-fuchsia-600 font-bold mb-2 flex items-center gap-2">
                      <Swords className="w-4 h-4" /> AI 集权与内战兵棋推演
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
