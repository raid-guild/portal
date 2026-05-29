import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_notifications_type" AS ENUM('event_published', 'event_reminder', 'brief_published', 'activity_digest', 'weekly_digest', 'badge_awarded', 'profile_claim', 'system');
    CREATE TYPE "public"."enum_notifications_status" AS ENUM('unread', 'read', 'archived');
    CREATE TYPE "public"."enum_notifications_priority" AS ENUM('normal', 'high');
    CREATE TYPE "public"."enum_notifications_delivery_channel" AS ENUM('in_app', 'email');
    CREATE TYPE "public"."enum_notifications_email_status" AS ENUM('none', 'pending', 'sent', 'failed', 'skipped');
    CREATE TYPE "public"."enum_notification_preferences_session_announcements" AS ENUM('in_app', 'email', 'muted');
    CREATE TYPE "public"."enum_notification_preferences_session_reminders" AS ENUM('in_app', 'email', 'muted');
    CREATE TYPE "public"."enum_notification_preferences_briefs" AS ENUM('in_app', 'email', 'muted');
    CREATE TYPE "public"."enum_notification_preferences_activity_digest_frequency" AS ENUM('none', 'daily', 'weekly');
    CREATE TYPE "public"."enum_notification_preferences_weekly_digest" AS ENUM('in_app', 'email', 'muted');
    CREATE TYPE "public"."enum_notification_preferences_badge_awards" AS ENUM('in_app', 'email', 'muted');

    CREATE TABLE "notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "recipient_id" integer NOT NULL,
      "title" varchar NOT NULL,
      "body" varchar,
      "type" "enum_notifications_type" DEFAULT 'system' NOT NULL,
      "status" "enum_notifications_status" DEFAULT 'unread' NOT NULL,
      "priority" "enum_notifications_priority" DEFAULT 'normal' NOT NULL,
      "delivery_channel" "enum_notifications_delivery_channel" DEFAULT 'in_app' NOT NULL,
      "email_status" "enum_notifications_email_status" DEFAULT 'none' NOT NULL,
      "email_error" varchar,
      "read_at" timestamp(3) with time zone,
      "archived_at" timestamp(3) with time zone,
      "emailed_at" timestamp(3) with time zone,
      "dedupe_key" varchar,
      "action_label" varchar,
      "action_u_r_l" varchar,
      "related_event_id" integer,
      "related_brief_id" integer,
      "related_activity_item_id" integer,
      "related_project_id" integer,
      "related_thread_id" integer,
      "related_badge_award_id" integer,
      "metadata" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "notification_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "email_enabled" boolean DEFAULT false,
      "session_announcements" "enum_notification_preferences_session_announcements" DEFAULT 'in_app' NOT NULL,
      "session_reminders" "enum_notification_preferences_session_reminders" DEFAULT 'in_app' NOT NULL,
      "briefs" "enum_notification_preferences_briefs" DEFAULT 'in_app' NOT NULL,
      "activity_digest_frequency" "enum_notification_preferences_activity_digest_frequency" DEFAULT 'weekly' NOT NULL,
      "weekly_digest" "enum_notification_preferences_weekly_digest" DEFAULT 'in_app' NOT NULL,
      "badge_awards" "enum_notification_preferences_badge_awards" DEFAULT 'in_app' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notifications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notification_preferences_id" integer;

    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_event_id_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_brief_id_daily_briefs_id_fk" FOREIGN KEY ("related_brief_id") REFERENCES "public"."daily_briefs"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_activity_item_id_activity_items_id_fk" FOREIGN KEY ("related_activity_item_id") REFERENCES "public"."activity_items"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_thread_id_threads_id_fk" FOREIGN KEY ("related_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_badge_award_id_profile_badges_id_fk" FOREIGN KEY ("related_badge_award_id") REFERENCES "public"."profile_badges"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notification_preferences_fk" FOREIGN KEY ("notification_preferences_id") REFERENCES "public"."notification_preferences"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id");
    CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");
    CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");
    CREATE UNIQUE INDEX "notifications_dedupe_key_idx" ON "notifications" USING btree ("dedupe_key") WHERE "dedupe_key" IS NOT NULL;
    CREATE INDEX "notifications_email_status_idx" ON "notifications" USING btree ("email_status");
    CREATE INDEX "notifications_related_event_idx" ON "notifications" USING btree ("related_event_id");
    CREATE INDEX "notifications_related_brief_idx" ON "notifications" USING btree ("related_brief_id");
    CREATE INDEX "notifications_related_activity_item_idx" ON "notifications" USING btree ("related_activity_item_id");
    CREATE INDEX "notifications_related_project_idx" ON "notifications" USING btree ("related_project_id");
    CREATE INDEX "notifications_related_thread_idx" ON "notifications" USING btree ("related_thread_id");
    CREATE INDEX "notifications_related_badge_award_idx" ON "notifications" USING btree ("related_badge_award_id");
    CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
    CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
    CREATE UNIQUE INDEX "notification_preferences_user_idx" ON "notification_preferences" USING btree ("user_id");
    CREATE INDEX "notification_preferences_updated_at_idx" ON "notification_preferences" USING btree ("updated_at");
    CREATE INDEX "notification_preferences_created_at_idx" ON "notification_preferences" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
    CREATE INDEX "payload_locked_documents_rels_notification_preferences_id_idx" ON "payload_locked_documents_rels" USING btree ("notification_preferences_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "notification_preferences" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_notification_preferences_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_notifications_id_idx";
    DROP INDEX IF EXISTS "notification_preferences_created_at_idx";
    DROP INDEX IF EXISTS "notification_preferences_updated_at_idx";
    DROP INDEX IF EXISTS "notification_preferences_user_idx";
    DROP INDEX IF EXISTS "notifications_created_at_idx";
    DROP INDEX IF EXISTS "notifications_updated_at_idx";
    DROP INDEX IF EXISTS "notifications_related_badge_award_idx";
    DROP INDEX IF EXISTS "notifications_related_thread_idx";
    DROP INDEX IF EXISTS "notifications_related_project_idx";
    DROP INDEX IF EXISTS "notifications_related_activity_item_idx";
    DROP INDEX IF EXISTS "notifications_related_brief_idx";
    DROP INDEX IF EXISTS "notifications_related_event_idx";
    DROP INDEX IF EXISTS "notifications_email_status_idx";
    DROP INDEX IF EXISTS "notifications_dedupe_key_idx";
    DROP INDEX IF EXISTS "notifications_type_idx";
    DROP INDEX IF EXISTS "notifications_status_idx";
    DROP INDEX IF EXISTS "notifications_recipient_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_notification_preferences_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_notifications_fk";
    ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "notification_preferences_user_id_users_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_badge_award_id_profile_badges_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_thread_id_threads_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_project_id_projects_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_activity_item_id_activity_items_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_brief_id_daily_briefs_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_related_event_id_events_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_recipient_id_users_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "notification_preferences_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "notifications_id";
    DROP TABLE IF EXISTS "notification_preferences";
    DROP TABLE IF EXISTS "notifications";

    DROP TYPE IF EXISTS "public"."enum_notification_preferences_badge_awards";
    DROP TYPE IF EXISTS "public"."enum_notification_preferences_weekly_digest";
    DROP TYPE IF EXISTS "public"."enum_notification_preferences_activity_digest_frequency";
    DROP TYPE IF EXISTS "public"."enum_notification_preferences_briefs";
    DROP TYPE IF EXISTS "public"."enum_notification_preferences_session_reminders";
    DROP TYPE IF EXISTS "public"."enum_notification_preferences_session_announcements";
    DROP TYPE IF EXISTS "public"."enum_notifications_email_status";
    DROP TYPE IF EXISTS "public"."enum_notifications_delivery_channel";
    DROP TYPE IF EXISTS "public"."enum_notifications_priority";
    DROP TYPE IF EXISTS "public"."enum_notifications_status";
    DROP TYPE IF EXISTS "public"."enum_notifications_type";
  `)
}
