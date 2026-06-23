#!/usr/bin/env python3
"""Turn the Gemini-generated images (baked gray-checker background, no real alpha)
into individual, correctly-named transparent PNG sprites for the game.

Steps per sprite:
  1. Key out the border-connected gray/low-saturation checkerboard -> alpha 0.
  2. For multi-item sheets, split into separate sprites via connected-component
     blobs (each sticker is its own blob), grouped into the expected grid.
  3. De-fringe, trim to content, pad slightly, resize to a sensible game size, save.

Floors are sliced (not keyed); the win screen is a full illustration (kept as-is).
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "raw")
OUT = os.path.join(ROOT, "assets", "sprites")
os.makedirs(OUT, exist_ok=True)

SAT_T = 28       # max(RGB)-min(RGB) <= this  => "gray"
LUMA_TOL = 16    # widen the detected background shade band by this on each side
DW = 560         # downscale width used for connected-component detection

# single images: raw filename (without .png) -> output name
SINGLES = {
    "bak": "bak",
    "bak-closed": "bak-closed",
    "boss": "boss",
    "logo": "logo",
    "vacuum-scared": "vacuum-scared",
    "joystick-base": "joystick-base",
    "joystick-knob": "joystick-knob",
}

# multi-item sheets: raw file -> (rows, cols, row-major names)
SHEETS = [
    ("vacuums.png", 2, 2, ["vacuum-roomba", "vacuum-upright", "vacuum-stick", "vacuum-mop"]),
    ("toys.png",    2, 2, ["toy-ball", "toy-duck", "toy-slipper", "toy-bowl"]),
    ("bacon-bone.png", 1, 2, ["bacon", "bone"]),
]

FLOOR_NAMES = ["floor-living", "floor-kitchen", "floor-bedroom", "floor-bathroom", "floor-garage"]

# Singles where keying can leave tiny stray specks; keep only the largest blob.
LARGEST_ONLY = {"joystick-knob"}

TARGET_W = {
    "bak": 140, "bak-closed": 140,
    "boss": 360, "logo": 720, "vacuum-scared": 110,
    "vacuum-roomba": 100, "vacuum-upright": 110, "vacuum-stick": 110, "vacuum-mop": 100,
    "bacon": 64, "bone": 88,
    "toy-ball": 64, "toy-duck": 74, "toy-slipper": 74, "toy-bowl": 74,
    "win": 640,
    "floor-living": 256, "floor-kitchen": 256, "floor-bedroom": 256,
    "floor-bathroom": 256, "floor-garage": 256,
    "joystick-base": 280, "joystick-knob": 150,
}


def remove_checker(rgb):
    """rgb HxWx3 uint8 -> alpha HxW uint8 (0 = background). Removes the
    border-connected gray, low-saturation checkerboard background."""
    h, w, _ = rgb.shape
    f = rgb.astype(np.int16)
    sat = f.max(2) - f.min(2)
    luma = f.mean(2)
    gray = sat <= SAT_T

    border = np.zeros((h, w), bool)
    b = max(2, min(h, w) // 80)
    border[:b, :] = border[-b:, :] = border[:, :b] = border[:, -b:] = True
    bl = luma[border & gray]
    if bl.size < 50:
        return np.full((h, w), 255, np.uint8)
    lo, hi = np.percentile(bl, 2) - LUMA_TOL, np.percentile(bl, 98) + LUMA_TOL
    cand = gray & (luma >= lo) & (luma <= hi)

    filled = border & cand
    while True:
        d = filled.copy()
        d[1:, :] |= filled[:-1, :]
        d[:-1, :] |= filled[1:, :]
        d[:, 1:] |= filled[:, :-1]
        d[:, :-1] |= filled[:, 1:]
        d &= cand
        if d.sum() == filled.sum():
            break
        filled = d
    return np.where(filled, 0, 255).astype(np.uint8)


def refine_and_trim(img):
    """img RGBA -> de-fringed, trimmed, padded RGBA (or None if empty)."""
    a = img.split()[3]
    a = a.filter(ImageFilter.MinFilter(3))        # erode 1px -> kill gray fringe
    a = a.filter(ImageFilter.GaussianBlur(0.6))   # soft anti-alias
    img.putalpha(a)
    bbox = img.getbbox()
    if not bbox:
        return None
    img = img.crop(bbox)
    pad = max(2, int(0.04 * max(img.size)))
    out = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    out.paste(img, (pad, pad), img)
    return out


def fit(img, name):
    tw = TARGET_W.get(name)
    if tw and img.width > tw:
        nh = max(1, round(img.height * tw / img.width))
        img = img.resize((tw, nh), Image.LANCZOS)
    return img


def save_sprite(rgba, name):
    out = refine_and_trim(rgba)
    if out is None:
        print(f"  !! {name}: empty after keying")
        return None
    out = fit(out, name)
    dst = os.path.join(OUT, name + ".png")
    out.save(dst)
    print(f"  -> {name}.png  {out.size}")
    return name


def components(mask):
    """mask: 2D bool. Returns list of dicts {bbox,(x0,y0,x1,y1); area; cen(x,y)}.
    Iterative flood fill per seed (few blobs, so this is fast)."""
    H, W = mask.shape
    remaining = mask.copy()
    comps = []
    while remaining.any():
        idx = int(np.argmax(remaining))
        sy, sx = divmod(idx, W)
        comp = np.zeros_like(mask)
        comp[sy, sx] = True
        while True:
            d = comp.copy()
            d[1:, :] |= comp[:-1, :]
            d[:-1, :] |= comp[1:, :]
            d[:, 1:] |= comp[:, :-1]
            d[:, :-1] |= comp[:, 1:]
            d &= remaining
            if d.sum() == comp.sum():
                break
            comp = d
        yy, xx = np.where(comp)
        comps.append({
            "bbox": (int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1),
            "area": int(comp.sum()),
            "cen": (float(xx.mean()), float(yy.mean())),
        })
        remaining &= ~comp
    return comps


def group_to_n(comps, n):
    """Keep the n largest blobs as anchors; attach every smaller blob (sparks,
    motion lines, droplets) to its nearest anchor; union each group's bbox."""
    comps = sorted(comps, key=lambda c: -c["area"])
    anchors = comps[:n]
    groups = [[a] for a in anchors]
    for c in comps[n:]:
        i = min(range(n), key=lambda k:
                (anchors[k]["cen"][0] - c["cen"][0]) ** 2 +
                (anchors[k]["cen"][1] - c["cen"][1]) ** 2)
        groups[i].append(c)
    out = []
    for g in groups:
        x0 = min(c["bbox"][0] for c in g); y0 = min(c["bbox"][1] for c in g)
        x1 = max(c["bbox"][2] for c in g); y1 = max(c["bbox"][3] for c in g)
        cx = float(np.mean([c["cen"][0] for c in g]))
        cy = float(np.mean([c["cen"][1] for c in g]))
        out.append({"bbox": (x0, y0, x1, y1), "cen": (cx, cy)})
    return out


