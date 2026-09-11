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
  "Payments & Refunds",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

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
    any(
      "payment received", "payment thank", "payment credit", "card payment", "cc payment",
      "autopay", "auto ?debit", "standing instruction", "e-?mandate", "nach ",
      w("neft"), w("imps"), w("rtgs"), "upi credit", "net ?banking",
      "cashback", "cash back", "refund", "reversal", "reversed", "chargeback",
      "dispute credit", "credit adjustment", "goodwill", "excess payment"
    ),
    "Payments & Refunds",
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
      "landline", "postpaid bill", "mobile recharge", "prepaid recharge",
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
export function categorize(description: string): Category {
  for (const [re, cat] of RULES) if (re.test(description)) return cat;
  return "Other";
}

export const FEE_RE =
  /annual fee|joining fee|membership fee|renewal fee|late fee|late payment|over ?limit|overlimit|processing fee|service charge|cash advance fee|reward redemption fee/i;

export const INTEREST_RE = /finance charge|interest charge|\binterest\b/i;

export const INTL_RE = /\b(usd|eur|gbp|aed|sgd|forex|fx markup|intl|international)\b/i;
