import { t } from "../i18n.js";
import { escapeHTML } from "./shared.js";

export function render(state, ui) {
  if (ui.onboardingStep === 0) return `<section class="page-shell onboarding lang-step" aria-labelledby="view-title">
    <h1 id="view-title" tabindex="-1"><span class="lang-line" lang="fr">Choisissez votre langue</span><span class="lang-line" lang="ar" dir="rtl">اختر لغتك</span></h1>
    <div class="lang-cards">
      <button class="lang-card" type="button" lang="fr" data-action="choose-lang" data-lang="fr" data-focus>Français</button>
      <button class="lang-card" type="button" lang="ar" dir="rtl" data-action="choose-lang" data-lang="ar">العربية</button>
    </div>
    <p class="small subtle lang-hint"><span class="lang-line" lang="fr">Vous pourrez changer de langue en haut de la page.</span><span class="lang-line" lang="ar" dir="rtl">يمكنك تغيير اللغة في أعلى الصفحة.</span></p></section>`;
  return `<section class="page-shell onboarding" aria-labelledby="view-title">
    <h1 id="view-title" tabindex="-1">${t("onboarding.nameTitle")}</h1>
    <form data-action="save-name" novalidate>
      <label for="name">${t("onboarding.nameLabel")}</label>
      <input id="name" name="name" type="text" required maxlength="40" autocomplete="given-name" value="${escapeHTML(state.profile.name)}" data-focus />
      <p class="small subtle">${t("onboarding.nameWhy")} ${t("app.savedLocally")}</p>
      <button class="button button-primary" type="submit">${t("onboarding.nameSubmit")}</button>
    </form></section>`;
}
