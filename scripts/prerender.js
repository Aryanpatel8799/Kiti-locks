import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pages to pre-render
const STATIC_PAGES = [
  "/",
  "/about",
  "/contact",
  "/products",
  "/categories/soft-close-hinges",
  "/categories/telescopic-soft-close-channels",
  "/categories/drawer-systems",
  "/categories/lift-up-systems",
  "/categories/wardrobe-sliding-accessories",
  "/categories/designer-handles-accessories",
];

// Product pages to pre-render (these would be fetched from API in real implementation)
const PRODUCT_PAGES = [
  "/products/kiti-soft-close-hinges-8mm-cup",
  "/products/kiti-soft-close-hinges-9mm-cup",
  "/products/kiti-soft-close-hinges-10mm-cup",
  "/products/kiti-telescopic-channel-45mm",
  "/products/modular-box-soft-close",
  "/products/aventos-hf-lift-up-system",
];

const ALL_PAGES = [...STATIC_PAGES, ...PRODUCT_PAGES];

// Generate HTML template for pre-rendered pages
function generateHTML(route, data = {}) {
  const { title, description, canonical, ogImage } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- SEO Meta Tags -->
    <title>${title || "Kiti Locks – Premium Modular Kitchen Hardware India"}</title>
    <meta name="description" content="${description || "Explore luxury kitchen hardware by Kiti Locks – Hydraulic Hinges, Soft-Close Channels, Lift-Up Systems & more. Premium modular kitchen solutions for Indian homes."}" />
    <meta name="keywords" content="kitchen hardware, modular kitchen India, soft close channels, lift up hardware, Kiti Locks, Khuntia Enterprises, hydraulic hinges" />
    <meta name="author" content="Kiti Locks - Khuntia Enterprises Pvt. Ltd." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical || "https://kitilocks.com" + route}" />
    <meta property="og:title" content="${title || "Kiti Locks – Premium Modular Kitchen Hardware India"}" />
    <meta property="og:description" content="${description || "Explore luxury kitchen hardware by Kiti Locks – Hydraulic Hinges, Soft-Close Channels, Lift-Up Systems & more."}" />
    <meta property="og:image" content="${ogImage || "https://kitilocks.com/og-image.jpg"}" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonical || "https://kitilocks.com" + route}" />
    <meta property="twitter:title" content="${title || "Kiti Locks – Premium Modular Kitchen Hardware India"}" />
    <meta property="twitter:description" content="${description || "Explore luxury kitchen hardware by Kiti Locks – Hydraulic Hinges, Soft-Close Channels, Lift-Up Systems & more."}" />
    <meta property="twitter:image" content="${ogImage || "https://kitilocks.com/og-image.jpg"}" />

    <!-- Canonical URL -->
    <link rel="canonical" href="${canonical || "https://kitilocks.com" + route}" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    
    <!-- Performance optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    
    <!-- Security -->
    <meta http-equiv="X-Content-Type-Options" content="nosniff" />
    <meta http-equiv="X-Frame-Options" content="DENY" />
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    
    <!-- Critical CSS would be inlined here -->
    <style>
        /* Critical CSS for above-the-fold content */
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div class="spinner"></div>
        </div>
    </div>
    <script type="module" src="/client/App.tsx"></script>
</body>
</html>`;
}

// Page-specific data
const pageData = {
  "/": {
    title: "Kiti Locks – Premium Modular Kitchen Hardware India",
    description:
      "Explore luxury kitchen hardware by Kiti Locks – Hydraulic Hinges, Soft-Close Channels, Lift-Up Systems & more. Premium modular kitchen solutions for Indian homes.",
  },
  "/about": {
    title: "About Kiti Locks – Pradeep Kumar Khuntia | Kitchen Hardware India",
    description:
      "Learn about Kiti Locks founder Pradeep Kumar Khuntia and our mission to provide premium modular kitchen hardware solutions across India.",
  },
  "/contact": {
    title: "Contact Kiti Locks – Kitchen Hardware Support India",
    description:
      "Get in touch with Kiti Locks for premium kitchen hardware solutions. Expert support for modular kitchen projects across India.",
  },
  "/products": {
    title: "Kitchen Hardware Products – Kiti Locks Premium Range India",
    description:
      "Browse our complete range of kitchen hardware products including soft-close hinges, telescopic channels, lift-up systems and more.",
  },
};

// Create pre-rendered static files
async function prerender() {
  console.log("🚀 Starting pre-rendering process...");

  const distDir = path.join(__dirname, "../dist/spa");

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  for (const route of ALL_PAGES) {
    try {
      const data = pageData[route] || {};
      const html = generateHTML(route, data);

      let filePath;
      if (route === "/") {
        filePath = path.join(distDir, "index.html");
      } else {
        const dir = path.join(distDir, route);
        fs.mkdirSync(dir, { recursive: true });
        filePath = path.join(dir, "index.html");
      }

      fs.writeFileSync(filePath, html);
      console.log(`✅ Pre-rendered: ${route}`);
    } catch (error) {
      console.error(`❌ Failed to pre-render ${route}:`, error);
    }
  }

  // Create sitemap.xml
  const sitemap = generateSitemap();
  fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);
  console.log("✅ Generated sitemap.xml");

  // Create robots.txt
  const robots = generateRobots();
  fs.writeFileSync(path.join(distDir, "robots.txt"), robots);
  console.log("✅ Generated robots.txt");

  console.log("🎉 Pre-rendering completed successfully!");
}

function generateSitemap() {
  const baseUrl = "https://kitilocks.com";
  const lastmod = new Date().toISOString().split("T")[0];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  ALL_PAGES.forEach((route) => {
    const priority =
      route === "/" ? "1.0" : route.startsWith("/products/") ? "0.8" : "0.9";
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}${route}</loc>\n`;
    sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
    sitemap += `    <priority>${priority}</priority>\n`;
    sitemap += `  </url>\n`;
  });

  sitemap += "</urlset>";
  return sitemap;
}

function generateRobots() {
  return `User-agent: *
Allow: /

Sitemap: https://kitilocks.com/sitemap.xml

# Disallow admin and API routes
Disallow: /admin
Disallow: /api/
Disallow: /.env
Disallow: /server/

# Crawl delay
Crawl-delay: 1`;
}

// Run pre-rendering
prerender().catch(console.error);
