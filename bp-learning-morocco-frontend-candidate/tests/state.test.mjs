import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT, validate, migrateV1, loadState, saveState, progress, dialogueScore, modulesSummary, isComplete, nextRoute, STORE_KEY, LEGACY_KEY } from "../state.js";
import { CONTENT } from "../fixtures.js";

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };

test("validate: garbage → DEFAULT", () => {
  for (const raw of [null, 42, "x", [], { version: 9 }]) assert.deepEqual(validate(raw), DEFAULT);
});

test("validate: clamps and filters every field", () => {
  const s = validate({ version: 2, profile: { name: "x".repeat(80), lang: "de" }, prep: ["langue", "nope", "langue"], dialogueAnswers: [0, 7, 2, 1], modules: { preference: { first: 1, solved: "yes" }, ghost: { first: 0, solved: true } }, completedAt: 12 });
  assert.equal(s.profile.name.length, 40); assert.equal(s.profile.lang, "fr");
  assert.deepEqual(s.prep, ["langue"]);
  assert.deepEqual(s.dialogueAnswers, [0]);
  assert.deepEqual(s.modules, { preference: { first: 1, solved: false } });
  assert.equal(s.completedAt, null);
});

test("validate: keeps a valid ISO completedAt", () => {
  assert.equal(validate({ ...DEFAULT, completedAt: "2026-09-19T10:00:00.000Z" }).completedAt, "2026-09-19T10:00:00.000Z");
});

test("migrateV1: maps quizAnswers to modules {first, solved}", () => {
  const s = migrateV1({ prep: ["langue"], dialogueStep: 2, dialogueAnswers: [0, 2], quizAnswers: { preference: 0, structure: 1 } });
  assert.deepEqual(s.dialogueAnswers, [0, 2]);
  assert.deepEqual(s.modules, { preference: { first: 0, solved: true }, structure: { first: 1, solved: false } });
  assert.equal(s.profile.name, "");
  assert.equal(migrateV1({ foo: 1 }), null);
});

test("loadState: reads v2, else migrates v1, else DEFAULT; volatile on throw", () => {
  assert.deepEqual(loadState(mem()).state, DEFAULT);
  const v1 = mem({ [LEGACY_KEY]: JSON.stringify({ prep: [], dialogueStep: 1, dialogueAnswers: [1], quizAnswers: {} }) });
  assert.deepEqual(loadState(v1).state.dialogueAnswers, [1]);
  const v2 = mem({ [STORE_KEY]: JSON.stringify({ ...DEFAULT, profile: { name: "Nadia", lang: "ar" } }), [LEGACY_KEY]: "{\"dialogueAnswers\":[2,2,2]}" });
  assert.equal(loadState(v2).state.profile.name, "Nadia");
  assert.deepEqual(loadState(v2).state.dialogueAnswers, []);
  const r = loadState(throwing); assert.equal(r.volatile, true); assert.deepEqual(r.state, DEFAULT);
  assert.equal(saveState(throwing, DEFAULT), false); assert.equal(saveState(mem(), DEFAULT), true);
});

test("derived getters", () => {
  const s = validate({ ...DEFAULT, dialogueAnswers: [0, 1, 0], modules: { preference: { first: 0, solved: true }, structure: { first: 2, solved: true } } });
  assert.equal(progress(s), 83);
  assert.deepEqual(dialogueScore(s), { best: 2, total: 3, pct: 67 });
  assert.deepEqual(modulesSummary(s), { solved: 2, firstTry: 1, total: 3 });
  assert.equal(isComplete(s), false); assert.equal(nextRoute(s), "modules");
  assert.equal(nextRoute(DEFAULT), "prep");
  assert.equal(nextRoute(validate({ ...DEFAULT, dialogueAnswers: [0] })), "simulation");
  const done = validate({ ...s, modules: { ...s.modules, verification: { first: 0, solved: true } } });
  assert.equal(isComplete(done), true); assert.equal(progress(done), 100); assert.equal(nextRoute(done), "plan");
});

test("content parity: every language has identical ids, lengths, best and correct", () => {
  const fr = CONTENT.fr;
  for (const [lang, c] of Object.entries(CONTENT)) {
    assert.deepEqual(c.preparation.map((p) => p.id), fr.preparation.map((p) => p.id), lang);
    assert.deepEqual(c.dialogue.map((d) => [d.choices.length, d.best]), fr.dialogue.map((d) => [d.choices.length, d.best]), lang);
    assert.deepEqual(c.modules.map((m) => [m.id, m.answers.length, m.correct]), fr.modules.map((m) => [m.id, m.answers.length, m.correct]), lang);
    for (const m of c.modules) assert.ok(m.explanation && m.explanation.length > 10, `${lang}.${m.id}.explanation`);
  }
});
