import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_modules_category" AS ENUM('ops', 'tools', 'analytics', 'games', 'knowledge', 'community');

    ALTER TABLE "modules" ADD COLUMN "category" "enum_modules_category" DEFAULT 'tools' NOT NULL;

    UPDATE "modules"
    SET "category" = CASE
      WHEN "slug" = 'newsletter' THEN 'ops'::"enum_modules_category"
      WHEN "slug" = 'portal-graph' THEN 'analytics'::"enum_modules_category"
      WHEN "slug" = 'infinite-wiki' THEN 'knowledge'::"enum_modules_category"
      WHEN "slug" = 'leaderboard' THEN 'community'::"enum_modules_category"
      ELSE "category"
    END;

    CREATE INDEX "modules_category_idx" ON "modules" USING btree ("category");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "modules_category_idx";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "category";
    DROP TYPE IF EXISTS "public"."enum_modules_category";
  `)
}
