# Keyboard-only run

Date: 2026-09-19. Browser: Chromium driven by Playwright, 1280×900, fresh storage.
Rule: key presses only, no pointer. Keys used: Tab, Enter, Space, 1, 2, 3, Escape, ArrowDown, ArrowUp.
Result: the whole path, from a new device to the printed attestation, completed with the keyboard alone. The saved state ended with the training complete and the first attempt on module 1 recorded as wrong.

| # | Step | Keys | Focus lands on |
|---|---|---|---|
| 1 | Onboarding loads | none | "Français" card |
| 2 | Choose French | Enter | name field |
| 3 | Type name, submit | letters, Enter | page heading of the start page |
| 4 | Reach "Commencer" | Tab ×1 | "Commencer" |
| 5 | Open preparation | Enter | heading "Avant de commencer" |
| 6 | Reach "Démarrer la simulation" | Tab ×5 | "Démarrer la simulation" |
| 7 | Start simulation | Enter | dialogue log while the customer "types" |
| 8 | Customer line appears | wait about 1 s | choice 1 |
| 9 | Turn 1 answer | 1 | feedback bar button "Continuer" |
| 10 | Continue | Enter | dialogue log during the typing pause |
| 11 | Turn 2 answer | 3 | feedback bar button "Continuer" (amber, shows the recommended answer) |
| 12 | Continue | Enter | dialogue log, then choice 1 |
| 13 | Turn 3 answer | 1 | "Voir le résultat" |
| 14 | See result | Enter | heading "Votre résultat" |
| 15 | Reach "Passer aux vérifications" | Tab ×1 | that link |
| 16 | Open modules | Enter | heading "Vérifications" |
| 17 | Reach a wrong answer in module 1 | Tab ×2 | that answer |
| 18 | Pick it | Space | "Réessayer" (amber bar with the explanation) |
| 19 | Retry | Enter | first answer of module 1 |
| 20 | Pick the right answer | Space | "Question suivante" |
| 21 | Next question, answer module 2 | Enter, Space | "Question suivante" |
| 22 | Next question, answer module 3 | Enter, Space | "Question suivante" |
| 23 | Last next question | Enter | heading "Mon parcours" |
| 24 | Reach "Effacer ma progression" | Tab ×4 | that button |
| 25 | Open the confirmation dialog | Enter | "Annuler" inside the dialog |
| 26 | Close it | Escape | back on "Effacer ma progression" |
| 27 | Reach "Voir l'attestation" | Tab ×1 | that link |
| 28 | Open the certificate | Enter | "Imprimer ou enregistrer en PDF" |
| 29 | Print | Enter | the print dialog opens (checked with a stub, called once) |
| 30 | Switch language | Tab to the select, ArrowDown | select keeps focus, page becomes Arabic and right-to-left |
| 31 | Switch back | ArrowUp | select keeps focus, page becomes French |

Digit keys 1, 2, 3 work only in the simulation. The three module cards use Tab and Space, because three cards with three answers each would make digits ambiguous.

## Problems found during the run, and fixed

1. After "Voir le résultat" and after the last "Question suivante", focus fell to the page body instead of the new heading. A stale focus selector hid the route-change rule. Fixed in `app.js`; both now land on the heading.
2. During the customer's typing pause, focus was dropped to the body. Focus now stays on the dialogue log, then moves to choice 1 when the line appears.
3. Changing language while a feedback bar was showing pulled focus to the bar's button. The header select now keeps focus.
4. On phones the feedback bar's button sat below the visible screen after answering. The bar is now scrolled into view and docks to the bottom edge.

## Screen reader notes

- The feedback bar is announced as a status message.
- The dialogue is a log region, so new customer lines are announced.
- The typing dots are hidden from assistive technology.
- Both progress bars have labels.
- Every page change moves focus to the page heading.
- An automated axe-core scan of 39 screens (every route, French, Arabic, 1280 and 390 wide) reports no violations after two fixes: the contrast of the "Vous" label and the focusability of the scrollable dialogue.

Not tested: a real screen reader (NVDA, VoiceOver, TalkBack). This is listed as a remaining gap in the README.
