"""Levels assets/sfx/*.mp3: every effect is brought to a common mean level (-20 dB) without letting its peak
pass -1 dBFS, so the per-key mix weights in js/audio.js (VOLS) start from an even base.

Untouched copies live in tools/_sfx_orig (made on the first run), so re-runs never stack gain.
Run: python tools/build_sfx.py   (needs ffmpeg on PATH)
"""
import os
import re
import shutil
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SFX = os.path.join(ROOT, 'assets', 'sfx')
ORIG = os.path.join(ROOT, 'tools', '_sfx_orig')
TARGET_MEAN, PEAK = -20.0, -1.0


def levels(path):
    out = subprocess.run(['ffmpeg', '-v', 'info', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean = float(re.search(r'mean_volume: (-?[\d.]+) dB', out).group(1))
    peak = float(re.search(r'max_volume: (-?[\d.]+) dB', out).group(1))
    return mean, peak


def main():
    os.makedirs(ORIG, exist_ok=True)
    for name in sorted(os.listdir(SFX)):
        if not name.endswith('.mp3'):
            continue
        src = os.path.join(ORIG, name)
        if not os.path.exists(src):
            shutil.copy(os.path.join(SFX, name), src)
        mean, peak = levels(src)
        gain = max(-12.0, min(12.0, TARGET_MEAN - mean, PEAK - peak))
        dst = os.path.join(SFX, name)
        tmp = dst + '.tmp.mp3'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-af', 'volume=%.2fdB' % gain, '-b:a', '128k', tmp], check=True)
        os.replace(tmp, dst)
        print('%-12s mean %6.1f peak %5.1f  gain %+5.1f' % (name, mean, peak, gain))


if __name__ == '__main__':
    main()
