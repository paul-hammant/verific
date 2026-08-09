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

import XCTest
import Vision
import ImageIO
@testable import LiveVerify

// MARK: - Mock URLProtocol for testing

/// A mock URLProtocol that returns predefined responses for testing
class MockURLProtocol: URLProtocol {
    /// Handler to provide mock responses for requests
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        return true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        return request
    }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            client?.urlProtocol(self, didFailWithError: NSError(domain: "MockURLProtocol", code: 0, userInfo: [NSLocalizedDescriptionKey: "No handler set"]))
            return
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

// MARK: - VerificationClient Tests

final class VerificationClientTests: XCTestCase {

    var session: URLSession!
    var client: VerificationClient!

    override func setUp() {
        super.setUp()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        session = URLSession(configuration: config)
        client = VerificationClient(session: session)
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        super.tearDown()
    }

    // MARK: - fetchVerificationMeta Tests

    func testFetchVerificationMeta_returns200_parseJSON() async {
        let jsonData = """
        {"appendToHashFileName": ".json", "description": "Test meta"}
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url?.absoluteString.contains("verification-meta.json") ?? false)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, jsonData)
        }

        let meta = await client.fetchVerificationMeta(baseURL: "verify:example.com/c")

        XCTAssertNotNil(meta)
        XCTAssertEqual(meta?["appendToHashFileName"] as? String, ".json")
        XCTAssertEqual(meta?["description"] as? String, "Test meta")
    }

    func testFetchVerificationMeta_returns404_nil() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let meta = await client.fetchVerificationMeta(baseURL: "verify:example.com/c")

        XCTAssertNil(meta)
    }

    func testFetchVerificationMeta_returns500_nil() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let meta = await client.fetchVerificationMeta(baseURL: "verify:example.com/c")

        XCTAssertNil(meta)
    }

    func testFetchVerificationMeta_networkError_nil() async {
        MockURLProtocol.requestHandler = { _ in
            throw NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet, userInfo: nil)
        }

        let meta = await client.fetchVerificationMeta(baseURL: "verify:example.com/c")

        XCTAssertNil(meta)
    }

    func testFetchVerificationMeta_invalidJSON_nil() async {
        let invalidJSON = "not valid json {{{".data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, invalidJSON)
        }

        let meta = await client.fetchVerificationMeta(baseURL: "verify:example.com/c")

        XCTAssertNil(meta)
    }

    // MARK: - verify Tests

    func testVerify_http200_verified_affirming() async {
        let verifiedData = "{\"status\":\"verified\"}".data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, verifiedData)
        }

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: nil, authorityDomain: "example.com")

        if case .affirming(let domain, let status) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(status, "VERIFIED")
        } else {
            XCTFail("Expected .affirming, got \(result)")
        }
    }

    func testVerify_http200_JSONStatusVerified_affirming() async {
        let jsonData = """
        {"status": "VERIFIED"}
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, jsonData)
        }

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: nil, authorityDomain: "example.com")

        if case .affirming(let domain, let status) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(status, "VERIFIED")
        } else {
            XCTFail("Expected .affirming, got \(result)")
        }
    }

    func testVerify_http200_JSONStatusRevoked_denying() async {
        let jsonData = """
        {"status": "REVOKED"}
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, jsonData)
        }

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: nil, authorityDomain: "example.com")

        if case .denying(let domain, let reason) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(reason, "REVOKED")
        } else {
            XCTFail("Expected .denying, got \(result)")
        }
    }

    func testVerify_http404_denying() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 404, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: nil, authorityDomain: "example.com")

        if case .denying(let domain, let reason) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(reason, "Hash not found")
        } else {
            XCTFail("Expected .denying with 'Hash not found', got \(result)")
        }
    }

    func testVerify_http500_denying() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: nil, authorityDomain: "example.com")

        if case .denying(let domain, let reason) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(reason, "HTTP 500")
        } else {
            XCTFail("Expected .denying with 'HTTP 500', got \(result)")
        }
    }

    func testVerify_networkError_returnsNetworkError() async {
        MockURLProtocol.requestHandler = { _ in
            throw NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet, userInfo: nil)
        }

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: nil, authorityDomain: "example.com")

        if case .networkError(let domain, let error) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual((error as NSError).code, NSURLErrorNotConnectedToInternet)
        } else {
            XCTFail("Expected .networkError, got \(result)")
        }
    }

    func testVerify_customResponseType_affirming() async {
        let jsonData = """
        {"status": "ACTIVE"}
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, jsonData)
        }

        let meta: [String: Any] = [
            "responseTypes": [
                "ACTIVE": ["class": "affirming", "text": "Active and valid"]
            ]
        ]

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: meta, authorityDomain: "example.com")

        if case .affirming(let domain, let status) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(status, "ACTIVE")
        } else {
            XCTFail("Expected .affirming with status ACTIVE, got \(result)")
        }
    }

    // MARK: - X-Verification-URLs Tests
    //
    // Endorsers use this header to walk the claimed chain backward and to rate-limit per
    // originating issuer (docs/authority-chain-spec.md). Behaviour must match
    // checkAuthorization/walkAuthorizationChain in public/app-logic.js, which is canonical.

    /// Record every request the client makes, so the header can be asserted per URL
    private func recordingHandler(
        metaJSON: String,
        authorizerMetaJSON: String,
        record: @escaping (URLRequest) -> Void
    ) -> (URLRequest) throws -> (HTTPURLResponse, Data) {
        return { request in
            record(request)
            let url = request.url!.absoluteString
            let body: String
            if url.hasSuffix("issuer.example.com/verification-meta.json") {
                body = metaJSON
            } else if url.contains("verification-meta.json") {
                body = authorizerMetaJSON
            } else {
                body = "{\"status\":\"verified\"}"
            }
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, body.data(using: .utf8)!)
        }
    }

    func testCheckAuthorization_sendsClaimUrlInHeader() async {
        var requests: [URLRequest] = []
        MockURLProtocol.requestHandler = recordingHandler(
            metaJSON: "{\"authorizedBy\":\"authorizer.example.com\"}",
            authorizerMetaJSON: "{\"description\":\"An authorizer\"}",
            record: { requests.append($0) }
        )

        let meta: [String: Any] = ["authorizedBy": "authorizer.example.com"]
        _ = await client.checkAuthorization(
            meta: meta,
            metaUrl: "https://issuer.example.com/verification-meta.json",
            claimUrl: "https://issuer.example.com/c/abc123"
        )

        // The meta re-fetch carries no header - it is not part of the chain walk
        let metaRefetch = requests.first { $0.url?.absoluteString == "https://issuer.example.com/verification-meta.json" }
        XCTAssertNil(metaRefetch?.value(forHTTPHeaderField: "X-Verification-URLs"))

        // The authorization endpoint gets the claim URL
        let authRequest = requests.first { !($0.url?.absoluteString.contains("verification-meta.json") ?? true) }
        XCTAssertEqual(authRequest?.value(forHTTPHeaderField: "X-Verification-URLs"),
                       "https://issuer.example.com/c/abc123")
    }

    func testWalkAuthorizationChain_accumulatesUrlsUpTheChain() async {
        var requests: [URLRequest] = []
        MockURLProtocol.requestHandler = recordingHandler(
            metaJSON: "{\"authorizedBy\":\"authorizer.example.com\"}",
            // The authorizer is itself authorized, forcing a second level
            authorizerMetaJSON: "{\"description\":\"An authorizer\",\"authorizedBy\":\"root.example.com\"}",
            record: { requests.append($0) }
        )

        let meta: [String: Any] = ["authorizedBy": "authorizer.example.com"]
        _ = await client.checkAuthorization(
            meta: meta,
            metaUrl: "https://issuer.example.com/verification-meta.json",
            claimUrl: "https://issuer.example.com/c/abc123"
        )

        // Level 1: claim URL + the authorization URL just checked
        let level1 = requests.first { $0.url?.absoluteString == "https://authorizer.example.com/verification-meta.json" }
        let level1Header = level1?.value(forHTTPHeaderField: "X-Verification-URLs")
        XCTAssertNotNil(level1Header)
        XCTAssertTrue(level1Header?.hasPrefix("https://issuer.example.com/c/abc123, ") ?? false,
                      "Claim URL must come first. Got: \(level1Header ?? "nil")")

        // Level 2: the level-1 meta URL is appended, and the header grows
        let level2 = requests.first { $0.url?.absoluteString == "https://root.example.com/verification-meta.json" }
        let level2Header = level2?.value(forHTTPHeaderField: "X-Verification-URLs")
        XCTAssertNotNil(level2Header)
        XCTAssertTrue(level2Header?.hasSuffix(", https://authorizer.example.com/verification-meta.json") ?? false,
                      "Each level appends the meta URL it just used. Got: \(level2Header ?? "nil")")
        XCTAssertGreaterThan((level2Header ?? "").count, (level1Header ?? "").count,
                             "The header grows as the chain is walked upward")
    }

    /// No claim URL means nothing to declare - send no header rather than an empty one,
    /// matching the JS, which omits the whole fetch option when the list is empty.
    func testCheckAuthorization_omitsHeaderWhenNoClaimUrl() async {
        var requests: [URLRequest] = []
        MockURLProtocol.requestHandler = recordingHandler(
            metaJSON: "{\"authorizedBy\":\"authorizer.example.com\"}",
            authorizerMetaJSON: "{\"description\":\"An authorizer\"}",
            record: { requests.append($0) }
        )

        let meta: [String: Any] = ["authorizedBy": "authorizer.example.com"]
        _ = await client.checkAuthorization(
            meta: meta,
            metaUrl: "https://issuer.example.com/verification-meta.json"
        )

        let authRequest = requests.first { !($0.url?.absoluteString.contains("verification-meta.json") ?? true) }
        XCTAssertNotNil(authRequest, "Expected an authorization endpoint request")
        XCTAssertNil(authRequest?.value(forHTTPHeaderField: "X-Verification-URLs"))

        // The walk still declares the authorization URL it used
        let level1 = requests.first { $0.url?.absoluteString == "https://authorizer.example.com/verification-meta.json" }
        XCTAssertNotNil(level1?.value(forHTTPHeaderField: "X-Verification-URLs"))
    }

    func testVerify_customResponseType_denying() async {
        let jsonData = """
        {"status": "SUSPENDED"}
        """.data(using: .utf8)!

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, jsonData)
        }

        let meta: [String: Any] = [
            "responseTypes": [
                "SUSPENDED": ["class": "denying", "text": "Temporarily suspended"]
            ]
        ]

        let result = await client.verify(verificationURL: "https://example.com/c/abc123", meta: meta, authorityDomain: "example.com")

        if case .denying(let domain, let reason) = result {
            XCTAssertEqual(domain, "example.com")
            XCTAssertEqual(reason, "Temporarily suspended")
        } else {
            XCTFail("Expected .denying with reason 'Temporarily suspended', got \(result)")
        }
    }
}

