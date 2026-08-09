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

import SwiftUI

/// Tab selection for result display
enum ResultTab: String, CaseIterable {
    case captured = "Captured"
    case extracted = "Extracted"
    case normalized = "Normalized"
}

/// View displaying verification results with tabs
struct ResultView: View {
    let result: VerificationResult
    let capturedImage: UIImage?
    /// Why there is no captured image, when there isn't one
    var capturedImageError: String?
    let onReVerify: (String) -> Void
    let onVerifyAnother: () -> Void

    @State private var selectedTab: ResultTab = .captured
    @State private var editedText: String = ""
    @State private var showingFormalNames: Bool = false
    @State private var formalNamesToShow: String = ""

    var body: some View {
        VStack(spacing: 0) {
            // Verification status banner
            statusBanner
                .accessibilityIdentifier("result.verificationStatus")

            // Tab picker
            Picker("View", selection: $selectedTab) {
                ForEach(ResultTab.allCases, id: \.self) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            // Tab content
            TabView(selection: $selectedTab) {
                capturedTab
                    .tag(ResultTab.captured)

                extractedTab
                    .tag(ResultTab.extracted)

                normalizedTab
                    .tag(ResultTab.normalized)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            // Hash display
            if let hash = result.hash {
                hashSection(hash: hash)
            }

            // Action buttons
            actionButtons
        }
        .onAppear {
            // Nothing was normalized when the pipeline refused to hash; offer the recovered
            // content lines so the human can put them in order and Re-verify
            editedText = result.normalizedText ?? result.recoveryText ?? ""
        }
        .alert("Authority Chain", isPresented: $showingFormalNames) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(formalNamesToShow)
        }
    }

    // MARK: - Status Banner

    private var statusBanner: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: statusIcon)
                    .font(.title2)

                VStack(alignment: .leading) {
                    Text(statusTitle)
                        .font(.headline)

                    if let domain = statusDomain {
                        Text("by \(domain)")
                            .font(.caption)
                            .opacity(0.8)
                    }
                }

