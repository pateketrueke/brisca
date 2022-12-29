import * as path from 'path';
import * as url from 'url';

import dbSchema from './database/generated/index.js';
import makeConfig from './database/config.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default async Grown => {
  await Grown.use(import('@grown/model/db.js'));
  await Grown.use(import('@grown/model/cli.js'));

  return dbSchema(Grown('Models', {
    include: await Promise.all([
      Grown.Model.DB.bundle({
        models: path.join(__dirname, 'database/models'),
        database: {
          refs: dbSchema['@default'],
          config: makeConfig(process.env, path.join(__dirname, 'database')),
        },
      }),
    ]),
  }));
};
