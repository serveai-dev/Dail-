# BP Learning Redesign (track A3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans, one phase per step, with a review checkpoint after each phase. Steps use checkbox (`- [ ]`) syntax for tracking. Run `ponytail:ponytail-review` before every commit. Run `superpowers:verification-before-completion` at the end of Phase 7.

**Goal:** Redesign the complete learner path of the delivered BP Learning app (onboarding → start → prep → simulation → result → modules → plan → certificate) plus a thin manager view, FR + AR (MSA, RTL), pre-generated voice, and every rubric artifact, demo-ready by 17:30.

**Architecture:** Vanilla ES modules served statically, no build. One delegated event listener in `app.js` maps `data-action` to state transitions; each view exports `render(state, ui) → html`. `state.js` is pure (storage injected) so `node --test` covers load/migrate/validate. Content lives in `fixtures.js` keyed by language; UI strings in `locales/`. Audio is pre-generated `.mp3` with `speechSynthesis` fallback, then silence.

**Tech Stack:** HTML, CSS (logical properties, tokens), vanilla JS ES modules, Node 24 (`node --test`, audio generation script), Playwright MCP for evidence, Gemini CLI + Codex CLI for delegated files.

**Spec:** `docs/superpowers/specs/2026-09-19-bp-learning-redesign-design.md` (authoritative). Rubric: `bp-learning-morocco-frontend-candidate/CHALLENGE.md`. Baseline commit `f38c2a1`.

**Paths:** repo root = `C:\Users\RACHI\Desktop\CLAUDE\bp-learning-morocco-frontend-candidate\`. The app lives in the nested folder `bp-learning-morocco-frontend-candidate/` (called `APP/` below). Evidence goes to `docs/evidence/` at repo root. All shell commands are Git Bash and start from repo root unless noted. `$S` = the session scratchpad `C:/Users/RACHI/AppData/Local/Temp/claude/c--Users-RACHI-Desktop-CLAUDE-bp-learning-morocco-frontend-candidate/19f9d34a-8abd-4eb6-be8b-c8c9b3947c9a/scratchpad`.

## Global Constraints (from spec, verbatim where it matters)

- No framework, bundler, backend, or runtime network call. `connect-src 'none'` stays.
- CSP final value, exactly: `default-src 'self'; connect-src 'none'; font-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`. Only `font-src` changes (`'none'` → `'self'`).
- Fonts: IBM Plex Sans + IBM Plex Sans Arabic, self-hosted `.woff2` in `APP/fonts/`. Fallback `system-ui, "Segoe UI", Tahoma, sans-serif`.
- Tokens (spec §10): `--bg #F6FAF8 --surface #FFFFFF --text #14211C --muted #4F6259 --border #D7E2DC --primary #1B7A5E --primary-strong #145F49 --primary-soft #E3F2EB --attention #B45309 --attention-soft #FEF3E2 --focus #0B5FFF --radius 14px --radius-sm 10px`, space scale 4/8/12/16/24/32/48.
- Type: body 18px, small 15px, h3 20, h2 24, h1 32; Arabic ×1.08; line-height 1.6 Latin / 1.8 Arabic; max line 68ch. Targets ≥ 44×44. Visible focus ring everywhere.
- Languages: FR + AR (MSA). Darija only inside dialogue content. Numerals Western in both; dates via `Intl.DateTimeFormat`.
- Storage key `bp-learning-v2`; v1 key `bp-historic-frontend-morocco-fr-v1` read once and migrated.
- Learner name: ≤ 40 chars, `escapeHTML` at every render site, grep-audited before each commit.
- Secrets: `ELEVENLABS_API_KEY` env var only. `.env` is gitignored and untracked (verified). DeepSeek key rotation is the owner's action, outside this plan.
- Rejected: streaks, badges, leaderboards, live LLM chat, Darija UI, a second scenario for AR.
- Minute budgets (spec §19): P0 20 · P1 60 · P2 45 · P3 60 · P4 45 · P5 40 · P6 30 · P7 45 · buffer 60+.

---

## Execution model (revised by the owner at approval time)

Per phase, the same loop, with the owner reviewing between phases:

1. **Gemini CLI codes.** Claude writes a phase brief into the scratchpad (files, interfaces from this plan, acceptance checks, the code blocks below as the reference implementation) and runs `gemini -p "$(cat brief.md)" --approval-mode yolo --skip-trust` from `APP/` so Gemini edits the files in place. Phases 0 and 7 (evidence, docs) stay with Claude; Gemini takes Phases 1–6 code. `styles/tokens.css` stays with Codex as planned.
2. **Codex reviews Gemini's diff.** `git diff | codex exec -s read-only -o "$S/review-<phase>.md" "Review this diff against the attached plan section for bugs, missing acceptance items, XSS (learner name must be escaped), CSP violations, physical CSS properties, and anything that would break at 390px or in RTL. List findings with file:line and a fix. Output only the findings."` with the plan section appended via stdin.
3. **Claude reviews everything against this plan** (this session): reads the diff and the Codex findings, runs `node --test tests/`, `node --check`, the grep audits, and the Playwright checks listed in the phase's Verify step. Skills used per phase as already listed (`ecc:frontend-design-direction`, `ui-ux-pro-max`, `clarify`, `ecc:accessibility`, `ponytail:ponytail-review`, `superpowers:verification-before-completion`).
4. **If the phase fails its acceptance**, Claude writes a fix brief (the exact findings) and sends it back to Gemini; the loop repeats. After two failed iterations on the same finding, Claude fixes it directly so the clock is protected, and says so in the phase report.
5. **Commit only after Claude's review passes.** Then the phase report goes to the owner for review before the next phase starts.

Owner runs the ElevenLabs generation (key never enters any CLI here). Gemini also drafts `locales/ar.js` and the Arabic fixtures as planned in Phase 2.

## Ambiguities, disagreements, and how I resolve them (please confirm or override)

| # | Where | Issue | Recommendation (applied in this plan) |
|---|---|---|---|
| A1 | §4, §13 | Which README carries Problem/References/Run it/Assumptions? The existing README is inside `APP/`; `docs/evidence/` is at repo root. A grader opening the repo root sees nothing. | Rewrite the existing `APP/README.md` as the submission README (edit, not create). Add a 6-line root `README.md` that points to it. Only new file at root. |
| A2 | §7.3 vs §12 vs §7.7 | Prep is optional and no longer gates, but the delivered progress formula weights it 1/3. A learner who skips prep caps at 67 % while `completedAt` fires anyway. | Progress = (dialogue turns answered + modules solved) / 6. Prep shows a "Lu / Facultatif" status but never counts. Manager "completion %" uses the same number. |
| A3 | §5 "scripted branching" vs §7.4 linear turn cycle and the delivered linear content | The customer's next line does not depend on the choice in the fixtures. | Keep linear. The feedback bar carries the reaction. Branching would double authoring in two languages for no rubric gain (same reasoning as §16 last bullet). |
| A4 | §13 lists one `styles.css`; §18 has Codex draft `styles/tokens.css` | Two files or one? | Two: `APP/styles/tokens.css` (tokens, `@font-face`, type scale, reset) linked before `styles.css`. Keeps the Codex delegation self-contained and reviewable. |
| A5 | §15 "1/2/3 select" | Applies to modules too? Three module cards with three answers each on one page make digit keys ambiguous. | Digit keys only in the simulation. Modules use Tab + Enter/Space (native buttons). Documented in keyboard-run.md. |
| A6 | §7.7 "Télécharger l'attestation" | Nothing is downloaded; the certificate is printed or saved as PDF by the browser. Misleading label for a non-technical user. | Plan button: "Voir l'attestation". Certificate page button: "Imprimer ou enregistrer en PDF". The `clarify` pass will confirm wording. |
| A7 | §7.9 | Manager view with partial progress: card or empty state? | Empty state until `completedAt` is set. No partial card. Simplest honest reading of "when nothing is complete". |
| A8 | §7.2/§7.5 progress and score rings + CSP `style-src 'self'` | Inline `style=""` attributes are blocked by this CSP. | Rings read a CSS custom property `--pct` that `app.js` sets via CSSOM (`el.style.setProperty`) after render. CSSOM writes are not blocked by CSP. No `'unsafe-inline'`. |
| A9 | §13 module list | Nine views share `escapeHTML`, `routeLink`, `feedbackBar`. Spec lists no shared file. | Add `APP/views/shared.js`. One extra file vs copying helpers nine times. |
| A10 | §19 puts locales in Phase 4 | If Phase 1 views hardcode French, Phase 4 re-touches every view. | Phase 1 already routes all strings through `t()` with `locales/fr.js`. Phase 4 adds `ar.js`, the switch, the onboarding step, and RTL checks. Gemini translation runs in the background during Phase 2 as the spec says. |
| A11 | §20 open question | ElevenLabs voice ids. | Script reads `ELEVENLABS_VOICE_FR` / `ELEVENLABS_VOICE_AR` env vars, default `EXAVITQu4vr4xnSDxMaL` (premade multilingual "Sarah"). Phase 3 step lists voices with one `curl` so you can pick. **The generation command is run by you in your own terminal**, so the key never passes through Claude's shell or this transcript. |
| A12 | §7.4 audio fallback | Chrome will "speak" Arabic with a French voice if no `ar` voice is installed, which sounds broken. | `audio.js` checks `speechSynthesis.getVoices()` for a voice whose lang starts with the target; if none, it goes silent. Windows without the Arabic language pack → silent AR fallback. Documented in README assumptions. |
| A13 | §7.4 audio autoplay | Reload directly on `#simulation` has no user gesture; `play()` rejects. | Caught → silent; "Écouter" replays on click. Never blocks. Matches "never blocks". |
| A14 | Delivered copy mixes `tu` ("Ta progression") and `vous` | Audience is 30–50 professionals. | All UI in `vous`. Dialogue content already uses `vous`. |
| A15 | `FILE-MANIFEST.sha256` | Will be stale after any change. | Leave untouched; README says it describes the baseline package at `f38c2a1`. Regenerating it would invite a hash-mismatch question at the demo. |
| A16 | Delivered `fixtures.learner` ("Nadia A. · profil fictif") | The header profile now shows the real first name. | Remove `learner` from fixtures. The profile button shows the learner's initial + name (escaped). |
| A17 | Playwright MCP screenshot location | The MCP writes into its own output dir (`.playwright-mcp/` under cwd), not an arbitrary path. | Capture with a `before-`/`after-` filename prefix, then `mv` into `docs/evidence/…`. Add `.playwright-mcp/` to `.gitignore` in Phase 0. |
| A18 | Tests location | Spec §13 puts `tests/` inside the app. Node needs `"type":"module"` for `.js` ESM imports without warnings. | `APP/package.json` with `{"type":"module","private":true,"scripts":{"test":"node --test tests/"}}`. No dependencies. |

## What I will NOT do

- Add a framework, bundler, backend, service worker, analytics, or any runtime fetch/XHR.
- Change any CSP directive other than `font-src`.
- Invent employees, scores, dates, or history for the manager view. No seed/demo data toggle.
- Add streaks, badges, leaderboards, confetti, or gamified copy.
- Add Darija to the interface, or a second scenario for Arabic.
- Commit any `.env`, key, or the `.playwright-mcp/` output folder. Rotate the DeepSeek key (owner action; I will remind at Phase 0).
- Delete files without asking. The toast markup is removed from `index.html` as part of its rewrite; no repo file is deleted.
- Regenerate `FILE-MANIFEST.sha256`.
- Write the Arabic strings myself. Gemini drafts them; I review structure/placeholders/`node --check`; a native reader (Dale team) spot-checks wording. If no reader is available before 17:30, README flags it.
- Run the ElevenLabs generation with the key in Claude's shell. You run it.
- Build a `<canvas>`/SVG animated ring, a custom dialog, a custom select, or a custom checkbox. Native `<dialog>`, `<select>`, `<input type=checkbox>`, `<progress>`.

## File map (after Phase 7)

