extends Control
## 马陵之战 — 半自动回合制游戏主场景。
## 玩家按钮推进 DEPLOY/STRATEGIZE/AFTERMATH；RESOLVE 由引擎自动结算。

# ────────────────────────────────────────────────────────────────────────────
# 场景常量
# ────────────────────────────────────────────────────────────────────────────
const MAX_TURNS := 8

const SUPPLY_NODES: Array = [
	{"id": "cap_qi",  "name": "临淄",   "type": "capital", "lat": 36.80, "lng": 118.35, "side": "allied"},
	{"id": "dep_qi",  "name": "齐军大营","type": "depot",   "lat": 36.00, "lng": 116.80, "side": "allied"},
	{"id": "cap_wei", "name": "大梁",   "type": "capital", "lat": 34.75, "lng": 114.35, "side": "hostile"},
	{"id": "dep_wei", "name": "魏军大营","type": "depot",   "lat": 35.00, "lng": 115.50, "side": "hostile"},
]
const SUPPLY_EDGES_INIT: Array = [
	{"id": "e_qi",  "source": "cap_qi",  "target": "dep_qi",  "isCut": false, "isFake": false, "capacity": 100, "currentFlow": 60},
	{"id": "e_wei", "source": "cap_wei", "target": "dep_wei", "isCut": false, "isFake": false, "capacity": 100, "currentFlow": 60},
]
const UNITS_INIT: Array = [
	{"id": "qi_main",  "name": "孙膑主力", "side": "allied",
	 "lat": 35.50, "lng": 116.20, "size": 80000,
	 "attackPower": 70, "defensePower": 60, "speed": 10,
	 "provisions": 100, "morale": 85, "isFake": false,
	 "fakeDisguiseAsSize": 0, "fakeDisguiseAsName": "",
	 "isRouted": false, "isDestroyed": false,
	 "creatorUid": "player", "creatorName": "孙膑"},
	{"id": "qi_decoy", "name": "减灶疑兵", "side": "allied",
	 "lat": 35.20, "lng": 115.80, "size": 10000,
	 "attackPower": 0, "defensePower": 5, "speed": 15,
	 "provisions": 100, "morale": 80, "isFake": true,
	 "fakeDisguiseAsSize": 90000, "fakeDisguiseAsName": "孙膑主力",
	 "isRouted": false, "isDestroyed": false,
	 "creatorUid": "player", "creatorName": "孙膑"},
	{"id": "wei_main", "name": "庞涓大军", "side": "hostile",
	 "lat": 35.00, "lng": 115.00, "size": 100000,
	 "attackPower": 75, "defensePower": 65, "speed": 10,
	 "provisions": 100, "morale": 75, "isFake": false,
	 "fakeDisguiseAsSize": 0, "fakeDisguiseAsName": "",
	 "isRouted": false, "isDestroyed": false,
	 "creatorUid": "ai", "creatorName": "庞涓"},
]

# ────────────────────────────────────────────────────────────────────────────
# 状态
# ────────────────────────────────────────────────────────────────────────────
var _state: Dictionary
var _scenario: Dictionary
var _ai_difficulty := "BALANCED"
var _weather := "CLEAR"
var _combat_log: Array = []
var _game_over := false

# UI 节点引用
var _phase_label: Label
var _turn_label: Label
var _weather_btn: OptionButton
var _diff_btn: OptionButton
var _unit_box: VBoxContainer
var _map_view: Control
var _log_text: RichTextLabel
var _phase_desc: Label
var _advance_btn: Button
var _victory_overlay: Panel
var _victory_rank: Label
var _victory_score: Label
var _victory_quote: Label


# ────────────────────────────────────────────────────────────────────────────
# 工具
# ────────────────────────────────────────────────────────────────────────────
func _t(zh: String, en: String) -> String:
	return zh if Locale.current == "zh" else en


