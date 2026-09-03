export interface Bank {
  id: string;
  name: string;
  short: string;
  color: string;
  c2: string;
  c3?: string;
  fg?: string;
  patterns: string[];
  usuallyUnlocked?: boolean;
}

export const BANKS: Bank[] = [
  { id: "hdfc", name: "HDFC Bank", short: "HD", color: "#004C8F", c2: "#1D6FBF", c3: "#0A2A52", patterns: ["N4U_DDMM", "N4U_DDMMYYYY"] },
  { id: "icici", name: "ICICI Bank", short: "IC", color: "#AE282E", c2: "#F06321", c3: "#7A1420", patterns: ["N4L_DDMM", "N4L_DDMMYYYY"] },
  { id: "sbi", name: "SBI Card", short: "SB", color: "#22409A", c2: "#00B5EF", c3: "#101F52", patterns: ["DDMMYYYY", "L4_DDMM"] },
  { id: "axis", name: "Axis Bank", short: "AX", color: "#97144D", c2: "#C13A6B", c3: "#5B0B2E", patterns: ["N4U_DDMM", "N4U_DDMMYYYY"] },
  { id: "kotak", name: "Kotak Mahindra", short: "KM", color: "#ED1C24", c2: "#003874", c3: "#7A0C12", patterns: ["N4U_DDMM", "DDMMYYYY"] },
  { id: "amex", name: "American Express", short: "AE", color: "#016FD0", c2: "#00AEEF", c3: "#013A6E", patterns: [], usuallyUnlocked: true },
  { id: "idfc", name: "IDFC FIRST", short: "ID", color: "#9E1B32", c2: "#C9A227", c3: "#5E0F1E", patterns: ["N4U_DDMM"] },
  { id: "indusind", name: "IndusInd Bank", short: "IN", color: "#98272A", c2: "#C34E37", c3: "#5C1517", patterns: ["N4U_DDMM"] },
  { id: "yes", name: "YES Bank", short: "YB", color: "#00518F", c2: "#00A0DF", c3: "#00294A", patterns: ["N4U_DDMM"] },
  { id: "rbl", name: "RBL Bank", short: "RB", color: "#21317D", c2: "#E31837", c3: "#131C4A", patterns: ["N4U_DDMM"] },
  { id: "hsbc", name: "HSBC", short: "HS", color: "#DB0011", c2: "#8B0009", c3: "#6E0008", patterns: ["DDMMYYYY", "N4U_DDMM"] },
  { id: "sc", name: "Standard Chartered", short: "SC", color: "#0F7A3D", c2: "#2FA3D9", c3: "#08461F", patterns: ["N4U_DDMM"] },
  { id: "au", name: "AU Small Finance", short: "AU", color: "#ED7621", c2: "#7A2E8D", c3: "#8A3D0C", patterns: ["N4U_DDMM"] },
  { id: "federal", name: "Federal Bank", short: "FB", color: "#F7A800", c2: "#0072BC", c3: "#8A5E00", fg: "#1a1a19", patterns: ["N4U_DDMM"] },
  { id: "onecard", name: "OneCard (FPL)", short: "OC", color: "#141414", c2: "#3A3A3A", c3: "#050505", patterns: [], usuallyUnlocked: true },
  { id: "bobcard", name: "BOBCARD", short: "BC", color: "#F15A29", c2: "#FF8D3A", c3: "#8A2F12", patterns: ["N4U_DDMM"] },
  { id: "other", name: "Other issuer", short: "??", color: "#52514e", c2: "#6E6C66", c3: "#2E2D2B", patterns: [] },
];

export const bankById = (id: string): Bank =>
  BANKS.find((b) => b.id === id) ?? BANKS[BANKS.length - 1];
