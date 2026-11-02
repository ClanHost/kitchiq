const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to create uncompressed/deflated RGBA PNG
function createPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6: RGBA
  ihdrData.writeUInt8(0, 10); // compression 0
  ihdrData.writeUInt8(0, 11); // filter 0
  ihdrData.writeUInt8(0, 12); // interlace 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) before each row
  // Let's draw an emerald green rounded background with a white kitchen fridge/cart shape in the center
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);

      // Check squircle / rounded box
      const isInsideCard = (Math.pow(dx / radius, 4) + Math.pow(dy / radius, 4)) <= 1.0;

      if (!isInsideCard) {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Inside card: Brand emerald color #059669 -> #0d9488
      let pr = 5;
      let pg = 150 + Math.floor((x / width) * 20);
      let pb = 105 + Math.floor((y / height) * 30);
      let pa = 255;

      // Draw fridge silhouette in center
      const fx = x / width;
      const fy = y / height;
      if (fx >= 0.28 && fx <= 0.72 && fy >= 0.22 && fy <= 0.78) {
        // Fridge body
        pr = 255;
        pg = 255;
        pb = 255;

        // Freezer split line
        if (Math.abs(fy - 0.42) < 0.015) {
          pr = 226;
          pg = 232;
          pb = 240;
        }

        // Screen area
        if (fx >= 0.38 && fx <= 0.62 && fy >= 0.27 && fy <= 0.37) {
          pr = 15;
          pg = 23;
          pb = 42;
          // small screen dots
          if (fx >= 0.42 && fx <= 0.46 && fy >= 0.30 && fy <= 0.34) {
            pr = 16;
            pg = 185;
            pb = 129;
          }
        }

        // Handles
        if (fx >= 0.31 && fx <= 0.34 && ((fy >= 0.30 && fy <= 0.38) || (fy >= 0.46 && fy <= 0.60))) {
          pr = 5;
          pg = 150;
          pb = 105;
        }

        // Barcode lines in lower section
        if (fy >= 0.50 && fy <= 0.64 && fx >= 0.40 && fx <= 0.66) {
          const barIdx = Math.floor((fx - 0.40) * 100);
          if (barIdx % 6 < 3) {
            pr = 30;
            pg = 41;
            pb = 59;
          }
          // Laser beam
          if (Math.abs(fy - 0.57) < 0.01) {
            pr = 239;
            pg = 68;
            pb = 68;
          }
        }
      }

      rawData[pixelOffset] = pr;
      rawData[pixelOffset + 1] = pg;
      rawData[pixelOffset + 2] = pb;
      rawData[pixelOffset + 3] = pa;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatCompressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32 calculation
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Precomputed CRC table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512));

console.log('Successfully generated PNG icons in public directory!');
