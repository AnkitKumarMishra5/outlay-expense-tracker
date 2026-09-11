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

export interface BuiltinPattern {
  id: string;
  template: string;
  describe: string;
}

/**
 * The combinations tried on every statement, in plain words. Each bank in
 * banks.ts lists the ids it is known to use so those are tried first, then
 * the rest in this order. Templates use the same tokens as custom patterns.
 */
export const BUILTIN_PATTERNS: BuiltinPattern[] = [
  { id: "N4U_DDMM", template: "{NAME4U}{DD}{MM}", describe: "First 4 letters of your name in CAPITALS, then birth day, then birth month" },
  { id: "N4L_DDMM", template: "{NAME4L}{DD}{MM}", describe: "First 4 letters of your name in lowercase, then birth day, then birth month" },
  { id: "N4C_DDMM", template: "{NAME4C}{DD}{MM}", describe: "First 4 letters of your name with only the first capital, then birth day, then birth month" },
  { id: "N4U_DDMMYY", template: "{NAME4U}{DD}{MM}{YY}", describe: "First 4 letters of your name in CAPITALS, then birth day, month and 2-digit year" },
  { id: "N4U_DDMMYYYY", template: "{NAME4U}{DD}{MM}{YYYY}", describe: "First 4 letters of your name in CAPITALS, then birth day, month and 4-digit year" },
  { id: "N4L_DDMMYYYY", template: "{NAME4L}{DD}{MM}{YYYY}", describe: "First 4 letters of your name in lowercase, then birth day, month and 4-digit year" },
  { id: "DDMM_N4U", template: "{DD}{MM}{NAME4U}", describe: "Birth day, then birth month, then first 4 letters of your name in CAPITALS" },
  { id: "DDMMYYYY", template: "{DD}{MM}{YYYY}", describe: "Your full date of birth as 8 digits: day, month, 4-digit year" },
  { id: "DDMMYY", template: "{DD}{MM}{YY}", describe: "Your date of birth as 6 digits: day, month, 2-digit year" },
  { id: "FNL_DDMM", template: "{FIRSTL}{DD}{MM}", describe: "Your whole first name in lowercase, then birth day, then birth month" },
  { id: "N4U_YYYY", template: "{NAME4U}{YYYY}", describe: "First 4 letters of your name in CAPITALS, then 4-digit birth year" },
  { id: "L4_DDMM", template: "{LAST4}{DD}{MM}", describe: "Last 4 digits of the card, then birth day, then birth month" },
  { id: "DDMM_L4", template: "{DD}{MM}{LAST4}", describe: "Birth day, then birth month, then last 4 digits of the card" },
  { id: "N4U_L4", template: "{NAME4U}{LAST4}", describe: "First 4 letters of your name in CAPITALS, then last 4 digits of the card" },
];

const GENERATORS: Record<string, (p: Parts) => string> = Object.fromEntries(
  BUILTIN_PATTERNS.map((b) => [b.id, (p: Parts) => fill(b.template, p)])
);

export type PatternGroup = "name" | "dob" | "card";

export interface PatternToken {
  id: string;
  label: string;
  hint: string;
  group: PatternGroup;
}

export const PATTERN_GROUPS: { id: PatternGroup; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "dob", label: "Date of birth" },
  { id: "card", label: "Card" },
];

export const PATTERN_TOKENS: PatternToken[] = [
  { id: "NAME4U", label: "NAME", hint: "First 4 letters of your name, capitals", group: "name" },
  { id: "NAME4L", label: "name", hint: "First 4 letters, lowercase", group: "name" },
  { id: "NAME4C", label: "Name", hint: "First 4 letters, first one capital", group: "name" },
  { id: "FIRSTU", label: "FIRSTNAME", hint: "Your whole first name, capitals", group: "name" },
  { id: "FIRSTL", label: "firstname", hint: "Your whole first name, lowercase", group: "name" },
  { id: "SURN4U", label: "SURNAME", hint: "First 4 letters of your surname, capitals", group: "name" },
  { id: "SURN4L", label: "surname", hint: "First 4 letters of your surname, lowercase", group: "name" },
  { id: "DD", label: "DD", hint: "Day of birth, two digits", group: "dob" },
  { id: "MM", label: "MM", hint: "Month of birth, two digits", group: "dob" },
  { id: "YY", label: "YY", hint: "Birth year, last two digits", group: "dob" },
  { id: "YYYY", label: "YYYY", hint: "Birth year, all four digits", group: "dob" },
  { id: "FIRST4", label: "First 4", hint: "First 4 digits of the card number", group: "card" },
  { id: "LAST4", label: "Last 4", hint: "Last 4 digits of the card number", group: "card" },
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

function fill(template: string, p: Parts): string {
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

export function renderPattern(
  template: string,
  name: string,
  dobISO: string,
  last4?: string | null,
  first4?: string | null
): string {
  return fill(template, parts(name, dobISO, last4, first4));
}

/** True when a custom template is identical to one of the built-in combinations. */
export function isBuiltinPattern(template: string): boolean {
  return BUILTIN_PATTERNS.some((b) => b.template === template);
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
