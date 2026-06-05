import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize GenAI client safely - lazy evaluation if possible or gracefully handle undefined key
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API routes first
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/analyze-scenario", async (req, res) => {
    const { scenarioTitle, scenarioBackground, troops } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Robust demo fallbacks depending on the scenario keywords
      let fallback = {
        applicableChapters: [
          {
            chapterName: "《九地篇》",
            chapterNum: "第十一",
            quote: "投之亡地然后存，陷之死地然后生。",
            guidance: "此处塞北戈壁被五倍匈奴穷追，背后又横亘天川，已陷九地之“死地”。置身死地，统帅千万不可存苟且退避之心，当绝其物资，焚其营帐，示众必死以凝聚破局之血气。"
          },
          {
            chapterName: "《虚实篇》",
            chapterNum: "第六",
            quote: "形人而我无形，则我专而敌分。",
            guidance: "敌众我寡时，当隐蔽虚实神出鬼没。匈奴虽剽悍然行军散乱，我以佯攻疑兵迫其分散防护线，随后调集王师精粹朝东侧河底其空虚薄弱处击破合围。"
          }
        ],
        strategicAdvices: [
          "绝路焚辎：严厉断绝士卒偷生眷恋，激发两百倍绝斗精神。",
          "夜渡荒涧：偏师高擎火把、鼓角大噪，主力精兵由暗峡夜行出逃。",
          "反间单于：密遣舌辩细作携珠玉重金贿赂匈奴副单于，使合围决策扯皮搁浅。"
        ],
        hegemonDict: "此战虽凶，然千古名将皆起于九地死谷。为帅者宜静以幽，正以治，因敌变化而取胜者，真神人也。"
      };

      if (scenarioTitle && scenarioTitle.includes("奇正")) {
        fallback = {
          applicableChapters: [
            {
              chapterName: "《兵势篇》",
              chapterNum: "第五",
              quote: "战者，以正合，以奇胜。",
              guidance: "隘道先锋已失奇兵隐蔽天机，形迹暴露。此时当立刻化正面为“正兵”，高树军旗作缠斗佯击之状；而急调侧翼残卒作“奇兵”，沿绝壁攀爬潜入敌囤粮寨袭之，奇正相生，必可凿穿坚防。"
            },
            {
              chapterName: "《九变篇》",
              chapterNum: "第八",
              quote: "将有五危：... 忿速，可侮也。",
              guidance: "受惊急于立竿见影复仇，乃主将之“忿速”大危。切不可将两军一线填入悬峡受强弩箭雨洗劫。大帅须屏气凝神，视挫折为诱敌生门，缓缓合围，因敌变阵。"
            }
          ],
          strategicAdvices: [
            "正骑佯攻牵制：正面拉扯多设箭塔阻截，诱敌持续向路口增兵。",
            "衔枚暗渡陈仓：密调百步死士由无路之峭壁绕至其侧，斩关夺寨断其归路。",
            "避实收拢残军：若战线已崩，果断抛掷重装，衔枚夜行潜回险陵据城守候。"
          ],
          hegemonDict: "奇正之变，无穷如天地，不竭如江河。为大将者断不可因一地之失而兴盲目盲忿。守静用奇，因势变易乃神也。"
        };
      } else if (scenarioTitle && scenarioTitle.includes("五间")) {
        fallback = {
          applicableChapters: [
            {
              chapterName: "《用间篇》",
              chapterNum: "第十三",
              quote: "反间者，因其敌间而用之也。",
              guidance: "强虏施流言攻心诡计，意在动摇大帅清高美名。当顺水推舟，假作“名誉扫地、心生叛意”，私授买降贪信引诱敌酋轻进。此乃将计就计，完美之反间。"
            },
            {
              chapterName: "《九变篇》",
              chapterNum: "第八",
              quote: "将有五危：廉洁，可辱也；爱民，可烦也。",
              guidance: "将领自视廉洁、视声誉重于国家，极易意气用事，中敌方恶毒羞辱。当断绝个人私节鸣冤，视污名如战甲，收心合众，借流言设瓮城杀阵伏击寇兵。"
            }
          ],
          strategicAdvices: [
            "故泄叛变买降降信：置假贪贿文书于桌案，佯命探子带出使敌谍死心服气。",
            "瓮城连夜密置强弓：多备锋矢及引火薪油，静候敌寇轻兵夜袭全灭之。",
            "密折上表咸阳澄清：私下上折主上，禀陈清白及“因间破敌”大略，使君臣无间。"
          ],
          hegemonDict: "反间之妙，在于假中透实、实中反虚。以虚名诱其利心，纵敌轻骑自陷死地，用间之上者也。"
        };
      }

      return res.status(200).json({ ...fallback, isDemoFallback: true });
    }

    try {
      const client = getAiClient();
      if (!client) {
        throw new Error("AI client could not be initialized.");
      }

      const prompt = `你是一位精通《孙子兵法十三篇》、古代战国秦汉谋攻与历代兵家注解（如曹操注、陈皞注、十一家注孙子）的军机阁臣。
现请针对下述特定【战争危机与战场局势】进行极其精深、高度具有古代古典美学特色与兵法术语实感的“专章评释与泰勒（Tailored）战术指点”。

当前军情：
- 战局剧本: ${scenarioTitle}
- 守军实兵状态: ${JSON.stringify(troops)}
- 战场环境与背景: ${scenarioBackground}

请选取《孙子兵法》中最深切对应的 2 个篇章（如《九地篇》、《虚实篇》、《谋攻篇》、《军争篇》、《用间篇》、《兵势篇》或《九变篇》等），并为该局势提供直达痛底的破敌生存良谋。

请必须在返回中提供高雅正统、充满古风文言韵味的极高品质回答，且必须返回以下纯 JSON 结构的数据。确保只返回纯 JSON，不能包裹任何 Markdown 标记（例如绝不能使用 \`\`\`json 开头）或者回复性多余前缀：
{
  "applicableChapters": [
    {
      "chapterName": "《某某篇》（例如《虚实篇》或《兵势篇》）",
      "chapterNum": "篇章序号（例如“第六”或“第五”）",
      "quote": "最对应的一句孙子原文，带有注音或标点",
      "guidance": "结合该战争危机，具体针对性指点将领在此特定段落应该如何运用此篇哲理。字数130字以内，文笔古色古香、富有中国古典军书训谕风格。"
    },
    {
      "chapterName": "《另一篇》",
      "chapterNum": "篇章序号",
      "quote": "最对应的一句孙子原文",
      "guidance": "具体针对性应用释义，字数130字以内。"
    }
  ],
  "strategicAdvices": [
    "战术策应1（不超过40字，极佳兵法实感）",
    "战术策应2（不超过40字，极佳兵法实感）",
    "战术策应3（不超过40字，极佳兵法实感）"
  ],
  "hegemonDict": "主帅统御全局的点评语（100字左右，具有大内阁重臣之威仪严峻、冷峻高深，不落俗套）"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      let responseText = response.text || "";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Gemini scenario analysis failure: ", error);
      res.status(500).json({ error: "无法研习兵法危机密册，请检查 API 密钥或系统负载。" });
    }
  });

  app.post("/api/gemini/evaluate", async (req, res) => {
    const { scenario, troopStats, playerAction, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ 
        isDemoFallback: true,
        verdict: "兵法默证",
        survivalChance: 75,
        classicQuote: "《孙子兵法·虚实篇》：“能因敌变化而取胜者，谓之神。”",
        critique: "（本地沙盒演示 fallback：请配置 GEMINI_API_KEY 后启用实时 AI 军机决策）虽然未能智胜 AI，但将领坚壁据防、避实击虚。此策以奇正佐之，固守粮道即可制胜寇军。",
        remedy: "后军设伏尘火，多备强弩，以御敌军轻骑对辎重的切断。"
      });
    }

    try {
      const client = getAiClient();
      if (!client) {
        throw new Error("AI client could not be initialized.");
      }

      const prompt = `你是一位精通《孙子兵法十三篇》与古代战役史、王朝生存哲学的军机处执笔官。
现在朝堂执政集团面临以下【战争与生存危机】：
- 战场剧本: ${scenario}
- 守军实兵状态: ${JSON.stringify(troopStats)}
- 历史生存履历: ${JSON.stringify(history)}

玩家（当前代行主帅）拟定了以下【兵法生存应对方案】：
"${playerAction}"

请根据《孙子兵法》的虚实、奇正、九地、用间、谋攻、避利、军争等核心生存哲学，对玩家的军事行动做出极高质量、高度写实复古、深含智谋深度的兵法判评。

请返回符合以下结构的 JSON 格式数据，确保只返回纯 JSON，不能包裹任何 Markdown 标记或者多余前缀，必须可以直接被 JSON.parse 解析：
{
  "verdict": "主上批复。4个字以内，例如：上兵伐谋、取死之道、奇险奇胜、兵贵神速 等",
  "survivalChance": 20到100之间的整数百分比，表示此次决策下的主力精锐存活率,
  "classicQuote": "《孙子兵法·[某篇]》原文中最贴切的一句话",
  "critique": "200字以内的深切评判。指点该招式在兵法虚实、奇正及生存利害上的漏洞或妙处，富有中国古代军书笔法，语气严峻冷静、见地透彻。",
  "remedy": "100字以内的临急战术补救方案，告诉将领如何防止此策引起的反噬。"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      let responseText = response.text || "";
      // Clean up markdown block if model accidentally included it
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Gemini eval failure: ", error);
      res.status(200).json({ 
        isDemoFallback: true,
        verdict: "战术暂歇",
        survivalChance: 60,
        classicQuote: "《孙子兵法·计篇》：“兵者，诡道也。”",
        critique: `（引擎响应解析自理 fallback）行动收到：${playerAction}。战役迷雾下军官判定行动略显急躁。将领统配三军未尽全力，应着重审辨奇正。`,
        remedy: "向侧翼林泽高岗多探虚兵，提防伏击，撤退时衔枚结阵行军。"
      });
    }
  });

  app.post("/api/gemini/innovate", async (req, res) => {
    const { focusArea, customPrompt } = req.body;
    const cleanFocus = focusArea || "diplomacy";

    if (!process.env.GEMINI_API_KEY) {
      // High-fidelity local innovative designs fallback, avoiding red-ocean competition
      const fallbacks: Record<string, any> = {
        diplomacy: {
          conceptName: "《战纵九国》：异步连环纵横谍攻系统",
          tagline: "打破传统的‘点击送礼送好感’系统，构建基于AI行为剖析与假人设局的情报博弈",
          innovationRationale: "市面上类似SLG和历史策略游戏，外交基本沦落为‘数据刷好感，签订不侵犯条约’，单调且无趣。我们融合古代【谋攻、用间、离间、合纵连横】理念，设计一种‘异步疑兵外交’。你可以朝边界调动空营（假兵）对敌对AI宣示恐吓，或故意泄露假军机给盟友，诱使其出兵火并。AI不看数值，而用大模型时刻评测你的‘信用、多疑、果敢’画像，在绝密国书上用真正的心术进行纵横。合纵连横乃是一场真正的心理诡诈游戏！",
          coreLoop: [
            "【遣使行间】: 遣送细作潜入列国，建立多向情报网络，可密调军队布设空营诡局、故弄弦虚以虚张声势（无需真正甲兵，专破敌方探校）。",
            "【造虚指实】: 在大地图任意点散步谎称‘大帅正率师深入空虚，暗谋偷袭’，促使AI王权分兵护主，极速打乱其地缘据点对局阵形。",
            "【空白会盟】: 进行不附带成文契约的自由文书对酌、质子抵押或对赌联姻。用无纸文墨博弈，考验AI君主的历史心理底线与贪婪权重。"
          ],
          aiRoleDescription: "AI君主基于Gemini大语言模型扮演高度拟真的历史巨擘（如项羽之刚愎、刘邦之豁达、韩信之锋利）。它不仅计算双方实力数值，更实时阅读并审判您的拟外交文本语气、密商承诺、以及历史背叛指数，极速反馈出带有深刻王侯个性的自白、威胁及突发诡计行动。",
          pseudoCode: `// 疑兵离间博弈内核算法示意
interface DiplomaticAgentState {
  currentReputation: number; // 朝廷信望值
  scareFactor: number;       // 玩家边境佯攻恐吓度
  suspicionThreshold: number;// AI君王猜忌临界
}

function evaluateAIResponse(agent: DiplomaticAgentState, leakFidelity: number) {
  // 当佯攻恐吓叠加虚假军机置信度(leakFidelity)超过AI猜忌临界
  if (agent.scareFactor * leakFidelity > agent.suspicionThreshold) {
    return {
      decision: "FALLBACK_AND_CONCEDE",
      narrative: "【天演判】敌邦惊闻秦军百万衔枚夜渡，心智动摇，连夜割让三晋关口以求苟安。",
      cofferGift: 12000
    };
  }
  return {
    decision: "ATTACK_TO_PROBE",
    narrative: "【天演判】敌邦看穿虚兵，亲帅轻骑精装长驱直入，直捣函谷，防务承压！"
  };
}`,
          sandboxSimulationConfig: {
            variables: [
              { name: "佯攻威慑度 (Bluffing Intensity)", value: 65, min: 20, max: 100, unit: "%" },
              { name: "AI猜忌敏感度 (AI Suspicion Level)", value: 50, min: 10, max: 90, unit: "%" },
              { name: "情报密书可信度 (Intelligence Veracity)", value: 40, min: 0, max: 100, unit: "%" }
            ],
            testActionName: "🔮 密送「假防空城」军机文卷 诱敌合围",
            successLog: "💥 诱敌成功！敌盟谋臣力谏其主将速退防守黄河渡口，本朝【稳定度】提振 8%！",
            failLog: "❌ 敌将王离极具雄才识破诡计，斥其谋士为蠢材，正遣主力全速反扑秦川！",
            chanceFormula: "(bluffing * veracity) / suspicion"
          }
        },
        court: {
          conceptName: "《百家辩法》：百家辩律论争与律令铸鼎系统",
          tagline: "扬弃死板、教条的‘选择题断案’，体验诸子百家当堂激论，自创律条例律重塑各郡治理模型",
          innovationRationale: "一般策略游戏在廷议中都是系统弹出‘要不要斩杀贪官’，选A得钱、选B得名望。本系统首创【铸文法律、鼎立辩驳】。玩家代表秦廷丞相，面对重大帝国案件（如徭役失期、私盐走走私），会引起法家（李斯）、儒家（淳于越）、墨家代表在金殿之上激烈辩驳。玩家需选择两派的核心论点（提取自定义辞眼，如‘轻罪重刑’、‘仁孝为怀’、‘官督民营’）重新缀合，铸造出一尊‘青铜律令大鼎’，宣行各郡，彻底改变各阶级民众的好感度、税率与治安逻辑！",
          coreLoop: [
            "【听诉百家】: 金殿开辟百家争鸣，儒生陈古制、法家算治功、墨者呼兼爱。提取争辩主词作为卡牌元素。",
            "【合体铸鼎】: 玩家像卡牌组装一样拼接论点（如：【轻罪重刑】+【官课铁器】），自动形成极具法家霸道或儒家仁道色泽的法律名目。",
            "【万民宣化】: 宣诏诏颁九原、三川两郡，动态根据地方郡守个性，引发税额、徭役、兵源、动乱值的长期演进变化。"
          ],
          aiRoleDescription: "AI扮演满朝朱紫百官。李斯等重臣被注入大模型百家思想精髓，实时依据你的铸鼎律条例词进行驳斥或拜服。他们会引经据典（如《韩非子》或《尚书》），对你的律条进行“法律严密性”和“朝局平衡性”的两向硬核质问，让你体会伴君如伴虎、舌战群儒的政治战栗感。",
          pseudoCode: `// 百家辩法判定伪代码
interface DebateDilemma {
  populaceRebelRate: number; // 黎庶怨暴率
  treasuryIncome: number;    // 国库收成
}

function processEdictCombination(edictPillars: string[]) {
  let isLegalist = edictPillars.includes("轻罪重刑") || edictPillars.includes("官督平准");
  let isConfucian = edictPillars.includes("德主刑辅") || edictPillars.includes("约法三章");

  if (isLegalist && !isConfucian) {
    return {
      focus: "法家霸道",
      log: "⚠️ 秦法严苛！各郡官商行盐之利速入国库（+8k），但流亡劳役怨憎狂飙，咸阳稳定承压。",
      treasuryDelta: 8000,
      rebelDelta: 15
    };
  }
  return {
    focus: "儒墨怀柔",
    log: "🍃 仁义大兴！百姓休养生息，暴戾率锐减。然而富商巨室私自敛利（-4k），军队供饷将捉襟见肘。",
    treasuryDelta: -4000,
    rebelDelta: -12
  };
}`,
          sandboxSimulationConfig: {
            variables: [
              { name: "律令严苛度 (Edict Severeness)", value: 80, min: 10, max: 100, unit: "%" },
              { name: "儒生士子顺从度 (Confucian Compliance)", value: 45, min: 10, max: 95, unit: "%" },
              { name: "大商藏富比 (Wealth Hoarded by Merchants)", value: 55, min: 10, max: 100, unit: "%" }
            ],
            testActionName: "📜 合成「霸王令：行官铁专营而轻罪重刑」",
            successLog: "⚙️ 法威彰昭！富商垄断被击碎，国库瞬充 7,000 两！李斯大喜，直呼‘相国明断法度！’",
            failLog: "⚡ 百家愤慨！淳于越当殿绝食哀谏，关东诸郡怨气暴胀，【稳定度】暴跌 10%！",
            chanceFormula: "(severeness * compliance) / wealth"
          }
        },
        combat: {
          conceptName: "《战图金简》：古法奇正变势与烽燧信号弹道演算法",
          tagline: "摆脱传统 instant 斩杀，体验真实的战役迷雾、将令行军延迟与古汉‘奇正之变’宏观阵法",
          innovationRationale: "主流战棋游戏的兵力交火是极其机械的：‘左键点击，部队移动到格子，叮叮两下扣一千人。’ 本系统重构古战法【奇正相相生、击虚、势（Shi）之蓄存】。战争不存在即时同步，而是通过‘飞奴飞鹰、烽燧告急’，大帅发出的将令需要长达整整 2 个游戏沙盒回合的‘时间延迟’才能抵达前线王离、蒙恬大营。你必须料敌机先，在指令中‘编程’一套预设 reactive 预案（如：‘若斥候报有胡马绕侧突袭辎重，前军即刻合一化为正兵阻击，让后方隐蔽主力王翦伏兵作为奇兵一举掩杀’）。这就是兵法圣心真正的妙局！",
          coreLoop: [
            "【分列奇正】: 每一支军队出征前，必须分割成【正兵】（负责接敌抗线、暴漏位置）与【奇兵】（伏藏林木山峡、隐藏身姿）。",
            "【飞筒传简】: 编辑 reactive 防卫行动树链。由于时辰差存在，让将军根据即时变化的敌军风吹草动自动执行你的连环对冲锦囊。",
            "【地利扼攻】: 在函谷关、咸阳原、雁门口等古战遗址据守，根据隘口窄度与山地伏兵比例自动结算高倍率的【势值（Shi）】碰撞。"
          ],
          aiRoleDescription: "AI军队不再是无脑直冲，而是扮演懂《九地》和《九变》的极智将军。它会故意在正面暴露出弱小的诱饵军（佯退诱敌），并故意制造虚假的营火（增兵假象），考验大帅能否穿过战局迷雾敏锐捕捉到‘天机’所在，从而一决雄雄。",
          pseudoCode: `// 奇正相生 reactive 智能结算
interface ForceGroup {
  name: string;
  manpower: number;
  category: "ZHENG" | "QI"; // 正兵 or 奇兵
  isHidden: boolean;        // 是否处于兵法伏藏雾中
}

function processBattleTurn(zheng: ForceGroup, qi: ForceGroup, isAmbushTriggered: boolean) {
  if (isAmbushTriggered && qi.isHidden) {
    // 触发【奇正合击】，敌军崩溃
    return {
      result: "CHENG_BATTLE_VICTORY",
      damageDealtMultiplier: 3.5, // 极高伏击威能
      summary: "🔥 兵法天成！正兵合击牵制无误，奇兵蒙恬由暗谷狂袭突出，敌军三军尽溃！"
    };
  }
  return {
    result: "FRONT_STALEMATE",
    damageDealtMultiplier: 0.9,
    summary: "⚙️ frontal正面缠斗陷入泥沼。未在最佳侧翼埋伏奇兵，徒劳消耗本朝武卒甲兵。"
  };
}`,
          sandboxSimulationConfig: {
            variables: [
              { name: "奇兵伏藏隐形率 (Ambush Unit Stealth)", value: 85, min: 30, max: 100, unit: "%" },
              { name: "指令延迟时差 (Command Link Latency)", value: 65, min: 10, max: 100, unit: "刻" },
              { name: "本朝大军精气势值 (Total Army Momentum/Shi)", value: 50, min: 10, max: 100, unit: "势" }
            ],
            testActionName: "⚔️ 挥发兵简 兵设“正兵设防吸引，奇兵夹峭壁突击”",
            successLog: "🏁 奇正合爆！蒙家军穿插突击其后备粮库，胡铁骑断粮大走北漠，斩获首级三千！",
            failLog: "⚠️ 时差太长！主帅将令因河水暴发耽搁一刻钟，先锋已落入敌围，士卒溃散 12,000 人！",
            chanceFormula: "(stealth * momentum) / latency"
          }
        },
        economy: {
          conceptName: "《轻重国策》：管子轻重平准与盐铁盐池大博弈沙盘",
          tagline: "模拟真实的西汉大辩论、海路食碱、铁冶国专营及大商资本对局套利",
          innovationRationale: "传统国风模拟经营游戏都是简单的‘造农田、产粮食、换钱、升级建筑’，属于完全的‘单机基建堆砌’，极其容易同质化。本系统汲取春秋齐相管仲之《轻重学》与西汉《盐铁论》精元。模拟真实的‘多商品连锁浮动资本大地图’。你可以选择放开私盐（商业活力暴涨，但地方豪强起兵造反），也可以选择【官山海-盐铁专营】（暴利入库，但百姓苦盐恶劣，各郡暴动上升）。大商们会根据你的政策，用热钱在全国套汇逃税、炒作粮价，你可以创设‘平准平籴官署’，打一场真正的宏观冷战金融商战！",
          coreLoop: [
            "【官商平准】: 设立常平仓与国营平准署。当富商哄抬粮价，即开仓抛售，砸盘使其巨亏破产；粮贱时则高价平籴扶助桑农。",
            "【山海利权】: 设定盐铁等国策专营系数。可自由推演‘盐专、铁专、酒专、关榷’的多向资本政策配置。",
            "【商战豪夺】: 与大地图上临淄、吴会、邯郸的大富大贵豪商行会进行暗流套汇博弈，利用外汇、贴现率、铸钱成色击破其资本联盟。"
          ],
          aiRoleDescription: "AI行会和外国商人被注入极其贪婪和灵敏的本能。当你滥发钱币（导致通货膨胀、国家天命流失）或大收杂税时，他们会秘密地大举将资财兑换为关外金铤并暗中走私，甚至出资扶植各地农夫举事叛乱。你需要巧妙运营，运用金融巨手‘衡轻重、齐地利’降服他们。",
          pseudoCode: `// 轻重理财常平仓干预算法
interface ImperialEconomy {
  marketPriceOfGrain: number; // 当下粮市斗价 (文)
  coffersGold: number;        // 朝廷国帑 (黄金镒)
  peasantHappiness: number;   // 农夫士气
  granaryReserve: number;     // 帝国常平仓储粮额
}

function executePriceStabilize(eco: ImperialEconomy, sellRate: number) {
  if (eco.granaryReserve > 10000 && eco.marketPriceOfGrain > 150) {
    // 启动平准大抛售砸盘，抑制豪商囤积
    return {
      priceDelta: -45, // 粮价暴跌回落，平抑民怨
      peasantJoy: 15,
      granaryLoss: 8000,
      log: "🌾 常平仓开，巨米倾泻，成功砸穿豪商富贾之囤积居奇！百姓高呼吾皇万岁，暴乱消弭！"
    };
  }
  return {
    priceDelta: 10,
    peasantJoy: -10,
    granaryLoss: 0,
    log: "⚠️ 国库常平仓空虚无米！任由各郡豪商狼狈为奸乱炒物价，百姓嗷嗷待哺逃亡，怨声载道！"
  };
}`,
          sandboxSimulationConfig: {
            variables: [
              { name: "常平仓储粮额 (Stabilizing Grain Reserve)", value: 75, min: 10, max: 100, unit: "万石" },
              { name: "豪商热钱囤积度 (speculative Speculant Hotmoney)", value: 60, min: 20, max: 95, unit: "万贯" },
              { name: "大秦铸币铜纯度 (Imperial Coin Purity)", value: 50, min: 10, max: 100, unit: "%" }
            ],
            testActionName: "🪙 开启「管子轻重衡」：抛售帝国干预储备米，平准物价",
            successLog: "🌾 金融大捷！粮价暴跌，豪商世家炒作失败亏损数千两黄金，被迫缴械求和！国帑稳定！",
            failLog: "🛑 常平仓无米，铸钱 purity 太低，市面通货膨胀，百姓流失暴动，【稳定度】下挫 8%！",
            chanceFormula: "(grain * purity) / hotmoney"
          }
        }
      };

      return res.status(200).json({ ...fallbacks[cleanFocus], isDemoFallback: true });
    }

    try {
      const client = getAiClient();
      if (!client) {
        throw new Error("AI client could not be initialized.");
      }

      const prompt = `你是一位世界顶尖级的游戏系统设计总监与创意大师，专精于“打破同质化红海内卷、利用大语言模型AI底层逻辑结合中国古代宏观策略”的开脑洞游戏机制创新。
我们将针对当前的古风历史沙盘推演游戏（主题涉及《孙子兵法》、秦汉地缘、政治、大商世家及流民文化）进行一个特定领域的机制彻底革新。

待创新的领域: ${cleanFocus}
用户特定的补充想法/诉求: "${customPrompt || "要求极致打破传统，融入大语言模型的自主内容反应，绝不跟市面上换皮卡牌或挂机策略同质化"}"

请为该领域设计一整套富有革命级乐趣、兼顾中国古典兵道/治道美学、且能够将AI的原生大语言模型能力无缝结合到机制玩法的全新系统策划。

你必须提供文笔古雅、分析极为尖锐透彻、数据充实的策划专篇。
必须严格返回以下纯 JSON 结构的数据，绝不带任何 \`\`\`json Markdown 标记符或其他包装词，确保可以直接被 JSON.parse 解析：
{
  "conceptName": "全新创新系统的雅致霸气中文名（6字以内）",
  "tagline": "一句话核心宣传语（突出如何打破内卷和同质化，极具震撼力）",
  "innovationRationale": "详细剖析该领域在市面常见换皮策略游戏中的同质化、套路化弊病（如‘好感度点击送礼’、‘数值死板扣血’等），并详细解释我们的新系统是如何利用【大语言模型AI】或者中国古代宏观制度思想（如管子轻重学、战史延迟等）进行破天荒的玩法降维打击，使同行无法抄袭且极大激发玩家硬核口碑。字数大约300字，行文要求极具专业策划案的尖锐度、史识厚重感和极强的煽动性。",
  "coreLoop": [
    "【第一步核心步骤】: 名字加具体机制描述，强调玩家的体验转化（60-80字）",
    "【第二步核心步骤】: 50-80字",
    "【第三步核心步骤】: 50-80字"
  ],
  "aiRoleDescription": "详细解释在该机制中，当下的AI（如Gemini大语言模型）扮演了何等生力軍、或是动态内容生成的发动机（例如：AI在谈判中进行真实语境语义审核与情绪状态机维持、AI动态生成写实的百家辩词、或者是AI根据大地图大势扮演有极强个性自理角逐的异步竞争者）。字数约150字。",
  "pseudoCode": "提供一段极佳质感的、表现该玩法底层算法或核心逻辑的 TypeScript 伪代码或者 JSON 数据表达。要真实、具有高级感，注释文字要带古风或专业硬核风，字数大约 20-30 行。",
  "sandboxSimulationConfig": {
    "variables": [
      { "name": "核心参数名称1(带英文对照，如‘佯攻威慑度 (Bluffing Intensity)’)", "value": 75, "min": 10, "max": 100, "unit": "%" },
      { "name": "核心参数名称2(如‘AI猜忌敏感度’)", "value": 50, "min": 10, "max": 100, "unit": "%" },
      { "name": "核心参数名称3(如‘铸币纯度’)", "value": 60, "min": 10, "max": 100, "unit": "%" }
    ],
    "testActionName": "一个能反映该机制的交互测试动作名称，如‘📜 发动「霸王令」行官营铸鼎辩法’",
    "successLog": "当交互测试达成高概论成功时的生动反馈和战报文字，要代入属性影响。",
    "failLog": "当交互测试不慎失败时的反馈文字，体现被反噬的危机细节。",
    "chanceFormula": "用来运算在沙盒中触发成功概率的简易变量公式字（字符串格式，例如：‘(stealth * momentum) / latency’）"
  }
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      });

      let responseText = response.text || "";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Gemini innovation generation fails, sliding back: ", error);
      res.status(500).json({ error: "机制创新工坊运转阻滞，请稍呈重试。" });
    }
  });
  app.post("/api/chrono/trigger-event", async (req, res) => {
    const { year, branch, stability, mandate } = req.body;
    const cleanYear = Number(year) || -220;
    const cleanBranch = branch || "中华正史始祖轨";

    if (process.env.GEMINI_API_KEY) {
      try {
        const client = getAiClient();
        if (client) {
          const prompt = `你是一位深谙中国秦汉历史、秦朝百家旧说、战国割据、楚汉相争及《十三篇孙子兵法》的古代历史天演推演设计大师。
现请根据当前的仿真历史沙盘状态，动态生成一个对应年份与历史分叉线（世界线）的【随机历史危机或天赐丰登事件】。

当前沙盘状态:
- 仿真历史年份: BCE ${Math.abs(cleanYear)} 年 (公元前 ${Math.abs(cleanYear)} 年)
- 当前主导世界线分支: ${cleanBranch}
- 当前天命数: ${mandate || 50}%
- 当前自决稳定度: ${stability || 50}%

请根据此历史年岁和分支背景，生成一则高度逼真、史实或神话推演色彩浓厚、富含中国古典叙事风格的随机事件。事件类型必须从 ["famine", "rebellion", "harvest", "cosmic_omen", "policy_dispute"] 中任选其一。如果最近世界线安定，可促成“丰宿丰收”；如果是暴政横行，可能导致“民间怨念与叛乱”或“严重大饥荒”；陨星坠地、彗星掠空等属于“宇宙天兆天象” (cosmic_omen)；群臣谏言、执政方针争执属于“朝堂政策纠纷” (policy_dispute)。

请必须在返回中提供高风亮节、古雅考究的回答，且必须包含以下格式的纯 JSON 数据，绝不包含任何 markdown 包裹（绝不能包含 \`\`\`json 标记），必须可以直接被 JSON.parse 解析：
{
  "type": "famine, rebellion, harvest, cosmic_omen, 或 policy_dispute",
  "title": "充满秦汉古朴典籍质感的事件四字或六字标题",
  "desc": "120字以内的历史因果与情境故事叙述，说明在 BCE ${Math.abs(cleanYear)} 年及「${cleanBranch}」世界线下为什么会衍生此等变局。语气雄浑古拙、雅正端庄，呈现极强的朝代宿命感。",
  "impact": "一句简短的状态影响话，字数30字以内 (例如：‘诸侯怨念加重，赋税课税受跌，咸阳稳定性降低。’)",
  "stabilityImpact": -25到+25之间的整数百分比影响,
  "mandateImpact": -25到+25之间的整数百分比影响,
  "systemLog": "一句话作为游戏首页跑马灯滚动展示的震撼警报 (格式如：‘🚨 会稽流离：BCE ${Math.abs(cleanYear)} 年岁暮罹旱，会稽郡太守瞒报，饥肠辘辘者揭竿作乱！’)"
}`;

          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.85,
            },
          });

          let responseText = response.text || "";
          responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          return res.json(JSON.parse(responseText));
        }
      } catch (err) {
        console.error("Gemini random event generator fails, sliding to solid local engine: ", err);
      }
    }

    // High-fidelity local fallback event directory grouped by year stages
    // Stage 1: BCE -230 to BCE -221 (Qin Conquest / High Antiquity)
    const stage1Events = [
      {
        type: "harvest",
        title: "郑国灌渠万世开凿",
        desc: `公元前 ${Math.abs(cleanYear)} 年，虽前岁大兵交炽，然郑国渠开凿筑成，引泾水入洛。今岁关中四万余顷盐碱尽成沃野，亩收一钟，八百里秦川谷堆滔天，秦国粮草辎重大盛。`,
        impact: "渠灌沃野，国家军需暴涨，安定度大幅攀升。",
        stabilityImpact: 15,
        mandateImpact: 10,
        systemLog: "🌾 捷报：泾洛郑国渠功成大灌！关中盐碱化为天府粮仓，秦王兵粟大盛！"
      },
      {
        type: "famine",
        title: "晋阳三川蝗歉爆发",
        desc: `公元前 ${Math.abs(cleanYear)} 年，关中与三川诸郡遭蝗灾侵害，百里农稼尽墨。地方豪强大商趁机秘密囤积居奇，平民易子相食。秦王震怒，立拍大理御史开仓赈孤。`,
        impact: "蝗灾掠野导致平民食不果腹，关中稳定值下跌。",
        stabilityImpact: -18,
        mandateImpact: -8,
        systemLog: "🚨 警报：晋阳三川大旱下蝗虫蔽空！今岁民歉大饥，饥民夜宿逃亡！"
      },
      {
        type: "rebellion",
        title: "新郑故韩宗族聚众谋叛",
        desc: `公元前 ${Math.abs(cleanYear)} 年，新郑韩地遗族对秦吏极度愤恨，借用巫祝名义聚众千军，手持木叉连夜夺关。打出“兴韩复仇”旗号，颖川瞬时大乱，朝堂中大夫连夜谏言。`,
        impact: "颍川故韩遗部首倡举事反秦，前线驻军戒备。",
        stabilityImpact: -20,
        mandateImpact: -15,
        systemLog: "🔥 烽烟：新郑前韩室后裔连夜斩守杀更，聚众复汉！颍川郡戍守告急！"
      },
      {
        type: "cosmic_omen",
        title: "彗星掠心宿太史惊奏",
        desc: `公元前 ${Math.abs(cleanYear)} 年，宿月澄净，忽见彗星斜长五丈，通体赤红，横扫心星白虎之野。民间方术之士纷起妄传：‘秦王政穷兵黩武，天示戒警，兵戈当返。’`,
        impact: "赤气扫星，太史预警皇祚，满朝文武人心惶惶。",
        stabilityImpact: -10,
        mandateImpact: -15,
        systemLog: "🌌 凶兆：太史夜观彗星横穿心宿，民间儒生讹传秦运有亏，朝野惶恐！"
      },
      {
        type: "policy_dispute",
        title: "李信王翦伐楚廷争",
        desc: `公元前 ${Math.abs(cleanYear)} 年，秦主于咸阳大聚群臣商讨一战灭楚大计。少将李信锐意称‘仅需二十万众’，而宿将王翦力主‘非六十万卒不可’，两派激烈交心廷争，相持不决。`,
        impact: "大将兵学冲突，秦廷发兵策略意见分裂。",
        stabilityImpact: -8,
        mandateImpact: -5,
        systemLog: "⚖️ 廷辩：咸阳宫大开宿将廷议！李信极力讥刺王翦老朽，朝野伐兵陷入焦灼！"
      }
    ];

    // Stage 2: BCE -220 to BCE -210 (Zenith Empire / Mid Antiquity)
    const stage2Events = [
      {
        type: "harvest",
        title: "都江堰飞沙成都万登",
        desc: `公元前 ${Math.abs(cleanYear)} 年，蜀郡都江堰神迹渐昭，分流拒洪。今年蜀道两岸风调雨顺，成都平原尽舒谷浪，史称天府。大司农上表称蜀米一万石已安全由栈道运抵关中。`,
        impact: "蜀地蜀粮入咸阳，大幅稳固帝国大后方元气。",
        stabilityImpact: 18,
        mandateImpact: 14,
        systemLog: "🌾 捷报：蜀郡都江堰金沙泄洪，成都平原万顷农田皆喜，连日栈道运粮！"
      },
      {
        type: "famine",
        title: "关东驰道劳役爆发大饥",
        desc: `公元前 ${Math.abs(cleanYear)} 年，帝国大力修长城、筑驰道、筑阿房，抽调关东生力劳役余百万人。因春耕误期，暴雪降临致使关东饿殍塞野，十县萧条，逃亡者化为响马啸聚。`,
        impact: "徭役过度压榨导致关东百里田荒饥荒，民愤暴涨。",
        stabilityImpact: -25,
        mandateImpact: -18,
        systemLog: "🚨 警报：阿房骊山徭役耗尽万舍元气！春光田荒，冬日大雪横尸，流民无数！"
      },
      {
        type: "rebellion",
        title: "大泽乡斩木揭竿揭帜",
        desc: `公元前 ${Math.abs(cleanYear)} 年，渔阳戍卒九百人夜逢连天大雨，暴洪毁绝道路。因失期依法当斩，戍首陈胜、吴广激奋起义，折木为兵，高举‘大楚兴’红旗下呼应万钧！`,
        impact: "大泽乡惊天一呼，点燃天下反抗，关中威慑崩坏。",
        stabilityImpact: -30,
        mandateImpact: -25,
        systemLog: "🔥 惊变：大泽乡爆发首义！陈胜吴广揭红旗‘王侯将相宁有种乎’，天下激应！"
      },
      {
        type: "cosmic_omen",
        title: "陨石下东郡石刻惊宸",
        desc: `公元前 ${Math.abs(cleanYear)} 年，东郡有坠星飞火落地化石。野民惊见其上凿字刻语：‘始皇死而地分’。始皇勃然大怒，下谕廷尉将坠星四周几百平民尽皆捕杀连坐，天谴频发。`,
        impact: "谶言动摇帝国人心，始皇怒行残暴连坐。",
        stabilityImpact: -20,
        mandateImpact: -15,
        systemLog: "☄️ 凶言：陨星轰撞东郡！石上有篆刻‘始皇死而地分’，廷尉怒极连坐杀戮百里！"
      },
      {
        type: "policy_dispute",
        title: "淳于越淳说分封大争",
        desc: `公元前 ${Math.abs(cleanYear)} 年，咸阳寿宴上，博士淳于越上表高奏周室分封长久之制，力主罢废郡县。李斯上书激烈痛批谬误，直谏焚烧烧诸子邪说，朝堂诸生大乱。`,
        impact: "儒法大冲突，思想禁锢法令动摇了文士之心。",
        stabilityImpact: -10,
        mandateImpact: -10,
        systemLog: "📚 廷斗：始皇斥淳于越古法复辟谬论，李斯主张焚尽诸子！儒生士子连夜抗议！"
      }
    ];

    // Stage 3: BCE -209 to BCE -202 (Chu-Han War / Late Antiquity)
    const stage3Events = [
      {
        type: "harvest",
        title: "萧何留守关中竭饷大熟",
        desc: `公元前 ${Math.abs(cleanYear)} 年，楚汉鏖兵惨厉。萧何在废墟与渭河之畔重新厘正户籍，安抚流散，开凿灌渠。今秋关中喜遇罕见连年丰收，无数新兵饱食良谷驰援荥阳前线。`,
        impact: "关中后勤极度饱满大补，让统军政大增底力。",
        stabilityImpact: 20,
        mandateImpact: 16,
        systemLog: "🌾 捷报：关中在萧何主持下劝桑修补，粮食大丰收，充足兵饷急赴荥阳相持！"
      },
      {
        type: "famine",
        title: "彭城荥阳战区绝粒易相食",
        desc: `公元前 ${Math.abs(cleanYear)} 年，刘项于黄河两岸及荥阳反复绞杀两载。项王利用精骑屡夺汉军汉军甬道，使大军断粮，城中饥情爆裂，军兵相杀烹食，惨不忍睹。`,
        impact: "前线战火导致粮道断阻引发饥荒，战区几乎沦陷入死绝。",
        stabilityImpact: -22,
        mandateImpact: -12,
        systemLog: "🚨 警报：楚军奇兵屡斩荥阳两翼甬道！守城众将无粮，多处爆发兵变相食！"
      },
      {
        type: "rebellion",
        title: "会稽守通欲反项羽夺剑",
        desc: `公元前 ${Math.abs(cleanYear)} 年，江东风急。会稽郡守通见天下离叛，拟谋逆抗朝。楚将项氏谋伏武士，项羽大喝横剑，一击取下太守头颅。八千江东子弟怒吼西征，天惊石破！`,
        impact: "江东霸王项羽自此执鞭过江，楚营声威爆红。",
        stabilityImpact: -25,
        mandateImpact: -20,
        systemLog: "🔥 狼烟：项羽在吴中手刃会稽郡守！率江东八千铁骑浩浩过江，楚势大怒爆炎！"
      },
      {
        type: "cosmic_omen",
        title: "东井五星汇聚显天成",
        desc: `公元前 ${Math.abs(cleanYear)} 年，秋夜晴空如洗，奇观惊现：金、木、水、火、土五颗凶耀之星，异乎寻常地整齐聚拢在秦星野‘东井宿’。儒生及方士欢呼此乃‘新皇天下大成’。`,
        impact: "祥瑞耀天，天下群雄尽向汉主归命，士气暴涨。",
        stabilityImpact: 15,
        mandateImpact: 25,
        systemLog: "🌌 祥瑞：天现‘五星并聚东井’神兆！四海游侠术士皆惊称天命已归关中刘主！"
      },
      {
        type: "policy_dispute",
        title: "鸿门分我一杯羹廷争",
        desc: `公元前 ${Math.abs(cleanYear)} 年，中原对峙相持。项王怒言‘若不降，当烹太公’。汉王微笑答称‘昔日结义，吾翁即若翁，若烹之分我一杯羹’。两家谋臣对大帅言辞失和，内斗爆发。`,
        impact: "言词拉扯与高层博弈导致战线决策面临重大妥协分歧。",
        stabilityImpact: -12,
        mandateImpact: -8,
        systemLog: "🍷 争执：霸王怒骂烹太公，汉王谐言‘分一杯羹’！两边幕僚深切猜嫌，战局僵灼！"
      }
    ];

    // Select the optimal historical list based on current year range
    let selectedList = stage1Events;
    if (cleanYear >= -220 && cleanYear <= -210) {
      selectedList = stage2Events;
    } else if (cleanYear > -210) {
      selectedList = stage3Events;
    }

    // Add extra branch relevance to fallbacks
    let chosenEvent = selectedList[Math.floor(Math.random() * selectedList.length)];
    
    // Tailor to specific branch names for extra bespoke simulation weight
    if (cleanBranch.includes("千秋")) {
      chosenEvent = {
        ...chosenEvent,
        title: "万世神秦 · " + chosenEvent.title,
        desc: `【万世神秦世界线之演化分支】` + chosenEvent.desc
      };
    } else if (cleanBranch.includes("诸子")) {
      chosenEvent = {
        ...chosenEvent,
        title: "诸子共和 · " + chosenEvent.title,
        desc: `【诸子百家共和国世界线演化】` + chosenEvent.desc
      };
    } else if (cleanBranch.includes("楚霸")) {
      chosenEvent = {
        ...chosenEvent,
        title: "楚霸群豪 · " + chosenEvent.title,
        desc: `【西楚群雄割据封建世界线分支】` + chosenEvent.desc
      };
    }

    res.json(chosenEvent);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
