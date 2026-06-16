import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Send, ShieldAlert, Sparkles, UserX, Skull, BookOpen, ScrollText } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Prince {
  id: string;
  name: string;
  title: string;
  faction: string;
  power: number; // 0-100 influence in court
  loyalty: number; // 0-100 loyalty to Emperor
  character: string;
  status: 'ALIVE' | 'IMPRISONED' | 'DEAD';
}

const INITIAL_PRINCES: Prince[] = [
  { id: 'p1', name: '大皇子', title: '太子', faction: '清流文官、母后外戚', power: 75, loyalty: 80, character: '仁善懦弱，讲究正统礼法。', status: 'ALIVE' },
  { id: 'p2', name: '三皇子', title: '秦王', faction: '边镇武将、法家酷吏', power: 65, loyalty: 50, character: '骁勇善战，野心勃勃，深谙兵法。', status: 'ALIVE' },
  { id: 'p3', name: '八皇子', title: '齐王', faction: '内廷宦官、江南商贾', power: 50, loyalty: 90, character: '极善钻营，伪善且财力雄厚。', status: 'ALIVE' }
];

interface SuccessionResult {
  narrative: string;
  princeUpdates: {
    id: string;
    powerDelta: number;
    loyaltyDelta: number;
    statusChange?: 'ALIVE' | 'IMPRISONED' | 'DEAD';
  }[];
  ai_analysis: string;
}

