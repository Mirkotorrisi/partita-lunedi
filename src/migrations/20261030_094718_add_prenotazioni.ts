import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`iscrizioni\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`giorno\` text NOT NULL,
  	\`giocatore_id\` integer NOT NULL,
  	\`squadra_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`giocatore_id\`) REFERENCES \`giocatori\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`squadra_id\`) REFERENCES \`squadre\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`iscrizioni_giorno_idx\` ON \`iscrizioni\` (\`giorno\`);`)
  await db.run(sql`CREATE INDEX \`iscrizioni_giocatore_idx\` ON \`iscrizioni\` (\`giocatore_id\`);`)
  await db.run(sql`CREATE INDEX \`iscrizioni_squadra_idx\` ON \`iscrizioni\` (\`squadra_id\`);`)
  await db.run(sql`CREATE INDEX \`iscrizioni_updated_at_idx\` ON \`iscrizioni\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`iscrizioni_created_at_idx\` ON \`iscrizioni\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`giorno_giocatore_idx\` ON \`iscrizioni\` (\`giorno\`,\`giocatore_id\`);`)
  await db.run(sql`CREATE TABLE \`dispositivi\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`giocatore_id\` integer NOT NULL,
  	\`etichetta\` text,
  	\`ultimo_accesso\` text,
  	\`token_hash\` text NOT NULL,
  	\`fingerprint\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`giocatore_id\`) REFERENCES \`giocatori\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`dispositivi_giocatore_idx\` ON \`dispositivi\` (\`giocatore_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`dispositivi_token_hash_idx\` ON \`dispositivi\` (\`token_hash\`);`)
  await db.run(sql`CREATE INDEX \`dispositivi_fingerprint_idx\` ON \`dispositivi\` (\`fingerprint\`);`)
  await db.run(sql`CREATE INDEX \`dispositivi_updated_at_idx\` ON \`dispositivi\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`dispositivi_created_at_idx\` ON \`dispositivi\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`iscrizioni_id\` integer REFERENCES iscrizioni(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`dispositivi_id\` integer REFERENCES dispositivi(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_iscrizioni_id_idx\` ON \`payload_locked_documents_rels\` (\`iscrizioni_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dispositivi_id_idx\` ON \`payload_locked_documents_rels\` (\`dispositivi_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`iscrizioni\`;`)
  await db.run(sql`DROP TABLE \`dispositivi\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`partite_id\` integer,
  	\`giocatori_id\` integer,
  	\`squadre_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`partite_id\`) REFERENCES \`partite\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`giocatori_id\`) REFERENCES \`giocatori\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`squadre_id\`) REFERENCES \`squadre\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "partite_id", "giocatori_id", "squadre_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "partite_id", "giocatori_id", "squadre_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partite_id_idx\` ON \`payload_locked_documents_rels\` (\`partite_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_giocatori_id_idx\` ON \`payload_locked_documents_rels\` (\`giocatori_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_squadre_id_idx\` ON \`payload_locked_documents_rels\` (\`squadre_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
