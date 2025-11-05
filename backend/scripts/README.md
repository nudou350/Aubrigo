# Database Scripts

## Initialize Database

Run this script to create all tables and indexes:

\`\`\`bash
# As postgres user
psql -U postgres -d petsos -f init-database.sql
\`\`\`

Or use psql interactively:

\`\`\`bash
# Create database
createdb petsos

# Run initialization
psql -U postgres petsos < init-database.sql
\`\`\`

## Default Credentials

**Admin Account:**
- Email: admin@petsos.com
- Password: admin123

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## Database Backup

\`\`\`bash
# Backup
pg_dump petsos > backup-$(date +%Y%m%d).sql

# Restore
psql petsos < backup-20250101.sql
\`\`\`