func _deep_copy_units(src: Array) -> Array:
	var out: Array = []
	for u in src:
		out.append((u as Dictionary).duplicate(true))
	return out


func _deep_copy_edges(src: Array) -> Array:
	var out: Array = []
	for e in src:
		out.append((e as Dictionary).duplicate(true))
	return out


# ────────────────────────────────────────────────────────────────────────────
# 补给判断（修正版：按阵营过滤节点，支持 BFS 连通性）
# ────────────────────────────────────────────────────────────────────────────
func _compute_supply(unit: Dictionary) -> bool:
	var capital_id := "cap_qi" if unit["side"] == "allied" else "cap_wei"
	var supply_nodes: Array = _state["supplyGraph"]["nodes"]
	var supply_edges: Array = _state["supplyGraph"]["edges"]

	for n in supply_nodes:
		if n.get("side", "") != unit["side"]:
			continue
		var dist: float = SupplyEngine.haversine(
			float(unit["lat"]), float(unit["lng"]),
			float(n["lat"]), float(n["lng"]))
		if dist < 5.0:
			return true

	var nearest: Dictionary = {}
	var min_dist: float = INF
	for n in supply_nodes:
		if n.get("side", "") != unit["side"]:
			continue
		if n["type"] != "capital" and n["type"] != "depot":
			continue
		var d: float = SupplyEngine.haversine(
			float(unit["lat"]), float(unit["lng"]),
			float(n["lat"]), float(n["lng"]))
		if d < min_dist:
			min_dist = d
			nearest = n

	if nearest.is_empty():
		return false
	return SupplyEngine.is_connected_to_supply(
		nearest["id"], capital_id, supply_nodes, supply_edges)["connected"]


# ────────────────────────────────────────────────────────────────────────────
# 场景初始化
# ────────────────────────────────────────────────────────────────────────────
func _init_scenario() -> void:
	var units := _deep_copy_units(UNITS_INIT)
	var edges := _deep_copy_edges(SUPPLY_EDGES_INIT)
	_state = {
		"phase": "DEPLOY",
		"turnNumber": 1,
		"units": units,
		"supplyGraph": {"nodes": SUPPLY_NODES, "edges": edges},
		"scoutReports": [],
	}
	_scenario = {"initialUnits": _deep_copy_units(UNITS_INIT)}
	_combat_log = []
	_game_over = false
	_log("═══════════ 马陵之战 ═══════════",
		"═══════════ Battle of Maling ═══════════")
	_log("【%s】孙膑布疑兵减灶，以诱庞涓。" % _t("公元前341年", "341 BC"),
		"[341 BC] Sun Bin deploys decoy troops, luring Pang Juan into a trap.")


func _log(zh: String, en: String = "") -> void:
	_combat_log.append(_t(zh, en if en != "" else zh))


# ────────────────────────────────────────────────────────────────────────────
# RESOLVE 阶段引擎结算
# ────────────────────────────────────────────────────────────────────────────
func _resolve_supply_tick() -> void:
	var newly_routed: Array = []
	for unit in _state["units"]:
		if unit["isDestroyed"]:
			continue
		var supplied := _compute_supply(unit)
		var morale_result := SupplyEngine.compute_morale(unit, supplied)
		var was_routed: bool = unit["isRouted"]
		unit["morale"] = morale_result["nextMorale"]
		unit["isRouted"] = morale_result["isRouted"]
		if not supplied:
			_log("📉 【断粮】%s 补给断绝！士气→%d %s" % [
				unit["name"], morale_result["nextMorale"], morale_result["nextState"]],
				"📉 [Supply Cut] %s loses supply! Morale→%d %s" % [
				unit["name"], morale_result["nextMorale"], morale_result["nextState"]])
		elif int(unit["morale"]) < 100:
			_log("📈 【补给】%s 粮道畅通，士气→%d" % [unit["name"], morale_result["nextMorale"]],
				"📈 [Supply] %s supplied. Morale→%d" % [unit["name"], morale_result["nextMorale"]])
		if morale_result["isRouted"] and not was_routed:
			newly_routed.append(unit["id"])
			_log("💀 【溃散】%s 士卒四散，军心尽失！" % unit["name"],
				"💀 [Routed] %s collapses!" % unit["name"])

	if not newly_routed.is_empty():
		var contagion := SupplyEngine.compute_panic_contagion(_state["units"], newly_routed)
		for c in contagion:
			for u in _state["units"]:
				if u["id"] == c["unitId"]:
					u["morale"] = max(0, int(u["morale"]) + int(c["penalty"]))
					_log("😨 【传染】%s 受邻军溃散影响，士气-%d" % [u["name"], -c["penalty"]],
						"😨 [Panic] %s loses %d morale from nearby rout." % [u["name"], -c["penalty"]])


