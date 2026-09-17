"""Import the author-supplied 15360px figures without resampling their pixels.

Coordinates below use a 2048px-wide reference canvas. Only the extra black
separator rules in the topology figure are erased; all artwork is retained.
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

Image.MAX_IMAGE_PIXELS = 160_000_000
ROOT = Path(__file__).resolve().parents[1]
SPECS = [
    ('pruning_figure', (415, 218, 1682, 645), [
        (420, 424, 1288, 430), (1281, 218, 1287, 430),
        (1191, 426, 1197, 557), (1191, 552, 1281, 558),
        (1275, 554, 1281, 640),
    ]),
    ('runtime_overview_figure', (167, 375, 1837, 808), []),
    ('optimization_figure', (130, 325, 1835, 783), []),
]

def prepare(paths):
    for path, (name, crop, rectangles) in zip(paths, SPECS):
        with Image.open(path) as source:
            assert source.size == (15360, 8640), source.size
            original = source.convert('RGB')
        image = original.copy()
        mask = Image.new('L', image.size)
        draw, mask_draw = ImageDraw.Draw(image), ImageDraw.Draw(mask)
        scale = lambda box: tuple(round(v * 7.5) for v in box)
        for rect in rectangles:
            draw.rectangle(scale(rect), fill='white')
            mask_draw.rectangle(scale(rect), fill=255)
        difference = ImageChops.difference(original, image)
        difference.paste(0, mask=mask)
        assert difference.getbbox() is None, 'Pixels outside the approved masks changed'
        image = image.crop(scale(crop))
        target = ROOT / 'docs/assets/figures' / (name + '.png')
        image.save(target, optimize=True)
        image.save(target.with_suffix('.webp'), lossless=True, method=6)
        with Image.open(target.with_suffix('.webp')) as check:
            assert ImageChops.difference(image, check.convert('RGB')).getbbox() is None
        print(name, image.size, target.stat().st_size, 'bytes; no resampling')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('images', nargs=3, help='Topology, runtime, optimization JPEGs')
    prepare(parser.parse_args().images)
