import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Pet } from "./pet.entity";
@Entity("pet_images")
export class PetImage {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "pet_id" })
  petId: string;
  @ManyToOne(() => Pet, (pet) => pet.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pet_id" })
  pet: Pet;
  @Column({ name: "image_url" })
  imageUrl: string;
  @Column({ name: "is_primary", default: false })
  isPrimary: boolean;
  @Column({ name: "display_order", default: 0 })
  displayOrder: number;
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
