#!/bin/bash

# PM2 Deployment Script for Kiti Store Application
# This script builds the application and deploys it using PM2

echo "🚀 Starting deployment process..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Stop existing application if running
echo "🛑 Stopping existing application..."
pm2 stop kiti-locks-app 2>/dev/null || echo "No existing application to stop"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.json --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (optional - run once on new server)
# pm2 startup

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 Useful PM2 commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs             - View logs"
echo "  pm2 monit            - Monitor application"
echo "  pm2 restart all      - Restart application"
echo "  pm2 reload all       - Zero-downtime reload"
echo "  pm2 stop all         - Stop application"