func _resolve_ai_turn() -> void:
	var plan := AICommander.plan_enemy_turn(
		_state["units"],
		_state["supplyGraph"]["nodes"],
		_state["supplyGraph"]["edges"],
		"hostile", "allied", "cap_qi", _ai_difficulty)

	_log("── 敌将行动 ──", "── Enemy Turn ──")
	for action in plan["actions"]:
		_log(action["log"])
		match action["kind"]:
			"ATTACK":
				_execute_attack(action)
			"MOVE":
				_execute_move(action)
			"CUT_SUPPLY":
				_execute_cut_supply(action)


func _execute_attack(action: Dictionary) -> void:
	var attacker: Dictionary = {}
	var defender: Dictionary = {}
	for u in _state["units"]:
		if u["id"] == action["unitId"]:   attacker = u
		if u["id"] == action["targetId"]: defender = u
	if attacker.is_empty() or defender.is_empty():
		return

	var result := CombatEngine.resolve_combat({
		"attacker": attacker,
		"defender": defender,
		"terrain": "FOCAL",
		"weather": _weather,
	})
	attacker["size"]   = result["attackerSurvivingSize"]
	attacker["morale"] = clampi(int(attacker["morale"]) + result["attackerMoraleDelta"], 0, 100)
	defender["size"]   = result["defenderSurvivingSize"]
	defender["morale"] = clampi(int(defender["morale"]) + result["defenderMoraleDelta"], 0, 100)
	if int(attacker["size"]) <= 0: attacker["isDestroyed"] = true
	if int(defender["size"]) <= 0: defender["isDestroyed"] = true
	if int(defender["morale"]) <= 30: defender["isRouted"] = true
	_log(result["narrative"])


func _execute_move(action: Dictionary) -> void:
	for u in _state["units"]:
		if u["id"] == action["unitId"]:
			u["lat"] = float(u["lat"]) + float(action.get("dLat", 0.0))
			u["lng"] = float(u["lng"]) + float(action.get("dLng", 0.0))
			break


func _execute_cut_supply(action: Dictionary) -> void:
	for e in _state["supplyGraph"]["edges"]:
		if e["id"] == action.get("edgeId", ""):
			e["isCut"] = true
			_log("✂ 【断粮】粮道 %s 被截断！" % e["id"],
				"✂ [Supply Cut] Edge %s severed!" % e["id"])
			break


func _check_fake_revelations() -> void:
	var revelations := FogOfWar.check_all_fake_revelations(_state["units"])
	for r in revelations:
		if r["revealed"]:
			_log("👁 【识破】疑兵被 %s 发现！" % r["revealedByUnitName"],
				"👁 [Revealed] Decoy exposed by %s!" % r["revealedByUnitName"])


func _check_end() -> bool:
	var end := GameLoop.check_scenario_end(_state, "cap_qi", "cap_wei", MAX_TURNS)
	if end["isVictory"] or end["isDefeat"]:
		_log("━━━━━━━━━━━━━━━━━━━━")
		_log(end["description"])
		_show_victory()
		return true
	return false


