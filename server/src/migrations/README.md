# Database Migrations

This directory contains SQL migration files for setting up and updating the database schema.

## Running Migrations

### Option 1: Using psql (Recommended)

```bash
# Connect to your database
psql -U postgres -d techforce_portal

# Run migrations in order (001, 002, 003, 004)
\i server/src/migrations/001_create_tables.sql
\i server/src/migrations/002_create_users_table.sql
\i server/src/migrations/003_add_user_email_verification.sql
\i server/src/migrations/004_add_verification_email_sent_at.sql

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
