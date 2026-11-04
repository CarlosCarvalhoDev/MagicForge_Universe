import { inflateSync } from 'node:zlib';

// Test-only reader for the non-interlaced 8-bit RGBA sprite files checked into this repo.
export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('Invalid PNG signature');
  }
  let w, h;
  const compressed = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new Error('Truncated PNG chunk');
    const chunk = buffer.subarray(offset + 8, end - 4);
    if (type === 'IHDR') {
      w = chunk.readUInt32BE(0);
      h = chunk.readUInt32BE(4);
      if (chunk[8] !== 8 || chunk[9] !== 6 || chunk[10] || chunk[11] || chunk[12]) {
        throw new Error('Test PNG reader requires non-interlaced 8-bit RGBA');
      }
    } else if (type === 'IDAT') compressed.push(chunk);
    offset = end;
    if (type === 'IEND') break;
  }
  if (!w || !h) throw new Error('Missing PNG dimensions');
  const stride = w * 4;
  const raw = inflateSync(Buffer.concat(compressed));
  if (raw.length !== h * (stride + 1)) throw new Error('Invalid PNG scanline length');
  const data = Buffer.alloc(w * h * 4);
  const paeth = (a, b, c) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw new Error('Invalid PNG filter');
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const left = x >= 4 ? data[i - 4] : 0;
      const up = y > 0 ? data[i - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? data[i - stride - 4] : 0;
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upperLeft)][filter];
      data[i] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  return { w, h, data };
}
