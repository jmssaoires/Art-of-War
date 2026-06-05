import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Crown, 
  Map as MapIcon, 
  Clock, 
  Flame, 
  Award, 
  HelpCircle, 
  Heart,
  Volume2
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

interface OnboardingTutorialProps {
  displayName: string;
  onComplete: (rewards: { xp: number; prestige: number }) => void;
  onSkip: () => void;
  activeTab: string;
  setActiveTab: (tabId: any) => void;
}

interface TutorialStep {
  title: string;
  icon: React.ComponentType<any>;
  text: string;
  targetId: string | null;
  tabContext?: any; // Switch to this tab first for demonstration
  sound?: () => void;
}

export default function OnboardingTutorial({
  displayName,
  onComplete,
  onSkip,
  activeTab,
  setActiveTab,
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const steps: TutorialStep[] = [
    {
      title: '📜 布衣起誓 · 宏愿始启',
      icon: BookOpen,
      text: `恭迎策士「${displayName}」叩问天元推演总坛！此地是基于《孙子兵法》全篇数理机制、朝野立体大战略模拟沙盘。大局浩瀚，极富策略趣味，切莫惊慌。大司马已为您备下兵道讲武堂导学，随我一探究竟。`,
      targetId: null,
      sound: () => soundManager.playHorn(),
    },
    {
      title: '🎯 太极天演 · 核心玩法法则 (必看)',
      icon: Sparkles,
      text: `【本游戏终极目标】：是维持国家社稷长存，防止崩溃！
随着右上角的【时间自主流失推移（默认每5秒代表一年次）】，各种突发历史洪流、外敌叩关或灾人百官上奏将倾斜而下。若顶部三大资源「天命、金匮、稳定度」任一指标跌入 0%——则天命寿终、帝国倾覆，游戏失败！
你需要随时切换左侧控制区的【十域施政偏殿】折冲尊俎、并在危急时刻祭献屏幕下方的【兵法锦囊牌】获得短效逆天加成或资源，维持朝野平衡！`,
      targetId: null,
      sound: () => soundManager.playChime(),
    },
    {
      title: '📊 社稷命脉 · 三大枢机',
      icon: Crown,
      text: '看此地！此处标示帝国的核心气运指标：【天命值（Mandate）】（代表江山合法度）、【国库金匮（Gold）】（代表财政命脉）与【安邦稳定度（Stability）】（代表朝野凝聚程度）。政令与历史波澜会极度乘数化这些指数。',
      targetId: 'empire-hud-counters',
      sound: () => soundManager.playCoins(),
    },
    {
      title: '🛡️ 策事堂印玺 · 归附大营',
      icon: Award,
      text: '此处展现您的【策士法章与归附】。您能获取策力经验、功勋声名，并率领麾下的披甲卫士。您可随时点击下达投靠「关外联军」、「大秦铁骑」或「楚地义军」以改变立场，这会瞬时改变您在此模块中的名誉加成。',
      targetId: 'warlord-char-card',
      sound: () => soundManager.playDrum(),
    },
    {
      title: '🌍 偏殿施政 · 十域沙盒交互',
      icon: MapIcon,
      text: '此侧是控制天下大势的【大战略推演区】。例如「真实地图作战」由万象卫星实境模拟九地交兵；「天命天演」则是兴衰岁时的时局渲染面板。您可以随时点击这些罗盘按钮穿梭于不同的朝廷偏殿，行使最高统帅决议！',
      targetId: 'navigation-sidebar',
      tabContext: 'map_battle',
      sound: () => soundManager.playChime(),
    },
    {
      title: '⏱️ 历史时机 · 天纲时纪仪',
      icon: Clock,
      text: '此地为时间之轴：【天纲时纪仪】。沙盘中历史是自行滚动的（默认每 5 秒流转一年）。天时推移中，系统会自动推演、发生各种随机历史风波、敌将入侵或百官上书。您作为大司马或策士更可以在此操纵时间岁时流速！',
      targetId: 'chrono-engine-widget',
      sound: () => soundManager.playDrum(),
    },
    {
      title: '🧧 兵法锦囊 · 瞬态兵法牌',
      icon: Flame,
      text: '急难之中，大帅可行奇门遁甲！您可以随时选择祭献《奇正相生》、《火攻奇袭》、《五间妙连》或《商战天商》卡牌。点击即可获得持续 30 秒的极极数理加持，或瞬间充盈万两库银或者直接斩获经验，绝地翻盘！',
      targetId: 'sun-tzu-strategy-cards',
      sound: () => soundManager.playHorn(),
    },
    {
      title: '🎉 讲武堂解褐 · 即刻掌印',
      icon: Sparkles,
      text: '修业顺利毕业！你已熟稔天演总坛的操作法则。大本营特此赏赐您：晋封 200 策力经验（XP）与 500 点功勋声名（Prestige）。从此辅佐天子、横扫江山，开启大战略治国之功！',
      targetId: null,
      sound: () => soundManager.playHorn(),
    },
  ];

  const activeStepData = steps[currentStep];

  // Auto-switch tabs if the step requests a specific context
  useEffect(() => {
    if (activeStepData.tabContext && activeTab !== activeStepData.tabContext) {
      setActiveTab(activeStepData.tabContext);
    }
  }, [currentStep, activeTab, setActiveTab]);

  // Dynamic spotlight z-index elevation effect for targeted element visibility
  useEffect(() => {
    const targetId = activeStepData.targetId;
    if (!targetId) return;

    const el = document.getElementById(targetId);
    if (!el) return;

    // Save previous inline style values to prevent overriding layout
    const originalPosition = el.style.position;
    const originalZIndex = el.style.zIndex;
    const originalPointerEvents = el.style.pointerEvents;
    const originalTransition = el.style.transition;
    const originalBoxShadow = el.style.boxShadow;
    const originalOutline = el.style.outline;

    // Apply elevated focus styling above the guide backdrop (z-100)
    el.style.position = 'relative';
    el.style.zIndex = '101';
    el.style.pointerEvents = 'auto'; // Keep it interactive
    el.style.transition = 'box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), outline 0.3s ease';
    el.style.boxShadow = '0 0 35px rgba(245, 158, 11, 0.45), 0 0 10px rgba(140, 47, 57, 0.3)';
    el.style.outline = '3px solid rgba(245, 158, 11, 0.85)';

    return () => {
      // Restore previous configuration
      el.style.position = originalPosition;
      el.style.zIndex = originalZIndex;
      el.style.pointerEvents = originalPointerEvents;
      el.style.transition = originalTransition;
      el.style.boxShadow = originalBoxShadow;
      el.style.outline = originalOutline;
    };
  }, [currentStep, activeStepData.targetId, activeTab]);

  // Recalculate target element position for dynamic spotlight highlighting
  useEffect(() => {
    const updatePosition = () => {
      if (!activeStepData.targetId) {
        setHighlightRect(null);
        return;
      }
      
      const el = document.getElementById(activeStepData.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
        // Scroll slightly inline if required but keep viewport centered
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setHighlightRect(null);
      }
    };

    // Small delay to ensure tabs are updated and loaded before querying DOM
    const timer = setTimeout(updatePosition, 350);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, activeTab, activeStepData.targetId]);

  // Play Step Sound
  useEffect(() => {
    if (activeStepData.sound) {
      activeStepData.sound();
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Completed!
      onComplete({ xp: 200, prestige: 500 });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const IconComponent = activeStepData.icon;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none" id="onboarding-tutorial-container">
      {/* Dimmed Background Overlay - increased opacity and blur to de-clutter the complex dashboard */}
      <div className="absolute inset-0 bg-black/85 pointer-events-auto backdrop-blur-[5px]" />

      {/* Dynamic Glowing Spotlight around the active HTML ID target element */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: highlightRect.left + window.scrollX - 4,
            y: highlightRect.top + window.scrollY - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="absolute border-2 border-amber-400 rounded-lg shadow-[0_0_30px_rgba(245,158,11,0.6)] bg-transparent pointer-events-none z-[101] animate-pulse"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        />
      )}

      {/* Dialogue Message Box Cards */}
      <div className="absolute inset-x-4 bottom-10 md:bottom-20 max-w-xl mx-auto z-[102] pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-stone-950/98 border border-[#C5A059] rounded-lg shadow-2xl p-5 md:p-6 text-[#FAF8F5] relative overflow-hidden"
        >
          {/* Aesthetic Chinese silk geometric border */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#8C2F39] via-amber-500 to-[#8C2F39]"></div>
          <div className="absolute right-3 top-3 text-[9px] font-mono text-stone-550 border border-stone-800 px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold bg-stone-900">
            讲武堂步导 {currentStep + 1} / {steps.length}
          </div>

          <div className="flex gap-4 items-start pt-1">
            <div className="p-3 bg-[#8C2F39]/15 border border-[#8C2F39]/40 text-amber-400 rounded h-12 w-12 flex items-center justify-center shrink-0 shadow-md">
              <IconComponent className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-2.5 flex-1">
              <h3 className="text-base font-serif font-black text-amber-200 tracking-wider flex items-center gap-1.5">
                {activeStepData.title}
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              </h3>
              
              <p className="text-xs text-stone-300 leading-relaxed font-serif tracking-wide border-t border-stone-900 pt-2 shadow-inner">
                {activeStepData.text}
              </p>

              {activeStepData.targetId && (
                <div className="bg-amber-950/10 border border-amber-900/30 p-1.5 rounded text-[10px] text-amber-300/90 font-mono flex items-center gap-1 bg-stone-900/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  请凝视界面中点亮的黄色呼吸框以锚定当前介绍模块。
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-2.5 border-t border-stone-900">
                <button
                  onClick={onSkip}
                  className="text-[10px] text-stone-500 hover:text-stone-300 font-mono transition font-black hover:underline cursor-pointer py-1"
                >
                  跳过修业 (Skip Manual)
                </button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-2.5 py-1.5 rounded bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-750 text-stone-400 hover:text-stone-200 transition-all text-xs font-serif font-semibold cursor-pointer flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> 上一解
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-1.5 rounded bg-[#8C2F39] hover:bg-[#a32f3b] border border-[#C5A059]/30 text-amber-100 transition-all font-serif text-xs font-black shadow-md flex items-center gap-1 cursor-pointer font-bold select-none active:scale-95"
                  >
                    {currentStep === steps.length - 1 ? '礼毕 · 躬行天下' : '领教 · 下一案'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
