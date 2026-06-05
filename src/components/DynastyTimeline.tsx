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
  BookOpen,
  Clock,
  Sliders,
  GitBranch,
  RefreshCw,
  Search,
  Check,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { 
  db, 
  auth,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  getDocs,
  serverTimestamp
} from '../firebase';

export interface DynastyPoint {
  id: string;
  year: number;               // Negative number for BC (e.g., -230 = 230 BC)
  mandate: number;            // 0 - 100
  stability: number;          // 0 - 100
  coffers: number;            // Treasury
  title: string;
  desc: string;
  type: 'historical' | 'player_decision';
  impact: string;
  branch: 'baseline' | 'qin_forever' | 'republic' | 'feudal_dukedoms' | 'custom';
  branchLabel?: string;       // Custom name for worldline
  creatorName?: string;
  timestamp?: number;
}

// 230 BC to 202 BC Primordial Chinese History seed data
const BASELINE_HISTORICAL_POINTS: DynastyPoint[] = [
  {
    id: 'base-230',
    year: -230,
    mandate: 70,
    stability: 75,
    coffers: 50000,
    title: '秦灭韩：韩王纳地纳印',
    desc: '韩相韩非遭谗遇害，秦内史腾率十万雄师直下新郑。韩王安奉献图籍印玺衔璧请降，韩国遂灭，改置为颖川郡。大一统之战序幕揭开！',
    type: 'historical',
    impact: '太初基准设立。秦初吞韩，关东诸侯人心惶惶。',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  },
  {
    id: 'base-228',
    year: -228,
    mandate: 74,
    stability: 78,
    coffers: 58000,
    title: '邯郸破：李牧遇害赵国沦亡',
    desc: '秦大将王翦行反间计，赵王迁偏听谗言处决军神李牧。王翦破邯郸虏赵王，关东长城倾塌，赵遂亡。',
    type: 'historical',
    impact: '秦国库扩充 +8000 金镒，朝纲威望再攀。',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  },
  {
    id: 'base-225',
    year: -225,
    mandate: 72,
    stability: 81,
    coffers: 66000,
    title: '水灌大梁：魏王假囚降',
    desc: '秦将王贲引黄河、大沟之水狂灌大梁城，大梁倾圮。魏国君臣乞降，百岁中原霸主魏国覆亡。',
    type: 'historical',
    impact: '国中稳定度 +3%。大司农开支治水银钱，虏获魏库大款。',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  },
  {
    id: 'base-223',
    year: -223,
    mandate: 70,
    stability: 84,
    coffers: 82000,
    title: '王翦破楚：捕虏楚王负刍',
    desc: '王翦以六十万大军深沟高垒，终大败楚将项燕、破寿春。江淮广袤疆域归秦所有。',
    type: 'historical',
    impact: '捕斩敌酋。天命稳定大幅回升，秦王横扫江南。',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  },
  {
    id: 'base-221',
    year: -221,
    mandate: 82,
    stability: 88,
    coffers: 100000,
    title: '六王毕四海一：始皇帝天命大统',
    desc: '齐王建不战请御降。六国悉平，秦王嬴政合四海百越，自立为首任始皇帝。废分封、行郡县、书同文、车同轨！',
    type: 'historical',
    impact: '国势天命大成极点！皇权稳定度飙升 +15%，国家金储备充足。',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  },
  {
    id: 'base-210',
    year: -210,
    mandate: 45,
    stability: 42,
    coffers: 68000,
    title: '始皇沙丘暴薨：赵高矯诏夺嫡',
    desc: '始皇巡狩突兀薨于沙丘行宫。中常侍赵高勾结李斯，矯诏逼迫太子扶苏、名将蒙恬饮鸩自鸩，篡立胡亥为二世皇帝，秦朝危机引爆。',
    type: 'historical',
    impact: '天心散乱，天命暴滑 -37%，朝廷政局稳定值烈崩 46%！',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  },
  {
    id: 'base-209',
    year: -209,
    mandate: 22,
    stability: 18,
    coffers: 45000,
    title: '大泽揭露：斩木为兵百家揭竿',
    desc: '阳城戍卒陈胜、吴广于雨路失期，处死无生，断而大呼「王侯将相宁有种乎！」关东群雄风起雾散，诸子百家复辟，秦朝天下失控。',
    type: 'historical',
    impact: '天下丧钟敲响。农民暴动狂发。秦社稷面临倾覆极险！',
    branch: 'baseline',
    branchLabel: '中华正史始祖轨'
  }
];

