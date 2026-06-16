import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wheat, Swords, Coins, ScrollText, Layers, X, Check, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Stats {
  peasants: number;
  army: number;
  treasury: number;
  scholars: number;
}

interface CardData {
  character: string;
  role: string;
  dilemma: string;
  choiceA: { text: string; impacts: Partial<Stats> };
  choiceB: { text: string; impacts: Partial<Stats> };
}

const ICONS = {
  peasants: { icon: Wheat, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  army: { icon: Swords, color: 'text-red-500', bg: 'bg-red-500' },
  treasury: { icon: Coins, color: 'text-amber-400', bg: 'bg-amber-400' },
  scholars: { icon: ScrollText, color: 'text-blue-400', bg: 'bg-blue-400' }
};

export default function ReignsSwipeSandbox() {
  const [stats, setStats] = useState<Stats>({ peasants: 50, army: 50, treasury: 50, scholars: 50 });
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>(['皇帝初掌大宝，百废待兴。']);
  
  // Track visual hints when hovering choices
  const [hoveredChoice, setHoveredChoice] = useState<'A' | 'B' | null>(null);

  const fetchNextCard = async (previousContext: string) => {
    setIsProcessing(true);
    setHoveredChoice(null);
    try {
      const res = await fetch('/api/sandbox/reigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, previousContext })
      });
      if (!res.ok) throw new Error("Failed fetching card");
      const data = await res.json() as CardData;
      setCurrentCard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchNextCard('刚刚登基');
  }, []);

  const handleChoice = (choiceType: 'A' | 'B') => {
    if (!currentCard) return;
    const choice = choiceType === 'A' ? currentCard.choiceA : currentCard.choiceB;
    
    // Apply changes
    setStats(prev => ({
      peasants: Math.max(0, Math.min(100, prev.peasants + (choice.impacts.peasants || 0))),
      army: Math.max(0, Math.min(100, prev.army + (choice.impacts.army || 0))),
      treasury: Math.max(0, Math.min(100, prev.treasury + (choice.impacts.treasury || 0))),
      scholars: Math.max(0, Math.min(100, prev.scholars + (choice.impacts.scholars || 0)))
    }));

    // Update history
    const actionDesc = `${currentCard.character}进言: "${currentCard.dilemma}"。朕决断: [${choice.text}]`;
    setHistory(prev => [actionDesc, ...prev].slice(0, 5));

    // Play sound & animate out
    sfx.playScroll();
    setCurrentCard(null);

    // Fetch next after a brief delay
    setTimeout(() => {
      fetchNextCard(actionDesc);
    }, 400);
  };

  const renderStatPillar = (key: keyof Stats) => {
    const value = stats[key];
    const cfg = ICONS[key];
    const Icon = cfg.icon;
    
    // Calculate highlight dot size based on hovered choice
    let dotScale = 0;
    if (hoveredChoice && currentCard) {
      const choice = hoveredChoice === 'A' ? currentCard.choiceA : currentCard.choiceB;
      const impact = choice.impacts[key] || 0;
      if (Math.abs(impact) > 0) dotScale = Math.abs(impact) > 10 ? 1 : 0.5;
    }

    return (
      <div key={key} className="flex flex-col items-center gap-2 relative">
        {/* Hint Dot */}
        <motion.div 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: dotScale, opacity: dotScale > 0 ? 1 : 0 }}
           className="w-2.5 h-2.5 rounded-full bg-slate-300 absolute -top-4 shadow-[0_0_8px_white]"
        />
        <div className={`w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden`}>
           <div className={`absolute bottom-0 inset-x-0 ${cfg.bg} opacity-30 transition-all duration-500`} style={{ height: `${value}%` }}></div>
           <Icon className={`w-5 h-5 z-10 ${cfg.color} ${value < 20 || value > 80 ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-gradient-to-r from-[#1e1a14] to-[#120f0d] border border-amber-900/40 rounded-lg p-5 shadow-lg relative overflow-hidden flex justify-between items-center">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none text-amber-500">
          <Layers size={160} />
        </div>
        <div className="z-10 relative">
          <h2 className="text-xl font-serif font-black text-amber-200 flex items-center gap-2 mb-2">
            <Layers className="w-6 h-6 text-amber-400" /> 命运卡牌: 四维平衡 (方案C)
          </h2>
          <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
            借鉴 <span className="text-amber-300 font-bold">Reigns (王权)</span> 的核心设计。将复杂的数值和政令转化为直观的「角色卡面」与「左右滑屏/二选一」。维持四方势力（民意、军队、国库、士绅）的平衡，某一项满值或清零都会导致帝国倾覆。
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center pt-8 bg-[#0C0A09] rounded-lg border border-stone-800 shadow-2xl relative overflow-hidden">
         {/* Top Icons */}
         <div className="flex gap-12 sm:gap-20 mb-12 z-20">
            {(['peasants', 'army', 'treasury', 'scholars'] as (keyof Stats)[]).map(renderStatPillar)}
         </div>

         {/* Center Card Play Area */}
         <div className="flex-1 w-full max-w-sm relative flex flex-col items-center justify-start z-10 perspective-[1000px]">
            {isProcessing && !currentCard ? (
               <div className="w-[300px] h-[400px] bg-stone-900/50 rounded-xl border border-stone-800 border-dashed flex flex-col items-center justify-center text-stone-500 animate-pulse">
                  <span className="w-6 h-6 border-2 border-stone-500 border-t-transparent rounded-full animate-spin mb-4"></span>
                  <span className="font-serif">起草奏折中...</span>
               </div>
            ) : currentCard ? (
               <AnimatePresence mode="popLayout">
                  <motion.div
                     key={currentCard.dilemma}
                     initial={{ y: 50, opacity: 0, rotateX: 20 }}
                     animate={{ y: 0, opacity: 1, rotateX: 0 }}
                     exit={{ y: -50, opacity: 0, scale: 0.9 }}
                     transition={{ type: "spring", stiffness: 300, damping: 25 }}
                     className="w-[320px] h-[420px] bg-[#1C1917] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-stone-700 overflow-hidden flex flex-col group relative"
                  >
                     <div className="h-48 bg-gradient-to-br from-stone-800 to-stone-950 flex flex-col items-center justify-center p-6 text-center border-b border-stone-800 relative overflow-hidden">
                        {/* Placeholder Character Icon */}
                        <div className="w-24 h-24 bg-stone-900 rounded-full border-[3px] border-amber-900/50 flex items-center justify-center mb-3 shadow-inner relative z-10">
                           <span className="text-4xl font-serif font-black text-stone-700">{currentCard.character[0]}</span>
                        </div>
                        <h3 className="font-bold text-stone-200 z-10">{currentCard.character}</h3>
                        <span className="text-xs text-amber-500/80 font-mono z-10">{currentCard.role}</span>
                     </div>

                     <div className="flex-1 p-6 flex items-center justify-center text-center bg-stone-900 relative">
                        <p className="font-serif text-lg leading-relaxed text-stone-200 font-bold">
                           "{currentCard.dilemma}"
                        </p>
                     </div>

                     {/* Overlay gradients to hint Swipe Direction */}
                     <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-red-900/30 to-transparent ${hoveredChoice === 'B' ? 'opacity-100' : 'opacity-0'}`}></div>
                     <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-emerald-900/30 to-transparent ${hoveredChoice === 'A' ? 'opacity-100' : 'opacity-0'}`}></div>

                  </motion.div>
               </AnimatePresence>
            ) : null}

            {/* Controls (Only show when card is loaded) */}
            {currentCard && (
               <div className="absolute top-[380px] w-full px-4 flex justify-between z-20">
                  {/* Option B (Left) */}
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onHoverStart={() => setHoveredChoice('B')}
                    onHoverEnd={() => setHoveredChoice(null)}
                    onClick={() => handleChoice('B')}
                    className="w-14 h-14 bg-stone-900/90 rounded-full border border-stone-700 shadow-xl flex items-center justify-center text-stone-400 hover:text-red-400 hover:border-red-900 backdrop-blur"
                  >
                     <ArrowLeftCircle className="w-8 h-8" />
                  </motion.button>
                  
                  {/* Option A (Right) */}
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onHoverStart={() => setHoveredChoice('A')}
                    onHoverEnd={() => setHoveredChoice(null)}
                    onClick={() => handleChoice('A')}
                    className="w-14 h-14 bg-stone-900/90 rounded-full border border-stone-700 shadow-xl flex items-center justify-center text-stone-400 hover:text-emerald-400 hover:border-emerald-900 backdrop-blur"
                  >
                     <ArrowRightCircle className="w-8 h-8" />
                  </motion.button>
               </div>
            )}
            
            {/* Context Texts for Buttons */}
            {currentCard && (
               <div className="w-full flex justify-between mt-12 px-2 text-center z-20 h-10">
                  <div className={`w-1/2 pr-2 text-xs font-serif leading-tight transition-colors duration-200 ${hoveredChoice === 'B' ? 'text-stone-300 drop-shadow-md font-bold' : 'text-stone-500'}`}>{currentCard.choiceB.text}</div>
                  <div className={`w-1/2 pl-2 text-xs font-serif leading-tight transition-colors duration-200 ${hoveredChoice === 'A' ? 'text-stone-300 drop-shadow-md font-bold' : 'text-stone-500'}`}>{currentCard.choiceA.text}</div>
               </div>
            )}
         </div>

         {/* Event History Log */}
         <div className="absolute bottom-4 left-6 hidden lg:block w-72">
            <h4 className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mb-3 border-b border-stone-800 pb-1">起居注 (History)</h4>
            <div className="space-y-3">
               {history.map((h, i) => (
                  <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1 - i * 0.25, x: 0 }}
                     key={i} 
                     className="text-xs text-stone-500 font-serif leading-relaxed line-clamp-2"
                  >
                     {i === 0 && <span className="text-amber-500 mr-2 opacity-100">●</span>}
                     {h}
                  </motion.div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
