import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_inquiries_type" AS ENUM('client', 'sponsor', 'grant', 'opportunity', 'general');
    CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'reviewing', 'contacted', 'converted', 'closed', 'spam');
    CREATE TYPE "public"."enum_inquiries_account_link_status" AS ENUM('unlinked', 'linked', 'skipped');
    CREATE TYPE "public"."enum_inquiries_budget_range" AS ENUM('no-budget-yet', 'under-5k', '5k-15k', '15k-50k', '50k-plus', 'unknown');
    CREATE TYPE "public"."enum_inquiries_timeline" AS ENUM('this-week', 'this-month', 'this-quarter', 'flexible');

    CREATE TABLE "inquiries" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" "enum_inquiries_type" NOT NULL,
      "status" "enum_inquiries_status" DEFAULT 'new' NOT NULL,
      "account_link_status" "enum_inquiries_account_link_status" DEFAULT 'unlinked' NOT NULL,
      "name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "organization" varchar,
      "role_or_title" varchar,
      "message" varchar NOT NULL,
      "budget_range" "enum_inquiries_budget_range",
      "timeline" "enum_inquiries_timeline",
      "source_route" varchar,
      "utm_source" varchar,
      "utm_medium" varchar,
      "utm_campaign" varchar,
      "submitter_user_id" integer,
      "submitter_profile_id" integer,
      "related_project_id" integer,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "inquiries_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "url" varchar NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inquiries_id" integer;

    ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_submitter_user_id_users_id_fk" FOREIGN KEY ("submitter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_submitter_profile_id_profiles_id_fk" FOREIGN KEY ("submitter_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "inquiries_links" ADD CONSTRAINT "inquiries_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "inquiries_type_idx" ON "inquiries" USING btree ("type");
    CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");
    CREATE INDEX "inquiries_account_link_status_idx" ON "inquiries" USING btree ("account_link_status");
    CREATE INDEX "inquiries_email_idx" ON "inquiries" USING btree (lower("email"));
    CREATE INDEX "inquiries_submitter_user_idx" ON "inquiries" USING btree ("submitter_user_id");
    CREATE INDEX "inquiries_submitter_profile_idx" ON "inquiries" USING btree ("submitter_profile_id");
    CREATE INDEX "inquiries_related_project_idx" ON "inquiries" USING btree ("related_project_id");
    CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
    CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
    CREATE INDEX "inquiries_links_order_idx" ON "inquiries_links" USING btree ("_order");
    CREATE INDEX "inquiries_links_parent_id_idx" ON "inquiries_links" USING btree ("_parent_id");
    CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries_links" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "inquiries" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_inquiries_id_idx";
    DROP INDEX IF EXISTS "inquiries_links_parent_id_idx";
    DROP INDEX IF EXISTS "inquiries_links_order_idx";
    DROP INDEX IF EXISTS "inquiries_created_at_idx";
    DROP INDEX IF EXISTS "inquiries_updated_at_idx";
    DROP INDEX IF EXISTS "inquiries_related_project_idx";
    DROP INDEX IF EXISTS "inquiries_submitter_profile_idx";
    DROP INDEX IF EXISTS "inquiries_submitter_user_idx";
    DROP INDEX IF EXISTS "inquiries_email_idx";
    DROP INDEX IF EXISTS "inquiries_account_link_status_idx";
    DROP INDEX IF EXISTS "inquiries_status_idx";
    DROP INDEX IF EXISTS "inquiries_type_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_inquiries_fk";
    ALTER TABLE "inquiries_links" DROP CONSTRAINT IF EXISTS "inquiries_links_parent_id_fk";
    ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_related_project_id_projects_id_fk";
    ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_submitter_profile_id_profiles_id_fk";
    ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_submitter_user_id_users_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "inquiries_id";
    DROP TABLE IF EXISTS "inquiries_links" CASCADE;
    DROP TABLE IF EXISTS "inquiries" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_inquiries_timeline";
    DROP TYPE IF EXISTS "public"."enum_inquiries_budget_range";
    DROP TYPE IF EXISTS "public"."enum_inquiries_account_link_status";
    DROP TYPE IF EXISTS "public"."enum_inquiries_status";
    DROP TYPE IF EXISTS "public"."enum_inquiries_type";
  `)
}