```
README.md                                  NEW  6-line pointer to APP/README.md and docs/evidence
.gitignore                                 MOD  + .playwright-mcp/
docs/evidence/before/*.png + README.md     NEW  Phase 0
docs/evidence/after/*.png                  NEW  Phase 7
docs/evidence/keyboard-run.md              NEW  Phase 7
docs/evidence/user-test.md                 NEW  Phase 7 (template, filled after the test)
docs/superpowers/plans/2026-09-19-bp-learning-redesign-plan.md  NEW  copy of this plan
APP/README.md                              MOD  Problem · References · Run it · Assumptions · Evidence links
APP/package.json                           NEW  type=module, test script
APP/index.html                             MOD  ES module, CSP font-src, header/main shells, no toast
APP/app.js                                 MOD  rewritten: router, delegated listeners, ui state, afterRender
APP/state.js                               NEW  DEFAULT, validate, migrateV1, loadState, saveState, derived getters
APP/i18n.js                                NEW  t, setLang, getLang, dir, formatDate
APP/locales/fr.js  APP/locales/ar.js       NEW  flat key→string maps (ar via Gemini)
APP/fixtures.js                            MOD  ESM, CONTENT = { fr, ar }, module explanations, no learner
APP/views/shared.js                        NEW  escapeHTML, routeLink, feedbackBar, ring, pageHead
APP/views/onboarding.js start.js prep.js simulation.js result.js modules.js plan.js certificate.js manager.js  NEW
APP/audio.js                               NEW  play(el, text, lang) → "mp3"|"synth"|"silent", stop()
APP/styles/tokens.css                      NEW  Codex draft, reviewed
APP/styles.css                             MOD  rewritten on the new tokens, logical properties, print
APP/fonts/*.woff2 + LICENSE-OFL.txt        NEW  6 files
APP/audio/fr/turn-1..3.mp3  audio/ar/turn-1..3.mp3   NEW  generated once, committed
APP/scripts/generate-audio.mjs             NEW  build-time only
APP/tests/state.test.mjs                   NEW  node --test
```

---

## Phase 0 — Evidence: before (20 min)

**Files:** `docs/evidence/before/*.png`, `docs/evidence/before/README.md`, `.gitignore`, `docs/superpowers/plans/2026-09-19-bp-learning-redesign-plan.md`. **No app file changes.**

- [ ] **Step 0.1: Save the plan into the repo and add the Playwright output dir to .gitignore**

```bash
mkdir -p docs/superpowers/plans docs/evidence/before
cp "C:/Users/RACHI/.claude/plans/you-are-the-eagle-groovy-thompson.md" docs/superpowers/plans/2026-09-19-bp-learning-redesign-plan.md
printf '.playwright-mcp/\n' >> .gitignore
git ls-files .env   # must print nothing
```

- [ ] **Step 0.2: Serve the delivered app (background)**

```bash
cd bp-learning-morocco-frontend-candidate && python -m http.server 8089
```
Run with `run_in_background: true`. Check: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8089/` → `200`.

- [ ] **Step 0.3: Capture every route at 1280 and 390 with Playwright MCP**

Use `mcp__plugin_playwright_playwright__browser_*`. Clear storage first so the "before" is a fresh learner: navigate to `http://127.0.0.1:8089/#start`, then `browser_evaluate` `() => localStorage.clear()`, reload.

Sequence at `browser_resize` 1280×900, then repeat at 390×844 (filenames end `-390`):

| # | Navigate / action | Filename | Shows |
|---|---|---|---|
| 1 | `#start` | `before-start-1280.png` (fullPage) | purple hero, "Commencer" |
| 2 | `#vorbereitung` fresh | `before-prep-gated-1280.png` | disabled "Démarrer la simulation" + gate hint (pain point 1) |
| 3 | check all 3 boxes | `before-prep-done-1280.png` | gate opens |
| 4 | `#simulation` | `before-sim-turn1-1280.png` | choices, no persona, no audio |
| 5 | click choice 1, screenshot immediately | `before-sim-toast-1280.png` | 2.6 s toast (pain point 2) |
| 6 | `browser_wait_for` 3 s | `before-sim-toast-gone-1280.png` | feedback vanished |
| 7 | answer turns 2 and 3 | `before-sim-done-1280.png` | end state |
| 8 | `#abschluss` | `before-result-1280.png` (fullPage) | score ring + modules on one page |
| 9 | click a wrong answer on module 1 | `before-module-wrong-1280.png` | red, no retry (pain point 3) |
| 10 | `#lernplan` | `before-plan-1280.png` | plan + reset with no confirm |

The listener-stacking bug is recorded as text, not a shot: each `render()` (app.js:171) calls `bindInteractions()`, which re-adds click handlers to the persistent header `nav [data-route]` links (app.js:181), so they accumulate one handler per render. Verified by reading the code; fix lands in Phase 1.

- [ ] **Step 0.4: Move captures and write the index**

```bash
find . -path ./.git -prune -o -name 'before-*.png' -print
mv ./.playwright-mcp/before-*.png docs/evidence/before/ 2>/dev/null || mv ./bp-learning-morocco-frontend-candidate/.playwright-mcp/before-*.png docs/evidence/before/
ls docs/evidence/before | wc -l   # expect 20 png + README
```

`docs/evidence/before/README.md` content:

```markdown
# Before — delivered app at commit f38c2a1

Captured 2026-09-19 with Playwright at 1280×900 and 390×844, fresh localStorage.

Pain points visible here:
1. `before-prep-gated-*.png` — "Démarrer la simulation" is disabled until three boxes are ticked. A reluctant learner is blocked at the door.
2. `before-sim-toast-*.png` vs `before-sim-toast-gone-*.png` — the only feedback is a 2.6 s toast bottom-right. On 390px it covers the choices, then disappears.
3. `before-module-wrong-*.png` — a wrong answer locks the module in red with no explanation and no retry.
4. Not visible: `app.js:181` re-binds click handlers on the header links on every render (listener stacking). Fixed in Phase 1 by one delegated listener.
5. No name, no language choice, no Arabic, no voice, no attestation, no manager view. Purple palette and small type read as generic SaaS, not healthcare.
```

- [ ] **Step 0.5: Commit**

```bash
git add .gitignore docs/
git commit -m "docs(evidence): before captures of delivered app at 1280 and 390, plan file"
```

**Acceptance:** 20 PNGs + README in `docs/evidence/before/`, `git status` clean, no file under `APP/` changed. Reminder printed to you: rotate the DeepSeek key found in `.env`.

---

## Phase 1 — Core refactor (60 min)

**Files:**
- Create: `APP/package.json`, `APP/state.js`, `APP/tests/state.test.mjs`, `APP/i18n.js`, `APP/locales/fr.js`, `APP/views/shared.js`, `APP/views/start.js`, `APP/views/prep.js`, `APP/views/simulation.js`, `APP/views/result.js`, `APP/views/modules.js`, `APP/views/plan.js`, empty `APP/styles/tokens.css`
- Modify: `APP/fixtures.js` (ESM), `APP/app.js` (rewrite), `APP/index.html` (rewrite), `APP/styles.css` (minimal: `.feedback-bar`, header progress; full restyle is Phase 2)

**Interfaces produced (all later phases depend on these exact names):**

```js
// state.js
export const STORE_KEY = "bp-learning-v2";
export const LEGACY_KEY = "bp-historic-frontend-morocco-fr-v1";
export const DEFAULT;                                   // frozen v2 shape
export function validate(raw) → state                  // always returns a valid state
export function migrateV1(raw) → state | null
export function loadState(storage) → { state, volatile } // volatile=true when storage throws
export function saveState(storage, state) → boolean
export function progress(state) → integer 0..100       // (answers + solved) / 6
export function dialogueScore(state) → { best, total, pct }
export function modulesSummary(state) → { solved, firstTry, total }
export function isComplete(state) → boolean
export function nextRoute(state) → "prep"|"simulation"|"modules"|"plan"
// i18n.js
export function t(key, vars?) → string; setLang(lang); getLang(); dir(); formatDate(iso)
// fixtures.js
export const CONTENT = { fr: {...}, ar?: {...} }; export function content(lang)
// views/<name>.js
export function render(state, ui) → html string
// views/shared.js
export function escapeHTML(v); routeLink(route, label, kind="button-primary", attrs=""); feedbackBar(opts); ring(pct, label); pageHead(eyebrow, title, lede)
// app.js ui object
ui = { typing:false, revealedTurn:-1, feedbackTurn:null, typingTimer:0, onboardingStep:0, moduleAttempt:{}, moduleRetry:{} }
```

- [ ] **Step 1.1: package.json**

`APP/package.json`:
```json
{ "name": "bp-learning-morocco-frontend", "private": true, "type": "module",
  "scripts": { "test": "node --test tests/", "serve": "python -m http.server 8089", "audio": "node scripts/generate-audio.mjs" } }
```

- [ ] **Step 1.2: fixtures.js → ES module with `CONTENT.fr`**

Replace `window.BP_FIXTURES = Object.freeze({` with `export const CONTENT = Object.freeze({ fr: {`, close with `} });` and append `export function content(lang) { return CONTENT[lang] ?? CONTENT.fr; }`. Inside the `fr` block: remove the `learner` object; rename `learningModules` → `modules`; add to each module an `explanation` (shown on a wrong answer):

```js
// preference
explanation: "Poser la question laisse la personne choisir. Supposer sa langue ou son niveau de lecture peut la gêner.",
// structure
explanation: "Une étape, puis une reformulation, puis l'étape suivante. La personne peut suivre et vous voyez ce qu'elle a compris.",
// verification
explanation: "Demander comment la personne résumerait l'étape vérifie votre explication, pas la personne. Les autres formulations la mettent à l'épreuve.",
```

Also add to `scenario`: `initials: "CF"`. Everything else stays byte-identical (this content is graded and already synthetic).

- [ ] **Step 1.3: Write failing state tests**

`APP/tests/state.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT, validate, migrateV1, loadState, saveState, progress, dialogueScore, modulesSummary, isComplete, nextRoute, STORE_KEY, LEGACY_KEY } from "../state.js";
import { CONTENT } from "../fixtures.js";

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };

test("validate: garbage → DEFAULT", () => {
  for (const raw of [null, 42, "x", [], { version: 9 }]) assert.deepEqual(validate(raw), DEFAULT);
});
test("validate: clamps and filters every field", () => {
  const s = validate({ version: 2, profile: { name: "x".repeat(80), lang: "de" }, prep: ["langue", "nope", "langue"], dialogueAnswers: [0, 7, 2, 1], modules: { preference: { first: 1, solved: "yes" }, ghost: { first: 0, solved: true } }, completedAt: 12 });
  assert.equal(s.profile.name.length, 40); assert.equal(s.profile.lang, "fr");
  assert.deepEqual(s.prep, ["langue"]);
  assert.deepEqual(s.dialogueAnswers, [0]);          // stops at first invalid answer
  assert.deepEqual(s.modules, { preference: { first: 1, solved: false } });
  assert.equal(s.completedAt, null);
});
test("validate: keeps a valid ISO completedAt", () => {
  assert.equal(validate({ ...DEFAULT, completedAt: "2026-09-19T10:00:00.000Z" }).completedAt, "2026-09-19T10:00:00.000Z");
});
test("migrateV1: maps quizAnswers to modules {first, solved}", () => {
  const s = migrateV1({ prep: ["langue"], dialogueStep: 2, dialogueAnswers: [0, 2], quizAnswers: { preference: 0, structure: 1 } });
  assert.deepEqual(s.dialogueAnswers, [0, 2]);
  assert.deepEqual(s.modules, { preference: { first: 0, solved: true }, structure: { first: 1, solved: false } });
  assert.equal(s.profile.name, "");
  assert.equal(migrateV1({ foo: 1 }), null);
});
test("loadState: reads v2, else migrates v1, else DEFAULT; volatile on throw", () => {
  assert.deepEqual(loadState(mem()).state, DEFAULT);
  const v1 = mem({ [LEGACY_KEY]: JSON.stringify({ prep: [], dialogueStep: 1, dialogueAnswers: [1], quizAnswers: {} }) });
  assert.deepEqual(loadState(v1).state.dialogueAnswers, [1]);
  const v2 = mem({ [STORE_KEY]: JSON.stringify({ ...DEFAULT, profile: { name: "Nadia", lang: "ar" } }), [LEGACY_KEY]: "{\"dialogueAnswers\":[2,2,2]}" });
  assert.equal(loadState(v2).state.profile.name, "Nadia");   // v2 wins, v1 ignored
  assert.deepEqual(loadState(v2).state.dialogueAnswers, []);
  const r = loadState(throwing); assert.equal(r.volatile, true); assert.deepEqual(r.state, DEFAULT);
  assert.equal(saveState(throwing, DEFAULT), false); assert.equal(saveState(mem(), DEFAULT), true);
});
test("derived getters", () => {
  const s = validate({ ...DEFAULT, dialogueAnswers: [0, 1, 0], modules: { preference: { first: 0, solved: true }, structure: { first: 2, solved: true } } });
  assert.equal(progress(s), 83);
  assert.deepEqual(dialogueScore(s), { best: 2, total: 3, pct: 67 });
  assert.deepEqual(modulesSummary(s), { solved: 2, firstTry: 1, total: 3 });
  assert.equal(isComplete(s), false); assert.equal(nextRoute(s), "modules");
  assert.equal(nextRoute(DEFAULT), "prep");
  assert.equal(nextRoute(validate({ ...DEFAULT, dialogueAnswers: [0] })), "simulation");
  const done = validate({ ...s, modules: { ...s.modules, verification: { first: 0, solved: true } } });
  assert.equal(isComplete(done), true); assert.equal(progress(done), 100); assert.equal(nextRoute(done), "plan");
});
test("content parity: every language has identical ids, lengths, best and correct", () => {
  const fr = CONTENT.fr;
  for (const [lang, c] of Object.entries(CONTENT)) {
    assert.deepEqual(c.preparation.map((p) => p.id), fr.preparation.map((p) => p.id), lang);
    assert.deepEqual(c.dialogue.map((d) => [d.choices.length, d.best]), fr.dialogue.map((d) => [d.choices.length, d.best]), lang);
    assert.deepEqual(c.modules.map((m) => [m.id, m.answers.length, m.correct]), fr.modules.map((m) => [m.id, m.answers.length, m.correct]), lang);
    for (const m of c.modules) assert.ok(m.explanation && m.explanation.length > 10, `${lang}.${m.id}.explanation`);
  }
});
```

