import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export default function SEO({
  title = "Kiti Store – Premium Modular Kitchen Hardware India",
  description = "Explore luxury kitchen hardware by Kiti Store – Hydraulic Hinges, Soft-Close Channels, Lift-Up Systems & more. Premium modular kitchen solutions for Indian homes.",
  keywords = "kitchen hardware, modular kitchen India, soft close channels, lift up hardware, Kiti Store, Khuntia Enterprises, hydraulic hinges",
  image = "https://kitistore.com/og-image.jpg",
  url = "https://kitistore.com",
  type = "website",
  noIndex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes("Kiti Store") ? title : `${title} | Kiti Store`;
  const canonicalUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Kiti Store" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional SEO tags */}
      <meta name="author" content="Kiti Store - Khuntia Enterprises Pvt. Ltd." />
      <meta name="language" content="en-IN" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
