import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_modules_status" AS ENUM('idea', 'prototype', 'experimental', 'active', 'graduated', 'archived');
    CREATE TYPE "public"."enum_modules_visibility" AS ENUM('public', 'authenticated', 'member', 'admin');
    CREATE TYPE "public"."enum_modules_core_primitive_relationships_primitive" AS ENUM('brief', 'project', 'thread', 'activityItem', 'event', 'profile', 'post');

    CREATE TABLE "modules" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "summary" varchar NOT NULL,
      "status" "enum_modules_status" DEFAULT 'idea' NOT NULL,
      "visibility" "enum_modules_visibility" DEFAULT 'authenticated' NOT NULL,
      "enabled" boolean DEFAULT true,
      "featured" boolean DEFAULT false,
      "sort_order" numeric DEFAULT 0,
      "entry_route" varchar,
      "admin_route" varchar,
      "spec_u_r_l" varchar,
      "repository_u_r_l" varchar,
      "source_project_id" integer,
      "graduation_criteria" varchar,
      "risk_notes" varchar,
      "last_reviewed_at" timestamp(3) with time zone,
      "slug" varchar,
      "slug_lock" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "modules_owned_collections" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "collection_slug" varchar NOT NULL
    );

    CREATE TABLE "modules_core_primitive_relationships" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "primitive" "enum_modules_core_primitive_relationships_primitive" NOT NULL
    );

    CREATE TABLE "modules_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "profiles_id" integer,
      "projects_id" integer,
      "threads_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modules_id" integer;

    ALTER TABLE "modules" ADD CONSTRAINT "modules_source_project_id_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "modules_owned_collections" ADD CONSTRAINT "modules_owned_collections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "modules_core_primitive_relationships" ADD CONSTRAINT "modules_core_primitive_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "modules_rels" ADD CONSTRAINT "modules_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "modules_rels" ADD CONSTRAINT "modules_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "modules_rels" ADD CONSTRAINT "modules_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "modules_rels" ADD CONSTRAINT "modules_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modules_fk" FOREIGN KEY ("modules_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "modules_name_idx" ON "modules" USING btree ("name");
    CREATE INDEX "modules_status_idx" ON "modules" USING btree ("status");
    CREATE INDEX "modules_visibility_idx" ON "modules" USING btree ("visibility");
    CREATE INDEX "modules_enabled_idx" ON "modules" USING btree ("enabled");
    CREATE INDEX "modules_featured_idx" ON "modules" USING btree ("featured");
    CREATE INDEX "modules_source_project_idx" ON "modules" USING btree ("source_project_id");
    CREATE UNIQUE INDEX "modules_slug_idx" ON "modules" USING btree ("slug");
    CREATE INDEX "modules_updated_at_idx" ON "modules" USING btree ("updated_at");
    CREATE INDEX "modules_created_at_idx" ON "modules" USING btree ("created_at");
    CREATE INDEX "modules_owned_collections_order_idx" ON "modules_owned_collections" USING btree ("_order");
    CREATE INDEX "modules_owned_collections_parent_id_idx" ON "modules_owned_collections" USING btree ("_parent_id");
    CREATE INDEX "modules_core_primitive_relationships_order_idx" ON "modules_core_primitive_relationships" USING btree ("_order");
    CREATE INDEX "modules_core_primitive_relationships_parent_id_idx" ON "modules_core_primitive_relationships" USING btree ("_parent_id");
    CREATE INDEX "modules_rels_order_idx" ON "modules_rels" USING btree ("order");
    CREATE INDEX "modules_rels_parent_idx" ON "modules_rels" USING btree ("parent_id");
    CREATE INDEX "modules_rels_path_idx" ON "modules_rels" USING btree ("path");
    CREATE INDEX "modules_rels_profiles_id_idx" ON "modules_rels" USING btree ("profiles_id");
    CREATE INDEX "modules_rels_projects_id_idx" ON "modules_rels" USING btree ("projects_id");
    CREATE INDEX "modules_rels_threads_id_idx" ON "modules_rels" USING btree ("threads_id");
    CREATE INDEX "payload_locked_documents_rels_modules_id_idx" ON "payload_locked_documents_rels" USING btree ("modules_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "modules_core_primitive_relationships" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "modules_owned_collections" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "modules_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "modules" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_modules_id_idx";
    DROP INDEX IF EXISTS "modules_rels_threads_id_idx";
    DROP INDEX IF EXISTS "modules_rels_projects_id_idx";
    DROP INDEX IF EXISTS "modules_rels_profiles_id_idx";
    DROP INDEX IF EXISTS "modules_rels_path_idx";
    DROP INDEX IF EXISTS "modules_rels_parent_idx";
    DROP INDEX IF EXISTS "modules_rels_order_idx";
    DROP INDEX IF EXISTS "modules_core_primitive_relationships_parent_id_idx";
    DROP INDEX IF EXISTS "modules_core_primitive_relationships_order_idx";
    DROP INDEX IF EXISTS "modules_owned_collections_parent_id_idx";
    DROP INDEX IF EXISTS "modules_owned_collections_order_idx";
    DROP INDEX IF EXISTS "modules_created_at_idx";
    DROP INDEX IF EXISTS "modules_updated_at_idx";
    DROP INDEX IF EXISTS "modules_slug_idx";
    DROP INDEX IF EXISTS "modules_source_project_idx";
    DROP INDEX IF EXISTS "modules_featured_idx";
    DROP INDEX IF EXISTS "modules_enabled_idx";
    DROP INDEX IF EXISTS "modules_visibility_idx";
    DROP INDEX IF EXISTS "modules_status_idx";
    DROP INDEX IF EXISTS "modules_name_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_modules_fk";
    ALTER TABLE "modules_rels" DROP CONSTRAINT IF EXISTS "modules_rels_threads_fk";
    ALTER TABLE "modules_rels" DROP CONSTRAINT IF EXISTS "modules_rels_projects_fk";
    ALTER TABLE "modules_rels" DROP CONSTRAINT IF EXISTS "modules_rels_profiles_fk";
    ALTER TABLE "modules_rels" DROP CONSTRAINT IF EXISTS "modules_rels_parent_fk";
    ALTER TABLE "modules_core_primitive_relationships" DROP CONSTRAINT IF EXISTS "modules_core_primitive_relationships_parent_id_fk";
    ALTER TABLE "modules_owned_collections" DROP CONSTRAINT IF EXISTS "modules_owned_collections_parent_id_fk";
    ALTER TABLE "modules" DROP CONSTRAINT IF EXISTS "modules_source_project_id_projects_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "modules_id";
    DROP TABLE IF EXISTS "modules_rels";
    DROP TABLE IF EXISTS "modules_core_primitive_relationships";
    DROP TABLE IF EXISTS "modules_owned_collections";
    DROP TABLE IF EXISTS "modules";

    DROP TYPE IF EXISTS "public"."enum_modules_core_primitive_relationships_primitive";
    DROP TYPE IF EXISTS "public"."enum_modules_visibility";
    DROP TYPE IF EXISTS "public"."enum_modules_status";
  `)
}
