import { t, getLang } from "../i18n.js";
import { content } from "../fixtures.js";
import { escapeHTML, routeLink, feedbackBar } from "./shared.js";

export function render(state, ui) {
  const C = content(getLang());
  const D = C.dialogue;
  const lang = getLang();
  const k = state.dialogueAnswers.length;
  const done = k >= D.length;
  const fb = ui.feedbackTurn ?? null;
  const showChoices = !done && fb === null && !ui.typing && ui.revealedTurn >= k;
  const audioTurn = fb ?? (ui.revealedTurn >= k && !done ? k : null);
  const messages = [];
  D.forEach((turn, index) => {
    const revealed = index < k || (index === k && ui.revealedTurn >= k) || done;
    if (!revealed) return;
    messages.push(`<div class="message"><small>${escapeHTML(C.scenario.customer)}</small>${escapeHTML(turn.text)}</div>`);
    if (state.dialogueAnswers[index] !== undefined) {
      messages.push(`<div class="message user"><small>${escapeHTML(t("sim.you"))}</small>${escapeHTML(turn.choices[state.dialogueAnswers[index]])}</div>`);
    }
  });
  if (ui.typing) messages.push(`<div class="message typing" aria-hidden="true"><i></i><i></i><i></i></div>`);
  let feedbackMarkup = "";
  if (fb !== null) {
    const turn = D[fb];
    const chosen = state.dialogueAnswers[fb];
    const last = fb === D.length - 1;
    feedbackMarkup = feedbackBar({
      kind: chosen === turn.best ? "success" : "attention",
      why: turn.feedback,
      recommended: chosen === turn.best ? "" : t("feedback.recommended", { answer: turn.choices[turn.best] }),
      actionLabel: t(last ? "sim.seeResult" : "sim.continue"),
      action: last ? "see-result" : "continue-dialogue",
    });
  }
  const listen = audioTurn === null ? "" : `<button class="button button-secondary listen" type="button" data-action="listen" data-turn="${escapeHTML(audioTurn)}">🔊 ${escapeHTML(t("sim.listen"))}</button><audio preload="none" data-audio src="audio/${escapeHTML(lang)}/turn-${escapeHTML(audioTurn + 1)}.mp3"></audio>`;
  const choices = showChoices ? `<div class="choice-panel"><p class="small"><strong>${escapeHTML(t("sim.prompt"))}</strong></p><div class="choice-list">${D[k].choices.map((choice, index) => `<button class="choice" type="button" data-action="choose" data-index="${escapeHTML(index)}"><span class="choice-num" aria-hidden="true">${escapeHTML(index + 1)}</span><span>${escapeHTML(choice)}</span></button>`).join("")}</div></div>` : "";
  return `<section class="page-shell" aria-labelledby="view-title">
    <p class="eyebrow">${escapeHTML(t("step.of", { n: 2, total: 3 }))}</p><h1 id="view-title" tabindex="-1">${escapeHTML(t("sim.title"))}</h1>
    <div class="simulation-shell">
      <details class="scenario-panel" ${ui.scenarioOpen ? "open" : ""}><summary data-action="toggle-scenario">${escapeHTML(t("sim.context"))}</summary><p>${escapeHTML(C.scenario.context)}</p><h2 class="h3">${escapeHTML(t("sim.goal"))}</h2><p>${escapeHTML(C.scenario.goal)}</p><span class="tag">${escapeHTML(t("sim.fictional"))}</span></details>
      <div class="conversation"><header class="persona"><span class="avatar" aria-hidden="true">${escapeHTML(C.scenario.initials)}</span><div><strong class="persona-name">${escapeHTML(C.scenario.customer)}</strong><small class="persona-step">${escapeHTML(t("sim.step", { n: Math.min(k + 1, D.length), total: D.length }))}</small></div>${listen}</header><div class="thread" data-thread role="log" tabindex="0" aria-label="${escapeHTML(t("sim.dialogue"))}">${messages.join("")}${done && fb === null ? `<p class="subtle">${escapeHTML(t("sim.doneTitle"))}</p>` : ""}</div>${choices}${feedbackMarkup}${done && fb === null ? `<div class="button-row">${routeLink("result", t("sim.seeResult"))}<button class="button button-secondary" type="button" data-action="restart-dialogue">${escapeHTML(t("sim.restart"))}</button></div>` : ""}</div>
    </div>
  </section>`;
}
