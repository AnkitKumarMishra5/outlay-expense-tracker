import { BANKS } from "./banks";

export interface Detection {
  bankId: string | null;
  bankName: string | null;
  last4: string | null;
  /** Fewer than four digits left unmasked, e.g. SBI's "XX30", for matching when last4 is missing. */
  lastDigits: string | null;
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

/**
 * Product names actually printed on Indian credit cards. Matching against a
 * list beats inferring from prose: the old approach scanned six thousand
 * characters for "<something> Credit Card Statement" and happily returned
 * "Days of monthly" out of a terms-and-conditions paragraph.
 */
const PRODUCTS = [
  "Amazon Pay", "Swiggy", "Tata Neu Infinity", "Tata Neu", "Flipkart Axis", "Myntra Kotak",
  "Infinia", "Diners Club Black", "Diners Club Privilege", "Regalia Gold", "Regalia",
  "Millennia", "MoneyBack", "Freedom", "Pixel Play", "Pixel Go", "Pixel", "Biz Black", "Biz Power",
  "Atlas", "Magnus Burgundy", "Magnus", "Reserve", "Select", "Neo", "Ace", "Vistara",
  "Coral", "Rubyx", "Sapphiro", "Emeralde", "Expressions", "MakeMyTrip ICICI",
  "Zenith", "LIT", "Ultimate", "Wealth", "Club Vistara", "First Wealth", "First Select",
  "SimplyCLICK", "SimplySAVE", "PRIME", "Cashback", "BPCL Octane", "IRCTC",
  "Marquee", "League", "Pioneer", "Scapia", "Eterna", "Legend", "Indulge", "Pinnacle",
  "Platinum Travel", "Gold Charge", "Membership Rewards", "SmartEarn", "Rewards Plus",
  "EazyDiner", "Times Black", "Aurum", "Elite", "Prosperity", "Moneyback+",
];

const PRODUCT_NOISE =
  /\b(?:bank|card|credit|statement|limited|ltd|account|welcome|dear|page|days|monthly|generation|your|the|of|for|and|will|please|refer|details|terms)\b/i;

function detectProduct(head: string, bankId: string | null): string | null {
  // Only the masthead: anything further down is body copy, not the card name.
  const top = head.slice(0, 1600);
  const flat = top.replace(/\s+/g, " ");

  // Several real product names are also ordinary words: ICICI's marketing line
  // "Ace your Digital Banking" was being read as an Axis Ace card. These only
  // count when "card" is close by.
  const NEEDS_CONTEXT = new Set([
    "Ace", "Neo", "Select", "Reserve", "Freedom", "PRIME", "Elite", "LIT",
    "Legend", "Indulge", "Pinnacle", "Wealth", "Ultimate", "Prosperity",
  ]);
  for (const product of [...PRODUCTS].sort((a, b) => b.length - a.length)) {
    const escaped = product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hit = new RegExp(`\\b${escaped}\\b`, "i").exec(flat);
    if (!hit) continue;
    if (NEEDS_CONTEXT.has(product)) {
      const around = flat.slice(Math.max(0, hit.index - 40), hit.index + product.length + 40);
      if (!/card/i.test(around)) continue;
    }
    return product;
  }

  // Nothing in the masthead. Many issuers name the card once in the body, in a
  // phrase that cannot be anything else: "Amazon Pay ICICI Bank Credit Card".
  // Matching that is safe where a bare product word would not be, because the
  // first "Amazon Pay" in this statement is a merchant on a transaction row.
  const whole = head.replace(/\s+/g, " ");
  for (const product of [...PRODUCTS].sort((a, b) => b.length - a.length)) {
    const escaped = product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b[^\\n]{0,30}credit card`, "i").test(whole)) return product;
    if (new RegExp(`credit card[^\\n]{0,30}\\b${escaped}\\b`, "i").test(whole)) return product;
  }

  const bankWords = bankId ? (BANKS.find((b) => b.id === bankId)?.name ?? "").split(/\s+/) : [];
  const candidates = [
    ...top.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9&'+.\- ]{1,34}?)\s+Credit Card Statement\b/gi),
    ...top.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9&'+.\- ]{1,34}?)\s+Card Statement\b/gi),
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
  // "XXXX XXXX XXXX XX30": only two digits printed. Kept apart from last4 so
  // it can narrow a match without ever being taken for the full four.
  const partial = last4 ? null : head.match(/(?:[X*x•]{4}[\s-]+){3}[X*x•]{1,3}(\d{1,3})\b/);
  const lastDigits = partial ? partial[1] : null;
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
    lastDigits,
    bankName: bank ? bank.name : null,
    productName,
    last4,
    looksLikeStatement,
    confidence,
  };
}
