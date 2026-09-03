import type { Metadata } from "next";
import { APP_NAME, DEVELOPER } from "@/lib/developer";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS = [
  {
    h: "Licence",
    p: `${APP_NAME} is released under the MIT licence. You may run, modify and redistribute it, including commercially, provided the copyright notice and licence text are retained.`,
  },
  {
    h: "No warranty",
    p: "The software is provided as is, without warranty of any kind. Statement parsing is best effort: layouts vary between issuers and between months, which is why every figure is reconciled against the totals printed on the statement and surfaced for your review before it is saved.",
  },
  {
    h: "Not financial advice",
    p: "Fee, interest and anomaly flags are informational. They are not financial, tax or legal advice. Verify anything material against the statement issued by your bank before acting on it.",
  },
  {
    h: "Your responsibility",
    p: "You run the instance, so you own the passcode, the encryption key, the database and any backups. Keep the environment file private and set a strong passcode on any deployment that is reachable from the internet.",
  },
  {
    h: "Trademarks",
    p: "Bank names identify the issuer of a statement and are the property of their respective owners. No affiliation or endorsement is implied, and no issuer logo artwork is redistributed with this software.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Terms</h1>
      <p className="mt-2 text-sm text-ink2">
        © {new Date().getFullYear()} {DEVELOPER.name}. These terms cover the software itself, not any bank relationship.
      </p>
      <div className="mt-6 space-y-5">
        {SECTIONS.map((s, i) => (
          <section key={s.h} className="card rise p-5" style={{ "--d": `${i * 50}ms` } as React.CSSProperties}>
            <h2 className="text-sm font-semibold">{s.h}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink2">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
