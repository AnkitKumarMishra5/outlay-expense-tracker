import type { Metadata } from "next";
import { APP_NAME } from "@/lib/developer";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    h: "Where your data lives",
    p: "Every statement you upload is parsed and stored in a Postgres database you provision and control. There is no shared backend, no vendor account, and no copy of your data held by anyone else.",
  },
  {
    h: "What is never stored",
    p: "Statement PDFs are parsed in memory during the upload request and discarded. They are never written to disk. Full card numbers are never captured at all: a card is identified by an optional four digits you type yourself.",
  },
  {
    h: "What is encrypted",
    p: "Your name, date of birth and remembered statement passwords are encrypted with AES-256-GCM before they reach the database. The key lives in your environment file, never in the database, and never leaves the server process.",
  },
  {
    h: "Network activity",
    p: "With no OpenAI key configured the application makes no outbound requests: no analytics, no telemetry, no third-party fonts or scripts. Reading a statement never uses AI. The only optional model call is the category review you trigger yourself, which sends merchant descriptions and nothing else, redacted first, with card numbers reduced to their last four digits and emails, phone numbers, PAN and Aadhaar-shaped values masked.",
  },
  {
    h: "Access",
    p: "The instance is locked behind a passcode you set. Sessions are bound to a signed, http-only cookie and expire after fifteen minutes of inactivity.",
  },
  {
    h: "Removing your data",
    p: "Settings offers a complete JSON export, per-statement and per-card deletion, and a full wipe behind a typed confirmation. Deleting the database file removes everything.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-ink2">
        This page describes how {APP_NAME} handles your data. It applies to the hosted instance you signed up on,
        and to any instance run from the source.
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
