class_name CombatEngine
## combatEngine.gd → GDScript port.
## Lanchester square-law + 九地 terrain + 五危 flaws + weather + morale.
## NOTE: all division is float-safe to avoid GDScript integer-division pitfalls.

# 九地 — terrain modifiers. attackMod/defenseMod/moraleMod are additive percents.
const TERRAIN_MODIFIERS := {
	"SCATTERED":   {"attackMod": -15, "defenseMod": 0,   "speedMod": 1.0,  "moraleMod": -10},
	"LIGHT":       {"attackMod": -5,  "defenseMod": -5,  "speedMod": 1.0,  "moraleMod": 0},
	"CONTENTIOUS": {"attackMod": 5,   "defenseMod": 35,  "speedMod": 0.8,  "moraleMod": 5},
	"FACILE":      {"attackMod": 10,  "defenseMod": -10, "speedMod": 1.2,  "moraleMod": 0},
	"FOCAL":       {"attackMod": 0,   "defenseMod": 0,   "speedMod": 1.0,  "moraleMod": 0},
	"HEAVY":       {"attackMod": 10,  "defenseMod": -5,  "speedMod": 0.6,  "moraleMod": -5},
	"ENTRAPPING":  {"attackMod": -20, "defenseMod": -10, "speedMod": 0.5,  "moraleMod": -15},
	"FRONTIER":    {"attackMod": -10, "defenseMod": 40,  "speedMod": 0.7,  "moraleMod": 5},
	"DEATH":       {"attackMod": 30,  "defenseMod": 30,  "speedMod": 1.5,  "moraleMod": 20},
}

const WEATHER_MODIFIERS := {
	"CLEAR": {"attackMod": 0,   "defenseMod": 0,   "speedMod": 1.0,  "visibilityMod": 1.0},
	"RAIN":  {"attackMod": -5,  "defenseMod": 5,   "speedMod": 0.5,  "visibilityMod": 0.6},
	"WIND":  {"attackMod": -10, "defenseMod": -5,  "speedMod": 1.4,  "visibilityMod": 0.7},
	"FOG":   {"attackMod": -15, "defenseMod": 10,  "speedMod": 0.75, "visibilityMod": 0.3},
}

# 五危 — flaw multipliers (attackMod/defenseMod are multipliers, moraleMod additive).
const FLAW_MODIFIERS := {
	"NONE": {"attackMod": 1.0,  "defenseMod": 1.0,  "moraleMod": 0},
	"必死": {"attackMod": 1.30, "defenseMod": 0.70, "moraleMod": 10},
	"必生": {"attackMod": 0.75, "defenseMod": 1.25, "moraleMod": -5},
	"忿速": {"attackMod": 1.15, "defenseMod": 0.60, "moraleMod": -10},
	"廉洁": {"attackMod": 0.90, "defenseMod": 0.90, "moraleMod": 5},
	"爱民": {"attackMod": 0.85, "defenseMod": 0.85, "moraleMod": 5},
}


static func _effective_attack(unit: Dictionary, flaw: Dictionary, t_mod: Dictionary, w_mod: Dictionary) -> float:
	var morale_factor := 1.0 + float(SupplyEngine.get_morale_category(unit["morale"])["bonus"])
	var terrain_factor := 1.0 + float(t_mod["attackMod"]) / 100.0
	var weather_factor := 1.0 + float(w_mod["attackMod"]) / 100.0
	var provision_factor := 1.0 if unit["provisions"] > 30 else 0.5 + float(unit["provisions"]) / 60.0
	var val := float(unit["size"]) * (float(unit["attackPower"]) / 100.0) * float(flaw["attackMod"]) \
		* morale_factor * terrain_factor * weather_factor * provision_factor
	return max(1.0, round(val))


