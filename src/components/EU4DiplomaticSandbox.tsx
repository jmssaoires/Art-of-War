import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Send, ShieldAlert, Zap, Skull, TrendingDown } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Nation {
  id: string;
  name: string;
  type: 'player' | 'horde' | 'vassal' | 'rival' | 'neutral';
  x: number;
  y: number;
  relation: number; // -100 to 100
  ae: number; // 0 to 100 (Aggressive Expansion)
  isCoalition: boolean;
}

const INITIAL_NATIONS: Nation[] = [
  { id: 'ming', name: '大明 (你)', type: 'player', x: 400, y: 250, relation: 100, ae: 0, isCoalition: false },
  { id: 'mongol', name: '鞑靼部', type: 'horde', x: 400, y: 80, relation: -30, ae: 10, isCoalition: false },
  { id: 'oirat', name: '瓦剌', type: 'horde', x: 200, y: 120, relation: -60, ae: 20, isCoalition: false },
  { id: 'korea', name: '朝鲜', type: 'vassal', x: 600, y: 150, relation: 80, ae: 0, isCoalition: false },
  { id: 'japan', name: '室町幕府', type: 'rival', x: 650, y: 280, relation: -20, ae: 5, isCoalition: false },
  { id: 'tibet', name: '乌思藏', type: 'neutral', x: 180, y: 350, relation: 20, ae: 0, isCoalition: false },
  { id: 'vietnam', name: '大越', type: 'neutral', x: 400, y: 420, relation: 10, ae: 15, isCoalition: false }
];

interface EU4Result {
  narrative: string;
  nationUpdates: {
    id: string;
    relationDelta: number;
    aeDelta: number;
    isCoalition: boolean;
  }[];
  ai_analysis: string;
}

