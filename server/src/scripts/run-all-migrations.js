#!/usr/bin/env node

/**
 * Run all SQL migrations in order (for new installs).
 * Reads server/src/migrations/*.sql, sorts by numeric prefix (000, 001, …), runs each in sequence.
 *
 * Usage: node run-all-migrations.js
 *    or: npm run migrate:all
 */

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = resolve(__dirname, '..', 'migrations');

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'techforce_portal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };
const pool = new Pool(poolConfig);

function getOrder(name) {
  const match = name.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : 9999;
}

async function runAllMigrations() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => getOrder(a) - getOrder(b) || a.localeCompare(b));

  if (files.length === 0) {
    console.log('\n⚠ No .sql files found in', migrationsDir, '\n');
    process.exit(1);
  }

  console.log('\n📦 Running all migrations for new install');
  console.log('   Database:', poolConfig.database || (poolConfig.connectionString && 'from DATABASE_URL'));
  console.log('   Files:', files.length, '\n');

  const client = await pool.connect();

  try {
    for (const file of files) {
      const path = resolve(migrationsDir, file);
      const sql = readFileSync(path, 'utf8');
      console.log(`   ▶ ${file}`);
      await client.query(sql);
    }

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\n📊 Tables in database:');
    result.rows.forEach((row) => console.log(`   - ${row.table_name}`));
    console.log('\n✅ All migrations completed successfully.\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runAllMigrations();
