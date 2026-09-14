export const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Shopping",
  "Travel",
  "Fuel",
  "Utilities & Bills",
  "Entertainment",
  "Health",
  "Education",
  "EMI & Loans",
  "Insurance",
  "Fees & Charges",
  "Taxes",
  "Credits",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

/** What a charge can be. Credits is kept for money the card gave back. */
export const SPEND_CATEGORIES = CATEGORIES.filter((c) => c !== "Credits");

/** Join merchant fragments into one case-insensitive alternation. */
const any = (...parts: string[]) => new RegExp(parts.join("|"), "i");

/**
 * A fragment that has to match a whole word. Short tokens need this: without
 * it "gas" fires inside "Las Vegas", "lab" inside "Adlabs", "chai" inside
 * "Chairman" and "digit" inside "Reliance Digital".
 */
const w = (s: string) => `\\b${s}\\b`;

/**
 * First match wins, so the order is part of the logic.
 *
 * Rows the bank generated come first: a refund, a fee or an EMI instalment is
 * about the card itself, and the merchant name inside it is incidental.
 * "Refund - Swiggy order" is money coming back, not lunch. Merchant rules
 * follow, with Shopping last because it is the broadest, which lets
 * "Amazon Fresh" land in Groceries and "Reliance Digital" in Shopping.
 */
