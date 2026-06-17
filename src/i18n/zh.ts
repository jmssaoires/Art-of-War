/**
 * 中文翻译表 — 简体中文 (Simplified Chinese)
 * 所有用户可见的文案，按模块分组。
 */

const zh: Record<string, string> = {

  // ══════════════════════════════════════════
  // 通用 UI
  // ══════════════════════════════════════════
  'ui.language': '语言',
  'ui.language.zh': '中文',
  'ui.language.en': 'English',
  'ui.close': '关闭',
  'ui.confirm': '确认',
  'ui.cancel': '取消',
  'ui.reset': '重置',
  'ui.retry': '再战一局',
  'ui.loading': '载入中...',

  // ══════════════════════════════════════════
  // 场景 HUD
  // ══════════════════════════════════════════
  'scenario.title': '围魏救赵',
  'scenario.subtitle': '公元前354年 · 齐魏争霸',
  'scenario.turn': '回合',
  'scenario.activeUnits': '部队',
  'scenario.supplyNodes': '节点',
  'scenario.mapCenter': '魏赵边境 · 大梁—邯郸战区',

  // ══════════════════════════════════════════
  // 游戏阶段
  // ══════════════════════════════════════════
  'phase.DEPLOY': '布阵 — 部署兵力、安插细作、布置疑兵',
  'phase.STRATEGIZE': '运筹 — 下达军令、调兵遣将、施计用间',
  'phase.RESOLVE': '决胜 — 天机演算、兵锋交加、粮道争锋',
  'phase.AFTERMATH': '论功 — 清算战果、天命流转、史笔如铁',

  // ══════════════════════════════════════════
  // 地图模式
  // ══════════════════════════════════════════
  'map.mode.default': '默认',
  'map.mode.supply': '补给',
  'map.mode.morale': '士气',
  'map.mode.territory': '势力',
  'map.mode.hint': '1-4切换',

  // ══════════════════════════════════════════
  // 地图 UI
  // ══════════════════════════════════════════
  'map.legend.allied': '齐/赵',
  'map.legend.hostile': '魏',
  'map.legend.deception': '疑兵',
  'map.view.allied': '齐/赵视角',
  'map.view.hostile': '魏军视角',
  'map.tip': '右键部队开菜单 | 1-4 切换地图模式',
  'map.tip.cutSupply': '点击补给线切断粮道',

  // ══════════════════════════════════════════
  // 选中单位面板
  // ══════════════════════════════════════════
  'unit.selected': '选中单位',
  'unit.none': '点击地图部队查看详情',
  'unit.none.sub': '右键部队打开命令菜单',
  'unit.faction.qi': '齐/赵联军',
  'unit.faction.wei': '魏军',
  'unit.label.fake': '疑兵',
  'unit.label.routed': '溃散',
  'unit.stat.name': '名称',
  'unit.stat.size': '兵力',
  'unit.stat.supply': '粮草',
  'unit.stat.morale': '士气',
  'unit.stat.attack': '攻',
  'unit.stat.defense': '防',
  'unit.stat.speed': '速',

  // ══════════════════════════════════════════
  // 军令面板
  // ══════════════════════════════════════════
  'command.title': '军令 · 预设',
  'command.deploy.hint': '部署疑兵（isFake单位）以迷惑魏军：',
  'command.deploy.placeholder': '疑兵营号，如：齐军右翼',
  'command.deploy.button': '部署疑兵（500人+50粮）',
  'command.deploy.size.5k': '5千',
  'command.deploy.size.10k': '1万',
  'command.deploy.size.20k': '2万',
  'command.deploy.size.40k': '4万',
  'command.strategize.hint': '选择己方部队后可执行：',
  'command.move.north': '↑ 北进',
  'command.move.south': '↓ 南移',
  'command.move.west': '← 西行',
  'command.move.east': '→ 东征',
  'command.attack.targets': '攻击目标',
  'command.special': '特殊行动',
  'command.scout': '斥候侦察',
  'command.cutSupply': '切断粮道',
  'command.resolve': '⚔️ 执行回合结算',
  'command.resolve.executing': '天机演算中...',
  'command.resolve.idle': '军令已毕，进入决胜阶段',
  'command.aftermath': '战事已毕，史记入册。',
  'command.nextPhase': '下一阶段',
  'command.weather': '天时',
  'command.weather.clear': '☀️ 晴',
  'command.weather.rain': '🌧️ 雨',
  'command.weather.wind': '💨 风',
  'command.weather.fog': '🌫️ 雾',
  'command.weather.change': '变天',

  // ══════════════════════════════════════════
  // 敌方 AI 统帅
  // ══════════════════════════════════════════
  'ai.commander': '敌将',
  'ai.cautious': '持重',
  'ai.balanced': '相机',
  'ai.aggressive': '凶悍',

  // ══════════════════════════════════════════
  // 右键菜单
  // ══════════════════════════════════════════
  'context.attack': '攻击',
  'context.scout': '派遣斥候侦察',

  // ══════════════════════════════════════════
  // 战斗日志
  // ══════════════════════════════════════════
  'log.title': '战报反馈流 · Combat Log',
  'log.waiting': '等待回合开始...',
  'log.count': '条记录',
  'log.unit.placeholder': '条',

  // ══════════════════════════════════════════
  // 战斗/补给动态日志
  // ══════════════════════════════════════════
  'log.supplyCut': '🔪 【断粮】粮道已被切断！',
  'log.supplyRestored': '🔄 【复通】粮道已恢复。',
  'log.fakeDeployed': '🎭 【疑兵】部署 {name}，在敌看来似有 {size} 之众！',
  'log.fakeRevealed': '💥 【识破】疑兵被{enemy}抵近识破，草人虚旗尽毁！',
  'log.unitMoved': '🚶 {name} 机动转移至 ({lat}, {lng})',
  'log.supplyCutUnit': '📉 【断粮】{name} 补给线断绝！士气暴跌至 {morale}，{state}',
  'log.supplyRestoredUnit': '📈 【补给】{name} 粮道畅通，士气恢复至 {morale}',
  'log.routed': '💀 【溃散】{name} 士气崩溃，士卒四散奔逃！',
  'log.panicContagion': '😱 【恐慌传染】{name} {reason} 士气 {penalty}',
  'log.scoutReport': '🔭 【斥候】{narrative}（置信度: {confidence}%）',
  'log.turnSummary': '【第{turn}回合结算】 友军: {alliedCount}部 {alliedSize}人 | 敌军: {hostileCount}部 {hostileSize}人 | 断粮: {cutEdges}道 | 疑兵: {fakeUnits}支',
  'log.phaseEnter': '⏭️ 进入「{phase}」阶段',
  'log.scenarioLoaded': '【系统】场景「{name}」载入完毕。共 {count} 支部队待命。',
  'log.resolveError': '⚠️ 天机演算受阻，请重试。',
  'log.victory': '🏆 【大捷】{description} 评级: {rank}',
  'log.defeat': '💀 【兵败】{description}',

  // ══════════════════════════════════════════
  // 战斗叙事
  // ══════════════════════════════════════════
  'combat.fakeAttacked': '⚔️ {defender}攻击{attacker}——发现营寨空虚无兵，白费力气！',
  'combat.fakeDefended': '⚔️ {attacker}突袭{defender}——草人虚旗应声而倒，此乃疑兵空营！',
  'combat.real': '⚔️ {attacker}与{defender}交锋！折损{attLoss}人，敌损{defLoss}人。',
  'combat.deathGround': '（死地血战，士气暴涨！）',

  // ══════════════════════════════════════════
  // 士气状态
  // ══════════════════════════════════════════
  'morale.sharp.name': '锐气',
  'morale.sharp.desc': '避其锐气。战力+25%',
  'morale.sluggish.name': '惰气',
  'morale.sluggish.desc': '两军相持，战力无起伏',
  'morale.retreat.name': '归气',
  'morale.retreat.desc': '归师勿遏。士气瓦解，战力-30%',
  'morale.state.high': '🟢 战意高昂',
  'morale.state.shaken': '🟡 军心动摇 (战力下降)',
  'morale.state.panic': '🔴 极度恐慌 (逃跑边沿)',
  'morale.state.routed': '⚫ 彻底溃散 (失去控制)',

  // ══════════════════════════════════════════
  // 九地 (Nine Lands)
  // ══════════════════════════════════════════
  'terrain.SCATTERED': '散地',
  'terrain.LIGHT': '轻地',
  'terrain.CONTENTIOUS': '争地',
  'terrain.FACILE': '交地',
  'terrain.FOCAL': '衢地',
  'terrain.HEAVY': '重地',
  'terrain.ENTRAPPING': '圮地',
  'terrain.FRONTIER': '围地',
  'terrain.DEATH': '死地',

  // ══════════════════════════════════════════
  // 胜利结算
  // ══════════════════════════════════════════
  'victory.title': '围魏救赵',
  'victory.rank.military': '军事优势',
  'victory.rank.supply': '补给完整',
  'victory.rank.deception': '欺骗效力',
  'victory.rank.mandate': '天命保全',

  // ══════════════════════════════════════════
  // 胜利等级标签
  // ══════════════════════════════════════════
  'rank.S': '全胜 — 不战而屈人之兵，善之善者也',
  'rank.A': '大捷 — 知彼知己，百战不殆',
  'rank.B': '小胜 — 胜可知而不可为',
  'rank.C': '惨胜 — 杀敌一千，自损八百',
  'rank.D': '败军 — 不知彼不知己，每战必殆',
  'rank.F': '覆军 — 亡国不可以复存，死者不可以复生',

  // ══════════════════════════════════════════
  // 孙子兵法原文 (英文模式下直接显示翻译)
  // ══════════════════════════════════════════
  'quote.S': '不战而屈人之兵，善之善者也。故上兵伐谋，其次伐交，其次伐兵，其下攻城。',
  'quote.A': '知彼知己者，百战不殆。故善战者，立于不败之地，而不失敌之败也。',
  'quote.B': '胜可知而不可为。不可胜者，守也；可胜者，攻也。',
  'quote.C': '杀敌一千，自损八百。故兵贵胜，不贵久。',
  'quote.D': '不知彼不知己，每战必殆。主不可以怒而兴师，将不可以愠而致战。',
  'quote.F': '亡国不可以复存，死者不可以复生。故明君慎之，良将警之。',

  // ══════════════════════════════════════════
  // 兵法卡牌
  // ══════════════════════════════════════════
  'card.qizheng.name': '奇正相生',
  'card.qizheng.quote': '以正合，以奇胜。故善出奇者，无穷如天地，不竭如江河。',
  'card.huogong.name': '火攻奇袭',
  'card.huogong.quote': '凡火攻有五：一曰火人，二曰火积，三曰火辎，四曰火库，五曰火队。',
  'card.wujian.name': '五间妙连',
  'card.wujian.quote': '凡用兵之法，必先知敌之细作。五间俱起，莫知其道。',
  'card.shangzhan.name': '商战垄断',
  'card.shangzhan.quote': '通天下之货，夺天下之利。治私盐重税之务，以实国课。',

  // ══════════════════════════════════════════
  // 单位名称 (场景预设)
  // ══════════════════════════════════════════
  'unit.qi_main': '齐军主力',
  'unit.zhao_garrison': '赵国防军',
  'unit.qi_supply': '齐军粮道',
  'unit.wei_siege': '魏军围城主力',
  'unit.wei_guard': '魏都守军',
  'unit.wei_supply': '魏军粮道',

  // ══════════════════════════════════════════
  // 人物名称
  // ══════════════════════════════════════════
  'person.sunbin': '孙膑',
  'person.pangjuan': '庞涓',
  'person.kingzhao': '赵王',
  'person.kingwei': '魏王守将',
  'person.qisupply': '齐军辎重营',
  'person.weisupply': '魏军辎重营',

  // ══════════════════════════════════════════
  // 补给节点名称
  // ══════════════════════════════════════════
  'node.daliang': '大梁 (魏都)',
  'node.handan': '邯郸 (赵都)',
  'node.qidepot': '齐军补给站',

  // ══════════════════════════════════════════
  // App 主标题与 HUD
  // ══════════════════════════════════════════
  'app.title': '《孙子》封建大战略推演本铺',
  'app.subtitle': '历史阵营霸权沙盒推演与实时军情网络',
  'app.status': '战役赛季就绪',
  'hud.mandate': '天命值',
  'hud.coffers': '国库金匮',
  'hud.coffers.unit': '镒',
  'hud.stability': '安邦稳定度',
  'auth.logout.button': '注销雅号',
  'auth.logout.title': '清空缓存，退回大门并开启新手引导',
  'sound.unmute.title': '开启古典背景声效',
  'sound.mute.title': '静音',

  // ══════════════════════════════════════════
  // 加载界面
  // ══════════════════════════════════════════
  'loading.text': '天演罗盘印信鉴别中...',

  // ══════════════════════════════════════════
  // 登录页
  // ══════════════════════════════════════════
  'login.title': '《孙子兵法》天演兵道本铺',
  'login.subtitle': '历史权谋与战术沙盒',
  'login.quote': '"兵者，国之大事也。死生之地，存亡之道，不可不察也。"',
  'login.tab.player': '布衣策士入营',
  'login.tab.admin': '大司马督阁',
  'login.field.nickname.label': '请输入或选定您的策士雅号',
  'login.field.nickname.placeholder': '请输入或选择雅号，如：苏秦...',
  'login.field.password.label': '请设置或填入通关密匙',
  'login.field.password.placeholder': '不少于六位之密匙',
  'login.register.check': '初次入朝，新立策士玉牌 (注册)',
  'login.monikers.label': '🛡️ 策事堂古贤大贤备选：',
  'login.button.submit': '送信入朝 · 即刻起誓',
  'login.admin.label': '大司马特权入阁密令',
  'login.admin.placeholder': '请输入密令和密钥 (suntzu666)',
  'login.admin.hint': '💡 操作员辅导：大司马主策划在与 AI 聊天或自主调试全篇核心机制（机制法典）与沙盒时纪速度等高级后台功能时，特以此凭据登录。',
  'login.admin.hint2': '默认测试体验密码为：',
  'login.admin.button': '盖鉴御命印信 · 督理总坛',
  'login.version': '永续数理沙盒系统版本 v2.9.2-发布版',
  'login.error.missing': '雅号与入朝密匙缺一不可',
  'login.error.tooshort': '防伪关防，密匙至少须为六字决',
  'login.error.alreadyRegistered': '此雅号已有录入，若为其主，请取消「新立玉牌」直登',
  'login.error.wrongPassword': '兵籍名册查实无此人，或主公记错密匙',
  'login.error.notFound': '未见其人档案，若初次造访，请勾选「新立玉牌」注册',
  'login.ready': '主公，天演已备。盖鉴启誓，即刻运筹天下！',

  // ══════════════════════════════════════════
  // 导航栏分类标题
  // ══════════════════════════════════════════
  'nav.category.tactical': '🎯 战局推演本署',
  'nav.category.court': '🏛️ 朝堂中枢大司马',
  'nav.category.faction': '⛓️ 军工刺客与世家大贾',

  // ══════════════════════════════════════════
  // 导航 Tab
  // ══════════════════════════════════════════
  'tab.map_battle.name': '真实地图作战 🌍',
  'tab.map_battle.desc': '神州实境战例与九地天演',
  'tab.timeline.name': '天命天演 📊',
  'tab.timeline.desc': '朝代兴衰大纪事与皇家施政断案',
  'tab.aristocrat.name': '九品门阀 (方向一)',
  'tab.aristocrat.desc': '动态推演世家与皇权的动态博弈',
  'tab.reform.name': '变法改革 (方向二)',
  'tab.reform.desc': '激进新政与各阶层反噬推演',
  'tab.succession.name': '宫廷夺嫡 (方向三)',
  'tab.succession.desc': '老皇帝幕后操控九子夺嫡大戏',
  'tab.tributary.name': '羁縻朝贡 (方向四)',
  'tab.tributary.desc': '天朝上国与周边藩国的朝贡体系推演',
  'tab.ideology.name': '诸子百家 (方向五)',
  'tab.ideology.desc': '帝国底层思想控制与排他性演化',
  'tab.landmerge.name': '土地兼并 (方向六)',
  'tab.landmerge.desc': '经济死结与流民大潮的周期律',
  'tab.secretpolice.name': '酷吏缇骑 (方向七)',
  'tab.secretpolice.desc': '特务政治与皇帝猜忌的恐怖平衡',
  'tab.factionalism.name': '结党营私 (方向八)',
  'tab.factionalism.desc': '科举取士与朋党之争内耗推演',
  'tab.famine.name': '漕运赈灾 (方向九)',
  'tab.famine.desc': '天灾常平仓与帝国经济生命线',
  'tab.vassal.name': '宗室削藩 (方向十)',
  'tab.vassal.desc': '推恩令与诸侯靖难的内战博弈',
  'tab.characternetwork.name': '权力图谱 (方向十一)',
  'tab.characternetwork.desc': 'CK3风格君臣羁绊与心理压力场',
  'tab.macroeconomy.name': '王朝经济 (方向十二)',
  'tab.macroeconomy.desc': 'V3风格盐铁宏观供需演化',
  'tab.policy_tree.name': '国策演进树 (方案A)',
  'tab.policy_tree.desc': '视觉化的节点政策树解锁系统',
  'tab.faction_parliament.name': '派系议政殿 (方案B)',
  'tab.faction_parliament.desc': 'V3式利益集团可视化席位图',
  'tab.reigns_swipe.name': '命运卡牌 (方案C)',
  'tab.reigns_swipe.desc': 'Reigns四维平衡左右滑动抉择',
  'tab.eu4_diplomacy.name': '地缘外交网 (方案D)',
  'tab.eu4_diplomacy.desc': 'EU4动态侵略扩张与包围网',
  'tab.logistics.name': '兵者：局 (地网后勤)',
  'tab.logistics.desc': 'AI驱动图论与大军摩擦系统',
  'tab.deception.name': '兵者：局 (诡道迷雾)',
  'tab.deception.desc': 'AI驱动虚假情报与心理战',
  'tab.weijiu_scenario.name': '围魏救赵 ⚔️🔥',
  'tab.weijiu_scenario.desc': '全场景整合：地图+补给+诡道+评分',
  'tab.multiplayer.name': '天命总坛 🌟',
  'tab.multiplayer.desc': '多人实时云端朝政对决',
  'tab.war_philosophy.name': '兵道生存 🔥',
  'tab.war_philosophy.desc': '以兵法为生存哲学的模拟推演',
  'tab.combat.name': '奇正军争 ⚔️',
  'tab.combat.desc': '虚实九地将领五危',
  'tab.trade.name': '大商世家 💰',
  'tab.trade.desc': '私盐垄断与阶层天梯',
  'tab.uprising_culture.name': '义军起义 🚩',
  'tab.uprising_culture.desc': '流民暴动与平叛镇压',
  'tab.gdd.name': '策划主编 📝',
  'tab.gdd.desc': '游戏核心设计与架构',

  // ══════════════════════════════════════════
  // 兵法卡牌（补充字段）
  // ══════════════════════════════════════════
  'card.qizheng.desc': '军争大略。开启后，暂时对战斗攻防及军备决策赋能。对于【真实地图】【奇正军争】【兵道生存】模块提供 35% 军力与胜战结算加权。',
  'card.qizheng.effect': '攻防胜战算率提高 35%',
  'card.huogong.desc': '绝道烧营。暂时提升战场爆发或反叛信仰。对于【义军信仰】模块之起义爆发及信仰转化速度提升 50% 极效倍率。',
  'card.huogong.effect': '起义传布/火攻摧防速度增加 50%',
  'card.wujian.desc': '谍谋幽玄。暂时强化细作刺采、离间攻心及结盟几率。对于【五间连环】【多边外交】【朝堂夺嫡】提供额定 45% 的情报突破胜算。',
  'card.wujian.effect': '五间探察/外交结交率提升 45%',
  'card.shangzhan.desc': '赋裕兵饷。暂时增调商业赋税效率及丰裕度。对于【大商世家】行商利息或【天命天演】财政分红增幅 40%。',
  'card.shangzhan.effect': '盐铁商课/帑藏年税分红提振 40%',
  'card.duration': '30S 持续',
  'card.expired': '持续威力消退，归于常法大盘。',
  'card.art': '兵法',

  // ══════════════════════════════════════════
  // 页脚
  // ══════════════════════════════════════════
  'footer.copyright': '© 《孙子》 封建大战略异步朝政策略游艺网盟 · 咸阳沙盘中枢本机',
  'footer.version': '网络枢纽版本: 拾叁·壹壹壹柒·大司马典藏版',
  'footer.location': '大本营执事指挥处: 咸阳相国府',
};

export default zh;
