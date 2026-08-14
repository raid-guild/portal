import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profiles" ADD COLUMN "wallet_verified_at" timestamp(3) with time zone;
    ALTER TABLE "profiles" ADD COLUMN "wallet_verification_challenge_hash" varchar;
    ALTER TABLE "profiles" ADD COLUMN "wallet_verification_address" varchar;
    ALTER TABLE "profiles" ADD COLUMN "wallet_verification_expires_at" timestamp(3) with time zone;
    CREATE INDEX "profiles_wallet_address_idx" ON "profiles" USING btree ("wallet_address");
    CREATE UNIQUE INDEX "profiles_verified_wallet_address_idx" ON "profiles" USING btree (lower("wallet_address")) WHERE "wallet_verified_at" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "profiles_verified_wallet_address_idx";
    DROP INDEX IF EXISTS "profiles_wallet_address_idx";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "wallet_verification_expires_at";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "wallet_verification_address";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "wallet_verification_challenge_hash";
    ALTER TABLE "profiles" DROP COLUMN IF EXISTS "wallet_verified_at";
  `)
}
