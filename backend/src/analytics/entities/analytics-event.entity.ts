import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: string;

  @Column({ name: 'event_category', type: 'varchar', length: 50 })
  eventCategory: string;

  @Column({ name: 'pet_id', type: 'uuid', nullable: true })
  petId: string | null;

  @ManyToOne(() => Pet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet | null;

  @Column({ name: 'ong_id', type: 'uuid', nullable: true })
  ongId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ong_id' })
  ong: User | null;

  @Column({ name: 'user_session_id', type: 'varchar', length: 100 })
  userSessionId: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail: string | null;

  @Column({ name: 'user_ip', type: 'varchar', length: 45, nullable: true })
  userIp: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'is_offline_event', type: 'boolean', default: false })
  isOfflineEvent: boolean;

  @Column({ name: 'client_timestamp', type: 'timestamp', nullable: true })
  clientTimestamp: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
