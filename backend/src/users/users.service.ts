import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    delete user.passwordHash;
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateUserProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateProfileDto);
    const updated = await this.userRepository.save(user);
    delete updated.passwordHash;
    return updated;
  }

  async updateProfileImage(userId: string, imageUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.profileImageUrl = imageUrl;
    const updated = await this.userRepository.save(user);
    delete updated.passwordHash;
    return updated;
  }

  async changePassword(userId: string, changePasswordDto: ChangeUserPasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async findAll(filters?: {
    search?: string;
    location?: string;
  }): Promise<any[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.ongName',
        'user.profileImageUrl',
        'user.location',
        'user.phone',
        'user.instagramHandle',
      ])
      // Only return ONGs with role='ong' and status='approved'
      .where('user.role = :role', { role: 'ong' })
      .andWhere('user.ongStatus = :status', { status: 'approved' });

    // Filter by search (ONG name)
    if (filters?.search) {
      queryBuilder.andWhere('LOWER(user.ongName) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
    }

    // Filter by location
    if (filters?.location) {
      queryBuilder.andWhere('LOWER(user.location) LIKE LOWER(:location)', {
        location: `%${filters.location}%`,
      });
    }

    const users = await queryBuilder.getMany();

    // Map results to include urgency info from articles
    const result = await Promise.all(
      users.map(async (user) => {
        // Get most urgent active article for this ONG
        const mostUrgentArticle = await this.userRepository.manager
          .createQueryBuilder()
          .select('article')
          .from('articles', 'article')
          .where('article.ong_id = :ongId', { ongId: user.id })
          .andWhere('article.status = :status', { status: 'active' })
          .orderBy(
            `CASE
              WHEN article.priority = 'urgent' THEN 1
              WHEN article.priority = 'high' THEN 2
              WHEN article.priority = 'medium' THEN 3
              WHEN article.priority = 'low' THEN 4
              ELSE 5
            END`,
            'ASC',
          )
          .limit(1)
          .getRawOne();

        return {
          id: user.id,
          ongName: user.ongName,
          profileImageUrl: user.profileImageUrl,
          location: user.location,
          phone: user.phone,
          instagramHandle: user.instagramHandle,
          urgencyLevel: mostUrgentArticle?.article_priority || 'none',
          urgencyCategory: mostUrgentArticle?.article_category || null,
          urgencyDescription: mostUrgentArticle?.article_title || null,
        };
      }),
    );

    // Sort by urgency level (urgent first)
    result.sort((a, b) => {
      const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4, none: 5 };
      const aPriority = priorityOrder[a.urgencyLevel] || 5;
      const bPriority = priorityOrder[b.urgencyLevel] || 5;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Secondary sort by name
      return a.ongName.localeCompare(b.ongName);
    });

    return result;
  }

  async findOngById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id, role: 'ong' as any, ongStatus: 'approved' as any },
    });

    if (!user) {
      throw new NotFoundException('ONG not found');
    }

    // Get all active articles for this ONG
    const articles = await this.userRepository.manager
      .createQueryBuilder()
      .select('article')
      .from('articles', 'article')
      .where('article.ong_id = :ongId', { ongId: user.id })
      .andWhere('article.status = :status', { status: 'active' })
      .orderBy(
        `CASE
          WHEN article.priority = 'urgent' THEN 1
          WHEN article.priority = 'high' THEN 2
          WHEN article.priority = 'medium' THEN 3
          WHEN article.priority = 'low' THEN 4
          ELSE 5
        END`,
        'ASC',
      )
      .getRawMany();

    // Get pet count
    const petCount = await this.userRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('pets', 'pet')
      .where('pet.ong_id = :ongId', { ongId: user.id })
      .andWhere('pet.status = :status', { status: 'available' })
      .getRawOne();

    delete user.passwordHash;

    return {
      id: user.id,
      ongName: user.ongName,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude,
      phone: user.phone,
      instagramHandle: user.instagramHandle,
      allowAppointments: user.allowAppointments,
      createdAt: user.createdAt,
      petCount: parseInt(petCount?.count || '0'),
      needs: articles.map((article) => ({
        id: article.article_id,
        title: article.article_title,
        description: article.article_description,
        category: article.article_category,
        priority: article.article_priority,
        targetAmount: article.article_target_amount,
        createdAt: article.article_created_at,
      })),
    };
  }
}
