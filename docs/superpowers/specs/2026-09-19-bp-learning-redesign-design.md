# BP Learning Morocco — Learner Path Redesign (Eagle Day, track A3)

Date: 2026-09-19 · Status: approved design, pending implementation plan
Repo: `bp-learning-morocco-frontend-candidate/` (vanilla JS, no build step)
Baseline commit: `f38c2a1` (app as delivered)

## 1. Summary

Redesign the complete learner path of the BP Learning candidate app so a
non-technical pharmacy employee (30–50, doing this only to keep their
license) can finish a training in one sitting, understand every piece of
feedback, and come back tomorrow. Reference product: **Uxcel** (structure and
feedback mechanics). Persona header borrowed from **Delphi**.

Everything runs on-device. No runtime network calls. The CSP stays locked.

## 2. Goals and non-goals

Goals
- Every button works. No dummy controls. Demo clicks end to end at 17:30.
- The feedback moment is persistent, explained, and impossible to miss.
- The simulation feels like a person, not a quiz: avatar, typing pause,
  studio-quality voice (pre-generated), inline reactions.
- French and Modern Standard Arabic interface, chosen in a first-run step,
  switchable from the header, RTL correct.
- One honest manager screen and a printable attestation, both fed by real
  local data only.
- Rubric evidence delivered: before/after captures, keyboard and mobile
  checks, one test with another person, assumptions list, setup README.

Non-goals (explicitly out)
- Live LLM conversation. Backend of any kind. User accounts or multi-user sync.
- Streaks, badges, leaderboards (see §16).
- Darija as an interface language (no standard orthography; stays in content).
- Framework migration. The app stays vanilla JS with no build step.

## 3. Users

- **Learner** — pharmacy employee, Casablanca, non-technical, reluctant.
  Needs: obvious next step, big targets, no jargon, no dead ends, resume.
- **Manager** — pharmacy owner. Needs: did my person finish, how did they do,
  is there an attestation. One glance.

## 4. Rubric mapping (CHALLENGE.md, track A3)

| Rubric item | Where it lands |
|---|---|
| Problem statement (learner, task, pain) | README §"Problem" |
| ≥2 product references + chosen pattern | README §"References" (Uxcel flows, Delphi screen, Mobbin links) |
| Before/after captures | `docs/evidence/before/*.png`, `docs/evidence/after/*.png` via Playwright |
| Working implementation of one bounded path | The learner path: `onboarding → start → prep → simulation → result → modules → plan → certificate` |
| Keyboard and mobile checks | `docs/evidence/keyboard-run.md`, mobile screenshots at 390px |
| One test with another person | `docs/evidence/user-test.md` (who, task, what broke, what changed) |
| Assumptions and remaining gaps | README §"Assumptions" |
| Source and setup instructions | README §"Run it" |

## 5. Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Reference | Uxcel structure + feedback bar; Delphi persona header | Only reference where teaching and testing share one screen; maps 1:1 onto existing routes |
| Simulation | Scripted branching, on-device | Zero demo risk; "no personal data leaves the browser" is architectural, not a promise |
| Voice | Pre-generated ElevenLabs `.mp3`, shipped static; browser `speechSynthesis` fallback | Studio quality with no runtime network |
| Language | FR + AR (MSA), first-run choice, header switch, RTL | Rubric names the multilingual Moroccan context in sentence one; MSA is what shipping Moroccan products use |
| Scope | Full learner path + thin manager view + attestation | Satisfies written rubric and verbal briefing without inventing data |
| Visual | Calm clinical green, warmer, larger type | Reads as healthcare, reassures the audience, will not look dated |
| Stack | Vanilla JS, ES modules, no bundler | 700 → ~1,400 lines; a framework costs an hour and buys nothing |
| Delegation | Targeted: translations, content, token sheet → Gemini CLI / Codex; core refactor → Claude | Bulk self-contained work is where a cold agent wins |

## 6. Information architecture

Hash routes. Header shows brand, progress %, language switch, profile.

```
#onboarding   first run only: language → name
#start        course overview, "Continue" resumes the exact step
#prep         3 principles (no gate; "Start simulation" always enabled)
#simulation   persona header, thread, choices, feedback bar
#result       score ring, dialogue recap, link to modules
#modules      3 learning checks with retry
#plan         progress, next steps, attestation entry point
#certificate  printable attestation (print stylesheet)
#manager      one learner card from local data, honest empty state
```

Route ids are English in code, labels translated. The delivered German route
ids (`vorbereitung`, `abschluss`, `lernplan`) are replaced — they are
inconsistent with the French UI.

## 7. Screen specifications

### 7.1 Onboarding (first run)
Step 1 — two large cards side by side: "Français" / "العربية". Selecting
applies `lang` and `dir` instantly and advances.
Step 2 — one text field "Votre prénom" (required, ≤ 40 chars, escaped on
render) and a primary button. Stored in `state.profile = { name, lang }`.
Not skippable — the name is needed for the attestation; one line of copy says why.

### 7.2 Start
Uxcel course page: eyebrow, title, one-sentence description, duration,
primary CTA "Continuer" that deep-links to the exact unfinished step,
secondary "Voir ma progression". Three stage cards with status. Progress ring.

### 7.3 Prep
Three principle cards. Checkboxes remain as an optional "ready" signal but
**do not gate** the simulation button. Rationale: the delivered gate blocks a
reluctant user at the door; Uxcel lets you start in one click.

### 7.4 Simulation (hero)
Layout: left panel = scenario context and goal; right = conversation.
Under 720px: single column, context collapsible above the thread.

Persona header pinned above the thread: avatar initials, name
("Cliente · Casablanca"), a small "Écouter" control.

Turn cycle:
1. Customer line appears after a typing indicator (900 ms ± 200).
2. Audio for that line plays automatically once (a user gesture has already
   occurred); "Écouter" replays it. If the `.mp3` fails → `speechSynthesis`
   in `fr-FR` / `ar` → if unavailable, silent. Never blocks.
3. Three choices as full-width buttons, numbered 1–3, keyboard 1/2/3.
4. On choice: learner bubble appended; **feedback bar** appears (§8).
5. "Continuer" (Enter) advances. Last turn → "Voir le résultat".

### 7.5 Result
Score ring (best-answer %), one-line verdict, per-turn recap with the
recommended answer highlighted, CTA to modules.

### 7.6 Modules (learning checks)
Three cards, one question each. Wrong answer → attention feedback +
explanation + "Réessayer" (re-enables the choices). Correct → success feedback.
Scoring: the first attempt is recorded for the manager view; retries are for
learning and do not change the score. State stores `{ first, solved }`.

### 7.7 Plan
Progress bar, three timeline rows, "Télécharger l'attestation" enabled once
dialogue + modules are complete. Reset behind a confirmation dialog.

### 7.8 Certificate
Print-first page: learner name, course title, date, dialogue score, modules
solved, and the line "Attestation de participation — exercice de formation,
non accréditée". `@media print` hides chrome. Button calls `window.print()`.

### 7.9 Manager
One card: learner name, completion %, dialogue score, modules solved,
completion date, attestation status. Empty state when nothing is complete:
"Aucune formation terminée sur cet appareil." No invented colleagues.

## 8. The feedback mechanic (from Uxcel)

A full-width bar docked to the bottom of the content area — not a toast.
- Success: green surface, check icon, "Bonne réponse", one-line why.
- Attention: amber surface (not red — non-punitive), "Pas tout à fait",
  one-line why, which answer was recommended.
- Always contains the single next action. Never auto-dismisses.
- Announced via `role="status"`. Focus moves to the bar's button.
- Progress bar at top gains a `+1` chip animation (reduced-motion safe).

## 9. Internationalisation and RTL

- `i18n.js` exports `t(key, vars)`, `setLang(lang)`, and the current `dir`.
- `locales/fr.js`, `locales/ar.js`: flat key → string maps with the same
  keys, both complete; a missing key falls back to `fr` and logs once.
- Content (prep, dialogue, modules) is authored in both languages inside
  `fixtures.js`, keyed by lang. The scenario premise (customer reads French,
  prefers an oral explanation) is preserved in both.
- `<html lang dir>` is set on switch; layout uses CSS logical properties
  (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `text-align: start`).
  The 9 physical rules in `styles.css` are converted.
- Numerals stay Western Arabic (0–9) in both; dates via `Intl.DateTimeFormat`.

## 10. Typography and design tokens

Font: **IBM Plex Sans** (Latin) + **IBM Plex Sans Arabic** (Arabic). One
family, shared x-height, OFL licensed, self-hosted as `.woff2` in `fonts/`.
CSP `font-src` changes from `'none'` to `'self'`. Fallback stack:
`system-ui, "Segoe UI", Tahoma, sans-serif` (Tahoma renders Arabic well on Windows).

Type scale (Latin / Arabic × 1.08): body 18px, small 15px, h3 20, h2 24,
h1 32. Line-height 1.6 Latin, 1.8 Arabic. Max line length 68ch.

Tokens (validate every text/background pair ≥ 4.5:1 before finalizing):
```
--bg #F6FAF8   --surface #FFFFFF   --text #14211C   --muted #4F6259
--border #D7E2DC
--primary #1B7A5E   --primary-strong #145F49   --primary-soft #E3F2EB
--attention #B45309   --attention-soft #FEF3E2
--focus #0B5FFF
--radius 14px   --radius-sm 10px   --space 4px scale (4/8/12/16/24/32/48)
```
Targets ≥ 44×44px. Visible focus ring on every interactive element.
`prefers-reduced-motion` disables the typing pulse and chip animation.

## 11. Audio pipeline (build-time only)

`scripts/generate-audio.mjs` (Node 24, no dependencies):
- Reads dialogue lines from `fixtures.js` for `fr` and `ar`.
- Calls ElevenLabs text-to-speech (multilingual model); key from the
  `ELEVENLABS_API_KEY` env var — never a file in the repo.
- Writes `audio/<lang>/turn-<n>.mp3`. Idempotent: skips existing files.
- Run once by the developer. Output committed. Runtime never calls the API.

Runtime: one `<audio preload="none">` per turn; `media-src` is covered by
`default-src 'self'`, so no CSP change is needed for audio.

## 12. State model

```js
{
  version: 2,
  profile: { name: "", lang: "fr" },
  prep: ["langue"],                       // optional readiness marks
  dialogueAnswers: [0, 2],                // index per turn; step = length
  modules: { preference: { first: 1, solved: true } },
  completedAt: null                       // or ISO string
}
```
- `dialogueStep` is removed (derived from `dialogueAnswers.length`).
- `loadState()` validates every field against fixtures; unknown → default.
- Reset uses `structuredClone(DEFAULT)`.
- Storage key `bp-learning-v2`; the v1 key is read once, migrated if the
  shape matches, then ignored.

## 13. Module architecture

```
index.html
styles.css              tokens, layout, components, print, rtl
app.js                  router, single delegated listener, render()
state.js                DEFAULT, load, save, migrate, derived getters
i18n.js                 t(), setLang(), dir
locales/fr.js  ar.js
fixtures.js             course/prep/dialogue/modules, keyed by lang
views/onboarding.js start.js prep.js simulation.js result.js
      modules.js plan.js certificate.js manager.js
audio.js                play(turn): mp3 → speechSynthesis → silent
scripts/generate-audio.mjs
tests/state.test.mjs    node --test on load/migrate/validate
```
`<script type="module" src="app.js">` replaces the IIFE. Each view exports
`render(state) → html` and declares the `data-action` names it emits;
`app.js` maps actions to state transitions in one `switch`.

## 14. Security

- No runtime network. CSP: `default-src 'self'; connect-src 'none';
  font-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self';
  object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`.
- The learner name is the only user-entered text. `escapeHTML` is applied at
  every render site; audited with grep before commit.
- `localStorage` holds nothing beyond a first name and progress; the UI says
  "saved only on this device" and the README repeats it.
