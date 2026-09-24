from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/upload/2.webp')
out_dir = Path('/home/ubuntu/SnoLab/public/brand')
out_dir.mkdir(parents=True, exist_ok=True)

image = Image.open(source).convert('RGBA')
alpha = image.getchannel('A')
bbox = alpha.getbbox()
if bbox is None:
    raise RuntimeError('The source logo has no visible pixels')

# Keep a small transparent safety margin around the mark.
pad = 18
left = max(0, bbox[0] - pad)
top = max(0, bbox[1] - pad)
right = min(image.width, bbox[2] + pad)
bottom = min(image.height, bbox[3] + pad)
cropped = image.crop((left, top, right, bottom))

# The supplied mark uses white "Sno" lettering. For light UI surfaces,
# recolor only the text area while preserving the white cube and blue icon.
light = cropped.copy()
pixels = light.load()
text_cutoff = int(light.width * 0.48)
for y in range(light.height):
    for x in range(min(text_cutoff, light.width)):
        r, g, b, a = pixels[x, y]
        if a > 0 and r > 220 and g > 220 and b > 220:
            pixels[x, y] = (11, 31, 58, a)

cropped.save(out_dir / 'snolab-official-dark.png', format='PNG', optimize=True)
light.save(out_dir / 'snolab-official-light.png', format='PNG', optimize=True)
# WebP copies keep the original high-resolution raster while reducing payload.
cropped.save(out_dir / 'snolab-official-dark.webp', format='WEBP', lossless=True, method=6)
light.save(out_dir / 'snolab-official-light.webp', format='WEBP', lossless=True, method=6)

# Keep a separate icon-only asset for compact navigation layouts. The icon is
# isolated from the wordmark and then trimmed to its visible alpha bounds.
icon_left = int(cropped.width * 0.59)
icon_dark = cropped.crop((icon_left, 0, cropped.width, cropped.height))
icon_light = light.crop((icon_left, 0, light.width, light.height))
icon_bbox = icon_dark.getchannel('A').getbbox()
if icon_bbox is None:
    raise RuntimeError('The icon crop has no visible pixels')
icon_pad = 14
ix0 = max(0, icon_bbox[0] - icon_pad)
iy0 = max(0, icon_bbox[1] - icon_pad)
ix1 = min(icon_dark.width, icon_bbox[2] + icon_pad)
iy1 = min(icon_dark.height, icon_bbox[3] + icon_pad)
icon_dark = icon_dark.crop((ix0, iy0, ix1, iy1))
icon_light = icon_light.crop((ix0, iy0, ix1, iy1))
icon_dark.save(out_dir / 'snolab-official-icon-dark.png', format='PNG', optimize=True)
icon_light.save(out_dir / 'snolab-official-icon-light.png', format='PNG', optimize=True)
icon_dark.save(out_dir / 'snolab-official-icon-dark.webp', format='WEBP', lossless=True, method=6)
icon_light.save(out_dir / 'snolab-official-icon-light.webp', format='WEBP', lossless=True, method=6)
print(f'source={image.size} bbox={bbox} output={cropped.size}')
for path in sorted(out_dir.glob('snolab-official-*')):
    with Image.open(path) as out:
        print(path.name, out.size, out.mode, path.stat().st_size)
