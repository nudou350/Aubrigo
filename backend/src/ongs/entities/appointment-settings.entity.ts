import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
@Entity("appointment_settings")
export class AppointmentSettings {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "ong_id", unique: true })
  ongId: string;
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ong_id" })
  ong: User;
  @Column({ name: "visit_duration_minutes", default: 60 })
  visitDurationMinutes: number;
  @Column({ name: "max_concurrent_visits", default: 1 })
  maxConcurrentVisits: number;
  @Column({ name: "min_advance_booking_hours", default: 24 })
  minAdvanceBookingHours: number;
  @Column({ name: "max_advance_booking_days", default: 30 })
  maxAdvanceBookingDays: number;
  @Column({ name: "slot_interval_minutes", default: 30 })
  slotIntervalMinutes: number;
  @Column({ name: "allow_weekend_bookings", default: true })
  allowWeekendBookings: boolean;
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
