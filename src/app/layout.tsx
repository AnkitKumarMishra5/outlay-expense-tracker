import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ToastProvider from "@/components/Toasts";
import RouteProgress from "@/components/RouteProgress";
import { APP_NAME, APP_TAGLINE, DEVELOPER } from "@/lib/developer";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

const description = `${APP_TAGLINE} Unlocks password-protected statement PDFs, validates them against the printed totals, categorises every transaction, and analyses spend across all your cards. Built by ${DEVELOPER.name}.`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${APP_NAME} by ${DEVELOPER.name}`, template: `%s · ${APP_NAME}` },
  description,
  applicationName: APP_NAME,
  authors: [{ name: DEVELOPER.name, url: DEVELOPER.site }],
  creator: DEVELOPER.name,
  publisher: DEVELOPER.name,
  keywords: [
    "expense tracker",
    "credit card statement parser",
    "Indian banks",
    "statement validator",
    "spend analytics",
    "Ankit Kumar Mishra",
  ],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} by ${DEVELOPER.name}`,
    description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: `${APP_NAME} by ${DEVELOPER.name}`, description },
  robots: { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#080d15" },
  ],
};

const themeScript = `(function(){try{var m=localStorage.getItem("outlay-theme");if(m==="light"||m==="dark"){document.documentElement.setAttribute("data-theme",m);}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} antialiased flex min-h-screen flex-col`}>
        <div className="aurora" aria-hidden />
        <ToastProvider>
          <RouteProgress />
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
