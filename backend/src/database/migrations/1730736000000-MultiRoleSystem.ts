import { MigrationInterface, QueryRunner } from "typeorm";
export class MultiRoleSystem1730736000000 implements MigrationInterface {
  name = "MultiRoleSystem1730736000000";
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create role enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role_enum AS ENUM ('admin', 'ong', 'user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    // Create ONG member role enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE ong_member_role_enum AS ENUM ('owner', 'admin', 'member');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    // Create ONGs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ongs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) UNIQUE NOT NULL,
        "ong_name" varchar(255) NOT NULL,
        "profile_image_url" text,
        "phone" varchar(20),
        "instagram_handle" varchar(100),
        "location" varchar(255),
        "latitude" decimal(10, 7),
        "longitude" decimal(10, 7),
        "description" text,
        "registration_number" varchar(100),
        "website" varchar(255),
        "approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
        "approved_at" timestamp,
        "approved_by" uuid,
        "rejection_reason" text,
        "created_at" timestamp DEFAULT NOW() NOT NULL,
        "updated_at" timestamp DEFAULT NOW() NOT NULL
      );
    `);
    // Create ONG Members table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ong_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ong_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" ong_member_role_enum DEFAULT 'member' NOT NULL,
        "permissions" text,
        "invited_by" uuid,
        "invitation_status" varchar(20) DEFAULT 'pending' NOT NULL,
        "invitation_token" varchar(255),
        "accepted_at" timestamp,
        "created_at" timestamp DEFAULT NOW() NOT NULL,
        "updated_at" timestamp DEFAULT NOW() NOT NULL,
        CONSTRAINT "FK_ong_members_ong" FOREIGN KEY ("ong_id") REFERENCES "ongs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ong_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    // Add role column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" user_role_enum DEFAULT 'user' NOT NULL;
    `);
    // Add first_name and last_name columns to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "first_name" varchar(100),
      ADD COLUMN IF NOT EXISTS "last_name" varchar(100);
    `);
    // Make ong_name nullable in users table (it's now optional for regular users)
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "ong_name" DROP NOT NULL;
    `);
    // Migrate existing users to ONGs table
    // This creates an ONG record for each existing user and updates their role
    await queryRunner.query(`
      INSERT INTO "ongs" (
        "id",
        "email",
        "ong_name",
        "profile_image_url",
        "phone",
        "instagram_handle",
        "location",
        "latitude",
        "longitude",
        "approval_status",
        "approved_at",
        "created_at",
        "updated_at"
      )
      SELECT
        "id",
        "email",
        COALESCE("ong_name", 'ONG ' || "email"),
        "profile_image_url",
        "phone",
        "instagram_handle",
        "location",
        "latitude",
        "longitude",
        'approved',
        NOW(),
        "created_at",
        "updated_at"
      FROM "users"
      WHERE "ong_name" IS NOT NULL
      ON CONFLICT (id) DO NOTHING;
    `);
    // Update existing users to have ONG role
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'ong'
      WHERE "ong_name" IS NOT NULL;
    `);
    // Create ONG member records for existing users (they become owners of their ONGs)
    await queryRunner.query(`
      INSERT INTO "ong_members" (
        "ong_id",
        "user_id",
        "role",
        "invitation_status",
        "accepted_at",
        "created_at",
        "updated_at"
      )
      SELECT
        "id",
        "id",
        'owner',
        'accepted',
        NOW(),
        NOW(),
        NOW()
      FROM "users"
      WHERE "role" = 'ong'
      ON CONFLICT DO NOTHING;
    `);
    // Create admin user if it doesn't exist
    await queryRunner.query(`
      INSERT INTO "users" (
        "email",
        "password_hash",
        "role",
        "first_name",
        "last_name",
        "created_at",
        "updated_at"
      )
      SELECT
        'admin@petsos.com',
        '$2b$10$rQZJKKZqT5YmJ7YxKj5YqOKx6Y9bZ6ZqZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
        'admin',
        'Admin',
        'User',
        NOW(),
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "users" WHERE "email" = 'admin@petsos.com'
      );
    `);
    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ongs_email" ON "ongs" ("email");
      CREATE INDEX IF NOT EXISTS "IDX_ongs_approval_status" ON "ongs" ("approval_status");
      CREATE INDEX IF NOT EXISTS "IDX_ong_members_ong_id" ON "ong_members" ("ong_id");
      CREATE INDEX IF NOT EXISTS "IDX_ong_members_user_id" ON "ong_members" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role");
      CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email");
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ong_members_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ong_members_ong_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ongs_approval_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ongs_email"`);
    // Drop ONG members table
    await queryRunner.query(`DROP TABLE IF EXISTS "ong_members"`);
    // Drop ONGs table
    await queryRunner.query(`DROP TABLE IF EXISTS "ongs"`);
    // Remove columns from users table
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "last_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "first_name"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
    // Make ong_name NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "ong_name" SET NOT NULL;
    `);
    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS ong_member_role_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum`);
  }
}
