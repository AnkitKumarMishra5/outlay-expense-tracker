export default function Logo({ size = 28, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="outlay-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6fdc" />
          <stop offset="100%" stopColor="#12356f" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#outlay-mark)" />
      <rect x="9.5" y="21" width="4.4" height="9.5" rx="2.2" fill="#ffffff" opacity="0.55" />
      <rect x="17.8" y="16.5" width="4.4" height="14" rx="2.2" fill="#ffffff" opacity="0.8" />
      <rect x="26.1" y="24" width="4.4" height="6.5" rx="2.2" fill="#ffffff" opacity="0.4" />
      <path
        className={animate ? "logo-tick" : undefined}
        d="M10 15.4l5.6 5.4L30.6 8.6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
