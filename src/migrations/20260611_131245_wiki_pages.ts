import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_wiki_pages_source_artifacts_source_type" AS ENUM('prism', 'session', 'post', 'paper', 'blog', 'hackerNews', 'tool', 'external');
    CREATE TYPE "public"."enum_wiki_pages_review_status" AS ENUM('generated_draft', 'needs_review', 'reviewed', 'needs_refresh', 'archived');
    CREATE TYPE "public"."enum_wiki_pages_confidence" AS ENUM('low', 'medium', 'high');
    CREATE TYPE "public"."enum_wiki_pages_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum_wiki_pages_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__wiki_pages_v_version_source_artifacts_source_type" AS ENUM('prism', 'session', 'post', 'paper', 'blog', 'hackerNews', 'tool', 'external');
    CREATE TYPE "public"."enum__wiki_pages_v_version_review_status" AS ENUM('generated_draft', 'needs_review', 'reviewed', 'needs_refresh', 'archived');
    CREATE TYPE "public"."enum__wiki_pages_v_version_confidence" AS ENUM('low', 'medium', 'high');
    CREATE TYPE "public"."enum__wiki_pages_v_version_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum__wiki_pages_v_version_status" AS ENUM('draft', 'published');

    CREATE TABLE "wiki_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "summary" varchar,
      "body" jsonb,
      "review_status" "enum_wiki_pages_review_status" DEFAULT 'generated_draft',
      "confidence" "enum_wiki_pages_confidence" DEFAULT 'medium',
      "last_reviewed_at" timestamp(3) with time zone,
      "last_refreshed_at" timestamp(3) with time zone,
      "generated_at" timestamp(3) with time zone,
      "prompt_version" varchar,
      "model" varchar,
      "published_at" timestamp(3) with time zone,
      "visibility" "enum_wiki_pages_visibility" DEFAULT 'authenticated',
      "slug" varchar,
      "slug_lock" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_wiki_pages_status" DEFAULT 'draft'
    );

    CREATE TABLE "wiki_pages_key_claims" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "claim" varchar,
      "source_label" varchar
    );
    CREATE TABLE "wiki_pages_further_reading" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar DEFAULT 'Reference',
      "url" varchar,
      "note" varchar
    );
    CREATE TABLE "wiki_pages_papers" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar DEFAULT 'Paper',
      "url" varchar,
      "note" varchar
    );
    CREATE TABLE "wiki_pages_tools" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar DEFAULT 'Tool',
      "url" varchar,
      "note" varchar
    );
    CREATE TABLE "wiki_pages_open_questions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar
    );
    CREATE TABLE "wiki_pages_prompts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "prompt" varchar
    );
    CREATE TABLE "wiki_pages_related_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar
    );
    CREATE TABLE "wiki_pages_possible_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar
    );
    CREATE TABLE "wiki_pages_source_artifacts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "artifact_i_d" varchar,
      "source_type" "enum_wiki_pages_source_artifacts_source_type" DEFAULT 'prism',
      "url" varchar,
      "source_query" varchar,
      "observed_at" timestamp(3) with time zone
    );
    CREATE TABLE "wiki_pages_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "events_id" integer,
      "posts_id" integer,
      "projects_id" integer,
      "threads_id" integer,
      "profiles_id" integer,
      "activity_items_id" integer
    );

    CREATE TABLE "_wiki_pages_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_summary" varchar,
      "version_body" jsonb,
      "version_review_status" "enum__wiki_pages_v_version_review_status" DEFAULT 'generated_draft',
      "version_confidence" "enum__wiki_pages_v_version_confidence" DEFAULT 'medium',
      "version_last_reviewed_at" timestamp(3) with time zone,
      "version_last_refreshed_at" timestamp(3) with time zone,
      "version_generated_at" timestamp(3) with time zone,
      "version_prompt_version" varchar,
      "version_model" varchar,
      "version_published_at" timestamp(3) with time zone,
      "version_visibility" "enum__wiki_pages_v_version_visibility" DEFAULT 'authenticated',
      "version_slug" varchar,
      "version_slug_lock" boolean DEFAULT true,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__wiki_pages_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );

    CREATE TABLE "_wiki_pages_v_version_key_claims" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "claim" varchar,
      "source_label" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_further_reading" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar DEFAULT 'Reference',
      "url" varchar,
      "note" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_papers" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar DEFAULT 'Paper',
      "url" varchar,
      "note" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_tools" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar DEFAULT 'Tool',
      "url" varchar,
      "note" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_open_questions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_prompts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "prompt" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_related_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "topic" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_possible_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "topic" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_version_source_artifacts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "artifact_i_d" varchar,
      "source_type" "enum__wiki_pages_v_version_source_artifacts_source_type" DEFAULT 'prism',
      "url" varchar,
      "source_query" varchar,
      "observed_at" timestamp(3) with time zone,
      "_uuid" varchar
    );
    CREATE TABLE "_wiki_pages_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "events_id" integer,
      "posts_id" integer,
      "projects_id" integer,
      "threads_id" integer,
      "profiles_id" integer,
      "activity_items_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "wiki_pages_id" integer;

    ALTER TABLE "wiki_pages_key_claims" ADD CONSTRAINT "wiki_pages_key_claims_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_further_reading" ADD CONSTRAINT "wiki_pages_further_reading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_papers" ADD CONSTRAINT "wiki_pages_papers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_tools" ADD CONSTRAINT "wiki_pages_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_open_questions" ADD CONSTRAINT "wiki_pages_open_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_prompts" ADD CONSTRAINT "wiki_pages_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_related_topics" ADD CONSTRAINT "wiki_pages_related_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_possible_topics" ADD CONSTRAINT "wiki_pages_possible_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_source_artifacts" ADD CONSTRAINT "wiki_pages_source_artifacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_pages_rels" ADD CONSTRAINT "wiki_pages_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_wiki_pages_v" ADD CONSTRAINT "_wiki_pages_v_parent_id_wiki_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_pages"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_key_claims" ADD CONSTRAINT "_wiki_pages_v_version_key_claims_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_further_reading" ADD CONSTRAINT "_wiki_pages_v_version_further_reading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_papers" ADD CONSTRAINT "_wiki_pages_v_version_papers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_tools" ADD CONSTRAINT "_wiki_pages_v_version_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_open_questions" ADD CONSTRAINT "_wiki_pages_v_version_open_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_prompts" ADD CONSTRAINT "_wiki_pages_v_version_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_related_topics" ADD CONSTRAINT "_wiki_pages_v_version_related_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_possible_topics" ADD CONSTRAINT "_wiki_pages_v_version_possible_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_version_source_artifacts" ADD CONSTRAINT "_wiki_pages_v_version_source_artifacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_wiki_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_wiki_pages_v_rels" ADD CONSTRAINT "_wiki_pages_v_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wiki_pages_fk" FOREIGN KEY ("wiki_pages_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "wiki_pages_review_status_idx" ON "wiki_pages" USING btree ("review_status");
    CREATE INDEX "wiki_pages_visibility_idx" ON "wiki_pages" USING btree ("visibility");
    CREATE UNIQUE INDEX "wiki_pages_slug_idx" ON "wiki_pages" USING btree ("slug");
    CREATE INDEX "wiki_pages_updated_at_idx" ON "wiki_pages" USING btree ("updated_at");
    CREATE INDEX "wiki_pages_created_at_idx" ON "wiki_pages" USING btree ("created_at");
    CREATE INDEX "wiki_pages__status_idx" ON "wiki_pages" USING btree ("_status");

    CREATE INDEX "wiki_pages_key_claims_order_idx" ON "wiki_pages_key_claims" USING btree ("_order");
    CREATE INDEX "wiki_pages_key_claims_parent_id_idx" ON "wiki_pages_key_claims" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_further_reading_order_idx" ON "wiki_pages_further_reading" USING btree ("_order");
    CREATE INDEX "wiki_pages_further_reading_parent_id_idx" ON "wiki_pages_further_reading" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_papers_order_idx" ON "wiki_pages_papers" USING btree ("_order");
    CREATE INDEX "wiki_pages_papers_parent_id_idx" ON "wiki_pages_papers" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_tools_order_idx" ON "wiki_pages_tools" USING btree ("_order");
    CREATE INDEX "wiki_pages_tools_parent_id_idx" ON "wiki_pages_tools" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_open_questions_order_idx" ON "wiki_pages_open_questions" USING btree ("_order");
    CREATE INDEX "wiki_pages_open_questions_parent_id_idx" ON "wiki_pages_open_questions" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_prompts_order_idx" ON "wiki_pages_prompts" USING btree ("_order");
    CREATE INDEX "wiki_pages_prompts_parent_id_idx" ON "wiki_pages_prompts" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_related_topics_order_idx" ON "wiki_pages_related_topics" USING btree ("_order");
    CREATE INDEX "wiki_pages_related_topics_parent_id_idx" ON "wiki_pages_related_topics" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_possible_topics_order_idx" ON "wiki_pages_possible_topics" USING btree ("_order");
    CREATE INDEX "wiki_pages_possible_topics_parent_id_idx" ON "wiki_pages_possible_topics" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_source_artifacts_order_idx" ON "wiki_pages_source_artifacts" USING btree ("_order");
    CREATE INDEX "wiki_pages_source_artifacts_parent_id_idx" ON "wiki_pages_source_artifacts" USING btree ("_parent_id");
    CREATE INDEX "wiki_pages_rels_order_idx" ON "wiki_pages_rels" USING btree ("order");
    CREATE INDEX "wiki_pages_rels_parent_idx" ON "wiki_pages_rels" USING btree ("parent_id");
    CREATE INDEX "wiki_pages_rels_path_idx" ON "wiki_pages_rels" USING btree ("path");
    CREATE INDEX "wiki_pages_rels_events_id_idx" ON "wiki_pages_rels" USING btree ("events_id");
    CREATE INDEX "wiki_pages_rels_posts_id_idx" ON "wiki_pages_rels" USING btree ("posts_id");
    CREATE INDEX "wiki_pages_rels_projects_id_idx" ON "wiki_pages_rels" USING btree ("projects_id");
    CREATE INDEX "wiki_pages_rels_threads_id_idx" ON "wiki_pages_rels" USING btree ("threads_id");
    CREATE INDEX "wiki_pages_rels_profiles_id_idx" ON "wiki_pages_rels" USING btree ("profiles_id");
    CREATE INDEX "wiki_pages_rels_activity_items_id_idx" ON "wiki_pages_rels" USING btree ("activity_items_id");

    CREATE INDEX "_wiki_pages_v_parent_idx" ON "_wiki_pages_v" USING btree ("parent_id");
    CREATE INDEX "_wiki_pages_v_version_version_review_status_idx" ON "_wiki_pages_v" USING btree ("version_review_status");
    CREATE INDEX "_wiki_pages_v_version_version_visibility_idx" ON "_wiki_pages_v" USING btree ("version_visibility");
    CREATE INDEX "_wiki_pages_v_version_version_slug_idx" ON "_wiki_pages_v" USING btree ("version_slug");
    CREATE INDEX "_wiki_pages_v_version_version_updated_at_idx" ON "_wiki_pages_v" USING btree ("version_updated_at");
    CREATE INDEX "_wiki_pages_v_version_version_created_at_idx" ON "_wiki_pages_v" USING btree ("version_created_at");
    CREATE INDEX "_wiki_pages_v_version_version__status_idx" ON "_wiki_pages_v" USING btree ("version__status");
    CREATE INDEX "_wiki_pages_v_created_at_idx" ON "_wiki_pages_v" USING btree ("created_at");
    CREATE INDEX "_wiki_pages_v_updated_at_idx" ON "_wiki_pages_v" USING btree ("updated_at");
    CREATE INDEX "_wiki_pages_v_latest_idx" ON "_wiki_pages_v" USING btree ("latest");

    CREATE INDEX "_wiki_pages_v_version_key_claims_order_idx" ON "_wiki_pages_v_version_key_claims" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_key_claims_parent_id_idx" ON "_wiki_pages_v_version_key_claims" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_further_reading_order_idx" ON "_wiki_pages_v_version_further_reading" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_further_reading_parent_id_idx" ON "_wiki_pages_v_version_further_reading" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_papers_order_idx" ON "_wiki_pages_v_version_papers" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_papers_parent_id_idx" ON "_wiki_pages_v_version_papers" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_tools_order_idx" ON "_wiki_pages_v_version_tools" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_tools_parent_id_idx" ON "_wiki_pages_v_version_tools" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_open_questions_order_idx" ON "_wiki_pages_v_version_open_questions" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_open_questions_parent_id_idx" ON "_wiki_pages_v_version_open_questions" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_prompts_order_idx" ON "_wiki_pages_v_version_prompts" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_prompts_parent_id_idx" ON "_wiki_pages_v_version_prompts" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_related_topics_order_idx" ON "_wiki_pages_v_version_related_topics" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_related_topics_parent_id_idx" ON "_wiki_pages_v_version_related_topics" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_possible_topics_order_idx" ON "_wiki_pages_v_version_possible_topics" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_possible_topics_parent_id_idx" ON "_wiki_pages_v_version_possible_topics" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_version_source_artifacts_order_idx" ON "_wiki_pages_v_version_source_artifacts" USING btree ("_order");
    CREATE INDEX "_wiki_pages_v_version_source_artifacts_parent_id_idx" ON "_wiki_pages_v_version_source_artifacts" USING btree ("_parent_id");
    CREATE INDEX "_wiki_pages_v_rels_order_idx" ON "_wiki_pages_v_rels" USING btree ("order");
    CREATE INDEX "_wiki_pages_v_rels_parent_idx" ON "_wiki_pages_v_rels" USING btree ("parent_id");
    CREATE INDEX "_wiki_pages_v_rels_path_idx" ON "_wiki_pages_v_rels" USING btree ("path");
    CREATE INDEX "_wiki_pages_v_rels_events_id_idx" ON "_wiki_pages_v_rels" USING btree ("events_id");
    CREATE INDEX "_wiki_pages_v_rels_posts_id_idx" ON "_wiki_pages_v_rels" USING btree ("posts_id");
    CREATE INDEX "_wiki_pages_v_rels_projects_id_idx" ON "_wiki_pages_v_rels" USING btree ("projects_id");
    CREATE INDEX "_wiki_pages_v_rels_threads_id_idx" ON "_wiki_pages_v_rels" USING btree ("threads_id");
    CREATE INDEX "_wiki_pages_v_rels_profiles_id_idx" ON "_wiki_pages_v_rels" USING btree ("profiles_id");
    CREATE INDEX "_wiki_pages_v_rels_activity_items_id_idx" ON "_wiki_pages_v_rels" USING btree ("activity_items_id");
    CREATE INDEX "payload_locked_documents_rels_wiki_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("wiki_pages_id");

    ALTER TABLE "wiki_pages" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_key_claims" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_further_reading" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_papers" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_tools" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_open_questions" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_prompts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_related_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_possible_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_source_artifacts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_pages_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_key_claims" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_further_reading" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_papers" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_tools" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_open_questions" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_prompts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_related_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_possible_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_version_source_artifacts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_wiki_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_wiki_pages_fk";

    DROP TABLE IF EXISTS "_wiki_pages_v_rels" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_source_artifacts" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_possible_topics" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_related_topics" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_prompts" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_open_questions" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_tools" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_papers" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_further_reading" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v_version_key_claims" CASCADE;
    DROP TABLE IF EXISTS "_wiki_pages_v" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_rels" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_source_artifacts" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_possible_topics" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_related_topics" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_prompts" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_open_questions" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_tools" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_papers" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_further_reading" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages_key_claims" CASCADE;
    DROP TABLE IF EXISTS "wiki_pages" CASCADE;

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "wiki_pages_id";

    DROP TYPE IF EXISTS "public"."enum__wiki_pages_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__wiki_pages_v_version_visibility";
    DROP TYPE IF EXISTS "public"."enum__wiki_pages_v_version_confidence";
    DROP TYPE IF EXISTS "public"."enum__wiki_pages_v_version_review_status";
    DROP TYPE IF EXISTS "public"."enum__wiki_pages_v_version_source_artifacts_source_type";
    DROP TYPE IF EXISTS "public"."enum_wiki_pages_status";
    DROP TYPE IF EXISTS "public"."enum_wiki_pages_visibility";
    DROP TYPE IF EXISTS "public"."enum_wiki_pages_confidence";
    DROP TYPE IF EXISTS "public"."enum_wiki_pages_review_status";
    DROP TYPE IF EXISTS "public"."enum_wiki_pages_source_artifacts_source_type";
  `)
}
