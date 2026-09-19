import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV, courseFromCSV, courseToCSV } from "../csv.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const csv = fs.readFileSync(path.join(root, "..", "courses", "exemple-cours.csv"), "utf8");

test("CSV parser handles BOM, delimiters, escaped quotes, and multiline fields", () => {
  assert.deepEqual(parseCSV("\ufefftype;langue;texte\r\nmeta;fr;\"ligne 1;\nligne 2\"\r\n"), [["type", "langue", "texte"], ["meta", "fr", "ligne 1;\nligne 2"]]);
  assert.deepEqual(parseCSV("a,b\n\"x\"\"y\",z\n"), [["a", "b"], ["x\"y", "z"]]);
  assert.equal(parseCSV("a;b\n1;2\n")[1][1], "2");
  assert.equal(parseCSV("a,b\n1,2\n")[1][1], "2");
  assert.deepEqual(parseCSV("a\tb\n1\t2\n")[1], ["1", "2"]);
});

test("example CSV validates and matches the JSON dialogue", () => {
  const result = courseFromCSV(csv);
  const json = JSON.parse(fs.readFileSync(path.join(root, "..", "courses", "exemple-cours.json"), "utf8"));
  assert.equal(result.ok, true);
  assert.deepEqual(result.raw.fr.dialogue.map((item) => [item.text, item.best]), json.fr.dialogue.map((item) => [item.text, item.best]));
  assert.equal(courseFromCSV(courseToCSV(result.raw)).ok, true);
});

test("CSV validation errors identify the source row", () => {
  const broken = csv.replace(';"Vous pouvez sûrement les mélanger si vous les prenez à des moments différents.";"1";', ';"1";');
  const result = courseFromCSV(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path.startsWith("ligne ")));
});
