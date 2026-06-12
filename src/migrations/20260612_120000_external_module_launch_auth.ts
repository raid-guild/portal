import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_modules_module_kind" AS ENUM('internal', 'external');
    CREATE TYPE "public"."enum_modules_auth_mode" AS ENUM('none', 'signed_launch');
    CREATE TYPE "public"."enum_modules_launch_required_roles_value" AS ENUM('admin', 'editor', 'contributor', 'member', 'agent', 'unverified');

    ALTER TABLE "modules" ADD COLUMN "module_kind" "enum_modules_module_kind" DEFAULT 'internal' NOT NULL;
    ALTER TABLE "modules" ADD COLUMN "auth_mode" "enum_modules_auth_mode" DEFAULT 'none' NOT NULL;
    ALTER TABLE "modules" ADD COLUMN "external_callback_u_r_l" varchar;
    ALTER TABLE "modules" ADD COLUMN "launch_secret_env_key" varchar;
    ALTER TABLE "modules" ADD COLUMN "launch_audience" varchar;
    ALTER TABLE "modules" ADD COLUMN "launch_token_t_t_l_seconds" numeric DEFAULT 120;
    ALTER TABLE "modules" ADD COLUMN "include_email_in_launch" boolean DEFAULT true;
    ALTER TABLE "modules" ADD COLUMN "include_roles_in_launch" boolean DEFAULT true;
    ALTER TABLE "modules" ADD COLUMN "include_profile_in_launch" boolean DEFAULT true;
    ALTER TABLE "modules" ADD COLUMN "include_handle_in_launch" boolean DEFAULT true;
    ALTER TABLE "modules" ADD COLUMN "include_avatar_in_launch" boolean DEFAULT false;
    ALTER TABLE "modules" ADD COLUMN "integration_notes" varchar;

    CREATE TABLE "modules_launch_required_roles" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" "enum_modules_launch_required_roles_value"
    );

    ALTER TABLE "modules_launch_required_roles" ADD CONSTRAINT "modules_launch_required_roles_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "modules_module_kind_idx" ON "modules" USING btree ("module_kind");
    CREATE INDEX "modules_auth_mode_idx" ON "modules" USING btree ("auth_mode");
    CREATE INDEX "modules_launch_required_roles_order_idx" ON "modules_launch_required_roles" USING btree ("order");
    CREATE INDEX "modules_launch_required_roles_parent_id_idx" ON "modules_launch_required_roles" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "modules_launch_required_roles" DISABLE ROW LEVEL SECURITY;

    DROP INDEX IF EXISTS "modules_launch_required_roles_parent_id_idx";
    DROP INDEX IF EXISTS "modules_launch_required_roles_order_idx";
    DROP INDEX IF EXISTS "modules_auth_mode_idx";
    DROP INDEX IF EXISTS "modules_module_kind_idx";

    ALTER TABLE "modules_launch_required_roles" DROP CONSTRAINT IF EXISTS "modules_launch_required_roles_parent_id_fk";
    DROP TABLE IF EXISTS "modules_launch_required_roles";

    ALTER TABLE "modules" DROP COLUMN IF EXISTS "integration_notes";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_avatar_in_launch";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_handle_in_launch";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_profile_in_launch";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_roles_in_launch";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "include_email_in_launch";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "launch_token_t_t_l_seconds";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "launch_audience";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "launch_secret_env_key";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "external_callback_u_r_l";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "auth_mode";
    ALTER TABLE "modules" DROP COLUMN IF EXISTS "module_kind";

    DROP TYPE IF EXISTS "public"."enum_modules_launch_required_roles_value";
    DROP TYPE IF EXISTS "public"."enum_modules_auth_mode";
    DROP TYPE IF EXISTS "public"."enum_modules_module_kind";
  `)
}
