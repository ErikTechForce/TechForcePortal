# Creating Database Tables

This guide will help you create all the necessary tables in your PostgreSQL database.

## Quick Start

### Option 1: Using the Migration Script (Easiest)

```bash
cd server
npm run migrate
```

This will run the default migration file (`001_create_tables.sql`).

### Option 2: Using psql Command Line

```bash
# Connect to your database
psql -U postgres -d techforce_portal

# Run the migration
\i server/src/migrations/001_create_tables.sql

# Or from command line directly:
psql -U postgres -d techforce_portal -f server/src/migrations/001_create_tables.sql
```

### Option 3: Using a Database GUI Tool

1. Open pgAdmin, DBeaver, or your preferred PostgreSQL GUI
2. Connect to your `techforce_portal` database
3. Open the file: `server/src/migrations/001_create_tables.sql`
4. Execute the entire script

## Tables Created

The migration will create the following tables:

1. **employees** - Employee information
2. **products** - Product catalog
3. **clients** - Client/company information
4. **orders** - Order information with stage-specific fields
5. **order_products** - Products associated with orders (with serial numbers)
6. **tasks** - Task management
7. **robots** - Individual robot instances
8. **activity_logs** - Activity tracking for orders
9. **chat_messages** - Chat messages for orders
10. **contracts** - Contract link tracking

## Verify Tables Were Created

### Using psql:
```sql
-- List all tables
\dt

-- Check a specific table structure
\d employees
\d orders
\d robots
```

### Using the API:
After running the server, visit:
```
http://localhost:3001/api/tables
```

This will show you all created tables.

## Table Relationships

- `clients.employee_id` → `employees.id`
- `orders.employee_id` → `employees.id`
- `orders.installation_employee_id` → `employees.id`
- `orders.company_name` → `clients.company` (logical relationship)
- `order_products.order_number` → `orders.order_number`
- `tasks.assigned_to_id` → `employees.id`
- `robots.assigned_to_company_id` → `clients.id`
- `robots.assigned_to_employee_id` → `employees.id`
- `robots.order_number` → `orders.order_number`
- `activity_logs.order_number` → `orders.order_number`
- `chat_messages.order_number` → `orders.order_number`
- `contracts.order_number` → `orders.order_number`

## Next Steps

After creating the tables:

1. **Add initial data** - Insert employees, products, etc.
2. **Test the connection** - Verify your backend can connect
3. **Create API endpoints** - Build routes to interact with the data
4. **Update frontend** - Connect React app to use the API

## Troubleshooting

**Error: relation already exists**
- Tables already exist. You can either:
  - Drop existing tables and re-run (see rollback section)
  - Skip this migration if tables are already set up correctly

**Error: permission denied**
- Make sure your database user has CREATE TABLE permissions
- Try connecting as the postgres superuser

**Error: database does not exist**
- Create the database first: `CREATE DATABASE techforce_portal;`

## Rollback (Drop All Tables)

If you need to start over:

```sql
-- Connect to database
psql -U postgres -d techforce_portal

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS robots CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS order_products CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

Then re-run the migration.
