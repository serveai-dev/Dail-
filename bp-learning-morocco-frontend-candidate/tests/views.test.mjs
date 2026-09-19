import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHTML, feedbackBar } from "../views/shared.js";

test("shared views escape HTML and support opt-out feedback focus", () => {
  assert.equal(escapeHTML('<img src=x onerror=alert(1)>').includes("<"), false);
  const options = { kind: "success", why: "a", actionLabel: "b", action: "c" };
  assert.equal(feedbackBar({ ...options, focus: false }).includes("data-focus"), false);
  assert.match(feedbackBar(options), /data-focus/);
});
