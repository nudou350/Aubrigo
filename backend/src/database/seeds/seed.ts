import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { PetImage } from '../../pets/entities/pet-image.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { Article } from '../../articles/entities/article.entity';
import { Ong } from '../../ongs/entities/ong.entity';
import { OngOperatingHours } from '../../ongs/entities/ong-operating-hours.entity';
import { AppointmentSettings } from '../../ongs/entities/appointment-settings.entity';
import { OngAvailabilityException } from '../../ongs/entities/ong-availability-exception.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Pet, PetImage, Appointment, Favorite, Donation, Article, Ong, OngOperatingHours, AppointmentSettings, OngAvailabilityException, PasswordResetToken],
  synchronize: false,
  logging: true,
});

// Admin account
const adminData = {
  email: 'admin@petsos.com',
  password: 'Password123!',
  ongName: 'Admin',
  phone: '',
  instagramHandle: '',
  location: 'Lisboa',
};

const ongData = [
  {
    email: 'cantinho@animais.pt',
    password: 'Password123!',
    ongName: 'Cantinho dos Animais',
    phone: '+351 21 234 5678',
    instagramHandle: '@cantinhosdosanimais',
    location: 'Lisboa',
    latitude: 38.7223,
    longitude: -9.1393,
  },
  {
    email: 'patinhas@amigas.pt',
    password: 'Password123!',
    ongName: 'Patinhas Amigas',
    phone: '+351 22 345 6789',
    instagramHandle: '@patinhasamigas',
    location: 'Porto',
    latitude: 41.1579,
    longitude: -8.6291,
  },
  {
    email: 'lar@peludo.pt',
    password: 'Password123!',
    ongName: 'Lar do Peludo',
    phone: '+351 23 456 7890',
    instagramHandle: '@lardopeludo',
    location: 'Coimbra',
    latitude: 40.2033,
    longitude: -8.4103,
  },
];

// Regular users
const regularUsers = [
  {
    email: 'user@test.com',
    password: 'Password123!',
    ongName: '',
  },
];

const dogData = [
  {
    name: 'Plutão',
    species: 'dog',
    breed: 'Border Collie',
    age: 3,
    gender: 'male',
    size: 'large',
    color: 'preto e branco',
    weight: 18.5,
    location: 'Lisboa',
    description: 'O Plutão é um Border Collie muito inteligente e enérgico! Adora brincar e aprender novos truques.',
    images: ['https://images.unsplash.com/photo-1568572933382-74d440642117?w=800'],
  },
  {
    name: 'Nina',
    species: 'dog',
    breed: 'Rafeiro do Alentejo',
    age: 2,
    gender: 'female',
    size: 'medium',
    color: 'castanho claro',
    weight: 12.0,
    location: 'Lisboa',
    description: 'A Nina é uma cachorrinha brincalhona e muito carinhosa! Adora crianças e outros animais.',
    images: ['https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800'],
  },
  {
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age: 5,
    gender: 'male',
    size: 'large',
    color: 'amarelo',
    weight: 30.5,
    location: 'Porto',
    description: 'O Max é um Labrador golden muito calmo e afetuoso. É perfeito para famílias com crianças.',
    images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'],
  },
  {
    name: 'Bolinha',
    species: 'dog',
    breed: 'Yorkshire Terrier',
    age: 4,
    gender: 'female',
    size: 'small',
    color: 'castanho e preto',
    weight: 3.2,
    location: 'Porto',
    description: 'A Bolinha é uma Yorkshire muito amorosa e companheira! Ideal para apartamentos.',
    images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'],
  },
  {
    name: 'Thor',
    species: 'dog',
    breed: 'Pastor Alemão',
    age: 6,
    gender: 'male',
    size: 'large',
    color: 'preto e castanho',
    weight: 35.0,
    location: 'Coimbra',
    description: 'O Thor é um Pastor Alemão leal e protetor. Ideal para casas com quintal.',
    images: ['https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800'],
  },
  {
    name: 'Luna',
    species: 'dog',
    breed: 'Husky Siberiano',
    age: 3,
    gender: 'female',
    size: 'large',
    color: 'cinzento e branco',
    weight: 22.0,
    location: 'Coimbra',
    description: 'A Luna é uma Husky linda e cheia de energia! Precisa de donos muito ativos.',
    images: ['https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800'],
  },
  {
    name: 'Bobi',
    species: 'dog',
    breed: 'Sem Raça Definida',
    age: 7,
    gender: 'male',
    size: 'medium',
    color: 'castanho',
    weight: 15.0,
    location: 'Lisboa',
    description: 'O Bobi é um velhinho muito amoroso e calmo. Ideal para pessoas mais calmas.',
    images: ['https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800'],
  },
  {
    name: 'Mel',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 1,
    gender: 'female',
    size: 'large',
    color: 'dourado',
    weight: 25.0,
    location: 'Porto',
    description: 'A Mel é uma Golden Retriever jovem e super amigável! Adora água!',
    images: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800'],
  },
];

