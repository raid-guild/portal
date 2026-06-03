import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_spotlights_kind" AS ENUM('featured', 'announcement');
    CREATE TYPE "public"."enum_spotlights_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum_spotlights_target_type" AS ENUM('thread', 'event', 'project', 'post', 'profile', 'external', 'artifact');
    CREATE TYPE "public"."enum_spotlights_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__spotlights_v_version_kind" AS ENUM('featured', 'announcement');
    CREATE TYPE "public"."enum__spotlights_v_version_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum__spotlights_v_version_target_type" AS ENUM('thread', 'event', 'project', 'post', 'profile', 'external', 'artifact');
    CREATE TYPE "public"."enum__spotlights_v_version_status" AS ENUM('draft', 'published');

    CREATE TABLE "spotlights" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "summary" varchar,
      "kind" "enum_spotlights_kind" DEFAULT 'featured' NOT NULL,
      "visibility" "enum_spotlights_visibility" DEFAULT 'public' NOT NULL,
      "starts_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone,
      "priority" numeric DEFAULT 0,
      "target_type" "enum_spotlights_target_type" DEFAULT 'thread' NOT NULL,
      "target_thread_id" integer,
      "target_event_id" integer,
      "target_project_id" integer,
      "target_post_id" integer,
      "target_profile_id" integer,
      "external_u_r_l" varchar,
      "artifact_u_r_l" varchar,
      "cta_label" varchar,
      "image_id" integer,
      "created_by_id" integer,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_spotlights_status" DEFAULT 'draft'
    );

    CREATE TABLE "_spotlights_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_summary" varchar,
      "version_kind" "enum__spotlights_v_version_kind" DEFAULT 'featured',
      "version_visibility" "enum__spotlights_v_version_visibility" DEFAULT 'public',
      "version_starts_at" timestamp(3) with time zone,
      "version_expires_at" timestamp(3) with time zone,
      "version_priority" numeric DEFAULT 0,
      "version_target_type" "enum__spotlights_v_version_target_type" DEFAULT 'thread',
      "version_target_thread_id" integer,
      "version_target_event_id" integer,
      "version_target_project_id" integer,
      "version_target_post_id" integer,
      "version_target_profile_id" integer,
      "version_external_u_r_l" varchar,
      "version_artifact_u_r_l" varchar,
      "version_cta_label" varchar,
      "version_image_id" integer,
      "version_created_by_id" integer,
      "version_published_at" timestamp(3) with time zone,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__spotlights_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "spotlights_id" integer;

    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_target_thread_id_threads_id_fk" FOREIGN KEY ("target_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_target_event_id_events_id_fk" FOREIGN KEY ("target_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_target_project_id_projects_id_fk" FOREIGN KEY ("target_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_target_post_id_posts_id_fk" FOREIGN KEY ("target_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_target_profile_id_profiles_id_fk" FOREIGN KEY ("target_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_parent_id_spotlights_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."spotlights"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_target_thread_id_threads_id_fk" FOREIGN KEY ("version_target_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_target_event_id_events_id_fk" FOREIGN KEY ("version_target_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_target_project_id_projects_id_fk" FOREIGN KEY ("version_target_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_target_post_id_posts_id_fk" FOREIGN KEY ("version_target_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_target_profile_id_profiles_id_fk" FOREIGN KEY ("version_target_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_spotlights_v" ADD CONSTRAINT "_spotlights_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spotlights_fk" FOREIGN KEY ("spotlights_id") REFERENCES "public"."spotlights"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "spotlights_kind_idx" ON "spotlights" USING btree ("kind");
    CREATE INDEX "spotlights_visibility_idx" ON "spotlights" USING btree ("visibility");
    CREATE INDEX "spotlights_starts_at_idx" ON "spotlights" USING btree ("starts_at");
    CREATE INDEX "spotlights_expires_at_idx" ON "spotlights" USING btree ("expires_at");
    CREATE INDEX "spotlights_priority_idx" ON "spotlights" USING btree ("priority");
    CREATE INDEX "spotlights_target_thread_idx" ON "spotlights" USING btree ("target_thread_id");
    CREATE INDEX "spotlights_target_event_idx" ON "spotlights" USING btree ("target_event_id");
    CREATE INDEX "spotlights_target_project_idx" ON "spotlights" USING btree ("target_project_id");
    CREATE INDEX "spotlights_target_post_idx" ON "spotlights" USING btree ("target_post_id");
    CREATE INDEX "spotlights_target_profile_idx" ON "spotlights" USING btree ("target_profile_id");
    CREATE INDEX "spotlights_image_idx" ON "spotlights" USING btree ("image_id");
    CREATE INDEX "spotlights_created_by_idx" ON "spotlights" USING btree ("created_by_id");
    CREATE INDEX "spotlights_updated_at_idx" ON "spotlights" USING btree ("updated_at");
    CREATE INDEX "spotlights_created_at_idx" ON "spotlights" USING btree ("created_at");
    CREATE INDEX "spotlights__status_idx" ON "spotlights" USING btree ("_status");
    CREATE INDEX "_spotlights_v_parent_idx" ON "_spotlights_v" USING btree ("parent_id");
    CREATE INDEX "_spotlights_v_version_version_starts_at_idx" ON "_spotlights_v" USING btree ("version_starts_at");
    CREATE INDEX "_spotlights_v_version_version_expires_at_idx" ON "_spotlights_v" USING btree ("version_expires_at");
    CREATE INDEX "_spotlights_v_version_version_target_thread_idx" ON "_spotlights_v" USING btree ("version_target_thread_id");
    CREATE INDEX "_spotlights_v_version_version_target_event_idx" ON "_spotlights_v" USING btree ("version_target_event_id");
    CREATE INDEX "_spotlights_v_version_version_target_project_idx" ON "_spotlights_v" USING btree ("version_target_project_id");
    CREATE INDEX "_spotlights_v_version_version_target_post_idx" ON "_spotlights_v" USING btree ("version_target_post_id");
    CREATE INDEX "_spotlights_v_version_version_target_profile_idx" ON "_spotlights_v" USING btree ("version_target_profile_id");
    CREATE INDEX "_spotlights_v_version_version_image_idx" ON "_spotlights_v" USING btree ("version_image_id");
    CREATE INDEX "_spotlights_v_version_version_created_by_idx" ON "_spotlights_v" USING btree ("version_created_by_id");
    CREATE INDEX "_spotlights_v_version_version_updated_at_idx" ON "_spotlights_v" USING btree ("version_updated_at");
    CREATE INDEX "_spotlights_v_version_version_created_at_idx" ON "_spotlights_v" USING btree ("version_created_at");
    CREATE INDEX "_spotlights_v_version_version__status_idx" ON "_spotlights_v" USING btree ("version__status");
    CREATE INDEX "_spotlights_v_created_at_idx" ON "_spotlights_v" USING btree ("created_at");
    CREATE INDEX "_spotlights_v_updated_at_idx" ON "_spotlights_v" USING btree ("updated_at");
    CREATE INDEX "payload_locked_documents_rels_spotlights_id_idx" ON "payload_locked_documents_rels" USING btree ("spotlights_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_spotlights_v" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "spotlights" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_spotlights_id_idx";
    DROP INDEX IF EXISTS "_spotlights_v_updated_at_idx";
    DROP INDEX IF EXISTS "_spotlights_v_created_at_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version__status_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_created_at_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_updated_at_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_created_by_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_image_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_target_profile_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_target_post_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_target_project_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_target_event_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_target_thread_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_expires_at_idx";
    DROP INDEX IF EXISTS "_spotlights_v_version_version_starts_at_idx";
    DROP INDEX IF EXISTS "_spotlights_v_parent_idx";
    DROP INDEX IF EXISTS "spotlights__status_idx";
    DROP INDEX IF EXISTS "spotlights_created_at_idx";
    DROP INDEX IF EXISTS "spotlights_updated_at_idx";
    DROP INDEX IF EXISTS "spotlights_created_by_idx";
    DROP INDEX IF EXISTS "spotlights_image_idx";
    DROP INDEX IF EXISTS "spotlights_target_profile_idx";
    DROP INDEX IF EXISTS "spotlights_target_post_idx";
    DROP INDEX IF EXISTS "spotlights_target_project_idx";
    DROP INDEX IF EXISTS "spotlights_target_event_idx";
    DROP INDEX IF EXISTS "spotlights_target_thread_idx";
    DROP INDEX IF EXISTS "spotlights_priority_idx";
    DROP INDEX IF EXISTS "spotlights_expires_at_idx";
    DROP INDEX IF EXISTS "spotlights_starts_at_idx";
    DROP INDEX IF EXISTS "spotlights_visibility_idx";
    DROP INDEX IF EXISTS "spotlights_kind_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_spotlights_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_created_by_id_users_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_image_id_media_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_target_profile_id_profiles_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_target_post_id_posts_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_target_project_id_projects_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_target_event_id_events_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_version_target_thread_id_threads_id_fk";
    ALTER TABLE "_spotlights_v" DROP CONSTRAINT IF EXISTS "_spotlights_v_parent_id_spotlights_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_created_by_id_users_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_image_id_media_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_target_profile_id_profiles_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_target_post_id_posts_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_target_project_id_projects_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_target_event_id_events_id_fk";
    ALTER TABLE "spotlights" DROP CONSTRAINT IF EXISTS "spotlights_target_thread_id_threads_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "spotlights_id";
    DROP TABLE IF EXISTS "_spotlights_v";
    DROP TABLE IF EXISTS "spotlights";

    DROP TYPE IF EXISTS "public"."enum__spotlights_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__spotlights_v_version_target_type";
    DROP TYPE IF EXISTS "public"."enum__spotlights_v_version_visibility";
    DROP TYPE IF EXISTS "public"."enum__spotlights_v_version_kind";
    DROP TYPE IF EXISTS "public"."enum_spotlights_status";
    DROP TYPE IF EXISTS "public"."enum_spotlights_target_type";
    DROP TYPE IF EXISTS "public"."enum_spotlights_visibility";
    DROP TYPE IF EXISTS "public"."enum_spotlights_kind";
  `)
}
