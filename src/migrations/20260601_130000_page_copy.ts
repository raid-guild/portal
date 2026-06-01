import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_page_copy_surface" AS ENUM('join', 'inquiry', 'brief', 'other');
    CREATE TYPE "public"."enum_page_copy_status" AS ENUM('draft', 'published');

    CREATE TABLE "page_copy" (
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "key" varchar NOT NULL,
      "surface" "enum_page_copy_surface" DEFAULT 'other' NOT NULL,
      "status" "enum_page_copy_status" DEFAULT 'published' NOT NULL,
      "eyebrow" varchar,
      "headline" varchar,
      "intro" varchar,
      "secondary_intro" varchar,
      "benefits_heading" varchar,
      "funnel_eyebrow" varchar,
      "funnel_heading" varchar,
      "context_heading" varchar,
      "context_body" varchar,
      "message_label" varchar,
      "submit_label" varchar,
      "post_submit_eyebrow" varchar,
      "post_submit_heading" varchar,
      "post_submit_body" varchar,
      "create_account_label" varchar,
      "submit_another_label" varchar,
      "back_link_label" varchar,
      "seo_title" varchar,
      "seo_description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "page_copy_benefits" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "body" varchar NOT NULL
    );

    CREATE TABLE "page_copy_funnel_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "description" varchar,
      "href" varchar NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_copy_id" integer;

    ALTER TABLE "page_copy_benefits" ADD CONSTRAINT "page_copy_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_copy"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "page_copy_funnel_links" ADD CONSTRAINT "page_copy_funnel_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_copy"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_copy_fk" FOREIGN KEY ("page_copy_id") REFERENCES "public"."page_copy"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "page_copy_key_idx" ON "page_copy" USING btree ("key");
    CREATE INDEX "page_copy_surface_idx" ON "page_copy" USING btree ("surface");
    CREATE INDEX "page_copy_status_idx" ON "page_copy" USING btree ("status");
    CREATE INDEX "page_copy_updated_at_idx" ON "page_copy" USING btree ("updated_at");
    CREATE INDEX "page_copy_created_at_idx" ON "page_copy" USING btree ("created_at");
    CREATE INDEX "page_copy_benefits_order_idx" ON "page_copy_benefits" USING btree ("_order");
    CREATE INDEX "page_copy_benefits_parent_id_idx" ON "page_copy_benefits" USING btree ("_parent_id");
    CREATE INDEX "page_copy_funnel_links_order_idx" ON "page_copy_funnel_links" USING btree ("_order");
    CREATE INDEX "page_copy_funnel_links_parent_id_idx" ON "page_copy_funnel_links" USING btree ("_parent_id");
    CREATE INDEX "payload_locked_documents_rels_page_copy_id_idx" ON "payload_locked_documents_rels" USING btree ("page_copy_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "page_copy_funnel_links" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "page_copy_benefits" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "page_copy" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_page_copy_id_idx";
    DROP INDEX IF EXISTS "page_copy_funnel_links_parent_id_idx";
    DROP INDEX IF EXISTS "page_copy_funnel_links_order_idx";
    DROP INDEX IF EXISTS "page_copy_benefits_parent_id_idx";
    DROP INDEX IF EXISTS "page_copy_benefits_order_idx";
    DROP INDEX IF EXISTS "page_copy_created_at_idx";
    DROP INDEX IF EXISTS "page_copy_updated_at_idx";
    DROP INDEX IF EXISTS "page_copy_status_idx";
    DROP INDEX IF EXISTS "page_copy_surface_idx";
    DROP INDEX IF EXISTS "page_copy_key_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_page_copy_fk";
    ALTER TABLE "page_copy_funnel_links" DROP CONSTRAINT IF EXISTS "page_copy_funnel_links_parent_id_fk";
    ALTER TABLE "page_copy_benefits" DROP CONSTRAINT IF EXISTS "page_copy_benefits_parent_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "page_copy_id";
    DROP TABLE IF EXISTS "page_copy_funnel_links";
    DROP TABLE IF EXISTS "page_copy_benefits";
    DROP TABLE IF EXISTS "page_copy";

    DROP TYPE IF EXISTS "public"."enum_page_copy_status";
    DROP TYPE IF EXISTS "public"."enum_page_copy_surface";
  `)
}
