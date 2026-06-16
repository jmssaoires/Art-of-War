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
};

export default zh;
