import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN "transcript_markdown" varchar;
    ALTER TABLE "events" ADD COLUMN "transcript_source_session_i_d" varchar;
    ALTER TABLE "events" ADD COLUMN "transcript_sha256" varchar;
    ALTER TABLE "events" ADD COLUMN "transcript_ingested_at" timestamp(3) with time zone;
    ALTER TABLE "_events_v" ADD COLUMN "version_transcript_markdown" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_transcript_source_session_i_d" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_transcript_sha256" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_transcript_ingested_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_transcript_ingested_at";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_transcript_sha256";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_transcript_source_session_i_d";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_transcript_markdown";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "transcript_ingested_at";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "transcript_sha256";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "transcript_source_session_i_d";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "transcript_markdown";
  `)
}
