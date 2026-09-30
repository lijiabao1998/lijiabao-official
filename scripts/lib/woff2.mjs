// scripts/lib/woff2.mjs — WOFF2 → TrueType (sfnt) in plain Node (zlib has Brotli), for scripts/og.mjs.
// sharp's FreeType build cannot open WOFF2, and the only Geist files on disk are the woff2 subsets the Fonts API
// downloaded for the site, so the OG cards decode those instead of adding a dependency or a download.
// Implements the W3C WOFF2 spec (2024): table directory, Brotli stream, the glyf/loca transform (version 0)
// and the hmtx transform (version 1). TrueType flavour only (Geist and Geist Mono are glyf fonts).

import { brotliDecompressSync } from 'node:zlib';

const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ',
  'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS',
  'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc',
  'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop',
  'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

class Reader {
  constructor(buf, off = 0) {
    this.b = buf;
    this.o = off;
  }
  u8() {
    return this.b.readUInt8(this.o++);
  }
  u16() {
    const v = this.b.readUInt16BE(this.o);
    this.o += 2;
    return v;
  }
  i16() {
    const v = this.b.readInt16BE(this.o);
    this.o += 2;
    return v;
  }
  u32() {
    const v = this.b.readUInt32BE(this.o);
    this.o += 4;
    return v;
  }
  bytes(n) {
    const v = this.b.subarray(this.o, this.o + n);
    this.o += n;
    return v;
  }
  base128() {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const b = this.u8();
      if (i === 0 && b === 0x80) throw new Error('woff2: UIntBase128 with a leading zero');
      if (v & 0xfe000000) throw new Error('woff2: UIntBase128 overflow');
      v = (v << 7) | (b & 0x7f);
      if (!(b & 0x80)) return v >>> 0;
    }
    throw new Error('woff2: UIntBase128 longer than 5 bytes');
  }
  u255() {
    const code = this.u8();
    if (code === 253) return this.u16();
    if (code === 255) return this.u8() + 253;
    if (code === 254) return this.u8() + 253 * 2;
    return code;
  }
}

const withSign = (flag, v) => (flag & 1 ? v : -v);

/** One point of the glyf transform's triplet encoding → [dx, dy]. */
function triplet(flag, r) {
  const f = flag & 0x7f;
  if (f < 10) return [0, withSign(f, ((f & 14) << 7) + r.u8())];
  if (f < 20) return [withSign(f, (((f - 10) & 14) << 7) + r.u8()), 0];
  if (f < 84) {
    const b0 = f - 20;
    const b1 = r.u8();
    return [withSign(f, 1 + (b0 & 0x30) + (b1 >> 4)), withSign(f >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f))];
  }
  if (f < 120) {
    const b0 = f - 84;
    const x = r.u8();
    const y = r.u8();
    return [withSign(f, 1 + (Math.floor(b0 / 12) << 8) + x), withSign(f >> 1, 1 + (((b0 % 12) >> 2) << 8) + y)];
  }
  if (f < 124) {
    const b0 = r.u8();
    const b1 = r.u8();
    const b2 = r.u8();
    return [withSign(f, (b0 << 4) + (b1 >> 4)), withSign(f >> 1, ((b1 & 0x0f) << 8) + b2)];
  }
  const x = r.u16();
  const y = r.u16();
  return [withSign(f, x), withSign(f >> 1, y)];
}