final class SHA256HasherTests: XCTestCase {

    func testEmptyString() {
        let hash = SHA256Hasher.hashHex("")
        // SHA-256 of empty string
        XCTAssertEqual(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    }

    func testSimpleString() {
        let hash = SHA256Hasher.hashHex("hello")
        XCTAssertEqual(hash, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
    }

    func testUnicodeString() {
        let hash = SHA256Hasher.hashHex("héllo wörld")
        // Verify it produces a valid 64-char hex string
        XCTAssertEqual(hash.count, 64)
        XCTAssertTrue(hash.allSatisfy { $0.isHexDigit })
    }

    func testMultilineString() {
        let text = "Line 1\nLine 2\nLine 3"
        let hash = SHA256Hasher.hashHex(text)
        XCTAssertEqual(hash.count, 64)
    }

    func testConsistency() {
        let text = "Test consistency"
        let hash1 = SHA256Hasher.hashHex(text)
        let hash2 = SHA256Hasher.hashHex(text)
        XCTAssertEqual(hash1, hash2)
    }
}

final class VisionFixtureTests: XCTestCase {

    private func fixtureURL() throws -> URL {
        let base = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent() // LiveVerifyTests
        let url = base.appendingPathComponent("kevinAtHedgeServ.png")
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw XCTSkip("Missing fixture at \(url.path) - add a test image to run OCR tests")
        }
        return url
    }

    private func loadCGImage() throws -> CGImage {
        let url = try fixtureURL()
        let data = try Data(contentsOf: url) as CFData
        guard let source = CGImageSourceCreateWithData(data, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
            throw XCTSkip("Failed to load CGImage from \(url.path)")
        }
        return image
    }

    private func recognizeText(from cgImage: CGImage) throws -> String {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["en-US"]

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try handler.perform([request])
        guard let observations = request.results as? [VNRecognizedTextObservation], !observations.isEmpty else {
            return ""
        }
        return observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
    }

    func testFullImageOCRReadsVerifyURL() throws {
        let cgImage = try loadCGImage()
        let text = try recognizeText(from: cgImage)
        XCTAssertFalse(text.isEmpty, "OCR returned empty text for full image")
        XCTAssertTrue(text.contains("verify:paulhammant.com/refs"), "OCR did not include verify URL. Text:\n\(text)")
    }

}

final class JSBridgeTests: XCTestCase {

