// Converts the rendered PNG to WebP using sharp.
// Usage: node render-tool/to-webp.js [input.png] [output.webp]

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const input = process.argv[2] || path.resolve(__dirname, '..', 'public', 'images', 'chaiko-mockup-render.png');
const output = process.argv[3] || input.replace(/\.png$/i, '.webp');

sharp(input)
  .webp({ quality: 90 })
  .toFile(output)
  .then((info) => {
    const inKB = Math.round(fs.statSync(input).size / 1024);
    const outKB = Math.round(info.size / 1024);
    console.log(`WebP written: ${output}`);
    console.log(`  ${info.width}x${info.height}  ${inKB}KB (png) -> ${outKB}KB (webp)`);
  })
  .catch((e) => { console.error('CONVERT FAILED:', e.message); process.exit(1); });
