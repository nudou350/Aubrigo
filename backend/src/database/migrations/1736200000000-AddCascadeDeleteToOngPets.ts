import { MigrationInterface, QueryRunner } from "typeorm";
export class AddCascadeDeleteToOngPets1736200000000
  implements MigrationInterface
{
  name = "AddCascadeDeleteToOngPets1736200000000";
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "pets"
      DROP CONSTRAINT IF EXISTS "FK_pets_ong_id";
    `);
    // Add foreign key constraint with CASCADE on delete
    await queryRunner.query(`
      ALTER TABLE "pets"
      ADD CONSTRAINT "FK_pets_ong_id"
      FOREIGN KEY ("ong_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE;
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop CASCADE constraint
    await queryRunner.query(`
      ALTER TABLE "pets"
      DROP CONSTRAINT IF EXISTS "FK_pets_ong_id";
    `);
    // Re-add foreign key constraint without CASCADE
    await queryRunner.query(`
      ALTER TABLE "pets"
      ADD CONSTRAINT "FK_pets_ong_id"
      FOREIGN KEY ("ong_id")
      REFERENCES "users"("id");
    `);
  }
}