    var jsBridge: JSBridge?

    override func setUpWithError() throws {
        // JSBridge requires JS files in bundle - skip if not available
        do {
            jsBridge = try JSBridge()
        } catch {
            throw XCTSkip("JS files not available in test bundle: \(error)")
        }
    }

    func testExtractVerificationURL_verifyPrefix() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "Some certificate text\nJohn Doe\nverify:example.com/c"

        let result = bridge.extractVerificationURL(from: text)

        XCTAssertNotNil(result)
        XCTAssertEqual(result?.url, "verify:example.com/c")
        XCTAssertEqual(result?.lineIndex, 2)
    }

    func testExtractVerificationURL_vfyPrefix() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "Certificate\nvfy:example.com/path"

        let result = bridge.extractVerificationURL(from: text)

        XCTAssertNotNil(result)
        XCTAssertEqual(result?.url, "vfy:example.com/path")
    }

    func testExtractVerificationURL_noURL() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "Just some plain text\nNo verify URL here"

        let result = bridge.extractVerificationURL(from: text)

        XCTAssertNil(result)
    }

    func testExtractCertText() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "University of Test\nJohn Doe\nFirst Class\nverify:example.com/c"

        let certText = bridge.extractCertText(from: text, urlLineIndex: 3)

        XCTAssertNotNil(certText)
        XCTAssertTrue(certText?.contains("University of Test") ?? false)
        XCTAssertTrue(certText?.contains("John Doe") ?? false)
        XCTAssertFalse(certText?.contains("verify:") ?? true)
    }

    func testBuildVerificationURL_verifyPrefix() throws {
        let bridge = try XCTUnwrap(jsBridge)

        let url = bridge.buildVerificationURL(baseURL: "verify:example.com/c", hash: "abc123", meta: nil)

        XCTAssertEqual(url, "https://example.com/c/abc123")
    }

    func testBuildVerificationURL_vfyPrefix() throws {
        let bridge = try XCTUnwrap(jsBridge)

        let url = bridge.buildVerificationURL(baseURL: "vfy:example.com/path", hash: "def456", meta: nil)

        XCTAssertEqual(url, "https://example.com/path/def456")
    }

    func testBuildVerificationURL_withSuffix() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let meta: [String: Any] = ["appendToHashFileName": ".json"]

        let url = bridge.buildVerificationURL(baseURL: "verify:example.com/refs", hash: "abc123", meta: meta)

        XCTAssertEqual(url, "https://example.com/refs/abc123.json")
    }

    func testBuildVerificationURL_withoutSuffix() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let meta: [String: Any] = ["someOtherField": "value"]

        let url = bridge.buildVerificationURL(baseURL: "verify:example.com/c", hash: "abc123", meta: meta)

        XCTAssertEqual(url, "https://example.com/c/abc123")
    }

    func testExtractVerificationURL_withSpaceAfterColon() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "Certificate\nverify: example.com/c"

        let result = bridge.extractVerificationURL(from: text)

        XCTAssertNotNil(result)
        XCTAssertEqual(result?.url, "verify:example.com/c")
    }

    func testExtractVerificationURL_withSpaceBeforeColon() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "Certificate\nverify :example.com/c"

        let result = bridge.extractVerificationURL(from: text)

        XCTAssertNotNil(result)
        XCTAssertEqual(result?.url, "verify:example.com/c")
    }

    func testExtractVerificationURL_withSpacesAroundColon() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "Certificate\nverify : example.com/c"

        let result = bridge.extractVerificationURL(from: text)

        XCTAssertNotNil(result)
        XCTAssertEqual(result?.url, "verify:example.com/c")
    }

    func testNormalizeText_basic() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "  Some text with   extra spaces  \n\n  Another line  "

        let normalized = bridge.normalizeText(text, metadata: nil)

        XCTAssertNotNil(normalized)
        // Should collapse spaces and remove blank lines
        XCTAssertFalse(normalized?.contains("  ") ?? true)
    }

    func testNormalizeText_unicodeQuotes() throws {
        let bridge = try XCTUnwrap(jsBridge)
        let text = "\"Hello\" and 'World'"

        let normalized = bridge.normalizeText(text, metadata: nil)

        XCTAssertNotNil(normalized)
        // Curly quotes should become straight quotes
        XCTAssertTrue(normalized?.contains("\"Hello\"") ?? false)
        XCTAssertTrue(normalized?.contains("'World'") ?? false)
    }
}

