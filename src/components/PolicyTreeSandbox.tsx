import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Waypoints, Shield, BookOpen, Coins, CheckCircle, Lock, Crown, Zap } from 'lucide-react';
import { sfx } from '../utils/sfx';

type Category = 'admin' | 'economy' | 'military';

interface PolicyNode {
  id: string;
  name: string;
  desc: string;
  x: number;
  y: number;
  reqs: string[];
  cost: number;
  category: Category;
  icon: any;
}

const POLICY_NODES: PolicyNode[] = [
  // 行政管理 (Admin)
  { id: 'admin_1', name: '三公九卿制', desc: '早期的中央集权体制，三公分理天下，九卿分掌具体事务。', x: 150, y: 50, reqs: [], cost: 10, category: 'admin', icon: BookOpen },
  { id: 'admin_2', name: '三省六部制', desc: '确立中书、门下、尚书三省机制，分权制衡，六部执行。', x: 150, y: 180, reqs: ['admin_1'], cost: 20, category: 'admin', icon: BookOpen },
  { id: 'admin_3a', name: '内阁学士', desc: '设立内阁，由大学士票拟，集权于君主。', x: 80, y: 310, reqs: ['admin_2'], cost: 40, category: 'admin', icon: Crown },
  { id: 'admin_3b', name: '军机处', desc: '绝对君主专制巅峰，军机大臣跪受笔录。', x: 220, y: 310, reqs: ['admin_2'], cost: 50, category: 'admin', icon: Crown },

  // 经济制度 (Economy)
  { id: 'eco_1', name: '井田制/初税亩', desc: '最早的土地分配与征税机制雏形。', x: 400, y: 50, reqs: [], cost: 10, category: 'economy', icon: Coins },
  { id: 'eco_2', name: '均田制', desc: '由国家计口授田，抑制土地兼并。', x: 400, y: 180, reqs: ['eco_1'], cost: 20, category: 'economy', icon: Coins },
  { id: 'eco_3', name: '两税法', desc: '量出以为入，户无主客，以贫富为差。', x: 400, y: 310, reqs: ['eco_2'], cost: 30, category: 'economy', icon: Coins },
  { id: 'eco_4a', name: '一条鞭法', desc: '赋役合并，按亩折银缴纳。', x: 330, y: 440, reqs: ['eco_3'], cost: 40, category: 'economy', icon: Coins },
  { id: 'eco_4b', name: '摊丁入亩', desc: '彻底取消人头税，将丁银摊入田赋。', x: 470, y: 440, reqs: ['eco_3'], cost: 50, category: 'economy', icon: Coins },

  // 军事制度 (Military)
  { id: 'mil_1', name: '世兵/部曲制', desc: '军户世袭，私人部曲。兵将合一。', x: 650, y: 50, reqs: [], cost: 10, category: 'military', icon: Shield },
  { id: 'mil_2', name: '府兵制', desc: '寓兵于农，平时务农，战时出征，兵器自备。', x: 650, y: 180, reqs: ['mil_1'], cost: 20, category: 'military', icon: Shield },
  { id: 'mil_3', name: '募兵制/禁军', desc: '职业军人，国家供养，军饷开销庞大。', x: 650, y: 310, reqs: ['mil_2'], cost: 30, category: 'military', icon: Shield },
  { id: 'mil_4a', name: '卫所制', desc: '军户屯田，自给自足，但战斗力逐渐低下。', x: 580, y: 440, reqs: ['mil_3'], cost: 40, category: 'military', icon: Shield },
  { id: 'mil_4b', name: '八旗/绿营制', desc: '军民合一的军事化部落编制。', x: 720, y: 440, reqs: ['mil_3'], cost: 40, category: 'military', icon: Shield },
];

