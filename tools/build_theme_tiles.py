"""Stage-theme tiles from the original project (stage mode's new looks).

  Top-Down SF atlas cells not used by build_tiles.py  -> theme floors / wall faces
  original FX ground textures                          -> theme floor decals (also the hazard pools)
  original base-facility sprites (via 6_LAO_Laket_Monster/assets/room) -> theme props

Writes assets/tiles/*.webp:  python tools/build_theme_tiles.py
"""
import os

from PIL import Image, ImageEnhance, ImageChops, ImageFilter, ImageOps

Image.MAX_IMAGE_PIXELS = None
SF = "E:/LAO_Google_QA/Assets/GraphicResources/Asset_Store/Top-Down SF/New Folder/"
AB = "E:/LAO_Google_QA/Assets/"
ROOM = "E:/LAO_MINI_GAME/6_LAO_Laket_Monster/assets/room/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "tiles")


def save(im, name, size=None, q=86):
    if size:
        im = im.resize(size, Image.LANCZOS)
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)
    print(name, im.size)


def tint(im, rgb, k=1.0):
    """multiply an RGB(A) image by a colour (keeps alpha)"""
    a = im.split()[3] if im.mode == "RGBA" else None
    c = ImageChops.multiply(im.convert("RGB"), Image.new("RGB", im.size, rgb))
    if k != 1.0:
        c = ImageEnhance.Brightness(c).enhance(k)
    if a:
        c.putalpha(a)
    return c


def glowify(im, rgb, blur=6, k=1.6):
    """a white-ish line texture -> coloured lines with a soft glow (alpha from luminance)"""
    g = im.convert("RGBA")
    lum = g.convert("L")
    alpha = ImageChops.multiply(lum, g.split()[3]) if g.mode == "RGBA" else lum
    halo = alpha.filter(ImageFilter.GaussianBlur(blur))
    a = ImageChops.lighter(alpha, ImageEnhance.Brightness(halo).enhance(k))
    out = Image.new("RGBA", g.size, rgb + (0,))
    out.putalpha(a)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    atl = Image.open(SF + "Atlas1_m.tif").convert("RGB")
    ill = Image.open(SF + "Atlas1_illum.tif").convert("RGB").resize(atl.size, Image.BILINEAR)
    c = atl.size[0] // 5

    def cell(r, k, box=None, bright=2.2, glow=1.4):
        x0, y0 = k * c, r * c
        b = box or (0, 0, c, c)
        a = atl.crop((x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3]))
        g = ill.crop((x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3]))
        a = ImageEnhance.Brightness(a).enhance(bright)
        g = ImageEnhance.Brightness(g.filter(ImageFilter.GaussianBlur(3))).enhance(glow)
        return ImageChops.add(a, g)

    # floors (512, tileable cells)
    save(cell(1, 3, bright=2.0), "floor_tread", (512, 512))       # diamond tread plate      — cryo vault
    save(cell(1, 2, bright=2.0), "floor_bigplate", (512, 512))    # heavy bolted plate       — foundry
    save(cell(3, 1, bright=2.1), "floor_ventgrid", (512, 512))    # vent grilles + panels    — toxic works
    save(cell(0, 4, bright=2.1), "floor_hatch", (512, 512))       # hatch frames             — flooded sector
    save(cell(1, 4, bright=2.1), "floor_panel2", (512, 512))      # twin panels              — power plant
    save(cell(0, 2, bright=2.1), "floor_frame", (512, 512))       # framed plate (alternate)
    # wall faces (2:1)
    save(cell(2, 2, (0, 0, c, c // 2)), "wall_face_e", (512, 256))
    save(cell(2, 3, (0, c // 2, c, c)), "wall_face_f", (512, 256))
    save(cell(0, 3, (0, 0, c, c // 2)), "wall_face_g", (512, 256))
    save(cell(4, 3, (0, 0, c, c // 2)), "wall_face_h", (512, 256))

    # floor decals (RGBA) from original FX ground textures
    ice = Image.open(AB + "AssetBundleResourceSub/FX/Texture/Rhea_ice_ground_Crack_text2.png").convert("RGBA")
    save(tint(ice, (200, 235, 255), 1.15), "deco_ice", (512, 512))
    crack = Image.open(AB + "AssetBundleResourceSub/FX/Texture/PD_ground_crack.png").convert("RGBA")
    save(glowify(crack, (255, 110, 40), blur=8, k=2.2), "deco_lava", (512, 512))
    save(glowify(crack, (90, 220, 255), blur=6, k=1.8), "deco_arc", (512, 512))
    water = Image.open(AB + "AssetBundleResource/FX/character_prefab/PXSilky_skill/Pxsilky_Ns2_skill/skill1/eff_silky_water_floor.png").convert("RGBA")
    w4 = Image.new("RGBA", (256, 256))
    for i in range(2):
        for j in range(2):
            w4.paste(water.resize((128, 128)), (i * 128, j * 128))
    save(tint(w4, (90, 170, 255), 1.3), "deco_water", (256, 256))
    save(tint(w4, (120, 255, 90), 1.3), "deco_toxic", (256, 256))
    pit = Image.open(AB + "AssetBundleResource/FX/character_prefab/Rhode_skill/Rhode_Ns1_skill/skill2/eff_rhode_skill2_ground_01.png").convert("RGBA")
    save(pit, "deco_pit", (512, 512))
    rub = Image.open(AB + "AssetBundleResourceSub/FX/Texture/BlackKnight_ground.png").convert("RGBA")
    save(rub, "deco_rubble", (256, 128))

    # props: original base-facility sprites
    for src, name in [("andr1_0", "prop_tank"), ("iron1_6", "prop_cargo"), ("mk4_2", "prop_core"), ("mk4_1", "prop_console"), ("dis1_21", "prop_machine")]:
        im = Image.open(ROOM + src + ".webp").convert("RGBA")
        im.thumbnail((256, 256), Image.LANCZOS)
        save(im, name)


if __name__ == "__main__":
    main()
