import { t, getLang } from "../i18n.js";
import { listProfiles } from "../state.js";
import { escapeHTML, icon, routeLink } from "./shared.js";

function tint(id) {
  return `tint-${[...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 4}`;
}

export function render(state, ui) {
  const profiles = listProfiles(state);
  if (!profiles.length || ui.adding) return form(ui);
  return picker(profiles);
}

function art() {
  return `<figure class="welcome-art" aria-hidden="true"><img src="images/welcome-pharmacy.jpg" alt="" width="736" height="1095" decoding="async" /></figure>`;
}

function languageToggle() {
  return `<div class="language-segment" role="group" aria-label="${escapeHTML(t("nav.language"))}">
    <button type="button" data-action="set-lang" data-lang="fr" lang="fr" aria-pressed="${getLang() === "fr" ? "true" : "false"}">${escapeHTML(t("lang.fr"))}</button>
    <button type="button" data-action="set-lang" data-lang="ar" lang="ar" dir="rtl" aria-pressed="${getLang() === "ar" ? "true" : "false"}">${escapeHTML(t("lang.ar"))}</button>
  </div>`;
}

function form(ui) {
  return `<section class="welcome welcome-split page-shell" aria-labelledby="view-title">${art()}<div class="welcome-panel">
    ${languageToggle()}
    <div class="welcome-form-wrap">
      <h1 id="view-title" tabindex="-1">${escapeHTML(t("welcome.question"))}</h1>
      <form data-action="save-name" novalidate>
        <label class="visually-hidden" for="name">${escapeHTML(t("welcome.nameLabel"))}</label>
        <input class="name-input" id="name" name="name" type="text" maxlength="40" autocomplete="given-name" required value="${escapeHTML(ui.nameDraft ?? "")}" data-focus />
        <p class="small subtle">${escapeHTML(t("welcome.why"))}</p>
        <button class="button button-primary submit-name" type="submit" disabled>${escapeHTML(t("welcome.submit"))}${icon("arrow", "flip-rtl")}</button>
        <p class="small subtle">${escapeHTML(t("welcome.local"))}</p>
        <p class="small form-alert" role="alert" data-name-alert hidden>${escapeHTML(t("welcome.full"))}</p>
        ${ui.adding ? `<button class="button button-quiet cancel-add" type="button" data-action="cancel-add">${escapeHTML(t("welcome.cancel"))}</button>` : ""}
      </form>
    </div>
  </div></section>`;
}

function picker(profiles) {
  return `<section class="welcome welcome-split picker page-shell" aria-labelledby="view-title">${art()}<div class="welcome-panel">
    <div class="picker-heading"><h1 id="view-title" tabindex="-1">${escapeHTML(t("picker.title"))}</h1>${languageToggle()}</div>
    <div class="profile-grid">
      ${profiles.map((profile) => `<button class="profile-tile" type="button" data-action="pick-profile" data-id="${escapeHTML(profile.id)}"><span class="profile-initial ${tint(profile.id)}" translate="no">${escapeHTML(profile.name.slice(0, 1).toUpperCase())}</span><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(t("picker.meta", { done: profile.dialogueAnswers.length + Object.values(profile.modules).filter((module) => module.solved).length, total: 6 }))}</small></button>`).join("")}
      <button class="profile-tile profile-add" type="button" data-action="add-profile"><span class="profile-initial add-initial">+</span><strong>${escapeHTML(t("picker.add"))}</strong><small>${escapeHTML(t("picker.newMeta"))}</small></button>
    </div>
    <a class="button button-quiet quiet-link" href="#admin">${icon("lock")}<span>${escapeHTML(t("admin.door"))}</span></a>
  </div></section>`;
}
