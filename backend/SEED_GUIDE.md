# Quick Start Guide - Database Seeding

## Overview

This guide will help you populate your Pet SOS database with realistic test data including:
- 3 Portuguese animal shelter (ONG) accounts
- 8 dogs with Portuguese names and descriptions  
- 9 cats with Portuguese names and descriptions
- 17 total pets with images

## Prerequisites

Before running the seed script, ensure:

1. **PostgreSQL is running**
   ```bash
   # Check if PostgreSQL is running
   psql --version
   ```

2. **Database exists**
   ```bash
   # The database should be created (petsos_dev)
   # Check your .env file for DATABASE_URL
   ```

3. **Dependencies are installed**
   ```bash
   npm install
   ```

4. **.env file is configured**
   ```
   DATABASE_URL=postgresql://petsos_user:petsos_dev_password_2024@localhost:5432/petsos_dev
   ```

## Running the Seed

### Method 1: NPM Script (Recommended)

```bash
# From the backend directory
npm run seed
```

### Method 2: Direct Execution

```bash
# From the backend directory
ts-node src/database/seeds/seed.ts
```

## Expected Output

You should see output similar to this:

```
Starting database seed...
Database connection established
Cleaning existing data...
Existing data cleared
Creating ONG accounts...
Created ONG: Cantinho dos Animais
Created ONG: Patinhas Amigas
Created ONG: Lar do Peludo
Created 3 ONGs
Creating dog listings...
Created dog: Plutão
Created dog: Nina
Created dog: Max
Created dog: Bolinha
Created dog: Thor
Created dog: Luna
Created dog: Bobi
Created dog: Mel
Created 8 dogs
Creating cat listings...
Created cat: Mia
Created cat: Simba
Created cat: Lua
Created cat: Felix
Created cat: Princesa
Created cat: Tigre
Created cat: Nala
Created cat: Whiskers
Created cat: Pantufa
Created 9 cats
========================================
Seed completed successfully!
========================================
Summary:
ONGs: 3
Dogs: 8
Cats: 9
Total pets: 17
Test Accounts:
- Cantinho dos Animais
  Email: cantinho@animais.pt
  Password: Password123!
- Patinhas Amigas
  Email: patinhas@amigas.pt
  Password: Password123!
- Lar do Peludo
  Email: lar@peludo.pt
  Password: Password123!
```

## Test Accounts

After seeding, you can log in with these test accounts:

| ONG Name | Email | Password | Location |
|----------|-------|----------|----------|
| Cantinho dos Animais | cantinho@animais.pt | Password123! | Lisboa |
| Patinhas Amigas | patinhas@amigas.pt | Password123! | Porto |
| Lar do Peludo | lar@peludo.pt | Password123! | Coimbra |

## Verifying the Seed

### Option 1: Via API (Backend must be running)

Start the backend:
```bash
npm run start:dev
```

Then test the endpoints:
```bash
# Get all pets
curl http://localhost:3000/api/pets

# Get only dogs
curl http://localhost:3000/api/pets?species=dog

# Get only cats
curl http://localhost:3000/api/pets?species=cat

# Get pets in Lisboa
curl "http://localhost:3000/api/pets?location=Lisboa"

# Login as an ONG
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cantinho@animais.pt","password":"Password123!"}'
```

### Option 2: Via Database Client

```bash
# Connect to PostgreSQL
psql postgresql://petsos_user:petsos_dev_password_2024@localhost:5432/petsos_dev

# Check the data
SELECT COUNT(*) FROM users;   -- Should return 3
SELECT COUNT(*) FROM pets;    -- Should return 17
SELECT COUNT(*) FROM pet_images; -- Should return 17+

# View pets
SELECT name, species, breed, location FROM pets;

# Exit
\q
```

## Seed Data Details

### Dogs (8)

| Name | Breed | Age | Size | Location |
|------|-------|-----|------|----------|
| Plutão | Border Collie | 3 | Large | Lisboa |
| Nina | Rafeiro do Alentejo | 2 | Medium | Lisboa |
| Max | Labrador | 5 | Large | Porto |
| Bolinha | Yorkshire Terrier | 4 | Small | Porto |
| Thor | Pastor Alemão | 6 | Large | Coimbra |
| Luna | Husky Siberiano | 3 | Large | Coimbra |
| Bobi | Sem Raça Definida | 7 | Medium | Lisboa |
| Mel | Golden Retriever | 1 | Large | Porto |

### Cats (9)

| Name | Breed | Age | Size | Location |
|------|-------|-----|------|----------|
| Mia | Persa | 2 | Medium | Lisboa |
| Simba | Maine Coon | 4 | Large | Lisboa |
| Lua | Siamês | 3 | Small | Porto |
| Felix | Sem Raça Definida | 5 | Medium | Porto |
| Princesa | Angorá Turco | 1 | Small | Coimbra |
| Tigre | Sem Raça Definida | 6 | Medium | Coimbra |
| Nala | Ragdoll | 2 | Medium | Lisboa |
| Whiskers | British Shorthair | 4 | Medium | Porto |
| Pantufa | Sem Raça Definida | 8 | Small | Coimbra |

## Troubleshooting

### Error: Cannot connect to database

**Problem**: `ECONNREFUSED` or `Connection refused`

**Solution**:
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Ensure database exists: `createdb petsos_dev`

### Error: relation "users" does not exist

**Problem**: Tables haven't been created

**Solution**:
1. Make sure `synchronize: true` in development (check app.module.ts)
2. Or run migrations if you have them
3. Restart the NestJS app to auto-create tables

### Error: duplicate key value violates unique constraint

**Problem**: Data already exists in database

**Solution**:
1. The seed script automatically deletes existing data
2. If it fails, manually clear tables:
   ```sql
   DELETE FROM pet_images;
   DELETE FROM pets;
   DELETE FROM users;
   ```

### Error: Module not found

**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

### Error: Cannot find module 'bcrypt'

**Problem**: bcrypt not properly installed (common on Windows)

**Solution**:
```bash
npm uninstall bcrypt
npm install bcrypt --save
```

## Re-running the Seed

You can run the seed script multiple times. Each time it will:
1. Delete all existing data (users, pets, pet_images)
2. Re-create the test data fresh

**Warning**: This means any custom data you added will be lost!

## Next Steps

After successfully seeding the database:

1. **Start the backend** (if not already running):
   ```bash
   npm run start:dev
   ```

2. **Start the frontend**:
   ```bash
   cd ../frontend
   npm start
   ```

3. **Access the application**:
   - Frontend: http://localhost:4200
   - API: http://localhost:3000/api
   - API Docs (if Swagger enabled): http://localhost:3000/api/docs

4. **Test the login**:
   - Go to http://localhost:4200/login
   - Use any of the test accounts above
   - Email: `cantinho@animais.pt`
   - Password: `Password123!`

## Production Note

**IMPORTANT**: Never run this seed script in production!

The script deletes all data before inserting test data. For production:
- Use migrations for schema changes
- Use proper data import scripts
- Never delete existing user data
- Use environment-specific configurations

## Need Help?

For more details, see:
- `src/database/seeds/README.md` - Detailed seed documentation
- Entity files in `src/*/entities/` - Database schema
- CLAUDE.md - Complete project specifications

## Summary

```bash
# Quick command to seed your database
cd backend
npm run seed
```

That's it! Your database is now populated with 17 test pets and 3 ONG accounts ready for development and testing.
