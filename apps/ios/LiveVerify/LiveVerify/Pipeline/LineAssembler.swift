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

import Foundation
import CoreGraphics

/// A single OCR text region, in Vision's normalized coordinate space.
///
/// Vision's origin is bottom-left, so a LARGER `centerY` is HIGHER on the page.
struct TextObservation: Equatable {
    let text: String
    let centerX: CGFloat
    let centerY: CGFloat
    let width: CGFloat
    let height: CGFloat

    var minX: CGFloat { centerX - width / 2 }
    var maxX: CGFloat { centerX + width / 2 }
}

/// Turns unordered Vision text observations into ordered lines of text.
///
/// `VNRecognizeTextRequest` returns `VNRecognizedTextObservation`s with bounding boxes but
/// **no reading-order guarantee** — assembling them into lines is ours to do, and getting it
/// wrong changes what gets hashed. This is the single implementation; every OCR path that
/// feeds the verification pipeline uses it so the two cannot drift apart.
enum LineAssembler {

    /// Two observations belong to the same line if their Y centres are within this fraction
    /// of the median observation height.
    ///
    /// Deliberately measured against the *median* height of the whole capture, not against the
    /// height of either observation being compared: one tall bounding box (a slanted or
    /// multi-word region) must not be able to widen the tolerance enough to swallow the line
    /// above or below it. Typographic line spacing is ~1.2x the glyph height, so 0.6 leaves
    /// room for the stagger of a slightly rotated capture while staying clear of the next line.
    static let lineToleranceFactor: CGFloat = 0.6

    /// Horizontal overlap, as a fraction of the narrower box, above which two observations are
    /// treated as belonging to different lines whatever their Y centres say. Text side by side
    /// on one line does not overlap; text stacked vertically usually does.
    static let horizontalOverlapTolerance: CGFloat = 0.2

    /// Assemble observations into lines, in reading order.
    /// - Parameter observations: Text regions in Vision's normalized coordinate space
    /// - Returns: Lines top-to-bottom, each joining its regions left-to-right with a space
    static func assembleLines(from observations: [TextObservation]) -> [String] {
        guard !observations.isEmpty else { return [] }

        let tolerance = medianHeight(of: observations) * lineToleranceFactor

        // Top-to-bottom (descending Y in Vision's space), then left-to-right. Sorting first is
        // what makes grouping order-independent: the only group a region can join is the one
        // being built, so a region can never chain-merge into a line further up the page.
        let sorted = observations.sorted { lhs, rhs in
            lhs.centerY == rhs.centerY ? lhs.centerX < rhs.centerX : lhs.centerY > rhs.centerY
        }

        var groups: [[TextObservation]] = []
        for observation in sorted {
            if let current = groups.last,
               abs(observation.centerY - meanCenterY(of: current)) < tolerance,
               !overlapsHorizontally(observation, current) {
                // Compared against the group's running mean, so a line that drifts across a
                // rotated capture keeps grouping instead of breaking at its first member.
                groups[groups.count - 1].append(observation)
            } else {
                groups.append([observation])
            }
        }

        return groups.map { group in
            group.sorted { $0.centerX < $1.centerX }
                .map { $0.text }
                .joined(separator: " ")
        }
    }

    /// Re-join a `verify:`/`vfy:` URL that OCR split into several regions on one line.
    ///
    /// Only spaces that sit at a URL join are closed: a fragment is absorbed when the URL so far
    /// ends with URL punctuation (`: . / - _ ? # = & ~ + %`) or the fragment begins with it.
    /// Everything from the first fragment that fails that test is left alone with its space
    /// intact — closing up spaces indiscriminately would silently weld a stranded claim line
    /// onto the URL, hiding exactly the mis-order this is meant to leave visible.
    ///
    /// - Parameter lines: Assembled lines
    /// - Returns: The same lines, with URL fragments on any verify:/vfy: line re-joined
    static func rejoinVerifyURLs(in lines: [String]) -> [String] {
        lines.map { line in
            let lower = line.lowercased()
            guard lower.hasPrefix("verify:") || lower.hasPrefix("vfy:")
                    || lower.hasPrefix("verify :") || lower.hasPrefix("vfy :") else {
                return line
            }

            let fragments = line.split(separator: " ", omittingEmptySubsequences: true).map(String.init)
            guard var joined = fragments.first else { return line }

            var index = 1
            while index < fragments.count {
                let fragment = fragments[index]
                guard endsWithURLPunctuation(joined) || startsWithURLPunctuation(fragment) else {
                    break
                }
                joined += fragment
                index += 1
            }

            let remainder = fragments[index...]
            return remainder.isEmpty ? joined : ([joined] + remainder).joined(separator: " ")
        }
    }

    // MARK: - Helpers

    private static let urlPunctuation: Set<Character> = [":", ".", "/", "-", "_", "?", "#", "=", "&", "~", "+", "%"]

    private static func endsWithURLPunctuation(_ text: String) -> Bool {
        guard let last = text.last else { return false }
        return urlPunctuation.contains(last)
    }

    private static func startsWithURLPunctuation(_ text: String) -> Bool {
        guard let first = text.first else { return false }
        return urlPunctuation.contains(first)
    }

    private static func medianHeight(of observations: [TextObservation]) -> CGFloat {
        let heights = observations.map { $0.height }.sorted()
        return heights[heights.count / 2]
    }

    private static func meanCenterY(of group: [TextObservation]) -> CGFloat {
        group.reduce(0) { $0 + $1.centerY } / CGFloat(group.count)
    }

    private static func overlapsHorizontally(_ observation: TextObservation, _ group: [TextObservation]) -> Bool {
        group.contains { member in
            let overlap = min(observation.maxX, member.maxX) - max(observation.minX, member.minX)
            return overlap > min(observation.width, member.width) * horizontalOverlapTolerance
        }
    }
}

#if canImport(Vision)
import Vision

extension TextObservation {
    /// Build from a Vision observation, taking its top candidate.
    /// - Returns: nil when the observation has no candidate string
    init?(_ observation: VNRecognizedTextObservation) {
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        self.init(
            text: candidate.string,
            centerX: box.midX,
            centerY: box.midY,
            width: box.width,
            height: box.height
        )
    }
}
#endif
