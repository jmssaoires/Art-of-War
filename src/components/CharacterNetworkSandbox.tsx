import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Send, UserX, ArrowRightLeft, ShieldAlert, Zap, Skull, Crown } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Character {
  id: string;
  name: string;
  role: string;
  traits: string[];
  stress: number; // 0-100
  power: number; // 0-100
  relationWithEmperor: number; // -100 to 100
}

const INITIAL_CHARACTERS: Character[] = [
  { id: 'emperor', name: '皇帝 (你)', role: '孤家寡人', traits: ['多疑', '勤政'], stress: 40, power: 100, relationWithEmperor: 100 },
  { id: 'prime_minister', name: '李丞相', role: '百官之首', traits: ['野心勃勃', '能臣'], stress: 60, power: 85, relationWithEmperor: 20 },
  { id: 'general', name: '王大将军', role: '手握重兵', traits: ['忠诚', '莽撞'], stress: 20, power: 90, relationWithEmperor: 80 },
  { id: 'eunuch', name: '魏千岁', role: '司礼监掌印', traits: ['贪婪', '巧言令色'], stress: 10, power: 60, relationWithEmperor: 90 }
];

interface NetworkResult {
  narrative: string;
  emperorStressDelta: number;
  characterUpdates: {
    id: string;
    stressDelta: number;
    relationDelta: number;
    powerDelta: number;
    isDead?: boolean;
    newTrait?: string;
  }[];
  ai_analysis: string;
}

