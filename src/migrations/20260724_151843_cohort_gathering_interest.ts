import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_cohorts_program_status" ADD VALUE 'gathering-interest' BEFORE 'upcoming';
  ALTER TYPE "public"."enum__cohorts_v_version_program_status" ADD VALUE 'gathering-interest' BEFORE 'upcoming';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cohorts" ALTER COLUMN "program_status" SET DATA TYPE text;
  ALTER TABLE "cohorts" ALTER COLUMN "program_status" SET DEFAULT 'upcoming'::text;
  DROP TYPE "public"."enum_cohorts_program_status";
  CREATE TYPE "public"."enum_cohorts_program_status" AS ENUM('draft', 'upcoming', 'active', 'complete', 'archived');
  ALTER TABLE "cohorts" ALTER COLUMN "program_status" SET DEFAULT 'upcoming'::"public"."enum_cohorts_program_status";
  ALTER TABLE "cohorts" ALTER COLUMN "program_status" SET DATA TYPE "public"."enum_cohorts_program_status" USING "program_status"::"public"."enum_cohorts_program_status";
  ALTER TABLE "_cohorts_v" ALTER COLUMN "version_program_status" SET DATA TYPE text;
  ALTER TABLE "_cohorts_v" ALTER COLUMN "version_program_status" SET DEFAULT 'upcoming'::text;
  DROP TYPE "public"."enum__cohorts_v_version_program_status";
  CREATE TYPE "public"."enum__cohorts_v_version_program_status" AS ENUM('draft', 'upcoming', 'active', 'complete', 'archived');
  ALTER TABLE "_cohorts_v" ALTER COLUMN "version_program_status" SET DEFAULT 'upcoming'::"public"."enum__cohorts_v_version_program_status";
  ALTER TABLE "_cohorts_v" ALTER COLUMN "version_program_status" SET DATA TYPE "public"."enum__cohorts_v_version_program_status" USING "version_program_status"::"public"."enum__cohorts_v_version_program_status";`)
}
