"""Operator full-body art for the inventory paper doll (original FullbodyIMG textures) -> assets/ui/fb_*.webp"""
import os, sys
from PIL import Image
F = "E:/LAO_Google_QA/Assets/AssetBundleResourceSub/Texture/FullbodyImg/"
OUT = "E:/LAO_MINI_GAME/4_LAO_Rogue_like/assets/ui/"
M = {"brownie": "FullbodyIMG_BR_Brownie_N", "leprechaun": "FullbodyIMG_BR_Leprechaun_N", "nymph": "FullbodyIMG_BR_Nymph_N",
     "kheshig": "FullbodyIMG_BR_Kheshig_N", "gnome": "FullbodyIMG_BR_Gnome_N", "constantia": "2DModel_3P_ConstantiaS2_Dialog010101",
     "blacklilith": "FullbodyIMG_3P_BlackLilith_N"}
for k, v in M.items():
    p = F + v + ".png"
    if not os.path.exists(p): print("missing", k); continue
    im = Image.open(p).convert("RGBA")
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    im.thumbnail((520, 760), Image.LANCZOS)
    im.save(OUT + "fb_" + k + ".webp", "WEBP", quality=84, method=6)
    print(k, im.size, os.path.getsize(OUT + "fb_" + k + ".webp"))
