from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public'/'images'
for name in ['oil-sculpture','culinary-study','oil-study']:
    source=root/f'{name}.png'
    im=Image.open(source).convert('RGB')
    im.save(root/f'{name}.webp','WEBP',quality=91,method=6)
    print(name,im.size,(root/f'{name}.webp').stat().st_size)
for name in ['soybean','sunflower']:
    im=Image.open(root/f'{name}-cutout.png').convert('RGBA')
    im.save(root/f'{name}-cutout.webp','WEBP',quality=95,method=6)
    print(name+'-cutout',im.size,(root/f'{name}-cutout.webp').stat().st_size)
