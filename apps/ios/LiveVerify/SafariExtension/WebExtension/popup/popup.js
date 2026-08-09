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

/**
 * Popup for the iOS Safari Web Extension.
 *
 * This is the whole flow, because iOS Safari gives us no contextMenus API to hang a
 * "Verify this claim" item off and no notifications API to report through: the user
 * selects text, opens the extension, and the answer appears here.
 *
 * The pipeline itself is NOT reimplemented - normalization, hashing, URL extraction and
 * the authority-chain walk all come from shared/, which scripts/sync-shared.js generates
 * from the canonical public/ sources. That is what keeps this byte-identical to the
 * Chrome/Edge/Firefox extension, the web app and the native apps.
 */

import '../shared/psl.js';
import { normalizeText, sha256 } from '../shared/normalize.js';
import {
    extractVerificationUrl,
    extractCertText,
    findStrandedText,
    buildVerificationUrl,
    buildMetaUrl,
    fetchVerificationMeta,
    verifyHash,
    checkAuthorization
} from '../shared/verify.js';
import { extractDomainAuthority } from '../shared/domain-authority.js';

const api = globalThis.browser ?? globalThis.chrome;

const content = document.getElementById('content');

document.addEventListener('DOMContentLoaded', run);

async function run() {
    const selection = await readSelection();

    if (!selection || selection.trim().length === 0) {
        renderHint(
            'Nothing selected',
            'Select the claim on the page — including its <strong>verify:</strong> or ' +
            '<strong>vfy:</strong> line — then open Live Verify again.'
        );
        return;
    }

    await verifySelection(selection);
}

/**
 * Ask the content script what the user selected.
 * @returns {Promise<string>} The selected text, or '' when the page cannot be reached
 */
async function readSelection() {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab) return '';

    const response = await api.tabs.sendMessage(tab.id, { type: 'getSelection' });
    return response?.selection ?? '';
}

async function verifySelection(selectedText) {
    setStatus('Verifying…');

    const { url: baseUrl, urlLineIndex } = extractVerificationUrl(selectedText);

    if (!baseUrl) {
        renderHint(
            'No verify: line in the selection',
            'A verifiable claim carries a <strong>verify:</strong> or <strong>vfy:</strong> ' +
            'line naming the issuer. Include that line in the selection.'
        );
        return;
    }

    // Content stranded on or after the verify: line would be silently dropped from the
    // hash, so we would ask the issuer about a claim shorter than the one on screen and
    // report their "not found" as their verdict. Say so instead of hashing.
    const stranded = findStrandedText(selectedText, urlLineIndex);
    if (stranded) {
        renderStranded(stranded);
        return;
    }

    const certText = extractCertText(selectedText, urlLineIndex);
    if (!certText.trim()) {
        renderHint(
            'No claim text before the verify: line',
            'The selection contains the verify: line but nothing above it to hash.'
        );
        return;
    }

    const meta = await fetchVerificationMeta(baseUrl);
    const normalizedText = normalizeText(certText, meta);
    const hash = await sha256(normalizedText);
    const verificationUrl = buildVerificationUrl(baseUrl, hash, meta);
    const verifyResult = await verifyHash(verificationUrl, meta);

    let authorization = null;
    if (meta && meta.authorizedBy) {
        authorization = await checkAuthorization(meta, buildMetaUrl(baseUrl), verificationUrl);
    }

    renderResult({
        verifyResult,
        registrableDomain: extractDomainAuthority(verificationUrl),
        issuerDescription: meta?.description ?? null,
        certText,
        hash,
        authorization
    });
}

// MARK: - Rendering

function setStatus(text) {
    content.replaceChildren(el('p', { class: 'status-line' }, text));
}

function renderHint(title, htmlBody) {
    const hint = el('p', { class: 'hint' });
    hint.innerHTML = htmlBody;
    content.replaceChildren(
        el('div', { class: 'verdict warning' }, el('div', { class: 'verdict-title' }, title)),
        hint
    );
}

function renderStranded(stranded) {
    const hint = el('p', { class: 'hint' });
    hint.innerHTML =
        'Text was selected on or after the <strong>verify:</strong> line. Nothing was ' +
        'hashed and the issuer was not contacted — hashing it would have left this ' +
        'text out of the claim. Re-select so the verify: line is last.';

    content.replaceChildren(
        el('div', { class: 'verdict warning' },
            el('div', { class: 'verdict-title' }, 'Text found after the verify line'),
            el('div', { class: 'verdict-detail' }, 'Not verified')),
        hint,
        section('Text after the verify line', el('div', { class: 'claim' }, stranded))
    );
}

function renderResult({ verifyResult, registrableDomain, issuerDescription, certText, hash, authorization }) {
    const affirming = verifyResult.success;
    const domain = registrableDomain || verifyResult.domain;

    const verdict = el('div', { class: `verdict ${affirming ? 'affirming' : 'denying'}` },
        el('div', { class: 'verdict-title' },
            affirming ? 'Verified' : 'Not verified'),
        el('div', { class: 'verdict-detail' },
            affirming ? '' : verifyResult.status));

    const by = el('p', { class: 'hint' });
    by.innerHTML = `${affirming ? 'Confirmed' : 'Answered'} by <span class="domain"></span>`;
    by.querySelector('.domain').textContent = domain;

    const parts = [verdict, by];

    if (issuerDescription) {
        parts.push(el('p', { class: 'hint' }, issuerDescription));
    }

    if (authorization?.checked) {
        parts.push(section('Authority chain', chainView(domain, authorization)));
    }

    parts.push(section('Claim that was hashed', el('div', { class: 'claim' }, certText)));
    parts.push(section('SHA-256', el('div', { class: 'hash' }, hash)));

    content.replaceChildren(...parts);
}

function chainView(domain, authorization) {
    const chain = el('div', { class: 'chain' });
    chain.appendChild(el('span', { class: 'chain-entry' }, `✓ ${domain}`));

    (authorization.chain ?? []).forEach((entry, index) => {
        const indent = '  '.repeat(index + 1);
        const mark = entry.confirmed ? '✓' : '✗';
        const suffix = entry.confirmed
            ? (entry.description ? ` — ${entry.description}` : '')
            : ' — NOT CONFIRMED';
        chain.appendChild(el('span', {
            class: `chain-entry${entry.confirmed ? '' : ' unconfirmed'}`
        }, `${indent}${mark} ${entry.authorizer}${suffix}`));
    });

    return chain;
}

function section(label, body) {
    return el('div', { class: 'section' },
        el('div', { class: 'section-label' }, label),
        body);
}

/** Minimal element builder - text goes in as text, never as markup */
function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs ?? {}).forEach(([key, value]) => node.setAttribute(key, value));
    children.forEach(child => {
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
}
