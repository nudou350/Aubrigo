import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPixKeyToUser1736400000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable('users');

        if (usersTable && !usersTable.findColumnByName('pix_key')) {
            await queryRunner.addColumn(
                'users',
                new TableColumn({
                    name: 'pix_key',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable('users');

        if (usersTable && usersTable.findColumnByName('pix_key')) {
            await queryRunner.dropColumn('users', 'pix_key');
        }
    }

}
