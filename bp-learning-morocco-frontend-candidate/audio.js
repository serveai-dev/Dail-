const SYNTH_LANG = { fr: "fr-FR", ar: "ar" };
let currentAudio = null;

function synth() {
  return globalThis.window?.speechSynthesis ?? globalThis.speechSynthesis ?? null;
}
function hasSource(element) {
  if (!element) return false;
  if (typeof element.getAttribute === "function") return Boolean(element.getAttribute("src"));
  return Boolean(element.src);
}

export async function voicesReady() {
  const speech = synth();
  if (!speech || typeof speech.getVoices !== "function") return [];
  let voices = speech.getVoices();
  if (voices.length || typeof speech.addEventListener !== "function") return voices;
  voices = await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      speech.removeEventListener?.("voiceschanged", finish);
      resolve(speech.getVoices());
    };
    const timer = setTimeout(finish, 1500);
    speech.addEventListener("voiceschanged", finish, { once: true });
  });
  return voices;
}

function preferredVoice(voices, lang) {
  const wanted = SYNTH_LANG[lang] ?? lang;
  const code = wanted.slice(0, 2).toLowerCase();
  const exact = voices.filter((voice) => voice.lang?.toLowerCase() === wanted.toLowerCase());
  const matches = exact.length ? exact : voices.filter((voice) => voice.lang?.toLowerCase().startsWith(code + "-") || voice.lang?.toLowerCase() === code);
  return [...matches].sort((left, right) => Number(/natural|online|google/i.test(right.name)) - Number(/natural|online|google/i.test(left.name)))[0] ?? null;
}

export async function hasVoice(lang) {
  return Boolean(preferredVoice(await voicesReady(), lang));
}

function tryMp3(element) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (success) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (currentAudio === element) currentAudio = null;
      resolve(success);
    };
    const timer = setTimeout(() => finish(false), 2000);
    currentAudio = element;
    try {
      element.addEventListener("ended", () => finish(true), { once: true });
      element.addEventListener("error", () => { try { element.pause(); } catch { /* fallback continues */ } finish(false); }, { once: true });
      Promise.resolve(element.play()).catch(() => finish(false));
    } catch {
      finish(false);
    }
  });
}

async function trySynth(text, lang) {
  const speech = synth();
  if (!speech) return false;
  const voice = preferredVoice(await voicesReady(), lang);
  if (!voice) return false;
  const Constructor = globalThis.window?.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance;
  if (typeof Constructor !== "function") return false;
  const utterance = new Constructor(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.95;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(true); } };
    utterance.addEventListener?.("end", finish, { once: true });
    utterance.addEventListener?.("error", finish, { once: true });
    utterance.onend = finish;
    utterance.onerror = finish;
    try { speech.speak(utterance); } catch { resolve(false); }
  });
}

export function stop() {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  } catch {
    currentAudio = null;
  }
  try { synth()?.cancel(); } catch { /* Audio cleanup must never interrupt the simulation. */ }
}

// Returns "mp3" | "synth" | "unavailable" and resolves when playback ends.
export async function play(element, text, lang, { allowMp3 = true } = {}) {
  try {
    stop();
    if (allowMp3 && hasSource(element) && await tryMp3(element)) return "mp3";
    return await trySynth(text, lang) ? "synth" : "unavailable";
  } catch {
    return "unavailable";
  }
}
