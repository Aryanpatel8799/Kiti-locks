#!/usr/bin/env node

/**
 * Static HTML Prerenderer for SEO
 * Generates static HTML snapshots for search engines
 */

const fs = require('fs');
const path = require('path');

// Routes that need static HTML for SEO
const routes = [
  { path: '/', title: 'Kiti Store – Premium Modular Kitchen Hardware India', description: 'India\'s leading supplier of premium modular kitchen hardware. Soft-close channels, hydraulic hinges, lift-up systems & premium accessories.' },
  { path: '/products', title: 'Premium Kitchen Hardware Products | Kiti Store', description: 'Browse our extensive collection of premium modular kitchen hardware including soft-close channels, hydraulic hinges, and lift-up systems.' },
  { path: '/categories', title: 'Kitchen Hardware Categories | Kiti Store', description: 'Explore our kitchen hardware categories: channels, hinges, handles, lift-up systems, and premium kitchen accessories.' },
  { path: '/about', title: 'About Kiti Store - Kitchen Hardware Specialists', description: 'Learn about Kiti Store, India\'s trusted supplier of premium modular kitchen hardware since 2022.' },
  { path: '/contact', title: 'Contact Kiti Store - Kitchen Hardware Support', description: 'Get in touch with Kiti Store for premium kitchen hardware support, bulk orders, and installation services.' }
];

function generateStaticHTML(route) {
  return `<!DOCTYPE html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${route.title}</title>
    <meta name="description" content="${route.description}" />
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <link rel="canonical" href="https://www.kitistore.com${route.path}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:url" content="https://www.kitistore.com${route.path}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Kiti Store" />
    <meta property="og:image" content="https://www.kitistore.com/og-image.jpg" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="https://www.kitistore.com/og-image.jpg" />
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/client/App.tsx" as="script" />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" as="style" />
    
    <!-- Structured Data for Homepage -->
    ${route.path === '/' ? `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Kiti Store",
      "url": "https://www.kitistore.com",
      "logo": "https://www.kitistore.com/logo.png",
      "description": "India's leading supplier of premium modular kitchen hardware",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      }
    }
    </script>` : ''}
  </head>
  <body>
    <div id="root">
      <!-- Fallback content for search engines -->
      <header>
        <h1>Kiti Store</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/categories">Categories</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <main>
        <h1>${route.title}</h1>
        <p>${route.description}</p>
        ${route.path === '/' ? `
        <section>
          <h2>Premium Kitchen Hardware</h2>
          <p>Discover our extensive range of premium modular kitchen hardware including:</p>
          <ul>
            <li>Soft-close drawer channels</li>
            <li>Hydraulic hinges</li>
            <li>Lift-up systems</li>
            <li>Premium handles and accessories</li>
          </ul>
        </section>` : ''}
        ${route.path === '/products' ? `
        <section>
          <h2>Our Product Range</h2>
          <p>Browse through our comprehensive collection of kitchen hardware products designed for modern modular kitchens.</p>
        </section>` : ''}
      </main>
      <footer>
        <p>&copy; 2025 Kiti Store - Premium Kitchen Hardware India</p>
      </footer>
    </div>
    
    <!-- Load React App -->
    <script type="module" src="/client/App.tsx"></script>
    
    <!-- Google Search Console verification -->
    <noscript>
      <p>This site requires JavaScript. Please enable JavaScript for the best experience.</p>
    </noscript>
  </body>
</html>`;
}

// Generate static HTML files
function generateStaticFiles() {
  const distDir = path.join(__dirname, '../dist');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  routes.forEach(route => {
    const html = generateStaticHTML(route);
    const filePath = route.path === '/' 
      ? path.join(distDir, 'index.html')
      : path.join(distDir, route.path.slice(1), 'index.html');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, html);
    console.log(`✅ Generated: ${filePath}`);
  });
  
  console.log('\n🎉 Static HTML files generated successfully!');
  console.log('📋 Next steps:');
  console.log('1. Deploy these files to your VPS');
  console.log('2. Configure Nginx to serve static files');
  console.log('3. Test with: curl -H "User-Agent: Googlebot" https://www.kitistore.com/');
}

if (require.main === module) {
  generateStaticFiles();
}

module.exports = { generateStaticFiles, routes };
