import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "activity_items" ADD COLUMN "source_key" varchar;
    ALTER TABLE "_activity_items_v" ADD COLUMN "version_source_key" varchar;

    CREATE UNIQUE INDEX "activity_items_source_key_idx" ON "activity_items" USING btree ("source_key");
    CREATE INDEX "_activity_items_v_version_source_key_idx" ON "_activity_items_v" USING btree ("version_source_key");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_activity_items_v_version_source_key_idx";
    DROP INDEX IF EXISTS "activity_items_source_key_idx";

    ALTER TABLE "_activity_items_v" DROP COLUMN IF EXISTS "version_source_key";
    ALTER TABLE "activity_items" DROP COLUMN IF EXISTS "source_key";
  `)
}
