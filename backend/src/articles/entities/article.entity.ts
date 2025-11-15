import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
export enum ArticleCategory {
  FOOD = "food",
  MEDICINE = "medicine",
  DEBT = "debt",
  SUPPLIES = "supplies",
  OTHER = "other",
}
export enum ArticlePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}
export enum ArticleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "ong_id" })
  ongId: string;
  @ManyToOne(() => User, (user) => user.articles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ong_id" })
  ong: User;
  @Column()
  title: string;
  @Column({ type: "text" })
  description: string;
  @Column({
    type: "enum",
    enum: ArticleCategory,
    default: ArticleCategory.OTHER,
  })
  category: ArticleCategory;
  @Column({
    type: "enum",
    enum: ArticlePriority,
    default: ArticlePriority.MEDIUM,
  })
  priority: ArticlePriority;
  @Column({
    type: "enum",
    enum: ArticleStatus,
    default: ArticleStatus.ACTIVE,
  })
  status: ArticleStatus;
  @Column({
    name: "target_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  targetAmount: number;
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
