import AVFoundation
import CoreImage
import CoreVideo
import Foundation
import Vision

func usage() -> Never {
    fputs("usage: swift tools/scan_video_combo_feedback.swift VIDEO START_SECONDS END_SECONDS STEP_SECONDS OUTPUT.csv\n", stderr)
    exit(2)
}

func csv(_ value: String) -> String {
    "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
}

func editDistance(_ lhs: String, _ rhs: String) -> Int {
    let left = Array(lhs)
    let right = Array(rhs)
    var previous = Array(0...right.count)
    for (leftIndex, leftCharacter) in left.enumerated() {
        var current = [leftIndex + 1] + Array(repeating: 0, count: right.count)
        for (rightIndex, rightCharacter) in right.enumerated() {
            let substitutionCost = leftCharacter == rightCharacter ? 0 : 1
            current[rightIndex + 1] = min(
                previous[rightIndex + 1] + 1,
                current[rightIndex] + 1,
                previous[rightIndex] + substitutionCost
            )
        }
        previous = current
    }
    return previous[right.count]
}

func containsFeedbackWord(_ text: String) -> Bool {
    let tokens = text.uppercased()
        .split { !$0.isLetter && !$0.isNumber }
        .map(String.init)
    return tokens.contains { token in
        if token.hasPrefix("COMBO"), token.dropFirst(5).allSatisfy(\.isNumber) { return true }
        return ["COMBO", "GOOD", "GREAT", "AMAZING"].contains { editDistance(token, $0) <= 1 }
    }
}

let args = CommandLine.arguments
guard args.count == 6,
      let start = Double(args[2]),
      let end = Double(args[3]),
      let step = Double(args[4]),
      start >= 0, end >= start, step > 0 else {
    usage()
}

let videoURL = URL(fileURLWithPath: args[1]).standardizedFileURL
let outputURL = URL(fileURLWithPath: args[5]).standardizedFileURL
let asset = AVURLAsset(url: videoURL)
let track = try await asset.loadTracks(withMediaType: .video).first!
let timeScale = try await track.load(.naturalTimeScale)
let reader = try AVAssetReader(asset: asset)
let timeRangeStart = CMTime(seconds: start, preferredTimescale: timeScale)
let timeRangeEnd = CMTime(seconds: end, preferredTimescale: timeScale)
reader.timeRange = CMTimeRange(start: timeRangeStart, duration: timeRangeEnd - timeRangeStart)
let output = AVAssetReaderTrackOutput(
    track: track,
    outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)]
)
output.alwaysCopiesSampleData = false
guard reader.canAdd(output) else {
    fputs("Cannot add the source video track to AVAssetReader.\n", stderr)
    exit(1)
}
reader.add(output)
guard reader.startReading() else {
    fputs("Cannot read the source video: \(reader.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}

let ciContext = CIContext(options: [.useSoftwareRenderer: false])
let cropTop: CGFloat = 250
let cropHeight: CGFloat = 1_000
var nextRequestedTime = start
var sampledFrames = 0
var rows = ["requested_seconds,actual_seconds,source_pts,source_timescale,confidence,text,x_pixels,y_pixels"]

while let sample = output.copyNextSampleBuffer() {
    guard nextRequestedTime <= end + 0.000_001 else { break }
    let pts = CMSampleBufferGetPresentationTimeStamp(sample)
    let actualSeconds = CMTimeGetSeconds(pts)
    guard actualSeconds.isFinite else { continue }
    if actualSeconds + 0.000_001 < nextRequestedTime { continue }
    if actualSeconds > end + 0.05 { break }
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sample) else { continue }
    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
    guard let fullFrame = ciContext.createCGImage(ciImage, from: ciImage.extent) else { continue }
    guard cropTop + cropHeight <= CGFloat(fullFrame.height),
          let crop = fullFrame.cropping(to: CGRect(x: 0, y: cropTop, width: CGFloat(fullFrame.width), height: cropHeight)) else {
        fputs("Expected a source frame at least 1,250 pixels tall; got \(fullFrame.width)x\(fullFrame.height).\n", stderr)
        reader.cancelReading()
        exit(1)
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US"]
    request.minimumTextHeight = 0.008
    try VNImageRequestHandler(cgImage: crop).perform([request])
    for observation in request.results ?? [] {
        guard let candidate = observation.topCandidates(1).first else { continue }
        guard containsFeedbackWord(candidate.string) else { continue }
        let box = observation.boundingBox
        let x = box.minX * CGFloat(crop.width)
        let y = cropTop + CGFloat(crop.height) * (1 - box.maxY)
        let sourcePTS = CMTimeConvertScale(pts, timescale: timeScale, method: .roundHalfAwayFromZero)
        rows.append([
            String(format: "%.6f", nextRequestedTime),
            String(format: "%.6f", actualSeconds),
            String(sourcePTS.value),
            String(timeScale),
            String(format: "%.4f", candidate.confidence),
            csv(candidate.string),
            String(format: "%.1f", x),
            String(format: "%.1f", y),
        ].joined(separator: ","))
    }

    sampledFrames += 1
    nextRequestedTime += step
    if sampledFrames % 200 == 0 {
        fputs("Sampled \(sampledFrames) frames through \(String(format: "%.1f", actualSeconds)) s; feedback hits \(rows.count - 1).\n", stderr)
    }
}

if reader.status == .failed {
    fputs("Source scan failed: \(reader.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(1)
}
if reader.status == .reading { reader.cancelReading() }
try rows.joined(separator: "\n").write(to: outputURL, atomically: true, encoding: .utf8)
print("Sampled \(sampledFrames) frames and wrote \(rows.count - 1) feedback hits to \(outputURL.path)")
