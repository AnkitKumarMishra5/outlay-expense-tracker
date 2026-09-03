import crypto from "node:crypto";
import fs from "node:fs";

const ENV = ".env.local";
const silent = process.argv.includes("--silent");
let text = fs.existsSync(ENV) ? fs.readFileSync(ENV, "utf8") : "";
const added = [];

function ensure(key, value) {
  if (new RegExp(`^${key}=.+$`, "m").test(text)) return;
  text = `${text.trimEnd()}${text ? "\n" : ""}${key}=${value}\n`;
  added.push(key);
}

ensure("APP_ENCRYPTION_KEY", crypto.randomBytes(32).toString("hex"));
ensure("SIGNUP_INVITE_CODE", crypto.randomBytes(9).toString("base64url"));

if (added.length) fs.writeFileSync(ENV, text);

if (!silent || added.length) {
  for (const key of added) console.log(`Generated ${key} in ${ENV}`);
  const invite = text.match(/^SIGNUP_INVITE_CODE=(.+)$/m);
  if (added.includes("SIGNUP_INVITE_CODE") && invite) {
    console.log(`Invite code for your first account: ${invite[1]}`);
  }
  if (!/^DATABASE_URL=.+$/m.test(text)) {
    console.log(`Set DATABASE_URL in ${ENV} to a Postgres connection string before starting.`);
  }
}
