# Database Setup Guide

This guide will help you set up your local PostgreSQL database for the TechForce Portal project.

## Prerequisites

- PostgreSQL installed and running on your local machine
- Database `techforce_portal` created (see below)

## Step 1: Create the Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE techforce_portal;

# Verify it was created
\l

# Exit psql
\q
```

## Step 2: Configure Backend Connection

1. Navigate to the `server/` directory
2. Create a `.env` file (copy from `.env.example` if it exists, or create new)
3. Add your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techforce_portal
DB_USER=postgres
DB_PASSWORD=your_postgres_password
PORT=3001
NODE_ENV=development
```

**Important:** Replace `your_postgres_password` with your actual PostgreSQL password.

## Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

## Step 4: Test the Connection

Start the backend server:

```bash
npm run dev
```

You should see:
- ✓ Connected to PostgreSQL database
- ✓ Database connection test successful
- 🚀 Server running on http://localhost:3001

## Step 5: Verify Connection

Test the API endpoints:

1. **Health Check:**
   ```
   http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","database":"connected",...}`

2. **Database Info:**
   ```
   http://localhost:3001/api/db-info
   ```
   Should return database name, user, and version

## Next Steps

After the connection is working:

1. **Create Tables:** Run SQL scripts to create your database tables
2. **Add Seed Data:** Insert initial data if needed
3. **Create API Routes:** Add endpoints for orders, clients, leads, etc.

## Troubleshooting

### Connection Refused
- Verify PostgreSQL is running: `Get-Service | Where-Object {$_.Name -like "*postgres*"}`
- Check if PostgreSQL is listening on port 5432
- Verify firewall settings

### Authentication Failed
- Double-check your password in `.env` file
- Verify the database user has proper permissions
- Try connecting with psql to verify credentials: `psql -U postgres -d techforce_portal`

### Database Does Not Exist
- Create the database: `CREATE DATABASE techforce_portal;`
- Verify database name matches in `.env` file

## For Production/Online Hosting

When hosting online, you'll need to:

1. Set up a PostgreSQL database (managed service or self-hosted)
2. Update `.env` with production database credentials
3. Ensure your server can reach the database (network/firewall configuration)
4. Use environment variables on your hosting platform (don't commit `.env` to git)
