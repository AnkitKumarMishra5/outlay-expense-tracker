import { APP_NAME, APP_TAGLINE, DEVELOPER } from "@/lib/developer";
import { siteUrl } from "@/lib/site";

export default function StructuredData() {
  const graph = [
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}#app`,
      name: APP_NAME,
      url: siteUrl,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: APP_TAGLINE,
      inLanguage: "en-IN",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      author: { "@id": `${siteUrl}#author` },
      featureList: [
        "Unlocks password-protected credit card statement PDFs",
        "Validates parsed totals against the totals printed on the statement",
        "Categorises transactions and tracks payment due dates",
        "Reports spend by card, category and month",
      ],
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}#author`,
      name: DEVELOPER.name,
      url: DEVELOPER.site,
      email: `mailto:${DEVELOPER.email}`,
      sameAs: [DEVELOPER.github, DEVELOPER.linkedin, DEVELOPER.site],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#site`,
      url: siteUrl,
      name: APP_NAME,
      description: APP_TAGLINE,
      publisher: { "@id": `${siteUrl}#author` },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
