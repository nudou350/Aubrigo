import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User, UserRole } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { PetImage } from '../../pets/entities/pet-image.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';
import { Article } from '../../articles/entities/article.entity';
import { Ong } from '../../ongs/entities/ong.entity';
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
    Appointment,
    Pet,
    Donation,
    PetImage,
    Favorite,
    PasswordResetToken,
    Article,
    Ong,
    OngOperatingHours,
    AppointmentSettings,
    OngAvailabilityException,
  ],
  synchronize: false,
  logging: false,
});

// Production admin account
const adminData = {
  email: 'admin@aubrigo.pt',
  password: 'Raphael1995#*',
  ongName: 'Admin',
  phone: '',
  instagramHandle: '',
  location: 'Lisboa',
};

async function seedProduction() {
  try {
    console.log('Starting production database seed...');
    console.log('⚠️  WARNING: This will create ONLY the admin account');
    console.log('');

    await AppDataSource.initialize();
    console.log('Database connection established');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('Email:', adminData.email);
      console.log('');
      console.log('To reset the admin password, use: npm run seed:reset-admin:prod');
      await AppDataSource.destroy();
      return;
    }

    // Create Admin account
    console.log('Creating Admin account...');
    const adminHashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = userRepository.create({
      ...adminData,
      passwordHash: adminHashedPassword,
      role: UserRole.ADMIN,
    });
    await userRepository.save(admin);

    console.log('');
    console.log('========================================');
    console.log('✅ Production seed completed successfully!');
    console.log('========================================');
    console.log('');
    console.log('🔐 ADMIN ACCOUNT CREATED:');
    console.log('  Email: admin@aubrigo.pt');
    console.log('  Password: Raphael1995#*');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('========================================');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during production seeding:', error);
    process.exit(1);
  }
}

seedProduction();
