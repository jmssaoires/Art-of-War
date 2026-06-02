import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  Coins, 
  ShieldAlert, 
  GitCommit, 
  HelpCircle, 
  Landmark, 
  CheckCircle, 
  UserPlus, 
  Plus, 
  History, 
  Sparkles, 
  Flame, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

export interface DynastyPoint {
  id: string;
  year: number;
  mandate: number; // 0 - 100
  stability: number; // 0 - 100
  coffers: number;
  title: string;
  desc: string;
  type: 'historical' | 'player_decision';
  impact: string;
}

const DEFAULT_POINTS: DynastyPoint[] = [
  {
    id: 'ascension',
    year: 1,
    mandate: 78,
    stability: 82,
    coffers: 45000,
    title: '新皇大赦登基',
    desc: '幼主嗣位临朝，相国兼秉中枢大务。朝野臣民引颈期治，海内清晏。',
    type: 'historical',
    impact: '开国基准值配置：天命与稳定皆处于盛世平衡点。'
  },
  {
    id: 'flood',
    year: 2,
    mandate: 65,
    stability: 70,
    coffers: 38000,
    title: '两河洪涝饥馑',
    desc: '大河决堤溃口六郡，良田倾圮万顷。流民饿殍，谷价暴涨，饥荒连绵。',
    type: 'historical',
    impact: '天命 -13, 国势安定 -12, 大司农调拨太仓赈济损耗 7000 贯官银'
  },
  {
    id: 'tax_emergency',
    year: 3,
    mandate: 48,
    stability: 56,
    coffers: 63000,
    title: '辽东军费急加征',
    desc: '敌酋大举寇关，兵部告急。户部迫于军情，颁布特令对天下田亩加征临时新饷。',
    type: 'historical',
    impact: '天命 -17, 安定 -14, 税入暴涨 +25000 贯（民穷财尽，危机潜伏）'
  },
  {
    id: 'purge_court',
    year: 4,
    mandate: 68,
    stability: 72,
    coffers: 51000,
    title: '铁面清洗奸冒',
    desc: '中枢雷霆整顿吏治，枭首侵吞边粮、侵夺农田、勾结豪右之贪污大员十数员。',
    type: 'historical',
    impact: '天命 +20, 安定 +16, 充抄贼赃没入国库备用 +12000 贯'
  },
  {
    id: 'famine_solved',
    year: 5,
    mandate: 78,
    stability: 82,
    coffers: 45000,
    title: '太仓平价粜米',
    desc: '相国顶住豪强干预，强令开常平仓出陈粟平籴，遏制高利利钱。流民大解。',
    type: 'historical',
    impact: '天命 +10, 安定 +10, 调拨溢折国库支出 6000 贯（常平良策成效）'
  }
];