                Spacer()
            }

            // Authorization chain or self-verified indicator
            if let auth = result.authorization {
                authorizationView(auth)
            } else if let domain = statusDomain, isAffirming {
                noAuthorityView(domain: domain)
            }

            // The issuer's own account of its authority. "Claimed" because with no
            // authorizedBy nobody has endorsed the wording - it is self-description.
            if let authorityBasis = result.authorityBasis {
                VStack(alignment: .leading, spacing: 1) {
                    Text("AUTHORITY CLAIMED")
                        .font(.system(size: 9, weight: .semibold))
                        .opacity(0.75)
                    Text(authorityBasis)
                        .font(.caption)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.vertical, 2)
                .padding(.horizontal, 8)
                .background(Color.black.opacity(0.18))
                .cornerRadius(4)
            }
        }
        .padding()
        .foregroundColor(.white)
        .background(statusColor)
    }

    @ViewBuilder
    private func authorizationView(_ auth: AuthorizationResult) -> some View {
        if auth.expired {
            HStack(spacing: 4) {
                Image(systemName: "clock.badge.exclamationmark")
                    .font(.caption)
                Text("Authorization by \(auth.authorizer ?? "unknown") \u{2014} expired")
                    .font(.caption)
                if let successor = auth.successor {
                    Text("Successor: \(successor)")
                        .font(.caption2)
                }
            }
            .padding(.vertical, 2)
            .padding(.horizontal, 8)
            .background(Color.orange.opacity(0.3))
            .cornerRadius(4)
        } else if auth.checked {
            authorizationChainView(auth)
                .padding(.vertical, 2)
                .padding(.horizontal, 8)
                .background(auth.confirmed ? Color.green.opacity(0.3) : Color.orange.opacity(0.3))
                .cornerRadius(4)
                .onTapGesture {
                    showFormalNames(auth)
                }
        }
    }

    /// Android-style indented authority chain:
    ///   ✓ midsomer.police.uk — Police force for the county of Midsomer
    ///     ✓ policing.gov.uk — Oversees standards for all police forces...
    ///       ✓ gov.uk — Oversees all official verification chains...
    @ViewBuilder
    private func authorizationChainView(_ auth: AuthorizationResult) -> some View {
        let domain = statusDomain
        VStack(alignment: .leading, spacing: 1) {
            // First line: the issuer itself
            if let domain = domain {
                let symbol = "✓"
                let descSuffix = result.issuerDescription.map { " \u{2014} \($0)" } ?? ""
                Text("\(symbol) \(domain)\(descSuffix)")
                    .font(.system(.caption, design: .monospaced))
            }

            // Chain entries (authorizers) with increasing indentation
            ForEach(Array(auth.chain.enumerated()), id: \.offset) { index, entry in
                let indent = String(repeating: "  ", count: index + 1)
                let symbol = entry.confirmed ? "✓" : "✗"
                let descSuffix: String = {
                    if !entry.confirmed { return " \u{2014} NOT CONFIRMED" }
                    return entry.description.map { " \u{2014} \($0)" } ?? ""
                }()
                Text("\(indent)\(symbol) \(entry.authorizer)\(descSuffix)")
                    .font(.system(.caption2, design: .monospaced))
            }
        }
    }

    /// Show formalName values in an alert (equivalent to Android's Toast)
    private func showFormalNames(_ auth: AuthorizationResult) {
        var names: [String] = []
        if let issuerFormal = result.issuerFormalName {
            names.append(issuerFormal)
        }
        for entry in auth.chain {
            if let formal = entry.formalName {
                names.append(formal)
            }
        }
        guard !names.isEmpty else { return }
        // Use notification center to show a temporary overlay
        formalNamesToShow = names.joined(separator: "\n")
        showingFormalNames = true
    }

    private func noAuthorityView(domain: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.caption)
                Text("Self-verified by \(domain)")
                    .font(.caption)
            }
            // Name what is missing rather than leaving the reader to infer it from the
            // absence of a chain. Same wording as the Safari extension popup.
            Text("No government or regulator attests to this self-verification \u{2014} proceed with caution.")
                .font(.caption2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 2)
        .padding(.horizontal, 8)
        .background(Color.green.opacity(0.3))
        .cornerRadius(4)
    }

    private var isAffirming: Bool {
        if case .affirming = result.outcome { return true }
        return false
    }

    private var statusIcon: String {
        switch result.outcome {
        case .affirming:
            return "checkmark.circle.fill"
        case .denying, .noVerifyURL:
            return "xmark.circle.fill"
        case .networkError:
            return "wifi.exclamationmark"
        case .textAfterVerifyLine, .error:
            return "exclamationmark.triangle.fill"
        }
    }

    private var statusTitle: String {
        switch result.outcome {
        case .affirming(_, let status):
            return status
        case .denying(_, let reason):
            return "FAILED: \(reason)"
        case .noVerifyURL:
            return "No verify: URL found"
        case .networkError(let domain, _):
            return "Network error: \(domain) not found"
        case .textAfterVerifyLine:
            return "Text found after the verify line \u{2014} possible OCR mis-order. Check the Extracted tab."
        case .error(let message):
            return message
        }
    }

    private var statusDomain: String? {
        switch result.outcome {
        case .affirming(let domain, _), .denying(let domain, _):
            return domain
        default:
            return nil
        }
    }

    private var statusColor: Color {
        switch result.outcome {
        case .affirming:
            // Orange if verified but no authority backing it
            if result.authorization == nil {
                return .orange
            }
            if let auth = result.authorization, !auth.confirmed {
                return .orange
            }
            return .green
        case .denying, .noVerifyURL:
            return .red
        case .textAfterVerifyLine, .networkError, .error:
            return .orange
        }
    }

    /// Text stranded on/after the verify: line, when that is why we refused to verify
    private var strandedText: String? {
        if case .textAfterVerifyLine(let stranded) = result.outcome { return stranded }
        return nil
    }

    // MARK: - Tabs

    private var capturedTab: some View {
        ScrollView {
            VStack {
                if let image = capturedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 400)
                        .cornerRadius(8)
                        .padding()

                    Button(action: copyImage) {
                        Label("Copy Image", systemImage: "doc.on.doc")
                    }
                    .buttonStyle(.bordered)
                } else {
                    VStack(spacing: 8) {
                        Text("No image captured")
                            .foregroundColor(.secondary)

                        if let capturedImageError = capturedImageError {
                            Text(capturedImageError)
                                .font(.caption)
                                .multilineTextAlignment(.center)
                                .foregroundColor(.orange)
                        }
                    }
                    .padding()
                    .accessibilityIdentifier("result.noCapturedImage")
                }
            }
        }
    }

    private var extractedTab: some View {
        ScrollView([.vertical, .horizontal]) {
            unwrappedText(result.rawText)
                .padding()
        }
    }

    /// Monospaced text that keeps its real line breaks.
    ///
    /// These panes exist to show exactly what was read and exactly what was hashed, so they
    /// must not soft-wrap: a wrapped line reads as a line break that is not in the bytes.
    /// The enclosing ScrollView scrolls horizontally instead.
    private func unwrappedText(_ text: String) -> some View {
        Text(withReturnSymbols(text))
            .font(.system(.body, design: .monospaced))
            .lineLimit(nil)
            .fixedSize(horizontal: true, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
    }

    private var normalizedTab: some View {
        VStack {
            if let stranded = strandedText {
                strandedNotice(stranded)
            } else {
                // Display with ⏎ symbols (read-only), real lines preserved
                ScrollView([.vertical, .horizontal]) {
                    unwrappedText(result.normalizedText ?? "")
                }
                .frame(maxHeight: 150)
                .padding(.horizontal)
            }

            // Editable version (without ⏎)
            TextEditor(text: $editedText)
                .font(.system(.body, design: .monospaced))
                .frame(minHeight: 120)
                .border(Color.gray.opacity(0.3))
                .padding(.horizontal)

            HStack {
                Button("Re-verify") {
                    onReVerify(editedText)
                }
                .buttonStyle(.borderedProminent)
                .accessibilityIdentifier("result.reVerifyButton")

                Text(strandedText == nil
                     ? "Edit above to fix OCR errors"
                     : "Put the lines in the order they appear on the document, then Re-verify")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)

            Spacer()
        }
    }

    /// Shown in place of the normalized text when the pipeline refused to hash:
    /// says plainly that nothing was hashed and which content was stranded.
    private func strandedNotice(_ stranded: String) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("Nothing was hashed and no issuer was contacted.")
                    .font(.callout)
                    .fontWeight(.semibold)

                Text("OCR put this content on or after the verify: line, where it would have been dropped from the hash:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(stranded)
                    .font(.system(.body, design: .monospaced))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(Color.orange.opacity(0.15))
                    .cornerRadius(6)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
        }
        .frame(maxHeight: 190)
        .padding(.horizontal)
        .accessibilityIdentifier("result.strandedTextNotice")
    }

    // MARK: - Hash Section

    private func hashSection(hash: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SHA-256 Hash")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack {
                Text(hash)
                    .font(.system(.caption, design: .monospaced))
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .accessibilityIdentifier("result.hashValue")

                Button(action: { copyHash(hash) }) {
                    Image(systemName: "doc.on.doc")
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .padding(.horizontal)
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        Button("Verify Another") {
            onVerifyAnother()
        }
        .buttonStyle(.borderedProminent)
        .padding()
        .accessibilityIdentifier("result.verifyAnotherButton")
    }

    // MARK: - Actions

    private func copyImage() {
        guard let image = capturedImage else { return }
        UIPasteboard.general.image = image
    }

    private func copyHash(_ hash: String) {
        UIPasteboard.general.string = hash
    }

    // MARK: - Helpers

    /// Add U+23CE (⏎) at end of each line for visual debugging
    private func withReturnSymbols(_ text: String) -> String {
        text.components(separatedBy: .newlines)
            .map { $0 + "\u{23CE}" }
            .joined(separator: "\n")
    }
}

#Preview {
    ResultView(
        result: VerificationResult(
            outcome: .affirming(domain: "example.com", status: "VERIFIED"),
            rawText: "Test University\nJohn Doe\nFirst Class Honours\nverify:example.com/c",
            normalizedText: "Test University\nJohn Doe\nFirst Class Honours",
            hash: "abc123def456...",
            verificationURL: "https://example.com/c/abc123",
            baseURL: "verify:example.com/c",
            authorization: AuthorizationResult(
                checked: true, confirmed: true, authorizer: "gov.uk",
                description: "UK Government", expired: false, successor: nil, error: nil,
                chain: [
                    AuthorizationChainEntry(authorizer: "gov.uk", description: "UK Government", formalName: "His Majesty's Government", confirmed: true)
                ]
            )
        ),
        capturedImage: nil,
        onReVerify: { _ in },
        onVerifyAnother: { }
    )
}
