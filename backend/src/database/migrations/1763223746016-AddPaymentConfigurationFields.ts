import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration to add payment configuration fields to users table
 * Adds fields for:
 * - bankName (Brazil bank transfers)
 * - bankAccountIban (Portugal Multibanco)
 * - bankRoutingNumber (Brazil)
 * - bankAccountNumber (Brazil)
 * - pixKeyType (Brazil PIX)
 * - paymentMethodsConfigured (flag to indicate ONG has configured at least one payment method)
 */
export class AddPaymentConfigurationFields1763223746016
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add bank_name for Brazil bank transfers
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "bank_name" VARCHAR(100)
        `);

    // Add bank_account_iban for Portugal Multibanco transfers
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "bank_account_iban" VARCHAR(34)
        `);

    // Add bank_routing_number for Brazil bank transfers
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "bank_routing_number" VARCHAR(10)
        `);

    // Add bank_account_number for Brazil bank transfers
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "bank_account_number" VARCHAR(20)
        `);

    // Add pix_key_type for Brazil PIX
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "pix_key_type" VARCHAR(20)
        `);

    // Add payment_methods_configured flag
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "payment_methods_configured" BOOLEAN DEFAULT FALSE
        `);

    // Add comments for documentation
    await queryRunner.query(`
            COMMENT ON COLUMN "users"."bank_name" IS 'Bank name for Brazil bank transfers'
        `);

    await queryRunner.query(`
            COMMENT ON COLUMN "users"."bank_account_iban" IS 'IBAN for Portugal Multibanco transfers (format: PT + 23 digits)'
        `);

    await queryRunner.query(`
            COMMENT ON COLUMN "users"."bank_routing_number" IS 'Bank routing number/branch code for Brazil (3-4 digits)'
        `);

    await queryRunner.query(`
            COMMENT ON COLUMN "users"."bank_account_number" IS 'Bank account number for Brazil'
        `);

    await queryRunner.query(`
            COMMENT ON COLUMN "users"."pix_key_type" IS 'PIX key type: CPF, CNPJ, Email, Phone, or Random'
        `);

    await queryRunner.query(`
            COMMENT ON COLUMN "users"."payment_methods_configured" IS 'Indicates if ONG has configured at least one payment method'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove payment configuration columns in reverse order
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "payment_methods_configured"
        `);

    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "pix_key_type"
        `);

    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "bank_account_number"
        `);

    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "bank_routing_number"
        `);

    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "bank_account_iban"
        `);

    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "bank_name"
        `);
  }
}
