import { CONTENT } from "./fixtures.js";

const C = CONTENT.fr;
export const STORE_KEY = "bp-learning-v3";
export const V2_KEY = "bp-learning-v2";
export const LEGACY_KEY = "bp-historic-frontend-morocco-fr-v1";
const LANGS = new Set(["fr", "ar"]);
const MODULES = new Map(C.modules.map((module) => [module.id, module]));
const object = (value) => value && typeof value === "object" && !Array.isArray(value);

export const DEFAULT = Object.freeze({ version: 3, activeId: null, profiles: {} });

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function cleanAnswers(value) {
  const answers = [];
  if (!Array.isArray(value)) return answers;
  for (const answer of value.slice(0, C.dialogue.length)) {
    if (!Number.isInteger(answer) || answer < 0 || answer > 2) break;
    answers.push(answer);
  }
  return answers;
}

function cleanModules(value) {
  const modules = {};
  if (!object(value)) return modules;
  for (const [id, record] of Object.entries(value)) {
    const definition = MODULES.get(id);
    if (definition && object(record) && Number.isInteger(record.first) && record.first >= 0 && record.first < definition.answers.length) {
      modules[id] = { first: record.first, solved: record.solved === true };
    }
  }
  return modules;
}

function cleanProfile(id, raw) {
  if (!object(raw) || typeof raw.id !== "string" || raw.id !== id || typeof raw.name !== "string" || !raw.name.trim() || !validDate(raw.createdAt)) return null;
  if (!LANGS.has(raw.lang)) return null;
  return {
    id,
    name: raw.name.trim().slice(0, 40),
    lang: raw.lang,
    createdAt: raw.createdAt,
    dialogueAnswers: cleanAnswers(raw.dialogueAnswers),
    modules: cleanModules(raw.modules),
    completedAt: raw.completedAt === null || raw.completedAt === undefined ? null : validDate(raw.completedAt) ? raw.completedAt : null,
  };
}

export function validate(raw) {
  if (!object(raw) || raw.version !== 3) return structuredClone(DEFAULT);
  const profiles = {};
  if (object(raw.profiles)) {
    for (const [id, value] of Object.entries(raw.profiles)) {
      const profile = cleanProfile(id, value);
      if (profile) profiles[id] = profile;
    }
  }
  return {
    version: 3,
    activeId: typeof raw.activeId === "string" && profiles[raw.activeId] ? raw.activeId : null,
    profiles,
  };
}

function v2Record(raw) {
  if (!object(raw) || raw.version !== 2 || !object(raw.profile)) return null;
  const name = typeof raw.profile.name === "string" ? raw.profile.name.trim().slice(0, 40) : "";
  if (!name) return null;
  return {
    version: 2,
    profile: { name, lang: LANGS.has(raw.profile.lang) ? raw.profile.lang : "fr" },
    dialogueAnswers: cleanAnswers(raw.dialogueAnswers),
    modules: cleanModules(raw.modules),
    completedAt: validDate(raw.completedAt) ? raw.completedAt : null,
  };
}

export function migrateV2(raw) {
  const source = v2Record(raw);
  if (!source) return structuredClone(DEFAULT);
  const id = globalThis.crypto.randomUUID();
  return {
    version: 3,
    activeId: id,
    profiles: {
      [id]: {
        id,
        name: source.profile.name,
        lang: source.profile.lang,
        createdAt: new Date().toISOString(),
        dialogueAnswers: source.dialogueAnswers,
        modules: source.modules,
        completedAt: source.completedAt,
      },
    },
  };
}

export function migrateV1(raw) {
  if (!object(raw) || !Array.isArray(raw.dialogueAnswers)) return null;
  const modules = {};
  if (object(raw.quizAnswers)) {
    for (const [id, first] of Object.entries(raw.quizAnswers)) {
      const definition = MODULES.get(id);
      if (definition && Number.isInteger(first)) modules[id] = { first, solved: first === definition.correct };
    }
  }
  return {
    version: 2,
    profile: { name: typeof raw.name === "string" ? raw.name : "", lang: LANGS.has(raw.lang) ? raw.lang : "fr" },
    dialogueAnswers: raw.dialogueAnswers,
    modules,
    completedAt: null,
  };
}

export function loadState(storage) {
  try {
    const v3Value = storage.getItem(STORE_KEY);
    if (v3Value !== null) return { state: validate(JSON.parse(v3Value)), volatile: false };
    const v2Value = storage.getItem(V2_KEY);
    if (v2Value !== null) return { state: migrateV2(JSON.parse(v2Value)), volatile: false };
    const legacy = migrateV1(JSON.parse(storage.getItem(LEGACY_KEY) ?? "null"));
    return { state: legacy ? migrateV2(legacy) : structuredClone(DEFAULT), volatile: false };
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

export function createProfile(state, name, lang) {
  const cleanName = typeof name === "string" ? name.trim().slice(0, 40) : "";
  if (!cleanName || Object.keys(state.profiles).length >= 12) return null;
  const id = globalThis.crypto.randomUUID();
  state.profiles[id] = {
    id,
    name: cleanName,
    lang: LANGS.has(lang) ? lang : "fr",
    createdAt: new Date().toISOString(),
    dialogueAnswers: [],
    modules: {},
    completedAt: null,
  };
  state.activeId = id;
  return id;
}

export function setActive(state, id) {
  if (typeof id !== "string" || !state.profiles[id]) return false;
  state.activeId = id;
  return true;
}

export function activeProfile(state) {
  return state.activeId && state.profiles[state.activeId] ? state.profiles[state.activeId] : null;
}

export function listProfiles(state) {
  return Object.values(state.profiles).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function resetProfile(state, id) {
  const profile = state.profiles[id];
  if (!profile) return false;
  profile.dialogueAnswers = [];
  profile.modules = {};
  profile.completedAt = null;
  return true;
}

export function dialogueScore(profile) {
  const best = profile.dialogueAnswers.filter((answer, index) => answer === C.dialogue[index]?.best).length;
  return { best, total: C.dialogue.length, pct: Math.round((best / C.dialogue.length) * 100) };
}

export function modulesSummary(profile) {
  return {
    solved: C.modules.filter((module) => profile.modules[module.id]?.solved === true).length,
    firstTry: C.modules.filter((module) => profile.modules[module.id]?.first === module.correct).length,
    total: C.modules.length,
  };
}

export function stepsDone(profile) {
  return Math.min(6, profile.dialogueAnswers.length + modulesSummary(profile).solved);
}

export function progress(profile) {
  return Math.round((stepsDone(profile) / 6) * 100);
}

export function isComplete(profile) {
  return profile.dialogueAnswers.length === C.dialogue.length && modulesSummary(profile).solved === C.modules.length;
}

export function nextRoute(profile) {
  if (profile.dialogueAnswers.length < C.dialogue.length) return "simulation";
  if (modulesSummary(profile).solved < C.modules.length) return "checks";
  return "summary";
}
