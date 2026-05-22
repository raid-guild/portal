import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_events_session_type" ADD VALUE IF NOT EXISTS 'fireside';
    ALTER TYPE "public"."enum__events_v_version_session_type" ADD VALUE IF NOT EXISTS 'fireside';
    CREATE TYPE "public"."enum_events_source_status" AS ENUM('scheduled', 'recorded', 'summarized', 'processed', 'archived');
    CREATE TYPE "public"."enum__events_v_version_source_status" AS ENUM('scheduled', 'recorded', 'summarized', 'processed', 'archived');
    CREATE TYPE "public"."enum_events_role_focus" AS ENUM('designer', 'pm', 'devops', 'founder', 'developer', 'operations', 'other');
    CREATE TYPE "public"."enum__events_v_version_role_focus" AS ENUM('designer', 'pm', 'devops', 'founder', 'developer', 'operations', 'other');
    CREATE TYPE "public"."enum_posts_content_type" AS ENUM('article', 'recap', 'quote', 'clip', 'lesson', 'announcement', 'newsletter');
    CREATE TYPE "public"."enum__posts_v_version_content_type" AS ENUM('article', 'recap', 'quote', 'clip', 'lesson', 'announcement', 'newsletter');
    CREATE TYPE "public"."enum_posts_artifact_kind" AS ENUM('article', 'embed', 'note');
    CREATE TYPE "public"."enum__posts_v_version_artifact_kind" AS ENUM('article', 'embed', 'note');

    CREATE TABLE "events_themes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "theme" varchar
    );
    CREATE TABLE "events_wiki_candidate_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar
    );
    CREATE TABLE "events_linked_social_posts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "platform" varchar,
      "url" varchar,
      "label" varchar,
      "published_at" timestamp(3) with time zone
    );
    CREATE TABLE "_events_v_version_themes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "theme" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_events_v_version_wiki_candidate_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "topic" varchar,
      "_uuid" varchar
    );
    CREATE TABLE "_events_v_version_linked_social_posts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "platform" varchar,
      "url" varchar,
      "label" varchar,
      "published_at" timestamp(3) with time zone,
      "_uuid" varchar
    );
    CREATE TABLE "posts_wiki_candidate_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "topic" varchar
    );
    CREATE TABLE "_posts_v_version_wiki_candidate_topics" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "topic" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "events" ADD COLUMN "recording_u_r_l" varchar;
    ALTER TABLE "events" ADD COLUMN "transcript_artifact_u_r_l" varchar;
    ALTER TABLE "events" ADD COLUMN "summary_artifact_u_r_l" varchar;
    ALTER TABLE "events" ADD COLUMN "source_artifact_u_r_l" varchar;
    ALTER TABLE "events" ADD COLUMN "source_artifact_i_d" varchar;
    ALTER TABLE "events" ADD COLUMN "source_status" "enum_events_source_status" DEFAULT 'scheduled';
    ALTER TABLE "events" ADD COLUMN "role_focus" "enum_events_role_focus";
    ALTER TABLE "events" ADD COLUMN "practice_area" varchar;
    ALTER TABLE "events" ADD COLUMN "wiki_candidate" boolean DEFAULT false;
    ALTER TABLE "_events_v" ADD COLUMN "version_recording_u_r_l" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_transcript_artifact_u_r_l" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_summary_artifact_u_r_l" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_source_artifact_u_r_l" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_source_artifact_i_d" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_source_status" "enum__events_v_version_source_status" DEFAULT 'scheduled';
    ALTER TABLE "_events_v" ADD COLUMN "version_role_focus" "enum__events_v_version_role_focus";
    ALTER TABLE "_events_v" ADD COLUMN "version_practice_area" varchar;
    ALTER TABLE "_events_v" ADD COLUMN "version_wiki_candidate" boolean DEFAULT false;

    ALTER TABLE "posts" ADD COLUMN "content_type" "enum_posts_content_type" DEFAULT 'article';
    ALTER TABLE "posts" ADD COLUMN "artifact_kind" "enum_posts_artifact_kind" DEFAULT 'article';
    ALTER TABLE "posts" ADD COLUMN "source_session_id" integer;
    ALTER TABLE "posts" ADD COLUMN "parent_thread_id" integer;
    ALTER TABLE "posts" ADD COLUMN "wiki_candidate" boolean DEFAULT false;
    ALTER TABLE "posts" ADD COLUMN "source_artifact_u_r_l" varchar;
    ALTER TABLE "posts" ADD COLUMN "source_artifact_i_d" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN "version_content_type" "enum__posts_v_version_content_type" DEFAULT 'article';
    ALTER TABLE "_posts_v" ADD COLUMN "version_artifact_kind" "enum__posts_v_version_artifact_kind" DEFAULT 'article';
    ALTER TABLE "_posts_v" ADD COLUMN "version_source_session_id" integer;
    ALTER TABLE "_posts_v" ADD COLUMN "version_parent_thread_id" integer;
    ALTER TABLE "_posts_v" ADD COLUMN "version_wiki_candidate" boolean DEFAULT false;
    ALTER TABLE "_posts_v" ADD COLUMN "version_source_artifact_u_r_l" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN "version_source_artifact_i_d" varchar;

    ALTER TABLE "events_themes" ADD CONSTRAINT "events_themes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "events_wiki_candidate_topics" ADD CONSTRAINT "events_wiki_candidate_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "events_linked_social_posts" ADD CONSTRAINT "events_linked_social_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_events_v_version_themes" ADD CONSTRAINT "_events_v_version_themes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_events_v_version_wiki_candidate_topics" ADD CONSTRAINT "_events_v_version_wiki_candidate_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_events_v_version_linked_social_posts" ADD CONSTRAINT "_events_v_version_linked_social_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "posts_wiki_candidate_topics" ADD CONSTRAINT "posts_wiki_candidate_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_posts_v_version_wiki_candidate_topics" ADD CONSTRAINT "_posts_v_version_wiki_candidate_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "posts" ADD CONSTRAINT "posts_source_session_id_events_id_fk" FOREIGN KEY ("source_session_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_thread_id_threads_id_fk" FOREIGN KEY ("parent_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_source_session_id_events_id_fk" FOREIGN KEY ("version_source_session_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_parent_thread_id_threads_id_fk" FOREIGN KEY ("version_parent_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX "events_themes_order_idx" ON "events_themes" USING btree ("_order");
    CREATE INDEX "events_themes_parent_id_idx" ON "events_themes" USING btree ("_parent_id");
    CREATE INDEX "events_wiki_candidate_topics_order_idx" ON "events_wiki_candidate_topics" USING btree ("_order");
    CREATE INDEX "events_wiki_candidate_topics_parent_id_idx" ON "events_wiki_candidate_topics" USING btree ("_parent_id");
    CREATE INDEX "events_linked_social_posts_order_idx" ON "events_linked_social_posts" USING btree ("_order");
    CREATE INDEX "events_linked_social_posts_parent_id_idx" ON "events_linked_social_posts" USING btree ("_parent_id");
    CREATE INDEX "_events_v_version_themes_order_idx" ON "_events_v_version_themes" USING btree ("_order");
    CREATE INDEX "_events_v_version_themes_parent_id_idx" ON "_events_v_version_themes" USING btree ("_parent_id");
    CREATE INDEX "_events_v_version_wiki_candidate_topics_order_idx" ON "_events_v_version_wiki_candidate_topics" USING btree ("_order");
    CREATE INDEX "_events_v_version_wiki_candidate_topics_parent_id_idx" ON "_events_v_version_wiki_candidate_topics" USING btree ("_parent_id");
    CREATE INDEX "_events_v_version_linked_social_posts_order_idx" ON "_events_v_version_linked_social_posts" USING btree ("_order");
    CREATE INDEX "_events_v_version_linked_social_posts_parent_id_idx" ON "_events_v_version_linked_social_posts" USING btree ("_parent_id");
    CREATE INDEX "posts_wiki_candidate_topics_order_idx" ON "posts_wiki_candidate_topics" USING btree ("_order");
    CREATE INDEX "posts_wiki_candidate_topics_parent_id_idx" ON "posts_wiki_candidate_topics" USING btree ("_parent_id");
    CREATE INDEX "_posts_v_version_wiki_candidate_topics_order_idx" ON "_posts_v_version_wiki_candidate_topics" USING btree ("_order");
    CREATE INDEX "_posts_v_version_wiki_candidate_topics_parent_id_idx" ON "_posts_v_version_wiki_candidate_topics" USING btree ("_parent_id");
    CREATE INDEX "posts_source_session_idx" ON "posts" USING btree ("source_session_id");
    CREATE INDEX "posts_parent_thread_idx" ON "posts" USING btree ("parent_thread_id");
    CREATE INDEX "_posts_v_version_source_session_idx" ON "_posts_v" USING btree ("version_source_session_id");
    CREATE INDEX "_posts_v_version_parent_thread_idx" ON "_posts_v" USING btree ("version_parent_thread_id");

    ALTER TABLE "events_themes" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "events_wiki_candidate_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "events_linked_social_posts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_events_v_version_themes" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_events_v_version_wiki_candidate_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_events_v_version_linked_social_posts" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "posts_wiki_candidate_topics" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_posts_v_version_wiki_candidate_topics" DISABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "_posts_v_version_parent_thread_idx";
    DROP INDEX "_posts_v_version_source_session_idx";
    DROP INDEX "posts_parent_thread_idx";
    DROP INDEX "posts_source_session_idx";
    DROP INDEX "_posts_v_version_wiki_candidate_topics_parent_id_idx";
    DROP INDEX "_posts_v_version_wiki_candidate_topics_order_idx";
    DROP INDEX "posts_wiki_candidate_topics_parent_id_idx";
    DROP INDEX "posts_wiki_candidate_topics_order_idx";
    DROP INDEX "_events_v_version_linked_social_posts_parent_id_idx";
    DROP INDEX "_events_v_version_linked_social_posts_order_idx";
    DROP INDEX "_events_v_version_wiki_candidate_topics_parent_id_idx";
    DROP INDEX "_events_v_version_wiki_candidate_topics_order_idx";
    DROP INDEX "_events_v_version_themes_parent_id_idx";
    DROP INDEX "_events_v_version_themes_order_idx";
    DROP INDEX "events_linked_social_posts_parent_id_idx";
    DROP INDEX "events_linked_social_posts_order_idx";
    DROP INDEX "events_wiki_candidate_topics_parent_id_idx";
    DROP INDEX "events_wiki_candidate_topics_order_idx";
    DROP INDEX "events_themes_parent_id_idx";
    DROP INDEX "events_themes_order_idx";

    ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_parent_thread_id_threads_id_fk";
    ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_source_session_id_events_id_fk";
    ALTER TABLE "posts" DROP CONSTRAINT "posts_parent_thread_id_threads_id_fk";
    ALTER TABLE "posts" DROP CONSTRAINT "posts_source_session_id_events_id_fk";
    ALTER TABLE "_posts_v_version_wiki_candidate_topics" DROP CONSTRAINT "_posts_v_version_wiki_candidate_topics_parent_id_fk";
    ALTER TABLE "posts_wiki_candidate_topics" DROP CONSTRAINT "posts_wiki_candidate_topics_parent_id_fk";
    ALTER TABLE "_events_v_version_linked_social_posts" DROP CONSTRAINT "_events_v_version_linked_social_posts_parent_id_fk";
    ALTER TABLE "_events_v_version_wiki_candidate_topics" DROP CONSTRAINT "_events_v_version_wiki_candidate_topics_parent_id_fk";
    ALTER TABLE "_events_v_version_themes" DROP CONSTRAINT "_events_v_version_themes_parent_id_fk";
    ALTER TABLE "events_linked_social_posts" DROP CONSTRAINT "events_linked_social_posts_parent_id_fk";
    ALTER TABLE "events_wiki_candidate_topics" DROP CONSTRAINT "events_wiki_candidate_topics_parent_id_fk";
    ALTER TABLE "events_themes" DROP CONSTRAINT "events_themes_parent_id_fk";

    ALTER TABLE "_posts_v" DROP COLUMN "version_source_artifact_i_d";
    ALTER TABLE "_posts_v" DROP COLUMN "version_source_artifact_u_r_l";
    ALTER TABLE "_posts_v" DROP COLUMN "version_wiki_candidate";
    ALTER TABLE "_posts_v" DROP COLUMN "version_parent_thread_id";
    ALTER TABLE "_posts_v" DROP COLUMN "version_source_session_id";
    ALTER TABLE "_posts_v" DROP COLUMN "version_artifact_kind";
    ALTER TABLE "_posts_v" DROP COLUMN "version_content_type";
    ALTER TABLE "posts" DROP COLUMN "source_artifact_i_d";
    ALTER TABLE "posts" DROP COLUMN "source_artifact_u_r_l";
    ALTER TABLE "posts" DROP COLUMN "wiki_candidate";
    ALTER TABLE "posts" DROP COLUMN "parent_thread_id";
    ALTER TABLE "posts" DROP COLUMN "source_session_id";
    ALTER TABLE "posts" DROP COLUMN "artifact_kind";
    ALTER TABLE "posts" DROP COLUMN "content_type";

    ALTER TABLE "_events_v" DROP COLUMN "version_wiki_candidate";
    ALTER TABLE "_events_v" DROP COLUMN "version_practice_area";
    ALTER TABLE "_events_v" DROP COLUMN "version_role_focus";
    ALTER TABLE "_events_v" DROP COLUMN "version_source_status";
    ALTER TABLE "_events_v" DROP COLUMN "version_source_artifact_i_d";
    ALTER TABLE "_events_v" DROP COLUMN "version_source_artifact_u_r_l";
    ALTER TABLE "_events_v" DROP COLUMN "version_summary_artifact_u_r_l";
    ALTER TABLE "_events_v" DROP COLUMN "version_transcript_artifact_u_r_l";
    ALTER TABLE "_events_v" DROP COLUMN "version_recording_u_r_l";
    ALTER TABLE "events" DROP COLUMN "wiki_candidate";
    ALTER TABLE "events" DROP COLUMN "practice_area";
    ALTER TABLE "events" DROP COLUMN "role_focus";
    ALTER TABLE "events" DROP COLUMN "source_status";
    ALTER TABLE "events" DROP COLUMN "source_artifact_i_d";
    ALTER TABLE "events" DROP COLUMN "source_artifact_u_r_l";
    ALTER TABLE "events" DROP COLUMN "summary_artifact_u_r_l";
    ALTER TABLE "events" DROP COLUMN "transcript_artifact_u_r_l";
    ALTER TABLE "events" DROP COLUMN "recording_u_r_l";

    DROP TABLE "_posts_v_version_wiki_candidate_topics" CASCADE;
    DROP TABLE "posts_wiki_candidate_topics" CASCADE;
    DROP TABLE "_events_v_version_linked_social_posts" CASCADE;
    DROP TABLE "_events_v_version_wiki_candidate_topics" CASCADE;
    DROP TABLE "_events_v_version_themes" CASCADE;
    DROP TABLE "events_linked_social_posts" CASCADE;
    DROP TABLE "events_wiki_candidate_topics" CASCADE;
    DROP TABLE "events_themes" CASCADE;

    DROP TYPE "public"."enum__posts_v_version_artifact_kind";
    DROP TYPE "public"."enum_posts_artifact_kind";
    DROP TYPE "public"."enum__posts_v_version_content_type";
    DROP TYPE "public"."enum_posts_content_type";
    DROP TYPE "public"."enum__events_v_version_role_focus";
    DROP TYPE "public"."enum_events_role_focus";
    DROP TYPE "public"."enum__events_v_version_source_status";
    DROP TYPE "public"."enum_events_source_status";

    UPDATE "events" SET "session_type" = 'brownbag' WHERE "session_type"::text = 'fireside';
    UPDATE "_events_v" SET "version_session_type" = 'brownbag' WHERE "version_session_type"::text = 'fireside';
    ALTER TABLE "events" ALTER COLUMN "session_type" DROP DEFAULT;
    ALTER TABLE "_events_v" ALTER COLUMN "version_session_type" DROP DEFAULT;
    ALTER TYPE "public"."enum_events_session_type" RENAME TO "enum_events_session_type_old";
    CREATE TYPE "public"."enum_events_session_type" AS ENUM('brownbag', 'workshop', 'all-hands', 'demo', 'pitch');
    ALTER TABLE "events"
      ALTER COLUMN "session_type" TYPE "public"."enum_events_session_type"
      USING "session_type"::text::"public"."enum_events_session_type";
    ALTER TABLE "events" ALTER COLUMN "session_type" SET DEFAULT 'brownbag';
    DROP TYPE "public"."enum_events_session_type_old";
    ALTER TYPE "public"."enum__events_v_version_session_type" RENAME TO "enum__events_v_version_session_type_old";
    CREATE TYPE "public"."enum__events_v_version_session_type" AS ENUM('brownbag', 'workshop', 'all-hands', 'demo', 'pitch');
    ALTER TABLE "_events_v"
      ALTER COLUMN "version_session_type" TYPE "public"."enum__events_v_version_session_type"
      USING "version_session_type"::text::"public"."enum__events_v_version_session_type";
    ALTER TABLE "_events_v" ALTER COLUMN "version_session_type" SET DEFAULT 'brownbag';
    DROP TYPE "public"."enum__events_v_version_session_type_old";
  `)
}
