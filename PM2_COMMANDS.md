# PM2 Commands for Kiti Store Application

## Quick Start Commands

### Development
```bash
# Start in development mode with file watching
npm run pm2:dev

# Or directly with PM2
pm2 start ecosystem.dev.config.json
```

### Production
```bash
# Build and start in production mode
npm run pm2:build-start

# Or step by step
npm run build
npm run pm2:start

# Or directly with PM2
pm2 start ecosystem.config.json --env production
```

## Essential PM2 Commands

### Application Management
```bash
# Check application status
pm2 status
pm2 list

# View logs
pm2 logs kiti-locks-app
pm2 logs kiti-locks-app --lines 100

# Monitor application
pm2 monit

# Restart application
pm2 restart kiti-locks-app

# Reload application (zero-downtime)
pm2 reload kiti-locks-app

# Stop application
pm2 stop kiti-locks-app

# Delete application from PM2
pm2 delete kiti-locks-app
```

### System Management
```bash
# Show PM2 information
pm2 info kiti-locks-app

# Save current PM2 list
pm2 save

# Resurrect saved PM2 list
pm2 resurrect

# Setup PM2 to start on system boot (run once)
pm2 startup

# Update PM2
pm2 update
```

### Logs Management
```bash
# View real-time logs
pm2 logs

# View logs for specific app
pm2 logs kiti-locks-app

# Clear logs
pm2 flush

# Rotate logs
pm2 install pm2-logrotate
```

## Environment-Specific Commands

### Using NPM Scripts (Recommended)
```bash
# Production
npm run pm2:start      # Start production
npm run pm2:stop       # Stop application
npm run pm2:restart    # Restart application
npm run pm2:reload     # Zero-downtime reload
npm run pm2:delete     # Delete from PM2
npm run pm2:logs       # View logs
npm run pm2:monit      # Monitor
npm run pm2:status     # Check status

# Development
npm run pm2:dev        # Start development mode
```

### Direct PM2 Commands
```bash
# Production with cluster mode
pm2 start ecosystem.config.json --env production

# Development with file watching
pm2 start ecosystem.dev.config.json

# Start with custom name
pm2 start dist/server/node-build.mjs --name "kiti-locks-custom"

# Start with specific instances
pm2 start ecosystem.config.json -i 4

# Start with environment variables
pm2 start dist/server/node-build.mjs --env production
```

## Deployment Script
```bash
# Use the automated deployment script
./scripts/deploy.sh
```

## Configuration Files

- `ecosystem.config.json` - Production configuration with cluster mode
- `ecosystem.dev.config.json` - Development configuration with file watching
- `logs/` - Directory for application logs

## Troubleshooting

### Common Issues
```bash
# If application won't start
pm2 logs kiti-locks-app

# Check system resources
pm2 monit

# Kill all PM2 processes
pm2 kill

# Restart PM2 daemon
pm2 kill && pm2 resurrect
```

### Performance Monitoring
```bash
# Enable web monitoring (optional)
pm2 install pm2-server-monit

# View memory usage
pm2 monit

# Check application info
pm2 info kiti-locks-app
```

## File Structure
```
kiti-locks/
├── ecosystem.config.json      # Production PM2 config
├── ecosystem.dev.config.json  # Development PM2 config
├── scripts/deploy.sh          # Deployment script
├── logs/                      # PM2 logs directory
├── dist/server/               # Built server files
└── package.json               # NPM scripts included
```
