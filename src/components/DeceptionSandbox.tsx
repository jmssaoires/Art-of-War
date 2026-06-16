import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EyeOff, Eye, ScanSearch, Send, ShieldAlert, Sparkles, ScrollText, ChevronRight, MessageSquareWarning, Brain, Activity } from 'lucide-react';
import { sfx } from '../utils/sfx';

const TRUE_STATES = [
  { id: 'empty_city', name: '空城（兵力2千）', desc: '主力出征，城内仅剩老弱病残两千人，城防空虚。' },
  { id: 'ambush', name: '十面埋伏（兵力8万）', desc: '大军偃旗息鼓，八万精锐兵分三路埋伏于两侧山谷。' },
  { id: 'retreat', name: '残兵败退（兵力1万）', desc: '久战疲惫，兵无斗志，正丢盔弃甲向后方撤退。' }
];

interface ScoutResult {
  estimated_troops: string;
  scout_report: string;
  confidence: number;
  ai_analysis: string;
}

export default function DeceptionSandbox() {
  const [trueStateId, setTrueStateId] = useState(TRUE_STATES[0].id);
  const [deceptionInput, setDeceptionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoutResult, setScoutResult] = useState<ScoutResult | null>(null);

  const activeTrueState = TRUE_STATES.find(s => s.id === trueStateId)!;

  const executeStrategy = async () => {
    if (!deceptionInput.trim()) return;
    
    setIsProcessing(true);
    setScoutResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/deception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trueStateDesc: activeTrueState.desc,
          deceptionInput
        })
      });

      if (!response.ok) {
         throw new Error('AI Server responded with an error');
      }

      const result = await response.json() as ScoutResult;
      
      setTimeout(() => {
        setScoutResult(result);
        sfx.playImpact();
      }, 500);

    } catch (err) {
      console.error(err);
      setScoutResult({
        estimated_troops: "情报丢失",
        scout_report: "飞鸽传书被截获，探子未能返还。",
        confidence: 0,
        ai_analysis: "网络或大模型解析出错。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Narrative Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-stone-900 border border-purple-500/20 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <EyeOff size={150} />
        </div>
        <h2 className="text-xl font-serif font-black text-purple-400 flex items-center gap-2 mb-2">
          <EyeOff className="w-6 h-6" /> 诡道迷雾 (Fog of War 2.0)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          兵者，诡道也。UI面板上的数字不再是绝对真理。在这里，玩家通过自然语言下达欺骗指令，AI 作为裁判实时演算这些指令对物理环境（烟尘、旌旗、足迹）的改变，最终生成极具迷惑性的“斥候战报”。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* Left Column: True State & Actions */}
        <div className="bg-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
            <ScanSearch className="w-4 h-4 text-emerald-500" /> 上帝视角（绝对真实）
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-400 font-bold">1. 当前真实兵力与态势</label>
              <div className="grid grid-cols-3 gap-2">
                {TRUE_STATES.map(state => (
                  <button
                    key={state.id}
                    onClick={() => setTrueStateId(state.id)}
                    className={`p-2 rounded border text-xs font-bold transition-all ${
                      trueStateId === state.id 
                        ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300 shadow-inner' 
                        : 'border-stone-800 bg-stone-900 text-stone-500 hover:border-stone-600'
                    }`}
                  >
                    {state.name}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-stone-900/50 rounded border border-stone-800 text-sm text-stone-300 font-serif mt-2 h-16 flex items-center">
                {activeTrueState.desc}
              </div>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-purple-400 font-bold flex justify-between">
                <span>2. 施展诡道（伪装/欺骗策略）</span>
              </label>
              <textarea 
                value={deceptionInput}
                onChange={(e) => setDeceptionInput(e.target.value)}
                placeholder="在此输入你的欺骗战略... \n例如：大开城门，派几个老兵在城头洒扫... \n或者：在林中多绑树枝于马尾，来回奔跑扬起漫天尘土..."
                className="w-full min-h-[140px] bg-stone-950 border border-stone-800 text-stone-200 p-4 rounded text-sm outline-none focus:border-purple-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
            </div>
            
            <button
              onClick={executeStrategy}
              disabled={isProcessing || !deceptionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-purple-900 to-[#121110] border border-purple-500/30 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-purple-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-purple-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '大模型逆向推演迷雾中...' : '生成战场迷雾 (执行伪装)'}
            </button>
          </div>
        </div>

        {/* Right Column: Enemy Perspective / Scout Result */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" /> 敌方斥候视界 (战争迷雾)
            </h3>
          </div>
          
          <div className="flex-1 p-6 relative flex flex-col justify-center items-center">
            
            <AnimatePresence mode="wait">
              {!isProcessing && !scoutResult && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-stone-600 flex flex-col items-center space-y-4"
                >
                  <ScrollText className="w-12 h-12 opacity-50" />
                  <p className="text-sm font-serif">等待玩家释放计谋，斥候尚未出发...</p>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-purple-400 flex flex-col items-center space-y-4"
                >
                  <Activity className="w-12 h-12 animate-pulse" />
                  <p className="text-sm font-serif font-bold tracking-widest animate-pulse">大模型AI裁判正在重构情报参数...</p>
                </motion.div>
              )}

              {scoutResult && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  className="w-full space-y-6 flex flex-col"
                >
                  {/* Enemy Player Seen Stats */}
                  <div className="bg-red-950/20 border border-red-900/30 rounded p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-500/70 font-bold mb-1">敌对玩家主控面板 · 兵力侦测</p>
                      <p className="text-2xl font-serif font-black text-red-400">
                        {scoutResult.estimated_troops}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500 font-bold mb-1">情报自信度</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-stone-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${scoutResult.confidence > 70 ? 'bg-red-500' : 'bg-amber-500'}`} 
                            style={{ width: `${scoutResult.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-stone-300">{scoutResult.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Scout Report */}
                  <div className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-amber-500" />
                    <p className="text-stone-400 text-xs font-bold mb-2 uppercase tracking-widest flex items-center gap-1">
                      <MessageSquareWarning className="w-3 h-3" /> 斥候密报细节
                    </p>
                    <p className="text-amber-100/90 font-serif leading-relaxed text-sm p-4 bg-stone-900/50 rounded border border-stone-800 shadow-inner">
                      "{scoutResult.scout_report}"
                    </p>
                  </div>

                  <hr className="border-stone-800" />

                  {/* AI Resolution Analysis */}
                  <div className="bg-purple-900/10 border border-purple-500/20 rounded p-4 text-xs font-mono">
                    <p className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" /> AI 裁判底层演算逻辑
                    </p>
                    <p className="text-stone-400 leading-relaxed">
                      {scoutResult.ai_analysis}
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
