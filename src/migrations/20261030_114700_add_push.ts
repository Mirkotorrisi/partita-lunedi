import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`dispositivi\` ADD \`push_subscription\` text;`)
  await db.run(sql`ALTER TABLE \`prossima_partita\` ADD \`notifica\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`dispositivi\` DROP COLUMN \`push_subscription\`;`)
  await db.run(sql`ALTER TABLE \`prossima_partita\` DROP COLUMN \`notifica\`;`)
}
