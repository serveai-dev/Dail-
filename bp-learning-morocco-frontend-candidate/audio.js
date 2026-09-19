const SYNTH_LANG = { fr: "fr-FR", ar: "ar" };
let current = null;

export function stop() {
  try {
    if (current) {
      current.pause();
      current.currentTime = 0;
      current = null;
    }
  } catch {
    current = null;
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Audio cleanup must never interrupt the simulation.
  }
}

// el: <audio> element for this turn or null. Returns "mp3" | "synth" | "silent". Never throws.
export async function play(el, text, lang) {
  try {
    stop();
    if (el && (await tryMp3(el))) return "mp3";
    return trySynth(text, lang) ? "synth" : "silent";
  } catch {
    return "silent";
  }
}

function tryMp3(el) {
  return new Promise((resolve) => {
    let settled = false;
    current = el;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!ok) {
        try { el.pause(); } catch { /* fallback continues silently */ }
        if (current === el) current = null;
      }
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), 2000);
    try {
      el.addEventListener("playing", () => finish(true), { once: true });
      el.addEventListener("error", () => finish(false), { once: true });
      Promise.resolve(el.play()).catch(() => finish(false));
    } catch {
      finish(false);
    }
  });
}

function trySynth(text, lang) {
  const synth = window.speechSynthesis;
  if (!synth) return false;
  const wanted = SYNTH_LANG[lang];
  if (!wanted) return false;
  if (!synth.getVoices().some((voice) => voice.lang.toLowerCase().startsWith(wanted.slice(0, 2)))) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = wanted;
  utterance.rate = 0.95;
  synth.speak(utterance);
  return true;
}
