# Deployment Files

This directory contains configuration files and scripts for deploying Aubrigo to the VPS.

## Files Overview

### Nginx Configurations

- **nginx-aubrigo.conf** - Production environment configuration for `aubrigo.pt`
- **nginx-aubrigo-dev.conf** - Development environment configuration for `dev.aubrigo.pt`

### Setup Scripts

- **setup-dev-environment.sh** - Automated script to set up the development environment on VPS

## Quick Start

### First-Time Setup

1. **Configure DNS Records**
   ```
   aubrigo.pt      A    YOUR_VPS_IP
   dev.aubrigo.pt  A    YOUR_VPS_IP
   ```

2. **Setup Production Environment** (already done if production is working)
   ```bash
   # On VPS
   sudo mkdir -p /var/www/aubrigo
   sudo chown -R $USER:$USER /var/www/aubrigo
   sudo cp nginx-aubrigo.conf /etc/nginx/sites-available/aubrigo.pt
   sudo ln -s /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-enabled/
   sudo certbot certonly --nginx -d aubrigo.pt -d www.aubrigo.pt
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **Setup Development Environment** (new)
   ```bash
   # Copy setup script to VPS
   scp deployment/setup-dev-environment.sh user@vps-ip:~/
   scp deployment/nginx-aubrigo-dev.conf user@vps-ip:~/

   # SSH into VPS and run setup
   ssh user@vps-ip
   chmod +x setup-dev-environment.sh
   ./setup-dev-environment.sh
   ```

### Deploy to Production

Simply push to the main branch:
```bash
git checkout main
git add .
git commit -m "Your commit message"
git push origin main
```

The GitHub Actions workflow will automatically:
- Build frontend and backend
- Deploy to `/var/www/aubrigo`
- Run migrations
- Restart `aubrigo-backend` PM2 process
- Serve at `https://aubrigo.pt`

### Deploy to Development

Simply push to the dev branch:
```bash
git checkout dev
git add .
git commit -m "Your commit message"
git push origin dev
```

The GitHub Actions workflow will automatically:
- Build frontend and backend
- Deploy to `/var/www/aubrigo-dev`
- Run migrations
- Restart `aubrigo-backend-dev` PM2 process
- Serve at `https://dev.aubrigo.pt`

## Environment Comparison

| Feature | Production (main) | Development (dev) |
|---------|------------------|------------------|
| Domain | aubrigo.pt | dev.aubrigo.pt |
| Deploy Path | /var/www/aubrigo | /var/www/aubrigo-dev |
| Backend Port | 3002 | 3003 |
| PM2 App Name | aubrigo-backend | aubrigo-backend-dev |
| SSL Cert | /etc/letsencrypt/live/aubrigo.pt/ | /etc/letsencrypt/live/dev.aubrigo.pt/ |
| Node ENV | production | development |

## Troubleshooting

### Nginx Configuration Errors

```bash
# Test nginx configuration
sudo nginx -t

# View nginx error log
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Obtain/renew certificate for dev
sudo certbot certonly --nginx -d dev.aubrigo.pt

# Test renewal
sudo certbot renew --dry-run
```

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs aubrigo-backend-dev

# Restart manually
pm2 restart aubrigo-backend-dev

# Delete and start fresh
cd /var/www/aubrigo-dev/current/backend
pm2 delete aubrigo-backend-dev
pm2 start ecosystem.config.js --name aubrigo-backend-dev
pm2 save
```

### Deployment Failed

1. Check GitHub Actions logs
2. Verify GitHub Secrets are set correctly
3. Check VPS SSH access
4. Review VPS logs:
   ```bash
   # PM2 logs
   pm2 logs

   # Nginx logs
   sudo tail -f /var/log/nginx/aubrigo-dev-error.log

   # System logs
   sudo journalctl -xe
   ```

## Manual Deployment (Emergency)

If GitHub Actions fails, you can deploy manually:

```bash
# On local machine - build the project
cd frontend && npm run build:prod
cd ../backend && npm run build

# Create deployment package
mkdir -p /tmp/deploy/backend /tmp/deploy/frontend
cp -r backend/dist /tmp/deploy/backend/
cp -r backend/node_modules /tmp/deploy/backend/
cp backend/package*.json /tmp/deploy/backend/
cp backend/ecosystem.config.js /tmp/deploy/backend/
cp -r frontend/dist/pet-sos-frontend/browser/* /tmp/deploy/frontend/
tar -czf deploy.tar.gz -C /tmp deploy/

# Copy to VPS
scp deploy.tar.gz user@vps-ip:/tmp/

# SSH to VPS and deploy
ssh user@vps-ip

# For production
cd /var/www/aubrigo
tar -xzf /tmp/deploy.tar.gz
mv current backup-$(date +%Y%m%d%H%M%S)
mv deploy current
cd current/backend
# Configure .env file manually
pm2 restart aubrigo-backend

# For development
cd /var/www/aubrigo-dev
tar -xzf /tmp/deploy.tar.gz
mv current backup-$(date +%Y%m%d%H%M%S)
mv deploy current
cd current/backend
# Configure .env file manually
pm2 restart aubrigo-backend-dev
```

## Health Checks

### Production
```bash
curl https://aubrigo.pt/api/health
curl https://aubrigo.pt/health
```

### Development
```bash
curl https://dev.aubrigo.pt/api/health
curl https://dev.aubrigo.pt/health
```

## Security Notes

- All nginx configurations include security headers (X-Frame-Options, X-XSS-Protection, etc.)
- SSL/TLS is enforced with strong ciphers
- Rate limiting should be configured in nginx (see nginx config files)
- CORS is handled by NestJS backend
- File upload limits are enforced (10MB max)

## Monitoring Commands

```bash
# Check all services
pm2 list
sudo systemctl status nginx
sudo systemctl status postgresql

# View real-time logs
pm2 logs
sudo tail -f /var/log/nginx/aubrigo-dev-access.log

# Check disk usage
df -h
du -sh /var/www/*

# Check SSL certificate expiration
sudo certbot certificates
```

## Support

For detailed documentation, see:
- [VPS_DEPLOYMENT.md](../VPS_DEPLOYMENT.md) - Complete deployment guide
- [VPS_SECURITY.md](../VPS_SECURITY.md) - Security best practices

---

**Last Updated**: January 2025
