/* Compares two folders of screenshots from tools/screens.mjs, pixel for pixel.
     node tools/compare-screens.mjs <dirA> <dirB>
   Prints "identical" or the box that differs for each PNG in dirA, and exits 1 if any differ or are missing.
   Decodes PNG itself (8-bit RGB/RGBA, non-interlaced, which is what Chrome writes), so it needs no packages. */
import {readFileSync, readdirSync, existsSync} from "node:fs";
import {inflateSync} from "node:zlib";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

export function decodePng(buf) {
  let p = 8, w, h, type, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), kind = buf.toString("ascii", p + 4, p + 8), body = buf.subarray(p + 8, p + 8 + len);
    if (kind === "IHDR") { w = body.readUInt32BE(0); h = body.readUInt32BE(4); type = body[9]; if (body[8] !== 8 || body[12]) throw new Error("only 8-bit non-interlaced PNG") }
    else if (kind === "IDAT") idat.push(body);
    else if (kind === "IEND") break;
    p += 12 + len;
  }
  const bpp = {2: 3, 6: 4}[type]; if (!bpp) throw new Error("only RGB or RGBA PNG");
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[row + x - bpp] : 0, b = y ? px[row - stride + x] : 0, c = x >= bpp && y ? px[row - stride + x - bpp] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
      px[row + x] = (raw[src + x] + pred) & 255;
    }
  }
  return {w, h, bpp, px};
}

export function diffBox(a, b) {
  if (a.w !== b.w || a.h !== b.h) return `size ${a.w}x${a.h} vs ${b.w}x${b.h}`;
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) for (let c = 0; c < 3; c++)
    if (a.px[(y * a.w + x) * a.bpp + c] !== b.px[(y * b.w + x) * b.bpp + c]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); break }
  return x1 < 0 ? null : `differs in box ${x0},${y0} to ${x1},${y1}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [A, B] = process.argv.slice(2);
  let bad = 0;
  for (const f of readdirSync(A).filter(f => f.endsWith(".png"))) {
    if (!existsSync(join(B, f))) { console.log(`${f}: missing in ${B}`); bad++; continue }
    const d = diffBox(decodePng(readFileSync(join(A, f))), decodePng(readFileSync(join(B, f))));
    console.log(`${f}: ${d || "identical"}`); if (d) bad++;
  }
  process.exit(bad ? 1 : 0);
}
