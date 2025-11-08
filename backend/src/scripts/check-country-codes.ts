import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

/**
 * Script to check current country codes in the database
 */
async function checkCountryCodes() {
  console.log('🔍 Checking country codes in database...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Check pets
    console.log('📦 PETS TABLE:');
    console.log('=====================================');
    const petsAll = await dataSource.query(
      `SELECT id, name, species, country_code FROM pets LIMIT 20`
    );
    console.table(petsAll);

    const petsByCountry = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM pets GROUP BY country_code`
    );
    console.log('\nPets by country:');
    console.table(petsByCountry);

    // Check users/ONGs
    console.log('\n👥 USERS TABLE (ONGs):');
    console.log('=====================================');
    const ongsAll = await dataSource.query(
      `SELECT id, ong_name, country_code FROM users WHERE role = 'ong' LIMIT 20`
    );
    console.table(ongsAll);

    const ongsByCountry = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM users WHERE role = 'ong' GROUP BY country_code`
    );
    console.log('\nONGs by country:');
    console.table(ongsByCountry);

    // Check for NULL values
    console.log('\n⚠️  NULL CHECKS:');
    console.log('=====================================');
    const petsNull = await dataSource.query(
      `SELECT COUNT(*) as count FROM pets WHERE country_code IS NULL`
    );
    console.log(`Pets with NULL country_code: ${petsNull[0].count}`);

    const usersNull = await dataSource.query(
      `SELECT COUNT(*) as count FROM users WHERE country_code IS NULL AND role = 'ong'`
    );
    console.log(`ONGs with NULL country_code: ${usersNull[0].count}`);

  } catch (error) {
    console.error('❌ Error checking country codes:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
checkCountryCodes()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
