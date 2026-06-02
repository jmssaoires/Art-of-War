import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Landmark, Swords, KeyRound, Coins, Compass, FileText, ChevronRight, Layers, Award, Heart, Shield, Sparkles, Flame, Users, Map as MapIcon } from 'lucide-react';
import CourtSandbox from './components/CourtSandbox';
import MilitarySandbox from './components/MilitarySandbox';
import SpySandbox from './components/SpySandbox';
import MerchantSuccessionSandbox from './components/MerchantSuccessionSandbox';
import DiplomacySandbox from './components/DiplomacySandbox';
import GddBuilder from './components/GddBuilder';
import UprisingCultureSandbox from './components/UprisingCultureSandbox';
import MultiplayerSandbox from './components/MultiplayerSandbox';
import WarPhilosophySandbox from './components/WarPhilosophySandbox';
import DynastyTimeline from './components/DynastyTimeline';
import RealWorldMapBattle from './components/RealWorldMapBattle';

type ActiveTab = 'gdd' | 'court' | 'combat' | 'spy' | 'trade' | 'diplomacy' | 'uprising_culture' | 'multiplayer' | 'war_philosophy' | 'timeline' | 'map_battle';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('multiplayer');
  const [dynastyFate, setDynastyFate] = useState({
    mandate: 78,
    stability: 82,
    coffers: 45000,
    emperorAge: 14,
  });

  const quoteList = [
    { text: "兵者，国之大事，死生之地，存亡之道，不可不察也。", source: "《孙子兵法·始计篇》" },
    { text: "不战而屈人之兵，善之善者也。故上兵伐谋，其次伐交，其次伐兵。", source: "《孙子兵法·谋攻篇》" },
    { text: "故兵无常势，水无常形，能因敌变化而取胜者，谓之神。", source: "《孙子兵法·虚实篇》" },
    { text: "知彼知己者，百战不殆；不知彼而知己，一胜一负；不知彼不知己，每战必殆。", source: "《孙子兵法·谋攻篇》" }
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);

  const tabs = [
    { id: 'map_battle', name: '真实地图作战 (Live Map) 🌍', desc: 'Google 地图实境战例与九地天演', icon: MapIcon, accent: 'text-[#8C2F39] hover:text-[#8C2F39]/100' },
    { id: 'timeline', name: '天命天演 (Dynasty Fate) 📊', desc: 'D3 兴衰大纪事与皇家施政断案', icon: Landmark, accent: 'text-[#8C2F39] hover:text-[#8C2F39]/100' },
    { id: 'multiplayer', name: '天命总坛 (Multiplayer) 🌟', desc: '多人实时云端朝政对决', icon: Users, accent: 'text-[#8C2F39] hover:text-[#8C2F39]/80' },
    { id: 'war_philosophy', name: '兵道生存 (War Philosophy) 🔥', desc: '以兵法为生存哲学的模拟推演', icon: Compass, accent: 'text-[#8C2F39] hover:text-[#8C2F39]/80' },
    { id: 'gdd', name: '策划主编 (GDD Pro)', desc: '17个机制模块总成', icon: BookOpen, accent: 'text-amber-500 hover:text-amber-400' },
    { id: 'court', name: '朝堂夺嫡 (Court)', desc: '皇帝依赖/猜忌模型', icon: Landmark, accent: 'text-purple-400 hover:text-purple-300' },
    { id: 'combat', name: '奇正军争 (Combat)', desc: '虚实九地将领五危', icon: Swords, accent: 'text-rose-400 hover:text-rose-300' },
    { id: 'spy', name: '五间连环 (Spy)', desc: '反策与多边情报盲盒', icon: KeyRound, accent: 'text-emerald-400 hover:text-emerald-300' },
    { id: 'trade', name: '大商世家 (Trade)', desc: '私盐垄断与阶层天梯', icon: Coins, accent: 'text-yellow-400 hover:text-yellow-300' },
    { id: 'diplomacy', name: '多边外交 (State)', desc: '远交近攻脱藩博弈', icon: Compass, accent: 'text-blue-400 hover:text-blue-300' },
    { id: 'uprising_culture', name: '义军信仰 (Faith)', desc: '起义触发与学说博弈', icon: Flame, accent: 'text-orange-400 hover:text-orange-300' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#8C2F39]/20 selection:text-[#8C2F39]" id="sun-tzu-app-root">
      {/* Top Banner HUD */}
      <header className="border-b-2 border-[#1A1A1A] bg-[#F5F2ED]/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Ink seal logo aesthetic */}
            <div className="bg-[#8C2F39] text-[#F5F2ED] font-serif font-black flex items-center justify-center w-12 h-12 rounded border border-black/20 shadow-md text-xl relative overflow-hidden" id="ink-seal-stamp">
              孙<br />子
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-2xl font-serif font-black text-[#1A1A1A] tracking-wider">
                  《孙子》封建大战略推演沙盒
                </h1>
                <span className="text-[10px] bg-[#1A1A1A] text-[#F5F2ED] px-2 py-0.5 rounded uppercase font-mono font-bold">
                  模拟就绪
                </span>
              </div>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5 font-mono">
                Historical Grand Strategy Game Design Hub & State Logic Engine
              </p>
            </div>
          </div>

          {/* Core Dynasty Stats Bar */}
          <div className="flex flex-wrap gap-4 bg-white/45 backdrop-blur-sm px-4 py-2 rounded border border-[#1A1A1A]/15 text-xs font-mono w-full md:w-auto justify-between md:justify-start">
            <div className="pr-4 border-r border-[#1A1A1A]/15">
              <span className="text-[#1A1A1A]/60 block text-[9px] uppercase tracking-wider font-semibold">天命值 (Fate)</span>
              <span className="font-bold text-[#8C2F39] flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-[#8C2F39]" />
                {dynastyFate.mandate}%
              </span>
            </div>
            <div className="pr-4 border-r border-[#1A1A1A]/15 hidden sm:block">
              <span className="text-[#1A1A1A]/60 block text-[9px] uppercase tracking-wider font-semibold">执朝政治稳定</span>
              <span className="font-bold text-[#5A5A40] mt-0.5 block">{dynastyFate.stability}%</span>
            </div>
            <div className="pr-4 border-r border-[#1A1A1A]/15">
              <span className="text-[#1A1A1A]/60 block text-[9px] uppercase tracking-wider font-semibold">大司农岁收</span>
              <span className="font-bold text-[#5A5A40] mt-0.5 block">{dynastyFate.coffers} 贯</span>
            </div>
            <div>
              <span className="text-[#1A1A1A]/60 block text-[9px] uppercase tracking-wider font-semibold">君嗣傀儡度</span>
              <span className="font-bold text-[#8C2F39] mt-0.5 block">14岁（年幼幼帝）</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar Drawer */}
        <nav className="md:col-span-3 space-y-4" id="navigation-sidebar">
          <div className="bg-white/40 p-4 rounded border border-[#1A1A1A]/15 space-y-3 shadow-xs">
            <span className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest pl-1 block font-bold">
              推演局势选单
            </span>

            <div className="space-y-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isSelected = activeTab === t.id;
                
                return (
                  <button
                    key={t.id}
                    id={`tab-nav-${t.id}`}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`w-full p-2.5 rounded text-left transition-all duration-200 border flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#8C2F39]/10 border-[#8C2F39]/25 text-[#8C2F39] font-bold'
                        : 'bg-transparent border-transparent text-[#1A1A1A]/70 hover:bg-black/5 hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#8C2F39]' : 'text-[#1A1A1A]/40'}`} />
                    <div className="truncate">
                      <span className="text-xs block font-serif font-semibold">{t.name}</span>
                      <span className="text-[9px] text-[#1A1A1A]/50 truncate block mt-0.5">{t.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Advice / Classical Sayings */}
          <div className="bg-white/40 p-4 rounded border border-[#1A1A1A]/15 space-y-3 relative overflow-hidden shadow-xs">
            <h4 className="text-[10px] font-mono text-[#8C2F39] tracking-wider flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-[#8C2F39]" />
              孙子兵法十三篇精要手记
            </h4>
            
            <p className="text-xs text-[#1A1A1A]/90 leading-relaxed font-serif italic" id="sun-tzu-quote-display">
              “ {quoteList[quoteIndex].text} ”
            </p>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#1A1A1A]/50 font-mono">
                {quoteList[quoteIndex].source}
              </span>

              <button
                id="next-quote-btn"
                onClick={() => setQuoteIndex((prev) => (prev + 1) % quoteList.length)}
                className="text-[10px] text-[#8C2F39] hover:text-[#8C2F39]/80 font-mono flex items-center gap-0.5 font-bold"
              >
                研读下篇 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </nav>

        {/* Content Dynamic Panel inside a polished framer motion stage */}
        <section className="md:col-span-9 h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'map_battle' && <RealWorldMapBattle />}
              {activeTab === 'timeline' && <DynastyTimeline dynastyStats={dynastyFate} onSyncState={(stats) => setDynastyFate(prev => ({ ...prev, ...stats }))} />}
              {activeTab === 'multiplayer' && <MultiplayerSandbox onSyncState={(stats) => setDynastyFate(prev => ({ ...prev, ...stats }))} />}
              {activeTab === 'war_philosophy' && <WarPhilosophySandbox />}
              {activeTab === 'gdd' && <GddBuilder />}
              {activeTab === 'court' && <CourtSandbox />}
              {activeTab === 'combat' && <MilitarySandbox />}
              {activeTab === 'spy' && <SpySandbox />}
              {activeTab === 'trade' && <MerchantSuccessionSandbox />}
              {activeTab === 'diplomacy' && <DiplomacySandbox />}
              {activeTab === 'uprising_culture' && <UprisingCultureSandbox />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Eastern Zen minimalistic Footer */}
      <footer className="border-t border-[#1A1A1A]/15 py-6 px-4 bg-transparent text-center text-xs mt-auto font-mono text-[#1A1A1A]/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 《孙子》 封建中国策略社区游戏 · 研发设计推演沙盒集成系统</p>
          <div className="flex gap-4">
            <span className="text-[#1A1A1A]/55">版本归档: v13.1117_Completed</span>
            <span>当前代人角色执政起点: 咸阳相国府</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