export default function EU4DiplomaticSandbox() {
  const [nations, setNations] = useState<Nation[]>(INITIAL_NATIONS);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EU4Result | null>(null);

  const executeAction = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/eu4diplomacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nations, actionInput })
      });

      if (!response.ok) throw new Error('AI Server Error');

      const outcome = await response.json() as EU4Result;
      
      setNations(prev => prev.map(n => {
        const update = outcome.nationUpdates?.find(x => x.id === n.id);
        if (update) {
          return {
            ...n,
            relation: Math.max(-100, Math.min(100, n.relation + (update.relationDelta || 0))),
            ae: Math.max(0, Math.min(100, n.ae + (update.aeDelta || 0))),
            isCoalition: update.isCoalition || n.isCoalition
          };
        }
        return n;
      }));

      setTimeout(() => {
        if (outcome.nationUpdates?.some(u => u.isCoalition)) {
           sfx.playImpact();
        } else {
           sfx.playScroll();
        }
        setResult(outcome);
      }, 500);

    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getEdgeStyle = (source: Nation, playerCenter: { x: number, y: number }) => {
     let color = '#334155'; // default stroke
     let dash = '0';
     let width = '2';

     if (source.isCoalition) {
       color = '#DC2626'; // Red coalition
       width = '4';
       dash = '5,5';
     } else if (source.type === 'vassal') {
       color = '#3B82F6'; // Blue vassal
     } else if (source.relation < -50) {
       color = '#F97316'; // Orange tension
     } else if (source.relation > 50) {
       color = '#10B981'; // Green friendly
     }

     return { stroke: color, strokeWidth: width, strokeDasharray: dash };
  };

  const playerNode = nations.find(n => n.id === 'ming')!;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#21172A] to-[#0F172A] border border-red-900/30 rounded-lg p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none text-red-500">
          <Globe size={160} />
        </div>
        <div className="z-10 relative">
          <h2 className="text-xl font-serif font-black text-red-300 flex items-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-red-400" /> 地缘外交与包围网 (方案D)
          </h2>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            借鉴 <span className="text-red-300 font-bold">欧陆风云4 (Europa Universalis 4)</span> 的外交核心：**侵略扩张 (AE)** 与 **包围网 (Coalition)**。不要试图在外交上一直硬刚，如果你仗着武力四面出击吞并土地，激增的 AE 值会让周边所有国家感受到危机，最终组建「反明包围网」将你群起而攻之。动态的蜘蛛网图完美展现了地缘压力的拉扯。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Interaction Panel */}
        <div className="lg:col-span-4 bg-[#11141A] border border-slate-800 rounded-lg p-6 flex flex-col shadow-xl z-20">
           <h3 className="text-slate-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-slate-800 pb-2 flex items-center gap-2 mb-4">
             <TrendingDown className="w-4 h-4 text-red-400" /> 帝国大图景行动
           </h3>
           
           <div className="space-y-4 flex-1 flex flex-col">
              <label className="text-xs text-red-300 font-bold flex justify-between">
                <span>你的战争借口与外交指令 (自然语言)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n无视朝贡体系，直接发兵三万吞并大越，强行设立交趾布政使司...\n或者：\n派遣使节重金向鞑靼部赐赠丝绸和茶叶，以安抚边疆..."
                className="w-full min-h-[160px] bg-[#0A0D11] border border-slate-800 text-slate-200 p-4 rounded text-sm outline-none focus:border-red-900/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('借口瓦剌使节无礼，尽起京营精锐北伐，强行割占大片草原并摧毁他们神圣的祭拜地。')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">无理宣战侵吞</button>
                <button onClick={() => setActionInput('将皇室宗女下嫁给朝鲜国王，并在鸭绿江开设互市，加深两国藩属同盟关系。')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">朝贡联姻</button>
                <button onClick={() => setActionInput('对日本室町幕府发布严厉的海禁禁令，指责他们包庇倭寇，甚至扬言要跨海远征。')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">强硬外交讹诈</button>
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={executeAction}
                  disabled={isProcessing || !actionInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-red-900/40 to-[#11141A] border border-red-900/50 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-red-200 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-[0_0_15px_rgba(220,38,38,0.1)] active:scale-95"
                >
                  {isProcessing ? (
                    <span className="w-4 h-4 border-2 border-red-200 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Send className="w-4 h-4" /> 
                  )}
                  {isProcessing ? '外交发酵中...' : '大国外交断绝'}
                </button>
              </div>
           </div>
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-8 bg-[#070B14] border border-slate-800 rounded-lg relative overflow-hidden flex flex-col shadow-inner min-h-[400px]">
           
           {/* Radar / Grid effect background */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '50% 50%' }}></div>
           
           {/* Edges Container */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
             {nations.filter(n => n.id !== 'ming').map(n => {
                 const style = getEdgeStyle(n, { x: playerNode.x, y: playerNode.y });
                 return (
                   <g key={`edge-${n.id}`}>
                     {n.isCoalition && (
                        <path 
                           d={`M ${n.x} ${n.y} L ${playerNode.x} ${playerNode.y}`} 
                           fill="none" 
                           stroke="#DC2626" 
                           strokeWidth="20"
                           opacity="0.1"
                        />
                     )}
                     <path 
                       d={`M ${n.x} ${n.y} L ${playerNode.x} ${playerNode.y}`} 
                       fill="none" 
                       stroke={style.stroke} 
                       strokeWidth={style.strokeWidth}
                       strokeDasharray={style.strokeDasharray}
                       className={n.isCoalition ? 'animate-pulse' : ''}
                       opacity="0.6"
                     />
                   </g>
                 )
             })}
           </svg>

           {/* Nodes */}
           {nations.map(node => (
             <motion.div
                key={node.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                layout
                className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex flex-col items-center justify-center z-10 
                  ${node.id === 'ming' ? 'bg-amber-600 border-2 border-amber-300 shadow-[0_0_30px_rgba(217,119,6,0.6)] z-20' : 
                    node.isCoalition ? 'bg-red-950 border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse' :
                    'bg-slate-800 border border-slate-600'}`}
                style={{ top: node.y, left: node.x }}
                title={`AE: ${node.ae} | Relation: ${node.relation}`}
             >
                {node.isCoalition && <ShieldAlert className="absolute -top-3 -right-3 w-5 h-5 text-red-500 z-30 bg-black rounded-full" />}
                <span className={`text-[10px] font-black ${node.id === 'ming' ? 'text-amber-50' : node.isCoalition ? 'text-red-300' : 'text-slate-300'}`}>{node.name}</span>
                {node.id !== 'ming' && (
                  <div className="absolute -bottom-5 whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-700">
                     <span className="text-red-400">AE:{node.ae}</span> <span className={node.relation > 0 ? "text-emerald-400" : "text-amber-500"}>好感:{node.relation}</span>
                  </div>
                )}
             </motion.div>
           ))}

           {/* Results Overlay */}
           <AnimatePresence>
             {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-6 right-6 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl p-4 rounded z-30 pointer-events-auto"
                >
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
                     <Skull className={`w-4 h-4 ${result.nationUpdates.some(u => u.isCoalition) ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                     <h4 className="text-sm font-bold text-slate-200">地缘演进报告</h4>
                  </div>
                  <p className="text-sm text-red-300 font-serif leading-relaxed mb-3">"{result.narrative}"</p>
                  
                  <div className="space-y-1 mb-3 max-h-32 overflow-y-auto pr-1">
                    {result.nationUpdates.map(u => {
                       const nation = nations.find(n => n.id === u.id);
                       if (!nation) return null;
                       return (
                         <div key={u.id} className="flex justify-between text-[10px] font-mono bg-slate-950 p-1.5 rounded">
                           <span className="text-slate-400 w-16 truncate">{nation.name}</span>
                           <span className={u.aeDelta > 0 ? 'text-red-400' : 'text-slate-500'}>AE {u.aeDelta > 0 ? '+' : ''}{u.aeDelta}</span>
                           <span className={u.relationDelta < 0 ? 'text-amber-500' : 'text-emerald-500'}>好感 {u.relationDelta > 0 ? '+' : ''}{u.relationDelta}</span>
                         </div>
                       )
                    })}
                  </div>

                  <div className="text-xs text-slate-500 font-mono italic leading-tight border-t border-slate-800 pt-2">
                    <Zap className="inline w-3 h-3 mr-1" />{result.ai_analysis}
                  </div>
                </motion.div>
             )}
           </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
