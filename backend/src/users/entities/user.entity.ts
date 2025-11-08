import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
// import { OngMember } from '../../ongs/entities/ong-member.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { Article } from '../../articles/entities/article.entity';
export enum UserRole {
  ADMIN = 'admin',
  ONG = 'ong',
  USER = 'user',
}
export enum OngStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  email: string;
  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
  @Column({ name: 'first_name', nullable: true })
  firstName: string;
  @Column({ name: 'last_name', nullable: true })
  lastName: string;
  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl: string;
  @Column({ nullable: true })
  phone: string;
  @Column({ name: 'has_whatsapp', default: false })
  hasWhatsapp: boolean;
  @Column({ name: 'pix_key', nullable: true })
  pixKey: string;
  @Column({ nullable: true })
  location: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;
  // Legacy ONG fields (deprecated, kept for migration)
  @Column({ name: 'ong_name', nullable: true })
  ongName: string;
  @Column({ name: 'instagram_handle', nullable: true })
  instagramHandle: string;
  @Column({
    type: 'enum',
    enum: OngStatus,
    default: OngStatus.APPROVED,
    name: 'ong_status',
  })
  ongStatus: OngStatus;
  @Column({ name: 'allow_appointments', default: true })
  allowAppointments: boolean;
  @Column({ name: 'country_code', length: 2, default: 'PT' })
  countryCode: string;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  // @OneToMany(() => OngMember, (member) => member.user)
  // ongMemberships: OngMember[];
  @OneToMany(() => Appointment, (appointment) => appointment.ong)
  appointments: Appointment[];
  @OneToMany(() => Pet, (pet) => pet.ong)
  pets: Pet[];
  @OneToMany(() => Donation, (donation) => donation.ong)
  donations: Donation[];
  @OneToMany(() => Article, (article) => article.ong)
  articles: Article[];
}
