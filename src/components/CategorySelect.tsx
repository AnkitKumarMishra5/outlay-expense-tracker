"use client";

import { play } from "@/lib/sound";
import { CATEGORIES } from "@/lib/categories";
import { categoryColor, useChartTokens } from "@/lib/chartTokens";

export default function CategorySelect({
  value,
  onChange,
  disabled,
  label,
  flash,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label: string;
  flash?: boolean;
}) {
  const t = useChartTokens();
  const color = categoryColor(value, t);

  return (
    <span className={`cat-select ${flash ? "cat-flash" : ""}`} style={{ "--cat": color } as React.CSSProperties}>
      <span className="cat-dot" aria-hidden />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          play("tick");
          onChange(e.target.value);
        }}
        aria-label={label}
        className="cat-field"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c} style={{ color: categoryColor(c, t) }}>
            {c}
          </option>
        ))}
      </select>
    </span>
  );
}
