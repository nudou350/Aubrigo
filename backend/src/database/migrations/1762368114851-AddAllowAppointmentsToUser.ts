import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllowAppointmentsToUser1762368114851 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN allow_appointments BOOLEAN NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN allow_appointments
        `);
    }

}
