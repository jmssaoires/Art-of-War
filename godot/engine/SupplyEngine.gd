class_name SupplyEngine
## supplyEngine.gd → GDScript port.
## BFS-based supply network + morale avalanche ("切断补给线 → 士气雪崩").
## Units / nodes / edges are plain Dictionaries mirroring the TS interfaces.

const PROVISIONS_PER_THOUSAND_TROOPS := 1
const PROVISIONS_DESPERATION_MULTIPLIER := 2
const PANIC_CONTAGION_RANGE_KM := 15.0
const PANIC_CONTAGION_MORALE_PENALTY := -10


static func haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
	var r := 6371.0
	var d_lat := deg_to_rad(lat2 - lat1)
	var d_lng := deg_to_rad(lng2 - lng1)
	var a := sin(d_lat / 2.0) ** 2 + cos(deg_to_rad(lat1)) * cos(deg_to_rad(lat2)) * sin(d_lng / 2.0) ** 2
	return r * 2.0 * atan2(sqrt(a), sqrt(1.0 - a))


## BFS connectivity from start node to target node, skipping cut/fake edges.
## Returns { connected: bool, path: Array[String], bottleneckEdgeId: String/"" }.
static func is_connected_to_supply(start_node_id: String, target_node_id: String, nodes: Array, edges: Array) -> Dictionary:
	if start_node_id == target_node_id:
		return {"connected": true, "path": [start_node_id], "bottleneckEdgeId": ""}

	var adj := {}
	for node in nodes:
		adj[node["id"]] = []
	for edge in edges:
		if not edge["isCut"] and not edge["isFake"]:
			if adj.has(edge["source"]):
				adj[edge["source"]].append([edge["target"], edge["id"]])
			if adj.has(edge["target"]):
				adj[edge["target"]].append([edge["source"], edge["id"]])

	var visited := {start_node_id: true}
	var parent := {}  # node -> [prevNode, edgeId]
	var queue: Array = [start_node_id]

	while not queue.is_empty():
		var current: String = queue.pop_front()
		if current == target_node_id:
			var path: Array = []
			var cursor: String = target_node_id
			var bottleneck := ""
			while cursor != "" and cursor != start_node_id:
				path.push_front(cursor)
				if parent.has(cursor):
					var p: Array = parent[cursor]
					if bottleneck == "":
						bottleneck = p[1]
					cursor = p[0]
				else:
					break
			path.push_front(start_node_id)
			return {"connected": true, "path": path, "bottleneckEdgeId": bottleneck}

		for pair in adj.get(current, []):
			var neighbor: String = pair[0]
			var edge_id: String = pair[1]
			if not visited.has(neighbor):
				visited[neighbor] = true
				parent[neighbor] = [current, edge_id]
				queue.append(neighbor)

	return {"connected": false, "path": [], "bottleneckEdgeId": ""}


static func find_nearest_supply_node(unit: Dictionary, nodes: Array, _side: String) -> Dictionary:
	var nearest := {}
	var min_dist := INF
	for node in nodes:
		if node["type"] != "capital" and node["type"] != "depot":
			continue
		var dist := haversine(unit["lat"], unit["lng"], node["lat"], node["lng"])
		if dist < min_dist:
			min_dist = dist
			nearest = node
	return nearest


## Morale category (matches MilitarySandbox). { name, bonus, desc }.
static func get_morale_category(m: float) -> Dictionary:
	if m >= 80:
		return {"name": "锐气", "bonus": 0.25, "desc": "避其锐气。战力+25%"}
	if m >= 40:
		return {"name": "惰气", "bonus": 0.0, "desc": "两军相持，战力无起伏"}
	return {"name": "归气", "bonus": -0.30, "desc": "归师勿遏。士气瓦解，战力-30%"}


