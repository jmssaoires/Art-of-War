import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Coins, 
  AlertCircle, 
  Sparkles, 
  Sprout, 
  Flame, 
  Swords, 
  Compass, 
  Skull, 
  MapPin, 
  BookOpen, 
  Check, 
  ArrowRight, 
  Sparkle, 
  ChevronRight,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

type SchoolType = 'CONFUCIAN' | 'TAOIST' | 'BUDDHIST_SECTARIAN';

interface LogEntry {
  time: string;
  type: 'info' | 'success' | 'warn' | 'danger';
  text: string;
}

interface Region {
  id: string;
  name: string;
  chineseName: string;
  desc: string;
  x: number; // SVG mapping coordinates
  y: number;
  currentIdeology: SchoolType;
  baseIdeology: SchoolType;
  influence: {
    CONFUCIAN: number;
    TAOIST: number;
    BUDDHIST_SECTARIAN: number;
  };
  unrest: number; // regional tension rate
  population: string;
  activeRebellion?: boolean; // regional uprising status
}

interface HistorySnap {
  turn: number;
  Confucian: number;
  Taoist: number;
  Buddhist: number;
  events?: string;
  rebelForce?: number;
}

export default function UprisingCultureSandbox() {
  // 1. Core State variables for Peasant Uprising & Cultural Dominance
  const [taxRate, setTaxRate] = useState<number>(38); // 0-100%
  const [famineLvl, setFamineLvl] = useState<number>(35); // 0-100%
  const [stateCoffers, setStateCoffers] = useState<number>(48000); // Silver currency
  const [stabilityLvl, setStabilityLvl] = useState<number>(75); // Dynamic Stability 0-100
  const [refugeesPercent, setRefugeesPercent] = useState<number>(18); // General homeless density
  const [rebelForce, setRebelForce] = useState<number>(0); // Rebel soldier counts
  const [isUprisingActive, setIsUprisingActive] = useState<boolean>(false);
  const [hasLooted, setHasLooted] = useState<boolean>(false);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('guanzhong');
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showMapLegendDetails, setShowMapLegendDetails] = useState<boolean>(true);

  // Logs tracking
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '12:00:00', type: 'info', text: '【宣谕】大魏至治宣教礼曹建立。五方大州疆宇各定本教，儒、道、释思想交叠倾轧。' },
    { time: '12:00:02', type: 'success', text: '天下安靖，诸州有司广征粮税，而底层隐忍潜流未断。' }
  ]);

  // 2. Map State (5 Key Territory States of Middle-Kingdom)
  const [regions, setRegions] = useState<Region[]>([
    {
      id: 'guanzhong',
      name: 'Guan-zhong (关中)',
      chineseName: '关中京畿',
      desc: '帝王基业、政权中枢。士子与太学密集成林，正统儒家根基深重。',
      x: 145,
      y: 115,
      currentIdeology: 'CONFUCIAN',
      baseIdeology: 'CONFUCIAN',
      influence: { CONFUCIAN: 75, TAOIST: 15, BUDDHIST_SECTARIAN: 10 },
      unrest: 10,
      population: '八万户',
      activeRebellion: false
    },
    {
      id: 'zhongyuan',
      name: 'Zhong-yuan (中原)',
      chineseName: '中原各郡',
      desc: '天下辐辏之腹心。频遭兵燹且旱蝗不断，无地自耕农易受教道煽惑。',
      x: 275,
      y: 105,
      currentIdeology: 'CONFUCIAN',
      baseIdeology: 'CONFUCIAN',
      influence: { CONFUCIAN: 55, TAOIST: 20, BUDDHIST_SECTARIAN: 25 },
      unrest: 28,
      population: '十四万户',
      activeRebellion: false
    },
    {
      id: 'jiangnan',
      name: 'Jiang-nan (江南)',
      chineseName: '江南商埠',
      desc: '大商海运与盐引枢纽之利。民气奢华而官律松驰，道教无为休养风盛。',
      x: 375,
      y: 215,
      currentIdeology: 'TAOIST',
      baseIdeology: 'TAOIST',
      influence: { CONFUCIAN: 25, TAOIST: 65, BUDDHIST_SECTARIAN: 10 },
      unrest: 15,
      population: '十二万户',
      activeRebellion: false
    },
    {
      id: 'jingchu',
      name: 'Jing-chu (荆楚)',
      chineseName: '荆楚重湖',
      desc: '云梦大泽，崇山复水。流民退避落草，白莲密教在此扎根引诱。',
      x: 235,
      y: 205,
      currentIdeology: 'BUDDHIST_SECTARIAN',
      baseIdeology: 'BUDDHIST_SECTARIAN',
      influence: { CONFUCIAN: 20, TAOIST: 20, BUDDHIST_SECTARIAN: 60 },
      unrest: 45,
      population: '九万户',
      activeRebellion: false
    },
    {
      id: 'bashu',
      name: 'Ba-shu (巴蜀)',
      chineseName: '巴蜀山川',
      desc: '重峰闭锁之天府。险阻极深，张天师法水真符于林莽隐士口授流转。',
      x: 85,
      y: 225,
      currentIdeology: 'TAOIST',
      baseIdeology: 'TAOIST',
      influence: { CONFUCIAN: 30, TAOIST: 50, BUDDHIST_SECTARIAN: 20 },
      unrest: 15,
      population: '六万户',
      activeRebellion: false
    }
  ]);

  // 3. Historical Database for 'Cultural Influence Map Over Time'
  const [history, setHistory] = useState<HistorySnap[]>([
    { turn: 1, Confucian: 51, Taoist: 34, Buddhist: 15, events: '正本初始 儒墨镇朝', rebelForce: 0 },
    { turn: 2, Confucian: 48, Taoist: 36, Buddhist: 16, events: '大漕引决 异派稍苏', rebelForce: 0 },
    { turn: 3, Confucian: 46, Taoist: 37, Buddhist: 17, events: '荒情潜滋 游民附法', rebelForce: 0 },
    { turn: 4, Confucian: 43, Taoist: 38, Buddhist: 19, events: '礼部弛禁 佛院盛积', rebelForce: 0 }
  ]);

  // Sync real-time rebel Force changes on the current active turn
  useEffect(() => {
    setHistory(prevHist => {
      if (prevHist.length === 0) return prevHist;
      const lastIndex = prevHist.length - 1;
      if (prevHist[lastIndex].rebelForce === rebelForce) return prevHist;
      const updated = [...prevHist];
      updated[lastIndex] = {
        ...updated[lastIndex],
        rebelForce: rebelForce
      };
      return updated;
    });
  }, [rebelForce]);

  // Dynamic Hover state for History Chart
  const [hoveredSnap, setHoveredSnap] = useState<HistorySnap | null>(null);

  // Helper: Log logger
  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'danger' = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setLogs(prev => [{ time: timeStr, type, text }, ...prev.slice(0, 18)]);
  };

  // 4. Calculate Aggregate Empire-wide Cultural Influences
  const getNationalStats = () => {
    let totalConfucian = 0;
    let totalTaoist = 0;
    let totalBuddhist = 0;
    regions.forEach(r => {
      totalConfucian += r.influence.CONFUCIAN;
      totalTaoist += r.influence.TAOIST;
      totalBuddhist += r.influence.BUDDHIST_SECTARIAN;
    });
    const divisor = regions.length;
    return {
      CONFUCIAN: Math.round(totalConfucian / divisor),
      TAOIST: Math.round(totalTaoist / divisor),
      BUDDHIST_SECTARIAN: Math.round(totalBuddhist / divisor)
    };
  };

  const nationalStats = getNationalStats();

  // Derive religious suppression multiplier from Buddhism (Sectarian) influence
  const religiousSuppression = Number((nationalStats.BUDDHIST_SECTARIAN / 100).toFixed(2));

  // Formula for Peasant Uprising Probability P
  const formulaRawProb = (taxRate * 1.5 + famineLvl * 2.0 - 5) * (1 - religiousSuppression * 0.7);
  const uprisingProb = Math.max(0, Math.min(100, Math.round(formulaRawProb)));

  // Helper to compute dynamic metrics for an individual region
  const getRegionMetrics = (r: Region) => {
    // 1. Calculate local taxation delta
    let localTax = taxRate + (r.id === 'zhongyuan' ? 5 : r.id === 'jiangnan' ? -8 : r.id === 'guanzhong' ? 0 : r.id === 'jingchu' ? 8 : -3);
    if (r.currentIdeology === 'TAOIST') {
      localTax -= 6; // Taoist minimal government / laissez faire
    } else if (r.currentIdeology === 'BUDDHIST_SECTARIAN') {
      localTax += 6; // Sectarian friction with government tax collection
    }
    localTax = Math.max(0, Math.min(100, localTax));

    // 2. Calculate local famine delta
    let localFamine = famineLvl + (r.id === 'zhongyuan' ? 10 : r.id === 'jiangnan' ? -12 : r.id === 'guanzhong' ? -5 : r.id === 'jingchu' ? 8 : -2);
    if (r.currentIdeology === 'BUDDHIST_SECTARIAN') {
      localFamine -= 10; // White Lotus charity soup kitchens mitigate food shocks
    } else if (r.currentIdeology === 'TAOIST') {
      localFamine -= 5; // Taoist simple living
    } else if (r.currentIdeology === 'CONFUCIAN') {
      localFamine += 4; // Bureaucracy and storage hoarding delays
    }
    localFamine = Math.max(0, Math.min(100, localFamine));

    // 3. Cultural doctrine dominance buffer/catalyst delta
    let doctrineModifier = 0;
    let description = '';
    
    if (r.currentIdeology === 'CONFUCIAN') {
      doctrineModifier = -Math.round(r.influence.CONFUCIAN * 0.4);
      description = `📖 儒礼秩序 (-${Math.abs(doctrineModifier)}% 安定率提振)`;
    } else if (r.currentIdeology === 'TAOIST') {
      doctrineModifier = -Math.round(r.influence.TAOIST * 0.5);
      description = `☯️ 老庄退藏 (-${Math.abs(doctrineModifier)}% 离乱消释)`;
    } else if (r.currentIdeology === 'BUDDHIST_SECTARIAN') {
      if (localTax + localFamine > 80) {
        // Millenarian catalyst triggers!
        doctrineModifier = Math.round(r.influence.BUDDHIST_SECTARIAN * 0.6);
        description = `📿 白莲起事催化 (+${doctrineModifier}% 弥勒起义极化)`;
      } else {
        doctrineModifier = -Math.round(r.influence.BUDDHIST_SECTARIAN * 0.2);
        description = `📿 白莲设赈缓冲 (-${Math.abs(doctrineModifier)}% 难民庇所)`;
      }
    }

    // 4. Ideological Resistance and Escalation Rate Formulation
    const confucianStability = r.influence.CONFUCIAN;
    const currentIdeologyValue = r.currentIdeology === 'BUDDHIST_SECTARIAN' 
      ? r.influence.BUDDHIST_SECTARIAN 
      : r.influence[r.currentIdeology];
    
    // Delta between region's current prevalent ideology value and its Confucian support baseline represents the resistance:
    const ideologicalResistance = Math.abs(currentIdeologyValue - confucianStability);
    
    // Dynamic escalation rate determines how fast unrest climbs per turn:
    const escalationRate = 2 + Math.round(ideologicalResistance * 0.15);

    // 5. Rebellion risk calculation based on delta between tax, famine, regional unrest & dominance modifier
    const riskDelta = Math.max(0, Math.min(100, Math.round((localTax * 0.5 + localFamine * 0.5 + r.unrest * 0.6) + doctrineModifier)));

    return {
      localTax,
      localFamine,
      doctrineModifier,
      doctrineDesc: description,
      ideologicalResistance,
      escalationRate,
      riskDelta
    };
  };

  // Peasant Rebellion Trigger Assessment Effect (Safe Functional State Update)
  useEffect(() => {
    // Dynamic refugees are modified by famine index and lessened by Taoist (lax) or Buddhist (temple shelters)
    let newRefugees = Math.round((taxRate * 0.45 + famineLvl * 0.55));
    const taoistBonus = Math.round(nationalStats.TAOIST * 0.25);
    const buddhistBonus = Math.round(nationalStats.BUDDHIST_SECTARIAN * 0.35);
    
    newRefugees = Math.max(5, newRefugees - (taoistBonus + buddhistBonus));
    setRefugeesPercent(Math.min(95, newRefugees));

    // Stability level calculation
    const derivedStability = Math.max(0, 100 - Math.round(taxRate * 0.4 + famineLvl * 0.5 + refugeesPercent * 0.3));
    setStabilityLvl(derivedStability);

    // Scan regions and evaluate active rebellion transitions
    setRegions(prevRegions => {
      let updatedCount = 0;
      let newRebelForceAdded = 0;
      
      const nextRegions = prevRegions.map(r => {
        // Calculate dynamic metrics for the region using central helper
        const m = getRegionMetrics(r);
        const shouldRebel = m.riskDelta >= 65;

        if (shouldRebel && !r.activeRebellion) {
          updatedCount++;
          newRebelForceAdded += 1400 + Math.round(Math.random() * 800);

          let customLog = '';
          if (r.id === 'guanzhong') {
            customLog = `🚨 【京畿风暴】关中天府税课暴涨，禁军戍卒自危哗变，裹挟饥民揭竿抗税！`;
          } else if (r.id === 'zhongyuan') {
            customLog = `🚨 【中原子弟】中原各郡遭课骨极征且旱荒绝粮！白莲大教首借谶言登高抗拒，乱民十万聚于朝野！`;
          } else if (r.id === 'jiangnan') {
            customLog = `🚨 【江南暴乱】江南榷征课赋极烈！私盐帮众会同玄道门众激起公愤，焚盐务总署抗税！`;
          } else if (r.id === 'jingchu') {
            customLog = `🚨 【楚泽蜂起】荆楚大泽流亡逃农满载白莲教诀，反丁群首竖起赤巾起义，官逼民反，全境惊溃！`;
          } else {
            customLog = `🚨 【蜀山自据】巴蜀峻谷要害！道家羽士据防抗差抗赋，天师号令法营守隘，自据独立！`;
          }
          
          setTimeout(() => addLog(customLog, 'danger'), 50);
          return { ...r, activeRebellion: true, unrest: Math.min(100, r.unrest + 30) };
        } else if (!shouldRebel && r.activeRebellion) {
          updatedCount++;
          return { ...r, activeRebellion: false };
        }
        return r;
      });

      if (updatedCount > 0) {
        setIsUprisingActive(nextRegions.some(reg => reg.activeRebellion));
        if (newRebelForceAdded > 0) {
          setRebelForce(prev => prev + newRebelForceAdded);
        }
        return nextRegions;
      }
      return prevRegions;
    });
  }, [taxRate, famineLvl, nationalStats.TAOIST, nationalStats.BUDDHIST_SECTARIAN, refugeesPercent]);

  // Selected Region Metadata
  const activeRegion = regions.find(r => r.id === selectedRegionId) || regions[0];

  // 5. Missionary Conversion Event System
  const handleMissionaryDispatch = (school: SchoolType) => {
    const cost = school === 'CONFUCIAN' ? 1200 : school === 'TAOIST' ? 900 : 700;
    
    if (stateCoffers < cost) {
      addLog(`❌ 金库空虚！派遣「${school === 'CONFUCIAN' ? '大儒讲道' : school === 'TAOIST' ? '方士设坛' : '佛僧度化'}」需金 ${cost} 贯，官家调度不及。`, 'danger');
      return;
    }

    // Success rate affected by regional unrest and existing dominance
    // Change selected region's influence
    setStateCoffers(prev => prev - cost);
    
    setRegions(prevRegions => {
      return prevRegions.map(r => {
        if (r.id !== selectedRegionId) return r;

        const currentInf = { ...r.influence };
        let gain = 24 + Math.round(Math.random() * 8); // Base 24-32% boost
        
        // Adjust values dynamically
        if (school === 'CONFUCIAN') {
          currentInf.CONFUCIAN = Math.min(100, currentInf.CONFUCIAN + gain);
          // Absorb from others
          const rem = 100 - currentInf.CONFUCIAN;
          const ratio = currentInf.TAOIST + currentInf.BUDDHIST_SECTARIAN || 1;
          currentInf.TAOIST = Math.round((currentInf.TAOIST / ratio) * rem);
          currentInf.BUDDHIST_SECTARIAN = rem - currentInf.TAOIST;
        } else if (school === 'TAOIST') {
          currentInf.TAOIST = Math.min(100, currentInf.TAOIST + gain);
          const rem = 100 - currentInf.TAOIST;
          const ratio = currentInf.CONFUCIAN + currentInf.BUDDHIST_SECTARIAN || 1;
          currentInf.CONFUCIAN = Math.round((currentInf.CONFUCIAN / ratio) * rem);
          currentInf.BUDDHIST_SECTARIAN = rem - currentInf.CONFUCIAN;
        } else {
          currentInf.BUDDHIST_SECTARIAN = Math.min(100, currentInf.BUDDHIST_SECTARIAN + gain);
          const rem = 100 - currentInf.BUDDHIST_SECTARIAN;
          const ratio = currentInf.CONFUCIAN + currentInf.TAOIST || 1;
          currentInf.CONFUCIAN = Math.round((currentInf.CONFUCIAN / ratio) * rem);
          currentInf.TAOIST = rem - currentInf.CONFUCIAN;
        }

        // Determine if ideology dominant shifts (school reaches above others)
        let dominantIdeology = r.currentIdeology;
        if (currentInf.CONFUCIAN >= currentInf.TAOIST && currentInf.CONFUCIAN >= currentInf.BUDDHIST_SECTARIAN) {
          dominantIdeology = 'CONFUCIAN';
        } else if (currentInf.TAOIST >= currentInf.CONFUCIAN && currentInf.TAOIST >= currentInf.BUDDHIST_SECTARIAN) {
          dominantIdeology = 'TAOIST';
        } else {
          dominantIdeology = 'BUDDHIST_SECTARIAN';
        }

        const isChanged = dominantIdeology !== r.currentIdeology;
        if (isChanged) {
          setTimeout(() => {
            addLog(`⚡ 【领土法统覆写】因宣道得成，【${r.chineseName}】郡府官方主轴正式蜕化为 「${
              dominantIdeology === 'CONFUCIAN' ? '儒字正礼' : dominantIdeology === 'TAOIST' ? '道家太虚' : '白莲弥勒'
            }」，全境信仰地理随之易帜！`, 'success');
          }, 100);
        }

        return {
          ...r,
          influence: currentInf,
          currentIdeology: dominantIdeology
        };
      });
    });

    const schoolDesc = school === 'CONFUCIAN' ? '大儒太学生' : school === 'TAOIST' ? '玄门箓真' : '白莲释众';
    const logDesc = `⛪ 【布道宣谕】耗费库银 ${cost} 贯，发遣「${schoolDesc}」奇袭【${activeRegion.chineseName}】广建法坛，该里乡里皈依率暴增！`;
    addLog(logDesc, 'info');

    // Automatically step Time Snapshot forward to trace on "Time Chart"
    handleTimeTick(`行宣布法：${activeRegion.chineseName}`);
  };

  // Force time tick step (to trace graphs and propagate unrest escalation)
  const handleTimeTick = (milestoneName?: string) => {
    // 1. Advance regional unrest based on Ideological Resistance
    setRegions(prevRegions => {
      return prevRegions.map(r => {
        const m = getRegionMetrics(r);
        // If the region has active rebellion, unrest accelerates further, otherwise it climbs at escalationRate
        const multiplier = r.activeRebellion ? 1.5 : 1.0;
        const incremental = Math.round(m.escalationRate * multiplier);
        const nextUnrest = Math.min(100, r.unrest + incremental);
        return {
          ...r,
          unrest: nextUnrest
        };
      });
    });

    setCurrentTurn(prev => {
      const nextTurn = prev + 1;
      const stats = getNationalStats();
      setHistory(prevHist => {
        const updated = [
          ...prevHist,
          {
            turn: nextTurn,
            Confucian: stats.CONFUCIAN,
            Taoist: stats.TAOIST,
            Buddhist: stats.BUDDHIST_SECTARIAN,
            events: milestoneName || '天下运转 思想变迁',
            rebelForce: rebelForce
          }
        ];
        // trim to latest 12 entries
        return updated.slice(-12);
      });
      return nextTurn;
    });
  };

  // State actions
  const handleLevyTax = () => {
    setStateCoffers(prev => prev + 15000);
    setTaxRate(prev => Math.min(100, prev + 15));
    // increase regional unrest
    setRegions(prev => prev.map(r => ({ ...r, unrest: Math.min(100, r.unrest + 12) })));
    addLog('💰 【榷科急征】朝廷户部下发加赋白札，勒索江南及中原商行绢绢，库金充裕 +15000，但天下积怨重。', 'warn');
    handleTimeTick('官府厉兵征税');
  };

  const handleRelief = () => {
    if (stateCoffers < 6000) {
      addLog('❌ 官库虚空！开仓急振需金 6000 贯，国司存谷底耗尽。', 'danger');
      return;
    }
    setStateCoffers(prev => prev - 6000);
    setFamineLvl(prev => Math.max(5, prev - 22));
    setRegions(prev => prev.map(r => ({ ...r, unrest: Math.max(0, r.unrest - 8) })));
    addLog('🌾 【出粟蠲赈】朝廷开太仓御积 grain，蠲免贫困户岁租赋役，饥荒大解，民变概率平息。', 'success');
    handleTimeTick('太仓赈恤四海');
  };

  const handleTriggerFamine = () => {
    setFamineLvl(85);
    setRegions(prev => prev.map(r => ({ ...r, unrest: Math.min(100, r.unrest + 25) })));
    addLog('🌪️ 【天谴灾星】天官急奏：黄河暴决冲垮河提，十数郡化作泽国，难民遍地无归。', 'danger');
    handleTimeTick('黄河决溢天灾');
  };

  // Anti-rebel military suppress
  const handleSuppress = () => {
    if (!isUprisingActive || rebelForce <= 0) return;

    // Supression effectiveness boosted by Guanzhong/Zhongyuan ideology matching CONFUCIAN 
    let militaryPower = 1600;
    const confucianRegions = regions.filter(r => r.currentIdeology === 'CONFUCIAN').length;
    militaryPower += confucianRegions * 350; // Confucian discipline aids logistics
    
    const casualties = Math.min(rebelForce, Math.round(militaryPower * (0.85 + Math.random() * 0.4)));
    const remaining = rebelForce - casualties;

    if (remaining <= 0) {
      setRebelForce(0);
      setIsUprisingActive(false);
      setHasLooted(false);
      setRegions(prev => prev.map(r => ({ ...r, activeRebellion: false })));
      addLog('⚔️ 【平暴功成】羽林军会同关防重兵围合合击，斩贼寇首，乱民残军扫荡勘定！', 'success');
    } else {
      setRebelForce(remaining);
      addLog(`⚔️ 【山河绞阵】前哨节度使斩获义兵首级 ${casualties} 级，然乱寇盘据天险，残部 ${remaining} 众誓死反抗！`, 'warn');
    }
    handleTimeTick('官军合击剿饷');
  };

  // Dispatch regional garrison to sweep/suppress a specific region's rebellion
  const handleSuppressRegion = (regionId: string) => {
    const cost = 4500;
    if (stateCoffers < cost) {
      addLog(`❌ 库银不足！平定该境乱局需调饷军银 ${cost} 贯，有司度支不及。`, 'danger');
      return;
    }

    setStateCoffers(prev => prev - cost);
    setRegions(prevRegions => {
      let isFound = false;
      const updated = prevRegions.map(r => {
        if (r.id === regionId) {
          isFound = true;
          return { ...r, activeRebellion: false, unrest: Math.max(0, r.unrest - 30) };
        }
        return r;
      });
      if (isFound) {
        setTimeout(() => {
          const regionName = prevRegions.find(rg => rg.id === regionId)?.chineseName || '本境';
          addLog(`⚔️ 【王师勘定】朝廷飞骑直射羽林军急下【${regionName}】清剿流寇逆徒，光复城池！`, 'success');
        }, 30);
      }
      return updated;
    });

    setRebelForce(prev => Math.max(0, prev - 1850));
    handleTimeTick(`官军清平地方`);
  };

  const handleRebelPolicy = (choice: 'LOOT' | 'REGULATE') => {
    if (!isUprisingActive) return;
    if (choice === 'LOOT') {
      setStateCoffers(prev => prev + 20000); // stolen treasury
      setRebelForce(prev => prev + 1000);
      setHasLooted(true);
      addLog('🔥 【纵兵焚大掠】流贼攻破州城大肆掘富，得金 20000 贯，盗首狂笑相投，然地方民气砸碎为零。', 'danger');
    } else {
      setRebelForce(prev => Math.max(300, prev - 500)); // discipline shrinks raw mob sizes to professional cadres
      setFamineLvl(prev => Math.max(5, prev - 15));
      addLog('🌾 【施粥买心】义军高挂“真主明皇”大纛，清算墨吏，赈济穷丁，荆楚父老奉箪食壶浆以迎。', 'success');
    }
    handleTimeTick('叛军决策变动');
  };

  // 6. D3-Style Render calculations helper for SVG lines 
  // We formulate mathematically computed chart coordinates.
  const chartWidth = 530;
  const chartHeight = 150;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 10;
  const paddingBottom = 20;

  // Render SVG Paths representing Confucian, Taoist, Buddhist percentages
  const getCoordinates = (points: { turn: number, value: number }[]): { x: number, y: number }[] => {
    if (points.length < 2) return [];
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    const minX = 1;
    const maxX = Math.max(5, points[0].turn + points.length - 1);
    
    return points.map((p, index) => {
      // Calculate scaled x relative to indices or values
      const ratioX = points.length > 1 ? index / (points.length - 1) : 0;
      const x = paddingLeft + ratioX * usableWidth;
      const y = paddingTop + usableHeight - (p.value / 100) * usableHeight;
      return { x, y };
    });
  };

  const confPoints = history.map(h => ({ turn: h.turn, value: h.Confucian }));
  const taoPoints = history.map(h => ({ turn: h.turn, value: h.Taoist }));
  const budPoints = history.map(h => ({ turn: h.turn, value: h.Buddhist }));

  const confCoords = getCoordinates(confPoints);
  const taoCoords = getCoordinates(taoPoints);
  const budCoords = getCoordinates(budPoints);

  const generateLinePath = (coords: { x: number, y: number }[]) => {
    if (coords.length === 0) return '';
    return coords.reduce((acc, curr, index) => {
      return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  };

  const generateAreaPath = (coords: { x: number, y: number }[]) => {
    if (coords.length === 0) return '';
    const baseLineY = chartHeight - paddingBottom;
    const linePath = generateLinePath(coords);
    return `${linePath} L ${coords[coords.length - 1].x} ${baseLineY} L ${coords[0].x} ${baseLineY} Z`;
  };

  return (
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="uprising-culture-root">
      
      {/* SECTION 1: Strategic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-[#1A1A1A]/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <Flame className="text-[#8C2F39] w-5 h-5 animate-pulse" />
            【义兵与信仰】农民反逆触发与五境学说博弈
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            GDD大战略模块 13 与 14 深入联动：高赋课与旱蝗危机交织触发叛军，五境传教皈依改写天命版图。
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-[10px]">
          <span className="border border-[#1A1A1A]/15 px-2.5 py-1 text-[#8C2F39] bg-white/50 backdrop-blur-xs font-bold rounded shadow-xs">
            朝野历元: 第 {currentTurn} 纪
          </span>
          <span className="text-xs border border-[#8C2F39]/20 px-2 py-1 text-[#8C2F39] rounded bg-[#8C2F39]/5 font-bold shadow-xs">
            交互核心 13 · 14 联合大控盘
          </span>
        </div>
      </div>

      {/* SECTION 2: Territorial Dominance Map & Conversion Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left column (Map): 7 Units of screen width */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Sub-Card: Visual Influence Territorial Map */}
          <div className="bg-white/55 p-4 rounded border border-[#1A1A1A]/15 shadow-xs relative flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A]/10 pb-2 mb-3">
              <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-black uppercase tracking-wider">
                <Compass className="w-4 h-4 text-[#8C2F39]" />
                中朝九州疆理形势 (Territorial Influence Map)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  id="toggle-heatmap-btn"
                  onClick={() => setShowHeatmap(prev => !prev)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                    showHeatmap 
                      ? 'bg-[#8C2F39] text-white border-[#6b2229] hover:bg-[#73262e]' 
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                  }`}
                  aria-label="切换民变热力图叠加"
                >
                  <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-400 animate-pulse' : 'text-[#8C2F39]'}`} />
                  {showHeatmap ? '🔥 热力图: 已开启' : '🎛️ 开启民变热力图'}
                </button>
                <span className="text-[10px] text-[#8C2F39]/60 font-mono flex items-center gap-1 bg-[#8C2F39]/5 px-1.5 py-1 rounded border border-[#8C2F39]/10">
                  <Sparkle className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} /> 
                  官方思想大一统: {
                    nationalStats.CONFUCIAN > 45 ? '📖 儒家理法' : nationalStats.TAOIST > 45 ? '☯️ 道骨无为' : '📿 白莲降世'
                  }
                </span>
              </div>
            </div>

            {/* Simulated Geographic Vector Map of Ancient China */}
            <div className="relative bg-[#FAF6F0] rounded-sm border border-[#1A1A1A]/10 w-full overflow-hidden shadow-xs py-2 flex items-center justify-center">
              
              {/* Paper Grids backing to look old */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              
              {/* Core SVG Map */}
              <svg viewBox="0 0 460 300" className="w-full max-w-[460px] h-auto relative z-10">
                {/* Ancient Provincial Boundary Intertwining paths (Scribbles) */}
                <path 
                  d="M 50 140 Q 120 70 200 120 T 320 60 T 420 180 T 300 280 T 150 250 Z" 
                  fill="none" 
                  stroke="#8C2F39" 
                  strokeWidth="0.75" 
                  strokeDasharray="4 4" 
                  className="opacity-25"
                />
                
                {/* Ancient Capital Great Wall representation */}
                <path 
                  d="M 120 70 L 260 60 M 260 60 L 390 110" 
                  fill="none" 
                  stroke="#1A1A1A" 
                  strokeWidth="1.5" 
                  className="opacity-15"
                />

                {/* Rivers & Navigation canal path (Yellow river/Grand Canal) */}
                <path 
                  d="M 100 240 Q 210 230 260 170 T 380 230" 
                  fill="none" 
                  stroke="#5F8A96" 
                  strokeWidth="2.5" 
                  className="opacity-40"
                  strokeLinecap="round"
                />

                {/* Draw Connected Travel Pathways between regions */}
                {regions.map((source, idx) => {
                  return regions.slice(idx + 1).map(target => {
                    // Check physical proximity to draw a thin connection
                    const dist = Math.hypot(source.x - target.x, source.y - target.y);
                    if (dist < 185) {
                      return (
                        <line
                          key={`${source.id}-${target.id}`}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="#1A1A1A"
                          strokeWidth="1"
                          className="opacity-[0.12] stroke-dasharray-[3]"
                        />
                      );
                    }
                    return null;
                  });
                })}

                {/* Geographic Label Rings */}
                {regions.map(r => {
                  const isSelected = r.id === selectedRegionId;
                  
                  // Color codes for different local ideologies (neutralized when showMapLegendDetails is false for decluttering)
                  const fillHex = !showMapLegendDetails
                    ? '#8E8883' // Neutral stone-400 equivalent for neat vector layout
                    : r.currentIdeology === 'CONFUCIAN' 
                    ? '#8C2F39' 
                    : r.currentIdeology === 'TAOIST' 
                    ? '#065f46' 
                    : '#d97706';
                  
                  const strokeHex = !showMapLegendDetails
                    ? '#57534e' // Neutral stone-500 equivalent
                    : r.currentIdeology === 'CONFUCIAN' 
                    ? '#8C2F39' 
                    : r.currentIdeology === 'TAOIST' 
                    ? '#10b981' 
                    : '#f59e0b';

                  return (
                    <g 
                      key={r.id} 
                      className="cursor-pointer group select-none outline-none focus-visible:outline-none"
                      onClick={() => setSelectedRegionId(r.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${r.chineseName} 区域。当前主流思想：${
                        r.currentIdeology === 'CONFUCIAN' 
                          ? '儒家秩序' 
                          : r.currentIdeology === 'TAOIST' 
                          ? '道教无为' 
                          : '白莲秘教'
                      }。局势状况：${r.activeRebellion ? '正在发生起义暴动！' : '地方局势安稳。'}`}
                      aria-pressed={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRegionId(r.id);
                        }
                      }}
                      onFocus={() => {
                        setFocusedRegionId(r.id);
                      }}
                      onBlur={() => {
                        setFocusedRegionId(null);
                      }}
                    >
                      {/* Rebellion Heatmap Overlays */}
                      {showHeatmap && (() => {
                        const m = getRegionMetrics(r);
                        // Map riskDelta to high-contrast heatmap colors: Red for high risk, Amber for medium risk, Green for low risk
                        const heatColor = m.riskDelta >= 65 
                          ? '#EF4444' 
                          : m.riskDelta >= 35 
                          ? '#F59E0B' 
                          : '#10B981';

                        const heatOpacity = 0.12 + (m.riskDelta / 100) * 0.45;
                        const heatRadius = 22 + (m.riskDelta / 100) * 28;

                        return (
                          <motion.g key={`${r.id}-heatmap-overlay`} pointerEvents="none">
                            {/* Ambient heat aura */}
                            <circle
                              cx={r.x}
                              cy={r.y}
                              r={10 + (m.riskDelta / 100) * 14}
                              fill={heatColor}
                              opacity={heatOpacity}
                              className="filter blur-[4px]"
                            />
                            {/* Pulsing thermal heatwave */}
                            <motion.circle
                              cx={r.x}
                              cy={r.y}
                              r={heatRadius}
                              fill="none"
                              stroke={heatColor}
                              strokeWidth={1.2 + (m.riskDelta / 100) * 3}
                              opacity={heatOpacity * 0.7}
                              animate={{ 
                                scale: [0.96, 1.12, 0.96],
                                opacity: [heatOpacity * 0.5, heatOpacity * 0.9, heatOpacity * 0.5]
                              }}
                              transition={{ 
                                duration: 2.4 - (m.riskDelta / 100) * 1.2, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                            />
                            {/* Conditionally render numeric risk overlays to declutter map view */}
                            {showMapLegendDetails && (
                              <>
                                {/* Numeric Risk Overlay box on the map node itself */}
                                <rect
                                  x={r.x - 17}
                                  y={r.y + 14}
                                  width={34}
                                  height={11}
                                  rx={1.5}
                                  fill="#1A1A1A"
                                  stroke={heatColor}
                                  strokeWidth="0.5"
                                  opacity={0.9}
                                />
                                <text
                                  x={r.x}
                                  y={r.y + 22}
                                  className="fill-white font-mono font-bold text-[7.5px]"
                                  textAnchor="middle"
                                >
                                  🔥{m.riskDelta}%
                                </text>
                              </>
                            )}
                          </motion.g>
                        );
                      })()}

                      {/* Keyboard and selection focal target ring */}
                      {(isSelected || focusedRegionId === r.id) && (
                        <motion.circle
                          cx={r.x}
                          cy={r.y}
                          r="18"
                          fill="none"
                          stroke={strokeHex}
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                          style={{ transformOrigin: `${r.x}px ${r.y}px` }}
                          pointerEvents="none"
                        />
                      )}

                      {/* Transient conversion pulse halo - triggers on ideology change! */}
                      {showMapLegendDetails && (
                        <motion.circle
                          key={`${r.id}-${r.currentIdeology}-burst`}
                          cx={r.x}
                          cy={r.y}
                          initial={{ r: 6, opacity: 1, strokeWidth: 5, stroke: strokeHex }}
                          animate={{
                            r: 45,
                            opacity: 0,
                            strokeWidth: 0.5,
                            stroke: strokeHex,
                          }}
                          transition={{
                            duration: 1.6,
                            ease: "easeOut",
                          }}
                          fill="none"
                          pointerEvents="none"
                        />
                      )}

                      {/* Continuous slow ambient breathing halo */}
                      {showMapLegendDetails && (
                        <motion.circle
                          cx={r.x}
                          cy={r.y}
                          animate={{
                            r: (isSelected || focusedRegionId === r.id) ? [14, 20, 14] : [9, 13, 9],
                            opacity: (isSelected || focusedRegionId === r.id) ? [0.45, 0.15, 0.45] : [0.28, 0.08, 0.28],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          fill="none"
                          stroke={strokeHex}
                          strokeWidth="1.5"
                          pointerEvents="none"
                        />
                      )}

                      {/* Map Node base circle with animated color and size transition */}
                      <motion.circle 
                        key={`${r.id}-${r.currentIdeology}-node`}
                        cx={r.x} 
                        cy={r.y} 
                        initial={{ scale: 2.4, opacity: 0.7 }}
                        animate={{
                          fill: fillHex,
                          r: (isSelected || focusedRegionId === r.id) ? 9 : 6.5,
                          scale: [2.4, 0.7, 1.2, 1],
                          opacity: 1
                        }}
                        transition={{
                          duration: 0.75,
                          ease: "easeOut",
                          fill: { duration: 0.45, ease: "easeInOut" }
                        }}
                        className="shadow-lg outline outline-2 outline-white origin-center" 
                        style={{ transformOrigin: `${r.x}px ${r.y}px` }}
                      />

                      {/* Flag Pole Marker */}
                      <line 
                        x1={r.x} 
                        y1={r.y} 
                        x2={r.x} 
                        y2={r.y - 12} 
                        stroke="#1A1A1A" 
                        strokeWidth="1" 
                        className="opacity-70 group-hover:opacity-100"
                      />

                      {/* Banner Icon */}
                      <rect 
                        x={r.x + 2} 
                        y={r.y - 20} 
                        width={38} 
                        height={10} 
                        rx={1}
                        fill="#FAF6F0"
                        stroke="#1A1A1A"
                        strokeWidth="0.5"
                        className="opacity-90 group-hover:opacity-100 shadow-xs"
                      />

                      {/* Mini typography on map */}
                      <text 
                        x={r.x + 5} 
                        y={r.y - 12} 
                        className="font-serif font-black text-[7px]" 
                        fill="#1A1A1A"
                      >
                        {r.chineseName}
                      </text>

                      {/* Localized Active Rebellion indication */}
                      {r.activeRebellion && (
                        <motion.g
                          key={`${r.id}-rebellion-marker`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        >
                          <circle
                            cx={r.x}
                            cy={r.y}
                            r="15"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="1.5"
                            strokeDasharray="3 1.5"
                          />
                          {showMapLegendDetails && (
                            <text
                              x={r.x + 30}
                              y={r.y - 18}
                              className="text-[12px]"
                              style={{ fontStyle: 'normal', userSelect: 'none', pointerEvents: 'none' }}
                            >
                              🔥
                            </text>
                          )}
                        </motion.g>
                      )}
                    </g>
                  );
                })}

                {/* SVG-Based Rebellion Heatmap Toggle Button */}
                <g 
                  id="svg-heatmap-toggle-btn"
                  className="cursor-pointer select-none group"
                  onClick={() => setShowHeatmap(prev => !prev)}
                  tabIndex={0}
                  role="button"
                  aria-label="在地图上切换民变热力图 Overlay Rebellion Heatmap"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowHeatmap(prev => !prev);
                    }
                  }}
                >
                  {/* Outer Button Box with elegant traditional border and hover glow */}
                  <rect
                    x={310}
                    y={15}
                    width={135}
                    height={24}
                    rx={4}
                    fill={showHeatmap ? "#8C2F39" : "#ffffff"}
                    stroke="#1A1A1A"
                    strokeWidth="1.25"
                    className="shadow-sm transition-all duration-200 group-hover:stroke-[#8C2F39] group-hover:stroke-[1.5px]"
                  />
                  {/* Status Indicator circle with animated glow if active */}
                  <circle
                    cx={325}
                    cy={27}
                    r={5}
                    fill={showHeatmap ? "#F97316" : "#cbd5e1"}
                    stroke="#1A1A1A"
                    strokeWidth="0.75"
                  />
                  <text
                    x={340}
                    y={30}
                    className={`font-mono text-[8.5px] font-black tracking-wider ${showHeatmap ? "fill-white" : "fill-[#1A1A1A]"}`}
                  >
                    {showHeatmap ? "🔥 民变热力: 开启" : "🎛️ 开启民变热力"}
                  </text>
                </g>
              </svg>

              {/* Float Map Compass card */}
              <div className="absolute right-3.5 bottom-3 text-[9px] font-mono bg-white/70 backdrop-blur-md p-2 rounded border border-[#1A1A1A]/12 leading-normal select-none shadow-xs z-20 w-44">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-1 mb-1.5">
                  <span className="font-bold text-[8px] text-[#8C2F39] tracking-wider uppercase">疆理图例 Key</span>
                  <button
                    id="toggle-map-details-btn"
                    onClick={() => setShowMapLegendDetails(prev => !prev)}
                    className={`px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold transition-all border outline-none active:scale-95 ${
                      showMapLegendDetails
                        ? "bg-[#8C2F39] text-white border-[#8C2F39]/80 hover:bg-[#73262e] shadow-3xs"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300 shadow-3xs"
                    }`}
                    title={showMapLegendDetails ? "净化地图，隐藏色彩与风险标签" : "显示详情，还原色彩与风险标签"}
                    aria-label="切换地图详情和风险标签"
                  >
                    {showMapLegendDetails ? "👁️ 极简" : "👁️ 详情"}
                  </button>
                </div>
                {!showMapLegendDetails && (
                  <div className="text-[7.5px] font-mono text-stone-500 mb-1 leading-tight text-center bg-stone-50 px-1 py-0.5 rounded border border-stone-200">
                    🔕 极简净化模式：色标与风险标签已隐藏
                  </div>
                )}
                {!showHeatmap ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full border border-white shadow-3xs ${!showMapLegendDetails ? 'bg-stone-400' : 'bg-[#8C2F39]'}`}></span>
                      <span className={!showMapLegendDetails ? 'text-stone-400' : ''}>儒学官塾 (CONFUCIAN)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full border border-white shadow-3xs ${!showMapLegendDetails ? 'bg-stone-400' : 'bg-emerald-700'}`}></span>
                      <span className={!showMapLegendDetails ? 'text-stone-400' : ''}>玄门太虚 (TAOIST)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full border border-white shadow-3xs ${!showMapLegendDetails ? 'bg-stone-400' : 'bg-amber-600'}`}></span>
                      <span className={!showMapLegendDetails ? 'text-stone-400' : ''}>白莲法会 (BUDDHIST)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[7.5px] font-black text-red-800 uppercase tracking-wider mb-1">🔥 变乱风险等级</div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] border border-white shadow-3xs"></span>
                      <span>变乱红区 (Risk ≥ 65%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] border border-white shadow-3xs"></span>
                      <span>离心黄区 (35% - 64%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] border border-white shadow-3xs"></span>
                      <span>安定顺民绿区 (&lt; 35%)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions watermark banner */}
              <div className="absolute left-3.5 top-3.5 flex items-center gap-1 bg-white/75 p-1 rounded border border-[#1A1A1A]/10 text-[9px] font-mono tracking-tight text-[#1A1A1A]/70 shadow-xs">
                <MapPin className="w-3 h-3 text-[#8C2F39]" />
                点击图上据点解锁其传教皈依面板
              </div>
            </div>

            {/* Rebellion Intensity Trend Area Chart (Recharts) */}
            <div className="mt-3.5 bg-stone-50/70 p-3 rounded border border-[#1A1A1A]/10 flex flex-col shadow-xs" id="rebellion-intensity-chart-container">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-stone-200">
                <h4 className="text-[10.5px] font-mono text-stone-700 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-[#8C2F39] animate-pulse" />
                  义军暴动强度历史波谱 (Rebellion Intensity Last 10 Turns)
                </h4>
                <span className="text-[10px] font-mono text-stone-500">
                  暴民兵马总估: <strong className="text-[#8C2F39] font-black">{rebelForce} 徒</strong>
                </span>
              </div>

              <div className="h-28 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={history.slice(-10)}
                    margin={{ top: 5, right: 10, left: -25, bottom: -5 }}
                  >
                    <defs>
                      <linearGradient id="rebel-force-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8C2F39" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8C2F39" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" opacity={0.05} />
                    <XAxis 
                      dataKey="turn" 
                      tickFormatter={(v) => `T.${v}`}
                      stroke="#1A1A1A"
                      opacity={0.5}
                      tick={{ fontSize: 8, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="#1A1A1A"
                      opacity={0.5}
                      tick={{ fontSize: 8, fontFamily: 'monospace' }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as HistorySnap;
                          return (
                            <div className="bg-stone-900/95 text-stone-200 text-[10px] font-mono px-2 py-1.5 rounded shadow-lg border border-stone-800 leading-tight">
                              <div><strong>纪元 T.{data.turn}</strong></div>
                              <div className="text-[#EF4444] font-semibold mt-0.5">叛乱强度: {data.rebelForce ?? 0} 人</div>
                              {data.events && <div className="text-stone-400 text-[9px] mt-0.5 max-w-[150px] truncate">【{data.events}】</div>}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rebelForce"
                      stroke="#8C2F39"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#rebel-force-grad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detail summary of Active Region */}
            <div className="mt-3 bg-white/80 p-3 rounded border border-[#1A1A1A]/10 shadow-xs">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <h4 className="font-serif font-black text-sm text-[#1A1A1A] flex items-center gap-1.5">
                    {activeRegion.name} · {activeRegion.chineseName} 
                    <span className="text-[9px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                      本境丁口: {activeRegion.population}
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                    {activeRegion.desc}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider block">
                    当前霸权思想
                  </span>
                  <span className={`text-xs px-2 py-0.5 font-serif font-black mt-1 rounded ${
                    activeRegion.currentIdeology === 'CONFUCIAN'
                      ? 'bg-[#8C2F39]/10 text-[#8C2F39]'
                      : activeRegion.currentIdeology === 'TAOIST'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {activeRegion.currentIdeology === 'CONFUCIAN' && '📖 独尊儒术'}
                    {activeRegion.currentIdeology === 'TAOIST' && '☯️ 老庄无为'}
                    {activeRegion.currentIdeology === 'BUDDHIST_SECTARIAN' && '📿 白莲度世'}
                  </span>
                </div>
              </div>

              {/* Small detailed progress meters bar mapping influence percentages */}
              <div className="mt-3.5 space-y-1.5 pt-2 border-t border-[#1A1A1A]/10 border-dashed">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-semibold text-stone-500">本州教门皈依度 Influence Allocation:</span>
                  <span className="text-stone-300">合计 100%</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Confucian bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span>儒理法儒</span>
                      <span className="font-black text-[#8C2F39]">{activeRegion.influence.CONFUCIAN}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A1A]/5 rounded-sm overflow-hidden">
                      <div className="h-full bg-[#8C2F39]" style={{ width: `${activeRegion.influence.CONFUCIAN}%` }}></div>
                    </div>
                  </div>
                  {/* Taoist bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span>玄黄太虚</span>
                      <span className="font-black text-emerald-700">{activeRegion.influence.TAOIST}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A1A]/5 rounded-sm overflow-hidden">
                      <div className="h-full bg-emerald-700" style={{ width: `${activeRegion.influence.TAOIST}%` }}></div>
                    </div>
                  </div>
                  {/* Sectarian bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span>佛家白莲</span>
                      <span className="font-black text-amber-600">{activeRegion.influence.BUDDHIST_SECTARIAN}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A1A]/5 rounded-sm overflow-hidden">
                      <div className="h-full bg-amber-600" style={{ width: `${activeRegion.influence.BUDDHIST_SECTARIAN}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uprising & Rebellion Risk Analysis */}
              {(() => {
                const metrics = getRegionMetrics(activeRegion);
                const isRebelling = activeRegion.activeRebellion;
                return (
                  <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 border-dashed space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
                      <span>本境民变风险评估 (Peasant Rebellion Assessment)</span>
                      <span className={isRebelling ? 'text-red-600 animate-pulse font-extrabold' : metrics.riskDelta >= 65 ? 'text-amber-600 font-extrabold' : 'text-emerald-700'}>
                        {isRebelling ? '⚡ 暴动发生中 (Active Revolt)' : metrics.riskDelta >= 65 ? '⚠️ 极高暴动倾向' : '✓ 局势安定'}
                      </span>
                    </div>

                    {/* Simple data items mapping */}
                    <div className="grid grid-cols-4 gap-1.5 bg-stone-50/50 p-2 rounded border border-stone-100 text-center font-mono">
                      <div>
                        <div className="text-[9px] text-[#1A1A1A]/55">地方推演粮税</div>
                        <div className="text-xs font-bold text-stone-800">{metrics.localTax}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#1A1A1A]/55">推演饥荒指数</div>
                        <div className="text-xs font-bold text-amber-700">{metrics.localFamine}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#1A1A1A]/55">主官积存动荡</div>
                        <div className="text-xs font-bold text-[#8C2F39]">{activeRegion.unrest}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#1A1A1A]/55">教门大义修正</div>
                        <div className={`text-xs font-bold ${metrics.doctrineModifier > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-700'}`}>
                          {metrics.doctrineModifier > 0 ? `+${metrics.doctrineModifier}` : metrics.doctrineModifier}%
                        </div>
                      </div>
                    </div>

                    {/* Ideological Resistance Mechanics details */}
                    <div className="grid grid-cols-2 gap-2 bg-[#8C2F39]/5 p-2.5 rounded border border-[#8C2F39]/12 text-center font-mono text-[10px]">
                      <div className="border-r border-[#1A1A1A]/10 pr-2">
                        <div className="text-[8.5px] uppercase tracking-wider text-[#8C2F39] font-bold">思想阻受因子 Ideo. Resistance</div>
                        <div className="text-xs font-black text-rose-800 mt-1">{metrics.ideologicalResistance}%</div>
                        <div className="text-[7.5px] text-stone-500 mt-0.5 leading-tight">本位学说与官方儒礼之偏差契合度</div>
                      </div>
                      <div className="pl-2">
                        <div className="text-[8.5px] uppercase tracking-wider text-amber-800 font-bold">动荡流变流速 Unrest Speed</div>
                        <div className="text-xs font-black text-amber-700 mt-1">+{metrics.escalationRate}% / 纪元</div>
                        <div className="text-[7.5px] text-stone-500 mt-0.5 leading-tight">每一纪元安定率自增蔓延速度</div>
                      </div>
                    </div>

                    {/* Small helpful description text showing doctrine modifier details */}
                    <p className="text-[9.5px] font-mono text-stone-500 italic leading-snug">
                      {metrics.doctrineDesc ? `当前思想主轴加成：${metrics.doctrineDesc}` : '当前无思想在野冲突修正'}。儒礼与道风长效静镇民心，而白莲教门在严苛征税下 (地方税+荒&gt;80) 会异化反噬官府，强力催化民变！
                    </p>

                    {/* Threat indicator risk bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold text-[#1A1A1A]/80">
                        <span>本境变乱兆候: {metrics.riskDelta}%</span>
                        <span>暴发临界值: 65%</span>
                      </div>
                      <div className="h-2 bg-[#1A1A1A]/5 rounded-xs overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 left-[65%] w-[1.5px] bg-[#EF4444] z-10 opacity-70"></div>
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isRebelling 
                              ? 'bg-red-600 animate-pulse' 
                              : metrics.riskDelta >= 65 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-600'
                          }`} 
                          style={{ width: `${metrics.riskDelta}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Local Suppression Command Panel if isRebelling is true */}
                    {isRebelling ? (
                      <div className="bg-red-50 border border-red-200 rounded p-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 animate-pulse">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-serif font-black text-red-800 flex items-center gap-1">
                            <span>🚨 乱起萧墙：暴民揭竿抗税，扼断州路！</span>
                          </p>
                          <p className="text-[9px] text-red-700/80 font-mono">
                            极需派遣行营镇防军，耗用行粮兵饰荡除该区顽敌！
                          </p>
                        </div>
                        <button
                          id={`suppress-region-btn-${activeRegion.id}`}
                          onClick={() => handleSuppressRegion(activeRegion.id)}
                          className="w-full md:w-auto shrink-0 bg-red-800 hover:bg-red-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded shadow-xs active:translate-y-0.5 transition-all text-center"
                        >
                          ⚔️ 派羽林兵平乱 (-4500 贯)
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/40 border border-emerald-600/10 rounded p-2 text-center">
                        <p className="text-[9.5px] font-mono text-emerald-800">
                          {metrics.riskDelta >= 65 
                            ? '⚠️ 局势危急！速减兵差丁役以蠲免税赋，或速召遣大儒高道宣讲扭转此偏执信仰！' 
                            : '✓ 全境清朗，百家并流。当前人心思静，无乱党空间。'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right column (Missionary convert engine): 5 Units */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2 mb-3">
                <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-black uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-[#8C2F39]" />
                  传教司皈依策画 (Missionary Event System)
                </h3>
              </div>

              <p className="text-[11px] text-[#1A1A1A]/60 leading-relaxed font-mono">
                此系统可强制派遣官方使团、炼丹黄冠或密教教主至所选地区进行“法统争论”，直接削弱异端思想，改写本境天命风水。
              </p>

              {/* Missionary action list (Interactive conversion buttons with price tags) */}
              <div className="mt-4 space-y-3">
                
                {/* 1. Send Confucian scholars */}
                <div className="bg-white/70 p-2.5 rounded border border-[#8C2F39]/15 hover:border-[#8C2F39]/35 transition shadow-xs flex justify-between items-center">
                  <div className="space-y-0.5 flex-1 pr-3">
                    <div className="font-serif font-black text-xs text-[#8C2F39] flex items-center gap-1">
                      礼部大祭酒行宣大礼
                    </div>
                    <div className="text-[9px] text-[#1A1A1A]/55 font-mono leading-tight">
                      大肆兴学修造白鹿书院，高悬明礼祭祀，以圣人法度压倒巫术。
                    </div>
                  </div>
                  <button
                    id="dispatch-confucian-btn"
                    onClick={() => handleMissionaryDispatch('CONFUCIAN')}
                    className="shrink-0 bg-[#8C2F39] hover:bg-[#8C2F39]/90 text-[#F5F2ED] font-black text-[9px] font-mono px-2.5 py-2.5 rounded shadow-sm text-center leading-none"
                  >
                    <div>发遣宣大</div>
                    <div className="mt-0.5 text-[8px] font-normal opacity-85">耗 1200银</div>
                  </button>
                </div>

                {/* 2. Send Taoist alchemists */}
                <div className="bg-white/70 p-2.5 rounded border border-emerald-900/15 hover:border-emerald-600/35 transition shadow-xs flex justify-between items-center">
                  <div className="space-y-0.5 flex-1 pr-3">
                    <div className="font-serif font-black text-xs text-emerald-800 flex items-center gap-1">
                      龙虎山天师法水斋会
                    </div>
                    <div className="text-[9px] text-[#1A1A1A]/55 font-mono leading-tight">
                      真武法坛降妖解病，广施药石。缓和大商市井负重，民心舒休。
                    </div>
                  </div>
                  <button
                    id="dispatch-taoist-btn"
                    onClick={() => handleMissionaryDispatch('TAOIST')}
                    className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-[#F5F2ED] font-black text-[9px] font-mono px-2.5 py-2.5 rounded shadow-sm text-center leading-none"
                  >
                    <div>设斋醮</div>
                    <div className="mt-0.5 text-[8px] font-normal opacity-85">耗 900银</div>
                  </button>
                </div>

                {/* 3. Send Buddhist sect head */}
                <div className="bg-white/70 p-2.5 rounded border border-amber-500/15 hover:border-amber-500/40 transition shadow-xs flex justify-between items-center">
                  <div className="space-y-0.5 flex-1 pr-3">
                    <div className="font-serif font-black text-xs text-amber-700 flex items-center gap-1">
                      白莲大教首授秘密度牒
                    </div>
                    <div className="text-[9px] text-[#1A1A1A]/55 font-mono leading-tight">
                      于流离难民间私行戒度，派发米面福田。压减流寇，但引狼入室。
                    </div>
                  </div>
                  <button
                    id="dispatch-buddhist-btn"
                    onClick={() => handleMissionaryDispatch('BUDDHIST_SECTARIAN')}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-[#F5F2ED] font-black text-[9px] font-mono px-2.5 py-2.5 rounded shadow-sm text-center leading-none"
                  >
                    <div>密授度法</div>
                    <div className="mt-0.5 text-[8px] font-normal opacity-85">耗 700银</div>
                  </button>
                </div>

              </div>
            </div>

            {/* Total National Influence status table */}
            <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 bg-stone-50 p-2 rounded">
              <span className="text-[9px] font-mono text-zinc-500 font-bold block mb-1">
                中朝社政三教天下比率 National Dominance Statistics:
              </span>
              <div className="grid grid-cols-3 gap-1 grid-flow-row text-[10px] font-mono font-bold text-center">
                <div className="bg-white p-1 rounded shadow-xs border border-[#8C2F39]/10">
                  <span className="text-[#8C2F39]">📖 儒法正礼</span>
                  <div className="text-sm font-black mt-0.5">{nationalStats.CONFUCIAN}%</div>
                </div>
                <div className="bg-white p-1 rounded shadow-xs border border-emerald-800/10">
                  <span className="text-emerald-700">☯️ 老无无为</span>
                  <div className="text-sm font-black mt-0.5">{nationalStats.TAOIST}%</div>
                </div>
                <div className="bg-white p-1 rounded shadow-xs border border-amber-600/10">
                  <span className="text-amber-600">📿 白莲救世</span>
                  <div className="text-sm font-black mt-0.5">{nationalStats.BUDDHIST_SECTARIAN}%</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 3: Dynamic Charts (Influence Curve Over Time) & Statecraft Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left Side: Recharts/D3-Style Cultural Influence Over Time Graphic */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-white/55 p-4 rounded border border-[#1A1A1A]/15 shadow-xs flex-1">
            <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2 mb-3">
              <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-[#8C2F39]" />
                三教地理势力消长波谱图 (D3 Cultural Dominance Over Time)
              </h3>
              
              {/* Reset History action for testing */}
              <span className="text-[9px] text-[#1A1A1A]/50 italic block font-mono">
                折线通过布道/施策动态累进化
              </span>
            </div>

            {/* Mathematically Generated Vector Graphics depicting Rise & Fall over simulated ticks */}
            <div className="relative bg-white/70 p-2 rounded border border-[#1A1A1A]/10 shadow-inner">
              
              {/* Interactive Tooltip Overlay */}
              {hoveredSnap ? (
                <div className="absolute top-2 left-[12%] right-[12%] bg-stone-900/90 text-stone-200 text-[10px] font-mono leading-tight px-3 py-1.5 rounded shadow-lg z-20 flex justify-between items-center transition-all">
                  <span>
                    <strong>纪元 {hoveredSnap.turn}</strong>: 儒({hoveredSnap.Confucian}%) 道({hoveredSnap.Taoist}%) 佛({hoveredSnap.Buddhist}%)
                  </span>
                  <span className="text-amber-400 font-serif text-[9px] font-bold">
                    【{hoveredSnap.events}】
                  </span>
                </div>
              ) : (
                <div className="absolute top-2 left-[12%] right-[12%] text-center text-[#1A1A1A]/40 text-[9px] font-mono">
                  💡 将光标停留在图谱中的关键圆点上以读取历史变动事件
                </div>
              )}

              {/* Chart Body */}
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((yVal, idx) => {
                  const usableHeight = chartHeight - paddingTop - paddingBottom;
                  const y = paddingTop + usableHeight - (yVal / 100) * usableHeight;
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={chartWidth - paddingRight} 
                        y2={y} 
                        stroke="#1A1A1A" 
                        strokeWidth="0.5" 
                        className="opacity-[0.08]" 
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={y + 3} 
                        className="text-[8px] font-mono opacity-50" 
                        textAnchor="end"
                      >
                        {yVal}%
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Step Markers based on Turn counts */}
                {history.map((h, idx) => {
                  const usableWidth = chartWidth - paddingLeft - paddingRight;
                  const ratioX = history.length > 1 ? idx / (history.length - 1) : 0;
                  const x = paddingLeft + ratioX * usableWidth;
                  return (
                    <g key={idx}>
                      <line 
                        x1={x} 
                        y1={paddingTop} 
                        x2={x} 
                        y2={chartHeight - paddingBottom} 
                        stroke="#1A1A1A" 
                        strokeWidth="0.5" 
                        className="opacity-[0.06] stroke-dasharray-[2]"
                      />
                      <text 
                        x={x} 
                        y={chartHeight - paddingBottom + 12} 
                        className="text-[8px] font-mono opacity-60 font-bold" 
                        textAnchor="middle"
                      >
                        T.{h.turn}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Shading under Confucian */}
                <defs>
                  <linearGradient id="conf-grad" x1="0" y1="y" x2="0" y2="1">
                    <stop offset="30%" stopColor="#8C2F39" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#8C2F39" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="tao-grad" x1="0" y1="y" x2="0" y2="1">
                    <stop offset="30%" stopColor="#047857" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Fill paths for gorgeous traditional aesthetics */}
                {history.length > 1 && (
                  <>
                    <path d={generateAreaPath(confCoords)} fill="url(#conf-grad)" />
                    <path d={generateAreaPath(taoCoords)} fill="url(#tao-grad)" />
                  </>
                )}

                {/* Traced Lines */}
                {history.length > 1 && (
                  <>
                    {/* Line 1: Confucian (Red) */}
                    <path 
                      d={generateLinePath(confCoords)} 
                      fill="none" 
                      stroke="#8C2F39" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      className="opacity-90"
                    />
                    {/* Line 2: Taoist (Green) */}
                    <path 
                      d={generateLinePath(taoCoords)} 
                      fill="none" 
                      stroke="#047857" 
                      strokeWidth="1.75" 
                      strokeLinecap="round" 
                      className="opacity-80"
                    />
                    {/* Line 3: Buddhist (Amber) */}
                    <path 
                      d={generateLinePath(budCoords)} 
                      fill="none" 
                      stroke="#D97706" 
                      strokeWidth="1.75" 
                      strokeLinecap="round" 
                      className="opacity-85"
                    />
                  </>
                )}

                {/* Interactive Dot Triggers on graph curves node positions */}
                {history.map((h, i) => {
                  const usableWidth = chartWidth - paddingLeft - paddingRight;
                  const usableHeight = chartHeight - paddingTop - paddingBottom;
                  const ratioX = history.length > 1 ? i / (history.length - 1) : 0;
                  const x = paddingLeft + ratioX * usableWidth;

                  const yConf = paddingTop + usableHeight - (h.Confucian / 100) * usableHeight;
                  const yTao = paddingTop + usableHeight - (h.Taoist / 100) * usableHeight;
                  const yBud = paddingTop + usableHeight - (h.Buddhist / 100) * usableHeight;

                  return (
                    <g 
                      key={i} 
                      className="cursor-pointer outline-none focus-visible:outline-none"
                      tabIndex={0}
                      role="button"
                      aria-label={`第 ${h.turn} 纪：儒家思想 ${h.Confucian}%，道教思想 ${h.Taoist}%，佛门白莲 ${h.Buddhist}%。历史纪实：${h.events}`}
                      onMouseEnter={() => setHoveredSnap(h)}
                      onMouseLeave={() => setHoveredSnap(null)}
                      onFocus={() => setHoveredSnap(h)}
                      onBlur={() => setHoveredSnap(null)}
                    >
                      {/* Confucian Dot Circle */}
                      <circle cx={x} cy={yConf} r="3.5" fill="#8C2F39" className="stroke-white stroke-1 hover:r-5 transition-all" />
                      {/* Taoist Dot Circle */}
                      <circle cx={x} cy={yTao} r="3" fill="#047857" className="stroke-white stroke-1 hover:r-5 transition-all" />
                      {/* Buddhist Dot Circle */}
                      <circle cx={x} cy={yBud} r="3" fill="#D97706" className="stroke-white stroke-1 hover:r-5 transition-all" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Custom line legend info bar */}
            <div className="flex gap-4 items-center justify-center mt-3 text-[9px] font-mono text-[#1A1A1A]/70 select-none">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#8C2F39] inline-block"></span> 
                <strong>儒理法度 (Confucianism)</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-700 inline-block"></span> 
                <strong>老庄安息 (Taoism)</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-600 inline-block"></span> 
                <strong>白莲释渡 (Buddhism Sect)</strong>
              </span>
            </div>

          </div>
        </div>

        {/* Right Side: Core Imperial Controls & Disaster Knobs */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 shadow-xs space-y-3">
            
            <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
              <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4 text-[#8C2F39]" />
                执政社稷枢要 (Imperial Knobs)
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">儒理制民 vs 苛征军饷</span>
            </div>

            {/* Parameter adjusters block */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] text-[#1A1A1A]/70 font-mono block font-bold">天下课税负率 T: {taxRate}%</label>
                  {taxRate > 45 && <span className="text-[8px] text-[#8C2F39] font-black animate-pulse">⚠️ 民穷财尽</span>}
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full h-1 bg-[#1A1A1A]/10 rounded-lg appearance-none cursor-pointer accent-[#8C2F39]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] text-[#1A1A1A]/70 font-mono block font-bold">荒歉饥荒指数 F: {famineLvl}%</label>
                  {famineLvl > 65 && <span className="text-[8px] text-[#8C2F39] font-black animate-pulse">🌾 江淮赤地</span>}
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={famineLvl}
                  onChange={(e) => setFamineLvl(Number(e.target.value))}
                  className="w-full h-1 bg-[#1A1A1A]/10 rounded-lg appearance-none cursor-pointer accent-[#8C2F39]"
                />
              </div>
            </div>

            {/* Structural actions board */}
            <div className="pt-2 border-t border-[#1A1A1A]/10">
              <div className="text-[9px] font-mono font-bold text-[#1A1A1A]/60 uppercase mb-2">天子御前执案 Act Commands:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="action-btn-relief-2"
                  onClick={handleRelief}
                  className="bg-white hover:bg-neutral-50 text-stone-800 font-bold border border-[#1A1A1A]/15 text-[10px] py-2 px-1 rounded shadow-xs flex flex-col items-center justify-center gap-1 text-center"
                >
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>开仓赈灾</span>
                  <span className="text-[8px] font-mono opacity-60">费 6000银</span>
                </button>

                <button
                  id="action-btn-tax-2"
                  onClick={handleLevyTax}
                  className="bg-[#8C2F39]/5 text-[#8C2F39] font-black border border-[#8C2F39]/20 text-[10px] py-1.5 px-1 rounded hover:bg-[#8C2F39]/10 shadow-xs flex flex-col items-center justify-center gap-1 text-center transition"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>榷商加赋</span>
                  <span className="text-[8px] font-mono opacity-80">+15000银</span>
                </button>

                <button
                  id="action-btn-disaster-2"
                  onClick={handleTriggerFamine}
                  className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/95 text-white font-mono text-[10px] py-1.5 px-1 rounded shadow-xs flex flex-col items-center justify-center gap-1 text-center"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  <span>引发决口</span>
                  <span className="text-[8px] opacity-75">天灾灾荒</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 4: Active Rebellion Battle Theatre & System Equations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side (Uprising active box): 6 Units */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2 mb-2">
                <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Skull className="w-4 h-4 text-[#8C2F39]" />
                  皇统安定指数与流寇暴乱宿命 (Operational Theatre)
                </h3>
              </div>

              {/* Status parameters grids */}
              <div className="grid grid-cols-4 gap-2 text-xs font-mono mb-3">
                <div className="bg-white/60 p-2 rounded border border-[#1A1A1A]/10 shadow-xs">
                  <span className="text-[#1A1A1A]/50 block text-[8px] font-bold uppercase tracking-wider">
                    朝廷内库银
                  </span>
                  <span className="text-xs font-bold text-[#5A5A40] block mt-0.5">{stateCoffers} 钱</span>
                </div>
                <div className="bg-white/60 p-2 rounded border border-[#1A1A1A]/10 shadow-xs">
                  <span className="text-[#1A1A1A]/50 block text-[8px] font-bold uppercase tracking-wider">
                    大魏安定率
                  </span>
                  <span className={`text-xs font-black block mt-0.5 ${stabilityLvl < 35 ? 'text-[#8C2F39] animate-pulse' : 'text-emerald-700'}`}>
                    {stabilityLvl}%
                  </span>
                </div>
                <div className="bg-white/60 p-2 rounded border border-[#1A1A1A]/10 shadow-xs">
                  <span className="text-[#1A1A1A]/50 block text-[8px] font-bold uppercase tracking-wider">
                    流民聚众比
                  </span>
                  <span className="text-xs font-bold text-[#1A1A1A] block mt-0.5">{refugeesPercent}% 丁口</span>
                </div>
                <div className="bg-white/60 p-2 rounded border border-[#1A1A1A]/10 shadow-xs">
                  <span className="text-[#1A1A1A]/50 block text-[8px] font-bold uppercase tracking-wider">
                    白莲压制密率 S
                  </span>
                  <span className="text-xs font-bold text-[#8C2F39] block mt-0.5">
                    {(religiousSuppression * 100).toFixed(0)}% 抑制
                  </span>
                </div>
              </div>

              {/* Rebellion Status Active Board */}
              <div className={`p-3 rounded border text-xs leading-relaxed transition ${
                isUprisingActive 
                  ? 'bg-rose-500/5 border-rose-500/20' 
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono font-bold text-[9px] uppercase tracking-widest block text-[#1A1A1A]/60">
                    义兵大部在账 (Rebellion Force Status)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    isUprisingActive ? 'bg-[#8C2F39] text-[#F5F2ED]' : 'bg-[#5A5A40] text-[#F5F2ED]'
                  }`}>
                    {isUprisingActive ? '🚨 暴民肆虐中' : '✓ 四境靖安'}
                  </span>
                </div>

                {isUprisingActive ? (
                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-center bg-white/70 p-2 rounded border border-rose-100">
                      <span>叛贼游骑：<strong className="text-[#8C2F39] font-black">{rebelForce} 徒</strong></span>
                      <button
                        id="suppress-action-btn"
                        onClick={handleSuppress}
                        className="bg-[#5A5A40] hover:bg-[#5A5A40]/90 text-white font-bold px-2.5 py-1 text-[10px] rounded flex items-center gap-1 shadow-sm transition"
                      >
                        <Swords className="w-3 h-3 text-[#F5F2ED]" />
                        派遣偏师清剿
                      </button>
                    </div>

                    {/* Actor Decision Trees */}
                    <div className="bg-white/75 p-2 rounded border border-amber-200 text-[10px] space-y-1.5">
                      <span className="font-bold text-[#8C2F39] block">🕹️ 代入起义军视点天命抉择:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleRebelPolicy('LOOT')}
                          disabled={hasLooted}
                          className="bg-red-50 hover:bg-red-100 text-[#8C2F39] border border-red-200 font-bold p-1 rounded text-[9px] disabled:opacity-40 transition-all text-center leading-normal"
                        >
                          🔥 纵兵大劫 plunder
                          <span className="block text-[8px] font-normal opacity-75">+2万钱 / 增贼众</span>
                        </button>
                        <button
                          onClick={() => handleRebelPolicy('REGULATE')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold p-1 rounded text-[9px] transition-all text-center leading-normal"
                        >
                          🌾 赈恤收心 regulate
                          <span className="block text-[8px] font-normal opacity-75">免岁租 / 聚义理法统</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#1A1A1A]/70 font-serif leading-relaxed text-[11px]">
                    海内平靖。若地方课税过高（课税 &gt; 45%）叠合天灾旱虫侵吞，且朝廷吝于赈赏，自耕农将沦为难民大批造命。
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Log Entries Tracking: 5 Units */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-1.5 mb-2">
                <h4 className="text-[10px] font-mono text-[#1A1A1A]/70 tracking-wider font-bold uppercase">
                  中朝疆舆皈依与反民起居注 (Logs Tracker)
                </h4>
              </div>
              <div className="space-y-1 my-1 max-h-[190px] overflow-y-auto pr-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-[10px] font-mono border-l-2 pl-2 py-0.5 flex justify-between gap-2.5 ${
                      log.type === 'danger'
                        ? 'border-[#8C2F39] text-[#8C2F39]'
                        : log.type === 'success'
                        ? 'border-emerald-700 text-emerald-800'
                        : log.type === 'warn'
                        ? 'border-amber-600 text-amber-900'
                        : 'border-zinc-300 text-stone-700'
                    }`}
                  >
                    <span>{log.text}</span>
                    <span className="text-[8px] opacity-40 shrink-0 select-none">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
