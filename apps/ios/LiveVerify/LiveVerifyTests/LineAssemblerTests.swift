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
@testable import LiveVerify

/// Tests for OCR observation -> reading-order line assembly.
///
/// No camera and no Vision: these feed synthetic observations straight into the assembler,
/// which is the only reliable proof the grouping is right. Vision's own output differs
/// between devices (the Neural Engine on an iPhone vs. an Intel Mac), so "it read fine on
/// my machine" is not evidence.
final class LineAssemblerTests: XCTestCase {

    /// Left-aligned line of text, the usual shape on a credential.
    /// Vision's origin is bottom-left, so larger `centerY` is higher on the page.
    private func line(
        _ text: String,
        y: CGFloat,
        width: CGFloat,
        height: CGFloat = 0.085,
        minX: CGFloat = 0.08
    ) -> TextObservation {
        TextObservation(
            text: text,
            centerX: minX + width / 2,
            centerY: y,
            width: width,
            height: height
        )
    }

    // MARK: - The real scramble

    /// The mock BBC e-ink card from the Aug 2026 blog post
    /// (public/blog/two-ocr-failures-on-one-eink-card.html).
    ///
    /// "Roath Lock Studios access" came back with a tall, slanted bounding box that reached
    /// down toward the verify: line. The old grouping compared each observation against its
    /// group's FIRST member using `max(heightA, heightB) * 0.5`, so that one tall box widened
    /// the tolerance enough to swallow a physically separate line, producing:
    ///
    ///     verify:bbc.co.uk/roles Roath Lock Studios access
    ///
    /// which stranded a real claim after the URL, where the pipeline dropped it from the hash.
    private var scrambledCardObservations: [TextObservation] {
        // Deliberately NOT in reading order - Vision returns observations unordered
        [
            line("Paul James Hammant", y: 0.86, width: 0.55),
            line("16th Doctor Who", y: 0.72, width: 0.46),
            line("Series 16 (2027)", y: 0.58, width: 0.48),
            line("Wolf Studios access", y: 0.48, width: 0.58, height: 0.08),
            line("verify:bbc.co.uk/roles", y: 0.30, width: 0.60, height: 0.075),
            // The tall, slanted box that caused the merge
            line("Roath Lock Studios access", y: 0.36, width: 0.74, height: 0.22)
        ]
    }

    func testScrambledCardAssemblesInReadingOrder() {
        let lines = LineAssembler.assembleLines(from: scrambledCardObservations)

        XCTAssertEqual(lines, [
            "Paul James Hammant",
            "16th Doctor Who",
            "Series 16 (2027)",
            "Wolf Studios access",
            "Roath Lock Studios access",
            "verify:bbc.co.uk/roles"
        ])
    }

    func testScrambledCardKeepsRoathLockOffTheVerifyLine() throws {
        let lines = LineAssembler.assembleLines(from: scrambledCardObservations)

        let roathIndex = try XCTUnwrap(lines.firstIndex { $0.contains("Roath Lock") })
        let verifyIndex = try XCTUnwrap(lines.firstIndex { $0.hasPrefix("verify:") })

        XCTAssertEqual(lines.filter { $0.contains("Roath Lock") }.count, 1)
        XCTAssertEqual(lines.first { $0.contains("Roath Lock") }, "Roath Lock Studios access",
                       "Roath Lock must be alone on its line, not joined to anything")
        XCTAssertEqual(lines.first { $0.hasPrefix("verify:") }, "verify:bbc.co.uk/roles",
                       "Nothing may share the verify: line")
        XCTAssertLessThan(roathIndex, verifyIndex,
                          "Roath Lock must come BEFORE the verify line, or it gets dropped from the hash")
    }

    /// Vision returns observations unordered, so the assembled output must not depend on
    /// the order they arrive in - that order-dependence is what let the old code chain-merge.
    func testAssemblyIsIndependentOfObservationOrder() {
        let forwards = LineAssembler.assembleLines(from: scrambledCardObservations)
        let backwards = LineAssembler.assembleLines(from: scrambledCardObservations.reversed())
        let rotated = LineAssembler.assembleLines(
            from: Array(scrambledCardObservations.dropFirst() + scrambledCardObservations.prefix(1))
        )

        XCTAssertEqual(forwards, backwards)
        XCTAssertEqual(forwards, rotated)
    }

    /// Belt and braces: even at near-identical Y centres, two regions that overlap
    /// horizontally cannot be on the same physical line.
    func testHorizontallyOverlappingRegionsNeverShareALine() {
        let observations = [
            line("Roath Lock Studios access", y: 0.305, width: 0.74),
            line("verify:bbc.co.uk/roles", y: 0.300, width: 0.60)
        ]

        let lines = LineAssembler.assembleLines(from: observations)

        XCTAssertEqual(lines.count, 2, "Left-aligned lines overlap in X - they cannot be one line")
        XCTAssertTrue(lines.contains("Roath Lock Studios access"))
        XCTAssertTrue(lines.contains("verify:bbc.co.uk/roles"))
    }

