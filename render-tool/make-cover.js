// Builds a SQUARE cover image from the wide chaiko render by center-cropping it
// (full height, trimming the left/right edges). The folder thumbnail center-
// crops its cover to a square anyway, so a square cover makes the folder and the
// modal consistent and keeps the cover edge-to-edge with no padding.
//
// Usage: node render-tool/make-cover.js

const path = require('path');
const sharp = require('sharp');

const IMAGES = path.resolve(__dirname, '..', 'public', 'images');
const SRC = path.join(IMAGES, 'chaiko-mockup-render.png');
const OUT_PNG = path.join(IMAGES, 'chaiko-cover.png');
const OUT_WEBP = path.join(IMAGES, 'chaiko-cover.webp');

async function main() {
  const meta = await sharp(SRC).metadata();
  const side = Math.min(meta.width, meta.height); // square side = the shorter edge

  // Center-crop the wide render to a square (full height, trim left/right).
  const squareBuf = await sharp(SRC)
    .resize(side, side, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  await sharp(squareBuf).png().toFile(OUT_PNG);
  const webpInfo = await sharp(squareBuf).webp({ quality: 90 }).toFile(OUT_WEBP);

  console.log(`Square cover written (${side}x${side}):`);
  console.log('  ' + OUT_PNG);
  console.log('  ' + OUT_WEBP + `  (${Math.round(webpInfo.size / 1024)}KB)`);
}

main().catch((e) => { console.error('COVER FAILED:', e.message); process.exit(1); });
