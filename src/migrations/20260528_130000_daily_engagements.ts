import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_daily_engagements_vibe" AS ENUM('raiding', 'ripping', 'meeting', 'learning', 'vibing', 'blocked', 'resting');
    CREATE TYPE "public"."enum_daily_engagements_comment_status" AS ENUM('none', 'pending_review', 'approved', 'hidden', 'rejected');
    CREATE TYPE "public"."enum_daily_engagements_status" AS ENUM('valid', 'void');

    CREATE TABLE "daily_engagements" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "profile_id" integer,
      "engagement_date" timestamp(3) with time zone NOT NULL,
      "vibe" "enum_daily_engagements_vibe" NOT NULL,
      "checked_in" boolean DEFAULT true NOT NULL,
      "comment" varchar,
      "comment_status" "enum_daily_engagements_comment_status" DEFAULT 'none' NOT NULL,
      "comment_approved_by_id" integer,
      "comment_approved_at" timestamp(3) with time zone,
      "status" "enum_daily_engagements_status" DEFAULT 'valid' NOT NULL,
      "void_reason" varchar,
      "point_event_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "point_events" ADD COLUMN "related_daily_engagement_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "daily_engagements_id" integer;

    ALTER TABLE "daily_engagements" ADD CONSTRAINT "daily_engagements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "daily_engagements" ADD CONSTRAINT "daily_engagements_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "daily_engagements" ADD CONSTRAINT "daily_engagements_comment_approved_by_id_users_id_fk" FOREIGN KEY ("comment_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "daily_engagements" ADD CONSTRAINT "daily_engagements_point_event_id_point_events_id_fk" FOREIGN KEY ("point_event_id") REFERENCES "public"."point_events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "point_events" ADD CONSTRAINT "point_events_related_daily_engagement_id_daily_engagements_id_fk" FOREIGN KEY ("related_daily_engagement_id") REFERENCES "public"."daily_engagements"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_daily_engagements_fk" FOREIGN KEY ("daily_engagements_id") REFERENCES "public"."daily_engagements"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "daily_engagements_user_idx" ON "daily_engagements" USING btree ("user_id");
    CREATE INDEX "daily_engagements_profile_idx" ON "daily_engagements" USING btree ("profile_id");
    CREATE INDEX "daily_engagements_engagement_date_idx" ON "daily_engagements" USING btree ("engagement_date");
    CREATE UNIQUE INDEX "daily_engagements_user_engagement_date_unique_idx" ON "daily_engagements" USING btree ("user_id", "engagement_date");
    CREATE INDEX "daily_engagements_comment_approved_by_idx" ON "daily_engagements" USING btree ("comment_approved_by_id");
    CREATE INDEX "daily_engagements_point_event_idx" ON "daily_engagements" USING btree ("point_event_id");
    CREATE INDEX "daily_engagements_updated_at_idx" ON "daily_engagements" USING btree ("updated_at");
    CREATE INDEX "daily_engagements_created_at_idx" ON "daily_engagements" USING btree ("created_at");
    CREATE INDEX "point_events_related_daily_engagement_idx" ON "point_events" USING btree ("related_daily_engagement_id");
    CREATE INDEX "payload_locked_documents_rels_daily_engagements_id_idx" ON "payload_locked_documents_rels" USING btree ("daily_engagements_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_engagements" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_daily_engagements_fk";
    ALTER TABLE "point_events" DROP CONSTRAINT IF EXISTS "point_events_related_daily_engagement_id_daily_engagements_id_fk";
    ALTER TABLE "daily_engagements" DROP CONSTRAINT IF EXISTS "daily_engagements_point_event_id_point_events_id_fk";
    ALTER TABLE "daily_engagements" DROP CONSTRAINT IF EXISTS "daily_engagements_comment_approved_by_id_users_id_fk";
    ALTER TABLE "daily_engagements" DROP CONSTRAINT IF EXISTS "daily_engagements_profile_id_profiles_id_fk";
    ALTER TABLE "daily_engagements" DROP CONSTRAINT IF EXISTS "daily_engagements_user_id_users_id_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_daily_engagements_id_idx";
    DROP INDEX IF EXISTS "point_events_related_daily_engagement_idx";
    DROP INDEX IF EXISTS "daily_engagements_created_at_idx";
    DROP INDEX IF EXISTS "daily_engagements_updated_at_idx";
    DROP INDEX IF EXISTS "daily_engagements_point_event_idx";
    DROP INDEX IF EXISTS "daily_engagements_comment_approved_by_idx";
    DROP INDEX IF EXISTS "daily_engagements_user_engagement_date_unique_idx";
    DROP INDEX IF EXISTS "daily_engagements_engagement_date_idx";
    DROP INDEX IF EXISTS "daily_engagements_profile_idx";
    DROP INDEX IF EXISTS "daily_engagements_user_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "daily_engagements_id";
    ALTER TABLE "point_events" DROP COLUMN IF EXISTS "related_daily_engagement_id";
    DROP TABLE "daily_engagements" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_daily_engagements_status";
    DROP TYPE IF EXISTS "public"."enum_daily_engagements_comment_status";
    DROP TYPE IF EXISTS "public"."enum_daily_engagements_vibe";
  `)
}
