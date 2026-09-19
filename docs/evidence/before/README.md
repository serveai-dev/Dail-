# Before — delivered app at commit f38c2a1

Captured 2026-09-19 with Playwright at 1280×900 and 390×844, fresh localStorage.
Filenames end `-1280` or `-390`.

Pain points visible here:

1. `before-prep-gated-*` — "Démarrer la simulation" is disabled until three boxes are ticked. A reluctant learner is blocked at the door.
2. `before-sim-toast-*` vs `before-sim-toast-gone-*` — the only feedback is a 2.6 s toast. At 390px it covers the answer choices, then disappears.
3. `before-module-wrong-*` — a wrong answer locks the module in red with no explanation and no retry.
4. Not visible in a screenshot: `app.js:181` re-binds click handlers on the header links on every render (listener stacking). Fixed in Phase 1 by one delegated listener.
5. No name, no language choice, no Arabic, no voice, no attestation, no manager view. Purple palette and small type read as generic SaaS, not healthcare.
