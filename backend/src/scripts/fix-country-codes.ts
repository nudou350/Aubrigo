import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

/**
 * Script to update all pets and users to Portugal (PT) country code
 * Run with: npm run ts-node src/scripts/fix-country-codes.ts
 */
async function fixCountryCodes() {
  console.log('🚀 Starting country code fix script...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Update all pets to PT
    console.log('📦 Updating pets table...');
    const petsResult = await dataSource.query(
      `UPDATE pets SET country_code = 'PT' WHERE country_code != 'PT' OR country_code IS NULL`
    );
    console.log(`✅ Updated ${petsResult[1]} pets to country code PT\n`);

    // Update all users/ONGs to PT
    console.log('👥 Updating users table...');
    const usersResult = await dataSource.query(
      `UPDATE users SET country_code = 'PT' WHERE country_code != 'PT' OR country_code IS NULL`
    );
    console.log(`✅ Updated ${usersResult[1]} users to country code PT\n`);

    // Show summary
    console.log('📊 Summary:');
    console.log('=====================================');

    const petsCount = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM pets GROUP BY country_code`
    );
    console.log('Pets by country:');
    petsCount.forEach((row: any) => {
      console.log(`  ${row.country_code}: ${row.count} pets`);
    });

    const usersCount = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM users WHERE role = 'ong' GROUP BY country_code`
    );
    console.log('\nONGs by country:');
    usersCount.forEach((row: any) => {
      console.log(`  ${row.country_code}: ${row.count} ONGs`);
    });

    console.log('=====================================');
    console.log('\n✅ Country code fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing country codes:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
fixCountryCodes()
  .then(() => {
    console.log('\n👋 Script finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