/** Rebuild glyf + loca from the transformed glyf table. Returns { glyf, loca, xMins, indexFormat }. */
function untransformGlyf(data) {
  const r = new Reader(data);
  r.u16(); // reserved
  const optionFlags = r.u16();
  const numGlyphs = r.u16();
  const indexFormat = r.u16();
  const sizes = Array.from({ length: 7 }, () => r.u32());
  let o = r.o;
  const streams = sizes.map((s) => {
    const sub = new Reader(data.subarray(o, o + s));
    o += s;
    return sub;
  });
  const [nContour, nPoints, flagS, glyphS, compS, bboxS, instS] = streams;
  const overlap = optionFlags & 1 ? data.subarray(o, o + ((numGlyphs + 7) >> 3)) : null;
  const bitmapLen = ((numGlyphs + 31) >> 5) << 2;
  const bboxBitmap = bboxS.bytes(bitmapLen);
  const hasBbox = (i) => (bboxBitmap[i >> 3] & (0x80 >> (i & 7))) !== 0;

  const out = [];
  const offsets = [0];
  const xMins = new Int16Array(numGlyphs);
  let total = 0;
  for (let gi = 0; gi < numGlyphs; gi++) {
    const n = nContour.i16();
    let glyph;
    if (n === 0) {
      if (hasBbox(gi)) throw new Error('woff2: empty glyph with a bbox');
      glyph = Buffer.alloc(0);
    } else if (n > 0) {
      const ends = [];
      let pts = 0;
      for (let c = 0; c < n; c++) {
        pts += nPoints.u255();
        ends.push(pts - 1);
      }
      const xs = new Int32Array(pts);
      const ys = new Int32Array(pts);
      const on = new Uint8Array(pts);
      let x = 0;
      let y = 0;
      for (let p = 0; p < pts; p++) {
        const flag = flagS.u8();
        const [dx, dy] = triplet(flag, glyphS);
        x += dx;
        y += dy;
        xs[p] = x;
        ys[p] = y;
        on[p] = flag & 0x80 ? 0 : 1;
      }
      const instLen = glyphS.u255();
      const inst = instS.bytes(instLen);
      let bbox;
      if (hasBbox(gi)) bbox = [bboxS.i16(), bboxS.i16(), bboxS.i16(), bboxS.i16()];
      else {
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        for (let p = 0; p < pts; p++) {
          x0 = Math.min(x0, xs[p]);
          y0 = Math.min(y0, ys[p]);
          x1 = Math.max(x1, xs[p]);
          y1 = Math.max(y1, ys[p]);
        }
        bbox = pts ? [x0, y0, x1, y1] : [0, 0, 0, 0];
      }
      xMins[gi] = bbox[0];
      // simple glyph, every coordinate as a 16-bit delta (valid and simple to write)
      const size = 10 + 2 * n + 2 + instLen + pts + 4 * pts;
      const b = Buffer.alloc(size);
      let w = 0;
      b.writeInt16BE(n, w);
      w += 2;
      for (const v of bbox) {
        b.writeInt16BE(v, w);
        w += 2;
      }
      for (const e of ends) {
        b.writeUInt16BE(e, w);
        w += 2;
      }
      b.writeUInt16BE(instLen, w);
      w += 2;
      inst.copy(b, w);
      w += instLen;
      const ovl = overlap && overlap[gi >> 3] & (0x80 >> (gi & 7)) ? 0x40 : 0;
      for (let p = 0; p < pts; p++) b.writeUInt8(on[p] | (p === 0 ? ovl : 0), w++);
      let px = 0;
      for (let p = 0; p < pts; p++) {
        b.writeInt16BE(xs[p] - px, w);
        w += 2;
        px = xs[p];
      }
      let py = 0;
      for (let p = 0; p < pts; p++) {
        b.writeInt16BE(ys[p] - py, w);
        w += 2;
        py = ys[p];
      }
      glyph = b;
    } else {
      // composite: components from the composite stream, bbox always explicit
      if (!hasBbox(gi)) throw new Error('woff2: composite glyph without a bbox');
      const start = compS.o;
      let flags;
      let haveInstructions = false;
      do {
        flags = compS.u16();
        compS.u16(); // glyph index
        compS.o += flags & 0x0001 ? 4 : 2; // ARG_1_AND_2_ARE_WORDS
        if (flags & 0x0008) compS.o += 2; // WE_HAVE_A_SCALE
        else if (flags & 0x0040) compS.o += 4; // WE_HAVE_AN_X_AND_Y_SCALE
        else if (flags & 0x0080) compS.o += 8; // WE_HAVE_A_TWO_BY_TWO
        if (flags & 0x0100) haveInstructions = true; // WE_HAVE_INSTRUCTIONS
      } while (flags & 0x0020); // MORE_COMPONENTS
      const comp = compS.b.subarray(start, compS.o);
      const bbox = [bboxS.i16(), bboxS.i16(), bboxS.i16(), bboxS.i16()];
      xMins[gi] = bbox[0];
      let inst = Buffer.alloc(0);
      if (haveInstructions) inst = instS.bytes(glyphS.u255());
      const b = Buffer.alloc(10 + comp.length + (haveInstructions ? 2 + inst.length : 0));
      b.writeInt16BE(-1, 0);
      bbox.forEach((v, k) => b.writeInt16BE(v, 2 + 2 * k));
      comp.copy(b, 10);
      if (haveInstructions) {
        b.writeUInt16BE(inst.length, 10 + comp.length);
        inst.copy(b, 12 + comp.length);
      }
      glyph = b;
    }
    const pad = (4 - (glyph.length % 4)) % 4;
    out.push(glyph, Buffer.alloc(pad));
    total += glyph.length + pad;
    offsets.push(total);
  }
  const glyf = Buffer.concat(out);
  const loca = Buffer.alloc(indexFormat ? 4 * offsets.length : 2 * offsets.length);
  offsets.forEach((v, i) => (indexFormat ? loca.writeUInt32BE(v, 4 * i) : loca.writeUInt16BE(v >> 1, 2 * i)));
  return { glyf, loca, xMins, numGlyphs, indexFormat };
}

