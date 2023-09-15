import { db } from '../database/client.js';
import { users } from '../database/schema.js';

export default {
  db: () => db,
  users: () => users,
};
