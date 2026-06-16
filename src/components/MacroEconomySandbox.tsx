import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Send, Factory, ArrowUpRight, ArrowDownRight, Scale, TrendingUp, HandCoins } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface EconomyState {
  treasury: number; // 国库
  inflation: number; // 0-100 通货膨胀（物价飞涨）
  taxRate: number; // 0-100 赋税负担
  peasantWealth: number; // 0-100 农民余粮
  merchantWealth: number; // 0-100 商贾资本
  corruption: number; // 官僚寻租 0-100
}

interface EconomyResult {
  narrative: string;
  economyUpdates: {
    treasuryDelta: number;
    inflationDelta: number;
    taxRateDelta: number;
    peasantWealthDelta: number;
    merchantWealthDelta: number;
    corruptionDelta: number;
  };
  ai_analysis: string;
}

export default function MacroEconomySandbox() {
  const [economy, setEconomy] = useState<EconomyState>({
    treasury: 40,
    inflation: 20,
    taxRate: 30,
    peasantWealth: 50,
    merchantWealth: 60,
    corruption: 40
  });
  
  const [actionInput, setActionInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EconomyResult | null>(null);

  const executeAction = async () => {
    if (!actionInput.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    try {
      sfx.playMagic();
      
      const response = await fetch('/api/sandbox/macroeconomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          economy,
          actionInput
        })
      });

      if (!response.ok) throw new Error('AI Server Error');

      const outcome = await response.json() as EconomyResult;
      
      setEconomy(prev => {
        const u = outcome.economyUpdates;
        return {
          treasury: Math.max(0, Math.min(100, prev.treasury + u.treasuryDelta)),
          inflation: Math.max(0, Math.min(100, prev.inflation + u.inflationDelta)),
          taxRate: Math.max(0, Math.min(100, prev.taxRate + u.taxRateDelta)),
          peasantWealth: Math.max(0, Math.min(100, prev.peasantWealth + u.peasantWealthDelta)),
          merchantWealth: Math.max(0, Math.min(100, prev.merchantWealth + u.merchantWealthDelta)),
          corruption: Math.max(0, Math.min(100, prev.corruption + u.corruptionDelta))
        };
      });

      setTimeout(() => {
        sfx.playImpact();
        setResult(outcome);
      }, 500);

    } catch (err) {
      console.error(err);
      setResult({
        narrative: "【本地演算】国家机器运转失灵，盐铁专卖变成了官商勾结的狂欢，物价飞涨。",
        economyUpdates: {
          treasuryDelta: -5,
          inflationDelta: 15,
          taxRateDelta: 0,
          peasantWealthDelta: -10,
          merchantWealthDelta: 10,
          corruptionDelta: 10
        },
        ai_analysis: "缺乏大模型驱动，执行了默认的经济崩坏逻辑。"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatBar = (label: string, value: number, delta?: number, inverseGood: boolean = false) => {
    // If inverseGood is true, high value (red) is bad. Otherwise high value (green/blue) is good.
    const isBad = inverseGood ? value > 70 : value < 30;
    const barColor = inverseGood 
        ? (value > 70 ? 'bg-red-500' : value > 40 ? 'bg-amber-500' : 'bg-emerald-500')
        : (value < 30 ? 'bg-red-500' : value < 60 ? 'bg-amber-500' : 'bg-blue-500');

    return (
      <div className="mb-4 bg-stone-900/50 p-3 rounded border border-stone-800">
        <div className="flex justify-between text-xs font-mono mb-1.5">
          <span className="text-stone-400">{label}</span>
          <span className={`font-bold ${isBad ? 'text-red-400' : 'text-stone-200'}`}>
            {value} / 100
            {delta !== undefined && delta !== 0 && (
                <span className={`ml-1 text-[10px] ${
                  (inverseGood ? delta < 0 : delta > 0) ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  ({delta > 0 ? '+' : ''}{delta})
                </span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${barColor}`}
            animate={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#172522] to-stone-900 border border-teal-900/40 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none text-teal-500">
          <TrendingUp size={160} />
        </div>
        <h2 className="text-xl font-serif font-black text-teal-400 flex items-center gap-2 mb-2">
          <Factory className="w-6 h-6" /> 王朝经济与宏观调控 (方向十二)
        </h2>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          借鉴 <span className="text-teal-300 font-bold">Victoria 3</span> 的供需、阶级流动与经济系统。古代王朝不仅是打仗和宫廷，更是「盐铁专卖」、「一条鞭法/摊丁入亩」等宏观经济调控。一旦通货膨胀（例如滥发大明宝钞），或者税负导致农民破产沦为流民，帝国这艘大船瞬间倾覆。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <div className="lg:col-span-5 bg-[#141C19] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-6">
          <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2 flex items-center gap-2">
             <HandCoins className="w-4 h-4 text-teal-400" /> 国度经制与经济政策
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs text-teal-400/80 font-bold flex justify-between">
                <span>颁布国家干预或自由市场政策 (自然语言)</span>
              </label>
              <textarea 
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="例如：\n实行盐铁官营，严厉打击私盐贩子，将重要物资全部收归国有主导...\n或者：\n滥发大明宝钞（纸币）来强行充实国库，准备用来北伐..."
                className="w-full min-h-[160px] bg-stone-950 border border-teal-900/30 text-stone-200 p-4 rounded text-sm outline-none focus:border-teal-500/50 font-serif resize-none leading-relaxed shadow-inner"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setActionInput('全面实行《盐铁专卖》，由国家直接垄断盐和铁的生产与销售，没收私营大商人的资产。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">盐铁专卖</button>
                <button onClick={() => setActionInput('实行王安石《青苗法》，在青黄不接时国家向农民放贷收息，试图打击高利贷并充实国库。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">官方放贷(青苗法)</button>
                <button onClick={() => setActionInput('疯狂印发不可兑换的纸质货币（如大明宝钞），用于直接给前线军队发放军饷并大量购买市集物资。')} className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded">狂印宝钞</button>
              </div>
            </div>
            
            <button
              onClick={executeAction}
              disabled={isProcessing || !actionInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-teal-900/40 to-[#141C19] border border-teal-900/50 hover:border-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-teal-200 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
            >
              {isProcessing ? (
                <span className="w-4 h-4 border-2 border-teal-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-4 h-4" /> 
              )}
              {isProcessing ? '经济规律推演中...' : '推行新政 (影响国家宏观)'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-stone-950 border border-stone-800 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center z-10">
            <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-500" /> 帝国宏观经济基本盘
            </h3>
          </div>
          
          <div className="p-6 flex flex-col flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
               <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">国家财政</h4>
                  {renderStatBar("户部国库充裕度", economy.treasury, result?.economyUpdates.treasuryDelta, false)}
                  {renderStatBar("通货膨胀(物价与纸币贬值)", economy.inflation, result?.economyUpdates.inflationDelta, true)}
                  {renderStatBar("官僚阶层寻租与贪腐", economy.corruption, result?.economyUpdates.corruptionDelta, true)}
               </div>
               <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">民生与阶级</h4>
                  {renderStatBar("农民/自耕农余粮财富", economy.peasantWealth, result?.economyUpdates.peasantWealthDelta, false)}
                  {renderStatBar("商贾集团资本累积", economy.merchantWealth, result?.economyUpdates.merchantWealthDelta, false)}
                  {renderStatBar("民间实际税赋重负", economy.taxRate, result?.economyUpdates.taxRateDelta, true)}
               </div>
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-teal-950/10 border border-teal-900/30 rounded p-4 space-y-3 mt-auto"
                >
                  <p className="text-sm font-bold text-teal-400 flex items-center gap-2 border-b border-teal-900/30 pb-2">
                     <Coins className="w-4 h-4" /> 市场与社会反噬 
                  </p>
                  <p className="text-stone-300 font-serif leading-relaxed text-sm">
                    "{result.narrative}"
                  </p>
                  <div className="bg-[#101413] p-3 rounded border border-teal-900/20 text-xs text-stone-400 font-mono leading-relaxed">
                    <span className="text-teal-400 font-bold">Vicky3宏观经济学分析：</span>{result.ai_analysis}
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
