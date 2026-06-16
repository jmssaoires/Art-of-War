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
};

export default en;
