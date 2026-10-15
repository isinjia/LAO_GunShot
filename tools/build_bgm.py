"""Builds assets/bgm/*.mp3 from the original LAST ORIGIN BGM, loudness-normalised to -16 LUFS (EBU R128).

Run: python tools/build_bgm.py   (needs ffmpeg on PATH)
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = r'E:/LAO/Google_QA/Assets/AssetBundleResource/Sounds/BGM'
OUT = os.path.join(ROOT, 'assets', 'bgm')

# name -> original file (None: keep re-normalising the file already in assets/bgm)
TRACKS = {
    'title': '01 BGM_Title.mp3',
    'battle': '03 BGM_Battle_01.mp3',
    'battle5': '30 BGM_Battle_05.mp3',
    'battle2': '12 BGM_Battle_03.mp3',
    'march': '54 BGM_Stronghold_March.mp3',
    'battle4': None,
    'tension1': '67 BGM_tension01.mp3',
    'stage10': '50 BGM_Battle_10Stage.mp3',
    'outctrl': '58 BGM_Out_Of_Control.mp3',
    'horror2': '63 BGM_Horror2.mp3',
    'northern': '69 BGM_Northern_Front.mp3',
    'tension2': '68 BGM_tension02.mp3',
    'battle3': None,
    'boss': '04 BGM_Battle_Boss_01.mp3',
    'boss2': None,
    'boss3': None,
    'bossGamma': '72 BGM_Gamma_Boss.mp3',
    'bossZeta': '73 BGM_Zeta Boss.mp3',
    'bossFinal': None,
    'shop': None,
    'aftermath': '07 BGM_Talk_01.mp3',
    'boss10': '51 BGM_Battle_Boss_10Stage.mp3',
    'ending': None,
}


def run(src, dst):
    tmp = dst + '.tmp.mp3'
    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', src, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-b:a', '128k', tmp]
    subprocess.run(cmd, check=True)
    os.replace(tmp, dst)


def main():
    keep = os.path.join(ROOT, 'tools', '_bgm_orig')
    os.makedirs(keep, exist_ok=True)
    for name, orig in TRACKS.items():
        dst = os.path.join(OUT, name + '.mp3')
        if orig:
            src = os.path.join(SRC, orig)
        else:
            # first run: keep the untouched copy so re-runs never normalise twice
            src = os.path.join(keep, name + '.mp3')
            if not os.path.exists(src):
                shutil.copy(dst, src)
        run(src, dst)
        print(name, os.path.getsize(dst) // 1024, 'KB')


if __name__ == '__main__':
    sys.exit(main())
