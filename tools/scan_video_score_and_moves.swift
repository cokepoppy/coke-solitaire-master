import AVFoundation
import CoreGraphics
import CoreFoundation
import Foundation
import Vision

func usage() -> Never {
    fputs("usage: swift tools/scan_video_score_and_moves.swift VIDEO OUTPUT.csv [START_SECONDS [STEP_SECONDS [END_SECONDS]]]\n", stderr)
    exit(2)
}

guard (3...6).contains(CommandLine.arguments.count) else { usage() }
let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: videoURL)
let duration = CMTimeGetSeconds(try await asset.load(.duration))
let track = try await asset.loadTracks(withMediaType: .video).first!
let sourceTimeScale = try await track.load(.naturalTimeScale)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let sampleStart = CommandLine.arguments.count > 3 ? Double(CommandLine.arguments[3])! : 10.0
let sampleStep = CommandLine.arguments.count > 4 ? Double(CommandLine.arguments[4])! : 0.5
let sampleEnd = min(CommandLine.arguments.count > 5 ? Double(CommandLine.arguments[5])! : duration, duration)
guard sampleStart >= 0, sampleStep > 0, sampleEnd >= sampleStart else { usage() }
let count = Int((sampleEnd - sampleStart).rounded(.down) / sampleStep) + 1
var rows = ["index,requested_seconds,actual_seconds,source_pts,score_text,score_digits,timer_text,timer_digits,moves_text,moves_digits"]

func readText(_ frame: CGImage, cropRect: CGRect) throws -> (String, String) {
    guard let crop = frame.cropping(to: cropRect) else {
        throw NSError(domain: "solitaire-score-and-moves", code: 1)
    }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    try VNImageRequestHandler(cgImage: crop).perform([request])
    let recognized = (request.results ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: "|")
    return (recognized, String(recognized.filter(\.isNumber)))
}

for index in 0..<count {
    let requested = sampleStart + Double(index) * sampleStep
    var actual = CMTime.zero
    let frame = try generator.copyCGImage(
        at: CMTime(seconds: requested, preferredTimescale: 60_000),
        actualTime: &actual
    )
    let (scoreText, scoreDigits) = try readText(frame, cropRect: CGRect(x: 195, y: 300, width: 120, height: 85))
    let (timerText, timerDigits) = try readText(frame, cropRect: CGRect(x: 400, y: 296, width: 120, height: 90))
    let (movesText, movesDigits) = try readText(frame, cropRect: CGRect(x: 740, y: 296, width: 120, height: 90))
    let pts = CMTimeConvertScale(actual, timescale: sourceTimeScale, method: .roundHalfAwayFromZero)
    let escapedScore = scoreText.replacingOccurrences(of: "\"", with: "\"\"")
    let escapedTimer = timerText.replacingOccurrences(of: "\"", with: "\"\"")
    let escapedMoves = movesText.replacingOccurrences(of: "\"", with: "\"\"")
    rows.append("\(index),\(String(format: "%.6f", requested)),\(String(format: "%.6f", CMTimeGetSeconds(actual))),\(pts.value),\"\(escapedScore)\",\(scoreDigits),\"\(escapedTimer)\",\(timerDigits),\"\(escapedMoves)\",\(movesDigits)")

    if index > 0 && index % 100 == 0 {
        fputs("OCR sampled through \(String(format: "%.1f", requested)) seconds\n", stderr)
    }
}

try rows.joined(separator: "\n").write(to: outputURL, atomically: true, encoding: .utf8)
print("Wrote \(rows.count - 1) score/move samples to \(outputURL.path)")
