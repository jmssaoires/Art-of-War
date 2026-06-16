/**
 * UnitCard — 兵牌卡片组件
 *
 * Replaces raw SVG circles in WeiJiuZhaoScenario.
 * Inspired by Total War: Three Kingdoms unit cards and HOI4 division counters.
 *
 * Each card shows: faction badge, name, troop bar, supply bar, morale bar,
 * isFake indicator, routed overlay, selection highlight.
 */

import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Swords, Shield, Wheat, Heart, EyeOff, AlertTriangle } from 'lucide-react';
import type { UnifiedUnit } from '../types';

export interface UnitCardProps {
  unit: UnifiedUnit;
  isSelected: boolean;
  isEnemyView: boolean;   // true if viewing from opposing faction
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Pixel position on the map overlay */
  x: number;
  y: number;
  /** Map mode for color coding */
  mapMode?: 'default' | 'supply' | 'morale' | 'territory';
}

const UnitCard = memo(function UnitCard({
  unit,
  isSelected,
  isEnemyView,
  onClick,
  onContextMenu,
  x,
  y,
  mapMode = 'default',
}: UnitCardProps) {
  const isAllied = unit.side === 'allied';
  const isFake = unit.isFake;
  const isRouted = unit.isRouted;
  const isDestroyed = unit.isDestroyed;

  // What the viewer sees
  const displaySize = (isEnemyView && isFake)
    ? (unit.fakeDisguiseAsSize ?? unit.size)
    : unit.size;
  const displayName = (isEnemyView && isFake)
    ? (unit.fakeDisguiseAsName ?? unit.name)
    : unit.name;

  // Bar calculations
  const moralePct = unit.morale;
  const supplyPct = unit.provisions;
  const moraleColor = moralePct >= 80 ? '#10b981'
    : moralePct >= 40 ? '#f59e0b'
    : '#ef4444';
  const supplyColor = supplyPct >= 50 ? '#4a7c4f'
    : supplyPct >= 20 ? '#b88a44'
    : '#c43a31';

  // Faction colors
  const factionColor = isAllied ? '#4a7c4f' : '#c43a31';
  const factionBg = isAllied ? 'rgba(74,124,79,0.15)' : 'rgba(196,58,49,0.15)';
  const factionBorder = isAllied ? 'rgba(74,124,79,0.5)' : 'rgba(196,58,49,0.5)';

  if (isDestroyed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isRouted ? 0.5 : 1,
        scale: isSelected ? 1.08 : 1,
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`absolute pointer-events-auto cursor-pointer select-none`}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 50 : 10,
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={`${displayName} — ${displaySize.toLocaleString()}人`}
    >
      {/* ── Selection ring ── */}
      {isSelected && (
        <motion.div
          layoutId="selection-ring"
          className="absolute -inset-2 rounded-lg border-2 border-[var(--accent-gold)] shadow-[0_0_12px_rgba(197,160,89,0.4)]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* ── Card body ── */}
      <div
        className="relative flex flex-col rounded-md overflow-hidden shadow-lg border"
        style={{
          minWidth: 96,
          maxWidth: 120,
          backgroundColor: isSelected ? 'var(--rice-light)' : 'var(--rice)',
          borderColor: isSelected ? 'var(--accent-gold)' : isFake ? 'rgba(124,58,237,0.5)' : factionBorder,
        }}
      >
        {/* ── Header: faction badge + name ── */}
        <div
          className="flex items-center gap-1 px-2 py-1"
          style={{ background: factionBg }}
        >
          <div
            className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black text-white flex-shrink-0"
            style={{ background: factionColor }}
          >
            {isAllied ? '齐' : '魏'}
          </div>
          <span
            className="text-[10px] font-serif font-bold truncate leading-tight"
            style={{ color: isAllied ? 'var(--accent-jade)' : 'var(--seal-red)' }}
          >
            {displayName}
          </span>
          {/* isFake indicator */}
          {isFake && !isEnemyView && (
            <EyeOff className="w-3 h-3 text-purple-400 flex-shrink-0" />
          )}
          {isFake && isEnemyView && (
            <span className="text-[7px] text-purple-400 flex-shrink-0">?</span>
          )}
          {/* Routed indicator */}
          {isRouted && (
            <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse flex-shrink-0" />
          )}
        </div>

        {/* ── Troop number ── */}
        <div className="px-2 pt-1 flex items-baseline gap-0.5">
          <Swords className="w-2.5 h-2.5 opacity-40" style={{ color: 'var(--ink)' }} />
          <span
            className="text-xs font-mono font-bold tabular-nums"
            style={{
              color: isFake && isEnemyView ? 'var(--map-deception)' : 'var(--ink)',
              fontSize: isFake && isEnemyView ? 11 : 10,
            }}
          >
            {isFake && isEnemyView ? '?' : ''}{displaySize.toLocaleString()}
          </span>
        </div>

        {/* ── Supply bar ── */}
        <div className="px-2 py-0.5 flex items-center gap-1">
          <Wheat className="w-2 h-2 opacity-40 flex-shrink-0" style={{ color: 'var(--ink)' }} />
          <div className="flex-1 h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: supplyColor }}
              initial={{ width: 0 }}
              animate={{ width: `${supplyPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* ── Morale bar ── */}
        <div className="px-2 pb-1 flex items-center gap-1">
          <Heart className="w-2 h-2 opacity-40 flex-shrink-0" style={{ color: 'var(--ink)' }} />
          <div className="flex-1 h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: moraleColor }}
              initial={{ width: 0 }}
              animate={{ width: `${moralePct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* ── Size power indicator (attack/defense) ── */}
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-2 pb-1 flex gap-2 text-[8px] font-mono border-t"
            style={{ borderColor: 'var(--wash-border)' }}
          >
            <span style={{ color: 'var(--seal-red)' }}>攻{unit.attackPower}</span>
            <span style={{ color: 'var(--accent-cyan)' }}>防{unit.defensePower}</span>
          </motion.div>
        )}
      </div>

      {/* ── Map mode overlay (supply heatmap) ── */}
      {mapMode === 'supply' && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full"
          style={{ background: supplyColor, opacity: 0.8 }}
        />
      )}
      {mapMode === 'morale' && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full"
          style={{ background: moraleColor, opacity: 0.8 }}
        />
      )}
    </motion.div>
  );
});

export default UnitCard;
