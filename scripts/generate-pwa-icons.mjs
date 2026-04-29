import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.resolve("public/icons");
const PURPLE = "#8B5CF6";
const WHITE = "#FFFFFF";

function pawSvg({ size, bg = PURPLE, pad = 0 }) {
  const inner = size - pad * 2;
  const center = size / 2;
  const pawCenterY = center + inner * 0.06;

  // Paw geometry tuned to read well at 192px.
  const toeR = inner * 0.085;
  const toeY = pawCenterY - inner * 0.20;
  const toeDx = inner * 0.14;

  const bigR = inner * 0.16;
  const bigY = pawCenterY + inner * 0.06;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" ry="${Math.round(size * 0.22)}" fill="${bg}" />
  <g fill="${WHITE}">
    <circle cx="${center - toeDx}" cy="${toeY}" r="${toeR}" />
    <circle cx="${center}" cy="${toeY - inner * 0.02}" r="${toeR}" />
    <circle cx="${center + toeDx}" cy="${toeY}" r="${toeR}" />
    <circle cx="${center}" cy="${bigY}" r="${bigR}" />
  </g>
</svg>`;
}

async function writePng({ filename, size, pad = 0 }) {
  const svg = pawSvg({ size, pad });
  const buf = Buffer.from(svg);
  const outPath = path.join(OUT_DIR, filename);

  await sharp(buf, { density: 300 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  await writePng({ filename: "icon-192.png", size: 192 });
  await writePng({ filename: "icon-512.png", size: 512 });

  // Maskable: add safe-zone padding so the paw survives adaptive icon clipping.
  // Android guidance typically keeps critical content in the center ~80% area.
  await writePng({ filename: "icon-maskable-512.png", size: 512, pad: 512 * 0.10 });

  // Apple touch icon is conventionally 180x180.
  await writePng({ filename: "apple-touch-icon.png", size: 180 });

  // A favicon-sized square can be handy, but we don't generate it by default.
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