export default function PolicyTreeSandbox() {
  const [unlockedNodes, setUnlockedNodes] = useState<string[]>(['admin_1', 'eco_1', 'mil_1']);
  const [politicalPower, setPoliticalPower] = useState(100);
  const [selectedNode, setSelectedNode] = useState<PolicyNode | null>(null);

  const isUnlocked = (id: string) => unlockedNodes.includes(id);
  const isAvailable = (node: PolicyNode) => node.reqs.every(req => isUnlocked(req)) && !isUnlocked(node.id);

  const handleUnlock = (node: PolicyNode) => {
    if (!isAvailable(node)) return;
    if (politicalPower < node.cost) {
      sfx.playError?.() || sfx.playScroll();
      return;
    }
    
    sfx.playMagic();
    setPoliticalPower(prev => prev - node.cost);
    setUnlockedNodes(prev => [...prev, node.id]);
    setSelectedNode(node);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-slate-800 rounded-lg p-5 shadow-lg relative overflow-hidden flex justify-between items-center">
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none text-slate-500">
          <Waypoints size={160} />
        </div>
        <div className="z-10 relative">
          <h2 className="text-xl font-serif font-black text-slate-200 flex items-center gap-2 mb-2">
            <Waypoints className="w-6 h-6 text-slate-400" /> 王朝国策树 (方案A: 视觉节点演进)
          </h2>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            借鉴 <span className="text-slate-300 font-bold">Hearts of Iron 4 / Victoria 3</span> 的国策树设计。<br/>
            纯文字太单调？这种带有明确「前置条件」和「演化路线」的图形化界面，能带给玩家极强的成长的「解锁快感」与规划感。
          </p>
        </div>
        
        <div className="z-10 bg-slate-950/80 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 shadow-inner">
          <Zap className="w-8 h-8 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono">政治点数 (Political Power)</span>
            <span className="text-2xl font-black text-amber-400">{politicalPower} <span className="text-sm font-normal text-slate-500">+10/年</span></span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Detail Panel */}
        <div className="lg:col-span-1 bg-[#1A1E24] border border-slate-800 rounded-lg p-6 flex flex-col items-center justify-start relative shadow-xl overflow-y-auto">
           {selectedNode ? (
             <motion.div 
               key={selectedNode.id}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="w-full flex flex-col h-full"
             >
                <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-slate-800 mb-6 w-full">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center mb-4 shadow-lg">
                      <selectedNode.icon className="w-8 h-8 text-slate-300" />
                   </div>
                   <h3 className="text-xl font-serif font-black text-slate-200">{selectedNode.name}</h3>
                   <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 mt-2">
                     类别：{selectedNode.category === 'admin' ? '中枢内政' : selectedNode.category === 'economy' ? '经济税收' : '军备兵役'}
                   </span>
                </div>
                
                <p className="text-sm text-slate-400 leading-relaxed font-serif mb-6 flex-1">
                  {selectedNode.desc}
                </p>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">状态与花费</h4>
                  {isUnlocked(selectedNode.id) ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-950/20 p-2 rounded">
                      <CheckCircle className="w-4 h-4" /> 已颁布推行
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-sm font-mono text-amber-500">
                        <span>解锁花费:</span>
                        <span className="font-bold">{selectedNode.cost} PPT</span>
                      </div>
                      {!isAvailable(selectedNode) && (
                         <div className="text-xs text-red-400/80 mt-2 bg-red-950/20 p-2 rounded border border-red-900/30">
                           前置国策未解锁！
                         </div>
                      )}
                    </>
                  )}
                </div>

                {!isUnlocked(selectedNode.id) && (
                  <button
                    onClick={() => handleUnlock(selectedNode)}
                    disabled={!isAvailable(selectedNode) || politicalPower < selectedNode.cost}
                    className="w-full py-4 rounded font-serif font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-200 text-slate-900 hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    {!isAvailable(selectedNode) ? <Lock className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    {isAvailable(selectedNode) ? (politicalPower >= selectedNode.cost ? '颁布国策' : '点数不足') : '未满足条件'}
                  </button>
                )}
             </motion.div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50 space-y-4 text-center">
               <Waypoints className="w-16 h-16" />
               <p className="text-sm font-serif">请在右侧选择一项目标国策</p>
             </div>
           )}
        </div>

        {/* Tree Canvas */}
        <div className="lg:col-span-3 bg-[#0B0F19] rounded-lg border border-slate-800 overflow-auto relative shadow-inner min-h-[500px]">
          {/* Background Grid Lines for aesthetic */}
          <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="w-[900px] h-[600px] relative p-10 mt-10 ml-10 z-10">
            {/* Draw Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
               {POLICY_NODES.map(node => (
                 node.reqs.map(reqId => {
                   const rNode = POLICY_NODES.find(n => n.id === reqId);
                   if (!rNode) return null;
                   
                   // Draw path from rNode to node
                   // Add 32 to x and y to align with the center of the 64x64 node div
                   const startX = rNode.x + 32;
                   const startY = rNode.y + 64;
                   const endX = node.x + 32;
                   const endY = node.y;

                   const isLineUnlocked = isUnlocked(node.id);
                   const isLineAvailable = isUnlocked(rNode.id) && !isUnlocked(node.id);

                   return (
                     <path 
                       key={`${rNode.id}-${node.id}`} 
                       d={`M ${startX} ${startY} L ${endX} ${endY}`} 
                       fill="none" 
                       stroke={isLineUnlocked ? "#34D399" : isLineAvailable ? "#64748B" : "#1E293B"} 
                       strokeWidth={isLineUnlocked ? "3" : "2"}
                       strokeDasharray={isLineAvailable ? "5,5" : "0"}
                     />
                   );
                 })
               ))}
            </svg>

            {/* Draw Nodes */}
            {POLICY_NODES.map(node => {
              const unlocked = isUnlocked(node.id);
              const available = isAvailable(node);
              const selected = selectedNode?.id === node.id;

              return (
                <div 
                  key={node.id}
                  onClick={() => {
                    sfx.playImpact?.();
                    setSelectedNode(node);
                  }}
                  className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 z-10 group
                    ${selected ? 'ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : ''}
                    ${unlocked ? 'bg-gradient-to-br from-emerald-800 to-slate-900 border-2 border-emerald-500' : 
                      available ? 'bg-slate-800 border-2 border-slate-500 hover:border-slate-400' : 
                      'bg-slate-900/50 border border-slate-800 opacity-60'}
                  `}
                  style={{ left: node.x, top: node.y }}
                >
                  <node.icon className={`w-6 h-6 ${unlocked ? 'text-emerald-300' : available ? 'text-slate-300' : 'text-slate-600'}`} />
                  
                  {/* Tooltip Overlay */}
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-32 bg-slate-900 text-center text-xs py-1.5 px-2 rounded border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none font-bold text-slate-300 z-50">
                    {node.name}
                  </div>
                  {unlocked && (
                     <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0B0F19]">
                       <CheckCircle className="w-3 h-3 text-[#0B0F19]" />
                     </div>
                  )}
                  {!unlocked && !available && (
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0B0F19]">
                      <Lock className="w-3 h-3 text-slate-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
