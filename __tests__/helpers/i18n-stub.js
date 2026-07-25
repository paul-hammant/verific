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

// Test stub for chrome.i18n backed by the real English _locales catalog, so
// content-script tests assert the actual shipped strings. Mirrors Chrome's
// getMessage(key, substitutions) placeholder substitution.
const fs = require('fs');
const path = require('path');

const CATALOG = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '..', '..', 'apps', 'browser-extension', '_locales', 'en', 'messages.json'),
        'utf8'
    )
);

function getMessage(key, substitutions) {
    const entry = CATALOG[key];
    if (!entry) return '';
    const subs = substitutions === undefined ? [] : (Array.isArray(substitutions) ? substitutions : [substitutions]);
    let message = entry.message;
    const placeholders = entry.placeholders || {};
    for (const name of Object.keys(placeholders)) {
        const index = parseInt(placeholders[name].content.replace('$', ''), 10) - 1;
        const value = subs[index] !== undefined ? subs[index] : '';
        message = message.replace(new RegExp(`\\$${name}\\$`, 'gi'), value);
    }
    return message;
}

function getUILanguage() {
    return 'en-US';
}

module.exports = { i18nStub: { getMessage, getUILanguage } };
