/**
 * i18n-to-godot.mjs — bridge the web app's i18n maps into a Godot CSV translation.
 *
 * Reads src/i18n/zh.ts and src/i18n/en.ts (flat `Record<string,string>` literals),
 * evaluates the object literals, and emits godot/localization/strings.csv in the
 * Godot CSV translation format:
 *
 *     keys,en,zh
 *     "ui.language","Language","语言"
 *
 * Run: node tools/i18n-to-godot.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/** Extract the `{ ... }` object literal from a TS i18n module and eval it. */
function loadMap(relPath) {
  const text = readFileSync(resolve(ROOT, relPath), 'utf8');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error(`No object literal in ${relPath}`);
  const literal = text.slice(start, end + 1);
  // The literal uses single-quoted keys/values + line comments + trailing commas,
  // all valid JS — eval in an isolated expression context.
  // eslint-disable-next-line no-eval
  const obj = eval('(' + literal + ')');
  return obj;
}

/** RFC-4180-ish CSV field escaping; also flatten newlines for Godot's parser. */
function csv(field) {
  const s = String(field).replace(/\r?\n/g, ' ');
  return '"' + s.replace(/"/g, '""') + '"';
}

const zh = loadMap('src/i18n/zh.ts');
const en = loadMap('src/i18n/en.ts');

// Union of keys, preserving zh's authoring order then any en-only extras.
const keys = [...Object.keys(zh)];
for (const k of Object.keys(en)) if (!(k in zh)) keys.push(k);

const missingEn = keys.filter((k) => !(k in en));
const missingZh = keys.filter((k) => !(k in zh));

const lines = ['keys,en,zh'];
for (const k of keys) {
  lines.push([csv(k), csv(en[k] ?? zh[k] ?? ''), csv(zh[k] ?? en[k] ?? '')].join(','));
}

const outDir = resolve(ROOT, 'godot/localization');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, 'strings.csv');
// BOM-less UTF-8 is what Godot expects.
writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');

console.log(`Wrote ${keys.length} keys → ${outFile}`);
if (missingEn.length) console.warn(`  ⚠ ${missingEn.length} keys missing EN (fell back to ZH): ${missingEn.join(', ')}`);
if (missingZh.length) console.warn(`  ⚠ ${missingZh.length} keys missing ZH (fell back to EN): ${missingZh.join(', ')}`);
