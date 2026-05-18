import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_events_session_type" AS ENUM('brownbag', 'workshop', 'all-hands', 'demo', 'pitch');
    CREATE TYPE "public"."enum_events_discord_sync_status" AS ENUM('not_configured', 'synced', 'failed');
    CREATE TYPE "public"."enum__events_v_version_session_type" AS ENUM('brownbag', 'workshop', 'all-hands', 'demo', 'pitch');
    CREATE TYPE "public"."enum__events_v_version_discord_sync_status" AS ENUM('not_configured', 'synced', 'failed');
    ALTER TABLE "events" ADD COLUMN "session_type" "enum_events_session_type" DEFAULT 'brownbag' NOT NULL;
    ALTER TABLE "events" ADD COLUMN "speaker_id" integer;
    ALTER TABLE "events" ADD COLUMN "discord_scheduled_event_i_d" varchar;
    ALTER TABLE "events" ADD COLUMN "discord_sync_status" "enum_events_discord_sync_status" DEFAULT 'not_configured';
    ALTER TABLE "events" ADD COLUMN "discord_sync_error" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_session_type" "enum__events_v_version_session_type" DEFAULT 'brownbag';
    ALTER TABLE "_events_v" ADD COLUMN "version_speaker_id" integer;
    ALTER TABLE "_events_v" ADD COLUMN "version_discord_scheduled_event_i_d" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_discord_sync_status" "enum__events_v_version_discord_sync_status" DEFAULT 'not_configured';
    ALTER TABLE "_events_v" ADD COLUMN "version_discord_sync_error" varchar;
    ALTER TABLE "events" ALTER COLUMN "visibility" SET DEFAULT 'public';
    ALTER TABLE "_events_v" ALTER COLUMN "version_visibility" SET DEFAULT 'public';
    ALTER TABLE "events" ADD CONSTRAINT "events_speaker_id_profiles_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_speaker_id_profiles_id_fk" FOREIGN KEY ("version_speaker_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "events_speaker_idx" ON "events" USING btree ("speaker_id");
    CREATE INDEX "_events_v_version_speaker_idx" ON "_events_v" USING btree ("version_speaker_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "_events_v_version_speaker_idx";
    DROP INDEX "events_speaker_idx";
    ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_speaker_id_profiles_id_fk";
    ALTER TABLE "events" DROP CONSTRAINT "events_speaker_id_profiles_id_fk";
    ALTER TABLE "_events_v" ALTER COLUMN "version_visibility" SET DEFAULT 'authenticated';
    ALTER TABLE "events" ALTER COLUMN "visibility" SET DEFAULT 'authenticated';
    ALTER TABLE "_events_v" DROP COLUMN "version_discord_sync_error";
    ALTER TABLE "_events_v" DROP COLUMN "version_discord_sync_status";
    ALTER TABLE "_events_v" DROP COLUMN "version_discord_scheduled_event_i_d";
    ALTER TABLE "_events_v" DROP COLUMN "version_speaker_id";
    ALTER TABLE "_events_v" DROP COLUMN "version_session_type";
    ALTER TABLE "events" DROP COLUMN "discord_sync_error";
    ALTER TABLE "events" DROP COLUMN "discord_sync_status";
    ALTER TABLE "events" DROP COLUMN "discord_scheduled_event_i_d";
    ALTER TABLE "events" DROP COLUMN "speaker_id";
    ALTER TABLE "events" DROP COLUMN "session_type";
    DROP TYPE "public"."enum__events_v_version_discord_sync_status";
    DROP TYPE "public"."enum__events_v_version_session_type";
    DROP TYPE "public"."enum_events_discord_sync_status";
    DROP TYPE "public"."enum_events_session_type";
  `)
}
