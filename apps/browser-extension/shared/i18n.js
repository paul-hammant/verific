/*
    Copyright (C) 2026, Paul Hammant

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

// Runtime i18n for the extension UI.
//
// Two sources of truth, chosen by the user's Language setting:
//   - "auto" (default): the browser's own UI language, served by chrome.i18n.
//     This is the conventional behaviour — the store listing and manifest
//     strings already localize this way and cannot be overridden at runtime.
//   - a specific locale ("en" / "es"): the user forced a language in Settings,
//     so chrome.i18n (which follows the browser) is bypassed and that locale's
//     _locales/<lang>/messages.json is loaded directly.
//
// Fail-loudly: a lookup for a key that exists in no active catalog throws.
// Missing UI text is a build/translation bug we want surfaced, not hidden
// behind a silent English fallback.

// Locales that ship a full _locales/<lang>/messages.json catalog.
const SUPPORTED_LOCALES = ['en', 'es', 'de'];
const DEFAULT_LOCALE = 'en';

// In-memory catalog when a manual override is active. Null means "auto"
// (defer to chrome.i18n / the browser language).
let overrideCatalog = null;
let overrideLocale = null;

// Read the persisted language preference. Returns 'auto' | 'en' | 'es'.
async function getLanguagePreference() {
    const result = await chrome.storage.sync.get('settings');
    const lang = result.settings && result.settings.language;
    return lang || 'auto';
}

// Normalize a browser UI language tag (e.g. "es-419", "es-ES") to a supported
// base locale, or null if we don't ship a catalog for it.
function baseLocaleOf(uiLanguage) {
    const base = (uiLanguage || '').toLowerCase().split('-')[0];
    return SUPPORTED_LOCALES.includes(base) ? base : null;
}

// Load a specific locale catalog from the packaged _locales directory.
async function loadCatalog(locale) {
    const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`i18n: could not load catalog for locale "${locale}" (HTTP ${response.status})`);
    }
    return response.json();
}

// Call once before using t(). Resolves the active language and, when a manual
// override is set, loads that catalog into memory.
async function initI18n() {
    const pref = await getLanguagePreference();

    if (pref === 'auto') {
        overrideCatalog = null;
        overrideLocale = null;
        return;
    }

    if (!SUPPORTED_LOCALES.includes(pref)) {
        throw new Error(`i18n: unsupported language preference "${pref}"`);
    }

    overrideLocale = pref;
    overrideCatalog = await loadCatalog(pref);
}

// Substitute $1, $2, ... placeholders from a message template using the
// placeholder definitions in a manually-loaded catalog entry.
function applySubstitutions(entry, subs) {
    let message = entry.message;
    const placeholders = entry.placeholders || {};
    // Map each placeholder's $N content to the provided substitution.
    for (const name of Object.keys(placeholders)) {
        const content = placeholders[name].content; // e.g. "$1"
        const index = parseInt(content.replace('$', ''), 10) - 1;
        const value = subs[index] !== undefined ? subs[index] : '';
        // Replace $NAME$ (case-insensitive per Chrome i18n rules).
        message = message.replace(new RegExp(`\\$${name}\\$`, 'gi'), value);
    }
    return message;
}

// Translate a message key. `subs` is an array (or single value) of positional
// substitutions matching the catalog's $1/$2 placeholders.
function t(key, subs) {
    const substitutions = subs === undefined ? [] : (Array.isArray(subs) ? subs : [subs]);

    if (overrideCatalog) {
        const entry = overrideCatalog[key];
        if (!entry) {
            throw new Error(`i18n: missing key "${key}" in "${overrideLocale}" catalog`);
        }
        return applySubstitutions(entry, substitutions);
    }

    // Auto mode: chrome.i18n follows the browser UI language.
    const message = chrome.i18n.getMessage(key, substitutions.map(String));
    if (!message) {
        throw new Error(`i18n: missing key "${key}" in chrome.i18n catalog`);
    }
    return message;
}

// The active base locale ('en' | 'es'), for setting <html lang> etc.
function activeLocale() {
    if (overrideLocale) return overrideLocale;
    return baseLocaleOf(chrome.i18n.getUILanguage()) || DEFAULT_LOCALE;
}

// Localize any element carrying data-i18n / data-i18n-* attributes in a
// document. Called after initI18n() by the popup and settings pages.
function localizeDocument(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
}

export {
    SUPPORTED_LOCALES,
    initI18n,
    t,
    activeLocale,
    localizeDocument,
    getLanguagePreference
};
