import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'techforce_portal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

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
    console.log(`  Connected to: ${process.env.DB_NAME || 'techforce_portal'}`);
  }
});

export default pool;
