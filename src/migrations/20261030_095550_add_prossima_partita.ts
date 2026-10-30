import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`prossima_partita\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`giorno\` text,
  	\`ora\` text,
  	\`campo\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`prossima_partita\`;`)
}
