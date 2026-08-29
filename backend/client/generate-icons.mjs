import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="40" fill="url(#grad)"/>
  <circle cx="96" cy="96" r="50" fill="white" opacity="0.9"/>
  <path d="M76 96 L88 108 L116 80" stroke="#4f46e5" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const publicDir = './public';
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const filename = `icon-${size}x${size}.png`;
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, filename));
    console.log(`Generated: ${filename}`);
  }
  
  // Generate maskable icon (with padding)
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="transparent"/>
    <circle cx="256" cy="256" r="200" fill="#4f46e5"/>
    <circle cx="256" cy="256" r="150" fill="white" opacity="0.9"/>
    <path d="M206 256 L236 286 L306 216" stroke="#4f46e5" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
  
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512-maskable.png'));
  console.log('Generated: icon-512x512-maskable.png');
  
  console.log('Done!');
}

generateIcons().catch(console.error);