const RULES: [RegExp, Category][] = [
  [
    // Tax paid with the card, which is not the same as the GST levied on a
    // card fee, which stays under Fees & Charges further down.
    any(
      w("cbdt"), w("cbic"), w("gstn"), w("nsdl"), "tin 2", "protean",
      "income tax", "advance tax", "self ?assessment", "self assesment", w("itns"),
      "tax payment", "pay ?tax", "direct tax", "indirect tax", "gst payment",
      "tds payment", "property tax", "municipal tax", "professional tax",
      "water tax", "house tax", "road tax", "customs duty", "excise duty", w("challan")
    ),
    "Taxes",
  ],
  [
    any(
      "annual fee", "joining fee", "membership fee", "renewal fee", "late fee", "late payment",
      "over ?limit", "overlimit", "finance charge", w("interest"), "service charge",
      "processing fee", "convenience fee", "surcharge", "penalty", "cheque bounce",
      "cheque return", "return charge", "card replacement", "duplicate statement",
      "pin regeneration", "reward redemption fee", "cash advance", "atm wdl", "atm withdrawal",
      "foreclosure", "prepayment charge", "currency conversion", "cross currency",
      "fx markup", "forex markup", w("markup"), w("gst"), w("igst"), w("cgst"), w("sgst"), w("tds")
    ),
    "Fees & Charges",
  ],
  [
    any(
      "equated monthly", "\\bemi\\s+(?:principal|interest|instal|conversion|booking)",
      "\\binstal?lment\\b", w("loan"), "bajaj fin", "hdb financial", "tata capital",
      "fullerton", "indiabulls", "muthoot", "manappuram", "kreditbee", "moneytap",
      w("cashe"), "lazypay", w("simpl"), "pay ?later", w("slice"), "zestmoney",
      "home credit", "dmi finance", "mpokket", "smartcoin", "credit line"
    ),
    "EMI & Loans",
  ],
  [
    any(
      "insurance", "assurance", w("lic"), "lic of india", "policy ?bazaar", "max life",
      "sbi life", "tata aia", "bajaj allianz", "hdfc ergo", "icici lombard", "star health",
      "niva bupa", "care health", "aditya birla health", "kotak life", "pnb metlife",
      "reliance general", "iffco tokio", "royal sundaram", "chola ?ms", "new india assurance",
      "oriental insur", "united india", "national insur", w("acko"), "go ?digit", w("digit"),
      "renewbuy", "coverfox", w("ditto"), "premium payment", "policy renewal"
    ),
    "Insurance",
  ],
  [
    any(
      "petrol", w("fuel"), "filling station", "hpcl", "bpcl", "indian ?oil", "iocl",
      w("shell"), "nayara", "essar", "jio ?bp", "reliance petroleum", "bharat petroleum",
      "hindustan petroleum", "hp petrol", w("cng"), "gas station"
    ),
    "Fuel",
  ],
  [
    any(
      "bigbasket", "bb ?daily", "blinkit", "zepto", "instamart", "grofers", "dmart",
      "d ?mart", "jiomart", "amazon fresh", "reliance fresh", "reliance smart", "more retail",
      "big bazaar", "spencer", "star bazaar", "easyday", "vishal mega", "ratnadeep",
      "heritage fresh", "nature'?s basket", "licious", "freshtohome", "country delight",
      "milkbasket", "supermarket", "hypermarket", "grocery", "kirana", "provision store",
      w("amul"), "mother dairy"
    ),
    "Groceries",
  ],
  [
    any(
      "swiggy", "zomato", "eatsure", "faasos", "behrouz", "ovenstory", "box8", "freshmenu",
      "dominos", "mcdonald", w("kfc"), "burger king", "subway", "taco bell", "wendy",
      "pizza", "papa john", "smokin ?joe", "la ?pino", "wow ?momo", "haldiram", "bikanervala",
      "sagar ratna", "saravana", "biryani", "barbeque", "barbecue", "restaurant", "cafe",
      "coffee day", w("ccd"), "starbucks", "costa coffee", "chaayos", w("chai"), "chai ?point",
      "third wave", "blue tokai", "dunkin", "baskin", "theobroma", "keventers", "ice ?cream",
      "bakery", "sweets", "dhaba", "eatfit", "brew ?pub", "brewery", w("pub"), w("bar"),
      "food court", "canteen"
    ),
    "Food & Dining",
  ],
  [
    any(
      "uber", w("ola"), "rapido", "blablacar", "zoomcar", w("revv"), "drivezy", w("meru"),
      "savaari", "irctc", "confirmtkt", "railyatri", "abhibus", "redbus", w("dmrc"), "bmrcl",
      "namma metro", "metro rail", "fastag", w("nhai"), "toll plaza", "parking",
      "indigo", "air ?india", "vistara", "spicejet", "akasa", "emirates", "qatar airways",
      "singapore air", "lufthansa", "british airways", "etihad", "thai airways", "srilankan",
      "makemytrip", "goibibo", "cleartrip", "easemytrip", "yatra", "ixigo", "happyeasygo",
      "trivago", "booking\\.com", "agoda", "expedia", w("oyo"), "airbnb", "treebo",
      "fabhotel", "zostel", "lemon tree", "marriott", "hyatt", "radisson", "novotel",
      "itc hotel", "taj hotel", w("ginger"), "hotel", "resort", "travels", "tourism"
    ),
    "Travel",
  ],
  [
    any(
      "airtel", "vodafone", w("vi"), "vi recharge", "bsnl", "mtnl", "jio ?fib", "jio ?recharge",
      "jio ?postpaid", "jio ?prepaid", "reliance jio", "act fibernet", "hathway", "den network",
      w("gtpl"), "excitel", "spectra", "railwire", "broadband", "fibernet", "internet bill",
      "landline", "postpaid bill", "mobile recharge", "prepaid recharge", "recharges?",
      "tata power", "electricity", "bescom", w("mseb"), "msedcl", "adani elec", "torrent power",
      w("cesc"), w("tneb"), w("kseb"), "pspcl", "uppcl", "power bill",
      "tata sky", "tata play", w("d2h"), "sun direct", w("dth"),
      "mahanagar", w("igl"), "indraprastha gas", "adani gas", "gujarat gas", w("gas"),
      "water bill", "municipal", "property tax", w("bbps")
    ),
    "Utilities & Bills",
  ],
  [
    any(
      "netflix", "spotify", "hotstar", "jiocinema", "jiohotstar", "prime video", "sonyliv",
      "zee5", "alt ?balaji", "eros now", w("aha"), "sun ?nxt", "hoichoi", w("mubi"),
      "crunchyroll", "apple tv", "apple music", "youtube", w("gaana"), w("wynk"), "jiosaavn",
      w("saavn"), "audible", "kindle", "bookmyshow", "district", "ticketnew", w("pvr"),
      w("inox"), "cinepolis", "carnival cinema", w("imax"), "cinema", "multiplex",
      w("steam"), "epic games", "playstation", "xbox", "nintendo", "roblox", "gaming",
      "discord", "twitch", "wonderla", "imagicaa", "kidzania", "snow world"
    ),
    "Entertainment",
  ],
  [
    any(
      "pharmacy", "apollo", "1mg", "tata 1mg", "pharmeasy", "netmeds", "truemeds", "medplus",
      "wellness forever", "guardian pharm", "frank ross", "hospital", "clinic", "nursing home",
      "fortis", "max health", "manipal", "narayana", "aster", "kokilaben", "lilavati",
      "medanta", "practo", "diagnostic", w("lab"), "path ?lab", "pathology", "thyrocare",
      "lal path", "srl diag", "metropolis", "healthians", "redcliffe",
      "cult\\.? ?fit", "cure ?fit", w("gym"), "fitness", "yoga", "dental", "dentist",
      "optical", "physiotherapy", "ayurved", "homeopath", "medical store"
    ),
    "Health",
  ],
  [
    any(
      "udemy", "coursera", "edx", "skillshare", "duolingo", "byju", "unacademy", "vedantu",
      "whitehat", "cuemath", "toppr", "embibe", "physics ?wallah", "\\bpw\\b", w("allen"),
      "aakash", "fiitjee", "resonance", "made easy", "simplilearn", "great learning",
      w("scaler"), "newton school", "upgrad", "testbook", "gradeup", "adda247", "oliveboard",
      "school", "college", "university", "institute", "academy", "tuition", "coaching",
      "exam fee", "admission fee", "semester fee", "hostel fee", "library"
    ),
    "Education",
  ],
  [
    any(
      "amazon", "flipkart", "myntra", "ajio", "nykaa", "purplle", "meesho", "snapdeal",
      "tata cliq", "tata neu", "limeroad", "urbanic", "bewakoof", "souled store",
      "shoppers stop", "lifestyle", "westside", "pantaloons", "max fashion", "fabindia",
      w("zara"), "h ?& ?m", "uniqlo", "levi", "puma", "adidas", w("nike"), "skechers",
      w("bata"), "decathlon", w("titan"), "tanishq", "caratlane", "lenskart", "firstcry",
      "croma", "reliance digital", "vijay sales", "sangeetha", "poorvika", "apple store",
      "samsung", "oneplus", "\\bmi\\b store", "xiaomi", w("boat"), "ikea", "urban ladder",
      "pepperfry", "wakefit", "sleepwell", "home centre", "mamaearth", "wow skin",
      "sugar cosmetic", "store", "retail", "mart\\b"
    ),
    "Shopping",
  ],
];

