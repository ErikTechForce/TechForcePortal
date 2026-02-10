# Server Setup Instructions

## Step 1: Create Environment File

Create a `.env` file in the `server/` directory with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techforce_portal
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for verification links in emails)
APP_URL=http://localhost:3000

# SMTP – for sending verification emails (optional for local dev; registration still works, email won't be sent)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
MAIL_FROM=noreply@techforcerobotics.com
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password. For email verification, set your SMTP credentials (e.g. Office 365 or Google Workspace for @techforcerobotics.com). See `server/.env.example` for a full template.

## Step 2: Install Dependencies

```bash
cd server
npm install
```

## Step 3: Verify Database Connection

Make sure your PostgreSQL database exists:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database if it doesn't exist
CREATE DATABASE techforce_portal;

-- Verify it was created
\l
```

## Step 4: Start the Server

```bash
npm run dev
```

You should see:
- ✓ Connected to PostgreSQL database
- ✓ Database connection test successful
- 🚀 Server running on http://localhost:3001

## Step 5: Test the Connection

Open your browser or use curl:
- Health check: http://localhost:3001/api/health
- Database info: http://localhost:3001/api/db-info

## Troubleshooting

If you see connection errors:
1. Verify PostgreSQL is running: `Get-Service | Where-Object {$_.Name -like "*postgres*"}`
2. Check your password in `.env` file
3. Verify database name is correct: `techforce_portal`
4. Check PostgreSQL is listening on port 5432
