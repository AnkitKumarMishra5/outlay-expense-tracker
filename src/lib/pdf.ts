export interface ExtractResult {
  text: string;
  password: string | null; // the candidate that opened it (null = not protected)
  needsPassword: boolean;
  triedCount: number;
}

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;
const pdfjs = () => (pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs"));

async function tryOpen(data: Uint8Array, password?: string) {
  const lib = await pdfjs();
  const task = lib.getDocument({ data: data.slice(), password, verbosity: 0 });
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

interface TextItem { str: string; transform: number[]; }

type OpenedDoc = NonNullable<Awaited<ReturnType<typeof tryOpen>>>["doc"];

async function extractText(doc: OpenedDoc): Promise<string> {
  const lines: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as TextItem[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x: item.transform[4], str: item.str });
    }
    const ys = [...rows.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const line = rows
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((r) => r.str.trim())
        .join("  ");
      if (line) lines.push(line);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function unlockAndExtract(
  buffer: Uint8Array,
  candidates: string[]
): Promise<ExtractResult> {
  let opened = await tryOpen(buffer);
  if (opened) {
    const text = await extractText(opened.doc);
    await opened.close();
    return { text, password: null, needsPassword: false, triedCount: 0 };
  }
  let tried = 0;
  for (const pw of candidates) {
    tried++;
    opened = await tryOpen(buffer, pw);
    if (opened) {
      const text = await extractText(opened.doc);
      await opened.close();
      return { text, password: pw, needsPassword: false, triedCount: tried };
    }
  }
  return { text: "", password: null, needsPassword: true, triedCount: tried };
}
