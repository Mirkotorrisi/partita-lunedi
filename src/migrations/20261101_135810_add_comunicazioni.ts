import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`comunicazioni\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`titolo\` text,
  	\`testo\` text NOT NULL,
  	\`inviate\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`comunicazioni_updated_at_idx\` ON \`comunicazioni\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`comunicazioni_created_at_idx\` ON \`comunicazioni\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`comunicazioni_id\` integer REFERENCES comunicazioni(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_comunicazioni_id_idx\` ON \`payload_locked_documents_rels\` (\`comunicazioni_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`comunicazioni\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`partite_id\` integer,
  	\`iscrizioni_id\` integer,
  	\`giocatori_id\` integer,
  	\`squadre_id\` integer,
  	\`dispositivi_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`partite_id\`) REFERENCES \`partite\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`iscrizioni_id\`) REFERENCES \`iscrizioni\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`giocatori_id\`) REFERENCES \`giocatori\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`squadre_id\`) REFERENCES \`squadre\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dispositivi_id\`) REFERENCES \`dispositivi\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "partite_id", "iscrizioni_id", "giocatori_id", "squadre_id", "dispositivi_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "partite_id", "iscrizioni_id", "giocatori_id", "squadre_id", "dispositivi_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partite_id_idx\` ON \`payload_locked_documents_rels\` (\`partite_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_iscrizioni_id_idx\` ON \`payload_locked_documents_rels\` (\`iscrizioni_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_giocatori_id_idx\` ON \`payload_locked_documents_rels\` (\`giocatori_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_squadre_id_idx\` ON \`payload_locked_documents_rels\` (\`squadre_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dispositivi_id_idx\` ON \`payload_locked_documents_rels\` (\`dispositivi_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
