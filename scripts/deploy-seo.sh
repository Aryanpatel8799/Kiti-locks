#!/bin/bash

# SEO Deployment Script for Kiti Store
# Run this script on your VPS after code changes

echo "🚀 Starting SEO-optimized deployment..."

# 1. Build the application with SEO optimizations
echo "📦 Building application..."
npm run build:seo

# 2. Generate fresh sitemap
echo "🗺️ Generating sitemap..."
npm run generate:sitemap

# 3. Create prerendered content for search engines
echo "🔍 Creating prerendered content for search engines..."
mkdir -p dist/prerendered
npm run prerender:static

# Copy static HTML files to prerendered directory
cp -r dist/*.html dist/prerendered/ 2>/dev/null || true
cp -r dist/**/index.html dist/prerendered/ 2>/dev/null || true

# 4. Restart PM2 processes
echo "🔄 Restarting application..."
pm2 restart all

# 5. Reload Nginx
echo "🌐 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 6. Test critical endpoints
echo "🧪 Testing critical endpoints..."

echo "Testing homepage..."
curl -s -o /dev/null -w "%{http_code}" https://www.kitistore.com/ || echo "❌ Homepage test failed"

echo "Testing robots.txt..."
curl -s -o /dev/null -w "%{http_code}" https://www.kitistore.com/robots.txt || echo "❌ robots.txt test failed"

echo "Testing sitemap.xml..."
curl -s -o /dev/null -w "%{http_code}" https://www.kitistore.com/sitemap.xml || echo "❌ sitemap.xml test failed"

echo "Testing with Googlebot user agent..."
curl -s -H "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://www.kitistore.com/ | grep -q "Kiti Store" && echo "✅ Googlebot test passed" || echo "❌ Googlebot test failed"

# 7. Show next steps
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Submit sitemap to Google Search Console: https://search.google.com/search-console"
echo "2. Request re-indexing of your homepage"
echo "3. Use Google's URL Inspection tool to check if pages can be indexed"
echo "4. Monitor in Search Console for 'Coverage' issues"
echo ""
echo "🔍 Testing URLs:"
echo "- Homepage: https://www.kitistore.com/"
echo "- Products: https://www.kitistore.com/products"
echo "- Sitemap: https://www.kitistore.com/sitemap.xml"
echo "- Robots: https://www.kitistore.com/robots.txt"
