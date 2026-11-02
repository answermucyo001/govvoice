import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

const connect = () =>
  mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: true,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined
  });

export const runMigrations = async () => {
  const connection = await connect();
  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename VARCHAR(255) NOT NULL PRIMARY KEY,
         applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const [applied] = await connection.query('SELECT filename FROM schema_migrations');
    const done = new Set(applied.map((row) => row.filename));

    for (const file of files) {
      if (done.has(file)) {
        console.log(`[migrate] skipped ${file}`);
        continue;
      }
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`[migrate] applying ${file}`);
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      console.log(`[migrate] applied ${file}`);
    }

    console.log('[migrate] complete');
  } finally {
    await connection.end();
  }
};

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runMigrations().catch((error) => {
    console.error('[migrate] failed:', error.message);
    process.exitCode = 1;
  });
}

export default runMigrations;
