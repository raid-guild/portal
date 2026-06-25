import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_wiki_topics_kind" AS ENUM('category', 'topic', 'subtopic', 'possible');
    CREATE TYPE "public"."enum_wiki_topics_source_artifacts_source_type" AS ENUM('prism', 'session', 'post', 'paper', 'blog', 'hackerNews', 'tool', 'external');
    CREATE TYPE "public"."enum_wiki_topics_review_status" AS ENUM('seed', 'suggested', 'needs_review', 'reviewed', 'archived');
    CREATE TYPE "public"."enum_wiki_topics_confidence" AS ENUM('low', 'medium', 'high');
    CREATE TYPE "public"."enum_wiki_topics_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');

    CREATE TABLE "wiki_topics" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "summary" varchar,
      "kind" "enum_wiki_topics_kind" DEFAULT 'topic' NOT NULL,
      "parent_topic_id" integer,
      "canonical_page_id" integer,
      "expansion_prompt" varchar,
      "review_status" "enum_wiki_topics_review_status" DEFAULT 'suggested' NOT NULL,
      "confidence" "enum_wiki_topics_confidence" DEFAULT 'medium' NOT NULL,
      "visibility" "enum_wiki_topics_visibility" DEFAULT 'authenticated' NOT NULL,
      "sort_order" numeric DEFAULT 0,
      "last_expanded_at" timestamp(3) with time zone,
      "last_reviewed_at" timestamp(3) with time zone,
      "generated_at" timestamp(3) with time zone,
      "generated_by_id" integer,
      "slug" varchar,
      "slug_lock" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "wiki_topics_source_queries" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "query" varchar NOT NULL,
      "filters" varchar,
      "result_count" numeric,
      "searched_at" timestamp(3) with time zone
    );

    CREATE TABLE "wiki_topics_source_artifacts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "artifact_i_d" varchar,
      "source_type" "enum_wiki_topics_source_artifacts_source_type" DEFAULT 'prism',
      "url" varchar,
      "source_query" varchar,
      "observed_at" timestamp(3) with time zone
    );

    CREATE TABLE "wiki_topics_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "wiki_topics_id" integer,
      "wiki_pages_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "wiki_topics_id" integer;

    ALTER TABLE "wiki_topics" ADD CONSTRAINT "wiki_topics_parent_topic_id_wiki_topics_id_fk" FOREIGN KEY ("parent_topic_id") REFERENCES "public"."wiki_topics"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "wiki_topics" ADD CONSTRAINT "wiki_topics_canonical_page_id_wiki_pages_id_fk" FOREIGN KEY ("canonical_page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "wiki_topics" ADD CONSTRAINT "wiki_topics_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "wiki_topics_source_queries" ADD CONSTRAINT "wiki_topics_source_queries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_topics"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_topics_source_artifacts" ADD CONSTRAINT "wiki_topics_source_artifacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wiki_topics"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_topics_rels" ADD CONSTRAINT "wiki_topics_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_topics"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_topics_rels" ADD CONSTRAINT "wiki_topics_rels_wiki_topics_fk" FOREIGN KEY ("wiki_topics_id") REFERENCES "public"."wiki_topics"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "wiki_topics_rels" ADD CONSTRAINT "wiki_topics_rels_wiki_pages_fk" FOREIGN KEY ("wiki_pages_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wiki_topics_fk" FOREIGN KEY ("wiki_topics_id") REFERENCES "public"."wiki_topics"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "wiki_topics_title_idx" ON "wiki_topics" USING btree ("title");
    CREATE INDEX "wiki_topics_kind_idx" ON "wiki_topics" USING btree ("kind");
    CREATE INDEX "wiki_topics_parent_topic_idx" ON "wiki_topics" USING btree ("parent_topic_id");
    CREATE INDEX "wiki_topics_review_status_idx" ON "wiki_topics" USING btree ("review_status");
    CREATE INDEX "wiki_topics_visibility_idx" ON "wiki_topics" USING btree ("visibility");
    CREATE UNIQUE INDEX "wiki_topics_slug_idx" ON "wiki_topics" USING btree ("slug");
    CREATE INDEX "wiki_topics_updated_at_idx" ON "wiki_topics" USING btree ("updated_at");
    CREATE INDEX "wiki_topics_created_at_idx" ON "wiki_topics" USING btree ("created_at");
    CREATE INDEX "wiki_topics_canonical_page_idx" ON "wiki_topics" USING btree ("canonical_page_id");
    CREATE INDEX "wiki_topics_generated_by_idx" ON "wiki_topics" USING btree ("generated_by_id");
    CREATE INDEX "wiki_topics_source_queries_order_idx" ON "wiki_topics_source_queries" USING btree ("_order");
    CREATE INDEX "wiki_topics_source_queries_parent_id_idx" ON "wiki_topics_source_queries" USING btree ("_parent_id");
    CREATE INDEX "wiki_topics_source_artifacts_order_idx" ON "wiki_topics_source_artifacts" USING btree ("_order");
    CREATE INDEX "wiki_topics_source_artifacts_parent_id_idx" ON "wiki_topics_source_artifacts" USING btree ("_parent_id");
    CREATE INDEX "wiki_topics_rels_order_idx" ON "wiki_topics_rels" USING btree ("order");
    CREATE INDEX "wiki_topics_rels_parent_idx" ON "wiki_topics_rels" USING btree ("parent_id");
    CREATE INDEX "wiki_topics_rels_path_idx" ON "wiki_topics_rels" USING btree ("path");
    CREATE INDEX "wiki_topics_rels_wiki_topics_id_idx" ON "wiki_topics_rels" USING btree ("wiki_topics_id");
    CREATE INDEX "wiki_topics_rels_wiki_pages_id_idx" ON "wiki_topics_rels" USING btree ("wiki_pages_id");
    CREATE INDEX "payload_locked_documents_rels_wiki_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("wiki_topics_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "wiki_topics_source_artifacts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_topics_source_queries" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_topics_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "wiki_topics" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_wiki_topics_id_idx";
    DROP INDEX IF EXISTS "wiki_topics_rels_wiki_pages_id_idx";
    DROP INDEX IF EXISTS "wiki_topics_rels_wiki_topics_id_idx";
    DROP INDEX IF EXISTS "wiki_topics_rels_path_idx";
    DROP INDEX IF EXISTS "wiki_topics_rels_parent_idx";
    DROP INDEX IF EXISTS "wiki_topics_rels_order_idx";
    DROP INDEX IF EXISTS "wiki_topics_source_artifacts_parent_id_idx";
    DROP INDEX IF EXISTS "wiki_topics_source_artifacts_order_idx";
    DROP INDEX IF EXISTS "wiki_topics_source_queries_parent_id_idx";
    DROP INDEX IF EXISTS "wiki_topics_source_queries_order_idx";
    DROP INDEX IF EXISTS "wiki_topics_generated_by_idx";
    DROP INDEX IF EXISTS "wiki_topics_canonical_page_idx";
    DROP INDEX IF EXISTS "wiki_topics_created_at_idx";
    DROP INDEX IF EXISTS "wiki_topics_updated_at_idx";
    DROP INDEX IF EXISTS "wiki_topics_slug_idx";
    DROP INDEX IF EXISTS "wiki_topics_visibility_idx";
    DROP INDEX IF EXISTS "wiki_topics_review_status_idx";
    DROP INDEX IF EXISTS "wiki_topics_parent_topic_idx";
    DROP INDEX IF EXISTS "wiki_topics_kind_idx";
    DROP INDEX IF EXISTS "wiki_topics_title_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_wiki_topics_fk";
    ALTER TABLE "wiki_topics_rels" DROP CONSTRAINT IF EXISTS "wiki_topics_rels_wiki_pages_fk";
    ALTER TABLE "wiki_topics_rels" DROP CONSTRAINT IF EXISTS "wiki_topics_rels_wiki_topics_fk";
    ALTER TABLE "wiki_topics_rels" DROP CONSTRAINT IF EXISTS "wiki_topics_rels_parent_fk";
    ALTER TABLE "wiki_topics_source_artifacts" DROP CONSTRAINT IF EXISTS "wiki_topics_source_artifacts_parent_id_fk";
    ALTER TABLE "wiki_topics_source_queries" DROP CONSTRAINT IF EXISTS "wiki_topics_source_queries_parent_id_fk";
    ALTER TABLE "wiki_topics" DROP CONSTRAINT IF EXISTS "wiki_topics_generated_by_id_users_id_fk";
    ALTER TABLE "wiki_topics" DROP CONSTRAINT IF EXISTS "wiki_topics_canonical_page_id_wiki_pages_id_fk";
    ALTER TABLE "wiki_topics" DROP CONSTRAINT IF EXISTS "wiki_topics_parent_topic_id_wiki_topics_id_fk";

    DROP TABLE IF EXISTS "wiki_topics_rels" CASCADE;
    DROP TABLE IF EXISTS "wiki_topics_source_artifacts" CASCADE;
    DROP TABLE IF EXISTS "wiki_topics_source_queries" CASCADE;
    DROP TABLE IF EXISTS "wiki_topics" CASCADE;

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "wiki_topics_id";

    DROP TYPE IF EXISTS "public"."enum_wiki_topics_visibility";
    DROP TYPE IF EXISTS "public"."enum_wiki_topics_confidence";
    DROP TYPE IF EXISTS "public"."enum_wiki_topics_review_status";
    DROP TYPE IF EXISTS "public"."enum_wiki_topics_source_artifacts_source_type";
    DROP TYPE IF EXISTS "public"."enum_wiki_topics_kind";
  `)
}
