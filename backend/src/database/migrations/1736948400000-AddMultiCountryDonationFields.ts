import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultiCountryDonationFields1736948400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for multi-country support (nullable first)
    await queryRunner.query(`
      ALTER TABLE "donations"
      ADD COLUMN IF NOT EXISTS "country" VARCHAR(2),
      ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3),
      ADD COLUMN IF NOT EXISTS "gateway_provider" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "payment_intent_id" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "pix_qr_code" TEXT,
      ADD COLUMN IF NOT EXISTS "pix_payment_string" TEXT,
      ADD COLUMN IF NOT EXISTS "boleto_url" TEXT,
      ADD COLUMN IF NOT EXISTS "boleto_barcode" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "multibanco_entity" VARCHAR(10),
      ADD COLUMN IF NOT EXISTS "multibanco_reference" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "iof_amount" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP
    `);

    // Set default values for existing records (Portugal, EUR)
    await queryRunner.query(`
      UPDATE "donations"
      SET "country" = 'PT',
          "currency" = 'EUR'
      WHERE "country" IS NULL OR "currency" IS NULL
    `);

    // Make country and currency NOT NULL after setting defaults
    await queryRunner.query(`
      ALTER TABLE "donations"
      ALTER COLUMN "country" SET NOT NULL,
      ALTER COLUMN "currency" SET NOT NULL
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_donations_country" ON "donations"("country")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_donations_gateway_provider" ON "donations"("gateway_provider")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_donations_payment_intent_id" ON "donations"("payment_intent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_donations_payment_intent_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_donations_gateway_provider"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_donations_country"`);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "donations"
      DROP COLUMN IF EXISTS "country",
      DROP COLUMN IF EXISTS "currency",
      DROP COLUMN IF EXISTS "gateway_provider",
      DROP COLUMN IF EXISTS "payment_intent_id",
      DROP COLUMN IF EXISTS "phone_number",
      DROP COLUMN IF EXISTS "pix_qr_code",
      DROP COLUMN IF EXISTS "pix_payment_string",
      DROP COLUMN IF EXISTS "boleto_url",
      DROP COLUMN IF EXISTS "boleto_barcode",
      DROP COLUMN IF EXISTS "multibanco_entity",
      DROP COLUMN IF EXISTS "multibanco_reference",
      DROP COLUMN IF EXISTS "iof_amount",
      DROP COLUMN IF EXISTS "expires_at"
    `);
  }
}
