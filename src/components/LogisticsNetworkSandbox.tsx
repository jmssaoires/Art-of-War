import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Compass, MapPin, Send, AlertTriangle, ShieldCheck, Activity, Brain, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface GraphNode {
  id: string;
  name: string;
  type: 'capital' | 'city' | 'pass';
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  isCut: boolean;
}

interface Army {
  name: string;
  location: string;
  morale: number;
  state: string;
}

const INITIAL_NODES: GraphNode[] = [
  { id: 'capital', name: '大本营', type: 'capital', x: 10, y: 50 },
  { id: 'luoyang', name: '洛阳', type: 'city', x: 45, y: 20 },
  { id: 'xuchang', name: '许昌', type: 'city', x: 45, y: 80 },
  { id: 'hulaoguan', name: '虎牢关', type: 'pass', x: 80, y: 50 },
];

const INITIAL_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'capital', target: 'luoyang', isCut: false },
  { id: 'e2', source: 'luoyang', target: 'hulaoguan', isCut: false },
  { id: 'e3', source: 'capital', target: 'xuchang', isCut: false },
  { id: 'e4', source: 'xuchang', target: 'hulaoguan', isCut: false },
];

const GENERALS = [
  { id: 'zhangfei', name: '张飞', traits: ['暴躁', '贪功', '万人敌'], avatar: '🗡️' },
  { id: 'zhugeliang', name: '大司马', traits: ['谨慎', '多疑', '算无遗策'], avatar: '🪭' },
  { id: 'caoren', name: '曹仁', traits: ['防守大师', '沉稳', '擅守'], avatar: '🛡️' },
];

