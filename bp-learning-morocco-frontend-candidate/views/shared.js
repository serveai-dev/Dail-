import { t } from "../i18n.js";

export function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

export function icon(name, className = "") {
  const paths = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" />',
    check: '<path d="m5 12 4 4L19 6" />',
    speaker: '<path d="M4 10v4h4l5 4V6l-5 4H4Zm11.5-2.5a6 6 0 0 1 0 9M18 5a10 10 0 0 1 0 14" />',
    close: '<path d="m6 6 12 12M18 6 6 18" />',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />',
  };
  return `<svg class="${escapeHTML(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ""}</svg>`;
}

export function routeLink(route, label, kind = "button-primary", attrs = "") {
  return `<a class="button ${escapeHTML(kind)}" href="#${escapeHTML(route)}" ${attrs}>${escapeHTML(label)}</a>`;
}

export function verdictTag(best) {
  return `<span class="verdict-tag ${best ? "verdict-good" : "verdict-almost"}">${icon(best ? "check" : "close")}<span>${escapeHTML(t(best ? "feedback.goodShort" : "feedback.almostShort"))}</span></span>`;
}

export function avatar(initials, className = "avatar") {
  return `<span class="${escapeHTML(className)}" aria-hidden="true">${escapeHTML(initials)}</span>`;
}

export function track(steps, current) {
  return `<div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${escapeHTML(steps)}" aria-label="${escapeHTML(t("player.progress"))}">${Array.from({ length: 6 }, (_, index) => `<span class="seg ${index < steps ? "done" : ""} ${index === current ? "current" : ""}"></span>`).join("")}</div>`;
}

export function feedbackBar({ kind, why = "", recommended = "", actionLabel, action, actionAttrs = "", focus = true, reaction = "", reactionAvatar = "", checks = false }) {
  const good = kind === "success";
  return `<div class="feedback-bar feedback-${escapeHTML(kind)}" role="status" aria-live="polite" data-feedback-bar>
    <div class="feedback-inner">
      ${!checks ? `<div class="reaction-row">${avatar(reactionAvatar, "avatar avatar-small")}<em>« ${escapeHTML(reaction)} »</em></div>` : ""}
      <div class="feedback-row"><span class="feedback-icon">${icon(good ? "check" : "close")}</span><div class="feedback-text"><strong>${escapeHTML(t(good ? "feedback.good" : "feedback.almost"))}</strong>${why ? `<p>${escapeHTML(why)}</p>` : ""}</div></div>
      ${recommended ? `<p class="feedback-recommended">${escapeHTML(recommended)}</p>` : ""}
      <button class="button button-primary" type="button" data-action="${escapeHTML(action)}" ${actionAttrs}${focus ? " data-focus" : ""}>${escapeHTML(actionLabel)}</button>
    </div>
  </div>`;
}
