# PWA Icons Guide

## Required Icon Sizes

For a complete PWA experience, you need to create icons in the following sizes:

### App Icons
- 16x16px - `icon-16x16.png` (Favicon)
- 32x32px - `icon-32x32.png` (Favicon)
- 72x72px - `icon-72x72.png` (Android)
- 96x96px - `icon-96x96.png` (Android)
- 128x128px - `icon-128x128.png` (Android)
- 144x144px - `icon-144x144.png` (Android)
- 152x152px - `icon-152x152.png` (iOS)
- 180x180px - `icon-180x180.png` (iOS)
- 192x192px - `icon-192x192.png` (Android)
- 384x384px - `icon-384x384.png` (Android)
- 512x512px - `icon-512x512.png` (Android, splash screen)

## How to Create Icons

### Option 1: Using Online Tools
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon (minimum 512x512px)
3. Download all generated sizes
4. Place them in this folder

### Option 2: Using ImageMagick (Command Line)
```bash
# Start with a 512x512px PNG image called "logo.png"
convert logo.png -resize 16x16 icon-16x16.png
convert logo.png -resize 32x32 icon-32x32.png
convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 180x180 icon-180x180.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

### Option 3: Using Python (PIL/Pillow)
```python
from PIL import Image

sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512]
img = Image.open('logo.png')

for size in sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(f'icon-{size}x{size}.png')
```

## Design Guidelines

### Icon Content
- Use simple, recognizable imagery
- Avoid text (small icons won't be readable)
- Use solid colors or subtle gradients
- Ensure good contrast

### Safe Zone
- Keep important content within the center 80% of the image
- Android uses circular masks on some devices
- iOS rounds corners automatically

### Recommended Theme
- Primary Color: #667eea (Purple/Blue)
- Secondary Color: #764ba2 (Deep Purple)
- Background: White or transparent

## Testing Your Icons

1. Start the Flask server: `python server.py`
2. Open Chrome on Android
3. Visit your site
4. Menu → "Install app" or "Add to Home Screen"
5. Check if icons appear correctly

## Temporary Placeholder

Until you create proper icons, the app will still work but may show:
- Default browser icons
- Broken image placeholders
- Generic PWA symbols

This doesn't affect functionality, only appearance.
