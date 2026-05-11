import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_activity_items_activity_type" AS ENUM('discussion', 'decision', 'project', 'insight', 'blocker', 'event', 'contribution');
  CREATE TYPE "public"."enum_activity_items_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum_activity_items_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__activity_items_v_version_activity_type" AS ENUM('discussion', 'decision', 'project', 'insight', 'blocker', 'event', 'contribution');
  CREATE TYPE "public"."enum__activity_items_v_version_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum__activity_items_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_daily_briefs_engagement_actions_style" AS ENUM('primary', 'secondary');
  CREATE TYPE "public"."enum__daily_briefs_v_version_engagement_actions_style" AS ENUM('primary', 'secondary');
  CREATE TYPE "public"."enum_events_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_projects_resources_resource_type" AS ENUM('link', 'repo', 'design', 'doc', 'calendar', 'discord');
  CREATE TYPE "public"."enum__projects_v_version_resources_resource_type" AS ENUM('link', 'repo', 'design', 'doc', 'calendar', 'discord');
  CREATE TYPE "public"."enum_threads_thread_status" AS ENUM('active', 'paused', 'resolved', 'archived');
  CREATE TYPE "public"."enum_threads_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum_threads_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__threads_v_version_thread_status" AS ENUM('active', 'paused', 'resolved', 'archived');
  CREATE TYPE "public"."enum__threads_v_version_visibility" AS ENUM('authenticated', 'public', 'admin');
  CREATE TYPE "public"."enum__threads_v_version_status" AS ENUM('draft', 'published');
  ALTER TYPE "public"."enum_projects_project_status" ADD VALUE 'building' BEFORE 'archived';
  ALTER TYPE "public"."enum_projects_project_status" ADD VALUE 'exploring';
  ALTER TYPE "public"."enum_projects_project_status" ADD VALUE 'shipping';
  ALTER TYPE "public"."enum__projects_v_version_project_status" ADD VALUE 'building' BEFORE 'archived';
  ALTER TYPE "public"."enum__projects_v_version_project_status" ADD VALUE 'exploring';
  ALTER TYPE "public"."enum__projects_v_version_project_status" ADD VALUE 'shipping';
  CREATE TABLE "activity_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"activity_type" "enum_activity_items_activity_type" DEFAULT 'discussion',
  	"happened_at" timestamp(3) with time zone,
  	"source_label" varchar,
  	"source_u_r_l" varchar,
  	"related_project_id" integer,
  	"related_thread_id" integer,
  	"related_event_id" integer,
  	"visibility" "enum_activity_items_visibility" DEFAULT 'authenticated',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_activity_items_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "activity_items_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"profiles_id" integer
  );
  
  CREATE TABLE "_activity_items_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_body" varchar,
  	"version_activity_type" "enum__activity_items_v_version_activity_type" DEFAULT 'discussion',
  	"version_happened_at" timestamp(3) with time zone,
  	"version_source_label" varchar,
  	"version_source_u_r_l" varchar,
  	"version_related_project_id" integer,
  	"version_related_thread_id" integer,
  	"version_related_event_id" integer,
  	"version_visibility" "enum__activity_items_v_version_visibility" DEFAULT 'authenticated',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__activity_items_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_activity_items_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"profiles_id" integer
  );
  
  CREATE TABLE "daily_briefs_engagement_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"url" varchar,
  	"style" "enum_daily_briefs_engagement_actions_style" DEFAULT 'secondary'
  );
  
  CREATE TABLE "_daily_briefs_v_version_engagement_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"url" varchar,
  	"style" "enum__daily_briefs_v_version_engagement_actions_style" DEFAULT 'secondary',
  	"_uuid" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"summary" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"location_label" varchar,
  	"join_u_r_l" varchar,
  	"calendar_u_r_l" varchar,
  	"discord_event_u_r_l" varchar,
  	"visibility" "enum_events_visibility" DEFAULT 'authenticated',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer,
  	"threads_id" integer,
  	"profiles_id" integer
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_location_label" varchar,
  	"version_join_u_r_l" varchar,
  	"version_calendar_u_r_l" varchar,
  	"version_discord_event_u_r_l" varchar,
  	"version_visibility" "enum__events_v_version_visibility" DEFAULT 'authenticated',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer,
  	"threads_id" integer,
  	"profiles_id" integer
  );
  
  CREATE TABLE "projects_current_state" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar
  );
  
  CREATE TABLE "projects_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"resource_type" "enum_projects_resources_resource_type" DEFAULT 'link'
  );
  
  CREATE TABLE "projects_contribution_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "_projects_v_version_current_state" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"resource_type" "enum__projects_v_version_resources_resource_type" DEFAULT 'link',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_contribution_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "threads_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "threads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"summary" varchar,
  	"thread_status" "enum_threads_thread_status" DEFAULT 'active',
  	"last_active_at" timestamp(3) with time zone,
  	"visibility" "enum_threads_visibility" DEFAULT 'authenticated',
  	"published_at" timestamp(3) with time zone,
  	"slug" varchar,
  	"slug_lock" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_threads_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "threads_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"profiles_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "_threads_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_threads_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_thread_status" "enum__threads_v_version_thread_status" DEFAULT 'active',
  	"version_last_active_at" timestamp(3) with time zone,
  	"version_visibility" "enum__threads_v_version_visibility" DEFAULT 'authenticated',
  	"version_published_at" timestamp(3) with time zone,
  	"version_slug" varchar,
  	"version_slug_lock" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__threads_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_threads_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"profiles_id" integer,
  	"projects_id" integer
  );
  
  ALTER TABLE "daily_briefs" ADD COLUMN "status_label" varchar;
  ALTER TABLE "daily_briefs" ADD COLUMN "focus_label" varchar;
  ALTER TABLE "daily_briefs" ADD COLUMN "next_event_id" integer;
  ALTER TABLE "daily_briefs_rels" ADD COLUMN "activity_items_id" integer;
  ALTER TABLE "daily_briefs_rels" ADD COLUMN "threads_id" integer;
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_status_label" varchar;
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_focus_label" varchar;
  ALTER TABLE "_daily_briefs_v" ADD COLUMN "version_next_event_id" integer;
  ALTER TABLE "_daily_briefs_v_rels" ADD COLUMN "activity_items_id" integer;
  ALTER TABLE "_daily_briefs_v_rels" ADD COLUMN "threads_id" integer;
  ALTER TABLE "projects" ADD COLUMN "last_active_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "primary_c_t_a_label" varchar;
  ALTER TABLE "projects" ADD COLUMN "primary_c_t_a_url" varchar;
  ALTER TABLE "projects_rels" ADD COLUMN "activity_items_id" integer;
  ALTER TABLE "projects_rels" ADD COLUMN "threads_id" integer;
  ALTER TABLE "projects_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_last_active_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_primary_c_t_a_label" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_primary_c_t_a_url" varchar;
  ALTER TABLE "_projects_v_rels" ADD COLUMN "activity_items_id" integer;
  ALTER TABLE "_projects_v_rels" ADD COLUMN "threads_id" integer;
  ALTER TABLE "_projects_v_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activity_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "threads_id" integer;
  ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_related_project_id_projects_id_fk" FOREIGN KEY ("related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_related_thread_id_threads_id_fk" FOREIGN KEY ("related_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_items" ADD CONSTRAINT "activity_items_related_event_id_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_items_rels" ADD CONSTRAINT "activity_items_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "activity_items_rels" ADD CONSTRAINT "activity_items_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activity_items_v" ADD CONSTRAINT "_activity_items_v_parent_id_activity_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activity_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activity_items_v" ADD CONSTRAINT "_activity_items_v_version_related_project_id_projects_id_fk" FOREIGN KEY ("version_related_project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activity_items_v" ADD CONSTRAINT "_activity_items_v_version_related_thread_id_threads_id_fk" FOREIGN KEY ("version_related_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activity_items_v" ADD CONSTRAINT "_activity_items_v_version_related_event_id_events_id_fk" FOREIGN KEY ("version_related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_activity_items_v_rels" ADD CONSTRAINT "_activity_items_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_activity_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_activity_items_v_rels" ADD CONSTRAINT "_activity_items_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_engagement_actions" ADD CONSTRAINT "daily_briefs_engagement_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."daily_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_version_engagement_actions" ADD CONSTRAINT "_daily_briefs_v_version_engagement_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_daily_briefs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_current_state" ADD CONSTRAINT "projects_current_state_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_resources" ADD CONSTRAINT "projects_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_contribution_actions" ADD CONSTRAINT "projects_contribution_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_current_state" ADD CONSTRAINT "_projects_v_version_current_state_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_resources" ADD CONSTRAINT "_projects_v_version_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_contribution_actions" ADD CONSTRAINT "_projects_v_version_contribution_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "threads_links" ADD CONSTRAINT "threads_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "threads_rels" ADD CONSTRAINT "threads_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "threads_rels" ADD CONSTRAINT "threads_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "threads_rels" ADD CONSTRAINT "threads_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_threads_v_version_links" ADD CONSTRAINT "_threads_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_threads_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_threads_v" ADD CONSTRAINT "_threads_v_parent_id_threads_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_threads_v_rels" ADD CONSTRAINT "_threads_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_threads_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_threads_v_rels" ADD CONSTRAINT "_threads_v_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_threads_v_rels" ADD CONSTRAINT "_threads_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "activity_items_happened_at_idx" ON "activity_items" USING btree ("happened_at");
  CREATE INDEX "activity_items_related_project_idx" ON "activity_items" USING btree ("related_project_id");
  CREATE INDEX "activity_items_related_thread_idx" ON "activity_items" USING btree ("related_thread_id");
  CREATE INDEX "activity_items_related_event_idx" ON "activity_items" USING btree ("related_event_id");
  CREATE INDEX "activity_items_updated_at_idx" ON "activity_items" USING btree ("updated_at");
  CREATE INDEX "activity_items_created_at_idx" ON "activity_items" USING btree ("created_at");
  CREATE INDEX "activity_items__status_idx" ON "activity_items" USING btree ("_status");
  CREATE INDEX "activity_items_rels_order_idx" ON "activity_items_rels" USING btree ("order");
  CREATE INDEX "activity_items_rels_parent_idx" ON "activity_items_rels" USING btree ("parent_id");
  CREATE INDEX "activity_items_rels_path_idx" ON "activity_items_rels" USING btree ("path");
  CREATE INDEX "activity_items_rels_profiles_id_idx" ON "activity_items_rels" USING btree ("profiles_id");
  CREATE INDEX "_activity_items_v_parent_idx" ON "_activity_items_v" USING btree ("parent_id");
  CREATE INDEX "_activity_items_v_version_version_happened_at_idx" ON "_activity_items_v" USING btree ("version_happened_at");
  CREATE INDEX "_activity_items_v_version_version_related_project_idx" ON "_activity_items_v" USING btree ("version_related_project_id");
  CREATE INDEX "_activity_items_v_version_version_related_thread_idx" ON "_activity_items_v" USING btree ("version_related_thread_id");
  CREATE INDEX "_activity_items_v_version_version_related_event_idx" ON "_activity_items_v" USING btree ("version_related_event_id");
  CREATE INDEX "_activity_items_v_version_version_updated_at_idx" ON "_activity_items_v" USING btree ("version_updated_at");
  CREATE INDEX "_activity_items_v_version_version_created_at_idx" ON "_activity_items_v" USING btree ("version_created_at");
  CREATE INDEX "_activity_items_v_version_version__status_idx" ON "_activity_items_v" USING btree ("version__status");
  CREATE INDEX "_activity_items_v_created_at_idx" ON "_activity_items_v" USING btree ("created_at");
  CREATE INDEX "_activity_items_v_updated_at_idx" ON "_activity_items_v" USING btree ("updated_at");
  CREATE INDEX "_activity_items_v_latest_idx" ON "_activity_items_v" USING btree ("latest");
  CREATE INDEX "_activity_items_v_rels_order_idx" ON "_activity_items_v_rels" USING btree ("order");
  CREATE INDEX "_activity_items_v_rels_parent_idx" ON "_activity_items_v_rels" USING btree ("parent_id");
  CREATE INDEX "_activity_items_v_rels_path_idx" ON "_activity_items_v_rels" USING btree ("path");
  CREATE INDEX "_activity_items_v_rels_profiles_id_idx" ON "_activity_items_v_rels" USING btree ("profiles_id");
  CREATE INDEX "daily_briefs_engagement_actions_order_idx" ON "daily_briefs_engagement_actions" USING btree ("_order");
  CREATE INDEX "daily_briefs_engagement_actions_parent_id_idx" ON "daily_briefs_engagement_actions" USING btree ("_parent_id");
  CREATE INDEX "_daily_briefs_v_version_engagement_actions_order_idx" ON "_daily_briefs_v_version_engagement_actions" USING btree ("_order");
  CREATE INDEX "_daily_briefs_v_version_engagement_actions_parent_id_idx" ON "_daily_briefs_v_version_engagement_actions" USING btree ("_parent_id");
  CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_projects_id_idx" ON "events_rels" USING btree ("projects_id");
  CREATE INDEX "events_rels_threads_id_idx" ON "events_rels" USING btree ("threads_id");
  CREATE INDEX "events_rels_profiles_id_idx" ON "events_rels" USING btree ("profiles_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_starts_at_idx" ON "_events_v" USING btree ("version_starts_at");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_rels_order_idx" ON "_events_v_rels" USING btree ("order");
  CREATE INDEX "_events_v_rels_parent_idx" ON "_events_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_v_rels_path_idx" ON "_events_v_rels" USING btree ("path");
  CREATE INDEX "_events_v_rels_projects_id_idx" ON "_events_v_rels" USING btree ("projects_id");
  CREATE INDEX "_events_v_rels_threads_id_idx" ON "_events_v_rels" USING btree ("threads_id");
  CREATE INDEX "_events_v_rels_profiles_id_idx" ON "_events_v_rels" USING btree ("profiles_id");
  CREATE INDEX "projects_current_state_order_idx" ON "projects_current_state" USING btree ("_order");
  CREATE INDEX "projects_current_state_parent_id_idx" ON "projects_current_state" USING btree ("_parent_id");
  CREATE INDEX "projects_resources_order_idx" ON "projects_resources" USING btree ("_order");
  CREATE INDEX "projects_resources_parent_id_idx" ON "projects_resources" USING btree ("_parent_id");
  CREATE INDEX "projects_contribution_actions_order_idx" ON "projects_contribution_actions" USING btree ("_order");
  CREATE INDEX "projects_contribution_actions_parent_id_idx" ON "projects_contribution_actions" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_current_state_order_idx" ON "_projects_v_version_current_state" USING btree ("_order");
  CREATE INDEX "_projects_v_version_current_state_parent_id_idx" ON "_projects_v_version_current_state" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_resources_order_idx" ON "_projects_v_version_resources" USING btree ("_order");
  CREATE INDEX "_projects_v_version_resources_parent_id_idx" ON "_projects_v_version_resources" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_contribution_actions_order_idx" ON "_projects_v_version_contribution_actions" USING btree ("_order");
  CREATE INDEX "_projects_v_version_contribution_actions_parent_id_idx" ON "_projects_v_version_contribution_actions" USING btree ("_parent_id");
  CREATE INDEX "threads_links_order_idx" ON "threads_links" USING btree ("_order");
  CREATE INDEX "threads_links_parent_id_idx" ON "threads_links" USING btree ("_parent_id");
  CREATE INDEX "threads_last_active_at_idx" ON "threads" USING btree ("last_active_at");
  CREATE UNIQUE INDEX "threads_slug_idx" ON "threads" USING btree ("slug");
  CREATE INDEX "threads_updated_at_idx" ON "threads" USING btree ("updated_at");
  CREATE INDEX "threads_created_at_idx" ON "threads" USING btree ("created_at");
  CREATE INDEX "threads__status_idx" ON "threads" USING btree ("_status");
  CREATE INDEX "threads_rels_order_idx" ON "threads_rels" USING btree ("order");
  CREATE INDEX "threads_rels_parent_idx" ON "threads_rels" USING btree ("parent_id");
  CREATE INDEX "threads_rels_path_idx" ON "threads_rels" USING btree ("path");
  CREATE INDEX "threads_rels_profiles_id_idx" ON "threads_rels" USING btree ("profiles_id");
  CREATE INDEX "threads_rels_projects_id_idx" ON "threads_rels" USING btree ("projects_id");
  CREATE INDEX "_threads_v_version_links_order_idx" ON "_threads_v_version_links" USING btree ("_order");
  CREATE INDEX "_threads_v_version_links_parent_id_idx" ON "_threads_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_threads_v_parent_idx" ON "_threads_v" USING btree ("parent_id");
  CREATE INDEX "_threads_v_version_version_last_active_at_idx" ON "_threads_v" USING btree ("version_last_active_at");
  CREATE INDEX "_threads_v_version_version_slug_idx" ON "_threads_v" USING btree ("version_slug");
  CREATE INDEX "_threads_v_version_version_updated_at_idx" ON "_threads_v" USING btree ("version_updated_at");
  CREATE INDEX "_threads_v_version_version_created_at_idx" ON "_threads_v" USING btree ("version_created_at");
  CREATE INDEX "_threads_v_version_version__status_idx" ON "_threads_v" USING btree ("version__status");
  CREATE INDEX "_threads_v_created_at_idx" ON "_threads_v" USING btree ("created_at");
  CREATE INDEX "_threads_v_updated_at_idx" ON "_threads_v" USING btree ("updated_at");
  CREATE INDEX "_threads_v_latest_idx" ON "_threads_v" USING btree ("latest");
  CREATE INDEX "_threads_v_rels_order_idx" ON "_threads_v_rels" USING btree ("order");
  CREATE INDEX "_threads_v_rels_parent_idx" ON "_threads_v_rels" USING btree ("parent_id");
  CREATE INDEX "_threads_v_rels_path_idx" ON "_threads_v_rels" USING btree ("path");
  CREATE INDEX "_threads_v_rels_profiles_id_idx" ON "_threads_v_rels" USING btree ("profiles_id");
  CREATE INDEX "_threads_v_rels_projects_id_idx" ON "_threads_v_rels" USING btree ("projects_id");
  ALTER TABLE "daily_briefs" ADD CONSTRAINT "daily_briefs_next_event_id_events_id_fk" FOREIGN KEY ("next_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "daily_briefs_rels" ADD CONSTRAINT "daily_briefs_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v" ADD CONSTRAINT "_daily_briefs_v_version_next_event_id_events_id_fk" FOREIGN KEY ("version_next_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_briefs_v_rels" ADD CONSTRAINT "_daily_briefs_v_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_items_fk" FOREIGN KEY ("activity_items_id") REFERENCES "public"."activity_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_threads_fk" FOREIGN KEY ("threads_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "daily_briefs_next_event_idx" ON "daily_briefs" USING btree ("next_event_id");
  CREATE INDEX "daily_briefs_rels_activity_items_id_idx" ON "daily_briefs_rels" USING btree ("activity_items_id");
  CREATE INDEX "daily_briefs_rels_threads_id_idx" ON "daily_briefs_rels" USING btree ("threads_id");
  CREATE INDEX "_daily_briefs_v_version_version_next_event_idx" ON "_daily_briefs_v" USING btree ("version_next_event_id");
  CREATE INDEX "_daily_briefs_v_rels_activity_items_id_idx" ON "_daily_briefs_v_rels" USING btree ("activity_items_id");
  CREATE INDEX "_daily_briefs_v_rels_threads_id_idx" ON "_daily_briefs_v_rels" USING btree ("threads_id");
  CREATE INDEX "projects_last_active_at_idx" ON "projects" USING btree ("last_active_at");
  CREATE INDEX "projects_rels_activity_items_id_idx" ON "projects_rels" USING btree ("activity_items_id");
  CREATE INDEX "projects_rels_threads_id_idx" ON "projects_rels" USING btree ("threads_id");
  CREATE INDEX "projects_rels_events_id_idx" ON "projects_rels" USING btree ("events_id");
  CREATE INDEX "_projects_v_version_version_last_active_at_idx" ON "_projects_v" USING btree ("version_last_active_at");
  CREATE INDEX "_projects_v_rels_activity_items_id_idx" ON "_projects_v_rels" USING btree ("activity_items_id");
  CREATE INDEX "_projects_v_rels_threads_id_idx" ON "_projects_v_rels" USING btree ("threads_id");
  CREATE INDEX "_projects_v_rels_events_id_idx" ON "_projects_v_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_activity_items_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_items_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_threads_id_idx" ON "payload_locked_documents_rels" USING btree ("threads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "activity_items_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activity_items_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_activity_items_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "daily_briefs_engagement_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_briefs_v_version_engagement_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_current_state" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_contribution_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_current_state" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_contribution_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "threads_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "threads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "threads_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_threads_v_version_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_threads_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_threads_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "activity_items" CASCADE;
  DROP TABLE "activity_items_rels" CASCADE;
  DROP TABLE "_activity_items_v" CASCADE;
  DROP TABLE "_activity_items_v_rels" CASCADE;
  DROP TABLE "daily_briefs_engagement_actions" CASCADE;
  DROP TABLE "_daily_briefs_v_version_engagement_actions" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_rels" CASCADE;
  DROP TABLE "projects_current_state" CASCADE;
  DROP TABLE "projects_resources" CASCADE;
  DROP TABLE "projects_contribution_actions" CASCADE;
  DROP TABLE "_projects_v_version_current_state" CASCADE;
  DROP TABLE "_projects_v_version_resources" CASCADE;
  DROP TABLE "_projects_v_version_contribution_actions" CASCADE;
  DROP TABLE "threads_links" CASCADE;
  DROP TABLE "threads" CASCADE;
  DROP TABLE "threads_rels" CASCADE;
  DROP TABLE "_threads_v_version_links" CASCADE;
  DROP TABLE "_threads_v" CASCADE;
  DROP TABLE "_threads_v_rels" CASCADE;
  ALTER TABLE "daily_briefs" DROP CONSTRAINT "daily_briefs_next_event_id_events_id_fk";
  
  ALTER TABLE "daily_briefs_rels" DROP CONSTRAINT "daily_briefs_rels_activity_items_fk";
  
  ALTER TABLE "daily_briefs_rels" DROP CONSTRAINT "daily_briefs_rels_threads_fk";
  
  ALTER TABLE "_daily_briefs_v" DROP CONSTRAINT "_daily_briefs_v_version_next_event_id_events_id_fk";
  
  ALTER TABLE "_daily_briefs_v_rels" DROP CONSTRAINT "_daily_briefs_v_rels_activity_items_fk";
  
  ALTER TABLE "_daily_briefs_v_rels" DROP CONSTRAINT "_daily_briefs_v_rels_threads_fk";
  
  ALTER TABLE "projects_rels" DROP CONSTRAINT "projects_rels_activity_items_fk";
  
  ALTER TABLE "projects_rels" DROP CONSTRAINT "projects_rels_threads_fk";
  
  ALTER TABLE "projects_rels" DROP CONSTRAINT "projects_rels_events_fk";
  
  ALTER TABLE "_projects_v_rels" DROP CONSTRAINT "_projects_v_rels_activity_items_fk";
  
  ALTER TABLE "_projects_v_rels" DROP CONSTRAINT "_projects_v_rels_threads_fk";
  
  ALTER TABLE "_projects_v_rels" DROP CONSTRAINT "_projects_v_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_activity_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_threads_fk";
  
  ALTER TABLE "projects" ALTER COLUMN "project_status" SET DATA TYPE text;
  ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'active'::text;
  DROP TYPE "public"."enum_projects_project_status";
  CREATE TYPE "public"."enum_projects_project_status" AS ENUM('active', 'archived', 'exploratory');
  ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'active'::"public"."enum_projects_project_status";
  ALTER TABLE "projects" ALTER COLUMN "project_status" SET DATA TYPE "public"."enum_projects_project_status" USING "project_status"::"public"."enum_projects_project_status";
  ALTER TABLE "_projects_v" ALTER COLUMN "version_project_status" SET DATA TYPE text;
  ALTER TABLE "_projects_v" ALTER COLUMN "version_project_status" SET DEFAULT 'active'::text;
  DROP TYPE "public"."enum__projects_v_version_project_status";
  CREATE TYPE "public"."enum__projects_v_version_project_status" AS ENUM('active', 'archived', 'exploratory');
  ALTER TABLE "_projects_v" ALTER COLUMN "version_project_status" SET DEFAULT 'active'::"public"."enum__projects_v_version_project_status";
  ALTER TABLE "_projects_v" ALTER COLUMN "version_project_status" SET DATA TYPE "public"."enum__projects_v_version_project_status" USING "version_project_status"::"public"."enum__projects_v_version_project_status";
  DROP INDEX "daily_briefs_next_event_idx";
  DROP INDEX "daily_briefs_rels_activity_items_id_idx";
  DROP INDEX "daily_briefs_rels_threads_id_idx";
  DROP INDEX "_daily_briefs_v_version_version_next_event_idx";
  DROP INDEX "_daily_briefs_v_rels_activity_items_id_idx";
  DROP INDEX "_daily_briefs_v_rels_threads_id_idx";
  DROP INDEX "projects_last_active_at_idx";
  DROP INDEX "projects_rels_activity_items_id_idx";
  DROP INDEX "projects_rels_threads_id_idx";
  DROP INDEX "projects_rels_events_id_idx";
  DROP INDEX "_projects_v_version_version_last_active_at_idx";
  DROP INDEX "_projects_v_rels_activity_items_id_idx";
  DROP INDEX "_projects_v_rels_threads_id_idx";
  DROP INDEX "_projects_v_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_activity_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_threads_id_idx";
  ALTER TABLE "daily_briefs" DROP COLUMN "status_label";
  ALTER TABLE "daily_briefs" DROP COLUMN "focus_label";
  ALTER TABLE "daily_briefs" DROP COLUMN "next_event_id";
  ALTER TABLE "daily_briefs_rels" DROP COLUMN "activity_items_id";
  ALTER TABLE "daily_briefs_rels" DROP COLUMN "threads_id";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_status_label";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_focus_label";
  ALTER TABLE "_daily_briefs_v" DROP COLUMN "version_next_event_id";
  ALTER TABLE "_daily_briefs_v_rels" DROP COLUMN "activity_items_id";
  ALTER TABLE "_daily_briefs_v_rels" DROP COLUMN "threads_id";
  ALTER TABLE "projects" DROP COLUMN "last_active_at";
  ALTER TABLE "projects" DROP COLUMN "primary_c_t_a_label";
  ALTER TABLE "projects" DROP COLUMN "primary_c_t_a_url";
  ALTER TABLE "projects_rels" DROP COLUMN "activity_items_id";
  ALTER TABLE "projects_rels" DROP COLUMN "threads_id";
  ALTER TABLE "projects_rels" DROP COLUMN "events_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_last_active_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_primary_c_t_a_label";
  ALTER TABLE "_projects_v" DROP COLUMN "version_primary_c_t_a_url";
  ALTER TABLE "_projects_v_rels" DROP COLUMN "activity_items_id";
  ALTER TABLE "_projects_v_rels" DROP COLUMN "threads_id";
  ALTER TABLE "_projects_v_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activity_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "threads_id";
  DROP TYPE "public"."enum_activity_items_activity_type";
  DROP TYPE "public"."enum_activity_items_visibility";
  DROP TYPE "public"."enum_activity_items_status";
  DROP TYPE "public"."enum__activity_items_v_version_activity_type";
  DROP TYPE "public"."enum__activity_items_v_version_visibility";
  DROP TYPE "public"."enum__activity_items_v_version_status";
  DROP TYPE "public"."enum_daily_briefs_engagement_actions_style";
  DROP TYPE "public"."enum__daily_briefs_v_version_engagement_actions_style";
  DROP TYPE "public"."enum_events_visibility";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_visibility";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_projects_resources_resource_type";
  DROP TYPE "public"."enum__projects_v_version_resources_resource_type";
  DROP TYPE "public"."enum_threads_thread_status";
  DROP TYPE "public"."enum_threads_visibility";
  DROP TYPE "public"."enum_threads_status";
  DROP TYPE "public"."enum__threads_v_version_thread_status";
  DROP TYPE "public"."enum__threads_v_version_visibility";
  DROP TYPE "public"."enum__threads_v_version_status";`)
}
