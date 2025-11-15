import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { DataSource } from "typeorm";
/**
 * Script to check current country codes in the database
 */
async function checkCountryCodes() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  try {
    // Check pets
    const petsAll = await dataSource.query(
      `SELECT id, name, species, country_code FROM pets LIMIT 20`,
    );
    console.table(petsAll);
    const petsByCountry = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM pets GROUP BY country_code`,
    );
    console.table(petsByCountry);
    // Check users/ONGs
    const ongsAll = await dataSource.query(
      `SELECT id, ong_name, country_code FROM users WHERE role = 'ong' LIMIT 20`,
    );
    console.table(ongsAll);
    const ongsByCountry = await dataSource.query(
      `SELECT country_code, COUNT(*) as count FROM users WHERE role = 'ong' GROUP BY country_code`,
    );
    console.table(ongsByCountry);
    // Check for NULL values
    const petsNull = await dataSource.query(
      `SELECT COUNT(*) as count FROM pets WHERE country_code IS NULL`,
    );
    const usersNull = await dataSource.query(
      `SELECT COUNT(*) as count FROM users WHERE country_code IS NULL AND role = 'ong'`,
    );
  } catch (error) {
    throw error;
  } finally {
    await app.close();
  }
}
// Run the script
checkCountryCodes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
