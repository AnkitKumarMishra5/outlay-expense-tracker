# Outlay

*by [Ankit Kumar Mishra](https://ankitkumarmishra.is-a.dev)*

**Your statements, reconciled. Every month.**

Expense tracker, validator and analyser for Indian credit card statements.

Banks email a password-protected PDF every month. Outlay derives that password from the cardholder profile, opens the file in memory, extracts the transactions, reconciles the computed totals against the totals printed on the statement, flags fee and anomaly lines, and turns the result into spend analytics across every card.

Scope is narrow on purpose: credit card statements only. Not budgeting, not net worth, not account aggregation.

---

## A look at it

**The dashboard.** Every card you hold, ranked by spend, with the bills of the current cycle and how many are still outstanding.

<p align="center">
  <img src="docs/screenshots/dashboard.png" width="900" alt="Dashboard: nineteen cards ranked by spend, four headline figures, a bills panel showing seventeen of nineteen settled this cycle, spend trend and category split">
</p>

**A statement, verified.** Twelve checks run before anything is saved, and the result is stored with the statement. Every category is a dropdown, so a wrong guess takes one click to fix.

<p align="center">
  <img src="docs/screenshots/statement.png" width="900" alt="Statement detail: verification checks with passes and warnings, then the transaction list with a colour-coded category dropdown on every row">
</p>

**The calendar.** Daily spend and every payment due on one grid. Amber means a bill falls due, green means it is settled.

<p align="center">
  <img src="docs/screenshots/calendar.png" width="900" alt="Calendar for September: spend heat per day, amber badges for bills due and green ticks for settled ones">
</p>

**Every transaction, one page.** Filter by card, by statement, by category or by text, and correct a category inline.

<p align="center">
  <img src="docs/screenshots/transactions.png" width="900" alt="Transactions page: filters for search, card, statement and category, and a table of every transaction across every card">
</p>

**Statements.** What has been read, what it checked out at, and what is still to pay.

<p align="center">
  <img src="docs/screenshots/statements.png" width="900" alt="Statement list: every statement across every card with its settled status and check summary">
</p>

**Upload.** A month of PDFs at once. Each one is unlocked, read and matched to a card before anything is written.

<p align="center">
  <img src="docs/screenshots/upload.png" width="900" alt="Upload screen: drop a month of password-protected statement PDFs at once">
</p>

The landing page runs this whole dashboard on invented cards and invented spend, so you can try it before signing up.

---

## Get started in easy steps

For anyone using the hosted instance. No install, nothing to run.

1. **Ask Ankit for an invite code.** [Email](mailto:akmishra5514@gmail.com) or [LinkedIn](https://www.linkedin.com/in/ankitkumarmishra/). Registration is invite only, so there is no open signup form on the public URL.
2. **Look around first.** The landing page is a working dashboard on sample data. Click a card, change the range, hover a day in the calendar.
3. **Create your account.** Email, a password of at least ten characters, and the invite code.
4. **Enter your name and date of birth exactly as they appear on the statement.** These two values derive your PDF passwords and are the only reason Outlay asks for them. Both are encrypted under a key unique to your account.
5. **Add your cards, or skip it.** Add each card by issuer, name and last four digits, or add nothing and let the first upload identify them for you.
6. **Upload a month of statements at once.** Each PDF is unlocked, read, and matched to a card from its own text. Anything it cannot match waits for you rather than being guessed.
7. **Review, then save.** Nothing is written until you approve the batch. Read the verification panel on each statement first: a checksum mismatch means the file was only partly read.
8. **Fix anything the parser got wrong.** Correct an amount, delete a row that was never a transaction, or change a category from the dropdown. The totals and the checks recalculate on every edit.
9. **Mark bills settled as you pay them.** From the dashboard, the calendar, the statement list or the statement itself. A statement with nothing owed settles itself.
10. **Read the dashboard.** Spend by card, category and month across five ranges, a calendar carrying both daily spend and payment due dates, and a bills panel showing how much of the current cycle is still outstanding.

Sessions lock after fifteen idle minutes. Settings holds a full JSON export and a wipe gated on a typed confirmation phrase.

## What it does

| Area | Capability |
| --- | --- |
| **Unlock** | Fourteen password patterns derived from the cardholder profile, plus templates learned from any password you type once |
| **Extract** | Deterministic heuristic parser, no network, same result every time |
| **Verify** | Twelve checks per statement, including computed totals against the totals the bank printed |
| **Correct** | Edit an amount, delete a mis-read row, change a category. Totals and checks recalculate on every edit |
| **Categorise** | Rule-based on the merchant string, editable everywhere, with an optional AI review capped at two runs per card per month |
| **Recurring** | Same merchant, same amount, steady cycle, detected across statements and costed per year |
| **Settle** | Per-statement due, overdue and settled status, with the dashboard counting the current cycle |
| **Analyse** | Spend by card, category and month across five ranges, plus a spend-and-dues calendar |
| **Browse** | Every transaction across every card on one page, filtered by card, statement, category, type or text |
| **Export** | Full JSON export, and a wipe gated on a typed confirmation phrase |

## The pipeline, end to end

```
PDF (browser)
  -> proxy: session check, same-origin check
  -> /api/statements/parse
       unlock    pdf.js, candidate passwords, in memory only
       extract   heuristic parser, no network
       validate  12 checks, including totals vs the printed figures
  -> review in the UI, nothing persisted yet
  -> POST /api/statements
       transaction rows + statement metadata + the check record
  -> Postgres
```

The uploaded file exists only for the duration of the parse request. Nothing is written to disk, and only rows you approve are persisted.

## Fourteen candidates, one that works

There is no password vault to seed. Statement passwords are derived at upload time from the cardholder name, date of birth and optional last four digits, tried in an order the issuer registry specifies.

| Pattern | Candidate for Priya Nair, 15/03/1992, card 4321 | Issuers that prefer it |
|---|---|---|
| `NAME4+DDMM` | `PRIY1503` | HDFC, Axis, IDFC, IndusInd, YES, RBL |
| `name4+ddmm` | `priy1503` | ICICI |
| `DDMMYYYY` | `15031992` | SBI Card, HSBC |
| `NAME4+DDMMYYYY` | `PRIY15031992` | fallback |
| `last4+DDMM` | `43211503` | card-number schemes |

Nine further permutations are tried after the preferred ones, deduplicated. The candidate that opens the file is encrypted and stored against that card, so subsequent months open on the first attempt. Issuers using a CRN or another scheme fall back to a single manual entry, remembered the same way.

If none of the built-in combinations fits, the password you type once is decomposed against your own name, date of birth and card digits, and the resulting template is saved to your profile and tried first from then on. A statement locked with `USER1503` becomes `{SURN4U}{DD}{MM}`, so the next card at that issuer opens without being asked. Settings also has a builder that assembles the same templates from plain-English pieces with a live preview.

Candidates never leave the process. They are not logged, not returned in any response, and not written anywhere in plaintext.

## Upload is a batch, not a file

The upload screen takes any number of PDFs at once. Each file is read independently, so one failure never blocks the rest, and every file lands in one of five states before anything is written:

| State | Meaning |
|---|---|
| Ready | Parsed, and the card was identified from the statement |
| Card needed | Parsed, but no card in the wallet matches. Offers to create it from what was read |
| Password needed | Protected, and no derived candidate opened it. Takes a password inline |
| Not a statement | Too few statement markers and no transactions, so it is rejected |
| Failed | Unreadable file |

Card matching requires an exact last-four match when the statement prints readable digits, so a second card at the same issuer is never silently assigned. Only when no digits can be read, and the issuer has exactly one card, is that card assumed. Nothing is persisted until you press save, and mappings stay editable until then.

The endpoint takes one file and returns one result, so an automated fetcher can post to it exactly as the browser does.

## One parser, and AI only where it earns its keep

Extraction is deterministic. `heuristicParse` reads the common `DD/MM/YYYY DESCRIPTION 1,234.56 [Cr]` layout with no network access, and the twelve checks below are what prove it read the file correctly. No model is involved in getting numbers out of a statement, so an upload costs nothing and behaves the same every time.

The model is used for one thing: **rereading merchant names when the category rules get them wrong**. Rules match on substrings, so a merchant the registry has never seen lands in "Other", and an occasional one lands in the wrong bucket. That is a language problem, which is what a model is actually good at.

It is metered because it is the only thing that costs money. **Each card gets two reviews per calendar month**, counted in an `ai_usage` row. The review is taken before the model is called and handed straight back if nothing usable comes of it, so you only spend one on an answer you actually got. Only the merchant descriptions are sent, redacted first, never amounts or dates. With no key configured the feature is visibly disabled and the app makes no outbound request at all.

On upload, the whole batch goes to the model in **one call**, taking one review off each card involved. A panel then shows what changed, each pick editable, and none of it is a required step. The same engine sits behind the recheck button on a statement page.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | create an account, invite code required |
| POST | `/api/auth/login` | public | email and password exchange for a session |
| POST | `/api/auth/session` | session | slide the idle window forward |
| POST | `/api/auth/logout` | public | clear the session |
| GET, POST | `/api/profile` | session | encrypted cardholder profile |
| GET, POST | `/api/cards` | session | card registry |
| PATCH, DELETE | `/api/cards/[id]` | session | rename, or remove a card and its statements |
| POST | `/api/statements/parse` | session | unlock, extract, validate, return for review |
| GET, POST | `/api/statements` | session | list, persist a reviewed statement |
| GET, PATCH, DELETE | `/api/statements/[id]` | session | statement detail, settled status, delete |
| POST | `/api/statements/recategorize` | session | model re-reads every category across a batch in one call, one review off each card involved |
| POST | `/api/statements/[id]/recategorize` | session | the same for a single statement |
| GET | `/api/transactions` | session | every row, filtered by card, statement, category, type or text |
| PATCH, DELETE | `/api/transactions/[id]` | session | correct or remove a row, then re-run the statement checks |
| GET | `/api/analytics` | session | aggregates by range and card |
| GET | `/api/export` | session | full JSON export, secrets excluded |
| POST | `/api/reset` | session | wipe, gated on a confirmation phrase |

## Data model

Five tables. `profile` holds the encrypted name and date of birth, one row. `cards` holds issuer, label, optional last four digits and the encrypted statement password. `statements` holds the period, the printed totals, and the serialised check record. `transactions` holds date, description, amount, type, category and the fee and international flags, indexed on date and card. `ai_usage` holds one row per account, card and month, and is the whole of the model budget.

Storage is Postgres over `pg`, one pool per process. The schema is created on first connection inside a transaction held under an advisory lock, so concurrent cold starts cannot race each other into a duplicate table. `CREATE TABLE IF NOT EXISTS` is a no-op once a table exists, so columns added later are declared separately as `ADD COLUMN IF NOT EXISTS` and applied in the same transaction. An existing database upgrades itself on the next connection without losing rows.

## Run it locally

Needs a Postgres database. A free Neon database takes a minute to create and works locally and in production alike:

1. Sign in at [neon.tech](https://neon.tech) and create a project.
2. Open the project dashboard, click **Connect**, and copy the **pooled** connection string. It looks like `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.

Any other hosted or locally installed Postgres works too. Connections to anything other than `localhost` use TLS automatically.

```bash
npm install
npm run keygen    # writes APP_ENCRYPTION_KEY and SIGNUP_INVITE_CODE into .env.local, prints the invite code
```

Add the connection string to `.env.local`:

```
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

```bash
npm run dev -- --port 3020
```

The schema is created on first connection, so there is nothing to migrate. Create an account with the invite code the keygen printed, then enter the cardholder name and date of birth exactly as they appear on the statement. Those two values derive the passwords.

Use a separate Neon database, or a separate branch of the same project, for local work. The local `APP_ENCRYPTION_KEY` is different from the deployed one, so rows written by one deployment cannot be decrypted by the other.

## Deploy your own

Free tier end to end: Neon for the database, Vercel for the app.

Generate the two secrets, printed and not written to any file:

```bash
node -e "const c=require('node:crypto');console.log('APP_ENCRYPTION_KEY='+c.randomBytes(32).toString('hex'));console.log('SIGNUP_INVITE_CODE='+c.randomBytes(9).toString('base64url'))"
```

Set three variables in Vercel, for Production and Preview:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the **pooled** Neon connection string |
| `APP_ENCRYPTION_KEY` | the 64 hex characters printed above |
| `SIGNUP_INVITE_CODE` | the code printed above, which is what you give people |

The app returns 503 on every route until all three are present, so a half-configured deployment never serves a login form.

`APP_ENCRYPTION_KEY` is not rotatable. Every name, date of birth, card digit and statement password is sealed under a key derived from it, so changing it after data exists makes that data permanently unreadable. Use a different key from your local one, and keep a copy somewhere safe.

`OPENAI_API_KEY` is optional and the only variable that ever costs money.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Database | Postgres over `pg`, no ORM |
| Auth | scrypt password hashing, HMAC-signed session cookie, no auth provider |
| Encryption | AES-256-GCM, per-account keys derived from one master key |
| PDF | pdf.js (`pdfjs-dist/legacy`), unlocked and read in memory |
| Charts | Recharts |
| Motion | CSS keyframes and the Web Animations API, no animation library. A card under a reading beam while the model works, a stamped check and confetti when a bill clears |
| Sound | Short cues synthesised with the Web Audio API, no audio files: a register bell on settle, a scan sweep and a sparkle around AI review, ticks and whooshes elsewhere. One toggle in the nav |
| AI | OpenAI `gpt-4o-mini` for category review only, optional, capped at two runs per card per month |
| Hosting | Vercel and Neon, both free tier |

No analytics, no telemetry, no third-party fonts or scripts. With `OPENAI_API_KEY` unset the app makes zero outbound requests.

Card faces carry no issuer logo and no payment-network mark. Those are trademarks and cannot ship under MIT. Each issuer is identified by a monogram and its own colours, and the physical realism comes from the published standards instead: ISO/IEC 7810 ID-1 geometry, ISO/IEC 7816-2 chip module proportions, and ISO/IEC 7811 magnetic stripe placement and embossing.

## Author

**Ankit Kumar Mishra**. Designed and built Outlay, end to end.

[Portfolio](https://ankitkumarmishra.is-a.dev) ·
[LinkedIn](https://www.linkedin.com/in/ankitkumarmishra/) ·
[GitHub](https://github.com/AnkitKumarMishra5)

## License

MIT. See [LICENSE](LICENSE).

Issuers are rendered as colour monograms rather than logos. Naming a bank to identify a statement is nominative use; redistributing trademarked artwork under MIT is not.
