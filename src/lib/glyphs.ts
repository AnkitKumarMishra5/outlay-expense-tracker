/** Recover characters from fonts that map their glyphs to nothing. */

const W = 16;
const H = 20;

/** [character, width/height of the drawn shape, the shape as a 16x20 grid] */
const TEMPLATES: [string, number, string][] = [
  ["0", 0.70, "00000111111000000001111111111000001111111111110001111000000111100111000000001110011100000000111011110000000011111110000000000111111000000000011111100000000001111110000000000111111000000000011111100000000001111111000000001111011100000000111001110000000011100111100000011110001111111111110000011111111110000000011111100000"],
  ["1", 0.64, "00000111110000000001111111000000001111111100000001111001110000000111000111000000010000011100000000000001110000000000000111000000000000011100000000000001110000000000000111000000000000011100000000000001110000000000000111000000000000011100000000000001110000000000000111000000111111111111111111111111111111111111111111111111"],
  ["2", 0.65, "00001111111000000011111111111000011111111111110001111000000111101111000000001110111100000000111100000000000011110000000000001110000000000001111000000000001111000000000001111000000000001111000000000011111000000000011111000000000011110000000000011110000000000011110000000000111111111111111111111111111111111111111111111111"],
  ["3", 0.69, "00000111111000000001111111111000001111111111110001111000000111100111000000001110000000000000111000000000000011100000000000011110000000000111110000000011111100000000001111111100000000000011111000000000000011110000000000001111000000000000111111110000000011111111100000011110011111111111111000111111111111000000111111100000"],
  ["4", 0.75, "00000000011110000000000011111000000000011111100000000001111110000000001110111000000001111011100000000111001110000000111000111000000111100011100000011100001110000011100000111000011110000011100001110000001110001110000000111000111111111111111111111111111111110000000000111000000000000011100000000000001110000000000000111000"],
  ["5", 0.67, "00111111111111100011111111111110011111111111111001111000000000000111100000000000011100000000000001110000000000000111011111110000011111111111110011111100011111100000000000011110000000000000111100000000000011110000000000001111000000000000111111110000000011110111100000011110011111111111110000111111111110000000111111100000"],
  ["6", 0.70, "00000111111100000000111111111000000111111111110000111100000111100111100000001111011100000000000011110000000000001110001111110000111011111111110011101110011111101111100000011110111100000000111111110000000001111111000000000111111100000000011101110000000011110111100000011110001111111111110000011111111110000000011111100000"],
  ["7", 0.66, "11111111111111111111111111111111111111111111111100000000000011110000000000011110000000000011110000000000001111000000000001111000000000000111000000000000111100000000000111100000000000011110000000000011110000000000001110000000000001111000000000001111000000000000111100000000000111100000000000011100000000000011110000000000"],
  ["8", 0.70, "00000111111000000001111111111000001111100111110001111000000111100111000000001110011100000000111001110000000011100111100000011100001111100111110000001111111100000011111111111100011110000001111011110000000011111111000000001111111000000000111111110000000011111111000000001111011111100111111000111111111111000000111111110000"],
  ["9", 0.70, "00000111111000000001111111111000001111111111110001111000000111101111000000001110111000000000111111100000000011111110000000001111111100000000111101111000000111110111111001110111001111111110011100001111110001110000000000001111000000000000111011110000000111100111100000111100001111111111100000011111111100000000111111100000"],
  [",", 0.56, "00001111111111110000111111111110000011111111111000001111111111100001111111111100000111111111110000011111111110000001111111111000001111111111100000111111111100000011111111110000001111111110000000111111111000000111111111100000011111111100000001111111110000000111111110000000011111111000000011111111000000001111111100000000"],
  [".", 1.00, "00000111111000000000111111110000000111111111100000111111111111000111111111111110011111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111011111111111111001111111111111100011111111111100000111111111100000001111111100000000011111100000"],
  [":", 0.27, "00011111111110000111111111111110111111111111111111111111111111110011111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111001111111111111111111111111111111101111111111111100001111111111000"],
  ["(", 0.25, "00000000111111100000001111111100000001111111100000001111111100000001111111100000001111111100000001111111100000000111111100000000111111110000000011111111000000001111111100000000111111110000000011111111000000000111111110000000001111111000000000111111110000000000111111100000000001111111100000000011111111000000000011111110"],
  [")", 0.25, "01111111000000000011111111000000000111111110000000001111111100000000011111111000000000111111110000000001111111100000000011111110000000001111111100000000111111110000000011111111000000001111111100000000111111110000000111111110000000011111110000000011111111000000011111110000000111111110000000111111110000000111111100000000"],
  // - missing
  ["-", 3.47, "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"],
  ["+", 1.00, "00000011110000000000001111000000000000111100000000000011110000000000001111000000000000111100000000000011110000000000001111000000111111111111111111111111111111111111111111111111111111111111111100000011110000000000001111000000000000111100000000000011110000000000001111000000000000111100000000000011110000000000001111000000"],
];

/**
 * Soften a bitmap before comparing it.
 *
 * The same digit set in Regular and in Bold covers noticeably different
 * amounts of the grid, and counting matching cells punishes that far harder
 * than it should: a bold 3 scored worse against a regular 3 than against a
 * regular 9. Blurring first compares where the ink is rather than how much of
 * it there is.
 */
function soften(on: Uint8Array): Float32Array {
  const out = new Float32Array(W * H);
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      let sum = 0;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || rr >= H || cc < 0 || cc >= W) continue;
          sum += on[rr * W + cc];
          n++;
        }
      out[r * W + c] = sum / n;
    }
  return out;
}

const CELLS = TEMPLATES.map(([ch, ar, bits]) => ({
  ch,
  ar,
  soft: soften(Uint8Array.from(bits, (c) => (c === "1" ? 1 : 0))),
}));

type Pt = [number, number, boolean];

interface Tables {
  [tag: string]: { off: number; len: number };
}

function readTables(b: Uint8Array, dv: DataView): Tables | null {
  if (b.length < 12) return null;
  const num = dv.getUint16(4);
  if (num === 0 || 12 + num * 16 > b.length) return null;
  const t: Tables = {};
  for (let i = 0; i < num; i++) {
    const o = 12 + i * 16;
    let tag = "";
    for (let k = 0; k < 4; k++) tag += String.fromCharCode(b[o + k]);
    t[tag] = { off: dv.getUint32(o + 8), len: dv.getUint32(o + 12) };
  }
  return t;
}

/** One glyph's contours, resolving composites. */
function outline(dv: DataView, t: Tables, longLoca: boolean, gid: number, depth = 0): Pt[][] | null {
  if (depth > 4) return null;
  const loca = (i: number) =>
    longLoca ? dv.getUint32(t.loca.off + i * 4) : dv.getUint16(t.loca.off + i * 2) * 2;
  const start = t.glyf.off + loca(gid);
  const end = t.glyf.off + loca(gid + 1);
  if (end <= start || end > dv.byteLength) return null;
  const nc = dv.getInt16(start);

  if (nc < 0) {
    let p = start + 10;
    const out: Pt[][] = [];
    for (;;) {
      const flags = dv.getUint16(p);
      const sub = dv.getUint16(p + 2);
      p += 4;
      let dx: number;
      let dy: number;
      if (flags & 1) {
        dx = dv.getInt16(p);
        dy = dv.getInt16(p + 2);
        p += 4;
      } else {
        dx = dv.getInt8(p);
        dy = dv.getInt8(p + 1);
        p += 2;
      }
      if (flags & 8) p += 2;
      else if (flags & 0x40) p += 4;
      else if (flags & 0x80) p += 8;
      const inner = outline(dv, t, longLoca, sub, depth + 1);
      if (inner) for (const c of inner) out.push(c.map(([x, y, on]) => [x + dx, y + dy, on] as Pt));
      if (!(flags & 0x20)) break;
    }
    return out.length ? out : null;
  }

  let p = start + 10;
  const ends: number[] = [];
  for (let i = 0; i < nc; i++) {
    ends.push(dv.getUint16(p));
    p += 2;
  }
  const n = ends[nc - 1] + 1;
  p += 2 + dv.getUint16(p);
  const flags: number[] = [];
  while (flags.length < n) {
    const f = dv.getUint8(p++);
    flags.push(f);
    if (f & 8) {
      let r = dv.getUint8(p++);
      while (r-- > 0) flags.push(f);
    }
  }
  const xs: number[] = [];
  let x = 0;
  for (let i = 0; i < n; i++) {
    const f = flags[i];
    if (f & 2) {
      const d = dv.getUint8(p++);
      x += f & 16 ? d : -d;
    } else if (!(f & 16)) {
      x += dv.getInt16(p);
      p += 2;
    }
    xs.push(x);
  }
  const ys: number[] = [];
  let y = 0;
  for (let i = 0; i < n; i++) {
    const f = flags[i];
    if (f & 4) {
      const d = dv.getUint8(p++);
      y += f & 32 ? d : -d;
    } else if (!(f & 32)) {
      y += dv.getInt16(p);
      p += 2;
    }
    ys.push(y);
  }
  const out: Pt[][] = [];
  let s = 0;
  for (let i = 0; i < nc; i++) {
    const e = ends[i];
    const pts: Pt[] = [];
    for (let j = s; j <= e; j++) pts.push([xs[j], ys[j], (flags[j] & 1) !== 0]);
    out.push(pts);
    s = e + 1;
  }
  return out;
}

/** Flatten the quadratic curves into polygons; eight steps is plenty at this size. */
function flatten(contours: Pt[][]): [number, number][][] {
  return contours.map((pts) => {
    const out: [number, number][] = [];
    const n = pts.length;
    if (!n) return out;
    let startIdx = pts.findIndex((p) => p[2]);
    let startPt: Pt;
    if (startIdx < 0) {
      startPt = [(pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2, true];
      startIdx = -1;
    } else startPt = pts[startIdx];
    out.push([startPt[0], startPt[1]]);

    const quad = (a: Pt | [number, number], c: Pt, d: Pt | [number, number]) => {
      for (let k = 1; k <= 8; k++) {
        const u = k / 8;
        const m = 1 - u;
        out.push([
          m * m * a[0] + 2 * m * u * c[0] + u * u * d[0],
          m * m * a[1] + 2 * m * u * c[1] + u * u * d[1],
        ]);
      }
    };

    let cur: Pt | [number, number] = startPt;
    let ctrl: Pt | null = null;
    for (let k = 1; k <= n; k++) {
      const pt = pts[((startIdx < 0 ? 0 : startIdx) + k) % n];
      if (pt[2]) {
        if (ctrl) {
          quad(cur, ctrl, pt);
          ctrl = null;
        } else out.push([pt[0], pt[1]]);
        cur = pt;
      } else {
        if (ctrl) {
          const mid: Pt = [(ctrl[0] + pt[0]) / 2, (ctrl[1] + pt[1]) / 2, true];
          quad(cur, ctrl, mid);
          cur = mid;
        }
        ctrl = pt;
      }
    }
    if (ctrl) quad(cur, ctrl, startPt);
    return out;
  });
}

/** Fill the shape into a 16x20 grid scaled to its own bounding box. */
function draw(contours: Pt[][]): { on: Uint8Array; ar: number } | null {
  const polys = flatten(contours).filter((p) => p.length > 2);
  if (!polys.length) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of polys)
    for (const [x, y] of p) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  if (!(x1 > x0 && y1 > y0)) return null;
  const on = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) {
    const yy = y1 - ((r + 0.5) / H) * (y1 - y0);
    for (let c = 0; c < W; c++) {
      const xx = x0 + ((c + 0.5) / W) * (x1 - x0);
      let wind = 0;
      for (const p of polys)
        for (let i = 0; i < p.length; i++) {
          const a = p[i];
          const d = p[(i + 1) % p.length];
          const cross = (d[0] - a[0]) * (yy - a[1]) - (xx - a[0]) * (d[1] - a[1]);
          if (a[1] <= yy) {
            if (d[1] > yy && cross > 0) wind++;
          } else if (d[1] <= yy && cross < 0) wind--;
        }
      if (wind !== 0) on[r * W + c] = 1;
    }
  }
  return { on, ar: (x1 - x0) / (y1 - y0) };
}

/** Nearest template, but only if it is both good and unambiguous. */
function classify(shape: { on: Uint8Array; ar: number }): string | null {
  const soft = soften(shape.on);
  let best = { ch: "", score: -1 };
  let runnerUp = -1;
  for (const t of CELLS) {
    // Proportion separates a comma from a full stop from a dash.
    const ratio = Math.abs(Math.log(shape.ar / t.ar));
    if (ratio > 0.45) continue;
    let diff = 0;
    for (let i = 0; i < W * H; i++) diff += Math.abs(soft[i] - t.soft[i]);
    const score = 1 - diff / (W * H) - ratio * 0.12;
    if (score > best.score) {
      if (t.ch !== best.ch) runnerUp = best.score;
      best = { ch: t.ch, score };
    } else if (t.ch !== best.ch && score > runnerUp) runnerUp = score;
  }
  if (best.score < 0.86) return null;
  if (runnerUp >= 0 && best.score - runnerUp < 0.02) return null;
  return best.ch;
}

/** What pdf.js hands back for an embedded font once the page has been walked. */
export interface EmbeddedFont {
  data?: Uint8Array;
  toUnicode?: { _map?: (string | undefined)[] };
}

const PUA_START = 0xe000;
const PUA_END = 0xf8ff;

export function isUnmapped(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return cp >= PUA_START && cp <= PUA_END;
}

/** Map the placeholder characters a font produced to the ones they draw. */
export function readUnmappedGlyphs(font: EmbeddedFont): Map<string, string> | null {
  const data = font.data;
  const map = font.toUnicode?._map;
  if (!data || !map) return null;

  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const t = readTables(data, dv);
  if (!t?.glyf || !t.loca || !t.head) return null;
  const longLoca = dv.getInt16(t.head.off + 50) === 1;

  const out = new Map<string, string>();
  for (let code = 0; code < map.length; code++) {
    const to = map[code];
    if (typeof to !== "string" || to.length !== 1 || !isUnmapped(to)) continue;
    if (out.has(to)) continue;
    try {
      const contours = outline(dv, t, longLoca, code);
      if (!contours) continue;
      const shape = draw(contours);
      if (!shape) continue;
      const ch = classify(shape);
      if (ch) out.set(to, ch);
    } catch {
    }
  }
  return out.size ? out : null;
}

/** A font with no space glyph cannot have drawn one, so its spaces are invented. */
export function fontDrawsSpaces(font: EmbeddedFont): boolean {
  const data = font.data;
  if (!data) return true;
  try {
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const t = readTables(data, dv);
    if (!t?.cmap) return true;
    const off = t.cmap.off;
    const subtables = dv.getUint16(off + 2);
    let read = false;
    for (let i = 0; i < subtables; i++) {
      const sub = off + dv.getUint32(off + 4 + i * 8 + 4);
      const format = dv.getUint16(sub);
      if (format === 4) {
        read = true;
        const segX2 = dv.getUint16(sub + 6);
        const ends = sub + 14;
        const starts = ends + segX2 + 2;
        for (let seg = 0; seg < segX2 / 2; seg++) {
          if (dv.getUint16(starts + seg * 2) <= 0x20 && dv.getUint16(ends + seg * 2) >= 0x20) return true;
        }
      } else if (format === 12) {
        read = true;
        const groups = dv.getUint32(sub + 12);
        for (let g = 0; g < groups; g++) {
          const go = sub + 16 + g * 12;
          if (dv.getUint32(go) <= 0x20 && dv.getUint32(go + 4) >= 0x20) return true;
        }
      }
    }
    return !read;
  } catch {
    return true;
  }
}
