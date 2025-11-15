import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Pet } from "../../pets/entities/pet.entity";
@Entity("favorites")
@Unique(["visitorEmail", "petId"])
export class Favorite {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "visitor_email" })
  visitorEmail: string; // Anonymous user tracking by email
  @Column({ name: "pet_id" })
  petId: string;
  @ManyToOne(() => Pet, (pet) => pet.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pet_id" })
  pet: Pet;
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
