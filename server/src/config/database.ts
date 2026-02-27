import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection: use DATABASE_URL on Heroku, else DB_* env vars
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'techforce_portal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
const pool = new Pool(poolConfig);

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('✗ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err: Error | null, res?: pg.QueryResult) => {
  if (err) {
    console.error('✗ Database connection error:', err.message);
    console.error('  Please check your database configuration in .env file');
  } else {
    console.log('✓ Database connection test successful');
    const dbName = process.env.DATABASE_URL
      ? (() => {
          try {
            return new URL(process.env.DATABASE_URL).pathname.slice(1) || 'database';
          } catch {
            return 'database';
          }
        })()
      : (process.env.DB_NAME || 'techforce_portal');
    console.log(`  Connected to: ${dbName}`);
  }
});

export default pool;
