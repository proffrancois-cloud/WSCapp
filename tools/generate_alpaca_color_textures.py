from pathlib import Path

from PIL import Image, ImageOps


BASE_TEXTURE = Path("/Users/francoismo/Documents/Playground/WSC/output/alpaca-avatar/textures/Image_0_face_upgrade.png")
MASK_TEXTURE = Path("/Users/francoismo/Documents/Playground/WSC/output/alpaca-avatar/textures/Image_0.png")
OUTPUT_DIR = Path("/Users/francoismo/Documents/Playground/WSC/app/assets/campus-3d/avatars/player-alpaca/textures")

VARIANTS = [
  ("light-brown", (188, 132, 82)),
  ("brown", (106, 64, 39)),
  ("light-blue", (108, 171, 214)),
  ("light-green", (116, 183, 126)),
  ("blonde", (219, 186, 99)),
  ("black", (37, 39, 42)),
  ("beige", (213, 181, 135)),
  ("redhair", (177, 82, 48)),
  ("light-pink", (226, 142, 171)),
  ("light-purple", (167, 142, 217))
]


def red_wool_mask_pixel(pixel):
  red, green, blue, _alpha = pixel
  if red < 34:
    return False
  if red < green * 1.2 or red < blue * 1.2:
    return False
  if green > 118 and blue > 95:
    return False
  return True


def make_wool_mask(mask_source):
  mask = Image.new("L", mask_source.size, 0)
  mask.putdata([255 if red_wool_mask_pixel(pixel) else 0 for pixel in mask_source.getdata()])
  return mask


def recolor_channel(level, target_value):
  shade = max(0.62, min(1.32, 0.92 + (level - 22) / 160))
  highlight = max(0, min(1, (level - 58) / 88))
  return int(max(0, min(255, target_value * shade + 255 * highlight * 0.18)))


def make_recolored_wool(base, target_rgb):
  luma = ImageOps.grayscale(base)
  channels = [luma.point(lambda level, value=value: recolor_channel(level, value)) for value in target_rgb]
  return Image.merge("RGBA", (*channels, base.getchannel("A")))


def main():
  OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
  base = Image.open(BASE_TEXTURE).convert("RGBA")
  mask_source = Image.open(MASK_TEXTURE).convert("RGBA")
  if base.size != mask_source.size:
    raise RuntimeError(f"Texture size mismatch: {base.size} vs {mask_source.size}")

  wool_mask = make_wool_mask(mask_source)

  for variant_id, target_rgb in VARIANTS:
    image = base.copy()
    image.paste(make_recolored_wool(base, target_rgb), (0, 0), wool_mask)

    output = OUTPUT_DIR / f"player-alpaca-{variant_id}.webp"
    image.save(output, "WEBP", quality=88, method=4)
    print(output, flush=True)


if __name__ == "__main__":
  main()
