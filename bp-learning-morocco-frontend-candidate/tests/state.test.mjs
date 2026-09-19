import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT, STORE_KEY, V2_KEY, LEGACY_KEY, validate, migrateV1, migrateV2, loadState, saveState, createProfile, setActive, activeProfile, listProfiles, resetProfile, progress, dialogueScore, modulesSummary, stepsDone, isComplete, nextRoute } from "../state.js";
import { CONTENT } from "../fixtures.js";

const mem = (init = {}) => { const map = new Map(Object.entries(init)); return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) }; };
const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
const date = "2026-09-19T10:00:00.000Z";

function v2(name = "Nadia", lang = "fr") {
  return { version: 2, profile: { name, lang }, dialogueAnswers: [0, 2], modules: { preference: { first: 0, solved: true } }, completedAt: null };
}

function profileState(overrides = {}) {
  const id = "p-1";
  return validate({ version: 3, activeId: id, profiles: { [id]: { id, name: "Nadia", lang: "fr", createdAt: date, dialogueAnswers: [], modules: {}, completedAt: null, ...overrides } } });
}

test("validate drops invalid profiles and active ids that point nowhere", () => {
  const state = validate({ version: 3, activeId: "bad", profiles: {
    good: { id: "good", name: "  Sam  ", lang: "fr", createdAt: date, dialogueAnswers: [0, 7], modules: {}, completedAt: null },
    bad: { id: "bad", name: "", lang: "de", createdAt: "nope" },
  } });
  assert.equal(state.activeId, null);
  assert.deepEqual(Object.keys(state.profiles), ["good"]);
  assert.equal(state.profiles.good.name, "Sam");
  assert.deepEqual(state.profiles.good.dialogueAnswers, [0]);
});

test("migrateV2 keeps identity and progress", () => {
  const migrated = migrateV2(v2(" Nadia ", "ar"));
  const profile = activeProfile(migrated);
  assert.equal(migrated.version, 3);
  assert.equal(profile.name, "Nadia");
  assert.equal(profile.lang, "ar");
  assert.deepEqual(profile.dialogueAnswers, [0, 2]);
  assert.deepEqual(profile.modules, { preference: { first: 0, solved: true } });
});

test("loadState follows v3, then v2, then v1 migration order", () => {
  const v3 = profileState();
  assert.equal(loadState(mem({ [STORE_KEY]: JSON.stringify(v3) })).state.activeId, "p-1");
  assert.equal(activeProfile(loadState(mem({ [V2_KEY]: JSON.stringify(v2("Nadia", "ar")) })).state).lang, "ar");
  const legacy = { name: "Legacy", lang: "fr", dialogueAnswers: [1], quizAnswers: { preference: 1 } };
  const migrated = loadState(mem({ [LEGACY_KEY]: JSON.stringify(legacy) })).state;
  assert.equal(activeProfile(migrated).name, "Legacy");
  assert.deepEqual(activeProfile(migrated).dialogueAnswers, [1]);
});

test("nameless v2 progress is dropped and storage failures are volatile", () => {
  assert.deepEqual(migrateV2(v2("   ")), DEFAULT);
  assert.deepEqual(loadState(throwing).state, DEFAULT);
  assert.equal(saveState(throwing, DEFAULT), false);
  assert.equal(saveState(mem(), DEFAULT), true);
});

test("migrateV1 maps quiz answers into the v2-to-v3 path", () => {
  const v1 = migrateV1({ name: "Legacy", lang: "fr", dialogueAnswers: [0, 2], quizAnswers: { preference: 0, structure: 1 } });
  assert.equal(v1.version, 2);
  const migrated = migrateV2(v1);
  assert.deepEqual(activeProfile(migrated).modules, { preference: { first: 0, solved: true }, structure: { first: 1, solved: false } });
});

test("createProfile trims, caps, rejects empty, and stops at twelve", () => {
  const state = structuredClone(DEFAULT);
  assert.equal(createProfile(state, "   ", "fr"), null);
  const id = createProfile(state, `  ${"x".repeat(50)}  `, "ar");
  assert.equal(state.profiles[id].name.length, 40);
  for (let index = 1; index < 12; index += 1) assert.ok(createProfile(state, `Person ${index}`, "fr"));
  assert.equal(Object.keys(state.profiles).length, 12);
  assert.equal(createProfile(state, "Thirteenth", "fr"), null);
});

test("profiles can be activated, listed, and reset", () => {
  const state = structuredClone(DEFAULT);
  const first = createProfile(state, "First", "fr");
  const second = createProfile(state, "Second", "fr");
  assert.equal(setActive(state, "missing"), false);
  assert.equal(setActive(state, first), true);
  state.profiles[first].dialogueAnswers = [0];
  state.profiles[first].modules = { preference: { first: 0, solved: true } };
  state.profiles[first].completedAt = date;
  assert.equal(activeProfile(state).id, first);
  assert.deepEqual(listProfiles(state).map((profile) => profile.id), [first, second]);
  assert.equal(resetProfile(state, first), true);
  assert.deepEqual(state.profiles[first].dialogueAnswers, []);
  assert.equal(state.profiles[first].name, "First");
});

test("score helpers and nextRoute use a profile", () => {
  let state = profileState();
  let profile = activeProfile(state);
  assert.equal(nextRoute(profile), "simulation");
  profile.dialogueAnswers = [0, 0, 0];
  assert.equal(nextRoute(profile), "checks");
  profile.modules = { preference: { first: 0, solved: true }, structure: { first: 0, solved: true }, verification: { first: 0, solved: true } };
  assert.equal(nextRoute(profile), "summary");
  assert.equal(isComplete(profile), true);
  assert.equal(stepsDone(profile), 6);
  assert.equal(progress(profile), 100);
  assert.deepEqual(dialogueScore(profile), { best: 3, total: 3, pct: 100 });
  assert.deepEqual(modulesSummary(profile), { solved: 3, firstTry: 3, total: CONTENT.fr.modules.length });
});
