import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ACCENT = '#c92a2a';
const TEXT_COLOR = '#e4e4e7';
const BG_COLOR = '#0e0e14';

function buildSvg(size, { withBackground = false } = {}) {
  const bg = withBackground ? `<rect width="32" height="32" rx="4" fill="${BG_COLOR}"/>` : '';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  ${bg}
  <polyline points="1,8 7,16 1,24" fill="none" stroke="${ACCENT}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="9" y="25" font-family="'Fira Code', monospace" font-size="22" font-weight="700" fill="${TEXT_COLOR}" letter-spacing="-3">fk</text>
  <line x1="26" y1="28" x2="31" y2="28" stroke="${ACCENT}" stroke-width="2.8" stroke-linecap="round"/>
</svg>`);
}

async function generate() {
  console.log('Generating favicon raster assets...\n');

  const appleTouchIcon = sharp(buildSvg(180, { withBackground: true }))
    .resize(180, 180)
    .png()
    .toFile(resolve(root, 'src/apple-touch-icon.png'));

  const icon192 = sharp(buildSvg(192, { withBackground: true }))
    .resize(192, 192)
    .png()
    .toFile(resolve(root, 'src/assets/icons/icon-192.png'));

  const icon512 = sharp(buildSvg(512, { withBackground: true }))
    .resize(512, 512)
    .png()
    .toFile(resolve(root, 'src/assets/icons/icon-512.png'));

  await Promise.all([appleTouchIcon, icon192, icon512]);
  console.log('  apple-touch-icon.png  (180x180)');
  console.log('  icon-192.png          (192x192)');
  console.log('  icon-512.png          (512x512)');

  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map((s) =>
      sharp(buildSvg(s, { withBackground: false }))
        .resize(s, s)
        .png()
        .toBuffer(),
    ),
  );

  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync(resolve(root, 'src/favicon.ico'), icoBuffer);
  console.log('  favicon.ico           (16/32/48)');

  console.log('\nDone.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
