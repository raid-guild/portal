import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_profiles_claim_status" AS ENUM('unclaimed', 'claimed');
    ALTER TABLE "profiles" ADD COLUMN "claim_status" "enum_profiles_claim_status" DEFAULT 'claimed' NOT NULL;
    ALTER TABLE "profiles" ADD COLUMN "claim_email" varchar;
    ALTER TABLE "profiles" ADD COLUMN "claimed_at" timestamp(3) with time zone;
    ALTER TABLE "profiles" ADD COLUMN "source_c_r_m_i_d" varchar;
    DROP INDEX "profiles_user_idx";
    CREATE UNIQUE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id") WHERE "user_id" IS NOT NULL;
    CREATE INDEX "profiles_claim_status_idx" ON "profiles" USING btree ("claim_status");
    CREATE INDEX "profiles_claim_email_idx" ON "profiles" USING btree ("claim_email");
    CREATE INDEX "profiles_source_c_r_m_i_d_idx" ON "profiles" USING btree ("source_c_r_m_i_d");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "profiles_source_c_r_m_i_d_idx";
    DROP INDEX "profiles_claim_email_idx";
    DROP INDEX "profiles_claim_status_idx";
    DROP INDEX "profiles_user_idx";
    CREATE UNIQUE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");
    ALTER TABLE "profiles" DROP COLUMN "source_c_r_m_i_d";
    ALTER TABLE "profiles" DROP COLUMN "claimed_at";
    ALTER TABLE "profiles" DROP COLUMN "claim_email";
    ALTER TABLE "profiles" DROP COLUMN "claim_status";
    DROP TYPE "public"."enum_profiles_claim_status";
  `)
}
