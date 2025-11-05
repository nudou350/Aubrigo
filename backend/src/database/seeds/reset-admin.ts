import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { PetImage } from '../../pets/entities/pet-image.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Appointment, Pet, Donation, PetImage, Favorite, PasswordResetToken],
  synchronize: false,
});

async function resetAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Delete all existing admins
    const existingAdmins = await userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmins.length > 0) {
      await userRepository.remove(existingAdmins);
      console.log(`✅ Removed ${existingAdmins.length} existing admin(s)`);
    }

    // Create new admin with dev.raphaelp@gmail.com
    const adminEmail = 'dev.raphaelp@gmail.com';
    const adminPassword = 'Admin123!'; // Strong password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = userRepository.create({
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'Raphael',
      lastName: 'Pereira',
    });

    await userRepository.save(admin);

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('='.repeat(50));
    console.log('ADMIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('='.repeat(50));
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error resetting admin:', error);
    process.exit(1);
  }
}

resetAdmin();
