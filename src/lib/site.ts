export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3020";

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/privacy", "/terms"] as const;
