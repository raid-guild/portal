import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cohorts_program_status" AS ENUM('draft', 'upcoming', 'active', 'complete', 'archived');
  CREATE TYPE "public"."enum_cohorts_enrollment_status" AS ENUM('closed', 'open', 'waitlist');
  CREATE TYPE "public"."enum_cohorts_visual_variant" AS ENUM('guild', 'scroll', 'moloch');
  CREATE TYPE "public"."enum_cohorts_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
  CREATE TYPE "public"."enum_cohorts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cohorts_v_version_program_status" AS ENUM('draft', 'upcoming', 'active', 'complete', 'archived');
  CREATE TYPE "public"."enum__cohorts_v_version_enrollment_status" AS ENUM('closed', 'open', 'waitlist');
  CREATE TYPE "public"."enum__cohorts_v_version_visual_variant" AS ENUM('guild', 'scroll', 'moloch');
  CREATE TYPE "public"."enum__cohorts_v_version_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
  CREATE TYPE "public"."enum__cohorts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_cohort_commitments_status" AS ENUM('committed', 'waitlisted', 'withdrawn');
  ALTER TYPE "public"."enum_events_session_type" ADD VALUE 'kickoff';
  ALTER TYPE "public"."enum_events_session_type" ADD VALUE 'office-hours';
  ALTER TYPE "public"."enum_events_session_type" ADD VALUE 'guest-talk';
  ALTER TYPE "public"."enum__events_v_version_session_type" ADD VALUE 'kickoff';
  ALTER TYPE "public"."enum__events_v_version_session_type" ADD VALUE 'office-hours';
  ALTER TYPE "public"."enum__events_v_version_session_type" ADD VALUE 'guest-talk';
  CREATE TABLE "cohorts_starter_topics" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "title" varchar,
   "summary" varchar,
   "url" varchar
  );

  CREATE TABLE "cohorts_program_sections" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "heading" varchar,
   "body" varchar
  );

  CREATE TABLE "cohorts" (
   "id" serial PRIMARY KEY NOT NULL,
   "title" varchar,
   "slug" varchar,
   "slug_lock" boolean DEFAULT true,
   "cohort_number" numeric,
   "summary" varchar,
   "theme" varchar,
   "thesis" varchar,
   "program_status" "enum_cohorts_program_status" DEFAULT 'upcoming',
   "enrollment_status" "enum_cohorts_enrollment_status" DEFAULT 'closed',
   "starts_at" timestamp(3) with time zone,
   "ends_at" timestamp(3) with time zone,
   "enrollment_opens_at" timestamp(3) with time zone,
   "enrollment_closes_at" timestamp(3) with time zone,
   "participation_expectation" varchar,
   "capacity" numeric,
   "hero_media_id" integer,
   "visual_variant" "enum_cohorts_visual_variant" DEFAULT 'guild',
   "highlighted_thread_id" integer,
   "visibility" "enum_cohorts_visibility" DEFAULT 'public',
   "published_at" timestamp(3) with time zone,
   "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "_status" "enum_cohorts_status" DEFAULT 'draft'
  );

  CREATE TABLE "cohorts_rels" (
   "id" serial PRIMARY KEY NOT NULL,
   "order" integer,
   "parent_id" integer NOT NULL,
   "path" varchar NOT NULL,
   "posts_id" integer,
   "projects_id" integer,
   "modules_id" integer
  );

  CREATE TABLE "_cohorts_v_version_starter_topics" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "title" varchar,
   "summary" varchar,
   "url" varchar,
   "_uuid" varchar
  );

  CREATE TABLE "_cohorts_v_version_program_sections" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "heading" varchar,
   "body" varchar,
   "_uuid" varchar
  );

  CREATE TABLE "_cohorts_v" (
   "id" serial PRIMARY KEY NOT NULL,
   "parent_id" integer,
   "version_title" varchar,
   "version_slug" varchar,
   "version_slug_lock" boolean DEFAULT true,
   "version_cohort_number" numeric,
   "version_summary" varchar,
   "version_theme" varchar,
   "version_thesis" varchar,
   "version_program_status" "enum__cohorts_v_version_program_status" DEFAULT 'upcoming',
   "version_enrollment_status" "enum__cohorts_v_version_enrollment_status" DEFAULT 'closed',
   "version_starts_at" timestamp(3) with time zone,
   "version_ends_at" timestamp(3) with time zone,
   "version_enrollment_opens_at" timestamp(3) with time zone,
   "version_enrollment_closes_at" timestamp(3) with time zone,
   "version_participation_expectation" varchar,
   "version_capacity" numeric,
   "version_hero_media_id" integer,
   "version_visual_variant" "enum__cohorts_v_version_visual_variant" DEFAULT 'guild',
   "version_highlighted_thread_id" integer,
   "version_visibility" "enum__cohorts_v_version_visibility" DEFAULT 'public',
   "version_published_at" timestamp(3) with time zone,
   "version_updated_at" timestamp(3) with time zone,
   "version_created_at" timestamp(3) with time zone,
   "version__status" "enum__cohorts_v_version_status" DEFAULT 'draft',
   "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "latest" boolean,
   "autosave" boolean
  );

  CREATE TABLE "_cohorts_v_rels" (
   "id" serial PRIMARY KEY NOT NULL,
   "order" integer,
   "parent_id" integer NOT NULL,
   "path" varchar NOT NULL,
   "posts_id" integer,
   "projects_id" integer,
   "modules_id" integer
  );

  CREATE TABLE "cohort_commitments" (
   "id" serial PRIMARY KEY NOT NULL,
   "cohort_id" integer NOT NULL,
   "profile_id" integer NOT NULL,
   "status" "enum_cohort_commitments_status" DEFAULT 'committed' NOT NULL,
   "short_response" varchar,
   "expectations_acknowledged_at" timestamp(3) with time zone,
   "committed_at" timestamp(3) with time zone,
   "withdrawn_at" timestamp(3) with time zone,
   "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "events_rels" ADD COLUMN "cohorts_id" integer;
  ALTER TABLE "_events_v_rels" ADD COLUMN "cohorts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cohorts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cohort_commitments_id" integer;
  ALTER TABLE "cohorts_starter_topics" ADD CONSTRAINT "cohorts_starter_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cohorts_program_sections" ADD CONSTRAINT "cohorts_program_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_highlighted_thread_id_threads_id_fk" FOREIGN KEY ("highlighted_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cohorts_rels" ADD CONSTRAINT "cohorts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cohorts_rels" ADD CONSTRAINT "cohorts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cohorts_rels" ADD CONSTRAINT "cohorts_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cohorts_rels" ADD CONSTRAINT "cohorts_rels_modules_fk" FOREIGN KEY ("modules_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v_version_starter_topics" ADD CONSTRAINT "_cohorts_v_version_starter_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cohorts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v_version_program_sections" ADD CONSTRAINT "_cohorts_v_version_program_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cohorts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v" ADD CONSTRAINT "_cohorts_v_parent_id_cohorts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cohorts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cohorts_v" ADD CONSTRAINT "_cohorts_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cohorts_v" ADD CONSTRAINT "_cohorts_v_version_highlighted_thread_id_threads_id_fk" FOREIGN KEY ("version_highlighted_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cohorts_v_rels" ADD CONSTRAINT "_cohorts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cohorts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v_rels" ADD CONSTRAINT "_cohorts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v_rels" ADD CONSTRAINT "_cohorts_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cohorts_v_rels" ADD CONSTRAINT "_cohorts_v_rels_modules_fk" FOREIGN KEY ("modules_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cohort_commitments" ADD CONSTRAINT "cohort_commitments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cohort_commitments" ADD CONSTRAINT "cohort_commitments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "cohorts_starter_topics_order_idx" ON "cohorts_starter_topics" USING btree ("_order");
  CREATE INDEX "cohorts_starter_topics_parent_id_idx" ON "cohorts_starter_topics" USING btree ("_parent_id");
  CREATE INDEX "cohorts_program_sections_order_idx" ON "cohorts_program_sections" USING btree ("_order");
  CREATE INDEX "cohorts_program_sections_parent_id_idx" ON "cohorts_program_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "cohorts_slug_idx" ON "cohorts" USING btree ("slug");
  CREATE INDEX "cohorts_cohort_number_idx" ON "cohorts" USING btree ("cohort_number");
  CREATE INDEX "cohorts_program_status_idx" ON "cohorts" USING btree ("program_status");
  CREATE INDEX "cohorts_enrollment_status_idx" ON "cohorts" USING btree ("enrollment_status");
  CREATE INDEX "cohorts_starts_at_idx" ON "cohorts" USING btree ("starts_at");
  CREATE INDEX "cohorts_hero_media_idx" ON "cohorts" USING btree ("hero_media_id");
  CREATE INDEX "cohorts_highlighted_thread_idx" ON "cohorts" USING btree ("highlighted_thread_id");
  CREATE INDEX "cohorts_visibility_idx" ON "cohorts" USING btree ("visibility");
  CREATE INDEX "cohorts_updated_at_idx" ON "cohorts" USING btree ("updated_at");
  CREATE INDEX "cohorts_created_at_idx" ON "cohorts" USING btree ("created_at");
  CREATE INDEX "cohorts__status_idx" ON "cohorts" USING btree ("_status");
  CREATE INDEX "cohorts_rels_order_idx" ON "cohorts_rels" USING btree ("order");
  CREATE INDEX "cohorts_rels_parent_idx" ON "cohorts_rels" USING btree ("parent_id");
  CREATE INDEX "cohorts_rels_path_idx" ON "cohorts_rels" USING btree ("path");
  CREATE INDEX "cohorts_rels_posts_id_idx" ON "cohorts_rels" USING btree ("posts_id");
  CREATE INDEX "cohorts_rels_projects_id_idx" ON "cohorts_rels" USING btree ("projects_id");
  CREATE INDEX "cohorts_rels_modules_id_idx" ON "cohorts_rels" USING btree ("modules_id");
  CREATE INDEX "_cohorts_v_version_starter_topics_order_idx" ON "_cohorts_v_version_starter_topics" USING btree ("_order");
  CREATE INDEX "_cohorts_v_version_starter_topics_parent_id_idx" ON "_cohorts_v_version_starter_topics" USING btree ("_parent_id");
  CREATE INDEX "_cohorts_v_version_program_sections_order_idx" ON "_cohorts_v_version_program_sections" USING btree ("_order");
  CREATE INDEX "_cohorts_v_version_program_sections_parent_id_idx" ON "_cohorts_v_version_program_sections" USING btree ("_parent_id");
  CREATE INDEX "_cohorts_v_parent_idx" ON "_cohorts_v" USING btree ("parent_id");
  CREATE INDEX "_cohorts_v_version_version_slug_idx" ON "_cohorts_v" USING btree ("version_slug");
  CREATE INDEX "_cohorts_v_version_version_cohort_number_idx" ON "_cohorts_v" USING btree ("version_cohort_number");
  CREATE INDEX "_cohorts_v_version_version_program_status_idx" ON "_cohorts_v" USING btree ("version_program_status");
  CREATE INDEX "_cohorts_v_version_version_enrollment_status_idx" ON "_cohorts_v" USING btree ("version_enrollment_status");
  CREATE INDEX "_cohorts_v_version_version_starts_at_idx" ON "_cohorts_v" USING btree ("version_starts_at");
  CREATE INDEX "_cohorts_v_version_version_hero_media_idx" ON "_cohorts_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_cohorts_v_version_version_highlighted_thread_idx" ON "_cohorts_v" USING btree ("version_highlighted_thread_id");
  CREATE INDEX "_cohorts_v_version_version_visibility_idx" ON "_cohorts_v" USING btree ("version_visibility");
  CREATE INDEX "_cohorts_v_version_version_updated_at_idx" ON "_cohorts_v" USING btree ("version_updated_at");
  CREATE INDEX "_cohorts_v_version_version_created_at_idx" ON "_cohorts_v" USING btree ("version_created_at");
  CREATE INDEX "_cohorts_v_version_version__status_idx" ON "_cohorts_v" USING btree ("version__status");
  CREATE INDEX "_cohorts_v_created_at_idx" ON "_cohorts_v" USING btree ("created_at");
  CREATE INDEX "_cohorts_v_updated_at_idx" ON "_cohorts_v" USING btree ("updated_at");
  CREATE INDEX "_cohorts_v_latest_idx" ON "_cohorts_v" USING btree ("latest");
  CREATE INDEX "_cohorts_v_autosave_idx" ON "_cohorts_v" USING btree ("autosave");
  CREATE INDEX "_cohorts_v_rels_order_idx" ON "_cohorts_v_rels" USING btree ("order");
  CREATE INDEX "_cohorts_v_rels_parent_idx" ON "_cohorts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_cohorts_v_rels_path_idx" ON "_cohorts_v_rels" USING btree ("path");
  CREATE INDEX "_cohorts_v_rels_posts_id_idx" ON "_cohorts_v_rels" USING btree ("posts_id");
  CREATE INDEX "_cohorts_v_rels_projects_id_idx" ON "_cohorts_v_rels" USING btree ("projects_id");
  CREATE INDEX "_cohorts_v_rels_modules_id_idx" ON "_cohorts_v_rels" USING btree ("modules_id");
  CREATE INDEX "cohort_commitments_cohort_idx" ON "cohort_commitments" USING btree ("cohort_id");
  CREATE INDEX "cohort_commitments_profile_idx" ON "cohort_commitments" USING btree ("profile_id");
  CREATE INDEX "cohort_commitments_status_idx" ON "cohort_commitments" USING btree ("status");
  CREATE INDEX "cohort_commitments_updated_at_idx" ON "cohort_commitments" USING btree ("updated_at");
  CREATE INDEX "cohort_commitments_created_at_idx" ON "cohort_commitments" USING btree ("created_at");
  CREATE UNIQUE INDEX "cohort_profile_idx" ON "cohort_commitments" USING btree ("cohort_id","profile_id");
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_cohorts_fk" FOREIGN KEY ("cohorts_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_cohorts_fk" FOREIGN KEY ("cohorts_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cohorts_fk" FOREIGN KEY ("cohorts_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cohort_commitments_fk" FOREIGN KEY ("cohort_commitments_id") REFERENCES "public"."cohort_commitments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_rels_cohorts_id_idx" ON "events_rels" USING btree ("cohorts_id");
  CREATE INDEX "_events_v_rels_cohorts_id_idx" ON "_events_v_rels" USING btree ("cohorts_id");
  CREATE INDEX "payload_locked_documents_rels_cohorts_id_idx" ON "payload_locked_documents_rels" USING btree ("cohorts_id");
  CREATE INDEX "payload_locked_documents_rels_cohort_commitments_id_idx" ON "payload_locked_documents_rels" USING btree ("cohort_commitments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cohorts_starter_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cohorts_program_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cohorts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cohorts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cohorts_v_version_starter_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cohorts_v_version_program_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cohorts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cohorts_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cohort_commitments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cohorts_starter_topics" CASCADE;
  DROP TABLE "cohorts_program_sections" CASCADE;
  DROP TABLE "cohorts" CASCADE;
  DROP TABLE "cohorts_rels" CASCADE;
  DROP TABLE "_cohorts_v_version_starter_topics" CASCADE;
  DROP TABLE "_cohorts_v_version_program_sections" CASCADE;
  DROP TABLE "_cohorts_v" CASCADE;
  DROP TABLE "_cohorts_v_rels" CASCADE;
  DROP TABLE "cohort_commitments" CASCADE;
  ALTER TABLE "events_rels" DROP CONSTRAINT "events_rels_cohorts_fk";

  ALTER TABLE "_events_v_rels" DROP CONSTRAINT "_events_v_rels_cohorts_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cohorts_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cohort_commitments_fk";

  ALTER TABLE "events" ALTER COLUMN "session_type" SET DATA TYPE text;
  ALTER TABLE "events" ALTER COLUMN "session_type" SET DEFAULT 'brownbag'::text;
  DROP TYPE "public"."enum_events_session_type";
  CREATE TYPE "public"."enum_events_session_type" AS ENUM('brownbag', 'workshop', 'all-hands', 'demo', 'pitch', 'fireside');
  ALTER TABLE "events" ALTER COLUMN "session_type" SET DEFAULT 'brownbag'::"public"."enum_events_session_type";
  ALTER TABLE "events" ALTER COLUMN "session_type" SET DATA TYPE "public"."enum_events_session_type" USING "session_type"::"public"."enum_events_session_type";
  ALTER TABLE "_events_v" ALTER COLUMN "version_session_type" SET DATA TYPE text;
  ALTER TABLE "_events_v" ALTER COLUMN "version_session_type" SET DEFAULT 'brownbag'::text;
  DROP TYPE "public"."enum__events_v_version_session_type";
  CREATE TYPE "public"."enum__events_v_version_session_type" AS ENUM('brownbag', 'workshop', 'all-hands', 'demo', 'pitch', 'fireside');
  ALTER TABLE "_events_v" ALTER COLUMN "version_session_type" SET DEFAULT 'brownbag'::"public"."enum__events_v_version_session_type";
  ALTER TABLE "_events_v" ALTER COLUMN "version_session_type" SET DATA TYPE "public"."enum__events_v_version_session_type" USING "version_session_type"::"public"."enum__events_v_version_session_type";
  DROP INDEX "events_rels_cohorts_id_idx";
  DROP INDEX "_events_v_rels_cohorts_id_idx";
  DROP INDEX "payload_locked_documents_rels_cohorts_id_idx";
  DROP INDEX "payload_locked_documents_rels_cohort_commitments_id_idx";
  ALTER TABLE "events_rels" DROP COLUMN "cohorts_id";
  ALTER TABLE "_events_v_rels" DROP COLUMN "cohorts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cohorts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cohort_commitments_id";
  DROP TYPE "public"."enum_cohorts_program_status";
  DROP TYPE "public"."enum_cohorts_enrollment_status";
  DROP TYPE "public"."enum_cohorts_visual_variant";
  DROP TYPE "public"."enum_cohorts_visibility";
  DROP TYPE "public"."enum_cohorts_status";
  DROP TYPE "public"."enum__cohorts_v_version_program_status";
  DROP TYPE "public"."enum__cohorts_v_version_enrollment_status";
  DROP TYPE "public"."enum__cohorts_v_version_visual_variant";
  DROP TYPE "public"."enum__cohorts_v_version_visibility";
  DROP TYPE "public"."enum__cohorts_v_version_status";
  DROP TYPE "public"."enum_cohort_commitments_status";`)
}
