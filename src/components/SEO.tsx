import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterHandle?: string;
}

export const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
  twitterHandle = "@escrowbill",
}: SEOProps) => {
  const siteName = "ESCROWBILL";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = "Manage your business with ease using ESCROWBILL. The ultimate solution for secure escrow payments, professional invoicing, and automated revenue tracking. Get paid 3x faster today.";
  const defaultKeywords = "escrow billing, invoice management, secure payments, revenue tracking, automated invoicing, business finance tool, GST ready, India billing software";
  const siteUrl = "https://www.bill.escrowbms.in";
  const defaultOgImage = `${siteUrl}/premium-hero.png`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <link rel="canonical" href={canonical || window.location.origin + window.location.pathname} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:url" content={window.location.origin + window.location.pathname} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      
      {/* Search Engine Directives */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />

      {/* Structured Data (JSON-LD) for Sitelinks Searchbox & Site Navigation */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ESCROWBILL",
          "alternateName": "Escrow Bill",
          "url": "https://www.bill.escrowbms.in",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.bill.escrowbms.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "SiteNavigationElement",
              "position": 1,
              "name": "Pricing",
              "url": "https://www.bill.escrowbms.in/pricing"
            },
            {
              "@type": "SiteNavigationElement",
              "position": 2,
              "name": "About Us",
              "url": "https://www.bill.escrowbms.in/about"
            },
            {
              "@type": "SiteNavigationElement",
              "position": 3,
              "name": "Contact Us",
              "url": "https://www.bill.escrowbms.in/contact"
            },
            {
              "@type": "SiteNavigationElement",
              "position": 4,
              "name": "Privacy Policy",
              "url": "https://www.bill.escrowbms.in/privacy-policy"
            }
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
