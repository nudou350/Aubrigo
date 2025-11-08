import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
@Entity('ong_availability_exceptions')
export class OngAvailabilityException {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'ong_id' })
  ongId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ong_id' })
  ong: User;
  @Column({ name: 'exception_type' })
  exceptionType: 'blocked' | 'available';
  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;
  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;
  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;
  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;
  @Column({ nullable: true })
  reason: string | null;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