func _show_victory() -> void:
	_game_over = true
	var score := VictoryScoring.compute_victory_score(_state, _scenario)
	_victory_rank.text = "【%s】%s" % [score["rank"], VictoryScoring.get_rank_label(score["rank"])]
	_victory_rank.add_theme_color_override("font_color", VictoryScoring.get_rank_color(score["rank"]))
	_victory_score.text = "%s %d/100\n%s %d  %s %d  %s %d  %s %d" % [
		_t("总分", "Score"), score["totalScore"],
		_t("军势", "Military"), score["categories"]["militaryDominance"],
		_t("补给", "Supply"),   score["categories"]["supplyIntegrity"],
		_t("疑兵", "Deception"),score["categories"]["deceptionEfficacy"],
		_t("天命", "Mandate"),  score["categories"]["mandatePreservation"],
	]
	_victory_quote.text = score["sunTzuQuote"]
	_victory_overlay.visible = true


# ────────────────────────────────────────────────────────────────────────────
# 阶段推进
# ────────────────────────────────────────────────────────────────────────────
func _on_advance_pressed() -> void:
	if _game_over:
		return
	var current: String = _state["phase"]
	match current:
		"DEPLOY":
			_state["phase"] = "STRATEGIZE"
		"STRATEGIZE":
			_state["phase"] = "RESOLVE"
			_run_resolve()
		"RESOLVE":
			_state["phase"] = "AFTERMATH"
		"AFTERMATH":
			_state["turnNumber"] += 1
			_state["phase"] = "DEPLOY"
			_log("══════ 第%d回合 ══════" % _state["turnNumber"],
				"══════ Turn %d ══════" % _state["turnNumber"])
	_refresh_ui()


func _run_resolve() -> void:
	var turn: int = _state["turnNumber"]
	_log("─── 第%d回合 · 决胜 ───" % turn, "─── Turn %d · Resolve ───" % turn)
	_resolve_supply_tick()
	_resolve_ai_turn()
	_check_fake_revelations()
	_check_end()
	_log("─── 结算完毕 ───", "─── Resolution Done ───")


# ────────────────────────────────────────────────────────────────────────────
# UI 构建
# ────────────────────────────────────────────────────────────────────────────
func _ready() -> void:
	_init_scenario()
	_build_ui()
	Locale.locale_changed.connect(func(_code): _refresh_ui())
	_refresh_ui()


