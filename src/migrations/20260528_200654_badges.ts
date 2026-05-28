import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_badges_category" AS ENUM('cohort', 'contribution', 'craft', 'community', 'achievement');
    CREATE TYPE "public"."enum_badges_fallback_icon" AS ENUM('award', 'spark', 'shield', 'star', 'users');
    CREATE TYPE "public"."enum_badges_display_style" AS ENUM('standard', 'compact', 'featured');
    CREATE TYPE "public"."enum_badges_visibility" AS ENUM('public', 'member');
    CREATE TYPE "public"."enum_profile_badges_source" AS ENUM('admin', 'agent', 'cohort', 'import', 'system');
    CREATE TYPE "public"."enum_profile_badges_visibility" AS ENUM('public', 'member', 'private');

    CREATE TABLE "badges" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar,
      "category" "enum_badges_category" DEFAULT 'achievement' NOT NULL,
      "artwork_id" integer,
      "fallback_icon" "enum_badges_fallback_icon" DEFAULT 'spark',
      "accent_color" varchar,
      "background_color" varchar,
      "display_style" "enum_badges_display_style" DEFAULT 'standard' NOT NULL,
      "is_retired" boolean DEFAULT false,
      "sort_order" numeric DEFAULT 0,
      "visibility" "enum_badges_visibility" DEFAULT 'public' NOT NULL,
      "slug" varchar,
      "slug_lock" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "profile_badges" (
      "id" serial PRIMARY KEY NOT NULL,
      "badge_id" integer NOT NULL,
      "awarded_at" timestamp(3) with time zone NOT NULL,
      "awarded_by_user_id" integer,
      "source" "enum_profile_badges_source" NOT NULL,
      "related_project_id" integer,
      "related_event_id" integer,
      "related_post_id" integer,
      "note" varchar,
      "featured" boolean DEFAULT false,
      "visibility" "enum_profile_badges_visibility" DEFAULT 'public' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "profile_badges_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "profiles_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "badges_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "profile_badges_id" integer;

    ALTER TABLE "badges" ADD CONSTRAINT "badges_artwork_id_media_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_awarded_by_user_id_users_id_fk" FOREIGN KEY ("awarded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_related_event_id_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "profile_badges" ADD CONSTRAINT "profile_badges_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "profile_badges_rels" ADD CONSTRAINT "profile_badges_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profile_badges"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "profile_badges_rels" ADD CONSTRAINT "profile_badges_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badges_fk" FOREIGN KEY ("badges_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_badges_fk" FOREIGN KEY ("profile_badges_id") REFERENCES "public"."profile_badges"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "badges_title_idx" ON "badges" USING btree ("title");
    CREATE INDEX "badges_artwork_idx" ON "badges" USING btree ("artwork_id");
    CREATE UNIQUE INDEX "badges_slug_idx" ON "badges" USING btree ("slug");
    CREATE INDEX "badges_updated_at_idx" ON "badges" USING btree ("updated_at");
    CREATE INDEX "badges_created_at_idx" ON "badges" USING btree ("created_at");
    CREATE INDEX "profile_badges_badge_idx" ON "profile_badges" USING btree ("badge_id");
    CREATE INDEX "profile_badges_awarded_by_user_idx" ON "profile_badges" USING btree ("awarded_by_user_id");
    CREATE INDEX "profile_badges_related_project_idx" ON "profile_badges" USING btree ("related_project_id");
    CREATE INDEX "profile_badges_related_event_idx" ON "profile_badges" USING btree ("related_event_id");
    CREATE INDEX "profile_badges_related_post_idx" ON "profile_badges" USING btree ("related_post_id");
    CREATE INDEX "profile_badges_updated_at_idx" ON "profile_badges" USING btree ("updated_at");
    CREATE INDEX "profile_badges_created_at_idx" ON "profile_badges" USING btree ("created_at");
    CREATE INDEX "profile_badges_rels_order_idx" ON "profile_badges_rels" USING btree ("order");
    CREATE INDEX "profile_badges_rels_parent_idx" ON "profile_badges_rels" USING btree ("parent_id");
    CREATE INDEX "profile_badges_rels_path_idx" ON "profile_badges_rels" USING btree ("path");
    CREATE INDEX "profile_badges_rels_profiles_id_idx" ON "profile_badges_rels" USING btree ("profiles_id");
    CREATE INDEX "payload_locked_documents_rels_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("badges_id");
    CREATE INDEX "payload_locked_documents_rels_profile_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_badges_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_profile_badges_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_badges_id_idx";
    DROP INDEX IF EXISTS "profile_badges_rels_profiles_id_idx";
    DROP INDEX IF EXISTS "profile_badges_rels_path_idx";
    DROP INDEX IF EXISTS "profile_badges_rels_parent_idx";
    DROP INDEX IF EXISTS "profile_badges_rels_order_idx";
    DROP INDEX IF EXISTS "profile_badges_created_at_idx";
    DROP INDEX IF EXISTS "profile_badges_updated_at_idx";
    DROP INDEX IF EXISTS "profile_badges_related_post_idx";
    DROP INDEX IF EXISTS "profile_badges_related_event_idx";
    DROP INDEX IF EXISTS "profile_badges_related_project_idx";
    DROP INDEX IF EXISTS "profile_badges_awarded_by_user_idx";
    DROP INDEX IF EXISTS "profile_badges_badge_idx";
    DROP INDEX IF EXISTS "badges_created_at_idx";
    DROP INDEX IF EXISTS "badges_updated_at_idx";
    DROP INDEX IF EXISTS "badges_slug_idx";
    DROP INDEX IF EXISTS "badges_artwork_idx";
    DROP INDEX IF EXISTS "badges_title_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_profile_badges_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_badges_fk";
    ALTER TABLE "profile_badges_rels" DROP CONSTRAINT IF EXISTS "profile_badges_rels_profiles_fk";
    ALTER TABLE "profile_badges_rels" DROP CONSTRAINT IF EXISTS "profile_badges_rels_parent_fk";
    ALTER TABLE "profile_badges" DROP CONSTRAINT IF EXISTS "profile_badges_related_post_id_posts_id_fk";
    ALTER TABLE "profile_badges" DROP CONSTRAINT IF EXISTS "profile_badges_related_event_id_events_id_fk";
    ALTER TABLE "profile_badges" DROP CONSTRAINT IF EXISTS "profile_badges_related_project_id_projects_id_fk";
    ALTER TABLE "profile_badges" DROP CONSTRAINT IF EXISTS "profile_badges_awarded_by_user_id_users_id_fk";
    ALTER TABLE "profile_badges" DROP CONSTRAINT IF EXISTS "profile_badges_badge_id_badges_id_fk";
    ALTER TABLE "badges" DROP CONSTRAINT IF EXISTS "badges_artwork_id_media_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "profile_badges_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "badges_id";
    DROP TABLE IF EXISTS "profile_badges_rels";
    DROP TABLE IF EXISTS "profile_badges";
    DROP TABLE IF EXISTS "badges";

    DROP TYPE IF EXISTS "public"."enum_profile_badges_visibility";
    DROP TYPE IF EXISTS "public"."enum_profile_badges_source";
    DROP TYPE IF EXISTS "public"."enum_badges_visibility";
    DROP TYPE IF EXISTS "public"."enum_badges_display_style";
    DROP TYPE IF EXISTS "public"."enum_badges_fallback_icon";
    DROP TYPE IF EXISTS "public"."enum_badges_category";
  `)
}
