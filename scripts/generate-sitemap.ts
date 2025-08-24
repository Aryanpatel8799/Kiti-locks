import fs from 'fs';
import path from 'path';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const generateSitemap = () => {
  const baseUrl = 'https://kitistore.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const urls: SitemapUrl[] = [
    // Static pages
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/products`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/categories`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3,
    },
    {
      loc: `${baseUrl}/privacy`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3,
    },
    {
      loc: `${baseUrl}/track-order`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
  ];

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Write sitemap to public directory
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml);
  console.log('Sitemap generated successfully at:', sitemapPath);
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}

export default generateSitemap;
