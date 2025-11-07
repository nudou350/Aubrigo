import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PetImage } from './pet-image.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ong_id' })
  ongId: string;

  @ManyToOne(() => User, (user) => user.pets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ong_id' })
  ong: User;

  @Column()
  name: string;

  @Column()
  species: string; // dog, cat, fish, hamster

  @Column({ nullable: true })
  breed: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string; // male, female

  @Column({ nullable: true })
  size: string; // small, medium, large

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 'available' })
  status: string; // available, pending, adopted

  @Column({ name: 'country_code', length: 2, default: 'PT' })
  countryCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PetImage, (image) => image.pet, { cascade: true })
  images: PetImage[];

  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments: Appointment[];

  @OneToMany(() => Favorite, (favorite) => favorite.pet)
  favorites: Favorite[];
}
