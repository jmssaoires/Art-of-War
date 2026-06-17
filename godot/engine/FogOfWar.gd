class_name FogOfWar
## fogOfWar.gd → GDScript port. "兵者诡道也" — deception / advanced fog of war.

## scoutUnit. Returns { report: Dictionary, unitRevealed: bool }.
static func scout_unit(target_unit: Dictionary, scout: Dictionary, scout_competence: float = 50.0) -> Dictionary:
	var dist: float = SupplyEngine.haversine(float(target_unit["lat"]), float(target_unit["lng"]), float(scout["lat"]), float(scout["lng"]))
	var dist_factor: float = max(0.0, 1.0 - dist / (GameLoop.SCOUT_REVEAL_RANGE_KM * 3.0))
	var effective_confidence := int(min(100.0, round(dist_factor * 60.0 + scout_competence * 0.4)))

	var reported_size := 0
	var reported_name := ""
	var reported_side := "unknown"
	var is_deceived := false
	var narrative := ""
	var unit_revealed := false

	if target_unit["isFake"]:
		if effective_confidence >= 70:
			reported_size = 0
			reported_name = "【识破】%s（疑兵假人）" % target_unit["name"]
			reported_side = "unknown"
			is_deceived = false
			unit_revealed = true
			narrative = "斥候抵近侦察，发现%s营中尽是草人虚旗，乃疑兵之计！" % target_unit["name"]
		else:
			reported_size = target_unit.get("fakeDisguiseAsSize", target_unit["size"])
			reported_name = target_unit.get("fakeDisguiseAsName", target_unit["name"])
			reported_side = target_unit["side"]
			is_deceived = true
			narrative = "斥候遥望%s大营旌旗蔽日、烟尘滚滚，似有%d之众！" % [target_unit["name"], reported_size]
	else:
		reported_size = target_unit["size"]
		reported_name = target_unit["name"]
		reported_side = target_unit["side"]
		is_deceived = false
		narrative = "斥候确见%s实兵%d人，阵型严整。" % [target_unit["name"], reported_size]

	return {
		"report": {
			"unitId": target_unit["id"],
			"reportedSize": reported_size,
			"reportedName": reported_name,
			"reportedSide": reported_side,
			"confidence": effective_confidence,
			"isDeceived": is_deceived,
			"scoutNarrative": narrative,
		},
		"unitRevealed": unit_revealed,
	}


## All enemy-unit scout reports from the viewer's nearest scouts. Returns Array of report dicts.
static func generate_faction_scout_reports(all_units: Array, viewer_side: String, scout_competence: float = 50.0) -> Array:
	var reports: Array = []
	var viewer_units := all_units.filter(func(u): return u["side"] == viewer_side and not u["isDestroyed"] and not u["isRouted"])
	var target_units := all_units.filter(func(u): return u["side"] != viewer_side and not u["isDestroyed"])

	for target in target_units:
		var best_scout := {}
		var best_dist := INF
		for scout in viewer_units:
			var dist: float = SupplyEngine.haversine(float(target["lat"]), float(target["lng"]), float(scout["lat"]), float(scout["lng"]))
			if dist < best_dist:
				best_dist = dist
				best_scout = scout
		if not best_scout.is_empty():
			reports.append(FogOfWar.scout_unit(target, best_scout, scout_competence)["report"])
	return reports


## Fake-unit revelation by enemy proximity. Returns Array of
## { unitId, revealed, revealedByUnitId, revealedByUnitName }.
static func check_all_fake_revelations(all_units: Array) -> Array:
	var results: Array = []
	var fake_units := all_units.filter(func(u): return u["isFake"] and not u["isDestroyed"])
	var real_enemy_units := all_units.filter(func(u): return not u["isFake"] and not u["isDestroyed"] and u["side"] != "allied")

	for fake in fake_units:
		var revealed := false
		var revealed_by := ""
		for enemy in real_enemy_units:
			if enemy["side"] == fake["side"]:
				continue
			var dist: float = SupplyEngine.haversine(float(fake["lat"]), float(fake["lng"]), float(enemy["lat"]), float(enemy["lng"]))
			if dist <= GameLoop.SCOUT_REVEAL_RANGE_KM:
				revealed = true
				revealed_by = enemy["id"]
				break
		var revealed_by_name := ""
		if revealed_by != "":
			for u in all_units:
				if u["id"] == revealed_by:
					revealed_by_name = u["name"]
					break
		results.append({
			"unitId": fake["id"],
			"revealed": revealed,
			"revealedByUnitId": revealed_by,
			"revealedByUnitName": revealed_by_name,
		})
	return results


## combat_actions: Array of { attackerId, defenderId }.
static func compute_deception_stats(scout_reports: Array, combat_actions: Array, all_units: Array) -> Dictionary:
	var fake_units := all_units.filter(func(u): return u["isFake"] and not u["isDestroyed"])
	var fooled := scout_reports.filter(func(r): return r["isDeceived"])
	var fake_ids := {}
	for u in fake_units: fake_ids[u["id"]] = true
	var attacks_on_fakes := 0
	for a in combat_actions:
		if fake_ids.has(a["defenderId"]): attacks_on_fakes += 1
	return {
		"fakeUnitsDeployed": fake_units.size(),
		"fakeUnitsThatFooled": fooled.size(),
		"attacksOnFakeUnits": attacks_on_fakes,
		"realThreatsIgnored": max(0, combat_actions.size() - attacks_on_fakes),
	}
