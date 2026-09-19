import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, pageHead, feedbackBar } from "./shared.js";

export function render(state, ui) {
  const scenario = content(getLang()).scenario;
  const dialogue = content(getLang()).dialogue;
  const completed = state.dialogueAnswers.length;
  const feedbackTurn = ui.feedbackTurn;
  const done = completed >= dialogue.length;
  const currentIndex = Math.min(completed, dialogue.length - 1);
  const current = dialogue[currentIndex];
  const feedback = feedbackTurn === null || feedbackTurn === undefined ? null : dialogue[feedbackTurn];
  const feedbackChoice = feedback ? state.dialogueAnswers[feedbackTurn] : null;
  const messages = [];
  dialogue.forEach((turn, index) => {
    if (index < completed) {
      messages.push(`<div class="message"><small>${escapeHTML(scenario.customer)}</small>${escapeHTML(turn.text)}</div>`);
      messages.push(`<div class="message user"><small>${escapeHTML(t("sim.you"))}</small>${escapeHTML(turn.choices[state.dialogueAnswers[index]])}</div>`);
    }
  });
  if (!done && !feedback) messages.push(`<div class="message"><small>${escapeHTML(scenario.customer)}</small>${escapeHTML(current.text)}</div>`);
  const feedbackMarkup = feedback ? feedbackBar({
    kind: feedbackChoice === feedback.best ? "success" : "attention",
    why: feedback.feedback,
    recommended: feedbackChoice === feedback.best ? "" : t("feedback.recommended", { answer: feedback.choices[feedback.best] }),
    actionLabel: feedbackTurn === dialogue.length - 1 ? t("sim.seeResult") : t("sim.continue"),
    action: feedbackTurn === dialogue.length - 1 ? "see-result" : "continue-dialogue",
  }) : "";
  const choiceMarkup = done || feedback ? "" : `<p class="small"><strong>${escapeHTML(t("sim.prompt"))}</strong></p><div class="choice-list">${current.choices.map((choice, index) => `<button class="choice" type="button" data-action="choose" data-index="${escapeHTML(index)}"><span class="choice-num" aria-hidden="true">${escapeHTML(index + 1)}</span>${escapeHTML(choice)}</button>`).join("")}</div>`;
  return `<section class="page-shell" aria-labelledby="view-title">
    ${pageHead(t("step.of", { n: 2, total: 3 }), t("sim.title"))}
    <div class="simulation-shell">
      <aside class="scenario-panel"><div class="scenario-person" aria-hidden="true">${escapeHTML(scenario.initials)}</div><h2>${escapeHTML(scenario.customer)}</h2><div class="scenario-block"><strong>${escapeHTML(t("sim.context"))}</strong><p class="small subtle">${escapeHTML(scenario.context)}</p></div><div class="scenario-block"><strong>${escapeHTML(t("sim.goal"))}</strong><p class="small subtle">${escapeHTML(scenario.goal)}</p></div><div class="scenario-block"><span class="tag">${escapeHTML(t("sim.fictional"))}</span></div></aside>
      <div class="conversation"><header class="conversation-header"><h2>${escapeHTML(t("sim.dialogue"))}</h2><span class="small subtle">${escapeHTML(t("sim.step", { n: Math.min(completed + 1, dialogue.length), total: dialogue.length }))}</span></header><div class="messages" data-messages>${messages.join("")}${done && !feedback ? `<p class="small subtle">${escapeHTML(t("sim.doneTitle"))}</p>` : ""}</div><div class="choice-panel">${choiceMarkup}${feedbackMarkup}${done && !feedback ? `<div class="button-row">${routeLink("result", t("sim.seeResult"))}<button class="button button-secondary" type="button" data-action="restart-dialogue">${escapeHTML(t("sim.restart"))}</button></div>` : ""}</div></div>
    </div>
  </section>`;
}
