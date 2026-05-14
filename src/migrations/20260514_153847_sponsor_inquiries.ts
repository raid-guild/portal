import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sponsor_inquiries_sponsor_type" AS ENUM('project-opportunity', 'bounty-paid-work', 'grant-funding', 'mentorship-office-hours', 'tooling-infrastructure', 'other');
  CREATE TYPE "public"."enum_sponsor_inquiries_budget_range" AS ENUM('no-budget-yet', 'under-1k', '1k-5k', '5k-15k', '15k-plus', 'unknown');
  CREATE TYPE "public"."enum_sponsor_inquiries_timeline" AS ENUM('this-week', 'this-month', 'next-cohort-cycle', 'flexible');
  CREATE TYPE "public"."enum_sponsor_inquiries_preferred_next_step" AS ENUM('talk-to-someone', 'submit-for-review', 'join-a-session');
  CREATE TYPE "public"."enum_sponsor_inquiries_status" AS ENUM('new', 'reviewing', 'accepted', 'declined', 'converted');
  CREATE TABLE "sponsor_inquiries_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "sponsor_inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"organization" varchar NOT NULL,
  	"sponsor_type" "enum_sponsor_inquiries_sponsor_type" DEFAULT 'project-opportunity' NOT NULL,
  	"opportunity" varchar NOT NULL,
  	"contributor_needs" varchar,
  	"budget_range" "enum_sponsor_inquiries_budget_range" DEFAULT 'unknown',
  	"timeline" "enum_sponsor_inquiries_timeline" DEFAULT 'flexible',
  	"preferred_next_step" "enum_sponsor_inquiries_preferred_next_step" DEFAULT 'talk-to-someone',
  	"can_show_publicly" boolean DEFAULT false,
  	"status" "enum_sponsor_inquiries_status" DEFAULT 'new' NOT NULL,
  	"review_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sponsor_inquiries_id" integer;
  ALTER TABLE "sponsor_inquiries_links" ADD CONSTRAINT "sponsor_inquiries_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponsor_inquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sponsor_inquiries_links_order_idx" ON "sponsor_inquiries_links" USING btree ("_order");
  CREATE INDEX "sponsor_inquiries_links_parent_id_idx" ON "sponsor_inquiries_links" USING btree ("_parent_id");
  CREATE INDEX "sponsor_inquiries_updated_at_idx" ON "sponsor_inquiries" USING btree ("updated_at");
  CREATE INDEX "sponsor_inquiries_created_at_idx" ON "sponsor_inquiries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sponsor_inquiries_fk" FOREIGN KEY ("sponsor_inquiries_id") REFERENCES "public"."sponsor_inquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_sponsor_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("sponsor_inquiries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sponsor_inquiries_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sponsor_inquiries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sponsor_inquiries_links" CASCADE;
  DROP TABLE "sponsor_inquiries" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sponsor_inquiries_fk";
  
  DROP INDEX "payload_locked_documents_rels_sponsor_inquiries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sponsor_inquiries_id";
  DROP TYPE "public"."enum_sponsor_inquiries_sponsor_type";
  DROP TYPE "public"."enum_sponsor_inquiries_budget_range";
  DROP TYPE "public"."enum_sponsor_inquiries_timeline";
  DROP TYPE "public"."enum_sponsor_inquiries_preferred_next_step";
  DROP TYPE "public"."enum_sponsor_inquiries_status";`)
}
