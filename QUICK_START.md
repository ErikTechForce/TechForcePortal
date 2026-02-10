# Quick Start Guide

## 🚀 Get Your Database Connected in 5 Steps

### Step 1: Create the Database
```bash
psql -U postgres
CREATE DATABASE techforce_portal;
\q
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Create Environment File
```bash
# Option A: Use the interactive setup script
npm run setup-env

# Option B: Manually create server/.env file
# Copy the content below and update with your password:

# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=techforce_portal
# DB_USER=postgres
# DB_PASSWORD=your_password_here
# PORT=3001
# NODE_ENV=development
```

### Step 4: Test the Connection
```bash
npm run dev
```

You should see:
- ✓ Connected to PostgreSQL database
- ✓ Database connection test successful
- 🚀 Server running on http://localhost:3001

### Step 5: Verify It Works
Open in browser: http://localhost:3001/api/health

Should return: `{"status":"ok","database":"connected",...}`

## ✅ Success!

Your backend is now connected to your local PostgreSQL database!

## Next Steps

1. **Create your database tables** - Write SQL scripts to create tables for orders, clients, leads, etc.
2. **Add API routes** - Create endpoints in `server/src/routes/` for your data
3. **Connect frontend** - Update your React app to use the API instead of mock data

## Troubleshooting

**Connection Error?**
- Check PostgreSQL is running: `Get-Service | Where-Object {$_.Name -like "*postgres*"}`
- Verify password in `server/.env`
- Make sure database `techforce_portal` exists

**Port Already in Use?**
- Change `PORT=3001` to a different port in `server/.env`