final class StringJSEscapedTests: XCTestCase {

    func testBasicString() {
        let str = "hello world"
        XCTAssertEqual(str.jsEscaped, "hello world")
    }

    func testStringWithQuotes() {
        let str = "it's a \"test\""
        XCTAssertEqual(str.jsEscaped, "it\\'s a \"test\"")
    }

    func testStringWithNewlines() {
        let str = "line1\nline2\rline3"
        XCTAssertEqual(str.jsEscaped, "line1\\nline2\\rline3")
    }

    func testStringWithBackslash() {
        let str = "path\\to\\file"
        XCTAssertEqual(str.jsEscaped, "path\\\\to\\\\file")
    }
}

/// The displayed domain must be the one the DOCUMENT named, not whichever host served the
/// hash file. `hashesHostedAt` lets an issuer park its hash files with a provider; moving
/// them, or bringing them back in-house, must change nothing the reader sees.
final class AuthorityDomainTests: XCTestCase {

    func testAuthorityDomainFromVerifyPrefix() {
        XCTAssertEqual(VerificationClient.authorityDomain(from: "verify:paulhammant.com/refs"),
                       "paulhammant.com")
    }

    func testAuthorityDomainFromVfyPrefix() {
        XCTAssertEqual(VerificationClient.authorityDomain(from: "vfy:barclays.co.uk/c"),
                       "barclays.co.uk")
    }