export default function DynastyTimeline({ 
  dynastyStats,
  onSyncState 
}: { 
  dynastyStats?: { mandate: number; stability: number; coffers: number };
  onSyncState?: (stats: { mandate: number; stability: number; coffers: number }) => void 
}) {
  // Available speeds (Real time seconds corresponding to 1 Historical Year)
  const SPEEDS = [
    { label: '现实一秒钟 = 历史一年 (演示极限)', seconds: 1, text: '1s = 1 Year' },
    { label: '现实五秒钟 = 历史一年 (测试倍速)', seconds: 5, text: '5s = 1 Year' },
    { label: '现实一分钟 = 历史一年 (极高宿命)', seconds: 60, text: '1m = 1 Year' },
    { label: '现实一小时 = 历史一年 (史诗联机)', seconds: 3600, text: '1h = 1 Year' },
    { label: '现实一昼夜 = 历史一年 (终极长流)', seconds: 86400, text: '1d = 1 Year' }
  ];

  // React State Control
  const [selectedSpeed, setSelectedSpeed] = useState(() => {
    try {
      const saved = localStorage.getItem('dynasty_chronometer_speed_seconds');
      if (saved) {
        const found = [
          { label: '现实一秒钟 = 历史一年 (演示极限)', seconds: 1, text: '1s = 1 Year' },
          { label: '现实五秒钟 = 历史一年 (测试倍速)', seconds: 5, text: '5s = 1 Year' },
          { label: '现实一分钟 = 历史一年 (极高宿命)', seconds: 60, text: '1m = 1 Year' },
          { label: '现实一小时 = 历史一年 (史诗联机)', seconds: 3600, text: '1h = 1 Year' },
          { label: '现实一昼夜 = 历史一年 (终极长流)', seconds: 86400, text: '1d = 1 Year' }
        ].find(s => s.seconds === Number(saved));
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return { label: '现实五秒钟 = 历史一年 (测试倍速)', seconds: 5, text: '5秒 = 1载' };
  }); // Default 5s = 1 Year for demonstration
  const [currentBCEYear, setCurrentBCEYear] = useState(-230); // Dynamic shifting year
  const [realSecondsElapsed, setRealSecondsElapsed] = useState(0);
  const [totalSimulatedYears, setTotalSimulatedYears] = useState(0);
  const [activeBranch, setActiveBranch] = useState<'all' | 'baseline' | 'qin_forever' | 'republic' | 'feudal_dukedoms' | 'custom'>('all');

  // Sync speed with external localStorage updates
  useEffect(() => {
    const handleCheckSpeed = () => {
      try {
        const saved = localStorage.getItem('dynasty_chronometer_speed_seconds');
        if (saved) {
          const val = Number(saved);
          if (selectedSpeed.seconds !== val) {
            const found = SPEEDS.find(s => s.seconds === val);
            if (found) {
              setSelectedSpeed(found);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    handleCheckSpeed();
    const interval = setInterval(handleCheckSpeed, 1000);
    return () => clearInterval(interval);
  }, [selectedSpeed, SPEEDS]);
  
  // Dynamic Timeline Array storing both Baseline and Player branching choices
  const [timelinePoints, setTimelinePoints] = useState<DynastyPoint[]>(BASELINE_HISTORICAL_POINTS);
  const [selectedPoint, setSelectedPoint] = useState<DynastyPoint | null>(BASELINE_HISTORICAL_POINTS[0]);
  const [activeDecisionLog, setActiveDecisionLog] = useState<string>('📜 大禔编年纪事始动：太初公元前 230 年。请根据多边局势颁御旨，扰动历史轴线！');

  // Input States for Player custom "Historical Mutation" proposals
  const [proposalYear, setProposalYear] = useState<number>(-220);
  const [proposalTitle, setProposalTitle] = useState<string>('咸阳重臣谋废连坐');
  const [proposalDesc, setProposalDesc] = useState<string>('我部客卿大将联名上奏，请求罢黜秦法中的连坐什伍法，废止劳役苦寒，改行西域轻徭薄赋大政，博得边远军户欢呼。');
  const [proposalBranch, setProposalBranch] = useState<'qin_forever' | 'republic' | 'feudal_dukedoms' | 'custom'>('custom');
  const [proposalMandate, setProposalMandate] = useState<number>(15);
  const [proposalStability, setProposalStability] = useState<number>(10);
  const [proposalCoffers, setProposalCoffers] = useState<number>(-12000);
  const [proposalBranchName, setProposalBranchName] = useState<string>('天下仁政轨');
  
  // D3 Canvas References
  const d3SvgRef = useRef<SVGSVGElement | null>(null);
  const d3ContainerRef = useRef<HTMLDivElement | null>(null);

  // Firestore & local persistence keys
  const [roomId, setRoomId] = useState<string>('');

  // Auto detect active room ID for multiplayer timeline branching synchronization
  useEffect(() => {
    const checkRoom = () => {
      // Find active room in localStorage or try to read state
      try {
        const lastRoom = localStorage.getItem('dynasty_last_room_id');
        if (lastRoom) setRoomId(lastRoom);
      } catch (e) {
        console.error(e);
      }
    };
    checkRoom();
    const interval = setInterval(checkRoom, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save/Load chronology state dynamically
  useEffect(() => {
    const key = roomId ? `branched-timeline-room-${roomId}` : 'branched-timeline-offline';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimelinePoints(parsed);
        }
      } catch (e) {
        console.error("Local recovery of timeline failed, fallback default", e);
      }
    }
  }, [roomId]);

  const saveTimelineLocal = (updated: DynastyPoint[]) => {
    const key = roomId ? `branched-timeline-room-${roomId}` : 'branched-timeline-offline';
    localStorage.setItem(key, JSON.stringify(updated));
  };

  // Listen to multiplayer timeline update logs
  useEffect(() => {
    if (!roomId) return;
    const branchesRef = collection(db, 'rooms', roomId, 'timelineBranches');
    
    const unsubscribe = onSnapshot(branchesRef, (snapshot) => {
      if (snapshot.empty) return;
      const parsedFromDb: DynastyPoint[] = [];
      snapshot.forEach(doc => {
        parsedFromDb.push({ id: doc.id, ...doc.data() } as DynastyPoint);
      });

      // Merge with baseline points to construct the total tree
      setTimelinePoints(prev => {
        const defaultIds = new Set(BASELINE_HISTORICAL_POINTS.map(p => p.id));
        const customPoints = parsedFromDb.filter(p => !defaultIds.has(p.id));
        
        // Remove duplicate custom points if updated
        const merged = [
          ...BASELINE_HISTORICAL_POINTS,
          ...customPoints.filter(cp => !BASELINE_HISTORICAL_POINTS.some(bp => bp.id === cp.id))
        ];
        // Sort chronology downwards from earliest (-230 BC) to latest (-202 BC or later)
        merged.sort((a,b) => a.year - b.year);
        return merged;
      });
    }, (error) => {
      console.error("Firestore timeline listen error:", error);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Synchronize dynamic ticking chronometer based on speed configuration (1 real day = 1 historical year, etc.)
  useEffect(() => {
    // We increment real second by second
    const interval = setInterval(() => {
      setRealSecondsElapsed(prev => {
        const nextSecs = prev + 1;
        // Count simulated years passed
        if (nextSecs >= selectedSpeed.seconds) {
          setCurrentBCEYear(currentYr => {
            // Unification war proceeds: years crawl forward towards BC 202 (represented downwards in BCE till zero/positive)
            const nextYr = currentYr + 1; // e.g. -230 -> -229 -> -228
            setTotalSimulatedYears(y => y + 1);
            return nextYr > -180 ? -230 : nextYr; // limit bounds
          });
          return 0; // Reset seconds countdown
        }
        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSpeed]);

  // Monitor annual changes and trigger automatic, context-driven random historical events
  useEffect(() => {
    // We do not trigger events on initial load or if the year is the default base year -230
    if (currentBCEYear === -230) return;

    // 50% probability roll of triggering a random historical event during a year update
    if (Math.random() > 0.5) return;

    const triggerEvent = async () => {
      try {
        const sortedPoints = [...timelinePoints].sort((a,b) => a.year - b.year);
        // Extract stats from last relative node representing past timeline states
        const lastRelativeNode = sortedPoints.filter(p => p.year <= currentBCEYear).pop() || sortedPoints[0];

        const response = await fetch('/api/chrono/trigger-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            year: currentBCEYear,
            branch: lastRelativeNode?.branchLabel || '中华正史始祖轨',
            stability: lastRelativeNode?.stability || 75,
            mandate: lastRelativeNode?.mandate || 70
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch random event from backend service');
        }

        const data = await response.json();

        // Incorporate event node into history timeline tree
        const newEventId = `rand-${Date.now()}`;
        const newMandate = Math.min(100, Math.max(0, (lastRelativeNode?.mandate || 75) + (data.mandateImpact || 0)));
        const newStability = Math.min(100, Math.max(0, (lastRelativeNode?.stability || 70) + (data.stabilityImpact || 0)));
        
        // Treasury shift based on event impact
        const deltaCoffers = (data.stabilityImpact || 0) * 1500;
        const newCoffers = Math.max(1000, (lastRelativeNode?.coffers || 50000) + deltaCoffers);

        const newEventPoint: DynastyPoint = {
          id: newEventId,
          year: currentBCEYear,
          mandate: newMandate,
          stability: newStability,
          coffers: newCoffers,
          title: `🌪️ 【天演】${data.title}`,
          desc: data.desc,
          type: 'player_decision', // Gold interactive node to show clearly on D3 tree
          impact: `天命影响力: ${data.mandateImpact >= 0 ? '+' : ''}${data.mandateImpact}%, 安定度影响力: ${data.stabilityImpact >= 0 ? '+' : ''}${data.stabilityImpact}%, 帑藏: ${deltaCoffers >= 0 ? '+' : ''}${deltaCoffers.toLocaleString()}金镒`,
          branch: lastRelativeNode?.branch || 'custom',
          branchLabel: lastRelativeNode?.branchLabel || '自定义历史天演轨',
          creatorName: '天机推演玄机仪',
          timestamp: Date.now()
        };

        // Prepend systemLog to queue for homepage top-ticker display
        try {
          const currentQueue = JSON.parse(localStorage.getItem('dynasty_chrono_ticker_queue') || '[]');
          currentQueue.push(data.systemLog);
          localStorage.setItem('dynasty_chrono_ticker_queue', JSON.stringify(currentQueue));
        } catch (e) {
          console.error(e);
        }

        // Play warning horn to audibly notify players of time event
        try {
          soundManager.playHorn();
        } catch (sErr) {}

        // Add to timeline tracking states
        setTimelinePoints(prev => {
          const updated = [...prev, newEventPoint].sort((a,b) => a.year - b.year);
          saveTimelineLocal(updated);
          return updated;
        });

        setSelectedPoint(newEventPoint);
        setActiveDecisionLog(`📜 天演玄数提示：公元前 ${Math.abs(currentBCEYear)} 年突发 【${data.title}】 事件！${data.impact}`);

        // Sync with Firestore if in multiplayer mode
        if (roomId) {
          const docRef = doc(db, 'rooms', roomId, 'timelineBranches', newEventId);
          await setDoc(docRef, {
            year: currentBCEYear,
            mandate: newMandate,
            stability: newStability,
            coffers: newCoffers,
            title: `🌪️ 【天演】${data.title}`,
            desc: data.desc,
            type: 'player_decision',
            impact: `天命 ${data.mandateImpact >= 0 ? '+':''}${data.mandateImpact}%, 安定 ${data.stabilityImpact >= 0 ? '+':''}${data.stabilityImpact}%, 帑藏 ${deltaCoffers >=0 ? '+':''}${deltaCoffers}`,
            branch: lastRelativeNode?.branch || 'custom',
            branchLabel: lastRelativeNode?.branchLabel || '自定义历史天演轨',
            creatorName: '天机推演玄机仪',
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error("Historical random event generation error: ", err);
      }
    };

    triggerEvent();
  }, [currentBCEYear]);

  // Synergize central stats block with state in the active selected point
  useEffect(() => {
    if (onSyncState && selectedPoint) {
      onSyncState({
        mandate: selectedPoint.mandate,
        stability: selectedPoint.stability,
        coffers: selectedPoint.coffers
      });
    }
  }, [selectedPoint]);

  // Handler to inject a custom Branching Fate Event Decision (圣旨动议)
  const handlePropagateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim()) return;

    const newPointId = `alt-${Date.now()}`;
    const descFormatted = `【玩家断案说】因诸位执政官议定大政：于公元前 ${Math.abs(proposalYear)} 年，胡马出朔、${proposalTitle}。因之，历史折往【${proposalBranchName}】平行世界轨道！`;
    
    // Read previous node to compute cumulative deltas
    const sortedPoints = [...timelinePoints].sort((a,b) => a.year - b.year);
    const lastRelativeNode = sortedPoints.filter(p => p.year <= proposalYear).pop() || sortedPoints[0];
    
    const newMandate = Math.min(100, Math.max(0, lastRelativeNode.mandate + proposalMandate));
    const newStability = Math.min(100, Math.max(0, lastRelativeNode.stability + proposalStability));
    const newCoffers = Math.max(1000, lastRelativeNode.coffers + proposalCoffers);

    const formatImpact = `天命 ${proposalMandate >=0 ? '+':''}${proposalMandate}%, 安定 ${proposalStability >=0 ? '+':''}${proposalStability}%, 帑藏 ${proposalCoffers >=0 ? '+':''}${proposalCoffers.toLocaleString()} (隶属于: ${proposalBranchName})`;

    const customWarlord = auth.currentUser?.displayName || `大司马_${Math.floor(Math.random()*900 + 100)}`;

    const newFatePoint: DynastyPoint = {
      id: newPointId,
      year: Number(proposalYear),
      mandate: newMandate,
      stability: newStability,
      coffers: newCoffers,
      title: proposalTitle,
      desc: proposalDesc,
      type: 'player_decision',
      impact: formatImpact,
      branch: proposalBranch,
      branchLabel: proposalBranchName,
      creatorName: customWarlord,
      timestamp: Date.now()
    };

    const nextCollection = [...timelinePoints, newFatePoint].sort((a, b) => a.year - b.year);
    setTimelinePoints(nextCollection);
    setSelectedPoint(newFatePoint);
    saveTimelineLocal(nextCollection);

    const logText = `🌌 【修变时空】大功告成！太司马【${customWarlord}】在公元前 ${Math.abs(proposalYear)} 年成功干预天命，铸造了「${proposalBranchName}」偏折轨道分支！`;
    setActiveDecisionLog(logText);

    // If online multiplayer room is active, sync with Firebase so all players witness the branch in real-time
    if (roomId) {
      try {
        const docRef = doc(db, 'rooms', roomId, 'timelineBranches', newPointId);
        await setDoc(docRef, {
          year: Number(proposalYear),
          mandate: newMandate,
          stability: newStability,
          coffers: newCoffers,
          title: proposalTitle,
          desc: proposalDesc,
          type: 'player_decision',
          impact: formatImpact,
          branch: proposalBranch,
          branchLabel: proposalBranchName,
          creatorName: customWarlord,
          timestamp: Date.now()
        });

        // Add to main logs
        await addDoc(collection(db, 'rooms', roomId, 'logs'), {
          text: logText,
          username: '【始祖历天鉴】',
          role: '分支历史纪要史官',
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Firestore sync branch error", err);
      }
    }
  };

  // Static Preset Deviations
  const triggerPrerenderedFork = (presetId: string) => {
    let point: DynastyPoint;
    const customWarlord = auth.currentUser?.displayName || '系统统辖';

    if (presetId === 'jing_ke') {
      point = {
        id: 'preset-fork-227',
        year: -227,
        mandate: 35,
        stability: 25,
        coffers: 42000,
        title: '荆轲图穷匕见刺秦功成',
        desc: '督亢地图卷穷，残刃刺入嬴政心脏，始皇当场暴薨！秦中枢大乱起，副将大动兵乱，诸侯王在列郡重新割据，百家乘虚而起！',
        type: 'player_decision',
        impact: '秦皇陨落。开启「多极诸侯大共和」世界，天命 -35，朝纲稳定度雪崩！',
        branch: 'republic',
        branchLabel: '多极诸侯大共和',
        creatorName: customWarlord
      };
    } else if (presetId === 'long_life') {
      point = {
        id: 'preset-fork-210',
        year: -210,
        mandate: 95,
        stability: 98,
        coffers: 135000,
        title: '秦皇服食蓬莱神药延万寿',
        desc: '始皇识破赵高、胡亥谋大逆案，枭首中常侍。服金丹，大获长生不死！太子扶苏巡边练就雄师，并力西征，大秦帝国长治久安！',
        type: 'player_decision',
        impact: '沙丘之乱荡绝。开启「万世万国秦始朝」世界，天命 +50，朝局极其完固。',
        branch: 'qin_forever',
        branchLabel: '万世万国秦始朝',
        creatorName: customWarlord
      };
    } else {
      point = {
        id: 'preset-fork-206',
        year: -206,
        mandate: 62,
        stability: 45,
        coffers: 110000,
        title: '霸王项羽大分封关内十八路',
        desc: '西楚霸王火烧秦宫不设帝制，大赐印信封刘邦为汉王并十八路诸侯国。王畿同盟各怀不逊，争霸开启！',
        type: 'player_decision',
        impact: '开启「骑士联邦诸侯分治」世界，朝局大混。',
        branch: 'feudal_dukedoms',
        branchLabel: '骑士联邦诸侯分治',
        creatorName: customWarlord
      };
    }

    const nextCollect = [...timelinePoints.filter(p => p.id !== point.id), point].sort((a,b) => a.year - b.year);
    setTimelinePoints(nextCollect);
    setSelectedPoint(point);
    saveTimelineLocal(nextCollect);

    setActiveDecisionLog(`🔮 史轮突变：【${point.title}】被玩家激活！多级命运分叉图已实时加载至 D3 战局。`);
  };

  const handlePurgeUserBranches = () => {
    setTimelinePoints(BASELINE_HISTORICAL_POINTS);
    setSelectedPoint(BASELINE_HISTORICAL_POINTS[0]);
    setActiveDecisionLog('🔄 时空重置：已荡平所有玩家分支扰动节点，历史回拨太初中华正编轨道。');
    const key = roomId ? `branched-timeline-room-${roomId}` : 'branched-timeline-offline';
    localStorage.removeItem(key);
  };

  // D3 MULTI-BRANCH GRAPH RENDERING SYSTEM
  useEffect(() => {
    if (!d3SvgRef.current || !timelinePoints || timelinePoints.length === 0) return;

    // Flush previous SVG nodes securely
    d3.select(d3SvgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 60, bottom: 65, left: 60 };
    const containerWidth = d3ContainerRef.current ? d3ContainerRef.current.clientWidth : 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;

    const svg = d3.select(d3SvgRef.current)
      .attr('width', containerWidth)
      .attr('height', 340)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define unique gradients and filters for aesthetic visual weight
    const defs = svg.append('defs');

    // Soft glowing filter definitions for branch highlights
    const colors = {
      baseline: '#4b5563',          // Slate gray for正史基轴
      qin_forever: '#f59e0b',       // Golden amber for万世神秦
      republic: '#3b82f6',          // Royal blue for诸子共和
      feudal_dukedoms: '#ef4444',   // Crimson red for楚霸群王
      custom: '#a855f7'             // Purple amethyst for玩家自定义
    };

    Object.entries(colors).forEach(([key, color]) => {
      const glowFilter = defs.append('filter')
        .attr('id', `curve-glow-${key}`)
        .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
      glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      glowFilter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');
    });

    // Filtering points based on the Active Branch selector
    const filteredPoints = timelinePoints.filter(p => {
      if (activeBranch === 'all') return true;
      return p.branch === 'baseline' || p.branch === activeBranch;
    });

    // SCALES
    // Year domain starts from -230 BCE to -200 BCE
    const x = d3.scaleLinear()
      .domain([-230, -200])
      .range([0, width]);

    // Mandate/Stability scale 0 - 100%
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Draw grid wires
    const gridG = svg.append('g').attr('opacity', 0.15);
    gridG.selectAll('.horiz')
      .data([20, 40, 60, 80, 100])
      .enter().append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#C5A059')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '4,4');

    gridG.selectAll('.vert')
      .data([-230, -225, -220, -215, -210, -205, -200])
      .enter().append('line')
      .attr('x1', d => x(d)).attr('x2', d => x(d))
      .attr('y1', 0).attr('y2', height)
      .attr('stroke', '#C5A059')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '2,2');

    // 1. CONSTRUCT ADVANCED TREE LINKS (PARENT -> CHILD RELATIONSHIPS)
    const links: { source: DynastyPoint; target: DynastyPoint }[] = [];
    timelinePoints.forEach(node => {
      let parent: DynastyPoint | null = null;
      if (node.branch === 'baseline') {
        // Parent of a baseline node is the closest baseline node preceding it
        const baselines = timelinePoints.filter(p => p.branch === 'baseline' && p.year < node.year);
        if (baselines.length > 0) {
          parent = baselines[baselines.length - 1]; // sorted by year
        }
      } else {
        // Parent of non-baseline first tries parent of same branch
        const sameBranch = timelinePoints.filter(p => p.branch === node.branch && p.year < node.year);
        if (sameBranch.length > 0) {
          parent = sameBranch[sameBranch.length - 1];
        } else {
          // If none, finding where it branched from base
          const baselines = timelinePoints.filter(p => p.branch === 'baseline' && p.year <= node.year);
          if (baselines.length > 0) {
            parent = baselines[baselines.length - 1];
          }
        }
      }

      if (parent) {
        links.push({ source: parent, target: node });
      }
    });

    // 2. HIGHLIGHTING SPECIFIC DESTINY PATHWAYS
    // Trace all historical ancestors from current clicked node up to the roots
    const getAncestors = (node: DynastyPoint): Set<string> => {
      const ancestors = new Set<string>();
      let current: DynastyPoint | undefined = node;
      while (current) {
        ancestors.add(current.id);
        let parent: DynastyPoint | undefined = undefined;
        if (current.branch === 'baseline') {
          const baselines = timelinePoints.filter(p => p.branch === 'baseline' && p.year < current!.year);
          if (baselines.length > 0) {
            parent = baselines[baselines.length - 1];
          }
        } else {
          const sameBranch = timelinePoints.filter(p => p.branch === current!.branch && p.year < current!.year);
          if (sameBranch.length > 0) {
            parent = sameBranch[sameBranch.length - 1];
          } else {
            const baselines = timelinePoints.filter(p => p.branch === 'baseline' && p.year <= current!.year);
            if (baselines.length > 0) {
              parent = baselines[baselines.length - 1];
            }
          }
        }
        current = parent;
      }
      return ancestors;
    };

    const activeAnchor = selectedPoint || timelinePoints[0];
    const ancestorSet = activeAnchor ? getAncestors(activeAnchor) : new Set<string>();

    // 3. FILTER VISIBLE LINKS & POINTS ACCORDING TO USER FILTER SELECTORS
    const visibleLinks = links.filter(link => {
      const sVisible = activeBranch === 'all' || link.source.branch === 'baseline' || link.source.branch === activeBranch;
      const tVisible = activeBranch === 'all' || link.target.branch === 'baseline' || link.target.branch === activeBranch;
      return sVisible && tVisible;
    });

    // 4. DRAW GORGEOUS CHRONO-STEP BIFURCATING TRANSITION LINKS (S-curves)
    const linkGenerator = d3.linkHorizontal<any, { source: DynastyPoint; target: DynastyPoint }>()
      .x((d: any) => x(d.year))
      .y((d: any) => y(d.mandate));

    const linkPaths = svg.append('g')
      .selectAll('.branch-link')
      .data<{ source: DynastyPoint; target: DynastyPoint }>(visibleLinks)
      .enter()
      .append('path')
      .attr('class', 'branch-link')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', d => colors[d.target.branch as keyof typeof colors] || colors.custom)
      .style('transition', 'stroke-width 0.3s, opacity 0.3s');

    // Render thicker and glowing strokes if the link is a direct ancestor of the selected focus point
    linkPaths
      .attr('stroke-width', d => {
        const isOnPath = ancestorSet.has(d.source.id) && ancestorSet.has(d.target.id);
        return isOnPath ? 4.5 : 1.8;
      })
      .attr('stroke-dasharray', d => d.target.branch === 'baseline' ? 'none' : '4,2')
      .attr('opacity', d => {
        const isOnPath = ancestorSet.has(d.source.id) && ancestorSet.has(d.target.id);
        const matchesFilter = activeBranch === 'all' || d.target.branch === activeBranch;
        if (isOnPath) return 1.0;
        return matchesFilter ? 0.35 : 0.1;
      })
      .attr('filter', d => {
        const isOnPath = ancestorSet.has(d.source.id) && ancestorSet.has(d.target.id);
        return isOnPath ? `url(#curve-glow-${d.target.branch})` : 'none';
      });

    // 5. DRAW AXES (Timescale ruler with tick marks)
    const xAxis = d3.axisBottom(x)
      .tickValues([-230, -225, -220, -215, -210, -205, -200])
      .tickFormat(d => `前 ${Math.abs(Number(d))} 年`);

    const yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#C5A059')
      .attr('font-size', '8px')
      .attr('font-family', 'serif');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#C5A059')
      .attr('font-size', '8px')
      .attr('font-family', 'sans-serif');

    svg.selectAll('.x-axis path, .y-axis path')
      .attr('stroke', '#C5A059')
      .attr('stroke-width', 1.2);

    // Initialize HTML Tooltip to display worldline statistics on hover
    let tooltip = d3.select(d3ContainerRef.current).select('.d3-history-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select(d3ContainerRef.current)
        .append('div')
        .attr('class', 'd3-history-tooltip absolute hidden bg-stone-950/95 border-2 border-[#C5A059]/40 text-stone-100 p-2.5 rounded-lg shadow-2xl pointer-events-none text-[10px] w-56 font-serif z-50 transition-opacity duration-150');
    }

    // 6. DRAW HISTORICAL TREE CIRCULAR NODES WITH GLOW AND INTERACTIVITY
    const nodeSelection = svg.append('g')
      .selectAll('.chrono-node')
      .data<DynastyPoint>(filteredPoints)
      .enter()
      .append('g')
      .attr('class', 'chrono-node')
      .attr('cursor', 'pointer');

    // Glowing outer circles for on-trajectory nodes
    nodeSelection.append('circle')
      .attr('class', 'glow-ring')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.mandate))
      .attr('r', d => {
        const isSel = selectedPoint?.id === d.id;
        const isOnPath = ancestorSet.has(d.id);
        return isSel ? 11 : (isOnPath ? 8 : 4);
      })
      .attr('fill', 'none')
      .attr('stroke', d => colors[d.branch] || colors.custom)
      .attr('stroke-width', d => ancestorSet.has(d.id) ? 1.5 : 0)
      .attr('opacity', d => ancestorSet.has(d.id) ? 0.7 : 0)
      .style('stroke-dasharray', '2,2')
      .style('animation', 'spin 12s linear infinite');

    // Central node circles
    nodeSelection.append('circle')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.mandate))
      .attr('r', d => {
        const isSel = selectedPoint?.id === d.id;
        const isOnPath = ancestorSet.has(d.id);
        return isSel ? 7.5 : (isOnPath ? 5.5 : 4.5);
      })
      .attr('fill', d => {
        const isSel = selectedPoint?.id === d.id;
        if (isSel) return '#FAF8F5';
        return d.type === 'historical' ? '#1c1917' : '#C5A059';
      })
      .attr('stroke', d => colors[d.branch] || colors.custom)
      .attr('stroke-width', d => {
        const isSel = selectedPoint?.id === d.id;
        return isSel ? 3.5 : 1.5;
      })
      .attr('opacity', d => {
        const isOnPath = ancestorSet.has(d.id);
        return isOnPath ? 1.0 : 0.65;
      })
      .style('transition', 'all 0.2s ease')
      .on('click', (event, d) => {
        setSelectedPoint(d);
        soundManager.playChime();
        // subtle screen glow flash indicator
        const flash = d3.select(d3SvgRef.current);
        flash.transition().duration(80).style('background-color', 'rgba(197,160,89,0.03)')
          .transition().duration(200).style('background-color', 'transparent');
      })
      .on('mouseenter', (event, d) => {
        // Highlight hover node
        d3.select(event.currentTarget)
          .attr('r', selectedPoint?.id === d.id ? 8.5 : 6.5)
          .attr('stroke-width', 2.5);

        // Render Tooltip dynamically
        tooltip
          .html(`
            <div class="space-y-1.5">
              <div class="flex justify-between items-center border-b border-stone-800 pb-1 gap-2">
                <span class="text-amber-400 font-bold font-serif">${d.year < 0 ? '公元前 ' + Math.abs(d.year) + ' 年' : d.year + ' 年'}</span>
                <span class="text-[7px] px-1.5 py-0.2 bg-[#8C2F39]/20 border border-red-900/30 rounded text-amber-200 uppercase font-black tracking-wider">
                  ${d.branchLabel || '原始中华正轨'}
                </span>
              </div>
              <div class="font-sans text-[11px] font-black text-stone-200 leading-snug">${d.title}</div>
              <p class="text-stone-400 text-[9px] leading-relaxed italic">“ ${d.desc.substring(0, 50)}${d.desc.length > 50 ? '...' : ''} ”</p>
              <div class="grid grid-cols-2 gap-1.5 pt-1 text-[8px] border-t border-stone-900 font-mono">
                <div class="flex justify-between">
                  <span class="text-stone-500">天命:</span> <strong class="text-amber-400 font-bold">${d.mandate}%</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-500">稳定:</span> <strong class="text-teal-400 font-bold">${d.stability}%</strong>
                </div>
              </div>
              <p class="text-[7.5px] text-orange-400 border-t border-stone-900/50 pt-1 leading-normal">
                <b>📌 扰动反馈:</b> ${d.impact.substring(0, 45)}${d.impact.length > 45 ? '...' : ''}
              </p>
            </div>
          `);

        const [mouseX, mouseY] = d3.pointer(event, d3ContainerRef.current);
        tooltip
          .style('left', `${mouseX + 16}px`)
          .style('top', `${mouseY - 30}px`)
          .style('display', 'block')
          .style('opacity', 1);
      })
      .on('mousemove', (event) => {
        const [mouseX, mouseY] = d3.pointer(event, d3ContainerRef.current);
        tooltip
          .style('left', `${mouseX + 16}px`)
          .style('top', `${mouseY - 30}px`);
      })
      .on('mouseleave', (event, d) => {
        // Restore node radius
        d3.select(event.currentTarget)
          .attr('r', selectedPoint?.id === d.id ? 7.5 : (ancestorSet.has(d.id) ? 5.5 : 4.5))
          .attr('stroke-width', selectedPoint?.id === d.id ? 3.5 : 1.5);

        // Hide Tooltip
        tooltip
          .style('opacity', 0)
          .style('display', 'none');
      });

    // Label markers under nodes (shorter string representation)
    nodeSelection.append('text')
      .attr('x', d => x(d.year))
      .attr('y', d => y(d.mandate) - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', d => {
        const isOnPath = ancestorSet.has(d.id);
        const colorHex = colors[d.branch as keyof typeof colors] || colors.custom;
        return isOnPath ? colorHex : '#6b7280';
      })
      .attr('font-size', '8px')
      .attr('font-family', 'serif')
      .attr('font-weight', d => (selectedPoint?.id === d.id) ? 'black' : 'bold')
      .attr('opacity', d => {
        const isOnPath = ancestorSet.has(d.id);
        return isOnPath ? 1.0 : 0.45;
      })
      .text(d => d.title.substring(0, 5));

    // Handle Resize Observer representing flexible and fluid canvas dimensions
    const handleResize = () => {
      if (!d3ContainerRef.current) return;
      const newWidth = d3ContainerRef.current.clientWidth - margin.left - margin.right;
      x.range([0, newWidth]);

      // update axes and gridwires
      svg.select('.x-axis').call(xAxis as any);
      gridG.selectAll('line').attr('x2', newWidth);

      // Update link curves S-curve links
      svg.selectAll('.branch-link').attr('d', linkGenerator as any);

      // Update nodes coordinates
      nodeSelection.selectAll('circle.glow-ring')
        .attr('cx', (d: any) => x(d.year))
        .attr('cy', (d: any) => y(d.mandate));

      nodeSelection.selectAll('circle:not(.glow-ring)')
        .attr('cx', (d: any) => x(d.year))
        .attr('cy', (d: any) => y(d.mandate));

      nodeSelection.selectAll('text')
        .attr('x', (d: any) => x(d.year))
        .attr('y', (d: any) => y(d.mandate) - 15);
    };

    const runObserver = new ResizeObserver(handleResize);
    if (d3ContainerRef.current) runObserver.observe(d3ContainerRef.current);

    return () => runObserver.disconnect();
  }, [timelinePoints, selectedPoint?.id, activeBranch]);

  return (
    <div className="bg-stone-900 border-2 border-amber-500/20 rounded-lg p-4 sm:p-5 shadow-2xl space-y-5 text-stone-200" id="dynasty-branched-panel">
      
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-800 pb-4 gap-4">
        <div>
          <span className="text-[9.5px] font-mono text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            CHRONOLOGICAL ANCHOR UNIT · 天始天元天演盘
          </span>
          <h3 className="text-xl font-serif font-black text-stone-100 flex items-center gap-2 mt-0.5">
            多端联机分支史演系统
            <span className="bg-rose-950 text-rose-400 border border-rose-900/50 text-[9px] px-1 rounded-full font-bold">
              公元前 230 年 ~ 前 202 年 BC
            </span>
          </h3>
        </div>

        {/* Real-time Ticker Cockpit showing elapsed days and simulation ratios */}
        <div className="bg-stone-950/80 p-2.5 rounded border border-[#C5A059]/15 flex items-center gap-4 text-[10.5px] font-mono">
          <div>
            <span className="text-stone-500 block text-[7.5px] font-black">时速转换轴率</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-amber-400 font-bold">{selectedSpeed.label}</span>
              <span className="text-stone-600">|</span>
              <span className="text-stone-400 text-[9px]">宿命比例: 1日 = 1.0 史岁</span>
            </div>
          </div>
          <div>
            <span className="text-stone-500 block text-[7.5px] font-black">当前时流时令</span>
            <span className="text-stone-100 font-bold mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              太初前 {Math.abs(currentBCEYear)} 年 
              <span className="text-[9px] text-[#C5A059] bg-stone-900 p-0.5 rounded ml-0.5">
                春
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Time and Branching Speed Config Block */}
      <div className="bg-stone-950 p-3 rounded-lg border border-stone-850/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 space-y-1">
          <h4 className="text-xs font-serif font-black text-amber-500 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            时空发动机设置
          </h4>
          <p className="text-[10px] text-stone-400 leading-normal font-sans">
            本页模拟中华各路豪杰在公元前230年（秦灭韩）框架下的宿命长河。时间默认<b>自动在服务器同步流动</b>。由于
            <b> 1 现实日大略折合一历载 </b>，您可以通过下方开关瞬间调节推演测试倍速，观察玩家扰动点如何自基轴一分为多，从而实现「多路历史群侠自决」！
          </p>
        </div>

        {/* Speed Option Buttons Grid */}
        <div className="md:col-span-4 flex flex-wrap gap-1 md:justify-end">
          {SPEEDS.map((sp) => {
            const isSel = selectedSpeed.seconds === sp.seconds;
            return (
              <button
                key={sp.seconds}
                type="button"
                onClick={() => {
                  setSelectedSpeed(sp);
                  localStorage.setItem('dynasty_chronometer_speed_seconds', String(sp.seconds));
                  soundManager.playCoins();
                }}
                className={`text-[8.5px] font-bold p-1 md:px-2 rounded border cursor-pointer transition-all ${
                  isSel 
                    ? 'bg-amber-500 text-stone-950 border-amber-500 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-850'
                }`}
              >
                {sp.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Baseline VS Player Diversion Preset Center */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { id: 'jing_ke', title: '荆轲图穷匕见功成', label: '公元前227年·大乱起', style: 'border-[#2563EB]/40 bg-[#2563EB]/5 hover:bg-[#2563EB]/10 hover:border-[#2563EB]/80 text-[#2563EB]' },
          { id: 'long_life', title: '秦始皇服仙药万寿', label: '公元前210年·秦永昌', style: 'border-[#D97706]/40 bg-[#D97706]/5 hover:bg-[#D97706]/10 hover:border-[#D97706]/80 text-[#D97706]' },
          { id: 'xiang_yu', title: '霸王大分封杜绝大同', label: '公元前206年·霸王联邦', style: 'border-[#DC2626]/40 bg-[#DC2626]/5 hover:bg-[#DC2626]/10 hover:border-[#DC2626]/80 text-[#DC2626]' }
        ].map((pres) => (
          <div 
            key={pres.id}
            onClick={() => triggerPrerenderedFork(pres.id)}
            className={`cursor-pointer rounded-lg p-2.5 border transition-all text-xs flex flex-col justify-between ${pres.style}`}
          >
            <div>
              <span className="text-[7.5px] block font-mono opacity-80 uppercase tracking-widest">{pres.label}</span>
              <h5 className="font-serif font-black mt-1 leading-tight">{pres.title}</h5>
            </div>
            <span className="text-[8px] font-sans block mt-2 opacity-90 font-bold flex items-center gap-0.5">
              💡 激活此分支 🔱
            </span>
          </div>
        ))}

        {/* System Reset Chronology */}
        <div 
          onClick={handlePurgeUserBranches}
          className="cursor-pointer rounded-lg p-2.5 border border-stone-700 bg-stone-950/40 hover:bg-stone-900/90 hover:border-red-500/50 transition-all text-xs flex flex-col justify-between text-stone-500 hover:text-red-400"
        >
          <div>
            <span className="text-[7.5px] block font-mono opacity-80 uppercase tracking-widest">重置天演时间</span>
            <h5 className="font-serif font-black mt-1 leading-tight">拂平历史褶皱 (Reset)</h5>
          </div>
          <span className="text-[8px] font-sans block mt-2 uppercase font-black flex items-center gap-0.5">
            <RotateCcw className="w-2.5 h-2.5" /> 恢复正朝基轴
          </span>
        </div>
      </div>

      {/* Main Interactive Map Grid Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Graph stage (Left 8 blocks) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4" ref={d3ContainerRef}>
          <div className="bg-stone-950/80 rounded-lg border border-stone-800 p-3.5 relative overflow-hidden shadow-inner">
            
            {/* Visual labels indicating active branches and their color identities */}
            <div className="absolute top-2.5 right-3 flex flex-wrap items-center gap-2 text-[8px] font-mono select-none">
              <span className="text-stone-500 flex items-center gap-1">
                <span className="w-2 h-0.5 bg-stone-500 inline-block"></span>
                <span>正史基轴</span>
              </span>
              <span className="text-[#D97706] flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#D97706] inline-block"></span>
                <span>始皇长生</span>
              </span>
              <span className="text-[#2563EB] flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#2563EB] inline-block"></span>
                <span>诸侯共和</span>
              </span>
              <span className="text-[#DC2626] flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#DC2626] inline-block"></span>
                <span>霸王联邦</span>
              </span>
              <span className="text-[#7C3AED] flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#7C3AED] inline-block"></span>
                <span>余部异闻</span>
              </span>
            </div>

            {/* Selector to alter active focus graph wire */}
            <div className="flex items-center gap-1.5 mb-2 border-b border-stone-850 pb-2">
              <span className="text-[8.5px] font-black text-stone-500 uppercase font-mono">天轨筛选:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { id: 'all', label: '显示全部分支' },
                  { id: 'baseline', label: '未扰动正史基轴' },
                  { id: 'qin_forever', label: '万世神秦' },
                  { id: 'republic', label: '诸侯大共和' },
                  { id: 'feudal_dukedoms', label: '楚霸群王' },
                  { id: 'custom', label: '玩家自定义轨' }
                ].map((tb) => {
                  const isSel = activeBranch === tb.id;
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => setActiveBranch(tb.id as any)}
                      className={`text-[8px] px-1.5 py-0.5 rounded font-serif ${
                        isSel 
                          ? 'bg-amber-600/30 border border-amber-500 text-amber-300' 
                          : 'bg-stone-900 text-stone-400 border border-transparent hover:bg-stone-850'
                      }`}
                    >
                      {tb.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D3 visual node svg */}
            <div className="w-full overflow-x-auto">
              <svg 
                ref={d3SvgRef}
                className="block mx-auto select-none"
              ></svg>
            </div>

            <div className="text-[8.5px] text-stone-500 font-mono text-center border-t border-stone-850 pt-2 flex justify-between">
              <span>⬅ 始元公元前 230 年</span>
              <span>💡 将折线图中命势 node 点击，即可在右侧抄牍中研读该天命褶皱细节 ➡</span>
            </div>
          </div>

          <div className="bg-stone-950 p-3 rounded-lg border border-amber-950/20 flex gap-2 shadow-sm">
            <span className="bg-amber-600 text-stone-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded whitespace-nowrap self-start mt-0.5">
              👁️ 四海史策
            </span>
            <p className="text-xs font-serif leading-relaxed text-stone-300">
              {activeDecisionLog}
            </p>
          </div>
        </div>

        {/* Read panel details (Right 4 blocks) */}
        <div className="lg:col-span-4 flex">
          <div className="bg-stone-950/90 rounded-lg border border-stone-800 p-4 w-full flex flex-col justify-between relative shadow-lg">
            <div className="absolute top-2 right-2 text-stone-900 font-serif font-black text-6xl pointer-events-none select-none">
              天
            </div>

            <div className="space-y-4">
              <div className="border-b border-stone-850 pb-2">
                <span className="text-[8.5px] font-mono font-extrabold text-[#C5A059] block uppercase tracking-wider">
                  时空偏执纪书
                </span>
                <h4 className="text-sm font-serif font-black text-stone-200 mt-0.5">
                  {selectedPoint 
                    ? `公元前 ${Math.abs(selectedPoint.year)} 年 · ${selectedPoint.title}` 
                    : '尚未点击判定点'}
                </h4>
              </div>

              {selectedPoint ? (
                <div className="space-y-4 text-xs font-serif">
                  <div className="bg-[#1c1917]/70 p-2.5 rounded border border-stone-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[7px] text-stone-500 font-mono block uppercase">历史轨名</span>
                      <strong className="text-amber-500 text-[10.5px]">
                        {selectedPoint.branchLabel || "未知世界轨道"}
                      </strong>
                    </div>
                    {selectedPoint.creatorName && (
                      <span className="text-[8px] text-stone-600 font-sans mt-1">
                        扰动官: 【{selectedPoint.creatorName}】
                      </span>
                    )}
                  </div>

                  <div className="bg-stone-900/60 p-3 rounded border border-stone-850">
                    <span className="text-[8.5px] text-stone-500 block">因果疏抄纪要:</span>
                    <p className="text-stone-300 italic mt-1 leading-relaxed leading-[1.35rem]">
                      “ {selectedPoint.desc} ”
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] text-stone-500 font-mono uppercase tracking-widest block">朝政受损折合指标:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-amber-950/30 border border-amber-900/40 rounded p-1.5">
                        <span className="block text-[7.5px] text-stone-500 uppercase">天命指数</span>
                        <strong className="text-amber-400 text-xs">{selectedPoint.mandate}%</strong>
                      </div>
                      <div className="bg-teal-950/30 border border-teal-900/40 rounded p-1.5">
                        <span className="block text-[7.5px] text-stone-500 uppercase">执政稳定</span>
                        <strong className="text-teal-400 text-xs">{selectedPoint.stability}%</strong>
                      </div>
                    </div>
                    <div className="bg-stone-900 rounded p-1.5 flex justify-between items-center text-[9.5px] font-mono">
                      <span className="text-stone-550">大司农金库存蓄:</span>
                      <strong className="text-yellow-500 font-bold">{selectedPoint.coffers.toLocaleString()} 镒</strong>
                    </div>
                  </div>

                  <div className="bg-orange-950/40 border border-orange-900/30 p-2 rounded text-[10.5px] text-[#C5A059] leading-relaxed">
                    <b>⚠️ 宿命扰动反馈:</b> {selectedPoint.impact}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 font-serif">
                  请轻轻点击左边D3天演坐标上的圆圈，方可解压并诵读该分支历史细节。
                </p>
              )}
            </div>

            <div className="border-t border-stone-850 pt-2.5 mt-4 text-[8px] font-sans text-stone-500 leading-normal">
              ℹ️ 朝局之判定，全由诸玩家大政御案操持。若天命或安邦任何一个落入 40% 以下，将当即遭遇群雄覆灭死局。
            </div>
          </div>
        </div>

      </div>

      {/* Manual Propagate Proposal Form: "历史圣旨动议" (Custom Intervention Form) */}
      <div className="border-t border-stone-800 pt-5">
        <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <GitBranch className="w-4 h-4 text-amber-500 animate-pulse" />
          圣谕御笔行令：颁布历史命运偏折动议
        </h4>

        <form onSubmit={handlePropagateProposal} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-stone-950/70 p-4 rounded-lg border border-stone-800">
          
          {/* Year and branch selector values */}
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-[8.5px] font-mono text-stone-500 uppercase font-black mb-1">干涉年代</label>
              <div className="relative">
                <input 
                  type="range"
                  min="-230"
                  max="-200"
                  step="1"
                  value={proposalYear}
                  onChange={(e) => setProposalYear(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-full appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono mt-1 text-stone-300">
                  <span>公元前 230 年</span>
                  <span className="text-amber-400 font-bold font-serif">公元前 {Math.abs(proposalYear)} 年</span>
                  <span>公元前 200 年</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[8.5px] font-mono text-stone-500 uppercase font-black mb-1">天轨轨道属性</label>
              <select
                value={proposalBranch}
                onChange={(e) => setProposalBranch(e.target.value as any)}
                className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-[11px] text-stone-200 outline-none focus:border-amber-500/40"
              >
                <option value="custom">🛡️ 自定义圣王偏属轨</option>
                <option value="qin_forever">👑 万世神秦霸权路</option>
                <option value="republic">🔮 诸子百家大共和</option>
                <option value="feudal_dukedoms">⚔️ 楚霸群雄杜帝法</option>
              </select>
            </div>

            <div>
              <label className="block text-[8.5px] font-mono text-stone-500 uppercase font-black mb-1">异向世界命名</label>
              <input 
                type="text"
                value={proposalBranchName}
                onChange={(e) => setProposalBranchName(e.target.value)}
                placeholder="例如：大秦蒸汽甲兵路、诸子共和议会轨"
                className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-[11px] text-stone-200 outline-none focus:border-amber-500/40"
              />
            </div>
          </div>

          {/* Description and Title */}
          <div className="md:col-span-5 space-y-3">
            <div>
              <label className="block text-[8.5px] font-mono text-stone-500 uppercase font-black mb-1">动议玺题</label>
              <input 
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="荆轲刺杀嬴政不死、韩王密谋反攻咸阳..."
                className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-[11px] text-stone-200 outline-none focus:border-amber-500/40 font-serif"
              />
            </div>

            <div>
              <label className="block text-[8.5px] font-mono text-stone-500 uppercase font-black mb-1">动议因果叙疏</label>
              <textarea 
                rows={3}
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                placeholder="撰写对于该年代历史拐点的政治大案描述，解释为什么会导致该支路轨的分叉偏偏折..."
                className="w-full bg-stone-900 border border-stone-800 rounded p-1.5 text-[11.5px] text-stone-200 font-serif outline-none focus:border-amber-500/40 leading-relaxed"
              />
            </div>
          </div>

          {/* Indicators Deltas */}
          <div className="md:col-span-3 space-y-3">
            <div className="bg-stone-900 p-2.5 rounded border border-stone-850 space-y-2">
              <span className="text-[8px] font-mono text-stone-500 block uppercase font-bold text-center border-b border-stone-800 pb-1">预计扰动指数震折</span>
              
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div>
                  <span className="text-[8px] text-stone-500 block">天命 +/-</span>
                  <input 
                    type="number"
                    value={proposalMandate}
                    onChange={(e) => setProposalMandate(Number(e.target.value))}
                    className="w-full bg-stone-950 text-center border border-stone-800 rounded p-0.5 text-amber-400"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-stone-500 block">稳定 +/-</span>
                  <input 
                    type="number"
                    value={proposalStability}
                    onChange={(e) => setProposalStability(Number(e.target.value))}
                    className="w-full bg-stone-950 text-center border border-stone-800 rounded p-0.5 text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <span className="text-[8px] text-stone-500 block font-mono">官私帑金 +/- (镒)</span>
                <input 
                  type="number"
                  value={proposalCoffers}
                  onChange={(e) => setProposalCoffers(Number(e.target.value))}
                  className="w-full bg-stone-950 text-center border border-stone-800 rounded p-1 text-[10.5px] text-yellow-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 md:py-2 bg-[#8C2F39] text-[#FAF8F5] text-xs font-serif font-black rounded hover:bg-red-950 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1 border border-red-900/40"
            >
              👑 印玺准行
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