export default function DynastyTimeline({ 
  dynastyStats,
  onSyncState 
}: { 
  dynastyStats?: { mandate: number; stability: number; coffers: number };
  onSyncState?: (stats: { mandate: number; stability: number; coffers: number }) => void 
}) {
  const [data, setData] = useState<DynastyPoint[]>(DEFAULT_POINTS);
  const [selectedPoint, setSelectedPoint] = useState<DynastyPoint | null>(null);
  const [activeDecisionLog, setActiveDecisionLog] = useState<string>('📜 当前国帑完固。请施演朝廷大令，拨乱治策，考量对天命社稷的深远震荡。');
  
  // Controls
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize selected point to the last one when data changes
  useEffect(() => {
    if (data.length > 0) {
      setSelectedPoint(data[data.length - 1]);
    }
  }, [data.length]);

  // Sync back to App on initialization or modification
  useEffect(() => {
    if (onSyncState && data.length > 0) {
      const last = data[data.length - 1];
      onSyncState({
        mandate: last.mandate,
        stability: last.stability,
        coffers: last.coffers
      });
    }
  }, [data]);

  // Handle D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Reset element
    d3.select(svgRef.current).selectAll('*').remove();

    // Measure parent container width
    const margin = { top: 40, right: 40, bottom: 50, left: 50 };
    const containerWidth = containerRef.current ? containerRef.current.clientWidth : 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', 300)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add subtle shadow defs for glow curves
    const defs = svg.append('defs');
    
    // Mandate Glow filter
    const mandateGlow = defs.append('filter')
      .attr('id', 'mandate-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    mandateGlow.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    mandateGlow.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Stability Glow filter
    const stabilityGlow = defs.append('filter')
      .attr('id', 'stability-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    stabilityGlow.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    stabilityGlow.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Scales
    const maxYear = Math.max(8, ...data.map(d => d.year));
    const x = d3.scaleLinear()
      .domain([1, maxYear])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Gridlines for premium design touch
    const gridG = svg.append('g').attr('class', 'grid-lines').attr('opacity', 0.15);

    // Horizontal gridlines
    gridG.selectAll('.horiz-line')
      .data([20, 40, 60, 80, 100])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '3,3');

    // Vertical gridlines aligned with year nodes
    gridG.selectAll('.vert-line')
      .data(data)
      .enter()
      .append('line')
      .attr('x1', (d: any) => x(d.year))
      .attr('x2', (d: any) => x(d.year))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '2,2');

    // Critical Threshold Band (Danger Zone < 40%)
    svg.append('rect')
      .attr('x', 0)
      .attr('width', width)
      .attr('y', y(40))
      .attr('height', y(0) - y(40))
      .attr('fill', '#8C2F39')
      .attr('opacity', 0.04)
      .attr('pointer-events', 'none');

    svg.append('text')
      .attr('x', 15)
      .attr('y', y(15))
      .attr('fill', '#8C2F39')
      .attr('font-size', '8px')
      .attr('font-family', 'sans-serif')
      .attr('font-weight', 'bold')
      .attr('opacity', 0.5)
      .text('⚠️ 倾覆禁区 (Rebellion Danger Zone < 40%)');

    // Axes
    const xAxis = d3.axisBottom(x)
      .ticks(Math.max(5, data.length))
      .tickFormat(d => `大禔 ${d} 年`);

    const yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#1A1A1A')
      .attr('font-size', '9px')
      .attr('font-family', 'serif');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#1A1A1A')
      .attr('font-size', '9px')
      .attr('font-family', 'sans-serif');

    // Style the axis domain paths
    svg.selectAll('.x-axis path, .y-axis path')
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 1.2);

    svg.selectAll('.x-axis line, .y-axis line')
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 0.8);

    // Mandate line and area
    const mandateLine = d3.line<DynastyPoint>()
      .x(d => x(d.year))
      .y(d => y(d.mandate))
      .curve(d3.curveMonotoneX);

    const mandateArea = d3.area<DynastyPoint>()
      .x(d => x(d.year))
      .y0(y(0))
      .y1(d => y(d.mandate))
      .curve(d3.curveMonotoneX);

    // Stability line and area
    const stabilityLine = d3.line<DynastyPoint>()
      .x(d => x(d.year))
      .y(d => y(d.stability))
      .curve(d3.curveMonotoneX);

    // Draw area under Mandate path for volumetric beauty
    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#mandate-gradient)')
      .attr('d', mandateArea)
      .attr('opacity', 0.08)
      .attr('pointer-events', 'none');

    // Gradient definitions inside defs
    const mandateGrad = defs.append('linearGradient')
      .attr('id', 'mandate-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    mandateGrad.append('stop').attr('offset', '0%').attr('stop-color', '#D97706').attr('stop-opacity', 0.6);
    mandateGrad.append('stop').attr('offset', '100%').attr('stop-color', '#D97706').attr('stop-opacity', 0.0);

    // Draw Mandate Line (Amber Gold)
    const mandatePath = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#D97706')
      .attr('stroke-width', 2.5)
      .attr('d', mandateLine)
      .attr('filter', 'url(#mandate-glow)')
      .attr('stroke-linecap', 'round');

    // Draw Stability Line (Teal Emerald)
    const stabilityPath = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#0D9488')
      .attr('stroke-width', 2.5)
      .attr('d', stabilityLine)
      .attr('filter', 'url(#stability-glow)')
      .attr('stroke-linecap', 'round');

    // Add length transition for lines to look majestic
    const totalLengthM = mandatePath.node()?.getTotalLength() || 0;
    const totalLengthS = stabilityPath.node()?.getTotalLength() || 0;

    mandatePath
      .attr('stroke-dasharray', `${totalLengthM} ${totalLengthM}`)
      .attr('stroke-dashoffset', totalLengthM)
      .transition()
      .duration(800)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0);

    stabilityPath
      .attr('stroke-dasharray', `${totalLengthS} ${totalLengthS}`)
      .attr('stroke-dashoffset', totalLengthS)
      .transition()
      .duration(800)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0);

    // Interactive Circle Nodes (Mandate Point circles)
    svg.selectAll('.mandate-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'mandate-dot')
      .attr('cx', (d: any) => x(d.year))
      .attr('cy', (d: any) => y(d.mandate))
      .attr('r', (d: any) => selectedPoint?.id === d.id ? 6.5 : 4.5)
      .attr('fill', '#FAF8F5')
      .attr('stroke', '#D97706')
      .attr('stroke-width', (d: any) => selectedPoint?.id === d.id ? 3 : 1.8)
      .attr('cursor', 'pointer')
      .style('transition', 'all 0.15s ease-in-out')
      .on('click', (event, d: any) => {
        setSelectedPoint(d);
      })
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .attr('r', 8)
          .attr('stroke-width', 3.5);
      })
      .on('mouseout', function(event, d: any) {
        const isCurrent = selectedPoint?.id === d.id;
        d3.select(this)
          .attr('r', isCurrent ? 6.5 : 4.5)
          .attr('stroke-width', isCurrent ? 3 : 1.8);
      });

    // Interactive Circle Nodes (Stability Point circles)
    svg.selectAll('.stability-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'stability-dot')
      .attr('cx', (d: any) => x(d.year))
      .attr('cy', (d: any) => y(d.stability))
      .attr('r', (d: any) => selectedPoint?.id === d.id ? 6.5 : 4.5)
      .attr('fill', '#FAF8F5')
      .attr('stroke', '#0D9488')
      .attr('stroke-width', (d: any) => selectedPoint?.id === d.id ? 3 : 1.8)
      .attr('cursor', 'pointer')
      .style('transition', 'all 0.15s ease-in-out')
      .on('click', (event, d: any) => {
        setSelectedPoint(d);
      })
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .attr('r', 8)
          .attr('stroke-width', 3.5);
      })
      .on('mouseout', function(event, d: any) {
        const isCurrent = selectedPoint?.id === d.id;
        d3.select(this)
          .attr('r', isCurrent ? 6.5 : 4.5)
          .attr('stroke-width', isCurrent ? 3 : 1.8);
      });

    // Label markers for decision points (Year label under dots)
    svg.selectAll('.decision-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'decision-label')
      .attr('x', (d: any) => x(d.year))
      .attr('y', (d: any) => Math.min(y(d.mandate), y(d.stability)) - 14)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => d.type === 'player_decision' ? '#8C2F39' : '#1A1A1A')
      .attr('font-size', '8px')
      .attr('font-weight', (d: any) => d.type === 'player_decision' ? 'black' : 'normal')
      .attr('font-family', 'serif')
      .text((d: any) => d.title.substring(0, 4));

    // Handle ResizeObserver
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth - margin.left - margin.right;
      x.range([0, newWidth]);
      
      svg.selectAll('.grid-lines line')
        .attr('x2', newWidth);
      
      // Update curves & areas
      mandatePath.attr('d', mandateLine);
      stabilityPath.attr('d', stabilityLine);
      svg.select('path[fill="url(#mandate-gradient)"]').attr('d', mandateArea);
      
      // Update axes
      svg.select('.x-axis').call(xAxis as any);
      
      // Update dots and text
      svg.selectAll('.mandate-dot').attr('cx', d => x((d as DynastyPoint).year));
      svg.selectAll('.stability-dot').attr('cx', d => x((d as DynastyPoint).year));
      svg.selectAll('.decision-label').attr('x', d => x((d as DynastyPoint).year));
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [data, selectedPoint?.id]);

  // Handle a decision clicked by user
  const applyDecision = (
    name: string, 
    mandateDelta: number, 
    stabilityDelta: number, 
    coffersDelta: number,
    desc: string,
    actionLog: string
  ) => {
    const nextYear = data.length > 0 ? (d3.max(data, (d: DynastyPoint) => d.year) as number) + 1 : 1;
    const last = data.length > 0 ? data[data.length - 1] : { mandate: 50, stability: 50, coffers: 10000 };
    
    const newMandate = Math.min(100, Math.max(0, last.mandate + mandateDelta));
    const newStability = Math.min(100, Math.max(0, last.stability + stabilityDelta));
    const newCoffers = Math.max(0, last.coffers + coffersDelta);

    const formattedImpact = `天命 ${mandateDelta >= 0 ? '+' : ''}${mandateDelta}, 安定 ${stabilityDelta >= 0 ? '+' : ''}${stabilityDelta}, 大司农 ${coffersDelta >= 0 ? '+' : ''}${coffersDelta} 贯`;

    const newPoint: DynastyPoint = {
      id: `decision-${Date.now()}`,
      year: nextYear,
      mandate: newMandate,
      stability: newStability,
      coffers: newCoffers,
      title: name,
      desc: desc,
      type: 'player_decision',
      impact: formattedImpact
    };

    const nextData = [...data, newPoint];
    setData(nextData);
    setActiveDecisionLog(`🔮 策动：${actionLog}`);
  };

  const handleResetHistory = () => {
    setData(DEFAULT_POINTS);
    setActiveDecisionLog('🔄 执政局势已回到元年，天命恢复平衡点。');
  };

  return (
    <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A]/15 rounded-lg p-4 sm:p-6 shadow-md font-sans" id="dynasty-fate-panel">
      {/* Title section with seal styling */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#8C2F39]/20 pb-4 mb-5 gap-3">
        <div className="space-y-1.5 flex-1">
          <span className="text-[10px] font-mono text-[#8C2F39] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-[#8C2F39]" />
            D3 DYNAMIC FATE CHRONICLES · 天演圣王断案
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
              社稷起伏天命总谱
            </h3>
            <span className="bg-[#8C2F39] text-[#FAF8F5] text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
              D3.js 矢量天演
            </span>
            <span className="bg-stone-100 text-stone-700 border border-stone-200 text-[9px] px-1.5 py-0.5 rounded font-sans">
              决策时空轴
            </span>
          </div>
        </div>
        
        <button
          onClick={handleResetHistory}
          className="text-stone-500 hover:text-red-700 hover:bg-red-50 font-serif border border-stone-200 bg-white hover:border-red-200 text-[10px] px-2.5 py-1.5 rounded transition shadow-3xs flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> 重置施政起点
        </button>
      </div>

      {/* Classical prologue scrolls */}
      <p className="text-[11px] font-serif text-stone-600 leading-relaxed bg-stone-100/50 border border-stone-200/60 p-3 rounded mb-5">
        荀子曰：<b>「君者，舟也；庶人者，水也。水则载舟，水则覆舟。」</b> 社稷兴替，非徒在干戈，更在钱谷之盈绌、课税之繁简。
        在下方施政大案中，您可以选择<b>【加征常税】、【强购囤粮】、【放粮出粟】</b>等圣旨大策，本页由 D3.js 矢量绘图线实时捕捉演化的<b>金色天命线 (Mandate of Heaven)</b> 与 <b>碧色安定线 (Stability)</b>，直观反映庙堂之断、如何剧烈颠簸万千生灵。
      </p>

      {/* Interactive Board Split: Left = D3 Graph, Right = Dot Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: Visual Map (8 blocks) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4" ref={containerRef}>
          <div className="bg-white rounded border border-[#1A1A1A]/10 p-3 relative overflow-hidden shadow-2xs">
            {/* Interactive watermark */}
            <div className="absolute top-2 right-2 flex items-center gap-3.5 text-slate-400 text-[10px] font-mono select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#D97706] inline-block"></span>
                <span>天命线 (Mandate)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#0D9488] inline-block"></span>
                <span>安定线 (Stability)</span>
              </div>
            </div>

            {/* SVG Visual Stage */}
            <div className="overflow-x-auto w-full">
              <svg 
                ref={svgRef} 
                className="mx-auto block select-none"
              ></svg>
            </div>

            <div className="text-[9px] text-[#1A1A1A]/50 font-mono text-center border-t border-[#1A1A1A]/5 pt-2 flex justify-between px-2">
              <span>⬅ 往年治策档案</span>
              <span>💡 在折线图中点击任意圆点 node，可在右侧阅读该大事纪疏抄 ➡</span>
            </div>
          </div>

          {/* Real-time Dispatch ticker and status logs */}
          <div className="bg-[#FAF8F5] border border-amber-800/10 p-3 rounded flex items-start gap-2.5 shadow-3xs" id="fate-announcement-ticker">
            <span className="bg-amber-600 text-[#FAF8F5] text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded whitespace-nowrap self-start mt-0.5 shadow-3xs animate-pulse">
              👑 相府急报
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-serif leading-relaxed text-[#1A1A1A]">
                {activeDecisionLog}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Detail Card (4 blocks) */}
        <div className="lg:col-span-4 flex">
          <div className="bg-white rounded border border-[#1A1A1A]/10 p-4 w-full flex flex-col justify-between shadow-2xs relative">
            
            {/* Inner background seal mark */}
            <div className="absolute top-2 right-2 text-stone-100 font-serif font-black text-6xl select-none pointer-events-none">
              考
            </div>

            <div className="space-y-4">
              <div className="border-b border-[#1A1A1A]/10 pb-2">
                <span className="text-[9px] font-mono text-[#8C2F39] font-bold block uppercase tracking-wider">
                  大事年表副本 (DIARY CARD)
                </span>
                <h4 className="text-sm font-serif font-black text-[#1A1A1A] mt-0.5">
                  {selectedPoint ? `大禔第 ${selectedPoint.year} 年 · ${selectedPoint.title}` : '未选中年份'}
                </h4>
              </div>

              {selectedPoint ? (
                <div className="space-y-3.5 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded border border-stone-200/50">
                    <span className="text-[9px] text-stone-500 font-serif block">起因及疏疏:</span>
                    <p className="text-[#1A1A1A] font-serif leading-relaxed italic mt-0.5">
                      “ {selectedPoint.desc} ”
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] text-stone-500 font-sans block uppercase tracking-wider">该年朝廷账目与指数:</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-800">
                      <div className="bg-[#D97706]/5 border border-[#D97706]/15 rounded p-1.5">
                        <span className="block text-[8px] text-stone-500 uppercase">天命</span>
                        <strong className="text-[#D97706] text-sm">{selectedPoint.mandate}%</strong>
                      </div>
                      <div className="bg-[#0D9488]/5 border border-[#0D9488]/15 rounded p-1.5">
                        <span className="block text-[8px] text-stone-500 uppercase">执政稳定</span>
                        <strong className="text-[#0D9488] text-sm">{selectedPoint.stability}%</strong>
                      </div>
                    </div>
                    <div className="bg-[#1A1A1A]/5 rounded p-1.5 flex justify-between items-center text-[10px]">
                      <span className="text-stone-500">大司农岁余 (Treasury):</span>
                      <strong className="text-emerald-950 font-bold">{selectedPoint.coffers} 贯官钱</strong>
                    </div>
                  </div>

                  <div className="bg-[#8C2F39]/5 border border-[#8C2F39]/10 p-2 rounded text-[10.5px] leading-relaxed text-[#8C2F39] font-serif">
                    <b>⚠️ 社稷折估:</b> {selectedPoint.impact}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 font-serif">
                  请选择时间轴上任意事件圆圈以便展开细读。
                </p>
              )}
            </div>

            <div className="border-t border-[#1A1A1A]/10 pt-3 mt-4 text-[9px] font-serif text-stone-500 leading-normal">
              💡 每一个新加政策都将作为下一节点并影响整体趋势，若任意数值低于 40% 将预警叛乱或倾覆！
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Policy Board: The Crucial Decisions requested (tax increases, grain hoarding, etc.) */}
      <div className="mt-6 border-t border-[#1A1A1A]/10 pt-6">
        <h4 className="text-xs font-mono font-bold text-[#8C2F39] uppercase tracking-widest mb-4 flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          御案策决局 · 皇家大策颁制 (THE IMPERIAL STATUTE MATRIX)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="imperial-decisions-grid">
          
          {/* Decision 1: Tax Increase */}
          <div className="bg-[#FAF8F5] border border-red-900/10 hover:border-red-900/30 rounded p-3.5 flex flex-col justify-between transition-all hover:shadow-xs relative overflow-hidden">
            <span className="absolute -top-4 -right-4 bg-orange-700/5 text-orange-700 text-6xl font-black font-serif select-none pointer-events-none">
              税
            </span>
            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between items-center gap-2">
                <span className="bg-red-900 text-red-50 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                  策案一
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  饷库盈充 +20000 贯
                </span>
              </div>
              <h5 className="font-serif font-black text-xs text-[#1A1A1A]">
                🌾 天下田赋加征 (General Tax Surcharge)
              </h5>
              <p className="text-[10.5px] text-stone-600 leading-relaxed font-serif">
                朝廷发布圣谕加算田息，强令各县十税其二。岁入暴增，但恐致农夫背朝远走，啸聚林莽。
              </p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-[#1A1A1A]/5 flex items-center justify-between gap-2.5">
              <span className="text-[9px] font-mono text-rose-800">
                ⚠️ 天命 -15 | 安定 -15
              </span>
              <button 
                id="apply-decision-tax"
                onClick={() => applyDecision(
                  '加征十税二',
                  -15,
                  -15,
                  20000,
                  '下诏大肆括赋。天府之国赤地千里，两河富庶亦苦征捐，民怨如山积，起义流寇苗头崭露。',
                  '【天下田赋加征】强行实装！库银狂增 20000 贯，但因竭泽而渔，天命值与朝野政纲稳定烈跌 15 点！'
                )}
                className="bg-[#8C2F39] text-[#FAF8F5] text-[10px] font-bold py-1 px-3 rounded hover:bg-[#8C2F39]/80 shadow-3xs hover:translate-y-[-0.5px] cursor-pointer transition"
              >
                中旨即准
              </button>
            </div>
          </div>

          {/* Decision 2: Grain Hoarding */}
          <div className="bg-[#FAF8F5] border border-amber-950/10 hover:border-amber-950/30 rounded p-3.5 flex flex-col justify-between transition-all hover:shadow-xs relative overflow-hidden">
            <span className="absolute -top-4 -right-4 bg-amber-800/5 text-amber-800 text-6xl font-black font-serif select-none pointer-events-none">
              囤
            </span>
            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between items-center gap-2">
                <span className="bg-amber-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                  策案二
                </span>
                <span className="text-[10px] font-mono text-[#0D9488]/80 font-bold">
                  政局稳固 +18%
                </span>
              </div>
              <h5 className="font-serif font-black text-xs text-[#1A1A1A]">
                🍚 强制抑压平籴 grain (State Grain Hoarding)
              </h5>
              <p className="text-[10.5px] text-stone-600 leading-relaxed font-serif">
                官仓广购商家粮谷，强行平低粮价收囤入皇家瓮堆，有备无患抗御未来大旱，但大损粮行小民生计。
              </p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-[#1A1A1A]/5 flex items-center justify-between gap-2.5">
              <span className="text-[9px] font-mono text-[#8C2F39]">
                ⚠️ 库帑 -12000 | 天命 -8
              </span>
              <button 
                id="apply-decision-hoard"
                onClick={() => applyDecision(
                  '平价强籴囤粮',
                  -8,
                  18,
                  -12000,
                  '下令太仓总监对民间米行广行平籴压买。粮仓瞬间充盈有备无患，稳定回升，但市场百业肃然，豪商怨恨。',
                  '【强制平籴囤粮】实施！虽然损耗官饷 12000 贯，并引起市商民心负折 8 点，但由于太仓饱食无忧，朝局稳定暴涨 +18 点！'
                )}
                className="bg-[#8C2F39] text-[#FAF8F5] text-[10px] font-bold py-1 px-3 rounded hover:bg-[#8C2F39]/80 shadow-3xs hover:translate-y-[-0.5px] cursor-pointer transition"
              >
                中旨即准
              </button>
            </div>
          </div>

          {/* Decision 3: Feed Public / Grain Distribution */}
          <div className="bg-[#FAF8F5] border border-teal-900/10 hover:border-teal-900/30 rounded p-3.5 flex flex-col justify-between transition-all hover:shadow-xs relative overflow-hidden">
            <span className="absolute -top-4 -right-4 bg-teal-800/5 text-teal-800 text-6xl font-black font-serif select-none pointer-events-none">
              赈
            </span>
            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between items-center gap-2">
                <span className="bg-teal-700 text-teal-50 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                  策案三
                </span>
                <span className="text-[10px] font-mono text-amber-600 font-bold">
                  万姓欢呼 +18%
                </span>
              </div>
              <h5 className="font-serif font-black text-xs text-[#1A1A1A]">
                🍲 开仓赈济开恩 (Royal Grain Distribution)
              </h5>
              <p className="text-[10.5px] text-stone-600 leading-relaxed font-serif">
                太仓开瓮，向三河、两淮饥荒郡县低价粜米，施粥收纳流民，巩固天命，但需要朝廷消耗重本帑金。
              </p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-[#1A1A1A]/5 flex items-center justify-between gap-2.5">
              <span className="text-[9px] font-mono text-emerald-800">
                ⚙️ 库帑 -15000 | 安定 +12
              </span>
              <button 
                id="apply-decision-distributegrain"
                onClick={() => applyDecision(
                  '开仓散粟赈荒',
                  18,
                  12,
                  -15000,
                  '相府斥帑银万五百两，将太仓之粮全部调运两淮施粥施药。天下大悦，“上下同欲”，天命与稳定急速飞渡。',
                  '【常平出粟赈济】即刻颁行！国帑虽削减 15000 贯，但民生大慰，海内德隆，天命强弹 18 点，执政安定上升 12 点！'
                )}
                className="bg-[#8C2F39] text-[#FAF8F5] text-[10px] font-bold py-1 px-3 rounded hover:bg-[#8C2F39]/80 shadow-3xs hover:translate-y-[-0.5px] cursor-pointer transition"
              >
                中旨即准
              </button>
            </div>
          </div>

          {/* Extra Decision 4: Conscript & Gold Pay */}
          <div className="bg-[#FAF8F5] border border-blue-900/10 hover:border-blue-900/30 rounded p-3.5 flex flex-col justify-between transition-all hover:shadow-xs relative overflow-hidden">
            <span className="absolute -top-4 -right-4 bg-blue-800/5 text-blue-800 text-6xl font-black font-serif select-none pointer-events-none">
              军
            </span>
            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between items-center gap-2">
                <span className="bg-blue-800 text-blue-50 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                  备用案
                </span>
                <span className="text-[10px] font-mono text-amber-600 font-bold">
                  天命巩固 +10%
                </span>
              </div>
              <h5 className="font-serif font-black text-xs text-[#1A1A1A]">
                ⚔️ 重振十军死士 (Conscript Elite Guards)
              </h5>
              <p className="text-[10.5px] text-stone-600 leading-relaxed font-serif">
                大发安边赏银，犒赏边关十万健卒，重赏强弩重盾，提携天子声望威慑外藩。
              </p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-[#1A1A1A]/5 flex items-center justify-between gap-2.5">
              <span className="text-[9px] font-mono text-slate-800">
                ⚙️ 库帑 -18000 | 安定 +5
              </span>
              <button 
                id="apply-decision-army"
                onClick={() => applyDecision(
                  '重饷发赐十军',
                  10,
                  5,
                  -18000,
                  '诏加三军金错！关塞重兵武库精良。诸边严守防卫一固，外寇不敢轻举武动，神州天命安息。',
                  '【犒劳边军精锐】落款！大司农削 18000 贯，得健勇虎师感恩戴德，边塞重镇极度稳固：天命 +10 点，安定度 +5 点！'
                )}
                className="bg-[#8C2F39] text-[#FAF8F5] text-[10px] font-bold py-1 px-3 rounded hover:bg-[#8C2F39]/80 shadow-3xs hover:translate-y-[-0.5px] cursor-pointer transition"
              >
                中旨即准
              </button>
            </div>
          </div>

          {/* Extra Decision 5: Devastate Clans / Purge Nobles */}
          <div className="bg-[#FAF8F5] border border-purple-900/10 hover:border-purple-900/30 rounded p-3.5 flex flex-col justify-between transition-all hover:shadow-xs relative overflow-hidden">
            <span className="absolute -top-4 -right-4 bg-purple-800/5 text-purple-800 text-6xl font-black font-serif select-none pointer-events-none">
              豪
            </span>
            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between items-center gap-2">
                <span className="bg-purple-800 text-purple-50 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">
                  备用案
                </span>
                <span className="text-[10px] font-mono text-green-700 font-bold">
                  抄家充公 +15000 贯
                </span>
              </div>
              <h5 className="font-serif font-black text-xs text-[#1A1A1A]">
                ⚖️ 抄家处决关中大豪 (Purge Counterfeiting Clans)
              </h5>
              <p className="text-[10.5px] text-stone-600 leading-relaxed font-serif">
                查抄不轨之豪族，收回强侵良田分拨贫农，获取金钱并博得兆万贫农感激，但勋贵惊惧朝纲剧振。
              </p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-[#1A1A1A]/5 flex items-center justify-between gap-2.5">
              <span className="text-[9px] font-mono text-rose-800">
                ⚠️ 天命 +8 | 安定 -12
              </span>
              <button 
                id="apply-decision-clans"
                onClick={() => applyDecision(
                  '查抄关中大豪',
                  8,
                  -12,
                  15000,
                  '相府下御史大狱，连根拔起几门欺陵百姓、偷工铜质铜币的豪门大院。万姓拍手痛快，收回沃土万顷分施，大快人心。',
                  '【抄没关中大豪】成案！夺回百余顷田地，查收财物折 15000 贯入仓。农口心欢天命增 8 点，但引廷朝特权勋爵物议震颤安定跌 12 点！'
                )}
                className="bg-[#8C2F39] text-[#FAF8F5] text-[10px] font-bold py-1 px-3 rounded hover:bg-[#8C2F39]/80 shadow-3xs hover:translate-y-[-0.5px] cursor-pointer transition"
              >
                中旨即准
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
