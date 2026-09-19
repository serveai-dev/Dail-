import { test } from "node:test";
import assert from "node:assert/strict";
import { play, stop } from "../audio.js";

test("play reports unavailable without speech synthesis", async () => {
  globalThis.window = {};
  assert.equal(await play(null, "x", "fr"), "unavailable");
});

test("play reports unavailable when mp3 playback rejects", async () => {
  globalThis.window = {};
  const el = { addEventListener() {}, pause() {}, play: async () => { throw new Error("blocked"); } };
  assert.equal(await play(el, "x", "fr"), "unavailable");
});

test("play selects an Arabic voice and waits for speech to end", async () => {
  const voice = { lang: "ar-SA", name: "Arabic Online" };
  let spoken;
  class MockUtterance {
    constructor(text) { this.text = text; }
  }
  globalThis.window = {
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: {
      getVoices: () => [voice],
      speak(utterance) { spoken = utterance; setTimeout(() => utterance.onend(), 0); },
      cancel() {},
    },
  };
  assert.equal(await play(null, "مرحبا", "ar"), "synth");
  assert.equal(spoken.voice, voice);
  assert.equal(spoken.lang, "ar-SA");
});

test("stop never throws", () => {
  globalThis.window = {};
  assert.doesNotThrow(() => stop());
});
