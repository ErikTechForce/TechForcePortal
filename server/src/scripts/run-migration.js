#!/usr/bin/env node

/**
 * Migration Runner Script
 * Runs SQL migration files against the PostgreSQL database
 * 
 * Usage: node run-migration.js [migration-file.sql]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get migration file from command line or use default
const migrationFile = process.argv[2] || '001_create_tables.sql';
const migrationPath = resolve(__dirname, '..', 'migrations', migrationFile);

// Database connection: use DATABASE_URL on Heroku (with SSL), else DB_* env vars
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'techforce_portal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };
const pool = new Pool(poolConfig);

async function runMigration() {
  try {
    console.log(`\n📦 Running migration: ${migrationFile}\n`);

    // Read the migration file
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Connect to database
    const client = await pool.connect();
    console.log('✓ Connected to database');

    try {
      // Run the migration
      await client.query(sql);
      console.log('✓ Migration executed successfully\n');
      
      // Verify tables were created
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log('📊 Created tables:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
      
    } finally {
      client.release();
    }

    await pool.end();
    console.log('✅ Migration completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.code === 'ENOENT') {
      console.error(`\n   Migration file not found: ${migrationPath}`);
      console.error('   Make sure the file exists in server/src/migrations/\n');
    }
    process.exit(1);
  }
}

runMigration();
