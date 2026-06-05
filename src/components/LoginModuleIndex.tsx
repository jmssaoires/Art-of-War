import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ModuleSection {
  id: string;
  title: string;
  badge: string;
  shortDesc: string;
  content: React.ReactNode;
}

const MODULE_DATA: ModuleSection[] = [
  {
    id: 'map_battle',
    title: '真实地图作战 🌍',
    badge: '实境地利攻防',
    shortDesc: '神州实境战例与九地天演',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>核心兵法实践模块！将现实世界地形转换为沙盘战场，结合风、雨、雾等真实「天候」，在此构建防线、排兵布阵，抗击敌方狂潮。</p>
      </div>
    )
  },
  {
    id: 'timeline',
    title: '天命天演 📊',
    badge: '宏观朝代剧本',
    shortDesc: '朝代兴衰大纪事与皇家施政断案',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>解锁并推进中华各朝代史诗（如秦汉更替）。管理全局「天命值」，并处理随机历史事件，从宏观维度决定你的帝国统治走向。</p>
      </div>
    )
  },
  {
    id: 'multiplayer',
    title: '咸阳天命总坛 🌟',
    badge: '真实多人沙盘',
    shortDesc: '多人实时云端朝政对决',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>基于分布式云端同步的多人联机模块。你可以和其他玩家（策士）在同一个朝堂协同抗敌或勾心斗角，体验真实的勾心斗角与利益交换。</p>
      </div>
    )
  },
  {
    id: 'war_philosophy',
    title: '兵道生存 🔥',
    badge: '道统与礼法天命',
    shortDesc: '以兵法为生存哲学的模拟推演',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>探索中国历代道统、法制与统治哲学的演变。通过尊儒、尚法或黄老之治，来影响民间的文化思潮与政治正当性（皇权稳固度）。</p>
      </div>
    )
  },
  {
    id: 'court',
    title: '朝堂夺嫡 🏛️',
    badge: '内朝大案与敕封',
    shortDesc: '皇帝依赖/猜忌模型',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>与清流士大夫、九千岁宦官集团及世家大族周旋。平衡三省六部，任免宰辅，维系各派系利益，并提防“功高震主”带来的皇帝猜忌与逼宫风险。</p>
      </div>
    )
  },
  {
    id: 'combat',
    title: '奇正军争 ⚔️',
    badge: '将领五危与战术',
    shortDesc: '虚实九地将领五危',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>《孙子兵法》在军团级微观战术维度的应用推演。在不同的地形（九地）选择契合的将领性格，触发兵种连携与阵法相克，击溃敌军建制。</p>
      </div>
    )
  },
  {
    id: 'diplomacy',
    title: '多边外交 📜',
    badge: '合纵连横',
    shortDesc: '远交近攻脱藩博弈',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>模拟古代使臣周旋于各国之间。可通过送质子、和亲、重金贿赂等手段缔结盟国，也可施展「反间计」使敌国君臣相疑，分化列国同盟轴心。</p>
      </div>
    )
  },
  {
    id: 'spy',
    title: '五间连环 🕵️',
    badge: '特务暗网潜行',
    shortDesc: '反策与多边情报盲盒',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>组建古代最高级别情报局。派遣「死间」、「生间」、「内间」等细作潜入敌方腹地，窃取军机底牌、制造动乱或破坏敌方财力结社。</p>
      </div>
    )
  },
  {
    id: 'trade',
    title: '大商世家 💰',
    badge: '经济与门阀垄断',
    shortDesc: '私盐垄断与阶层天梯',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>掌控国家的财富机器——体验古代官商勾结的垄断经济。经营漕运、私盐与铁矿，通过联姻积累世家特权，或干脆通过财力操纵国家命脉。</p>
      </div>
    )
  },
  {
    id: 'uprising_culture',
    title: '义军信仰 🚩',
    badge: '民心与暴动模型',
    shortDesc: '起义触发与学说博弈',
    content: (
      <div className="space-y-1 text-stone-400 text-[10px] leading-relaxed">
        <p>基于古代王朝周期律的底层民意推演。当苛捐杂税过重引发饥馑时，民间将孕育暴民武装与邪教信仰，你必须派兵镇压或开仓赈灾以挽救危局。</p>
      </div>
    )
  }
];

export default function LoginModuleIndex() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-[#C5A059]/15 pb-3 shrink-0">
        <span className="p-1 px-2 rounded bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 font-serif font-black text-[9.5px] uppercase tracking-wider">
          全息版图
        </span>
        <h3 className="text-sm font-serif font-black text-[#FAF8F5] tracking-wider">
          天演十一大推演阵列模块一览
        </h3>
      </div>

      <div className="space-y-2 text-[11px] font-serif leading-relaxed overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {MODULE_DATA.map((section) => {
          const isExpanded = expandedId === section.id;
          return (
            <div 
              key={section.id} 
              className="border border-stone-800/60 rounded bg-stone-900/30 overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex flex-col p-2.5 text-left hover:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                    <span className="shrink-0 text-cyan-200/80 font-black text-[12px]">
                      {section.title}
                    </span>
                  </div>
                  <div className="text-stone-500 shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.5 rounded bg-stone-800 text-[8.5px] text-amber-200/80 font-mono shrink-0 leading-none pb-1 pt-0.5">
                    {section.badge}
                  </span>
                  <span className="text-stone-500 text-[9.5px] truncate">
                    {section.shortDesc}
                  </span>
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-2.5 pl-3 pt-1 bg-stone-950/40 border-t border-stone-800/60 text-stone-300/90 text-xs">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
