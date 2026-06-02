import React, { useState } from 'react';
import { MarketCommodity, Character } from '../types';
import { Shield, Sparkles, TrendingUp, HelpCircle, Activity, Landmark, TreePalm, GraduationCap, Coins, LineChart } from 'lucide-react';

export default function MerchantSuccessionSandbox() {
  // Trade state
  const [cash, setCash] = useState<number>(300);
  const [salts, setSalts] = useState<number>(0);
  const [saltLicences, setSaltLicences] = useState<number>(0);
  const [grainHoldings, setGrainHoldings] = useState<number>(0);

  // Lineage State
  const [lineage, setLineage] = useState<Character[]>([
    { name: '曹顺 (曹商老祖)', identity: 'MERCHANT', generation: 1, attributes: { authority: 10, prestige: 15, wealth: 300, dao: 75 } },
  ]);

  const [stabilityRisk, setStabilityRisk] = useState<number>(12); // local riot probability
  const [activeLog, setActiveLog] = useState<string[]>([
    '【商运与代际承袭】曹氏商帮初始掌舵人曹顺正式立业。当前执持300铜，存米100石。',
    '市面辽东粮食价格紧俏。贩运私盐利润在3-5倍，但暗藏砍头风险！'
  ]);

  const [marketInputVal, setMarketInputVal] = useState<number>(10);

  const handleCommodityTrade = (type: 'BUY_GRAIN' | 'SELL_GRAIN' | 'SMUGGLE_SALT' | 'BUY_LICENSE') => {
    let currentCash = cash;
    let logMsg = '';

    if (type === 'BUY_GRAIN') {
      const price = 45; // 45 per stone
      if (currentCash < price * marketInputVal) {
        logMsg = `⚠️ 钱元不足！无法吃下 ${marketInputVal} 石军粮。`;
      } else {
        setGrainHoldings(p => p + marketInputVal);
        setCash(p => p - (price * marketInputVal));
        logMsg = `🌾 囤积军粮：进购了 ${marketInputVal} 石丰收碎谷，均价 45 钱/石。曹氏商仓储量扩大。`;
      }
    } else if (type === 'SELL_GRAIN') {
      if (grainHoldings < marketInputVal) {
        logMsg = `⚠️ 仓储存粮不足！没有这么多现粮可供抛售。`;
      } else {
        const sellPrice = 95; // drought spikes price to 95!
        setGrainHoldings(p => p - marketInputVal);
        setCash(p => p + (sellPrice * marketInputVal));
        // high prices cause public complaints
        setStabilityRisk(prev => Math.min(100, prev + 15));
        logMsg = `🌾 抛售囤粮：以灾情高价（95 钱/石）抛售 ${marketInputVal} 石囤粮。囊入大额金银，但民间温饱度暴跌，民变隐患+15%！`;
      }
    } else if (type === 'SMUGGLE_SALT') {
      const SmuggleRisk = Math.random() * 100;
      if (SmuggleRisk < 35) {
        // caught by patrols
        setCash(p => Math.round(p * 0.3)); // Copied/抄家
        setSalts(0);
        logMsg = `💀 私盐败露！曹氏驼队在潼关遭巡城营密查，搜出白私盐百担。抄家充公损失70%财产！差一点全族受戮！`;
      } else {
        const profits = 250;
        setCash(p => p + profits);
        logMsg = `🧂 盐运暴利！侥幸越境。私盐以5倍暴利抛售给塞外藩镇守军。收获财富 250 两！`;
      }
    } else if (type === 'BUY_LICENSE') {
      if (currentCash < 180) {
        logMsg = `⚠️ 贿金不足！买不起枢密院颁发的专卖【盐引】。`;
      } else {
        setCash(p => p - 180);
        setSaltLicences(p => p + 1);
        logMsg = `📜 廷授盐引：花费 180 钱打点给宰辅。获得“两淮盐引”一张。此后贩运食盐官府批文放行，彻底规避私盐抄家风险！`;
      }
    }

    setActiveLog(prev => [logMsg, ...prev].slice(0, 7));
  };

  const handleImperialExam = () => {
    const currentHeir = lineage[lineage.length - 1];
    if (cash < 200) {
      setActiveLog(prev => [`⚠️ 书院膏火不支！供给嫡子进京赴试需要至少 200 巨款。`, ...prev]);
      return;
    }

    setCash(p => p - 200);
    const roll = Math.random() * 100;
    let logMsg = '';

    if (roll > 55) {
      // Passes Exam! High upgrade
      const newHeir: Character = {
        name: `曹逸 (第${currentHeir.generation + 1}代进士)`,
        identity: 'SCHOLAR',
        generation: currentHeir.generation + 1,
        attributes: {
          authority: 65,
          prestige: 90,
          wealth: cash - 200,
          dao: currentHeir.attributes.dao + 10
        },
        heritage: ['座师同盟盟友', '内阁文魁']
      };
      setLineage(p => [...p, newHeir]);
      logMsg = `🎓 喜报！曹氏子弟【曹逸】在殿试御笔点为【二甲进士】！曹帮由贱商正式重塑门庭为【江南清流士大夫家】！名节气运大成！`;
    } else {
      // Fails
      logMsg = `❌ 金榜落第：子弟发挥失当，在礼部会试被刷落榜。名落孙山，白耗了200钱书院打点银，仅落得童生回乡。`;
    }

    setActiveLog(prev => [logMsg, ...prev].slice(0, 7));
  };

  const currentLeader = lineage[lineage.length - 1];

  return (
    <div className="bg-white/40 border border-[#1A1A1A]/15 p-6 rounded-md text-[#1A1A1A]" id="merchant-succession-root">
      <div className="flex justify-between items-center mb-6 border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-[#8C2F39] flex items-center gap-2">
            <Coins className="text-[#8C2F39] w-5 h-5" />
            【商承局】商潮垄断与家世世代承袭
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 font-mono">
            孙子兵法第二篇《作战》商路命脉与第十一篇《阶层流动》联动：操弄生活粮价，巨资捐科考打破晋升金字塔。
          </p>
        </div>
        <span className="text-xs border border-[#1A1A1A]/15 px-2 py-1 text-[#8C2F39] font-mono rounded bg-white/50 backdrop-blur-xs font-bold shadow-xs">
          GDD 模块 09, 10, 11 · 交互实验室
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trade Commodities Center */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <LineChart className="w-4 h-4 text-[#8C2F39]" />
                江南大商埠六类大市经营
              </h3>
              <span className="text-[10px] text-[#1A1A1A]/50 font-mono">交易单元: {marketInputVal} 石/千斤</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { name: '辽辽精米 (粮食)', base: '45/石', highlight: '民变预警晴雨表' },
                { name: '淮南官盐 (食盐)', base: '引证垄断', highlight: '官营渠道暴发' },
                { name: '边关军饷 (战马)', base: '120/匹', highlight: '军费核心支出' }
              ].map(c => (
                <div key={c.name} className="bg-white/70 p-2 rounded border border-[#1A1A1A]/10 shadow-xs">
                  <div className="font-serif font-bold text-[#1A1A1A]/90">{c.name}</div>
                  <div className="text-[9px] text-[#8C2F39] font-mono mt-0.5 font-bold">{c.base}</div>
                  <div className="text-[8px] text-[#1A1A1A]/50 mt-1 font-mono">{c.highlight}</div>
                </div>
              ))}
            </div>

            {/* Input trading amount sliders */}
            <div className="mt-4 flex gap-4 items-center bg-white/70 p-2.5 rounded border border-[#1A1A1A]/10 shadow-xs">
              <div className="flex-1">
                <label className="text-[10px] text-[#1A1A1A]/60 font-mono block mb-1">批量交割额度: {marketInputVal}</label>
                <input
                  type="range"
                  id="trade-amount-slider"
                  min="5"
                  max="50"
                  value={marketInputVal}
                  onChange={(e) => setMarketInputVal(Number(e.target.value))}
                  className="w-full h-1 bg-[#1A1A1A]/10 rounded-lg appearance-none cursor-pointer accent-[#8C2F39]"
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  id="trade-btn-buy"
                  onClick={() => handleCommodityTrade('BUY_GRAIN')}
                  className="bg-white hover:bg-neutral-50 text-[#1A1A1A] font-bold border border-[#1A1A1A]/15 text-xs py-1.5 px-3 rounded shadow-xs"
                >
                  购入精米
                </button>
                <button
                  id="trade-btn-sell"
                  onClick={() => handleCommodityTrade('SELL_GRAIN')}
                  className="bg-[#8C2F39] font-black text-[#F5F2ED] text-xs py-1.5 px-3 rounded hover:bg-[#8C2F39]/90 shadow-sm"
                >
                  囤积抛粮
                </button>
              </div>
            </div>

            {/* Smuggling operations */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                id="trade-btn-smuggle"
                onClick={() => handleCommodityTrade('SMUGGLE_SALT')}
                className="bg-white border border-[#8C2F39]/30 hover:border-[#8C2F39] text-[#8C2F39] text-xs py-2 px-3 rounded hover:bg-[#8C2F39]/5 text-left transition shadow-xs"
              >
                <div className="font-serif font-black text-[#8C2F39]">🤫 走私贩卖私活私盐 (暴劫富贵)</div>
                <div className="text-[8px] text-[#1A1A1A]/55 mt-0.5 font-mono">35%概率抄家灭族，65%概率爆发巨金两百铜</div>
              </button>

              <button
                id="trade-btn-license"
                onClick={() => handleCommodityTrade('BUY_LICENSE')}
                className="bg-white border border-[#1A1A1A]/15 hover:border-[#8C2F39]/40 text-[#1A1A1A]/80 text-xs py-2 px-3 rounded text-left transition shadow-xs"
              >
                <div className="font-serif font-bold text-[#1A1A1A]">📜 专购淮盐【官授盐引】</div>
                <div className="text-[8px] text-[#1A1A1A]/55 mt-0.5 font-mono">消耗180金，取得盐运路程赦免保护伞</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 p-3 rounded border border-[#1A1A1A]/15 text-xs font-mono shadow-xs">
              <div className="text-[#1A1A1A]/50 font-bold">商行财务及物资总账</div>
              <div className="text-[#1A1A1A]/85 mt-1.5">存钞：<strong className="text-[#8C2F39] font-bold">{cash} 钱</strong></div>
              <div className="text-[#1A1A1A]/85">粮仓：<strong className="text-[#5A5A40] font-bold">{grainHoldings} 石</strong></div>
              <div className="text-[#1A1A1A]/85">持有盐引：<strong className="text-[#5A5A40] font-bold">{saltLicences} 张</strong></div>
            </div>

            <div className="bg-white/60 p-3 rounded border border-[#1A1A1A]/15 text-xs font-mono shadow-xs">
              <div className="text-[#1A1A1A]/50 font-bold">温饱饥荒与起义隐患</div>
              <div className="text-[#1A1A1A]/85 mt-1.5">民粮物价：<strong className="text-[#8C2F39] font-bold">紧俏 (95钱/石)</strong></div>
              <div className="text-[#1A1A1A]/85">暴乱爆发概率：
                <strong className={stabilityRisk > 30 ? 'text-[#8C2F39] font-black' : 'text-[#5A5A40] font-bold'}>
                  {stabilityRisk}%
                </strong>
              </div>
              <span className="text-[8px] text-[#1A1A1A]/50 mt-1.5 block">孙子曰：食敌一钟，当吾二十钟。乱世之端起于高粮。</span>
            </div>
          </div>
        </div>

        {/* Dynamic Legacy Tree & Exam climb */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 flex-1 shadow-xs">
            <h3 className="text-xs font-mono text-[#1A1A1A]/80 flex items-center gap-1.5 mb-2 font-bold uppercase tracking-wider">
              <GraduationCap className="text-[#5A5A40] w-4 h-4 font-bold" />
              【士绅天梯】科举跃龙门打破阶层
            </h3>

            <p className="text-[11px] text-[#1A1A1A]/60 mb-3 leading-relaxed font-mono">
              商贾三代不得应试。为了打通“士大夫政治同盟”，你需要巨资进贡给内廷文官书院，资助子弟考取会试与殿试。
            </p>

            <div className="space-y-4">
              <div className="bg-white/60 p-2.5 rounded border border-[#1A1A1A]/10 space-y-2 shadow-xs">
                <span className="text-[10px] text-[#1A1A1A]/50 font-mono block">当前执印掌门：</span>
                <div className="text-xs font-serif font-black text-[#1A1A1A]">{currentLeader.name}</div>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-[#1A1A1A]/60 font-mono font-bold">
                  <div>名节声望: <strong className="text-[#8C2F39] font-bold">{currentLeader.attributes.prestige}</strong></div>
                  <div>特权等级: <strong className="text-[#5A5A40] font-bold">{currentLeader.identity}</strong></div>
                </div>
              </div>

              <button
                id="imperial-exam-btn"
                onClick={handleImperialExam}
                className="w-full bg-[#5A5A40] hover:bg-[#5A5A40]/90 text-[#F5F2ED] font-bold text-xs py-2.5 rounded shadow transition flex items-center justify-center gap-1.5"
              >
                🎓 支出200金 资助嫡长考会试殿试
              </button>
            </div>
          </div>

          {/* Pedigree lineages */}
          <div className="bg-white/50 p-4 rounded border border-[#1A1A1A]/15 max-h-[120px] overflow-y-auto shadow-xs">
            <h4 className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest mb-1.5 font-bold">跨时代家族谱系</h4>
            <div className="space-y-1.5 text-xs font-mono">
              {lineage.map((member, index) => (
                <div key={index} className="text-[#1A1A1A]/90 flex justify-between items-center bg-white/80 p-1.5 rounded border border-[#1A1A1A]/10 shadow-xs">
                  <span className="font-serif">世代 {member.generation} 门人: <strong>{member.name}</strong></span>
                  <span className="text-[9px] text-[#1A1A1A]/50 font-bold">{member.identity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/85 p-4 rounded border border-[#1A1A1A]/15 mt-6 shadow-xs">
        <h4 className="text-[10px] font-mono text-[#1A1A1A]/60 tracking-wider mb-2 font-bold uppercase">曹氏大账房走私记 logs</h4>
        <div className="space-y-1.5 text-xs font-mono">
          {activeLog.map((log, index) => (
            <div key={index} className="text-[#1A1A1A]/85 border-l-2 border-[#8C2F39]/20 pl-2 py-0.5">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
