#!/bin/bash

# Aubrigo Dev Environment Setup Script
# This script sets up the development environment on the VPS for dev.aubrigo.pt
# Run this script on your VPS as the deployment user (not root)

set -e  # Exit on any error

echo "============================================"
echo "Aubrigo Dev Environment Setup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Please do not run this script as root${NC}"
    echo "Run as your deployment user instead"
    exit 1
fi

echo -e "${YELLOW}Step 1: Creating deployment directory${NC}"
sudo mkdir -p /var/www/aubrigo-dev
sudo chown -R $USER:$USER /var/www/aubrigo-dev
echo -e "${GREEN}✓ Deployment directory created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Setting up Nginx configuration${NC}"
echo "Please ensure you have copied nginx-aubrigo-dev.conf to the VPS"
echo ""
echo "Run these commands:"
echo "  sudo cp /path/to/nginx-aubrigo-dev.conf /etc/nginx/sites-available/dev.aubrigo.pt"
echo "  sudo ln -s /etc/nginx/sites-available/dev.aubrigo.pt /etc/nginx/sites-enabled/"
echo "  sudo nginx -t"
echo ""
read -p "Have you completed the nginx setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please complete nginx setup and run this script again${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Nginx configuration confirmed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Obtaining SSL certificate for dev.aubrigo.pt${NC}"
echo "This will request an SSL certificate from Let's Encrypt"
echo ""
read -p "Obtain SSL certificate now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot certonly --nginx -d dev.aubrigo.pt
    echo -e "${GREEN}✓ SSL certificate obtained${NC}"
else
    echo -e "${YELLOW}⚠ Skipping SSL certificate setup${NC}"
    echo "You can obtain it later with:"
    echo "  sudo certbot certonly --nginx -d dev.aubrigo.pt"
fi
echo ""

echo -e "${YELLOW}Step 4: Testing and reloading Nginx${NC}"
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx configuration is valid and reloaded${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    echo "Please fix the errors before continuing"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Opening firewall ports${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 3003/tcp comment 'Aubrigo Dev Backend'
    echo -e "${GREEN}✓ Firewall rules updated${NC}"
else
    echo -e "${YELLOW}⚠ UFW not found, skipping firewall configuration${NC}"
fi
echo ""

echo "============================================"
echo -e "${GREEN}Dev Environment Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Ensure DNS A record for dev.aubrigo.pt points to this server"
echo "2. Push to the 'dev' branch to trigger automatic deployment"
echo "3. Monitor deployment in GitHub Actions"
echo ""
echo "Useful commands:"
echo "  pm2 list                          # List all PM2 processes"
echo "  pm2 logs aubrigo-backend-dev      # View dev backend logs"
echo "  sudo tail -f /var/log/nginx/aubrigo-dev-access.log  # Nginx access logs"
echo "  sudo tail -f /var/log/nginx/aubrigo-dev-error.log   # Nginx error logs"
echo ""
echo "Test the deployment:"
echo "  https://dev.aubrigo.pt/api/health"
echo ""
