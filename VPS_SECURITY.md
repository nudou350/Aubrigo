# VPS Security Guide - Aubrigo

This document outlines the security configuration and best practices for the Aubrigo VPS hosting both production and development environments.

## Initial Server Hardening

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### 2. Create Non-Root User (if not exists)

```bash
# Create user
sudo adduser aubrigo

# Add to sudo group
sudo usermod -aG sudo aubrigo

# Switch to new user
su - aubrigo
```

### 3. Configure SSH Access

#### Disable Root Login

Edit SSH configuration:
```bash
sudo nano /etc/ssh/sshd_config
```

Update the following settings:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22  # Consider changing to non-standard port
```

Restart SSH service:
```bash
sudo systemctl restart sshd
```

#### Set Up SSH Keys

On your local machine:
```bash
# Generate SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@vps-ip
```

Add the private key to GitHub Secrets:
```bash
cat ~/.ssh/id_ed25519  # Copy this to GitHub Secrets as VPS_SSH_KEY
```

### 4. Configure Firewall (UFW)

```bash
# Install UFW
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important: do this before enabling!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 5. Install and Configure Fail2Ban

Fail2Ban protects against brute-force attacks:

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

Add SSH protection:
```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
```

Start and enable Fail2Ban:
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
sudo systemctl status fail2ban

# Check banned IPs
sudo fail2ban-client status sshd
```

## Application Security

### 1. Environment Variables Protection

Never commit sensitive data to Git. All secrets are stored in GitHub Secrets and deployed via CI/CD:

- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_PASSWORD`
- SSH keys

### 2. Database Security

#### PostgreSQL Configuration

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Security settings:
```
listen_addresses = 'localhost'  # Only local connections
ssl = on                        # Enable SSL
password_encryption = scram-sha-256
```

#### Create Database User with Limited Permissions

```sql
-- Create database user
CREATE USER aubrigo_app WITH PASSWORD 'strong_password_here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE aubrigo TO aubrigo_app;
GRANT USAGE ON SCHEMA public TO aubrigo_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aubrigo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aubrigo_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aubrigo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO aubrigo_app;
```

#### Regular Database Backups

Create automated backup script:
```bash
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="aubrigo"

mkdir -p $BACKUP_DIR
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e
```

Add to crontab (daily at 2 AM):
```
0 2 * * * /usr/local/bin/backup-db.sh
```

### 3. Nginx Security Headers

Already configured in nginx configuration files, but verify:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:;" always;
```

### 4. File Upload Security

Configured in nginx:
```nginx
client_max_body_size 10M;  # Limit upload size
```

Backend validation in NestJS:
- File type validation (whitelist)
- Size limits
- Antivirus scanning (optional)
- Storage outside web root

### 5. Rate Limiting

#### Nginx Rate Limiting

Add to nginx configuration:
```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Apply to API
location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of proxy config
}

# Apply to auth endpoints
location /api/auth/login {
    limit_req zone=login_limit burst=2 nodelay;
    # ... rest of proxy config
}
```

#### Application-Level Rate Limiting

Implemented in NestJS with `@nestjs/throttler` (check backend code).

### 6. SSL/TLS Configuration

#### Strong SSL Configuration

Already configured in nginx, but verify:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

#### HSTS (HTTP Strict Transport Security)

Add to nginx:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

#### Certificate Auto-Renewal

Certbot automatically renews certificates. Verify:
```bash
# Test renewal
sudo certbot renew --dry-run

# Check certbot timer
sudo systemctl status certbot.timer
```

## Monitoring and Logging

### 1. Enable and Monitor Logs

#### System Logs
```bash
# View auth logs (login attempts)
sudo tail -f /var/log/auth.log

# View system logs
sudo journalctl -f
```

#### Application Logs
```bash
# PM2 logs
pm2 logs aubrigo-backend
pm2 logs aubrigo-backend-dev

# Nginx logs
sudo tail -f /var/log/nginx/aubrigo-access.log
sudo tail -f /var/log/nginx/aubrigo-error.log
sudo tail -f /var/log/nginx/aubrigo-dev-access.log
sudo tail -f /var/log/nginx/aubrigo-dev-error.log
```

### 2. Log Rotation

Configure log rotation:
```bash
sudo nano /etc/logrotate.d/aubrigo
```

```
/var/www/aubrigo/current/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 aubrigo aubrigo
    sharedscripts
}

