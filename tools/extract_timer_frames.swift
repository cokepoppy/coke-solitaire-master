import AppKit
import AVFoundation
import Foundation

guard CommandLine.arguments.count == 6 else {
    fputs("usage: swift extract_timer_frames.swift VIDEO START END STEP OUTPUT_DIR\n", stderr)
    exit(2)
}

let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let start = Double(CommandLine.arguments[2])!
let end = Double(CommandLine.arguments[3])!
let step = Double(CommandLine.arguments[4])!
let outputURL = URL(fileURLWithPath: CommandLine.arguments[5], isDirectory: true)
try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let generator = AVAssetImageGenerator(asset: AVURLAsset(url: videoURL))
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

for requestedTime in stride(from: start, through: end, by: step) {
    var actualTime = CMTime.zero
    let frame = try generator.copyCGImage(
        at: CMTime(seconds: requestedTime, preferredTimescale: 60_000),
        actualTime: &actualTime
    )
    guard let timer = frame.cropping(to: CGRect(x: 320, y: 290, width: 320, height: 100)) else {
        throw NSError(domain: "TimerFrame", code: 1, userInfo: [NSLocalizedDescriptionKey: "Timer crop is outside the source frame"])
    }
    let png = NSBitmapImageRep(cgImage: timer).representation(using: .png, properties: [:])!
    let name = String(format: "time-%07.3f-actual-%07.3f.png", requestedTime, CMTimeGetSeconds(actualTime))
    try png.write(to: outputURL.appendingPathComponent(name))
}
