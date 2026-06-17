import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Send, ScrollText, Swords, Crown, EyeOff, Scale, Users2, ShieldAlert } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Faction {
  id: string;
  name: string;
  color: string;
  power: number; // sum to 100
  approval: number; // 0-100
  icon: any;
  desc: string;
}

const INITIAL_FACTIONS: Faction[] = [
  { id: 'scholars', name: '文官士大夫', color: '#3B82F6', power: 40, approval: 60, icon: ScrollText, desc: '掌控科举与地方行政，势力遍布朝野的大族。' },
  { id: 'military', name: '武勋集团', color: '#EF4444', power: 30, approval: 50, icon: Swords, desc: '随开国皇帝打天下的开国将门，手握京营重兵。' },
  { id: 'royals', name: '宗亲外戚', color: '#F59E0B', power: 20, approval: 40, icon: Crown, desc: '皇亲国戚，平日不理政事，但在法理上拥有极高地位。' },
  { id: 'eunuchs', name: '内廷宦官', color: '#8B5CF6', power: 10, approval: 80, icon: EyeOff, desc: '依附于皇权的家奴，执掌特务机构与内帑。' },
];

interface ParliamentResult {
  narrative: string;
  newPowers: Record<string, number>;
  approvalDeltas: Record<string, number>;
  ai_analysis: string;
}

// 预先计算100个席位的坐标 (半圆形)
const SEATS = (() => {
  const rings = [
    { radius: 60, count: 18 },
    { radius: 100, count: 24 },
    { radius: 140, count: 28 },
    { radius: 180, count: 30 },
  ];
  const points: { x: number, y: number, ringIndex: number }[] = [];
  rings.forEach((ring, rIdx) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = Math.PI - (Math.PI * i / (ring.count - 1));
      const x = 250 + ring.radius * Math.cos(angle);
      const y = 220 - ring.radius * Math.sin(angle);
      points.push({ x, y, ringIndex: rIdx });
    }
  });
  return points;
})();