def order_grid(groups, rows, cols):
    gs = sorted(groups, key=lambda g: g["cen"][1])
    ordered = []
    for r in range(rows):
        row = sorted(gs[r * cols:(r + 1) * cols], key=lambda g: g["cen"][0])
        ordered += row
    return ordered


def crop_largest(rgba_full, alpha_full):
    """Crop to the largest connected blob (drops stray keying specks)."""
    H, W = alpha_full.shape
    dh = round(H * DW / W)
    small = Image.fromarray(alpha_full).resize((DW, dh), Image.NEAREST)
    comps = components(np.array(small) > 0)
    if not comps:
        return rgba_full
    big = max(comps, key=lambda c: c["area"])
    scale = W / DW
    x0, y0, x1, y1 = big["bbox"]
    m = 4
    box = (max(0, int((x0 - m) * scale)), max(0, int((y0 - m) * scale)),
           min(W, int((x1 + m) * scale)), min(H, int((y1 + m) * scale)))
    return rgba_full.crop(box)


def process_single(raw_name, out_name):
    p = os.path.join(RAW, raw_name + ".png")
    if not os.path.exists(p):
        print(f"MISSING {raw_name}.png")
        return None
    rgb = np.array(Image.open(p).convert("RGB"))
    alpha = remove_checker(rgb)
    rgba = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")
    if out_name in LARGEST_ONLY:
        rgba = crop_largest(rgba, alpha)
    return save_sprite(rgba, out_name)