/var/www/aubrigo-dev/current/backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 aubrigo aubrigo
    sharedscripts
}
```

### 3. System Monitoring

Install monitoring tools:
```bash
# Install htop for process monitoring
sudo apt install htop

# Install iotop for disk I/O monitoring
sudo apt install iotop

# Install ncdu for disk usage analysis
sudo apt install ncdu
```

Monitor resources:
```bash
# CPU and memory
htop

# Disk usage
df -h
ncdu /var/www

# Network connections
sudo netstat -tuln
```

## Incident Response

### If Server is Compromised

1. **Isolate the Server**
   ```bash
   # Block all incoming connections except your IP
   sudo ufw default deny incoming
   sudo ufw allow from YOUR_IP to any port 22
   ```

2. **Review Logs**
   ```bash
   # Check auth logs for unauthorized access
   sudo grep "Failed password" /var/log/auth.log
   sudo grep "Accepted publickey" /var/log/auth.log

   # Check nginx access logs for suspicious activity
   sudo grep "POST" /var/log/nginx/aubrigo-access.log
   ```

3. **Check for Backdoors**
   ```bash
   # List all running processes
   ps aux

   # Check for suspicious cron jobs
   sudo crontab -l
   ls -la /etc/cron.*

   # Check for unauthorized SSH keys
   cat ~/.ssh/authorized_keys
   ```

4. **Rotate Credentials**
   - Change all passwords
   - Rotate JWT secrets
   - Regenerate SSH keys
   - Update database credentials

5. **Restore from Backup** (if needed)
   - Use deployment backups
   - Restore database from backup
   - Redeploy application

## Security Checklist

Use this checklist for regular security audits:

### Server Level
- [ ] UFW firewall is enabled and configured
- [ ] Fail2Ban is running and monitoring SSH
- [ ] Root login is disabled
- [ ] Password authentication is disabled
- [ ] SSH keys are used exclusively
- [ ] System packages are up to date
- [ ] Automatic security updates are enabled

### Application Level
- [ ] All secrets are in environment variables (not in code)
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] SSL certificates are valid and auto-renewing
- [ ] Rate limiting is configured
- [ ] File upload validation is working
- [ ] Database backups are running daily
- [ ] Logs are being rotated

### Monitoring
- [ ] PM2 services are running
- [ ] Nginx is running
- [ ] Database is accessible
- [ ] SSL certificates expire > 30 days
- [ ] Disk usage < 80%
- [ ] No suspicious auth.log entries

## Regular Maintenance Schedule

### Daily
- Check application logs for errors
- Monitor disk usage
- Verify PM2 services are running

### Weekly
- Review Fail2Ban banned IPs
- Check for system updates
- Review nginx access logs for anomalies

### Monthly
- Test database backup restoration
- Review and update firewall rules
- Audit user accounts and SSH keys
- Check SSL certificate expiration
- Review application dependencies for vulnerabilities

## Additional Security Measures (Optional)

### 1. Two-Factor Authentication for SSH

```bash
# Install Google Authenticator
sudo apt install libpam-google-authenticator

# Configure for your user
google-authenticator

# Edit SSH PAM config
sudo nano /etc/pam.d/sshd
```

Add at the end:
```
auth required pam_google_authenticator.so
```

### 2. Intrusion Detection (AIDE)

```bash
# Install AIDE
sudo apt install aide

# Initialize database
sudo aideinit

# Check for changes
sudo aide --check
```

### 3. Automated Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Security Contacts

In case of security issues:
- **Email**: security@aubrigo.pt (configure this)
- **Urgent**: Contact server administrator directly

## Compliance Notes

- GDPR: Ensure user data is properly encrypted and backed up
- PCI DSS: Payment processing is handled by Stripe (PCI compliant)
- Data retention: Configure log retention according to local laws

---

**Last Updated**: January 2025
**Maintained By**: Aubrigo Development Team
**Review Frequency**: Quarterly
