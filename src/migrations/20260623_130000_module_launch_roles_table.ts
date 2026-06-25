import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'modules_launch_required_roles'
      ) THEN
        CREATE TEMP TABLE modules_launch_required_roles_backup AS
          SELECT "order", "parent_id", "value"
          FROM "public"."modules_launch_required_roles";

        DROP TABLE "public"."modules_launch_required_roles" CASCADE;

        CREATE TABLE "public"."modules_launch_required_roles" (
          "order" integer NOT NULL,
          "parent_id" integer NOT NULL,
          "id" serial PRIMARY KEY NOT NULL,
          "value" "public"."enum_modules_launch_required_roles"
        );

        INSERT INTO "public"."modules_launch_required_roles" ("order", "parent_id", "value")
          SELECT "order", "parent_id", "value"
          FROM modules_launch_required_roles_backup;

        DROP TABLE modules_launch_required_roles_backup;

        ALTER TABLE "public"."modules_launch_required_roles"
          ADD CONSTRAINT "modules_launch_required_roles_parent_id_fk"
          FOREIGN KEY ("parent_id")
          REFERENCES "public"."modules"("id")
          ON DELETE cascade
          ON UPDATE no action;

        CREATE INDEX "modules_launch_required_roles_order_idx"
          ON "public"."modules_launch_required_roles" USING btree ("order");
        CREATE INDEX "modules_launch_required_roles_parent_id_idx"
          ON "public"."modules_launch_required_roles" USING btree ("parent_id");
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'modules_launch_required_roles'
      ) THEN
        CREATE TEMP TABLE modules_launch_required_roles_backup AS
          SELECT "order", "parent_id", "value"
          FROM "public"."modules_launch_required_roles";

        DROP TABLE "public"."modules_launch_required_roles" CASCADE;

        CREATE TABLE "public"."modules_launch_required_roles" (
          "order" integer NOT NULL,
          "parent_id" integer NOT NULL,
          "id" varchar PRIMARY KEY NOT NULL,
          "value" "public"."enum_modules_launch_required_roles"
        );

        INSERT INTO "public"."modules_launch_required_roles" ("order", "parent_id", "id", "value")
          SELECT "order", "parent_id", gen_random_uuid()::text, "value"
          FROM modules_launch_required_roles_backup;

        DROP TABLE modules_launch_required_roles_backup;

        ALTER TABLE "public"."modules_launch_required_roles"
          ADD CONSTRAINT "modules_launch_required_roles_parent_id_fk"
          FOREIGN KEY ("parent_id")
          REFERENCES "public"."modules"("id")
          ON DELETE cascade
          ON UPDATE no action;

        CREATE INDEX "modules_launch_required_roles_order_idx"
          ON "public"."modules_launch_required_roles" USING btree ("order");
        CREATE INDEX "modules_launch_required_roles_parent_id_idx"
          ON "public"."modules_launch_required_roles" USING btree ("parent_id");
      END IF;
    END $$;
  `)
}