Run: `cd bp-learning-morocco-frontend-candidate && node --test tests/` → expected FAIL: `Cannot find module '../state.js'`.

- [ ] **Step 1.4: Implement state.js**

```js
import { CONTENT } from "./fixtures.js";
const C = CONTENT.fr;                                   // ids/lengths identical across languages (tested)
export const STORE_KEY = "bp-learning-v2";
export const LEGACY_KEY = "bp-historic-frontend-morocco-fr-v1";
export const DEFAULT = Object.freeze({ version: 2, profile: Object.freeze({ name: "", lang: "fr" }), prep: Object.freeze([]), dialogueAnswers: Object.freeze([]), modules: Object.freeze({}), completedAt: null });
const LANGS = new Set(["fr", "ar"]);
const PREP_IDS = new Set(C.preparation.map((p) => p.id));
const MODULES = new Map(C.modules.map((m) => [m.id, m]));
const obj = (v) => v && typeof v === "object" && !Array.isArray(v);

export function validate(raw) {
  if (!obj(raw) || raw.version !== 2) return structuredClone(DEFAULT);
  const s = structuredClone(DEFAULT);
  const p = obj(raw.profile) ? raw.profile : {};
  s.profile = { name: typeof p.name === "string" ? p.name.trim().slice(0, 40) : "", lang: LANGS.has(p.lang) ? p.lang : "fr" };
  s.prep = Array.isArray(raw.prep) ? [...new Set(raw.prep.filter((id) => PREP_IDS.has(id)))] : [];
  s.dialogueAnswers = [];
  if (Array.isArray(raw.dialogueAnswers)) for (const a of raw.dialogueAnswers.slice(0, C.dialogue.length)) { if (!Number.isInteger(a) || a < 0 || a > 2) break; s.dialogueAnswers.push(a); }
  s.modules = {};
  if (obj(raw.modules)) for (const [id, m] of Object.entries(raw.modules)) { const def = MODULES.get(id); if (def && obj(m) && Number.isInteger(m.first) && m.first >= 0 && m.first < def.answers.length) s.modules[id] = { first: m.first, solved: m.solved === true }; }
  s.completedAt = typeof raw.completedAt === "string" && !Number.isNaN(Date.parse(raw.completedAt)) ? raw.completedAt : null;
  return s;
}
export function migrateV1(raw) {
  if (!obj(raw) || !Array.isArray(raw.dialogueAnswers)) return null;
  const modules = {};
  if (obj(raw.quizAnswers)) for (const [id, first] of Object.entries(raw.quizAnswers)) { const def = MODULES.get(id); if (def && Number.isInteger(first)) modules[id] = { first, solved: first === def.correct }; }
  return validate({ version: 2, profile: DEFAULT.profile, prep: raw.prep, dialogueAnswers: raw.dialogueAnswers, modules, completedAt: null });
}
export function loadState(storage) {
  try {
    const v2 = JSON.parse(storage.getItem(STORE_KEY) ?? "null");
    if (v2) return { state: validate(v2), volatile: false };
    const v1 = migrateV1(JSON.parse(storage.getItem(LEGACY_KEY) ?? "null"));
    return { state: v1 ?? structuredClone(DEFAULT), volatile: false };
  } catch { return { state: structuredClone(DEFAULT), volatile: true }; }
}
export function saveState(storage, state) { try { storage.setItem(STORE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
export function dialogueScore(state) { const best = state.dialogueAnswers.filter((a, i) => a === C.dialogue[i].best).length; return { best, total: C.dialogue.length, pct: Math.round((best / C.dialogue.length) * 100) }; }
export function modulesSummary(state) { const all = Object.values(state.modules); return { solved: all.filter((m) => m.solved).length, firstTry: C.modules.filter((m) => state.modules[m.id]?.first === m.correct).length, total: C.modules.length }; }
export function progress(state) { return Math.round(((state.dialogueAnswers.length + modulesSummary(state).solved) / (C.dialogue.length + C.modules.length)) * 100); }
export function isComplete(state) { return state.dialogueAnswers.length === C.dialogue.length && modulesSummary(state).solved === C.modules.length; }
export function nextRoute(state) { if (isComplete(state)) return "plan"; if (state.dialogueAnswers.length === 0) return "prep"; if (state.dialogueAnswers.length < C.dialogue.length) return "simulation"; return "modules"; }
```

Run tests → PASS (7 tests). `structuredClone` of a frozen object returns an unfrozen deep copy, so mutation in `validate` is safe.

- [ ] **Step 1.5: i18n.js and locales/fr.js**

`APP/i18n.js`:
```js
import { fr } from "./locales/fr.js";
const LOCALES = { fr };                                  // Phase 4 adds `ar`
let lang = "fr"; const warned = new Set();
export function setLang(next) { lang = LOCALES[next] ? next : "fr"; document.documentElement.lang = lang; document.documentElement.dir = dir(); }
export function getLang() { return lang; }
export function dir() { return lang === "ar" ? "rtl" : "ltr"; }
export function t(key, vars = {}) {
  let s = LOCALES[lang][key];
  if (s === undefined) { s = fr[key] ?? key; if (!warned.has(key)) { warned.add(key); console.warn(`i18n: missing ${lang}.${key}`); } }
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}
export function formatDate(iso) { return new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : "fr-MA", { dateStyle: "long", numberingSystem: "latn" }).format(new Date(iso)); }
```

`APP/locales/fr.js` (complete; `vous` throughout; this is the file Gemini translates in Phase 2):
```js
export const fr = {
  "app.name": "BP Learning", "app.tagline": "Formation en pharmacie", "app.skip": "Aller au contenu",
  "app.savedLocally": "Enregistré uniquement sur cet appareil.",
  "app.storageVolatile": "Impossible d'enregistrer sur cet appareil. Votre progression sera perdue en fermant la page.",
  "nav.overview": "Vue d'ensemble", "nav.simulation": "Simulation", "nav.plan": "Mon parcours", "nav.manager": "Vue responsable",
  "nav.language": "Langue", "nav.progress": "Progression : {pct} %", "nav.profile": "Profil de {name}", "chip.plusOne": "+1",
  "lang.fr": "Français", "lang.ar": "العربية",
  "onboarding.langTitle": "Choisissez votre langue", "onboarding.langHint": "Vous pourrez changer de langue à tout moment en haut de la page.",
  "onboarding.nameTitle": "Votre prénom", "onboarding.nameLabel": "Prénom", "onboarding.nameWhy": "Il apparaîtra sur votre attestation de participation.",
  "onboarding.nameSubmit": "Commencer",
  "start.eyebrow": "Communication en pharmacie", "start.cta.begin": "Commencer", "start.cta.continue": "Continuer",
  "start.cta.certificate": "Voir mon attestation", "start.cta.plan": "Voir ma progression", "start.stagesTitle": "Votre parcours",
  "start.stage.prep": "Préparation", "start.stage.prepBody": "Trois principes à lire avant de commencer.",
  "start.stage.simulation": "Simulation", "start.stage.simulationBody": "Un échange en trois étapes avec une cliente.",
  "start.stage.modules": "Vérifications", "start.stage.modulesBody": "Trois questions courtes avec explication.",
  "status.optional": "Facultatif", "status.read": "Lu", "status.done": "Terminé", "status.count": "{done}/{total}", "status.open": "Ouvrir", "status.review": "Revoir",
  "prep.title": "Avant de commencer", "prep.lede": "Trois habitudes utiles pour l'échange. Cochez-les si vous voulez, ce n'est pas obligatoire.",
  "prep.start": "Démarrer la simulation", "prep.back": "Retour",
  "sim.title": "Simulation", "sim.step": "Échange {n} sur {total}", "sim.context": "Situation", "sim.goal": "Votre objectif", "sim.fictional": "Scénario fictif",
  "sim.listen": "Écouter", "sim.typing": "La cliente écrit…", "sim.you": "Vous", "sim.prompt": "Que répondez-vous ? Appuyez sur 1, 2 ou 3.",
  "sim.continue": "Continuer", "sim.seeResult": "Voir le résultat", "sim.restart": "Recommencer", "sim.doneTitle": "Échange terminé",
  "feedback.good": "Bonne réponse", "feedback.almost": "Pas tout à fait", "feedback.recommended": "Réponse recommandée : « {answer} »",
  "result.title": "Votre résultat", "result.score": "{pct} % de réponses recommandées",
  "result.verdict.high": "Vous avez laissé la cliente choisir et vérifié sa compréhension.",
  "result.verdict.mid": "Une bonne base. Relisez les réponses recommandées ci-dessous.",
  "result.verdict.low": "Relisez les réponses recommandées, puis refaites l'échange.",
  "result.recap": "Récapitulatif", "result.yourAnswer": "Votre réponse", "result.recommendedAnswer": "Réponse recommandée",
  "result.cta": "Passer aux vérifications", "result.redo": "Refaire la simulation",
  "modules.title": "Vérifications", "modules.lede": "Trois questions. En cas d'erreur, lisez l'explication et réessayez.",
  "modules.retry": "Réessayer", "modules.next": "Question suivante", "modules.done": "Voir mon parcours", "modules.solvedCount": "{done}/{total} réussies",
  "plan.title": "Mon parcours", "plan.progress": "Progression", "plan.steps": "Étapes", "plan.certificate": "Voir l'attestation",
  "plan.certificateLocked": "Terminez la simulation et les trois vérifications pour obtenir l'attestation.",
  "plan.reset": "Effacer ma progression", "plan.resetConfirmTitle": "Effacer la progression ?",
  "plan.resetConfirmBody": "Votre prénom, vos réponses et votre attestation seront supprimés de cet appareil.",
  "plan.resetCancel": "Annuler", "plan.resetConfirm": "Effacer",
  "cert.title": "Attestation de participation", "cert.body": "{name} a terminé la formation « {course} ».", "cert.date": "Date",
  "cert.dialogue": "Simulation", "cert.modules": "Vérifications", "cert.disclaimer": "Attestation de participation — exercice de formation, non accréditée.",
  "cert.print": "Imprimer ou enregistrer en PDF", "cert.locked": "L'attestation sera disponible une fois la formation terminée.", "cert.back": "Retour au parcours",
  "manager.title": "Vue responsable", "manager.lede": "Données enregistrées sur cet appareil uniquement.",
  "manager.empty": "Aucune formation terminée sur cet appareil.", "manager.learner": "Apprenant·e", "manager.completion": "Avancement",
  "manager.dialogueScore": "Score simulation", "manager.modules": "Vérifications", "manager.firstTry": "{n}/{total} réussies du premier coup",
  "manager.completedOn": "Terminé le", "manager.attestation": "Attestation", "manager.attestationReady": "Disponible", "manager.open": "Ouvrir l'attestation",
};
```

