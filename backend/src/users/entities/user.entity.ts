import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Pet } from '../../pets/entities/pet.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

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
