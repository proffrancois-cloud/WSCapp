#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct RGBA {
  var r: UInt8
  var g: UInt8
  var b: UInt8
  var a: UInt8
}

struct Variant {
  let id: String
  let color: RGBA
}

let outputCellSize = 128
let poseCount = 4
let outputWidth = outputCellSize * poseCount
let outputHeight = outputCellSize

func fail(_ message: String) -> Never {
  FileHandle.standardError.write(Data("\(message)\n".utf8))
  exit(1)
}

func loadPixels(at url: URL) -> (pixels: [UInt8], width: Int, height: Int) {
  guard
    let source = CGImageSourceCreateWithURL(url as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    fail("Unable to read PNG at \(url.path)")
  }

  let width = image.width
  let height = image.height
  var pixels = [UInt8](repeating: 0, count: width * height * 4)
  guard let context = CGContext(
    data: &pixels,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: width * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
  ) else {
    fail("Unable to create RGBA context")
  }

  context.interpolationQuality = .none
  context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
  return (pixels, width, height)
}

func writePNG(_ pixels: [UInt8], width: Int, height: Int, to url: URL) {
  let data = Data(pixels)
  guard
    let provider = CGDataProvider(data: data as CFData),
    let image = CGImage(
      width: width,
      height: height,
      bitsPerComponent: 8,
      bitsPerPixel: 32,
      bytesPerRow: width * 4,
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
      provider: provider,
      decode: nil,
      shouldInterpolate: false,
      intent: .defaultIntent
    ),
    let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)
  else {
    fail("Unable to prepare PNG at \(url.path)")
  }
  CGImageDestinationAddImage(destination, image, nil)
  guard CGImageDestinationFinalize(destination) else {
    fail("Unable to write PNG at \(url.path)")
  }
}

func pixel(_ pixels: [UInt8], width: Int, x: Int, y: Int) -> RGBA {
  let offset = ((y * width) + x) * 4
  return RGBA(r: pixels[offset], g: pixels[offset + 1], b: pixels[offset + 2], a: pixels[offset + 3])
}

func put(_ value: RGBA, into pixels: inout [UInt8], width: Int, x: Int, y: Int) {
  let offset = ((y * width) + x) * 4
  pixels[offset] = value.r
  pixels[offset + 1] = value.g
  pixels[offset + 2] = value.b
  pixels[offset + 3] = value.a
}

func normalizedSheet(from source: (pixels: [UInt8], width: Int, height: Int)) -> [UInt8] {
  if source.width == outputWidth && source.height == outputHeight {
    return source.pixels
  }

  let sourceCellWidth = source.width / poseCount
  var output = [UInt8](repeating: 0, count: outputWidth * outputHeight * 4)

  for poseIndex in 0..<poseCount {
    let cellStart = poseIndex * sourceCellWidth
    let cellEnd = poseIndex == poseCount - 1 ? source.width : cellStart + sourceCellWidth
    var minX = cellEnd
    var minY = source.height
    var maxX = cellStart
    var maxY = 0

    for y in 0..<source.height {
      for x in cellStart..<cellEnd where pixel(source.pixels, width: source.width, x: x, y: y).a > 8 {
        minX = min(minX, x)
        minY = min(minY, y)
        maxX = max(maxX, x)
        maxY = max(maxY, y)
      }
    }

    guard minX <= maxX, minY <= maxY else {
      fail("Pose \(poseIndex + 1) has no visible pixels")
    }

    let cropWidth = maxX - minX + 1
    let cropHeight = maxY - minY + 1
    let scale = min(118.0 / Double(cropWidth), 122.0 / Double(cropHeight))
    let drawnWidth = max(1, Int((Double(cropWidth) * scale).rounded()))
    let drawnHeight = max(1, Int((Double(cropHeight) * scale).rounded()))
    let outputX = (poseIndex * outputCellSize) + ((outputCellSize - drawnWidth) / 2)
    let outputY = outputCellSize - drawnHeight - 3

    for y in 0..<drawnHeight {
      let sourceY = min(maxY, minY + Int(Double(y) / scale))
      for x in 0..<drawnWidth {
        let sourceX = min(maxX, minX + Int(Double(x) / scale))
        put(
          pixel(source.pixels, width: source.width, x: sourceX, y: sourceY),
          into: &output,
          width: outputWidth,
          x: outputX + x,
          y: outputY + y
        )
      }
    }
  }

  return output
}

func hexColor(_ hex: String) -> RGBA {
  let value = UInt32(hex.dropFirst(), radix: 16) ?? 0
  return RGBA(
    r: UInt8((value >> 16) & 0xff),
    g: UInt8((value >> 8) & 0xff),
    b: UInt8(value & 0xff),
    a: 255
  )
}

func lerp(_ start: UInt8, _ end: UInt8, _ amount: Double) -> UInt8 {
  UInt8(max(0, min(255, Int((Double(start) + ((Double(end) - Double(start)) * amount)).rounded()))))
}

func blend(_ first: RGBA, _ second: RGBA, amount: Double) -> RGBA {
  RGBA(
    r: lerp(first.r, second.r, amount),
    g: lerp(first.g, second.g, amount),
    b: lerp(first.b, second.b, amount),
    a: first.a
  )
}

