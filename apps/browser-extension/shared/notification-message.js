/*
    Copyright (C) 2025-2026, Paul Hammant

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

// Default English strings, used when no translate function is supplied (e.g.
// Node/Jest tests exercising the pure message-shaping logic). When the caller
// passes a `t` function (from shared/i18n.js), all user-facing text is
// localized and these defaults are not used.
const EN = {
    notifVerified: 'Verified',
    notifNotVerified: 'Not Verified',
    notifVerifiedBy: 'Verified by $1',
    notifStatusDomain: '$1 ($2)',
    notifSelfVerified: 'Self-verified (no authority chain)',
    notifAuthExpired: 'Authorization by $1 — expired',
    authSuccessor: 'Successor: $1',
    notifAuthConfirmed: 'Authorized by $1',
    notifAuthNotConfirmed: 'Authorization by $1 — not confirmed',
    notifAuthMissing: 'Claims authorization by $1 — missing'
};

// Resolve a message: use the caller's translate function when given, otherwise
// interpolate the English default's $1/$2 positional markers.
function resolve(t, key, subs) {
    if (t) return t(key, subs);
    const args = subs === undefined ? [] : (Array.isArray(subs) ? subs : [subs]);
    return EN[key].replace(/\$(\d)/g, (_, n) => (args[Number(n) - 1] !== undefined ? args[Number(n) - 1] : ''));
}

/**
 * Build the plain-text authorization/authority-chain line for a result.
 * Shared by the OS notification and the injected in-page banner.
 *
 * @param {Object} result - Verification result object
 * @param {Function} [t] - Optional translate function (key, subs) => string
 * @returns {string} Plain-text auth line, or '' when there is nothing to show
 */
function buildAuthLine(result, t) {
    if (result.success && !result.authorization) {
        return resolve(t, 'notifSelfVerified');
    }
    if (result.authorization && result.authorization.authorizer) {
        const a = result.authorization;
        if (a.expired) {
            let line = resolve(t, 'notifAuthExpired', a.authorizer);
            if (a.successor) line += `. ${resolve(t, 'authSuccessor', a.successor)}`;
            return line;
        }
        if (a.confirmed) {
            let line = resolve(t, 'notifAuthConfirmed', a.authorizer);
            if (a.description) line += ` (${a.description})`;
            if (a.chain && a.chain.length > 1) {
                for (let i = 1; i < a.chain.length; i++) {
                    const c = a.chain[i];
                    line += ` ← ${c.authorizer}`;
                    if (c.description) line += ` (${c.description})`;
                }
            }
            return line;
        }
        if (a.checked) {
            return resolve(t, 'notifAuthNotConfirmed', a.authorizer);
        }
        return resolve(t, 'notifAuthMissing', a.authorizer);
    }
    return '';
}

/**
 * Build the plain-text message for an OS notification from a verification result.
 *
 * @param {Object} result - Verification result object
 * @param {Function} [t] - Optional translate function (key, subs) => string
 * @returns {{ title: string, message: string }}
 */
function buildNotificationMessage(result, t) {
    const title = result.success
        ? resolve(t, 'notifVerified')
        : resolve(t, 'notifNotVerified');

    let message;
    if (result.success) {
        message = resolve(t, 'notifVerifiedBy', result.domain);
    } else if (result.error) {
        message = result.error;
    } else {
        message = resolve(t, 'notifStatusDomain', [result.status, result.domain]);
    }

    const authDetail = buildAuthLine(result, t);
    if (authDetail) {
        message += `\n${authDetail}`;
    }

    return { title, message };
}

// ES module export (for browser extension import)
export { buildNotificationMessage, buildAuthLine };

// CommonJS export (for Node.js / Jest tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildNotificationMessage, buildAuthLine };
}
