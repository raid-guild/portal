import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_open_questions_status" AS ENUM('open', 'answered', 'not-applicable');
  CREATE TYPE "public"."enum_projects_source_evidence_source_type" AS ENUM('github', 'discord', 'valhalla', 'rip', 'charmverse', 'website', 'docs', 'other');
  CREATE TYPE "public"."enum_projects_source_evidence_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_projects_people_evidence_source_type" AS ENUM('github', 'discord', 'valhalla', 'rip', 'charmverse', 'other');
  CREATE TYPE "public"."enum_projects_people_evidence_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_projects_project_kind" AS ENUM('raidguild-project', 'client-artifact', 'internal-tool', 'reference-repo', 'rip', 'cohort-project', 'experiment', 'template', 'unknown');
  CREATE TYPE "public"."enum_projects_review_status" AS ENUM('unreviewed', 'needs-review', 'in-review', 'needs-more-evidence', 'ready-for-prism', 'ready-for-cms', 'published');
  CREATE TYPE "public"."enum_projects_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_projects_historical_relevance" AS ENUM('low', 'medium', 'high', 'unknown');
  CREATE TYPE "public"."enum__projects_v_version_open_questions_status" AS ENUM('open', 'answered', 'not-applicable');
  CREATE TYPE "public"."enum__projects_v_version_source_evidence_source_type" AS ENUM('github', 'discord', 'valhalla', 'rip', 'charmverse', 'website', 'docs', 'other');
  CREATE TYPE "public"."enum__projects_v_version_source_evidence_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum__projects_v_version_people_evidence_source_type" AS ENUM('github', 'discord', 'valhalla', 'rip', 'charmverse', 'other');
  CREATE TYPE "public"."enum__projects_v_version_people_evidence_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum__projects_v_version_project_kind" AS ENUM('raidguild-project', 'client-artifact', 'internal-tool', 'reference-repo', 'rip', 'cohort-project', 'experiment', 'template', 'unknown');
  CREATE TYPE "public"."enum__projects_v_version_review_status" AS ENUM('unreviewed', 'needs-review', 'in-review', 'needs-more-evidence', 'ready-for-prism', 'ready-for-cms', 'published');
  CREATE TYPE "public"."enum__projects_v_version_confidence" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum__projects_v_version_historical_relevance" AS ENUM('low', 'medium', 'high', 'unknown');
  CREATE TABLE "projects_open_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"status" "enum_projects_open_questions_status" DEFAULT 'open',
  	"answer" varchar,
  	"answered_by_id" integer,
  	"answered_at" timestamp(3) with time zone,
  	"source_u_r_l" varchar
  );
  
  CREATE TABLE "projects_source_evidence" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_type" "enum_projects_source_evidence_source_type",
  	"label" varchar,
  	"url" varchar,
  	"source_i_d" varchar,
  	"confidence" "enum_projects_source_evidence_confidence" DEFAULT 'medium',
  	"notes" varchar,
  	"first_seen_at" timestamp(3) with time zone,
  	"last_seen_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "projects_people_evidence" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"handle" varchar,
  	"role" varchar,
  	"profile_id" integer,
  	"source_type" "enum_projects_people_evidence_source_type",
  	"source_u_r_l" varchar,
  	"confidence" "enum_projects_people_evidence_confidence" DEFAULT 'low',
  	"notes" varchar
  );
  
  CREATE TABLE "_projects_v_version_open_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"status" "enum__projects_v_version_open_questions_status" DEFAULT 'open',
  	"answer" varchar,
  	"answered_by_id" integer,
  	"answered_at" timestamp(3) with time zone,
  	"source_u_r_l" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_source_evidence" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_type" "enum__projects_v_version_source_evidence_source_type",
  	"label" varchar,
  	"url" varchar,
  	"source_i_d" varchar,
  	"confidence" "enum__projects_v_version_source_evidence_confidence" DEFAULT 'medium',
  	"notes" varchar,
  	"first_seen_at" timestamp(3) with time zone,
  	"last_seen_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_people_evidence" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"handle" varchar,
  	"role" varchar,
  	"profile_id" integer,
  	"source_type" "enum__projects_v_version_people_evidence_source_type",
  	"source_u_r_l" varchar,
  	"confidence" "enum__projects_v_version_people_evidence_confidence" DEFAULT 'low',
  	"notes" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "projects" ADD COLUMN "project_kind" "enum_projects_project_kind" DEFAULT 'unknown';
  ALTER TABLE "projects" ADD COLUMN "review_status" "enum_projects_review_status" DEFAULT 'unreviewed';
  ALTER TABLE "projects" ADD COLUMN "confidence" "enum_projects_confidence" DEFAULT 'low';
  ALTER TABLE "projects" ADD COLUMN "historical_relevance" "enum_projects_historical_relevance" DEFAULT 'unknown';
  ALTER TABLE "projects" ADD COLUMN "claimed_by_id" integer;
  ALTER TABLE "projects" ADD COLUMN "reviewed_by_id" integer;
  ALTER TABLE "projects" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "started_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "launched_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "is_featured" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN "featured_from" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "featured_until" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "featured_priority" numeric DEFAULT 0;
  ALTER TABLE "projects" ADD COLUMN "canonical_project_id" integer;
  ALTER TABLE "projects" ADD COLUMN "confidence_rationale" varchar;
  ALTER TABLE "projects_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_project_kind" "enum__projects_v_version_project_kind" DEFAULT 'unknown';
  ALTER TABLE "_projects_v" ADD COLUMN "version_review_status" "enum__projects_v_version_review_status" DEFAULT 'unreviewed';
  ALTER TABLE "_projects_v" ADD COLUMN "version_confidence" "enum__projects_v_version_confidence" DEFAULT 'low';
  ALTER TABLE "_projects_v" ADD COLUMN "version_historical_relevance" "enum__projects_v_version_historical_relevance" DEFAULT 'unknown';
  ALTER TABLE "_projects_v" ADD COLUMN "version_claimed_by_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_reviewed_by_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_started_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_launched_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_completed_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_is_featured" boolean DEFAULT false;
  ALTER TABLE "_projects_v" ADD COLUMN "version_featured_from" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_featured_until" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_featured_priority" numeric DEFAULT 0;
  ALTER TABLE "_projects_v" ADD COLUMN "version_canonical_project_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_confidence_rationale" varchar;
  ALTER TABLE "_projects_v_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "projects_open_questions" ADD CONSTRAINT "projects_open_questions_answered_by_id_profiles_id_fk" FOREIGN KEY ("answered_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_open_questions" ADD CONSTRAINT "projects_open_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_source_evidence" ADD CONSTRAINT "projects_source_evidence_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_people_evidence" ADD CONSTRAINT "projects_people_evidence_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_people_evidence" ADD CONSTRAINT "projects_people_evidence_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_open_questions" ADD CONSTRAINT "_projects_v_version_open_questions_answered_by_id_profiles_id_fk" FOREIGN KEY ("answered_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_open_questions" ADD CONSTRAINT "_projects_v_version_open_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_source_evidence" ADD CONSTRAINT "_projects_v_version_source_evidence_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_people_evidence" ADD CONSTRAINT "_projects_v_version_people_evidence_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_people_evidence" ADD CONSTRAINT "_projects_v_version_people_evidence_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_open_questions_order_idx" ON "projects_open_questions" USING btree ("_order");
  CREATE INDEX "projects_open_questions_parent_id_idx" ON "projects_open_questions" USING btree ("_parent_id");
  CREATE INDEX "projects_open_questions_answered_by_idx" ON "projects_open_questions" USING btree ("answered_by_id");
  CREATE INDEX "projects_source_evidence_order_idx" ON "projects_source_evidence" USING btree ("_order");
  CREATE INDEX "projects_source_evidence_parent_id_idx" ON "projects_source_evidence" USING btree ("_parent_id");
  CREATE INDEX "projects_people_evidence_order_idx" ON "projects_people_evidence" USING btree ("_order");
  CREATE INDEX "projects_people_evidence_parent_id_idx" ON "projects_people_evidence" USING btree ("_parent_id");
  CREATE INDEX "projects_people_evidence_profile_idx" ON "projects_people_evidence" USING btree ("profile_id");
  CREATE INDEX "_projects_v_version_open_questions_order_idx" ON "_projects_v_version_open_questions" USING btree ("_order");
  CREATE INDEX "_projects_v_version_open_questions_parent_id_idx" ON "_projects_v_version_open_questions" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_open_questions_answered_by_idx" ON "_projects_v_version_open_questions" USING btree ("answered_by_id");
  CREATE INDEX "_projects_v_version_source_evidence_order_idx" ON "_projects_v_version_source_evidence" USING btree ("_order");
  CREATE INDEX "_projects_v_version_source_evidence_parent_id_idx" ON "_projects_v_version_source_evidence" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_people_evidence_order_idx" ON "_projects_v_version_people_evidence" USING btree ("_order");
  CREATE INDEX "_projects_v_version_people_evidence_parent_id_idx" ON "_projects_v_version_people_evidence" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_people_evidence_profile_idx" ON "_projects_v_version_people_evidence" USING btree ("profile_id");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_claimed_by_id_profiles_id_fk" FOREIGN KEY ("claimed_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_reviewed_by_id_profiles_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_canonical_project_id_projects_id_fk" FOREIGN KEY ("canonical_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_claimed_by_id_profiles_id_fk" FOREIGN KEY ("version_claimed_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_reviewed_by_id_profiles_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_canonical_project_id_projects_id_fk" FOREIGN KEY ("version_canonical_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_project_kind_idx" ON "projects" USING btree ("project_kind");
  CREATE INDEX "projects_review_status_idx" ON "projects" USING btree ("review_status");
  CREATE INDEX "projects_confidence_idx" ON "projects" USING btree ("confidence");
  CREATE INDEX "projects_claimed_by_idx" ON "projects" USING btree ("claimed_by_id");
  CREATE INDEX "projects_reviewed_by_idx" ON "projects" USING btree ("reviewed_by_id");
  CREATE INDEX "projects_started_at_idx" ON "projects" USING btree ("started_at");
  CREATE INDEX "projects_launched_at_idx" ON "projects" USING btree ("launched_at");
  CREATE INDEX "projects_completed_at_idx" ON "projects" USING btree ("completed_at");
  CREATE INDEX "projects_is_featured_idx" ON "projects" USING btree ("is_featured");
  CREATE INDEX "projects_featured_from_idx" ON "projects" USING btree ("featured_from");
  CREATE INDEX "projects_featured_until_idx" ON "projects" USING btree ("featured_until");
  CREATE INDEX "projects_featured_priority_idx" ON "projects" USING btree ("featured_priority");
  CREATE INDEX "projects_canonical_project_idx" ON "projects" USING btree ("canonical_project_id");
  CREATE INDEX "projects_rels_projects_id_idx" ON "projects_rels" USING btree ("projects_id");
  CREATE INDEX "_projects_v_version_version_project_kind_idx" ON "_projects_v" USING btree ("version_project_kind");
  CREATE INDEX "_projects_v_version_version_review_status_idx" ON "_projects_v" USING btree ("version_review_status");
  CREATE INDEX "_projects_v_version_version_confidence_idx" ON "_projects_v" USING btree ("version_confidence");
  CREATE INDEX "_projects_v_version_version_claimed_by_idx" ON "_projects_v" USING btree ("version_claimed_by_id");
  CREATE INDEX "_projects_v_version_version_reviewed_by_idx" ON "_projects_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_projects_v_version_version_started_at_idx" ON "_projects_v" USING btree ("version_started_at");
  CREATE INDEX "_projects_v_version_version_launched_at_idx" ON "_projects_v" USING btree ("version_launched_at");
  CREATE INDEX "_projects_v_version_version_completed_at_idx" ON "_projects_v" USING btree ("version_completed_at");
  CREATE INDEX "_projects_v_version_version_is_featured_idx" ON "_projects_v" USING btree ("version_is_featured");
  CREATE INDEX "_projects_v_version_version_featured_from_idx" ON "_projects_v" USING btree ("version_featured_from");
  CREATE INDEX "_projects_v_version_version_featured_until_idx" ON "_projects_v" USING btree ("version_featured_until");
  CREATE INDEX "_projects_v_version_version_featured_priority_idx" ON "_projects_v" USING btree ("version_featured_priority");
  CREATE INDEX "_projects_v_version_version_canonical_project_idx" ON "_projects_v" USING btree ("version_canonical_project_id");
  CREATE INDEX "_projects_v_rels_projects_id_idx" ON "_projects_v_rels" USING btree ("projects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_open_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_source_evidence" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_people_evidence" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_open_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_source_evidence" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_people_evidence" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_open_questions" CASCADE;
  DROP TABLE "projects_source_evidence" CASCADE;
  DROP TABLE "projects_people_evidence" CASCADE;
  DROP TABLE "_projects_v_version_open_questions" CASCADE;
  DROP TABLE "_projects_v_version_source_evidence" CASCADE;
  DROP TABLE "_projects_v_version_people_evidence" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT "projects_claimed_by_id_profiles_id_fk";
  
  ALTER TABLE "projects" DROP CONSTRAINT "projects_reviewed_by_id_profiles_id_fk";
  
  ALTER TABLE "projects" DROP CONSTRAINT "projects_canonical_project_id_projects_id_fk";
  
  ALTER TABLE "projects_rels" DROP CONSTRAINT "projects_rels_projects_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_claimed_by_id_profiles_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_reviewed_by_id_profiles_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_canonical_project_id_projects_id_fk";
  
  ALTER TABLE "_projects_v_rels" DROP CONSTRAINT "_projects_v_rels_projects_fk";
  
  DROP INDEX "projects_project_kind_idx";
  DROP INDEX "projects_review_status_idx";
  DROP INDEX "projects_confidence_idx";
  DROP INDEX "projects_claimed_by_idx";
  DROP INDEX "projects_reviewed_by_idx";
  DROP INDEX "projects_started_at_idx";
  DROP INDEX "projects_launched_at_idx";
  DROP INDEX "projects_completed_at_idx";
  DROP INDEX "projects_is_featured_idx";
  DROP INDEX "projects_featured_from_idx";
  DROP INDEX "projects_featured_until_idx";
  DROP INDEX "projects_featured_priority_idx";
  DROP INDEX "projects_canonical_project_idx";
  DROP INDEX "projects_rels_projects_id_idx";
  DROP INDEX "_projects_v_version_version_project_kind_idx";
  DROP INDEX "_projects_v_version_version_review_status_idx";
  DROP INDEX "_projects_v_version_version_confidence_idx";
  DROP INDEX "_projects_v_version_version_claimed_by_idx";
  DROP INDEX "_projects_v_version_version_reviewed_by_idx";
  DROP INDEX "_projects_v_version_version_started_at_idx";
  DROP INDEX "_projects_v_version_version_launched_at_idx";
  DROP INDEX "_projects_v_version_version_completed_at_idx";
  DROP INDEX "_projects_v_version_version_is_featured_idx";
  DROP INDEX "_projects_v_version_version_featured_from_idx";
  DROP INDEX "_projects_v_version_version_featured_until_idx";
  DROP INDEX "_projects_v_version_version_featured_priority_idx";
  DROP INDEX "_projects_v_version_version_canonical_project_idx";
  DROP INDEX "_projects_v_rels_projects_id_idx";
  ALTER TABLE "projects" DROP COLUMN "project_kind";
  ALTER TABLE "projects" DROP COLUMN "review_status";
  ALTER TABLE "projects" DROP COLUMN "confidence";
  ALTER TABLE "projects" DROP COLUMN "historical_relevance";
  ALTER TABLE "projects" DROP COLUMN "claimed_by_id";
  ALTER TABLE "projects" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "projects" DROP COLUMN "reviewed_at";
  ALTER TABLE "projects" DROP COLUMN "started_at";
  ALTER TABLE "projects" DROP COLUMN "launched_at";
  ALTER TABLE "projects" DROP COLUMN "completed_at";
  ALTER TABLE "projects" DROP COLUMN "is_featured";
  ALTER TABLE "projects" DROP COLUMN "featured_from";
  ALTER TABLE "projects" DROP COLUMN "featured_until";
  ALTER TABLE "projects" DROP COLUMN "featured_priority";
  ALTER TABLE "projects" DROP COLUMN "canonical_project_id";
  ALTER TABLE "projects" DROP COLUMN "confidence_rationale";
  ALTER TABLE "projects_rels" DROP COLUMN "projects_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_project_kind";
  ALTER TABLE "_projects_v" DROP COLUMN "version_review_status";
  ALTER TABLE "_projects_v" DROP COLUMN "version_confidence";
  ALTER TABLE "_projects_v" DROP COLUMN "version_historical_relevance";
  ALTER TABLE "_projects_v" DROP COLUMN "version_claimed_by_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_reviewed_by_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_reviewed_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_started_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_launched_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_completed_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_is_featured";
  ALTER TABLE "_projects_v" DROP COLUMN "version_featured_from";
  ALTER TABLE "_projects_v" DROP COLUMN "version_featured_until";
  ALTER TABLE "_projects_v" DROP COLUMN "version_featured_priority";
  ALTER TABLE "_projects_v" DROP COLUMN "version_canonical_project_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_confidence_rationale";
  ALTER TABLE "_projects_v_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_projects_open_questions_status";
  DROP TYPE "public"."enum_projects_source_evidence_source_type";
  DROP TYPE "public"."enum_projects_source_evidence_confidence";
  DROP TYPE "public"."enum_projects_people_evidence_source_type";
  DROP TYPE "public"."enum_projects_people_evidence_confidence";
  DROP TYPE "public"."enum_projects_project_kind";
  DROP TYPE "public"."enum_projects_review_status";
  DROP TYPE "public"."enum_projects_confidence";
  DROP TYPE "public"."enum_projects_historical_relevance";
  DROP TYPE "public"."enum__projects_v_version_open_questions_status";
  DROP TYPE "public"."enum__projects_v_version_source_evidence_source_type";
  DROP TYPE "public"."enum__projects_v_version_source_evidence_confidence";
  DROP TYPE "public"."enum__projects_v_version_people_evidence_source_type";
  DROP TYPE "public"."enum__projects_v_version_people_evidence_confidence";
  DROP TYPE "public"."enum__projects_v_version_project_kind";
  DROP TYPE "public"."enum__projects_v_version_review_status";
  DROP TYPE "public"."enum__projects_v_version_confidence";
  DROP TYPE "public"."enum__projects_v_version_historical_relevance";`)
}