/**
 * Assign a category from the merchant string alone. This runs on every row at
 * parse time, with or without an API key. The optional AI review only ever
 * revises what this produced.
 */
/** A keyword the reader mapped to a category themselves. */
export interface CategoryRule {
  keyword: string;
  category: string;
}

/** Lowercase, punctuation to spaces, reference numbers gone, one space between words. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The reader's rule that fits a description best, if any does.
 *
 * A keyword has to start where a word starts, so "gas" never fires inside
 * "Vegas", but it may run on into the next word, because statements glue
 * merchants to cities ("SWIGGYBengaluru"). PDFs also drop spaces outright
 * ("Department ofPosts"), so a keyword of six letters or more is tried again
 * with every space removed from both sides. A match at a word start beats a
 * run-together one, and between two of the same kind the longer keyword wins.
 */
export function matchRule<R extends CategoryRule>(description: string, rules: R[]): R | null {
  const text = ` ${normalise(description)}`;
  const joined = text.replace(/ /g, "");
  let best: { rule: R; score: number } | null = null;
  for (const rule of rules) {
    const key = normalise(rule.keyword);
    if (!key) continue;
    const compact = key.replace(/ /g, "");
    const score = text.includes(` ${key}`)
      ? 2000 + compact.length
      : compact.length >= 6 && joined.includes(compact)
        ? 1000 + compact.length
        : 0;
    if (score && (!best || score > best.score)) best = { rule, score };
  }
  return best?.rule ?? null;
}

export function categorize(
  description: string,
  rules: CategoryRule[] = [],
  type: "debit" | "credit" = "debit"
): Category {
  // Money the card gave back is a credit whatever the description says, so a
  // cashback never ends up filed as a purchase or as Other.
  if (type === "credit") return "Credits";
  // The reader's own rules come first. They were written to override what the
  // built-in list would otherwise have decided.
  const own = matchRule(
    description,
    rules.filter((r) => (SPEND_CATEGORIES as readonly string[]).includes(r.category))
  );
  if (own) return own.category as Category;
  for (const [re, cat] of RULES) if (re.test(description)) return cat;
  return "Other";
}

/** Paying the card back. Everything else a card credits is a refund or a cashback. */
export const PAYMENT_PATTERN =
  "payment received|payment thank|cc payment|card payment|bbps|autopay|neft|imps|upi credit|payment - ";

export const FEE_RE =
  /annual fee|joining fee|membership fee|renewal fee|late fee|late payment|over ?limit|overlimit|processing fee|service charge|cash advance fee|reward redemption fee/i;

export const INTEREST_RE = /finance charge|interest charge|\binterest\b/i;

export const INTL_RE = /\b(usd|eur|gbp|aed|sgd|forex|fx markup|intl|international)\b/i;