export default function CharacterNetworkSandbox() {
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<NetworkResult | null>(null);

  const executeAction = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/characternetwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters,
          actionInput
        })
      });

      if (!response.ok) throw new Error('AI Server Error');

      const outcome = await response.json() as NetworkResult;
      
      setCharacters(prev => prev.map(c => {
        const update = outcome.characterUpdates?.find(x => x.id === c.id);
        if (update) {
          const newStress = Math.max(0, Math.min(100, c.stress + update.stressDelta));
          const baseUpdate = {
            ...c,
            stress: newStress,
            relationWithEmperor: Math.max(-100, Math.min(100, c.relationWithEmperor + update.relationDelta)),
            power: Math.max(0, Math.min(100, c.power + update.powerDelta))
          };
          
          if (update.isDead || newStress >= 100) {
             baseUpdate.isDead = true;
          }
          if (update.newTrait && !c.traits.includes(update.newTrait)) {
             baseUpdate.traits = [...c.traits, update.newTrait];
          }
          return baseUpdate;
        }
        return c;
      }));

      setTimeout(() => {
        if (outcome.characterUpdates?.some(u => u.stressDelta > 40 || u.isDead)) sfx.playImpact();
        else sfx.playImpact(); // Need a better sound here, impact for now
        setResult(outcome);
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】群臣对你的旨意惊疑不定，暗流涌动。李丞相称病不上朝。",
        emperorStressDelta: 10,
        characterUpdates: [],
        ai_analysis: "缺乏大模型驱动，人物网络变为静态。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const emperor = characters.find(c => c.id === 'emperor')!;
  const courtiers = characters.filter(c => c.id !== 'emperor');

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#2B1B3D] to-stone-900 border border-purple-900/40 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none text-purple-500">
          <Network size={160} />
        </div>
        <h2 className="text-xl font-serif font-black text-purple-400 flex items-center gap-2 mb-2">
          <Network className="w-6 h-6" /> 权力图谱与君臣羁绊 (方向十一)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          借鉴 <span className="text-purple-300 font-bold">Crusader Kings 3</span> 的人物羁绊与压力(Stress)系统。你并不是在操控没有感情的国家机器，而是在与一群有「贪婪」、「莽撞」等特质的活人博弈。高压行为会增加他们的压力，甚至导致发疯、暗杀或猝死。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* 操作面板 */}
        <div className="lg:col-span-5 bg-[#1A1525] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <Crown className="w-4 h-4 text-purple-400" /> 帝王心术与谕旨
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-purple-400/80 font-bold flex justify-between">
                <span>对群臣的交互与施政手段 (自然语言)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n无视李丞相的反对，强行推行新法，并让魏千岁去派人盯紧李丞相的家眷...\n或者：\n举办宫廷宴会，赏赐王大将军免死金牌，但在酒中下慢药考验其忠诚..."
                className="w-full min-h-[160px] bg-stone-950 border border-purple-900/30 text-stone-200 p-4 rounded text-sm outline-none focus:border-purple-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('密诏魏千岁，罗织罪名，抄家查办李丞相的党羽，敲山震虎。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">罗织罪名</button>
                <button onClick={() => setActionInput('将皇室最宠爱的公主下嫁给王大将军的嫡长子，以姻亲之谊笼络将门。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">和亲联姻</button>
                <button onClick={() => setActionInput('召开御前会议，李丞相与王大将军当庭爆发激烈争吵，朕一言不发，坐山观虎斗。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">帝王平衡术</button>
              </div>
            </div>
            
            <button
              onClick={executeAction}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-purple-900/40 to-[#1A1525] border border-purple-900/50 hover:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-purple-200 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-purple-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '人心博弈中...' : '落下棋子 (推演人物命运)'}
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-stone-800">
             <div className="flex items-center justify-between text-xs font-mono mb-1">
               <span className="text-stone-500 flex items-center gap-1"><Zap className="w-4 h-4 text-purple-400"/>皇帝(你)的精神压力 (Stress)：</span>
               <span className={`text-lg font-black ${emperor.stress > 80 ? 'text-red-500 animate-pulse' : 'text-purple-400'}`}>{emperor.stress} / 100</span>
             </div>
             <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${emperor.stress >= 80 ? 'bg-red-600' : 'bg-purple-600'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${emperor.stress}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-2">压力达到100可能导致皇帝暴毙、发疯或被迫退位。</p>
          </div>
        </div>

        {/* 角色网络 */}
        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <UserX className="w-4 h-4 text-purple-500" /> 群臣特质与心理创伤图谱
            </h3>
          </div>
          
          <div className="p-6 flex flex-col space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courtiers.map((c: any) => {
                const prevUpdate = result?.characterUpdates?.find(x => x.id === c.id);
                return (
                  <motion.div 
                    key={c.id}
                    layout
                    className={`bg-[#1c1822] border ${c.isDead ? 'border-red-900/50' : c.stress > 70 ? 'border-amber-900/50' : 'border-stone-800'} rounded-lg p-4 flex flex-col relative ${c.isDead ? 'opacity-60 grayscale' : ''}`}
                  >
                    {c.isDead && (
                       <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <Skull className="w-16 h-16 text-red-500/40" />
                       </div>
                    )}
                    <h4 className="text-stone-200 font-serif font-black flex items-center justify-between mb-1">
                      <span>{c.name} <span className="text-stone-500 text-xs font-normal">({c.role})</span></span>
                      {c.isDead && <span className="text-xs text-red-400 border border-red-900 bg-red-950/50 px-1 py-0.5 rounded">身亡</span>}
                    </h4>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.traits.map((t: string) => (
                        <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            t === '多疑' || t === '贪婪' || t === '记仇' ? 'bg-red-950/40 border-red-900/40 text-red-300' :
                            t === '忠诚' || t === '能臣' ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300' :
                            'bg-stone-800/80 border-stone-700 text-stone-300'
                        }`}>
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-3 mt-auto">
                      <div>
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-stone-500">心理压力 (Stress)</span>
                          <span className={`font-bold ${c.stress > 80 ? 'text-red-400' : 'text-stone-300'}`}>
                            {c.stress} 
                            {prevUpdate && prevUpdate.stressDelta !== 0 && (
                               <span className={`ml-1 ${prevUpdate.stressDelta > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                 ({prevUpdate.stressDelta > 0 ? '+' : ''}{prevUpdate.stressDelta})
                               </span>
                            )}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${c.stress >= 80 ? 'bg-red-500' : c.stress >= 50 ? 'bg-amber-500' : 'bg-stone-500'}`}
                            animate={{ width: `${Math.min(100, Math.max(0, c.stress))}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-stone-500">忠诚/好感 (+100至-100)</span>
                          <span className={`font-bold ${c.relationWithEmperor < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {c.relationWithEmperor}
                            {prevUpdate && prevUpdate.relationDelta !== 0 && (
                               <span className={`ml-1 ${prevUpdate.relationDelta > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                 ({prevUpdate.relationDelta > 0 ? '+' : ''}{prevUpdate.relationDelta})
                               </span>
                            )}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-stone-900 rounded-full flex">
                           {/* Using a midpoint bar for -100 to 100 */}
                           <div className="flex-1 border-r border-stone-700 flex justify-end">
                              {c.relationWithEmperor < 0 && (
                                <motion.div 
                                  className="h-full bg-red-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.abs(c.relationWithEmperor)}%` }}
                                />
                              )}
                           </div>
                           <div className="flex-1 flex justify-start">
                              {c.relationWithEmperor > 0 && (
                                <motion.div 
                                  className="h-full bg-blue-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.relationWithEmperor}%` }}
                                />
                              )}
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
                  className="bg-purple-950/20 border border-purple-900/30 rounded p-4 space-y-3 mt-4"
                >
                  <p className="text-sm font-bold text-purple-300 flex items-center gap-2 border-b border-purple-900/30 pb-2">
                     <ArrowRightLeft className="w-4 h-4" /> 人物命运演绎 
                  </p>
                  <p className="text-stone-300 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  <div className="bg-[#120f18] p-3 rounded border border-purple-900/20 text-xs text-stone-400 font-mono leading-relaxed">
                    <span className="text-purple-400 font-bold">系统底层逻辑：</span>{result.ai_analysis}
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