export default function FactionParliamentSandbox() {
  const [factions, setFactions] = useState<Faction[]>(INITIAL_FACTIONS);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ParliamentResult | null>(null);

  const executeAction = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/parliament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factions, actionInput })
      });

      if (!response.ok) throw new Error('AI Server Error');

      const outcome = await response.json() as ParliamentResult;
      
      setFactions(prev => {
        // Normalization to ensure sum is strictly 100
        const totalRaw = Object.values(outcome.newPowers || {}).reduce((a,b)=>a+b, 0) || 100;
        let normalizedPowers = prev.map(f => ({
          ...f,
          power: Math.round(((outcome.newPowers?.[f.id] ?? f.power) / totalRaw) * 100),
          approval: Math.max(0, Math.min(100, f.approval + (outcome.approvalDeltas?.[f.id] || 0)))
        }));
        
        let currentSum = normalizedPowers.reduce((sum, f) => sum + f.power, 0);
        if (currentSum !== 100 && currentSum > 0) {
          const diff = 100 - currentSum;
          // Apply diff to the faction with the largest power to minimize noticeable error
          normalizedPowers.sort((a,b)=>b.power - a.power)[0].power += diff;
        }

        // Restore original array order
        const idToInfo = new Map(normalizedPowers.map(x => [x.id, x]));
        return prev.map(f => idToInfo.get(f.id)!);
      });

      setTimeout(() => {
        sfx.playImpact();
        setResult(outcome);
      }, 500);

    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成分配给每个派系的席位数组 [color, color, ...] 固定100个
  const seatColors = useMemo(() => {
    const list: string[] = [];
    factions.forEach(f => {
      for (let i = 0; i < f.power; i++) {
        list.push(f.color);
      }
    });
    // 补齐或截断至100
    while (list.length < 100) list.push('#333');
    return list.slice(0, 100);
  }, [factions]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#171923] to-[#2D3748] border border-blue-900/40 rounded-lg p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none text-blue-500">
          <Landmark size={160} />
        </div>
        <div className="z-10 relative">
          <h2 className="text-xl font-serif font-black text-blue-200 flex items-center gap-2 mb-2">
            <Landmark className="w-6 h-6 text-blue-400" /> 利益集团与议政殿 (方案B: 权力天平)
          </h2>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            借鉴 <span className="text-blue-300 font-bold">Victoria 3 (维多利亚3)</span> 的利益集团 (Interest Groups) 系统。纯文字的政策往往干瘪，但当把朝堂抽象为一个「拥有100个席位的可视化议会」时，你颁布的每一个政令，都在直观地切割权力的蛋糕。这能极大增强玩家统治国家时的「实质沉浸感」。
          </p>
        </div>
      </div>

      {/* Main UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left: Interactions */}
        <div className="lg:col-span-5 bg-[#11141A] border border-slate-800 rounded-lg p-6 flex flex-col shadow-xl">
           <h3 className="text-slate-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-slate-800 pb-2 flex items-center gap-2 mb-4">
             <Scale className="w-4 h-4 text-blue-400" /> 帝王权术与政务抉择
           </h3>
           
           <div className="space-y-4 flex-1 flex flex-col">
              <label className="text-xs text-blue-400/80 font-bold flex justify-between">
                <span>下达触发派系博弈的旨意 (自然语言)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n打破文武壁垒，提拔大量出生入死的底层武将进入内阁议事，同时派太监去监军...\n或者：\n清查天下田亩，强迫宗室交税，彻底得罪既得利益者..."
                className="w-full min-h-[140px] bg-[#0A0D11] border border-slate-800 text-slate-200 p-4 rounded text-sm outline-none focus:border-blue-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('开展江南科场舞弊案大狱，借机剥夺大量江南世家大族官员的乌纱帽。')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">打击文官士族</button>
                <button onClick={() => setActionInput('加封太监魏千岁为九千岁，统领东厂锦衣卫，总督天下兵马。')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">宦官专权时代</button>
                <button onClick={() => setActionInput('清退军屯，收缴武将兵权，实行「杯酒释兵权」，推崇文人治军。')} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">重文轻武</button>
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={executeAction}
                  disabled={isProcessing || !actionInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-900/40 to-[#11141A] border border-blue-900/50 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-blue-200 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
                >
                  {isProcessing ? (
                    <span className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Send className="w-4 h-4" /> 
                  )}
                  {isProcessing ? '朝局博弈中...' : '落下棋子 (切分权力蛋糕)'}
                </button>
              </div>
           </div>
        </div>

        {/* Right: The Visual Parliament */}
        <div className="lg:col-span-7 bg-[#0A0C10] border border-slate-800 rounded-lg p-6 shadow-2xl relative flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                <Users2 className="w-4 h-4 text-blue-500" /> 议政殿派系权力图
              </h3>
              <span className="text-xs text-slate-500 font-mono">Total Influence Seats: 100</span>
           </div>

           {/* Parliament Arc Graphic */}
           <div className="flex justify-center flex-1 min-h-[260px] relative items-center pointer-events-none">
              <svg viewBox="0 0 500 250" className="w-full h-full max-h-[300px]" style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.5))' }}>
                 {/* Decor */}
                 <path d="M 50 220 A 200 200 0 0 1 450 220" fill="none" stroke="#1A202C" strokeWidth="80" opacity="0.3" />
                 
                 {/* Seats */}
                 {SEATS.map((pos, i) => (
                    <GSeat key={i} x={pos.x} y={pos.y} color={seatColors[i] || '#333'} delay={i * 0.005} />
                 ))}

                 {/* Center Podium */}
                 <circle cx="250" cy="220" r="30" fill="#1A202C" stroke="#2D3748" strokeWidth="2" />
                 <text x="250" y="225" textAnchor="middle" fill="#718096" fontSize="10" fontFamily="serif" letterSpacing="2">皇权</text>
              </svg>

              <AnimatePresence>
                {result && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-x-4 top-4 bg-slate-900/95 backdrop-blur border border-blue-500/30 p-4 rounded shadow-2xl z-20 pointer-events-auto"
                   >
                     <p className="text-sm text-slate-200 font-serif leading-relaxed">
                        <span className="text-blue-400 font-bold mr-2">【朝局动荡】</span>
                        {result.narrative}
                     </p>
                     <div className="mt-3 text-xs text-slate-500 font-mono border-t border-slate-800 pt-2 flex items-start gap-2">
                       <Scale className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                       <span className="leading-tight">{result.ai_analysis}</span>
                     </div>
                   </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* Faction Stats Table */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
               {factions.map(f => {
                 const diff = result?.newPowers?.[f.id] !== undefined ? result.newPowers[f.id] - (factions.find(x => x.id === f.id)?.power || 0) : 0;
                 return (
                   <div key={f.id} className="flex flex-col bg-[#11141A] p-3 rounded border border-slate-800/50">
                      <div className="flex items-center gap-1.5 mb-2">
                         <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: f.color }}></div>
                         <span className="text-xs font-bold text-slate-300 truncate">{f.name}</span>
                      </div>
                      <div className="flex justify-between items-baseline mb-1">
                         <span className="text-[10px] text-slate-500 font-mono">政治影响(席位)</span>
                         <div className="flex items-center gap-1">
                           <motion.span 
                             key={`pow-${f.power}`}
                             initial={{ scale: 1.2, color: '#60A5FA' }}
                             animate={{ scale: 1, color: '#E2E8F0' }}
                             className="font-black text-sm text-slate-200"
                           >
                              {f.power}%
                           </motion.span>
                         </div>
                      </div>
                      <div className="flex justify-between items-baseline">
                         <span className="text-[10px] text-slate-500 font-mono">对皇权好感度</span>
                         <span className={`text-xs font-bold ${f.approval >= 60 ? 'text-emerald-400' : f.approval <= 30 ? 'text-red-400' : 'text-amber-400'}`}>
                           {f.approval}
                         </span>
                      </div>
                   </div>
                 );
               })}
           </div>

        </div>

      </div>
    </div>
  );
}

const GSeat: React.FC<{ x: number, y: number, color: string, delay: number }> = ({ x, y, color, delay }) => {
  return (
    <motion.circle 
       cx={x} 
       cy={y} 
       r="6"
       initial={false}
       animate={{ fill: color }}
       transition={{ duration: 0.8, delay, ease: "easeInOut" }}
       style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.8))" }}
       stroke="#0F172A"
       strokeWidth="1.5"
    />
  );
};
