import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_feedback_submissions_type" AS ENUM('bug', 'feedback', 'idea', 'content_issue', 'account_issue', 'other');
    CREATE TYPE "public"."enum_feedback_submissions_status" AS ENUM('new', 'triaged', 'planned', 'resolved', 'closed', 'spam');
    CREATE TYPE "public"."enum_feedback_submissions_priority" AS ENUM('low', 'normal', 'high', 'urgent');

    CREATE TABLE "feedback_submissions" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" "enum_feedback_submissions_type" DEFAULT 'feedback' NOT NULL,
      "status" "enum_feedback_submissions_status" DEFAULT 'new' NOT NULL,
      "priority" "enum_feedback_submissions_priority" DEFAULT 'normal' NOT NULL,
      "title" varchar NOT NULL,
      "message" varchar NOT NULL,
      "email" varchar,
      "submitted_by_id" integer,
      "submitted_profile_id" integer,
      "page_u_r_l" varchar,
      "user_agent" varchar,
      "viewport" jsonb,
      "metadata" jsonb,
      "admin_notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feedback_submissions_id" integer;

    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_submitted_profile_id_profiles_id_fk" FOREIGN KEY ("submitted_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feedback_submissions_fk" FOREIGN KEY ("feedback_submissions_id") REFERENCES "public"."feedback_submissions"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "feedback_submissions_type_idx" ON "feedback_submissions" USING btree ("type");
    CREATE INDEX "feedback_submissions_status_idx" ON "feedback_submissions" USING btree ("status");
    CREATE INDEX "feedback_submissions_priority_idx" ON "feedback_submissions" USING btree ("priority");
    CREATE INDEX "feedback_submissions_email_idx" ON "feedback_submissions" USING btree ("email");
    CREATE INDEX "feedback_submissions_submitted_by_idx" ON "feedback_submissions" USING btree ("submitted_by_id");
    CREATE INDEX "feedback_submissions_submitted_profile_idx" ON "feedback_submissions" USING btree ("submitted_profile_id");
    CREATE INDEX "feedback_submissions_updated_at_idx" ON "feedback_submissions" USING btree ("updated_at");
    CREATE INDEX "feedback_submissions_created_at_idx" ON "feedback_submissions" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_feedback_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("feedback_submissions_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "feedback_submissions" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_feedback_submissions_id_idx";
    DROP INDEX IF EXISTS "feedback_submissions_created_at_idx";
    DROP INDEX IF EXISTS "feedback_submissions_updated_at_idx";
    DROP INDEX IF EXISTS "feedback_submissions_submitted_profile_idx";
    DROP INDEX IF EXISTS "feedback_submissions_submitted_by_idx";
    DROP INDEX IF EXISTS "feedback_submissions_email_idx";
    DROP INDEX IF EXISTS "feedback_submissions_priority_idx";
    DROP INDEX IF EXISTS "feedback_submissions_status_idx";
    DROP INDEX IF EXISTS "feedback_submissions_type_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_feedback_submissions_fk";
    ALTER TABLE "feedback_submissions" DROP CONSTRAINT IF EXISTS "feedback_submissions_submitted_profile_id_profiles_id_fk";
    ALTER TABLE "feedback_submissions" DROP CONSTRAINT IF EXISTS "feedback_submissions_submitted_by_id_users_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "feedback_submissions_id";
    DROP TABLE IF EXISTS "feedback_submissions";

    DROP TYPE IF EXISTS "public"."enum_feedback_submissions_priority";
    DROP TYPE IF EXISTS "public"."enum_feedback_submissions_status";
    DROP TYPE IF EXISTS "public"."enum_feedback_submissions_type";
  `)
}