const catData = [
  {
    name: 'Mia',
    species: 'cat',
    breed: 'Persa',
    age: 2,
    gender: 'female',
    size: 'medium',
    color: 'branco',
    weight: 4.5,
    location: 'Lisboa',
    description: 'A Mia é uma gata Persa elegante e tranquila. Ideal para apartamentos.',
    images: ['https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800'],
  },
  {
    name: 'Simba',
    species: 'cat',
    breed: 'Maine Coon',
    age: 4,
    gender: 'male',
    size: 'large',
    color: 'tigrado laranja',
    weight: 7.8,
    location: 'Lisboa',
    description: 'O Simba é um Maine Coon majestoso e muito sociável. Dá-se bem com crianças e cães.',
    images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800'],
  },
  {
    name: 'Lua',
    species: 'cat',
    breed: 'Siamês',
    age: 3,
    gender: 'female',
    size: 'small',
    color: 'creme e castanho',
    weight: 3.5,
    location: 'Porto',
    description: 'A Lua é uma Siamesa muito vocal e expressiva! Tem olhos azuis lindíssimos.',
    images: ['https://images.unsplash.com/photo-1573865526739-10c1d3a1f0cc?w=800'],
  },
  {
    name: 'Felix',
    species: 'cat',
    breed: 'Sem Raça Definida',
    age: 5,
    gender: 'male',
    size: 'medium',
    color: 'preto',
    weight: 5.0,
    location: 'Porto',
    description: 'O Felix é um gato preto lindo e muito independente. Perfeito para pessoas que trabalham fora.',
    images: ['https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800'],
  },
  {
    name: 'Princesa',
    species: 'cat',
    breed: 'Angorá Turco',
    age: 1,
    gender: 'female',
    size: 'small',
    color: 'branco',
    weight: 3.0,
    location: 'Coimbra',
    description: 'A Princesa faz jus ao nome! É uma gatinha elegante e muito mimada.',
    images: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800'],
  },
  {
    name: 'Tigre',
    species: 'cat',
    breed: 'Sem Raça Definida',
    age: 6,
    gender: 'male',
    size: 'medium',
    color: 'tigrado cinzento',
    weight: 5.5,
    location: 'Coimbra',
    description: 'O Tigre é um gato de rua que foi resgatado e tratado. É muito grato e carinhoso.',
    images: ['https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800'],
  },
  {
    name: 'Nala',
    species: 'cat',
    breed: 'Ragdoll',
    age: 2,
    gender: 'female',
    size: 'medium',
    color: 'seal point',
    weight: 4.8,
    location: 'Lisboa',
    description: 'A Nala é uma Ragdoll super dócil e relaxada. Perfeita para famílias com crianças.',
    images: ['https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800'],
  },
  {
    name: 'Whiskers',
    species: 'cat',
    breed: 'British Shorthair',
    age: 4,
    gender: 'male',
    size: 'medium',
    color: 'cinzento azulado',
    weight: 6.2,
    location: 'Porto',
    description: 'O Whiskers é um British Shorthair com cara de peluche! Ideal para apartamento.',
    images: ['https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800'],
  },
  {
    name: 'Pantufa',
    species: 'cat',
    breed: 'Sem Raça Definida',
    age: 8,
    gender: 'female',
    size: 'small',
    color: 'tricolor',
    weight: 3.8,
    location: 'Coimbra',
    description: 'A Pantufa é uma senhora gatinha muito especial. É calma e carinhosa.',
    images: ['https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=800'],
  },
];

