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
@Entity("donations")
export class Donation {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ name: "ong_id" })
  ongId: string;
  @ManyToOne(() => User, (user) => user.donations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ong_id" })
  ong: User;
  @Column({ name: "donor_name" })
  donorName: string;
  @Column({ name: "donor_email" })
  donorEmail: string;
  @Column({ name: "donor_cpf", nullable: true })
  donorCpf: string;
  @Column({ name: "donor_birth_date", type: "date", nullable: true })
  donorBirthDate: Date;
  @Column({ name: "donor_gender", nullable: true })
  donorGender: string;
  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;
  @Column({ name: "donation_type" })
  donationType: string; // one_time, monthly
  @Column({ name: "payment_method", nullable: true })
  paymentMethod: string;
  @Column({ name: "payment_status", default: "pending" })
  paymentStatus: string; // pending, completed, failed

  @Column({ name: "country", length: 2 })
  country: string; // PT or BR

  @Column({ name: "currency", length: 3 })
  currency: string; // EUR or BRL

  @Column({ name: "gateway_provider", nullable: true })
  gatewayProvider: string; // stripe, ebanx, pagseguro

  @Column({ name: "payment_intent_id", nullable: true })
  paymentIntentId: string; // Generic payment ID across all gateways

  @Column({ name: "stripe_payment_id", nullable: true })
  stripePaymentId: string; // Kept for backward compatibility

  @Column({ name: "phone_number", nullable: true })
  phoneNumber: string; // For MBWay

  @Column({ name: "pix_qr_code", type: "text", nullable: true })
  pixQrCode: string;

  @Column({ name: "pix_payment_string", type: "text", nullable: true })
  pixPaymentString: string;

  @Column({ name: "boleto_url", type: "text", nullable: true })
  boletoUrl: string;

  @Column({ name: "boleto_barcode", nullable: true })
  boletoBarcode: string;

  @Column({ name: "multibanco_entity", nullable: true })
  multibancoEntity: string;

  @Column({ name: "multibanco_reference", nullable: true })
  multibancoReference: string;

  @Column({
    name: "iof_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  iofAmount: number; // Brazilian IOF tax

  @Column({ name: "card_holder_name", nullable: true })
  cardHolderName: string;

  @Column({ name: "card_last4", nullable: true })
  cardLast4: string;

  @Column({ name: "expires_at", nullable: true })
  expiresAt: Date; // For time-limited payments (PIX, Boleto, Multibanco)

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
