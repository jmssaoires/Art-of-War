class_name GameLoop
## gameLoop.gd → GDScript port.
## Phase cycle, unit helpers, haversine, fake-revelation, end-check, summary.

const PHASES := ["DEPLOY", "STRATEGIZE", "RESOLVE", "AFTERMATH"]
const SCOUT_REVEAL_RANGE_KM := 5.0


static func next_phase(current: String) -> String:
	var idx := PHASES.find(current)
	return PHASES[(idx + 1) % PHASES.size()]


static func phase_description(phase: String) -> String:
	match phase:
		"DEPLOY": return "布阵 — 部署兵力、安插细作、布置疑兵"
		"STRATEGIZE": return "运筹 — 下达军令、调兵遣将、施计用间"
		"RESOLVE": return "决胜 — 天机演算、兵锋交加、粮道争锋"
		"AFTERMATH": return "论功 — 清算战果、天命流转、史笔如铁"
	return ""


static func haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
	return SupplyEngine.haversine(lat1, lng1, lat2, lng2)


static func get_active_units(units: Array) -> Array:
	return units.filter(func(u): return not u["isDestroyed"])


static func get_allied_units(units: Array) -> Array:
	return get_active_units(units).filter(func(u): return u["side"] == "allied")


static func get_hostile_units(units: Array) -> Array:
	return get_active_units(units).filter(func(u): return u["side"] == "hostile")


## Enemy fake units appear as their disguise; everything else passes through.
static func get_visible_units(units: Array, viewer_side: String) -> Array:
	var out: Array = []
	for u in get_active_units(units):
		if u["isFake"] and u["side"] != viewer_side:
			var copy := (u as Dictionary).duplicate(true)
			copy["size"] = u.get("fakeDisguiseAsSize", u["size"])
			copy["name"] = u.get("fakeDisguiseAsName", u["name"])
			out.append(copy)
		else:
			out.append(u)
	return out


## { revealed: bool, byUnit: String }
static func check_fake_revelation(fake_unit: Dictionary, enemy_units: Array) -> Dictionary:
	if not fake_unit["isFake"]:
		return {"revealed": false, "byUnit": ""}
	for enemy in enemy_units:
		if enemy["isDestroyed"] or enemy["isRouted"]:
			continue
		var dist := haversine_distance(fake_unit["lat"], fake_unit["lng"], enemy["lat"], enemy["lng"])
		if dist <= SCOUT_REVEAL_RANGE_KM:
			return {"revealed": true, "byUnit": enemy["id"]}
	return {"revealed": false, "byUnit": ""}


## { isVictory, isDefeat, description } — state needs "units" and "turnNumber".
static func check_scenario_end(state: Dictionary, _allied_capital_id: String, _hostile_capital_id: String, max_turns: int) -> Dictionary:
	var allied := get_allied_units(state["units"])
	var hostile := get_hostile_units(state["units"])
	var allied_total := 0
	for u in allied: allied_total += u["size"]
	var hostile_total := 0
	for u in hostile: hostile_total += u["size"]

	var allied_capable := allied.filter(func(u): return not u["isRouted"])
	if allied_capable.is_empty() or allied_total <= 0:
		return {"isVictory": false, "isDefeat": true, "description": "全军覆没，社稷沦丧！"}

	var hostile_capable := hostile.filter(func(u): return not u["isRouted"])
	if hostile_capable.is_empty() or hostile_total <= 0:
		return {"isVictory": true, "isDefeat": false, "description": "敌军尽墨，天命所归！"}

	if state["turnNumber"] >= max_turns:
		return {"isVictory": false, "isDefeat": true, "description": "时限已至（%d回合），贻误战机，无功而返。" % max_turns}

	return {"isVictory": false, "isDefeat": false, "description": ""}


static func generate_turn_summary(state: Dictionary) -> String:
	var allied := get_allied_units(state["units"])
	var hostile := get_hostile_units(state["units"])
	var total_allied := 0
	for u in allied: total_allied += u["size"]
	var total_hostile := 0
	for u in hostile: total_hostile += u["size"]
	var cut_edges := 0
	for e in state["supplyGraph"]["edges"]:
		if e["isCut"]: cut_edges += 1
	var fake_units := 0
	for u in state["units"]:
		if u["isFake"] and not u["isDestroyed"]: fake_units += 1

	return "【第%d回合结算】 友军: %d部 %d人 | 敌军: %d部 %d人 | 断粮: %d道 | 疑兵: %d支" % [
		state["turnNumber"], allied.size(), total_allied, hostile.size(), total_hostile, cut_edges, fake_units
	]
