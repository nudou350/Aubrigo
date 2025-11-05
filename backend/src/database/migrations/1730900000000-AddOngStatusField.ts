import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOngStatusField1730900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for ong_status
    await queryRunner.query(`
      CREATE TYPE "ong_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);

    // Add ong_status column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'ong_status',
        type: 'enum',
        enum: ['pending', 'approved', 'rejected'],
        default: "'approved'",
        isNullable: false,
      }),
    );

    // Update existing ONG users to have approved status by default
    await queryRunner.query(`
      UPDATE users
      SET ong_status = 'approved'
      WHERE role = 'ong'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the column
    await queryRunner.dropColumn('users', 'ong_status');

    // Drop the enum type
    await queryRunner.query(`DROP TYPE "ong_status_enum"`);
  }
}
