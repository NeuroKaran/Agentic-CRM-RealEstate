import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Use an absolute path for the database file to ensure it works across different contexts
const dbPath = path.resolve(__dirname, '../sqlite.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });