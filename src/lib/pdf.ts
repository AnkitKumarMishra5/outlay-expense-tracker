import { fontDrawsSpaces, isUnmapped, readUnmappedGlyphs, type EmbeddedFont } from "./glyphs";

/** One printed cell: its text and the horizontal span it occupies. */
export interface LayoutCell {
  x0: number;
  x1: number;
  text: string;
}

/** One printed row of a page, split into the cells it was typeset as. */
export interface LayoutRow {
  page: number;
  cells: LayoutCell[];
}

export interface ExtractResult {
  text: string;
  /** Where each cell sat on the page, so a figure can be matched to the
   *  heading above it rather than to whatever text happens to come next. */
  layout: LayoutRow[];
  password: string | null; // the candidate that opened it (null = not protected)
  needsPassword: boolean;
  triedCount: number;
}

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;
const pdfjs = () => (pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs"));

async function tryOpen(data: Uint8Array, password?: string) {
  const lib = await pdfjs();
  // fontExtraProperties keeps the embedded font data, which the repair needs.
  const task = lib.getDocument({ data: data.slice(), password, verbosity: 0, fontExtraProperties: true });
  try {
    const doc = await task.promise;
    return { doc, close: () => task.destroy() };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "PasswordException") {
      await task.destroy().catch(() => {});
      return null;
    }
    throw err;
  }
}

interface TextItem { str: string; transform: number[]; width?: number; fontName?: string; }

type OpenedDoc = NonNullable<Awaited<ReturnType<typeof tryOpen>>>["doc"];

/**
 * Turn a page into lines.
 *
 * Joining every item on a row with a fixed separator looked fine until a
 * statement turned up that emits one text item per glyph: "Credit Card No"
 * arrived as "Credit     Card     No" and stopped matching anything. The gap
 * between one item ending and the next beginning is what actually separates
 * words, so that is what decides the spacing here. Some issuers also pad with
 * NUL rather than space, which is not whitespace to trim().
 *
 * Some fonts also give no Unicode for their digits; those are read back off
 * the font's own drawings before the row is assembled.
 */
type PageProxy = Awaited<ReturnType<OpenedDoc["getPage"]>>;

/** Opens the page's fonts only when something on it needs repairing. */
async function glyphDecoder(
  page: PageProxy,
  items: TextItem[]
): Promise<((str: string, fontName?: string) => string) | null> {
  let suspect = false;
  for (const item of items) {
    if (!item.str) continue;
    if ([...item.str].some(isUnmapped) || /\S \S/.test(item.str.replace(/\u0000/g, ""))) {
      suspect = true;
      break;
    }
  }
  if (!suspect) return null;

  try {
    await page.getOperatorList();
  } catch {
    return null;
  }
  const cache = new Map<string, { lookup: Map<string, string> | null; spaces: boolean }>();
  const infoFor = (fontName?: string) => {
    if (!fontName) return null;
    let info = cache.get(fontName);
    if (!info) {
      info = { lookup: null, spaces: true };
      try {
        const objs = page.commonObjs as { has(n: string): boolean; get(n: string): unknown };
        if (objs.has(fontName)) {
          const font = objs.get(fontName) as EmbeddedFont;
          info = { lookup: readUnmappedGlyphs(font), spaces: fontDrawsSpaces(font) };
        }
      } catch {
        // An unreadable font just means no repair.
      }
      cache.set(fontName, info);
    }
    return info;
  };

  return (str, fontName) => {
    const needsGlyphs = [...str].some(isUnmapped);
    if (!needsGlyphs && !str.includes(" ")) return str;
    const info = infoFor(fontName);
    if (!info) return str;
    let out = str;
    if (needsGlyphs && info.lookup) {
      const lookup = info.lookup;
      out = [...out].map((ch) => (isUnmapped(ch) ? lookup.get(ch) ?? ch : ch)).join("");
    }
    // Only a font that already needed repairing gets its spaces second-guessed.
    if (!info.spaces && info.lookup) out = out.replace(/ /g, "");
    return out;
  };
}

async function extractPages(doc: OpenedDoc): Promise<{ text: string; layout: LayoutRow[] }> {
  const lines: string[] = [];
  const layout: LayoutRow[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const decode = await glyphDecoder(page, content.items as TextItem[]);
    const rows = new Map<number, { x: number; w: number; str: string }[]>();
    for (const item of content.items as TextItem[]) {
      let str = item.str?.replace(/\u0000/g, "");
      if (str && decode) str = decode(str, item.fontName);
      if (!str?.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x: item.transform[4], w: item.width ?? 0, str });
    }
    const ys = [...rows.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const cells = rows.get(y)!.sort((a, b) => a.x - b.x);
      let line = "";
      let prevEnd: number | null = null;
      const columns: LayoutCell[] = [];
      let open: LayoutCell | null = null;
      for (const cell of cells) {
        let broke = true;
        if (prevEnd !== null) {
          const gap = cell.x - prevEnd;
          if (gap > 6) line += "  ";
          else {
            broke = false;
            if (gap > 1.2) line += " ";
          }
        }
        line += cell.str;
        if (!open || broke) {
          open = { x0: cell.x, x1: cell.x + cell.w, text: cell.str };
          columns.push(open);
        } else {
          open.text += (prevEnd !== null && cell.x - prevEnd > 1.2 ? " " : "") + cell.str;
          open.x1 = cell.x + cell.w;
        }
        prevEnd = cell.x + cell.w;
      }
      if (!line.trim()) continue;
      lines.push(line.trim());
      const kept = columns.map((c) => ({ ...c, text: c.text.trim() })).filter((c) => c.text);
      if (kept.length) layout.push({ page: i, cells: kept });
    }
    lines.push("");
  }
  return { text: lines.join("\n"), layout };
}

/**
 * Some statements ship a font whose digits map to nothing, so every number is
 * invisible to text extraction while the letters come through fine. There is
 * no parsing around that, and saying "this is not a statement" would be a lie,
 * so the caller checks for it and says what is actually wrong.
 */
export function hasNumbers(text: string): boolean {
  return /\d/.test(text);
}

export async function unlockAndExtract(
  buffer: Uint8Array,
  candidates: string[]
): Promise<ExtractResult> {
  let opened = await tryOpen(buffer);
  if (opened) {
    const page = await extractPages(opened.doc);
    await opened.close();
    return { ...page, password: null, needsPassword: false, triedCount: 0 };
  }
  let tried = 0;
  for (const pw of candidates) {
    tried++;
    opened = await tryOpen(buffer, pw);
    if (opened) {
      const page = await extractPages(opened.doc);
      await opened.close();
      return { ...page, password: pw, needsPassword: false, triedCount: tried };
    }
  }
  return { text: "", layout: [], password: null, needsPassword: true, triedCount: tried };
}
