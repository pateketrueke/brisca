import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/libsql/migrator';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default async Grown => {
  return Grown('Models', {
    async connect() {
      const { db } = await import('./client.js');

      await migrate(db, {
        migrationsFolder: `${__dirname}/migrations`,
      });
    },
  });
};
