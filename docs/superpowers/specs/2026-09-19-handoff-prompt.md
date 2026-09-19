# Handoff prompt — paste into a fresh Claude Code session in plan mode

Working directory: `C:\Users\RACHI\Desktop\CLAUDE\bp-learning-morocco-frontend-candidate`
Recommended: plan with Opus 5 / Fable 5.1; execute phases with Sonnet 5.

---

```
You are the eagle on a live hackathon. Demo at 17:30 today. Produce the
highest-detail implementation plan for the design below, then stop and wait
for my approval before writing any code.

## Read first, in this order
1. docs/superpowers/specs/2026-09-19-bp-learning-redesign-design.md  (the approved design — authoritative)
2. bp-learning-morocco-frontend-candidate/CHALLENGE.md                  (the written rubric — this is what is graded)
3. bp-learning-morocco-frontend-candidate/app.js, fixtures.js, index.html, styles.css  (698 lines total, the app as delivered)
4. git log — baseline is commit f38c2a1

## What this is
BP Learning is a pharmacy training platform. The learner is a non-technical
pharmacy employee in Casablanca, 30–50, doing this only to keep their
license. The delivered app is a vibe-coded candidate: prep checklist → 3-turn
scripted customer dialogue → 3 quiz modules → progress page. It works but has
a listener-stacking bug, a checkbox gate that blocks starting, feedback that
vanishes in a 2.6 s toast, and no visual finish.

Task: track A3 of CHALLENGE.md — redesign the complete learner path, add a
first-run language step (Français / العربية, Modern Standard Arabic, RTL),
stage the simulation so it feels like a real person, add a printable
attestation and one honest manager screen, and deliver every rubric artifact.

## Locked decisions (do not reopen)
- Reference product: Uxcel — steal its structure and its bottom feedback bar.
  Persona header from Delphi. Links are in the spec §21.
- On-device only. No runtime network. CSP stays locked except font-src → 'self'.
- Voice: pre-generated ElevenLabs .mp3 shipped static (key in ELEVENLABS_API_KEY
  env var, never a file); browser speechSynthesis as fallback; silent as last resort.
- Languages: FR + AR (MSA). Chosen once on first run, switchable in the header.
  RTL via CSS logical properties. Darija stays inside dialogue content, never the UI.
- Visual: calm clinical green, warmer, larger type. Tokens in spec §10.
- Font: IBM Plex Sans + IBM Plex Sans Arabic, self-hosted .woff2 in fonts/.
  Fallback: system-ui, "Segoe UI", Tahoma, sans-serif.
- Stack: vanilla JS, ES modules, no bundler, no framework. Module layout in spec §13.
- Scope: full learner path + thin manager view + attestation. No invented team data.
- Rejected on purpose: streaks, badges, leaderboards, live LLM chat.

## Delegation (targeted, not blanket)
- Gemini CLI (`gemini -p "..." < file`) for: locales/ar.js translation of
  locales/fr.js; Arabic dialogue and module content in fixtures.js.
- Codex (`codex exec "..."`) for: drafting styles/tokens.css from spec §10.
- Claude directly for: everything touching app.js, state.js, views/, audio.js,
  and all bug fixes. These need whole-codebase awareness.
- Review every delegated file before it is committed. Translations get a
  native-reader spot check (ask the Dale team).
Using DeepSeek/Gemini to write code is allowed — it sends source, not a
pharmacist's personal data. The briefing's constraint is about user data at
runtime, which never leaves the browser in this design.

## Skills and tools to use
- superpowers:writing-plans — to produce the plan itself (this prompt's output).
- superpowers:executing-plans — during execution, one phase per step.
- ecc:frontend-design-direction or impeccable — before touching styles.css.
- ui-ux-pro-max — validate palette contrast and the font pairing once.
- clarify — pass over every user-facing string (FR and AR) for plain language.
- ecc:accessibility / a11y-architect — keyboard and screen-reader pass.
- Playwright MCP — before/after captures, keyboard-only run, 390px + 1280px shots.
- ponytail:ponytail-review before every commit; superpowers:verification-before-completion at the end.
- Mobbin MCP only if a specific screen needs a second look; references are already chosen.

## Security requirements
- No secrets in the repo. .gitignore already covers .env*. Rotate the DeepSeek
  key that was in .env (owner's action).
- escapeHTML at every render site for the learner name; grep-audit before commit.
- CSP exactly as in spec §14. Nothing else is allowed to change in it.
- Manager view shows only real local data. Empty state when nothing is complete.

## Plan output format (what I expect from you now)
- Phases 0–7 with the minute budgets from spec §19, each phase = one
  executable step I can approve and run separately.
- For each phase: files created/changed, exact commands (including the
  gemini/codex invocations and the ElevenLabs generation script), the
  acceptance check, and the commit message.
- Phase 0 must capture BEFORE screenshots of every route with Playwright at
  1280px and 390px into docs/evidence/before/ and commit them before any code changes.
- Phase 7 must produce: docs/evidence/after/, docs/evidence/keyboard-run.md,
  docs/evidence/user-test.md (template with fields to fill after testing with
  a real person), and a README covering Problem, References, Run it, Assumptions.
- Call out any place where the spec is ambiguous or where you disagree, with a
  recommendation. Do not silently deviate.
- List what you will NOT do.

## Acceptance criteria for the whole day
- Every route reachable, every button does something, nothing breaks in a
  full click-through at 1280px and 390px.
- Keyboard-only completion of the entire path works (1/2/3, Enter, Tab).
- Language switch FR ↔ AR flips dir, labels, and content with no layout break.
- Feedback bar is persistent, explained, focus lands on its button.
- Audio plays for each customer turn; unplugging audio files does not break anything.
- node --test tests/ is green.
- Attestation prints cleanly with the learner's name.
- All rubric artifacts exist and are linked from README.

## Do not
- Add a framework, a bundler, a backend, or any runtime network call.
- Invent employees, scores, or history for the manager view.
- Add streaks, badges, or leaderboards.
- Change the CSP beyond font-src.
- Start implementing before I approve the plan.
```
