import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Pet } from "../../pets/entities/pet.entity";
import { User } from "../../users/entities/user.entity";
@Entity("appointments")
export class Appointment {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "pet_id" })
  petId: string;
  @ManyToOne(() => Pet, (pet) => pet.appointments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pet_id" })
  pet: Pet;
  @Column({ name: "ong_id" })
  ongId: string;
  @ManyToOne(() => User, (user) => user.appointments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ong_id" })
  ong: User;
  @Column({ name: "visitor_name" })
  visitorName: string;
  @Column({ name: "visitor_email" })
  visitorEmail: string;
  @Column({ name: "visitor_phone", nullable: true })
  visitorPhone: string;
  @Column({ name: "preferred_date", type: "date", nullable: true })
  preferredDate: Date;
  @Column({ name: "preferred_time", type: "time", nullable: true })
  preferredTime: string;
  @Column({ name: "scheduled_start_time", type: "timestamp", nullable: true })
  scheduledStartTime: Date;
  @Column({ name: "scheduled_end_time", type: "timestamp", nullable: true })
  scheduledEndTime: Date;
  @Column({ default: "Europe/Lisbon" })
  timezone: string;
  @Column({ default: "pending" })
  status: string; // pending, confirmed, completed, cancelled
  @Column({ type: "text", nullable: true })
  notes: string;
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
