import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_daily_briefs_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum_daily_briefs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__daily_briefs_v_version_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum__daily_briefs_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "daily_briefs_sections_links" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar,
	"url" varchar
  );

  CREATE TABLE "daily_briefs_sections" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"heading" varchar,
	"body" varchar
  );

  CREATE TABLE "daily_briefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"brief_date" timestamp(3) with time zone,
	"summary" varchar,
	"content" jsonb,
	"visibility" "enum_daily_briefs_visibility" DEFAULT 'authenticated',
	"source_notes" varchar,
	"published_at" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_daily_briefs_status" DEFAULT 'draft'
  );

  CREATE TABLE "daily_briefs_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"posts_id" integer,
	"projects_id" integer,
	"profiles_id" integer,
	"users_id" integer
  );

  CREATE TABLE "_daily_briefs_v_version_sections_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar,
	"url" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_daily_briefs_v_version_sections" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"heading" varchar,
	"body" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_daily_briefs_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_title" varchar,
	"version_brief_date" timestamp(3) with time zone,
	"version_summary" varchar,
	"version_content" jsonb,
	"version_visibility" "enum__daily_briefs_v_version_visibility" DEFAULT 'authenticated',
	"version_source_notes" varchar,
	"version_published_at" timestamp(3) with time zone,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__daily_briefs_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean,
	"autosave" boolean
  );

  CREATE TABLE "_daily_briefs_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"posts_id" integer,
	"projects_id" integer,
	"profiles_id" integer,
	"users_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "daily_briefs_id" integer;
  ALTER TABLE "daily_briefs_sections_links" ADD CONSTRAINT "daily_briefs_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."daily_briefs_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_sections" ADD CONSTRAINT "daily_briefs_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."daily_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."daily_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_version_sections_links" ADD CONSTRAINT "_daily_briefs_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_daily_briefs_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_version_sections" ADD CONSTRAINT "_daily_briefs_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_daily_briefs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v" ADD CONSTRAINT "_daily_briefs_v_parent_id_daily_briefs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."daily_briefs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_daily_briefs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "daily_briefs_sections_links_order_idx" ON "daily_briefs_sections_links" USING btree ("_order");
  CREATE INDEX "daily_briefs_sections_links_parent_id_idx" ON "daily_briefs_sections_links" USING btree ("_parent_id");
  CREATE INDEX "daily_briefs_sections_order_idx" ON "daily_briefs_sections" USING btree ("_order");
  CREATE INDEX "daily_briefs_sections_parent_id_idx" ON "daily_briefs_sections" USING btree ("_parent_id");
  CREATE INDEX "daily_briefs_brief_date_idx" ON "daily_briefs" USING btree ("brief_date");
  CREATE INDEX "daily_briefs_updated_at_idx" ON "daily_briefs" USING btree ("updated_at");
  CREATE INDEX "daily_briefs_created_at_idx" ON "daily_briefs" USING btree ("created_at");
  CREATE INDEX "daily_briefs__status_idx" ON "daily_briefs" USING btree ("_status");
  CREATE INDEX "daily_briefs_rels_order_idx" ON "daily_briefs_rels" USING btree ("order");
  CREATE INDEX "daily_briefs_rels_parent_idx" ON "daily_briefs_rels" USING btree ("parent_id");
  CREATE INDEX "daily_briefs_rels_path_idx" ON "daily_briefs_rels" USING btree ("path");
  CREATE INDEX "daily_briefs_rels_posts_id_idx" ON "daily_briefs_rels" USING btree ("posts_id");
  CREATE INDEX "daily_briefs_rels_projects_id_idx" ON "daily_briefs_rels" USING btree ("projects_id");
  CREATE INDEX "daily_briefs_rels_profiles_id_idx" ON "daily_briefs_rels" USING btree ("profiles_id");
  CREATE INDEX "daily_briefs_rels_users_id_idx" ON "daily_briefs_rels" USING btree ("users_id");
  CREATE INDEX "_daily_briefs_v_version_sections_links_order_idx" ON "_daily_briefs_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_daily_briefs_v_version_sections_links_parent_id_idx" ON "_daily_briefs_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_daily_briefs_v_version_sections_order_idx" ON "_daily_briefs_v_version_sections" USING btree ("_order");
  CREATE INDEX "_daily_briefs_v_version_sections_parent_id_idx" ON "_daily_briefs_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_daily_briefs_v_parent_idx" ON "_daily_briefs_v" USING btree ("parent_id");
  CREATE INDEX "_daily_briefs_v_version_version_brief_date_idx" ON "_daily_briefs_v" USING btree ("version_brief_date");
  CREATE INDEX "_daily_briefs_v_version_version_updated_at_idx" ON "_daily_briefs_v" USING btree ("version_updated_at");
  CREATE INDEX "_daily_briefs_v_version_version_created_at_idx" ON "_daily_briefs_v" USING btree ("version_created_at");
  CREATE INDEX "_daily_briefs_v_version_version__status_idx" ON "_daily_briefs_v" USING btree ("version__status");
  CREATE INDEX "_daily_briefs_v_created_at_idx" ON "_daily_briefs_v" USING btree ("created_at");
  CREATE INDEX "_daily_briefs_v_updated_at_idx" ON "_daily_briefs_v" USING btree ("updated_at");
  CREATE INDEX "_daily_briefs_v_latest_idx" ON "_daily_briefs_v" USING btree ("latest");
  CREATE INDEX "_daily_briefs_v_autosave_idx" ON "_daily_briefs_v" USING btree ("autosave");
  CREATE INDEX "_daily_briefs_v_rels_order_idx" ON "_daily_briefs_v_rels" USING btree ("order");
  CREATE INDEX "_daily_briefs_v_rels_parent_idx" ON "_daily_briefs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_daily_briefs_v_rels_path_idx" ON "_daily_briefs_v_rels" USING btree ("path");
  CREATE INDEX "_daily_briefs_v_rels_posts_id_idx" ON "_daily_briefs_v_rels" USING btree ("posts_id");
  CREATE INDEX "_daily_briefs_v_rels_projects_id_idx" ON "_daily_briefs_v_rels" USING btree ("projects_id");
  CREATE INDEX "_daily_briefs_v_rels_profiles_id_idx" ON "_daily_briefs_v_rels" USING btree ("profiles_id");
  CREATE INDEX "_daily_briefs_v_rels_users_id_idx" ON "_daily_briefs_v_rels" USING btree ("users_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_daily_briefs_fk" FOREIGN KEY ("daily_briefs_id") REFERENCES "public"."daily_briefs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_daily_briefs_id_idx" ON "payload_locked_documents_rels" USING btree ("daily_briefs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "daily_briefs_sections_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "daily_briefs_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "daily_briefs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "daily_briefs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_briefs_v_version_sections_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_briefs_v_version_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_briefs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_briefs_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_daily_briefs_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_daily_briefs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "daily_briefs_id";
  DROP TABLE "daily_briefs_sections_links" CASCADE;
  DROP TABLE "daily_briefs_sections" CASCADE;
  DROP TABLE "daily_briefs" CASCADE;
  DROP TABLE "daily_briefs_rels" CASCADE;
  DROP TABLE "_daily_briefs_v_version_sections_links" CASCADE;
  DROP TABLE "_daily_briefs_v_version_sections" CASCADE;
  DROP TABLE "_daily_briefs_v" CASCADE;
  DROP TABLE "_daily_briefs_v_rels" CASCADE;
  DROP TYPE "public"."enum_daily_briefs_visibility";
  DROP TYPE "public"."enum_daily_briefs_status";
  DROP TYPE "public"."enum__daily_briefs_v_version_visibility";
  DROP TYPE "public"."enum__daily_briefs_v_version_status";`)
}
