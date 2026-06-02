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