async function seed() {
  try {
    console.log('Starting database seed...');
    
    await AppDataSource.initialize();
    console.log('Database connection established');

    const userRepository = AppDataSource.getRepository(User);
    const petRepository = AppDataSource.getRepository(Pet);
    const petImageRepository = AppDataSource.getRepository(PetImage);
    const appointmentRepository = AppDataSource.getRepository(Appointment);
    const favoriteRepository = AppDataSource.getRepository(Favorite);

    console.log('Cleaning existing data...');
    // Use raw SQL with CASCADE to handle foreign key constraints
    await AppDataSource.query('TRUNCATE TABLE "appointments", "favorites", "pet_images", "pets", "users" RESTART IDENTITY CASCADE');
    console.log('Existing data cleared');

    // Create Admin account
    console.log('Creating Admin account...');
    const adminHashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = userRepository.create({
      ...adminData,
      passwordHash: adminHashedPassword,
      role: UserRole.ADMIN,
    });
    await userRepository.save(admin);
    console.log('✅ Created Admin:', adminData.email);

    console.log('Creating ONG accounts...');
    const createdOngs: User[] = [];

    for (const ong of ongData) {
      const hashedPassword = await bcrypt.hash(ong.password, 10);
      const user = userRepository.create({
        ...ong,
        passwordHash: hashedPassword,
        role: UserRole.ONG,
      });
      const savedUser = await userRepository.save(user);
      createdOngs.push(savedUser);
      console.log('Created ONG:', ong.ongName);
    }
    console.log('Created', createdOngs.length, 'ONGs');

    console.log('Creating Regular users...');
    for (const regularUser of regularUsers) {
      const hashedPassword = await bcrypt.hash(regularUser.password, 10);
      const user = userRepository.create({
        ...regularUser,
        passwordHash: hashedPassword,
        role: UserRole.USER,
      });
      await userRepository.save(user);
      console.log('Created User:', regularUser.email);
    }

    console.log('Creating dog listings...');
    let dogCount = 0;

    for (const dog of dogData) {
      const ong = createdOngs.find((o) => o.location === dog.location) || createdOngs[0];
      const { images, ...dogWithoutImages } = dog;
      const pet = petRepository.create({
        ...dogWithoutImages,
        ongId: ong.id,
        status: 'available',
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
      dogCount++;
      console.log('Created dog:', dog.name);
    }
    console.log('Created', dogCount, 'dogs');

    console.log('Creating cat listings...');
    let catCount = 0;

    for (const cat of catData) {
      const ong = createdOngs.find((o) => o.location === cat.location) || createdOngs[0];
      const { images, ...catWithoutImages } = cat;
      const pet = petRepository.create({
        ...catWithoutImages,
        ongId: ong.id,
        status: 'available',
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
      catCount++;
      console.log('Created cat:', cat.name);
    }
    console.log('Created', catCount, 'cats');

    console.log('========================================');
    console.log('✅ Seed completed successfully!');
    console.log('========================================');
    console.log('');
    console.log('📊 Summary:');
    console.log('  ONGs:', createdOngs.length);
    console.log('  Dogs:', dogCount);
    console.log('  Cats:', catCount);
    console.log('  Total pets:', dogCount + catCount);
    console.log('');
    console.log('🔐 Test Accounts (Password for all: Password123!):');
    console.log('');
    console.log('👑 ADMIN:');
    console.log('  Email: admin@petsos.com');
    console.log('  Password: Password123!');
    console.log('');
    console.log('🏠 ONG ACCOUNTS:');
    ongData.forEach((ong) => {
      console.log(`  - ${ong.ongName}`);
      console.log(`    Email: ${ong.email}`);
      console.log(`    Password: ${ong.password}`);
    });
    console.log('');
    console.log('👤 REGULAR USER:');
    console.log('  Email: user@test.com');
    console.log('  Password: Password123!');
    console.log('');
    console.log('========================================');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
