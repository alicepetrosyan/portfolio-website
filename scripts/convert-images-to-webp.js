/*
 * Converts project cover + gallery images (and the one HEIC source) to WebP,
 * writing a `.webp` twin next to each original and leaving originals intact.
 *
 * Usage: node scripts/convert-images-to-webp.js
 *
 * Feature: chrome-3d-folders (Requirements 6.1, 6.2)
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// Sources referenced by src/data/projects.json (covers + gallery) plus the
// lone HEIC file. Originals are retained; a .webp twin is produced for each.
const SOURCES = [
  'icon-placeholder.jpg',
  'melodie.jpg',
  'rear-wing.jpg',
  'servo-depositor.jpg',
  'tsi-nozzle.png',
  '1.heic',
  // About section placeholder image (static, until the 3D model is ready).
  'photostack1.jpg',
  // chaiko project cover + gallery images (PNG sources).
  'chaiko_home_page.png',
  'chaiko_assy_mockup.png',
  'chaiko_machine_config.png',
  'chaiko_recipe_create.png',
  'chaiko-mockup-render.png',
  // apex servo depositor + related gallery images.
  'servo-depositor.jpg',
  'servo-deposit-results.jpg',
  'servo-hmi-1.jpg',
  'servo-hmi-2.jpg',
  'servo-hmi-3.jpg',
  'servo-hmi-4.jpg',
  'apex-cookie-decorating.jpg',
];

async function convertOne(fileName) {
  const srcPath = path.join(IMAGES_DIR, fileName);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  skip (missing): ${fileName}`);
    return { ok: false, skipped: true };
  }
  const base = fileName.replace(/\.[^.]+$/, '');
  const outPath = path.join(IMAGES_DIR, `${base}.webp`);
  try {
    await sharp(srcPath).webp({ quality: 82 }).toFile(outPath);
  } catch (err) {
    // Some HEIC files require an HEVC decoder plugin (libde265) that is not in
    // sharp's prebuilt binaries. Warn and continue rather than aborting the
    // whole run — the project images (the ones actually referenced by the app)
    // still convert. A failed source simply keeps using its original format.
    console.warn(`  WARN could not convert ${fileName}: ${err.message.split('\n')[0]}`);
    return { ok: false, skipped: false };
  }
  const before = fs.statSync(srcPath).size;
  const after = fs.statSync(outPath).size;
  const pct = Math.round((1 - after / before) * 100);
  console.log(`  ${fileName} -> ${base}.webp  (${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB, -${pct}%)`);
  return { ok: true };
}

async function main() {
  console.log('Converting project images to WebP...');
  let failures = 0;
  for (const file of SOURCES) {
    // eslint-disable-next-line no-await-in-loop
    const result = await convertOne(file);
    if (!result.ok && !result.skipped) failures += 1;
  }
  console.log(`Done.${failures ? ` (${failures} source(s) could not be converted and will use their original format)` : ''}`);
}

main().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
