import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_daily_briefs_brief_type" AS ENUM('daily', 'weekly');
  CREATE TYPE "public"."enum_daily_briefs_media_type" AS ENUM('video', 'audio', 'remotion-scene', 'other');
  CREATE TYPE "public"."enum__daily_briefs_v_version_brief_type" AS ENUM('daily', 'weekly');
  CREATE TYPE "public"."enum__daily_briefs_v_version_media_type" AS ENUM('video', 'audio', 'remotion-scene', 'other');
  ALTER TABLE "daily_briefs" ADD COLUMN "brief_type" "enum_daily_briefs_brief_type" DEFAULT 'daily';
  ALTER TABLE "daily_briefs" ADD COLUMN "media_file_id" integer;
  ALTER TABLE "daily_briefs" ADD COLUMN "media_type" "enum_daily_briefs_media_type" DEFAULT 'video';
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_brief_type" "enum__daily_briefs_v_version_brief_type" DEFAULT 'daily';
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_media_file_id" integer;
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_media_type" "enum__daily_briefs_v_version_media_type" DEFAULT 'video';
  ALTER TABLE "daily_briefs" ADD CONSTRAINT "daily_briefs_media_file_id_media_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v" ADD CONSTRAINT "_daily_briefs_v_version_media_file_id_media_id_fk" FOREIGN KEY ("version_media_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "daily_briefs_media_file_idx" ON "daily_briefs" USING btree ("media_file_id");
  CREATE INDEX "_daily_briefs_v_version_version_media_file_idx" ON "_daily_briefs_v" USING btree ("version_media_file_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "daily_briefs" DROP CONSTRAINT "daily_briefs_media_file_id_media_id_fk";
  
  ALTER TABLE "_daily_briefs_v" DROP CONSTRAINT "_daily_briefs_v_version_media_file_id_media_id_fk";
  
  DROP INDEX "daily_briefs_media_file_idx";
  DROP INDEX "_daily_briefs_v_version_version_media_file_idx";
  ALTER TABLE "daily_briefs" DROP COLUMN "brief_type";
  ALTER TABLE "daily_briefs" DROP COLUMN "media_file_id";
  ALTER TABLE "daily_briefs" DROP COLUMN "media_type";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_brief_type";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_media_file_id";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_media_type";
  DROP TYPE "public"."enum_daily_briefs_brief_type";
  DROP TYPE "public"."enum_daily_briefs_media_type";
  DROP TYPE "public"."enum__daily_briefs_v_version_brief_type";
  DROP TYPE "public"."enum__daily_briefs_v_version_media_type";`)
}