func _build_ui() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	custom_minimum_size = Vector2(1024, 640)

	# 背景
	var bg := ColorRect.new()
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.06, 0.05, 0.04)
	add_child(bg)

	# 整体 VBox
	var root_vbox := VBoxContainer.new()
	root_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root_vbox.add_theme_constant_override("separation", 0)
	add_child(root_vbox)

	# ── TopBar ───────────────────────────────────────────────────────────────
	var top := HBoxContainer.new()
	top.custom_minimum_size = Vector2(0, 52)
	top.add_theme_constant_override("separation", 12)
	root_vbox.add_child(top)

	_phase_label = Label.new()
	_phase_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_phase_label.add_theme_font_size_override("font_size", 16)
	_phase_label.add_theme_color_override("font_color", Color("e8c84a"))
	_phase_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top.add_child(_phase_label)

	_turn_label = Label.new()
	_turn_label.add_theme_font_size_override("font_size", 14)
	_turn_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.7))
	_turn_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top.add_child(_turn_label)

	_weather_btn = OptionButton.new()
	_weather_btn.custom_minimum_size = Vector2(120, 36)
	for w in ["晴天 CLEAR", "雨天 RAIN", "大风 WIND", "大雾 FOG"]:
		_weather_btn.add_item(w)
	_weather_btn.connect("item_selected", _on_weather_changed)
	top.add_child(_weather_btn)

	_diff_btn = OptionButton.new()
	_diff_btn.custom_minimum_size = Vector2(130, 36)
	for d in ["谨慎 CAUTIOUS", "均衡 BALANCED", "激进 AGGRESSIVE"]:
		_diff_btn.add_item(d)
	_diff_btn.selected = 1
	_diff_btn.connect("item_selected", _on_diff_changed)
	top.add_child(_diff_btn)

	# ── Body ─────────────────────────────────────────────────────────────────
	var body := HBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 0)
	root_vbox.add_child(body)

	# Left panel
	var left := VBoxContainer.new()
	left.custom_minimum_size = Vector2(220, 0)
	left.add_theme_constant_override("separation", 4)
	body.add_child(left)

	var unit_title := Label.new()
	unit_title.text = "── 部队 ──"
	unit_title.add_theme_font_size_override("font_size", 12)
	unit_title.add_theme_color_override("font_color", Color(0.6, 0.58, 0.45))
	unit_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	left.add_child(unit_title)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left.add_child(scroll)

	_unit_box = VBoxContainer.new()
	_unit_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_unit_box.add_theme_constant_override("separation", 5)
	scroll.add_child(_unit_box)

	var lang_btn := Button.new()
	lang_btn.text = "🌐 中/EN"
	lang_btn.custom_minimum_size = Vector2(0, 34)
	lang_btn.connect("pressed", func(): Locale.set_language("en" if Locale.current == "zh" else "zh"))
	left.add_child(lang_btn)

	# Map view
	_map_view = load("res://MapView.gd").new()
	_map_view.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_map_view.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	body.add_child(_map_view)

	# Right panel
	var right := VBoxContainer.new()
	right.custom_minimum_size = Vector2(290, 0)
	right.add_theme_constant_override("separation", 4)
	body.add_child(right)

	var log_title := Label.new()
	log_title.text = "── 战报 ──"
	log_title.add_theme_font_size_override("font_size", 12)
	log_title.add_theme_color_override("font_color", Color(0.6, 0.58, 0.45))
	log_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	right.add_child(log_title)

	_log_text = RichTextLabel.new()
	_log_text.bbcode_enabled = true
	_log_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_log_text.add_theme_font_size_override("normal_font_size", 12)
	_log_text.scroll_following = true
	right.add_child(_log_text)

	# ── BottomBar ─────────────────────────────────────────────────────────────
	var bottom := HBoxContainer.new()
	bottom.custom_minimum_size = Vector2(0, 56)
	bottom.add_theme_constant_override("separation", 12)
	root_vbox.add_child(bottom)

	_phase_desc = Label.new()
	_phase_desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_phase_desc.add_theme_font_size_override("font_size", 12)
	_phase_desc.add_theme_color_override("font_color", Color(0.70, 0.67, 0.55))
	_phase_desc.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bottom.add_child(_phase_desc)

	_advance_btn = Button.new()
	_advance_btn.custom_minimum_size = Vector2(200, 40)
	_advance_btn.add_theme_font_size_override("font_size", 15)
	_advance_btn.connect("pressed", _on_advance_pressed)
	bottom.add_child(_advance_btn)

	# ── VictoryOverlay ────────────────────────────────────────────────────────
	_victory_overlay = Panel.new()
	_victory_overlay.set_anchors_preset(Control.PRESET_CENTER)
	_victory_overlay.custom_minimum_size = Vector2(460, 300)
	_victory_overlay.visible = false
	add_child(_victory_overlay)

	var ov_style := StyleBoxFlat.new()
	ov_style.bg_color = Color(0.08, 0.07, 0.06, 0.96)
	ov_style.border_color = Color("e8c84a")
	for side in ["top", "bottom", "left", "right"]:
		ov_style.set("border_width_" + side, 2)
	for corner in ["top_left", "top_right", "bottom_left", "bottom_right"]:
		ov_style.set("corner_radius_" + corner, 8)
	_victory_overlay.add_theme_stylebox_override("panel", ov_style)

	var ov_mg := MarginContainer.new()
	ov_mg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ov_mg.add_theme_constant_override("margin_top",    24)
	ov_mg.add_theme_constant_override("margin_bottom", 24)
	ov_mg.add_theme_constant_override("margin_left",   32)
	ov_mg.add_theme_constant_override("margin_right",  32)
	_victory_overlay.add_child(ov_mg)

	var ov_vbox := VBoxContainer.new()
	ov_vbox.add_theme_constant_override("separation", 10)
	ov_mg.add_child(ov_vbox)

	_victory_rank = Label.new()
	_victory_rank.add_theme_font_size_override("font_size", 22)
	_victory_rank.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ov_vbox.add_child(_victory_rank)

	_victory_score = Label.new()
	_victory_score.add_theme_font_size_override("font_size", 13)
	_victory_score.add_theme_color_override("font_color", Color(0.85, 0.83, 0.72))
	_victory_score.autowrap_mode = TextServer.AUTOWRAP_WORD
	ov_vbox.add_child(_victory_score)

	_victory_quote = Label.new()
	_victory_quote.add_theme_font_size_override("font_size", 11)
	_victory_quote.add_theme_color_override("font_color", Color(0.60, 0.57, 0.45))
	_victory_quote.autowrap_mode = TextServer.AUTOWRAP_WORD
	ov_vbox.add_child(_victory_quote)

	var restart_btn := Button.new()
	restart_btn.text = "↺  重开 / Restart"
	restart_btn.custom_minimum_size = Vector2(0, 38)
	restart_btn.add_theme_font_size_override("font_size", 14)
	restart_btn.connect("pressed", _on_restart)
	ov_vbox.add_child(restart_btn)


