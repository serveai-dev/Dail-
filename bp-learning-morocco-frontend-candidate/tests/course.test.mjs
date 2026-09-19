import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT } from "../fixtures.js";
import { setActiveCourse } from "../fixtures.js";
import { validateCourse, parseCourseFile, courseKey } from "../course.js";
import { syncCourse, validate } from "../state.js";
import * as manager from "../views/manager.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const examplePath = path.join(root, "..", "courses", "exemple-cours.json");
const builtIn = { format: "bp-course-1", id: "cours-par-defaut", version: 1, fr: CONTENT.fr, ar: CONTENT.ar };

function validCourse() {
  return {
    format: "bp-course-1",
    id: "accueil-client-presse",
    version: 1,
    fr: {
      course: { title: "Accueil", duration: "15 minutes", eyebrow: "Communication" },
      scenario: { initials: "CF", customer: "Client fictif", context: "Une situation", goal: "Accueillir avec tact" },
      preparation: [
        { id: "un", title: "Un", body: "Premier point" },
        { id: "deux", title: "Deux", body: "Deuxième point" },
        { id: "trois", title: "Trois", body: "Troisième point" },
      ],
      dialogue: [0, 1, 2].map((index) => ({
        text: `Question ${index}`,
        choices: ["Réponse A", "Réponse B", "Réponse C"],
        best: 0,
        feedback: "Un retour",
        reactions: { good: "Merci", almost: "Je comprends" },
      })),
      modules: ["a", "b", "c"].map((id) => ({
        id,
        label: "Contrôle",
        title: "Question",
        description: "Une question",
        question: "Que faire ?",
        answers: ["A", "B", "C"],
        correct: 0,
        explanation: "Une explication",
      })),
    },
  };
}

test("the built-in CONTENT reshaped as a course validates", () => {
  const result = validateCourse(builtIn);
  assert.equal(result.ok, true);
  assert.equal(courseKey(result.course), "cours-par-defaut@1");
});

test("the example course validates", () => {
  const result = validateCourse(JSON.parse(fs.readFileSync(examplePath, "utf8")));
  assert.equal(result.ok, true);
  assert.equal(result.course.id, "orienter-vers-pharmacien");
});

test("course validation reports choice count, bad index, missing context, and duplicate ids", () => {
  const tooFewChoices = validCourse();
  tooFewChoices.fr.dialogue[0].choices = ["Une", "Deux"];
  let result = validateCourse(tooFewChoices);
  assert.ok(result.errors.some((error) => error.code === "count" && error.path.includes("dialogue[0].choices")));

  const badBest = validCourse();
  badBest.fr.dialogue[0].best = 5;
  result = validateCourse(badBest);
  assert.ok(result.errors.some((error) => error.code === "index" && error.path.includes("dialogue[0].best")));

  const missingContext = validCourse();
  delete missingContext.fr.scenario.context;
  result = validateCourse(missingContext);
  assert.ok(result.errors.some((error) => error.code === "missing" && error.path.includes("scenario.context")));

  const duplicateModules = validCourse();
  duplicateModules.fr.modules[1].id = duplicateModules.fr.modules[0].id;
  result = validateCourse(duplicateModules);
  assert.ok(result.errors.some((error) => error.code === "duplicateId" && error.path.includes("modules[1].id")));
});

test("parseCourseFile reports malformed JSON and oversized files", () => {
  assert.equal(parseCourseFile("{").errors[0].code, "json");
  assert.equal(parseCourseFile("x".repeat(200001)).errors[0].code, "size");
});

test("validation rebuilds known keys and drops unknown keys", () => {
  const raw = validCourse();
  raw.onclick = "x";
  raw.fr.course.onclick = "x";
  const result = validateCourse(raw);
  assert.equal(result.ok, true);
  assert.equal("onclick" in result.course, false);
  assert.equal("onclick" in result.course.fr.course, false);
});

test("syncCourse resets only profiles from another course", () => {
  const state = validate({ version: 3, activeId: "old", profiles: {
    old: { id: "old", name: "Ancien", lang: "fr", courseKey: "old@1", createdAt: "2026-09-19T10:00:00.000Z", dialogueAnswers: [0], modules: { a: { first: 0, solved: true } }, completedAt: "2026-09-19T10:00:00.000Z" },
    same: { id: "same", name: "Même", lang: "fr", courseKey: "new@2", createdAt: "2026-09-20T10:00:00.000Z", dialogueAnswers: [], modules: {}, completedAt: null },
  } });
  assert.equal(syncCourse(state, "new@2"), 1);
  assert.deepEqual(state.profiles.old.dialogueAnswers, []);
  assert.equal(state.profiles.old.courseKey, "new@2");
  assert.equal(state.profiles.same.courseKey, "new@2");
});

test("manager escapes an imported course title", () => {
  const raw = validCourse();
  raw.fr.course.title = "<img src=x onerror=alert(1)>";
  const result = validateCourse(raw);
  assert.equal(result.ok, true);
  setActiveCourse(result.course);
  const html = manager.render(validate({ version: 3, activeId: null, profiles: {} }));
  assert.equal(html.includes("<img"), false);
  setActiveCourse(null);
});
