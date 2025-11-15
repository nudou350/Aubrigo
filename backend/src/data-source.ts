import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/database/migrations/*{.ts,.js}"],
  synchronize: false,
  logging:
    process.env.NODE_ENV === "development"
      ? ["error", "warn", "schema"]
      : ["error"],
  logger: "advanced-console",
  maxQueryExecutionTime: 1000, // Log slow queries > 1s
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  // Connection pool settings for better performance
  extra: {
    max: 20, // Maximum connections in pool (default: 10)
    min: 2, // Minimum connections to maintain (default: 0)
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout for acquiring connection
    statement_timeout: 10000, // Max query execution time (10s)
  },
});
