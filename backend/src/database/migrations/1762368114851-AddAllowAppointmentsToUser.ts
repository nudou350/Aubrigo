import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
export class AddAllowAppointmentsToUser1762368114851 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable('users');
        if (usersTable && !usersTable.findColumnByName('allow_appointments')) {
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'allow_appointments',
                    type: 'boolean',
                    isNullable: false,
                    default: true,
                }),
            );
        }
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable('users');
        if (usersTable && usersTable.findColumnByName('allow_appointments')) {
            await queryRunner.dropColumn('users', 'allow_appointments');
        }
    }
}
