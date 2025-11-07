# Database Seed Summary - Aubrigo

## What Was Created

A comprehensive database seed system for the Aubrigo application with realistic Portuguese test data.

## File Locations

```
backend/
├── src/database/seeds/
│   ├── seed.ts              # Main seed script (385 lines)
│   └── README.md            # Detailed seed documentation
├── SEED_GUIDE.md            # Quick start guide
└── package.json             # Contains "npm run seed" command
```

## Quick Start

```bash
cd backend
npm run seed
```

## What Gets Seeded

### 3 ONG Accounts (Animal Shelters)

1. **Cantinho dos Animais** - Lisboa

   - Email: `cantinho@animais.pt`
   - Password: `Password123!`
   - Phone: +351 21 234 5678
   - Instagram: @cantinhosdosanimais

2. **Patinhas Amigas** - Porto

   - Email: `patinhas@amigas.pt`
   - Password: `Password123!`
   - Phone: +351 22 345 6789
   - Instagram: @patinhasamigas

3. **Lar do Peludo** - Coimbra
   - Email: `lar@peludo.pt`
   - Password: `Password123!`
   - Phone: +351 23 456 7890
   - Instagram: @lardopeludo

### 8 Dogs

All with Portuguese names, realistic descriptions, breeds, and Unsplash images:

- **Plutão** - Border Collie, 3 years, Large, Lisboa
- **Nina** - Rafeiro do Alentejo, 2 years, Medium, Lisboa
- **Max** - Labrador, 5 years, Large, Porto
- **Bolinha** - Yorkshire Terrier, 4 years, Small, Porto
- **Thor** - Pastor Alemão, 6 years, Large, Coimbra
- **Luna** - Husky Siberiano, 3 years, Large, Coimbra
- **Bobi** - Sem Raça Definida, 7 years, Medium, Lisboa
- **Mel** - Golden Retriever, 1 year, Large, Porto

### 9 Cats

All with Portuguese names, realistic descriptions, breeds, and Unsplash images:

- **Mia** - Persa, 2 years, Medium, Lisboa
- **Simba** - Maine Coon, 4 years, Large, Lisboa
- **Lua** - Siamês, 3 years, Small, Porto
- **Felix** - Sem Raça Definida, 5 years, Medium, Porto
- **Princesa** - Angorá Turco, 1 year, Small, Coimbra
- **Tigre** - Sem Raça Definida, 6 years, Medium, Coimbra
- **Nala** - Ragdoll, 2 years, Medium, Lisboa
- **Whiskers** - British Shorthair, 4 years, Medium, Porto
- **Pantufa** - Sem Raça Definida, 8 years, Small, Coimbra

## Data Distribution

- **Total Pets**: 17 (8 dogs + 9 cats)
- **Lisboa**: 6 pets (2 dogs, 4 cats)
- **Porto**: 6 pets (3 dogs, 3 cats)
- **Coimbra**: 5 pets (3 dogs, 2 cats)

## Features

✅ Realistic Portuguese names and descriptions  
✅ All pet fields populated (species, breed, age, gender, size, color, weight)  
✅ High-quality images from Unsplash  
✅ Primary image designation  
✅ Proper ONG relationships  
✅ Hashed passwords using bcrypt  
✅ Location-based distribution across 3 cities  
✅ Variety in breeds, ages, sizes, and genders

## How It Works

1. **Connects** to database using DATABASE_URL from .env
2. **Clears** existing data (users, pets, pet_images)
3. **Creates** 3 ONG accounts with hashed passwords
4. **Creates** 8 dog listings with images
5. **Creates** 9 cat listings with images
6. **Links** each pet to the appropriate ONG by location
7. **Sets** primary images for each pet
8. **Displays** summary of created data

## Testing After Seeding

### Start the Backend

```bash
cd backend
npm run start:dev
```

### Test API Endpoints

```bash
# Get all pets
curl http://localhost:3000/api/pets

# Get dogs only
curl http://localhost:3000/api/pets?species=dog

# Get cats only
curl http://localhost:3000/api/pets?species=cat

# Get pets in Lisboa
curl "http://localhost:3000/api/pets?location=Lisboa"

# Login as ONG
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cantinho@animais.pt","password":"Password123!"}'
```

### Start the Frontend

```bash
cd frontend
npm start
```

Then visit:

- http://localhost:4200 - Home page with pet listings
- http://localhost:4200/login - Login with test accounts

## Database Verification

```bash
# Connect to database
psql postgresql://petsos_user:petsos_dev_password_2024@localhost:5432/petsos_dev

# Check counts
SELECT COUNT(*) FROM users;      -- Should be 3
SELECT COUNT(*) FROM pets;       -- Should be 17
SELECT COUNT(*) FROM pet_images; -- Should be 17+

# View all pets
SELECT p.name, p.species, p.breed, p.location, u.ong_name
FROM pets p
JOIN users u ON p.ong_id = u.id
ORDER BY p.species, p.name;
```

## Important Notes

⚠️ **Warning**: Running the seed deletes ALL existing data!  
⚠️ **Never** run this in production!  
✅ Safe to run multiple times in development  
✅ Creates consistent test data every time

## Troubleshooting

### Database Connection Error

- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists: `createdb petsos_dev`

### Tables Don't Exist

- Set `synchronize: true` in app.module.ts (development only)
- Or run migrations if configured
- Restart NestJS app to auto-create tables

### bcrypt Error (Windows)

```bash
npm uninstall bcrypt
npm install bcrypt --save
```

## Next Steps

1. ✅ Seed completed
2. Start backend: `npm run start:dev`
3. Start frontend: `cd ../frontend && npm start`
4. Test login with any ONG account
5. Browse pet listings
6. Start building features!

## Documentation

- **Quick Start**: `backend/SEED_GUIDE.md`
- **Detailed Docs**: `backend/src/database/seeds/README.md`
- **Project Specs**: `CLAUDE.md`

## Commands Cheat Sheet

```bash
# Seed database
cd backend && npm run seed

# Start backend
cd backend && npm run start:dev

# Start frontend
cd frontend && npm start

# View logs
# Backend logs appear in terminal
# Check for any errors during startup

# Test API
curl http://localhost:3000/api/pets

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cantinho@animais.pt","password":"Password123!"}'
```

## Success! 🎉

Your Aubrigo database is now populated with:

- 3 test ONG accounts
- 17 realistic pet listings
- Complete with images and descriptions
- Ready for development and testing

Start the backend and frontend to see your pets come to life! 🐕🐱