- [ ] **Step 1.6: views/shared.js**

```js
import { t } from "../i18n.js";
export function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]); }
export function routeLink(route, label, kind = "button-primary", attrs = "") { return `<a class="button ${kind}" href="#${route}" ${attrs}>${escapeHTML(label)}</a>`; }
export function pageHead(eyebrow, title, lede = "") { return `<p class="eyebrow">${escapeHTML(eyebrow)}</p><h1 id="view-title" tabindex="-1">${escapeHTML(title)}</h1>${lede ? `<p class="lede">${escapeHTML(lede)}</p>` : ""}`; }
export function ring(pct, label) { return `<div class="ring" data-pct="${pct}" role="img" aria-label="${escapeHTML(label)}"><strong>${pct}%</strong></div>`; }
// kind: "success" | "attention". action: data-action name for the single next step. `why`/`recommended` are escaped here.
export function feedbackBar({ kind, why, recommended = "", actionLabel, action, actionAttrs = "" }) {
  return `<div class="feedback-bar feedback-${kind}" role="status" aria-live="polite" data-feedback-bar>
    <span class="feedback-icon" aria-hidden="true">${kind === "success" ? "✓" : "!"}</span>
    <div class="feedback-text"><strong>${t(kind === "success" ? "feedback.good" : "feedback.almost")}</strong><p>${escapeHTML(why)}</p>${recommended ? `<p class="small">${escapeHTML(recommended)}</p>` : ""}</div>
    <button class="button button-primary" type="button" data-action="${action}" ${actionAttrs} data-focus>${escapeHTML(actionLabel)}</button>
  </div>`;
}
```

- [ ] **Step 1.7: Views (Phase 1 versions)**

Each file: `import { t, getLang } from "../i18n.js"; import { content } from "../fixtures.js"; import { escapeHTML, routeLink, pageHead, ring, feedbackBar } from "./shared.js"; import { progress, dialogueScore, modulesSummary, isComplete, nextRoute } from "../state.js";` (only what it uses) and `export function render(state, ui)`. Root element of every view: `<section class="page-shell" aria-labelledby="view-title">`.

- `start.js`: port `renderStart` (app.js:73-104). CTA: `isComplete(state) ? routeLink("certificate", t("start.cta.certificate")) : routeLink(nextRoute(state), t(state.dialogueAnswers.length ? "start.cta.continue" : "start.cta.begin"))`; secondary → `plan`. `ring(progress(state), t("nav.progress",{pct}))`. Three stage cards: prep status `state.prep.length === 3 ? t("status.read") : t("status.optional")`; simulation `t("status.count",{done: answers, total: 3})`; modules `t("status.count",{done: solved, total: 3})`. Routes: `prep`, `simulation`, `modules`.
- `prep.js`: port `renderPreparation` (app.js:106-116) **without the gate**: checkboxes `<input type="checkbox" data-action="prep-toggle" data-id="${id}">`, button is `routeLink("simulation", t("prep.start"))` always enabled, no hint line, no sidebar (Uxcel keeps one column of three cards).
- `simulation.js`: Phase 1 = port of `renderSimulation` with the toast replaced by an inline persistent `feedbackBar` (no typing/audio yet — Phase 3 rewrites this file; see Phase 3 for the full final code). Choices: `<button class="choice" data-action="choose" data-index="${i}"><span class="choice-num" aria-hidden="true">${i+1}</span>${escapeHTML(choice)}</button>`.
- `result.js`: port the score part of `renderCompletion` (app.js:135-143) with `ring(pct, t("result.score",{pct}))`, verdict key by pct (100 → high, 67 → mid, else low), recap `<ol>` per turn: customer text, `t("result.yourAnswer")` + chosen, and if chosen ≠ best `t("result.recommendedAnswer")` + best choice (class `recap-best`), then `turn.feedback`. CTAs: `routeLink("modules", t("result.cta"))`, `routeLink("simulation", t("result.redo"), "button-secondary")`.
- `modules.js`: port `renderModule` (app.js:145-153) with `data-action="answer-module" data-module="${id}" data-index="${i}"`. Feedback per card: success bar if `solved`, attention bar with `explanation` and `actionLabel: t("modules.retry"), action: "retry-module", actionAttrs: 'data-module="id"'` if answered wrong. Answer buttons disabled when `solved`, or when answered wrong and not `ui.moduleRetry[id]`. Footer CTA `routeLink("plan", t("modules.done"))` when all solved.
- `plan.js`: port `renderPlan` (app.js:155-159): `<progress class="progress-track" max="100" value="${pct}" aria-label="${t('nav.progress',{pct})}">`, timeline rows (prep/simulation/modules with counts and `routeLink(..., t("status.open"), "button-secondary")`), attestation link `isComplete ? routeLink("certificate", t("plan.certificate")) : <button class="button button-secondary" disabled>…</button><p class="small subtle">${t("plan.certificateLocked")}</p>`, reset `<button data-action="reset-confirm">` + `<dialog data-reset-dialog><form method="dialog"><h2>…</h2><p>…</p><div class="button-row"><button value="cancel" class="button button-secondary">${t("plan.resetCancel")}</button><button value="confirm" class="button button-primary" data-action="reset-all">${t("plan.resetConfirm")}</button></div></form></dialog>`.

Every place the name renders: `escapeHTML(state.profile.name)`. Audit before commit: `grep -n "profile.name" bp-learning-morocco-frontend-candidate/views/*.js bp-learning-morocco-frontend-candidate/app.js` — every hit must be inside `escapeHTML(` or a non-render use.

- [ ] **Step 1.8: index.html rewrite**

```html
<!doctype html>
<html lang="fr" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; font-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'" />
    <meta name="description" content="Entraînement à la communication en pharmacie dans un contexte marocain fictif." />
    <title>BP Learning</title>
    <link rel="icon" href="data:," />
    <link rel="stylesheet" href="styles/tokens.css" />
    <link rel="stylesheet" href="styles.css" />
    <script type="module" src="app.js"></script>
  </head>
  <body>
    <a class="skip-link" href="#main" data-skip>Aller au contenu</a>
    <header class="site-header" data-header></header>
    <div class="banner" data-banner hidden></div>
    <main id="main" class="view" tabindex="-1" data-main></main>
    <noscript>JavaScript doit être activé pour utiliser l'entraînement.</noscript>
  </body>
</html>
```
Create an empty `APP/styles/tokens.css` in this phase so the console stays clean until Phase 2 fills it.

- [ ] **Step 1.9: app.js rewrite (final shape; Phases 3–6 add cases to the switch)**

```js
import { loadState, saveState, progress, isComplete } from "./state.js";
import { t, setLang, getLang } from "./i18n.js";
import { content } from "./fixtures.js";
import { escapeHTML } from "./views/shared.js";
import * as start from "./views/start.js";
import * as prep from "./views/prep.js";
import * as simulation from "./views/simulation.js";
import * as result from "./views/result.js";
import * as modules from "./views/modules.js";
import * as plan from "./views/plan.js";
// Phase 4: onboarding · Phase 5: certificate · Phase 6: manager

const VIEWS = { start, prep, simulation, result, modules, plan };
const storage = window.localStorage;
let { state, volatile } = loadState(storage);
const ui = { typing: false, revealedTurn: -1, feedbackTurn: null, typingTimer: 0, onboardingStep: 0, moduleAttempt: {}, moduleRetry: {} };
setLang(state.profile.lang);

function route() { const r = location.hash.replace(/^#/, ""); return VIEWS[r] ? r : "start"; }
function go(r) { location.hash = r; }
function save() { if (isComplete(state) && !state.completedAt) state.completedAt = new Date().toISOString(); if (!saveState(storage, state)) volatile = true; }

function renderHeader(r) {
  const pct = progress(state); const name = state.profile.name;
  document.querySelector("[data-skip]").textContent = t("app.skip");
  document.title = t("app.name");
  document.querySelector("[data-header]").innerHTML = `
    <a class="brand" href="#start"><span class="brand-mark" aria-hidden="true">BP</span><span><strong>${t("app.name")}</strong><small>${t("app.tagline")}</small></span></a>
    <nav aria-label="${t("nav.overview")}">
      <a href="#start" ${r === "start" ? 'aria-current="page"' : ""}>${t("nav.overview")}</a>
      <a href="#simulation" ${r === "simulation" ? 'aria-current="page"' : ""}>${t("nav.simulation")}</a>
      <a href="#plan" ${r === "plan" ? 'aria-current="page"' : ""}>${t("nav.plan")}</a>
    </nav>
    <div class="header-progress"><progress max="100" value="${pct}" aria-label="${t("nav.progress", { pct })}"></progress><span class="chip" data-chip hidden aria-hidden="true">${t("chip.plusOne")}</span></div>
    <label class="lang-switch"><span class="visually-hidden">${t("nav.language")}</span>
      <select data-action="lang-switch"><option value="fr" ${getLang() === "fr" ? "selected" : ""}>${t("lang.fr")}</option><option value="ar" ${getLang() === "ar" ? "selected" : ""}>${t("lang.ar")}</option></select></label>
    ${name ? `<a class="profile-button" href="#plan" aria-label="${escapeHTML(t("nav.profile", { name }))}"><span aria-hidden="true">${escapeHTML(name.slice(0, 1).toUpperCase())}</span><span>${escapeHTML(name)}</span></a>` : ""}`;
  const banner = document.querySelector("[data-banner]"); banner.hidden = !volatile; banner.textContent = volatile ? t("app.storageVolatile") : "";
}

let lastRoute = null; let lastPct = progress(state);
function render(focus = false) {
  const r = route();
  if (r !== lastRoute) { clearTimeout(ui.typingTimer); ui.typing = false; ui.feedbackTurn = null; /* Phase 3: audio.stop() */ }
  renderHeader(r);
  document.querySelector("[data-main]").innerHTML = VIEWS[r].render(state, ui);
  document.querySelectorAll("[data-pct]").forEach((el) => el.style.setProperty("--pct", `${el.dataset.pct}%`));
  const focusTarget = document.querySelector("[data-focus]");
  if (focusTarget) focusTarget.focus();
  else if (focus || r !== lastRoute) document.getElementById("view-title")?.focus({ preventScroll: true });
  const pct = progress(state); if (pct > lastPct) popChip(); lastPct = pct;
  lastRoute = r;
  afterRender(r);                                       // Phase 3 fills this: typing timer + audio
}
function afterRender() {}
function popChip() { const chip = document.querySelector("[data-chip]"); if (!chip) return; chip.hidden = false; chip.classList.add("chip-pop"); setTimeout(() => { chip.hidden = true; chip.classList.remove("chip-pop"); }, 1400); }

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]"); if (!el) return;
  const C = content(getLang());
  switch (el.dataset.action) {
    case "choose": { const k = state.dialogueAnswers.length; if (k >= C.dialogue.length || ui.typing) return; state.dialogueAnswers.push(Number(el.dataset.index)); ui.feedbackTurn = k; save(); render(); return; }
    case "continue-dialogue": ui.feedbackTurn = null; render(); return;
    case "see-result": ui.feedbackTurn = null; go("result"); return;
    case "restart-dialogue": state.dialogueAnswers = []; state.completedAt = null; ui.revealedTurn = -1; ui.feedbackTurn = null; save(); render(); return;
    case "answer-module": { const id = el.dataset.module, i = Number(el.dataset.index); const def = C.modules.find((m) => m.id === id); if (!def) return; const rec = state.modules[id] ?? { first: i, solved: false }; rec.solved = rec.solved || i === def.correct; state.modules[id] = rec; ui.moduleAttempt[id] = i; ui.moduleRetry[id] = false; save(); render(); return; }
    case "retry-module": ui.moduleRetry[el.dataset.module] = true; delete ui.moduleAttempt[el.dataset.module]; render(); document.querySelector(`[data-module="${el.dataset.module}"][data-action="answer-module"]`)?.focus(); return;
    case "reset-confirm": document.querySelector("[data-reset-dialog]")?.showModal(); return;
    case "reset-all": state = loadState({ getItem: () => null }).state; ui.revealedTurn = -1; ui.feedbackTurn = null; ui.moduleAttempt = {}; ui.moduleRetry = {}; setLang(state.profile.lang); save(); go("start"); return;
    // Phase 3: "listen" · Phase 4: "choose-lang" · Phase 5: "print", "focus-next-module"
  }
});
document.addEventListener("change", (event) => {
  const el = event.target.closest("[data-action]"); if (!el) return;
  if (el.dataset.action === "prep-toggle") { const id = el.dataset.id; state.prep = el.checked ? [...new Set([...state.prep, id])] : state.prep.filter((x) => x !== id); save(); render(); }
  if (el.dataset.action === "lang-switch") { state.profile.lang = el.value; setLang(el.value); save(); render(); }   // Phase 4 adds audio.stop() + revealedTurn reset
});
document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, select, textarea") || event.altKey || event.ctrlKey || event.metaKey) return;
  if (route() === "simulation" && /^[1-3]$/.test(event.key)) { const btn = document.querySelector(`[data-action="choose"][data-index="${Number(event.key) - 1}"]`); if (btn) { event.preventDefault(); btn.click(); } }
});
window.addEventListener("hashchange", () => render(true));
render(true);
```
Note `reset-all` sits inside a `<form method="dialog">`, so the dialog closes natively; `reset-confirm` is the only opener; Esc closes it natively. Language switching via `<select>` is native and keyboard-accessible. `go("start")` from `reset-all` triggers `hashchange` → render (if already on `#start`, add an explicit `render()`).

