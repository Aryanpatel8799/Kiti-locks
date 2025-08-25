import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
  price?: number;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
}

export default function SEO({
  title = "Kiti Store - Premium Bathroom Hardware & Kitchen Accessories",
  description = "Discover premium bathroom hardware, kitchen accessories, door locks, and home improvement products at Kiti Store. Quality hardware solutions for modern homes with fast delivery across India.",
  keywords = "bathroom hardware, kitchen accessories, door locks, cabinet handles, drawer slides, hinges, bathroom fittings, premium hardware, home improvement, kiti store, bathroom accessories, kitchen hardware",
  image = "https://kitistore.com/og-image.jpg",
  url = "https://www.kitistore.com",
  type = "website",
  price,
  availability = "InStock",
  brand = "Kiti Store",
  category,
  rating,
  reviewCount,
}: SEOProps) {
  const fullTitle = title.includes("Kiti Store") ? title : `${title} | Kiti Store`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type === "product" ? "Product" : "Organization",
    ...(type === "product" 
      ? {
          name: title,
          description,
          image,
          brand: {
            "@type": "Brand",
            name: brand
          },
          category,
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "INR",
            availability: `https://schema.org/${availability}`,
            seller: {
              "@type": "Organization",
              name: "Kiti Store"
            }
          },
          ...(rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating,
              reviewCount: reviewCount || 1,
              bestRating: 5,
              worstRating: 1
            }
          })
        }
      : {
          name: "Kiti Store",
          description: "Premium bathroom hardware and kitchen accessories store",
          url: "https://www.kitistore.com",
          logo: "https://www.kitistore.com/logo.png",
          sameAs: [
            "https://www.facebook.com/kitistore",
            "https://www.instagram.com/kitistore",
            "https://twitter.com/kitistore"
          ],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-XXXXXXXXXX",
            contactType: "customer service",
            availableLanguage: ["English", "Hindi"]
          },
          address: {
            "@type": "PostalAddress",
            addressCountry: "IN",
            addressRegion: "India"
          }
        })
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Kiti Store" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Kiti Store" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:site" content="@kitistore" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="application-name" content="Kiti Store" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {/* Business Meta */}
      <meta name="business:contact_data:street_address" content="India" />
      <meta name="business:contact_data:locality" content="India" />
      <meta name="business:contact_data:region" content="India" />
      <meta name="business:contact_data:postal_code" content="" />
      <meta name="business:contact_data:country_name" content="India" />
      
      {/* Product specific meta */}
      {type === "product" && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content="INR" />
          <meta property="product:availability" content={availability} />
          <meta property="product:brand" content={brand} />
          {category && <meta property="product:category" content={category} />}
        </>
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Additional Schema for Local Business */}
      {type === "website" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Kiti Store",
            "description": "Premium bathroom hardware and kitchen accessories",
            "url": "https://www.kitistore.com",
            "telephone": "+91-XXXXXXXXXX",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "IN"
            },
            "openingHours": "Mo-Su 09:00-21:00",
            "priceRange": "₹₹",
            "paymentAccepted": ["Cash", "Credit Card", "UPI", "Net Banking"],
            "currenciesAccepted": "INR"
          })}
        </script>
      )}
    </Helmet>
  );
}
