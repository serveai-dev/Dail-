import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHTML, feedbackBar } from "../views/shared.js";
import { DEFAULT, validate } from "../state.js";
import { t } from "../i18n.js";
import * as certificate from "../views/certificate.js";
import * as manager from "../views/manager.js";

test("shared views escape HTML and support opt-out feedback focus", () => {
  assert.equal(escapeHTML('<img src=x onerror=alert(1)>').includes("<"), false);
  const options = { kind: "success", why: "a", actionLabel: "b", action: "c" };
  assert.equal(feedbackBar({ ...options, focus: false }).includes("data-focus"), false);
  assert.match(feedbackBar(options), /data-focus/);
});

function completeState(name = "Nadia") {
  return validate({
    version: 2,
    profile: { name, lang: "fr" },
    prep: [],
    dialogueAnswers: [0, 0, 0],
    modules: {
      preference: { first: 0, solved: true },
      structure: { first: 0, solved: true },
      verification: { first: 0, solved: true },
    },
    completedAt: "2026-09-19T10:00:00.000Z",
  });
}

test("certificate escapes the learner name and shows complete facts", () => {
  const html = certificate.render(completeState("<b>x</b>"));
  assert.equal(html.includes("<b>"), false);
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /cert-facts/);
});

test("certificate shows the locked state when incomplete", () => {
  const html = certificate.render(DEFAULT);
  assert.match(html, new RegExp(t("cert.locked")));
  assert.equal(html.includes("cert-facts"), false);
});

test("manager shows an honest empty state by default", () => {
  const html = manager.render(DEFAULT);
  assert.match(html, new RegExp(t("manager.empty")));
  assert.equal(html.includes("manager-card"), false);
});

test("manager renders exactly one learner card after completion", () => {
  const html = manager.render(completeState());
  assert.equal((html.match(/manager-card/g) ?? []).length, 1);
});
