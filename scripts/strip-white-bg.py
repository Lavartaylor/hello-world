#!/usr/bin/env python3
"""Knock the white background out of every emblem PNG (chroma-key + flood-fill from corners)."""

from PIL import Image
import numpy as np
import os
from collections import deque

SEAL_DIR = "/Users/lavar/Desktop/claude/personal/hunger-games/assets/seals"

def process(path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # Pixels that look "white-ish" — start with a generous threshold
    near_white = (r > 235) & (g > 235) & (b > 235)

    # Flood-fill from the four corners — only erase white that's connected
    # to the canvas edge. This way any internal white pixels in the artwork
    # itself (eyes, highlights, etc.) survive.
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    for y in (0, h - 1):
        for x in range(w):
            if near_white[y, x]: queue.append((y, x))
    for x in (0, w - 1):
        for y in range(h):
            if near_white[y, x]: queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        if y < 0 or x < 0 or y >= h or x >= w: continue
        if visited[y, x] or not near_white[y, x]: continue
        visited[y, x] = True
        queue.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))

    # Soften the alpha edge so the seal doesn't have a jagged outline
    arr[visited, 3] = 0
    # Also fade off-white pixels adjacent to the cut: treat 220-235 as partially transparent
    near_edge = (r > 220) & (g > 220) & (b > 220) & ~visited
    edge_alpha = ((255 - np.maximum(np.maximum(r, g), b))[near_edge].astype(np.int32) * 255 // 35).clip(0, 255).astype(np.uint8)
    arr[near_edge, 3] = np.minimum(arr[near_edge, 3], edge_alpha)

    Image.fromarray(arr).save(path, optimize=True)

files = ["capitol.png"] + [f"district-{n}.png" for n in range(1, 14)]
for f in files:
    p = os.path.join(SEAL_DIR, f)
    if os.path.exists(p):
        process(p)
        print(f"alpha → {f}")
