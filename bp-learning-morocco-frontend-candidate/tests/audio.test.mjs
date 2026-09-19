import { test } from "node:test";
import assert from "node:assert/strict";
import { play, stop } from "../audio.js";

test("play falls silent without speech synthesis", async () => {
  globalThis.window = {};
  assert.equal(await play(null, "x", "fr"), "silent");
});

test("play falls silent when mp3 playback rejects", async () => {
  globalThis.window = {};
  const el = { addEventListener() {}, pause() {}, play: async () => { throw new Error("blocked"); } };
  assert.equal(await play(el, "x", "fr"), "silent");
});

test("stop never throws", () => {
  globalThis.window = {};
  assert.doesNotThrow(() => stop());
});
