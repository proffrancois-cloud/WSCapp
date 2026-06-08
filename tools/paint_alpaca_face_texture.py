from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


INPUT = Path("/Users/francoismo/Documents/Playground/WSC/output/alpaca-avatar/textures/Image_0.png")
OUTPUT = Path("/Users/francoismo/Documents/Playground/WSC/output/alpaca-avatar/textures/Image_0_face_upgrade.png")


def connected_dark_components(image):
  pixels = image.load()
  width, height = image.size
  dark_pixels = set()
  for y in range(height):
    for x in range(700, width):
      r, g, b, _a = pixels[x, y]
      if r < 52 and g < 46 and b < 46:
        dark_pixels.add((x, y))

  seen = set()
  for start in list(dark_pixels):
    if start in seen:
      continue

    queue = deque([start])
    seen.add(start)
    xs = []
    ys = []
    while queue:
      x, y = queue.pop()
      xs.append(x)
      ys.append(y)
      for nx in (x - 1, x, x + 1):
        for ny in (y - 1, y, y + 1):
          point = (nx, ny)
          if point in dark_pixels and point not in seen:
            seen.add(point)
            queue.append(point)

    if len(xs) < 35:
      continue

    yield {
      "size": len(xs),
      "minx": min(xs),
      "miny": min(ys),
      "maxx": max(xs),
      "maxy": max(ys),
      "cx": sum(xs) / len(xs),
      "cy": sum(ys) / len(ys)
    }


def bright_neighborhood_score(image, cx, cy, radius=55):
  pixels = image.load()
  width, height = image.size
  score = 0
  for y in range(max(0, int(cy - radius)), min(height, int(cy + radius + 1)), 3):
    for x in range(max(0, int(cx - radius)), min(width, int(cx + radius + 1)), 3):
      r, g, b, _a = pixels[x, y]
      if r > 140 and g > 120 and b > 105:
        score += 1
  return score


def draw_soft_ellipse(layer, center, radius, fill):
  draw = ImageDraw.Draw(layer, "RGBA")
  cx, cy = center
  rx, ry = radius
  draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=fill)


def paint_eye(base, component):
  cx = component["cx"]
  cy = component["cy"]
  width = component["maxx"] - component["minx"] + 1
  height = component["maxy"] - component["miny"] + 1
  rx = max(7, min(18, width * 0.68))
  ry = max(8, min(22, height * 0.68))

  layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
  draw_soft_ellipse(layer, (cx, cy), (rx + 4, ry + 4), (232, 210, 182, 42))
  layer = layer.filter(ImageFilter.GaussianBlur(1.5))
  base.alpha_composite(layer)

  draw = ImageDraw.Draw(base, "RGBA")
  draw.ellipse((cx - rx * 0.75, cy - ry * 0.45, cx + rx * 0.75, cy + ry * 0.85), fill=(92, 43, 18, 178))
  draw.ellipse((cx - rx * 0.42, cy - ry * 0.50, cx + rx * 0.42, cy + ry * 0.55), fill=(6, 5, 4, 214))
  draw.ellipse((cx - rx * 0.55, cy - ry * 0.68, cx - rx * 0.12, cy - ry * 0.25), fill=(255, 255, 246, 230))
  draw.ellipse((cx + rx * 0.26, cy + ry * 0.22, cx + rx * 0.50, cy + ry * 0.50), fill=(255, 246, 229, 155))


def main():
  image = Image.open(INPUT).convert("RGBA")
  candidates = []
  for component in connected_dark_components(image):
    width = component["maxx"] - component["minx"] + 1
    height = component["maxy"] - component["miny"] + 1
    ratio = width / max(height, 1)
    bright_score = bright_neighborhood_score(image, component["cx"], component["cy"])
    if 8 <= width <= 48 and 8 <= height <= 52 and 0.35 <= ratio <= 2.4 and bright_score >= 95 and component["cy"] < 720:
      candidates.append({ **component, "bright_score": bright_score })

  for component in candidates:
    paint_eye(image, component)

  OUTPUT.parent.mkdir(parents=True, exist_ok=True)
  image.save(OUTPUT)
  print(f"painted {len(candidates)} eye-like texture regions")
  for component in candidates:
    print(
      f"{component['cx']:.1f},{component['cy']:.1f} "
      f"{component['maxx'] - component['minx'] + 1}x{component['maxy'] - component['miny'] + 1} "
      f"bright={component['bright_score']}"
    )


if __name__ == "__main__":
  main()