/** Rebuild hmtx from its transformed form (version 1). */
function untransformHmtx(data, numGlyphs, numHMetrics, xMins) {
  const r = new Reader(data);
  const flags = r.u8();
  const adv = Array.from({ length: numHMetrics }, () => r.u16());
  const lsb = Array.from({ length: numHMetrics }, (_, i) => (flags & 1 ? xMins[i] : r.i16()));
  const lsb2 = Array.from({ length: numGlyphs - numHMetrics }, (_, i) => (flags & 2 ? xMins[numHMetrics + i] : r.i16()));
  const b = Buffer.alloc(4 * numHMetrics + 2 * (numGlyphs - numHMetrics));
  let w = 0;
  for (let i = 0; i < numHMetrics; i++) {
    b.writeUInt16BE(adv[i], w);
    b.writeInt16BE(lsb[i], w + 2);
    w += 4;
  }
  for (const v of lsb2) {
    b.writeInt16BE(v, w);
    w += 2;
  }
  return b;
}

function checksum(buf) {
  const padded = buf.length % 4 ? Buffer.concat([buf, Buffer.alloc(4 - (buf.length % 4))]) : buf;
  let s = 0;
  for (let i = 0; i < padded.length; i += 4) s = (s + padded.readUInt32BE(i)) >>> 0;
  return s;
}

/** Decode a WOFF2 buffer into a TrueType font buffer. */
export function woff2ToSfnt(buf) {
  const r = new Reader(buf);
  if (r.u32() !== 0x774f4632) throw new Error('woff2: bad signature');
  const flavor = r.u32();
  r.u32(); // length
  const numTables = r.u16();
  r.u16(); // reserved
  r.u32(); // totalSfntSize
  const compressedSize = r.u32();
  r.o += 4 + 4 * 5; // version, meta*, priv*
  if (flavor === 0x74746366) throw new Error('woff2: font collections are not supported');

  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = r.u8();
    const tag = (flags & 0x3f) === 0x3f ? r.bytes(4).toString('latin1') : KNOWN_TAGS[flags & 0x3f];
    const version = flags >> 6;
    const origLength = r.base128();
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    const length = transformed ? r.base128() : origLength;
    tables.push({ tag, version, origLength, length, transformed });
  }
  const stream = brotliDecompressSync(buf.subarray(r.o, r.o + compressedSize));
  let o = 0;
  for (const t of tables) {
    t.data = stream.subarray(o, o + t.length);
    o += t.length;
  }
  const byTag = new Map(tables.map((t) => [t.tag, t]));
  const out = new Map();
  for (const t of tables) if (!t.transformed) out.set(t.tag, Buffer.from(t.data));

  const glyfT = byTag.get('glyf');
  let xMins = null;
  let numGlyphs = 0;
  if (glyfT?.transformed) {
    const res = untransformGlyf(glyfT.data);
    out.set('glyf', res.glyf);
    out.set('loca', res.loca);
    xMins = res.xMins;
    numGlyphs = res.numGlyphs;
    // head.indexToLocFormat must agree with the rebuilt loca
    const head = out.get('head');
    if (head) head.writeInt16BE(res.indexFormat, 50);
  }
  const hmtxT = byTag.get('hmtx');
  if (hmtxT?.transformed) {
    if (!xMins) throw new Error('woff2: transformed hmtx without a transformed glyf');
    const numHMetrics = out.get('hhea').readUInt16BE(34);
    out.set('hmtx', untransformHmtx(hmtxT.data, numGlyphs, numHMetrics, xMins));
  }

  // assemble the sfnt: table records sorted by tag, 4-byte aligned, checksums, head.checkSumAdjustment
  const tags = [...out.keys()].sort();
  const n = tags.length;
  let pow = 1;
  let log = 0;
  while (pow * 2 <= n) {
    pow *= 2;
    log++;
  }
  const header = Buffer.alloc(12 + 16 * n);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(n, 4);
  header.writeUInt16BE(pow * 16, 6);
  header.writeUInt16BE(log, 8);
  header.writeUInt16BE(n * 16 - pow * 16, 10);
  const head = out.get('head');
  if (head) head.writeUInt32BE(0, 8);
  const parts = [header];
  let offset = header.length;
  tags.forEach((tag, i) => {
    const data = out.get(tag);
    const rec = 12 + 16 * i;
    header.write(tag, rec, 4, 'latin1');
    header.writeUInt32BE(checksum(data), rec + 4);
    header.writeUInt32BE(offset, rec + 8);
    header.writeUInt32BE(data.length, rec + 12);
    const pad = (4 - (data.length % 4)) % 4;
    parts.push(data, Buffer.alloc(pad));
    offset += data.length + pad;
  });
  const font = Buffer.concat(parts);
  if (head) {
    const at = header.readUInt32BE(12 + 16 * tags.indexOf('head') + 8);
    font.writeUInt32BE((0xb1b0afba - checksum(font)) >>> 0, at + 8);
  }
  return font;
}
