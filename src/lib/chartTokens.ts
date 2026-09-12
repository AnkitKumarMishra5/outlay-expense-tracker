"use client";

import { useEffect, useState } from "react";

export interface ChartTokens {
  grid: string;
  axis: string;
  muted: string;
  surface: string;
  line: string;
  ink: string;
  series: string[];
  other: string;
  categories: Record<string, string>;
}

const CATEGORY_LIGHT: Record<string, string> = {
  Shopping: "#2878c2",
  "Food & Dining": "#d1631e",
  Groceries: "#1c9c70",
  Travel: "#cba00f",
  "Utilities & Bills": "#cf5090",
  Fuel: "#2b8234",
  Health: "#7a4fd1",
  Entertainment: "#cf4141",
  Education: "#189aaa",
  "EMI & Loans": "#5a8130",
  Insurance: "#5b5bcc",
  "Fees & Charges": "#b233b2",
  Taxes: "#8a5a2b",
  Credits: "#878722",
  Other: "#8a93a3",
};

const CATEGORY_DARK: Record<string, string> = {
  Shopping: "#58a0e8",
  "Food & Dining": "#ee8646",
  Groceries: "#2fc493",
  Travel: "#e6bb2e",
  "Utilities & Bills": "#e578ac",
  Fuel: "#4fae59",
  Health: "#a184e6",
  Entertainment: "#e86a6a",
  Education: "#35bdd0",
  "EMI & Loans": "#86ad55",
  Insurance: "#8484e0",
  "Fees & Charges": "#d363d3",
  Taxes: "#c08a4e",
  Credits: "#b3b345",
  Other: "#8797ab",
};

const LIGHT: ChartTokens = {
  grid: "#dde5ef",
  axis: "#c3cddb",
  muted: "#6a7a91",
  surface: "#ffffff",
  line: "rgba(13,32,58,0.14)",
  ink: "#0b1b33",
  series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
  other: "#8a93a3",
  categories: CATEGORY_LIGHT,
};

const DARK: ChartTokens = {
  grid: "#1e2b3d",
  axis: "#2c3d54",
  muted: "#7f8fa5",
  surface: "#101a28",
  line: "rgba(255,255,255,0.11)",
  ink: "#eef3fa",
  series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
  other: "#8797ab",
  categories: CATEGORY_DARK,
};

function resolve(): ChartTokens {
  if (typeof window === "undefined") return DARK;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light") return LIGHT;
  if (attr === "dark") return DARK;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
}

export function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(DARK);

  useEffect(() => {
    const update = () => setTokens(resolve());
    update();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return tokens;
}


export function categoryColor(category: string, tokens: ChartTokens): string {
  return tokens.categories[category] ?? tokens.other;
}