    func testAuthorityDomainFromHttps() {
        XCTAssertEqual(VerificationClient.authorityDomain(from: "https://barclays.co.uk/c/x"),
                       "barclays.co.uk")
    }

    func testAuthorityDomainWithNoPath() {
        XCTAssertEqual(VerificationClient.authorityDomain(from: "verify:example.com"), "example.com")
    }

    /// The scenario the rule exists for: an issuer outsources hash hosting, then brings it
    /// back in-house. The reader sees the issuer both times.
    func testHostingProviderIsNeverShownAsTheAuthority() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "{\"status\":\"verified\"}".data(using: .utf8)!)
        }

        // Hashes parked with a provider today...
        let outsourced = await client.verify(
            verificationURL: "https://live-verifiers-inc.com/barclays/abc123",
            meta: ["hashesHostedAt": "https://live-verifiers-inc.com/barclays"],
            authorityDomain: "barclays.co.uk")

        // ...and served in-house tomorrow.
        let inHouse = await client.verify(
            verificationURL: "https://barclays.co.uk/c/abc123",
            meta: nil,
            authorityDomain: "barclays.co.uk")

        for result in [outsourced, inHouse] {
            guard case .affirming(let domain, _) = result else {
                XCTFail("Expected .affirming, got \(result)")
                return
            }
            XCTAssertEqual(domain, "barclays.co.uk")
        }
    }

    // Reuse the mocked client from the suite above
    private var client: VerificationClient!

    override func setUp() {
        super.setUp()
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        client = VerificationClient(session: URLSession(configuration: config))
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        super.tearDown()
    }
}
