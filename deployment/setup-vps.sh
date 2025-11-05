#!/bin/bash

# Aubrigo VPS Setup Script
# Run this script on your VPS as the deploy user to set up the environment

set -e  # Exit on error

echo "==================================="
echo "Aubrigo VPS Setup Script"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as deploy user
if [ "$USER" != "deploy" ]; then
    echo -e "${RED}This script should be run as the 'deploy' user${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Creating directory structure${NC}"
sudo mkdir -p /var/www/aubrigo
sudo chown -R deploy:deploy /var/www/aubrigo
mkdir -p /var/www/aubrigo/current
mkdir -p /var/www/aubrigo/shared

echo -e "${GREEN}Step 2: Installing Nginx configuration${NC}"
if [ -f "/etc/nginx/sites-enabled/aubrigo.pt" ]; then
    echo -e "${YELLOW}Nginx config already exists, backing up...${NC}"
    sudo cp /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-available/aubrigo.pt.backup
fi

# You need to copy the nginx config manually or use this command:
# sudo cp deployment/nginx-aubrigo.conf /etc/nginx/sites-available/aubrigo.pt
# sudo ln -sf /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-enabled/

echo -e "${YELLOW}Note: Copy nginx-aubrigo.conf to /etc/nginx/sites-available/aubrigo.pt${NC}"
echo -e "${YELLOW}Then run: sudo ln -sf /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-enabled/${NC}"

echo -e "${GREEN}Step 3: Setting up SSL with Let's Encrypt${NC}"
sudo mkdir -p /var/www/certbot

echo -e "${YELLOW}To obtain SSL certificate, run:${NC}"
echo -e "${YELLOW}sudo certbot certonly --webroot -w /var/www/certbot -d aubrigo.pt -d www.aubrigo.pt${NC}"

echo -e "${GREEN}Step 4: Testing Nginx configuration${NC}"
# sudo nginx -t
# sudo systemctl reload nginx

echo -e "${GREEN}Step 5: Setting up PM2${NC}"
pm2 startup
echo -e "${YELLOW}Run the command above to enable PM2 on startup${NC}"

echo -e "${GREEN}Step 6: Setting up PostgreSQL${NC}"
echo -e "${YELLOW}Make sure PostgreSQL is installed and database is created${NC}"
echo -e "${YELLOW}Database URL should be added to GitHub Secrets${NC}"

echo "==================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Copy nginx config: sudo cp deployment/nginx-aubrigo.conf /etc/nginx/sites-available/aubrigo.pt"
echo "2. Enable site: sudo ln -sf /etc/nginx/sites-available/aubrigo.pt /etc/nginx/sites-enabled/"
echo "3. Test nginx: sudo nginx -t"
echo "4. Obtain SSL: sudo certbot certonly --webroot -w /var/www/certbot -d aubrigo.pt -d www.aubrigo.pt"
echo "5. Reload nginx: sudo systemctl reload nginx"
echo "6. Set up GitHub Secrets (see DEPLOYMENT.md)"
echo "7. Push to main branch to trigger deployment"
