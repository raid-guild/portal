import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_newsletter_campaigns_source_mode" AS ENUM('latestSavedDraft', 'published');
    ALTER TABLE "newsletter_campaigns" ADD COLUMN "source_mode" "enum_newsletter_campaigns_source_mode" DEFAULT 'latestSavedDraft' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "newsletter_campaigns" DROP COLUMN IF EXISTS "source_mode";
    DROP TYPE IF EXISTS "public"."enum_newsletter_campaigns_source_mode";
  `)
}
