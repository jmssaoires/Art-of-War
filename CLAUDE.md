# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Art of War - 游戏架构与核心设计文档

## Commands

```bash
npm run dev       # Start dev server (Express + Vite HMR) on port 3000
npm run build     # Build client (vite) + bundle server (esbuild → dist/server.cjs)
npm run start     # Run production build
npm run lint      # Type-check only — no test suite exists (tsc --noEmit)
npm run clean     # Remove dist/ and server.js
```

No test framework is configured. Type safety is enforced via `npm run lint`.

## Environment

Copy `.env.example` → `.env`. Required keys:
- `GEMINI_API_KEY` — Gemini AI scenario analysis endpoint (`/api/gemini/analyze-scenario`)
- `APP_URL` — Base URL for the app

Firebase credentials live in `firebase-applet-config.json`. The app falls back to a mock/offline mode when Firebase is unavailable.

Admin mode is unlocked by the passcode `"suntzu666"` or `"admin"` in the UI密令 field.

## Architecture

**Stack:** React 19 + TypeScript, Vite (client), Express (server), Firebase (Auth + Firestore), Tailwind CSS 4, Framer Motion.

### Entry Points
- `src/main.tsx` → mounts `<App />` inside `<LocaleProvider>`
- `src/App.tsx` (~1600 lines) — top-level router that renders the active sandbox module
- `server.ts` — Express server; serves Vite middleware in dev, static dist/ in prod; proxies Gemini API

### Game Engine (`src/engine/`)
Four pure-function modules that are **framework-agnostic** — they accept state and return new state:
| File | Responsibility |
|---|---|
| `gameLoop.ts` | Four-phase turn cycle: DEPLOY → STRATEGIZE → RESOLVE → AFTERMATH |
| `combatEngine.ts` | Combat resolution using HP + Morale dual-track (no pure-HP-death) |
| `supplyEngine.ts` | Graph-based supply lines; cutting connectivity triggers morale collapse |
| `fogOfWar.ts` | Visibility masks + fake-unit payload injection |
| `victoryScoring.ts` | Victory condition evaluation |

### State Management (`src/context/GameEngineContext.tsx`)
Redux-style `useReducer` context. Key actions: `SET_PHASE`, `ADVANCE_TURN`, `UPDATE_UNIT`, `CUT_SUPPLY_EDGE`. All state updates are immutable.

### Sandbox Modules (`src/components/`)
Each `*Sandbox.tsx` is a self-contained interactive prototype for one game system (military, diplomacy, economy, espionage, etc.). They are loaded lazily from `App.tsx` based on the active module ID. Adding a new system = create a new `*Sandbox.tsx` and register it in `App.tsx`.

### i18n (`src/i18n/`)
- `LocaleContext.tsx` — provider wrapping the app root; persists choice to `localStorage`
- `zh.ts` / `en.ts` — flat key→string maps
- Components receive `t` (translate function) directly as a prop, **not** via `useContext` — avoids context propagation bugs.

**Language design requirement:** The game must be fully playable in either Chinese or English as a complete, standalone experience. The player selects one language at a time — **no bilingual mixed display**. Every string visible in the UI must have entries in both `zh.ts` and `en.ts`. Never hardcode Chinese or English text directly in components; always go through `t(key)`.

### Audio (`src/utils/soundManager.ts`, `src/utils/sfx.ts`)
All audio is procedural via Web Audio API oscillators (no audio files). Lazy-initialized on first user interaction to comply with browser autoplay policy.

## 1. 核心设计理念 (Core Design Philosophy: East meets West)
本项目是一款将**西方顶级策略游戏（SLG/RTS）的成熟底层架构**与**中国古代历史文化（特别是《孙子兵法》的战略思想）**深度融合的多人在线竞技游戏。
* **机制与文化的碰撞：** 以现代经典策略游戏中的空间控制、迷雾博弈、网格经济学为骨架；以《孙子兵法》中的"势"、"诡道"、"先胜而后求战"等思想为血肉，将其直接转化为可执行的代码机制，绝非简单的换皮或文案包装。
* **设计底线：** 本游戏**绝对不是**一款用于学习或科普《孙子兵法》的教育或演示软件。它必须是一个具备极高重玩价值、为玩家博弈提供**无限交互可能性**的硬核竞技沙盒。

## 2. 核心兵法机制的代码翻译 (Mechanics Translation)
我们需要在代码中用严谨的数据结构，实现中西合璧的对战概念：

* **兵者诡道也 (Deception / 对应现代游戏的进阶战争迷雾):**
  * 引入战术伪装与虚假情报机制。单位 (Unit) 需要支持 `isFake` 属性。
  * 玩家可以向对手发送虚假的视野数据包 (Fake Payloads) 来实现"声东击西"，制造猜疑链，这比传统策略游戏中"非黑即白"的视野设定更具博弈深度。
* **不战而屈人之兵 (Morale & Logistics / 对应现代游戏的供应链与溃散机制):**
  * 废弃传统的纯 HP 归零死亡机制，引入 `HP` 和 `Morale` (士气) 双轨制。
  * 地图基于网格与图论 (Graph Theory) 设计，包含补给线 (Supply Lines) 和关键地形。通过战术机动切断敌方某支部队与大营的连通性，将直接触发敌军士气雪崩的 Debuff。
