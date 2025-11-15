import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
@Entity("ong_operating_hours")
@Unique(["ongId", "dayOfWeek"])
export class OngOperatingHours {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "ong_id" })
  ongId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ong_id" })
  ong: User;
  @Column({ name: "day_of_week", type: "integer" })
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  @Column({ name: "is_open", default: true })
  isOpen: boolean;
  @Column({ name: "open_time", type: "time" })
  openTime: string; // Ex: "09:00"
  @Column({ name: "close_time", type: "time" })
  closeTime: string; // Ex: "17:00"
  @Column({ name: "lunch_break_start", type: "time", nullable: true })
  lunchBreakStart: string | null; // Ex: "12:00"
  @Column({ name: "lunch_break_end", type: "time", nullable: true })
  lunchBreakEnd: string | null; // Ex: "13:00"
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
