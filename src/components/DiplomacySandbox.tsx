import React, { useState } from 'react';
import { DiplomaticNation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, UserCheck, Flame, Compass, HelpCircle, FileText, Send, Heart, Link, Swords } from 'lucide-react';

export default function DiplomacySandbox() {
  const [nations, setNations] = useState<DiplomaticNation[]>([
    { id: '1', name: '大魏', relationship: 100, distance: 1, treaty: 'NONE', strength: 8 },
    { id: '2', name: '赵国', relationship: -45, distance: 2, treaty: 'NONE', strength: 6 },
    { id: '3', name: '齐国', relationship: 20, distance: 3, treaty: 'FRIENDLY', strength: 7 },
    { id: '4', name: '秦国', relationship: 60, distance: 5, treaty: 'ALLIANCE', strength: 9 },
    { id: '5', name: '北狄匈奴', relationship: -90, distance: 4, treaty: 'NONE', strength: 5 },
    { id: '6', name: '燕国', relationship: 40, distance: 4, treaty: 'VASSAL', strength: 4 },
  ]);

  const [activeLog, setActiveLog] = useState<string[]>([
    '【系统初始化】外交远交近攻关系网已展开。',
    '秦魏盟约生效中。近邻赵国与我方冲突不断。',
  ]);

  const [selectedNationId, setSelectedNationId] = useState<string>('2');
  const [emissarySafety, setEmissarySafety] = useState<string>('HIGH'); // HIGH, MEDIUM, LOW

  // Formulas and derived values
  const getFarNearIndex = (distance: number, relation: number) => {
    // 远交近攻指数: Distance * Relation. Larger positive means excellent "Far Alliance". Low/Negative means dangerous "Close Enmity"
    return Math.round((distance * 15) + relation);
  };

  const handleAction = (actionType: 'ALLIANCE' | 'BETRAY' | 'TRIBUTE' | 'BREAK' | 'HECHIN') => {
    const target = nations.find(n => n.id === selectedNationId);
    if (!target) return;

    let updatedNations = [...nations];
    let logMsg = '';

    if (actionType === 'ALLIANCE') {
      if (target.relationship < 30) {
        logMsg = `⚠️ 游说失败：${target.name}对你方猜忌过深（关系值: ${target.relationship}），拒绝结盟。`;
      } else {
        updatedNations = updatedNations.map(n => n.id === target.id ? { ...n, treaty: 'ALLIANCE', relationship: Math.min(100, n.relationship + 15) } : n);
        logMsg = `🤝 结盟成功！大魏与 ${target.name} 正式签署了攻守同盟，锁定互保契约，天命值向上升。`;
      }
    } else if (actionType === 'BETRAY') {
      updatedNations = updatedNations.map(n => n.id === target.id ? { ...n, treaty: 'NONE', relationship: -100 } : n);
      logMsg = `🔥 悍然背叛！大魏单方面撕毁与 ${target.name} 的所有条约，天命直折10点，清流发起强烈弹劾！天下道义大跌。`;
    } else if (actionType === 'HECHIN') {
      updatedNations = updatedNations.map(n => n.id === target.id ? { ...n, treaty: 'FRIENDLY', relationship: Math.min(100, n.relationship + 35) } : n);
      logMsg = `🌸 宣和和清公主远嫁 ${target.name}。关系暴涨35。获得情报眼线，匈奴人短期内不扰边境。`;
    } else if (actionType === 'TRIBUTE') {
      if (target.relationship < 10) {
        logMsg = `⚠️ 对方拒绝臣服。主权誓不让步，并加强了边防部署。`;
      } else {
        updatedNations = updatedNations.map(n => n.id === target.id ? { ...n, treaty: 'VASSAL', relationship: Math.min(100, n.relationship + 10) } : n);
        logMsg = `🏆 朝贡达成。${target.name} 携贡马、金玉入咸阳，向大魏称藩称臣，大魏帝国天命跃。`;
      }
    } else if (actionType === 'BREAK') {
      // 离间破盟
      const sourceRel = target.relationship;
      const roll = Math.random() * 100;
      if (roll > 40) {
        updatedNations = updatedNations.map(n => n.id === target.id ? { ...n, relationship: Math.max(-100, n.relationship - 35) } : n);
        logMsg = `👁️ 离间妙策！派遣死士伪造 ${target.name} 内部将领与他国通敌密信。${target.name} 朝野震动，君忌相疑，盟约出现裂痕，关系骤降35。`;
      } else {
        logMsg = `❌ 离间失败。密谍在咸阳城关遭盘查，不幸遇害者，敌方防备升，敌对关系恶化。`;
      }
    }

    setNations(updatedNations);
    setActiveLog(prev => [logMsg, ...prev].slice(0, 7));
  };

  const handleEmissaryMission = () => {
    const target = nations.find(n => n.id === selectedNationId);
    if (!target) return;

    let loss = 0;
    let logMsg = '';
    const roll = Math.random() * 100;

    if (emissarySafety === 'HIGH') {
      // High cost, high security
      if (roll > 10) {
        setNations(prev => prev.map(n => n.id === target.id ? { ...n, relationship: Math.min(100, n.relationship + 10) } : n));
        logMsg = `📬 随从仪仪：派出公卿重臣率领百人卫队携重金出使 ${target.name}。关系稳健+10，使者安全返回家园。`;
      } else {
        logMsg = `⚠️ 途中生变：尽管重金护送，使节仍在边界被流寇袭扰，幸而保命，增加对方轻微戒备。`;
      }
    } else if (emissarySafety === 'MEDIUM') {
      if (roll > 35) {
        setNations(prev => prev.map(n => n.id === target.id ? { ...n, relationship: Math.min(100, n.relationship + 15) } : n));
        logMsg = `📬 孤鞍前行：使者白衣单骑，抄小道直上。关系大有改善，加深了两国暗地盟约。`;
      } else {
        setNations(prev => prev.map(n => n.id === target.id ? { ...n, relationship: Math.max(-100, n.relationship - 15) } : n));
        logMsg = `💀 绝命噩耗：燕赵边骑截获使节携密信，将其在河西斩首弃市。两国局势急转直下！`;
      }
    } else {
      // Extreme Espionage approach
      if (roll > 60) {
        setNations(prev => prev.map(n => n.id === target.id ? { ...n, relationship: Math.min(100, n.relationship + 30) } : n));
        logMsg = `📬 惊天奇谋：使者冒死涉越死地，成功联合其太后与敌国君王暗中勾兑！建立内应，关系火箭飙增30！`;
      } else {
        logMsg = `☠️ 白骨凄凄：使节深入险地被搜出血书证据，遭遇惨绝，凌迟剥皮。敌皇发出全面绝交檄文。`;
      }
    }

    setActiveLog(prev => [logMsg, ...prev].slice(0, 7));
  };

  const selectedNation = nations.find(n => n.id === selectedNationId) || nations[0];

  return (
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="diplomacy-sandbox-root">
      <div className="flex justify-between items-center mb-6 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <Compass className="text-[#8C2F39] w-5 h-5 animate-pulse font-bold" />
            【外交局】远交近攻与多边博弈演示
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            还原《孙子兵法》第十一篇 “地缘纵横”：距离决定威胁，关系掩盖锋芒。在此实现未竟的外交战术。
          </p>
        </div>
        <span className="text-xs border border-[#1A1A1A]/15 px-2 py-1 text-[#8C2F39] font-mono rounded bg-white/50 backdrop-blur-xs font-bold shadow-xs">
          GDD 模块 12 · 交互实验室
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* State Interactive Map View represented by styled blocks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 relative min-h-[220px] shadow-xs">
            <div className="absolute top-2 right-2 flex gap-4 text-[10px] text-[#1A1A1A]/60 font-mono font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#8C2F39] rounded-xs"></span>邻近威胁</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#5A5A40] rounded-xs"></span>远方盟交</span>
            </div>
            <h3 className="text-xs font-mono text-[#1A1A1A]/60 uppercase tracking-widest mb-3 font-bold">六国纵横棋盘</h3>
            
            {/* Displaying visual nodes */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {nations.map((n) => {
                const farNear = getFarNearIndex(n.distance, n.relationship);
                const isThreat = n.distance <= 2 && n.relationship < 0;
                const isAlly = n.treaty === 'ALLIANCE';
                
                return (
                  <button
                    key={n.id}
                    id={`nation-btn-${n.id}`}
                    onClick={() => setSelectedNationId(n.id)}
                    className={`p-3 relative rounded text-left transition-all overflow-hidden ${
                      selectedNationId === n.id
                        ? 'bg-[#8C2F39]/5 border-[#8C2F39] shadow-xs ring-1 ring-[#8C2F39]/10'
                        : 'bg-white/70 border-[#1A1A1A]/10 hover:bg-white/90'
                    } border`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-serif font-black truncate block max-w-[80%] text-[#1A1A1A]">{n.name}</span>
                      {n.treaty !== 'NONE' && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-mono font-bold ${
                          isAlly ? 'bg-[#5A5A40]/10 text-[#5A5A40]' : 'bg-[#8C2F39]/10 text-[#8C2F39]'
                        }`}>
                          {n.treaty === 'ALLIANCE' ? '秦晋同盟' : n.treaty === 'FRIENDLY' ? '通好之国' : n.treaty === 'VASSAL' ? '帝国藩臣' : n.treaty}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[10px] text-[#1A1A1A]/60 font-mono">
                        局势: <strong className={n.relationship >= 0 ? "text-[#5A5A40] font-bold" : "text-[#8C2F39] font-bold"}>{n.relationship}</strong>
                      </span>
                      <span className="text-[10px] text-[#1A1A1A]/50 font-mono">
                        距: {n.distance} 里
                      </span>
                    </div>

                    {/* Threat indicator bar */}
                    <div className="w-full bg-[#1A1A1A]/5 h-1 mt-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isThreat ? 'bg-[#8C2F39]' : isAlly ? 'bg-[#5A5A40]' : 'bg-[#E3A018]'}`}
                        style={{ width: `${Math.max(0, Math.min(100, (n.relationship + 100) / 2))}%` }}
                      ></div>
                    </div>

                    <div className="mt-2 text-[9px] text-[#1A1A1A]/50 font-mono flex items-center justify-between">
                      <span>远交近攻分:</span> 
                      <span className={`font-bold ${farNear > 80 ? 'text-[#5A5A40]' : farNear < 10 ? 'text-[#8C2F39]' : 'text-[#1A1A1A]/85'}`}>
                        {farNear}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Pad */}
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 space-y-3 shadow-xs">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-bold">
              <Swords className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
              针对目标：<span className="text-[#8C2F39] font-black">{selectedNation.name}</span> 的外交指令
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                id="diplomacy-action-alliance"
                onClick={() => handleAction('ALLIANCE')}
                className="bg-white hover:bg-neutral-50 text-[#1A1A1A] font-bold text-xs py-2 px-3 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/40 rounded flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Link className="w-3.5 h-3.5 text-[#5A5A40]" />
                缔结攻守盟
              </button>
              <button
                id="diplomacy-action-ambass"
                onClick={() => handleAction('HECHIN')}
                className="bg-white hover:bg-neutral-50 text-[#1A1A1A] font-bold text-xs py-2 px-3 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/40 rounded flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Heart className="w-3.5 h-3.5 text-[#8C2F39]" />
                宣公主和亲
              </button>
              <button
                id="diplomacy-action-tribute"
                onClick={() => handleAction('TRIBUTE')}
                className="bg-white hover:bg-neutral-50 text-[#1A1A1A] font-bold text-xs py-2 px-3 border border-[#1A1A1A]/15 hover:border-[#8C2F39]/40 rounded flex items-center justify-center gap-2 transition shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                纳供朝贡
              </button>
              <button
                id="diplomacy-action-sabotage"
                onClick={() => handleAction('BREAK')}
                className="bg-white hover:bg-red-50/20 text-[#8C2F39] font-bold text-xs py-2 px-3 border border-[#8C2F39]/20 hover:border-[#8C2F39]/50 rounded flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 text-[#8C2F39]" />
                离间破盟计
              </button>
              <button
                id="diplomacy-action-betray"
                onClick={() => handleAction('BETRAY')}
                className="bg-white hover:bg-[#8C2F39]/5 text-[#8C2F39] font-black text-xs py-2 px-3 border border-[#8C2F39]/30 hover:border-[#8C2F39] rounded flex items-center justify-center gap-2 col-span-2 sm:col-span-1 transition shadow-xs"
              >
                背盟破誓侵
              </button>
            </div>
          </div>
        </div>

        {/* Emissary Danger System */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 shadow-xs">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-2 mb-3 font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-[#5A5A40]" />
              战时使节使馆系统
            </h3>
            
            <p className="text-[11px] text-[#1A1A1A]/60 mb-4 leading-relaxed font-mono">
              根据兵法，使臣是沟通黑箱、试探对方虚实的生动载体。使臣可以带金玉买通权贵，也可能触发被截杀事件。
            </p>

            <div className="space-y-4">
              <div className="bg-white/60 p-2.5 rounded border border-[#1A1A1A]/10 shadow-xs">
                <span className="text-[10px] text-[#1A1A1A]/50 font-mono block">请派遣使臣行进路线安全性：</span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { key: 'HIGH', label: '重金大队 (稳)', desc: '花费100金，极低折损率' },
                    { key: 'MEDIUM', label: '素车白乘 (间)', desc: '风险五五开，成效显著' },
                    { key: 'LOW', label: '冒险死士 (奇)', desc: '博得高额关系，出使极险' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      id={`safety-btn-${item.key}`}
                      onClick={() => setEmissarySafety(item.key)}
                      className={`p-1.5 rounded text-center border transition-all ${
                        emissarySafety === item.key
                          ? 'bg-[#8C2F39] border-[#8C2F39] text-[#F5F2ED] font-bold shadow-sm'
                          : 'bg-white border-[#1A1A1A]/15 text-[#1A1A1A]/65 hover:bg-[#1A1A1A]/5'
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[8px] opacity-70 block mt-0.5 font-mono">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="dispatch-emissary-btn"
                onClick={handleEmissaryMission}
                className="w-full bg-[#8C2F39] hover:bg-[#8C2F39]/90 text-[#F5F2ED] text-xs font-black py-2.5 rounded shadow flex items-center justify-center gap-2 transition"
              >
                <Send className="w-3.5 h-3.5 inline-block font-bold" />
                遣派使臣绝密出使【{selectedNation.name}】
              </button>
            </div>
          </div>

          {/* Real-time Diplomatic Logs */}
          <div className="bg-white/85 p-4 rounded border border-[#1A1A1A]/15 max-h-[170px] overflow-y-auto shadow-xs">
            <h4 className="text-[10px] font-mono text-[#1A1A1A]/60 tracking-wider mb-2 font-bold uppercase">沙盒外交演武简报</h4>
            <div className="space-y-1.5 text-xs font-mono">
              {activeLog.map((log, index) => (
                <div key={index} className="text-[#1A1A1A]/85 border-l-2 border-[#8C2F39]/20 pl-2 py-0.5">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
