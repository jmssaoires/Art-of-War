class_name VictoryScoring
## victoryScoring.gd → GDScript port. 全胜 4-category scoring (0-25 each, 100 max).

const RANK_THRESHOLDS := [
	{"rank": "S", "min": 90, "label": "全胜 — 不战而屈人之兵，善之善者也"},
	{"rank": "A", "min": 75, "label": "大捷 — 知彼知己，百战不殆"},
	{"rank": "B", "min": 60, "label": "小胜 — 胜可知而不可为"},
	{"rank": "C", "min": 40, "label": "惨胜 — 杀敌一千，自损八百"},
	{"rank": "D", "min": 20, "label": "败军 — 不知彼不知己，每战必殆"},
	{"rank": "F", "min": 0,  "label": "覆军 — 亡国不可以复存，死者不可以复生"},
]

const QUOTES_BY_RANK := {
	"S": "不战而屈人之兵，善之善者也。故上兵伐谋，其次伐交，其次伐兵，其下攻城。",
	"A": "知彼知己者，百战不殆。故善战者，立于不败之地，而不失敌之败也。",
	"B": "胜可知而不可为。不可胜者，守也；可胜者，攻也。",
	"C": "杀敌一千，自损八百。故兵贵胜，不贵久。",
	"D": "不知彼不知己，每战必殆。主不可以怒而兴师，将不可以愠而致战。",
	"F": "亡国不可以复存，死者不可以复生。故明君慎之，良将警之。",
}


static func _sum_size(units: Array, side: String, only_alive: bool) -> int:
	var total := 0
	for u in units:
		if u["side"] != side:
			continue
		if only_alive and u["isDestroyed"]:
			continue
		total += u["size"]
	return total


## state: { units, supplyGraph, scoutReports }. scenario: { initialUnits }.
static func compute_victory_score(state: Dictionary, scenario: Dictionary) -> Dictionary:
	var initial_units: Array = scenario["initialUnits"]
	var current_units: Array = state["units"]

	# ── 1. Military Dominance ──
	var init_allied := _sum_size(initial_units, "allied", false)
	var init_hostile := _sum_size(initial_units, "hostile", false)
	var cur_allied := _sum_size(current_units, "allied", true)
	var cur_hostile := _sum_size(current_units, "hostile", true)

	var enemies_destroyed_ratio := (float(init_hostile - cur_hostile) / init_hostile) if init_hostile > 0 else 1.0
	var own_preserved_ratio := (float(cur_allied) / init_allied) if init_allied > 0 else 1.0
	var military_dominance := int(round(min(25.0, enemies_destroyed_ratio * 15.0 + own_preserved_ratio * 10.0)))

	# ── 2. Supply Integrity ──
	var total_edges: int = state["supplyGraph"]["edges"].size()
	var cut_edges := 0
	for e in state["supplyGraph"]["edges"]:
		if e["isCut"]: cut_edges += 1
	var allied_units := current_units.filter(func(u): return u["side"] == "allied" and not u["isDestroyed"])
	var supplied_count := 0
	for u in allied_units:
		if u["provisions"] > 30: supplied_count += 1
	var supplied_ratio := (float(supplied_count) / allied_units.size()) if allied_units.size() > 0 else 0.0
	var enemy_cut_ratio := (float(cut_edges) / total_edges) if total_edges > 0 else 0.0
	var supply_integrity := int(round(min(25.0, supplied_ratio * 15.0 + enemy_cut_ratio * 10.0)))

	# ── 3. Deception Efficacy ──
	var fake_deployed := current_units.filter(func(u): return u["isFake"]).size()
	var fooled := (state["scoutReports"] as Array).filter(func(r): return r["isDeceived"]).size()
	var deception_efficacy := int(round(min(25.0, float(min(fake_deployed * 5, 10)) + float(min(fooled * 3, 10)) + 5.0)))

	# ── 4. Mandate Preservation ──
	var routed_count := 0
	for u in allied_units:
		if u["isRouted"]: routed_count += 1
	var routing_ratio := (float(routed_count) / allied_units.size()) if allied_units.size() > 0 else 1.0
	var enemy_bonus := 10.0 if enemies_destroyed_ratio > 0.8 else (7.0 if enemies_destroyed_ratio > 0.5 else 3.0)
	var mandate_preservation := int(round(min(25.0, (1.0 - routing_ratio) * 15.0 + enemy_bonus)))

	var total_score := military_dominance + supply_integrity + deception_efficacy + mandate_preservation
	var rank := "F"
	for t in RANK_THRESHOLDS:
		if total_score >= t["min"]:
			rank = t["rank"]
			break

	return {
		"totalScore": min(100, total_score),
		"categories": {
			"militaryDominance": military_dominance,
			"supplyIntegrity": supply_integrity,
			"deceptionEfficacy": deception_efficacy,
			"mandatePreservation": mandate_preservation,
		},
		"rank": rank,
		"sunTzuQuote": QUOTES_BY_RANK[rank],
	}


static func get_rank_label(rank: String) -> String:
	for t in RANK_THRESHOLDS:
		if t["rank"] == rank:
			return t["label"]
	return "未知"


static func get_rank_color(rank: String) -> Color:
	match rank:
		"S": return Color("ffe066")
		"A": return Color("fbbf24")
		"B": return Color("34d399")
		"C": return Color("60a5fa")
		"D": return Color("fb923c")
		"F": return Color("ef4444")
	return Color.WHITE
