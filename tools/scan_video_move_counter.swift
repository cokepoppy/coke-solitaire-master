import AVFoundation
import CoreGraphics
import CoreFoundation
import Foundation
import Vision

func usage() -> Never {
    fputs("usage: swift tools/scan_video_move_counter.swift VIDEO OUTPUT.csv\n", stderr)
    exit(2)
}

guard CommandLine.arguments.count == 3 else { usage() }
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
let sampleStart = 10.0
let sampleStep = 4.0
let count = Int((duration - sampleStart).rounded(.down) / sampleStep) + 1
var rows = ["index,requested_seconds,actual_seconds,source_pts,ocr_text,move_digits"]

for index in 0..<count {
    let requested = sampleStart + Double(index) * sampleStep
    var actual = CMTime.zero
    let frame = try generator.copyCGImage(
        at: CMTime(seconds: requested, preferredTimescale: 60_000),
        actualTime: &actual
    )
    guard let crop = frame.cropping(to: CGRect(x: 740, y: 296, width: 120, height: 90)) else {
        throw NSError(domain: "solitaire-move-counter", code: 1)
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    try VNImageRequestHandler(cgImage: crop).perform([request])
    let recognized = (request.results ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: "|")
    let digits = String(recognized.filter(\.isNumber))
    let pts = CMTimeConvertScale(actual, timescale: sourceTimeScale, method: .roundHalfAwayFromZero)
    let escapedText = recognized.replacingOccurrences(of: "\"", with: "\"\"")
    rows.append("\(index),\(String(format: "%.6f", requested)),\(String(format: "%.6f", CMTimeGetSeconds(actual))),\(pts.value),\"\(escapedText)\",\(digits)")

    if index > 0 && index % 25 == 0 {
        fputs("OCR sampled \(Int(requested))/\(Int(duration)) seconds\n", stderr)
    }
}

try rows.joined(separator: "\n").write(to: outputURL, atomically: true, encoding: .utf8)
print("Wrote \(rows.count - 1) move-counter samples to \(outputURL.path)")
