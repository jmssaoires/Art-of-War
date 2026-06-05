import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useAdvancedMarkerRef,
  useMap
} from '@vis.gl/react-google-maps';
import { 
  db, 
  auth, 
  loginAnonymously, 
  handleFirestoreError, 
  OperationType,
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  deleteDoc,
  onAuthStateChanged, 
  signInAnonymously, 
  updateProfile
} from '../firebase';
import { soundManager } from '../utils/soundManager';
import { 
  Swords, 
  Compass, 
  MapPin, 
  RotateCcw, 
  Play, 
  Check, 
  Flame, 
  ShieldAlert, 
  Sparkles, 
  Map as MapIcon, 
  KeyRound, 
  Users, 
  Award, 
  Activity, 
  ChevronRight,
  TrendingUp,
  Sliders,
  X,
  Target,
  Info
} from 'lucide-react';

// Get API Key securely as required by Google Maps Platform skill
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface Battlefield {
  id: string;
  name: string;
  dynasty: string;
  combatants: string;
  lat: number;
  lng: number;
  terrain: string; // Core Terrain type corresponding to Sun Tzu Nine Lands
  classicQuote: string;
  description: string;
  historyText: string;
}

const HISTORICAL_BATTLEFIELDS: Battlefield[] = [
  {
    id: "changping",
    name: "长平之战",
    dynasty: "战国",
    combatants: "白起 vs 赵括",
    lat: 35.7947,
    lng: 112.9238,
    terrain: "DEATH",
    classicQuote: "疾战则存，不疾战则亡，为死地。在死地则战。",
    description: "史上最大规模的围歼战，秦将白起利用狭谷地形设伏，合围赵军四十万。",
    historyText: "山西高平长平古战场。此处两山夹峙，谷深林密。白起利用赵括轻敌犯险，以两奇兵截断赵军归路及粮道，实施史上最经典的瓮中捉鳖歼灭战。"
  },
  {
    id: "maling",
    name: "马陵之战",
    dynasty: "战国",
    combatants: "孙膑 vs 庞涓",
    lat: 36.1912,
    lng: 115.8239,
    terrain: "HEAVY",
    classicQuote: "入人之地深，背城邑多者，为重地。重地则掠。",
    description: "孙膑著名的‘增兵减灶’退兵设伏妙计，于狭长通道设伏全歼魏军，庞涓自刎。",
    historyText: "马陵道两旁峭壁如刀削。孙膑算准时间，剥去大树之皮刻下‘庞涓死于此树之下’。魏军夜行举火照读瞬间，万弩齐发，一战消灭魏国精锐主力。"
  },
  {
    id: "chibi",
    name: "赤壁之战",
    dynasty: "三国",
    combatants: "周瑜/刘备 vs 曹操",
    lat: 29.8516,
    lng: 113.6214,
    terrain: "ENTRAPPING",
    classicQuote: "可以往，难以返，曰挂。彼无备，出而胜之；彼若有备，难复，不利。",
    description: "诸葛亮巧测东风，周瑜火烧连环船。联军以弱胜强，奠定三国鼎立基础。",
    historyText: "湖北赤壁长江天险。由于北方魏军大军不习水战且染疾，曹操将战船连锁成排。联军趁东南风起，派遣精锐火船冲突冲撞曹营，烈火张天，烧尽魏军数十万水师。"
  },
  {
    id: "guandu",
    name: "官渡之战",
    dynasty: "三国",
    combatants: "曹操 vs 袁绍",
    lat: 34.6189,
    lng: 114.1952,
    terrain: "CONTENTIOUS",
    classicQuote: "我得亦利，彼得亦利，为争地。攻之则不利，守之则安。",
    description: "曹操奇袭乌巢粮仓以弱胜强，歼其辎重精锐，一战平定北方霸权。",
    historyText: "官渡地处黄河南岸要道。曹袁两军在官渡相持数月，曹操奇兵夜行，抄小道直取乌巢，焚尽袁军粮食守备。袁绍军心大火大乱分崩离析，彻底改变了北方的地缘局势。"
  },
  {
    id: "hulaoguan",
    name: "虎牢关之战",
    dynasty: "唐代",
    combatants: "李世民 vs 窦建德 / 王世充",
    lat: 34.8219,
    lng: 113.1558,
    terrain: "FOCAL",
    classicQuote: "诸侯之地三宾，先至而得天下之众者，为衢地。衢地则合。",
    description: "李世民以三千玄甲精骑突袭雄关，阻断数十万援兵咽喉重地，立吞双雄。",
    historyText: "河南荥阳虎牢关关隘，南依嵩山，北阻黄河，绝崖万仞。属于典型的扼据天下枢机、谁先至即能称天下之势的‘衢地’。唐军以逸待劳，攻守转换破窦主力，创下战史神话。"
  }
];

function analyzePoint(lat: number, lng: number) {
  const distanceToXiAn = Math.sqrt(Math.pow(lat - 34.3415, 2) + Math.pow(lng - 108.9404, 2));
  const distanceToBeijing = Math.sqrt(Math.pow(lat - 39.9042, 2) + Math.pow(lng - 116.4074, 2));
  const distanceToNanjing = Math.sqrt(Math.pow(lat - 32.0603, 2) + Math.pow(lng - 118.7969, 2));

  let terrainId = "SCATTERED";
  let terrainName = "散地";
  let classicQuote = "诸侯自战其地者，为散地。其卒易散。";
  let adviser = "处于本土自战防御圈，退路纵横。虽行军有利，但部卒易生懈怠，心思归家。行军切忌死打硬拼，应该深挖沟壕，坚壁清野，诱敌速胜。";
  let bonusName = "【乡关情结】主防守、御城工事系数额外提升+15%";
  let badgeColor = "bg-[#1A1A1A] border-stone-300 text-stone-200";

  if (distanceToXiAn < 2.2) {
    terrainId = "FOCAL";
    terrainName = "衢地";
    classicQuote = "先至而得天下之众者，为衢地。交合其四达。";
    adviser = "地处天下大国的战略枢纽交汇点，兵家必争。任何部队在此应立刻开启外交纵横，招抚外援势力，若无法独占则绝不可在此长期孤立防御。";
    bonusName = "【四通八达】战场调兵调度时间缩短50%，外交速率+30%";
    badgeColor = "bg-amber-600 border-amber-400 text-white";
  } else if (distanceToBeijing < 3.2 && distanceToBeijing > 1.0) {
    terrainId = "CONTENTIOUS";
    terrainName = "争地";
    classicQuote = "我得亦利，彼得亦利，为争地。不可攻也。";
    adviser = "地势多奇险山峡，谁若占去一险便能立判乾坤。切勿迎风正面攻坚，要派遣偏军声东击西，在后方扼断敌之粮道或辎重供应线。";
    bonusName = "【奇兵扼喉】伏兵及后勤打击造成的震慑士气效果提升80%";
    badgeColor = "bg-purple-700 border-purple-500 text-purple-100";
  } else if (lat > 35.5 && lng < 111.0) {
    terrainId = "DEATH";
    terrainName = "死地";
    classicQuote = "疾战则存，不疾战则亡，为死地。在死地则战。";
    adviser = "地势绝断，前有阻碍后无退路。置之死地而后生！此时撤兵毫无可能，唯有向将士宣示退无归处，破釜沉舟，三军全力猛攻以求搏命求生！";
    bonusName = "【决死陷阵】合军搏命猛攻，基础攻击暴击率+120%，攻击力提升50%";
    badgeColor = "bg-[#8C2F39] border-red-500 text-white";
  } else if (distanceToNanjing < 3.2) {
    terrainId = "ENTRAPPING";
    terrainName = "挂地";
    classicQuote = "可以往，难以返，曰挂。彼无备，出而胜之；彼若有备，难复，不利。";
    adviser = "水域广覆，沟壑密布。易进难出，部队在此切忌孤军追击敌散兵。必须确保有足够战船作为退路，若敌军已经布防，强攻则必遭围歼。";
    bonusName = "【扼流入伏】战场机动范围和水域包抄反甲克制率提升40%";
    badgeColor = "bg-teal-700 border-teal-500 text-teal-100";
  } else if (lat < 30.0 && lng < 105.0) {
    terrainId = "FRONTIER";
    terrainName = "圮地";
    classicQuote = "山林、险阻、沮泽，凡难行之道者，为圮地。圮地则行。";
    adviser = "属深林泽沼、瘴气湿热，全军补给与辎重车马移动十分艰难。不得长期停留、安营筑城。应调动轻兵，疾行离境，快速通过此复杂地带。";
    bonusName = "【轻军疾足】山林沼泽行军移动加成+60%，不易受阻";
    badgeColor = "bg-emerald-700 border-emerald-500 text-emerald-100";
  } else {
    const isEven = Math.floor(lat + lng) % 2 === 0;
    if (isEven) {
      terrainId = "HEAVY";
      terrainName = "重地";
      classicQuote = "入人之地深，背城邑多者，为重地。重地则掠。";
      adviser = "大军已长驱直入敌国战略纵深，腹背受敌风险高。兵书云重地则掠，因战线过长，后方补给困难，必须采取以战养战之策，就地夺粮，安抚沿边百姓。";
      bonusName = "【以战养战】军需后勤行军开支自动缩减70%，掠获黄金效率+150%";
      badgeColor = "bg-orange-700 border-orange-500 text-orange-100";
    } else {
      terrainId = "LIGHT";
      terrainName = "轻地";
      classicQuote = "入人之地不深者，为轻地。其卒易返。轻地则无止。";
      adviser = "刚跨过敌国边界，士兵依然能看得见家乡的烽火，部卒容易出现溃退逃跑。不可以安营扎寨拖延战机，必须以雷霆攻势迅速夺取边城险隘，迫卒前冲。";
      bonusName = "【首战冲阵】首次伏击、奇袭或攻城突破概率加倍+100%";
      badgeColor = "bg-stone-500 border-stone-400 text-stone-100";
    }
  }

  return {
    id: terrainId,
    name: terrainName,
    classicQuote,
    adviser,
    bonusName,
    badgeColor,
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
  };
}

interface MountainObstacle {
  id: string;
  name: string;
  latOffset: number;
  lngOffset: number;
  radius: number;
}

const TACTICAL_MOUNTAINS: MountainObstacle[] = [
  { id: 'mt_north_ridge', name: '韶华天险 (Shao Hua Pass)', latOffset: 0.005, lngOffset: -0.007, radius: 0.004 },
  { id: 'mt_center_peak', name: '万钧遮天山 (Sky Pillar Peak)', latOffset: 0.001, lngOffset: 0.002, radius: 0.0045 },
  { id: 'mt_south_ravine', name: '绝雁枯荣谷 (Kurong Gorges)', latOffset: -0.005, lngOffset: 0.006, radius: 0.004 }
];

interface CoordPoint {
  lat: number;
  lng: number;
}

interface GridNode {
  r: number;
  c: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

function calculateAStarPath(
  start: CoordPoint,
  end: CoordPoint,
  centerLat: number,
  centerLng: number
): CoordPoint[] {
  const range = 0.025;
  const minLat = centerLat - range;
  const maxLat = centerLat + range;
  const minLng = centerLng - range;
  const maxLng = centerLng + range;

  const rows = 25;
  const cols = 25;

  const toGrid = (lat: number, lng: number) => {
    const r = Math.round(((lat - minLat) / (range * 2)) * (rows - 1));
    const c = Math.round(((lng - minLng) / (range * 2)) * (cols - 1));
    return {
      r: Math.max(0, Math.min(rows - 1, r)),
      c: Math.max(0, Math.min(cols - 1, c))
    };
  };

  const toCoord = (r: number, c: number) => {
    const lat = minLat + (r / (rows - 1)) * (range * 2);
    const lng = minLng + (c / (cols - 1)) * (range * 2);
    return { lat, lng };
  };

  const startGrid = toGrid(start.lat, start.lng);
  const endGrid = toGrid(end.lat, end.lng);

  const isBlockedGrid = (r: number, c: number) => {
    if ((r === startGrid.r && c === startGrid.c) || (r === endGrid.r && c === endGrid.c)) {
      return false;
    }
    const pt = toCoord(r, c);
    return TACTICAL_MOUNTAINS.some(obs => {
      const oLat = centerLat + obs.latOffset;
      const oLng = centerLng + obs.lngOffset;
      const dist = Math.sqrt(Math.pow(pt.lat - oLat, 2) + Math.pow(pt.lng - oLng, 2));
      return dist <= obs.radius;
    });
  };

  const openList: GridNode[] = [];
  const closedSet = new Set<string>();

  const startNode: GridNode = {
    r: startGrid.r,
    c: startGrid.c,
    g: 0,
    h: Math.sqrt(Math.pow(startGrid.r - endGrid.r, 2) + Math.pow(startGrid.c - endGrid.c, 2)),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  let endNode: GridNode | null = null;
  const maxIterations = 800;
  let iterations = 0;

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;
    openList.sort((a, b) => a.f - b.f);
    const curr = openList.shift()!;

    if (curr.r === endGrid.r && curr.c === endGrid.c) {
      endNode = curr;
      break;
    }

    const key = `${curr.r}_${curr.c}`;
    closedSet.add(key);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const nr = curr.r + dr;
        const nc = curr.c + dc;

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (closedSet.has(`${nr}_${nc}`)) continue;
        if (isBlockedGrid(nr, nc)) continue;

        const moveCost = (dr !== 0 && dc !== 0) ? 1.414 : 1.0;
        const g = curr.g + moveCost;
        const h = Math.sqrt(Math.pow(nr - endGrid.r, 2) + Math.pow(nc - endGrid.c, 2));
        const f = g + h;

        const existingNode = openList.find(n => n.r === nr && n.c === nc);
        if (existingNode) {
          if (g < existingNode.g) {
            existingNode.g = g;
            existingNode.f = f;
            existingNode.parent = curr;
          }
        } else {
          openList.push({
            r: nr,
            c: nc,
            g,
            h,
            f,
            parent: curr
          });
        }
      }
    }
  }

  const pathCoords: CoordPoint[] = [];
  if (endNode) {
    let curr: GridNode | null = endNode;
    while (curr) {
      pathCoords.push(toCoord(curr.r, curr.c));
      curr = curr.parent;
    }
    pathCoords.reverse();
    if (pathCoords.length > 0) {
      pathCoords[0] = start;
      pathCoords[pathCoords.length - 1] = end;
    }
  } else {
    pathCoords.push(start, end);
  }

  return pathCoords;
}

const MapPolyline = ({ path, color }: { path: Array<{ lat: number; lng: number }>; color: string; key?: string }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        map,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        geodesic: true,
      });
    }

    polylineRef.current.setPath(path);
    polylineRef.current.setOptions({ strokeColor: color });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path, color]);

  return null;
};

const getLogType = (log: string): 'allied' | 'hostile' | 'alerts' => {
  const text = log.toLowerCase();
  
  // 1. Tactical Alerts: System-wide, weather, strategy, and critical military failures/victories
  if (
    text.includes("【执掌乾坤】") || 
    text.includes("【天命随机】") || 
    text.includes("地利之道") || 
    text.includes("【白起") || 
    text.includes("【韩信") || 
    text.includes("【社稷沦丧】") || 
    text.includes("❌") ||
    text.includes("🌤️") ||
    text.includes("🌫️") ||
    text.includes("🌧️") ||
    text.includes("💨") ||
    text.includes("🎲") ||
    text.includes("气机乱涌") ||
    text.includes("天命所归") ||
    text.includes("🏆") ||
    text.includes("🎉")
  ) {
    return 'alerts';
  }

  // 2. Allied Actions
  if (
    text.includes("【攻势悍行】") ||
    text.includes("【守御进军】") ||
    text.includes("【调兵谴将】") ||
    text.includes("【安营扎寨】") ||
    text.includes("【增补援卒】") ||
    text.includes("【撤销编制】") ||
    text.includes("【解编退伍】") ||
    text.includes("【执掌中军】") ||
    text.includes("【退居中军】") ||
    text.includes("【我军") ||
    text.includes("【防务告捷】") ||
    text.includes("【用间") ||
    text.includes("用间") ||
    text.includes("细作") ||
    text.includes("我部") ||
    text.includes("我方") ||
    text.includes("我军") ||
    text.includes("我朝") ||
    text.includes("结御守大阵") ||
    text.includes("结攻坚杀阵")
  ) {
    return 'allied';
  }

  // 3. Hostile Actions
  if (
    text.includes("敌寇") || 
    text.includes("敌军") || 
    text.includes("敌部") || 
    text.includes("敌宿") ||
    text.includes("敌方") ||
    text.includes("【哨骑") ||
    text.includes("哨骑") ||
    text.includes("【强袭") ||
    text.includes("强袭") ||
    text.includes("【争地") ||
    text.includes("争地")
  ) {
    return 'hostile';
  }

  // Fallback
  return 'alerts';
};

const SmoothAdvancedMarker = ({ u, onClick, alliedStance, isDamaged }: { u: any, onClick: () => void, alliedStance: 'defensive' | 'offensive', isDamaged: boolean, key?: any }) => {
  const [lat, setLat] = useState(u.lat);
  const [lng, setLng] = useState(u.lng);
  const [isMoving, setIsMoving] = useState(false);
  const prevCoordRef = useRef({ lat: u.lat, lng: u.lng });

  useEffect(() => {
    if (prevCoordRef.current.lat !== u.lat || prevCoordRef.current.lng !== u.lng) {
      setIsMoving(true);
      prevCoordRef.current = { lat: u.lat, lng: u.lng };
    }

    // Smooth transition using framer-motion (motion/react) animate engine
    const animLat = animate(lat, u.lat, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (latest) => setLat(latest),
      onComplete: () => setIsMoving(false)
    });

    const animLng = animate(lng, u.lng, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (latest) => setLng(latest)
    });

    return () => {
      animLat.stop();
      animLng.stop();
    };
  }, [u.lat, u.lng]);

  const isCritical = u.side === 'hostile' && u.size > 0 && u.size <= 5000;
  const isAllied = u.side === 'allied';

  return (
    <AdvancedMarker
      position={{ lat, lng }}
      onClick={onClick}
    >
      <motion.div 
        className="relative flex items-center justify-center font-sans drop-shadow-[2px_4px_6px_rgba(0,0,0,0.6)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isDamaged ? [1, 1.25, 0.9, 1.1, 1] : 1, 
          rotate: isDamaged ? [0, -8, 8, -5, 5, 0] : 0,
          opacity: 1 
        }}
        transition={{ 
          scale: isDamaged 
            ? { duration: 0.55, ease: "easeInOut" }
            : { duration: 0.45, ease: "backOut" },
          rotate: { duration: 0.55, ease: "easeInOut" },
          opacity: { duration: 0.3 }
        }}
      >
        {isDamaged && (
          <motion.div 
            initial={{ y: 0, opacity: 1, scale: 0.8 }}
            animate={{ y: -25, opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-7 text-rose-600 font-serif font-black text-[10px] bg-white border border-rose-500 rounded px-1.5 py-0.5 shadow-md whitespace-nowrap pointer-events-none z-30"
          >
            💥 战损!
          </motion.div>
        )}

        <AnimatePresence>
          {isMoving && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: -28 }}
              exit={{ scale: 0.5, opacity: 0, y: -40 }}
              transition={{ duration: 0.3, ease: "backOut" }}
              className="absolute text-amber-500 font-serif font-black text-[9px] bg-amber-950 border border-amber-400 rounded px-1.5 py-0.5 shadow-md whitespace-nowrap pointer-events-none z-30 flex items-center gap-1 animate-bounce"
            >
              <span>🐎 {isAllied ? '拔营疾驰' : '兵马规避'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic visual stance ripples for allied units */}
        {isAllied && alliedStance === 'offensive' && (
          <motion.div 
            className="absolute pointer-events-none rounded bg-[#8C2F39]/20 border-2 border-[#8C2F39]"
            style={{ width: "115%", height: "115%", inset: "-3px", zIndex: -1 }}
            animate={{
              scale: [0.95, 1.15, 0.95],
              opacity: [0.6, 1.0, 0.6]
            }}
            transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
          />
        )}
        {isAllied && alliedStance === 'defensive' && (
          <motion.div 
            className="absolute pointer-events-none rounded bg-emerald-500/10 border border-emerald-500/40"
            style={{ width: "110%", height: "110%", inset: "-2px", zIndex: -1 }}
            animate={{
              boxShadow: ["0 0 2px rgba(16,185,129,0.2)", "0 0 10px rgba(16,185,129,0.7)", "0 0 2px rgba(16,185,129,0.2)"]
            }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        )}

        {/* Combat Impact Dynamic Pulsing Rings */}
        {isCritical && (
          <>
            <motion.div 
              className="absolute pointer-events-none rounded-full bg-rose-600/40 border-2 border-rose-500"
              style={{ width: "64px", height: "64px", zIndex: -1 }}
              animate={{
                scale: [0.6, 2.0],
                opacity: [0.7, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.0,
                ease: "easeOut"
              }}
            />
            <motion.div 
              className="absolute pointer-events-none rounded bg-rose-600/20"
              style={{ width: "100%", height: "100%", inset: "-4px", zIndex: -1 }}
              animate={{
                boxShadow: ["0 0 0px rgba(244,63,94,0.3)", "0 0 16px rgba(244,63,94,0.8)", "0 0 0px rgba(244,63,94,0.3)"]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                ease: "easeInOut"
              }}
            />
          </>
        )}

        <div 
          className={`p-1 border shadow-lg rounded text-[8px] font-sans font-bold select-none cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-300 relative ${
            isAllied
              ? alliedStance === 'offensive'
                ? 'bg-[#8C2F39] border-amber-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] allied-marker-element font-serif'
                : 'bg-emerald-700 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)] allied-marker-element'
              : `bg-rose-700 text-white ${isCritical ? 'border-amber-400 animate-pulse ring-2 ring-red-600 ring-offset-1 ring-offset-stone-900 shadow-[0_0_15px_rgba(244,63,94,0.8)]' : 'border-rose-500'} hostile-marker-element`
          }`} 
          style={{ width: 'auto', minWidth: '40px', height: 'auto', padding: '3px' }}
          data-id={u.id}
        >
          <p className="leading-none text-[8.5px] truncate flex items-center gap-0.5 justify-center">
            {isAllied ? (alliedStance === 'offensive' ? '⚔️' : '🛡️') : (isCritical && <span className="text-amber-300 animate-bounce">⚠️</span>)}
            {u.name}
          </p>
          <p className="text-[7.5px] opacity-95">兵员: {u.size} {isCritical && <span className="text-amber-300 font-serif font-black">(危!)</span>}</p>
          
          <div className="flex items-center gap-0.5 mt-0.5 text-[6.5px] font-sans justify-center bg-black/25 rounded py-[1px] px-0.5">
            <span className="opacity-95 text-amber-200">🌾 粮:{(u.provisions !== undefined ? u.provisions : 100)}%</span>
            <div className="w-8 h-1 bg-stone-700 rounded-full overflow-hidden inline-block ml-0.5 border border-stone-600">
              <div 
                className={`h-full ${
                  (u.provisions !== undefined ? u.provisions : 100) > 40 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${(u.provisions !== undefined ? u.provisions : 100)}%` }}
              />
            </div>
          </div>

          {u.creatorName && (
            <p className="text-[6.5px] text-amber-200 leading-none opacity-80 mt-0.5 text-center font-mono font-light">[{u.creatorName}]</p>
          )}
        </div>
      </motion.div>
    </AdvancedMarker>
  );
};

