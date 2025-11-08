import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';
export class AddAppointmentSchedulingSystem1736100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create ong_operating_hours table
    const operatingHoursTableExists = await queryRunner.hasTable('ong_operating_hours');
    if (!operatingHoursTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'ong_operating_hours',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            {
              name: 'ong_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'day_of_week',
              type: 'integer',
              isNullable: false,
            },
            {
              name: 'is_open',
              type: 'boolean',
              default: true,
            },
            {
              name: 'open_time',
              type: 'time',
              isNullable: false,
            },
            {
              name: 'close_time',
              type: 'time',
              isNullable: false,
            },
            {
              name: 'lunch_break_start',
              type: 'time',
              isNullable: true,
            },
            {
              name: 'lunch_break_end',
              type: 'time',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'now()',
            },
          ],
          uniques: [
            {
              name: 'UQ_ong_day',
              columnNames: ['ong_id', 'day_of_week'],
            },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'ong_operating_hours',
        new TableForeignKey({
          columnNames: ['ong_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }
    // 2. Create appointment_settings table
    const appointmentSettingsTableExists = await queryRunner.hasTable('appointment_settings');
    if (!appointmentSettingsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'appointment_settings',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            {
              name: 'ong_id',
              type: 'uuid',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'visit_duration_minutes',
              type: 'integer',
              default: 60,
            },
            {
              name: 'max_concurrent_visits',
              type: 'integer',
              default: 1,
            },
            {
              name: 'min_advance_booking_hours',
              type: 'integer',
              default: 24,
            },
            {
              name: 'max_advance_booking_days',
              type: 'integer',
              default: 30,
            },
            {
              name: 'slot_interval_minutes',
              type: 'integer',
              default: 30,
            },
            {
              name: 'allow_weekend_bookings',
              type: 'boolean',
              default: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'now()',
            },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'appointment_settings',
        new TableForeignKey({
          columnNames: ['ong_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }
    // 3. Create ong_availability_exceptions table
    const exceptionsTableExists = await queryRunner.hasTable('ong_availability_exceptions');
    if (!exceptionsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'ong_availability_exceptions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            {
              name: 'ong_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'exception_type',
              type: 'varchar',
              length: '20',
              isNullable: false,
            },
            {
              name: 'start_date',
              type: 'date',
              isNullable: false,
            },
            {
              name: 'end_date',
              type: 'date',
              isNullable: false,
            },
            {
              name: 'start_time',
              type: 'time',
              isNullable: true,
            },
            {
              name: 'end_time',
              type: 'time',
              isNullable: true,
            },
            {
              name: 'reason',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
          ],
        }),
        true,
      );
      await queryRunner.createForeignKey(
        'ong_availability_exceptions',
        new TableForeignKey({
          columnNames: ['ong_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }
    // 4. Add new columns to appointments table
    const appointmentsTable = await queryRunner.getTable('appointments');
    if (appointmentsTable && !appointmentsTable.findColumnByName('scheduled_start_time')) {
      await queryRunner.addColumn(
        'appointments',
        new TableColumn({
          name: 'scheduled_start_time',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
    if (appointmentsTable && !appointmentsTable.findColumnByName('scheduled_end_time')) {
      await queryRunner.addColumn(
        'appointments',
        new TableColumn({
          name: 'scheduled_end_time',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
    if (appointmentsTable && !appointmentsTable.findColumnByName('timezone')) {
      await queryRunner.addColumn(
        'appointments',
        new TableColumn({
          name: 'timezone',
          type: 'varchar',
          length: '50',
          default: "'Europe/Lisbon'",
        }),
      );
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from appointments
    await queryRunner.dropColumn('appointments', 'timezone');
    await queryRunner.dropColumn('appointments', 'scheduled_end_time');
    await queryRunner.dropColumn('appointments', 'scheduled_start_time');
    // Drop tables in reverse order
    await queryRunner.dropTable('ong_availability_exceptions');
    await queryRunner.dropTable('appointment_settings');
    await queryRunner.dropTable('ong_operating_hours');
  }
}