## { nextMorale, nextState, supplyStatus, isRouted }
static func compute_morale(unit: Dictionary, supplied: bool) -> Dictionary:
	var next_morale: float = unit["morale"]
	var supply_status := ""
	if supplied:
		next_morale = min(100.0, next_morale + 5.0)
		supply_status = "✅ 畅通"
	else:
		next_morale -= 35.0
		supply_status = "❌ 断绝"

	var next_state := ""
	var is_routed := false
	if next_morale <= 0:
		next_morale = 0
		next_state = "⚫ 彻底溃散 (失去控制)"
		is_routed = true
	elif next_morale <= 30:
		next_state = "🔴 极度恐慌 (逃跑边沿)"
		is_routed = true
	elif next_morale <= 70:
		next_state = "🟡 军心动摇 (战力下降)"
	else:
		next_state = "🟢 战意高昂"

	return {"nextMorale": int(next_morale), "nextState": next_state, "supplyStatus": supply_status, "isRouted": is_routed}


static func compute_provisions_consumption(unit: Dictionary, supplied: bool) -> int:
	var base := int(ceil((float(unit["size"]) / 1000.0) * PROVISIONS_PER_THOUSAND_TROOPS))
	return base if supplied else base * PROVISIONS_DESPERATION_MULTIPLIER


## Full supply tick over all units. Returns { unitResults: Array, edgesCutThisTick: Array }.
static func run_supply_tick(units: Array, nodes: Array, edges: Array, allied_capital_id: String, hostile_capital_id: String) -> Dictionary:
	var unit_results: Array = []
	var edges_cut: Array = []

	for unit in units:
		if unit["isDestroyed"]:
			continue
		var capital_id := allied_capital_id if unit["side"] == "allied" else hostile_capital_id
		var connectivity := is_connected_to_supply(unit["id"], capital_id, nodes, edges)

		var at_supply_node := false
		for n in nodes:
			if haversine(unit["lat"], unit["lng"], n["lat"], n["lng"]) < 5.0:
				at_supply_node = true
				break
		var supplied: bool = at_supply_node or connectivity["connected"]

		var morale_result := compute_morale(unit, supplied)
		var provisions_consumed := compute_provisions_consumption(unit, supplied)

		var logs: Array = []
		var unit_name: String = unit["name"] + "[疑兵]" if unit["isFake"] else unit["name"]
		if not supplied:
			logs.append("📉 【断粮】%s 补给线断绝！士气暴跌至 %d，%s" % [unit_name, morale_result["nextMorale"], morale_result["nextState"]])
			if connectivity["bottleneckEdgeId"] != "":
				edges_cut.append(connectivity["bottleneckEdgeId"])
		elif unit["morale"] < 100:
			logs.append("📈 【补给】%s 粮道畅通，士气恢复至 %d" % [unit_name, morale_result["nextMorale"]])

		if morale_result["isRouted"] and not unit["isRouted"]:
			logs.append("💀 【溃散】%s 士气崩溃，士卒四散奔逃！" % unit_name)

		unit_results.append({
			"unitId": unit["id"],
			"wasSupplied": supplied,
			"moraleResult": morale_result,
			"provisionsConsumed": provisions_consumed,
			"logMessages": logs,
		})

	return {"unitResults": unit_results, "edgesCutThisTick": edges_cut}


## Contagious panic: live allies near newly-routed allies take a morale hit.
## newly_routed_ids: Array[String]. Returns Array of { unitId, penalty, reason }.
static func compute_panic_contagion(units: Array, newly_routed_ids: Array) -> Array:
	var contagion: Array = []
	for unit in units:
		if unit["isDestroyed"] or unit["isRouted"] or newly_routed_ids.has(unit["id"]):
			continue
		var total_penalty := 0
		var sources: Array = []
		for routed_id in newly_routed_ids:
			var routed: Dictionary = {}
			for u in units:
				if u["id"] == routed_id:
					routed = u
					break
			if routed.is_empty():
				continue
			var dist := haversine(unit["lat"], unit["lng"], routed["lat"], routed["lng"])
			if dist <= PANIC_CONTAGION_RANGE_KM and unit["side"] == routed["side"]:
				total_penalty += PANIC_CONTAGION_MORALE_PENALTY
				sources.append(routed["name"])
		if total_penalty < 0:
			contagion.append({
				"unitId": unit["id"],
				"penalty": total_penalty,
				"reason": "邻军 %s 溃散引发恐慌传染！" % "、".join(sources),
			})
	return contagion
