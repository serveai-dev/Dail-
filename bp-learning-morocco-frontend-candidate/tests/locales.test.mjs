import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fr } from "../locales/fr.js";
import { ar } from "../locales/ar.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const placeholders = (value) => [...String(value).matchAll(/\{\w+\}/g)].map(([match]) => match).sort();

test("French and Arabic locales have identical keys and placeholders", () => {
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(fr).sort());
  for (const key of Object.keys(fr)) assert.deepEqual(placeholders(ar[key]), placeholders(fr[key]), key);
});

test("every literal translation key used by app and views exists in French", () => {
  const files = [path.join(root, "..", "app.js"), ...fs.readdirSync(path.join(root, "..", "views"), { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith(".js")).map((entry) => path.join(root, "..", "views", entry.name))];
  const used = new Set();
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) used.add(match[1]);
  }
  assert.deepEqual([...used].filter((key) => !(key in fr)).sort(), []);
});

test("Arabic locale is complete and does not contain French sentences", () => {
  for (const [key, value] of Object.entries(ar)) {
    assert.equal(typeof value, "string", key);
    assert.notEqual(value.trim(), "", key);
    const latinSentence = value.replaceAll("BP Learning", "").match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+){3,}/g);
    assert.equal(latinSentence, null, `${key}: ${latinSentence?.[0]}`);
  }
});