# ────────────────────────────────────────────────────────────────────────────
# UI 刷新
# ────────────────────────────────────────────────────────────────────────────
func _refresh_ui() -> void:
	if not is_instance_valid(_phase_label):
		return

	var phase: String = _state.get("phase", "DEPLOY")
	var turn: int     = _state.get("turnNumber", 1)

	var phase_zh := {"DEPLOY": "布阵", "STRATEGIZE": "运筹", "RESOLVE": "决胜", "AFTERMATH": "论功"}
	var phase_en := {"DEPLOY": "DEPLOY", "STRATEGIZE": "STRATEGIZE", "RESOLVE": "RESOLVE", "AFTERMATH": "AFTERMATH"}
	_phase_label.text = "【%s】%s  ·  %s" % [
		_t("马陵之战", "Battle of Maling"),
		_t(phase_zh.get(phase, phase), phase_en.get(phase, phase)),
		GameLoop.phase_description(phase),
	]
	_turn_label.text = _t("第%d/%d回合" % [turn, MAX_TURNS], "Turn %d/%d" % [turn, MAX_TURNS])

	var btn_texts := {
		"DEPLOY":     _t("布阵完毕 →", "Deploy Done →"),
		"STRATEGIZE": _t("运筹完毕 →", "Plan Done →"),
		"RESOLVE":    _t("→ 论功", "→ Aftermath"),
		"AFTERMATH":  _t("下一回合 →", "Next Turn →") if turn < MAX_TURNS else _t("结束", "End"),
	}
	_advance_btn.text     = btn_texts.get(phase, "→")
	_advance_btn.disabled = _game_over
	_phase_desc.text      = GameLoop.phase_description(phase)

	# 单位卡片
	for child in _unit_box.get_children():
		child.queue_free()
	for unit in _state["units"]:
		_unit_box.add_child(_make_unit_card(unit))

	# 地图
	_map_view.update_state(
		GameLoop.get_visible_units(_state["units"], "allied"),
		_state["supplyGraph"]["nodes"],
		_state["supplyGraph"]["edges"])

	# 战报
	_log_text.clear()
	for line in _combat_log:
		_log_text.append_text(line + "\n")


