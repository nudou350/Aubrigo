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
// Admin account - Global access to all countries
const adminData = {
  email: 'admin@aubrigo.pt',
  password: 'IIIlll33#',
  firstName: 'Admin',
  lastName: 'Aubrigo',
  countryCode: 'PT', // Default country, but admin has access to all countries via filters
};
// Test ONG accounts for Portugal
const portugueseOngs = [
  {
    email: 'ong.lisboa@test.pt',
    password: 'Password123!',
    ongName: 'ONG Lisboa',
    phone: '+351 21 234 5678',
    hasWhatsapp: true,
    instagramHandle: '@onglisboa',
    location: 'Lisboa',
    countryCode: 'PT',
    latitude: 38.7223,
    longitude: -9.1393,
  },
  {
    email: 'ong.porto@test.pt',
    password: 'Password123!',
    ongName: 'ONG Porto',
    phone: '+351 22 345 6789',
    hasWhatsapp: true,
    instagramHandle: '@ongporto',
    location: 'Porto',
    countryCode: 'PT',
    latitude: 41.1579,
    longitude: -8.6291,
  },
];
// Test ONG accounts for Brazil
const brazilianOngs = [
  {
    email: 'ong.saopaulo@test.br',
    password: 'Password123!',
    ongName: 'ONG São Paulo',
    phone: '+55 11 98765-4321',
    pixKey: '+5511987654321', // PIX key using phone
    hasWhatsapp: true,
    instagramHandle: '@ongsaopaulo',
    location: 'São Paulo',
    countryCode: 'BR',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  {
    email: 'ong.rio@test.br',
    password: 'Password123!',
    ongName: 'ONG Rio de Janeiro',
    phone: '+55 21 98765-4321',
    pixKey: 'ong.rio@test.br', // PIX key using email
    hasWhatsapp: true,
    instagramHandle: '@ongrio',
    location: 'Rio de Janeiro',
    countryCode: 'BR',
    latitude: -22.9068,
    longitude: -43.1729,
  },
];
// Test regular user
const regularUser = {
  email: 'user@test.com',
  password: 'Password123!',
  firstName: 'User',
  lastName: 'Test',
  countryCode: 'PT',
};
// Sample pets for Portugal
const portuguesePets = [
  {
    name: 'Rex',
    species: 'dog',
    breed: 'Labrador',
    age: 3,
    gender: 'male',
    size: 'large',
    color: 'amarelo',
    weight: 28.5,
    description: 'Rex é um Labrador muito amigável e brincalhão. Adora crianças!',
    images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'],
  },
  {
    name: 'Luna',
    species: 'cat',
    breed: 'Persa',
    age: 2,
    gender: 'female',
    size: 'medium',
    color: 'branco',
    weight: 4.5,
    description: 'Luna é uma gata Persa elegante e carinhosa.',
    images: ['https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800'],
  },
];
// Sample pets for Brazil
const brazilianPets = [
  {
    name: 'Thor',
    species: 'dog',
    breed: 'Pastor Alemão',
    age: 4,
    gender: 'male',
    size: 'large',
    color: 'preto e marrom',
    weight: 35.0,
    description: 'Thor é um Pastor Alemão leal e protetor.',
    images: ['https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800'],
  },
  {
    name: 'Mia',
    species: 'cat',
    breed: 'Siamês',
    age: 1,
    gender: 'female',
    size: 'small',
    color: 'creme e marrom',
    weight: 3.5,
    description: 'Mia é uma gatinha Siamesa muito expressiva.',
    images: ['https://images.unsplash.com/photo-1573865526739-10c1d3a1f0cc?w=800'],
  },
];
async function seed() {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);
    const petRepository = AppDataSource.getRepository(Pet);
    const petImageRepository = AppDataSource.getRepository(PetImage);
    // Clean existing data
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
    // Create Admin
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
    // Create Regular User
    const userHashedPassword = await bcrypt.hash(regularUser.password, 10);
    const user = userRepository.create({
      email: regularUser.email,
      passwordHash: userHashedPassword,
      firstName: regularUser.firstName,
      lastName: regularUser.lastName,
      role: UserRole.USER,
      countryCode: regularUser.countryCode,
    });
    await userRepository.save(user);
    // Create Portuguese ONGs
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
    }
    // Create Brazilian ONGs
    const createdBrOngs: User[] = [];
    for (const ong of brazilianOngs) {
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
      createdBrOngs.push(saved);
    }
    // Create Portuguese Pets
    let petCount = 0;
    for (const petData of portuguesePets) {
      const ong = createdPtOngs[petCount % createdPtOngs.length];
      const { images, ...petWithoutImages } = petData;
      const pet = petRepository.create({
        ...petWithoutImages,
        ongId: ong.id,
        status: 'available',
        location: ong.location, // Use ONG's location
        countryCode: ong.countryCode, // Inherit country from ONG
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
    }
    // Create Brazilian Pets
    for (const petData of brazilianPets) {
      const ong = createdBrOngs[petCount % createdBrOngs.length];
      const { images, ...petWithoutImages } = petData;
      const pet = petRepository.create({
        ...petWithoutImages,
        ongId: ong.id,
        status: 'available',
        location: ong.location, // Use ONG's location
        countryCode: ong.countryCode, // Inherit country from ONG
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
    }
    portugueseOngs.forEach((ong) => {
    });
    brazilianOngs.forEach((ong) => {
    });
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}
seed();
