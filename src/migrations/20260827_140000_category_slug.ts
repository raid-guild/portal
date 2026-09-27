import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "slug_lock" boolean DEFAULT true;
    UPDATE "categories"
    SET "slug" = lower(regexp_replace(regexp_replace(trim("title"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
    WHERE "slug" IS NULL;
    ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_slug_idx";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "slug_lock";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "slug";
  `)
}
