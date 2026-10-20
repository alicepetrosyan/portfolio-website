/*
 * Draco-compresses the hero 3D name model — LOSSLESS geometry.
 *
 * Usage:
 *   1. Put the uncompressed source at public/assets/models/hero_section.glb
 *   2. node scripts/compress-hero-model.js
 *   3. It writes public/assets/models/hero_section.draco.glb (the file the app
 *      loads, via HERO_NAME_MODEL_URL in src/utils/modelPaths.js).
 *
 * This uses the @gltf-transform CLI `draco` command, which ONLY applies Draco
 * geometry compression. It intentionally does NOT run `optimize`, because
 * optimize bundles a mesh `simplify` (decimation) pass that visibly degrades
 * the chrome lettering (faceted edges). Draco compression alone keeps every
 * vertex — it only shrinks how the geometry is stored — so the model looks
 * identical to the source while the file shrinks dramatically.
 *
 * The Draco-compressed GLB needs a Draco decoder at runtime; a local copy lives
 * in public/draco (see DRACO_DECODER_PATH), so no CDN is required.
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'assets', 'models');
const SRC = path.join(MODELS_DIR, 'hero_section.glb');
const OUT = path.join(MODELS_DIR, 'hero_section.draco.glb');

if (!fs.existsSync(SRC)) {
  console.error(
    `Source model not found: ${SRC}\n` +
      'Place the uncompressed hero_section.glb there and re-run.'
  );
  process.exit(1);
}

console.log('Compressing hero model (Draco geometry only, lossless)...');
// `shell: true` is required on Windows to spawn the `npx` .cmd shim (spawning
// npx.cmd directly throws EINVAL). Higher-than-default quantization keeps the
// geometry crisp (no z-fighting shimmer from over-quantized positions).
execFileSync(
  'npx',
  ['gltf-transform', 'draco', SRC, OUT, '--quantize-position', '16', '--quantize-normal', '12'],
  { stdio: 'inherit', shell: true }
);

const before = fs.statSync(SRC).size;
const after = fs.statSync(OUT).size;
console.log(
  `Done: ${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024).toFixed(1)} KB ` +
    `(-${Math.round((1 - after / before) * 100)}%)`
);
console.log('The app loads the .draco.glb; keep the original .glb as a backup.');
