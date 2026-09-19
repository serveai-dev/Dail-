// Build-time only. Reads dialogue lines, writes audio/<lang>/turn-<n>.mp3. Idempotent. Never imported by the app.
import { mkdir, writeFile, access } from "node:fs/promises";
import { CONTENT } from "../fixtures.js";
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY is not set"); process.exit(1); }
const VOICES = { fr: process.env.ELEVENLABS_VOICE_FR ?? "EXAVITQu4vr4xnSDxMaL", ar: process.env.ELEVENLABS_VOICE_AR ?? "EXAVITQu4vr4xnSDxMaL" };
const langs = (process.argv[2] ?? "fr,ar").split(",").filter((l) => CONTENT[l]);
const exists = (p) => access(p).then(() => true, () => false);
for (const lang of langs) {
  await mkdir(`audio/${lang}`, { recursive: true });
  for (const [i, turn] of CONTENT[lang].dialogue.entries()) {
    const out = `audio/${lang}/turn-${i + 1}.mp3`;
    if (await exists(out)) { console.log("skip ", out); continue; }
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[lang]}?output_format=mp3_44100_64`, {
      method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ text: turn.text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!res.ok) { console.error(`${out}: HTTP ${res.status} ${await res.text()}`); process.exit(1); }
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
    console.log("wrote", out);
  }
}