- [ ] **Step 1.10: Minimal CSS so Phase 1 is usable**

Append to `styles.css` (Phase 2 rewrites the whole file): `.feedback-bar { display:flex; gap:1rem; align-items:center; margin-top:1rem; padding:1rem; border-radius:10px; background: var(--success-soft); color:#165838 } .feedback-attention { background: var(--warning-soft); color: var(--warning) } .feedback-bar .button { margin-inline-start:auto } .header-progress progress { width: 120px } .visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0) } .choice-num { display:inline-grid; place-items:center; width:28px; height:28px; border-radius:50%; background: var(--brand-soft); margin-inline-end:.6rem } .ring { width:145px; height:145px; border-radius:50%; display:grid; place-items:center; background: conic-gradient(var(--success) var(--pct, 0%), #e8ebef 0); position:relative } .ring::before { content:""; position:absolute; width:113px; height:113px; border-radius:50%; background:white } .ring strong { position:relative; font-size:2rem }`. Remove the `.score-ring*` rules and the `.toast` rule.

- [ ] **Step 1.11: Verify**

```bash
cd bp-learning-morocco-frontend-candidate && node --test tests/           # 7 pass
node --check app.js state.js i18n.js fixtures.js locales/fr.js views/*.js
grep -n "profile.name" views/*.js app.js                                     # every render hit wrapped in escapeHTML(
grep -c "addEventListener" app.js                                            # 4 (click, change, keydown, hashchange)
```
Playwright at 1280: fresh storage → `#start` → Commencer → prep button enabled with 0 boxes → simulation: choose, feedback bar stays, Continuer, ×3, Voir le résultat → modules: wrong answer shows explanation + Réessayer → correct → plan: reset opens `<dialog>`, Esc closes, Effacer resets. Console: no errors. Then seed the legacy key via `browser_evaluate` `() => { localStorage.clear(); localStorage.setItem("bp-historic-frontend-morocco-fr-v1", JSON.stringify({prep:[],dialogueStep:2,dialogueAnswers:[0,0],quizAnswers:{preference:0}})) }`, reload → start shows 2/3 and 1/3, `localStorage.getItem("bp-learning-v2")` is set.

- [ ] **Step 1.12: ponytail-review, then commit**

```bash
git add bp-learning-morocco-frontend-candidate
git commit -m "refactor: ES modules, one delegated listener, state v2 with v1 migration, i18n scaffold, prep gate removed, persistent feedback

Fixes listener stacking (bindInteractions re-bound header links on every render),
the checkbox gate on the simulation, and the 2.6 s toast. Routes renamed to English ids.
CSP: font-src 'none' -> 'self' (only change). node --test tests/ green."
```

**Acceptance:** tests green; full click-through at 1280 with no console error; one document-level click listener; v1 migration observed; CSP meta byte-equal to the spec value.

---

## Phase 2 — Design system (45 min) · Gemini translations start in background

**Files:** Create `APP/styles/tokens.css` (Codex draft), `APP/fonts/*.woff2`, `APP/fonts/LICENSE-OFL.txt`. Rewrite `APP/styles.css`. Background outputs into scratchpad: `ar.raw.js`, `fixtures-ar.raw.json`.

- [ ] **Step 2.1: Kick off Gemini in the background (runs during this phase, reviewed in Phase 4)**

```bash
cd bp-learning-morocco-frontend-candidate
gemini -p "You are translating a pharmacy training app UI from French to Modern Standard Arabic (فصحى), for pharmacy employees in Casablanca aged 30-50. Translate ONLY the string values of this JS object. Keep every key, the object structure, quotes, and {placeholders} exactly as they are. Do not translate 'BP Learning'. Keep Western digits (0-9). Use polite, plain, short sentences (formal address). Keep 'lang.fr' as 'Français' and 'lang.ar' as 'العربية'. Rename the exported constant from 'fr' to 'ar'. Output only the JavaScript file content, no markdown fences, no commentary." < locales/fr.js > "$S/ar.raw.js"
```
and
```bash
node -e "import('./fixtures.js').then(m => process.stdout.write(JSON.stringify(m.CONTENT.fr, null, 2)))" > "$S/fixtures-fr.json"
gemini -p "Translate this JSON from French to Modern Standard Arabic for a pharmacy communication training in Casablanca. Rules: keep every key name, array order, and every numeric value ('best', 'correct') unchanged; do not translate 'id' or 'initials' values; translate every other string; the scenario premise stays the same (the customer reads French but prefers some explanations spoken in Darija - describe that in Arabic, do not switch the customer to Arabic); polite formal address; plain language; no medical advice. Output only valid JSON, no markdown fences." < "$S/fixtures-fr.json" > "$S/fixtures-ar.raw.json"
```
Both with `run_in_background: true`. If `gemini` prompts for workspace trust, add `--skip-trust`.

- [ ] **Step 2.2: Design direction (read-only skills, ~5 min)**

Invoke `ecc:frontend-design-direction` with the brief: healthcare training, calm clinical green, larger type, Uxcel structure, audience 30–50 non-technical, RTL. Then `ui-ux-pro-max` once to validate the token pairs and the IBM Plex pairing. Pre-computed contrast (WCAG): `#14211C/#F6FAF8` 15.6:1 · `#4F6259/#FFFFFF` 6.5:1 · `#4F6259/#F6FAF8` 6.1:1 · white/`#1B7A5E` 5.3:1 · `#145F49/#E3F2EB` 6.6:1 · `#B45309/#FEF3E2` 4.6:1 · white/`#B45309` 5.0:1. All ≥ 4.5. If the skill disagrees, darken `--attention` to `#9A4708` and re-check; nothing else moves.

- [ ] **Step 2.3: Fonts (build-time download, no runtime network)**

```bash
cd "$S" && npm pack @fontsource/ibm-plex-sans @fontsource/ibm-plex-sans-arabic && for f in fontsource-*.tgz; do mkdir -p "${f%.tgz}" && tar -xzf "$f" -C "${f%.tgz}"; done
cd /c/Users/RACHI/Desktop/CLAUDE/bp-learning-morocco-frontend-candidate && mkdir -p bp-learning-morocco-frontend-candidate/fonts
P=$(ls -d "$S"/fontsource-ibm-plex-sans-[0-9]*/package); A=$(ls -d "$S"/fontsource-ibm-plex-sans-arabic-*/package)
cp "$P"/files/ibm-plex-sans-latin-400-normal.woff2 "$P"/files/ibm-plex-sans-latin-600-normal.woff2 "$P"/files/ibm-plex-sans-latin-ext-400-normal.woff2 "$P"/files/ibm-plex-sans-latin-ext-600-normal.woff2 bp-learning-morocco-frontend-candidate/fonts/
cp "$A"/files/ibm-plex-sans-arabic-arabic-400-normal.woff2 "$A"/files/ibm-plex-sans-arabic-arabic-600-normal.woff2 bp-learning-morocco-frontend-candidate/fonts/
cp "$P"/LICENSE bp-learning-morocco-frontend-candidate/fonts/LICENSE-OFL.txt
grep -h "unicode-range" "$P"/400.css "$A"/400.css   # copy the latin, latin-ext and arabic ranges into tokens.css
du -sh bp-learning-morocco-frontend-candidate/fonts   # expect < 400 KB
```
Weights 400 + 600 only (Uxcel uses two weights). Four Latin + two Arabic files.

- [ ] **Step 2.4: Codex drafts tokens.css**

