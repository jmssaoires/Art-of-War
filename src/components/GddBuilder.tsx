import React, { useState } from 'react';
import { COMPLETED_MODULES, UNFINISHED_MODULES } from '../data/gddData';
import { Download, FileText, CheckCircle, Clock, BookOpen, AlertCircle, Save, Plus, Copy, Check } from 'lucide-react';

export default function GddBuilder() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('m12');
  const [draftedContent, setDraftedContent] = useState<Record<string, string>>({
    'm13': '• 【流民起义路径】：民心温饱、公正度、安全度连续两季度低于30，导致全国各大州割据流民势力演变为黄巢/闯王起义。民兵属性受到起义军领袖人格特质修正，攻防战力受流民数量加成。\n• 【称王称帝法统】：义军打下首府后，面临两条路径：第一，洗劫屠戮获得2000巨款但全天下名节道义清零；第二，封官授爵收买民心广积粮缓称王，天命快速累积挑战原朝廷。',
    'm14': '• 【释道儒意识博弈】：儒墨主流绑定科举朝纲，控制内阁；老庄教化降低30%税率负担激发大商贸，但战备松弛；佛、白莲等救赎性信仰会在大灾荒年岁快速吸纳流民转化狂信兵。\n• 【文化洗礼和抗争】：当异族（匈奴）征服中原时，异族君主必须面对“文化抵抗机制”。若未能汉化，则民心、地方安定度将长期在20极低区间徘徊。',
    'm15': '• 【非对称社区博弈】：将军驻守边关只能通过飞马飞简斥候获知内廷政变；皇帝的密旨由于中途宦官截留而产生长达三天时间滞后，为朝堂误判提供极佳空间。\n• 【侠客斩首与商帮秘密结盟】：侠客可接受内廷清流暗杀悬赏，对九门要员行刺。商帮暗地里将走私私盐的15%利润分赃给边地藩镇解决辽饷，形成割据自保的资本。',
    'm16': '• 【函谷要隘与水系命脉】：天下分为十三州郡。主要险地如虎牢、函谷关驻守时，防守统帅自动增加40指挥面板。\n• 【漕运劫粮计】：江南三线大漕运路线决定各路官军的给养极值。大河口或漕粮被截将带来奇正部队最致命崩溃。',
    'm17': '• 【异步运行法则】：每日凌晨早朝阅奏决策开合；中午军事对阵奇正沙卷展示；夜深密谍用间解密与家族传承统计。\n• 【极简儒禅画风】：摒弃AI高饱和度杂音。通体应用仿古水墨破纸，苍古沉重，以清冷克制衬托权力骨架。'
  });

  const [activeModule, setActiveModule] = useState<any>(COMPLETED_MODULES.find(m => m.id === 'm12') || COMPLETED_MODULES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const getModuleText = (m: any) => {
    let s = `=== 模块 ${m.number} — ${m.title} ===\n`;
    s += `• 状态: ${m.status}\n`;
    s += `• 简述: ${m.summary}\n`;
    m.details.forEach((d: string) => {
      s += `• ${d}\n`;
    });
    if (draftedContent[m.id]) {
      s += `【深度增设研发条目】:\n${draftedContent[m.id]}\n`;
    }
    s += `\n`;
    return s;
  };

  const handleExportTextGdd = () => {
    let gdd = `《孙子》 封建古代中国策略社区大游戏设计文档 (GDD) — 统一进度导出卷\n`;
    gdd += `==========================================================\n\n`;
    
    COMPLETED_MODULES.forEach(m => {
      gdd += getModuleText(m);
    });

    UNFINISHED_MODULES.forEach(m => {
      gdd += `=== 模块 ${m.number} — ${m.title} ===\n`;
      gdd += `• 状态: 设计推进完成\n`;
      gdd += `• 简述: ${m.summary}\n`;
      gdd += draftedContent[m.id] ? draftedContent[m.id] : m.details.join('\n');
      gdd += `\n\n`;
    });

    // Download behavior
    const element = document.createElement("a");
    const file = new Blob([gdd], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "SunTzu_Game_Complete_GDD_Export.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleModuleSelect = (id: string) => {
    let m = COMPLETED_MODULES.find(x => x.id === id);
    if (!m) m = UNFINISHED_MODULES.find(x => x.id === id);
    if (m) {
      setActiveModule(m);
      setSelectedModuleId(id);
    }
  };

  const handleUpdateDraft = (id: string, text: string) => {
    setDraftedContent(prev => ({
      ...prev,
      [id]: text
    }));
  };

  return (
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="gdd-builder-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <BookOpen className="text-[#8C2F39] w-5 h-5" />
            【总案阁】孙子全书 GDD 设计图谱
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            统合17个核心设计模块，编辑完成未竞篇章并导出完整设计卷宗，供后续 Agent 及开发者整体查阅开发。
          </p>
        </div>

        <button
          id="export-gdd-btn"
          onClick={handleExportTextGdd}
          className="bg-[#8C2F39] hover:bg-[#8C2F39]/90 text-[#F5F2ED] font-black text-xs py-2 px-4 rounded shadow flex items-center gap-1.5 self-end transition"
        >
          <Download className="w-3.5 h-3.5" />
          导出GDD设计总卷 (TXT)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
        {/* Left Side: Modular Map Index */}
        <div className="lg:col-span-4 h-[440px] overflow-y-auto space-y-2 pr-1 border-r border-[#1A1A1A]/10">
          <h3 className="text-xs font-mono text-[#1A1A1A]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
            <FileText className="w-3.5 h-3.5 text-[#1A1A1A]/50" />
            游戏本纪十七篇设计卷子
          </h3>

          <div className="space-y-1">
            {COMPLETED_MODULES.map(m => (
              <button
                key={m.id}
                id={`module-idx-${m.id}`}
                onClick={() => handleModuleSelect(m.id)}
                className={`w-full p-2 text-left rounded text-xs transition flex justify-between items-center ${
                  selectedModuleId === m.id
                    ? 'bg-[#8C2F39]/5 border border-[#8C2F39] text-[#8C2F39] font-bold shadow-xs'
                    : 'bg-white hover:bg-[#1A1A1A]/5 text-[#1A1A1A]/80 border border-[#1A1A1A]/10 shadow-xs'
                }`}
              >
                <span>模块 {m.number} — {m.title}</span>
                <span className="text-[9px] text-[#5A5A40] flex items-center gap-1 font-bold">
                  <CheckCircle className="w-2.5 h-2.5" />
                  已完结
                </span>
              </button>
            ))}

            {UNFINISHED_MODULES.map(m => (
              <button
                key={m.id}
                id={`module-idx-${m.id}`}
                onClick={() => handleModuleSelect(m.id)}
                className={`w-full p-2 text-left rounded text-xs transition flex justify-between items-center ${
                  selectedModuleId === m.id
                    ? 'bg-[#8C2F39]/5 border border-[#8C2F39] text-[#8C2F39] font-bold shadow-xs'
                    : 'bg-white hover:bg-[#1A1A1A]/5 text-[#1A1A1A]/80 border border-[#1A1A1A]/10 shadow-xs'
                }`}
              >
                <span>模块 {m.number} — {m.title}</span>
                <span className="text-[9px] text-[#8C2F39] flex items-center gap-1 font-bold">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  编补中
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive Editing & Planners */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 shadow-xs">
            <div className="flex justify-between items-start mb-3 border-b border-[#1A1A1A]/10 pb-2">
              <div>
                <h4 className="text-sm font-serif font-black text-[#1A1A1A] flex items-center gap-1.5">
                  模块 {activeModule.number} ： {activeModule.title} 
                </h4>
                <div className="text-[10px] text-[#1A1A1A]/50 mt-0.5 font-bold">
                  地位评级：
                  <span className="text-[#8C2F39] font-black">{activeModule.status === 'completed' ? '中朝政令支柱' : '待研发补完子系统'}</span>
                </div>
              </div>
            </div>

            {/* Display completed details in structured bullets */}
            <div className="space-y-2 mb-4 h-[200px] overflow-y-auto pr-1">
              {activeModule.details.map((d: string, index: number) => (
                <div key={index} className="text-xs text-[#1A1A1A]/85 bg-white/75 p-2.5 rounded border border-[#1A1A1A]/10 leading-relaxed font-mono shadow-xs">
                  {d}
                </div>
              ))}
            </div>

            {/* Editing drafting field */}
            {activeModule.status === 'pending' && (
              <div id="draft-editor-container" className="space-y-2">
                <span className="text-[10px] text-[#8C2F39] font-mono block font-bold">✍️ 编修策划填注（请深化并细化数值设计）：</span>
                <textarea
                  id={`draft-textarea-${activeModule.id}`}
                  className="w-full bg-white text-[#1A1A1A] border border-[#1A1A1A]/15 rounded p-2.5 text-xs font-mono h-24 focus:ring-1 focus:ring-[#8C2F39]/20 focus:outline-none focus:border-[#8C2F39]"
                  value={draftedContent[activeModule.id] || ''}
                  onChange={(e) => handleUpdateDraft(activeModule.id, e.target.value)}
                  placeholder="请输入您的详细机制设计，例如流民起义的领袖解锁、地缘战略卡牌或多边抗衡参数..."
                />
                <span className="text-[9px] text-[#1A1A1A]/50 italic block font-mono">编修的条目将自动合并入顶部的 TEXT GDD 卷宗内供一键导出。</span>
              </div>
            )}

            {activeModule.status === 'completed' && (
              <div className="text-xs text-[#5A5A40] bg-[#5A5A40]/5 border border-[#5A5A40]/20 p-2.5 rounded font-mono font-bold">
                ✓ 核心底盘已于前朝定案。您可以在“朝堂局模拟”、“战役推演模拟”等多边局势模拟器内直接交互推演其底层算法和公式行为。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
