# TechForce Portal Backend Server

Backend API server for TechForce Portal using Express and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your database connection in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techforce_portal
DB_USER=postgres
DB_PASSWORD=your_password
```

3. Make sure your PostgreSQL database `techforce_portal` exists:
```sql
CREATE DATABASE techforce_portal;
```

4. Run the development server:
```bash
npm run dev
```

The server will start on http://localhost:3001

## Endpoints

- `GET /api/health` - Health check and database connection status
- `GET /api/db-info` - Database information (database name, user, version)

## Next Steps

After setting up the basic server, you can:
1. Create database tables using SQL migrations
2. Add API routes for orders, clients, leads, etc.
3. Implement CRUD operations for your data models
