import { bankById } from "./banks";

interface Parts {
  name4U: string;
  name4L: string;
  firstL: string;
  surn4U: string;
  surn4L: string;
  dd: string;
  mm: string;
  yyyy: string;
  yy: string;
  last4: string;
  first4: string;
}

function parts(name: string, dobISO: string, last4?: string | null, first4?: string | null): Parts {
  const clean = name.replace(/[^a-zA-Z ]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  const surname = words.length > 1 ? words[words.length - 1] : "";
  const joined = clean.replace(/\s+/g, "");
  const [yyyy, mm, dd] = dobISO.split("-");
  return {
    name4U: joined.slice(0, 4).toUpperCase(),
    name4L: joined.slice(0, 4).toLowerCase(),
    firstL: first.toLowerCase(),
    surn4U: surname.slice(0, 4).toUpperCase(),
    surn4L: surname.slice(0, 4).toLowerCase(),
    dd,
    mm,
    yyyy,
    yy: yyyy.slice(2),
    last4: last4 ?? "",
    first4: first4 ?? "",
  };
}

const GENERATORS: Record<string, (p: Parts) => string> = {
  N4U_DDMM: (p) => `${p.name4U}${p.dd}${p.mm}`,
  N4L_DDMM: (p) => `${p.name4L}${p.dd}${p.mm}`,
  N4C_DDMM: (p) => `${p.name4U.charAt(0)}${p.name4L.slice(1)}${p.dd}${p.mm}`,
  N4U_DDMMYY: (p) => `${p.name4U}${p.dd}${p.mm}${p.yy}`,
  N4U_DDMMYYYY: (p) => `${p.name4U}${p.dd}${p.mm}${p.yyyy}`,
  N4L_DDMMYYYY: (p) => `${p.name4L}${p.dd}${p.mm}${p.yyyy}`,
  DDMM_N4U: (p) => `${p.dd}${p.mm}${p.name4U}`,
  DDMMYYYY: (p) => `${p.dd}${p.mm}${p.yyyy}`,
  DDMMYY: (p) => `${p.dd}${p.mm}${p.yy}`,
  FNL_DDMM: (p) => `${p.firstL}${p.dd}${p.mm}`,
  N4U_YYYY: (p) => `${p.name4U}${p.yyyy}`,
  L4_DDMM: (p) => (p.last4 ? `${p.last4}${p.dd}${p.mm}` : ""),
  DDMM_L4: (p) => (p.last4 ? `${p.dd}${p.mm}${p.last4}` : ""),
  N4U_L4: (p) => (p.last4 ? `${p.name4U}${p.last4}` : ""),
};

export interface PatternToken {
  id: string;
  label: string;
  hint: string;
}

export const PATTERN_TOKENS: PatternToken[] = [
  { id: "NAME4U", label: "NAME", hint: "First 4 letters of your name, capitals" },
  { id: "NAME4L", label: "name", hint: "First 4 letters, lowercase" },
  { id: "NAME4C", label: "Name", hint: "First 4 letters, first one capital" },
  { id: "FIRSTU", label: "FIRSTNAME", hint: "Your whole first name, capitals" },
  { id: "FIRSTL", label: "firstname", hint: "Your whole first name, lowercase" },
  { id: "SURN4U", label: "SURNAME", hint: "First 4 letters of your surname, capitals" },
  { id: "SURN4L", label: "surname", hint: "First 4 letters of your surname, lowercase" },
  { id: "DD", label: "DD", hint: "Day of birth, two digits" },
  { id: "MM", label: "MM", hint: "Month of birth, two digits" },
  { id: "YY", label: "YY", hint: "Birth year, last two digits" },
  { id: "YYYY", label: "YYYY", hint: "Birth year, all four digits" },
  { id: "FIRST4", label: "First 4", hint: "First 4 digits of the card number" },
  { id: "LAST4", label: "Last 4", hint: "Last 4 digits of the card number" },
];

const TOKEN_VALUES: Record<string, (p: Parts) => string> = {
  NAME4U: (p) => p.name4U,
  NAME4L: (p) => p.name4L,
  NAME4C: (p) => `${p.name4U.charAt(0)}${p.name4L.slice(1)}`,
  FIRSTU: (p) => p.firstL.toUpperCase(),
  FIRSTL: (p) => p.firstL,
  SURN4U: (p) => p.surn4U,
  SURN4L: (p) => p.surn4L,
  DD: (p) => p.dd,
  MM: (p) => p.mm,
  YY: (p) => p.yy,
  YYYY: (p) => p.yyyy,
  LAST4: (p) => p.last4,
  FIRST4: (p) => p.first4,
};

export const SAMPLE_IDENTITY = {
  name: "Priya Nair",
  dob: "1992-03-15",
  first4: "4532",
  last4: "4321",
  dobLabel: "15 March 1992",
  cardLabel: "4532 1122 3344 4321",
};

export function sampleFor(tokenId: string): string {
  const fn = TOKEN_VALUES[tokenId];
  if (!fn) return "";
  return fn(parts(SAMPLE_IDENTITY.name, SAMPLE_IDENTITY.dob, SAMPLE_IDENTITY.last4, SAMPLE_IDENTITY.first4));
}

export function renderPattern(
  template: string,
  name: string,
  dobISO: string,
  last4?: string | null,
  first4?: string | null
): string {
  const p = parts(name, dobISO, last4, first4);
  let missing = false;
  const out = template.replace(/\{([A-Z0-9]+)\}/g, (whole, id: string) => {
    const fn = TOKEN_VALUES[id];
    if (!fn) return whole;
    const value = fn(p);
    if (!value) missing = true;
    return value;
  });
  return missing ? "" : out;
}

export function describePattern(template: string): string {
  return template.replace(/\{([A-Z0-9]+)\}/g, (whole, id: string) => {
    const token = PATTERN_TOKENS.find((t) => t.id === id);
    return token ? ` ${token.label} ` : whole;
  }).replace(/\s+/g, " ").trim();
}

export function inferPattern(
  password: string,
  name: string,
  dobISO: string,
  last4?: string | null,
  first4?: string | null
): string | null {
  const p = parts(name, dobISO, last4, first4);
  const options = Object.entries(TOKEN_VALUES)
    .map(([id, fn]) => ({ id, value: fn(p) }))
    .filter((o) => o.value.length > 0)
    .sort((a, b) => b.value.length - a.value.length);

  function walk(rest: string, acc: string, literals: number): string | null {
    if (!rest) return literals <= 2 ? acc : null;
    for (const o of options) {
      if (rest.startsWith(o.value)) {
        const found = walk(rest.slice(o.value.length), `${acc}{${o.id}}`, literals);
        if (found) return found;
      }
    }
    if (literals >= 2) return null;
    return walk(rest.slice(1), acc + rest[0], literals + 1);
  }

  const inferred = walk(password, "", 0);
  return inferred && /\{[A-Z0-9]+\}/.test(inferred) ? inferred : null;
}

export function candidatePasswords(
  bankId: string,
  name: string,
  dobISO: string,
  last4?: string | null,
  customPatterns: string[] = [],
  first4?: string | null
): string[] {
  const p = parts(name, dobISO, last4, first4);
  const preferred = bankById(bankId).patterns;
  const ordered = [...preferred, ...Object.keys(GENERATORS).filter((k) => !preferred.includes(k))];
  const out: string[] = [];
  for (const template of customPatterns) {
    const pw = renderPattern(template, name, dobISO, last4, first4);
    if (pw && !out.includes(pw)) out.push(pw);
  }
  for (const id of ordered) {
    const pw = GENERATORS[id]?.(p);
    if (pw && !out.includes(pw)) out.push(pw);
  }
  return out;
}
