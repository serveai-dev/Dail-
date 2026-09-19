import { t, getLang } from "../i18n.js";
import { content, isCustomCourse } from "../fixtures.js";
import { stepsDone } from "../state.js";
import { escapeHTML, icon, avatar, feedbackBar, track, verdictTag } from "./shared.js";

export function render(state, ui) {
  const profile = state.profiles[state.activeId];
  const C = content(getLang());
  const D = C.dialogue;
  const index = profile.dialogueAnswers.length;
  const feedbackIndex = ui.feedbackTurn;
  const done = index >= D.length;
  const showChoices = !done && feedbackIndex === null && !ui.typing && ui.revealedTurn >= index;
  const current = Math.min(stepsDone(profile), 3);
  const messages = [scene(C)];

  D.forEach((turn, turnIndex) => {
    const revealed = turnIndex < index || (turnIndex === index && ui.revealedTurn >= index) || done;
    if (!revealed) return;
    messages.push(customerMessage(C, turn));
    if (profile.dialogueAnswers[turnIndex] !== undefined) {
      const chosen = profile.dialogueAnswers[turnIndex];
      messages.push(learnerMessage(turn.choices[chosen], chosen === turn.best));
    }
  });
  if (ui.typing) messages.push(`<div class="message-row customer typing-row"><span class="avatar avatar-small" aria-hidden="true"></span><div class="message typing" aria-hidden="true"><i></i><i></i><i></i></div></div>`);

  const audioTurn = feedbackIndex ?? (!done && ui.revealedTurn >= index ? index : null);
  const audioElement = isCustomCourse() ? `<audio preload="none" data-audio></audio>` : `<audio preload="none" data-audio src="audio/${escapeHTML(getLang())}/turn-${escapeHTML(audioTurn + 1)}.mp3"></audio>`;
  const listen = audioTurn === null ? "" : `<button class="listen" type="button" data-action="listen" data-turn="${escapeHTML(audioTurn)}" aria-label="${escapeHTML(t("sim.listen"))}">${icon("speaker")}<span>${escapeHTML(t("sim.listen"))}</span></button>${audioElement}`;
  const turn = feedbackIndex === null ? null : D[feedbackIndex];
  const feedback = turn ? feedbackBar({
    kind: profile.dialogueAnswers[feedbackIndex] === turn.best ? "success" : "attention",
    why: turn.feedback,
    recommended: profile.dialogueAnswers[feedbackIndex] === turn.best ? "" : t("feedback.recommended", { answer: turn.choices[turn.best] }),
    reaction: turn.reactions[profile.dialogueAnswers[feedbackIndex] === turn.best ? "good" : "almost"],
    reactionAvatar: C.scenario.initials,
    actionLabel: feedbackIndex === D.length - 1 ? t("sim.toChecks") : t("sim.continue"),
    action: feedbackIndex === D.length - 1 ? "to-checks" : "continue-dialogue",
  }) : "";

  const choices = showChoices ? `<div class="choice-panel"><p class="choice-prompt"><strong>${escapeHTML(t("sim.prompt"))}</strong><kbd>${escapeHTML(t("sim.keys"))}</kbd></p><div class="choice-list">${D[index].choices.map((choice, choiceIndex) => `<button class="choice" type="button" data-action="choose" data-index="${escapeHTML(choiceIndex)}"><span class="choice-num" aria-hidden="true">${escapeHTML(choiceIndex + 1)}</span><span>${escapeHTML(choice)}</span></button>`).join("")}</div></div>` : "";
  return `<section class="player ${feedback ? "has-bar" : ""}" aria-labelledby="view-title">
    <div class="player-top"><a class="player-close" href="#home" aria-label="${escapeHTML(t("player.close"))}">${icon("close")}<span>${escapeHTML(t("player.closeShort"))}</span></a>${track(stepsDone(profile), current)}<div class="player-listen">${listen}</div></div>
    <div class="player-body">
      <h1 class="visually-hidden" id="view-title" tabindex="-1">${escapeHTML(t("sim.title"))}</h1>
      <div class="thread" data-thread role="log" tabindex="0" aria-label="${escapeHTML(t("sim.dialogue"))}">${messages.join("")}</div>
      ${choices}
    </div>
    ${feedback}
  </section>`;
}

function scene(C) {
  return `<article class="scene"><span class="scene-label">${escapeHTML(t("sim.scene"))}</span><p>${escapeHTML(C.scenario.context)}</p><strong>${escapeHTML(t("sim.goal"))}</strong><div class="goal-chips">${C.preparation.map((item) => `<span class="goal-chip">${escapeHTML(item.title)}</span>`).join("")}</div></article>`;
}

function customerMessage(C, turn) {
  return `<div class="message-row customer"><span class="avatar avatar-small" aria-hidden="true">${escapeHTML(C.scenario.initials)}</span><div class="message"><small>${escapeHTML(C.scenario.customer)}</small><span>${escapeHTML(turn.text)}</span></div></div>`;
}

function learnerMessage(text, best) {
  return `<div class="message-row learner"><div class="message user"><small>${escapeHTML(t("sim.you"))}</small><span>${escapeHTML(text)}</span>${verdictTag(best)}</div></div>`;
}
