 # Database Migrations

This directory contains SQL migration files for setting up and updating the database schema.

## Running Migrations

### Option 1: Using psql (Recommended)

```bash
# Connect to your database
psql -U postgres -d techforce_portal

# Run migrations in order (001 through 013)
\i server/src/migrations/001_create_tables.sql
\i server/src/migrations/002_create_users_table.sql
\i server/src/migrations/003_add_user_email_verification.sql
\i server/src/migrations/004_add_verification_email_sent_at.sql
\i server/src/migrations/008_create_inventory_tables.sql
\i server/src/migrations/009_clients_type_source_invoices.sql
\i server/src/migrations/010_simplify_order_numbers.sql
\i server/src/migrations/011_user_roles_and_employee_user_id.sql
\i server/src/migrations/012_user_roles_multi.sql
\i server/src/migrations/013_tasks_tags_and_client.sql

# Or from server directory with Node (run a specific file):
# npm run migrate -- 004_add_verification_email_sent_at.sql
```

### Option 2: Using a Database GUI Tool

1. Open your PostgreSQL GUI tool (pgAdmin, DBeaver, etc.)
2. Connect to your `techforce_portal` database
3. Open and execute `001_create_tables.sql`

### Option 3: Using Node.js Script (Future)

A migration runner script can be created to automate this process.

## Migration Files

- `001_create_tables.sql` - Creates all core tables (employees, products, clients, orders, order_products, tasks, robots, activity_logs, chat_messages, contracts)
- `002_create_users_table.sql` - Creates `users` table for login (username, email, password_hash). **Passwords must be hashed in the application (e.g. bcrypt) before storing; never store plain text.**
- `003_add_user_email_verification.sql` - Adds `email_verified_at`, `verification_token`, `verification_token_expires_at` to `users` for email verification. After running, existing users can be marked verified so they can still log in: `UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;`
- `004_add_verification_email_sent_at.sql` - Adds `last_verification_email_sent_at` to `users` for resend-verification rate limiting (30s).
- `008_create_inventory_tables.sql` - Creates inventory tables (schema only, no seed data): `inventory_products`, `inventory_units`, `tim_e_parts_inventory`, `bim_e_parts_inventory`, `operations_inventory`. Use when setting up the database on a local machine for the Inventory and Product inventory features.
- `009_clients_type_source_invoices.sql` - Adds `type` and `source` to `clients`; creates `invoices` table.
- `010_simplify_order_numbers.sql` - Replaces all order numbers with `ORD-00001`, `ORD-00002`, … (5-digit zero-padded). Run after 001 and 009 so existing orders and all referencing tables (order_products, robots, activity_logs, chat_messages, contracts, invoices) are updated. New orders from the API then use this format.
- `011_user_roles_and_employee_user_id.sql` - Adds `role` to `users` (default `'sales'`, one of: admin, accounting, sales, marketing, engineers, installation, logistics) and `user_id` to `employees` (nullable FK to `users.id`). Enables role-based settings and assigning clients/orders to verified users.
- `012_user_roles_multi.sql` - Replaces single `users.role` with `user_roles` table (user_id, role) for multiple roles per user. Adds roles: corporate, r_d, support, customer_service, it, operations, finances, manufacturing, hr. Migrates existing role into user_roles and drops `users.role`.
- `013_tasks_tags_and_client.sql` - Adds `task_tags` (task_id, role) for role-based tags per task; adds `tasks.client_id`; adds status `To-Do` to tasks. Unassigned tasks are visible only to users whose roles match the task's tags.

  **Application note:** When implementing register/login, hash the password with a library like `bcrypt` (e.g. `bcrypt.hash(password, 10)`) before inserting into `password_hash`, and use `bcrypt.compare(plainPassword, row.password_hash)` to verify on login.

## Verification

After running migrations, verify tables were created:

```sql
-- List all tables
\dt

-- Check a specific table structure
\d employees
\d orders
\d users
\d robots
```

## Rollback

To drop all tables (use with caution):

```sql
-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS users CASCADE;
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
