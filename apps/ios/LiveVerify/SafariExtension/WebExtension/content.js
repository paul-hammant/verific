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
 * Content script for the iOS Safari Web Extension.
 *
 * Its only job is to hand the popup the text the user selected. iOS Safari has no
 * contextMenus API, so there is no "Verify this claim" right-click item to hang the flow
 * off - the gesture is select-then-open-the-extension, and the popup asks for the
 * selection when it opens.
 *
 * Opening the extension popup can clear the visible selection, so the last non-empty
 * selection is remembered as the user makes it.
 */

const api = globalThis.browser ?? globalThis.chrome;

let lastSelection = '';

function currentSelection() {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
}

function rememberSelection() {
    const text = currentSelection();
    if (text.trim().length > 0) {
        lastSelection = text;
    }
}

document.addEventListener('selectionchange', rememberSelection);
document.addEventListener('mouseup', rememberSelection);
document.addEventListener('touchend', rememberSelection);

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'getSelection') {
        return false;
    }

    // Prefer a live selection; fall back to the last one seen, since opening the
    // popup can collapse it
    const live = currentSelection();
    sendResponse({
        selection: live.trim().length > 0 ? live : lastSelection,
        pageUrl: window.location.href
    });
    return true;
});
