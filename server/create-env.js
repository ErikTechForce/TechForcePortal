#!/usr/bin/env node

/**
 * Helper script to create .env file for server configuration
 * Run: node create-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createEnvFile() {
  console.log('\n📝 TechForce Portal - Server Environment Setup\n');
  console.log('Please provide your PostgreSQL database credentials:\n');

  const dbHost = await question('Database Host [localhost]: ') || 'localhost';
  const dbPort = await question('Database Port [5432]: ') || '5432';
  const dbName = await question('Database Name [techforce_portal]: ') || 'techforce_portal';
  const dbUser = await question('Database User [postgres]: ') || 'postgres';
  const dbPassword = await question('Database Password: ');
  const port = await question('Server Port [3001]: ') || '3001';

  const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# Server Configuration
PORT=${port}
NODE_ENV=development
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log(`   Location: ${envPath}\n`);
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }

  rl.close();
}

createEnvFile();
