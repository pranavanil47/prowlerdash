import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  if (!_db) {
    _db = drizzle(_pool, { schema });
  }

  return { pool: _pool, db: _db };
}

export const getPool = () => {
  const { pool } = initializeDatabase();
  return pool;
};

export const getDb = () => {
  const { db } = initializeDatabase();
  return db;
};

// For backward compatibility, export a getter for db
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const dbInstance = getDb();
    return (dbInstance as any)[prop];
  }
});

export const pool = new Proxy({} as Pool, {
  get(target, prop) {
    const poolInstance = getPool();
    return (poolInstance as any)[prop];
  }
});