- No secrets in the repo: `.gitignore` covers `.env*`; the ElevenLabs key is
  an env var only. The DeepSeek key found in `.env` must be rotated by its owner.
- The manager view never fabricates people.

## 15. Accessibility, mobile, states

- Keyboard: Tab order follows reading order; 1/2/3 select, Enter continues,
  Esc closes dialogs. Skip link retained. Focus moves on route change and
  onto the feedback bar.
- Screen readers: feedback bar `role="status"`; `<progress>` labelled;
  typing indicator `aria-hidden`.
- Mobile ≤ 720px: single column, sticky feedback bar, no horizontal scroll.
- States: empty (manager, plan), loading (audio buffering → button shows a
  spinner ≤ 2 s then plays or falls back), error (audio failure → silent
  fallback, no dialog; storage failure → in-memory session with a banner).

## 16. Features considered and rejected

- Streaks / badges — juvenile for the audience; fake without multi-day data.
- Leaderboard — ranks colleagues inside one small pharmacy; socially corrosive.
- Live LLM chat — network dependency at demo time; opens a data-protection question.
- A different scenario for AR — doubles authoring for no rubric gain.

## 17. Testing and evidence

- `node --test tests/` for state logic.
- Playwright (MCP): every route, every button, a keyboard-only pass,
  390px and 1280px screenshots → `docs/evidence/`.
- Manual: one 10-minute test with another person, task "finish the training
  and print the attestation"; log friction; fix at least one finding.
- `ponytail-review` before each commit; `verification-before-completion` at the end.

## 18. Delegation

| Work | Tool | Command shape |
|---|---|---|
| `locales/ar.js` — MSA translation of `fr.js` | Gemini CLI | `gemini -p "Translate the string values of this JS object to Modern Standard Arabic. Keep keys, structure and placeholders unchanged. Output only the JS." < locales/fr.js` |
| Arabic dialogue / module content | Gemini CLI | same pattern on the `fr` block of `fixtures.js` |
| Draft token / utility CSS from §10 | Codex | `codex exec "Generate styles/tokens.css from this spec section …"` |
| Everything touching `app.js`, `state.js`, `views/` | Claude | direct |

Delegated output is reviewed before commit; translations are spot-checked by
a native reader (ask a Dale team member).

## 19. Phased timeline (live day, demo 17:30)

| Phase | Min | Output |
|---|---|---|
| 0 Evidence: before | 20 | Playwright captures, commit |
| 1 Core refactor | 60 | modules, delegated events, state v2, CSP font-src, tests green |
| 2 Design system | 45 | fonts, tokens, type scale, RTL logical properties |
| 3 Simulation staging | 60 | persona header, typing, feedback bar, audio + fallback |
| 4 Onboarding + i18n | 45 | language step, name, locales (Gemini runs in parallel during 2) |
| 5 Modules retry, resume, certificate | 40 | |
| 6 Manager view | 30 | |
| 7 Evidence: after + user test + README | 45 | rubric deliverables |
| Buffer | 60+ | |

## 20. Assumptions and open questions

- ElevenLabs key and subscription are available today (confirmed).
- Judges accept the "non accréditée" wording (synthetic-content requirement).
- MSA is reviewed by a native reader before the demo; otherwise flagged in README.
- Open: exact ElevenLabs voice ids for FR and AR (choose in phase 3).

## 21. References

- Uxcel — Completing a lesson: https://mobbin.com/flows/0faf91f9-2b61-4c3f-8e0f-3ddf43b60944
- Uxcel — Level test / certificate: https://mobbin.com/flows/09fcabd8-520e-4853-9423-23e5d3ba15b1
- Uxcel — Course page: https://mobbin.com/screens/6c41db0e-279f-4772-a96a-30662a01ae9e
- Delphi — Persona chat header: https://mobbin.com/screens/ae3ceace-500f-426b-89ee-0a0c1535d6c9
- SchoolAI — Session insights (manager inspiration only): https://mobbin.com/flows/863ae584-f5bd-4bed-840f-ae8073e4a05f
