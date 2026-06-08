#!/usr/bin/env python3
from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(
    "/Users/francoismo/Desktop/Pro/ILG - MORET FRANCOIS/FLE/2025-2026/WSC/Multiplayer habbo project/Visuals panel"
)
OUT_DIR = ROOT / "app/assets/campus/avatar"

FRAME_SIZE = 256
CONTENT_MAX_WIDTH = 228
CONTENT_MAX_HEIGHT = 222
CONTENT_BOTTOM = 238
BASE_LAYOUT = (1369, 1149)

COLORS = [
    ("alpaca-01", "ALPACA 1.png"),
    ("alpaca-02", "ALPACA 2.png"),
    ("alpaca-03", "ALPACA 3.png"),
    ("alpaca-04", "ALPACA 4.png"),
    ("alpaca-05", "ALPACA 5.png"),
    ("alpaca-06", "ALPACA 6.png"),
    ("alpaca-07", "ALPACA 7.png"),
    ("alpaca-08", "ALPACA 8.png"),
    ("alpaca-09", "ALPACA 9.png"),
    ("alpaca-10", "ALPACA 10.png"),
    ("alpaca-11", "ALPACA 11.png"),
]

OUTFITS = [
    ("suit", "ALPACA suit.png"),
    ("jeans-polo", "ALPACA jeans polo.png"),
    ("overall", "ALPACA overall.png"),
    ("dress", "ALPACA dress.png"),
    ("hawaiian", "ALPACA hawaiian.png"),
    ("casual", "ALPACA casual.png"),
    ("classy", "ALPACA classy.png"),
    ("grungy", "ALPACA grungy.png"),
    ("sporty", "ALPACA sporty.png"),
    ("weird", "ALPACA weird.png"),
    ("weird2", "ALPACA weird2.png"),
    ("candypop", "ALPACA candypop.png"),
    ("raver", "ALPACA raver.png"),
]

OUTFIT_BASE_COLOR = {
    "candypop": "alpaca-01",
    "raver": "alpaca-09",
}

SLOTS = {
    "front": (20, 75, 225, 455),
    "back": (232, 75, 435, 455),
    "side-right": (445, 70, 690, 455),
    "side-left": (685, 70, 935, 455),
    "walk-right": (0, 470, 235, 830),
    "walk-left": (215, 470, 455, 830),
    "run-right": (450, 470, 735, 830),
    "idle-down": (1168, 470, 1368, 830),
    "rear-look-back": (1160, 805, 1368, 1135),
}

FRAME_PLAN = [
    ("down", "idle", "front", False, (0, 0)),
    ("down", "walk", "front", False, (-2, 0)),
    ("down", "walk", "idle-down", False, (0, -5)),
    ("down", "walk", "front", False, (2, 0)),
    ("down", "walk", "idle-down", False, (0, -3)),
    ("up", "idle", "rear-look-back", False, (0, 0)),
    ("up", "walk", "rear-look-back", False, (-2, 0)),
    ("up", "walk", "rear-look-back", False, (0, -5)),
    ("up", "walk", "rear-look-back", False, (2, 0)),
    ("up", "walk", "rear-look-back", False, (0, -3)),
    ("left", "idle", "side-left", False, (0, 0)),
    ("left", "walk", "walk-left", False, (0, 0)),
    ("left", "walk", "side-left", False, (0, -4)),
    ("left", "walk", "run-right", True, (0, -2)),
    ("left", "walk", "side-left", False, (0, -3)),
    ("right", "idle", "side-right", False, (0, 0)),
    ("right", "walk", "walk-right", False, (0, 0)),
    ("right", "walk", "side-right", False, (0, -4)),
    ("right", "walk", "run-right", False, (0, -2)),
    ("right", "walk", "side-right", False, (0, -3)),
]

PANEL_ICON_SLOTS = {
    "suit": ("ALPACA panel outfits 1.png", (64, 118, 510, 548)),
    "jeans-polo": ("ALPACA panel outfits 1.png", (548, 118, 990, 548)),
    "overall": ("ALPACA panel outfits 1.png", (1030, 118, 1470, 548)),
    "dress": ("ALPACA panel outfits 2.png", (218, 146, 428, 560)),
    "hawaiian": ("ALPACA panel outfits 2.png", (438, 146, 650, 560)),
    "grungy": ("ALPACA panel outfits 2.png", (1343, 146, 1533, 560)),
    "weird": ("ALPACA panel outfits 2.png", (0, 575, 240, 1008)),
    "weird2": ("ALPACA panel outfits 2.png", (256, 575, 500, 1008)),
    "candypop": ("ALPACA panel outfits 2.png", (1034, 575, 1280, 1008)),
    "raver": ("ALPACA panel outfits 2.png", (1284, 575, 1533, 1008)),
}


