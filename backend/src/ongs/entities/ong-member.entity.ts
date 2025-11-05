import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ong } from './ong.entity';
import { User } from '../../users/entities/user.entity';

export enum OngMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum OngPermission {
  MANAGE_PETS = 'manage_pets',
  VIEW_PETS = 'view_pets',
  MANAGE_APPOINTMENTS = 'manage_appointments',
  VIEW_APPOINTMENTS = 'view_appointments',
  MANAGE_DONATIONS = 'manage_donations',
  VIEW_DONATIONS = 'view_donations',
  MANAGE_MEMBERS = 'manage_members',
  VIEW_MEMBERS = 'view_members',
  MANAGE_ONG_PROFILE = 'manage_ong_profile',
}

@Entity('ong_members')
export class OngMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ong_id' })
  ongId: string;

  @ManyToOne(() => Ong, (ong) => ong.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ong_id' })
  ong: Ong;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.ongMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: OngMemberRole,
    default: OngMemberRole.MEMBER,
  })
  role: OngMemberRole;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  permissions: string[];

  @Column({ name: 'invited_by', nullable: true })
  invitedBy: string; // User ID who invited this member

  @Column({ name: 'invitation_status', default: 'pending' })
  invitationStatus: string; // pending, accepted, rejected

  @Column({ name: 'invitation_token', nullable: true })
  invitationToken: string;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
