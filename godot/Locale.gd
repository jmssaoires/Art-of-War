extends Node
## Locale autoload — runtime language switching + persistence.
##
## Mirrors the web app's LocaleContext: the game is fully playable in ONE
## language at a time (no bilingual mixed display). Switching the locale
## re-resolves every tr() string in the UI via the locale_changed signal.

signal locale_changed(code: String)

const SAVE_PATH := "user://locale.cfg"
const SUPPORTED := ["zh", "en"]
const DEFAULT_LOCALE := "zh"

var current: String = DEFAULT_LOCALE


func _ready() -> void:
	var saved := _load_saved()
	set_language(saved if SUPPORTED.has(saved) else DEFAULT_LOCALE)


## Switch to a supported locale, persist it, and notify listeners.
func set_language(code: String) -> void:
	if not SUPPORTED.has(code):
		push_warning("Locale: unsupported code '%s'" % code)
		return
	current = code
	TranslationServer.set_locale(code)
	_save(code)
	locale_changed.emit(code)


## Convenience flip between the two shipped languages.
func toggle() -> void:
	set_language("en" if current == "zh" else "zh")


## Translate a key under the current locale (thin wrapper over tr()).
func t(key: String) -> String:
	return tr(key)


func _load_saved() -> String:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) == OK:
		return str(cfg.get_value("i18n", "locale", DEFAULT_LOCALE))
	return DEFAULT_LOCALE


func _save(code: String) -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("i18n", "locale", code)
	cfg.save(SAVE_PATH)
