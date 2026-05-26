import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_events_visibility" ADD VALUE IF NOT EXISTS 'member';
    ALTER TYPE "public"."enum__events_v_version_visibility" ADD VALUE IF NOT EXISTS 'member';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events" SET "visibility" = 'authenticated' WHERE "visibility"::text = 'member';
    UPDATE "_events_v" SET "version_visibility" = 'authenticated' WHERE "version_visibility"::text = 'member';

    ALTER TYPE "public"."enum_events_visibility" RENAME TO "enum_events_visibility_old";
    CREATE TYPE "public"."enum_events_visibility" AS ENUM('authenticated', 'public', 'admin');
    ALTER TABLE "events" ALTER COLUMN "visibility" DROP DEFAULT;
    ALTER TABLE "events"
      ALTER COLUMN "visibility" TYPE "public"."enum_events_visibility"
      USING "visibility"::text::"public"."enum_events_visibility";
    ALTER TABLE "events" ALTER COLUMN "visibility" SET DEFAULT 'public';
    DROP TYPE "public"."enum_events_visibility_old";

    ALTER TYPE "public"."enum__events_v_version_visibility" RENAME TO "enum__events_v_version_visibility_old";
    CREATE TYPE "public"."enum__events_v_version_visibility" AS ENUM('authenticated', 'public', 'admin');
    ALTER TABLE "_events_v" ALTER COLUMN "version_visibility" DROP DEFAULT;
    ALTER TABLE "_events_v"
      ALTER COLUMN "version_visibility" TYPE "public"."enum__events_v_version_visibility"
      USING "version_visibility"::text::"public"."enum__events_v_version_visibility";
    ALTER TABLE "_events_v" ALTER COLUMN "version_visibility" SET DEFAULT 'public';
    DROP TYPE "public"."enum__events_v_version_visibility_old";
  `)
}
