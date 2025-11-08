import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { User, UserRole, OngStatus } from '../../users/entities/user.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { PetImage } from '../../pets/entities/pet-image.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { Article } from '../../articles/entities/article.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';
import { OngOperatingHours } from '../../ongs/entities/ong-operating-hours.entity';
import { AppointmentSettings } from '../../ongs/entities/appointment-settings.entity';
import { OngAvailabilityException } from '../../ongs/entities/ong-availability-exception.entity';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Pet,
    PetImage,
    Appointment,
    Favorite,
    Donation,
    Article,
    PasswordResetToken,
    OngOperatingHours,
    AppointmentSettings,
    OngAvailabilityException,
  ],
  synchronize: false,
  logging: false,
});

// Admin account - Production
const adminData = {
  email: 'admin@aubrigo.pt',
  password: 'IIIlll33#',
  firstName: 'Admin',
  lastName: 'Aubrigo',
  countryCode: 'PT',
};

// Production ONG accounts for Portugal (demo/showcase)
const portugueseOngs = [
  {
    email: 'ong.lisboa@aubrigo.pt',
    password: 'OngLisboa2025!',
    ongName: 'Amigos dos Animais Lisboa',
    phone: '+351 21 234 5678',
    hasWhatsapp: true,
    instagramHandle: '@amigosdosanimais_lisboa',
    location: 'Lisboa',
    countryCode: 'PT',
    latitude: 38.7223,
    longitude: -9.1393,
  },
  {
    email: 'ong.porto@aubrigo.pt',
    password: 'OngPorto2025!',
    ongName: 'Patinhas Felizes Porto',
    phone: '+351 22 345 6789',
    hasWhatsapp: true,
    instagramHandle: '@patinhasfelizes_porto',
    location: 'Porto',
    countryCode: 'PT',
    latitude: 41.1579,
    longitude: -8.6291,
  },
];

// Sample pets for Portugal (demo/showcase)
const portuguesePets = [
  {
    name: 'Rex',
    species: 'dog',
    breed: 'Labrador Retriever',
    age: 3,
    gender: 'male',
    size: 'large',
    color: 'Dourado',
    weight: 28.5,
    description: 'O Rex é um Labrador muito amigável e brincalhão. Adora crianças e é perfeito para famílias ativas. Está vacinado e castrado.',
    images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'],
  },
  {
    name: 'Luna',
    species: 'cat',
    breed: 'Gato Persa',
    age: 2,
    gender: 'female',
    size: 'medium',
    color: 'Branco',
    weight: 4.5,
    description: 'A Luna é uma gata Persa elegante e carinhosa. Ideal para apartamentos e pessoas que buscam companhia tranquila.',
    images: ['https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800'],
  },
  {
    name: 'Bela',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 5,
    gender: 'female',
    size: 'large',
    color: 'Dourado claro',
    weight: 30.0,
    description: 'A Bela é uma Golden muito dócil e amorosa. Ótima com crianças e outros animais.',
    images: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800'],
  },
  {
    name: 'Mimi',
    species: 'cat',
    breed: 'Gato Europeu',
    age: 1,
    gender: 'female',
    size: 'small',
    color: 'Tricolor',
    weight: 3.2,
    description: 'A Mimi é uma gatinha jovem e brincalhona. Muito ativa e curiosa, perfeita para quem gosta de energia felina.',
    images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800'],
  },
];

async function seedProduction() {
  try {
    console.log('========================================');
    console.log('🌱 Starting Aubrigo PRODUCTION Seed (Portugal Only)');
    console.log('========================================\n');

    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const userRepository = AppDataSource.getRepository(User);
    const petRepository = AppDataSource.getRepository(Pet);
    const petImageRepository = AppDataSource.getRepository(PetImage);

    // Clean existing data
    console.log('🗑️  Cleaning existing data...');
    await AppDataSource.query(`
      TRUNCATE TABLE
        "pet_images",
        "pets",
        "appointments",
        "favorites",
        "donations",
        "articles",
        "password_reset_tokens",
        "ong_availability_exceptions",
        "appointment_settings",
        "ong_operating_hours",
        "users"
      RESTART IDENTITY CASCADE
    `);
    console.log('✅ Data cleaned\n');

    // Create Admin
    console.log('👑 Creating Admin account...');
    const adminHashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = userRepository.create({
      email: adminData.email,
      passwordHash: adminHashedPassword,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      role: UserRole.ADMIN,
      countryCode: adminData.countryCode,
    });
    await userRepository.save(admin);
    console.log(`✅ Admin created: ${adminData.email}\n`);

    // Create Portuguese ONGs
    console.log('🇵🇹 Creating Portuguese ONGs...');
    const createdPtOngs: User[] = [];
    for (const ong of portugueseOngs) {
      const hashedPassword = await bcrypt.hash(ong.password, 10);
      const ongUser = userRepository.create({
        email: ong.email,
        passwordHash: hashedPassword,
        ongName: ong.ongName,
        phone: ong.phone,
        hasWhatsapp: ong.hasWhatsapp,
        instagramHandle: ong.instagramHandle,
        location: ong.location,
        latitude: ong.latitude,
        longitude: ong.longitude,
        role: UserRole.ONG,
        ongStatus: OngStatus.APPROVED,
        countryCode: ong.countryCode,
      });
      const saved = await userRepository.save(ongUser);
      createdPtOngs.push(saved);
      console.log(`  ✅ ${ong.ongName} - ${ong.email}`);
    }
    console.log('');

    // Create Portuguese Pets
    console.log('🐾 Creating Portuguese Pets...');
    let petCount = 0;
    for (const petData of portuguesePets) {
      const ong = createdPtOngs[petCount % createdPtOngs.length];
      const { images, ...petWithoutImages } = petData;
      const pet = petRepository.create({
        ...petWithoutImages,
        ongId: ong.id,
        status: 'available',
        location: ong.location,
        countryCode: ong.countryCode,
      });
      const savedPet = await petRepository.save(pet);

      for (let i = 0; i < images.length; i++) {
        const petImage = petImageRepository.create({
          petId: savedPet.id,
          imageUrl: images[i],
          isPrimary: i === 0,
          displayOrder: i,
        });
        await petImageRepository.save(petImage);
      }
      petCount++;
      console.log(`  ✅ ${petData.name} (${petData.species})`);
    }
    console.log('');

    console.log('========================================');
    console.log('✅ Production Seed Completed Successfully!');
    console.log('========================================\n');

    console.log('📊 Summary:');
    console.log(`  🇵🇹 Portuguese ONGs: ${createdPtOngs.length}`);
    console.log(`  🐾 Total Pets: ${petCount}\n`);

    console.log('========================================');
    console.log('🔐 PRODUCTION ACCOUNTS');
    console.log('========================================\n');

    console.log('👑 ADMIN:');
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Password: ${adminData.password}\n`);

    console.log('🇵🇹 PORTUGUESE ONGs:');
    portugueseOngs.forEach((ong) => {
      console.log(`  📧 ${ong.email}`);
      console.log(`     🏢 ${ong.ongName}`);
      console.log(`     🔑 ${ong.password}\n`);
    });

    console.log('========================================\n');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('⚠️  Change ONG passwords after first login.\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedProduction();
