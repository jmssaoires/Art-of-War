/**
 * English translation table
 * All user-visible strings, organized by module.
 * Sun Tzu quotes use Lionel Giles (1910) translation.
 */

const en: Record<string, string> = {

  // ══════════════════════════════════════════
  // General UI
  // ══════════════════════════════════════════
  'ui.language': 'Language',
  'ui.language.zh': '中文',
  'ui.language.en': 'English',
  'ui.close': 'Close',
  'ui.confirm': 'Confirm',
  'ui.cancel': 'Cancel',
  'ui.reset': 'Reset',
  'ui.retry': 'Fight Again',
  'ui.loading': 'Loading...',

  // ══════════════════════════════════════════
  // Scenario HUD
  // ══════════════════════════════════════════
  'scenario.title': 'Relieve Zhao by Besieging Wei',
  'scenario.subtitle': '354 BCE · Qi vs Wei',
  'scenario.turn': 'Turn',
  'scenario.activeUnits': 'Units',
  'scenario.supplyNodes': 'Nodes',
  'scenario.mapCenter': 'Wei-Zhao Border · Daliang–Handan Theater',

  // ══════════════════════════════════════════
  // Game Phases
  // ══════════════════════════════════════════
  'phase.DEPLOY': 'Deploy — Position troops, plant spies, set decoys',
  'phase.STRATEGIZE': 'Strategize — Issue orders, move troops, execute stratagems',
  'phase.RESOLVE': 'Resolve — Heaven calculates, blades clash, supply lines contend',
  'phase.AFTERMATH': 'Aftermath — Tally the score, mandate shifts, history inscribes',

  // ══════════════════════════════════════════
  // Map Modes
  // ══════════════════════════════════════════
  'map.mode.default': 'Default',
  'map.mode.supply': 'Supply',
  'map.mode.morale': 'Morale',
  'map.mode.territory': 'Territory',
  'map.mode.hint': '1-4 toggle',

  // ══════════════════════════════════════════
  // Map UI
  // ══════════════════════════════════════════
  'map.legend.allied': 'Qi/Zhao',
  'map.legend.hostile': 'Wei',
  'map.legend.deception': 'Decoy',
  'map.view.allied': 'Qi/Zhao View',
  'map.view.hostile': 'Wei View',
  'map.tip': 'Right-click unit for menu | 1-4 toggle map modes',
  'map.tip.cutSupply': 'Click supply line to sever',

  // ══════════════════════════════════════════
  // Selected Unit Panel
  // ══════════════════════════════════════════
  'unit.selected': 'Selected Unit',
  'unit.none': 'Click a unit on the map to inspect',
  'unit.none.sub': 'Right-click a unit for command menu',
  'unit.faction.qi': 'Qi/Zhao Coalition',
  'unit.faction.wei': 'Wei Army',
  'unit.label.fake': 'Decoy',
  'unit.label.routed': 'Routed',
  'unit.stat.name': 'Name',
  'unit.stat.size': 'Troops',
  'unit.stat.supply': 'Supply',
  'unit.stat.morale': 'Morale',
  'unit.stat.attack': 'ATK',
  'unit.stat.defense': 'DEF',
  'unit.stat.speed': 'SPD',

  // ══════════════════════════════════════════
  // Command Panel
  // ══════════════════════════════════════════
  'command.title': 'Orders',
  'command.deploy.hint': 'Deploy decoy units (isFake) to deceive Wei:',
  'command.deploy.placeholder': 'Decoy name, e.g. Qi Right Flank',
  'command.deploy.button': 'Deploy Decoy (500 men + 50 supply)',
  'command.deploy.size.5k': '5,000',
  'command.deploy.size.10k': '10,000',
  'command.deploy.size.20k': '20,000',
  'command.deploy.size.40k': '40,000',
  'command.strategize.hint': 'Select an allied unit to act:',
  'command.move.north': '↑ North',
  'command.move.south': '↓ South',
  'command.move.west': '← West',
  'command.move.east': '→ East',
  'command.attack.targets': 'Attack Targets',
  'command.special': 'Special Actions',
  'command.scout': 'Send Scout',
  'command.cutSupply': 'Sever Supply',
  'command.resolve': '⚔️ Execute Turn',
  'command.resolve.executing': 'Resolving...',
  'command.resolve.idle': 'Orders complete — enter Resolve phase',
  'command.aftermath': 'The battle is over. History records.',
  'command.nextPhase': 'Next phase',
  'command.weather': 'Weather',
  'command.weather.clear': '☀️ Clear',
  'command.weather.rain': '🌧️ Rain',
  'command.weather.wind': '💨 Wind',
  'command.weather.fog': '🌫️ Fog',
  'command.weather.change': 'Change',

  // ══════════════════════════════════════════
  // Enemy AI Commander
  // ══════════════════════════════════════════
  'ai.commander': 'Enemy AI',
  'ai.cautious': 'Cautious',
  'ai.balanced': 'Balanced',
  'ai.aggressive': 'Aggressive',

  // ══════════════════════════════════════════
  // Context Menu
  // ══════════════════════════════════════════
  'context.attack': 'Attack',
  'context.scout': 'Send Scout',

  // ══════════════════════════════════════════
  // Combat Log
  // ══════════════════════════════════════════
  'log.title': 'Combat Log',
  'log.waiting': 'Awaiting turn start...',
  'log.count': 'entries',
  'log.unit.placeholder': '',

  // ══════════════════════════════════════════
  // Combat / Supply Dynamic Logs
  // ══════════════════════════════════════════
  'log.supplyCut': '🔪 [CUT] Supply line severed!',
  'log.supplyRestored': '🔄 [RESTORED] Supply line reconnected.',
  'log.fakeDeployed': '🎭 [DECOY] {name} deployed — enemy sees {size} troops!',
  'log.fakeRevealed': '💥 [EXPOSED] Decoy discovered by {enemy} — straw dummies destroyed!',
  'log.unitMoved': '🚶 {name} moved to ({lat}, {lng})',
  'log.supplyCutUnit': '📉 [SUPPLY CUT] {name} supply severed! Morale plummets to {morale} — {state}',
  'log.supplyRestoredUnit': '📈 [SUPPLIED] {name} supply restored. Morale recovers to {morale}',
  'log.routed': '💀 [ROUTED] {name} morale collapsed — troops flee in panic!',
  'log.panicContagion': '😱 [PANIC] {name} {reason} Morale {penalty}',
  'log.scoutReport': '🔭 [SCOUT] {narrative} (Confidence: {confidence}%)',
  'log.turnSummary': '[Turn {turn}] Allied: {alliedCount} units, {alliedSize} men | Enemy: {hostileCount} units, {hostileSize} men | Cuts: {cutEdges} | Decoys: {fakeUnits}',
  'log.phaseEnter': '⏭️ Entering: {phase}',
  'log.scenarioLoaded': '[System] Scenario "{name}" loaded. {count} units deployed.',
  'log.resolveError': '⚠️ Resolution error — please retry.',
  'log.victory': '🏆 [VICTORY] {description} Rank: {rank}',
  'log.defeat': '💀 [DEFEAT] {description}',

  // ══════════════════════════════════════════
  // Combat Narratives
  // ══════════════════════════════════════════
  'combat.fakeAttacked': '⚔️ {defender} attacks {attacker} — the camp is empty! Wasted effort!',
  'combat.fakeDefended': '⚔️ {attacker} raids {defender} — straw men and painted flags collapse! A decoy!',
  'combat.real': '⚔️ {attacker} clashes with {defender}! Losses: {attLoss} vs {defLoss}.',
  'combat.deathGround': '(Death ground — desperate frenzy!)',

  // ══════════════════════════════════════════
  // Morale States
  // ══════════════════════════════════════════
  'morale.sharp.name': 'Sharp',
  'morale.sharp.desc': 'Avoid the sharp edge. +25% combat power',
  'morale.sluggish.name': 'Sluggish',
  'morale.sluggish.desc': 'Stalemate. No modifier',
  'morale.retreat.name': 'Retreating',
  'morale.retreat.desc': 'Do not obstruct retreating troops. -30% combat power',
  'morale.state.high': '🟢 High Spirits',
  'morale.state.shaken': '🟡 Shaken (reduced combat)',
  'morale.state.panic': '🔴 Panicked (verge of flight)',
  'morale.state.routed': '⚫ Routed (lost control)',

  // ══════════════════════════════════════════
  // Nine Lands (Sun Tzu Chapter 11)
  // ══════════════════════════════════════════
  'terrain.SCATTERED': 'Scattered Ground',
  'terrain.LIGHT': 'Light Ground',
  'terrain.CONTENTIOUS': 'Contentious Ground',
  'terrain.FACILE': 'Facile Ground',
  'terrain.FOCAL': 'Focal Ground',
  'terrain.HEAVY': 'Heavy Ground',
  'terrain.ENTRAPPING': 'Entrapping Ground',
  'terrain.FRONTIER': 'Frontier Ground',
  'terrain.DEATH': 'Death Ground',

  // ══════════════════════════════════════════
  // Victory Screen
  // ══════════════════════════════════════════
  'victory.title': 'Relieve Zhao by Besieging Wei',
  'victory.rank.military': 'Military Dominance',
  'victory.rank.supply': 'Supply Integrity',
  'victory.rank.deception': 'Deception Efficacy',
  'victory.rank.mandate': 'Mandate Preserved',

  // ══════════════════════════════════════════
  // Victory Rank Labels
  // ══════════════════════════════════════════
  'rank.S': 'S — Whole Victory: Subdue the enemy without fighting',
  'rank.A': 'A — Decisive Victory: Know the enemy and know yourself',
  'rank.B': 'B — Minor Victory: Victory can be known but not made',
  'rank.C': 'C — Pyrrhic Victory: Kill one thousand, lose eight hundred',
  'rank.D': 'D — Defeat: Know neither enemy nor self',
  'rank.F': 'F — Annihilation: A fallen kingdom cannot be restored',

  // ══════════════════════════════════════════
  // Sun Tzu Quotes (Lionel Giles translation)
  // ══════════════════════════════════════════
  'quote.S': 'To fight and conquer in all your battles is not supreme excellence; supreme excellence consists in breaking the enemy\'s resistance without fighting.',
  'quote.A': 'If you know the enemy and know yourself, you need not fear the result of a hundred battles.',
  'quote.B': 'What the ancients called a clever fighter is one who not only wins, but excels in winning with ease.',
  'quote.C': 'There is no instance of a country having benefited from prolonged warfare.',
  'quote.D': 'No ruler should put troops into the field merely to gratify his own spleen; no general should fight a battle simply out of pique.',
  'quote.F': 'A kingdom that has once been destroyed can never come again into being; nor can the dead ever be brought back to life.',

  // ══════════════════════════════════════════
  // Stratagem Cards
  // ══════════════════════════════════════════
  'card.qizheng.name': 'Qi & Zheng',
  'card.qizheng.quote': 'Engage the enemy with the orthodox, but secure victory with the unorthodox.',
  'card.huogong.name': 'Fire Attack',
  'card.huogong.quote': 'There are five ways of attacking with fire: burn soldiers, burn stores, burn baggage, burn arsenals, and use incendiary missiles.',
  'card.wujian.name': 'Five Spies',
  'card.wujian.quote': 'Knowledge of the enemy\'s dispositions can only be obtained from other men.',
  'card.shangzhan.name': 'Trade Monopoly',
  'card.shangzhan.quote': 'Control the goods of the realm and seize the profits of the empire.',

  // ══════════════════════════════════════════
  // Unit Names (scenario preset)
  // ══════════════════════════════════════════
  'unit.qi_main': 'Qi Main Army',
  'unit.zhao_garrison': 'Zhao Garrison',
  'unit.qi_supply': 'Qi Supply Train',
  'unit.wei_siege': 'Wei Siege Force',
  'unit.wei_guard': 'Wei Capital Guard',
  'unit.wei_supply': 'Wei Supply Train',

  // ══════════════════════════════════════════
  // Character Names
  // ══════════════════════════════════════════
  'person.sunbin': 'Sun Bin',
  'person.pangjuan': 'Pang Juan',
  'person.kingzhao': 'King of Zhao',
  'person.kingwei': 'Wei Garrison Commander',
  'person.qisupply': 'Qi Logistics Corps',
  'person.weisupply': 'Wei Logistics Corps',

  // ══════════════════════════════════════════
  // Supply Node Names
  // ══════════════════════════════════════════
  'node.daliang': 'Daliang (Wei Capital)',
  'node.handan': 'Handan (Zhao Capital)',
  'node.qidepot': 'Qi Supply Depot',

  // ══════════════════════════════════════════
  // App Title & HUD
  // ══════════════════════════════════════════
  'app.title': 'Sun Tzu — Feudal Grand Strategy Sandbox',
  'app.subtitle': 'Historical faction hegemony simulation & real-time intelligence network',
  'app.status': 'Campaign Season Ready',
  'hud.mandate': 'Mandate',
  'hud.coffers': 'Treasury',
  'hud.coffers.unit': 'gold',
  'hud.stability': 'Stability',
  'auth.logout.button': 'Log Out',
  'auth.logout.title': 'Clear cache and return to login',
  'sound.unmute.title': 'Enable classical audio',
  'sound.mute.title': 'Mute',

  // ══════════════════════════════════════════
  // Loading Screen
  // ══════════════════════════════════════════
  'loading.text': 'Validating strategist credentials...',

  // ══════════════════════════════════════════
  // Login Page
  // ══════════════════════════════════════════
  'login.title': "Sun Tzu's Art of War — Grand Strategy Sandbox",
  'login.subtitle': 'Historical Intrigue & Tactical Simulation',
  'login.quote': '"War is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin."',
  'login.tab.player': 'Warlord Login',
  'login.tab.admin': 'Grand Marshal',
  'login.field.nickname.label': 'Enter your warlord name',
  'login.field.nickname.placeholder': 'e.g. Sun Bin, Zhang Yi...',
  'login.field.password.label': 'Set or enter your password',
  'login.field.password.placeholder': 'Minimum 6 characters',
  'login.register.check': 'New account (Register)',
  'login.monikers.label': '🛡️ Suggested historical names:',
  'login.button.submit': 'Enter the Court',
  'login.admin.label': 'Grand Marshal passcode',
  'login.admin.placeholder': 'Enter passcode (suntzu666)',
  'login.admin.hint': '💡 Developer note: the Grand Marshal account unlocks the GDD editor, AI mechanic tools, and timeline speed controls.',
  'login.admin.hint2': 'Default test passcode: ',
  'login.admin.button': 'Enter as Grand Marshal',
  'login.version': 'Perpetual Sandbox v2.9.2-release',
  'login.error.missing': 'Warlord name and password are both required',
  'login.error.tooshort': 'Password must be at least 6 characters',
  'login.error.alreadyRegistered': 'This name is already taken — uncheck "New Account" to log in',
  'login.error.wrongPassword': 'No matching record — check your credentials',
  'login.error.notFound': 'No account found — check "New Account" to register',
  'login.ready': 'My lord, the simulation awaits. Swear the oath and command your forces!',

  // ══════════════════════════════════════════
  // Navigation Category Headers
  // ══════════════════════════════════════════
  'nav.category.tactical': '🎯 Grand Strategy Sandbox',
  'nav.category.court': '🏛️ Imperial Court Command',
  'nav.category.faction': '⛓️ Guilds & Merchants',

  // ══════════════════════════════════════════
  // Navigation Tabs
  // ══════════════════════════════════════════
  'tab.map_battle.name': 'Real-World Battle Map 🌍',
  'tab.map_battle.desc': 'Historical campaigns and Nine Lands terrain',
  'tab.timeline.name': 'Dynasty Engine 📊',
  'tab.timeline.desc': 'Rise and fall chronicle with imperial governance',
  'tab.aristocrat.name': 'Nine Ranks Clans (Dir. 1)',
  'tab.aristocrat.desc': 'Dynamic noble–imperial power struggle',
  'tab.reform.name': 'Dynastic Reform (Dir. 2)',
  'tab.reform.desc': 'Radical reforms and multi-faction backlash',
  'tab.succession.name': 'Imperial Succession (Dir. 3)',
  'tab.succession.desc': 'Aging emperor orchestrates the nine-prince contest',
  'tab.tributary.name': 'Tributary System (Dir. 4)',
  'tab.tributary.desc': 'The Middle Kingdom and its vassal tribute network',
  'tab.ideology.name': 'Hundred Schools (Dir. 5)',
  'tab.ideology.desc': 'Imperial ideological control and rival philosophies',
  'tab.landmerge.name': 'Land Merger (Dir. 6)',
  'tab.landmerge.desc': 'Economic deadlock and peasant migration cycles',
  'tab.secretpolice.name': 'Secret Police (Dir. 7)',
  'tab.secretpolice.desc': 'Imperial spy networks and the balance of terror',
  'tab.factionalism.name': 'Court Factions (Dir. 8)',
  'tab.factionalism.desc': 'Bureaucratic factionalism and imperial infighting',
  'tab.famine.name': 'Famine Relief (Dir. 9)',
  'tab.famine.desc': 'Granary logistics and imperial economic lifelines',
  'tab.vassal.name': 'Vassal Pacification (Dir. 10)',
  'tab.vassal.desc': 'Enfeoffment edicts and princely civil wars',
  'tab.characternetwork.name': 'Power Network (Dir. 11)',
  'tab.characternetwork.desc': 'CK3-style lord–vassal bonds and psychological stress',
  'tab.macroeconomy.name': 'Dynastic Economy (Dir. 12)',
  'tab.macroeconomy.desc': 'V3-style salt-iron supply and demand simulation',
  'tab.policy_tree.name': 'Policy Tree (Option A)',
  'tab.policy_tree.desc': 'Visual node-based policy unlock system',
  'tab.faction_parliament.name': 'Parliament (Option B)',
  'tab.faction_parliament.desc': 'V3-style interest group seat visualization',
  'tab.reigns_swipe.name': 'Fate Cards (Option C)',
  'tab.reigns_swipe.desc': 'Reigns-style four-axis balance swipe decisions',
  'tab.eu4_diplomacy.name': 'Geopolitical Network (Option D)',
  'tab.eu4_diplomacy.desc': 'EU4-style aggression, expansion, and encirclement',
  'tab.logistics.name': 'Art of War: Net (Logistics)',
  'tab.logistics.desc': 'AI-driven graph theory and army friction',
  'tab.deception.name': 'Art of War: Net (Deception)',
  'tab.deception.desc': 'AI-driven false intelligence and psychological warfare',
  'tab.weijiu_scenario.name': 'Relieve Zhao by Besieging Wei ⚔️🔥',
  'tab.weijiu_scenario.desc': 'Full integration: map + supply + deception + scoring',
  'tab.multiplayer.name': 'Grand Hall 🌟',
  'tab.multiplayer.desc': 'Real-time multiplayer cloud governance',
  'tab.war_philosophy.name': 'Art of War Survival 🔥',
  'tab.war_philosophy.desc': 'Sun Tzu philosophy as survival simulation',
  'tab.combat.name': 'Unorthodox Warfare ⚔️',
  'tab.combat.desc': 'Nine Lands, Five Dangers, and general attributes',
  'tab.trade.name': 'Merchant Dynasties 💰',
  'tab.trade.desc': 'Salt monopoly and social class ladder',
  'tab.uprising_culture.name': 'Peasant Uprising 🚩',
  'tab.uprising_culture.desc': 'Peasant revolts and imperial suppression',
  'tab.gdd.name': 'Game Designer 📝',
  'tab.gdd.desc': 'Core game design and architecture',

  // ══════════════════════════════════════════
  // Stratagem Cards (supplementary fields)
  // ══════════════════════════════════════════
  'card.qizheng.desc': 'Grand strategy. Temporarily empowers combat and military decisions. Grants 35% military bonus for Battle Map, Unorthodox Warfare, and Art of War Survival modules.',
  'card.qizheng.effect': '+35% combat and victory rate',
  'card.huogong.desc': 'Fire and ambush. Temporarily boosts battlefield burst or rebellion. Increases uprising and belief conversion rate by 50% in the Peasant Uprising module.',
  'card.huogong.effect': '+50% uprising spread and fire attack rate',
  'card.wujian.desc': 'Espionage mastery. Temporarily boosts spy operations, subversion, and alliance chances. Provides 45% intelligence breakthrough for Five Spies, Diplomacy, and Succession modules.',
  'card.wujian.effect': '+45% spy and diplomatic success rate',
  'card.shangzhan.desc': 'Commercial dominance. Temporarily boosts tax efficiency and treasury. Increases merchant interest for Merchant Dynasties or treasury dividends in Dynasty Engine by 40%.',
  'card.shangzhan.effect': '+40% tax and treasury dividend',
  'card.duration': '30s active',
  'card.expired': 'has expired — returning to standard operations.',
  'card.art': 'Art',

  // ══════════════════════════════════════════
  // Footer
  // ══════════════════════════════════════════
  'footer.copyright': '© Art of War · Feudal Grand Strategy Async Governance · Local Xianyang Sandbox',
  'footer.version': 'Network Version: XIII·1117·Grand Marshal Edition',
  'footer.location': "Command HQ: Xianyang Chancellor's Office",
};

export default en;
