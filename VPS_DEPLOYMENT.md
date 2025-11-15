# VPS Deployment Guide - Aubrigo

This document explains the automated deployment setup for the Aubrigo platform, which supports two environments:
- **Production**: `aubrigo.pt` (from `main` branch)
- **Development**: `dev.aubrigo.pt` (from `dev` branch)

## Overview

The deployment process is fully automated using GitHub Actions. When you push to either `main` or `dev` branch, the application automatically builds and deploys to the corresponding environment on the VPS.

## Architecture

### Environment Configuration

| Environment | Branch | Domain | Backend Port | PM2 App Name | Deploy Path |
|------------|--------|---------|--------------|--------------|-------------|
| Production | main | aubrigo.pt | 3002 | aubrigo-backend | /var/www/aubrigo |
| Development | dev | dev.aubrigo.pt | 3003 | aubrigo-backend-dev | /var/www/aubrigo-dev |

### Directory Structure on VPS

```
/var/www/
├── aubrigo/                    # Production environment
│   ├── current/                # Current production deployment
│   │   ├── backend/
│   │   └── frontend/
│   └── backup-YYYYMMDDHHMMSS/  # Automatic backups (keeps last 3)
│
└── aubrigo-dev/                # Development environment
    ├── current/                # Current dev deployment
    │   ├── backend/
    │   └── frontend/
    └── backup-YYYYMMDDHHMMSS/  # Automatic backups (keeps last 3)
```

## Initial VPS Setup

### 1. DNS Configuration

Configure DNS A records for both domains:
```
aubrigo.pt      A    YOUR_VPS_IP
dev.aubrigo.pt  A    YOUR_VPS_IP
```

### 2. SSL Certificates

Obtain SSL certificates for both domains using Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate for production
sudo certbot certonly --nginx -d aubrigo.pt -d www.aubrigo.pt

# Get certificate for development
sudo certbot certonly --nginx -d dev.aubrigo.pt
```

### 3. Nginx Configuration

Copy nginx configurations to the VPS:

```bash
# Production
sudo cp deployment/nginx-aubrigo.conf /etc/nginx/sites-available/aubrigo.pt
sudo ln -s /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-enabled/

# Development
sudo cp deployment/nginx-aubrigo-dev.conf /etc/nginx/sites-available/dev.aubrigo.pt
sudo ln -s /etc/nginx/sites-available/dev.aubrigo.pt /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Create Deployment Directories

```bash
# Create directories with proper permissions
sudo mkdir -p /var/www/aubrigo
sudo mkdir -p /var/www/aubrigo-dev
sudo chown -R $USER:$USER /var/www/aubrigo
sudo chown -R $USER:$USER /var/www/aubrigo-dev
```

### 5. Install PM2 Globally

```bash
npm install -g pm2
pm2 startup
```

## GitHub Secrets Configuration

Add the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets

- `VPS_SSH_KEY`: Your private SSH key for VPS access
- `VPS_USER`: SSH username (e.g., `ubuntu`, `root`)
- `VPS_HOST`: VPS IP address or hostname
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `EMAIL_FROM`: Default sender email address

**Note**: The `FRONTEND_URL` is automatically set based on the branch:
- `main` branch → `https://aubrigo.pt`
- `dev` branch → `https://dev.aubrigo.pt`

## Deployment Workflow

### Automatic Deployment

The deployment is triggered automatically when you push to `main` or `dev` branch:

```bash
# Deploy to production (aubrigo.pt)
git checkout main
git push origin main

# Deploy to development (dev.aubrigo.pt)
git checkout dev
git push origin dev
```

### Manual Deployment

You can also trigger deployments manually from the GitHub Actions tab using "workflow_dispatch".

### Deployment Steps

The GitHub Actions workflow performs the following steps:

1. **Environment Detection**: Determines target environment based on branch
2. **Build Frontend**: Compiles Angular PWA with production optimizations
3. **Build Backend**: Compiles NestJS TypeScript to JavaScript
4. **Package**: Creates deployment tarball with all necessary files
5. **Transfer**: Securely copies package to VPS via SSH
6. **Backup**: Creates timestamped backup of current version
7. **Deploy**: Extracts new version to deployment directory
8. **Environment Variables**: Creates `.env` file with secrets
9. **Database Migrations**: Runs pending database migrations
10. **PM2 Restart**: Restarts backend service with PM2
11. **Nginx Reload**: Reloads nginx to pick up any changes
12. **Verification**: Performs health check on deployed service
13. **Cleanup**: Removes old backups (keeps last 3)

