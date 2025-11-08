import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
/**
 * Script to update all pets and users to Portugal (PT) country code
 * Run with: npm run ts-node src/scripts/fix-country-codes.ts
 */
async function fixCountryCodes() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  try {
    // Update all pets to PT
    const petsResult = await dataSource.query(
      `UPDATE pets SET country_code = 'PT' WHERE country_code != 'PT' OR country_code IS NULL`
    );
    // Update all users/ONGs to PT
    const usersResult = await dataSource.query(
      `UPDATE users SET country_code = 'PT' WHERE country_code != 'PT' OR country_code IS NULL`
    );
    // Show summary
    const petsCount = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM pets GROUP BY country_code`
    );
    petsCount.forEach((row: any) => {
    });
    const usersCount = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM users WHERE role = 'ong' GROUP BY country_code`
    );
    usersCount.forEach((row: any) => {
    });
  } catch (error) {
    throw error;
  } finally {
    await app.close();
  }
}
// Run the script
fixCountryCodes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
