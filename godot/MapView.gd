extends Control
## 地图绘制 — 将补给网络 + 单位位置渲染到屏幕坐标。

const LAT_MIN := 34.0
const LAT_MAX := 37.5
const LNG_MIN := 113.0
const LNG_MAX := 119.5

const COL_BG         := Color(0.18, 0.22, 0.15, 1.0)   # 墨绿底色
const COL_SUPPLY_OK  := Color(0.30, 0.85, 0.40, 1.0)   # 补给线通
const COL_SUPPLY_CUT := Color(0.85, 0.25, 0.20, 1.0)   # 补给线断
const COL_NODE       := Color(0.95, 0.85, 0.40, 1.0)   # 节点菱形
const COL_ALLIED     := Color(0.25, 0.55, 1.00, 1.0)   # 友军蓝
const COL_HOSTILE    := Color(0.90, 0.25, 0.25, 1.0)   # 敌军红
const COL_FAKE       := Color(1.00, 0.85, 0.10, 1.0)   # 疑兵黄
const COL_LABEL      := Color(1.00, 1.00, 1.00, 0.92)
const COL_ROUTED     := Color(0.50, 0.50, 0.50, 0.70)

var _units: Array  = []
var _nodes: Array  = []
var _edges: Array  = []

var _font: Font
var _font_size_sm := 11
var _font_size_md := 13


func _ready() -> void:
	_font = get_theme_font("font", "Label")


func update_state(units: Array, nodes: Array, edges: Array) -> void:
	_units = units
	_nodes = nodes
	_edges = edges
	queue_redraw()


func _ll_to_px(lat: float, lng: float) -> Vector2:
	var rect := get_rect()
	var x := (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * rect.size.x
	var y := (1.0 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * rect.size.y
	return Vector2(x, y)


func _draw() -> void:
	var rect := get_rect()

	# ── 背景 ──────────────────────────────────────────────────────────────────
	draw_rect(Rect2(Vector2.ZERO, rect.size), COL_BG)

	# ── 补给线 ────────────────────────────────────────────────────────────────
	var node_pos := {}
	for n in _nodes:
		node_pos[n["id"]] = _ll_to_px(float(n["lat"]), float(n["lng"]))

	for e in _edges:
		if not node_pos.has(e["source"]) or not node_pos.has(e["target"]):
			continue
		var p1: Vector2 = node_pos[e["source"]]
		var p2: Vector2 = node_pos[e["target"]]
		var col := COL_SUPPLY_CUT if e["isCut"] else COL_SUPPLY_OK
		var width := 2.5 if e["isCut"] else 2.0
		draw_line(p1, p2, col, width)
		# 断绝标记
		if e["isCut"]:
			var mid := (p1 + p2) * 0.5
			draw_circle(mid, 6.0, COL_SUPPLY_CUT)

	# ── 补给节点（菱形） ────────────────────────────────────────────────────────
	for n in _nodes:
		var p: Vector2 = node_pos.get(n["id"], Vector2.ZERO)
		var r := 10.0 if n["type"] == "capital" else 7.0
		var pts := PackedVector2Array([
			p + Vector2(0, -r),
			p + Vector2(r, 0),
			p + Vector2(0, r),
			p + Vector2(-r, 0),
		])
		draw_colored_polygon(pts, COL_NODE)
		draw_polyline(PackedVector2Array([pts[0], pts[1], pts[2], pts[3], pts[0]]),
			Color(0, 0, 0, 0.5), 1.0)
		# 节点名称
		var label_pos := p + Vector2(-(float(_font.get_string_size(n["name"], HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_sm).x) * 0.5), r + 14)
		draw_string(_font, label_pos, n["name"],
			HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_sm, COL_NODE)

	# ── 单位圆圈 ──────────────────────────────────────────────────────────────
	for unit in _units:
		if unit["isDestroyed"]:
			continue
		var p: Vector2 = _ll_to_px(float(unit["lat"]), float(unit["lng"]))
		var col: Color
		if unit["isRouted"]:
			col = COL_ROUTED
		elif unit["isFake"]:
			col = COL_FAKE
		elif unit["side"] == "allied":
			col = COL_ALLIED
		else:
			col = COL_HOSTILE

		var radius := 14.0 if not unit["isFake"] else 10.0
		draw_circle(p, radius, col)
		draw_arc(p, radius, 0, TAU, 24, Color(0, 0, 0, 0.6), 1.5)

		# 士气环（外圈弧形）
		var morale_frac := clampf(float(unit["morale"]) / 100.0, 0.0, 1.0)
		var morale_col := Color(0.2, 0.9, 0.3) if morale_frac > 0.6 \
			else (Color(0.9, 0.8, 0.1) if morale_frac > 0.3 else Color(0.9, 0.2, 0.1))
		draw_arc(p, radius + 3.0, -PI * 0.5, -PI * 0.5 + TAU * morale_frac,
			32, morale_col, 2.5)

		# 单位名称（上方）
		var display_name: String = unit.get("fakeDisguiseAsName", unit["name"]) if unit["isFake"] else unit["name"]
		var name_w: float = _font.get_string_size(display_name, HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_sm).x
		draw_string(_font, p + Vector2(-name_w * 0.5, -radius - 5),
			display_name, HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_sm, COL_LABEL)

		# 兵力数字（下方，万为单位）
		if not unit["isFake"]:
			var size_str := "%d万" % (int(unit["size"]) / 10000)
			var sw: float = _font.get_string_size(size_str, HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_sm).x
			draw_string(_font, p + Vector2(-sw * 0.5, radius + 14),
				size_str, HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_sm,
				Color(1, 1, 1, 0.75))

		# 溃散标记
		if unit["isRouted"]:
			draw_string(_font, p + Vector2(-8, 5), "溃",
				HORIZONTAL_ALIGNMENT_LEFT, -1, _font_size_md, Color(1, 0.3, 0.3))