export default function LogisticsNetworkSandbox() {
  const [nodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [army, setArmy] = useState<Army>({ name: '前锋营', location: 'hulaoguan', morale: 100, state: '🟢 战意高昂' });
  
  const [selectedGeneral, setSelectedGeneral] = useState(GENERALS[0].id);
  const [selectedNode, setSelectedNode] = useState('xuchang');
  const [intentInput, setIntentInput] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [combatLogs, setCombatLogs] = useState<string[]>([
    '【系统】地网连通性引擎构建完毕。大军驻扎虎牢关，凭洛阳、许昌双线补给。',
    '【指令】请选择将领与目标节点，输入战略意图（如“派遣轻骑切断许昌粮道”）。'
  ]);

  const turnCount = useRef(1);

  // --- BFS Graph Logic ---
  const isConnected = (startId: string, targetId: string, currentEdges: GraphEdge[]) => {
    if (startId === targetId) return true;
    
    // Build adjacency list
    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.id, []));
    
    currentEdges.forEach(e => {
      if (!e.isCut) {
        adj.get(e.source)?.push(e.target);
        adj.get(e.target)?.push(e.source);
      }
    });

    const visited = new Set<string>();
    const queue: string[] = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) return true;
      
      const neighbors = adj.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return false;
  };

  const executeTurn = async () => {
    if (!intentInput.trim()) return;
    
    setIsProcessing(true);
    try {
      sfx.playMagic();
      
      const general = GENERALS.find(g => g.id === selectedGeneral)!;
      const targetNodeObj = nodes.find(n => n.id === selectedNode)!;
      
      // 1. Send intent to backend
      const response = await fetch('/api/sandbox/logistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentInput,
          generalName: general.name,
          generalTraits: general.traits.join('、'),
          targetNodeName: targetNodeObj.name,
          activeEdgesInfo: edges.filter(e => !e.isCut).map(e => `${nodes.find(n=>n.id===e.source)?.name}-${nodes.find(n=>n.id===e.target)?.name}`).join(', ')
        })
      });

      if (!response.ok) {
        throw new Error('AI Server responded with an error');
      }

      const result = await response.json();
      const narrative = result.narrative || `将领${general.name}执行了指令。`;
      const edgesToCut: string[] = result.edgesToCut || [];

      // Update Edges based on AI decision
      let nextEdges = [...edges];
      let didCut = false;
      if (edgesToCut.length > 0) {
        nextEdges = edges.map(e => edgesToCut.includes(e.id) ? { ...e, isCut: true } : e);
        didCut = true;
        sfx.playSword();
      }

      setEdges(nextEdges);

      // Check BFS Connectivity to Capital
      const supplied = isConnected(army.location, 'capital', nextEdges);
      
      // State Machine for Morale
      let nextMorale = army.morale;
      let nextState = army.state;
      let supplyStatusStr = "✅ 畅通";

      if (supplied) {
        nextMorale = Math.min(100, nextMorale + 10);
        if (nextMorale > 60) nextState = "🟢 战意高昂";
        else nextState = "🟡 军心未定";
      } else {
        nextMorale -= 35;
        supplyStatusStr = "❌ 断绝";
        sfx.playImpact();
        if (nextMorale <= 0) {
          nextMorale = 0;
          nextState = "⚫ 彻底溃散 (失去控制)";
        } else if (nextMorale <= 30) {
          nextState = "🔴 极度恐慌 (逃跑边沿)";
        } else if (nextMorale <= 70) {
          nextState = "🟡 军心动摇 (战力下降)";
        }
      }

      setArmy({ ...army, morale: nextMorale, state: nextState });

      // Build Log
      const turnLog = [
        `【第${turnCount.current}回合】指令：将领${general.name}前往${targetNodeObj.name}，意图：“${intentInput}”`,
        `【战报】${narrative}`,
        `【后勤引擎-BFS巡检】大本营连接前线：${supplyStatusStr}`,
        `【将领状态机】士气值：${nextMorale} | 状态：${nextState}`
      ];

      setCombatLogs(prev => [...turnLog, ...prev]);
      setIntentInput('');
      turnCount.current += 1;

    } catch (err) {
      console.error(err);
      setCombatLogs(prev => ['⚠️ 系统AI演算受到天外陨石干扰，请重试。', ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Top Section: Visualization & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Mechanics Graph Vision */}
        <div className="bg-[#121110] border border-[#C5A059]/30 rounded-lg p-6 shadow-2xl relative min-h-[300px] overflow-hidden flex items-center justify-center">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-black/50 p-2 rounded border border-stone-800">
             <Brain className="w-5 h-5 text-amber-500" />
             <span className="text-amber-300 font-serif font-black text-sm tracking-widest">地网连通性引擎 (BFS)</span>
          </div>

          <div className="relative w-full max-w-sm aspect-square bg-[#0a0a0a] border border-stone-800 rounded-xl overflow-hidden shadow-inner">
            {/* Draw Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="supplyLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C5A059" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source)!;
                const targetNode = nodes.find(n => n.id === edge.target)!;
                return (
                  <g key={edge.id}>
                    <line 
                      x1={`${sourceNode.x}%`} 
                      y1={`${sourceNode.y}%`} 
                      x2={`${targetNode.x}%`} 
                      y2={`${targetNode.y}%`}
                      stroke={edge.isCut ? '#EF4444' : 'url(#supplyLine)'}
                      strokeWidth={edge.isCut ? 1 : 3}
                      strokeDasharray={edge.isCut ? '4 4' : 'none'}
                      className="transition-all duration-500"
                    />
                    {!edge.isCut && (
                       <circle r="2" fill="#fff" className="animate-ping">
                          <animateMotion dur="2s" repeatCount="indefinite" path={`M${(sourceNode.x) * 3}, ${(sourceNode.y) * 3} L${(targetNode.x) * 3}, ${(targetNode.y) * 3}`} />
                       </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Draw Nodes */}
            {nodes.map(node => (
              <motion.div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-serif font-black text-xs shadow-lg ${
                  node.type === 'capital' ? 'bg-[#8C2F39] border-amber-400 text-white z-20' :
                  node.type === 'pass' ? 'bg-stone-800 border-amber-500 text-amber-200 z-10' :
                  'bg-stone-700 border-stone-400 text-stone-200'
                }`}>
                  {node.name.substring(0,2)}
                </div>
                {node.id === army.location && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3 bg-emerald-600 text-white text-[8px] px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-emerald-400 font-bold"
                  >
                    🚩 驻防主力
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Status Panel */}
        <div className="bg-[#161514] border border-[#C5A059]/30 rounded-lg p-6 flex flex-col space-y-4 shadow-xl">
          <h3 className="text-amber-500 font-serif font-black text-lg border-b border-amber-500/20 pb-2 flex items-center gap-2">
            <Activity className="w-5 h-5" /> 军队状态机流转
          </h3>
          
          <div className="flex-1 flex flex-col justify-center space-y-6 px-4">
             <div className="space-y-2">
               <div className="flex justify-between text-xs font-mono font-bold text-stone-400">
                 <span>驻防编制：前锋营</span>
                 <span className="text-amber-200">{army.state}</span>
               </div>
               {/* Morale Bar */}
               <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-700 relative">
                 <motion.div 
                   className={`h-full ${army.morale > 50 ? 'bg-emerald-500' : army.morale > 20 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'}`}
                   initial={{ width: '100%' }}
                   animate={{ width: `${army.morale}%` }}
                   transition={{ duration: 0.5 }}
                 />
                 <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black mix-blend-difference text-white">
                   士气值 {army.morale} / 100
                 </span>
               </div>
               <p className="text-[10px] text-stone-500 font-serif ldaing-relaxed">
                 <ShieldAlert className="inline w-3 h-3 text-amber-500" /> 断粮会导致士气暴跌（-35/回合）。若无法维系连通，军队将逐渐陷入恐慌甚至哗变逃逸。
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Command Input & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[350px]">
        
        {/* Command Form */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#1b1a19] to-[#121110] border border-stone-800 rounded-lg p-6 shadow-xl flex flex-col space-y-5">
           <h3 className="text-stone-300 font-serif font-bold text-sm tracking-widest uppercase border-b border-stone-800 pb-2">
             下达宏观意图
           </h3>

           <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-xs text-amber-500/80 font-bold">1. 拔擢将领 (AI Agent)</label>
               <select 
                 value={selectedGeneral}
                 onChange={(e) => setSelectedGeneral(e.target.value)}
                 className="w-full bg-stone-950 border border-stone-800 text-stone-300 p-2.5 rounded text-sm outline-none focus:border-amber-500/50"
               >
                 {GENERALS.map(g => (
                   <option key={g.id} value={g.id}>{g.avatar} {g.name} (性格: {g.traits.join(',')})</option>
                 ))}
               </select>
             </div>

             <div className="space-y-1.5">
               <label className="text-xs text-amber-500/80 font-bold">2. 剑指地网节点</label>
               <select 
                 value={selectedNode}
                 onChange={(e) => setSelectedNode(e.target.value)}
                 className="w-full bg-stone-950 border border-stone-800 text-stone-300 p-2.5 rounded text-sm outline-none focus:border-amber-500/50"
               >
                 <option value="xuchang">许昌 (中原粮道枢纽)</option>
                 <option value="luoyang">洛阳 (西京重镇)</option>
                 <option value="hulaoguan">虎牢关 (雄关险隘)</option>
               </select>
             </div>

             <div className="space-y-1.5 flex-1 flex flex-col">
               <label className="text-xs text-amber-500/80 font-bold flex justify-between">
                 3. 自然语言意图 (Prompt)
               </label>
               <textarea 
                 value={intentInput}
                 onChange={(e) => setIntentInput(e.target.value)}
                 placeholder="例如：率轻骑深夜绕后，奇袭烧毁粮仓；或严查入城关防，固守待援..."
                 className="w-full flex-1 min-h-[100px] bg-stone-950 border border-stone-800 text-stone-200 p-3 rounded text-sm outline-none focus:border-amber-500/50 font-serif resize-none"
               />
               <p className="text-[10px] text-stone-500">
                 * 大模型裁判会根据指令与将领性格，实时演算物理碰撞反馈与粮道连通性结果。
               </p>
             </div>
           </div>

           <button
             onClick={executeTurn}
             disabled={isProcessing || !intentInput.trim() || army.morale <= 0}
             className="w-full py-3 bg-[#8C2F39] hover:bg-[#a5323f] disabled:bg-stone-800 disabled:text-stone-500 text-amber-100 font-serif font-black flex justify-center items-center gap-2 rounded transition-all shadow-md active:scale-95"
           >
             {isProcessing ? (
               <span className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin"></span>
             ) : (
               <Send className="w-4 h-4" /> 
             )}
             {isProcessing ? '大模型沙盘演算中...' : '提交回合演算'}
           </button>
        </div>

        {/* Combat Logs Terminal */}
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-stone-800 rounded-lg p-0 shadow-2xl relative flex flex-col overflow-hidden">
          <div className="bg-stone-900 border-b border-stone-800 p-3 flex justify-between items-center z-10">
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Dungeon Master (LLM) 战报反馈流
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] leading-relaxed scroll-smooth flex flex-col-reverse">
             {combatLogs.map((log, idx) => {
                let color = "text-stone-400";
                if (log.includes("【回合】") || log.includes("【第")) color = "text-cyan-400 font-bold border-t border-stone-800 pt-3 mt-1";
                if (log.includes("战报")) color = "text-amber-300 font-serif";
                if (log.includes("断绝") || log.includes("溃散") || log.includes("⚠️")) color = "text-red-400 font-bold bg-red-950/20 px-1 py-0.5 rounded";
                if (log.includes("畅通") || log.includes("高昂")) color = "text-emerald-400";
                
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={color}
                  >
                    {log}
                  </motion.div>
                )
             })}
          </div>
        </div>

      </div>
    </div>
  );
}