## Monitoring Deployments

### Check Deployment Status

View deployment status in GitHub Actions:
```
https://github.com/YOUR_USERNAME/aubrigo/actions
```

### Check Backend Service on VPS

```bash
# List all PM2 processes
pm2 list

# View logs for production
pm2 logs aubrigo-backend

# View logs for development
pm2 logs aubrigo-backend-dev

# Restart services if needed
pm2 restart aubrigo-backend        # Production
pm2 restart aubrigo-backend-dev    # Development
```

### Check Nginx Status

```bash
# View nginx logs
sudo tail -f /var/log/nginx/aubrigo-access.log      # Production
sudo tail -f /var/log/nginx/aubrigo-dev-access.log  # Development

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions logs for error details
2. Verify all GitHub secrets are correctly set
3. Check VPS SSH access: `ssh user@vps-ip`
4. Review PM2 logs: `pm2 logs`
5. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs aubrigo-backend

# Check environment variables
cat /var/www/aubrigo/current/backend/.env

# Manually restart
cd /var/www/aubrigo/current/backend
pm2 delete aubrigo-backend
pm2 start ecosystem.config.js
```

### Database Migration Issues

```bash
cd /var/www/aubrigo/current/backend

# Check migration status
npm run migration:show:prod

# Run migrations manually
npm run migration:run:prod

# Revert last migration if needed
npm run migration:revert:prod
```

### SSL Certificate Renewal

```bash
# Renew all certificates
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## Rollback Procedure

If a deployment causes issues, you can rollback to the previous version:

```bash
# SSH into VPS
ssh user@vps-ip

# Navigate to deployment directory
cd /var/www/aubrigo  # or /var/www/aubrigo-dev

# Find the backup to restore
ls -lt | grep backup

# Stop current service
pm2 delete aubrigo-backend

# Restore backup
mv current current-failed
mv backup-YYYYMMDDHHMMSS current

# Restart service
cd current/backend
pm2 start ecosystem.config.js
pm2 save
```

## Security Considerations

1. **SSH Keys**: Never commit SSH keys to the repository. Use GitHub Secrets.
2. **Environment Variables**: All sensitive data is stored in GitHub Secrets.
3. **Database Backups**: Implement regular database backups (not included in this workflow).
4. **Firewall**: Ensure UFW is configured properly (see VPS_SECURITY.md).
5. **SSL/TLS**: Certificates auto-renew via certbot.

## Performance Optimization

1. **PM2 Clustering**: Currently using 1 instance. Increase for high traffic:
   ```javascript
   instances: 'max', // Use all CPU cores
   ```

2. **Database Connection Pooling**: Configured in NestJS TypeORM.

3. **Nginx Caching**: Static assets cached for 1 year, API responses not cached.

4. **Gzip Compression**: Enabled in nginx for all text-based content.

## Backup Strategy

### Automatic Backups

- Previous deployments are automatically backed up before each new deployment
- Last 3 backups are kept, older ones are automatically deleted
- Backups are stored in the same deployment directory

### Manual Database Backup

```bash
# Backup PostgreSQL database
pg_dump -U postgres -d aubrigo > backup-$(date +%Y%m%d).sql

# Restore database
psql -U postgres -d aubrigo < backup-20250115.sql
```

### Backup Uploads Directory

```bash
# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /var/www/aubrigo/current/backend/uploads
```

## CI/CD Pipeline Diagram

```
┌─────────────┐
│  Git Push   │
│ main or dev │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ GitHub Actions  │
│  Detect Branch  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Build & Test   │
│ Frontend + Back │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Package &     │
│   Transfer      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  VPS Deploy     │
│  Backup → New   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Migrations &   │
│  PM2 Restart    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Health Check &  │
│    Success!     │
└─────────────────┘
```

## Support and Maintenance

- **Deployment Logs**: Available in GitHub Actions tab
- **Application Logs**: PM2 logs on VPS (`pm2 logs`)
- **Server Logs**: Nginx logs in `/var/log/nginx/`
- **Updates**: Pull latest changes and push to trigger deployment

---

**Last Updated**: January 2025
**Maintained By**: Aubrigo Development Team