func paletteColor(for variant: Variant, x: Int, y: Int) -> RGBA {
  let rainbow = ["#ff4444", "#ffb13b", "#f5ef48", "#42c96f", "#34a2ff", "#8b5cff", "#ff4fb3"].map(hexColor)
  let pastel = ["#ffd6e8", "#fff3a8", "#c8ffd6", "#b7e9ff", "#d9c5ff"].map(hexColor)
  let neon = ["#00fff0", "#44ff00", "#fff600", "#ff8c00", "#ff00f5", "#6236ff"].map(hexColor)
  let localX = x % outputCellSize
  let diagonal = localX + y

  switch variant.id {
  case "rainbow":
    return rainbow[(diagonal / 18) % rainbow.count]
  case "pastel-rainbow":
    return pastel[(diagonal / 21) % pastel.count]
  case "neon-rainbow":
    let angle = atan2(Double(y - (outputCellSize / 2)), Double(localX - (outputCellSize / 2))) + .pi
    return neon[Int((angle / (.pi * 2)) * Double(neon.count)) % neon.count]
  case "confetti":
    let colors = ["#ff4fb3", "#f7e35e", "#42c96f", "#3ac7df", "#7b61ff"].map(hexColor)
    return colors[((localX / 14) + (y / 14) * 2) % colors.count]
  case "candy-stripes":
    return ((diagonal / 11) % 2 == 0) ? hexColor("#ff78b8") : hexColor("#fff5ee")
  case "fire":
    let amount = max(0, min(1, Double(y) / Double(outputCellSize)))
    return amount < 0.5
      ? blend(hexColor("#fff064"), hexColor("#ff8a24"), amount: amount * 2)
      : blend(hexColor("#ff8a24"), hexColor("#c3222a"), amount: (amount - 0.5) * 2)
  case "ice":
    let amount = Double(diagonal % 120) / 120.0
    return blend(hexColor("#f3fdff"), hexColor("#7dd8ef"), amount: amount)
  case "galaxy":
    let amount = Double(diagonal % 175) / 175.0
    let base = amount < 0.5
      ? blend(hexColor("#20104d"), hexColor("#7434c7"), amount: amount * 2)
      : blend(hexColor("#7434c7"), hexColor("#0b8bd6"), amount: (amount - 0.5) * 2)
    return ((localX * 31 + y * 17) % 521 < 5) ? hexColor("#fff7d8") : base
  case "stars", "midnight-stars", "sparkle-gold":
    let star = ((localX * 31 + y * 17) % 421 < 5) || ((localX * 13 + y * 29) % 617 < 4)
    return star ? hexColor("#fff8d6") : variant.color
  default:
    return variant.color
  }
}

func recolored(_ source: [UInt8], for variant: Variant) -> [UInt8] {
  if variant.id == "cream" {
    return source
  }
  var output = source
  let white = RGBA(r: 255, g: 255, b: 255, a: 255)

  for y in 0..<outputHeight {
    for x in 0..<outputWidth {
      let original = pixel(source, width: outputWidth, x: x, y: y)
      guard original.a > 0 else { continue }

      let isEyeHighlight = original.r > 248 && original.g > 248 && original.b > 248
      let isFur = original.r > 180 && original.g > 155 && original.b > 115 && (Int(original.r) - Int(original.g)) < 70
      guard isFur && !isEyeHighlight else { continue }

      let luminance = (0.2126 * Double(original.r)) + (0.7152 * Double(original.g)) + (0.0722 * Double(original.b))
      let base = paletteColor(for: variant, x: x, y: y)
      let adjusted: RGBA
      if luminance >= 232 {
        adjusted = blend(base, white, amount: min(0.68, (luminance - 232) / 34))
      } else {
        let factor = max(0.54, luminance / 232)
        adjusted = RGBA(
          r: UInt8(Double(base.r) * factor),
          g: UInt8(Double(base.g) * factor),
          b: UInt8(Double(base.b) * factor),
          a: original.a
        )
      }
      put(RGBA(r: adjusted.r, g: adjusted.g, b: adjusted.b, a: original.a), into: &output, width: outputWidth, x: x, y: y)
    }
  }
  return output
}

guard CommandLine.arguments.count == 4 else {
  fail("Usage: swift tools/build-campus-sitting-sprites.swift <source.png> <manifest.js> <output-directory>")
}

let sourceURL = URL(fileURLWithPath: CommandLine.arguments[1])
let manifestURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
guard let manifest = try? String(contentsOf: manifestURL, encoding: .utf8) else {
  fail("Unable to read \(manifestURL.path)")
}
let expression = try NSRegularExpression(pattern: #"alpacaColor\("([^"]+)",\s*"[^"]+",\s*"(#[0-9a-fA-F]{6})""#)
let range = NSRange(manifest.startIndex..<manifest.endIndex, in: manifest)
let variants = expression.matches(in: manifest, range: range).compactMap { match -> Variant? in
  guard
    let idRange = Range(match.range(at: 1), in: manifest),
    let colorRange = Range(match.range(at: 2), in: manifest)
  else { return nil }
  return Variant(id: String(manifest[idRange]), color: hexColor(String(manifest[colorRange])))
}

guard variants.count >= 40 else {
  fail("Expected at least 40 campus alpaca colors, found \(variants.count)")
}

try? FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
let normalized = normalizedSheet(from: loadPixels(at: sourceURL))
for variant in variants {
  let url = outputDirectory.appendingPathComponent("alpaca-sitting-\(variant.id).png")
  writePNG(recolored(normalized, for: variant), width: outputWidth, height: outputHeight, to: url)
}

let previewURL = outputDirectory.appendingPathComponent("alpaca-sitting-preview.png")
writePNG(normalized, width: outputWidth, height: outputHeight, to: previewURL)
print("Generated \(variants.count) sitting sprite sheets in \(outputDirectory.path)")
