// Build-time only. Writes pre-recorded voice files so playback never depends on the voices installed on the device.
// audio/<lang>/turn-<n>.mp3 and check-<n>.mp3 for the built-in course; audio/courses/<id>/<lang>/... for bundled course files.
// Idempotent. Never imported by the app. The key is read from the environment only.
import { mkdir, writeFile, access, readFile, readdir } from "node:fs/promises";
import { CONTENT } from "../fixtures.js";
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY is not set"); process.exit(1); }
const FEMALE = process.env.ELEVENLABS_VOICE_FEMALE ?? "EXAVITQu4vr4xnSDxMaL";
const MALE = process.env.ELEVENLABS_VOICE_MALE ?? "JBFqnCBsd6RMkjVDRZzb";
const exists = (p) => access(p).then(() => true, () => false);

async function speak(out, text, voice) {
  if (await exists(out)) { console.log("skip ", out); return; }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  if (!res.ok) { console.error(`${out}: HTTP ${res.status} ${await res.text()}`); process.exit(1); }
  await writeFile(out, Buffer.from(await res.arrayBuffer()));
  console.log("wrote", out);
}

async function course(base, blocks, voice) {
  for (const [lang, block] of Object.entries(blocks)) {
    if (!block) continue;
    await mkdir(`${base}/${lang}`, { recursive: true });
    for (const [i, turn] of block.dialogue.entries()) await speak(`${base}/${lang}/turn-${i + 1}.mp3`, turn.text, voice);
    for (const [i, module] of block.modules.entries()) await speak(`${base}/${lang}/check-${i + 1}.mp3`, module.question, voice);
  }
}

await course("audio", { fr: CONTENT.fr, ar: CONTENT.ar }, FEMALE);
for (const file of (await readdir("courses")).filter((name) => name.endsWith(".json"))) {
  const data = JSON.parse(await readFile(`courses/${file}`, "utf8"));
  const voice = /^Client\b/.test(data.fr?.scenario?.customer ?? "") ? MALE : FEMALE;
  await course(`audio/courses/${data.id}`, { fr: data.fr, ar: data.ar }, voice);
}