def scaled_box(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    sx = image.width / BASE_LAYOUT[0]
    sy = image.height / BASE_LAYOUT[1]
    return (
        round(box[0] * sx),
        round(box[1] * sy),
        round(box[2] * sx),
        round(box[3] * sy),
    )


def flood_background_mask(rgb: np.ndarray) -> np.ndarray:
    height, width = rgb.shape[:2]
    spread = rgb.max(axis=2) - rgb.min(axis=2)
    bright = rgb.mean(axis=2)
    candidates = ((rgb[:, :, 0] > 248) & (rgb[:, :, 1] > 248) & (rgb[:, :, 2] > 248)) | (
        (bright > 242) & (spread < 18)
    )
    seen = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        if candidates[0, x]:
            queue.append((0, x))
        if candidates[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if candidates[y, 0]:
            queue.append((y, 0))
        if candidates[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if seen[y, x] or not candidates[y, x]:
            continue
        seen[y, x] = True
        if y > 0:
            queue.append((y - 1, x))
        if y < height - 1:
            queue.append((y + 1, x))
        if x > 0:
            queue.append((y, x - 1))
        if x < width - 1:
            queue.append((y, x + 1))
    return seen


def components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found: list[list[tuple[int, int]]] = []
    ys, xs = np.nonzero(mask)
    for start_y, start_x in zip(ys, xs):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        current: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            current.append((y, x))
            for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= next_y < height and 0 <= next_x < width and mask[next_y, next_x] and not seen[next_y, next_x]:
                    seen[next_y, next_x] = True
                    queue.append((next_y, next_x))
        found.append(current)
    return found


def keep_largest_component(alpha: np.ndarray) -> np.ndarray:
    mask = alpha > 0
    found = components(mask)
    if not found:
        return alpha
    largest = max(found, key=len)
    kept = np.zeros_like(alpha)
    for y, x in largest:
        kept[y, x] = alpha[y, x]
    return kept


def remove_small_components(alpha: np.ndarray, min_area: int = 18) -> np.ndarray:
    mask = alpha > 0
    kept = np.zeros_like(alpha)
    for component in components(mask):
        if len(component) >= min_area:
            for y, x in component:
                kept[y, x] = alpha[y, x]
    return kept


def foreground_from_crop(crop: Image.Image) -> Image.Image:
    rgba = crop.convert("RGBA")
    rgb = np.array(rgba.convert("RGB"))
    background = flood_background_mask(rgb)
    alpha = np.where(background, 0, np.array(rgba)[:, :, 3]).astype(np.uint8)
    alpha = keep_largest_component(alpha)
    arr = np.array(rgba)
    arr[:, :, 3] = alpha
    return Image.fromarray(arr, "RGBA")


def bbox_for_alpha(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = np.array(image)[:, :, 3]
    ys, xs = np.nonzero(alpha > 0)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def normalize_sprite(crop: Image.Image, offset: tuple[int, int] = (0, 0), mirror: bool = False) -> Image.Image:
    foreground = foreground_from_crop(crop)
    if mirror:
        foreground = ImageOps.mirror(foreground)
    bbox = bbox_for_alpha(foreground)
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    if not bbox:
        return frame
    trimmed = foreground.crop(bbox)
    scale = min(CONTENT_MAX_WIDTH / trimmed.width, CONTENT_MAX_HEIGHT / trimmed.height)
    size = (max(1, round(trimmed.width * scale)), max(1, round(trimmed.height * scale)))
    resized = trimmed.resize(size, Image.Resampling.LANCZOS)
    x = round((FRAME_SIZE - size[0]) / 2 + offset[0])
    y = round(CONTENT_BOTTOM - size[1] + offset[1])
    frame.alpha_composite(resized, (x, y))
    return frame


def crop_slot(sheet: Image.Image, slot: str) -> Image.Image:
    return sheet.crop(scaled_box(sheet, SLOTS[slot]))


def build_frames(sheet: Image.Image) -> list[Image.Image]:
    frames: list[Image.Image] = []
    for _direction, _state, slot, mirror, offset in FRAME_PLAN:
        frames.append(normalize_sprite(crop_slot(sheet, slot), offset=offset, mirror=mirror))
    return frames


def save_strip(frames: list[Image.Image], target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    strip = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * FRAME_SIZE, 0))
    strip.save(target)


def best_matching_base(dressed: Image.Image, base_sets: dict[str, list[Image.Image]]) -> str:
    sample_indices = [0, 5, 10, 15]
    best_id = "alpaca-09"
    best_score = float("inf")
    for color_id, frames in base_sets.items():
        score_total = 0.0
        count = 0
        for index in sample_indices:
            dressed_arr = np.array(dressed[index])
            base_arr = np.array(frames[index])
            mask = (dressed_arr[:, :, 3] > 0) & (base_arr[:, :, 3] > 0)
            if not mask.any():
                continue
            diff = np.abs(dressed_arr[:, :, :3].astype(np.int16) - base_arr[:, :, :3].astype(np.int16)).mean(axis=2)
            score_total += float(np.median(diff[mask]))
            count += 1
        if count and score_total / count < best_score:
            best_score = score_total / count
            best_id = color_id
    return best_id


def apply_clothing_guard(mask: np.ndarray, direction: str) -> np.ndarray:
    guarded = mask.copy()
    guarded[:70, :] = 0
    if direction == "down":
        guarded[:92, :] = 0
    elif direction == "up":
        guarded[:78, :] = 0
    elif direction == "right":
        guarded[:122, 126:] = 0
    elif direction == "left":
        guarded[:122, :130] = 0
    return guarded


def build_overlay_frames(dressed_frames: list[Image.Image], base_frames: list[Image.Image]) -> list[Image.Image]:
    overlay_frames: list[Image.Image] = []
    for (direction, _state, _slot, _mirror, _offset), dressed, base in zip(FRAME_PLAN, dressed_frames, base_frames):
        dressed_arr = np.array(dressed)
        base_arr = np.array(base)
        alpha = dressed_arr[:, :, 3]
        both = (alpha > 0) & (base_arr[:, :, 3] > 0)
        diff = np.zeros(alpha.shape, dtype=np.uint8)
        if both.any():
            diff_values = np.abs(dressed_arr[:, :, :3].astype(np.int16) - base_arr[:, :, :3].astype(np.int16)).max(axis=2)
            diff[both] = diff_values[both].astype(np.uint8)
        mask = ((diff > 46) & (alpha > 0)).astype(np.uint8) * 255
        mask = apply_clothing_guard(mask, direction)
        height, width = mask.shape
        yy = np.arange(height)[:, None]
        rgb = dressed_arr[:, :, :3]
        brightness = rgb.mean(axis=2)
        spread = rgb.max(axis=2) - rgb.min(axis=2)
        lower_pale_pixels = (yy > 146) & (brightness > 184) & (spread < 42)
        mask[lower_pale_pixels] = 0
        mask = remove_small_components(mask, min_area=16)
        mask_img = Image.fromarray(mask, "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.45))
        next_arr = dressed_arr.copy()
        next_arr[:, :, 3] = np.minimum(alpha, np.array(mask_img)).astype(np.uint8)
        overlay_frames.append(Image.fromarray(next_arr, "RGBA"))
    return overlay_frames


def save_preview(frame: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    frame.save(target)


def crop_panel_icon(outfit_id: str) -> Image.Image | None:
    config = PANEL_ICON_SLOTS.get(outfit_id)
    if not config:
        return None
    filename, box = config
    source = SOURCE_DIR / filename
    if not source.exists():
        return None
    crop = Image.open(source).convert("RGBA").crop(box)
    rgb = np.array(crop.convert("RGB"))
    non_white = np.count_nonzero(np.abs(rgb.astype(np.int16) - 255).max(axis=2) > 26)
    if non_white < 2400:
        return None
    return crop


def save_icon(outfit_id: str, fallback_frame: Image.Image) -> None:
    target = OUT_DIR / "outfit-icons" / f"{outfit_id}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    icon = crop_panel_icon(outfit_id)
    if icon is None:
        icon = fallback_frame
    icon.thumbnail((210, 210), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (224, 224), (0, 0, 0, 0))
    x = (224 - icon.width) // 2
    y = (224 - icon.height) // 2
    canvas.alpha_composite(icon, (x, y))
    canvas.save(target)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    base_sets: dict[str, list[Image.Image]] = {}
    for color_id, filename in COLORS:
        sheet = Image.open(SOURCE_DIR / filename).convert("RGBA")
        frames = build_frames(sheet)
        base_sets[color_id] = frames
        save_strip(frames, OUT_DIR / "base" / f"{color_id}.png")
        save_preview(frames[0], OUT_DIR / "previews/base" / f"{color_id}.png")

    for outfit_id, filename in OUTFITS:
        sheet = Image.open(SOURCE_DIR / filename).convert("RGBA")
        dressed_frames = build_frames(sheet)
        matched_base_id = OUTFIT_BASE_COLOR.get(outfit_id, "alpaca-09")
        overlay_frames = build_overlay_frames(dressed_frames, base_sets[matched_base_id])
        save_strip(overlay_frames, OUT_DIR / "outfits" / f"{outfit_id}.png")
        save_preview(overlay_frames[0], OUT_DIR / "previews/outfits" / f"{outfit_id}.png")
        save_icon(outfit_id, dressed_frames[0])
        print(f"{outfit_id}: matched {matched_base_id}")

    preview = Image.new("RGBA", (5 * FRAME_SIZE, 5 * FRAME_SIZE), (255, 255, 255, 255))
    draw = ImageDraw.Draw(preview)
    sample_base = base_sets["alpaca-09"]
    for index, frame in enumerate(sample_base):
        x = (index % 5) * FRAME_SIZE
        y = (index // 5) * FRAME_SIZE
        preview.alpha_composite(frame, (x, y))
        draw.text((x + 8, y + 8), str(index), fill=(45, 37, 27, 255))
    preview.save(OUT_DIR / "debug-frame-map.png")


if __name__ == "__main__":
    main()
