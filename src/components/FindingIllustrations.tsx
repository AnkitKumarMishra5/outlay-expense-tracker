const ITEMS = [
  {
    title: "The fee you did not notice",
    body: "Annual fees, late charges and the GST on top, pulled out of the line items and totalled.",
    art: (
      <svg viewBox="0 0 120 84" fill="none" aria-hidden className="illus">
        <path d="M26 8h68v62l-8-5-8 5-8-5-8 5-8-5-8 5-8-5-8 5V8Z" className="illus-paper" />
        <path d="M38 24h44M38 34h44M38 54h30" className="illus-line" />
        <rect x="34" y="40" width="52" height="10" rx="3" className="illus-flag" />
        <path d="M38 45h16M74 45h8" className="illus-flag-line" />
        <circle cx="94" cy="45" r="12" className="illus-badge" />
        <path d="M89.5 45h9M94 40.5v9" className="illus-badge-mark" />
      </svg>
    ),
  },
  {
    title: "The subscription that renewed",
    body: "The same merchant, the same amount, every month. Grouped so it stops hiding in the list.",
    art: (
      <svg viewBox="0 0 120 84" fill="none" aria-hidden className="illus">
        <circle cx="60" cy="42" r="26" className="illus-ring" />
        <path d="M60 16v10M60 58v10" className="illus-line" />
        <path d="M74 22a26 26 0 0 1 0 40" className="illus-arc" />
        <path d="M46 62a26 26 0 0 1 0-40" className="illus-arc illus-arc-2" />
        <rect x="46" y="34" width="28" height="16" rx="4" className="illus-flag" />
        <path d="M52 42h16" className="illus-flag-line" />
        <circle cx="86" cy="20" r="4" className="illus-dot" />
        <circle cx="34" cy="64" r="4" className="illus-dot illus-dot-2" />
      </svg>
    ),
  },
  {
    title: "The month you overspent",
    body: "Every card on one trend line, so a bad month shows up as a shape and not a surprise.",
    art: (
      <svg viewBox="0 0 120 84" fill="none" aria-hidden className="illus">
        <path d="M22 68h76" className="illus-line" />
        <rect x="30" y="46" width="12" height="22" rx="3" className="illus-bar" />
        <rect x="48" y="38" width="12" height="30" rx="3" className="illus-bar illus-bar-2" />
        <rect x="66" y="18" width="12" height="50" rx="3" className="illus-bar illus-bar-tall" />
        <rect x="84" y="50" width="12" height="18" rx="3" className="illus-bar illus-bar-4" />
        <path d="M24 32h72" className="illus-baseline" />
        <circle cx="72" cy="18" r="4.5" className="illus-badge illus-badge-warn" />
      </svg>
    ),
  },
];

export default function FindingIllustrations() {
  return (
    <ul className="mt-9 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
      {ITEMS.map((item, i) => (
        <li
          key={item.title}
          className="illus-card rise"
          style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
        >
          {item.art}
          <p className="mt-3 text-sm font-medium text-ink">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink2">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