```bash
cd bp-learning-morocco-frontend-candidate
sed -n '173,192p' ../docs/superpowers/specs/2026-09-19-bp-learning-redesign-design.md > "$S/tokens-spec.txt"
ls fonts >> "$S/tokens-spec.txt"
codex exec -s read-only -o "$S/tokens.raw.css" "Write a single CSS file 'styles/tokens.css' for a vanilla HTML app. Content, in order: (1) @font-face rules for the woff2 files listed at the end of the spec, family 'IBM Plex Sans' (latin + latin-ext subsets, weights 400 and 600, font-display: swap, with unicode-range) and family 'IBM Plex Sans Arabic' (arabic subset, 400 and 600, unicode-range U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF); paths are relative: url('../fonts/<file>'). (2) :root custom properties exactly as named in the spec: --bg, --surface, --text, --muted, --border, --primary, --primary-strong, --primary-soft, --attention, --attention-soft, --focus, --radius, --radius-sm, --space-1 (4px) through --space-7 (48px), --font: 'IBM Plex Sans', 'IBM Plex Sans Arabic', system-ui, 'Segoe UI', Tahoma, sans-serif; --fs-body 18px, --fs-small 15px, --fs-h3 20px, --fs-h2 24px, --fs-h1 32px; --lh 1.6; --measure 68ch. (3) [dir=rtl] and :lang(ar) overrides: font-family puts 'IBM Plex Sans Arabic' first, font sizes multiplied by 1.08, --lh 1.8. (4) A minimal reset: box-sizing border-box, body margin 0, body font-family var(--font) font-size var(--fs-body) line-height var(--lh) color var(--text) background var(--bg), h1/h2/h3 sizes from the variables with margin-block-start 0, button/input/select font inherit. (5) :focus-visible { outline: 3px solid var(--focus); outline-offset: 3px }. (6) .visually-hidden utility. Use CSS logical properties only (no left/right/margin-left etc.). No comments. Output only the CSS, no markdown fences, no explanation. Spec: $(cat "$S/tokens-spec.txt")"
sed -e '/^```/d' "$S/tokens.raw.css" > styles/tokens.css
```
Review checklist for `tokens.css`: six `@font-face` blocks with correct paths; every hex matches the spec table; no physical properties (`grep -nE "\b(left|right|margin-left|margin-right|padding-left|padding-right)\b" styles/tokens.css` → nothing); no `@import`, no external URL (`grep -n "http" styles/tokens.css` → nothing). Fix by hand rather than re-prompting.

- [ ] **Step 2.5: Rewrite styles.css on the tokens**

Delete the old `:root` block, the Inter font stack, `.snapshot-banner`, `.score-ring*`, `.toast`, and `.hero-visual` gradient art. Rules to write (grouped; roughly 320 lines):

- Layout: `.site-header` grid `auto 1fr auto auto auto`, sticky, `border-block-end`; `.view` padding with `padding-inline: clamp(16px, 5vw, 64px)`; `.page-shell { max-width: 1120px; margin-inline: auto }`; `.lede, p { max-width: var(--measure) }`.
- Components: `.button` (min-height 48px, radius `--radius-sm`, weight 600, `primary` on `--primary` hover `--primary-strong`, `secondary` surface + border), `.card`, `.tag`, `.eyebrow` (`--primary`, letter-spacing 0.08em, `text-transform: uppercase` disabled under `:lang(ar)`), `.stage-grid` (3 → 1 column), `progress` (height 10px, `accent-color: var(--primary)`; keep the `::-webkit-progress-*` and `::-moz-progress-bar` rules from the old file recoloured), `.ring` (from Step 1.10, recoloured), `.chip` (absolute, `inset-inline-end: -8px`, `@keyframes chip-pop { from { transform: translateY(0); opacity: 0 } 30% { opacity: 1 } to { transform: translateY(-14px); opacity: 0 } }`, `.chip-pop { animation: chip-pop 1.4s ease-out }`), `.lang-switch select` (min-height 44px), `.banner` (attention-soft), `.skip-link` with `inset-inline-start: 1rem`.
- Prep: `.prep-card` grid `44px 1fr`, checkbox 24px, `:has(input:checked)` → `--primary-soft` border.
- Simulation: `.simulation-shell` grid `320px 1fr` (`≤720px` → `1fr`), `.persona` (pinned header: 48px avatar circle with initials on `--primary-soft`, name, "Écouter" button with `[aria-busy=true]::before` spinner via `@keyframes spin`), `.thread` (`overflow:auto; max-height: 52vh`), `.message` / `.message.user` with `border-start-start-radius` etc. (logical corners), `.typing` three dots with `@keyframes pulse`, `.choice` full width, `text-align: start`, 3px border on hover/focus, `.choice-num` circle.
- Feedback bar: `.feedback-bar { position: sticky; inset-block-end: 0; display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; padding: 16px 20px; border-block-start: 3px solid; background: var(--primary-soft); border-color: var(--primary); color: var(--primary-strong) }`, `.feedback-attention { background: var(--attention-soft); border-color: var(--attention); color: #7A3806 }` (7.9:1 on attention-soft), `.feedback-icon` 32px circle; ≤720px → `grid-template-columns: auto 1fr; .button { grid-column: 1 / -1 }`.
- Result: `.result-hero` grid `1fr auto`, `.recap li`, `.recap-best` with `border-inline-start: 4px solid var(--primary)`.
- Modules: `.answer` buttons, `.answer.correct` (`--primary-soft`), `.answer.wrong` (`--attention-soft`, not red).
- Plan: `.timeline` with `inset-inline-start: 16px` connector; `dialog { border: 0; border-radius: var(--radius); padding: 24px; max-width: 420px } dialog::backdrop { background: rgb(20 33 28 / .5) }`.
- Certificate (Phase 5 uses it): `.certificate { border: 3px double var(--primary); padding: 48px; text-align: center; background: var(--surface) }`.
- Manager: `.manager-card dl` two-column definition list; `.empty-state` centered muted.
- Media: `@media (max-width: 720px)` single columns, header wraps to two rows (nav row scrolls), `.profile-button span:last-child { display: none }`; `@media (prefers-reduced-motion: reduce) { .typing i, .chip-pop, [aria-busy]::before { animation: none } * { scroll-behavior: auto !important; transition: none !important } }`; `@media print { .site-header, .skip-link, .banner, .button-row, .lang-switch { display: none !important } body { background: white } .view { padding: 0 } .certificate { border-color: black } }` — and **remove** the old `.view[hidden] { display:block }` print rule (it printed every view).
- RTL: no `[dir=rtl]` overrides should be needed if every rule is logical. Verify with `grep -nE "(^|[^-])(left|right)\b" styles.css` → no hits.

- [ ] **Step 2.6: Verify**

Playwright 1280 and 390: `#start`, `#prep`, `#simulation`, `#modules`, `#plan`. Check `document.fonts.check("18px 'IBM Plex Sans'")` → true; `performance.getEntriesByType("resource").filter(r => r.name.includes("fonts/"))` shows 4–6 files, all 200; console has no CSP violation. Temporarily flip `document.documentElement.dir = "rtl"` via `browser_evaluate` and screenshot `#simulation` at 390: bubbles and the feedback bar mirror, no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`).

- [ ] **Step 2.7: ponytail-review, commit**

```bash
git add bp-learning-morocco-frontend-candidate/styles bp-learning-morocco-frontend-candidate/styles.css bp-learning-morocco-frontend-candidate/fonts
git commit -m "style: clinical green design system, IBM Plex self-hosted, 18px type scale, logical properties for RTL"
```

**Acceptance:** fonts load from `fonts/` with no CSP error; tokens byte-match spec §10; no physical left/right property in either stylesheet; 390px has no horizontal scroll on any route; feedback bar sticky at the bottom on mobile.

---

## Phase 3 — Simulation staging (60 min)

**Files:** Create `APP/audio.js`, `APP/scripts/generate-audio.mjs`, `APP/audio/fr/turn-1..3.mp3`, `APP/audio/ar/turn-1..3.mp3` (AR generated after Phase 4's content review; FR now). Rewrite `APP/views/simulation.js`. Modify `APP/app.js` (`afterRender`, `listen` action, `audio.stop()` on route change / language switch).

- [ ] **Step 3.1: generate-audio.mjs**

```js
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
```

- [ ] **Step 3.2: You run the generation (your terminal, not Claude's)**

```bash
# list voices once, pick a female multilingual voice id for FR and AR (optional; default is Sarah)
curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>JSON.parse(s).voices.forEach(v=>console.log(v.voice_id,v.name,v.labels?.language??'',v.labels?.gender??'')))"
cd bp-learning-morocco-frontend-candidate
ELEVENLABS_VOICE_FR=<id> node scripts/generate-audio.mjs fr        # now
ELEVENLABS_VOICE_AR=<id> node scripts/generate-audio.mjs ar        # after Phase 4 content is reviewed
ls -la audio/fr                                                     # 3 files, each 20–80 KB
```
Claude never receives the key. If the API is down, Phase 3 continues: the fallback path is the product, the mp3s are a polish layer.

- [ ] **Step 3.3: audio.js**

```js
const SYNTH_LANG = { fr: "fr-FR", ar: "ar" };
let current = null;
export function stop() { if (current) { current.pause(); current.currentTime = 0; current = null; } window.speechSynthesis?.cancel(); }
// el: <audio> element for this turn or null. Returns "mp3" | "synth" | "silent". Never throws.
export async function play(el, text, lang) {
  stop();
  if (el && (await tryMp3(el))) return "mp3";
  return trySynth(text, lang) ? "synth" : "silent";
}
function tryMp3(el) {
  return new Promise((resolve) => {
    current = el;
    const fail = () => { clearTimeout(timer); el.pause(); resolve(false); };
    const timer = setTimeout(fail, 2000);                       // spec §15: spinner ≤ 2 s then fall back
    el.addEventListener("playing", () => { clearTimeout(timer); resolve(true); }, { once: true });
    el.addEventListener("error", fail, { once: true });
    el.play().catch(fail);                                      // 404, autoplay policy, unsupported → fallback
  });
}
function trySynth(text, lang) {
  const synth = window.speechSynthesis; if (!synth) return false;
  const wanted = SYNTH_LANG[lang];
  if (!synth.getVoices().some((v) => v.lang.toLowerCase().startsWith(wanted.slice(0, 2)))) return false;   // no matching voice → silent, not a wrong-language voice
  const u = new SpeechSynthesisUtterance(text); u.lang = wanted; u.rate = 0.95; synth.speak(u); return true;
}
```

- [ ] **Step 3.4: views/simulation.js (final)**

```js
import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, feedbackBar } from "./shared.js";
export function render(state, ui) {
  const C = content(getLang()); const D = C.dialogue; const lang = getLang();
  const k = state.dialogueAnswers.length; const done = k >= D.length;
  const fb = ui.feedbackTurn;                                   // index of the turn just answered, or null
  const showChoices = !done && fb === null && !ui.typing && ui.revealedTurn >= k;
  const audioTurn = fb ?? (ui.revealedTurn >= k && !done ? k : null);
  const msgs = [];
  D.forEach((turn, i) => {
    const revealed = i < k || (i === k && ui.revealedTurn >= k) || done;
    if (revealed) msgs.push(`<div class="message"><small>${escapeHTML(C.scenario.customer)}</small>${escapeHTML(turn.text)}</div>`);
    if (state.dialogueAnswers[i] !== undefined) msgs.push(`<div class="message user"><small>${t("sim.you")}</small>${escapeHTML(turn.choices[state.dialogueAnswers[i]])}</div>`);
  });
  if (ui.typing) msgs.push(`<div class="message typing" aria-hidden="true"><i></i><i></i><i></i></div>`);
  let bar = "";
  if (fb !== null) {
    const turn = D[fb]; const chosen = state.dialogueAnswers[fb]; const last = fb === D.length - 1;
    bar = feedbackBar({ kind: chosen === turn.best ? "success" : "attention", why: turn.feedback,
      recommended: chosen === turn.best ? "" : t("feedback.recommended", { answer: turn.choices[turn.best] }),
      actionLabel: t(last ? "sim.seeResult" : "sim.continue"), action: last ? "see-result" : "continue-dialogue" });
  }
  const listen = audioTurn === null ? "" : `<button class="button button-secondary listen" type="button" data-action="listen" data-turn="${audioTurn}">🔊 ${t("sim.listen")}</button>
      <audio preload="none" data-audio src="audio/${lang}/turn-${audioTurn + 1}.mp3"></audio>`;
  return `<section class="page-shell" aria-labelledby="view-title">
    <p class="eyebrow">${t("nav.simulation")}</p><h1 id="view-title" tabindex="-1">${t("sim.title")}</h1>
    <div class="simulation-shell">
      <details class="scenario-panel" open><summary>${t("sim.context")}</summary>
        <p>${escapeHTML(C.scenario.context)}</p><h2 class="h3">${t("sim.goal")}</h2><p>${escapeHTML(C.scenario.goal)}</p><span class="tag">${t("sim.fictional")}</span></details>
      <div class="conversation">
        <header class="persona"><span class="avatar" aria-hidden="true">${escapeHTML(C.scenario.initials)}</span>
          <div><strong>${escapeHTML(C.scenario.customer)}</strong><small>${t("sim.step", { n: Math.min(k + 1, D.length), total: D.length })}</small></div>${listen}</header>
        <div class="thread" data-thread>${msgs.join("")}${done && fb === null ? `<p class="subtle">${t("sim.doneTitle")}</p>` : ""}</div>
        ${showChoices ? `<div class="choice-panel"><p class="small"><strong>${t("sim.prompt")}</strong></p><div class="choice-list">${D[k].choices.map((c, i) => `<button class="choice" type="button" data-action="choose" data-index="${i}"><span class="choice-num" aria-hidden="true">${i + 1}</span><span>${escapeHTML(c)}</span></button>`).join("")}</div></div>` : ""}
        ${bar}
        ${done && fb === null ? `<div class="button-row">${routeLink("result", t("sim.seeResult"))}<button class="button button-secondary" type="button" data-action="restart-dialogue">${t("sim.restart")}</button></div>` : ""}
      </div>
    </div></section>`;
}
```
`<details open>` gives the ≤720px "collapsible context" natively; on wide screens it simply stays open.

- [ ] **Step 3.5: app.js additions**

```js
import * as audio from "./audio.js";
// in render(): when r !== lastRoute → audio.stop();
function afterRender(r) {
  if (r !== "simulation") return;
  const C = content(getLang()); const k = state.dialogueAnswers.length;
  if (k >= C.dialogue.length || ui.feedbackTurn !== null || ui.typing || ui.revealedTurn >= k) { document.querySelector("[data-thread]")?.scrollTo(0, 99999); return; }
  ui.typing = true; render();
  ui.typingTimer = setTimeout(async () => { ui.typing = false; ui.revealedTurn = k; render(); document.querySelector('[data-action="choose"][data-index="0"]')?.focus(); await speak(k); }, 900 + Math.round((Math.random() - 0.5) * 400));
}
async function speak(turn) {
  const btn = document.querySelector('[data-action="listen"]'); const el = document.querySelector("[data-audio]");
  const text = content(getLang()).dialogue[turn].text;
  btn?.setAttribute("aria-busy", "true");
  await audio.play(el, text, getLang());
  btn?.removeAttribute("aria-busy");
}
// click switch: case "listen": speak(Number(el.dataset.turn)); return;
// change handler, lang-switch: audio.stop(); ui.revealedTurn = -1; before render()
```
Guard against recursion: `afterRender` sets `ui.typing = true` before calling `render()`, so the nested call takes the early return.

- [ ] **Step 3.6: Verify**

Playwright 1280 fresh: `#prep` → Démarrer → typing dots ~1 s → line appears → audio: `browser_evaluate` `() => document.querySelector("[data-audio]").currentTime > 0` after 1.5 s → true (Chromium headless may block autoplay: then check `readyState >= 2` and that the Écouter click plays). Press `1` on the keyboard → learner bubble + feedback bar, `document.activeElement.dataset.action === "continue-dialogue"`. Enter → typing → turn 2. Complete → "Voir le résultat" focused → Enter → `#result`. Fallback test: rename `audio/fr` to `audio/fr.off`, reload → no console error other than a 404 resource, Écouter button spins ≤ 2 s then either speaks or stops silently; rename back. Reload directly on `#simulation` mid-way: typing, reveal, no exception from autoplay rejection. Reduced motion: `browser_emulate_media` `reducedMotion: reduce` → dots static, chip appears and hides after 1.4 s.

