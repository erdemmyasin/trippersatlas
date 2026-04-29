/**
 * Kağıt / açık gri zemini şeffaf yapar; koyu çizgiyi korur.
 * Çalıştır: npm install sharp --no-save && node scripts/removeGlobePaperBg.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const input = path.join(root, 'public', '_globe-source.png');
const output = path.join(root, 'public', 'landing-globe-line.png');

const LUM_CUT = 168; /* altı mürekkep / kenar; üstü zemin */
const MIN_CH = 18; /* çok düşük chroma = nötr gri kağıt */

function processRgba(buf, w, h) {
  const out = Buffer.from(buf);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const chroma = mx - mn;
      const isInk = lum < LUM_CUT;
      const isNeutralPaper = chroma < MIN_CH && lum >= LUM_CUT - 8;
      if (!isInk && isNeutralPaper) {
        out[i + 3] = 0;
      } else if (!isInk && lum >= LUM_CUT + 5) {
        out[i + 3] = 0;
      }
    }
  }
  return out;
}

async function main() {
  if (!fs.existsSync(input)) {
    console.error('Missing', input);
    process.exit(1);
  }
  const meta = await sharp(input).metadata();
  const w = meta.width;
  const h = meta.height;
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) {
    console.error('Expected RGBA');
    process.exit(1);
  }

  const rgba = processRgba(data, w, h);
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(output);

  fs.unlinkSync(input);
  console.log('Wrote', output, `${w}x${h}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
