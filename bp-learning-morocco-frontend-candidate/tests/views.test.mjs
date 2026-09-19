import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT, validate } from "../state.js";
import * as welcome from "../views/welcome.js";
import * as simulation from "../views/simulation.js";
import * as checks from "../views/checks.js";
import * as summary from "../views/summary.js";
import * as manager from "../views/manager.js";

const date = "2026-09-19T10:00:00.000Z";
function stateFor(name = "Nadia", overrides = {}) {
  const id = "p-1";
  return validate({ version: 3, activeId: id, profiles: { [id]: { id, name, lang: "fr", createdAt: date, dialogueAnswers: [], modules: {}, completedAt: null, ...overrides } } });
}

test("welcome picker escapes profile names and first-run submit starts disabled", () => {
  const picker = welcome.render({ ...stateFor("<img src=x onerror=alert(1)>"), activeId: null }, { adding: false, nameDraft: "" });
  assert.equal(picker.includes("<img"), false);
  assert.ok(picker.includes("&lt;img src=x onerror=alert(1)&gt;"));
  const firstRun = welcome.render(DEFAULT, { adding: false, nameDraft: "" });
  assert.match(firstRun, /type="submit" disabled/);
  assert.match(firstRun, /class="name-input"/);
});

test("checks renders exactly one question", () => {
  const html = checks.render(stateFor("Nadia", { dialogueAnswers: [0, 0, 0] }), { checkIndex: 0, checkAttempt: {}, checkRetry: {} });
  assert.equal((html.match(/class="choice /g) ?? []).length, 3);
  assert.equal((html.match(/check-body/g) ?? []).length, 1);
  assert.match(html, /data-action="say"/);
  assert.equal((html.match(/translate="no"/g) ?? []).length, 3);
});

test("simulation feedback includes the customer's reaction", () => {
  const html = simulation.render(stateFor("Nadia", { dialogueAnswers: [0] }), { typing: false, revealedTurn: 0, feedbackTurn: 0 });
  assert.match(html, /ça me va très bien/);
  assert.match(html, /data-feedback-bar/);
});

test("summary contains a print-only certificate and escapes the learner name", () => {
  const html = summary.render(stateFor("<b>x</b>", { dialogueAnswers: [0, 0, 0], modules: { preference: { first: 0, solved: true }, structure: { first: 0, solved: true }, verification: { first: 0, solved: true } }, completedAt: date }));
  assert.match(html, /class="print-only certificate"/);
  assert.equal(html.includes("<b>x</b>"), false);
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
});

test("manager renders one row per profile and a truthful empty state", () => {
  const one = stateFor();
  const two = stateFor("Second");
  two.profiles["p-2"] = { ...two.profiles["p-1"], id: "p-2", name: "Second", createdAt: "2026-09-20T10:00:00.000Z" };
  assert.equal((manager.render(two).match(/<tbody>/g) ?? []).length, 1);
  const roster = manager.render(two);
  assert.equal((roster.slice(roster.indexOf("<tbody>"), roster.indexOf("</tbody>" )).match(/<tr>/g) ?? []).length, 2);
  assert.match(manager.render({ ...one, profiles: {}, activeId: null }), /Aucune personne/);
});
