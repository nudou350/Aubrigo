import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'ong_id' })
  ongId: string;
  @ManyToOne(() => User, (user) => user.donations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ong_id' })
  ong: User;
  @Column({ name: 'donor_name' })
  donorName: string;
  @Column({ name: 'donor_email' })
  donorEmail: string;
  @Column({ name: 'donor_cpf', nullable: true })
  donorCpf: string;
  @Column({ name: 'donor_birth_date', type: 'date', nullable: true })
  donorBirthDate: Date;
  @Column({ name: 'donor_gender', nullable: true })
  donorGender: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;
  @Column({ name: 'donation_type' })
  donationType: string; // one_time, monthly
  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;
  @Column({ name: 'payment_status', default: 'pending' })
  paymentStatus: string; // pending, completed, failed
  @Column({ name: 'stripe_payment_id', nullable: true })
  stripePaymentId: string;
  @Column({ name: 'card_holder_name', nullable: true })
  cardHolderName: string;
  @Column({ name: 'card_last4', nullable: true })
  cardLast4: string;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
