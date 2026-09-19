import { validateCourse } from "./course.js";

const HEADERS = ["type", "langue", "cle", "texte", "reponse_1", "reponse_2", "reponse_3", "bonne_reponse", "explication", "reaction_bonne", "reaction_moins_bonne", "titre", "etiquette"];

function firstLine(text) {
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '"') {
      if (quoted && text[index + 1] === '"') { index += 1; continue; }
      quoted = !quoted;
    } else if (!quoted && (text[index] === "\n" || text[index] === "\r")) return text.slice(0, index);
  }
  return text;
}

function delimiterFor(text) {
  const header = firstLine(text);
  const semicolons = (header.match(/;/g) ?? []).length;
  const commas = (header.match(/,/g) ?? []).length;
  if (header.includes("\t") && semicolons === 0 && commas === 0) return "\t";
  return semicolons > commas ? ";" : ",";
}

export function parseCSV(text) {
  if (typeof text !== "string") return [];
  const source = text.replace(/^\uFEFF/, "");
  const delimiter = delimiterFor(source);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (!quoted && character === delimiter) {
      row.push(field); field = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((value) => value !== "") || rows.length) rows.push(row);
      row = [];
    } else field += character;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function number(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed - 1 : NaN;
}

function rowPath(rowNumber) {
  return `ligne ${rowNumber}`;
}

function addLanguage(raw, lang) {
  if (!raw[lang]) raw[lang] = { course: {}, scenario: {}, preparation: [], dialogue: [], modules: [] };
  return raw[lang];
}

function buildRaw(rows, rowNumbers) {
  const raw = { format: "bp-course-1", id: "", version: 0, fr: null };
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row.length || row.every((value) => value.trim() === "")) continue;
    const [type, language = "fr", key = "", text = "", answer1 = "", answer2 = "", answer3 = "", best = "", explanation = "", good = "", almost = "", title = "", label = ""] = row;
    const lang = language.trim().toLowerCase() === "ar" ? "ar" : "fr";
    const target = addLanguage(raw, lang);
    const rowNumber = rowNumbers[index];
    if (type.trim() === "meta") { raw.id = key.trim(); raw.version = Number(text); continue; }
    if (type.trim() === "cours") { target.course = { eyebrow: title.trim() || "Formation", title: title.trim(), duration: text.trim(), description: explanation.trim() }; continue; }
    if (type.trim() === "scene") { target.scenario = { initials: label.trim(), customer: title.trim(), context: text.trim(), goal: explanation.trim() }; continue; }
    if (type.trim() === "objectif") { target.preparation.push({ id: key.trim(), title: title.trim(), body: text.trim() }); continue; }
    if (type.trim() === "dialogue") {
      target.dialogue.push({ text: text.trim(), choices: [answer1, answer2, answer3].map((value) => value.trim()).filter((value, answerIndex, values) => answerIndex < values.findLastIndex((item) => item !== "") + 1), best: number(best), feedback: explanation.trim(), reactions: { good: good.trim(), almost: almost.trim() }, __row: rowNumber });
      continue;
    }
    if (type.trim() === "question") {
      target.modules.push({ id: key.trim(), label: label.trim(), title: title.trim(), description: explanation.trim(), question: text.trim(), answers: [answer1, answer2, answer3].map((value) => value.trim()).filter((value, answerIndex, values) => answerIndex < values.findLastIndex((item) => item !== "") + 1), correct: number(best), explanation: explanation.trim(), __row: rowNumber });
    }
  }
  return raw;
}

function rowForPath(path, rows) {
  const match = /^(fr|ar)\.(dialogue|modules|preparation)\[(\d+)\]/.exec(path);
  if (!match) return null;
  const item = rows[match[1]]?.[match[2]]?.[Number(match[3])];
  return item?.__row ?? null;
}

function stripRows(value) {
  if (Array.isArray(value)) return value.map(stripRows);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "__row").map(([key, item]) => [key, stripRows(item)]));
  return value;
}

export function courseFromCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length || rows[0].map((value) => value.trim()).join("\u0000") !== HEADERS.join("\u0000")) return { ok: false, errors: [{ code: "csv", path: "fichier", params: {} }] };
  const rowNumbers = rows.map((_, index) => index + 1);
  const rawWithRows = buildRaw(rows, rowNumbers);
  const raw = stripRows(rawWithRows);
  const result = validateCourse(raw);
  if (result.ok) return { ok: true, raw: result.course };
  return { ok: false, errors: result.errors.map((error) => ({ ...error, path: rowForPath(error.path, rawWithRows) ? rowPath(rowForPath(error.path, rawWithRows)) : error.path })) };
}

function cell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function courseToCSV(course) {
  const rows = [HEADERS, ["meta", "", course.id, course.version, "", "", "", "", "", "", "", "", ""]];
  for (const lang of ["fr", "ar"]) {
    const block = course[lang];
    if (!block) continue;
    rows.push(["cours", lang, "", block.course.duration, "", "", "", "", block.course.description ?? "", "", "", block.course.title, ""]);
    rows.push(["scene", lang, "", block.scenario.context, "", "", "", "", block.scenario.goal, "", "", block.scenario.customer, block.scenario.initials]);
    for (const item of block.preparation) rows.push(["objectif", lang, item.id, item.body, "", "", "", "", "", "", "", item.title, ""]);
    for (const item of block.dialogue) rows.push(["dialogue", lang, "", item.text, ...item.choices, item.best + 1, item.feedback, item.reactions.good, item.reactions.almost, "", ""]);
    for (const item of block.modules) rows.push(["question", lang, item.id, item.question, ...item.answers, item.correct + 1, item.explanation, "", "", item.title, item.label]);
  }
  return `\uFEFF${rows.map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}

export { HEADERS };
