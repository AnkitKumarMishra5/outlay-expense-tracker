export const DEVELOPER = {
  name: "Ankit Kumar Mishra",
  role: "Creator and developer of Outlay",
  quote:
    "A statement tells you what you owe. It never tells you what you spent, and it never tells you the annual fee came back. I wanted the reconciliation I would run on a production ledger, running every month on my own.",
  email: "akmishra5514@gmail.com",
  github: "https://github.com/AnkitKumarMishra5",
  linkedin: "https://www.linkedin.com/in/ankitkumarmishra/",
  site: "https://ankitkumarmishra.is-a.dev/",
  photo: "/ankit-kumar-mishra.jpg",
};

const INVITE_SUBJECT = "Outlay: request for an invite code";

const INVITE_BODY = `Hello Ankit,

I came across Outlay and would like to try it. Could you send me an invite code?

Name:
Where I found Outlay:
Cards I plan to track:

Thank you,
`;

export const INVITE_MAILTO = `mailto:${DEVELOPER.email}?subject=${encodeURIComponent(
  INVITE_SUBJECT
)}&body=${encodeURIComponent(INVITE_BODY)}`;

export const APP_NAME = "Outlay";
export const APP_BYLINE = "by Ankit Kumar Mishra";
export const APP_TAGLINE = "Expense tracker, validator and analyser for Indian credit card statements.";
