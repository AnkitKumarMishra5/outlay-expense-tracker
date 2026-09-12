"use client";

import { play } from "@/lib/sound";
import { SPEND_CATEGORIES } from "@/lib/categories";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

export default function CategorySelect({
  value,
  onChange,
  disabled,
  label,
  flash,
  credit,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label: string;
  flash?: boolean;
  /** A credit is always Credits, so there is nothing to pick. */
  credit?: boolean;
}) {
  const t = useChartTokens();
  const shown = credit ? "Credits" : value;
  const color = categoryColor(shown, t);
  const options: readonly string[] = credit ? ["Credits"] : SPEND_CATEGORIES;

  return (
    <span className={`cat-select ${flash ? "cat-flash" : ""}`} style={{ "--cat": color } as React.CSSProperties}>
      <span className="cat-dot" aria-hidden />
      <select
        value={shown}
        disabled={disabled || credit}
        title={credit ? "Money the card gave back is always Credits" : undefined}
        onChange={(e) => {
          play("tick");
          onChange(e.target.value);
        }}
        aria-label={label}
        className="cat-field"
      >
        {options.map((c) => (
          <option key={c} value={c} style={{ color: categoryColor(c, t) }}>
            {c}
          </option>
        ))}
      </select>
    </span>
  );
}
