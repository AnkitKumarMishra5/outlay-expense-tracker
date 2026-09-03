import { DEVELOPER } from "@/lib/developer";

export const CONTACT_LINKS = [
  { key: "site", href: DEVELOPER.site, label: "Portfolio", detail: "ankitkumarmishra.is-a.dev" },
  { key: "email", href: `mailto:${DEVELOPER.email}`, label: "Email", detail: DEVELOPER.email },
  { key: "linkedin", href: DEVELOPER.linkedin, label: "LinkedIn", detail: "ankitkumarmishra" },
  { key: "github", href: DEVELOPER.github, label: "GitHub", detail: "AnkitKumarMishra5" },
] as const;

export function ContactIcon({ name }: { name: string }) {
  if (name === "email")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3 7l8.4 5.6a1.5 1.5 0 0 0 1.7 0L21 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  if (name === "github")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.5v-1.9c-2.92.64-3.54-1.25-3.54-1.25-.48-1.22-1.17-1.54-1.17-1.54-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.61 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.89 1.07a10 10 0 0 1 5.26 0c2-1.35 2.88-1.07 2.88-1.07.58 1.45.22 2.52.11 2.79.68.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.91-4.79 5.17.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5Z" />
      </svg>
    );
  if (name === "linkedin")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.65h.05c.53-.95 1.83-1.95 3.76-1.95C21.6 8.7 23 10.9 23 14.3V21h-4v-6c0-1.6-.03-3.66-2.25-3.66-2.25 0-2.6 1.74-2.6 3.54V21h-4V9Z" />
      </svg>
    );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.9 12h18.2M12 2.8c2.3 2.5 3.5 5.8 3.5 9.2s-1.2 6.7-3.5 9.2c-2.3-2.5-3.5-5.8-3.5-9.2S9.7 5.3 12 2.8Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
