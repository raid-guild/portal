import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_notifications_type" ADD VALUE IF NOT EXISTS 'module_published';
    CREATE TYPE "public"."enum_notification_preferences_module_announcements" AS ENUM('in_app', 'email', 'muted');

    ALTER TABLE "notification_preferences" ADD COLUMN "module_announcements" "enum_notification_preferences_module_announcements" DEFAULT 'muted' NOT NULL;
    ALTER TABLE "notifications" ADD COLUMN "related_module_id" integer;

    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_module_id_modules_id_fk" FOREIGN KEY ("related_module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "notifications_related_module_idx" ON "notifications" USING btree ("related_module_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "notifications_related_module_idx";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_module_id_modules_id_fk";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "related_module_id";
    ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "module_announcements";
    DROP TYPE IF EXISTS "public"."enum_notification_preferences_module_announcements";
  `)
}
