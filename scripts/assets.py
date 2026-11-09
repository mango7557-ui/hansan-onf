from pathlib import Path
import urllib.request, io
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public' / 'images'
root.mkdir(parents=True, exist_ok=True)
sources = {
 'hero': 'https://sspark.genspark.ai/i/jmb4sOp3HsPf631G?width=2560',
 'field': 'https://sspark.genspark.ai/i/3dkHxtHAWWPWn8qV?width=2560',
 'soybean': 'https://cdn-optimized.imweb.me/upload/S20250317d342dcf50aa19/218fa03c8d2a3.jpg?w=750',
 'sunflower': 'https://cdn-optimized.imweb.me/upload/S20250317d342dcf50aa19/dd360a3331295.jpg?w=750',
}
for name,url in sources.items():
 request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
 image=Image.open(io.BytesIO(urllib.request.urlopen(request,timeout=45).read())).convert('RGB')
 image.thumbnail((1800,1400))
 image.save(root/f'{name}.webp', 'WEBP', quality=88)
 print(name, image.size, (root/f'{name}.webp').stat().st_size)
