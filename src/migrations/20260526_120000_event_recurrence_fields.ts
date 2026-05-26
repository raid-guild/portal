import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_events_recurrence_cadence" AS ENUM('weekly', 'biweekly', 'monthly');
    CREATE TYPE "public"."enum__events_v_version_recurrence_cadence" AS ENUM('weekly', 'biweekly', 'monthly');

    ALTER TABLE "events" ADD COLUMN "series_key" varchar;
    ALTER TABLE "events" ADD COLUMN "series_title" varchar;
    ALTER TABLE "events" ADD COLUMN "recurrence_cadence" "public"."enum_events_recurrence_cadence";
    ALTER TABLE "events" ADD COLUMN "recurrence_until" timestamp(3) with time zone;
    ALTER TABLE "events" ADD COLUMN "previous_occurrence_id" integer;
    ALTER TABLE "events" ADD COLUMN "next_occurrence_id" integer;

    ALTER TABLE "_events_v" ADD COLUMN "version_series_key" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_series_title" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_recurrence_cadence" "public"."enum__events_v_version_recurrence_cadence";
    ALTER TABLE "_events_v" ADD COLUMN "version_recurrence_until" timestamp(3) with time zone;
    ALTER TABLE "_events_v" ADD COLUMN "version_previous_occurrence_id" integer;
    ALTER TABLE "_events_v" ADD COLUMN "version_next_occurrence_id" integer;

    ALTER TABLE "events" ADD CONSTRAINT "events_previous_occurrence_id_events_id_fk" FOREIGN KEY ("previous_occurrence_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "events" ADD CONSTRAINT "events_next_occurrence_id_events_id_fk" FOREIGN KEY ("next_occurrence_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_previous_occurrence_id_events_id_fk" FOREIGN KEY ("version_previous_occurrence_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_next_occurrence_id_events_id_fk" FOREIGN KEY ("version_next_occurrence_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "events_series_key_idx" ON "events" USING btree ("series_key");
    CREATE INDEX "events_previous_occurrence_idx" ON "events" USING btree ("previous_occurrence_id");
    CREATE INDEX "events_next_occurrence_idx" ON "events" USING btree ("next_occurrence_id");
    CREATE INDEX "_events_v_version_series_key_idx" ON "_events_v" USING btree ("version_series_key");
    CREATE INDEX "_events_v_version_previous_occurrence_idx" ON "_events_v" USING btree ("version_previous_occurrence_id");
    CREATE INDEX "_events_v_version_next_occurrence_idx" ON "_events_v" USING btree ("version_next_occurrence_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "_events_v_version_next_occurrence_idx";
    DROP INDEX "_events_v_version_previous_occurrence_idx";
    DROP INDEX "_events_v_version_series_key_idx";
    DROP INDEX "events_next_occurrence_idx";
    DROP INDEX "events_previous_occurrence_idx";
    DROP INDEX "events_series_key_idx";

    ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_next_occurrence_id_events_id_fk";
    ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_previous_occurrence_id_events_id_fk";
    ALTER TABLE "events" DROP CONSTRAINT "events_next_occurrence_id_events_id_fk";
    ALTER TABLE "events" DROP CONSTRAINT "events_previous_occurrence_id_events_id_fk";

    ALTER TABLE "_events_v" DROP COLUMN "version_next_occurrence_id";
    ALTER TABLE "_events_v" DROP COLUMN "version_previous_occurrence_id";
    ALTER TABLE "_events_v" DROP COLUMN "version_recurrence_until";
    ALTER TABLE "_events_v" DROP COLUMN "version_recurrence_cadence";
    ALTER TABLE "_events_v" DROP COLUMN "version_series_title";
    ALTER TABLE "_events_v" DROP COLUMN "version_series_key";

    ALTER TABLE "events" DROP COLUMN "next_occurrence_id";
    ALTER TABLE "events" DROP COLUMN "previous_occurrence_id";
    ALTER TABLE "events" DROP COLUMN "recurrence_until";
    ALTER TABLE "events" DROP COLUMN "recurrence_cadence";
    ALTER TABLE "events" DROP COLUMN "series_title";
    ALTER TABLE "events" DROP COLUMN "series_key";

    DROP TYPE "public"."enum__events_v_version_recurrence_cadence";
    DROP TYPE "public"."enum_events_recurrence_cadence";
  `)
}
