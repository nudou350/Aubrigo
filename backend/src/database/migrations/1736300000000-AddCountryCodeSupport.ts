import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
export class AddCountryCodeSupport1736300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add country_code column to users table
    const usersTable = await queryRunner.getTable("users");
    const usersColumn = usersTable?.findColumnByName("country_code");
    if (!usersColumn) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "country_code",
          type: "varchar",
          length: "2",
          default: "'PT'",
          isNullable: false,
          comment: "ISO 3166-1 alpha-2 country code",
        }),
      );
      // Set existing users to 'PT' (Portugal) for backwards compatibility
      await queryRunner.query(`
        UPDATE users
        SET country_code = 'PT'
        WHERE country_code IS NULL OR country_code = ''
      `);
    }
    // Add country_code column to ongs table
    const ongsTable = await queryRunner.getTable("ongs");
    const ongsColumn = ongsTable?.findColumnByName("country_code");
    if (!ongsColumn) {
      await queryRunner.addColumn(
        "ongs",
        new TableColumn({
          name: "country_code",
          type: "varchar",
          length: "2",
          default: "'PT'",
          isNullable: false,
          comment: "ISO 3166-1 alpha-2 country code",
        }),
      );
      // Set existing ongs to 'PT' (Portugal) for backwards compatibility
      await queryRunner.query(`
        UPDATE ongs
        SET country_code = 'PT'
        WHERE country_code IS NULL OR country_code = ''
      `);
    }
    // Add country_code column to pets table
    const petsTable = await queryRunner.getTable("pets");
    const petsColumn = petsTable?.findColumnByName("country_code");
    if (!petsColumn) {
      await queryRunner.addColumn(
        "pets",
        new TableColumn({
          name: "country_code",
          type: "varchar",
          length: "2",
          default: "'PT'",
          isNullable: false,
          comment: "ISO 3166-1 alpha-2 country code",
        }),
      );
      // Set existing pets to 'PT' (Portugal) for backwards compatibility
      await queryRunner.query(`
        UPDATE pets
        SET country_code = 'PT'
        WHERE country_code IS NULL OR country_code = ''
      `);
    }
    // Create index on country_code for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_country_code ON users(country_code)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ongs_country_code ON ongs(country_code)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pets_country_code ON pets(country_code)
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_country_code`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ongs_country_code`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pets_country_code`);
    // Drop columns
    await queryRunner.dropColumn("users", "country_code");
    await queryRunner.dropColumn("ongs", "country_code");
    await queryRunner.dropColumn("pets", "country_code");
  }
}
