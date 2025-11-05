import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addAllowAppointmentsColumn() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    await dataSource.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS allow_appointments BOOLEAN NOT NULL DEFAULT true
    `);

    console.log('Successfully added allow_appointments column');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

addAllowAppointmentsColumn();
