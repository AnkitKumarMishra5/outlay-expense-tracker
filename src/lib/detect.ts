import { BANKS } from "./banks";

export interface Detection {
  bankId: string | null;
  bankName: string | null;
  last4: string | null;
  productName: string | null;
  looksLikeStatement: boolean;
  confidence: "high" | "low" | "none";
}

const BANK_HINTS: Record<string, RegExp> = {
  hdfc: /hdfc/i,
  icici: /icici/i,
  sbi: /\bsbi\b|state bank of india|sbi cards?/i,
  axis: /axis bank/i,
  kotak: /kotak/i,
  amex: /american express|amex/i,
  idfc: /idfc/i,
  indusind: /indusind/i,
  yes: /yes bank/i,
  rbl: /\brbl\b/i,
  hsbc: /hsbc/i,
  sc: /standard chartered/i,
  au: /au small finance|au bank/i,
  federal: /federal bank/i,
  onecard: /onecard|one ?card/i,
  bobcard: /bobcard|bank of baroda/i,
};

const STATEMENT_MARKERS = [
  /statement/i,
  /total (?:amount|payment) due/i,
  /minimum (?:amount|payment) due/i,
  /payment due date/i,
  /credit card/i,
  /card (?:number|no)/i,
  /transaction/i,
];

const PRODUCT_NOISE = /\b(?:bank|card|credit|statement|limited|ltd|account|welcome|dear|page)\b/i;

function detectProduct(head: string, bankId: string | null): string | null {
  const bankWords = bankId ? (BANKS.find((b) => b.id === bankId)?.name ?? "").split(/\s+/) : [];
  const candidates = [
    ...head.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9&'+.\- ]{1,34}?)\s+Credit Card Statement\b/gi),
    ...head.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9&'+.\- ]{1,34}?)\s+Card Statement\b/gi),
  ];
  for (const m of candidates) {
    const raw = m[1].trim().replace(/\s{2,}/g, " ");
    if (raw.length < 3 || PRODUCT_NOISE.test(raw)) continue;
    if (bankWords.some((w) => w.length > 2 && new RegExp(`\\b${w}\\b`, "i").test(raw))) continue;
    return raw;
  }
  return null;
}

export function detectCard(text: string): Detection {
  const head = text.slice(0, 6000);

  let bankId: string | null = null;
  for (const [id, re] of Object.entries(BANK_HINTS)) {
    if (re.test(head)) {
      bankId = id;
      break;
    }
  }

  let last4: string | null = null;
  const masked = head.match(/(?:[X*x•]{2,}[\s-]*){2,}(\d{4})\b/);
  if (masked) last4 = masked[1];
  if (!last4) {
    const labelled = head.match(/card\s*(?:number|no\.?)?[^0-9\n]{0,20}(?:[X*x•\d]{4}[\s-]*){2,}(\d{4})\b/i);
    if (labelled) last4 = labelled[1];
  }

  const productName = detectProduct(head, bankId);

  const markerHits = STATEMENT_MARKERS.filter((re) => re.test(head)).length;
  const looksLikeStatement = markerHits >= 3;

  const bank = BANKS.find((b) => b.id === bankId) ?? null;
  const confidence: Detection["confidence"] =
    bankId && last4 ? "high" : bankId || last4 ? "low" : "none";

  return {
    bankId,
    bankName: bank ? bank.name : null,
    productName,
    last4,
    looksLikeStatement,
    confidence,
  };
}
