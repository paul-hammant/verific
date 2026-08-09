/*
    Copyright (C) 2025, Paul Hammant

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

import { initI18n, t, activeLocale, localizeDocument } from '../shared/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Resolve language (browser default or user override) before any UI text.
    await initI18n();
    document.documentElement.lang = activeLocale();
    localizeDocument();

    const content = document.getElementById('content');
    const settingsLink = document.getElementById('settingsLink');
    const debugLink = document.getElementById('debugLink');

    // Open settings
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    // Show debug panel
    debugLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await showDebugPanel();
    });

    // Get verification history from background
    try {
        const history = await chrome.runtime.sendMessage({ type: 'getHistory' });

        if (!history || history.length === 0) {
            // Show default empty state
            return;
        }

        // Render verification history
        let html = '';

        for (const result of history) {
            html += renderResultCard(result);
        }

        // Add clear history link
        html += `
            <div class="clear-history">
                <a href="#" id="clearHistory">${t('popupClearHistory')}</a>
            </div>
        `;

        content.innerHTML = html;

        // Add event listeners for details toggles
        document.querySelectorAll('.details-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const details = toggle.nextElementSibling;
                const isVisible = details.classList.toggle('visible');
                toggle.innerHTML = isVisible ? `▼ ${t('popupHideDetails')}` : `▶ ${t('popupShowDetails')}`;
            });
        });

        // Add event listeners for copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const text = btn.dataset.text;
                await navigator.clipboard.writeText(text);
                const original = btn.textContent;
                btn.textContent = t('popupCopied');
                setTimeout(() => btn.textContent = original, 1500);
            });
        });

        // Add event listeners for show-me buttons
        document.querySelectorAll('.show-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const text = btn.dataset.text;
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    // Inject content script if needed, then send message
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: findAndHighlightOnPage,
                            args: [text]
                        });
                        window.close();
                    } catch (err) {
                        console.error('Show me error:', err);
                        btn.textContent = t('popupNotFound');
                        setTimeout(() => btn.textContent = t('popupShowMe'), 1500);
                    }
                }
            });
        });

        // Clear history handler
        document.getElementById('clearHistory')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await chrome.runtime.sendMessage({ type: 'clearHistory' });
            content.innerHTML = `
                <div class="no-results">
                    <h2>${t('popupNoResultsTitle')}</h2>
                    <p>${t('popupNoResultsBody')}</p>
                    <div class="shortcut">${t('popupShortcut')}</div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Failed to get history:', error);
        content.innerHTML = `
            <div class="no-results">
                <h2>${t('popupConnectionErrorTitle')}</h2>
                <p>${t('popupConnectionErrorBody')}</p>
                <div class="error-detail">${escapeHtml(error.message)}</div>
            </div>
        `;
    }
});

function renderResultCard(result) {
    const isVerified = result.success;
    const isError = result.error && !result.domain;

    // Determine badge type and text
    let badgeClass, badgeText;
    if (isVerified) {
        badgeClass = 'verified';
        badgeText = t('popupBadgeVerified');
    } else if (isError) {
        badgeClass = 'error';
        badgeText = t('popupBadgeError');
    } else {
        badgeClass = 'failed';
        badgeText = t('popupBadgeNotVerified');
    }

    // Format timestamp
    const time = result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '';
    const date = result.timestamp ? new Date(result.timestamp).toLocaleDateString() : '';

    // Status text with better error messages
    let statusText = '';
    if (result.error) {
        statusText = getReadableError(result.error);
    } else if (result.status) {
        statusText = result.success ? t('popupVerifiedByIssuer') : result.status;
    }

    // Build HTML
    let html = `
        <div class="result-card">
            <div class="result-header">
                <span class="status-badge ${badgeClass}">${badgeText}</span>
                ${result.domain ? `<span class="by-domain">by ${formatDomainEmphasis(result.domain, result.registrableDomain)}</span>` : ''}
                ${!isVerified && statusText ? `<span class="status-text ${isError ? 'error' : ''}">${escapeHtml(statusText)}</span>` : ''}
                <div class="result-timestamp">${time}<br>${date}</div>
            </div>
    `;

    // Show headshot from payload if available
    if (result.payload && result.payload.headshot) {
        html += `
            <div style="display: flex; gap: 15px; margin-bottom: 12px; align-items: center; background: #f0f7ff; padding: 10px; border-radius: 8px; border: 1px solid #d0e7ff;">
                <img src="${result.payload.headshot}" style="width: 60px; height: 75px; object-fit: cover; border-radius: 4px; border: 1px solid #accbee;">
                <div>
                    <div style="font-weight: 600; color: #002d62;">${t('popupVerificationResult')}</div>
                    <div style="font-size: 12px; color: #444;">${escapeHtml(result.payload.message || t('popupAuthenticated'))}</div>
                </div>
            </div>
        `;
    }

    // Show authorization status if available. Message text is localized; the
    // authorizer/issuer is wrapped in <strong> and passed as the substitution.
    if (result.success && !result.authorization) {
        html += `
            <div class="authorization-row authorization-self">
                ${t('popupSelfVerified')}
            </div>
        `;
    } else if (result.authorization && result.authorization.authorizer) {
        const a = result.authorization;
        const authorizerBold = `<strong>${escapeHtml(a.authorizer)}</strong>`;
        let authClass, authHtml;
        if (a.expired) {
            authClass = 'authorization-expired';
            authHtml = t('authByExpired', authorizerBold);
            if (a.successor) {
                authHtml += `. ${t('authSuccessor', escapeHtml(a.successor))}`;
            }
        } else if (a.confirmed) {
            authClass = 'authorization-confirmed';
            const desc = a.description ? ` (${escapeHtml(a.description)})` : '';
            authHtml = t('authByConfirmed', authorizerBold) + desc;
            // Show chain entries
            if (a.chain && a.chain.length > 1) {
                for (let i = 1; i < a.chain.length; i++) {
                    const c = a.chain[i];
                    const cDesc = c.description ? ` (${escapeHtml(c.description)})` : '';
                    authHtml += `<div class="authorization-chain-entry">${t('authChainEntry', `<strong>${escapeHtml(c.authorizer)}</strong>`)}${cDesc}</div>`;
                }
            }
        } else if (a.checked) {
            authClass = 'authorization-missing';
            authHtml = t('authByNotConfirmed', authorizerBold);
        } else {
            authClass = 'authorization-unavailable';
            const issuer = formatDomainEmphasis(result.domain, result.registrableDomain) || t('authIssuerFallback');
            authHtml = t('authClaimsMissing', [issuer, authorizerBold]);
        }
        html += `
            <div class="authorization-row ${authClass}">
                ${authHtml}
            </div>
        `;
    }

    // The issuer's own statement of the authority behind this. "Claimed", because with no
    // authorizedBy nobody has endorsed the wording - it is the issuer describing itself.
    if (result.authorityBasis) {
        html += `
            <div class="authority-basis">
                <span class="authority-basis-label">${t('popupAuthorityClaimed')}</span>
                ${escapeHtml(result.authorityBasis)}
            </div>
        `;
    }

    // Show claim text if available
    if (result.certText) {
        html += `
            <div class="claim-section">
                <div class="label">
                    ${t('popupClaimText')}
                    <span class="copy-btn" data-text="${escapeAttr(result.certText)}">${t('popupCopy')}</span>
                    <span class="show-btn" data-text="${escapeAttr(result.certText)}">${t('popupShowMe')}</span>
                </div>
                <div class="claim-text">${escapeHtml(result.certText)}</div>
            </div>
        `;
    }

    // Details toggle (for power users)
    if (result.hash || result.verificationUrl || result.normalizedText) {
        html += `
            <div class="details-toggle">▶ ${t('popupShowDetails')}</div>
            <div class="details-content">
        `;

        if (result.hash) {
            html += `
                <div class="detail-row">
                    <div class="label">${t('popupHashLabel')}</div>
                    <div class="value mono">${result.hash}</div>
                </div>
            `;
        }

        if (result.verificationUrl) {
            html += `
                <div class="detail-row">
                    <div class="label">${t('popupVerificationUrlLabel')}</div>
                    <div class="value mono">${escapeHtml(result.verificationUrl)}</div>
                </div>
            `;
        }

        if (result.normalizedText && result.normalizedText !== result.certText) {
            html += `
                <div class="detail-row">
                    <div class="label">${t('popupNormalizedTextLabel')}</div>
                    <div class="value mono" style="white-space: pre-wrap; max-height: 100px; overflow-y: auto;">${escapeHtml(result.normalizedText)}</div>
                </div>
            `;
        }

        if (result.elapsed) {
            html += `
                <div class="detail-row">
                    <div class="label">${t('popupVerificationTimeLabel')}</div>
                    <div class="value">${result.elapsed}ms</div>
                </div>
            `;
        }

        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function getReadableError(error) {
    if (error.includes('No verify:') || error.includes('No vfy:')) {
        return t('errNoVerifyUrl');
    }
    if (error.includes('No certification text')) {
        return t('errNoCertText');
    }
    if (error.includes('Network error') || error.includes('fetch')) {
        return t('errNetwork');
    }
    if (error.includes('CORS')) {
        return t('errCors');
    }
    return error;
}

function formatDomainEmphasis(domain, registrableDomain) {
    if (registrableDomain && domain.includes(registrableDomain)) {
        // Bold only the registrable domain portion within the full hostname
        const escaped = escapeHtml(domain);
        const regEscaped = escapeHtml(registrableDomain);
        return escaped.replace(
            regEscaped,
            `<strong>${regEscaped}</strong>`
        );
    }
    return `<strong>${escapeHtml(domain)}</strong>`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// This function is injected into the page to find and highlight text
function findAndHighlightOnPage(searchText) {
    if (!searchText) return false;

    // Use first line of text for more precise matching
    const firstLine = searchText.trim().split('\n')[0].trim();

    // Clear any existing selection
    window.getSelection().removeAllRanges();

    // Use browser's find to locate the text
    const found = window.find(firstLine, false, false, true, false, true, false);

    if (!found) return false;

    // Get the selection and its container
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let foundElement = range.commonAncestorContainer;

    // If it's a text node, get its parent
    if (foundElement.nodeType === Node.TEXT_NODE) {
        foundElement = foundElement.parentElement;
    }

    // Walk up to find a reasonable container
    while (foundElement.parentElement &&
           foundElement.parentElement !== document.body &&
           foundElement.offsetHeight < 50) {
        foundElement = foundElement.parentElement;
    }

    // Clear selection
    window.getSelection().removeAllRanges();

    // Scroll to element
    foundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add flash highlight
    const originalOutline = foundElement.style.outline;
    const originalOutlineOffset = foundElement.style.outlineOffset;
    const originalTransition = foundElement.style.transition;

    foundElement.style.transition = 'outline-color 0.3s ease-in-out';
    foundElement.style.outline = '3px solid #ef4444';
    foundElement.style.outlineOffset = '4px';

    // Flash animation
    let flashes = 0;
    const flashInterval = setInterval(() => {
        flashes++;
        if (flashes >= 6) {
            clearInterval(flashInterval);
            foundElement.style.outline = originalOutline;
            foundElement.style.outlineOffset = originalOutlineOffset;
            foundElement.style.transition = originalTransition;
            return;
        }
        foundElement.style.outlineColor = flashes % 2 === 0 ? '#ef4444' : 'transparent';
    }, 300);

    return true;
}

async function showDebugPanel() {
    const content = document.getElementById('content');

    let debugInfo = {
        extensionId: chrome.runtime.id,
        backgroundConnected: false,
        sessionStorageWorks: false,
        historyCount: 0,
        lastError: null
    };

    // Test background connection
    try {
        const history = await chrome.runtime.sendMessage({ type: 'getHistory' });
        debugInfo.backgroundConnected = true;
        debugInfo.historyCount = history ? history.length : 0;
    } catch (e) {
        debugInfo.lastError = e.message;
    }

    // Test session storage directly
    try {
        await chrome.storage.session.set({ _test: Date.now() });
        const result = await chrome.storage.session.get('_test');
        debugInfo.sessionStorageWorks = !!result._test;
        await chrome.storage.session.remove('_test');

        // Get raw session storage
        const rawStorage = await chrome.storage.session.get('verificationHistory');
        debugInfo.rawHistory = rawStorage.verificationHistory || [];
        debugInfo.rawHistoryCount = debugInfo.rawHistory.length;
    } catch (e) {
        debugInfo.sessionStorageError = e.message;
        debugInfo.rawHistory = [];
    }

    content.innerHTML = `
        <div class="debug-panel">
            <h3>Debug Information</h3>
            <div class="debug-item">
                <div class="debug-label">Extension ID</div>
                <div class="debug-value">${debugInfo.extensionId}</div>
            </div>
            <div class="debug-item">
                <div class="debug-label">Background Connection</div>
                <div class="debug-value ${debugInfo.backgroundConnected ? 'ok' : 'error'}">
                    ${debugInfo.backgroundConnected ? 'Connected' : 'Failed: ' + debugInfo.lastError}
                </div>
            </div>
            <div class="debug-item">
                <div class="debug-label">Session Storage</div>
                <div class="debug-value ${debugInfo.sessionStorageWorks ? 'ok' : 'error'}">
                    ${debugInfo.sessionStorageWorks ? 'Working' : 'Failed: ' + (debugInfo.sessionStorageError || 'Unknown')}
                </div>
            </div>
            <div class="debug-item">
                <div class="debug-label">History Count (via message)</div>
                <div class="debug-value">${debugInfo.historyCount}</div>
            </div>
            <div class="debug-item">
                <div class="debug-label">History Count (raw storage)</div>
                <div class="debug-value">${debugInfo.rawHistoryCount}</div>
            </div>
            ${debugInfo.rawHistory.length > 0 ? `
                <div class="debug-item" style="margin-top: 12px;">
                    <div class="debug-label">Stored Verifications</div>
                    ${debugInfo.rawHistory.map((item, i) => `
                        <div style="margin-top: 8px; padding: 8px; background: #fff; border-radius: 4px; border: 1px solid #e5e7eb;">
                            <div style="font-size: 10px; color: #6b7280;">#${i + 1} - ${item.success ? '✓ Verified' : '✗ Not Verified'} - ${item.domain || 'No domain'}</div>
                            ${item.error ? `<div style="color: #dc2626; font-size: 10px;">Error: ${escapeHtml(item.error)}</div>` : ''}
                            ${item.certText ? `
                                <div style="margin-top: 4px; font-size: 10px; color: #6b7280;">Claim text:</div>
                                <div style="font-size: 10px; white-space: pre-wrap; max-height: 80px; overflow-y: auto; background: #f9fafb; padding: 4px; border-radius: 2px;">${escapeHtml(item.certText)}</div>
                            ` : ''}
                            ${item.rawSelection ? `
                                <div style="margin-top: 4px; font-size: 10px; color: #6b7280;">Raw selection (urlLineIndex: ${item.urlLineIndex}):</div>
                                <div style="font-size: 10px; white-space: pre-wrap; max-height: 120px; overflow-y: auto; background: #fef3c7; padding: 4px; border-radius: 2px; border: 1px solid #fbbf24;">${escapeHtml(item.rawSelection)}</div>
                            ` : ''}
                            ${!item.certText && !item.rawSelection ? '<div style="font-size: 10px; color: #9ca3af;">No claim text captured</div>' : ''}
                            ${item.hash ? `<div style="margin-top: 4px; font-size: 9px; color: #9ca3af;">Hash: ${item.hash.substring(0, 16)}...</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="debug-item" style="margin-top: 16px;">
                <a href="#" id="backToResults" style="color: #3b82f6;">← Back to results</a>
            </div>
        </div>
    `;

    document.getElementById('backToResults').addEventListener('click', (e) => {
        e.preventDefault();
        location.reload();
    });
}
