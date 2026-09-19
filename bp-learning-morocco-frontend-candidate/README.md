# BP Learning: pharmacy communication training for Morocco (track A3)

A guided 15-minute training for pharmacy staff in Casablanca. The learner practises a short conversation with a customer, gets clear feedback on every answer, checks what they learned, and prints an attestation. It runs in French and in Modern Standard Arabic, right-to-left. Everything stays in the browser.

All people and dialogue are synthetic. The exercise trains communication habits and gives no health advice. A precise health question in the scenario is routed to a pharmacist.

## Problem

**Learner.** A pharmacy employee in Casablanca, 30 to 50 years old, not technical, doing this training to keep their licence. They are busy and a little reluctant.

**Task.** Finish one training in a single sitting, understand every piece of feedback, and come back tomorrow without losing progress.

**Pain in the delivered app** (captures in [docs/evidence/before](../docs/evidence/before/)):

- A checkbox gate blocked the simulation button until three boxes were ticked.
- Feedback was a toast that vanished after 2.6 seconds and covered the answers on a phone.
- A wrong quiz answer locked the card in red with no explanation and no retry.
- The header links collected one extra click handler on every render.
- No name, no language choice, no Arabic, no voice, no attestation, no manager view.
- A purple palette and small type that read as a generic dashboard, not healthcare.

## References and the pattern chosen

- Uxcel, completing a lesson: https://mobbin.com/flows/0faf91f9-2b61-4c3f-8e0f-3ddf43b60944
- Uxcel, level test and certificate: https://mobbin.com/flows/09fcabd8-520e-4853-9423-23e5d3ba15b1
- Uxcel, course page: https://mobbin.com/screens/6c41db0e-279f-4772-a96a-30662a01ae9e
- Delphi, persona chat header: https://mobbin.com/screens/ae3ceace-500f-426b-89ee-0a0c1535d6c9
- SchoolAI, session insights (manager view inspiration only): https://mobbin.com/flows/863ae584-f5bd-4bed-840f-ae8073e4a05f

**Pattern taken from Uxcel:** one focused column and a docked bottom feedback bar. After every answer a bar appears at the bottom, green for a good answer and amber (not red) for "not quite". It explains why, shows the recommended answer, and carries the single next action. It never disappears by itself and keyboard focus lands on its button.

**Pattern taken from Delphi:** a pinned persona header (avatar, name, "Écouter") above the chat, so the customer feels like a person.

Uxcel was chosen because it is the one reference where teaching and testing share a screen, and its structure maps one to one onto the routes here.

## Version 2: login, lesson player, fewer clicks

**Login (local profiles).** First visit: one question, "Comment vous appelez-vous ?". Type your first name and press Enter, and the customer starts talking. The language is detected from the browser and can be switched on the same screen. Return visit: "Qui s'entraîne aujourd'hui ?" shows one avatar per person on this device. One tap resumes the exact step. Several employees can share one pharmacy computer (up to 12 profiles). Switch person or restart from the avatar menu in the header.

This is a **local profile, not a secure account**. Anyone using the device can open any profile. A PIN was left out on purpose: it would add four keystrokes to every visit and protect nothing, because the browser storage can be read on the device. A real deployment would add pharmacy SSO or an SMS code, and a server.

**Lesson player.** The dialogue and the three questions run full-screen: a close button, a 6-segment progress track, one thing at a time. After each answer a bar docks to the bottom of the screen. It shows the customer's reaction in her own words, then why, then the recommended answer when needed. The preparation page is folded into the opening scene card. The result and plan pages are merged into a final "Bilan" that prints the attestation in one click.

| Journey | Before | After |
|---|---|---|
| First open → first customer line | 4 clicks + name | type name + Enter, 0 clicks |
| Return visit → exact step | 1 click, no identity | 1 tap on your avatar |
| First open → printed attestation | 19 | 14 |