    // MARK: - Grouping behaviour

    func testTightLineSpacingDoesNotChainMerge() {
        // Dense print: 0.06 spacing on 0.05-high text, about 1.2x - normal typography
        let observations = (0..<6).map { index in
            line("Line \(index)", y: 0.80 - CGFloat(index) * 0.06, width: 0.30, height: 0.05)
        }

        let lines = LineAssembler.assembleLines(from: observations)

        XCTAssertEqual(lines, ["Line 0", "Line 1", "Line 2", "Line 3", "Line 4", "Line 5"])
    }

    func testSlightlyRotatedLineStillGroups() {
        // One physical line broken into three regions, drifting downward across the page
        // as a slightly rotated capture does, plus a second line below it
        let observations = [
            TextObservation(text: "Roath", centerX: 0.16, centerY: 0.530, width: 0.14, height: 0.05),
            TextObservation(text: "Lock", centerX: 0.34, centerY: 0.515, width: 0.13, height: 0.05),
            TextObservation(text: "Studios", centerX: 0.55, centerY: 0.500, width: 0.20, height: 0.05),
            TextObservation(text: "Wolf Studios access", centerX: 0.37, centerY: 0.400, width: 0.58, height: 0.05)
        ]

        let lines = LineAssembler.assembleLines(from: observations)

        XCTAssertEqual(lines, ["Roath Lock Studios", "Wolf Studios access"])
    }

    func testSideBySideRegionsJoinLeftToRight() {
        // Arrives right-to-left; must come out left-to-right
        let observations = [
            TextObservation(text: "MICHAEL CHEN", centerX: 0.62, centerY: 0.50, width: 0.40, height: 0.06),
            TextObservation(text: "Driver:", centerX: 0.18, centerY: 0.50, width: 0.16, height: 0.06)
        ]

        XCTAssertEqual(LineAssembler.assembleLines(from: observations), ["Driver: MICHAEL CHEN"])
    }

    func testCleanTopToBottomInputIsUnchanged() {
        let observations = [
            line("Unseen University", y: 0.80, width: 0.50),
            line("Ponder Stibbons", y: 0.65, width: 0.45),
            line("Bachelor of Thaumatology", y: 0.50, width: 0.70),
            line("verify:live-verify.github.io/live-verify/c", y: 0.35, width: 0.80)
        ]

        XCTAssertEqual(LineAssembler.assembleLines(from: observations), [
            "Unseen University",
            "Ponder Stibbons",
            "Bachelor of Thaumatology",
            "verify:live-verify.github.io/live-verify/c"
        ])
    }

    func testEmptyInput() {
        XCTAssertEqual(LineAssembler.assembleLines(from: []), [])
    }

    func testSingleObservation() {
        XCTAssertEqual(
            LineAssembler.assembleLines(from: [line("Solo", y: 0.5, width: 0.2)]),
            ["Solo"]
        )
    }

    // MARK: - verify: URL re-joining

    func testFragmentedURLIsRejoined() {
        XCTAssertEqual(
            LineAssembler.rejoinVerifyURLs(in: ["verify: bbc.co.uk /roles"]),
            ["verify:bbc.co.uk/roles"]
        )
    }

    func testSpacedColonURLIsRejoined() {
        XCTAssertEqual(
            LineAssembler.rejoinVerifyURLs(in: ["verify : example.com/c"]),
            ["verify:example.com/c"]
        )
        XCTAssertEqual(
            LineAssembler.rejoinVerifyURLs(in: ["vfy: example.com /path"]),
            ["vfy:example.com/path"]
        )
    }

    /// The stranding must stay visible. Closing up every space on the line would weld
    /// a stranded claim onto the URL, hiding the mis-order and corrupting the lookup.
    func testStrandedTextIsNotWeldedOntoTheURL() {
        XCTAssertEqual(
            LineAssembler.rejoinVerifyURLs(in: ["verify:bbc.co.uk/roles Roath Lock Studios access"]),
            ["verify:bbc.co.uk/roles Roath Lock Studios access"]
        )
        XCTAssertEqual(
            LineAssembler.rejoinVerifyURLs(in: ["verify: bbc.co.uk /roles Roath Lock Studios access"]),
            ["verify:bbc.co.uk/roles Roath Lock Studios access"]
        )
    }

    func testNonVerifyLinesAreUntouched() {
        let lines = ["Paul James Hammant", "Series 16 (2027)"]
        XCTAssertEqual(LineAssembler.rejoinVerifyURLs(in: lines), lines)
    }
}