- [ ] **Step 3.7: ponytail-review, commit**

```bash
git add bp-learning-morocco-frontend-candidate/audio.js bp-learning-morocco-frontend-candidate/scripts bp-learning-morocco-frontend-candidate/audio bp-learning-morocco-frontend-candidate/views/simulation.js bp-learning-morocco-frontend-candidate/app.js bp-learning-morocco-frontend-candidate/styles.css
git commit -m "feat(simulation): persona header, typing pause, docked feedback bar with focus, pre-generated voice with speechSynthesis and silent fallback"
```

**Acceptance:** feedback bar never auto-dismisses; focus lands on its button; 1/2/3 and Enter complete the dialogue with no mouse; audio plays per turn; removing `audio/` breaks nothing; `+1` chip on each new answer.

---

## Phase 4 — Onboarding + i18n (45 min)

**Files:** Create `APP/locales/ar.js`, `APP/views/onboarding.js`. Modify `APP/fixtures.js` (add `ar` block), `APP/i18n.js` (import ar), `APP/app.js` (route guard, `choose-lang`, `save-name`), `APP/styles.css` (onboarding cards).

- [ ] **Step 4.1: Review the Gemini outputs**

```bash
cd bp-learning-morocco-frontend-candidate
sed -e '/^```/d' "$S/ar.raw.js" > locales/ar.js && node --check locales/ar.js
node -e "import('./locales/fr.js').then(async f => { const a = (await import('./locales/ar.js')).ar; const fk = Object.keys(f.fr), ak = Object.keys(a); console.log('missing', fk.filter(k => !(k in a))); console.log('extra', ak.filter(k => !(k in f.fr))); for (const k of fk) { const pf = (f.fr[k].match(/\{\w+\}/g)||[]).sort().join(), pa = ((a[k]||'').match(/\{\w+\}/g)||[]).sort().join(); if (pf !== pa) console.log('placeholder mismatch', k, pf, pa); } })"
```
Expected: `missing []`, `extra []`, no placeholder mismatch. Read `ar.js` once by eye for stray French, `BP Learning` kept, `lang.fr`/`lang.ar` kept. Then the fixtures block:
```bash
sed -e '/^```/d' "$S/fixtures-ar.raw.json" > "$S/fixtures-ar.json" && node -e "JSON.parse(require('fs').readFileSync('$S/fixtures-ar.json','utf8')); console.log('json ok')"
```
Paste the parsed object into `fixtures.js` as `ar: { ... }` next to `fr` (keep `id`, `best`, `correct`, `initials` from fr; the parity test checks it). Run `node --test tests/` → parity test now covers `ar`. Send `locales/ar.js` and the `ar` dialogue to the Dale native reader now, so feedback lands before Phase 7.

- [ ] **Step 4.2: i18n.js** — add `import { ar } from "./locales/ar.js";` and `const LOCALES = { fr, ar };`.

- [ ] **Step 4.3: views/onboarding.js**

```js
import { t } from "../i18n.js";
import { escapeHTML } from "./shared.js";
export function render(state, ui) {
  if (ui.onboardingStep === 0) return `<section class="page-shell onboarding" aria-labelledby="view-title">
    <h1 id="view-title" tabindex="-1"><span lang="fr">Choisissez votre langue</span> · <span lang="ar" dir="rtl">اختر لغتك</span></h1>
    <div class="lang-cards">
      <button class="lang-card" type="button" lang="fr" data-action="choose-lang" data-lang="fr" data-focus>Français</button>
      <button class="lang-card" type="button" lang="ar" dir="rtl" data-action="choose-lang" data-lang="ar">العربية</button>
    </div>
    <p class="small subtle"><span lang="fr">Vous pourrez changer de langue en haut de la page.</span> <span lang="ar" dir="rtl">يمكنك تغيير اللغة في أعلى الصفحة.</span></p></section>`;
  return `<section class="page-shell onboarding" aria-labelledby="view-title">
    <h1 id="view-title" tabindex="-1">${t("onboarding.nameTitle")}</h1>
    <form data-action="save-name" novalidate>
      <label for="name">${t("onboarding.nameLabel")}</label>
      <input id="name" name="name" type="text" required maxlength="40" autocomplete="given-name" value="${escapeHTML(state.profile.name)}" data-focus />
      <p class="small subtle">${t("onboarding.nameWhy")} ${t("app.savedLocally")}</p>
      <button class="button button-primary" type="submit">${t("onboarding.nameSubmit")}</button>
    </form></section>`;
}
```
The language step is bilingual by design (the user has not chosen yet), so its two strings are literal, not `t()` keys. Everything after uses `t()`.

- [ ] **Step 4.4: app.js**

- `VIEWS` gains `onboarding`. Route guard in `route()`: `if (!state.profile.name && r !== "onboarding" && r !== "manager") { location.replace("#onboarding"); return "onboarding"; }`.
- click switch: `case "choose-lang": state.profile.lang = el.dataset.lang; setLang(state.profile.lang); save(); ui.onboardingStep = 1; render(); return;`
- `document.addEventListener("submit", (event) => { const form = event.target.closest('[data-action="save-name"]'); if (!form) return; event.preventDefault(); const input = form.elements.name; const name = input.value.trim().slice(0, 40); if (!name) { input.setCustomValidity(" "); input.reportValidity(); input.setCustomValidity(""); input.focus(); return; } state.profile.name = name; save(); ui.onboardingStep = 0; go("start"); });`
- `lang-switch` change handler: also `ui.revealedTurn = -1; audio.stop();` so a language switch mid-simulation replays the current turn in the new language.

- [ ] **Step 4.5: styles.css** — `.lang-cards { display:grid; grid-template-columns: 1fr 1fr; gap: 16px } .lang-card { min-height: 140px; font-size: var(--fs-h2); border: 2px solid var(--border); border-radius: var(--radius); background: var(--surface) } .lang-card:hover, .lang-card:focus-visible { border-color: var(--primary) } .onboarding input { font-size: var(--fs-body); min-height: 52px; padding-inline: 16px; width: 100%; max-width: 420px; border: 2px solid var(--border); border-radius: var(--radius-sm) } @media (max-width: 720px) { .lang-cards { grid-template-columns: 1fr } }`.

- [ ] **Step 4.6: clarify pass** — invoke `clarify` on `locales/fr.js` (plain language, `vous`, no jargon). Apply accepted edits to `fr.js`; mirror any key change in `ar.js` (keys only; wording changes to AR go back through the native reader, or are flagged in README).

- [ ] **Step 4.7: Verify**

Playwright, fresh storage: root → redirected to `#onboarding`; Tab lands on "Français"; click "العربية" → `document.documentElement.dir === "rtl"`, `lang === "ar"`; name step in Arabic; submit empty → validity bubble, stays; type `نادية` → `#start` in Arabic, header select shows العربية, profile shows the name. Screenshot `#start`, `#simulation` (turn 1 with feedback bar), `#modules` at 1280 and 390 in AR: no horizontal scroll (`scrollWidth <= innerWidth`), bubbles mirrored, numbers Western. Switch select to FR → all labels flip without reload, hash unchanged. Name XSS check: enter `<img src=x onerror=alert(1)>` as the name → header shows the literal text, no dialog (grep audit repeated).

- [ ] **Step 4.8: ponytail-review, commit**

```bash
git add bp-learning-morocco-frontend-candidate
git commit -m "feat(i18n): first-run language and name step, Arabic (MSA) locale and dialogue content, header language switch, RTL"
```

**Acceptance:** onboarding is unskippable and stores `{name, lang}`; FR↔AR flips `dir`, labels, and content on every route with no layout break at 390 and 1280; parity test green; no key missing in `ar.js`.

---

## Phase 5 — Modules retry, resume, certificate (40 min)

**Files:** Create `APP/views/certificate.js`. Modify `APP/views/modules.js` (retry polish + "next question" focus), `APP/views/plan.js` (attestation link), `APP/app.js` (`print`, `focus-next-module`, `certificate` view), `APP/styles.css` (print).

- [ ] **Step 5.1: views/certificate.js**

```js
import { t, getLang, formatDate } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink } from "./shared.js";
import { isComplete, dialogueScore, modulesSummary } from "../state.js";
export function render(state) {
  const C = content(getLang());
  if (!isComplete(state) || !state.completedAt) return `<section class="page-shell" aria-labelledby="view-title"><h1 id="view-title" tabindex="-1">${t("cert.title")}</h1><p class="lede">${t("cert.locked")}</p><div class="button-row">${routeLink("plan", t("cert.back"), "button-secondary")}</div></section>`;
  const d = dialogueScore(state), m = modulesSummary(state);
  return `<section class="page-shell" aria-labelledby="view-title">
    <article class="certificate">
      <p class="eyebrow">${t("app.name")}</p><h1 id="view-title" tabindex="-1">${t("cert.title")}</h1>
      <p class="cert-body">${t("cert.body", { name: escapeHTML(state.profile.name), course: escapeHTML(C.course.title) })}</p>
      <dl class="cert-facts"><dt>${t("cert.date")}</dt><dd>${formatDate(state.completedAt)}</dd><dt>${t("cert.dialogue")}</dt><dd>${d.best}/${d.total}</dd><dt>${t("cert.modules")}</dt><dd>${m.solved}/${m.total}</dd></dl>
      <p class="small subtle">${t("cert.disclaimer")}</p>
    </article>
    <div class="button-row"><button class="button button-primary" type="button" data-action="print" data-focus>${t("cert.print")}</button>${routeLink("plan", t("cert.back"), "button-secondary")}</div></section>`;
}
```
`t()` does not escape; `name` is escaped before interpolation. This and `nav.profile` are the only places `t()` receives user input, both pre-escaped. The grep audit covers them.

- [ ] **Step 5.2: app.js** — `VIEWS.certificate`; `case "print": window.print(); return;`; `case "focus-next-module": { const next = document.querySelector('[data-action="answer-module"]:not([disabled])') ?? document.querySelector('a[href="#plan"].button'); next?.focus(); return; }`.

- [ ] **Step 5.3: modules.js polish** — after a correct answer the card's success bar action is `t("modules.next")` with `action: "focus-next-module"` (when all solved, the bar's action label is `t("modules.done")` and the page footer link to `#plan` receives focus). Wrong answer bar: explanation + `t("modules.retry")` → `retry-module` (Phase 1). Page lede shows `t("modules.solvedCount", { done, total })`.

- [ ] **Step 5.4: Print CSS** — from the Phase 2 list, plus `@page { margin: 2cm }`, `.certificate { break-inside: avoid }`. Chrome "Save as PDF" is the download path.

- [ ] **Step 5.5: Verify**

Playwright: complete dialogue + modules (with one deliberate wrong answer first → retry → correct); `#plan` shows "Voir l'attestation" enabled; `#certificate` shows the name, today's date in `fr-MA` long format with Western digits, 3/3 and 3/3; `browser_emulate_media` `media: print` → screenshot: header/buttons hidden, certificate framed. Manually `Ctrl+P` once in a real browser to confirm one page. Resume: reload on `#start` mid-way → "Continuer" → `nextRoute`. State tests still green.

- [ ] **Step 5.6: ponytail-review, commit**

```bash
git add bp-learning-morocco-frontend-candidate
git commit -m "feat: module retry with explanation, resume to exact step, printable attestation with completion date"
```

**Acceptance:** wrong answer → explanation + retry; first attempt kept for the manager view; `completedAt` set once; attestation prints cleanly with the learner's name; locked state when incomplete.

