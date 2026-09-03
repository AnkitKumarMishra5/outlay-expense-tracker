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

const RULES: [RegExp, (typeof CATEGORIES)[number]][] = [
  [/swiggy|zomato|dominos|mcdonald|kfc|pizza|restaurant|cafe|barbeque|eatfit|dunkin|starbucks|chai/i, "Food & Dining"],
  [/bigbasket|blinkit|zepto|instamart|grofers|dmart|reliance fresh|more retail|grocery|kirana|nature'?s basket/i, "Groceries"],
  [/amazon|flipkart|myntra|ajio|nykaa|meesho|croma|reliance digital|decathlon|ikea|tata cliq|snapdeal/i, "Shopping"],
  [/uber|ola|rapido|irctc|indigo|air ?india|vistara|spicejet|akasa|makemytrip|goibibo|cleartrip|redbus|yatra|oyo|airbnb|hotel|ixigo/i, "Travel"],
  [/petrol|fuel|hpcl|bpcl|indian ?oil|iocl|shell|nayara/i, "Fuel"],
  [/airtel|jio|vodafone|vi recharge|bsnl|tata power|electricity|bescom|mseb|adani elec|broadband|dth|tata sky|d2h|gas|mahanagar|igl|water bill|bbps/i, "Utilities & Bills"],
  [/netflix|spotify|hotstar|prime video|sonyliv|zee5|bookmyshow|pvr|inox|youtube|gaming|steam|playstation|xbox/i, "Entertainment"],
  [/pharmacy|apollo|1mg|pharmeasy|netmeds|hospital|clinic|diagnostic|lab|medplus|practo|cult\.? ?fit/i, "Health"],
  [/udemy|coursera|byjus|unacademy|school|college|university|tuition|upgrad/i, "Education"],
  [/equated monthly|\bemi\s+(?:principal|interest|instal|conversion|booking)|\binstal?lment\b|\bloan\b/i, "EMI & Loans"],
  [/insurance|lic of india|policy ?bazaar|hdfc ergo|icici lombard|acko|digit/i, "Insurance"],
  [/annual fee|joining fee|membership fee|renewal fee|late fee|late payment|over ?limit|finance charge|interest|service charge|processing fee|\bgst\b|igst|cgst|sgst|markup/i, "Fees & Charges"],
  [/payment received|payment thank|payment credit|autopay|neft|imps|upi payment|cashback|refund|reversal/i, "Payments & Refunds"],
];

export function categorize(description: string): (typeof CATEGORIES)[number] {
  for (const [re, cat] of RULES) if (re.test(description)) return cat;
  return "Other";
}

export const FEE_RE =
  /annual fee|joining fee|membership fee|renewal fee|late fee|late payment|over ?limit|overlimit|processing fee|service charge|cash advance fee|reward redemption fee/i;

export const INTEREST_RE = /finance charge|interest charge|\binterest\b/i;

export const INTL_RE = /\b(usd|eur|gbp|aed|sgd|forex|fx markup|intl|international)\b/i;
