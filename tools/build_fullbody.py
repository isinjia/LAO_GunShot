"""Operator art for the inventory paper doll: the original FullbodyIMG textures, cropped to head and shoulders
-> assets/ui/fb_*.webp   (python tools/build_fullbody.py)"""
import os
from PIL import Image

F = "E:/LAO_Google_QA/Assets/AssetBundleResourceSub/Texture/FullbodyImg/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "ui")
# constantia: assets/ui/fb_constantia.webp is cropped by hand from the base-outfit art the user supplied (not built here)
M = {"brownie": "FullbodyIMG_BR_Brownie_N", "leprechaun": "FullbodyIMG_BR_Leprechaun_N", "nymph": "FullbodyIMG_BR_Nymph_N",
     "kheshig": "FullbodyIMG_BR_Kheshig_N", "gnome": "FullbodyIMG_BR_Gnome_N",
     "blacklilith": "FullbodyIMG_3P_BlackLilith_N"}
# hand-picked crops where the auto head finder is fooled (weapons / parts above the head): head centre x, top y, height (fractions of the figure box)
CROP = {"nymph": (0.62, 0.0, 0.36), "kheshig": (0.2, 0.0, 0.36)}


def head_x(a, y0, y1):
    """mean x of the opaque pixels in a band of rows (the head sits near the top of the figure)"""
    sx = n = 0
    w = a.size[0]
    px = a.load()
    for y in range(y0, y1, 2):
        for x in range(0, w, 2):
            if px[x, y] > 128:
                sx += x; n += 1
    return sx / n if n else w / 2


for k, v in M.items():
    p = F + v + ".png"
    if not os.path.exists(p):
        print("missing", k); continue
    im = Image.open(p).convert("RGBA")
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    W, H = im.size
    a = im.split()[3]
    if k in CROP:
        cx, ty, hf = CROP[k]; h = int(H * hf); y0 = int(H * ty); hx = W * cx
    else:
        h = int(min(H * 0.42, W * 1.1)); y0 = 0; hx = head_x(a, 0, max(4, int(H * 0.12)))  # head and shoulders
    w = min(W, int(h * 0.85))
    x0 = int(max(0, min(W - w, hx - w / 2)))
    c = im.crop((x0, y0, x0 + w, y0 + h))
    c.thumbnail((360, 420), Image.LANCZOS)
    c.save(os.path.join(OUT, "fb_" + k + ".webp"), "WEBP", quality=86, method=6)
    print(k, c.size)
