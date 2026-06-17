extends SceneTree
## Headless numeric correctness tests for the GDScript engine port.
## Run: godot --headless -s res://test_engine.gd
## Pass criterion: all lines are ✅, final line is ENGINE_TEST_OK.

var _pass := 0
var _fail := 0


func _assert_eq(label: String, got, expected) -> void:
	if got == expected:
		print("  ✅ %s" % label)
		_pass += 1
	else:
		print("  ❌ %s: got=%s  expected=%s" % [label, str(got), str(expected)])
		_fail += 1


func _assert_true(label: String, cond: bool) -> void:
	if cond:
		print("  ✅ %s" % label)
		_pass += 1
	else:
		print("  ❌ %s: condition was false" % label)
		_fail += 1


func _make_unit(over: Dictionary) -> Dictionary:
	var u := {
		"id": "u", "name": "部队", "side": "allied",
		"lat": 35.0, "lng": 114.5, "size": 10000,
		"provisions": 100, "morale": 80, "isFake": false,
		"creatorUid": "test", "creatorName": "test",
		"attackPower": 60, "defensePower": 60, "speed": 10,
		"isRouted": false, "isDestroyed": false,
	}
	for k in over:
		u[k] = over[k]
	return u


func _initialize() -> void:
	# ── 1. COMBAT: FOCAL/CLEAR baseline ──────────────────────────────────────
	# a_eff_atk = max(1, round(30000 * 0.75 * 1.0 * 1.25 * 1.0 * 1.0)) = 28125
	# d_eff_atk = max(1, round(15000 * 0.60 * 1.0 * 1.00 * 1.0 * 1.0)) =  9000
	# attacker_losses = min(29999, round(9000 / max(1, 1/10)))  =  9000
	# defender_losses = min(14999, round(28125 / max(1, 1/10))) = 14999
	print("==== 1. COMBAT FOCAL/CLEAR ====")
	var atk := _make_unit({"id": "a", "name": "齐军", "side": "allied",
		"size": 30000, "attackPower": 75, "morale": 85})
	var dfn := _make_unit({"id": "d", "name": "魏军", "side": "hostile",
		"size": 15000, "defensePower": 75, "morale": 70})
	var r1 := CombatEngine.resolve_combat({"attacker": atk, "defender": dfn,
		"terrain": "FOCAL", "weather": "CLEAR"})
	_assert_eq("attackerSurvivingSize", r1["attackerSurvivingSize"], 21000)
	_assert_eq("defenderSurvivingSize", r1["defenderSurvivingSize"], 1)
	_assert_eq("attackerDamageDealt (defender losses)", r1["attackerDamageDealt"], 14999)
	_assert_eq("defenderDamageDealt (attacker losses)", r1["defenderDamageDealt"], 9000)
	_assert_eq("attackerMoraleDelta +3 (won)", r1["attackerMoraleDelta"], 3)
	_assert_eq("defenderMoraleDelta -8 (lost)", r1["defenderMoraleDelta"], -8)
	_assert_true("narrative contains unit names", "齐军" in r1["narrative"] and "魏军" in r1["narrative"])

	# ── 2. COMBAT: DEATH terrain — desperate frenzy bonus ────────────────────
	# DEATH: attackMod=30, defenseMod=30, moraleMod=20
	# a_eff_atk = max(1, round(28125 * 1.30)) = 36563
	# d_eff_atk = max(1, round(9000  * 1.30)) = 11700
	# attacker_losses = 11700, defender_losses = min(14999, 36563) = 14999
	# morale delta += moraleMod/10 = +2 for both sides
	print("==== 2. COMBAT DEATH terrain ====")
	var r2 := CombatEngine.resolve_combat({"attacker": atk, "defender": dfn,
		"terrain": "DEATH", "weather": "CLEAR"})
	_assert_eq("DEATH: attackerSurvivingSize", r2["attackerSurvivingSize"], 18300)
	_assert_eq("DEATH: defenderSurvivingSize", r2["defenderSurvivingSize"], 1)
	_assert_eq("DEATH: defenderDamageDealt", r2["defenderDamageDealt"], 11700)
	_assert_eq("DEATH: attackerMoraleDelta +3+2=+5", r2["attackerMoraleDelta"], 5)
	_assert_eq("DEATH: defenderMoraleDelta -8+2=-6", r2["defenderMoraleDelta"], -6)
	_assert_true("DEATH: narrative 死地血战", "死地血战" in r2["narrative"])

	# ── 3. COMBAT: 必死 flaw increases attacker's damage ─────────────────────
	# Large defender (50k) so losses are not capped by size limit.
	# Without flaw: a_eff_atk=28125 → defender_losses=28125, atk losses 29999 > 28125 → atk morale=-8
	# With 必死 (attackMod=1.30): a_eff_atk=36563 → defender_losses=36563, atk losses 29999 < 36563 → atk morale=+3
	print("==== 3. COMBAT 必死 flaw (large defender) ====")
	var dfn_big := _make_unit({"id": "db", "name": "大军", "side": "hostile",
		"size": 50000, "morale": 70})
	var r3a := CombatEngine.resolve_combat({"attacker": atk, "defender": dfn_big,
		"terrain": "FOCAL", "weather": "CLEAR"})
	var r3b := CombatEngine.resolve_combat({"attacker": atk, "defender": dfn_big,
		"terrain": "FOCAL", "weather": "CLEAR", "attackerFlaw": "必死"})
	_assert_eq("必死 baseline: defender_losses", r3a["attackerDamageDealt"], 28125)
	_assert_eq("必死 flaw:     defender_losses", r3b["attackerDamageDealt"], 36563)
	_assert_true("必死 flaw deals more damage", r3b["attackerDamageDealt"] > r3a["attackerDamageDealt"])
	_assert_eq("必死 baseline: attackerMoraleDelta=-8 (more own losses)", r3a["attackerMoraleDelta"], -8)
	_assert_eq("必死 flaw:     attackerMoraleDelta=+3 (deals more, fewer relative losses)", r3b["attackerMoraleDelta"], 3)

	# ── 4. COMBAT: fake decoy absorbs attack, deals 0 damage ─────────────────
	print("==== 4. FAKE DECOY COMBAT ====")
	var decoy := _make_unit({"id": "f", "name": "旗帜", "side": "allied",
		"isFake": true, "fakeDisguiseAsSize": 40000, "attackPower": 0, "defensePower": 5})
	var enemy := _make_unit({"id": "e", "name": "魏军", "side": "hostile", "size": 20000})
	var r4 := CombatEngine.resolve_combat({"attacker": enemy, "defender": decoy,
		"terrain": "FOCAL", "weather": "CLEAR"})
	_assert_eq("decoy: defenderDamageDealt=0 (fake has 0 attack)", r4["defenderDamageDealt"], 0)
	_assert_true("decoy: narrative 疑兵空营", "疑兵空营" in r4["narrative"])

	# ── 5. GAMELOOP: four-phase cycle wraps correctly ─────────────────────────
	print("==== 5. GAMELOOP phase cycle ====")
	_assert_eq("DEPLOY → STRATEGIZE", GameLoop.next_phase("DEPLOY"), "STRATEGIZE")
	_assert_eq("STRATEGIZE → RESOLVE", GameLoop.next_phase("STRATEGIZE"), "RESOLVE")
	_assert_eq("RESOLVE → AFTERMATH", GameLoop.next_phase("RESOLVE"), "AFTERMATH")
	_assert_eq("AFTERMATH → DEPLOY (wrap)", GameLoop.next_phase("AFTERMATH"), "DEPLOY")

	# ── 6. SUPPLY: morale category thresholds ────────────────────────────────
	print("==== 6. MORALE CATEGORIES ====")
	var cat85 := SupplyEngine.get_morale_category(85.0)
	var cat60 := SupplyEngine.get_morale_category(60.0)
	var cat20 := SupplyEngine.get_morale_category(20.0)
	_assert_eq("morale=85 → 锐气", cat85["name"], "锐气")
	_assert_eq("morale=85 → bonus=0.25", cat85["bonus"], 0.25)
	_assert_eq("morale=60 → 惰气", cat60["name"], "惰气")
	_assert_eq("morale=60 → bonus=0.0", cat60["bonus"], 0.0)
	_assert_eq("morale=20 → 归气", cat20["name"], "归气")
	_assert_eq("morale=20 → bonus=-0.30", cat20["bonus"], -0.30)

	# ── 7. SUPPLY BFS: direct connectivity tests ─────────────────────────────
	print("==== 7. BFS CONNECTIVITY ====")
	var n_bfs := [
		{"id": "cap",   "name": "都",   "type": "capital", "lat": 36.0, "lng": 114.0},
		{"id": "depot", "name": "粮仓", "type": "depot",   "lat": 35.5, "lng": 114.0},
	]
	var e_open := [{"id": "e1", "source": "cap", "target": "depot",
		"isCut": false, "isFake": false, "capacity": 100, "currentFlow": 50}]
	var e_cut := [{"id": "e1", "source": "cap", "target": "depot",
		"isCut": true, "isFake": false, "capacity": 100, "currentFlow": 50}]
	var bfs_open := SupplyEngine.is_connected_to_supply("depot", "cap", n_bfs, e_open)
	var bfs_cut  := SupplyEngine.is_connected_to_supply("depot", "cap", n_bfs, e_cut)
	var bfs_self := SupplyEngine.is_connected_to_supply("cap", "cap", n_bfs, e_cut)
	_assert_eq("BFS: open edge → connected", bfs_open["connected"], true)
	_assert_eq("BFS: open edge → path=[depot,cap]", bfs_open["path"].size(), 2)
	_assert_eq("BFS: cut edge → disconnected", bfs_cut["connected"], false)
	_assert_eq("BFS: same-node → trivially connected", bfs_self["connected"], true)

	# ── 8. SUPPLY TICK ────────────────────────────────────────────────────────
	# u_at_cap is within 5 km of cap_a → at_supply_node → supplied
	# u_far is ~222 km from cap_a, ~152 km from cap_b → unsupplied
	print("==== 8. SUPPLY TICK ====")
	var nodes := [
		{"id": "cap_a", "name": "邯郸", "type": "capital", "lat": 36.6, "lng": 114.5},
		{"id": "cap_b", "name": "大梁", "type": "capital", "lat": 34.8, "lng": 114.35},
	]
	var edges := [
		{"id": "e1", "source": "cap_a", "target": "cap_b",
			"isCut": false, "isFake": false, "capacity": 100, "currentFlow": 50},
	]
	var u_at_cap := _make_unit({"id": "ua", "name": "守军", "side": "allied",
		"lat": 36.6, "lng": 114.5, "morale": 60})
	var u_far := _make_unit({"id": "uf", "name": "孤军", "side": "allied",
		"lat": 35.0, "lng": 116.0, "morale": 60})
	var tick := SupplyEngine.run_supply_tick([u_at_cap, u_far], nodes, edges, "cap_a", "cap_b")
	var r_ua: Dictionary = tick["unitResults"][0]
	var r_uf: Dictionary = tick["unitResults"][1]
	_assert_eq("supply: ua supplied (at node)", r_ua["wasSupplied"], true)
	_assert_eq("supply: ua morale 60+5=65", r_ua["moraleResult"]["nextMorale"], 65)
	_assert_eq("supply: ua not routed", r_ua["moraleResult"]["isRouted"], false)
	_assert_eq("supply: uf unsupplied (far)", r_uf["wasSupplied"], false)
	_assert_eq("supply: uf morale 60-35=25", r_uf["moraleResult"]["nextMorale"], 25)
	_assert_eq("supply: uf routed (morale 25 ≤ 30)", r_uf["moraleResult"]["isRouted"], true)

	# ── 9. SUPPLY: panic contagion ────────────────────────────────────────────
	# Unit A at (35.0, 114.5), Unit B (newly routed) at (35.0, 114.6) → ~9 km < 15 km
	# Same side (allied) → A gets -10 morale penalty
	print("==== 9. PANIC CONTAGION ====")
	var pa := _make_unit({"id": "pa", "name": "左翼", "side": "allied",
		"lat": 35.0, "lng": 114.5})
	var pb := _make_unit({"id": "pb", "name": "右翼", "side": "allied",
		"lat": 35.0, "lng": 114.6, "isRouted": true})
	var contagion := SupplyEngine.compute_panic_contagion([pa, pb], ["pb"])
	_assert_eq("panic: 1 affected unit", contagion.size(), 1)
	_assert_eq("panic: affected unit is pa", contagion[0]["unitId"], "pa")
	_assert_eq("panic: penalty=-10", contagion[0]["penalty"], -10)
	# Distant unit (different province) should not be affected
	var pc := _make_unit({"id": "pc", "name": "后军", "side": "allied",
		"lat": 38.0, "lng": 116.0})
	var contagion2 := SupplyEngine.compute_panic_contagion([pa, pc, pb], ["pb"])
	_assert_eq("panic: far unit pc not affected", contagion2.size(), 1)

	# ── 10. FOG OF WAR: far scout is deceived ────────────────────────────────
	# fake at (35.5, 114.8), scout at (35.0, 115.0) → dist ≈ 58 km
	# dist_factor = max(0, 1 - 58/15) = 0  →  confidence = round(0*60 + 50*0.4) = 20 < 70
	print("==== 10. FOG OF WAR (far scout) ====")
	var fake_u := _make_unit({"id": "f1", "name": "旗帜", "side": "hostile",
		"lat": 35.5, "lng": 114.8,
		"isFake": true, "fakeDisguiseAsSize": 40000, "fakeDisguiseAsName": "大军"})
	var far_scout := _make_unit({"id": "s1", "name": "斥候", "side": "allied",
		"lat": 35.0, "lng": 115.0})
	var fow_far := FogOfWar.scout_unit(fake_u, far_scout, 50.0)
	_assert_eq("FoW far: confidence=20", fow_far["report"]["confidence"], 20)
	_assert_eq("FoW far: is_deceived=true", fow_far["report"]["isDeceived"], true)
	_assert_eq("FoW far: reportedSize=40000 (disguise)", fow_far["report"]["reportedSize"], 40000)
	_assert_eq("FoW far: unit NOT revealed", fow_far["unitRevealed"], false)

	# ── 11. FOG OF WAR: close scout sees through decoy ───────────────────────
	# dist=0 → dist_factor=1.0 → confidence = round(60 + 20) = 80 ≥ 70 → revealed
	print("==== 11. FOG OF WAR (close scout) ====")
	var close_scout := _make_unit({"id": "s2", "name": "密探", "side": "allied",
		"lat": 35.5, "lng": 114.8})
	var fow_close := FogOfWar.scout_unit(fake_u, close_scout, 50.0)
	_assert_eq("FoW close: confidence=80", fow_close["report"]["confidence"], 80)
	_assert_eq("FoW close: unit revealed", fow_close["unitRevealed"], true)
	_assert_eq("FoW close: is_deceived=false", fow_close["report"]["isDeceived"], false)

	# ── 12. AI: CAUTIOUS is fooled by decoy (apparent size beats real unit) ──
	# decoy: fakeDisguiseAsSize=50000 > qi: size=30000 → CAUTIOUS targets decoy
	print("==== 12. AI PLAN (CAUTIOUS, fooled) ====")
	var ai_units := [
		_make_unit({"id": "qi",    "name": "齐军",   "side": "allied",
			"lat": 35.0, "lng": 115.0, "size": 30000}),
		_make_unit({"id": "decoy", "name": "齐军主力", "side": "allied",
			"lat": 35.5, "lng": 114.8, "isFake": true,
			"fakeDisguiseAsSize": 50000, "fakeDisguiseAsName": "齐军主力"}),
		_make_unit({"id": "wei",   "name": "魏军",   "side": "hostile",
			"lat": 34.8, "lng": 114.4, "size": 45000}),
	]
	var plan_c := AICommander.plan_enemy_turn(ai_units, nodes, edges,
		"hostile", "allied", "cap_a", "CAUTIOUS")
	var c_attacks: Array = plan_c["actions"].filter(func(a): return a["kind"] == "ATTACK")
	_assert_eq("CAUTIOUS: exactly 1 attack (maxAttackers=1)", c_attacks.size(), 1)
	_assert_eq("CAUTIOUS: targets decoy (50k apparent > 30k real)", c_attacks[0]["targetId"], "decoy")

	# ── 13. AI: AGGRESSIVE sees through decoys, cuts supply ──────────────────
	# seesThroughDecoys=true → uses decoy.size(10k) not fakeDisguiseAsSize(50k) → qi(30k) wins
	print("==== 13. AI PLAN (AGGRESSIVE, sees through) ====")
	var plan_a := AICommander.plan_enemy_turn(ai_units, nodes, edges,
		"hostile", "allied", "cap_a", "AGGRESSIVE")
	var a_attacks: Array = plan_a["actions"].filter(func(a): return a["kind"] == "ATTACK")
	var a_cuts: Array    = plan_a["actions"].filter(func(a): return a["kind"] == "CUT_SUPPLY")
	_assert_eq("AGGRESSIVE: targets real unit qi (sees through decoy)", a_attacks[0]["targetId"], "qi")
	_assert_eq("AGGRESSIVE: has CUT_SUPPLY action (cutsSupply=true)", a_cuts.size(), 1)

	# ── 14. VICTORY SCORE: rank C scenario ───────────────────────────────────
	# military: enemies_destroyed=0, own_preserved=1 → 10
	# supply:   supplied_ratio=1, enemy_cut_ratio=0   → 15
	# deception: 1 fake, 0 fooled                     → 10
	# mandate:  routing_ratio=0, enemy_bonus=3        → 18
	# total = 53 → rank C
	print("==== 14. VICTORY (rank C) ====")
	var sc_c := {"initialUnits": ai_units}
	var st_c := {"units": ai_units,
		"supplyGraph": {"nodes": nodes, "edges": edges}, "scoutReports": []}
	var score_c := VictoryScoring.compute_victory_score(st_c, sc_c)
	_assert_eq("rank C: totalScore=53", score_c["totalScore"], 53)
	_assert_eq("rank C: rank=C", score_c["rank"], "C")
	_assert_eq("rank C: militaryDominance=10", score_c["categories"]["militaryDominance"], 10)
	_assert_eq("rank C: supplyIntegrity=15",   score_c["categories"]["supplyIntegrity"], 15)
	_assert_eq("rank C: deceptionEfficacy=10", score_c["categories"]["deceptionEfficacy"], 10)
	_assert_eq("rank C: mandatePreservation=18", score_c["categories"]["mandatePreservation"], 18)

	# ── 15. VICTORY SCORE: rank S scenario ───────────────────────────────────
	# enemy destroyed → militaryDominance=25
	# all allied supplied + enemy edge cut → supplyIntegrity=25
	# 2 fakes + 3 fooled reports → deceptionEfficacy=24
	# no routing + enemy >80% destroyed → mandatePreservation=25
	# total = 99 → rank S
	print("==== 15. VICTORY (rank S) ====")
	var s_enemy_init := _make_unit({"id": "e1", "name": "秦军", "side": "hostile", "size": 10000})
	var s_enemy_curr := _make_unit({"id": "e1", "name": "秦军", "side": "hostile",
		"size": 10000, "isDestroyed": true})
	var s_allied := _make_unit({"id": "a1", "name": "楚军", "side": "allied",
		"size": 10000, "provisions": 100})
	var s_fake1 := _make_unit({"id": "f1", "name": "左翼疑兵", "side": "allied", "isFake": true})
	var s_fake2 := _make_unit({"id": "f2", "name": "右翼疑兵", "side": "allied", "isFake": true})
	var s_edge := {"id": "se1", "source": "s_cap", "target": "s_dep",
		"isCut": true, "isFake": false}
	var s_reports := [{"isDeceived": true}, {"isDeceived": true}, {"isDeceived": true}]
	var sc_s := {"initialUnits": [s_enemy_init, s_allied, s_fake1, s_fake2]}
	var st_s := {
		"units": [s_enemy_curr, s_allied, s_fake1, s_fake2],
		"supplyGraph": {"nodes": [], "edges": [s_edge]},
		"scoutReports": s_reports,
	}
	var score_s := VictoryScoring.compute_victory_score(st_s, sc_s)
	_assert_eq("rank S: totalScore=99", score_s["totalScore"], 99)
	_assert_eq("rank S: rank=S", score_s["rank"], "S")
	_assert_eq("rank S: militaryDominance=25", score_s["categories"]["militaryDominance"], 25)
	_assert_eq("rank S: supplyIntegrity=25",   score_s["categories"]["supplyIntegrity"], 25)
	_assert_eq("rank S: deceptionEfficacy=24", score_s["categories"]["deceptionEfficacy"], 24)
	_assert_eq("rank S: mandatePreservation=25", score_s["categories"]["mandatePreservation"], 25)

	# ── SUMMARY ───────────────────────────────────────────────────────────────
	print("\n========================================")
	print("RESULTS: %d passed, %d failed" % [_pass, _fail])
	if _fail == 0:
		print("ENGINE_TEST_OK")
	else:
		print("ENGINE_TEST_FAILED")
	quit()
