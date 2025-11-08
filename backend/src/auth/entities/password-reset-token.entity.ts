import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  token: string;
  @Column({ name: 'user_id' })
  userId: string;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ name: 'expires_at' })
  expiresAt: Date;
  @Column({ default: false })
  used: boolean;
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