def process_sheet(fname, rows, cols, names):
    p = os.path.join(RAW, fname)
    if not os.path.exists(p):
        print(f"MISSING {fname}")
        return []
    print(f"[{fname}] split -> {names}")
    rgb = np.array(Image.open(p).convert("RGB"))
    H, W, _ = rgb.shape
    alpha = remove_checker(rgb)
    rgba_full = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")

    # connected components on a downscaled alpha mask
    dh = round(H * DW / W)
    small = Image.fromarray(alpha).resize((DW, dh), Image.NEAREST)
    mask = np.array(small) > 0
    n = rows * cols
    comps = [c for c in components(mask) if c["area"] >= 0.0008 * DW * dh]
    if len(comps) < n:
        print(f"  !! found {len(comps)} blobs, expected >= {n}; using what we have")
        n = min(n, len(comps))
    groups = group_to_n(comps, n)
    groups = order_grid(groups, rows, cols if rows * cols == len(names) else len(groups))
    scale = W / DW
    saved = []
    for g, name in zip(groups, names):
        x0, y0, x1, y1 = g["bbox"]
        m = 6  # margin in small-coords
        box = (max(0, int((x0 - m) * scale)), max(0, int((y0 - m) * scale)),
               min(W, int((x1 + m) * scale)), min(H, int((y1 + m) * scale)))
        crop = rgba_full.crop(box)
        # dominant color (for sanity logging)
        a = np.array(crop)[:, :, 3] > 8
        rgbm = np.array(crop)[:, :, :3][a].mean(0).astype(int) if a.any() else [0, 0, 0]
        print(f"     {name}: box={box} mean_rgb={tuple(rgbm)}")
        if save_sprite(crop, name):
            saved.append(name)
    return saved


def process_floors():
    p = os.path.join(RAW, "floors.png")
    if not os.path.exists(p):
        print("MISSING floors.png")
        return []
    im = Image.open(p).convert("RGB")
    W, H = im.size
    arr = np.array(im).astype(np.int16)
    sat = arr.max(2) - arr.min(2)
    # columns / rows that contain actual texture (saturated OR clearly dark/bright vs gray checker)
    fg = (sat > 30)
    col_has = fg.mean(0) > 0.15
    row_has = fg.mean(1) > 0.15
    xs = np.where(col_has)[0]; ys = np.where(row_has)[0]
    if xs.size and ys.size:
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    else:
        x0, x1, y0, y1 = int(W * .03), int(W * .97), int(H * .05), int(H * .95)
    block = im.crop((x0, y0, x1, y1))
    bw, bh = block.size
    print(f"[floors] block=({x0},{y0},{x1},{y1}) -> 5 strips")
    saved = []
    cw = bw / 5.0
    for i, name in enumerate(FLOOR_NAMES):
        cx0 = int(round(i * cw)); cx1 = int(round((i + 1) * cw))
        inset = int((cx1 - cx0) * 0.06)  # trim seams between strips
        strip = block.crop((cx0 + inset, int(bh * 0.05), cx1 - inset, int(bh * 0.95)))
        tw = TARGET_W.get(name, 256)
        if strip.width > tw:
            strip = strip.resize((tw, round(strip.height * tw / strip.width)), Image.LANCZOS)
        strip.save(os.path.join(OUT, name + ".png"))
        print(f"  -> {name}.png  {strip.size}")
        saved.append(name)
    return saved


def process_win():
    p = os.path.join(RAW, "win.png")
    if not os.path.exists(p):
        print("MISSING win.png")
        return None
    im = Image.open(p).convert("RGB")
    tw = TARGET_W["win"]
    if im.width > tw:
        im = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
    # quantize to keep the win screen small enough to precache comfortably
    q = im.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG)
    q.save(os.path.join(OUT, "win.png"), optimize=True)
    print(f"  -> win.png  {q.size}")
    return "win"


def contact_sheet(names):
    names = [n for n in names if not n.startswith("floor") and n != "win"]
    cell, cols, pad, label_h = 150, 6, 12, 18
    rows = (len(names) + cols - 1) // cols
    cw, chh = cell + pad, cell + label_h + pad
    sheet = Image.new("RGB", (cols * cw + pad, rows * chh + pad), (40, 32, 28))
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    dr = ImageDraw.Draw(sheet)
    for i, n in enumerate(sorted(names)):
        r, c = divmod(i, cols)
        x, y = pad + c * cw, pad + r * chh
        try:
            sp = Image.open(os.path.join(OUT, n + ".png")).convert("RGBA")
        except FileNotFoundError:
            continue
        sp.thumbnail((cell, cell), Image.LANCZOS)
        sheet.paste(sp, (x + (cell - sp.width) // 2, y + (cell - sp.height) // 2), sp)
        dr.text((x, y + cell + 2), n, fill=(235, 225, 215), font=font)
    out = os.path.join(ROOT, "docs", "asset_preview.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out)
    print("contact sheet ->", out)


def run():
    saved = []
    for raw, out in SINGLES.items():
        if process_single(raw, out):
            saved.append(out)
    for fname, rows, cols, names in SHEETS:
        saved += process_sheet(fname, rows, cols, names)
    saved += process_floors()
    if process_win():
        saved.append("win")
    print(f"\nsaved {len(saved)} assets")
    contact_sheet(saved)
    return saved


if __name__ == "__main__":
    run()
