import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_newsletter_campaigns_status" AS ENUM('draft', 'test_sent', 'sent', 'archived', 'error');

    CREATE TABLE "newsletter_campaigns" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "post_id" integer NOT NULL,
      "subject" varchar NOT NULL,
      "preheader" varchar,
      "status" "enum_newsletter_campaigns_status" DEFAULT 'draft' NOT NULL,
      "listmonk_campaign_i_d" numeric,
      "listmonk_campaign_u_u_i_d" varchar,
      "listmonk_campaign_u_r_l" varchar,
      "template_i_d" numeric NOT NULL,
      "from_email" varchar NOT NULL,
      "last_synced_at" timestamp(3) with time zone,
      "last_test_sent_at" timestamp(3) with time zone,
      "last_test_email" varchar,
      "last_error" varchar,
      "created_by_id" integer,
      "updated_by_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "newsletter_campaigns_list_i_ds" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "list_i_d" numeric NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_campaigns_id" integer;

    ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "newsletter_campaigns_list_i_ds" ADD CONSTRAINT "newsletter_campaigns_list_i_ds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_campaigns_fk" FOREIGN KEY ("newsletter_campaigns_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "newsletter_campaigns_post_idx" ON "newsletter_campaigns" USING btree ("post_id");
    CREATE INDEX "newsletter_campaigns_status_idx" ON "newsletter_campaigns" USING btree ("status");
    CREATE INDEX "newsletter_campaigns_listmonk_campaign_i_d_idx" ON "newsletter_campaigns" USING btree ("listmonk_campaign_i_d");
    CREATE INDEX "newsletter_campaigns_updated_at_idx" ON "newsletter_campaigns" USING btree ("updated_at");
    CREATE INDEX "newsletter_campaigns_created_at_idx" ON "newsletter_campaigns" USING btree ("created_at");
    CREATE INDEX "newsletter_campaigns_list_i_ds_order_idx" ON "newsletter_campaigns_list_i_ds" USING btree ("_order");
    CREATE INDEX "newsletter_campaigns_list_i_ds_parent_id_idx" ON "newsletter_campaigns_list_i_ds" USING btree ("_parent_id");
    CREATE INDEX "payload_locked_documents_rels_newsletter_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_campaigns_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "newsletter_campaigns_list_i_ds" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "newsletter_campaigns" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "payload_locked_documents_rels_newsletter_campaigns_id_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_list_i_ds_parent_id_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_list_i_ds_order_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_created_at_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_updated_at_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_listmonk_campaign_i_d_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_status_idx";
    DROP INDEX IF EXISTS "newsletter_campaigns_post_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_newsletter_campaigns_fk";
    ALTER TABLE "newsletter_campaigns_list_i_ds" DROP CONSTRAINT IF EXISTS "newsletter_campaigns_list_i_ds_parent_id_fk";
    ALTER TABLE "newsletter_campaigns" DROP CONSTRAINT IF EXISTS "newsletter_campaigns_updated_by_id_users_id_fk";
    ALTER TABLE "newsletter_campaigns" DROP CONSTRAINT IF EXISTS "newsletter_campaigns_created_by_id_users_id_fk";
    ALTER TABLE "newsletter_campaigns" DROP CONSTRAINT IF EXISTS "newsletter_campaigns_post_id_posts_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "newsletter_campaigns_id";
    DROP TABLE IF EXISTS "newsletter_campaigns_list_i_ds";
    DROP TABLE IF EXISTS "newsletter_campaigns";
    DROP TYPE IF EXISTS "public"."enum_newsletter_campaigns_status";
  `)
}
