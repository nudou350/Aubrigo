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
    await dataSource.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS allow_appointments BOOLEAN NOT NULL DEFAULT true
    `);
  } catch (error) {
  } finally {
    await dataSource.destroy();
  }
}
addAllowAppointmentsColumn();
