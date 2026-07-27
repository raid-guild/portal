import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "modules" ADD COLUMN "thumbnail_id" integer;
    ALTER TABLE "modules" ADD CONSTRAINT "modules_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "modules_thumbnail_idx" ON "modules" USING btree ("thumbnail_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "modules_thumbnail_idx";
    ALTER TABLE "modules" DROP CONSTRAINT IF EXISTS "modules_thumbnail_id_media_id_fk";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "thumbnail_id";
  `)
}
