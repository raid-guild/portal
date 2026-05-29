import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_contribution_requests_request_status" AS ENUM('open', 'in_discussion', 'filled', 'paused', 'archived');
    CREATE TYPE "public"."enum_contribution_requests_request_type" AS ENUM('good_first_contribution', 'help_wanted', 'review', 'feedback', 'collaborator', 'resource');
    CREATE TYPE "public"."enum_contribution_requests_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum_contribution_requests_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__contribution_requests_v_version_request_status" AS ENUM('open', 'in_discussion', 'filled', 'paused', 'archived');
    CREATE TYPE "public"."enum__contribution_requests_v_version_request_type" AS ENUM('good_first_contribution', 'help_wanted', 'review', 'feedback', 'collaborator', 'resource');
    CREATE TYPE "public"."enum__contribution_requests_v_version_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum__contribution_requests_v_version_status" AS ENUM('draft', 'published');

    CREATE TABLE "contribution_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "summary" varchar NOT NULL,
      "body" varchar,
      "request_status" "enum_contribution_requests_request_status" DEFAULT 'open' NOT NULL,
      "request_type" "enum_contribution_requests_request_type" DEFAULT 'help_wanted' NOT NULL,
      "owner_id" integer NOT NULL,
      "project_id" integer,
      "visibility" "enum_contribution_requests_visibility" DEFAULT 'public' NOT NULL,
      "response_u_r_l" varchar,
      "published_at" timestamp(3) with time zone,
      "slug" varchar,
      "slug_lock" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_contribution_requests_status" DEFAULT 'draft'
    );

    CREATE TABLE "contribution_requests_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "events_id" integer,
      "threads_id" integer,
      "posts_id" integer,
      "profiles_id" integer,
      "profile_skills_id" integer
    );

    CREATE TABLE "_contribution_requests_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_summary" varchar,
      "version_body" varchar,
      "version_request_status" "enum__contribution_requests_v_version_request_status" DEFAULT 'open',
      "version_request_type" "enum__contribution_requests_v_version_request_type" DEFAULT 'help_wanted',
      "version_owner_id" integer,
      "version_project_id" integer,
      "version_visibility" "enum__contribution_requests_v_version_visibility" DEFAULT 'public',
      "version_response_u_r_l" varchar,
      "version_published_at" timestamp(3) with time zone,
      "version_slug" varchar,
      "version_slug_lock" boolean DEFAULT true,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__contribution_requests_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );

    CREATE TABLE "_contribution_requests_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "events_id" integer,
      "threads_id" integer,
      "posts_id" integer,
      "profiles_id" integer,
      "profile_skills_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contribution_requests_id" integer;

    ALTER TABLE "contribution_requests" ADD CONSTRAINT "contribution_requests_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;
    ALTER TABLE "contribution_requests" ADD CONSTRAINT "contribution_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "contribution_requests_rels" ADD CONSTRAINT "contribution_requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contribution_requests"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "contribution_requests_rels" ADD CONSTRAINT "contribution_requests_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "contribution_requests_rels" ADD CONSTRAINT "contribution_requests_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "contribution_requests_rels" ADD CONSTRAINT "contribution_requests_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "contribution_requests_rels" ADD CONSTRAINT "contribution_requests_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "contribution_requests_rels" ADD CONSTRAINT "contribution_requests_rels_profile_skills_fk" FOREIGN KEY ("profile_skills_id") REFERENCES "public"."profile_skills"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v" ADD CONSTRAINT "_contribution_requests_v_parent_id_contribution_requests_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contribution_requests"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v" ADD CONSTRAINT "_contribution_requests_v_version_owner_id_profiles_id_fk" FOREIGN KEY ("version_owner_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v" ADD CONSTRAINT "_contribution_requests_v_version_project_id_projects_id_fk" FOREIGN KEY ("version_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v_rels" ADD CONSTRAINT "_contribution_requests_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_contribution_requests_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v_rels" ADD CONSTRAINT "_contribution_requests_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v_rels" ADD CONSTRAINT "_contribution_requests_v_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v_rels" ADD CONSTRAINT "_contribution_requests_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v_rels" ADD CONSTRAINT "_contribution_requests_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_contribution_requests_v_rels" ADD CONSTRAINT "_contribution_requests_v_rels_profile_skills_fk" FOREIGN KEY ("profile_skills_id") REFERENCES "public"."profile_skills"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contribution_requests_fk" FOREIGN KEY ("contribution_requests_id") REFERENCES "public"."contribution_requests"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "contribution_requests_request_status_idx" ON "contribution_requests" USING btree ("request_status");
    CREATE INDEX "contribution_requests_request_type_idx" ON "contribution_requests" USING btree ("request_type");
    CREATE INDEX "contribution_requests_owner_idx" ON "contribution_requests" USING btree ("owner_id");
    CREATE INDEX "contribution_requests_project_idx" ON "contribution_requests" USING btree ("project_id");
    CREATE INDEX "contribution_requests_visibility_idx" ON "contribution_requests" USING btree ("visibility");
    CREATE UNIQUE INDEX "contribution_requests_slug_idx" ON "contribution_requests" USING btree ("slug");
    CREATE INDEX "contribution_requests_updated_at_idx" ON "contribution_requests" USING btree ("updated_at");
    CREATE INDEX "contribution_requests_created_at_idx" ON "contribution_requests" USING btree ("created_at");
    CREATE INDEX "contribution_requests__status_idx" ON "contribution_requests" USING btree ("_status");
    CREATE INDEX "contribution_requests_rels_order_idx" ON "contribution_requests_rels" USING btree ("order");
    CREATE INDEX "contribution_requests_rels_parent_idx" ON "contribution_requests_rels" USING btree ("parent_id");
    CREATE INDEX "contribution_requests_rels_path_idx" ON "contribution_requests_rels" USING btree ("path");
    CREATE INDEX "contribution_requests_rels_events_id_idx" ON "contribution_requests_rels" USING btree ("events_id");
    CREATE INDEX "contribution_requests_rels_threads_id_idx" ON "contribution_requests_rels" USING btree ("threads_id");
    CREATE INDEX "contribution_requests_rels_posts_id_idx" ON "contribution_requests_rels" USING btree ("posts_id");
    CREATE INDEX "contribution_requests_rels_profiles_id_idx" ON "contribution_requests_rels" USING btree ("profiles_id");
    CREATE INDEX "contribution_requests_rels_profile_skills_id_idx" ON "contribution_requests_rels" USING btree ("profile_skills_id");
    CREATE INDEX "_contribution_requests_v_parent_idx" ON "_contribution_requests_v" USING btree ("parent_id");
    CREATE INDEX "_contribution_requests_v_version_version_owner_idx" ON "_contribution_requests_v" USING btree ("version_owner_id");
    CREATE INDEX "_contribution_requests_v_version_version_project_idx" ON "_contribution_requests_v" USING btree ("version_project_id");
    CREATE INDEX "_contribution_requests_v_version_version_updated_at_idx" ON "_contribution_requests_v" USING btree ("version_updated_at");
    CREATE INDEX "_contribution_requests_v_version_version_created_at_idx" ON "_contribution_requests_v" USING btree ("version_created_at");
    CREATE INDEX "_contribution_requests_v_version_version__status_idx" ON "_contribution_requests_v" USING btree ("version__status");
    CREATE INDEX "_contribution_requests_v_created_at_idx" ON "_contribution_requests_v" USING btree ("created_at");
    CREATE INDEX "_contribution_requests_v_updated_at_idx" ON "_contribution_requests_v" USING btree ("updated_at");
    CREATE INDEX "_contribution_requests_v_latest_idx" ON "_contribution_requests_v" USING btree ("latest");
    CREATE INDEX "_contribution_requests_v_rels_order_idx" ON "_contribution_requests_v_rels" USING btree ("order");
    CREATE INDEX "_contribution_requests_v_rels_parent_idx" ON "_contribution_requests_v_rels" USING btree ("parent_id");
    CREATE INDEX "_contribution_requests_v_rels_path_idx" ON "_contribution_requests_v_rels" USING btree ("path");
    CREATE INDEX "_contribution_requests_v_rels_events_id_idx" ON "_contribution_requests_v_rels" USING btree ("events_id");
    CREATE INDEX "_contribution_requests_v_rels_threads_id_idx" ON "_contribution_requests_v_rels" USING btree ("threads_id");
    CREATE INDEX "_contribution_requests_v_rels_posts_id_idx" ON "_contribution_requests_v_rels" USING btree ("posts_id");
    CREATE INDEX "_contribution_requests_v_rels_profiles_id_idx" ON "_contribution_requests_v_rels" USING btree ("profiles_id");
    CREATE INDEX "_contribution_requests_v_rels_profile_skills_id_idx" ON "_contribution_requests_v_rels" USING btree ("profile_skills_id");
    CREATE INDEX "payload_locked_documents_rels_contribution_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("contribution_requests_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_contribution_requests_v_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_contribution_requests_v" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "contribution_requests_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "contribution_requests" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_contribution_requests_id_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_profile_skills_id_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_profiles_id_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_posts_id_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_threads_id_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_events_id_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_path_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_parent_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_rels_order_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_latest_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_updated_at_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_created_at_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_version_version__status_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_version_version_created_at_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_version_version_updated_at_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_version_version_project_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_version_version_owner_idx";
    DROP INDEX IF EXISTS "_contribution_requests_v_parent_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_profile_skills_id_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_profiles_id_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_posts_id_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_threads_id_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_events_id_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_path_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_parent_idx";
    DROP INDEX IF EXISTS "contribution_requests_rels_order_idx";
    DROP INDEX IF EXISTS "contribution_requests__status_idx";
    DROP INDEX IF EXISTS "contribution_requests_created_at_idx";
    DROP INDEX IF EXISTS "contribution_requests_updated_at_idx";
    DROP INDEX IF EXISTS "contribution_requests_slug_idx";
    DROP INDEX IF EXISTS "contribution_requests_visibility_idx";
    DROP INDEX IF EXISTS "contribution_requests_project_idx";
    DROP INDEX IF EXISTS "contribution_requests_owner_idx";
    DROP INDEX IF EXISTS "contribution_requests_request_type_idx";
    DROP INDEX IF EXISTS "contribution_requests_request_status_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_contribution_requests_fk";
    ALTER TABLE "_contribution_requests_v_rels" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_rels_profile_skills_fk";
    ALTER TABLE "_contribution_requests_v_rels" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_rels_profiles_fk";
    ALTER TABLE "_contribution_requests_v_rels" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_rels_posts_fk";
    ALTER TABLE "_contribution_requests_v_rels" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_rels_threads_fk";
    ALTER TABLE "_contribution_requests_v_rels" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_rels_events_fk";
    ALTER TABLE "_contribution_requests_v_rels" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_rels_parent_fk";
    ALTER TABLE "_contribution_requests_v" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_version_project_id_projects_id_fk";
    ALTER TABLE "_contribution_requests_v" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_version_owner_id_profiles_id_fk";
    ALTER TABLE "_contribution_requests_v" DROP CONSTRAINT IF EXISTS "_contribution_requests_v_parent_id_contribution_requests_id_fk";
    ALTER TABLE "contribution_requests_rels" DROP CONSTRAINT IF EXISTS "contribution_requests_rels_profile_skills_fk";
    ALTER TABLE "contribution_requests_rels" DROP CONSTRAINT IF EXISTS "contribution_requests_rels_profiles_fk";
    ALTER TABLE "contribution_requests_rels" DROP CONSTRAINT IF EXISTS "contribution_requests_rels_posts_fk";
    ALTER TABLE "contribution_requests_rels" DROP CONSTRAINT IF EXISTS "contribution_requests_rels_threads_fk";
    ALTER TABLE "contribution_requests_rels" DROP CONSTRAINT IF EXISTS "contribution_requests_rels_events_fk";
    ALTER TABLE "contribution_requests_rels" DROP CONSTRAINT IF EXISTS "contribution_requests_rels_parent_fk";
    ALTER TABLE "contribution_requests" DROP CONSTRAINT IF EXISTS "contribution_requests_project_id_projects_id_fk";
    ALTER TABLE "contribution_requests" DROP CONSTRAINT IF EXISTS "contribution_requests_owner_id_profiles_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "contribution_requests_id";
    DROP TABLE IF EXISTS "_contribution_requests_v_rels";
    DROP TABLE IF EXISTS "_contribution_requests_v";
    DROP TABLE IF EXISTS "contribution_requests_rels";
    DROP TABLE IF EXISTS "contribution_requests";

    DROP TYPE IF EXISTS "public"."enum__contribution_requests_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__contribution_requests_v_version_visibility";
    DROP TYPE IF EXISTS "public"."enum__contribution_requests_v_version_request_type";
    DROP TYPE IF EXISTS "public"."enum__contribution_requests_v_version_request_status";
    DROP TYPE IF EXISTS "public"."enum_contribution_requests_status";
    DROP TYPE IF EXISTS "public"."enum_contribution_requests_visibility";
    DROP TYPE IF EXISTS "public"."enum_contribution_requests_request_type";
    DROP TYPE IF EXISTS "public"."enum_contribution_requests_request_status";
  `)
}
