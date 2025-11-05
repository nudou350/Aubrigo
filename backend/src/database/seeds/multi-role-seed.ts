import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { Ong } from '../../ongs/entities/ong.entity';
import { OngMember } from '../../ongs/entities/ong-member.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { PetImage } from '../../pets/entities/pet-image.entity';
import { UserRole } from '../../users/entities/user.entity';
import { OngMemberRole, OngPermission } from '../../ongs/entities/ong-member.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Ong, OngMember, Pet, PetImage],
  synchronize: false,
  logging: true,
});

// Test password for all accounts: Password123!
const testPassword = 'Password123!';

const adminUsers = [
  {
    email: 'admin@petsos.com',
    firstName: 'Admin',
    lastName: 'Sistema',
    role: UserRole.ADMIN,
  },
];

const ongAccounts = [
  {
    // ONG Owner
    user: {
      email: 'cantinho@animais.pt',
      role: UserRole.ONG,
    },
    ong: {
      ongName: 'Cantinho dos Animais',
      description: 'ONG dedicada ao resgate e adoção de animais abandonados em Lisboa',
      address: 'Rua das Flores, 123',
      city: 'Lisboa',
      postalCode: '1200-001',
      phone: '+351 21 234 5678',
      email: 'cantinho@animais.pt',
      instagram: '@cantinhosdosanimais',
      approvalStatus: 'approved',
      verified: true,
    },
    memberRole: OngMemberRole.OWNER,
  },
  {
    user: {
      email: 'patinhas@amigas.pt',
      role: UserRole.ONG,
    },
    ong: {
      ongName: 'Patinhas Amigas',
      description: 'Salvando vidas de animais no Porto desde 2010',
      address: 'Avenida dos Aliados, 456',
      city: 'Porto',
      postalCode: '4000-001',
      phone: '+351 22 345 6789',
      email: 'patinhas@amigas.pt',
      instagram: '@patinhasamigas',
      approvalStatus: 'approved',
      verified: true,
    },
    memberRole: OngMemberRole.OWNER,
  },
  {
    user: {
      email: 'lar@peludo.pt',
      role: UserRole.ONG,
    },
    ong: {
      ongName: 'Lar do Peludo',
      description: 'Centro de acolhimento para animais em Coimbra',
      address: 'Praça da República, 789',
      city: 'Coimbra',
      postalCode: '3000-001',
      phone: '+351 23 456 7890',
      email: 'lar@peludo.pt',
      instagram: '@lardopeludo',
      approvalStatus: 'approved',
      verified: false,
    },
    memberRole: OngMemberRole.OWNER,
  },
  {
    // Pending ONG for testing approval
    user: {
      email: 'novosanimais@ong.pt',
      role: UserRole.ONG,
    },
    ong: {
      ongName: 'Novos Animais',
      description: 'Nova ONG em Braga focada em adoção responsável',
      address: 'Rua do Castelo, 321',
      city: 'Braga',
      postalCode: '4700-001',
      phone: '+351 25 345 6789',
      email: 'novosanimais@ong.pt',
      instagram: '@novosanimais',
      approvalStatus: 'pending',
      verified: false,
    },
    memberRole: OngMemberRole.OWNER,
  },
];

const ongTeamMembers = [
  {
    email: 'maria.silva@example.com',
    firstName: 'Maria',
    lastName: 'Silva',
    ongEmail: 'cantinho@animais.pt', // Will join Cantinho dos Animais
    role: OngMemberRole.ADMIN,
    permissions: [
      OngPermission.MANAGE_PETS,
      OngPermission.VIEW_PETS,
      OngPermission.MANAGE_APPOINTMENTS,
      OngPermission.VIEW_DONATIONS,
      OngPermission.MANAGE_ONG_PROFILE,
    ],
  },
  {
    email: 'joao.costa@example.com',
    firstName: 'João',
    lastName: 'Costa',
    ongEmail: 'cantinho@animais.pt',
    role: OngMemberRole.MEMBER,
    permissions: [OngPermission.MANAGE_PETS, OngPermission.VIEW_PETS],
  },
  {
    email: 'ana.santos@example.com',
    firstName: 'Ana',
    lastName: 'Santos',
    ongEmail: 'patinhas@amigas.pt',
    role: OngMemberRole.ADMIN,
    permissions: [
      OngPermission.MANAGE_PETS,
      OngPermission.VIEW_PETS,
      OngPermission.MANAGE_APPOINTMENTS,
      OngPermission.VIEW_DONATIONS,
    ],
  },
];

