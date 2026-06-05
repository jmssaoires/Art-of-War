import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TutorialSection {
  id: string;
  title: string;
  icon: string;
  shortDesc: string;
  content: React.ReactNode;
}

const TUTORIAL_DATA: TutorialSection[] = [
  {
    id: 'identity',
    title: '【孤身入局】布衣策士，白纸起势',
    icon: '👤',
    shortDesc: '关于玩家初始身份与起步资源',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>所有玩家入局后的初始设定，都是一位带着定额初始资源、处于权力上升期的<b>“布衣策士”或“初级诸侯”</b>。</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>白纸开局：</b>面对风雨飘摇的朝廷，此时的你是一张白纸。既不是权倾朝野的太监，也不是割据一方的军阀。没有庞大的私兵、无尽的金库或广袤的封地。一切都要从零开始经营。</li>
          <li><b>绝对公平：</b>所有玩家入局的起始资源是完全相同的！无论是天命、金匮还是初始武将谋士，都在同一条起跑线上。</li>
          <li><b>步步为营：</b>你的每一次抉择，将决定你能否在这乱世中聚拢资源，结交权贵，平定叛乱，最终名垂青史。</li>
        </ul>
      </div>
    )
  },
  {
    id: 'commoners',
    title: '【天下苍生】水能载舟，亦能覆舟',
    icon: '🌾',
    shortDesc: '虚拟世界中底层百姓的存在与影响',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>虽然玩家扮演的是权臣谋士，但<b>底层百姓绝不是背景板，而是决定你生死存亡的暗流！</b></p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>数值具象化：</b>百姓的生存状态直接反映在【稳定度】和【天命】中。苛政猛于虎，如果疯狂横征暴敛（如为了补充金匮而加税），稳定度会暴跌。</li>
          <li><b>反噬机制：</b>当稳定度极低或遭遇大灾天候时，底层人会化为流民，引爆【农民起义】事件，甚至直接冲击你的根基。</li>
          <li><b>玩家的抉择：</b>你不需要微操每个平民的生活，但你在朝堂上的每一次“大笔一挥”（如赈灾、征兵、兴修水利），都在实打实地决定万千百姓的生死，并最终反作用于你的治国霸业。</li>
        </ul>
      </div>
    )
  },
  {
    id: 'goal',
    title: '【终极目标】皮之不存，毛将焉附？',
    icon: '🎯',
    shortDesc: '朝廷存亡的底线与各派系的暗流',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>游戏的宏观底线是<b>维持国家社稷长存，防止崩溃！</b></p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>朝野共识（红线约束）：</b>顶部三大资源「天命、金匮、稳定度」任一跌入0%，帝国倾覆，游戏立刻失败。即便权臣图谋篡位，也不希望接手一个毁灭的烂摊子。</li>
          <li><b>派系殊途（真正胜利）：</b>在真实中国历史中不同派系的真实目标大相径庭！文臣重道统（偏重天命与教化），藩镇重兵权（偏重争夺金匮），外戚宦官依附皇权（操弄稳定度）。因此，在维持底线不崩盘的同时，<b>实现己方派系利益最大化</b>才是你的核心权谋之道！</li>
        </ul>
      </div>
    )
  },
  {
    id: 'time',
    title: '历史如常川，时轮自动常转',
    icon: '⏱️',
    shortDesc: '关于时间流逝与突发事件',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>进入沙盒后，右侧上方的时间齿轮是<b>自行滚动流变</b>的（默认5秒演进1年）。</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>天时变迁：</b>在岁岁月月里会催发各种历史异变、敌军包抄或权臣篡变。</li>
          <li><b>不可阻挡：</b>时间不止，你必须一刻不停地警觉决策！不要停下操作的脚步。</li>
          <li><b>多段流速：</b>开发者的大司马模式可调节时间流速，纯净玩家默认体验标准流速。</li>
        </ul>
      </div>
    )
  },
  {
    id: 'resources',
    title: '调度三大神髓，严防朝廷覆灭',
    icon: '📊',
    shortDesc: '国家核心三维数值管理',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>时刻维持顶端的三大红线指标，任一归零则推演直接溃败：</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>【天命】：</b>代表皇室凝聚力与名器大统，影响天下士人的归附。可通过祭祀、舆论引导来恢复。</li>
          <li><b>【金匮】：</b>维持政府运作与军队发饷的经济命脉。打仗与赈灾耗资万金，需谨慎平衡税收与开支。</li>
          <li><b>【稳定度】：</b>平定地方暴动的基础指标。一旦过低，反王蜂起，天下大乱。</li>
        </ul>
      </div>
    )
  },
  {
    id: 'modules',
    title: '施政朝天十偏殿，折冲尊俎',
    icon: '🏛️',
    shortDesc: '各个游戏模块与机制详解',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>你可通过控制台流转于各施政点。各大核心模块互相联动：</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><b>地图作战（真实世界联动）：</b>在真实卫星数据底图的地形上构筑要塞，布置兵力阻击外敌入侵。</li>
          <li><b>内朝大案：</b>处理朝堂党争、夺嫡风波或者敕封宰臣，平衡各大士大夫集团。</li>
          <li><b>多边外交与谍报：</b>布防卧底，煽动敌国内乱，并与外邦交涉结盟。</li>
          <li><b>世家商战：</b>插手私盐暴利与经济战，操纵物价。</li>
          <li><b>兵法树与科技：</b>解锁历代兵法学说，获得全局增益。</li>
        </ul>
      </div>
    )
  },
  {
    id: 'cards',
    title: '兵法牌奇正相生，一锤定音',
    icon: '🧭',
    shortDesc: '破局的主动技能与天赐秘囊',
    content: (
      <div className="space-y-2 text-stone-400">
        <p>局势不可收拾时，点击底部的《奇正相生》、《五间妙连》等秘囊卡牌。</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>它们是你的<b>超级主动技能</b>，每次使用会触发强力效果。</li>
          <li><b>《奇正相生》：</b>军事绝境时获取数倍乘算BUFF，绝地反击。</li>
          <li><b>《国库充盈》：</b>瞬间增补万两金饷防洪防灾、挽狂澜于既倒！</li>
          <li><b>冷却与代价：</b>技能使用后需时间或特定条件方可再次启用，注意保留作为底牌。</li>
        </ul>
      </div>
    )
  }
];

export default function LoginTutorial() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[#C5A059]/15 pb-3">
        <span className="p-1 px-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-serif font-black text-[9.5px] uppercase tracking-wider">
          兵道真意
        </span>
        <h3 className="text-sm font-serif font-black text-amber-200 tracking-wider">
          天元沙盘 · 策士治国游玩要旨
        </h3>
      </div>

      <div className="space-y-2 text-[11px] font-serif leading-relaxed">
        {TUTORIAL_DATA.map((section) => {
          const isExpanded = expandedId === section.id;
          return (
            <div 
              key={section.id} 
              className="border border-stone-800/60 rounded bg-stone-900/30 overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{section.icon}</span>
                  <div>
                    <h4 className="text-amber-100 font-black text-[12px]">
                      {section.title}
                    </h4>
                    <p className="text-stone-500 text-[9.5px] mt-0.5">
                      {section.shortDesc}
                    </p>
                  </div>
                </div>
                <div className="text-stone-500">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-3 pl-4 pt-1 bg-stone-950/40 border-t border-stone-800/60">
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