export default function RoyalSuccessionSandbox() {
  const [princes, setPrinces] = useState<Prince[]>(INITIAL_PRINCES);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SuccessionResult | null>(null);

  const executeCommand = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/succession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          princes: princes.map(p => ({
            id: p.id, name: p.name, title: p.title, status: p.status,
            power: p.power, loyalty: p.loyalty, faction: p.faction, character: p.character
          })),
          actionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const outcome = await response.json() as SuccessionResult;
      
      setPrinces(prev => prev.map(p => {
        const update = outcome.princeUpdates?.find(u => u.id === p.id);
        if (update) {
          return {
            ...p,
            power: Math.max(0, Math.min(100, p.power + update.powerDelta)),
            loyalty: Math.max(0, Math.min(100, p.loyalty + update.loyaltyDelta)),
            status: update.statusChange || p.status
          };
        }
        return p;
      }));

      setTimeout(() => {
        setResult(outcome);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】夺嫡之争暗流涌动，皇帝的密旨被司礼监太监截获，未生波澜。",
        princeUpdates: [],
        ai_analysis: "（无API环境）未能接入朝堂算计大模型，夺嫡风暴维持现状。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPowerColor = (val: number) => {
    if (val >= 70) return 'text-purple-400';
    if (val >= 40) return 'text-amber-400';
    return 'text-stone-400';
  };

  const getLoyaltyColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400';
    if (val >= 40) return 'text-amber-400';
    return 'text-red-400 animate-pulse';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-purple-900/20 to-stone-900 border border-purple-500/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Crown size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-purple-400 flex items-center gap-2 mb-2">
          <Crown className="w-6 h-6" /> 宫廷制衡与夺嫡之局 (方向三)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          老皇帝（玩家）在幕后操控皇子之间的党争。你可以借刀杀人、赐死、过继或者打压母族。AI将根据各皇子背后的派系（军方、太监、文官）以及个人的野心，生成史书般的残酷夺嫡大戏。稍微不慎，可能引发“玄武门之变”。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <ScrollText className="w-4 h-4 text-purple-500" /> 帝王心术 (密旨与制衡)
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-purple-500/80 font-bold flex justify-between">
                <span>下达密旨或政治动作 (自然语言输入)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n赐死秦王的舅部大将，剥夺秦王兵权，同时赏赐太子太傅大明宫行走之权... \n或者：\n装病不起，暗示打算改立齐王，引蛇出洞测试他们..."
                className="w-full min-h-[160px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-purple-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('派秦王前往北疆平叛，赐予虎符，但暗中让太子克扣其军粮。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">借刀杀人 (二虎竞食)</button>
                <button onClick={() => setActionInput('下旨废除太子之位，打入宗人府！提拔齐王母族成员填补中枢。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">废黜太子</button>
                <button onClick={() => setActionInput('称病辍朝三月，由三位皇子共同监国，让内廷太监暗中监察他们的一举一动。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">引蛇出洞 (称病)</button>
              </div>
            </div>
            
            <button
              onClick={executeCommand}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-purple-900 to-[#121110] border border-purple-900/50 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-purple-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-purple-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '夺嫡演算中...' : '落下御笔 (推演宫变)'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> 九子夺嫡势态图
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {princes.map(p => {
                const prevUpdate = result?.princeUpdates?.find(u => u.id === p.id);
                const isDead = p.status === 'DEAD';
                const isImprisoned = p.status === 'IMPRISONED';

                return (
                  <motion.div 
                    key={p.id}
                    layout
                    className={`border rounded-lg p-4 flex flex-col relative transition-all ${
                      isDead ? 'bg-stone-900 border-red-900/50 opacity-60 grayscale' : 
                      isImprisoned ? 'bg-[#151515] border-stone-700 opacity-80' : 
                      'bg-[#1a1918] border-stone-800'
                    }`}
                  >
                    <div className="z-10 mb-4 h-full">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-serif font-black text-lg ${isDead ? 'text-red-600 line-through' : 'text-purple-400'}`}>
                          {p.name} ({p.title})
                        </h4>
                        {isDead && <Skull className="w-5 h-5 text-red-500" />}
                        {isImprisoned && <UserX className="w-5 h-5 text-stone-500" />}
                        {(!isDead && p.loyalty < 30) && <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />}
                      </div>
                      
                      <div className="text-[10px] text-stone-400 font-bold mb-1">
                        派系基盘: <span className="text-stone-300">{p.faction}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 italic mb-4">
                        性情: {p.character}
                      </div>
                      
                      {(!isDead) && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                              <span>朝堂实力 (夺嫡筹码)</span>
                              <span className={`font-bold ${getPowerColor(p.power)}`}>
                                {p.power}
                                {prevUpdate && prevUpdate.powerDelta !== 0 && (
                                  <span className={`ml-1 text-xs ${prevUpdate.powerDelta > 0 ? 'text-purple-400' : 'text-red-400'}`}>
                                    ({prevUpdate.powerDelta > 0 ? '+' : ''}{prevUpdate.powerDelta})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-purple-600"
                                animate={{ width: `${p.power}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-mono text-stone-500 mb-1">
                              <span>对君父敬畏度/忠诚</span>
                              <span className={`font-bold ${getLoyaltyColor(p.loyalty)}`}>
                                {p.loyalty}
                                {prevUpdate && prevUpdate.loyaltyDelta !== 0 && (
                                  <span className={`ml-1 text-xs ${prevUpdate.loyaltyDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ({prevUpdate.loyaltyDelta > 0 ? '+' : ''}{prevUpdate.loyaltyDelta})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${p.loyalty >= 70 ? 'bg-emerald-500' : p.loyalty >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                animate={{ width: `${p.loyalty}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {isDead && (
                        <p className="text-xs font-bold text-red-500 mt-4 text-center tracking-widest border-t border-red-900/30 pt-2">
                          已被赐死 / 兵变身亡
                        </p>
                      )}
                      {isImprisoned && (
                        <p className="text-xs font-bold text-stone-500 mt-4 text-center tracking-widest border-t border-stone-800 pt-2">
                          圈禁宗人府
                        </p>
                      )}
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
                    <BookOpen className="w-4 h-4" /> 起居注 (宫变战报)
                  </p>
                  
                  <p className="text-purple-200 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  
                  <div className="bg-[#121110] border border-stone-800 rounded p-4 text-xs font-mono">
                    <p className="text-purple-500 font-bold mb-2 flex items-center gap-2">
                      <Skull className="w-4 h-4" /> AI 黑暗政治复盘
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