const regularUsers = [
  {
    email: 'rafael.oliveira@example.com',
    firstName: 'Rafael',
    lastName: 'Oliveira',
    role: UserRole.USER,
  },
  {
    email: 'carla.pereira@example.com',
    firstName: 'Carla',
    lastName: 'Pereira',
    role: UserRole.USER,
  },
  {
    email: 'pedro.martins@example.com',
    firstName: 'Pedro',
    lastName: 'Martins',
    role: UserRole.USER,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting multi-role system seed...');
    console.log('📊 This will create test accounts for Admin, ONGs, and Users');
    console.log('');

    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const userRepository = AppDataSource.getRepository(User);
    const ongRepository = AppDataSource.getRepository(Ong);
    const ongMemberRepository = AppDataSource.getRepository(OngMember);
    const petRepository = AppDataSource.getRepository(Pet);
    const petImageRepository = AppDataSource.getRepository(PetImage);

    // Hash password once for all accounts
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log(`🔐 Using password: ${testPassword} for all accounts`);
    console.log('');

    // 1. Create Admin Users
    console.log('👑 Creating Admin Accounts...');
    const createdAdmins: User[] = [];
    for (const admin of adminUsers) {
      const existingAdmin = await userRepository.findOne({
        where: { email: admin.email },
      });

      if (existingAdmin) {
        console.log(`   ⚠️  Admin ${admin.email} already exists, skipping`);
        createdAdmins.push(existingAdmin);
      } else {
        const user = userRepository.create({
          ...admin,
          passwordHash: hashedPassword,
        });
        const savedUser = await userRepository.save(user);
        createdAdmins.push(savedUser);
        console.log(`   ✅ Created admin: ${admin.email}`);
      }
    }
    console.log('');

    // 2. Create ONGs and their owners
    console.log('🏠 Creating ONG Accounts...');
    const createdOngs: { user: User; ong: Ong }[] = [];
    for (const ongAccount of ongAccounts) {
      const existingUser = await userRepository.findOne({
        where: { email: ongAccount.user.email },
      });

      let user: User;
      if (existingUser) {
        console.log(`   ⚠️  User ${ongAccount.user.email} already exists`);
        user = existingUser;
      } else {
        user = userRepository.create({
          ...ongAccount.user,
          passwordHash: hashedPassword,
        });
        user = await userRepository.save(user);
        console.log(`   ✅ Created user: ${ongAccount.user.email}`);
      }

      const existingOng = await ongRepository.findOne({
        where: { email: ongAccount.ong.email },
      });

      let ong: Ong;
      if (existingOng) {
        console.log(`   ⚠️  ONG ${ongAccount.ong.ongName} already exists`);
        ong = existingOng;
      } else {
        ong = ongRepository.create(ongAccount.ong);
        ong = await ongRepository.save(ong);
        console.log(`   ✅ Created ONG: ${ongAccount.ong.ongName} (${ongAccount.ong.approvalStatus})`);
      }

      // Create ONG membership
      const existingMembership = await ongMemberRepository.findOne({
        where: { userId: user.id, ongId: ong.id },
      });

      if (!existingMembership) {
        const membership = ongMemberRepository.create({
          userId: user.id,
          ongId: ong.id,
          role: ongAccount.memberRole,
          permissions: [],
          invitationStatus: 'accepted',
        });
        await ongMemberRepository.save(membership);
        console.log(`   ✅ Created ${ongAccount.memberRole} membership`);
      }

      createdOngs.push({ user, ong });
    }
    console.log('');

    // 3. Create ONG Team Members
    console.log('👥 Creating ONG Team Members...');
    for (const member of ongTeamMembers) {
      const existingUser = await userRepository.findOne({
        where: { email: member.email },
      });

      let user: User;
      if (existingUser) {
        console.log(`   ⚠️  User ${member.email} already exists`);
        user = existingUser;
      } else {
        user = userRepository.create({
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          role: UserRole.ONG,
          passwordHash: hashedPassword,
        });
        user = await userRepository.save(user);
        console.log(`   ✅ Created user: ${member.email}`);
      }

      // Find the ONG they should join
      const ong = await ongRepository.findOne({
        where: { email: member.ongEmail },
      });

      if (ong) {
        const existingMembership = await ongMemberRepository.findOne({
          where: { userId: user.id, ongId: ong.id },
        });

        if (!existingMembership) {
          const membership = ongMemberRepository.create({
            userId: user.id,
            ongId: ong.id,
            role: member.role,
            permissions: member.permissions,
            invitationStatus: 'accepted',
          });
          await ongMemberRepository.save(membership);
          console.log(`   ✅ Added ${member.firstName} to ${ong.ongName} as ${member.role}`);
        }
      }
    }
    console.log('');

    // 4. Create Regular Users
    console.log('👤 Creating Regular User Accounts...');
    const createdUsers: User[] = [];
    for (const regularUser of regularUsers) {
      const existingUser = await userRepository.findOne({
        where: { email: regularUser.email },
      });

      if (existingUser) {
        console.log(`   ⚠️  User ${regularUser.email} already exists, skipping`);
        createdUsers.push(existingUser);
      } else {
        const user = userRepository.create({
          ...regularUser,
          passwordHash: hashedPassword,
        });
        const savedUser = await userRepository.save(user);
        createdUsers.push(savedUser);
        console.log(`   ✅ Created user: ${regularUser.email}`);
      }
    }
    console.log('');

    // 5. Add some test pets for approved ONGs
    console.log('🐾 Creating Test Pets...');
    const approvedOngs = createdOngs.filter(
      (o) => o.ong.approvalStatus === 'approved',
    );

    if (approvedOngs.length > 0) {
      const testPets = [
        {
          name: 'Plutão',
          species: 'dog',
          breed: 'Border Collie',
          age: 3,
          gender: 'male',
          size: 'large',
          color: 'preto e branco',
          weight: 18.5,
          description:
            'O Plutão é um Border Collie muito inteligente e enérgico! Adora brincar e aprender novos truques.',
          status: 'available',
          ongId: approvedOngs[0].ong.id,
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
          description:
            'A Nina é uma cachorrinha brincalhona e muito carinhosa! Adora crianças e outros animais.',
          status: 'available',
          ongId: approvedOngs[0].ong.id,
          images: ['https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800'],
        },
        {
          name: 'Mia',
          species: 'cat',
          breed: 'Persa',
          age: 2,
          gender: 'female',
          size: 'medium',
          color: 'branco',
          weight: 4.5,
          description: 'A Mia é uma gata Persa elegante e tranquila. Ideal para apartamentos.',
          status: 'available',
          ongId: approvedOngs[1]?.ong.id || approvedOngs[0].ong.id,
          images: ['https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800'],
        },
      ];

      for (const petData of testPets) {
        const { images, ...petWithoutImages } = petData;
        const pet = petRepository.create(petWithoutImages);
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

        console.log(`   ✅ Created pet: ${petData.name} for ${approvedOngs[0].ong.ongName}`);
      }
    }
    console.log('');

    // Summary
    console.log('========================================');
    console.log('✅ Seed completed successfully!');
    console.log('========================================');
    console.log('');
    console.log('📝 Test Accounts Created:');
    console.log('');
    console.log('👑 ADMIN ACCOUNTS:');
    adminUsers.forEach((admin) => {
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   Role: Admin`);
      console.log('');
    });

    console.log('🏠 ONG ACCOUNTS (Approved):');
    ongAccounts
      .filter((o) => o.ong.approvalStatus === 'approved')
      .forEach((ong) => {
        console.log(`   ONG: ${ong.ong.ongName}`);
        console.log(`   Email: ${ong.user.email}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   Status: ${ong.ong.approvalStatus}`);
        console.log(`   Verified: ${ong.ong.verified ? 'Yes' : 'No'}`);
        console.log('');
      });

    console.log('🏠 ONG ACCOUNTS (Pending Approval):');
    ongAccounts
      .filter((o) => o.ong.approvalStatus === 'pending')
      .forEach((ong) => {
        console.log(`   ONG: ${ong.ong.ongName}`);
        console.log(`   Email: ${ong.user.email}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   Status: ${ong.ong.approvalStatus} ⏳`);
        console.log('');
      });

    console.log('👥 ONG TEAM MEMBERS:');
    ongTeamMembers.forEach((member) => {
      console.log(`   Name: ${member.firstName} ${member.lastName}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   ONG: ${member.ongEmail}`);
      console.log(`   Role: ${member.role}`);
      console.log('');
    });

    console.log('👤 REGULAR USER ACCOUNTS:');
    regularUsers.forEach((user) => {
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   Role: User`);
      console.log('');
    });

    console.log('========================================');
    console.log('🧪 How to Test:');
    console.log('========================================');
    console.log('1. Login as admin@petsos.com to approve pending ONGs');
    console.log('2. Login as cantinho@animais.pt to manage pets and team');
    console.log('3. Login as novosanimais@ong.pt (will see pending approval message)');
    console.log('4. Login as rafael.oliveira@example.com to browse pets');
    console.log('');
    console.log('All passwords: ' + testPassword);
    console.log('========================================');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
