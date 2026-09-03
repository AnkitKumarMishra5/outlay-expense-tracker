import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Outlay by Ankit Kumar Mishra, expense tracker and validator for Indian credit card statements";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #080d15 0%, #101a28 55%, #12356f 100%)",
          padding: 72,
          fontFamily: "sans-serif",
          color: "#eef3fa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="11" fill="#2f6fdc" />
            <rect x="9.5" y="21" width="4.4" height="9.5" rx="2.2" fill="#ffffff" opacity="0.55" />
            <rect x="17.8" y="16.5" width="4.4" height="14" rx="2.2" fill="#ffffff" opacity="0.8" />
            <rect x="26.1" y="24" width="4.4" height="6.5" rx="2.2" fill="#ffffff" opacity="0.4" />
            <path d="M10 15.4l5.6 5.4L30.6 8.6" fill="none" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1 }}>Outlay</div>
            <div style={{ fontSize: 19, color: "#7f8fa5", letterSpacing: 2, textTransform: "uppercase" }}>
              by Ankit Kumar Mishra
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, maxWidth: 940 }}>
            Track, validate and analyse card spend
          </div>
          <div style={{ fontSize: 29, color: "#b6c4d6", maxWidth: 940 }}>
            Unlocks password-protected Indian credit card statements, reconciles them against the printed totals, and
            breaks down every rupee.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#7f8fa5" }}>
          <div style={{ border: "1px solid #1e2b3d", borderRadius: 999, padding: "8px 20px" }}>Encrypted at rest</div>
          <div style={{ border: "1px solid #1e2b3d", borderRadius: 999, padding: "8px 20px" }}>AES-256-GCM at rest</div>
          <div style={{ border: "1px solid #1e2b3d", borderRadius: 999, padding: "8px 20px" }}>Next.js · Postgres</div>
        </div>
      </div>
    ),
    size
  );
}
