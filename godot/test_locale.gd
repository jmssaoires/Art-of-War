extends SceneTree
## Headless verification of the bilingual localization pipeline.
## Run: godot --headless -s res://test_locale.gd

func _initialize() -> void:
	var en_t = load("res://localization/strings.en.translation")
	var zh_t = load("res://localization/strings.zh.translation")
	if en_t: TranslationServer.add_translation(en_t)
	if zh_t: TranslationServer.add_translation(zh_t)

	var keys = ["ui.language", "scenario.title", "command.resolve", "ai.aggressive"]
	for code in ["zh", "en"]:
		TranslationServer.set_locale(code)
		print("---- locale = %s ----" % code)
		for k in keys:
			print("  %s = %s" % [k, TranslationServer.translate(k)])
	print("LOCALE_TEST_OK")
	quit()
