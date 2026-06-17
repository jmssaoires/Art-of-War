class_name AICommander
## aiCommander.gd → GDScript port. Enemy AI commander (敌将).
## Deterministic turn planning: attack / maneuver / cut-supply.
## Greedy commanders judge targets by *apparent* size, so a疑兵 decoy baits
## them into wasting a turn — deception is rewarded. AGGRESSIVE resists.

const MOVE_STEP_DEG := 0.03

const PROFILES := {
	"CAUTIOUS":   {"maxAttackers": 1,  "seesThroughDecoys": false, "cutsSupply": false},
	"BALANCED":   {"maxAttackers": 2,  "seesThroughDecoys": false, "cutsSupply": false},
	"AGGRESSIVE": {"maxAttackers": 99, "seesThroughDecoys": true,  "cutsSupply": true},
}


static func _apparent_size(u: Dictionary) -> int:
	return u.get("fakeDisguiseAsSize", u["size"]) if u["isFake"] else u["size"]


static func _is_combat_capable(u: Dictionary) -> bool:
	return not u["isDestroyed"] and not u["isRouted"] and not u["isFake"] and u["size"] > 0


## Plan a full turn. Returns { actions: Array } where each action is
## { kind: "ATTACK"/"MOVE"/"CUT_SUPPLY", unitId, targetId?, edgeId?, dLat?, dLng?, log }.
static func plan_enemy_turn(units: Array, nodes: Array, edges: Array, plan_side: String, enemy_side: String, enemy_capital_id: String, difficulty: String) -> Dictionary:
	var profile: Dictionary = PROFILES[difficulty]
	var actions: Array = []

	var own_units := units.filter(func(u): return u["side"] == plan_side and _is_combat_capable(u))
	var targets := units.filter(func(u): return u["side"] == enemy_side and not u["isDestroyed"] and u["size"] > 0)
	if own_units.is_empty():
		return {"actions": actions}

	var real_targets := targets.filter(func(t): return _is_combat_capable(t) or t["isFake"])

	# Strongest own units strike first.
	var attackers := own_units.duplicate()
	attackers.sort_custom(func(a, b): return a["size"] > b["size"])
	var attacks_issued := 0

	for attacker in attackers:
		if attacks_issued >= profile["maxAttackers"]:
			break
		if real_targets.is_empty():
			break
		var best := {}
		var best_score := -INF
		var best_dist := INF
		for t in real_targets:
			var s: float = float(t["size"]) if (profile["seesThroughDecoys"] and t["isFake"]) else float(_apparent_size(t))
			var d := SupplyEngine.haversine(attacker["lat"], attacker["lng"], t["lat"], t["lng"])
			if s > best_score or (s == best_score and d < best_dist):
				best = t
				best_score = s
				best_dist = d
		if best.is_empty():
			break
		var tgt_name: String = best.get("fakeDisguiseAsName", best["name"]) if best["isFake"] else best["name"]
		actions.append({
			"kind": "ATTACK",
			"unitId": attacker["id"],
			"targetId": best["id"],
			"log": "【敌将】%s 锁定 %s，挥军进击！" % [attacker["name"], tgt_name],
		})
		attacks_issued += 1

	# Non-attacking units advance toward the player capital.
	var capital := {}
	for n in nodes:
		if n["id"] == enemy_capital_id:
			capital = n
			break
	if not capital.is_empty():
		var attacker_ids := {}
		for a in actions:
			if a["kind"] == "ATTACK":
				attacker_ids[a["unitId"]] = true
		for u in own_units:
			if attacker_ids.has(u["id"]):
				continue
			var d_lat: float = capital["lat"] - u["lat"]
			var d_lng: float = capital["lng"] - u["lng"]
			var mag := sqrt(d_lat * d_lat + d_lng * d_lng)
			if mag < 1e-6:
				continue
			actions.append({
				"kind": "MOVE",
				"unitId": u["id"],
				"dLat": (d_lat / mag) * MOVE_STEP_DEG,
				"dLng": (d_lng / mag) * MOVE_STEP_DEG,
				"log": "【敌将】%s 向 %s 方向逼近。" % [u["name"], capital["name"]],
			})

	# Supply interdiction (不战而屈人之兵).
	if profile["cutsSupply"]:
		var target_edge := {}
		for e in edges:
			if not e["isCut"] and not e["isFake"] and (e["source"] == enemy_capital_id or e["target"] == enemy_capital_id):
				target_edge = e
				break
		if not target_edge.is_empty():
			var src_name := str(target_edge["source"])
			var tgt_name := str(target_edge["target"])
			for n in nodes:
				if n["id"] == target_edge["source"]: src_name = str(n["name"])
				if n["id"] == target_edge["target"]: tgt_name = str(n["name"])
			actions.append({
				"kind": "CUT_SUPPLY",
				"unitId": own_units[0]["id"],
				"edgeId": target_edge["id"],
				"log": "【敌将】奇兵断道：%s ↔ %s 粮道被截！" % [src_name, tgt_name],
			})

	return {"actions": actions}
