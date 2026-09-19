# BP Learning: Moroccan learner frontend

This frontend offers a French learning journey for a synthetic Casablanca pharmacy context. Learners practise asking for a language preference, explaining one step at a time, checking comprehension and recording progress.

## Run locally

From this directory:

```sh
python3 -m http.server 8089
```

Open `http://127.0.0.1:8089/`. No install, build, account, environment variable or API key is required.

## Learning journey

1. Open the overview and begin the training.
2. Complete the three preparation checks.
3. Work through a three-step conversation about language preference and comprehension.
4. Review the conversation result.
5. Complete three short learning checks.
6. Inspect the learning path, reload to continue later, or reset progress.

All learner, customer and dialogue details are synthetic. The exercise develops communication habits and does not provide health advice.

## Challenge tracks

- **A1: Repair a learner journey.** Find and fix one concrete usability problem, then test the revised path with another person.
- **A2: Add a useful interaction.** Help a multilingual learner practise, understand feedback, recover work or use the experience on mobile.
- **A3: Redesign a complete path.** Improve one end-to-end learning path for the Moroccan audience while retaining a clear learning goal.

See `CHALLENGE.md` for the expected evidence and deliverables.

## Files

- `index.html`: French document shell and routes.
- `styles.css`: responsive interface and print rules.
- `fixtures.js`: synthetic learner, customer, dialogue and quiz content.
- `app.js`: navigation, saved progress, checklist, conversation, quizzes and reset behavior.
- `PROVENANCE.md`: concise origin and content note.
- `CHALLENGE.md`: participant challenge brief.
- `FILE-MANIFEST.sha256`: hashes for the packaged files.
