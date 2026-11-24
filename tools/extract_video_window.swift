import AppKit
import AVFoundation
import CryptoKit
import Foundation

struct CropRect {
    let x: Int
    let y: Int
    let width: Int
    let height: Int
}

func usage() -> Never {
    fputs("usage: swift tools/extract_video_window.swift VIDEO START END STEP OUTPUT_DIR [CROP_X CROP_Y CROP_WIDTH CROP_HEIGHT]\n", stderr)
    exit(2)
}

func number(_ value: String) -> Double? {
    Double(value)
}

func sha256(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

func csv(_ value: String) -> String {
    "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
}

let args = CommandLine.arguments
guard args.count == 6 || args.count == 10,
      let start = number(args[2]),
      let end = number(args[3]),
      let step = number(args[4]),
      start >= 0, end >= start, step > 0 else {
    usage()
}

let inputURL = URL(fileURLWithPath: args[1]).standardizedFileURL
let outputURL = URL(fileURLWithPath: args[5], isDirectory: true).standardizedFileURL
let crop: CropRect? = args.count == 10 ? {
    guard let x = Int(args[6]), let y = Int(args[7]), let width = Int(args[8]), let height = Int(args[9]),
          x >= 0, y >= 0, width > 0, height > 0 else { usage() }
    return CropRect(x: x, y: y, width: width, height: height)
}() : nil

try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)
let asset = AVURLAsset(url: inputURL)
let videoTracks = try await asset.loadTracks(withMediaType: .video)
guard let videoTrack = videoTracks.first else {
    fputs("No video track found in \(inputURL.path)\n", stderr)
    exit(1)
}
let sourceTimeScale = try await videoTrack.load(.naturalTimeScale)
let naturalSize = try await videoTrack.load(.naturalSize)

let sourceData = try Data(contentsOf: inputURL, options: .mappedIfSafe)
let sourceHash = sha256(sourceData)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

var csvRows = ["frame_index,requested_seconds,actual_seconds,source_pts,source_timescale,png_sha256,filename"]
var frames = [[String: Any]]()
var index = 0
while start + Double(index) * step <= end + 0.0000001 {
    let requestedSeconds = start + Double(index) * step
    var actualTime = CMTime.zero
    let fullFrame = try generator.copyCGImage(
        at: CMTime(seconds: requestedSeconds, preferredTimescale: 60_000),
        actualTime: &actualTime
    )

    let frame: CGImage
    if let crop {
        let rect = CGRect(x: crop.x, y: crop.y, width: crop.width, height: crop.height)
        guard rect.maxX <= CGFloat(fullFrame.width), rect.maxY <= CGFloat(fullFrame.height),
              let croppedFrame = fullFrame.cropping(to: rect) else {
            fputs("Crop is outside frame \(fullFrame.width)x\(fullFrame.height) at \(requestedSeconds)s\n", stderr)
            exit(1)
        }
        frame = croppedFrame
    } else {
        frame = fullFrame
    }

    let png = NSBitmapImageRep(cgImage: frame).representation(using: .png, properties: [:])!
    let actualSeconds = CMTimeGetSeconds(actualTime)
    let sourcePTS = CMTimeConvertScale(actualTime, timescale: sourceTimeScale, method: .roundHalfAwayFromZero)
    let pngHash = sha256(png)
    let filename = String(format: "frame-%05d-req-%010.6f-pts-%lld.png", index, requestedSeconds, sourcePTS.value)
    try png.write(to: outputURL.appendingPathComponent(filename), options: .atomic)

    csvRows.append([
        String(index),
        String(format: "%.9f", requestedSeconds),
        String(format: "%.9f", actualSeconds),
        String(sourcePTS.value),
        String(sourceTimeScale),
        pngHash,
        csv(filename),
    ].joined(separator: ","))
    frames.append([
        "index": index,
        "requested_seconds": requestedSeconds,
        "actual_seconds": actualSeconds,
        "source_pts": sourcePTS.value,
        "png_sha256": pngHash,
        "filename": filename,
    ])
    index += 1
}

try csvRows.joined(separator: "\n").write(to: outputURL.appendingPathComponent("frames.csv"), atomically: true, encoding: .utf8)
let manifest: [String: Any] = [
    "source_file_name": inputURL.lastPathComponent,
    "source_sha256": sourceHash,
    "source_time_scale": sourceTimeScale,
    "source_natural_size": ["width": naturalSize.width, "height": naturalSize.height],
    "requested_window_seconds": ["start": start, "end": end, "step": step],
    "crop": crop.map { ["x": $0.x, "y": $0.y, "width": $0.width, "height": $0.height] } as Any? ?? NSNull(),
    "frame_count": frames.count,
    "frame_hash_type": "SHA-256 of the saved PNG file bytes",
    "frames": frames,
]
let json = try JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try json.write(to: outputURL.appendingPathComponent("manifest.json"), options: .atomic)
print("Extracted \(frames.count) frames to \(outputURL.path)")
