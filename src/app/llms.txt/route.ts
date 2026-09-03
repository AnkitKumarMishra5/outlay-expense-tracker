import { APP_NAME, APP_TAGLINE, DEVELOPER } from "@/lib/developer";
import { CATEGORIES } from "@/lib/categories";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${APP_NAME}

> ${APP_TAGLINE}

${APP_NAME} opens the password-protected PDF an Indian bank emails every month, checks its arithmetic against the totals the bank printed, and reports spend, categories and payment dues across every card. Built by ${DEVELOPER.name} (${DEVELOPER.site}).

- Live: ${siteUrl}
- Source: ${DEVELOPER.github}/outlay-expense-tracker
- Licence: MIT
- Registration: invite only. Ask ${DEVELOPER.name} at ${DEVELOPER.email} for a code.

## What it does

- Derives statement passwords from the cardholder profile, trying fourteen issuer patterns, and learns a new template from any password entered once.
- Unlocks and reads the PDF in memory. Nothing is written to disk.
- Extracts transactions deterministically. No model is involved in reading a statement.
- Runs twelve verification checks before saving, including computed debit and credit totals against the totals printed on the statement.
- Detects recurring charges: the same merchant at the same amount on a monthly or yearly cycle, across statements, costed per year.
- Tracks each statement as due, overdue or settled, counted against the current billing cycle.
- Reports spend by card, category and month, with a calendar carrying both daily spend and payment due dates.

## Categories

${CATEGORIES.join(", ")}.

## Privacy

Name, date of birth, card digits and statement passwords are encrypted with AES-256-GCM under a key derived per account. Sessions lock after fifteen idle minutes. There is no analytics, no telemetry and no third-party script. The only optional outbound call is a category review the account holder triggers, capped at two runs per card per month, which sends merchant descriptions and nothing else.

## Pages

- ${siteUrl}/ landing page with a live demo dashboard on invented data
- ${siteUrl}/register create an account with an invite code
- ${siteUrl}/login sign in
- ${siteUrl}/privacy how data is handled
- ${siteUrl}/terms terms of use
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
