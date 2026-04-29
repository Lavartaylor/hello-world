#!/usr/bin/env python3
"""Slice the 3x2 envelope grid into 6 frames with transparent backgrounds."""

from PIL import Image
import numpy as np
import os

SRC = "/Users/lavar/Desktop/claude/envelope.png"
OUT_DIR = "/Users/lavar/Desktop/claude/personal/hunger-games/assets"

img = Image.open(SRC).convert("RGBA")
w, h = img.size  # 1536 x 1024

cols, rows = 3, 2
cell_w = w // cols   # 512
cell_h = h // rows   # 512
label_pad = 80       # crop number label off the bottom of each cell

for row in range(rows):
    for col in range(cols):
        idx = row * cols + col + 1
        x0 = col * cell_w
        y0 = row * cell_h
        x1 = x0 + cell_w
        y1 = y0 + cell_h - label_pad
        cell = img.crop((x0, y0, x1, y1))

        arr = np.array(cell)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

        # Pure-black background → fully transparent
        hard_bg = (r < 18) & (g < 18) & (b < 18)
        arr[hard_bg, 3] = 0

        # Near-black falloff (preserves soft shadow edges with graded alpha)
        max_ch = np.maximum(np.maximum(r, g), b)
        soft = (max_ch >= 18) & (max_ch < 60) & ~hard_bg
        soft_alpha = ((max_ch[soft].astype(np.int32) - 18) * 255 // 42).astype(np.uint8)
        arr[soft, 3] = np.minimum(arr[soft, 3], soft_alpha)

        out_path = os.path.join(OUT_DIR, f"envelope-{idx}.png")
        Image.fromarray(arr).save(out_path, optimize=True)
        print(f"wrote {out_path}  size={cell.size}")
