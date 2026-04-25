// db.js
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool(
  process.env.SUPABASE_DB_URL
    ? { connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.PGHOST,
        port:     Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE,
        user:     process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl:      { rejectUnauthorized: false }, // required for Supabase
        max:      10,   // max connections in pool
        idleTimeoutMillis:    30000,
        connectionTimeoutMillis: 5000,
      }
);

// Fail fast on startup if DB is unreachable
pool.query('SELECT 1').catch(err => {
  console.error('❌ Supabase DB connection failed:', err.message);
  process.exit(1);
});

export default pool;
