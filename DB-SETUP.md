# Aubrigo Database Setup

## Local PostgreSQL Configuration

This project uses a local PostgreSQL installation with separate databases for different branches.

### Database Structure

| Branch | Database Name | Connection String |
|--------|--------------|-------------------|
| **dev** | `aubrigo_dev` | `postgresql://postgres:postgres123@localhost:5432/aubrigo_dev` |
| **main** | `aubrigo` | `postgresql://postgres:postgres123@localhost:5432/aubrigo` |

### Automatic Database Switching

When you switch git branches, run this command to automatically update your database connection:

```bash
npm run switch-db
```

This script will:
1. Detect your current git branch
2. Update the `.env` file with the correct database
3. Ensure you're connected to the right database for your branch

### Manual Configuration

If you prefer to manually switch databases, edit the `.env` file:

**For dev branch:**
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/aubrigo_dev
```

**For main branch:**
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/aubrigo
```

### Workflow Example

```bash
# Switch to dev branch
git checkout dev

# Update database connection
npm run switch-db

# Start development
npm start

# Switch to main branch
git checkout main

# Update database connection
npm run switch-db

# Start with production database
npm start
```

### Important Notes

- Both databases exist on the same PostgreSQL instance (localhost:5432)
- Data in `aubrigo_dev` and `aubrigo` are completely separate
- Always run `npm run switch-db` after switching branches
- The `.env` file is in `.gitignore` and won't be committed

### Credentials

- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** postgres123

### Managing Databases

Use **pgAdmin** (installed with PostgreSQL) to:
- View database contents
- Run SQL queries
- Manage tables and data
- Create backups

Connection details are the same as above.