func _make_unit_card(unit: Dictionary) -> Control:
	var card := PanelContainer.new()
	var style := StyleBoxFlat.new()
	if unit["isDestroyed"]:
		style.bg_color = Color(0.12, 0.10, 0.10)
	elif unit["side"] == "allied":
		style.bg_color = Color(0.07, 0.11, 0.17)
	else:
		style.bg_color = Color(0.17, 0.07, 0.07)
	for corner in ["top_left", "top_right", "bottom_left", "bottom_right"]:
		style.set("corner_radius_" + corner, 4)
	card.add_theme_stylebox_override("panel", style)

	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 2)
	card.add_child(vb)

	# 名称行
	var name_lbl := Label.new()
	name_lbl.text = unit["name"]
	if unit["isFake"]: name_lbl.text += "  [疑]"
	if unit["isRouted"]: name_lbl.text += "  ⚡溃"
	if unit["isDestroyed"]: name_lbl.text += "  ✕"
	name_lbl.add_theme_font_size_override("font_size", 13)
	var nc: Color
	if unit["isDestroyed"]:    nc = Color(0.42, 0.38, 0.36)
	elif unit["side"] == "allied": nc = Color(0.55, 0.80, 1.00)
	else:                          nc = Color(1.00, 0.55, 0.50)
	name_lbl.add_theme_color_override("font_color", nc)
	vb.add_child(name_lbl)

	if unit["isDestroyed"]:
		return card

	var size_lbl := Label.new()
	size_lbl.text = "%s%d万  攻%d/守%d" % [
		_t("兵", ""), int(unit["size"]) / 10000,
		int(unit["attackPower"]), int(unit["defensePower"]),
	]
	size_lbl.add_theme_font_size_override("font_size", 10)
	size_lbl.add_theme_color_override("font_color", Color(0.68, 0.65, 0.55))
	vb.add_child(size_lbl)

	_add_bar(vb, _t("士气", "Morale"), int(unit["morale"]), 100,
		Color(0.25, 0.82, 0.38) if int(unit["morale"]) >= 60 else Color(0.9, 0.5, 0.1))
	_add_bar(vb, _t("粮", "Prov"), int(unit["provisions"]), 100, Color(0.70, 0.58, 0.28))

	return card


func _add_bar(parent: Control, label: String, value: int, max_val: int, col: Color) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 3)
	parent.add_child(row)

	var lbl := Label.new()
	lbl.text = label
	lbl.custom_minimum_size = Vector2(32, 0)
	lbl.add_theme_font_size_override("font_size", 10)
	lbl.add_theme_color_override("font_color", Color(0.60, 0.58, 0.48))
	row.add_child(lbl)

	var bar := ProgressBar.new()
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bar.max_value = max_val
	bar.value = value
	bar.custom_minimum_size = Vector2(0, 10)
	bar.show_percentage = false
	var bg_s := StyleBoxFlat.new()
	bg_s.bg_color = Color(0.14, 0.13, 0.11)
	var fill_s := StyleBoxFlat.new()
	fill_s.bg_color = col
	bar.add_theme_stylebox_override("background", bg_s)
	bar.add_theme_stylebox_override("fill", fill_s)
	row.add_child(bar)

	var vl := Label.new()
	vl.text = str(value)
	vl.custom_minimum_size = Vector2(26, 0)
	vl.add_theme_font_size_override("font_size", 10)
	vl.add_theme_color_override("font_color", Color(0.72, 0.70, 0.60))
	vl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(vl)


# ────────────────────────────────────────────────────────────────────────────
# 事件
# ────────────────────────────────────────────────────────────────────────────
func _on_weather_changed(idx: int) -> void:
	var weathers := ["CLEAR", "RAIN", "WIND", "FOG"]
	_weather = weathers[idx]


func _on_diff_changed(idx: int) -> void:
	var diffs := ["CAUTIOUS", "BALANCED", "AGGRESSIVE"]
	_ai_difficulty = diffs[idx]


func _on_restart() -> void:
	_victory_overlay.visible = false
	_init_scenario()
	_refresh_ui()
