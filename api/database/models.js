// TODO: this or pocketbase?

import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/libsql/migrator';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let _db;
export async function useDatabase() {
  if (!_db) {
    const { db } = await import('./client.js');

    try {
      _db = await migrate(db, {
        migrationsFolder: `${__dirname}/migrations`,
      });
    } catch (e) {
      console.error('Migration failed', e);
    }
  }
  return _db;
}
