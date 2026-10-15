"""Dungeon tile textures from the original project's Top-Down SF pack (GraphicResources/Asset_Store/Top-Down SF).

  Grid1.tif     2x2 floor plates (dotted / brick / X-brace / grating)
  Atlas1_m.tif  5x5 sci-fi wall panels (albedo) + Atlas1_illum.tif (blue light strips)

Writes assets/tiles/*.webp (power-of-two, tileable with RepeatWrapping):
  python tools/build_tiles.py
"""
import os

from PIL import Image, ImageEnhance, ImageChops, ImageFilter

Image.MAX_IMAGE_PIXELS = None
SRC = "E:/LAO/Google_QA/Assets/GraphicResources/Asset_Store/Top-Down SF/New Folder/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "tiles")


def save(im, name, size=None, q=86):
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)
    print(name, im.size)


def main():
    os.makedirs(OUT, exist_ok=True)
    grid = Image.open(SRC + "Grid1.tif").convert("RGB")
    q = 1024
    tl, tr = grid.crop((0, 0, q, q)), grid.crop((q, 0, 2 * q, q))
    bl, br = grid.crop((0, q, q, 2 * q)), grid.crop((q, q, 2 * q, 2 * q))
    # dotted plate without the orange hazard band (top 512 rows repeat cleanly)
    save(tl.crop((0, 0, 512, 512)), "floor_dot", (512, 512))
    save(bl, "floor_x", (512, 512))
    save(br, "floor_grate", (512, 512))
    # brick plate (the white lane cut away)
    save(tr.crop((0, 0, 420, 420)), "floor_brick", (512, 512))
    # the hazard band and the white lane as decals
    save(tl.crop((0, 560, 1024, 700)), "deco_hazard", (512, 64))
    save(tr.crop((440, 0, 600, 1024)).rotate(90, expand=True), "deco_lane", (512, 64))

    atl = Image.open(SRC + "Atlas1_m.tif").convert("RGB")
    ill = Image.open(SRC + "Atlas1_illum.tif").convert("RGB").resize(atl.size, Image.BILINEAR)
    c = atl.size[0] // 5

    def cell(r, k, box=None, bright=2.4, glow=1.6):
        x0, y0 = k * c, r * c
        b = box or (0, 0, c, c)
        a = atl.crop((x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3]))
        g = ill.crop((x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3]))
        a = ImageEnhance.Brightness(a).enhance(bright)
        g = ImageEnhance.Brightness(g.filter(ImageFilter.GaussianBlur(3))).enhance(glow)
        return ImageChops.add(a, g)

    # wall faces (2 tiles tall, repeat every 2 tiles across): 2:1 crops
    save(cell(2, 3, (0, 0, c, c // 2)), "wall_face_a", (512, 256))
    save(cell(2, 2, (0, c // 2, c, c)), "wall_face_b", (512, 256))
    save(cell(0, 1, (0, 0, c, c // 2)), "wall_face_c", (512, 256))
    save(cell(2, 1, (0, 0, c, c // 2)), "wall_face_d", (512, 256))
    # extra floors for the deeper sectors: heavy plates, deck stripes, lab piping
    save(cell(0, 0, bright=1.9, glow=1.0), "floor_plate", (512, 512))
    save(cell(4, 4, bright=2.1, glow=1.0), "floor_deck", (512, 512))
    save(cell(4, 0, bright=1.9, glow=1.0), "floor_pipe", (512, 512))
    # wall caps (seen from above)
    save(cell(1, 2, bright=1.6), "wall_cap", (256, 256))
    save(cell(1, 4, bright=1.5), "wall_cap_b", (256, 256))
    # props: crate tops, fan, generator plate
    save(cell(3, 1, (0, c // 2, c // 2, c), bright=2.2), "prop_crate", (256, 256))
    save(cell(3, 0, (0, c // 3, c // 3 * 1, c // 3 * 2), bright=2.4), "prop_fan", (256, 256))
    save(cell(1, 3, bright=1.8), "prop_plate", (256, 256))
    save(cell(4, 1, (0, 0, c // 3, c // 2), bright=2.0), "prop_locker", (128, 256))


if __name__ == "__main__":
    main()
