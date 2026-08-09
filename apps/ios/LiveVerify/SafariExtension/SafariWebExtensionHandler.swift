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

import SafariServices

/// Native counterpart of the Safari Web Extension.
///
/// Deliberately does nothing: the whole verification flow lives in the extension's
/// JavaScript, which runs the same synced `shared/` modules as every other client, so
/// hashing and normalization stay byte-identical. Routing any of it through native code
/// here would fork the logic - the one thing TODO.md says not to do.
///
/// Safari requires this handler to exist for `browser.runtime.sendNativeMessage`. Nothing
/// in the extension sends native messages today, so it just returns an empty reply.
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        let response = NSExtensionItem()
        response.userInfo = [SFExtensionMessageKey: [:]]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