References used for this version (Mobbin): profile picker, [Netflix](https://mobbin.com/screens/9b0cfc61-f627-4691-b3a8-b4ea35110aad) and [Disney+](https://mobbin.com/screens/03a1da42-606d-4186-8bdb-bb46b4cd72f3). Name step, [Bevel](https://mobbin.com/screens/f0217a83-5962-427f-96bd-385972f6c604). Feedback bar, [Duolingo](https://mobbin.com/screens/57d38f9d-5bee-42f9-96f8-85b05f3bf835). Roleplay recap, [Duolingo Max](https://mobbin.com/screens/35a6f682-bab6-4fc2-be70-b5fa58792795). Home, [Coursera "Continue learning"](https://mobbin.com/screens/93beef1d-a7ba-4f6c-9efb-4d13aee3eb76).

Gaps in version 2: the customer reactions in Arabic were drafted by an AI model and still need a native reader. The old view files (`start`, `prep`, `result`, `modules`, `plan`, `certificate`, `onboarding`) are still in `views/` but are no longer used.

## What changed (version 1)

Route path: `onboarding → start → prep → simulation → result → modules → plan → certificate`, plus `manager`.

- **First run.** Choose French or Arabic, then give a first name. The name is needed for the attestation and is asked once. The language can be switched from the header at any time.
- **Start.** A course page with one clear button that resumes the exact step, and a progress ring.
- **Preparation.** Three principles. The checkboxes are optional and never block the simulation.
- **Simulation.** Persona header, a short typing pause, the customer line, three numbered answers (keys 1, 2, 3), then the docked feedback bar. A voice reads each customer line.
- **Result.** Score ring and a recap that shows the recommended answer next to the learner's.
- **Modules.** Three questions, each with an explanation and a retry. Only the first attempt counts for the manager view.
- **Plan.** Progress, the attestation link, and a reset behind a confirmation dialog.
- **Attestation.** A printable page with the learner's name, date, and scores. It says "exercice de formation, non accréditée".
- **Manager.** One card built from the real local record, or an honest empty state. No invented colleagues.

Rejected on purpose: streaks, badges, leaderboards, and a live AI chat.

## Evidence for the brief

| Rubric item | Where |
|---|---|
| Problem statement | this file, "Problem" |
| Two or more references and the pattern | this file, "References" |
| Before and after captures | [docs/evidence/before](../docs/evidence/before/) and [docs/evidence/after](../docs/evidence/after/), 1280 and 390 wide |
| Working implementation of one bounded path | this app |
| Keyboard and mobile checks | [docs/evidence/keyboard-run.md](../docs/evidence/keyboard-run.md), and the 390 wide captures |
| Test with another person | [docs/evidence/user-test.md](../docs/evidence/user-test.md) |
| Assumptions and gaps | "Assumptions and remaining gaps" below |
| Source and setup | "Run it" below |

## Run it

The app uses ES modules, so it must be served over http. Opening `index.html` from disk will not work.

```sh
cd bp-learning-morocco-frontend-candidate
python -m http.server 8089
```

Open http://127.0.0.1:8089/. There is no install step, no account, no build, and no network call while the app runs.

Tests use only Node (version 24 or later):

```sh
npm test
```

### Voice files (build time only)

The customer lines are read aloud from pre-generated MP3 files in `audio/<language>/turn-<n>.mp3`. They are made once with ElevenLabs and shipped as static files. The key is read from an environment variable and is never stored in the repository.

```sh
ELEVENLABS_API_KEY=your-key node scripts/generate-audio.mjs fr
ELEVENLABS_API_KEY=your-key node scripts/generate-audio.mjs ar
```

Optional: `ELEVENLABS_VOICE_FR` and `ELEVENLABS_VOICE_AR` choose the voices. Existing files are skipped. If a file is missing the app uses the browser's own speech, and if the browser has no voice for that language it stays silent. It never blocks the lesson.

## Security and data

- Only a first name and progress are stored, in the browser's local storage under `bp-learning-v2`. Nothing leaves the device.
- Content Security Policy, exactly: `default-src 'self'; connect-src 'none'; font-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`. The only change from the delivered app is `font-src`, from `'none'` to `'self'`, so the fonts load from this folder.
- The learner's name is escaped everywhere it is shown. A test covers it, and typing `<img src=x onerror=alert(1)>` as a name renders as plain text.
- No secrets are in the repository. `.env` files are ignored by git.

## Assumptions and remaining gaps

Not done yet, and stated honestly:

- **Voice files.** The MP3 files have to be generated by the owner with their own ElevenLabs key (see above). Until then the browser voice or silence is used. The Arabic browser voice exists only if the device has an Arabic voice installed.
- **Arabic review.** The Arabic text was drafted by an AI model and read by the developer. A native reader has not checked it yet. It uses the generic masculine in instructions to the learner.
- **Test with another person.** The template is ready in `docs/evidence/user-test.md`. It has to be run and filled in.
- **Screen readers.** An automated accessibility scan (axe-core) reports no violations and the keyboard run passes, but the app has not been tried with NVDA, VoiceOver or TalkBack.
- **Printing.** The certificate print layout is verified with browser print emulation, not on a physical printer.

Assumptions:

- The customer's replies do not depend on the learner's choice. The dialogue is linear and the feedback bar carries the reaction. A branching script would double the writing in two languages for no gain in this brief.
- The "non accréditée" wording is acceptable for a synthetic training.
- One device holds one learner. The manager view shows that one record and is not a team dashboard.
- `FILE-MANIFEST.sha256` describes the originally delivered package (commit `f38c2a1`) and was not regenerated.
- There is no offline cache on purpose: no service worker was added.

## Files

```
index.html            shell and Content Security Policy
app.js                router, one delegated click handler, focus handling
state.js              saved state, validation, migration from the old version, derived scores
i18n.js               t(), language, direction, dates
fixtures.js           course, dialogue and questions in French and Arabic
locales/              interface strings, fr.js and ar.js
views/                one file per screen
audio.js              voice playback: mp3, then browser speech, then silence
scripts/              build-time voice generation
styles/tokens.css     fonts, colours, type scale
styles.css            layout, components, right-to-left, print
fonts/                IBM Plex Sans and IBM Plex Sans Arabic, self-hosted, SIL Open Font License
tests/                node --test
PROVENANCE.md         origin of the content
CHALLENGE.md          the brief
```

Design and plan: [spec](../docs/superpowers/specs/2026-09-19-bp-learning-redesign-design.md), [implementation plan](../docs/superpowers/plans/2026-09-19-bp-learning-redesign-plan.md).
