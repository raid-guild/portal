import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_project_status" AS ENUM('active', 'archived', 'exploratory');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_project_status" AS ENUM('active', 'archived', 'exploratory');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_profiles_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_profiles_visibility" AS ENUM('public', 'authenticated', 'private');
  CREATE TYPE "public"."enum_profile_roles_group" AS ENUM('builder', 'support');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'contributor', 'member');
  CREATE TABLE "projects_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar,
	"url" varchar
  );

  CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"summary" varchar,
	"description" jsonb,
	"project_status" "enum_projects_project_status" DEFAULT 'active',
	"cover_image_id" integer,
	"published_at" timestamp(3) with time zone,
	"slug" varchar,
	"slug_lock" boolean DEFAULT true,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_projects_status" DEFAULT 'draft'
  );

  CREATE TABLE "projects_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"profiles_id" integer,
	"profile_skills_id" integer
  );

  CREATE TABLE "_projects_v_version_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar,
	"url" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_projects_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_title" varchar,
	"version_summary" varchar,
	"version_description" jsonb,
	"version_project_status" "enum__projects_v_version_project_status" DEFAULT 'active',
	"version_cover_image_id" integer,
	"version_published_at" timestamp(3) with time zone,
	"version_slug" varchar,
	"version_slug_lock" boolean DEFAULT true,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
  );

  CREATE TABLE "_projects_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"profiles_id" integer,
	"profile_skills_id" integer
  );

  CREATE TABLE "profiles_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar NOT NULL,
	"url" varchar NOT NULL
  );

  CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"handle" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"bio" varchar NOT NULL,
	"avatar_id" integer,
	"location" varchar,
	"wallet_address" varchar,
	"contact_email" varchar,
	"contact_discord" varchar,
	"contact_telegram" varchar,
	"contact_farcaster" varchar,
	"status" "enum_profiles_status" DEFAULT 'active' NOT NULL,
	"visibility" "enum_profiles_visibility" DEFAULT 'public' NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "profiles_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"profile_skills_id" integer,
	"profile_roles_id" integer
  );

  CREATE TABLE "profile_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"category" varchar,
	"description" varchar,
	"slug" varchar,
	"slug_lock" boolean DEFAULT true,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "profile_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"type" varchar,
	"group" "enum_profile_roles_group",
	"description" varchar,
	"icon_id" integer,
	"slug" varchar,
	"slug_lock" boolean DEFAULT true,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "users_roles" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_users_roles",
	"id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "payload_kv" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"data" jsonb NOT NULL
  );

  DROP INDEX "redirects_from_idx";
  ALTER TABLE "forms_emails" ALTER COLUMN "subject" SET DEFAULT 'You''ve received a new message.';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "profiles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "profile_skills_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "profile_roles_id" integer;
  ALTER TABLE "projects_links" ADD CONSTRAINT "projects_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_profile_skills_fk" FOREIGN KEY ("profile_skills_id") REFERENCES "public"."profile_skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_links" ADD CONSTRAINT "_projects_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_profile_skills_fk" FOREIGN KEY ("profile_skills_id") REFERENCES "public"."profile_skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_links" ADD CONSTRAINT "profiles_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profiles_rels" ADD CONSTRAINT "profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_rels" ADD CONSTRAINT "profiles_rels_profile_skills_fk" FOREIGN KEY ("profile_skills_id") REFERENCES "public"."profile_skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_rels" ADD CONSTRAINT "profiles_rels_profile_roles_fk" FOREIGN KEY ("profile_roles_id") REFERENCES "public"."profile_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile_roles" ADD CONSTRAINT "profile_roles_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_links_order_idx" ON "projects_links" USING btree ("_order");
  CREATE INDEX "projects_links_parent_id_idx" ON "projects_links" USING btree ("_parent_id");
  CREATE INDEX "projects_cover_image_idx" ON "projects" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_profiles_id_idx" ON "projects_rels" USING btree ("profiles_id");
  CREATE INDEX "projects_rels_profile_skills_id_idx" ON "projects_rels" USING btree ("profile_skills_id");
  CREATE INDEX "_projects_v_version_links_order_idx" ON "_projects_v_version_links" USING btree ("_order");
  CREATE INDEX "_projects_v_version_links_parent_id_idx" ON "_projects_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_cover_image_idx" ON "_projects_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_profiles_id_idx" ON "_projects_v_rels" USING btree ("profiles_id");
  CREATE INDEX "_projects_v_rels_profile_skills_id_idx" ON "_projects_v_rels" USING btree ("profile_skills_id");
  CREATE INDEX "profiles_links_order_idx" ON "profiles_links" USING btree ("_order");
  CREATE INDEX "profiles_links_parent_id_idx" ON "profiles_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");
  CREATE UNIQUE INDEX "profiles_handle_idx" ON "profiles" USING btree ("handle");
  CREATE INDEX "profiles_avatar_idx" ON "profiles" USING btree ("avatar_id");
  CREATE INDEX "profiles_updated_at_idx" ON "profiles" USING btree ("updated_at");
  CREATE INDEX "profiles_created_at_idx" ON "profiles" USING btree ("created_at");
  CREATE INDEX "profiles_rels_order_idx" ON "profiles_rels" USING btree ("order");
  CREATE INDEX "profiles_rels_parent_idx" ON "profiles_rels" USING btree ("parent_id");
  CREATE INDEX "profiles_rels_path_idx" ON "profiles_rels" USING btree ("path");
  CREATE INDEX "profiles_rels_profile_skills_id_idx" ON "profiles_rels" USING btree ("profile_skills_id");
  CREATE INDEX "profiles_rels_profile_roles_id_idx" ON "profiles_rels" USING btree ("profile_roles_id");
  CREATE UNIQUE INDEX "profile_skills_title_idx" ON "profile_skills" USING btree ("title");
  CREATE UNIQUE INDEX "profile_skills_slug_idx" ON "profile_skills" USING btree ("slug");
  CREATE INDEX "profile_skills_updated_at_idx" ON "profile_skills" USING btree ("updated_at");
  CREATE INDEX "profile_skills_created_at_idx" ON "profile_skills" USING btree ("created_at");
  CREATE UNIQUE INDEX "profile_roles_title_idx" ON "profile_roles" USING btree ("title");
  CREATE INDEX "profile_roles_icon_idx" ON "profile_roles" USING btree ("icon_id");
  CREATE UNIQUE INDEX "profile_roles_slug_idx" ON "profile_roles" USING btree ("slug");
  CREATE INDEX "profile_roles_updated_at_idx" ON "profile_roles" USING btree ("updated_at");
  CREATE INDEX "profile_roles_created_at_idx" ON "profile_roles" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_skills_fk" FOREIGN KEY ("profile_skills_id") REFERENCES "public"."profile_skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_roles_fk" FOREIGN KEY ("profile_roles_id") REFERENCES "public"."profile_roles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("profiles_id");
  CREATE INDEX "payload_locked_documents_rels_profile_skills_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_skills_id");
  CREATE INDEX "payload_locked_documents_rels_profile_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("profile_roles_id");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profiles_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profiles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profile_skills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "profile_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_kv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_projects_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_profiles_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_profile_skills_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_profile_roles_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_projects_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_profiles_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_profile_skills_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_profile_roles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "projects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "profiles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "profile_skills_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "profile_roles_id";
  DROP TABLE "projects_links" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_links" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "profiles_links" CASCADE;
  DROP TABLE "profiles" CASCADE;
  DROP TABLE "profiles_rels" CASCADE;
  DROP TABLE "profile_skills" CASCADE;
  DROP TABLE "profile_roles" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP INDEX "redirects_from_idx";
  ALTER TABLE "forms_emails" ALTER COLUMN "subject" SET DEFAULT 'You''''ve received a new message.';
  CREATE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  DROP TYPE "public"."enum_projects_project_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_project_status";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum_profiles_status";
  DROP TYPE "public"."enum_profiles_visibility";
  DROP TYPE "public"."enum_profile_roles_group";
  DROP TYPE "public"."enum_users_roles";`)
}