const SmoothInkMarker = ({ u, selectedBattlefield, isDamaged, alliedStance, onClick, setSelectedUnit, mapTilt = 0, mapHeading = 0 }: { 
  u: any; 
  selectedBattlefield: any; 
  isDamaged: boolean; 
  alliedStance: 'defensive' | 'offensive'; 
  onClick: (e: React.MouseEvent) => void;
  setSelectedUnit: (u: any) => void;
  key?: any;
  mapTilt?: number;
  mapHeading?: number;
}) => {
  const deltaLat = u.lat - (selectedBattlefield ? selectedBattlefield.lat : 34.3415);
  const deltaLng = u.lng - (selectedBattlefield ? selectedBattlefield.lng : 108.9404);
  const posX = 50 + deltaLng * 5000;
  const posY = 50 - deltaLat * 5000;

  const [isMoving, setIsMoving] = useState(false);
  const prevCoordRef = useRef({ lat: u.lat, lng: u.lng });

  useEffect(() => {
    if (prevCoordRef.current.lat !== u.lat || prevCoordRef.current.lng !== u.lng) {
      setIsMoving(true);
      const timer = setTimeout(() => {
        setIsMoving(false);
      }, 1400); 
      prevCoordRef.current = { lat: u.lat, lng: u.lng };
      return () => clearTimeout(timer);
    }
  }, [u.lat, u.lng]);

  if (posX < 5 || posX > 95 || posY < 5 || posY > 95) return null;

  const isAllied = u.side === 'allied';
  const isCritical = u.side === 'hostile' && u.size > 0 && u.size <= 5000;

  return (
    <motion.div 
      className="absolute cursor-pointer group animate-fade-in drop-shadow-[2px_4px_5px_rgba(0,0,0,0.55)]"
      style={{ x: "-50%", y: "-50%", transformStyle: 'preserve-3d' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDamaged ? [1, 1.25, 0.9, 1.1, 1] : 1, 
        rotate: isDamaged ? [0, -8, 8, -5, 5, 0] : 0,
        opacity: 1, 
        left: `${posX}%`, 
        top: `${posY}%` 
      }}
      transition={{ 
        left: { duration: 1.4, ease: "easeOut" },
        top: { duration: 1.4, ease: "easeOut" },
        scale: isDamaged 
          ? { duration: 0.55, ease: "easeInOut" }
          : { duration: 0.45, ease: "backOut" },
        rotate: { duration: 0.55, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }}
      onClick={onClick}
    >
      <div 
        className="relative flex items-center justify-center transition-transform duration-350 ease-out"
        style={{ 
          transform: `rotateX(${-mapTilt}deg) rotateY(0deg) rotateZ(${mapHeading}deg)`, 
          transformStyle: 'preserve-3d' 
        }}
      >
        {isDamaged && (
          <motion.div 
            initial={{ y: 0, opacity: 1, scale: 0.8 }}
            animate={{ y: -25, opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-7 text-rose-600 font-serif font-black text-[10px] bg-white border border-rose-500 rounded px-1.5 py-0.5 shadow-md whitespace-nowrap pointer-events-none z-30"
          >
            💥 战损!
          </motion.div>
        )}

        <AnimatePresence>
          {isMoving && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: -28 }}
              exit={{ scale: 0.5, opacity: 0, y: -45 }}
              transition={{ duration: 0.3, ease: "backOut" }}
              className="absolute text-amber-500 font-serif font-black text-[9px] bg-amber-950 border border-amber-400 rounded px-1.5 py-0.5 shadow-md whitespace-nowrap pointer-events-none z-30 flex items-center gap-1 animate-bounce"
            >
              <span>🐎 {isAllied ? '拔营疾驰' : '兵马规避'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isAllied && alliedStance === 'offensive' && (
          <motion.div 
            className="absolute pointer-events-none rounded-md bg-[#8C2F39]/15 border border-[#8C2F39]/40"
            style={{ width: "62px", height: "46px", zIndex: -1 }}
            animate={{ scale: [0.95, 1.15, 0.95] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          />
        )}
        {isAllied && alliedStance === 'defensive' && (
          <motion.div 
            className="absolute pointer-events-none rounded-md bg-[#10B981]/10 border border-[#10B981]/30 animate-pulse"
            style={{ width: "58px", height: "42px", zIndex: -1 }}
          />
        )}

        {isCritical && (
          <>
            <motion.div 
              className="absolute pointer-events-none rounded-full bg-rose-600/40 border-2 border-rose-500"
              style={{ width: "50px", height: "50px", zIndex: -1 }}
              animate={{
                scale: [0.6, 2.0],
                opacity: [0.7, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.0,
                ease: "easeOut"
              }}
            />
          </>
        )}
        <div 
          onClick={(ev) => {
            ev.stopPropagation();
            setSelectedUnit(u);
          }}
          className={`p-1.5 rounded-md border text-center transition-all duration-300 cursor-pointer ${
            isAllied 
              ? alliedStance === 'offensive'
                ? 'bg-amber-950/95 hover:bg-amber-900 border-[#8C2F39] text-[#FAF8F5] font-black allied-marker-element shadow-[0_0_8px_rgba(140,47,57,0.5)]'
                : 'bg-emerald-50/95 hover:bg-emerald-100 border-emerald-600 text-emerald-950 font-black allied-marker-element' 
              : `hover:bg-rose-100 text-rose-950 hostile-marker-element ${isCritical ? 'bg-rose-100 border-yellow-500 ring-2 ring-rose-600 ring-offset-2 shadow-[0_0_12px_rgba(220,38,38,0.6)] animate-pulse' : 'bg-rose-50/95 border-rose-600'}`
          } text-[9px] shadow-sm hover:scale-105 active:scale-95`}
          data-id={u.id}
        >
          <div className="flex items-center gap-1 font-serif leading-none">
            <span className="text-[10px]">{isAllied ? (alliedStance === 'offensive' ? '⚔️' : '🛡️') : (isCritical ? '⚠️' : '🏹')}</span>
            <span className="truncate max-w-[80px] font-sans">{u.name.split(' ')[0]}</span>
          </div>
          <span className="font-mono text-[8px] font-bold block mt-0.5 mt-shadow opacity-80">
            兵力: {u.size} {isCritical && <span className="text-red-700 font-extrabold font-serif">(溃!)</span>}
          </span>
          
          <div className="flex items-center gap-1 mt-1 text-[7.5px] font-sans justify-center bg-black/5 rounded py-[1px] px-0.5">
            <span className="text-stone-600">🌾 粮:{(u.provisions !== undefined ? u.provisions : 100)}%</span>
            <div className="w-9 h-1 bg-stone-300 rounded overflow-hidden inline-block border border-stone-400">
              <div 
                className={`h-full ${
                  (u.provisions !== undefined ? u.provisions : 100) > 40 ? 'bg-amber-600' : 'bg-red-650 animate-pulse'
                }`}
                style={{ width: `${(u.provisions !== undefined ? u.provisions : 100)}%` }}
              />
            </div>
          </div>

          {u.creatorName && (
            <span className="text-[7.5px] text-amber-600 font-serif font-semibold block leading-none mt-0.5">[{u.creatorName}]</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MemoizedBackgroundSVG = React.memo(() => {
  return (
    <svg className="w-full h-full opacity-35 absolute inset-0 pointer-events-none" viewBox="0 0 800 400">
      <path d="M50 350 C 150 200, 250 180, 350 350 C 420 280, 500 240, 600 350 C 680 300, 720 280, 780 350 Z" fill="none" stroke="#8C2F39" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="200" cy="180" r="1.5" fill="#1A1A1A" />
      <circle cx="500" cy="240" r="1.5" fill="#1A1A1A" />
      {/* Concentric rings to make it look like military map */}
      <circle cx="400" cy="200" r="120" stroke="#1A1A1A" strokeWidth="0.5" fill="none" strokeOpacity="0.15" />
      <circle cx="400" cy="200" r="210" stroke="#1A1A1A" strokeWidth="0.5" fill="none" strokeOpacity="0.08" />
    </svg>
  );
});
MemoizedBackgroundSVG.displayName = "MemoizedBackgroundSVG";

interface MountainRendererProps {
  centerLat: number;
  centerLng: number;
  mapTilt?: number;
  mapHeading?: number;
}

const MemoizedMountainObstacles = React.memo(({ centerLat, centerLng, mapTilt = 0, mapHeading = 0 }: MountainRendererProps) => {
  return (
    <>
      {TACTICAL_MOUNTAINS.map((obs) => {
        const posX = 50 + obs.lngOffset * 5000;
        const posY = 50 - obs.latOffset * 5000;
        
        if (posX < 5 || posX > 95 || posY < 5 || posY > 95) return null;

        const radPercent = obs.radius * 5000;

        return (
          <div 
            key={obs.id}
            className="absolute pointer-events-none flex flex-col items-center z-5 transition-transform duration-350 ease-out"
            style={{ 
              left: `${posX}%`, 
              top: `${posY}%`,
              transform: `translate(-50%, -50%) rotateX(${-mapTilt}deg) rotateY(0deg) rotateZ(${mapHeading}deg)`,
              transformStyle: 'preserve-3d'
            }}
          >
            <svg className="overflow-visible" width={radPercent * 6} height={radPercent * 4} viewBox="0 0 100 60">
              {/* Left supportive peak */}
              <polygon points="10,55 40,25 70,55" fill="#5F6F50" fillOpacity="0.45" stroke="#4a5a3a" strokeWidth="0.8" />
              {/* Right supportive peak */}
              <polygon points="40,55 65,30 90,55" fill="#4B5F43" fillOpacity="0.35" stroke="#374830" strokeWidth="0.8" />
              {/* Main center prominent peak */}
              <polygon points="20,55 50,12 80,55" fill="#8C2F39" fillOpacity="0.25" stroke="#8C2F39" strokeWidth="1.2" strokeDasharray="1 1" />
            </svg>
            <span className="text-[8px] font-serif font-bold bg-[#FAF8F5]/90 px-1 border border-stone-300 shadow-3xs rounded-sm text-stone-800 -mt-1.2 whitespace-nowrap tracking-tighter">
              🏔️ {obs.name}
            </span>
          </div>
        );
      })}
    </>
  );
});
MemoizedMountainObstacles.displayName = "MemoizedMountainObstacles";

export const SHICHENS = [
  { key: 'zi', name: '子时', period: '23:00 - 01:00', style: 'rgba(15, 23, 42, 0.45)', color: '#6366F1' },
  { key: 'chou', name: '丑时', period: '01:00 - 03:00', style: 'rgba(30, 27, 75, 0.55)', color: '#4F46E5' },
  { key: 'yin', name: '寅时', period: '03:00 - 05:00', style: 'rgba(49, 12, 102, 0.55)', color: '#818CF8' },
  { key: 'mao', name: '卯时', period: '05:00 - 07:00', style: 'rgba(124, 45, 18, 0.35)', color: '#F97316' },
  { key: 'chen', name: '辰时', period: '07:00 - 09:00', style: 'rgba(251, 191, 36, 0.25)', color: '#FBBF24' },
  { key: 'si', name: '巳时', period: '09:00 - 11:00', style: 'rgba(0, 0, 0, 0.1)', color: '#FAF8F5' },
  { key: 'wu', name: '午时', period: '11:00 - 13:00', style: 'rgba(0, 0, 0, 0)', color: '#FAF8F5' },
  { key: 'wei', name: '未时', period: '13:00 - 15:00', style: 'rgba(0, 0, 0, 0)', color: '#FAF8F5' },
  { key: 'shen', name: '申时', period: '15:00 - 17:00', style: 'rgba(180, 83, 9, 0.25)', color: '#D97706' },
  { key: 'you', name: '酉时', period: '17:00 - 19:00', style: 'rgba(153, 27, 27, 0.35)', color: '#EF4444' },
  { key: 'xu', name: '戌时', period: '19:00 - 21:00', style: 'rgba(88, 28, 135, 0.40)', color: '#A855F7' },
  { key: 'hai', name: '亥时', period: '21:00 - 23:00', style: 'rgba(14, 116, 144, 0.45)', color: '#06B6D4' }
];

export interface Stratagem {
  id: string;
  name: string;
  general: 'baiqi' | 'hanxin' | 'caocao' | 'caoren' | 'any';
  terrain: 'SCATTERED' | 'FOCAL' | 'CONTENTIOUS' | 'DEATH' | 'ENTRAPPING' | 'FRONTIER' | 'HEAVY' | 'LIGHT' | 'any';
  desc: string;
  effectDesc: string;
  cooldown: number;
}

export const STRATAGEMS: Stratagem[] = [
  {
    id: 'ambush',
    name: '十面埋伏',
    general: 'hanxin',
    terrain: 'any',
    desc: '兵仙韩信指挥下的经典合围妙阵。在敌侧翼与后路形成十层合围，令敌防不胜防。',
    effectDesc: '敌军全员兵力立刻锐减 25%，且遭受 1.5 倍的额外损伤打击！',
    cooldown: 8
  },
  {
    id: 'waterbattle',
    name: '背水一战',
    general: 'hanxin',
    terrain: 'DEATH',
    desc: '投之亡地然后存，置之死地然后生！命令军队背水结阵，切断一切退兵路径以激发将士死战气概。',
    effectDesc: '我军瞬间激发「决死」斗志！攻击力提升 2.5 倍，并奇攻回复 8000 兵力编制！',
    cooldown: 10
  },
  {
    id: 'fortify',
    name: '坚壁清野',
    general: 'caoren',
    terrain: 'any',
    desc: '守城名将曹仁的无双防术。加固城塞沟垒坚守不退，尽收郊野粮秣物资以困弊敌。',
    effectDesc: '未来 5 刻推演中，我方所有守军享受【铁壁防护】状态，受创削减 85%！',
    cooldown: 7
  },
  {
    id: 'feint',
    name: '声东击西 (Feigned Tactical Diversion)',
    general: 'caocao',
    terrain: 'any',
    desc: '魏武帝曹操的虚实奇谋。虚张声势指东打西，伪造行军方向以令敌方主力指挥体系陷入混乱。',
    effectDesc: '敌对编制攻击烈度被压低 80%，且由于后方起火，敌寇战场斥候/眼线悉数暴露！',
    cooldown: 6
  },
  {
    id: 'firestorm',
    name: '神火燎原 (Blazing Wildfire)',
    general: 'baiqi',
    terrain: 'CONTENTIOUS',
    desc: '杀神白起的毁天灭地火攻策。在争地要冲、狭窄峡口，借用风势（或大雨积炭）大举播洒火箭猛火油。',
    effectDesc: '万火齐发！敌寇所有在场单位瞬间遭受 8000 点致命连环火焰打击，化为焦土！',
    cooldown: 8
  },
  {
    id: 'risestrat',
    name: '死地后生 (Rise from Dead Lands)',
    general: 'any',
    terrain: 'DEATH',
    desc: '九地篇终极兵理：诸侯绝境！陷入死地则疾战，兵士因无求存后路，必发挥惊天动地死战之力。',
    effectDesc: '推演进入天演绝杀态势！不仅大幅触发双方杀伤 +300%，且我方必定重创敌帅！',
    cooldown: 9
  }
];

export interface FireTacticInfo {
  id: 'fire_men' | 'fire_goods' | 'fire_carts' | 'fire_arm' | 'fire_camp';
  name: string;
  zhName: string;
  desc: string;
  effect: string;
}

export const FIRE_TACTICS: FireTacticInfo[] = [
  { id: 'fire_men', name: 'Incinerate Force (火人)', zhName: '一曰火人', desc: '烧杀敌军人马主力营地，以猛火扰乱其心神、折损其有生编制。', effect: '每刻摧毁敌寇 2500 - 4500 兵马。' },
  { id: 'fire_goods', name: 'Burn Provisions (火积)', zhName: '二曰火积', desc: '烧毁其粮草积蓄、屯粮重镇，断绝敌寇生存持久之源。', effect: '每刻摧毁敌寇 1500 - 2500 粮秣守军并限制其反攻增幅。' },
  { id: 'fire_carts', name: 'Burn Baggage (火辎)', zhName: '三曰火辎', desc: '突袭纵火其后勤资装、行军马车，延迟敌寇战车与运输。', effect: '使范围内敌军陷入混乱，减缓其对齐行军速度 50%。' },
  { id: 'fire_arm', name: 'Ignite Arsenal (火库)', zhName: '四曰火库', desc: '奇袭敌方军械仓库，引爆弩机床子弩与火器油脂，产生爆燃。', effect: '瞬间造成 6000 编制爆发性打击！在雷雨中减退。' },
  { id: 'fire_camp', name: 'Structural Sapping (火队)', zhName: '五曰火队', desc: '派遣校尉死士深入敌后，纵火焚毁行军廊关、哨岗营门。', effect: '完全揭开周围 15 公里敌军行军线，撕碎诡道伪装迷雾。' }
];

interface RealWorldMapBattleProps {
  activeCardId?: string | null;
}

export default function RealWorldMapBattle({ activeCardId = null }: RealWorldMapBattleProps) {
  const [mapMode, setMapMode] = useState<'ink' | 'google'>('ink');
  const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
  const [selectedBattlefield, setSelectedBattlefield] = useState<Battlefield | null>(HISTORICAL_BATTLEFIELDS[0]);
  const [customPoint, setCustomPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(
    analyzePoint(HISTORICAL_BATTLEFIELDS[0].lat, HISTORICAL_BATTLEFIELDS[0].lng)
  );

  // Simulation parameters
  const [blueArmySize, setBlueArmySize] = useState<number>(50000); // Allied
  const [redArmySize, setRedArmySize] = useState<number>(85000);  // Enemy
  const [alliedStance, setAlliedStance] = useState<'defensive' | 'offensive'>('defensive');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'allied' | 'hostile' | 'alerts'>('all');
  const [generalChoice, setGeneralChoice] = useState<'baiqi' | 'hanxin' | 'caocao' | 'caoren'>('caocao');

  // ============================================
  // 3D/4D GIS TACTICAL SANDTABLE STATE (Phase 1 & Phase 2)
  // ============================================
  const [mapTilt, setMapTilt] = useState<number>(0);
  const [mapHeading, setMapHeading] = useState<number>(0);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [gisAltitudeMesh, setGisAltitudeMesh] = useState<boolean>(true);

  // Phase 2: temporal 4D clock states
  const [timeSpeed, setTimeSpeed] = useState<number>(1); // simulation speed multiply: 1x, 2x, 5x
  const [timelineTick, setTimelineTick] = useState<number>(0); // how many progression ticks
  const [shichenIndex, setShichenIndex] = useState<number>(6); // starting at Noon (午时)
  const [timeTravelIndex, setTimeTravelIndex] = useState<number>(-1); // snapshot lookup: -1 means real-time active, otherwise history lookup
  const [historyStack, setHistoryStack] = useState<Array<{
    tick: number;
    shichen: string;
    shichenIndex: number;
    units: any[];
    simLogs: string[];
    weather: 'none' | 'fog' | 'rain' | 'wind';
    alliedStrength: number;
    hostileStrength: number;
  }>>([]);

  // ============================================
  // ANIMATED WEATHER OVERLAY CONFIG & STATE (Sun Tzu Nine Lands)
  // ============================================
  const [weather, setWeather] = useState<'none' | 'fog' | 'rain' | 'wind'>('none');
  const [showWeatherTooltip, setShowWeatherTooltip] = useState<boolean>(false);

  // Markers placed by user on the map
  const [placedUnits, setPlacedUnits] = useState<Array<{ id: string; name: string; side: 'allied' | 'hostile'; lat: number; lng: number; size: number; creatorUid?: string; creatorName?: string }>>([]);

  const displayedUnits = timeTravelIndex >= 0 && historyStack[timeTravelIndex]
    ? historyStack[timeTravelIndex].units
    : placedUnits;

  const displayedSimLog = timeTravelIndex >= 0 && historyStack[timeTravelIndex]
    ? historyStack[timeTravelIndex].simLogs
    : simLog;

  const displayedWeather = timeTravelIndex >= 0 && historyStack[timeTravelIndex]
    ? historyStack[timeTravelIndex].weather
    : weather;

  const displayedShichenIndex = timeTravelIndex >= 0 && historyStack[timeTravelIndex]
    ? historyStack[timeTravelIndex].shichenIndex
    : shichenIndex;

  // ============================================
  // Phase 3: Nine Lands Stratagem Sandtable Deck State
  // ============================================
  const [activeStratagem, setActiveStratagem] = useState<string | null>(null);
  const [stratagemTimer, setStratagemTimer] = useState<number>(0);
  const [stratagemCooldowns, setStratagemCooldowns] = useState<Record<string, number>>({});

  // ============================================
  // Phase 4: Fire Attack (火攻篇) & Pathfinder (五路行军推荐) State
  // ============================================
  const [fireFlares, setFireFlares] = useState<Array<{
    id: string;
    lat: number;
    lng: number;
    intensity: number; // 1 to 5 scale
    tactic: 'fire_men' | 'fire_goods' | 'fire_carts' | 'fire_arm' | 'fire_camp';
    timer: number;
  }>>([]);
  const [selectedFireTactic, setSelectedFireTactic] = useState<'fire_men' | 'fire_goods' | 'fire_carts' | 'fire_arm' | 'fire_camp' | null>(null);
  const [showPathfinders, setShowPathfinders] = useState<boolean>(true);
  const [pathfinderType, setPathfinderType] = useState<'direct' | 'detour'>('detour');

  // ============================================
  // MULTIPLAYER & DEPLOYMENT ENHANCED STATE
  // ============================================
  const [multiplayerMode, setMultiplayerMode] = useState<boolean>(false);
  const [remoteRoomId, setRemoteRoomId] = useState<string>('xianyang-lobby');
  const [syncState, setSyncState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [warlordName, setWarlordName] = useState<string>(() => {
    return localStorage.getItem('warlord_name') || '大秦上将军_' + Math.floor(Math.random() * 900 + 100);
  });
  const [warlordRole, setWarlordRole] = useState<string>('GENERAL');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHostingSim, setIsHostingSim] = useState<boolean>(false);
  const [isTargetingMoveId, setIsTargetingMoveId] = useState<string | null>(null);

  // Form states for custom unit placement
  const [pendingDeployCoords, setPendingDeployCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newUnitName, setNewUnitName] = useState<string>('秦先锋锐士营');
  const [newUnitSide, setNewUnitSide] = useState<'allied' | 'hostile'>('allied');
  const [newUnitSize, setNewUnitSize] = useState<number>(10000);

  // For Google Maps Info Window
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  // Step 3 (Option 3): Espionage Spy Ring Map Altar Synergy
  const [spiesList, setSpiesList] = useState<Array<{ 
    id: string; 
    name: string; 
    type: string; 
    cost: number; 
    credibility: number; 
    motivation: string; 
    loyalty: number; 
    isDiscovered: boolean; 
    state: string; 
    targetLat?: number; 
    targetLng?: number; 
    targetName?: string;
  }>>([]);
  const [selectedSpy, setSelectedSpy] = useState<any | null>(null);

  // ============================================
  // COMBAT LOG TOAST NOTIFICATION CONFIG & STATE
  // ============================================
  interface CombatToast {
    id: string;
    type: 'allied_attack' | 'hostile_attack';
    alliedUnitName: string;
    hostileUnitName: string;
    impact: string;
    remainingHealth: string;
    stanceBonusLabel: string;
    timestamp: string;
  }
  const [combatToasts, setCombatToasts] = useState<CombatToast[]>([]);

  // Monitor troop size reductions for micro hit / combat dynamic animations
  const [damagedUnits, setDamagedUnits] = useState<Record<string, number>>({});
  const prevSizesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();
    const newDamaged: Record<string, number> = {};
    let hasChanges = false;

    placedUnits.forEach(u => {
      const prevSize = prevSizesRef.current[u.id];
      if (prevSize !== undefined && u.size < prevSize) {
        newDamaged[u.id] = now;
        hasChanges = true;
      }
      prevSizesRef.current[u.id] = u.size;
    });

    if (hasChanges) {
      setDamagedUnits(prev => ({ ...prev, ...newDamaged }));
    }
  }, [placedUnits]);

  // Randomly trigger weather conditions during simulation
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        // 30% chance to transition or change weather every 12 seconds
        if (Math.random() < 0.3) {
          const weathers: Array<'none' | 'fog' | 'rain' | 'wind'> = ['none', 'fog', 'rain', 'wind'];
          const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
          if (newWeather !== weather) {
            setWeather(newWeather);
            
            let zhName = '晴空万里';
            let tip = '天候平稳，侦察与机动恢复常态。';
            if (newWeather === 'fog') {
              zhName = '大雾弥漫 (Fog)';
              tip = '🌫️ 「衢地失瞻」：浓雾锁山，敌我视界重挫 -50%，行军迟滞 -25%。';
            } else if (newWeather === 'rain') {
              zhName = '雨雪泥泞 (Rain)';
              tip = '🌧️ 「暴雨圮地」：连天骤雨浸湿旷野，泥泞没膝。行军速度折半 -50%，视界重创 -20%。';
            } else if (newWeather === 'wind') {
              zhName = '沙尘狂风 (Wind)';
              tip = '💨 「死地狂风」：暴风呼啸，风助火势与军威。行军速增 +40%，微阻视界 -10%。';
            }
            addRoomLog(`🌤️ 【天时大变】战场上空云雾突变，转为「${zhName}」。${tip}`);
          }
        }
      }, 12000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, weather]);

  // Orbit rotation loop for 4D telemetry mapping
  useEffect(() => {
    let orbitTimer: any;
    if (autoOrbit) {
      orbitTimer = setInterval(() => {
        setMapHeading(prev => (prev + 0.35) % 360);
      }, 45); // highly responsive, premium rotation
    }
    return () => {
      if (orbitTimer) clearInterval(orbitTimer);
    };
  }, [autoOrbit]);

  const [mapVisualFx, setMapVisualFx] = useState<Array<{ id: string; type: 'clash' | 'fire' | 'blood'; lat: number; lng: number }>>([]);

  const triggerCombatToast = (
    type: 'allied_attack' | 'hostile_attack',
    alliedName: string,
    hostileName: string,
    impact: string,
    remainingHealth: string,
    stanceBonusLabel: string,
    lat?: number,
    lng?: number
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const newToast: CombatToast = {
      id,
      type,
      alliedUnitName: alliedName,
      hostileUnitName: hostileName,
      impact,
      remainingHealth,
      stanceBonusLabel,
      timestamp
    };
    setCombatToasts(prev => [newToast, ...prev].slice(0, 5));
    
    if (lat !== undefined && lng !== undefined) {
      const fxId = `fx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setMapVisualFx(prev => [...prev, { id: fxId, type: type === 'allied_attack' ? 'clash' : 'blood', lat, lng }]);
      setTimeout(() => {
        setMapVisualFx(prev => prev.filter(f => f.id !== fxId));
      }, 1500);
    }

    // Auto clear toast after 5 seconds
    setTimeout(() => {
      setCombatToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const prevUnitsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!isSimulating || !placedUnits || placedUnits.length === 0) {
      prevUnitsRef.current = placedUnits;
      return;
    }

    if (prevUnitsRef.current && prevUnitsRef.current.length > 0) {
      placedUnits.forEach(newUnit => {
        const prevUnit = prevUnitsRef.current.find(u => u.id === newUnit.id);
        if (prevUnit && prevUnit.size > newUnit.size) {
          const dmg = prevUnit.size - newUnit.size;
          
          if (newUnit.side === 'allied') {
            // Allied unit was attacked! (Hostile attacks Allied)
            const stanceBonusLabel = alliedStance === 'defensive'
              ? '🛡️ 「方圆大针」结御抗震，战功免除伤害 -60%'
              : '⚔️ 攻势「锋矢阵」防守虚置，承受战损加剧 +20%';
              
            triggerCombatToast(
              'hostile_attack',
              newUnit.name,
              '楚军骁骑劲卒',
              `折损 ${dmg.toLocaleString()} 人`,
              `我部余力: ${newUnit.size.toLocaleString()} 员`,
              stanceBonusLabel,
              newUnit.lat,
              newUnit.lng
            );
          } else if (newUnit.side === 'hostile') {
            // Hostile unit was attacked by Allied! (Allied attacks Hostile)
            const stanceBonusLabel = alliedStance === 'offensive'
              ? '⚔️ 「锋矢大阵」如风林火山，奇袭爆发功力 +50%'
              : '🛡️ 「方圆大阵」持重守节，侧重格挡防务 (无攻击加料)';
              
            // Find an allied unit representing the attacker (first live allied unit)
            let closestAllied = placedUnits.find(u => u.side === 'allied' && u.size > 0);
            if (!closestAllied) {
              closestAllied = { name: '我军前哨将士' } as any;
            }
            
            triggerCombatToast(
              'allied_attack',
              closestAllied!.name,
              newUnit.name,
              `折将斩数 ${dmg.toLocaleString()} 人`,
              `逆贼余卒: ${newUnit.size.toLocaleString()} 兵`,
              stanceBonusLabel,
              newUnit.lat,
              newUnit.lng
            );
          }
        }
      });
    }

    prevUnitsRef.current = placedUnits;
  }, [placedUnits, isSimulating, alliedStance]);

  // ============================================
  // MULTIPLAYER SYNC FIREBASE LOGIC
  // ============================================

  // Auth Status Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (user.displayName) {
          setWarlordName(user.displayName);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Sync / write a battle log to Firestore rooms/{roomId}/logs
  const addRoomLog = async (text: string) => {
    // Dynamic strategic sound dispatcher based on military event keywords
    try {
      if (text.includes('🔥') || text.includes('火') || text.includes('起火') || text.includes('引燃') || text.includes('爆裂')) {
        soundManager.playHorn();
      } else if (text.includes('⚔️') || text.includes('攻') || text.includes('歼') || text.includes('合击') || text.includes('强袭')) {
        soundManager.playDrum();
      } else if (text.includes('🏆') || text.includes('大胜') || text.includes('天命') || text.includes('妙算')) {
        soundManager.playChime();
      } else {
        soundManager.playDrum();
      }
    } catch (e) {
      // Background audio error suppression
    }

    if (!multiplayerMode || !remoteRoomId) {
      setSimLog(prev => [text, ...prev].slice(0, 30));
      return;
    }
    try {
      const logsColRef = collection(db, 'rooms', remoteRoomId, 'logs');
      await addDoc(logsColRef, {
        text,
        username: warlordName,
        role: warlordRole,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to write to room log:", err);
    }
  };

  // Real-time listener for multiplayer units and simulation status
  useEffect(() => {
    if (!multiplayerMode || !remoteRoomId || !currentUser) {
      setSyncState('disconnected');
      setIsHostingSim(false);
      return;
    }

    setSyncState('connecting');

    // Subscribe to the unified Room configurations
    const roomRef = doc(db, 'rooms', remoteRoomId);
    const unsubRoom = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.mapBattleSimulating !== undefined) {
          setIsSimulating(data.mapBattleSimulating);
        }
        if (data.mapBattleStance !== undefined) {
          setAlliedStance(data.mapBattleStance);
        }
        if (data.mapBattleGeneral !== undefined) {
          setGeneralChoice(data.mapBattleGeneral);
        }
        setSyncState('connected');
      } else {
        // Build the Room on request
        setDoc(roomRef, {
          roomName: `${remoteRoomId} 大将军演武`,
          mandate: 85,
          stability: 80,
          coffers: 35000,
          emperorAge: 14,
          status: 'ACTIVE',
          mapBattleSimulating: false,
          mapBattleStance: 'defensive',
          mapBattleGeneral: 'caocao',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).then(() => {
          setSyncState('connected');
        }).catch(err => {
          console.error(err);
          setSyncState('error');
        });
      }
    }, (err) => {
      console.error("Room sync error:", err);
      setSyncState('error');
    });

    // Real-time sync for tactical map units
    const unitsColRef = collection(db, 'rooms', remoteRoomId, 'mapUnits');
    const unsubUnits = onSnapshot(unitsColRef, (snapshot) => {
      const units: any[] = [];
      snapshot.forEach(docSnap => {
        units.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (units.length === 0) {
        // Seat default unit blueprints
        const latBase = selectedBattlefield ? selectedBattlefield.lat : 34.3415;
        const lngBase = selectedBattlefield ? selectedBattlefield.lng : 108.9404;
        const presets = [
          { id: 'u1', name: '大本营军帐', side: 'allied', lat: latBase - 0.015, lng: lngBase - 0.015, size: 25000, provisions: 100, creatorName: '系统预编' },
          { id: 'u2', name: '先锋突击骑兵', side: 'allied', lat: latBase - 0.005, lng: lngBase - 0.005, size: 10000, provisions: 100, creatorName: '系统预编' },
          { id: 'u3', name: '敌中军主帅营', side: 'hostile', lat: latBase + 0.015, lng: lngBase + 0.015, size: 45000, provisions: 100, creatorName: '系统预编' },
          { id: 'u4', name: '敌侧翼伏兵弓弩手', side: 'hostile', lat: latBase + 0.005, lng: lngBase + 0.012, size: 15000, provisions: 100, creatorName: '系统预编' },
        ];
        presets.forEach(p => {
          setDoc(doc(unitsColRef, p.id), p);
        });
      } else {
        setPlacedUnits(units);
      }
    }, (err) => {
      console.error("MapUnits sync error:", err);
      setSyncState('error');
    });

    // Real-time sync for active spies (Step 3 Addition)
    const spiesColRef = collection(db, 'rooms', remoteRoomId, 'spies');
    const unsubSpies = onSnapshot(spiesColRef, (snapshot) => {
      const spies: any[] = [];
      snapshot.forEach(docSnap => {
        spies.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSpiesList(spies);
    }, (err) => {
      console.error("Spies subcollection sync error:", err);
    });

    return () => {
      unsubRoom();
      unsubUnits();
      unsubSpies();
    };
  }, [multiplayerMode, remoteRoomId, currentUser, selectedBattlefield]);

  // Subscribe to real-time synchronized battle logs
  useEffect(() => {
    if (!multiplayerMode || !remoteRoomId) return;
    const q = query(
      collection(db, 'rooms', remoteRoomId, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(25)
    );
    const unsubLogs = onSnapshot(q, (snapshot) => {
      const logsList: string[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        let roleCh = '客';
        if (data.role === 'GENERAL') roleCh = '将';
        if (data.role === 'CHANCELLOR') roleCh = '相';
        if (data.role === 'REBEL') roleCh = '义';
        logsList.push(`📜 【${roleCh}·${data.username}】${data.text}`);
      });
      if (logsList.length > 0) {
        setSimLog(logsList);
      }
    }, (err) => {
      console.error("Logs update subscription fail:", err);
    });
    return () => unsubLogs();
  }, [multiplayerMode, remoteRoomId]);

  // Track dynamic troop movement path trails (historically up to 40 coordinate changes)
  const [unitTrails, setUnitTrails] = useState<Record<string, Array<{lat: number; lng: number}>>>({});

  useEffect(() => {
    if (!isSimulating) {
      setUnitTrails({});
      return;
    }

    setUnitTrails(prev => {
      const next = { ...prev };
      let changed = false;

      placedUnits.forEach(u => {
        if (u.size <= 0) {
          if (next[u.id]) {
            delete next[u.id];
            changed = true;
          }
          return;
        }

        const currentPoint = { lat: u.lat, lng: u.lng };
        const currentTrail = prev[u.id] || [];

        if (currentTrail.length === 0) {
          next[u.id] = [currentPoint];
          changed = true;
        } else {
          const lastPoint = currentTrail[currentTrail.length - 1];
          const distance = Math.sqrt(Math.pow(lastPoint.lat - u.lat, 2) + Math.pow(lastPoint.lng - u.lng, 2));
          
          if (distance > 0.0001) {
            next[u.id] = [...currentTrail, currentPoint].slice(-40);
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [placedUnits, isSimulating]);

  // Fog of War States & References
  const [fogOfWarEnabled, setFogOfWarEnabled] = useState<boolean>(true);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(false); // Start hidden by default? No, user just complained it always covers. We can let them toggle it.
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [alliedScreenPoints, setAlliedScreenPoints] = useState<Array<{ x: number; y: number; id: string }>>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

  // Get active reconnaissance radius in degrees based on Sun Tzu Nine Lands (九地)
  const getReconRadius = () => {
    let baseRad = 0.026;
    if (activeAnalysis.id === 'FOCAL') baseRad = 0.038;     // Focal ground: wide views (衢地)
    if (activeAnalysis.id === 'FRONTIER') baseRad = 0.016;  // Difficult/Swamp ground: low visibility (圮地)
    if (activeAnalysis.id === 'DEATH') baseRad = 0.024;     // Desperate ground: average visibility (死地)

    // Apply weather modifiers
    if (weather === 'fog') return baseRad * 0.5;
    if (weather === 'rain') return baseRad * 0.8;
    if (weather === 'wind') return baseRad * 0.9;
    return baseRad;
  };

  // Determine if a unit is uncovered/revealed in the Fog of War
  const isUnitRevealed = (unit: any) => {
    if (!fogOfWarEnabled) return true;
    if (unit.side === 'allied') return true;
    if (unit.size <= 0) return false;

    const activeRadius = getReconRadius();
    const liveAllieds = placedUnits.filter(u => u.side === 'allied' && u.size > 0);

    return liveAllieds.some(allied => {
      const dist = Math.sqrt(Math.pow(unit.lat - allied.lat, 2) + Math.pow(unit.lng - allied.lng, 2));
      return dist <= activeRadius;
    });
  };

  // ResizeObserver to track sandbox canvas dimensions in real-time
  useEffect(() => {
    if (!stageRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(stageRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // RequestAnimationFrame tracking loop to align HTML markers to SVG pixels smoothly
  useEffect(() => {
    let active = true;
    const updateScreenPoints = () => {
      if (!active) return;

      const stage = document.getElementById('battle-map-stage');
      if (!stage) {
        requestAnimationFrame(updateScreenPoints);
        return;
      }

      const stageRect = stage.getBoundingClientRect();

      if (mapMode === 'google') {
        const markers = document.querySelectorAll('.allied-marker-element');
        const pts = Array.from(markers).map((m) => {
          const mRect = m.getBoundingClientRect();
          const x = mRect.left + mRect.width / 2 - stageRect.left;
          const y = mRect.top + mRect.height / 2 - stageRect.top;
          return { x, y, id: m.getAttribute('data-id') || '' };
        });

        setAlliedScreenPoints((prev) => {
          if (prev.length !== pts.length) return pts;
          const isDiff = prev.some((p, i) => Math.abs(p.x - pts[i].x) > 0.5 || Math.abs(p.y - pts[i].y) > 0.5 || p.id !== pts[i].id);
          return isDiff ? pts : prev;
        });
      } else {
        const pts = placedUnits
          .filter((u) => u.side === 'allied' && u.size > 0)
          .map((u) => {
            const centerLat = selectedBattlefield ? selectedBattlefield.lat : 34.3415;
            const centerLng = selectedBattlefield ? selectedBattlefield.lng : 108.9404;
            const deltaLat = u.lat - centerLat;
            const deltaLng = u.lng - centerLng;
            const posX = 50 + deltaLng * 5000;
            const posY = 50 - deltaLat * 5000;
            const x = (posX / 100) * stageRect.width;
            const y = (posY / 100) * stageRect.height;
            return { x, y, id: u.id };
          });

        setAlliedScreenPoints((prev) => {
          if (prev.length !== pts.length) return pts;
          const isDiff = prev.some((p, i) => Math.abs(p.x - pts[i].x) > 0.5 || Math.abs(p.y - pts[i].y) > 0.5 || p.id !== pts[i].id);
          return isDiff ? pts : prev;
        });
      }

      requestAnimationFrame(updateScreenPoints);
    };

    if (fogOfWarEnabled) {
      requestAnimationFrame(updateScreenPoints);
    } else {
      setAlliedScreenPoints([]);
    }

    return () => {
      active = false;
    };
  }, [mapMode, placedUnits, selectedBattlefield, fogOfWarEnabled, dimensions]);

  useEffect(() => {
    if (selectedBattlefield) {
      setCustomPoint(null);
      setActiveAnalysis(analyzePoint(selectedBattlefield.lat, selectedBattlefield.lng));
      resetSimulation();
    }
  }, [selectedBattlefield]);

  useEffect(() => {
    setIsMapLoading(true);
    const triggerMinLoading = setTimeout(() => {
      setIsMapLoading(false);
    }, 550);
    return () => clearTimeout(triggerMinLoading);
  }, [selectedBattlefield, mapMode]);

  const resetSimulation = async () => {
    setIsSimulating(false);
    const msg = `⛺ 阵地沙盘就位。当前所处坐标:纬度 ${activeAnalysis.lat}°，经度 ${activeAnalysis.lng}°。天命加成：${activeAnalysis.name}`;
    
    // Auto populate units near battle coordinates
    const latBase = selectedBattlefield ? selectedBattlefield.lat : (customPoint ? customPoint.lat : 34.3415);
    const lngBase = selectedBattlefield ? selectedBattlefield.lng : (customPoint ? customPoint.lng : 108.9404);
    
    const defaultUnits = [
      { id: 'u1', name: '大本营军帐', side: 'allied' as const, lat: latBase - 0.015, lng: lngBase - 0.015, size: 25000, provisions: 100, creatorName: '系统预设' },
      { id: 'u2', name: '先锋突击骑兵', side: 'allied' as const, lat: latBase - 0.005, lng: lngBase - 0.005, size: 10000, provisions: 100, creatorName: '系统预设' },
      { id: 'u3', name: '敌中军主帅营', side: 'hostile' as const, lat: latBase + 0.015, lng: lngBase + 0.015, size: 45000, provisions: 100, creatorName: '系统预设' },
      { id: 'u4', name: '敌侧翼伏兵弓弩手', side: 'hostile' as const, lat: latBase + 0.005, lng: lngBase + 0.012, size: 15000, provisions: 100, creatorName: '系统预设' },
    ];

    if (multiplayerMode && remoteRoomId) {
      try {
        const roomRef = doc(db, 'rooms', remoteRoomId);
        await updateDoc(roomRef, { mapBattleSimulating: false });
        
        const unitsColRef = collection(db, 'rooms', remoteRoomId, 'mapUnits');
        // Delete old units first
        for (const u of placedUnits) {
          await deleteDoc(doc(unitsColRef, u.id));
        }
        // Write new default units
        for (const p of defaultUnits) {
          await setDoc(doc(unitsColRef, p.id), p);
        }
        await addRoomLog(`⛺ 【重组沙盘】重新标定并重奏整项战线部署，秦楚主力已对弈就绪！`);
      } catch (err) {
        console.error("Multiplayer reset error:", err);
      }
    } else {
      setSimLog([msg]);
      setPlacedUnits(defaultUnits);
    }
    // Reset 4D Time-series states
    setTimelineTick(0);
    setShichenIndex(6); // Noon
    setTimeTravelIndex(-1);
    setHistoryStack([]);
    // Reset Phase 3 Stratagem states
    setActiveStratagem(null);
    setStratagemTimer(0);
    setStratagemCooldowns({});
    // Reset Phase 4 Fire Attack & Pathfinder states
    setFireFlares([]);
    setSelectedFireTactic(null);
  };

  const handleTriggerStratagem = async (strat: Stratagem) => {
    if (stratagemCooldowns[strat.id] && stratagemCooldowns[strat.id] > 0) {
      addRoomLog(`⏳ 战法【${strat.name.split(' (')[0]}】尚在调息，需等其冷却：${stratagemCooldowns[strat.id]} 刻。`);
      return;
    }
    
    // Check general or terrain conditions
    const isGeneralMatch = strat.general === 'any' || generalChoice === strat.general;
    const isTerrainMatch = strat.terrain === 'any' || activeAnalysis.id === strat.terrain;
    
    if (!isGeneralMatch && !isTerrainMatch) {
      addRoomLog(`⚠️ 【天机未就】施展战法【${strat.name.split(' (')[0]}】未遂！主帅契合或当天地利不足。`);
      return;
    }
    
    // Set Active!
    setActiveStratagem(strat.id);
    setStratagemTimer(5); // active for 5 ticks
    setStratagemCooldowns(prev => ({ ...prev, [strat.id]: strat.cooldown }));
    
    let updatedUnits = [...placedUnits];
    
    if (strat.id === 'ambush') {
      updatedUnits = updatedUnits.map(u => u.side === 'hostile' ? { ...u, size: Math.max(0, Math.floor(u.size * 0.75)) } : u);
      await addRoomLog(`⚡⭐ 【十面埋伏 · 动】施展「十面埋伏」古策！万弩齐发，合围四合，红方敌寇全员大本营兵勇大损削减 25%！`);
    } else if (strat.id === 'waterbattle') {
      updatedUnits = updatedUnits.map(u => {
        if (u.side === 'allied') {
          return { ...u, size: Math.min(u.id === 'u1' ? 25000 : 15000, u.size + 8000) };
        }
        return u;
      });
      await addRoomLog(`🌊🔥 【背水一战 · 发】三军在【${activeAnalysis.name.split(' (')[0]}】绝地搏命！拼死一搏回复 8000 兵力，战场狂暴杀伤力激增 2.5 倍！`);
    } else if (strat.id === 'feint') {
      await addRoomLog(`🌀🎭 【声东击西 · 动】主帅高升【佯攻】将纛！敌阵重军误置，敌方安插在沙盘的斥候/奸细眼线被悉数拆穿！`);
    } else if (strat.id === 'firestorm') {
      updatedUnits = updatedUnits.map(u => u.side === 'hostile' ? { ...u, size: Math.max(0, u.size - 8000) } : u);
      await addRoomLog(`🔥🏹 【神火燎原 · 烈】借助此地天风烈火，焚尽焦土，红寇在场所有人马瞬间遭受 8000 致命必杀火焰打击！`);
    } else if (strat.id === 'fortify') {
      await addRoomLog(`🛡️🏰 【坚壁清野 · 实】曹氏城防阵起！在未来 5 刻中，我方所有受击防御效果翻倍，几乎免疫所有侵攻伤害！`);
    } else if (strat.id === 'risestrat') {
      await addRoomLog(`💀🌋 【死地后生 · 绝】置之亡地而后存！推演进入破釜沉舟死战绝杀状态，双方杀戮折损提升 +300%！`);
    }
    
    // Apply changes
    if (multiplayerMode && remoteRoomId) {
      const unitsColRef = collection(db, 'rooms', remoteRoomId, 'mapUnits');
      updatedUnits.forEach(unit => {
        setDoc(doc(unitsColRef, unit.id), unit, { merge: true });
      });
    } else {
      setPlacedUnits(updatedUnits);
    }
  };

  const handleReprovision = async (unitId: string) => {
    const targetUnit = placedUnits.find(u => u.id === unitId);
    if (!targetUnit) return;

    const msg = `🌾 【漕运突击】督战官督调司农，向 [${targetUnit.name}] 飞骑输送粮料！该部曲粮饷当即充沛补给至 100%！`;
    await addRoomLog(msg);
    try {
      soundManager.playCoins();
    } catch (e) {}

    if (multiplayerMode && remoteRoomId) {
      try {
        const docRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', unitId);
        await updateDoc(docRef, { provisions: 100 });
        
        const roomRef = doc(db, 'rooms', remoteRoomId);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          const rData = roomSnap.data();
          const currentCoffers = rData.coffers !== undefined ? rData.coffers : 35000;
          await updateDoc(roomRef, { coffers: Math.max(0, currentCoffers - 1500) });
        }
      } catch (err) {
        console.error("Firestore reprovision update failed", err);
      }
    } else {
      setPlacedUnits(prev => prev.map(item => item.id === unitId ? { ...item, provisions: 100 } : item));
    }
    
    setSelectedUnit((prev: any) => prev && prev.id === unitId ? { ...prev, provisions: 100 } : prev);
  };

  const executeTick = () => {
    if (!isSimulating) return;

    if (multiplayerMode && !isHostingSim) {
      // Observer clients merely watch; only the Hosting client propagates updates.
      return;
    }
    
    // Copy current units to perform movement and combat operations atomically
    let updatedUnits = [...placedUnits];
    
    // Move Phase: Hostile units move towards the nearest allied unit based on Sun Tzu's 'Conflict of Interests' (争地 - CONTENTIOUS)
    let movedAnyHostile = false;
    let movedAnyAllied = false;
    const isContentious = activeAnalysis.id === 'CONTENTIOUS';
    const moveStepBase = 0.002; // general movement speed

    // Apply weather speed factors (Nine Lands logic)
    let weatherSpeedFactor = 1.0;
    if (weather === 'fog') weatherSpeedFactor = 0.75;  // Vision obscured, speeds down by 25%
    if (weather === 'rain') weatherSpeedFactor = 0.5;   // Muddy marsh like 圮地, speeds down by 50%
    if (weather === 'wind') weatherSpeedFactor = 1.4;   // Wind-favored forced march, speeds up by 40%

    const actualStep = (isContentious ? moveStepBase * 1.6 : moveStepBase) * weatherSpeedFactor; // modified by terrain & weather!

    // Allied movement step is governed directly by formation stances * weather speeds
    const alliedStep = (alliedStance === 'offensive' ? moveStepBase * 1.5 : moveStepBase * 0.45) * weatherSpeedFactor;

    updatedUnits = updatedUnits.map(unit => {
      if (unit.side === 'hostile' && unit.size > 0) {
        // Find nearest live allied unit
        let nearestAllied: typeof unit | null = null;
        let minDist = Infinity;
        
        updatedUnits.forEach(other => {
          if (other.side === 'allied' && other.size > 0) {
            const dist = Math.sqrt(Math.pow(other.lat - unit.lat, 2) + Math.pow(other.lng - unit.lng, 2));
            if (dist < minDist) {
              minDist = dist;
              nearestAllied = other;
            }
          }
        });

        if (nearestAllied) {
          const target = nearestAllied as typeof unit;
          const centerLat = activeAnalysis.lat;
          const centerLng = activeAnalysis.lng;

          // Compute intelligent A* path around obstacles (like mountains)
          const path = calculateAStarPath(
            { lat: unit.lat, lng: unit.lng },
            { lat: target.lat, lng: target.lng },
            centerLat,
            centerLng
          );

          if (path && path.length > 1) {
            // Find target waypoint that is sufficiently far away
            let targetWaypoint = path[1];
            for (let i = 1; i < path.length; i++) {
              const d = Math.sqrt(Math.pow(path[i].lat - unit.lat, 2) + Math.pow(path[i].lng - unit.lng, 2));
              if (d > 0.0012) {
                targetWaypoint = path[i];
                break;
              }
            }

            const dLat = targetWaypoint.lat - unit.lat;
            const dLng = targetWaypoint.lng - unit.lng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);

            if (distance > 0.0001) {
              const stepLat = (dLat / distance) * actualStep;
              const stepLng = (dLng / distance) * actualStep;

              // Prevent overshooting
              const newLat = Math.abs(stepLat) >= Math.abs(dLat) ? targetWaypoint.lat : unit.lat + stepLat;
              const newLng = Math.abs(stepLng) >= Math.abs(dLng) ? targetWaypoint.lng : unit.lng + stepLng;

              movedAnyHostile = true;
              return {
                ...unit,
                lat: Number(newLat.toFixed(5)),
                lng: Number(newLng.toFixed(5)),
              };
            }
          }
        }
      }

      // Allied movement (excluding headquarters u1 to keep static tactical camp realism)
      if (unit.side === 'allied' && unit.size > 0 && unit.id !== 'u1') {
        // Find nearest live hostile unit
        let nearestHostile: typeof unit | null = null;
        let minDist = Infinity;
        
        updatedUnits.forEach(other => {
          if (other.side === 'hostile' && other.size > 0) {
            const dist = Math.sqrt(Math.pow(other.lat - unit.lat, 2) + Math.pow(other.lng - unit.lng, 2));
            if (dist < minDist) {
              minDist = dist;
              nearestHostile = other;
            }
          }
        });

        if (nearestHostile) {
          const target = nearestHostile as typeof unit;
          const dLat = target.lat - unit.lat;
          const dLng = target.lng - unit.lng;
          const distance = Math.sqrt(dLat * dLat + dLng * dLng);
          
          if (distance > 0.001) {
            const stepLat = (dLat / distance) * alliedStep;
            const stepLng = (dLng / distance) * alliedStep;
            
            // Prevent overshooting
            const newLat = Math.abs(stepLat) >= Math.abs(dLat) ? target.lat : unit.lat + stepLat;
            const newLng = Math.abs(stepLng) >= Math.abs(dLng) ? target.lng : unit.lng + stepLng;
            
            movedAnyAllied = true;
            return {
              ...unit,
              lat: Number(newLat.toFixed(5)),
              lng: Number(newLng.toFixed(5)),
            };
          }
        }
      }
      return unit;
    });

    if (movedAnyAllied) {
      if (alliedStance === 'offensive') {
        addRoomLog(`⚔️ 【攻势悍行】我军先锋执「锋矢大阵」如狂飙般强袭并进，行军神速，急取强突遭遇战！`);
      } else {
        addRoomLog(`🛡️ 【守御进军】我军严结「方圆法阵」坚壁缓行。我方曲部守备周全，每步皆扼要守，徐图进退。`);
      }
    }

    if (movedAnyHostile) {
      if (isContentious) {
        addRoomLog(`📈 【争地合击 · 兵贵神速】敌寇深明“我得亦利、彼得亦利”之争。因在「争地(CONTENTIOUS)」对垒，合兵狂奔以 1.6倍 突袭我军最近守军！`);
      } else {
        addRoomLog(`🏃‍♂️ 【哨骑进逼】敌寇探察到我军踪迹，其突围主力正全力进逼大营。`);
      }
    }

    // Battle and Tactics Phase
    const baseAttackBonus = activeAnalysis.id === 'DEATH' ? 1.5 : (activeAnalysis.id === 'CONTENTIOUS' ? 1.3 : 1.0);
    const baseDefenseBonus = activeAnalysis.id === 'SCATTERED' ? 1.4 : 1.0;

    // Phase 3: Dynamic Stratagem attack and defense modifiers
    let stratagemAttackBonus = 1.0;
    let stratagemDefenseBonus = 1.0;
    
    if (activeStratagem === 'risestrat') {
      stratagemAttackBonus = 4.0;
    } else if (activeStratagem === 'waterbattle') {
      stratagemAttackBonus = 2.5;
    } else if (activeStratagem === 'ambush') {
      stratagemAttackBonus = 1.5;
    }

    if (activeStratagem === 'fortify') {
      stratagemDefenseBonus = 0.15; // 85% reduction!
    } else if (activeStratagem === 'feint') {
      stratagemDefenseBonus = 0.20; // 80% reduction!
    } else if (activeStratagem === 'risestrat') {
      stratagemDefenseBonus = 4.0; // high casualties for both sides!
    }

    const attackBonus = baseAttackBonus * stratagemAttackBonus;
    const defenseBonus = baseDefenseBonus / stratagemDefenseBonus; // dividing here so higher defenseBonus reduces incoming dmg
    
    // Choose randomly which team attacks or makes a move
    const rand = Math.random();
    if (rand < 0.35) {
      // Allied attacks Hostile
      const stanceDmgMultiplier = alliedStance === 'offensive' ? 1.5 : 1.0;
      const dmg = Math.floor((1500 + Math.random() * 2000) * attackBonus * stanceDmgMultiplier);
      const targetIdx = updatedUnits.findIndex(u => u.side === 'hostile' && u.size > 0);
      if (targetIdx !== -1) {
        const u = updatedUnits[targetIdx];
        const newSize = Math.max(0, u.size - dmg);
        updatedUnits[targetIdx] = { ...u, size: newSize };
        
        if (activeStratagem) {
          const sObj = STRATAGEMS.find(s => s.id === activeStratagem);
          addRoomLog(`⚡ 【奇计发威 · 攻】我军乘【${sObj?.name.split(' (')[0]}】之大势，对敌寇 [${u.name}] 造成重创，歼灭其 ${dmg} 兵力！`);
        } else if (alliedStance === 'offensive') {
          addRoomLog(`💥 【我军 · 狂飙突刺】锋矢猛刺！我部极速冲击，重创敌寇 [${u.name}] 并斩杀 ${dmg} 人！`);
        } else {
          addRoomLog(`⚔️ 【我军 · 稳健扫击】主力立盾合击，对敌残寇 [${u.name}] 斩获 ${dmg} 人。`);
        }
      }
    } else if (rand < 0.7) {
      // Hostile attacks Allied
      const stanceDefenseMultiplier = alliedStance === 'defensive' ? 1.6 : 0.8;
      // Invert defenseBonus back to a direct division multiplier so that small values reduce dmg
      const finalDefenseDmgMultiplier = stanceDefenseMultiplier / stratagemDefenseBonus;
      const dmg = Math.floor((1200 + Math.random() * 1800) / (baseDefenseBonus * finalDefenseDmgMultiplier));
      const targetIdx = updatedUnits.findIndex(u => u.side === 'allied' && u.size > 0);
      if (targetIdx !== -1) {
        const u = updatedUnits[targetIdx];
        const newSize = Math.max(0, u.size - dmg);
        updatedUnits[targetIdx] = { ...u, size: newSize };
        
        if (activeStratagem === 'fortify') {
          addRoomLog(`🛡️ 【坚壁威阵】敌寇咆哮合击我部 [${u.name}]，但我军凭【坚壁清野】固如金汤！敌强梁未能伤我分毫，仅折退 ${dmg} 编制！`);
        } else if (activeStratagem === 'feint') {
          addRoomLog(`🌀 【虚实惑敌】敌寇受我军【声东击西】佯动误导，其合围攻击溃不成军，仅微擦伤我部 [${u.name}] 约 ${dmg} 人。`);
        } else if (alliedStance === 'defensive') {
          addRoomLog(`🛡️ 【防务告捷】敌寇合击我军 [${u.name}]，我部严执「方圆法阵」岿然不动，得功力减震仅退避 ${dmg} 编制。`);
        } else {
          addRoomLog(`🔥 【强袭遇挫】敌寇策应侧后，猛击我部锋矢大阵软肋，我军 [${u.name}] 折损 ${dmg} 兵勇（攻势防备薄弱）。`);
        }
      }
    } else {
      // Strategy triggered based on selection
      if (generalChoice === 'baiqi' && activeAnalysis.id === 'DEATH') {
        addRoomLog(`⚡【白起·决死陷阵】“血战必生！” 杀神白起在死地合击爆发出震天呐喊，敌军战线土崩瓦解！`);
        updatedUnits = updatedUnits.map(u => u.side === 'hostile' ? { ...u, size: Math.max(0, u.size - 4000) } : u);
      } else if (generalChoice === 'hanxin' && activeAnalysis.id === 'ENTRAPPING') {
        addRoomLog(`⭐【韩信·背水一战】“置之死地而后生，置之亡地而后存！” 兵仙利用地税截击，使敌军阵脚大乱！`);
        updatedUnits = updatedUnits.map(u => u.side === 'hostile' ? { ...u, size: Math.max(0, u.size - 3000) } : u);
      } else {
        addRoomLog(`📜 引据《孙子》地利之道，我军在【${activeAnalysis.name}】上激发武侯阵法：${activeAnalysis.bonusName}。`);
      }
    }

    // Phase 4: Fire Attack (火攻篇) Simulation Tick Integration
    let updatedFires = [...fireFlares];
    const resolvedFires: typeof fireFlares = [];

    updatedFires.forEach(fire => {
      // Weather impact on fire duration
      let timerDecrement = 1;
      if (weather === 'rain') {
        timerDecrement = 2; // rain douses fire faster
        addRoomLog(`🌧️ 暴雨浇洒！【${FIRE_TACTICS.find(t=>t.id===fire.tactic)?.name}】火场势头受抑，正在迅速熄灭。`);
      } else if (weather === 'wind') {
        addRoomLog(`💨 烈风呼卷！【${FIRE_TACTICS.find(t=>t.id===fire.tactic)?.name}】火借风烈，向周围战场猛烈蔓延！`);
      }

      const nextTimer = fire.timer - timerDecrement;

      if (nextTimer > 0) {
        // Calculate fire damage to units near this fire
        updatedUnits = updatedUnits.map(unit => {
          if (unit.size <= 0) return unit;
          const dist = Math.sqrt(Math.pow(unit.lat - fire.lat, 2) + Math.pow(unit.lng - fire.lng, 2));
          // roughly within 2.5km (0.025 degrees)
          if (dist < 0.025) {
            let baseFireDmg = 0;
            let dmgLabel = "";

            if (fire.tactic === 'fire_men') {
              baseFireDmg = 2500 + Math.floor(Math.random() * 2000);
              dmgLabel = "一曰火人：熊熊大火肆虐其军人马";
            } else if (fire.tactic === 'fire_goods') {
              baseFireDmg = 1500 + Math.floor(Math.random() * 1000);
              dmgLabel = "二曰火积：火漫其屯粮积蓄物资";
            } else if (fire.tactic === 'fire_carts') {
              baseFireDmg = 1000 + Math.floor(Math.random() * 800);
              dmgLabel = "三曰火辎：大火燃尽马匹行车后勤";
            } else if (fire.tactic === 'fire_arm') {
              baseFireDmg = 4000 + Math.floor(Math.random() * 2000);
              dmgLabel = "四曰火库：引燃军械油库惊天爆裂";
            } else if (fire.tactic === 'fire_camp') {
              baseFireDmg = 800 + Math.floor(Math.random() * 850);
              dmgLabel = "五曰火队：奇袭攻营哨所";
            }

            // Wind doubles fire damage!
            if (weather === 'wind') {
              baseFireDmg *= 1.8;
            } else if (weather === 'rain') {
              baseFireDmg *= 0.4;
            }

            const finalFireDmg = Math.floor(baseFireDmg);
            const sideLabel = unit.side === 'allied' ? '我军' : '敌寇';
            addRoomLog(`🔥 【火攻肆虐】火场【${dmgLabel}】在 ${unit.name} 阵地吞噬扩散，该【${sideLabel}】部曲瞬间损耗 ${finalFireDmg} 人！`);
            return { ...unit, size: Math.max(0, unit.size - finalFireDmg) };
          }
          return unit;
        });

        resolvedFires.push({
          ...fire,
          timer: nextTimer,
          intensity: weather === 'wind' ? Math.min(5, fire.intensity + 1) : fire.intensity,
          tactic: fire.tactic,
          id: fire.id,
          lat: fire.lat,
          lng: fire.lng
        });
      } else {
        addRoomLog(`🪵 【战火熄灭】此处的【${FIRE_TACTICS.find(t=>t.id===fire.tactic)?.zhName}】火势余烬燃尽，黑烟逐渐散去。`);
      }
    });

    setFireFlares(resolvedFires);

    // Provisions System (粮草值、大本营补给半径与绝粮编制折损)
    const alliedBase = updatedUnits.find(u => u.side === 'allied' && (u.id === 'u1' || u.name.includes('大本营') || u.name.includes('军帐')));
    const hostileBase = updatedUnits.find(u => u.side === 'hostile' && (u.id === 'u3' || u.name.includes('主帅营') || u.name.includes('大本营')));
    
    const SUPPLY_RADIUS = 0.015;

    updatedUnits = updatedUnits.map(unit => {
      if (unit.size <= 0) return unit;

      // Base camp itself is always full provisions
      const isBaseCamp = unit.id === 'u1' || unit.id === 'u3' || unit.name.includes('大本营') || unit.name.includes('军帐') || unit.name.includes('主帅营');
      if (isBaseCamp) {
        return { ...unit, provisions: 100 };
      }

      const baseCamp = unit.side === 'allied' ? alliedBase : hostileBase;
      if (!baseCamp) {
        // Fallback: stay full if no base exists
        return { ...unit, provisions: 100 };
      }

      const dist = Math.sqrt(Math.pow(unit.lat - baseCamp.lat, 2) + Math.pow(unit.lng - baseCamp.lng, 2));
      const currentProv = unit.provisions !== undefined ? unit.provisions : 100;

      if (dist <= SUPPLY_RADIUS) {
        const nextProv = Math.min(100, currentProv + 20);
        if (currentProv < 55 && nextProv >= 55) {
          addRoomLog(`🌾 【重获补给】我部 [${unit.name}] 靠拢大本营/补给圈（距离 ${(dist * 100).toFixed(1)} 里），粮秣接通，粮饷已恢复至 ${nextProv}%！`);
        }
        return { ...unit, provisions: nextProv };
      } else {
        const nextProv = Math.max(0, currentProv - 15);
        if (nextProv === 0) {
          const hungerLoss = Math.floor(unit.size * 0.08 + 400);
          const nextSize = Math.max(0, unit.size - hungerLoss);
          const sideText = unit.side === 'allied' ? '我军' : '敌寇';
          addRoomLog(`❌🌾 【绝粮饥馑】${sideText} [${unit.name}] 远离大本营（离本营 ${(dist * 100).toFixed(1)} 里，安全限径 ${SUPPLY_RADIUS * 100} 里），粮草断尽！引发饥荒逃逸，被迫削减编制 ${hungerLoss} 员！`);
          return { ...unit, provisions: 0, size: nextSize };
        } else {
          if (nextProv <= 45 && currentProv > 45) {
            const sideText = unit.side === 'allied' ? '我军' : '敌寇';
            addRoomLog(`⚠️ 【粮饷告警】${sideText} [${unit.name}] 突入外线深入（离本营 ${(dist * 100).toFixed(1)} 里），漕运受累，粮草余 ${nextProv}%！速归防区或调度漕运辎重！`);
          }
          return { ...unit, provisions: nextProv };
        }
      }
    });

    // Phase 3: Decrement stratagem active timers & cooldowns
    setStratagemTimer(prev => {
      if (prev === 1 && activeStratagem) {
        setTimeout(() => {
          addRoomLog(`⏳ 【妙算效尽】我军施展的古代奇计战法【${STRATAGEMS.find(s=>s.id===activeStratagem)?.name.split(' (')[0]}】时效已尽，大阵气运徐徐退去。`);
          setActiveStratagem(null);
        }, 100);
        return 0;
      }
      return Math.max(0, prev - 1);
    });

    setStratagemCooldowns(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        if (updated[k] > 0) {
          updated[k] -= 1;
        }
      });
      return updated;
    });

    // Apply the updated units state back to local state (offline) or to Firestore (multiplayer)
    if (multiplayerMode && remoteRoomId) {
      const unitsColRef = collection(db, 'rooms', remoteRoomId, 'mapUnits');
      updatedUnits.forEach(unit => {
        setDoc(doc(unitsColRef, unit.id), unit, { merge: true });
      });
    } else {
      setPlacedUnits(updatedUnits);
    }

    // Phase 2: Advance timeline tick and record snapshot for 4D playback
    setTimelineTick(prev => {
      const nextTick = prev + 1;
      
      setShichenIndex(prevIdx => {
        const nextIdx = (nextTick % 3 === 0) ? (prevIdx + 1) % 12 : prevIdx;
        
        // Aggregate forces metric
        const alliedStrength = updatedUnits.filter(u => u.side === 'allied').reduce((sum, u) => sum + u.size, 0);
        const hostileStrength = updatedUnits.filter(u => u.side === 'hostile').reduce((sum, u) => sum + u.size, 0);
        
        const snapshot = {
          tick: nextTick,
          shichen: SHICHENS[nextIdx].name,
          shichenIndex: nextIdx,
          units: JSON.parse(JSON.stringify(updatedUnits)),
          simLogs: [`第 [${nextTick}] 步推演胜负对攻 | 天演时辰: ${SHICHENS[nextIdx].name}`, ...simLog],
          weather: weather as any,
          alliedStrength,
          hostileStrength
        };
        
        setHistoryStack(currStack => [...currStack, snapshot].slice(-50));
        return nextIdx;
      });
      
      return nextTick;
    });

    // Check end condition
    const alliedLive = updatedUnits.filter(u => u.side === 'allied').reduce((sum, u) => sum + u.size, 0);
    const hostileLive = updatedUnits.filter(u => u.side === 'hostile').reduce((sum, u) => sum + u.size, 0);

    if (alliedLive <= 0) {
      addRoomLog(`❌ 【社稷沦丧】我军在大舆图要攻防守失守，奇袭沙盘推演告负。退归咸阳朝堂反修己过！`);
      if (multiplayerMode && remoteRoomId) {
        // Option 2: Dynamic sync of battle defeat to the lobby state
        (async () => {
          try {
            const roomRef = doc(db, 'rooms', remoteRoomId);
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
              const data = roomSnap.data();
              const currentMandate = data.mandate !== undefined ? data.mandate : 80;
              const currentStability = data.stability !== undefined ? data.stability : 80;
              const currentCoffers = data.coffers !== undefined ? data.coffers : 35000;
              const incidentLogs = data.recentIncidents || [];
              const battleName = selectedBattlefield?.name ? selectedBattlefield.name.split(' (')[0] : "神州边隘要冲";

              await updateDoc(roomRef, {
                mapBattleSimulating: false,
                mandate: Math.max(0, currentMandate - 10),
                stability: Math.max(0, currentStability - 12),
                coffers: Math.max(0, currentCoffers - 7500),
                recentIncidents: [
                  `⚠️ 惨祸大闻！我朝主力部曲在【${battleName}】前沿合击告负，军费损折 7500 贯，国运大坠，全防戒严！`,
                  ...incidentLogs
                ].slice(0, 5),
                updatedAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.error("Option 2 Defeat roomState Sync Error:", e);
            await updateDoc(doc(db, 'rooms', remoteRoomId), { mapBattleSimulating: false });
          }
        })();
      } else {
        setIsSimulating(false);
      }
    } else if (hostileLive <= 0) {
      addRoomLog(`🏆 【天命所归】大胜！我朝大军在舆图前沿完美收网，斩帅夺旗，成功犁庭扫穴！`);
      if (multiplayerMode && remoteRoomId) {
        // Option 2: Dynamic sync of battle victory to the lobby state
        (async () => {
          try {
            const roomRef = doc(db, 'rooms', remoteRoomId);
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
              const data = roomSnap.data();
              const currentMandate = data.mandate !== undefined ? data.mandate : 80;
              const currentStability = data.stability !== undefined ? data.stability : 80;
              const currentCoffers = data.coffers !== undefined ? data.coffers : 35000;
              const incidentLogs = data.recentIncidents || [];
              const battleName = selectedBattlefield?.name ? selectedBattlefield.name.split(' (')[0] : "远东要口";

              await updateDoc(roomRef, {
                mapBattleSimulating: false,
                mandate: Math.min(100, currentMandate + 12),
                stability: Math.min(100, currentStability + 15),
                coffers: currentCoffers + 12000,
                recentIncidents: [
                  `🌸 大捷祥瑞！前线王师在【${battleName}】大破敌寇，斩获辎重战利 12000 贯，天命大涨，举国欢庆！`,
                  ...incidentLogs
                ].slice(0, 5),
                updatedAt: serverTimestamp()
              });
            }
          } catch (e) {
            console.error("Option 2 Victory roomState Sync Error:", e);
            await updateDoc(doc(db, 'rooms', remoteRoomId), { mapBattleSimulating: false });
          }
        })();
      } else {
        setIsSimulating(false);
      }
    }
  };

  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      if (!multiplayerMode || isHostingSim) {
        timer = setInterval(() => {
          executeTick();
        }, 2000 / timeSpeed);
      }
    }
    return () => clearInterval(timer);
  }, [isSimulating, placedUnits, activeAnalysis, generalChoice, simLog, alliedStance, multiplayerMode, isHostingSim, timeSpeed, weather, timelineTick, shichenIndex]);

  // Option 3 / Step 3: Execute Action of Deployed Spy on Map
  const handleSpyAction = async (spy: any, actionType: 'EXPOSE' | 'SABOTAGE' | 'FORGE' | 'PLUNDER') => {
    if (!multiplayerMode || !remoteRoomId) return;

    let logText = '';
    let isMartyred = false;
    let isCaptured = false;
    const rand = Math.random();

    try {
      // Fetch current room state to get general values
      const roomRef = doc(db, 'rooms', remoteRoomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const rData = roomSnap.data();
      let currentStability = rData.stability !== undefined ? rData.stability : 80;
      let currentMandate = rData.mandate !== undefined ? rData.mandate : 80;
      let currentCoffers = rData.coffers !== undefined ? rData.coffers : 35000;

      if (actionType === 'EXPOSE') {
        // Expose flaw / decrease morale
        await updateDoc(roomRef, {
          mapBattleStance: 'offensive', // Forces stance to shift or exposes vulnerability
          recentIncidents: [
            `👁️ 谍战破袭！细作 【${spy.name}】 在 【${spy.targetName || '要塞'}】 暗中指认出敌军防御中后空隙，我军全线将士得书振奋！`,
            ...(rData.recentIncidents || [])
          ].slice(0, 5)
        });
        logText = `👁️ 【用间探查】细作 【${spy.name}】 于 【${spy.targetName || '前沿区域'}】 成功买通了敌方守关偏将，获取了敌防区地利弱点公文，敌军弱点彻底点破！`;
        if (rand < 0.25) isMartyred = true;
      }
      else if (actionType === 'SABOTAGE') {
        // Sabotage hostile unit troops on map
        const hostiles = placedUnits.filter(u => u.side === 'hostile' && u.size > 0);
        if (hostiles.length > 0) {
          // find closest hostile unit, or first
          const targetUnit = hostiles[0];
          const damage = Math.floor(Math.random() * 3000) + 5000;
          const nextSize = Math.max(0, targetUnit.size - damage);
          
          const unitDocRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', targetUnit.id);
          if (nextSize <= 0) {
            await deleteDoc(unitDocRef);
            logText = `🔥 【用间毒毁】绝响！细作 【${spy.name}】 向敌军军粮水源中投撒草乌砒霜，敌部曲 [${targetUnit.name}] 溃灭不存！`;
          } else {
            await updateDoc(unitDocRef, { size: nextSize });
            logText = `🔥 【用间火攻】密谋！细作 【${spy.name}】 暗中引燃了敌部曲 [${targetUnit.name}] 的火药辎重，营盘崩溃，兵卒焚死减损 ${damage} 人！`;
          }
        } else {
          logText = `🔥 【用间火攻】细作 【${spy.name}】 放火焚毁了敌宿关门，因原无驻营敌寇，仅作震慑！`;
        }
        if (rand < 0.35) isCaptured = true;
      }
      else if (actionType === 'FORGE') {
        // Forge fake order: confuse troops, reducing power and mandate up
        const hostiles = placedUnits.filter(u => u.side === 'hostile' && u.size > 0);
        if (hostiles.length > 0) {
          const targetUnit = hostiles[0];
          const damage = Math.floor(Math.random() * 2000) + 4000;
          const nextSize = Math.max(0, targetUnit.size - damage);
          const unitDocRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', targetUnit.id);

          // Shift coordinates slightly to represent retreat chaos
          const offsetLat = (Math.random() - 0.5) * 0.01;
          const offsetLng = (Math.random() - 0.5) * 0.01;

          if (nextSize <= 0) {
            await deleteDoc(unitDocRef);
          } else {
            await updateDoc(unitDocRef, { 
              size: nextSize,
              lat: targetUnit.lat + offsetLat,
              lng: targetUnit.lng + offsetLng
            });
          }
          logText = `📜 【伪造圣旨】细作 【${spy.name}】 伪造敌王廷退守金符，传错军令，令其部曲 [${targetUnit.name}] 军心大乱离营散走，残军在流窜中退避！`;
        } else {
          logText = `📜 【伪造圣旨】细作 【${spy.name}】 伪编公文泄露，并无战事，空折诡端！`;
        }
        if (rand < 0.30) isMartyred = true;
      }
      else if (actionType === 'PLUNDER') {
        // Plunder: Steal coffers
        const plunderVal = Math.floor(Math.random() * 3000) + 4500;
        await updateDoc(roomRef, {
          coffers: currentCoffers + plunderVal,
          recentIncidents: [
            `💰 谍战捷报！细作 【${spy.name}】 在前线成功窃取外敌大库，府库暴涨 ${plunderVal} 贯入司农！`,
            ...(rData.recentIncidents || [])
          ].slice(0, 5)
        });
        logText = `💰 【指认劫库】细作 【${spy.name}】 获悉敌辎重金箱车走向，假借流马，成功为朝堂劫运 ${plunderVal} 贯军资，充公拨付大司农！`;
        if (rand < 0.28) isCaptured = true;
      }

      // Update Spy state on Firestore
      const spyDocRef = doc(db, 'rooms', remoteRoomId, 'spies', spy.id);
      if (isMartyred) {
        await updateDoc(spyDocRef, { state: 'MARTYRED' });
        logText += ` 🚨 剧终：情报暴露，细作 【${spy.name}】 不幸被敌将当阵枭首，壮烈牺牲！`;
      } else if (isCaptured) {
        await updateDoc(spyDocRef, { state: 'CAPTURED' });
        logText += ` 🚨 漏网：潜伏痕迹败露，细作 【${spy.name}】 不幸遭遇外寇军法司捕拿，打入大牢囚禁拷问！`;
      } else {
        logText += ` ✨ 潜潜无踪，细作全身而退，依旧稳妥匿伏！`;
      }

      // Write action to room's logs
      await addRoomLog(logText);
      setSelectedSpy(null);
    } catch (e) {
      console.error("Spy map action execution fail:", e);
    }
  };

  const handleIgniteFire = async (lat: number, lng: number, tactic: 'fire_men' | 'fire_goods' | 'fire_carts' | 'fire_arm' | 'fire_camp') => {
    const tObj = FIRE_TACTICS.find(t => t.id === tactic);
    const newFire = {
      id: 'fire-' + Date.now(),
      lat,
      lng,
      intensity: weather === 'wind' ? 4 : 2,
      tactic,
      timer: 6, // 6 simulation ticks
    };
    
    setFireFlares(prev => [...prev, newFire]);
    setSelectedFireTactic(null); // auto deselect after ignition!

    await addRoomLog(`🔥🔫 【火攻大作】我军在坐标（纬: ${lat.toFixed(4)}，经: ${lng.toFixed(4)}）猛烈施展【${tObj?.zhName} · ${tObj?.name.split(' (')[0]}】！火舌瞬起焚毁一切营盘！`);
    
    // If it's the arsenal blast (fire_arm), immediately apply -6000 damage to any enemy units in range
    if (tactic === 'fire_arm') {
      let isApplied = false;
      const rangeLimit = 0.025;
      const updatedUnitsList = placedUnits.map(u => {
        if (u.side === 'hostile' && u.size > 0) {
          const dist = Math.sqrt(Math.pow(u.lat - lat, 2) + Math.pow(u.lng - lng, 2));
          if (dist < rangeLimit) {
            isApplied = true;
            return { ...u, size: Math.max(0, u.size - 6000) };
          }
        }
        return u;
      });
      setPlacedUnits(updatedUnitsList);
      if (isApplied) {
        await addRoomLog(`💥 【爆裂轰鸣】军械库大爆裂！在火场范围内的敌寇由于轰然烈火发生连环自燃爆破，瞬间折粮折兵 6000 人！`);
      }
    } else if (tactic === 'fire_camp') {
      // Infiltrator clears fog
      setFogOfWarEnabled(false);
      await addRoomLog(`👁️ 【行军揭破】火队奇兵焚门起烟！由于敌军廊关被火光照透，敌寇大军所设伪装和斥候眼目尽在眼前，战场迷雾（Fog of War）被连带攻散彻见！`);
    }
  };

  const handleMapClick = async (e: any) => {
    let latVal = 0;
    let lngVal = 0;
    if (e.detail?.latLng) {
      latVal = e.detail.latLng.lat;
      lngVal = e.detail.latLng.lng;
    } else if (e.latLng) {
      latVal = e.latLng.lat();
      lngVal = e.latLng.lng();
    } else {
      return;
    }

    // Phase 4: Handle active fire ignition
    if (selectedFireTactic) {
      await handleIgniteFire(latVal, lngVal, selectedFireTactic);
      return;
    }

    // 1. Check if we are currently ordering a unit to march (isTargetingMoveId is active)
    if (isTargetingMoveId) {
      const unitMoving = placedUnits.find(u => u.id === isTargetingMoveId);
      if (unitMoving) {
        const msg = `📢 【调兵谴将】下令部曲 [${unitMoving.name}] 拔营转进至坐标点（纬: ${latVal.toFixed(3)}，经: ${lngVal.toFixed(3)}）重组据守防线！`;
        await addRoomLog(msg);

        if (multiplayerMode && remoteRoomId) {
          try {
            const unitDocRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', isTargetingMoveId);
            await updateDoc(unitDocRef, {
              lat: latVal,
              lng: lngVal
            });
          } catch(err) {
            console.error(err);
          }
        } else {
          setPlacedUnits(prev => prev.map(u => u.id === isTargetingMoveId ? { ...u, lat: latVal, lng: lngVal } : u));
        }
      }
      setIsTargetingMoveId(null);
      return;
    }

    setSelectedBattlefield(null);
    setCustomPoint({ lat: latVal, lng: lngVal });
    
    const analysis = analyzePoint(latVal, lngVal);
    setActiveAnalysis(analysis);
    
    // 2. Trigger custom placement form overlay
    setPendingDeployCoords({ lat: latVal, lng: lngVal });
  };

  const finalizeDeployment = async () => {
    if (!pendingDeployCoords) return;
    const { lat, lng } = pendingDeployCoords;
    const newUnitId = `custom_${Date.now()}`;
    
    const newUnit = {
      id: newUnitId,
      name: newUnitName,
      side: newUnitSide,
      lat: lat,
      lng: lng,
      size: newUnitSize,
      provisions: 100,
      creatorUid: currentUser?.uid || 'offline',
      creatorName: warlordName
    };

    const msg = `⛺ 【安营扎寨】在经纬度 (纬:${lat.toFixed(3)}, 经:${lng.toFixed(3)}) 下设了部曲部署：[${newUnitName}] (统卒: ${newUnitSize}，势力: ${newUnitSide === 'allied' ? '🛡️ 我方防卫营' : '🏹 敌寇拦截营'})！`;
    await addRoomLog(msg);

    if (multiplayerMode && remoteRoomId) {
      try {
        const docRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', newUnitId);
        await setDoc(docRef, newUnit);
      } catch (err) {
        console.error("Firestore push failed:", err);
      }
    } else {
      setPlacedUnits(prev => [...prev, newUnit]);
    }

    setPendingDeployCoords(null);
  };

  return (
    <div className="bg-[#F5F2ED] border-2 border-[#1A1A1A] rounded p-4 md:p-6 space-y-6 flex flex-col h-full" id="realworld-map-battle-container">
      {/* Title & Introduction HUD */}
      {activeCardId && (
        <div className="bg-[#8C2F39]/5 border-2 border-[#8C2F39]/30 p-3 rounded-lg flex items-center justify-between text-xs animate-pulse text-[#8C2F39] font-serif shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C2F39] animate-spin" />
            <div>
              <span className="font-bold">【极速兵法鸣震 · {
                activeCardId === 'qizheng' ? '《奇正相生》首级御宝' :
                activeCardId === 'huogong' ? '《火攻奇袭》烈炎秘卷' :
                activeCardId === 'wujian' ? '《五间妙连》通幽罗网' :
                '《商战大垄》国课税书'
              }】</span>
              <span className="text-stone-700 ml-1.5 font-sans">
                {activeCardId === 'qizheng' 
                  ? '谷歌地图多九地兵要节点获得战术共振，我方白刃行军主力防御力与突袭机动速律 +35%！' 
                  : '本阵地图受此大战略兵法偏厢协翼，大军斥候探查效率获得暂时增升。'}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] bg-[#8C2F39] text-[#FAF8F5] px-2 py-0.5 rounded font-black uppercase tracking-wider">星相加成大运</span>
        </div>
      )}
      <div className="border-b-2 border-[#1A1A1A]/95 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-[#8C2F39] tracking-wider uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#8C2F39] animate-pulse" />
            堪舆万象实境 x 《孙子兵法》
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A] flex items-center gap-2 mt-1">
            真实地图作战沙盘
          </h2>
          <p className="text-xs text-stone-600 font-serif leading-relaxed mt-1">
            本系统由谷歌高级地图模块强力自适应驱动。玩家可在真实的现代地球坐标轴上进行行军伏击、探察地形对特质将领加成，在真实的经纬度节点下定天命、筑法坛！
          </p>
        </div>

        {/* Map Mode Selector */}
        <div className="flex bg-stone-200 border border-black/10 rounded-lg p-1 shrink-0 self-end md:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMapMode('ink')}
            className={`px-3 py-1 text-xs font-serif font-bold rounded-md transition-all duration-200 cursor-pointer ${
              mapMode === 'ink'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-300'
            }`}
          >
            🌁 水墨意象古沙盘
          </button>
          <button
            type="button"
            onClick={() => setMapMode('google')}
            className={`px-3 py-1 text-xs font-serif font-bold rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              mapMode === 'google'
                ? 'bg-[#8C2F39] text-[#FAF8F5] shadow-sm'
                : 'text-stone-700 hover:bg-stone-300'
            }`}
          >
            🌍 谷歌高拟卫星图
            {!hasValidKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C2F39] animate-pulse inline-block" />
            )}
          </button>
        </div>
      </div>

      {/* 云端联机沙盘指挥官控制面板 Connected Center */}
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] rounded-lg p-4 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative overflow-hidden" id="multiplayer-hub-ribbon">
        {/* Decorative skewed backdrop accent */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-amber-900/5 -skew-x-12 translate-x-8 pointer-events-none" />
        
        <div className="space-y-1 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#8C2F39] text-[#FAF8F5] font-serif text-[10px] uppercase font-bold rounded">
              {multiplayerMode ? '📡 多人联机大沙盘' : '⛺ 单机演武'}
            </span>
            {multiplayerMode && (
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                syncState === 'connected' ? 'bg-emerald-500' :
                syncState === 'connecting' ? 'bg-amber-500 animate-bounce' :
                'bg-red-500'
              }`} />
            )}
            <span className="text-xs font-mono font-bold text-stone-600">
              {multiplayerMode
                ? `状态: ${syncState === 'connected' ? '🟢 联网成功 (已接入大天演阵)' : syncState === 'connecting' ? '⚡ 正在呼唤咸阳主网...' : '❌ 云端断联'}`
                : '🌸 状态: 本地推演 (未联入万民星罗阵)'
              }
            </span>
          </div>
          <p className="text-xs text-stone-500 leading-normal font-sans">
            {multiplayerMode
              ? `当前正与多位上将军共享推演。在下方真实的地球现代坐标格上，点击任意位置即可在云端部署部队、点击我军或敌军标记调派行军集结、生力军输送或解雇裁编，战线进度与全体统帅实时共享！`
              : `若要与多位玩家共同部署大军、实时观战，可以开启右侧联机模式，建立联大演武坛！`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 w-full xl:w-auto">
          {/* Mode toggle switch */}
          <button
            type="button"
            onClick={async () => {
              if (!multiplayerMode) {
                // Activate
                if (!currentUser) {
                  try {
                    setSyncState('connecting');
                    await signInAnonymously(auth);
                  } catch (err) {
                    console.error(err);
                    setSyncState('error');
                    return;
                  }
                }
                setMultiplayerMode(true);
              } else {
                setMultiplayerMode(false);
              }
            }}
            className={`px-4 py-1.5 text-xs font-serif font-black rounded border cursor-pointer transition-all duration-300 shadow-sm ${
              multiplayerMode
                ? 'bg-amber-800 text-white border-amber-950 hover:bg-amber-900'
                : 'bg-white hover:bg-stone-100 border-[#1A1A1A] text-stone-800'
            }`}
          >
            {multiplayerMode ? '🔌 切回单机演武' : '📡 开启云端多人天演'}
          </button>

          {multiplayerMode && (
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto bg-stone-100 p-2 rounded-md border border-stone-200">
              {/* Profile configurations */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-stone-600 font-serif">统帅名:</span>
                <input
                  type="text"
                  value={warlordName}
                  onChange={(e) => {
                    setWarlordName(e.target.value);
                    localStorage.setItem('warlord_name', e.target.value);
                    if (currentUser) {
                      updateProfile(currentUser, { displayName: e.target.value });
                    }
                  }}
                  className="px-2 py-0.5 text-xs bg-white border border-stone-300 rounded font-bold w-24 outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
                  placeholder="姓名"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-stone-600 font-serif">官职:</span>
                <select
                  value={warlordRole}
                  onChange={(e) => setWarlordRole(e.target.value)}
                  className="px-1.5 py-0.5 text-xs bg-white border border-stone-300 rounded font-serif text-[11px] outline-none"
                >
                  <option value="GENERAL">🛡️ 镇守大将军</option>
                  <option value="CHANCELLOR">📜 咸阳相国 / 军师</option>
                  <option value="REBEL">🏹 楚地起义军首脑</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 border-l border-stone-300 pl-2">
                <span className="text-[10px] font-bold text-stone-600 font-serif">演武战区:</span>
                <input
                  type="text"
                  value={remoteRoomId}
                  onChange={(e) => setRemoteRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="px-2 py-0.5 text-xs bg-white border border-stone-300 rounded font-mono font-bold w-24 outline-none"
                  placeholder="战区代号"
                />
              </div>

              {/* Host authorization toggle */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-stone-300">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHostingSim}
                    onChange={(e) => {
                      const active = e.target.checked;
                      setIsHostingSim(active);
                      if (active) {
                        addRoomLog(`👑 【执掌中军】进入了沙盘主控席，担当本战役的「推演控制官」，开始为整条战线统调行军！`);
                      } else {
                        addRoomLog(`🌱 【退居中军】让出了主控席。`);
                      }
                    }}
                    className="rounded border-stone-300 text-amber-800 focus:ring-amber-500 w-3 h-3 cursor-pointer"
                  />
                  <span className="text-[10px] font-serif font-black text-[#8C2F39]">推演主控权</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout of Battleground Cards & Terrain Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="realworld-grid">
        {/* Left column: Historical Battlefields Selection list */}
        <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
          <div className="bg-stone-100/50 border border-black/10 rounded-lg p-3 flex flex-col">
            <span className="text-[10px] font-mono text-stone-500 font-black mb-2 uppercase tracking-wide block">
              🏺 华夏名家经典战役地理
            </span>
            <div className="space-y-2 max-h-[280px] lg:max-h-[380px] overflow-y-auto pr-1" id="battlegrounds-list">
              {HISTORICAL_BATTLEFIELDS.map((bf) => {
                const isSelected = selectedBattlefield?.id === bf.id;
                return (
                  <button
                    key={bf.id}
                    type="button"
                    onClick={() => {
                      setSelectedBattlefield(bf);
                      setSelectedUnit(null);
                    }}
                    className={`w-full text-left p-2.5 rounded border transition-all duration-200 cursor-pointer outline-none ${
                      isSelected
                        ? 'bg-amber-900/10 border-amber-800 ring-1 ring-amber-800/20'
                        : 'bg-white hover:bg-stone-50 border-[#1A1A1A]/10 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-sans px-1 rounded bg-[#8C2F39]/10 text-[#8C2F39] font-bold">
                        {bf.dynasty}
                      </span>
                      <span className="text-[9px] font-mono text-stone-500">
                        {bf.lat.toFixed(2)}°, {bf.lng.toFixed(2)}°
                      </span>
                    </div>
                    <div className="font-serif font-black text-xs text-[#1A1A1A] mt-1">
                      {bf.name}
                    </div>
                    <div className="text-[9.5px] font-sans text-stone-600 truncate mt-0.5">
                      主帅: {bf.combatants}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Sun Tzu Terrain Analyzer Dashboard */}
          <div className="bg-[#FAF8F5] border border-dashed border-[#8C2F39]/50 rounded-lg p-4 space-y-3 shadow-2xs" id="terrain-analysis-card">
            <div className="flex items-center justify-between border-b pb-2 border-stone-200">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#8C2F39] animate-spin-slow" />
                <h3 className="font-serif font-black text-sm text-[#1A1A1A]">
                  九地神机天眼
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase ${activeAnalysis.badgeColor}`}>
                {activeAnalysis.name.split(' (')[0]}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-[#8C2F39] font-mono font-bold tracking-wider uppercase">
                ⚙️ 地理要素：{activeAnalysis.lat}° N, {activeAnalysis.lng}° E
              </div>
              
              <div className="bg-[#8C2F39]/5 p-2 rounded border border-[#8C2F39]/15">
                <p className="text-[11px] font-serif text-stone-800 italic leading-relaxed">
                  “ {activeAnalysis.classicQuote} ”
                  <span className="block text-right text-[9px] text-[#8C2F39] font-serif not-italic mt-1">——《孙子兵法·九地篇》</span>
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-serif text-stone-700 leading-normal text-[11px]">
                  <strong>【天眼策论】:</strong> {activeAnalysis.adviser}
                </p>
                <div className="p-2 bg-emerald-50 text-emerald-950 rounded border border-emerald-100 text-[11px] font-sans flex items-center gap-1">
                  <span className="text-[10px]">⭐ <b>天演实装加成:</b> {activeAnalysis.bonusName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3: Nine Lands Stratagem Sandtable Deck UI Component */}
          <div className="bg-[#FAF8F5] border border-stone-300 rounded-lg p-3.5 space-y-3 shadow-sm" id="stratagem-deck-card">
            <div className="flex items-center justify-between border-b pb-1.5 border-stone-200">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <h3 className="font-serif font-black text-xs text-[#1A1A1A]">
                  九地奇谋神兵
                </h3>
              </div>
              <span className="text-[7.5px] font-mono bg-[#8C2F39] text-stone-100 font-bold px-1 py-0.5 rounded shadow-sm leading-none whitespace-nowrap">
                加持中
              </span>
            </div>

            <p className="text-[9.5px] text-stone-500 font-sans leading-relaxed">
              根据当前选择的<b>主帅契合</b>或<b>战圈地利</b>触发古军阵法秘策，实时干预战场对弈走向：
            </p>

            <div className="grid grid-cols-1 gap-2 max-h-[305px] overflow-y-auto pr-1" id="stratagems-grid">
              {STRATAGEMS.map((strat) => {
                const isGeneralMatch = strat.general === 'any' || generalChoice === strat.general;
                const isTerrainMatch = strat.terrain === 'any' || activeAnalysis.id === strat.terrain;
                const isUnlocked = isGeneralMatch || isTerrainMatch;
                const cooldownCount = stratagemCooldowns[strat.id] || 0;
                const isCooldown = cooldownCount > 0;
                const isActive = activeStratagem === strat.id;

                let stateBadgeColor = "bg-stone-100 border-stone-300 text-stone-500";
                let stateLabel = "条件未合";
                if (isActive) {
                  stateBadgeColor = "bg-[#8C2F39] text-[#FAF8F5] border-red-500 animate-pulse font-bold";
                  stateLabel = "正在施展中";
                } else if (isCooldown) {
                  stateBadgeColor = "bg-amber-100 border-amber-300 text-amber-800 font-mono font-bold";
                  stateLabel = `冷却 ${cooldownCount} 刻`;
                } else if (isUnlocked) {
                  stateBadgeColor = "bg-emerald-100 border-emerald-300 text-emerald-800 font-black cursor-pointer hover:bg-emerald-200";
                  stateLabel = "天数已至·可施展";
                }

                return (
                  <button
                    key={strat.id}
                    type="button"
                    disabled={!isUnlocked || isCooldown || isActive}
                    className={`w-full text-left p-2 rounded border transition-all duration-200 relative outline-none block ${
                      isActive 
                        ? 'bg-[#8C2F39]/5 border-[#8C2F39] ring-1 ring-[#8C2F39]' 
                        : isUnlocked && !isCooldown
                          ? 'bg-amber-50/25 hover:bg-amber-50/55 border-stone-300 cursor-pointer shadow-3xs' 
                          : 'bg-stone-50/70 opacity-60 border-stone-200 cursor-not-allowed'
                    }`}
                    onClick={() => handleTriggerStratagem(strat)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-serif font-black text-[11px] text-stone-900 flex items-center gap-1">
                        🏮 {strat.name}
                      </span>
                      <span className={`text-[7.5px] font-bold px-1 rounded border leading-none py-0.5 ${stateBadgeColor}`}>
                        {stateLabel}
                      </span>
                    </div>

                    <p className="text-[9.5px] text-stone-600 font-sans leading-normal">
                      {strat.desc}
                    </p>

                    <div className="mt-1.5 pt-1 border-t border-dotted border-stone-200 flex flex-wrap justify-between items-center text-[8px] text-stone-500">
                      <div className="font-medium text-amber-900 py-0.5 max-w-[210px] truncate leading-none">
                        🎯 效用：<span className="font-bold">{strat.effectDesc}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[7px] leading-none mt-1 sm:mt-0">
                        {strat.general !== 'any' && (
                          <span className={`px-1 rounded py-[1px] ${isGeneralMatch ? 'bg-[#8C2F39]/15 text-[#8C2F39] border border-[#8C2F39]/20 font-bold' : 'bg-stone-200 text-stone-400'}`}>
                            帅:{strat.general === 'hanxin' ? '韩信' : strat.general === 'caocao' ? '曹操' : strat.general === 'caoren' ? '曹仁' : '白起'}
                          </span>
                        )}
                        {strat.terrain !== 'any' && (
                          <span className={`px-1 rounded py-[1px] ${isTerrainMatch ? 'bg-amber-950/15 text-amber-950 border border-amber-900/10 font-bold' : 'bg-stone-200 text-stone-400'}`}>
                            地:{strat.terrain}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase 4: Fire Attack (火攻篇) & Pathfinder (五路行军推荐) UI Deck Component */}
          <div className="bg-[#FAF8F5] border border-stone-300 rounded-lg p-3.5 space-y-3 shadow-sm" id="phase4-tactics-deck">
            <div className="flex items-center justify-between border-b pb-1.5 border-stone-200">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600 animate-pulse" />
                <h3 className="font-serif font-black text-xs text-stone-900">
                  军争寻路与火攻秘策
                </h3>
              </div>
              <span className="text-[7.5px] font-mono bg-orange-700 text-stone-50 font-bold px-1 py-0.5 rounded shadow-sm leading-none whitespace-nowrap">
                🔥 PHASE 4 LOADED
              </span>
            </div>

            {/* Sub-tab 1: Sun Tzu Chapter 12 Fire Attack (五五火攻战法) */}
            <div className="space-y-2 border-b pb-3 border-stone-200/60">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-[#8C2F39] flex items-center gap-1">
                <span>🔥</span> <b>古之五火攻法</b>
              </h4>
              <p className="text-[9px] text-stone-500 font-sans leading-relaxed">
                引据《孙子兵法·火攻篇》，选择火攻战法，并<b>在大舆图上左键点击</b>投掷引燃。火势会根据暴风、暴雨而变化，造成大范围毁灭：
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {FIRE_TACTICS.map((t) => {
                  const isSelected = selectedFireTactic === t.id;
                  const activeCounts = fireFlares.filter(f => f.tactic === t.id).length;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedFireTactic(isSelected ? null : t.id);
                        if (!isSelected) {
                          addRoomLog(`🎯 【部署引燃】已谋定古方火法【${t.zhName}】！请在大舆图上点击，选设起火位置！`);
                        }
                      }}
                      className={`text-left p-2 rounded border transition-all text-xs flex flex-col justify-between relative cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
                          : 'border-stone-200 bg-amber-50/10 hover:bg-stone-100/50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-serif font-bold text-stone-900 text-[10.5px]">
                          {t.zhName}
                        </span>
                        {activeCounts > 0 && (
                          <span className="bg-orange-600 text-stone-150 text-[7px] font-bold font-mono px-1 rounded-full animate-pulse">
                            {activeCounts} 处起火
                          </span>
                        )}
                      </div>
                      <p className="text-[8.5px] text-stone-500 mt-0.5 leading-snug">{t.desc}</p>
                      <div className="text-[8px] mt-1 pt-1 border-t border-dotted border-stone-200 text-amber-900 font-bold">
                        ⚡ 摧敌分量: {t.effect}
                      </div>

                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-600/5 rounded pointer-events-none flex items-center justify-center">
                          <span className="text-[8px] bg-orange-600 text-[#FAF8F5] px-1 rounded absolute bottom-1 right-1 font-sans animate-pulse font-bold scale-[0.95]">
                            已选定 · 请点击大舆图
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedFireTactic && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 text-orange-900 p-2 rounded text-[10px] leading-relaxed flex items-center gap-1.5"
                >
                  <span className="text-sm animate-bounce">🔥</span>
                  <div>
                    <span className="font-bold text-[#8C2F39]">战术瞄准中:</span> 请在右侧<b>水墨沙盘</b>或<b>谷歌现代卫星大图</b>任意位置点击，立即爆燃纵放！
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sub-tab 2: Pathfinder / Expedition Paths (军争寻路两翼) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-cyan-800 flex items-center gap-1">
                  <span>🧭</span> <b>行军军争两翼推荐</b>
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] text-stone-500 font-medium">显示兵道</span>
                  <input
                    type="checkbox"
                    checked={showPathfinders}
                    onChange={(e) => setShowPathfinders(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#8C2F39] rounded cursor-pointer"
                  />
                </div>
              </div>

              <p className="text-[9px] text-stone-500 font-sans leading-relaxed">
                引据《孙子兵法·军争篇》：“避其锐气，击其惰归”，参谋系统根据当下地利实时测控标定两类推荐行军轨迹：
              </p>

              {showPathfinders && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPathfinderType('direct');
                        addRoomLog(`🧭 【军争行军】我军更改推荐路线为「直离要冲之锋」，大部曲严整阵形，蓄势待发！`);
                      }}
                      className={`py-1.5 px-2 rounded border text-center transition-all text-[9.5px] cursor-pointer font-serif font-black ${
                        pathfinderType === 'direct'
                          ? 'bg-rose-50 border-red-600 text-red-700 ring-2 ring-red-100'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span>直趋要冲</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPathfinderType('detour');
                        addRoomLog(`🧭 【军争行军】我军切换行军谋划为「奇袭迂回险关」，派遣精骁在西北大障谷壑间秘密穿插！`);
                      }}
                      className={`py-1.5 px-2 rounded border text-center transition-all text-[9.5px] cursor-pointer font-serif font-black ${
                        pathfinderType === 'detour'
                          ? 'bg-cyan-50 border-cyan-600 text-cyan-800 ring-2 ring-cyan-100'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span>迂回险途</span>
                    </button>
                  </div>

                  {/* Route Details Overlay Panels based on route */}
                  {pathfinderType === 'direct' ? (
                    <div className="p-2.5 bg-rose-50/50 border border-red-100 rounded text-[9.5px] text-stone-700 space-y-1 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-8 h-8 opacity-10 font-bold font-serif text-3xl select-none">
                        尖
                      </div>
                      <div className="font-bold text-red-800 flex items-center gap-1">
                        <span>⚔️</span> <span>直趋突击线 · 兵贵神速</span>
                      </div>
                      <p className="leading-relaxed">
                        • 核心走廊: <b>直入前哨隘口 ➔ 击溃敌拦截部 ➔ 突袭敌军大帐</b>
                      </p>
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-red-100/60 font-mono text-[8.5px] text-red-900 font-bold">
                        <div>⌛ 耗时：3 刻间</div>
                        <div>⚠️ 伏兵：85% (极高)</div>
                        <div className="col-span-2 text-rose-700">👊 兵争效果: 锋矢大阵突击伤害额外加成 +40%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-cyan-50/50 border border-cyan-100 rounded text-[9.5px] text-stone-700 space-y-1 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-8 h-8 opacity-10 font-bold font-serif text-3xl select-none">
                        迂
                      </div>
                      <div className="font-bold text-cyan-800 flex items-center gap-1">
                        <span>🛡️</span> <span>迂回包抄线 · 击其惰归</span>
                      </div>
                      <p className="leading-relaxed">
                        • 核心走廊: <b>西北连绵大障 ➔ 密隐深谷底 ➔ 袭斩敌帅侧翼</b>
                      </p>
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-cyan-100/60 font-mono text-[8.5px] text-cyan-900 font-bold">
                        <div>⌛ 耗时：6 刻间</div>
                        <div>⚠️ 伏兵：15% (极低)</div>
                        <div className="col-span-2 text-cyan-700">👊 兵争效果: 我军全体方圆御敌硬度大增 +50%</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: The Map Canvas (SVGFallback or Live Google Map) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Main Map Frame */}
          <div 
            ref={stageRef} 
            className={`bg-stone-900 border-2 border-black rounded-lg w-full relative overflow-hidden shadow-md flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100] h-screen !border-0 !rounded-none' : 'aspect-video h-[450px]'}`}
            id="battle-map-stage"
          >

            {/* HUD Visbility Toggle */}
            <div className="absolute top-2 left-2 z-50 flex gap-2">
              <button 
                onClick={() => setShowHudOverlays(prev => !prev)}
                className="bg-stone-100/95 hover:bg-white text-stone-800 border-2 border-stone-800 rounded px-2.5 py-1 text-[10px] font-mono shadow-md flex items-center gap-1.5 transition-all cursor-pointer font-bold"
              >
                {showHudOverlays ? '👁️ 战区面板 (ON)' : '👁️ 战区面板 (OFF)'}
              </button>
              <button 
                onClick={() => setIsFullscreen(prev => !prev)}
                className="bg-stone-100/95 hover:bg-white text-stone-800 border-2 border-stone-800 rounded px-2.5 py-1 text-[10px] font-mono shadow-md flex items-center gap-1.5 transition-all cursor-pointer font-bold"
              >
                {isFullscreen ? '🗗 退出全屏' : '🖵 全屏模式'}
              </button>
            </div>
            
            {/* Animated Loading Overlay Status Indicator (Astronomical Radar Style) */}
            <AnimatePresence>
              {isMapLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#FAF8F5]/90 flex flex-col items-center justify-center z-40 text-center p-6 select-none"
                  id="map-loading-indicator-overlay"
                >
                  <div className="relative flex items-center justify-center mb-6">
                    {/* Compass/Radar outer spinning line */}
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#8C2F39] animate-spin absolute" style={{ animationDuration: '4s' }} />
                    {/* Intermediate spinning ring */}
                    <div className="w-12 h-12 rounded-full border border-dotted border-amber-700/50 animate-spin absolute" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                    {/* Deep center solid icon */}
                    <div className="w-8 h-8 rounded-full bg-[#8C2F39] flex items-center justify-center text-[#FAF8F5] text-xs font-serif font-black shadow-lg">
                      舆
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif font-black text-xs text-stone-900 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C2F39] animate-ping" />
                      九地天演盘 · 测绘关防中
                    </h4>
                    <p className="text-[10px] text-stone-500 font-serif max-w-xs leading-relaxed mx-auto">
                      正在排演古今地理数据重合点，计算险隘、大坎、峭谷、生息阵位等兵书要素...
                    </p>
                    {/* Smooth progressive bar mimicking load */}
                    <div className="w-48 h-1 bg-stone-200 rounded-full overflow-hidden mx-auto mt-2">
                      <motion.div 
                        className="h-full bg-amber-800"
                        initial={{ width: "10%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase 3: Active Stratagem Visual Calligraphy Banner Overlay */}
            <AnimatePresence>
              {activeStratagem && (
                <motion.div 
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none select-none bg-stone-950/40 backdrop-blur-[0.5px]"
                >
                  <div className="bg-[#FAF8F5]/95 border-2 border-[#8C2F39] text-[#8C2F39] px-6 py-4 rounded-md shadow-2xl relative max-w-sm text-center font-serif border-double">
                    {/* Corner decorative borders */}
                    <div className="absolute top-1 left-1 border-t-2 border-l-2 border-[#8C2F39] w-3 h-3" />
                    <div className="absolute top-1 right-1 border-t-2 border-r-2 border-[#8C2F39] w-3 h-3" />
                    <div className="absolute bottom-1 left-1 border-b-2 border-l-2 border-[#8C2F39] w-3 h-3" />
                    <div className="absolute bottom-1 right-1 border-b-2 border-r-2 border-[#8C2F39] w-3 h-3" />
                    
                    <div className="text-[10px] uppercase tracking-widest font-mono text-stone-500 mb-1">
                      🏮 Active Stratagem / 役用军道锦囊
                    </div>
                    <div className="text-xl font-black tracking-wider font-serif animate-pulse flex items-center justify-center gap-1.5">
                      🔥 {STRATAGEMS.find(s => s.id === activeStratagem)?.name}
                    </div>
                    <p className="text-[10.5px] text-stone-700 font-sans leading-relaxed mt-2 italic px-2">
                      “ {STRATAGEMS.find(s => s.id === activeStratagem)?.effectDesc} ”
                    </p>
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-amber-800 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C2F39] animate-ping" />
                      <span>阵战演武正在契受大将军阵法加成中... ({stratagemTimer} 刻)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {mapMode === 'ink' ? (
              /* High Polished Interactive SVG-Vector Watercolor Fallback Map */
              <div className="w-full h-full bg-[#EFEFEA] flex flex-col justify-between p-4 relative" style={{ backgroundImage: 'radial-gradient(#FAF8F5 1px, transparent 1px)', backgroundSize: '15px 15px' }}>
                
                {/* Visual calligraphy branding */}
                <div className="absolute right-4 top-4 select-none pointer-events-none opacity-[0.06] text-[80px] font-serif font-black leading-none text-[#8C2F39]">
                  地利
                </div>

                {/* Phase 2: Chrono Backtrack Watermark alert badge inside ink sandtable */}
                {timeTravelIndex >= 0 && (
                  <div className="absolute top-16 right-4 bg-[#8C2F39] text-stone-100 border border-amber-600 px-2.5 py-1 text-[8.5px] font-mono tracking-wider rounded uppercase animate-pulse z-30 shadow-lg flex items-center gap-1.5 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>CHRONO PLAYBACK / 时空推演回溯 (Tick #{timeTravelIndex + 1})</span>
                  </div>
                )}

                {/* Grid HUD overhead coordinates */}
                <div className="flex justify-between items-center bg-[#FAF8F5]/90 border border-stone-200 rounded p-1.5 shadow-sm text-[10px] font-mono z-10">
                  <div className="flex items-center gap-1.5 text-[#8C2F39]">
                    <MapIcon className="w-3.5 h-3.5" />
                    <span><b>模拟水墨意象沙盘</b></span>
                  </div>
                  <div>
                    经纬坐标: <span className="font-bold text-amber-900">{activeAnalysis.lat}° N, {activeAnalysis.lng}° E</span>
                  </div>
                </div>

                {/* SVG Visualizing positions & markers dynamically */}
                <div className="absolute inset-0 z-0 cursor-crosshair flex items-center justify-center p-8 select-none" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  
                  // Map X/Y click value back to simulated nearby coordinates 
                  const simulatedLat = activeAnalysis.lat + (clickY - rect.height / 2) * 0.0003;
                  const simulatedLng = activeAnalysis.lng + (clickX - rect.width / 2) * 0.0003;

                  // Phase 4: Handle active fire ignition
                  if (selectedFireTactic) {
                    handleIgniteFire(simulatedLat, simulatedLng, selectedFireTactic);
                    return;
                  }
                  
                  // 1. Check if we are currently ordering a unit to march (isTargetingMoveId is active)
                  if (isTargetingMoveId) {
                    const unitMoving = placedUnits.find(u => u.id === isTargetingMoveId);
                    if (unitMoving) {
                      const msg = `📢 【调兵谴将】下令部曲 [${unitMoving.name}] 拔营转进至坐标点（纬: ${simulatedLat.toFixed(3)}，经: ${simulatedLng.toFixed(3)}）重组据守防线！`;
                      addRoomLog(msg);

                      if (multiplayerMode && remoteRoomId) {
                        try {
                          const unitDocRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', isTargetingMoveId);
                          updateDoc(unitDocRef, {
                            lat: simulatedLat,
                            lng: simulatedLng
                          });
                        } catch(err) {
                          console.error(err);
                        }
                      } else {
                        setPlacedUnits(prev => prev.map(u => u.id === isTargetingMoveId ? { ...u, lat: simulatedLat, lng: simulatedLng } : u));
                      }
                    }
                    setIsTargetingMoveId(null);
                    return;
                  }

                  setSelectedBattlefield(null);
                  setCustomPoint({ lat: simulatedLat, lng: simulatedLng });
                  
                  const analysis = analyzePoint(simulatedLat, simulatedLng);
                  setActiveAnalysis(analysis);
                  
                  // 2. Open interactive deployment dialog
                  setPendingDeployCoords({ lat: simulatedLat, lng: simulatedLng });
                }}>
                  
                  {/* 3D Sandtable Perspective Transform Wrapper (Phase 1) */}
                  <div
                    className="absolute inset-0 transition-all duration-350 ease-out pointer-events-none"
                    style={{
                      transform: `perspective(1000px) rotateX(${mapTilt}deg) rotateZ(${-mapHeading}deg) scale(${1 + mapTilt * 0.00065})`,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="relative w-full h-full pointer-events-auto" style={{ transformStyle: 'preserve-3d' }}>
                      {/* Visual battlefield mountains background */}
                      <MemoizedBackgroundSVG />

                      {/* Phase 2: Dynamic Earthly Celestial Atmosphere Shade (Day/Sunset/Night) */}
                      <div 
                        className="absolute inset-0 pointer-events-none transition-all duration-1000 mix-blend-multiply" 
                        style={{ 
                          backgroundColor: SHICHENS[displayedShichenIndex].style,
                          transformStyle: 'preserve-3d',
                          zIndex: 1
                        }} 
                      />

                      {/* Interactive 3D Altitude elevation scanning mesh wireframe (Phase 1) */}
                      {gisAltitudeMesh && (
                        <div className="absolute inset-0 w-full h-full pointer-events-none z-2" style={{ transformStyle: 'preserve-3d' }}>
                          <svg className="absolute inset-0 w-full h-full opacity-35 mix-blend-multiply dark:mix-blend-screen" style={{ transformStyle: 'preserve-3d' }}>
                            {/* Grid scanning mesh lines */}
                            <g stroke="#8C2F39" strokeWidth="0.45" strokeOpacity="0.8">
                              {/* Horizontal grid scans */}
                              {Array.from({ length: 9 }).map((_, idx) => {
                                const y = 10 + idx * 10;
                                return <line key={`h-mesh-${idx}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} strokeDasharray={idx % 2 === 0 ? "4 6" : "1 4"} />;
                              })}
                              {/* Vertical grid scans */}
                              {Array.from({ length: 9 }).map((_, idx) => {
                                const x = 10 + idx * 10;
                                return <line key={`v-mesh-${idx}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" strokeDasharray={idx % 2 === 0 ? "4 6" : "1 4"} />;
                              })}
                            </g>
                            {/* Topographic elevation scanning concentric rings around the central tactical focus node */}
                            <g fill="none" stroke="#D97706" strokeWidth="0.55" strokeOpacity="0.75">
                              <circle cx="50%" cy="50%" r="8%" strokeDasharray="2 3" />
                              <circle cx="50%" cy="50%" r="18%" />
                              <circle cx="50%" cy="50%" r="28%" strokeDasharray="4 2" />
                              <circle cx="50%" cy="50%" r="38%" />
                            </g>
                            
                            {/* Simulated GIS Altitude elevation axis numbers on margins */}
                            <text x="3%" y="50%" fill="#8C2F39" fontSize="6.5" fontFamily="monospace" opacity="0.6">ALT: 3200m</text>
                            <text x="92%" y="54%" fill="#8C2F39" fontSize="6.5" fontFamily="monospace" opacity="0.6">LAT: 34.3°</text>
                            <text x="44%" y="97%" fill="#8C2F39" fontSize="6.5" fontFamily="monospace" opacity="0.6">奇门高程罗盘定位仪</text>
                          </svg>
                        </div>
                      )}

                  {/* Dynamic marching trails for the watercolor fallback sandtable map */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
                    {Object.entries(unitTrails).map(([unitId, val]) => {
                      const trail = val as Array<{lat: number; lng: number}>;
                      if (trail.length < 2) return null;
                      const unit = placedUnits.find(u => u.id === unitId);
                      if (!unit) return null;

                      const color = unit.side === 'allied' ? '#10B981' : '#EF4444';
                      const centerLat = selectedBattlefield ? selectedBattlefield.lat : 34.3415;
                      const centerLng = selectedBattlefield ? selectedBattlefield.lng : 108.9404;

                      const linesList = [];
                      for (let i = 0; i < trail.length - 1; i++) {
                        const p1 = trail[i];
                        const p2 = trail[i + 1];

                        const dLat1 = p1.lat - centerLat;
                        const dLng1 = p1.lng - centerLng;
                        const posX1 = 50 + dLng1 * 5000;
                        const posY1 = 50 - dLat1 * 5000;

                        const dLat2 = p2.lat - centerLat;
                        const dLng2 = p2.lng - centerLng;
                        const posX2 = 50 + dLng2 * 5000;
                        const posY2 = 50 - dLat2 * 5000;

                        if (posX1 < 0 || posX1 > 100 || posY1 < 0 || posY1 > 100 || posX2 < 0 || posX2 > 100 || posY2 < 0 || posY2 > 100) {
                          continue;
                        }

                        linesList.push(
                          <line
                            key={`${unitId}-seg-${i}`}
                            x1={`${posX1}%`}
                            y1={`${posY1}%`}
                            x2={`${posX2}%`}
                            y2={`${posY2}%`}
                            stroke={color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeOpacity={0.4 + (i / trail.length) * 0.6}
                            strokeDasharray="5 4"
                          />
                        );
                      }
                      return linesList;
                    })}

                    {/* Phase 4: Dynamic Scout Pathfinder Line Segments on the Ink Fallback Map */}
                    {showPathfinders && (() => {
                      const centerLat = selectedBattlefield ? selectedBattlefield.lat : 34.3415;
                      const centerLng = selectedBattlefield ? selectedBattlefield.lng : 108.9404;

                      const project = (lat: number, lng: number) => {
                        const dLat = lat - centerLat;
                        const dLng = lng - centerLng;
                        return {
                          x: 50 + dLng * 5000,
                          y: 50 - dLat * 5000
                        };
                      };

                      const dCoords = [
                        { lat: centerLat - 0.015, lng: centerLng - 0.015 },
                        { lat: centerLat, lng: centerLng },
                        { lat: centerLat + 0.015, lng: centerLng + 0.015 }
                      ];

                      const dtCoords = [
                        { lat: centerLat - 0.015, lng: centerLng - 0.015 },
                        { lat: centerLat - 0.005, lng: centerLng - 0.022 },
                        { lat: centerLat + 0.010, lng: centerLng - 0.018 },
                        { lat: centerLat + 0.015, lng: centerLng + 0.015 }
                      ];

                      const list = [];
                      if (pathfinderType === 'direct') {
                        for (let i = 0; i < dCoords.length - 1; i++) {
                          const p1 = project(dCoords[i].lat, dCoords[i].lng);
                          const p2 = project(dCoords[i+1].lat, dCoords[i+1].lng);
                          list.push(
                            <line
                              key={`direct-path-seg-${i}`}
                              x1={`${p1.x}%`} y1={`${p1.y}%`}
                              x2={`${p2.x}%`} y2={`${p2.y}%`}
                              stroke="#DC2626"
                              strokeWidth="45"
                              strokeWidthAttribute="4"
                              strokeDasharray="6 4"
                              strokeOpacity="0.75"
                              style={{ strokeWidth: 4 }}
                            />
                          );
                        }
                      } else {
                        for (let i = 0; i < dtCoords.length - 1; i++) {
                          const p1 = project(dtCoords[i].lat, dtCoords[i].lng);
                          const p2 = project(dtCoords[i+1].lat, dtCoords[i+1].lng);
                          list.push(
                            <line
                              key={`detour-path-seg-${i}`}
                              x1={`${p1.x}%`} y1={`${p1.y}%`}
                              x2={`${p2.x}%`} y2={`${p2.y}%`}
                              stroke="#06B6D4"
                              strokeWidth="4"
                              strokeDasharray="8 4"
                              strokeOpacity="0.85"
                              style={{ strokeWidth: 4 }}
                            />
                          );
                        }
                      }
                      return list;
                    })()}
                  </svg>

                  {/* Active Anchor Center Flag */}
                  <motion.div 
                    key={selectedBattlefield ? `bf-${selectedBattlefield.id}` : 'custom'}
                    initial={{ scale: 0, opacity: 0, y: -25 }}
                    animate={{ 
                      scale: isSimulating ? [1, 1.15, 1] : 1, 
                      opacity: 1, 
                      y: 0 
                    }}
                    transition={{ 
                      scale: isSimulating 
                        ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
                        : { type: 'spring', stiffness: 260, damping: 15 },
                      opacity: { duration: 0.35 },
                      y: { type: 'spring', stiffness: 260, damping: 15 }
                    }}
                    className="absolute z-10 flex flex-col items-center pointer-events-none transition-transform duration-350 ease-out"
                    style={{
                      transform: `translate(-50%, -50%) rotateX(${-mapTilt}deg) rotateY(0deg) rotateZ(${mapHeading}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div className="relative">
                      {isSimulating && (
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-rose-600/30 border-2 border-rose-500"
                          animate={{ scale: [0.8, 2.2], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                        />
                      )}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSimulating ? 'bg-rose-600/20 border border-rose-500' : 'bg-[#8C2F39]/20 border border-[#8C2F39]'} animate-ping`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-rose-600' : 'bg-[#8C2F39]'}`} />
                      </div>
                    </div>
                    <span className={`text-[9px] font-serif font-black px-1.5 py-0.5 rounded-sm mt-1.5 whitespace-nowrap shadow border flex items-center gap-1 ${
                      isSimulating 
                        ? 'bg-rose-950 text-rose-100 border-rose-700 animate-pulse' 
                        : 'bg-amber-950 text-[#FAF8F5] border-amber-900/50'
                    }`}>
                      {isSimulating && <span className="animate-pulse">⚔️</span>}
                      {selectedBattlefield ? selectedBattlefield.name.split(' (')[0] : '天命标定点'}
                    </span>
                  </motion.div>

                  {/* Rendering Mountain Obstacles on the Watercolor Fallback Map */}
                  <MemoizedMountainObstacles 
                    centerLat={selectedBattlefield ? selectedBattlefield.lat : 34.3415} 
                    centerLng={selectedBattlefield ? selectedBattlefield.lng : 108.9404} 
                    mapTilt={mapTilt}
                    mapHeading={mapHeading}
                  />

                  {/* Rendering Deployed Active Spies on the fallback vector ink map (Step 3) */}
                  {multiplayerMode && spiesList
                    .filter(spy => spy.state === 'IDLE' && spy.targetLat !== undefined)
                    .map((spy) => {
                      const deltaLat = spy.targetLat! - (selectedBattlefield ? selectedBattlefield.lat : 34.3415);
                      const deltaLng = spy.targetLng! - (selectedBattlefield ? selectedBattlefield.lng : 108.9404);
                      const posX = 50 + deltaLng * 5000;
                      const posY = 50 - deltaLat * 5000;
                      
                      if (posX < 5 || posX > 95 || posY < 5 || posY > 95) return null;

                      return (
                        <motion.div
                          key={`spy-ink-${spy.id}`}
                          className="absolute cursor-pointer z-20 group"
                          style={{ x: "-50%", y: "-50%", transformStyle: 'preserve-3d' }}
                          animate={{ left: `${posX}%`, top: `${posY}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSpy(spy);
                            setSelectedUnit(null);
                          }}
                        >
                          <div 
                            className="flex flex-col items-center transition-transform duration-350 ease-out"
                            style={{ 
                              transform: `rotateX(${-mapTilt}deg) rotateY(0deg) rotateZ(${mapHeading}deg)`, 
                              transformStyle: 'preserve-3d' 
                            }}
                          >
                            <div className="h-6 w-6 rounded-full bg-amber-950/95 border-2 border-amber-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-amber-300">
                              <span className="text-[10px]">👁️</span>
                            </div>
                            <span className="text-[7.5px] font-bold bg-[#FAF8F5]/90 text-stone-900 border border-amber-700 rounded-sm px-1.2 py-0.2 mt-0.5 whitespace-nowrap shadow-xs">
                              🕵️ {spy.name}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}

                  {/* Rendering Placed Units on the falling back vector stage */}
                  {displayedUnits
                    .filter(u => u.side === 'allied' || isUnitRevealed(u))
                    .map((u) => {
                      const isDamaged = Boolean(damagedUnits[u.id] && (Date.now() - damagedUnits[u.id] < 800));
                      return (
                        <SmoothInkMarker
                          key={u.id}
                          u={u}
                          selectedBattlefield={selectedBattlefield}
                          isDamaged={isDamaged}
                          alliedStance={alliedStance}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUnit(u);
                          }}
                          setSelectedUnit={setSelectedUnit}
                          mapTilt={mapTilt}
                          mapHeading={mapHeading}
                        />
                      );
                    })}

                   {/* Phase 4: Active Tactical Fire Flares on the Watercolor Fallback Map */}
                   {fireFlares.map((fire) => {
                     const deltaLat = fire.lat - (selectedBattlefield ? selectedBattlefield.lat : 34.3415);
                     const deltaLng = fire.lng - (selectedBattlefield ? selectedBattlefield.lng : 108.9404);
                     const posX = 50 + deltaLng * 5000;
                     const posY = 50 - deltaLat * 5000;
                     
                     if (posX < 0 || posX > 100 || posY < 0 || posY > 100) return null;

                     return (
                       <motion.div
                         key={fire.id}
                         className="absolute z-25 pointer-events-none"
                         style={{ left: `${posX}%`, top: `${posY}%`, x: "-50%", y: "-50%", transformStyle: 'preserve-3d' }}
                       >
                         <div 
                           className="flex flex-col items-center transition-transform duration-350 ease-out"
                           style={{ 
                             transform: `rotateX(${-mapTilt}deg) rotateY(0deg) rotateZ(${mapHeading}deg)`, 
                             transformStyle: 'preserve-3d' 
                           }}
                         >
                           <motion.div 
                             className="text-2xl drop-shadow-[0_0_8px_rgba(239,68,68,0.85)] relative"
                             animate={{ 
                               scale: [1, 1.25, 0.95, 1.15, 1],
                               y: [0, -3, 0, -1, 0]
                             }}
                             transition={{ 
                               repeat: Infinity, 
                               duration: 0.9 + Math.random() * 0.3,
                               ease: "easeInOut"
                             }}
                           >
                             🔥
                             <motion.div 
                               className="absolute inset-0 rounded-full bg-orange-500/25 blur-md"
                               animate={{ scale: [1, 1.6, 1] }}
                               transition={{ repeat: Infinity, duration: 1.2 }}
                             />
                           </motion.div>
                           <span className="text-[7px] font-mono bg-stone-900 text-orange-400 border border-orange-500 rounded px-1.2 py-0.2 mt-0.5 whitespace-nowrap shadow-xs font-bold leading-none">
                             {FIRE_TACTICS.find(t=>t.id===fire.tactic)?.zhName || "纵火"} ({fire.timer} 刻)
                           </span>
                         </div>
                       </motion.div>
                     );
                   })}
                   
                   {mapVisualFx.map(fx => {
                       const deltaLat = fx.lat - (selectedBattlefield ? selectedBattlefield.lat : 34.3415);
                       const deltaLng = fx.lng - (selectedBattlefield ? selectedBattlefield.lng : 108.9404);
                       const px = 50 + deltaLng * 5000;
                       const py = 50 - deltaLat * 5000;
                       if (px < 0 || px > 100 || py < 0 || py > 100) return null;
                       return (
                         <motion.div
                           key={fx.id}
                           className="absolute z-[100] text-4xl drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] pointer-events-none"
                           style={{ left: `${px}%`, top: `${py}%`, x: "-50%", y: "-50%" }}
                           initial={{ scale: 0.2, opacity: 0, rotate: fx.type === 'clash' ? -45 : 0 }}
                           animate={{ scale: [2.5, 1.3, 0.8, 0], opacity: [1, 1, 0.8, 0], rotate: fx.type === 'clash' ? [-45, 0, 15, -15] : 0 }}
                           transition={{ duration: 1.2, ease: "easeOut" }}
                         >
                           {fx.type === 'clash' ? '⚔️' : '💥'}
                         </motion.div>
                       );
                   })}
                    </div>
                  </div>
                </div>

                {/* Footer Callout how to activate satellite map view */}
                <div className="z-10 bg-amber-50/95 border border-amber-800/20 rounded p-2.5 shadow-sm text-[10px] leading-relaxed text-stone-800 font-sans" id="maps-instruction-footer">
                  <div className="font-bold text-[#8C2F39] flex items-center gap-1 mb-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>想要查看高拟真现代卫星谷歌地图与实景？</span>
                  </div>
                  <p>
                    <b>唤醒卫星实景步骤：</b> 在右上角 <b>设置 (⚙️齿轮)</b> 中添加密匙名称为 <code>GOOGLE_MAPS_PLATFORM_KEY</code>，并将密钥保存进去，即可开启高清地形卫星图、路径天演与街景连携推演！
                  </p>
                </div>
              </div>
            ) : (
              /* Google Maps Real Integration (With Mandatory API Key Check Splash Screen) */
              <div className="w-full h-full relative flex flex-col justify-between" id="google-maps-parent">
                {!hasValidKey ? (
                  <div className="w-full h-full bg-[#FAF8F5] border border-stone-200 flex flex-col items-center justify-center p-6 text-center overflow-y-auto select-none" id="google-maps-setup-splash">
                    <div className="max-w-md bg-white border border-[#1A1A1A]/10 rounded-xl p-5 sm:p-6 shadow-xl space-y-4 text-left border-t-4 border-t-[#8C2F39]">
                      
                      {/* Header with unlocked map concept */}
                      <div className="flex items-start gap-3 border-b pb-3 border-stone-100">
                        <div className="p-2 rounded-lg bg-amber-50 text-[#8C2F39] flex-shrink-0 animate-pulse">
                          <Compass className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <h3 className="font-serif font-black text-[#1A1A1A] text-sm tracking-tight leading-tight">
                            天眼连携 · 卫星测绘图激活法门
                          </h3>
                          <p className="text-[9px] text-stone-500 font-sans tracking-wide uppercase mt-0.5">
                            Interactive Multi-Dimensional Command Setup
                          </p>
                        </div>
                      </div>

                      {/* Descriptive Intro text */}
                      <p className="text-[11px] text-stone-600 font-serif leading-relaxed">
                        本沙盘已支持将现代 <b>卫星舆图实景</b> 联动于《孙子兵法》九地阵术中，能够实时解析全球经纬之势。仅需三步，即可唤醒地利：
                      </p>

                      {/* Gorgeous styled 3-step process cards */}
                      <div className="space-y-3.5 font-sans text-stone-700">
                        {/* Step 1 */}
                        <div className="flex gap-2.5 items-start bg-stone-50/80 p-2.5 rounded-lg border border-stone-100 transition hover:bg-stone-55">
                          <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full bg-amber-800 text-amber-50 font-mono text-[9px] font-bold flex items-center justify-center">1</span>
                          <div className="text-[11px] space-y-0.5">
                            <h4 className="font-bold text-[#1A1A1A] flex items-center gap-1">
                              获取谷歌秘钥 Key 
                              <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-[#8C2F39] hover:underline font-extrabold inline-flex items-center gap-0.5">
                                [点击免费领取 ↗]
                              </a>
                            </h4>
                            <p className="text-[9.5px] text-stone-500">点击即可前往谷歌开发者控制台，快速创建自己的 Maps 谷歌秘钥</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-2.5 items-start bg-stone-50/80 p-2.5 rounded-lg border border-stone-100 transition hover:bg-stone-55">
                          <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full bg-amber-800 text-amber-50 font-mono text-[9px] font-bold flex items-center justify-center">2</span>
                          <div className="text-[11px] space-y-0.5">
                            <h4 className="font-bold text-[#1A1A1A]">安置入阁门</h4>
                            <p className="text-[9.5px] text-stone-500">
                              在大天演仪右上角 <b>Settings (⚙️齿轮)</b> → <b>Secrets (密令)</b> 里输入：
                            </p>
                            <div className="font-mono text-[9px] bg-[#FAF8F5] border px-2 py-1.5 rounded mt-1 select-all hover:bg-stone-100">
                              密匙名称: <strong className="text-stone-900 border-r pr-1 border-stone-300">GOOGLE_MAPS_PLATFORM_KEY</strong> <br/>
                              密匙内容: <span className="text-amber-800 font-semibold">填写你的实物通关令牌...</span>
                            </div>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-2.5 items-start bg-[#8C2F39]/5 p-2.5 rounded-lg border border-[#8C2F39]/10">
                          <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full bg-[#8C2F39] text-[#FAF8F5] font-mono text-[9px] font-bold flex items-center justify-center">✓</span>
                          <div className="text-[11px] space-y-0.5">
                            <h4 className="font-bold text-amber-950">万象俱生 · 无缝天演加载</h4>
                            <p className="text-[9.5px] text-amber-900 leading-normal">
                              贴入保存后，系统自适应在后台捕获配置并动态使之生效，无需任何多余操作，大舆图沙盘一触即发！
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setMapMode('ink')}
                          className="w-full bg-[#8C2F39] text-[#FAF8F5] hover:bg-[#8C2F39]/90 text-xs font-serif font-black py-2.5 rounded-lg transition-all shadow-md active:scale-[0.99] cursor-pointer text-center"
                        >
                          🏰 返回 “水墨意象古沙盘fallback” 演兵
                        </button>
                        <p className="text-[8.5px] text-stone-400 text-center leading-none">
                          水墨沙盘可以完美演练部队部署、特务行间渗透等所有天演功能！
                        </p>
                      </div>

                    </div>
                  </div>
                ) : (
                  <APIProvider apiKey={API_KEY} version="weekly">
                    <div className="w-full h-full relative font-sans" id="live-google-map-container">
                      
                      {/* Phase 2: Dynamic Ambient Shade (Day/Sunset/Night) over Satellite Tiles */}
                      <div 
                        className="absolute inset-0 pointer-events-none transition-all duration-1000 mix-blend-multiply z-1" 
                        style={{ 
                          backgroundColor: SHICHENS[displayedShichenIndex].style,
                        }} 
                      />

                      {/* Phase 2: Chrono Backtrack Watermark alert badge */}
                      {timeTravelIndex >= 0 && (
                        <div className="absolute top-3 right-3 bg-[#8C2F39] text-stone-100 border border-amber-600 px-3 py-1 text-[9px] font-mono tracking-widest rounded-md uppercase animate-pulse z-40 shadow-xl flex items-center gap-1.5 pointer-events-none">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>CHRONO PLAYBACK / 时空推演回溯 (Tick #{timeTravelIndex + 1})</span>
                        </div>
                      )}

                      {/* Overlay Map Help Panel */}
                      <div className="absolute left-3 top-3 bg-[#FAF8F5]/95 border border-stone-300 rounded p-2 z-10 shadow-md text-[10px] space-y-1">
                        <div className="font-serif font-bold text-[#8C2F39] flex items-center gap-1">
                          <Activity className="w-3 h-3 text-[#8C2F39] animate-pulse" />
                          <span><b>实时卫星战研战例连携中</b></span>
                        </div>
                        <p className="text-stone-600 font-sans">
                          • <b>左键任意点击地图：</b> 采集坐标并同步九地地形分析<br />
                          • <b>点击单位标记：</b> 查看该部曲的编制数和防务状态
                        </p>
                      </div>

                      {/* Google Map component from vis.gl SDK */}
                      <Map
                        defaultCenter={{ lat: activeAnalysis.lat, lng: activeAnalysis.lng }}
                        center={{ lat: activeAnalysis.lat, lng: activeAnalysis.lng }}
                        defaultZoom={11}
                        zoom={mapZoom}
                        tilt={mapTilt}
                        heading={mapHeading}
                        onCameraChanged={(ev) => {
                          setMapZoom(ev.detail.zoom);
                          if (ev.detail.tilt !== undefined) {
                            setMapTilt(ev.detail.tilt);
                          }
                          if (ev.detail.heading !== undefined) {
                            setMapHeading(ev.detail.heading);
                          }
                        }}
                        gestureHandling={'greedy'}
                        mapId="DEMO_MAP_ID"
                        mapTypeId={'satellite'} // terrain / satellite / roadmap
                        onClick={handleMapClick}
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {/* Selected battle center icon */}
                        <AdvancedMarker position={{ lat: activeAnalysis.lat, lng: activeAnalysis.lng }}>
                          <motion.div
                            key={selectedBattlefield ? `live-bf-${selectedBattlefield.id}` : 'live-custom'}
                            initial={{ scale: 0, opacity: 0, y: -20 }}
                            animate={{ 
                              scale: isSimulating ? [1.1, 1.25, 1.1] : 1.1, 
                              opacity: 1, 
                              y: 0 
                            }}
                            transition={{ 
                              scale: isSimulating 
                                ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" } 
                                : { type: 'spring', stiffness: 260, damping: 15 },
                              opacity: { duration: 0.35 },
                              y: { type: 'spring', stiffness: 260, damping: 15 }
                            }}
                            className="relative flex flex-col items-center pointer-events-none"
                          >
                            {isSimulating && (
                              <motion.div 
                                className="absolute -inset-2 rounded-full border-2 border-rose-500 bg-rose-500/20"
                                animate={{ scale: [0.8, 1.8], opacity: [0.7, 0] }}
                                transition={{ repeat: Infinity, duration: 1.3, ease: "easeOut" }}
                              />
                            )}
                            <Pin 
                              background={isSimulating ? "#DC2626" : "#8C2F39"} 
                              glyphColor="#FAF8F5" 
                              scale={1.2} 
                            />
                            {/* Overlay tag displaying active terrain details */}
                            <div className={`mt-1 shadow border px-1.5 py-0.5 rounded text-[8px] font-serif font-black whitespace-nowrap ${
                              isSimulating 
                                ? 'bg-rose-950 text-rose-100 border-rose-600 animate-pulse' 
                                : 'bg-amber-950 text-[#FAF8F5] border-amber-900/50'
                            }`}>
                              {isSimulating && '⚔️ '}
                              {selectedBattlefield ? selectedBattlefield.name.split(' (')[0] : '天命标定点'}
                            </div>
                          </motion.div>
                        </AdvancedMarker>

                        {/* Custom visual mountain obstacles mapped directly on Google Map (if Google Maps mode is active) */}
                        {TACTICAL_MOUNTAINS.map((obs) => {
                          const centerLat = selectedBattlefield ? selectedBattlefield.lat : 34.3415;
                          const centerLng = selectedBattlefield ? selectedBattlefield.lng : 108.9404;
                          const oLat = centerLat + obs.latOffset;
                          const oLng = centerLng + obs.lngOffset;
                          return (
                            <AdvancedMarker
                              key={obs.id}
                              position={{ lat: oLat, lng: oLng }}
                            >
                              <div className="flex flex-col items-center pointer-events-none">
                                {/* Semi transparent circular warning range of the mountain peak */}
                                <div 
                                  className="rounded-full bg-amber-950/20 border border-amber-600/40 border-dashed flex items-center justify-center animate-pulse"
                                  style={{
                                    width: `${Math.max(45, Math.min(240, 95 * Math.pow(2, mapZoom - 11) * (obs.radius / 0.012)))}px`,
                                    height: `${Math.max(45, Math.min(240, 95 * Math.pow(2, mapZoom - 11) * (obs.radius / 0.012)))}px`
                                  }}
                                >
                                  <span className="text-[12px] leading-none">🏔️</span>
                                </div>
                                <span className="bg-stone-900/90 text-amber-200 border border-amber-900/40 text-[8px] font-serif px-1.5 py-0.5 rounded shadow mt-0.5 whitespace-nowrap">
                                  {obs.name}
                                </span>
                              </div>
                            </AdvancedMarker>
                          );
                        })}

                        {/* Custom visual troop checkpoints mapped directly on satellite tiles */}
                        {displayedUnits
                          .filter(u => u.side === 'allied' || isUnitRevealed(u))
                          .map((u) => {
                            const isDamaged = Boolean(damagedUnits[u.id] && (Date.now() - damagedUnits[u.id] < 800));
                            return (
                              <SmoothAdvancedMarker
                                key={u.id}
                                u={u}
                                alliedStance={alliedStance}
                                isDamaged={isDamaged}
                                onClick={() => setSelectedUnit(u)}
                              />
                            );
                          })}

                        {/* Dynamic marching trails mapped directly on Google Map (satellite tiles) */}
                        {Object.entries(unitTrails).map(([unitId, val]) => {
                          const trail = val as Array<{lat: number; lng: number}>;
                          if (trail.length < 2) return null;
                          const unit = displayedUnits.find(u => u.id === unitId);
                          if (!unit) return null;
                          const color = unit.side === 'allied' ? '#10B981' : '#EF4444';
                          return (
                            <MapPolyline
                              key={`polyline-g-${unitId}`}
                              path={trail}
                              color={color}
                            />
                          );
                        })}

                        {/* Visual Battle Overlays on Google Map */}
                        {mapVisualFx.map(fx => (
                          <AdvancedMarker key={fx.id} position={{ lat: fx.lat, lng: fx.lng }} zIndex={999}>
                             <motion.div
                               className="text-4xl drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] pointer-events-none"
                               initial={{ scale: 0.2, opacity: 0, rotate: fx.type === 'clash' ? -45 : 0 }}
                               animate={{ scale: [2.5, 1.3, 0.8, 0], opacity: [1, 1, 0.8, 0], rotate: fx.type === 'clash' ? [-45, 0, 15, -15] : 0 }}
                               transition={{ duration: 1.2, ease: "easeOut" }}
                             >
                               {fx.type === 'clash' ? '⚔️' : '💥'}
                             </motion.div>
                          </AdvancedMarker>
                        ))}

                        {/* Custom visual spies mapped directly on satellite tiles (Step 3) */}
                        {multiplayerMode && spiesList
                          .filter(spy => spy.state === 'IDLE' && spy.targetLat !== undefined)
                          .map((spy) => (
                            <AdvancedMarker
                              key={`spy-g-${spy.id}`}
                              position={{ lat: spy.targetLat!, lng: spy.targetLng! }}
                              onClick={() => {
                                setSelectedSpy(spy);
                                setSelectedUnit(null);
                              }}
                            >
                              <div className="flex flex-col items-center cursor-pointer">
                                <div className="h-6 w-6 rounded-full bg-amber-950 border-2 border-amber-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-amber-300">
                                  <span className="text-[12px]">👁️</span>
                                </div>
                                <span className="bg-[#FAF8F5]/90 border border-amber-700 text-stone-900 text-[8px] font-sans font-bold px-1.5 py-0.5 rounded shadow mt-0.5 whitespace-nowrap">
                                  🕵️ {spy.name}
                                </span>
                              </div>
                            </AdvancedMarker>
                          ))}

                        {/* Phase 4: Active Tactical Fire Flares mapped directly on Google Map (satellite tiles) */}
                        {fireFlares.map((fire) => (
                          <AdvancedMarker
                            key={`fire-g-${fire.id}`}
                            position={{ lat: fire.lat, lng: fire.lng }}
                          >
                            <div className="flex flex-col items-center pointer-events-none">
                              <motion.div
                                className="text-2xl drop-shadow-[0_0_12px_rgba(239,68,68,0.9)] relative"
                                animate={{
                                  scale: [1.1, 1.35, 1.05, 1.25, 1.1],
                                  y: [0, -4, 0, -2, 0]
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.85 + Math.random() * 0.25,
                                  ease: "easeInOut"
                                }}
                              >
                                🔥
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-orange-600/30 blur-md"
                                  animate={{ scale: [1, 1.8, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.0 }}
                                />
                              </motion.div>
                              <span className="bg-stone-950/95 text-orange-400 border border-orange-500 font-mono text-[7px] font-bold px-1 py-0.2 rounded shadow mt-0.5 whitespace-nowrap leading-none">
                                {FIRE_TACTICS.find(t=>t.id===fire.tactic)?.zhName || "放火"} ({fire.timer} 刻)
                              </span>
                            </div>
                          </AdvancedMarker>
                        ))}

                        {/* Phase 4: Dynamic Scout Pathfinder Paths on Google Map */}
                        {showPathfinders && (() => {
                          const centerLat = selectedBattlefield ? selectedBattlefield.lat : 34.3415;
                          const centerLng = selectedBattlefield ? selectedBattlefield.lng : 108.9404;

                          const dCoords = [
                            { lat: centerLat - 0.015, lng: centerLng - 0.015 },
                            { lat: centerLat, lng: centerLng },
                            { lat: centerLat + 0.015, lng: centerLng + 0.015 }
                          ];

                          const dtCoords = [
                            { lat: centerLat - 0.015, lng: centerLng - 0.015 },
                            { lat: centerLat - 0.005, lng: centerLng - 0.022 },
                            { lat: centerLat + 0.010, lng: centerLng - 0.018 },
                            { lat: centerLat + 0.015, lng: centerLng + 0.015 }
                          ];

                          if (pathfinderType === 'direct') {
                            return (
                              <MapPolyline
                                key="pathfinder-direct"
                                path={dCoords}
                                color="#DC2626"
                              />
                            );
                          } else {
                            return (
                              <MapPolyline
                                key="pathfinder-detour"
                                path={dtCoords}
                                color="#06B6D4"
                              />
                            );
                          }
                        })()}

                        {/* Interactive popup detailed info window */}
                        {selectedUnit && (
                          <InfoWindow
                            position={{ lat: selectedUnit.lat, lng: selectedUnit.lng }}
                            onCloseClick={() => setSelectedUnit(null)}
                          >
                            <div className="p-2 space-y-1.5 text-xs text-stone-900 border-none" style={{ minWidth: "160px" }}>
                              <h5 className="font-serif font-black text-xs text-amber-950 flex flex-col gap-0.5">
                                <span className="text-[8px] text-stone-500 font-sans tracking-wide">
                                  {selectedUnit.side === 'allied' ? '🛡️ [我军部曲]' : '🏹 [敌方残寇]'}
                                  {selectedUnit.creatorName ? ` · 标定人: [${selectedUnit.creatorName}]` : ''}
                                </span>
                                <span>{selectedUnit.name}</span>
                              </h5>
                              <p className="text-[9px] text-stone-600 font-mono">
                                经纬: {selectedUnit.lat.toFixed(4)}°, {selectedUnit.lng.toFixed(4)}°
                              </p>
                              <div className="bg-stone-50 border rounded p-1 text-[10px] font-bold text-[#8C2F39]">
                                曲部兵力: {selectedUnit.size} 员
                              </div>

                              {/* Grain/Provisions Detailed Status */}
                              <div className="bg-amber-50/60 border border-amber-200 rounded p-1.5 text-[9.5px] space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-serif font-black text-amber-900 flex items-center gap-1">
                                    🌾 粮饷储蓄
                                  </span>
                                  <span className="font-bold font-mono text-amber-950">
                                    {(selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-stone-200 rounded overflow-hidden border border-amber-900/15">
                                  <div 
                                    className={`h-full ${
                                      (selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100) > 40 ? 'bg-amber-500' : 'bg-rose-650'
                                    }`}
                                    style={{ width: `${(selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100)}%` }}
                                  />
                                </div>
                                <span className="text-[7.5px] text-stone-500 block leading-tight font-sans">
                                  {selectedUnit.id === 'u1' || selectedUnit.name.includes('大本营') 
                                    ? '🏬 总营枢纽：自主粮秣。'
                                    : (selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100) > 0
                                      ? '⛺ 外出前线：若离开大营，每回合将消耗粮草！'
                                      : '⚠️ 绝粮大荒！每回合强制折损部属编制！'
                                  }
                                </span>
                              </div>

                              {selectedUnit.side === 'allied' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await handleReprovision(selectedUnit.id);
                                  }}
                                  className="w-full py-1 text-center bg-amber-600 hover:bg-amber-700 text-[#FAF8F5] text-[9.5px] font-serif font-black rounded cursor-pointer transition shadow flex items-center justify-center gap-1 border-none"
                                >
                                  🌾 漕运输粮粮秣 (-1500金)
                                </button>
                              )}
                              
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextSize = Math.floor(selectedUnit.size * 1.5);
                                    const msg = `🛡️ 【增补援卒】将部补充兵额，部曲营垒 [${selectedUnit.name}] 编制扩充至 ${nextSize} 人！`;
                                    await addRoomLog(msg);

                                    if (multiplayerMode && remoteRoomId) {
                                      try {
                                        const docRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', selectedUnit.id);
                                        await updateDoc(docRef, { size: nextSize });
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    } else {
                                      setPlacedUnits(prev => prev.map(item => item.id === selectedUnit.id ? { ...item, size: nextSize } : item));
                                    }
                                    setSelectedUnit(null);
                                  }}
                                  className="py-1 text-center bg-amber-900 text-white hover:bg-amber-950 text-[9px] font-serif font-black rounded cursor-pointer transition shadow"
                                >
                                  🚩 增兵
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsTargetingMoveId(selectedUnit.id);
                                    setSelectedUnit(null);
                                  }}
                                  className="py-1 text-center bg-emerald-800 text-white hover:bg-emerald-950 text-[9px] font-serif font-black rounded cursor-pointer transition shadow animate-pulse"
                                >
                                  📋 行军
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={async () => {
                                  const msg = `🛑 【解编退伍】鸣金鸣金！部曲营垒 [${selectedUnit.name}] 的战士们已被准许鸣金返陆息兵！`;
                                  await addRoomLog(msg);

                                  if (multiplayerMode && remoteRoomId) {
                                    try {
                                      const docRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', selectedUnit.id);
                                      await deleteDoc(docRef);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  } else {
                                    setPlacedUnits(prev => prev.filter(item => item.id !== selectedUnit.id));
                                  }
                                  setSelectedUnit(null);
                                }}
                                className="w-full py-1 text-center bg-rose-950 hover:bg-rose-900 text-rose-200 text-[8.5px] font-serif font-bold rounded cursor-pointer transition shadow"
                              >
                                ❌ 鸣金归田
                              </button>
                            </div>
                          </InfoWindow>
                        )}

                        {/* Selected Spy Info Window (Step 3 Addition) */}
                        {selectedSpy && (
                          <InfoWindow
                            position={{ lat: selectedSpy.targetLat!, lng: selectedSpy.targetLng! }}
                            onCloseClick={() => setSelectedSpy(null)}
                          >
                            <div className="p-2 space-y-1.5 text-xs text-stone-900 border-none" style={{ minWidth: "175px" }}>
                              <h5 className="font-serif font-black text-xs text-amber-950 flex flex-col gap-0.5 border-b pb-1">
                                <span className="text-[8px] text-amber-800 font-sans tracking-wide">
                                  👁️ [潜伏探哨] · IDLE · 忠诚: {selectedSpy.loyalty}%
                                </span>
                                <span>代号：【{selectedSpy.name}】</span>
                              </h5>
                              <p className="text-[9px] text-[#8C2F39] font-sans font-bold">
                                📍 潜伏要塞: {selectedSpy.targetName || '前线哨口'}
                              </p>
                              
                              <p className="text-[9px] text-stone-500 leading-tight border-b pb-1">
                                部署探子于此神州要冲实施谍变：
                              </p>

                              <div className="grid grid-cols-2 gap-1 text-[9px] font-sans font-bold">
                                <button
                                  type="button"
                                  onClick={() => handleSpyAction(selectedSpy, 'EXPOSE')}
                                  className="py-1 bg-amber-100 hover:bg-amber-200 text-stone-900 rounded cursor-pointer text-center"
                                  title="虚实奇策，揭露敌军侧翼破绽"
                                >
                                  👁️ 探发虚实
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSpyAction(selectedSpy, 'SABOTAGE')}
                                  className="py-1 bg-rose-900 hover:bg-rose-950 text-white rounded cursor-pointer text-center animate-pulse"
                                  title="毒火双行，削降敌军战卒编制"
                                >
                                  🔥 毒毁粮草
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSpyAction(selectedSpy, 'FORGE')}
                                  className="py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-1000 text-emerald-950 rounded cursor-pointer text-center"
                                  title="伪文调遣，迫其离营散撤退"
                                >
                                  📜 伪传调命
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSpyAction(selectedSpy, 'PLUNDER')}
                                  className="py-1 bg-amber-900 hover:bg-amber-950 text-white rounded cursor-pointer text-center"
                                  title="截劫驼队车箱，缴获府库帑银"
                                >
                                  💰 劫掠金银
                                </button>
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </Map>
                    </div>
                  </APIProvider>
                )}
              </div>
            )}

            {/* Dynamic, High-Fidelity SVG Fog of War Overlay */}
            {fogOfWarEnabled && (() => {
              let weatherVisionFactor = 1.0;
              if (weather === 'fog') weatherVisionFactor = 0.5;
              if (weather === 'rain') weatherVisionFactor = 0.8;
              if (weather === 'wind') weatherVisionFactor = 0.9;

              return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 animate-fade-in" id="fow-svg-overlay">
                  <defs>
                    <mask id="fow-mask">
                      <rect width="100%" height="100%" fill="white" />
                      {alliedScreenPoints.map((p, i) => {
                        const r = (mapMode === 'ink' 
                          ? (100 / 800) * dimensions.width 
                          : Math.max(40, Math.min(260, 100 * Math.pow(2, mapZoom - 11)))) * weatherVisionFactor;
                        return (
                          <circle
                            key={p.id || i}
                            cx={p.x}
                            cy={p.y}
                            r={r}
                            fill="url(#fow-radial-hole)"
                          />
                        );
                      })}
                    </mask>
                    <radialGradient id="fow-radial-hole">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="68%" stopColor="black" stopOpacity="0.72" />
                      <stop offset="100%" stopColor="white" />
                    </radialGradient>
                  </defs>
                  
                  {/* Visual foggy charcoal shroud covering the map */}
                  <rect 
                    width="100%" 
                    height="100%" 
                    fill="#141414" 
                    fillOpacity="0.84" 
                    mask="url(#fow-mask)" 
                  />

                  {/* Tactical concentric range indicator sweeps */}
                  {alliedScreenPoints.map((p, i) => {
                    const r = (mapMode === 'ink' 
                      ? (100 / 800) * dimensions.width 
                      : Math.max(40, Math.min(260, 100 * Math.pow(2, mapZoom - 11)))) * weatherVisionFactor;
                    return (
                      <g key={p.id || i}>
                        {/* Scanning range boundary */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={r}
                          stroke="#10B981"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                          strokeOpacity="0.38"
                          fill="none"
                          className="animate-pulse"
                        />
                        {/* Inner combat boundary */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={r * 0.4}
                          stroke="#10B981"
                          strokeWidth="0.6"
                          strokeDasharray="2 3"
                          strokeOpacity="0.2"
                          fill="none"
                        />
                      </g>
                    );
                  })}
                </svg>
              );
            })()}

            {/* Tactical March Order Prompt Banner */}
            <AnimatePresence>
              {isTargetingMoveId && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-x-4 top-4 mx-auto max-w-sm bg-amber-950 text-white border border-amber-500 rounded p-2 text-center text-xs font-serif z-30 shadow-lg flex items-center justify-between"
                  id="target-march-banner"
                >
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Compass className="w-4 h-4 animate-spin-slow text-amber-400" />
                    <span><b>传令下达中：</b>在下方地图任意点击一处，该部曲即刻缓缓转进。</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTargetingMoveId(null)}
                    className="text-[9.5px] bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-stone-200 cursor-pointer font-sans"
                  >
                    取消
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Deployment Overlay Modal */}
            <AnimatePresence>
              {pendingDeployCoords && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 15 }}
                  className="absolute inset-x-4 bottom-4 mx-auto max-w-md bg-[#FAF8F5] border-2 border-[#1A1A1A] rounded-lg p-3 shadow-xl z-30"
                  id="pending-deploy-modal"
                >
                  <h4 className="font-serif font-black text-xs text-[#8C2F39] flex items-center gap-1 border-b pb-1.5 border-stone-200 uppercase tracking-wider mb-2">
                    ⛺ 标定驻军点 · 授节安营部曲 (Military Forces Deployment)
                  </h4>
                  <div className="space-y-3">
                    <p className="text-[10px] text-stone-500 font-serif leading-relaxed">
                      已在 <b>现代卫星大地图</b> 上探明哨点坐标 <b>(纬度:{pendingDeployCoords.lat.toFixed(4)}, 经度:{pendingDeployCoords.lng.toFixed(4)})</b>。请于金鼓前誓师建立你的部曲营盘：
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9.5px] text-stone-600 font-bold font-serif block mb-1">营盘/部曲称号</label>
                        <input
                          type="text"
                          value={newUnitName}
                          onChange={(e) => setNewUnitName(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#1A1A1A]/20 rounded font-sans text-xs outline-none focus:border-[#8C2F39]"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-stone-600 font-bold font-serif block mb-1">编制精兵数</label>
                        <input
                          type="number"
                          step={100}
                          min={1000}
                          max={50000}
                          value={newUnitSize}
                          onChange={(e) => setNewUnitSize(Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white border border-[#1A1A1A]/20 rounded font-mono text-xs outline-none focus:border-[#8C2F39]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-600 font-serif font-bold">阵营:</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="deploy-side"
                              checked={newUnitSide === 'allied'}
                              onChange={() => setNewUnitSide('allied')}
                              className="text-emerald-700 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                            />
                            <span className="text-[9.5px] font-sans font-medium text-stone-800">🛡️ 秦我军</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="deploy-side"
                              checked={newUnitSide === 'hostile'}
                              onChange={() => setNewUnitSide('hostile')}
                              className="text-rose-700 focus:ring-rose-500 w-3 h-3 cursor-pointer"
                            />
                            <span className="text-[9.5px] font-sans font-medium text-stone-800">🏹 楚敌军</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPendingDeployCoords(null)}
                          className="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-350 text-stone-800 text-[10px] font-bold cursor-pointer"
                        >
                          罢手
                        </button>
                        <button
                          type="button"
                          onClick={finalizeDeployment}
                          className="px-3 py-1 rounded bg-[#8C2F39] text-[#FAF8F5] text-[10px] font-black hover:bg-red-950 cursor-pointer shadow-sm transition"
                        >
                          金鼓成军
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fallback Selected Unit controller modal overlay (for watercolor mode where InfoWindow cannot render) */}
            <AnimatePresence>
              {selectedUnit && mapMode === 'ink' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-4 top-4 bg-[#FAF8F5] border-2 border-[#1A1A1A] rounded-lg p-3 shadow-xl z-35 max-w-xs"
                  id="fallback-selected-unit-dialog"
                >
                  <div className="flex justify-between items-center border-b pb-1 mb-2">
                    <span className="text-[9.5px] uppercase font-bold text-[#8C2F39] font-serif">
                      {selectedUnit.side === 'allied' ? '🛡️ 我军主要营垒' : '🏹 敌党合围营'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedUnit(null)}
                      className="text-stone-400 hover:text-stone-700 font-sans font-bold text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <h5 className="font-serif font-black text-xs text-[#1A1A1A] mb-1">
                    {selectedUnit.name}
                    {selectedUnit.creatorName ? (
                      <span className="block text-[8.5px] text-amber-700 font-serif font-bold mt-0.5">誓立统领: [{selectedUnit.creatorName}]</span>
                    ) : null}
                  </h5>
                  <p className="text-[8px] font-mono text-stone-500 mb-1.5">
                    坐标: ({selectedUnit.lat.toFixed(3)}, {selectedUnit.lng.toFixed(3)})
                  </p>
                  
                  <div className="bg-stone-100 p-1.5 rounded text-[10px] font-mono font-bold text-center text-[#8C2F39] mb-2">
                    曲部编制数: {selectedUnit.size} 员
                  </div>

                  {/* Ink Mode / watercolor provisions display block */}
                  <div className="bg-amber-50 border border-amber-900/25 rounded p-1.5 text-[9.5px] space-y-1 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-serif font-bold text-amber-900 flex items-center gap-1">
                        🌾 粮草储备
                      </span>
                      <span className="font-bold text-[#1A1A1A] font-mono">
                        {(selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded overflow-hidden">
                      <div 
                        className={`h-full ${
                          (selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100) > 40 ? 'bg-amber-600' : 'bg-red-650 animate-pulse'
                        }`}
                        style={{ width: `${(selectedUnit.provisions !== undefined ? selectedUnit.provisions : 100)}%` }}
                      />
                    </div>
                    <span className="text-[7.5px] text-stone-500 font-sans leading-none block">
                      {selectedUnit.id === 'u1' || selectedUnit.name.includes('大本营') 
                        ? '🏬 留守总营：自主供给。'
                        : '⛺ 外出前线：若远离大营将消耗粮。'
                      }
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedUnit.side === 'allied' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await handleReprovision(selectedUnit.id);
                        }}
                        className="w-full py-1 text-center bg-amber-600 hover:bg-amber-700 text-white text-[9.5px] font-serif font-black rounded cursor-pointer transition shadow flex items-center justify-center gap-1 border-none"
                      >
                        🌾 漕运辎重输粮 (-1500金)
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const nextSize = Math.floor(selectedUnit.size * 1.5);
                          const msg = `🛡️ 【增补援卒】呼唤地方后勤增兵。部曲营垒 [${selectedUnit.name}] 编制扩充至 ${nextSize} 人！`;
                          await addRoomLog(msg);

                          if (multiplayerMode && remoteRoomId) {
                            try {
                              const docRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', selectedUnit.id);
                              await updateDoc(docRef, { size: nextSize });
                            } catch (err) {
                              console.error(err);
                            }
                          } else {
                            setPlacedUnits(prev => prev.map(item => item.id === selectedUnit.id ? { ...item, size: nextSize } : item));
                          }
                          setSelectedUnit(null);
                        }}
                        className="py-1 text-center bg-amber-900 text-white hover:bg-amber-950 text-[9.5px] font-serif font-black rounded cursor-pointer transition shadow"
                      >
                        🚩 注入援兵
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTargetingMoveId(selectedUnit.id);
                          setSelectedUnit(null);
                        }}
                        className="py-1 text-center bg-emerald-800 text-white hover:bg-emerald-950 text-[9.5px] font-serif font-black rounded cursor-pointer transition shadow animate-pulse"
                      >
                        📋 宣召行军
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const msg = `🛑 【撤销编制】鸣金收兵。部曲营垒 [${selectedUnit.name}] 鸣金解甲、归乡息兵！`;
                        await addRoomLog(msg);

                        if (multiplayerMode && remoteRoomId) {
                          try {
                            const docRef = doc(db, 'rooms', remoteRoomId, 'mapUnits', selectedUnit.id);
                            await deleteDoc(docRef);
                          } catch (err) {
                            console.error(err);
                          }
                        } else {
                          setPlacedUnits(prev => prev.filter(item => item.id !== selectedUnit.id));
                        }
                        setSelectedUnit(null);
                      }}
                      className="w-full py-1 text-center bg-rose-950 hover:bg-rose-900 text-rose-200 text-[8.5px] font-serif font-bold rounded cursor-pointer transition shadow border border-rose-950"
                    >
                      ❌ 鸣金归田
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fallback Selected Spy controller modal overlay (for watercolor mode where InfoWindow cannot render) */}
            <AnimatePresence>
              {selectedSpy && mapMode === 'ink' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-4 top-4 bg-[#FAF8F5] border-2 border-[#1A1A1A] rounded-lg p-3 shadow-xl z-35 max-w-xs"
                  id="fallback-selected-spy-dialog"
                >
                  <div className="flex justify-between items-center border-b pb-1 mb-2">
                    <span className="text-[9.5px] uppercase font-bold text-amber-700 font-serif">
                      👁️ [潜伏探哨] · 忠诚: {selectedSpy.loyalty}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSpy(null)}
                      className="text-stone-400 hover:text-stone-700 font-sans font-bold text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <h5 className="font-serif font-black text-xs text-[#1A1A1A] mb-1">
                    细作代号：【{selectedSpy.name}】
                  </h5>
                  <p className="text-[8px] font-mono text-stone-500 mb-1.5">
                    📍 设密潜点: {selectedSpy.targetName || '神州要冲区域'}
                  </p>

                  <p className="text-[9.5px] text-stone-600 font-sans leading-relaxed mb-3">
                    潜入敌之关要，请各位大人定夺行间破袭圣策：
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 text-[9 px] font-sans font-bold">
                    <button
                      type="button"
                      onClick={() => handleSpyAction(selectedSpy, 'EXPOSE')}
                      className="py-1.5 text-center bg-amber-100 hover:bg-amber-200 text-stone-900 rounded cursor-pointer transition text-[9.5px] font-serif font-black"
                    >
                      👁️ 探发虚实
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpyAction(selectedSpy, 'SABOTAGE')}
                      className="py-1.5 text-center bg-rose-900 hover:bg-rose-950 text-white rounded cursor-pointer transition text-[9.5px] font-serif font-black animate-pulse"
                    >
                      🔥 毒毁灭草
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpyAction(selectedSpy, 'FORGE')}
                      className="py-1.5 text-center bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded cursor-pointer transition text-[9.5px] font-serif font-black"
                    >
                      📜 伪示退令
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpyAction(selectedSpy, 'PLUNDER')}
                      className="py-1.5 text-center bg-amber-900 hover:bg-amber-950 text-white rounded cursor-pointer transition text-[9.5px] font-serif font-black"
                    >
                      💰 劫掠金库
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real-time Combat Log Toast Notifications */}
            <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2 max-w-[280px] sm:max-w-xs pointer-events-none" id="combat-log-toast-container">
              <AnimatePresence>
                {combatToasts.map((toast) => {
                  const isAlliedAttack = toast.type === 'allied_attack';
                  return (
                    <motion.div
                      key={toast.id}
                      initial={{ opacity: 0, x: 40, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                      className={`pointer-events-auto rounded border-2 p-2.5 shadow-lg bg-[#FAF8F5]/95 backdrop-blur-xs flex flex-col gap-1 text-left relative overflow-hidden ${
                        isAlliedAttack 
                          ? 'border-emerald-600/70 shadow-emerald-900/10' 
                          : 'border-[#8C2F39]/70 shadow-red-950/10'
                      }`}
                    >
                      {/* Left vertical visual alignment bar */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isAlliedAttack ? 'bg-emerald-600' : 'bg-[#8C2F39]'
                        }`} 
                      />

                      {/* Header with Type, Timestamp and Close */}
                      <div className="flex justify-between items-center pl-1">
                        <span className={`text-[8.5px] font-sans font-bold tracking-widest uppercase flex items-center gap-1 ${
                          isAlliedAttack ? 'text-emerald-700' : 'text-[#8C2F39]'
                        }`}>
                          {isAlliedAttack ? '⚔️ 攻势告捷' : '🛡️ 坚防遇袭'}
                        </span>
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <span className="text-[7.5px] font-mono text-stone-400">{toast.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => setCombatToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer text-[9px] font-sans transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Combatants and Impact Body */}
                      <div className="pl-1 flex flex-col">
                        <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
                          <span className="text-[10px] font-serif font-black text-stone-900 truncate max-w-[100px]">
                            {isAlliedAttack ? toast.alliedUnitName : toast.hostileUnitName}
                          </span>
                          <span className="text-[8px] text-stone-400 font-sans">⚔️ 对阵</span>
                          <span className="text-[10px] font-serif font-black text-stone-900 truncate max-w-[100px]">
                            {isAlliedAttack ? toast.hostileUnitName : toast.alliedUnitName}
                          </span>
                        </div>

                        {/* Impact Number Highlight */}
                        <div className="flex items-center justify-between gap-2 mt-1.5 bg-stone-100/65 p-1 rounded border border-stone-200/50">
                          <div className={`text-xs font-mono font-black flex items-center gap-1 ${
                            isAlliedAttack ? 'text-emerald-700' : 'text-[#8C2F39]'
                          }`}>
                            {isAlliedAttack ? '🔥' : '⚠️'} {toast.impact}
                          </div>
                          <div className="text-[9px] font-mono font-bold text-stone-600">
                            {toast.remainingHealth}
                          </div>
                        </div>
                      </div>

                      {/* Formation Stance Bonus Description */}
                      <div className={`mt-1 text-[8.5px] pl-1 font-serif py-0.5 px-1 rounded flex items-center gap-0.5 leading-relaxed ${
                        isAlliedAttack 
                          ? 'bg-emerald-50 text-emerald-950 border border-emerald-100/55' 
                          : 'bg-red-50 text-amber-950 border border-red-100/55'
                      }`}>
                        <span>{toast.stanceBonusLabel}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Meteorological Controls and Status Indicators (Nine Lands Strategy) */}
            {showHudOverlays && (
            <div className="absolute top-[68px] right-3 z-40 bg-[#FAF8F5]/90 hover:bg-[#FAF8F5]/96 border-2 border-stone-800 p-2.5 rounded shadow-lg text-[10px] font-serif w-44 tracking-tight leading-normal" id="weather-controller-badge">
              
              {/* Interactive Tooltip Popover (Sun Tzu's Weather Logic) */}
              <AnimatePresence>
                {showWeatherTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: -15, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    className="absolute top-0 right-[184px] w-64 bg-[#FAF8F5] border-2 border-stone-800 p-3 rounded shadow-2xl z-50 text-stone-800 text-[10.5px] space-y-2 text-left leading-relaxed pointer-events-auto"
                    id="weather-nine-lands-tooltip"
                    onMouseEnter={() => setShowWeatherTooltip(true)}
                    onMouseLeave={() => setShowWeatherTooltip(false)}
                  >
                    {/* Tooltip Header */}
                    <div className="flex items-center justify-between border-b pb-1.5 border-stone-300">
                      <span className="font-bold text-[#8C2F39] text-xs flex items-center gap-1">
                        🪐 孙子兵法 · 天时推演律
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowWeatherTooltip(false)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer font-sans text-[10px]"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Theoretical Explanation */}
                    <p className="text-[9.5px] text-stone-600 italic font-sans">
                      “天者，阴阳、寒暑、时制也。” 诸天气象变幻，深刻影响斥候侦察半径与军团行军速度：
                    </p>

                    {/* Modifiers Grid */}
                    <div className="space-y-2 divide-y divide-stone-200/60 pt-0.5">
                      {/* Clear */}
                      <div className="pt-1.5 border-none">
                        <div className="flex justify-between font-bold text-stone-900">
                          <span>☀️ 晴空万里</span>
                          <span className="text-emerald-700">常规状态</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans text-stone-600 mt-0.5">
                          <span>• 斥候视距: 100% 常态</span>
                          <span>• 行军战速: 100% 常态</span>
                        </div>
                      </div>

                      {/* Fog */}
                      <div className="pt-1.5">
                        <div className="flex justify-between font-bold text-[#8C2F39]">
                          <span>🌫️ 十里云雾</span>
                          <span>[衢地失瞻]</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans text-stone-600 mt-0.5">
                          <span className="font-semibold text-rose-800">• 斥候视距: 减半 -50%</span>
                          <span className="font-semibold text-rose-800">• 行军战速: 迟滞 -25%</span>
                        </div>
                        <p className="text-[8.5px] text-stone-400 font-sans italic mt-0.5">
                          浓雾笼江山，视野严重受限，需防敌暗伏侧袭。
                        </p>
                      </div>

                      {/* Rain */}
                      <div className="pt-1.5">
                        <div className="flex justify-between font-bold text-blue-900">
                          <span>🌧️ 骤雨泥泞</span>
                          <span>[圮地沦涂]</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans text-stone-600 mt-0.5">
                          <span className="font-semibold text-rose-700">• 斥候视距: 折损 -20%</span>
                          <span className="font-semibold text-red-900">• 行军战速: 暴跌 -50%</span>
                        </div>
                        <p className="text-[8.5px] text-stone-400 font-sans italic mt-0.5">
                          水涝深阻，泥泞没膝，骑兵与步卒行军极其艰难。
                        </p>
                      </div>

                      {/* Wind */}
                      <div className="pt-1.5">
                        <div className="flex justify-between font-bold text-amber-700">
                          <span>💨 狂风沙暴</span>
                          <span>[死地借势]</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-sans text-stone-600 mt-0.5">
                          <span className="font-semibold text-amber-900">• 斥候视距: 阻碍 -10%</span>
                          <span className="font-semibold text-emerald-700">• 行军战速: 狂飙 +40%</span>
                        </div>
                        <p className="text-[8.5px] text-stone-400 font-sans italic mt-0.5">
                          狂风推波，士卒可借顺风之势快意强袭，大举克敌。
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between border-b border-stone-300 pb-1 mb-1.5">
                <div className="flex items-center gap-1 select-none">
                  <span className="font-bold text-[#8C2F39] flex items-center gap-1">
                    🪐 天时演象
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWeatherTooltip(!showWeatherTooltip)}
                    onMouseEnter={() => setShowWeatherTooltip(true)}
                    onMouseLeave={() => setShowWeatherTooltip(false)}
                    className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 cursor-pointer flex items-center justify-center rounded-full hover:bg-stone-200/50"
                    title="点击/悬停查看天时战场兵法律例"
                    id="weather-info-trigger"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[8.5px] px-1 font-sans bg-stone-200 rounded text-stone-700 uppercase font-bold animate-pulse">
                  {weather === 'none' ? '☀️ 晴空' : weather === 'fog' ? '🌫️ 迷雾' : weather === 'rain' ? '🌧️ 骤雨' : '💨 狂风'}
                </span>
              </div>

              {/* Dynamic explanations describing Nine Lands rules */}
              <div className="text-[9px] text-[#554433] leading-relaxed mb-1.5" id="weather-desc-content">
                {weather === 'none' && (
                  <div>
                    <span className="text-stone-850 font-bold">【散地平陆】</span> 乾坤大放，视界与军中机动力处于 <b>100%</b> 圆满状态。
                  </div>
                )}
                {weather === 'fog' && (
                  <div>
                    <span className="text-[#8C2F39] font-bold">【衢地十里雾】</span> 雾茫锁津。我军侦测视距 <b>减半 (-50%)</b>，整体行军步速 <b>延缓 -25%</b>。
                  </div>
                )}
                {weather === 'rain' && (
                  <div>
                    <span className="text-blue-900 font-bold">Iconic【圮地骤雨】</span> 泥泽没膝。三军战意受阻，大军机动行进 <b>重击减损 -50%</b>，侦视剥离 <b>-20%</b>。
                  </div>
                )}
                {weather === 'wind' && (
                  <div>
                    <span className="text-amber-800 font-bold">【死地烈狂风】</span> 顺风急驰。风助军威，两翼部曲行军速度 <b>急扩增敏 +40%</b>，侦视失闪 <b>-10%</b>。
                  </div>
                )}
              </div>

              {/* Grid buttons to switch conditions manually */}
              <div className="grid grid-cols-4 gap-1 mb-1.5" id="weather-modes-grid">
                <button
                  type="button"
                  title="晴空万里"
                  onClick={() => {
                    setWeather('none');
                    addRoomLog("🌤️ 【执掌乾坤】推演官拨云见日，战场万象晴空万里，恢复常态侦视与机速。");
                  }}
                  className={`py-0.5 text-center rounded border transition-all text-xs cursor-pointer ${weather === 'none' ? 'bg-[#8C2F39] border-black text-white font-bold' : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'}`}
                >
                  ☀️
                </button>
                <button
                  type="button"
                  title="大雾弥漫"
                  onClick={() => {
                    setWeather('fog');
                    addRoomLog("🌫️ 【执掌乾坤】推演官呼换十里大雾遮蔽，重山锁江，敌我军士视野受挫！");
                  }}
                  className={`py-0.5 text-center rounded border transition-all text-xs cursor-pointer ${weather === 'fog' ? 'bg-[#8C2F39] border-black text-white font-bold' : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'}`}
                >
                  🌫️
                </button>
                <button
                  type="button"
                  title="骤雨滂沱"
                  onClick={() => {
                    setWeather('rain');
                    addRoomLog("🌧️ 【执掌乾坤】推演官召集暴雨浸透泥途，行同圮地，车马步军迟滞难行！");
                  }}
                  className={`py-0.5 text-center rounded border transition-all text-xs cursor-pointer ${weather === 'rain' ? 'bg-[#8C2F39] border-black text-white font-bold' : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'}`}
                >
                  🌧️
                </button>
                <button
                  type="button"
                  title="狂风沙暴"
                  onClick={() => {
                    setWeather('wind');
                    addRoomLog("💨 【执掌乾坤】推演官借死地烈风，飞沙卷云，部曲执旗借风快行！");
                  }}
                  className={`py-0.5 text-center rounded border transition-all text-xs cursor-pointer ${weather === 'wind' ? 'bg-[#8C2F39] border-black text-white font-bold' : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'}`}
                >
                  💨
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const weathers: Array<'none' | 'fog' | 'rain' | 'wind'> = ['none', 'fog', 'rain', 'wind'];
                  let nextW = weathers[Math.floor(Math.random() * weathers.length)];
                  while (nextW === weather) {
                    nextW = weathers[Math.floor(Math.random() * weathers.length)];
                  }
                  setWeather(nextW);
                  
                  let zhName = '晴空万里';
                  let tip = '天候平稳，侦察与机动恢复常态。';
                  if (nextW === 'fog') {
                    zhName = '大雾弥漫';
                    tip = '🌫️ 「衢地失瞻」：浓雾锁山，敌我视界重挫 -50%，行军迟滞 -25%。';
                  } else if (nextW === 'rain') {
                    zhName = '雨雪泥泞';
                    tip = '🌧️ 「暴雨圮地」：连天骤雨浸湿旷野，泥泞没膝。行军速度折半 -50%，视界重创 -20%。';
                  } else if (nextW === 'wind') {
                    zhName = '沙尘狂风';
                    tip = '💨 「死地狂风」：暴风呼啸，风助火势与军威。行军速增 +40%，微阻视界 -10%。';
                  }
                  addRoomLog(`🎲 【天命随机】气机乱涌，天演沙盘阵转「${zhName}」。${tip}`);
                }}
                className="w-full py-1 text-center bg-stone-800 hover:bg-black text-[8.5px] font-sans font-bold text-[#faf8f5] rounded cursor-pointer transition shadow border border-black hover:shadow-inner"
              >
                🎲 随机天候更迭
              </button>
            </div>
            )}

            {/* Weather Overlay Style keyframes */}
            <style>{`
              @keyframes drift-fog1 {
                0% { transform: translate(-8%, -8%) scale(1); opacity: 0.18; }
                50% { transform: translate(8%, 12%) scale(1.18); opacity: 0.38; }
                100% { transform: translate(-8%, -8%) scale(1); opacity: 0.18; }
              }
              @keyframes drift-fog2 {
                0% { transform: translate(12%, -8%) scale(1.12); opacity: 0.22; }
                50% { transform: translate(-8%, 8%) scale(0.95); opacity: 0.42; }
                100% { transform: translate(12%, -8%) scale(1.12); opacity: 0.22; }
              }
              @keyframes rain-fall-animation {
                0% { background-position: 0px 0px; }
                100% { background-position: 400px 800px; }
              }
              @keyframes wind-sweep-animation {
                0% { transform: translateX(-120%); opacity: 0; }
                5% { opacity: 0.35; }
                95% { opacity: 0.35; }
                100% { transform: translateX(120%); opacity: 0; }
              }
              @keyframes ripple-wave-effect {
                0% { transform: scale(0.1); opacity: 0.65; }
                100% { transform: scale(1.4); opacity: 0; }
              }
            `}</style>

            {/* Weather Visual Animation Overlays with z-25 to overlay cleanly */}
            {weather === 'fog' && (
              <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden bg-white/[0.04] backdrop-blur-[0.7px]">
                <svg className="absolute inset-0 w-full h-full mix-blend-color-dodge opacity-60">
                  <circle cx="20%" cy="30%" r="48%" fill="url(#fog-grad-sky)" style={{ animation: 'drift-fog1 18s ease-in-out infinite' }} />
                  <circle cx="80%" cy="70%" r="52%" fill="url(#fog-grad-sky)" style={{ animation: 'drift-fog2 24s ease-in-out infinite' }} />
                  <circle cx="50%" cy="45%" r="40%" fill="url(#fog-grad-sky)" style={{ animation: 'drift-fog1 21s ease-in-out infinite', animationDelay: '-4s' }} />
                  <defs>
                    <radialGradient id="fog-grad-sky">
                      <stop offset="0%" stopColor="#f4f4f0" stopOpacity="0.82" />
                      <stop offset="60%" stopColor="#eaeaeb" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#dfdfdb" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>
            )}

            {weather === 'rain' && (
              <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">
                <div 
                  className="absolute inset-0 w-full h-full opacity-[0.34]" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'%3E%3Cpath d='M10 20 L5 60 M40 10 L35 50 M70 40 L65 80 M25 80 L20 120 M55 70 L50 110' stroke='%2388AADD' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")`,
                    animation: 'rain-fall-animation 1.4s linear infinite'
                  }}
                />
                
                {/* Ripples appearing relative to the container */}
                <div className="absolute inset-0">
                  <div className="absolute w-8 h-4 border border-indigo-300/30 rounded-full left-[18%] top-[38%] scale-0" style={{ animation: 'ripple-wave-effect 3.0s linear infinite' }} />
                  <div className="absolute w-9 h-5 border border-indigo-400/25 rounded-full left-[66%] top-[26%] scale-0" style={{ animation: 'ripple-wave-effect 3.8s linear infinite', animationDelay: '1.2s' }} />
                  <div className="absolute w-6 h-3 border border-indigo-500/20 rounded-full left-[45%] top-[70%] scale-0" style={{ animation: 'ripple-wave-effect 2.4s linear infinite', animationDelay: '0.6s' }} />
                  <div className="absolute w-10 h-5 border border-indigo-200/35 rounded-full left-[85%] top-[55%] scale-0" style={{ animation: 'ripple-wave-effect 3.5s linear infinite', animationDelay: '1.9s' }} />
                </div>
              </div>
            )}

            {weather === 'wind' && (
              <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">
                {/* Visual horizontal blowing winds */}
                <div 
                  className="absolute left-0 w-[45%] h-[1.8px] bg-gradient-to-r from-transparent via-amber-200/30 to-transparent top-[25%]"
                  style={{ animation: 'wind-sweep-animation 2.6s linear infinite' }}
                />
                <div 
                  className="absolute left-0 w-[65%] h-[1px] bg-gradient-to-r from-transparent via-stone-300/40 to-transparent top-[50%]"
                  style={{ animation: 'wind-sweep-animation 2.0s linear infinite', animationDelay: '0.6s' }}
                />
                <div 
                  className="absolute left-0 w-[35%] h-[2.2px] bg-gradient-to-r from-transparent via-orange-100/20 to-transparent top-[75%]"
                  style={{ animation: 'wind-sweep-animation 3.4s linear infinite', animationDelay: '1.2s' }}
                />
              </div>
            )}

            {/* Advanced 3D/4D GIS Sandtable HUD Tactical Control Panel Overlay (Phase 1) */}
            {showHudOverlays && (
            <div 
              className="absolute bottom-3 left-3 z-40 bg-stone-950/85 backdrop-blur-md border border-stone-700/50 p-2.5 rounded-lg shadow-2xl text-stone-100 w-[275px] pointer-events-auto select-none"
              id="3d-gis-hud-panel"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <Compass className={`w-3.5 h-3.5 text-amber-500 ${autoOrbit ? 'animate-spin-slow' : ''}`} />
                  <span className="font-serif font-black text-[10.5px] tracking-wide text-amber-500">3D/4D 战区天演控制台</span>
                </div>
                <span className="font-mono text-[8.5px] bg-[#8C2F39] text-stone-100 rounded px-1 text-center font-bold">天演版 v1.2</span>
              </div>

              {/* Angle status sliders & displays */}
              <div className="space-y-2">
                {/* 1. Map Tilt Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-stone-400">
                    <span>📐 仰角偏斜</span>
                    <span className="text-amber-500 font-bold">{mapTilt}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="5"
                    value={mapTilt}
                    onChange={(e) => {
                      setMapTilt(Number(e.target.value));
                      if (autoOrbit && Number(e.target.value) === 0) setAutoOrbit(false);
                    }}
                    className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  {/* Tilt Presets */}
                  <div className="flex justify-between gap-1 text-[8px] font-medium pt-0.5">
                    <button
                      type="button"
                      onClick={() => setMapTilt(0)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapTilt === 0 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      2D 平面
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapTilt(30)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapTilt === 30 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      30° 斜俯
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapTilt(50)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapTilt === 50 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      50° 鸟瞰
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapTilt(70)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapTilt === 70 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      70° 极限
                    </button>
                  </div>
                </div>

                {/* 2. Map Heading/Orientation Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-stone-400">
                    <span>🧭 战局向角</span>
                    <span className="text-amber-500 font-bold">{mapHeading}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={mapHeading}
                    onChange={(e) => setMapHeading(Number(e.target.value))}
                    disabled={autoOrbit}
                    className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
                  />
                  {/* Heading presets */}
                  <div className="flex justify-between gap-1 text-[8px] font-medium pt-0.5">
                    <button
                      type="button"
                      onClick={() => setMapHeading(0)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapHeading === 0 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      北 (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapHeading(90)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapHeading === 90 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      东 (90°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapHeading(180)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapHeading === 180 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      南 (180°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapHeading(-90)}
                      className={`flex-1 py-0.5 rounded cursor-pointer transition-colors ${mapHeading === -90 ? 'bg-amber-500 text-stone-300 hover:bg-stone-700' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
                    >
                      西 (270°)
                    </button>
                  </div>
                </div>

                {/* 3. Automatic Rotation Satellite Panning & Topological Mesh Controls */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-800 text-[8.5px] font-medium">
                  {/* Auto-Orbit Rotation */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoOrbit;
                      setAutoOrbit(next);
                      if (next && mapTilt === 0) setMapTilt(45); // Give a default tilt for orbit view
                      addRoomLog(`🛰️ 已经${next ? '【开启】' : '【关闭】'}全自动卫星轨道自转环伺勘测功能！`);
                    }}
                    className={`py-1 rounded px-1.5 flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      autoOrbit
                        ? 'bg-amber-500 text-stone-950 font-black shadow-lg shadow-amber-500/25 animate-pulse'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <span>🛰️ 轨道自转</span>
                    <span className="font-mono text-[7px]">[{autoOrbit ? "运行" : "停止"}]</span>
                  </button>

                  {/* Elevation Line Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !gisAltitudeMesh;
                      setGisAltitudeMesh(next);
                      addRoomLog(`🗺️ 已经${next ? '【启用了】' : '【关闭了'}沙盘数字高程等高探测格网线。`);
                    }}
                    className={`py-1 rounded px-1.5 flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      gisAltitudeMesh
                        ? 'bg-emerald-600 text-stone-100 font-extrabold shadow-lg shadow-emerald-600/25'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <span>📈 等高格网</span>
                    <span className="font-mono text-[7px]">[{gisAltitudeMesh ? "开启" : "关闭"}]</span>
                  </button>
                </div>

                {/* Phase 2: 4D Temporal Sandtable Controls */}
                <div className="border-t border-stone-800 pt-2.5 mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-mono text-stone-400">
                    <span>⏳ 4D 时空流速</span>
                    <span className="text-amber-500 font-bold">{timeSpeed} 倍速</span>
                  </div>
                  <div className="flex gap-1 text-[8px] font-bold">
                    {[1, 2, 5].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => {
                          setTimeSpeed(speed);
                          addRoomLog(`⏳ 调整 4D 战局推演流速为 【${speed}】 倍频。`);
                        }}
                        className={`flex-1 py-1 rounded cursor-pointer transition-all ${
                          timeSpeed === speed
                            ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        }`}
                      >
                        {speed === 1 ? '一' : speed === 2 ? '贰' : speed === 5 ? '伍' : speed}速
                      </button>
                    ))}
                  </div>

                  {/* Active Shichen indicator */}
                  <div className="bg-stone-900 border border-stone-800/80 rounded p-1.5 flex items-center justify-between text-[9.5px]">
                    <div className="space-y-0.5">
                      <span className="text-stone-500 block text-[7.5px] font-mono uppercase tracking-tighter">天演纪时 / 太阳光射</span>
                      <span className="font-serif font-black text-amber-500 flex items-center gap-1">
                        🪐 {SHICHENS[displayedShichenIndex].name}
                      </span>
                    </div>
                    <div className="text-right text-[8px] font-mono text-stone-400">
                      <div>{SHICHENS[displayedShichenIndex].period}</div>
                      <div className="font-bold uppercase tracking-widest text-[7px] mt-0.5" style={{ color: SHICHENS[displayedShichenIndex].color }}>
                        {displayedShichenIndex >= 9 || displayedShichenIndex <= 2 ? "🌙 幽夜" : "☀️ 白昼"}
                      </div>
                    </div>
                  </div>

                  {/* Chronological State Travel Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-stone-400">
                      <span>🕰️ 战局时空回溯</span>
                      <span className={`${timeTravelIndex >= 0 ? 'text-cyan-400 font-extrabold animate-pulse' : 'text-[#8C2F39]'} font-bold`}>
                        {timeTravelIndex >= 0 ? `轴线 #${timeTravelIndex + 1}` : '🔴 实时'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max={historyStack.length - 1}
                      step={1}
                      value={timeTravelIndex}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTimeTravelIndex(val);
                        if (val >= 0) {
                          setIsSimulating(false); // pause real-time simulation on touch-back!
                        }
                      }}
                      disabled={historyStack.length === 0}
                      className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-45"
                    />
                    <div className="flex justify-between text-[7.5px] font-mono text-stone-500 pt-0.5 tracking-tighter">
                      <span>初始 (0 刻)</span>
                      <span className="italic text-[7px]" style={{ color: historyStack.length > 0 ? '#aaa' : '#555' }}>
                        {historyStack.length > 0 ? (timeTravelIndex >= 0 ? '⏮ 已锁定历史状态' : '滑动刻度回溯记录') : '暂无演兵历史'}
                      </span>
                      <span>当前 (共 {historyStack.length} 局)</span>
                    </div>
                  </div>

                  {/* Dynamic travel control actions */}
                  {timeTravelIndex >= 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTimeTravelIndex(-1);
                        addRoomLog(`🔴 已经恢复到战局最新实时时空节点。`);
                      }}
                      className="w-full text-center py-1 mt-1 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-serif font-black text-[9px] rounded shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      🔄 归位并恢复实时推演 (Reset to Live)
                    </button>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Interactive Battle Simulator Panel (Tactics Arena Controller) */}
          <div className="bg-stone-100 border border-[#1A1A1A]/10 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-200 pb-3" id="sim-controls-row">
              <div>
                <h4 className="font-serif font-black text-sm text-[#1A1A1A] flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-[#8C2F39]" />
                  天演冲突推演盘
                </h4>
                <p className="text-[10px] text-stone-500 font-serif leading-relaxed mt-0.5">
                  在当前选定地形天命下，指派特质主帅进行多兵团全地形仿真冲突推演。
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Fog of War Tactical Toggle */}
                <button
                  type="button"
                  onClick={() => setFogOfWarEnabled(!fogOfWarEnabled)}
                  className={`border p-1.5 rounded text-xs font-serif font-bold cursor-pointer flex items-center gap-1.5 transition-all duration-200 shadow-xs ${
                    fogOfWarEnabled
                      ? 'bg-amber-950 text-amber-100 border-[#8C2F39] ring-2 ring-[#8C2F39]/15'
                      : 'bg-stone-200 border-stone-400 text-stone-700 hover:bg-stone-300'
                  }`}
                  title="Toggle Fog of War (孙子·诡道/情报战迷雾)"
                  id="fow-toggle-btn"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#8C2F39]" />
                  <span>{fogOfWarEnabled ? '🛡️ 迷雾开启' : '👁️ 迷雾彻见'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetSimulation}
                  className="bg-transparent border border-stone-400 p-1.5 rounded text-xs font-serif font-bold text-stone-800 cursor-pointer flex items-center gap-1 hover:bg-stone-200"
                  title="Reset Board"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>复位</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`py-1.5 px-3.5 rounded text-xs font-serif font-black text-white cursor-pointer transition-all duration-200 flex items-center gap-1 shadow-sm ${
                    isSimulating 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-[#8C2F39] hover:bg-[#8C2F39]/90 ring-2 ring-[#8C2F39]/20'
                  }`}
                  id="run-battle-clash-btn"
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : ''}`} />
                  <span>{isSimulating ? '⏸ 暂缓天演' : '🔥 一键实装天演推演'}</span>
                </button>
              </div>
            </div>

            {/* General & Forces Selection row - Expanded to md:grid-cols-4 for Allied Formation Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="clash-config-grid">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">
                  👤 主帅任用:
                </label>
                <select
                  value={generalChoice}
                  onChange={(e) => setGeneralChoice(e.target.value as any)}
                  className="w-full text-xs bg-white border border-stone-300 rounded p-1.5 font-serif outline-none"
                  disabled={isSimulating}
                >
                  <option value="caocao">曹操 (枭雄 / 倚仗奇兵伏兵)</option>
                  <option value="baiqi">白起 (杀神 / 破釜决战死地)</option>
                  <option value="hanxin">韩信 (兵仙 / 背水布防挂地)</option>
                  <option value="caoren">曹仁 (铁卫 / 固守本土散地)</option>
                </select>
              </div>

              {/* Stance Option Controller Column */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">
                  🛡️ 我军阵型:
                </label>
                <div className="grid grid-cols-2 gap-1" id="formation-switch">
                  <button
                    type="button"
                    onClick={() => {
                      setAlliedStance('defensive');
                      setSimLog(prev => [`🛡️ 「结御守大阵」我军受令变阵为「方圆御林战法」。移速受控下降，但战御抗打击系数提升 +60%！`, ...prev]);
                    }}
                    className={`py-1.5 px-2 rounded font-serif text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer text-center border-2 ${
                      alliedStance === 'defensive'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                    title="Defensive Stance (Low Speed, High Defense)"
                  >
                    🛡️ 坚防
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlliedStance('offensive');
                      setSimLog(prev => [`⚔️ 「结攻坚杀阵」我军受令变阵为「锋矢攻势战法」。移动速度激增，突袭威慑额外爆发 +50%！`, ...prev]);
                    }}
                    className={`py-1.5 px-2 rounded font-serif text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer text-center border-2 ${
                      alliedStance === 'offensive'
                        ? 'bg-amber-900 text-[#FAF8F5] border-red-500 shadow-md ring-2 ring-red-500/20'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                    }`}
                    title="Offensive Stance (High Speed, High Attack)"
                  >
                    ⚔️ 强袭
                  </button>
                </div>
              </div>

              {/* Force values display bar */}
              <div className="space-y-1 flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-emerald-800 font-bold">🟩 汉/秦军部众:</span>
                  <span className="font-bold">{placedUnits.filter(u => u.side === 'allied').reduce((sum, u) => sum + u.size, 0)} 员</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden border border-black/5 mt-1">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (placedUnits.filter(u => u.side === 'allied').reduce((sum, u) => sum + u.size, 0) / 75000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1 flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-rose-800 font-bold">🟥 敌顽残寇:</span>
                  <span className="font-bold">{placedUnits.filter(u => u.side === 'hostile').reduce((sum, u) => sum + u.size, 0)} 员</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden border border-black/5 mt-1">
                  <div 
                    className="bg-rose-700 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (placedUnits.filter(u => u.side === 'hostile').reduce((sum, u) => sum + u.size, 0) / 75000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Simulation Log Stream */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-800 pb-1.5">
                <span className="text-[10px] font-mono text-stone-500 font-black block uppercase tracking-wide">
                  📑 战场大本营推演塘流
                </span>
                
                {/* Log Classifiers Filter Tabs */}
                <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded border border-stone-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold cursor-pointer transition-all ${
                      logFilter === 'all'
                        ? 'bg-stone-800 text-[#FAF8F5] border border-stone-700'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('allied')}
                    className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      logFilter === 'allied'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    我方
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('hostile')}
                    className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      logFilter === 'hostile'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                    敌营
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('alerts')}
                    className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      logFilter === 'alerts'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                    战讯
                  </button>
                </div>
              </div>

              <div className="w-full h-[120px] bg-stone-900 border border-black text-[#5AF] rounded p-2.5 font-mono text-[10px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-stone-800 select-text" id="clash-logs-terminal">
                {displayedSimLog.length === 0 ? (
                  <p className="text-stone-500 italic">⏳ 擂鼓静待，兵书下令即可开演冲突。</p>
                ) : (
                  displayedSimLog.filter(log => {
                    if (logFilter === 'all') return true;
                    return getLogType(log) === logFilter;
                  }).length === 0 ? (
                    <p className="text-stone-500 italic">⏳ 此类别暂无推演讯息。</p>
                  ) : (
                    displayedSimLog
                      .filter(log => {
                        if (logFilter === 'all') return true;
                        return getLogType(log) === logFilter;
                      })
                      .map((log, index) => {
                        let logColor = "text-stone-300";
                        if (log.includes("⚔️")) logColor = "text-amber-400";
                        if (log.includes("🏆")) logColor = "text-emerald-400 font-bold";
                        if (log.includes("❌")) logColor = "text-rose-400 font-bold animate-pulse";
                        if (log.includes("⭐") || log.includes("⚡")) logColor = "text-cyan-300 font-bold";
                        return (
                          <div key={index} className={`leading-relaxed border-b border-stone-800 pb-1 ${logColor}`}>
                            {log}
                          </div>
                        );
                      })
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
