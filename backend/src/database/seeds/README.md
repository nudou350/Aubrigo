# Pet SOS Database Seeds

This directory contains seed data for the Pet SOS application, including:
- 3 NGO (animal shelter) accounts
- 8 dog listings with Portuguese names and descriptions
- 9 cat listings with Portuguese names and descriptions

## Seed Data Summary

### ONGs (Animal Shelters)
1. **Cantinho dos Animais** (Lisboa)
   - Email: cantinho@animais.pt
   - Password: Password123!

2. **Patinhas Amigas** (Porto)
   - Email: patinhas@amigas.pt
   - Password: Password123!

3. **Lar do Peludo** (Coimbra)
   - Email: lar@peludo.pt
   - Password: Password123!

### Dogs (8 total)
- Plutão (Border Collie, 3 years) - Lisboa
- Nina (Rafeiro do Alentejo, 2 years) - Lisboa
- Max (Labrador, 5 years) - Porto
- Bolinha (Yorkshire Terrier, 4 years) - Porto
- Thor (Pastor Alemão, 6 years) - Coimbra
- Luna (Husky Siberiano, 3 years) - Coimbra
- Bobi (Sem Raça Definida, 7 years) - Lisboa
- Mel (Golden Retriever, 1 year) - Porto

### Cats (9 total)
- Mia (Persa, 2 years) - Lisboa
- Simba (Maine Coon, 4 years) - Lisboa
- Lua (Siamês, 3 years) - Porto
- Felix (Sem Raça Definida, 5 years) - Porto
- Princesa (Angorá Turco, 1 year) - Coimbra
- Tigre (Sem Raça Definida, 6 years) - Coimbra
- Nala (Ragdoll, 2 years) - Lisboa
- Whiskers (British Shorthair, 4 years) - Porto
- Pantufa (Sem Raça Definida, 8 years) - Coimbra

## How to Run

### Prerequisites
1. Make sure PostgreSQL is running
2. Database should be created and accessible via DATABASE_URL in .env
3. Ensure all dependencies are installed: `npm install`

### Running the Seed

From the backend directory, run:

```bash
npm run seed
```

This command executes the seed script located at `src/database/seeds/seed.ts`.

### What the Seed Does

1. **Connects to the database** using the DATABASE_URL from your .env file
2. **Clears existing data** (WARNING: This deletes all pets, pet images, and users!)
3. **Creates 3 ONG accounts** with hashed passwords
4. **Creates 8 dogs** with realistic Portuguese descriptions and images from Unsplash
5. **Creates 9 cats** with realistic Portuguese descriptions and images from Unsplash
6. **Creates pet images** for each pet, setting the first image as primary
7. **Displays a summary** of what was created

### Output Example

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
...
Created 8 dogs
Creating cat listings...
Created cat: Mia
Created cat: Simba
...
Created 9 cats
========================================
Seed completed successfully!
========================================
Summary:
ONGs: 3
Dogs: 8
Cats: 9
Total pets: 17
```

## Testing the API

After running the seed, you can test the API endpoints:

### Get all pets
```bash
curl http://localhost:3000/api/pets
```

### Login as an ONG
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cantinho@animais.pt","password":"Password123!"}'
```

### Get pets by species
```bash
# Dogs only
curl http://localhost:3000/api/pets?species=dog

# Cats only
curl http://localhost:3000/api/pets?species=cat
```

### Get pets by location
```bash
curl http://localhost:3000/api/pets?location=Lisboa
```

## Customizing the Seed Data

To modify the seed data, edit the arrays in `seed.ts`:

- `ongData`: Array of ONG accounts
- `dogData`: Array of dog listings
- `catData`: Array of cat listings

Each pet should have:
- name (Portuguese name)
- species ('dog' or 'cat')
- breed (breed name in Portuguese)
- age (in years)
- gender ('male' or 'female')
- size ('small', 'medium', or 'large')
- color (description in Portuguese)
- weight (in kg, as a decimal)
- location ('Lisboa', 'Porto', or 'Coimbra')
- description (Portuguese description)
- images (array of image URLs)

## Image Sources

All images are sourced from Unsplash, a free stock photo service. The URLs point to high-quality, royalty-free images of dogs and cats. For production, you should:

1. Upload images to your own S3 bucket or Cloudinary account
2. Update the image URLs in the seed data
3. Ensure images are optimized for web use

## Troubleshooting

### Database connection error
- Check that PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Ensure the database exists

### Permission errors
- Make sure the database user has CREATE, INSERT, and DELETE permissions
- Check that the database role matches the one in DATABASE_URL

### TypeORM errors
- Run `npm install` to ensure all dependencies are installed
- Check that entity files are correctly located

### Seed runs but no data appears
- Check the console output for errors
- Verify the database connection string
- Try running the seed with logging enabled (already enabled in the script)

## Production Warning

**IMPORTANT**: This seed script deletes all existing data before inserting new data. 

**DO NOT run this in production!**

For production deployments:
1. Comment out the delete statements
2. Or create a separate script that only inserts data if tables are empty
3. Use database migrations for schema changes

## Next Steps

After seeding the database:
1. Start the backend: `npm run start:dev`
2. Test the API endpoints
3. Start the frontend: `cd ../frontend && npm start`
4. Browse to http://localhost:4200 to see the pets

## Support

If you encounter any issues with the seed data:
1. Check the console output for error messages
2. Verify your database connection
3. Ensure all entity relationships are correctly defined
4. Check that the User, Pet, and PetImage entities match the seed data structure
