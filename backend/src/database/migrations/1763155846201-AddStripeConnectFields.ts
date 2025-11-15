import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStripeConnectFields1763155846201 implements MigrationInterface {
  name = "AddStripeConnectFields1763155846201";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "stripe_account_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "stripe_account_connected" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "stripe_charges_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "stripe_payouts_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "tax_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "bank_account_iban" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "bank_routing_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" ADD "bank_account_number" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "bank_account_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "bank_routing_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "bank_account_iban"`,
    );
    await queryRunner.query(`ALTER TABLE "ongs" DROP COLUMN "tax_id"`);
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "stripe_payouts_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "stripe_charges_enabled"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "stripe_account_connected"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ongs" DROP COLUMN "stripe_account_id"`,
    );
  }
}