static func _effective_defense(unit: Dictionary, flaw: Dictionary, t_mod: Dictionary, w_mod: Dictionary) -> float:
	var terrain_factor := 1.0 + float(t_mod["defenseMod"]) / 100.0
	var weather_factor := 1.0 + float(w_mod["defenseMod"]) / 100.0
	var routed_factor := 0.25 if unit["isRouted"] else 1.0
	var val := (float(unit["defensePower"]) / 100.0) * float(flaw["defenseMod"]) \
		* terrain_factor * weather_factor * routed_factor
	return max(1.0, round(val))


## resolveCombat. input: { attacker, defender, terrain, weather, attackerFlaw?, defenderFlaw? }
## Returns the same shape as the TS CombatResult.
static func resolve_combat(input: Dictionary) -> Dictionary:
	var attacker: Dictionary = input["attacker"]
	var defender: Dictionary = input["defender"]
	var terrain: String = input["terrain"]
	var weather: String = input["weather"]
	var t_mod: Dictionary = TERRAIN_MODIFIERS[terrain]
	var w_mod: Dictionary = WEATHER_MODIFIERS[weather]
	var a_flaw: Dictionary = FLAW_MODIFIERS[input.get("attackerFlaw", "NONE")]
	var d_flaw: Dictionary = FLAW_MODIFIERS[input.get("defenderFlaw", "NONE")]

	var a_eff_atk := 0.0 if attacker["isFake"] else _effective_attack(attacker, a_flaw, t_mod, w_mod)
	var d_eff_atk := 0.0 if defender["isFake"] else _effective_attack(defender, d_flaw, t_mod, w_mod)
	var a_eff_def := _effective_defense(attacker, a_flaw, t_mod, w_mod)
	var d_eff_def := _effective_defense(defender, d_flaw, t_mod, w_mod)

	var attacker_losses := int(min(float(attacker["size"]) - 1.0, round(d_eff_atk / max(1.0, a_eff_def / 10.0))))
	var defender_losses := int(min(float(defender["size"]) - 1.0, round(a_eff_atk / max(1.0, d_eff_def / 10.0))))

	var attacker_morale_delta := (-8.0 if attacker_losses > defender_losses else 3.0) \
		+ float(t_mod["moraleMod"]) / 10.0 + (-5.0 if attacker["provisions"] < 30 else 0.0)
	var defender_morale_delta := (-8.0 if defender_losses > attacker_losses else 3.0) \
		+ float(t_mod["moraleMod"]) / 10.0 + (-5.0 if defender["provisions"] < 30 else 0.0)

	var a_name: String = attacker["name"] + "[疑兵]" if attacker["isFake"] else attacker["name"]
	var d_name: String = defender["name"] + "[疑兵]" if defender["isFake"] else defender["name"]

	var narrative := ""
	if attacker["isFake"]:
		narrative = "⚔️ %s攻击%s——发现营寨空虚无兵，白费力气！" % [d_name, a_name]
	elif defender["isFake"]:
		narrative = "⚔️ %s突袭%s——草人虚旗应声而倒，此乃疑兵空营！" % [a_name, d_name]
	else:
		narrative = "⚔️ %s与%s交锋！ 我军折损%d人，敌损%d人。" % [a_name, d_name, attacker_losses, defender_losses]
		if terrain == "DEATH":
			narrative += "（死地血战，士气暴涨！）"

	return {
		"attackerDamageDealt": defender_losses,
		"defenderDamageDealt": attacker_losses,
		"attackerMoraleDelta": int(round(attacker_morale_delta)),
		"defenderMoraleDelta": int(round(defender_morale_delta)),
		"attackerSurvivingSize": max(0, int(attacker["size"]) - attacker_losses),
		"defenderSurvivingSize": max(0, int(defender["size"]) - defender_losses),
		"narrative": narrative,
	}


static func classify_terrain_from_position(lat: float, _lng: float) -> String:
	var abs_lat := absf(lat)
	if abs_lat > 40: return "FRONTIER"
	if abs_lat > 38: return "CONTENTIOUS"
	if abs_lat > 36: return "HEAVY"
	if abs_lat > 34: return "FOCAL"
	if abs_lat > 32: return "FACILE"
	return "SCATTERED"
