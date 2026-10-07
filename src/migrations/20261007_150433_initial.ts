import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`partite_formazione_a\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`giocatore_id\` integer NOT NULL,
  	\`gol\` numeric DEFAULT 0 NOT NULL,
  	\`voto\` numeric,
  	FOREIGN KEY (\`giocatore_id\`) REFERENCES \`giocatori\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`partite\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`partite_formazione_a_order_idx\` ON \`partite_formazione_a\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`partite_formazione_a_parent_id_idx\` ON \`partite_formazione_a\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`partite_formazione_a_giocatore_idx\` ON \`partite_formazione_a\` (\`giocatore_id\`);`)
  await db.run(sql`CREATE TABLE \`partite_formazione_b\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`giocatore_id\` integer NOT NULL,
  	\`gol\` numeric DEFAULT 0 NOT NULL,
  	\`voto\` numeric,
  	FOREIGN KEY (\`giocatore_id\`) REFERENCES \`giocatori\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`partite\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`partite_formazione_b_order_idx\` ON \`partite_formazione_b\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`partite_formazione_b_parent_id_idx\` ON \`partite_formazione_b\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`partite_formazione_b_giocatore_idx\` ON \`partite_formazione_b\` (\`giocatore_id\`);`)
  await db.run(sql`CREATE TABLE \`partite\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`data\` text NOT NULL,
  	\`squadra_a_id\` integer NOT NULL,
  	\`autogol_a\` numeric DEFAULT 0,
  	\`squadra_b_id\` integer NOT NULL,
  	\`autogol_b\` numeric DEFAULT 0,
  	\`note\` text,
  	\`gol_a\` numeric DEFAULT 0,
  	\`gol_b\` numeric DEFAULT 0,
  	\`giorno\` text,
  	\`titolo\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`squadra_a_id\`) REFERENCES \`squadre\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`squadra_b_id\`) REFERENCES \`squadre\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`partite_data_idx\` ON \`partite\` (\`data\`);`)
  await db.run(sql`CREATE INDEX \`partite_squadra_a_idx\` ON \`partite\` (\`squadra_a_id\`);`)
  await db.run(sql`CREATE INDEX \`partite_squadra_b_idx\` ON \`partite\` (\`squadra_b_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`partite_giorno_idx\` ON \`partite\` (\`giorno\`);`)
  await db.run(sql`CREATE INDEX \`partite_updated_at_idx\` ON \`partite\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`partite_created_at_idx\` ON \`partite\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`giocatori\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`nome\` text NOT NULL,
  	\`cognome\` text NOT NULL,
  	\`soprannome\` text,
  	\`ruolo\` text NOT NULL,
  	\`squadra_abituale_id\` integer,
  	\`foto_id\` integer,
  	\`nome_completo\` text,
  	\`slug\` text,
  	\`attivo\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`squadra_abituale_id\`) REFERENCES \`squadre\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`foto_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`giocatori_squadra_abituale_idx\` ON \`giocatori\` (\`squadra_abituale_id\`);`)
  await db.run(sql`CREATE INDEX \`giocatori_foto_idx\` ON \`giocatori\` (\`foto_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`giocatori_slug_idx\` ON \`giocatori\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`giocatori_updated_at_idx\` ON \`giocatori\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`giocatori_created_at_idx\` ON \`giocatori\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`squadre\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`nome\` text NOT NULL,
  	\`colore\` text DEFAULT '#C6FF3D' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`squadre_nome_idx\` ON \`squadre\` (\`nome\`);`)
  await db.run(sql`CREATE INDEX \`squadre_updated_at_idx\` ON \`squadre\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`squadre_created_at_idx\` ON \`squadre\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_avatar_url\` text,
  	\`sizes_avatar_width\` numeric,
  	\`sizes_avatar_height\` numeric,
  	\`sizes_avatar_mime_type\` text,
  	\`sizes_avatar_filesize\` numeric,
  	\`sizes_avatar_filename\` text,
  	\`sizes_hero_url\` text,
  	\`sizes_hero_width\` numeric,
  	\`sizes_hero_height\` numeric,
  	\`sizes_hero_mime_type\` text,
  	\`sizes_hero_filesize\` numeric,
  	\`sizes_hero_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_avatar_sizes_avatar_filename_idx\` ON \`media\` (\`sizes_avatar_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_hero_sizes_hero_filename_idx\` ON \`media\` (\`sizes_hero_filename\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partite_id_idx\` ON \`payload_locked_documents_rels\` (\`partite_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_giocatori_id_idx\` ON \`payload_locked_documents_rels\` (\`giocatori_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_squadre_id_idx\` ON \`payload_locked_documents_rels\` (\`squadre_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`partite_formazione_a\`;`)
  await db.run(sql`DROP TABLE \`partite_formazione_b\`;`)
  await db.run(sql`DROP TABLE \`partite\`;`)
  await db.run(sql`DROP TABLE \`giocatori\`;`)
  await db.run(sql`DROP TABLE \`squadre\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
