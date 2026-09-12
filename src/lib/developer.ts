export const DEVELOPER = {
  name: "Ankit Kumar Mishra",
  role: "Creator and developer of Outlay",
  quote:
    "A statement from every card, never in the same place, and no picture of the month anywhere. I wanted one screen that holds the whole wallet: every card ranked by what it billed, every bill still to pay, where the money actually went, and what quietly repeats each month. Outlay is that screen, and it checks the bank's arithmetic on the way in.",
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
