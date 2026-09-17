"""Build lightweight display variants from the retained full-resolution PNGs.

The original files remain untouched. Display copies use Lanczos downsampling
and lossless WebP encoding to preserve text and linework at each target size.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'docs/assets/figures'
NAMES = ['pruning_figure', 'runtime_overview_figure', 'optimization_figure']
WIDTHS = [1200, 2400, 4800]

def build():
    for name in NAMES:
        with Image.open(ROOT / (name + '.png')) as original:
            for width in WIDTHS:
                size = (width, round(original.height * width / original.width))
                preview = original.resize(size, Image.Resampling.LANCZOS)
                target = ROOT / f'{name}-{width}.webp'
                preview.save(target, lossless=True, method=6)
                print(f'{target.name}: {target.stat().st_size:,} bytes, {size}')

if __name__ == '__main__':
    build()
