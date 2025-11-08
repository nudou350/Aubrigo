import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
@Entity('ongs')
export class Ong {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  email: string;
  @Column({ name: 'ong_name' })
  ongName: string;
  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl: string;
  @Column({ nullable: true })
  phone: string;
  @Column({ name: 'instagram_handle', nullable: true })
  instagramHandle: string;
  @Column({ nullable: true })
  location: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;
  @Column({ type: 'text', nullable: true })
  description: string;
  @Column({ name: 'registration_number', nullable: true })
  registrationNumber: string; // Tax ID or official registration number
  @Column({ name: 'website', nullable: true })
  website: string;
  @Column({ name: 'approval_status', default: 'pending' })
  approvalStatus: string; // pending, approved, rejected
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;
  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string; // Admin user ID who approved
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;
  @Column({ name: 'country_code', length: 2, default: 'PT' })
  countryCode: string;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @OneToMany(() => Pet, (pet) => pet.ong)
  pets: Pet[];
  @OneToMany(() => Donation, (donation) => donation.ong)
  donations: Donation[];
  @OneToMany(() => Appointment, (appointment) => appointment.ong)
  appointments: Appointment[];
}
