import { CONTENT } from "./fixtures.js";

const C = CONTENT.fr;
export const STORE_KEY = "bp-learning-v2";
export const LEGACY_KEY = "bp-historic-frontend-morocco-fr-v1";
export const DEFAULT = Object.freeze({
  version: 2,
  profile: Object.freeze({ name: "", lang: "fr" }),
  prep: Object.freeze([]),
  dialogueAnswers: Object.freeze([]),
  modules: Object.freeze({}),
  completedAt: null,
});

const LANGS = new Set(["fr", "ar"]);
const PREP_IDS = new Set(C.preparation.map((p) => p.id));
const MODULES = new Map(C.modules.map((m) => [m.id, m]));
const obj = (value) => value && typeof value === "object" && !Array.isArray(value);

export function validate(raw) {
  if (!obj(raw) || raw.version !== 2) return structuredClone(DEFAULT);
  const state = structuredClone(DEFAULT);
  const profile = obj(raw.profile) ? raw.profile : {};
  state.profile = {
    name: typeof profile.name === "string" ? profile.name.trim().slice(0, 40) : "",
    lang: LANGS.has(profile.lang) ? profile.lang : "fr",
  };
  state.prep = Array.isArray(raw.prep) ? [...new Set(raw.prep.filter((id) => PREP_IDS.has(id)))] : [];
  state.dialogueAnswers = [];
  if (Array.isArray(raw.dialogueAnswers)) {
    for (const answer of raw.dialogueAnswers.slice(0, C.dialogue.length)) {
      if (!Number.isInteger(answer) || answer < 0 || answer > 2) break;
      state.dialogueAnswers.push(answer);
    }
  }
  state.modules = {};
  if (obj(raw.modules)) {
    for (const [id, moduleState] of Object.entries(raw.modules)) {
      const definition = MODULES.get(id);
      if (definition && obj(moduleState) && Number.isInteger(moduleState.first) && moduleState.first >= 0 && moduleState.first < definition.answers.length) {
        state.modules[id] = { first: moduleState.first, solved: moduleState.solved === true };
      }
    }
  }
  state.completedAt = typeof raw.completedAt === "string" && !Number.isNaN(Date.parse(raw.completedAt)) ? raw.completedAt : null;
  return state;
}

export function migrateV1(raw) {
  if (!obj(raw) || !Array.isArray(raw.dialogueAnswers)) return null;
  const modules = {};
  if (obj(raw.quizAnswers)) {
    for (const [id, first] of Object.entries(raw.quizAnswers)) {
      const definition = MODULES.get(id);
      if (definition && Number.isInteger(first)) modules[id] = { first, solved: first === definition.correct };
    }
  }
  return validate({ version: 2, profile: DEFAULT.profile, prep: raw.prep, dialogueAnswers: raw.dialogueAnswers, modules, completedAt: null });
}

export function loadState(storage) {
  try {
    const v2 = JSON.parse(storage.getItem(STORE_KEY) ?? "null");
    if (v2) return { state: validate(v2), volatile: false };
    const v1 = migrateV1(JSON.parse(storage.getItem(LEGACY_KEY) ?? "null"));
    return { state: v1 ?? structuredClone(DEFAULT), volatile: false };
  } catch {
    return { state: structuredClone(DEFAULT), volatile: true };
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function dialogueScore(state) {
  const best = state.dialogueAnswers.filter((answer, index) => answer === C.dialogue[index].best).length;
  return { best, total: C.dialogue.length, pct: Math.round((best / C.dialogue.length) * 100) };
}

export function modulesSummary(state) {
  const all = Object.values(state.modules);
  return {
    solved: all.filter((moduleState) => moduleState.solved).length,
    firstTry: C.modules.filter((module) => state.modules[module.id]?.first === module.correct).length,
    total: C.modules.length,
  };
}

export function progress(state) {
  return Math.round(((state.dialogueAnswers.length + modulesSummary(state).solved) / (C.dialogue.length + C.modules.length)) * 100);
}

export function isComplete(state) {
  return state.dialogueAnswers.length === C.dialogue.length && modulesSummary(state).solved === C.modules.length;
}

export function nextRoute(state) {
  if (isComplete(state)) return "plan";
  if (state.dialogueAnswers.length === 0) return "prep";
  if (state.dialogueAnswers.length < C.dialogue.length) return "simulation";
  return "modules";
}