---

## Phase 6 — Manager view (30 min)

**Files:** Create `APP/views/manager.js`. Modify `APP/app.js` (view + header link), `APP/styles.css` (`.manager-card`, `.empty-state`).

- [ ] **Step 6.1: views/manager.js**

```js
import { t, formatDate } from "../i18n.js";
import { escapeHTML, routeLink } from "./shared.js";
import { progress, dialogueScore, modulesSummary } from "../state.js";
export function render(state) {
  const head = `<p class="eyebrow">${t("app.name")}</p><h1 id="view-title" tabindex="-1">${t("manager.title")}</h1><p class="lede">${t("manager.lede")}</p>`;
  if (!state.completedAt) return `<section class="page-shell" aria-labelledby="view-title">${head}<div class="empty-state"><p>${t("manager.empty")}</p>${routeLink("start", t("nav.overview"), "button-secondary")}</div></section>`;
  const d = dialogueScore(state), m = modulesSummary(state);
  return `<section class="page-shell" aria-labelledby="view-title">${head}
    <article class="card manager-card"><h2>${escapeHTML(state.profile.name)}</h2>
      <dl><dt>${t("manager.completion")}</dt><dd>${progress(state)} %</dd>
          <dt>${t("manager.dialogueScore")}</dt><dd>${d.best}/${d.total} (${d.pct} %)</dd>
          <dt>${t("manager.modules")}</dt><dd>${m.solved}/${m.total} · ${t("manager.firstTry", { n: m.firstTry, total: m.total })}</dd>
          <dt>${t("manager.completedOn")}</dt><dd>${formatDate(state.completedAt)}</dd>
          <dt>${t("manager.attestation")}</dt><dd>${t("manager.attestationReady")} · ${routeLink("certificate", t("manager.open"), "button-secondary")}</dd></dl>
    </article></section>`;
}
```
No arrays of learners, no loop, no placeholder rows: the shape of the code makes fabrication impossible.

- [ ] **Step 6.2: app.js** — `VIEWS.manager`; header gets `<a class="quiet-link" href="#manager">${t("nav.manager")}</a>` after the nav (hidden on print). Route guard already exempts `manager`.

- [ ] **Step 6.3: Verify** — fresh storage: `#manager` shows the empty state (reachable without onboarding). After completion: card with the real numbers, first-try count matching the deliberate wrong answer from Phase 5 (2/3). Reset from plan → empty state again. AR: labels flip, date in `ar-MA` with Western digits.

- [ ] **Step 6.4: ponytail-review, commit**

```bash
git add bp-learning-morocco-frontend-candidate
git commit -m "feat(manager): one learner card from local data with honest empty state"
```

**Acceptance:** exactly one card or the empty sentence; nothing on screen that is not in `localStorage`.

---

## Phase 7 — Evidence: after, keyboard run, user test, README (45 min)

**Files:** Create `docs/evidence/after/*.png`, `docs/evidence/keyboard-run.md`, `docs/evidence/user-test.md`, root `README.md`. Modify `APP/README.md`.

- [ ] **Step 7.1: Accessibility pass (read-only skill first)** — invoke `ecc:accessibility` on `views/` and `app.js`; fix anything blocking (expected: none beyond confirming `role="status"`, labelled `<progress>`, `aria-hidden` typing dots, focus management). Small fixes go in this phase's commit.

- [ ] **Step 7.2: After captures** — same server. Fresh storage. At 1280×900 then 390×844 (`-390` suffix):

`after-onboarding-lang`, `after-onboarding-name`, `after-start`, `after-prep` (button enabled, no boxes ticked), `after-sim-typing`, `after-sim-turn1`, `after-sim-feedback-success` (after pressing 1), `after-sim-feedback-attention` (turn 2, press 3), `after-result`, `after-module-wrong-retry`, `after-modules-done`, `after-plan`, `after-plan-reset-dialog`, `after-certificate`, `after-certificate-print` (emulate print), `after-manager-empty` (fresh run or after reset), `after-manager-card`, `after-start-ar`, `after-sim-feedback-ar` (RTL), `after-certificate-ar`. Move with `mv ./.playwright-mcp/after-*.png docs/evidence/after/` (or the `APP/.playwright-mcp/` variant). Expect 40 files.

- [ ] **Step 7.3: Keyboard-only run** — perform the entire path with `browser_press_key` only (Tab/Shift+Tab/Enter/Space/1/2/3/Escape), from onboarding to the print button, and log it:

`docs/evidence/keyboard-run.md`:
```markdown
# Keyboard-only run — 2026-09-19, Chromium via Playwright, 1280×900

Rule: no pointer events. Keys used: Tab, Shift+Tab, Enter, Space, 1, 2, 3, Escape, ArrowDown.

| Step | Keys | Focus lands on | Result |
|---|---|---|---|
| Onboarding language | Tab, Enter | "Français" card | lang=fr, name step, focus in the input |
| Name | type, Enter | input → submit | #start, h1 focused |
| Start → prep | Tab to "Commencer", Enter | h1 "Avant de commencer" | no gate |
| Prep → simulation | Tab to "Démarrer la simulation", Enter | h1, then first choice after the typing pause | |
| Turn 1 | 1 | feedback bar button "Continuer" | bar announced (role=status) |
| Turn 2 | Enter, wait, 3 | "Pas tout à fait" bar, button focused | recommended answer shown |
| Turn 3 | Enter, wait, 1 | "Voir le résultat" | Enter → #result |
| Result → modules | Tab to "Passer aux vérifications", Enter | h1 | |
| Module 1 wrong | Tab to answer 2, Space | "Réessayer" focused | explanation visible |
| Retry | Enter, Tab to answer 1, Space | "Question suivante" | |
| Modules 2, 3 | Enter, Tab, Space … | "Voir mon parcours" | |
| Plan | Tab to "Effacer ma progression", Enter, Escape | dialog closes, focus returns to the button | |
| Certificate | Tab to "Voir l'attestation", Enter | "Imprimer" button focused | Enter opens print |
| Language switch | Tab to select, ArrowDown | page re-renders in Arabic, focus on select | |

Not covered by digit keys: module answers (Tab + Space), by design (plan A5).
Screen reader notes: feedback bar is `role="status" aria-live="polite"`; header progress is a labelled `<progress>`; typing dots are `aria-hidden`; every route change moves focus to the h1.
Findings fixed during the run: (fill)
```

- [ ] **Step 7.4: User test template**

`docs/evidence/user-test.md`:
```markdown
# Test with another person

**Date / time:** 2026-09-19 __:__
**Participant:** (first name or role only, e.g. "Dale teammate, non-developer"; never a real pharmacist's data)
**Device / browser:**
**Language chosen:** FR / AR
**Task given (verbatim):** « Terminez la formation et imprimez votre attestation. Pensez à voix haute. »
**Facilitator:** (name) — observes, does not help unless stuck > 60 s.

## Timeline (minutes : what happened)
- 0:00 —
-

## What broke or confused (one line each, severity 1–3)
1.
2.
3.

## What changed after the test (commit hashes)
-

## What we did not fix and why
-

## Quotes
-
```
Block 10 minutes with a Dale teammate before 17:00; run it on a phone at 390px if possible. The filled file is the rubric answer.

- [ ] **Step 7.5: README rewrite (`APP/README.md`, edit in place) and root pointer**

`APP/README.md` sections, in this order:
1. **Problem** — learner (pharmacy employee, Casablanca, 30–50, non-technical, doing it for the license), task (finish one 15-minute training and get an attestation), pain in the delivered app (gate, vanishing toast, no retry, no name/language/voice/attestation, listener bug).
2. **References and the pattern chosen** — Uxcel lesson flow + bottom feedback bar, Uxcel course page, Delphi persona header, SchoolAI manager inspiration (the five spec §21 links); one paragraph on why Uxcel: teaching and testing on one screen, maps 1:1 to the routes.
3. **What changed** — route list, the feedback mechanic, language step, voice pipeline, attestation, manager view. Link every evidence file: `../docs/evidence/before/`, `../docs/evidence/after/`, `../docs/evidence/keyboard-run.md`, `../docs/evidence/user-test.md`.
4. **Run it** — `python -m http.server 8089` from this folder (ES modules need http, not `file://`), open `http://127.0.0.1:8089/`; `npm test` (`node --test tests/`); optional `ELEVENLABS_API_KEY=… node scripts/generate-audio.mjs` (build-time only; audio is already committed). No install, no account, no network at runtime; CSP printed verbatim.
5. **Security and data** — only a first name and progress in `localStorage` under `bp-learning-v2`; nothing leaves the browser; name escaped at render; no secrets in repo.
6. **Assumptions and remaining gaps** — MSA reviewed / not yet reviewed by a native reader (state which); Arabic `speechSynthesis` needs an installed voice, else silent; ElevenLabs voice ids used; "non accréditée" wording; linear dialogue (A3); manager view is one device, one learner by design; `FILE-MANIFEST.sha256` describes baseline `f38c2a1`; no offline caching (no service worker by choice).
7. **Files** — updated tree.

Root `README.md` (new, 6 lines): title, one sentence, link to `bp-learning-morocco-frontend-candidate/README.md`, link to `docs/evidence/`, link to the spec and plan, the run command.

- [ ] **Step 7.6: Final verification (superpowers:verification-before-completion)**

```bash
cd bp-learning-morocco-frontend-candidate && node --test tests/ && node --check app.js state.js i18n.js audio.js fixtures.js locales/*.js views/*.js scripts/generate-audio.mjs
grep -n "profile.name" views/*.js app.js               # all wrapped
grep -o "content=\"default-src[^\"]*\"" index.html      # equals spec §14 string
grep -rn "fetch(\|XMLHttpRequest\|WebSocket" --include=*.js . | grep -v scripts/      # nothing at runtime
git status --porcelain                                  # clean after commit
git ls-files | grep -iE "\.env|key|secret"              # nothing
cd .. && ls docs/evidence/before docs/evidence/after | wc -l
```
Playwright: one last full click-through at 390 in AR and at 1280 in FR, console filtered for errors → none.

- [ ] **Step 7.7: ponytail-review, commit**

```bash
git add README.md docs/ bp-learning-morocco-frontend-candidate
git commit -m "docs: after captures, keyboard-only run, user test template, README with problem, references, run and assumptions"
```

**Acceptance:** every rubric row in spec §4 resolves to a file linked from `APP/README.md`; `user-test.md` filled (or, if the session could not happen, its template committed and the gap named in README); all eight day-level acceptance criteria from the handoff checked and true.

---

## Timeline (demo 17:30)

| Phase | Min | Cumulative |
|---|---|---|
| 0 Before evidence | 20 | 0:20 |
| 1 Core refactor | 60 | 1:20 |
| 2 Design system (+ Gemini in background) | 45 | 2:05 |
| 3 Simulation staging (+ you run FR audio) | 60 | 3:05 |
| 4 Onboarding + i18n (+ you run AR audio, native reader ping) | 45 | 3:50 |
| 5 Retry, resume, certificate | 40 | 4:30 |
| 6 Manager | 30 | 5:00 |
| 7 After evidence, keyboard run, user test, README | 45 | 5:45 |
| Buffer (user test session, native-reader fixes, polish) | 60+ | 6:45 |

If time runs short, the cut order is: AR audio files (fallback covers it), then the `+1` chip, then Phase 6 (30 min, self-contained). Nothing in Phases 0, 1, 3, 4, 7 is cuttable: they are the rubric.

## Verification (end-to-end, what "done" means)

1. `node --test tests/` green (7 tests, parity covering fr and ar).
2. Fresh browser, 1280 FR: onboarding → start → prep (no gate) → simulation with typing, voice, persistent feedback bar with focus → result → modules with retry → plan → certificate prints with the name → manager card. Zero console errors.
3. Same at 390 AR: RTL mirrored, no horizontal scroll, Western digits, feedback bar sticky.
4. Keyboard-only run logged in `docs/evidence/keyboard-run.md`.
5. `audio/` folder removed → app still completes; restored → voice plays.
6. CSP meta byte-equal to spec §14; `git ls-files` contains no `.env`; no `fetch` in runtime code.
7. Manager empty state on a fresh device; card only after completion.
8. `docs/evidence/before` and `after` populated and linked; README has Problem, References, Run it, Assumptions.
