import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_modules_launch_required_roles_value'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_modules_launch_required_roles'
      ) THEN
        ALTER TYPE "public"."enum_modules_launch_required_roles_value"
          RENAME TO "enum_modules_launch_required_roles";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_modules_launch_required_roles'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_modules_launch_required_roles_value'
      ) THEN
        ALTER TYPE "public"."enum_modules_launch_required_roles"
          RENAME TO "enum_modules_launch_required_roles_value";
      END IF;
    END $$;
  `)
}
