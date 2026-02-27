import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from './config/database.js';
import { sendVerificationEmail, sendTaskAssignedEmail, sendInvoiceConfirmationEmail } from './config/mailer.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const BCRYPT_ROUNDS = 10;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Middleware (higher limit for contract payloads with base64 PDFs)
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database info endpoint (for debugging)
app.get('/api/db-info', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/activity — site-wide activity log for dashboard (orders, tasks, etc.)
app.get('/api/activity', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const result = await pool.query(
      `SELECT id, action, "user", created_at FROM site_activity ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ entries: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    if (e.code === '42P01') {
      res.json({ entries: [] });
      return;
    }
    res.status(500).json({ error: (e as { message?: string }).message || 'Failed to fetch activity.' });
  }
});

// Tables info endpoint (verify tables exist)
app.get('/api/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    res.json({ 
      tables: result.rows.map(row => row.table_name),
      count: result.rows.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// AUTH ROUTES (register / login with bcrypt)
// ============================================

// POST /api/auth/register — create user, send verification email (password hashed with bcrypt)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const emailLower = email.trim().toLowerCase();
    if (!emailLower.endsWith('@techforcerobotics.com')) {
      return res.status(400).json({ error: 'Only @techforcerobotics.com email addresses can register.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const username = name.trim();
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const insertResult = await pool.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [username, emailLower, password_hash]
    );
    const userId = insertResult.rows[0].id as number;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await pool.query(
      `UPDATE users SET verification_token = $1, verification_token_expires_at = $2, last_verification_email_sent_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [verificationToken, expiresAt, userId]
    );
    const verificationLink = `${APP_URL}/verify-email?token=${verificationToken}`;
    try {
      await sendVerificationEmail(emailLower, verificationLink);
    } catch (mailErr) {
      console.error('Verification email send failed:', mailErr);
    }
    res.status(201).json({
      success: true,
      message: 'Account created. Check your email to verify your address, then sign in.',
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already in use.' });
    }
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// GET /api/auth/verify-email — verify email via token from link
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const token = (req.query.token as string)?.trim();
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing verification token.' });
    }
    const result = await pool.query(
      `SELECT id, verification_token_expires_at FROM users WHERE verification_token = $1`,
      [token]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification link.' });
    }
    const expiresAt = user.verification_token_expires_at ? new Date(user.verification_token_expires_at) : null;
    if (!expiresAt || expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Verification link has expired.' });
    }
    await pool.query(
      `UPDATE users SET email_verified_at = CURRENT_TIMESTAMP, verification_token = NULL, verification_token_expires_at = NULL WHERE id = $1`,
      [user.id]
    );
    res.json({ success: true, message: 'Email verified. You can sign in now.' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ success: false, error: err.message || 'Verification failed.' });
  }
});

// POST /api/auth/login — verify email/password (bcrypt.compare), require verified email
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    const emailLower = email?.trim()?.toLowerCase();
    if (!emailLower || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.email_verified_at,
        (SELECT COALESCE(array_agg(ur.role ORDER BY ur.role), ARRAY['sales']::text[]) FROM user_roles ur WHERE ur.user_id = u.id) AS roles
       FROM users u WHERE u.email = $1`,
      [emailLower]
    );
    const user = result.rows[0] as { id: number; username: string; email: string; password_hash: string; email_verified_at: string | null; roles?: string[] };
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.email_verified_at) {
      return res.status(403).json({
        error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        unverified: true,
        email: user.email,
      });
    }
    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : ['sales'];
    res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, roles },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

const ALLOWED_ROLES = [
  'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics',
  'corporate', 'r_d', 'support', 'customer_service', 'it', 'operations', 'finances', 'manufacturing', 'hr',
] as const;
const SELF_ASSIGNABLE_ROLES = [
  'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics',
  'corporate', 'r_d', 'support', 'customer_service', 'it', 'operations', 'finances', 'manufacturing', 'hr',
] as const;

// GET /api/users/verified — list verified users (for employee assignment dropdowns)
app.get('/api/users/verified', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email,
        (SELECT COALESCE(array_agg(ur.role ORDER BY ur.role), ARRAY[]::text[]) FROM user_roles ur WHERE ur.user_id = u.id) AS roles
       FROM users u WHERE u.email_verified_at IS NOT NULL ORDER BY u.username`
    );
    res.json({ users: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch users.' });
  }
});

// PATCH /api/users/me — update current user's roles (array; only non-admin roles self-assignable)
app.patch('/api/users/me', async (req, res) => {
  try {
    const body = req.body as { userId?: number; roles?: string[] };
    const userId = body.userId != null ? Number(body.userId) : NaN;
    const rawRoles = Array.isArray(body.roles) ? body.roles : [];
    const roles = rawRoles.map((r) => String(r).trim().toLowerCase()).filter(Boolean);
    if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ error: 'Valid userId is required.' });
    for (const role of roles) {
      if (!ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number])) {
        return res.status(400).json({ error: `Invalid role: ${role}.` });
      }
    }
    const current = await pool.query(
      'SELECT array_agg(role) AS roles FROM user_roles WHERE user_id = $1',
      [userId]
    );
    const row = current.rows[0] as { roles: string[] | null } | undefined;
    const currentRoles: string[] = row?.roles?.filter(Boolean) ?? [];
    const isAdmin = currentRoles.includes('admin');
    if (roles.includes('admin') && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can set the admin role.' });
    }
    for (const role of roles) {
      if (role === 'admin') continue;
      if (!SELF_ASSIGNABLE_ROLES.includes(role as typeof SELF_ASSIGNABLE_ROLES[number])) {
        return res.status(403).json({ error: 'You can only assign yourself non-admin roles.' });
      }
    }
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    if (roles.length > 0) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role) SELECT $1, unnest($2::text[]) ON CONFLICT (user_id, role) DO NOTHING`,
        [userId, roles]
      );
    }
    res.json({ success: true, roles });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to update roles.' });
  }
});

const RESEND_COOLDOWN_SECONDS = 30;

// POST /api/auth/resend-verification — resend verification email (rate limited to once per 30s)
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    const emailLower = (email as string)?.trim()?.toLowerCase();
    if (!emailLower) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const result = await pool.query(
      `SELECT id, email_verified_at, last_verification_email_sent_at FROM users WHERE email = $1`,
      [emailLower]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }
    if (user.email_verified_at) {
      return res.status(400).json({ error: 'This email is already verified. You can sign in.' });
    }
    const lastSent = user.last_verification_email_sent_at ? new Date(user.last_verification_email_sent_at) : null;
    const now = new Date();
    if (lastSent && (now.getTime() - lastSent.getTime()) < RESEND_COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - (now.getTime() - lastSent.getTime()) / 1000);
      return res.status(429).json({
        error: 'Please wait before requesting another email.',
        retryAfterSeconds: waitSeconds,
      });
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await pool.query(
      `UPDATE users SET verification_token = $1, verification_token_expires_at = $2, last_verification_email_sent_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [verificationToken, expiresAt, user.id]
    );
    const verificationLink = `${APP_URL}/verify-email?token=${verificationToken}`;
    try {
      await sendVerificationEmail(emailLower, verificationLink);
    } catch (mailErr) {
      console.error('Resend verification email failed:', mailErr);
      return res.status(500).json({ error: 'Failed to send email. Try again later.' });
    }
    res.json({ success: true, message: 'Verification email sent. Check your inbox.' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Resend failed.' });
  }
});

// ============================================
// CLIENTS API (and client orders, contracts, invoices)
// ============================================

// GET /api/clients?type=client|lead&assigned_to_user=userId — list clients (optional type and assigned-to-user filter)
app.get('/api/clients', async (req, res) => {
  try {
    const type = (req.query.type as string)?.trim();
    const assignedToUser = req.query.assigned_to_user != null ? Number(req.query.assigned_to_user) : NaN;
    let query = `
      SELECT c.id, c.company, c.employee_id, c.point_of_contact, c.contact_email, c.contact_phone,
             c.product, c.notes, c.start_date, c.billing_address, c.site_location, c.type, c.source,
             c.created_at, c.updated_at,
             e.name AS employee_name
      FROM clients c
      LEFT JOIN employees e ON e.id = c.employee_id
    `;
    const params: (string | number)[] = [];
    const conditions: string[] = [];
    if (type === 'client' || type === 'lead') {
      params.push(type);
      conditions.push(`c.type = $${params.length}`);
    }
    if (Number.isInteger(assignedToUser) && assignedToUser > 0) {
      params.push(assignedToUser);
      conditions.push(`c.employee_id IN (SELECT id FROM employees WHERE user_id = $${params.length})`);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY c.company`;
    const result = await pool.query(query, params);
    const rows = result.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      company: r.company,
      employee_id: r.employee_id,
      employee_name: r.employee_name || null,
      point_of_contact: r.point_of_contact,
      contact_email: r.contact_email,
      contact_phone: r.contact_phone,
      product: r.product,
      notes: r.notes,
      start_date: r.start_date,
      billing_address: r.billing_address,
      site_location: r.site_location,
      type: r.type || 'client',
      source: r.source,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    res.json({ clients: rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch clients.' });
  }
});

// Resolve user_id to employee_id: use employee linked to user, or create/link one by username
async function getOrCreateEmployeeIdForUser(userId: number): Promise<number | null> {
  const byUser = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
  const row = byUser.rows[0] as { id?: number } | undefined;
  if (row?.id) return row.id;
  const userRow = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
  const username = (userRow.rows[0] as { username?: string } | undefined)?.username;
  if (!username) return null;
  const ins = await pool.query(
    `INSERT INTO employees (name, user_id) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING id`,
    [username, userId]
  );
  return (ins.rows[0] as { id?: number } | undefined)?.id ?? null;
}

// POST /api/clients — create client or lead
app.post('/api/clients', async (req, res) => {
  try {
    const body = req.body as {
      company?: string;
      type?: string;
      point_of_contact?: string;
      contact_email?: string;
      contact_phone?: string;
      product?: string;
      notes?: string;
      start_date?: string;
      billing_address?: string;
      site_location?: string;
      source?: string;
      employee_name?: string;
      user_id?: number;
    };
    const company = body.company?.trim();
    const type = (body.type?.trim() || 'client').toLowerCase() === 'lead' ? 'lead' : 'client';
    const point_of_contact = body.point_of_contact?.trim();
    if (!company) return res.status(400).json({ error: 'Company is required.' });
    if (!point_of_contact) return res.status(400).json({ error: 'Point of contact is required.' });

    let employee_id: number | null = null;
    const uid = body.user_id != null ? Number(body.user_id) : NaN;
    if (Number.isInteger(uid) && uid > 0) {
      employee_id = await getOrCreateEmployeeIdForUser(uid);
    } else if (body.employee_name?.trim()) {
      const empResult = await pool.query(
        'SELECT id FROM employees WHERE name = $1',
        [body.employee_name.trim()]
      );
      const row = empResult.rows[0] as { id?: number } | undefined;
      if (row?.id) employee_id = row.id;
    }

    const result = await pool.query(
      `INSERT INTO clients (
        company, employee_id, point_of_contact, contact_email, contact_phone,
        product, notes, start_date, billing_address, site_location, type, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, company, employee_id, point_of_contact, contact_email, contact_phone,
                product, notes, start_date, billing_address, site_location, type, source,
                created_at, updated_at`,
      [
        company,
        employee_id,
        point_of_contact,
        body.contact_email?.trim() || null,
        body.contact_phone?.trim() || null,
        body.product?.trim() || null,
        body.notes?.trim() || null,
        body.start_date?.trim() || null,
        body.billing_address?.trim() || null,
        body.site_location?.trim() || null,
        type,
        type === 'lead' ? (body.source?.trim() || null) : null,
      ]
    );
    const row = result.rows[0] as Record<string, unknown>;
    res.status(201).json({
      id: row.id,
      company: row.company,
      employee_id: row.employee_id,
      point_of_contact: row.point_of_contact,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      product: row.product,
      notes: row.notes,
      start_date: row.start_date,
      billing_address: row.billing_address,
      site_location: row.site_location,
      type: row.type,
      source: row.source,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === '23505') return res.status(409).json({ error: 'A client or lead with this company name already exists.' });
    res.status(500).json({ error: e.message || 'Failed to create client.' });
  }
});

// GET /api/orders — list all orders (from orders table). Optional ?assigned_to_user=userId to filter by assigned user.
app.get('/api/orders', async (req, res) => {
  try {
    const assignedToUser = req.query.assigned_to_user != null ? Number(req.query.assigned_to_user) : NaN;
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (Number.isInteger(assignedToUser) && assignedToUser > 0) {
      params.push(assignedToUser);
      conditions.push(`o.employee_id IN (SELECT id FROM employees WHERE user_id = $${params.length})`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.company_name, o.category, o.employee_id, o.tracking_number,
              o.estimated_delivery_date, o.shipping_address, o.deliver_to, o.installation_appointment_time,
              o.site_location, o.created_at, o.updated_at,
              e.name AS employee_name,
              CASE
                WHEN o.category = 'Contract' AND EXISTS (SELECT 1 FROM contracts c WHERE c.order_number = o.order_number AND c.status = 'signed') THEN 'Approved'
                ELSE o.status
              END AS status
       FROM orders o
       LEFT JOIN employees e ON e.id = o.employee_id
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    );
    res.json({ orders: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch orders.' });
  }
});

// GET /api/orders/:orderNumber — get one order by order number
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const orderNumber = (req.params.orderNumber || '').trim();
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.company_name, o.category, o.employee_id, o.last_contact_date,
              o.tracking_number, o.estimated_delivery_date, o.shipping_address, o.deliver_to,
              o.installation_appointment_time, o.installation_employee_id, o.site_location,
              o.created_at, o.updated_at,
              e.name AS employee_name,
              ie.name AS installation_employee_name,
              CASE
                WHEN o.category = 'Contract' AND EXISTS (SELECT 1 FROM contracts c WHERE c.order_number = o.order_number AND c.status = 'signed') THEN 'Approved'
                ELSE o.status
              END AS status
       FROM orders o
       LEFT JOIN employees e ON e.id = o.employee_id
       LEFT JOIN employees ie ON ie.id = o.installation_employee_id
       WHERE o.order_number = $1`,
      [orderNumber]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return res.status(404).json({ error: 'Order not found.' });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch order.' });
  }
});

// POST /api/orders — create order (Contract stage). Always creates a new order with a new order number.
app.post('/api/orders', async (req, res) => {
  try {
    const body = req.body as { company_name?: string; employee_name?: string; user_id?: number };
    const company_name = body.company_name?.trim();
    if (!company_name) return res.status(400).json({ error: 'Company name is required.' });

    let employee_id: number | null = null;
    const uid = body.user_id != null ? Number(body.user_id) : NaN;
    if (Number.isInteger(uid) && uid > 0) {
      employee_id = await getOrCreateEmployeeIdForUser(uid);
    } else if (body.employee_name?.trim()) {
      const empResult = await pool.query(
        'SELECT id FROM employees WHERE name = $1',
        [body.employee_name.trim()]
      );
      const row = empResult.rows[0] as { id?: number } | undefined;
      if (row?.id) employee_id = row.id;
    }

    let nextNum: number;
    try {
      const nextResult = await pool.query<{ next_num: string }>(
        `SELECT nextval('order_number_seq') AS next_num`
      );
      nextNum = parseInt(nextResult.rows[0]?.next_num ?? '1', 10);
    } catch {
      const fallback = await pool.query<{ next_num: string }>(
        `SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(order_number, '^ORD-0*', '') AS INTEGER)), 0) + 1 AS next_num
         FROM orders WHERE order_number ~ '^ORD-[0-9]+$'`
      );
      nextNum = parseInt(fallback.rows[0]?.next_num ?? '1', 10);
    }
    const order_number = `ORD-${String(nextNum).padStart(5, '0')}`;
    const result = await pool.query(
      `INSERT INTO orders (order_number, company_name, status, category, employee_id)
       VALUES ($1, $2, 'Pending', 'Contract', $3)
       RETURNING id, order_number, company_name, status, category, employee_id,
                 tracking_number, estimated_delivery_date, shipping_address, deliver_to,
                 installation_appointment_time, site_location, created_at, updated_at`,
      [order_number, company_name, employee_id]
    );
    const row = result.rows[0] as Record<string, unknown>;
    const empNameResult = employee_id
      ? await pool.query('SELECT name FROM employees WHERE id = $1', [employee_id])
      : { rows: [] };
    const employee_name = (empNameResult.rows[0] as { name?: string } | undefined)?.name ?? null;
    const activityUser = employee_name ?? 'System';
    await pool.query(
      `INSERT INTO activity_logs (order_number, action, "user") VALUES ($1, $2, $3)`,
      [order_number, `Order ${order_number} created`, activityUser]
    );
    try {
      await pool.query(
        `INSERT INTO site_activity (action, "user") VALUES ($1, $2)`,
        [`Order ${order_number} created`, activityUser]
      );
    } catch {
      // site_activity table may not exist yet
    }
    res.status(201).json({
      id: row.id,
      order_number: row.order_number,
      company_name: row.company_name,
      status: row.status,
      category: row.category,
      employee_id: row.employee_id,
      employee_name,
      tracking_number: row.tracking_number,
      estimated_delivery_date: row.estimated_delivery_date,
      shipping_address: row.shipping_address,
      deliver_to: row.deliver_to,
      installation_appointment_time: row.installation_appointment_time,
      site_location: row.site_location,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === '23505') return res.status(409).json({ error: 'Order number collision. Please try again.' });
    res.status(500).json({ error: e.message || 'Failed to create order.' });
  }
});

// PATCH /api/orders/:orderNumber — update order (employee, category, status, delivery/installation fields)
app.patch('/api/orders/:orderNumber', async (req, res) => {
  try {
    const orderNumber = (req.params.orderNumber || '').trim();
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const body = req.body as {
      employee_name?: string | null;
      user_id?: number | null;
      category?: string;
      status?: string;
      last_contact_date?: string | null;
      tracking_number?: string | null;
      estimated_delivery_date?: string | null;
      shipping_address?: string | null;
      deliver_to?: string | null;
      installation_appointment_time?: string | null;
      installation_employee_name?: string | null;
      site_location?: string | null;
    };
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (body.employee_name !== undefined || body.user_id !== undefined) {
      let employee_id: number | null = null;
      const uid = body.user_id != null ? Number(body.user_id) : NaN;
      if (Number.isInteger(uid) && uid > 0) {
        employee_id = await getOrCreateEmployeeIdForUser(uid);
      } else if (body.employee_name?.trim()) {
        const empResult = await pool.query('SELECT id FROM employees WHERE name = $1', [body.employee_name.trim()]);
        const row = (empResult.rows[0] as { id?: number } | undefined);
        if (row?.id) employee_id = row.id;
      }
      updates.push(`employee_id = $${paramIndex++}`);
      values.push(employee_id);
    }
    if (body.category !== undefined) {
      const cat = body.category?.trim();
      if (cat && ['Contract', 'Inventory', 'Installation', 'Completed'].includes(cat)) {
        updates.push(`category = $${paramIndex++}`);
        values.push(cat);
      }
    }
    if (body.status !== undefined) {
      const st = body.status?.trim();
      if (st) {
        updates.push(`status = $${paramIndex++}`);
        values.push(st);
      }
    }
    if (body.last_contact_date !== undefined) {
      updates.push(`last_contact_date = $${paramIndex++}`);
      values.push(body.last_contact_date?.trim() || null);
    }
    if (body.tracking_number !== undefined) {
      updates.push(`tracking_number = $${paramIndex++}`);
      values.push(body.tracking_number?.trim() || null);
    }
    if (body.estimated_delivery_date !== undefined) {
      updates.push(`estimated_delivery_date = $${paramIndex++}`);
      values.push(body.estimated_delivery_date?.trim() || null);
    }
    if (body.shipping_address !== undefined) {
      updates.push(`shipping_address = $${paramIndex++}`);
      values.push(body.shipping_address?.trim() || null);
    }
    if (body.deliver_to !== undefined) {
      updates.push(`deliver_to = $${paramIndex++}`);
      values.push(body.deliver_to?.trim() || null);
    }
    if (body.installation_appointment_time !== undefined) {
      updates.push(`installation_appointment_time = $${paramIndex++}`);
      values.push(body.installation_appointment_time?.trim() || null);
    }
    if (body.installation_employee_name !== undefined) {
      let installation_employee_id: number | null = null;
      if (body.installation_employee_name?.trim()) {
        const ieResult = await pool.query('SELECT id FROM employees WHERE name = $1', [body.installation_employee_name.trim()]);
        const row = (ieResult.rows[0] as { id?: number } | undefined);
        if (row?.id) installation_employee_id = row.id;
      }
      updates.push(`installation_employee_id = $${paramIndex++}`);
      values.push(installation_employee_id);
    }
    if (body.site_location !== undefined) {
      updates.push(`site_location = $${paramIndex++}`);
      values.push(body.site_location?.trim() || null);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(orderNumber);
    await pool.query(
      `UPDATE orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE order_number = $${paramIndex}`,
      values
    );
    const actingUser = (body as { acting_user?: string }).acting_user?.trim() || 'System';
    try {
      await pool.query(
        `INSERT INTO site_activity (action, "user") VALUES ($1, $2)`,
        [`Order ${orderNumber} updated`, actingUser]
      );
    } catch {
      // site_activity table may not exist yet
    }
    const getResult = await pool.query(
      `SELECT o.id, o.order_number, o.company_name, o.status, o.category, o.employee_id, o.last_contact_date,
              o.tracking_number, o.estimated_delivery_date, o.shipping_address, o.deliver_to,
              o.installation_appointment_time, o.installation_employee_id, o.site_location,
              o.created_at, o.updated_at,
              e.name AS employee_name,
              ie.name AS installation_employee_name
       FROM orders o
       LEFT JOIN employees e ON e.id = o.employee_id
       LEFT JOIN employees ie ON ie.id = o.installation_employee_id
       WHERE o.order_number = $1`,
      [orderNumber]
    );
    const row = getResult.rows[0] as Record<string, unknown> | undefined;
    if (!row) return res.status(404).json({ error: 'Order not found.' });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to update order.' });
  }
});

// DELETE /api/orders/:orderNumber — delete an order (cascades to order_products, etc.)
app.delete('/api/orders/:orderNumber', async (req, res) => {
  try {
    const orderNumber = (req.params.orderNumber || '').trim();
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const result = await pool.query('DELETE FROM orders WHERE order_number = $1 RETURNING id', [orderNumber]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found.' });
    res.status(200).json({ success: true, deleted: orderNumber });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to delete order.' });
  }
});

// ============================================
// TASKS API (task_tags, assignee by user, role-based visibility for unassigned)
// ============================================

const TASK_ROLES = [
  'admin', 'accounting', 'sales', 'marketing', 'engineers', 'installation', 'logistics',
  'corporate', 'r_d', 'support', 'customer_service', 'it', 'operations', 'finances', 'manufacturing', 'hr',
] as const;

function taskRowToJson(r: Record<string, unknown>, tags?: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: r.id,
    name: r.name,
    status: r.status,
    assigned_to_id: r.assigned_to_id,
    assigned_to_user_id: r.assigned_to_user_id ?? null,
    assigned_to_name: r.assigned_to_name ?? null,
    client_id: r.client_id ?? null,
    client_company: r.client_company ?? null,
    start_date: r.start_date ?? null,
    due_date: r.due_date ?? null,
    notes: r.notes ?? null,
    priority: r.priority ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
  if (tags) out.tags = tags;
  return out;
}

// GET /api/tasks?userId=1 — returns { todo, inProgress, unassigned } for that user (unassigned filtered by user roles)
app.get('/api/tasks', async (req, res) => {
  try {
    const userId = req.query.userId != null ? Number(req.query.userId) : NaN;
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ error: 'Valid userId query is required.' });
    }
    const employeeIdResult = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    const employeeId = (employeeIdResult.rows[0] as { id?: number } | undefined)?.id ?? null;
    const userRolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [userId]
    );
    const userRoles = (userRolesResult.rows as { role: string }[]).map((r) => r.role);

    const baseTaskQuery = `
      SELECT t.id, t.name, t.status, t.assigned_to_id, t.client_id, t.start_date, t.due_date, t.notes, t.priority, t.created_at, t.updated_at,
             e.name AS assigned_to_name,
             e.user_id AS assigned_to_user_id,
             c.company AS client_company
      FROM tasks t
      LEFT JOIN employees e ON e.id = t.assigned_to_id
      LEFT JOIN clients c ON c.id = t.client_id
    `;

    const todo: Record<string, unknown>[] = [];
    const inProgress: Record<string, unknown>[] = [];
    const unassigned: Record<string, unknown>[] = [];
    const completed: Record<string, unknown>[] = [];

    if (employeeId) {
      const myTasksResult = await pool.query(
        `${baseTaskQuery} WHERE t.assigned_to_id = $1 AND t.status IN ('To-Do', 'In Progress', 'Completed') ORDER BY t.updated_at DESC`,
        [employeeId]
      );
      const tagsByTaskId = new Map<number, string[]>();
      for (const row of myTasksResult.rows as Record<string, unknown>[]) {
        const taskId = Number(row.id);
        const tagRes = await pool.query('SELECT role FROM task_tags WHERE task_id = $1 ORDER BY role', [taskId]);
        const tags = (tagRes.rows as { role: string }[]).map((r) => r.role);
        tagsByTaskId.set(taskId, tags);
      }
      for (const row of myTasksResult.rows as Record<string, unknown>[]) {
        const taskId = Number(row.id);
        const tags = tagsByTaskId.get(taskId) ?? [];
        const item = taskRowToJson(row, tags);
        if (row.status === 'To-Do') todo.push(item);
        else if (row.status === 'In Progress') inProgress.push(item);
        else completed.push(item);
      }
    }

    // All unassigned tasks; prioritize those whose tags match the user's roles (sort matching first)
    const unassignedResult = userRoles.length > 0
      ? await pool.query(
          `${baseTaskQuery}
           WHERE t.assigned_to_id IS NULL
           ORDER BY EXISTS (SELECT 1 FROM task_tags tt WHERE tt.task_id = t.id AND tt.role = ANY($1::text[])) DESC,
                    t.updated_at DESC`,
          [userRoles]
        )
      : await pool.query(
          `${baseTaskQuery}
           WHERE t.assigned_to_id IS NULL
           ORDER BY t.updated_at DESC`
        );
    for (const row of unassignedResult.rows as Record<string, unknown>[]) {
      const taskId = Number(row.id);
      const tagRes = await pool.query('SELECT role FROM task_tags WHERE task_id = $1 ORDER BY role', [taskId]);
      const tags = (tagRes.rows as { role: string }[]).map((r) => r.role);
      unassigned.push(taskRowToJson(row, tags));
    }

    res.json({ todo, inProgress, unassigned, completed });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch tasks.' });
  }
});

// GET /api/tasks/:id — one task with tags
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '', 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Valid task id required.' });
    const result = await pool.query(
      `SELECT t.id, t.name, t.status, t.assigned_to_id, t.client_id, t.start_date, t.due_date, t.notes, t.priority, t.created_at, t.updated_at,
              e.name AS assigned_to_name,
              e.user_id AS assigned_to_user_id,
              c.company AS client_company
       FROM tasks t
       LEFT JOIN employees e ON e.id = t.assigned_to_id
       LEFT JOIN clients c ON c.id = t.client_id
       WHERE t.id = $1`,
      [id]
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return res.status(404).json({ error: 'Task not found.' });
    const tagRes = await pool.query('SELECT role FROM task_tags WHERE task_id = $1 ORDER BY role', [id]);
    const tags = (tagRes.rows as { role: string }[]).map((r) => r.role);
    res.json(taskRowToJson(row, tags));
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch task.' });
  }
});

// POST /api/tasks — create task (tags required; at least one)
app.post('/api/tasks', async (req, res) => {
  try {
    const body = req.body as {
      name?: string;
      status?: string;
      assigned_to_user_id?: number;
      client_id?: number;
      tags?: string[];
      start_date?: string;
      due_date?: string;
      notes?: string;
      priority?: string;
    };
    const name = body.name?.trim();
    if (!name) return res.status(400).json({ error: 'Task name is required.' });
    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = rawTags.map((t) => String(t).trim().toLowerCase()).filter((t) => TASK_ROLES.includes(t as typeof TASK_ROLES[number]));
    if (tags.length === 0) return res.status(400).json({ error: 'At least one role tag is required.' });

    const status = (body.status?.trim() || 'Unassigned') as string;
    const validStatuses = ['Unassigned', 'To-Do', 'In Progress', 'Completed'];
    const taskStatus = validStatuses.includes(status) ? status : 'Unassigned';

    let assigned_to_id: number | null = null;
    const uid = body.assigned_to_user_id != null ? Number(body.assigned_to_user_id) : NaN;
    if (Number.isInteger(uid) && uid > 0) {
      assigned_to_id = await getOrCreateEmployeeIdForUser(uid);
    }

    const client_id = body.client_id != null && Number.isInteger(Number(body.client_id)) ? Number(body.client_id) : null;
    const start_date = body.start_date?.trim() || null;
    const due_date = body.due_date?.trim() || null;
    const notes = body.notes?.trim() || null;
    const priority = (body.priority?.trim() && ['Low', 'Medium', 'High', 'Urgent'].includes(body.priority.trim())) ? body.priority.trim() : null;

    const insertResult = await pool.query(
      `INSERT INTO tasks (name, status, assigned_to_id, client_id, start_date, due_date, notes, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, status, assigned_to_id, client_id, start_date, due_date, notes, priority, created_at, updated_at`,
      [name, taskStatus, assigned_to_id, client_id, start_date || null, due_date || null, notes, priority]
    );
    const task = insertResult.rows[0] as Record<string, unknown>;
    const taskId = Number(task.id);
    for (const role of tags) {
      await pool.query('INSERT INTO task_tags (task_id, role) VALUES ($1, $2) ON CONFLICT (task_id, role) DO NOTHING', [taskId, role]);
    }
    const empName = assigned_to_id ? (await pool.query('SELECT name FROM employees WHERE id = $1', [assigned_to_id])).rows[0] as { name?: string } : null;
    const clientCompany = client_id ? (await pool.query('SELECT company FROM clients WHERE id = $1', [client_id])).rows[0] as { company?: string } : null;

    if (Number.isInteger(uid) && uid > 0) {
      const userRow = (await pool.query('SELECT email FROM users WHERE id = $1', [uid])).rows[0] as { email?: string } | undefined;
      const assigneeEmail = userRow?.email;
      if (assigneeEmail) {
        const taskLink = `${APP_URL}/tasks/${taskId}`;
        sendTaskAssignedEmail(assigneeEmail, name, taskId, taskLink).catch((mailErr) => {
          console.error('Task assigned email send failed:', mailErr);
        });
      }
    }

    try {
      const siteAction = empName?.name ? `Task created: ${name} (assigned to ${empName.name})` : `Task created: ${name}`;
      await pool.query(
        `INSERT INTO site_activity (action, "user") VALUES ($1, 'System')`,
        [siteAction]
      );
    } catch {
      // site_activity table may not exist yet
    }

    res.status(201).json(taskRowToJson(
      { ...task, assigned_to_name: empName?.name ?? null, client_company: clientCompany?.company ?? null },
      tags
    ));
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to create task.' });
  }
});

// PATCH /api/tasks/:id — update task
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '', 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Valid task id required.' });
    const body = req.body as {
      name?: string;
      status?: string;
      assigned_to_user_id?: number | null;
      client_id?: number | null;
      tags?: string[];
      start_date?: string | null;
      due_date?: string | null;
      notes?: string | null;
      priority?: string | null;
    };

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      const name = body.name?.trim();
      if (!name) return res.status(400).json({ error: 'Task name cannot be empty.' });
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (body.status !== undefined) {
      const status = body.status?.trim();
      const valid = ['Unassigned', 'To-Do', 'In Progress', 'Completed'];
      if (status && valid.includes(status)) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
    }
    if (body.assigned_to_user_id !== undefined) {
      let assigned_to_id: number | null = null;
      if (body.assigned_to_user_id != null && Number.isInteger(body.assigned_to_user_id) && body.assigned_to_user_id > 0) {
        assigned_to_id = await getOrCreateEmployeeIdForUser(body.assigned_to_user_id);
      }
      updates.push(`assigned_to_id = $${paramIndex++}`);
      values.push(assigned_to_id);
    }
    if (body.client_id !== undefined) {
      updates.push(`client_id = $${paramIndex++}`);
      values.push(body.client_id != null && Number.isInteger(Number(body.client_id)) ? Number(body.client_id) : null);
    }
    if (body.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(body.start_date?.trim() || null);
    }
    if (body.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(body.due_date?.trim() || null);
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(body.notes?.trim() || null);
    }
    if (body.priority !== undefined) {
      const p = body.priority?.trim();
      updates.push(`priority = $${paramIndex++}`);
      values.push(p && ['Low', 'Medium', 'High', 'Urgent'].includes(p) ? p : null);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
        values
      );
    }

    if (body.tags !== undefined) {
      const rawTags = Array.isArray(body.tags) ? body.tags : [];
      const tags = rawTags.map((t) => String(t).trim().toLowerCase()).filter((t) => TASK_ROLES.includes(t as typeof TASK_ROLES[number]));
      if (tags.length === 0) return res.status(400).json({ error: 'At least one role tag is required.' });
      await pool.query('DELETE FROM task_tags WHERE task_id = $1', [id]);
      for (const role of tags) {
        await pool.query('INSERT INTO task_tags (task_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, role]);
      }
    }

    const getResult = await pool.query(
      `SELECT t.id, t.name, t.status, t.assigned_to_id, t.client_id, t.start_date, t.due_date, t.notes, t.priority, t.created_at, t.updated_at,
              e.name AS assigned_to_name,
              e.user_id AS assigned_to_user_id,
              c.company AS client_company
       FROM tasks t
       LEFT JOIN employees e ON e.id = t.assigned_to_id
       LEFT JOIN clients c ON c.id = t.client_id
       WHERE t.id = $1`,
      [id]
    );
    const row = getResult.rows[0] as Record<string, unknown> | undefined;
    if (!row) return res.status(404).json({ error: 'Task not found.' });
    const tagRes = await pool.query('SELECT role FROM task_tags WHERE task_id = $1 ORDER BY role', [id]);
    const tags = (tagRes.rows as { role: string }[]).map((r) => r.role);

    const assigneeUserId = body.assigned_to_user_id != null && Number.isInteger(body.assigned_to_user_id) && body.assigned_to_user_id > 0
      ? body.assigned_to_user_id
      : null;
    if (assigneeUserId != null) {
      const userRow = (await pool.query('SELECT email FROM users WHERE id = $1', [assigneeUserId])).rows[0] as { email?: string } | undefined;
      const assigneeEmail = userRow?.email;
      if (assigneeEmail) {
        const taskName = String(row.name || '');
        const taskLink = `${APP_URL}/tasks/${id}`;
        sendTaskAssignedEmail(assigneeEmail, taskName, id, taskLink).catch((mailErr) => {
          console.error('Task assigned email send failed:', mailErr);
        });
      }
    }

    if (updates.length > 0) {
      try {
        const taskName = String(row.name || 'Task');
        const assigneeName = row.assigned_to_name != null ? String(row.assigned_to_name) : null;
        const siteAction = body.assigned_to_user_id !== undefined && assigneeName
          ? `User ${assigneeName} assigned to task: ${taskName}`
          : `Task updated: ${taskName}`;
        await pool.query(
          `INSERT INTO site_activity (action, "user") VALUES ($1, 'System')`,
          [siteAction]
        );
      } catch {
        // site_activity table may not exist yet
      }
    }

    res.json(taskRowToJson(row, tags));
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id || '', 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Valid task id required.' });
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json({ success: true, id });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to delete task.' });
  }
});

// GET /api/clients/:id — get one client (for detail page)
app.get('/api/clients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid client id.' });
    const result = await pool.query(
      `SELECT c.id, c.company, c.employee_id, c.point_of_contact, c.contact_email, c.contact_phone,
              c.product, c.notes, c.start_date, c.billing_address, c.site_location, c.type, c.source,
              c.created_at, c.updated_at,
              e.name AS employee_name
       FROM clients c
       LEFT JOIN employees e ON e.id = c.employee_id
       WHERE c.id = $1`,
      [id]
    );
    const r = result.rows[0] as Record<string, unknown> | undefined;
    if (!r) return res.status(404).json({ error: 'Client not found.' });
    res.json({
      id: r.id,
      company: r.company,
      employee_id: r.employee_id,
      employee_name: r.employee_name || null,
      point_of_contact: r.point_of_contact,
      contact_email: r.contact_email,
      contact_phone: r.contact_phone,
      product: r.product,
      notes: r.notes,
      start_date: r.start_date,
      billing_address: r.billing_address,
      site_location: r.site_location,
      type: r.type || 'client',
      source: r.source,
      created_at: r.created_at,
      updated_at: r.updated_at,
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch client.' });
  }
});

// PATCH /api/clients/:id — update client (employee/user, start_date, contact fields, etc.)
app.patch('/api/clients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid client id.' });
    const body = req.body as {
      user_id?: number | null;
      employee_name?: string | null;
      start_date?: string | null;
      point_of_contact?: string;
      contact_email?: string | null;
      contact_phone?: string | null;
      billing_address?: string | null;
      site_location?: string | null;
      notes?: string | null;
    };
    const existing = await pool.query('SELECT id FROM clients WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Client not found.' });

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (body.user_id !== undefined) {
      let employee_id: number | null = null;
      if (body.user_id != null && Number.isInteger(body.user_id) && body.user_id > 0) {
        employee_id = await getOrCreateEmployeeIdForUser(body.user_id);
      }
      updates.push(`employee_id = $${paramIndex++}`);
      values.push(employee_id);
    } else if (body.employee_name !== undefined) {
      let employee_id: number | null = null;
      if (body.employee_name?.trim()) {
        const emp = await pool.query('SELECT id FROM employees WHERE name = $1', [body.employee_name.trim()]);
        const row = emp.rows[0] as { id?: number } | undefined;
        if (row?.id) employee_id = row.id;
      }
      updates.push(`employee_id = $${paramIndex++}`);
      values.push(employee_id);
    }

    if (body.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(body.start_date?.trim() || null);
    }
    if (body.point_of_contact !== undefined) {
      updates.push(`point_of_contact = $${paramIndex++}`);
      values.push(body.point_of_contact.trim());
    }
    if (body.contact_email !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(body.contact_email?.trim() || null);
    }
    if (body.contact_phone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(body.contact_phone?.trim() || null);
    }
    if (body.billing_address !== undefined) {
      updates.push(`billing_address = $${paramIndex++}`);
      values.push(body.billing_address?.trim() || null);
    }
    if (body.site_location !== undefined) {
      updates.push(`site_location = $${paramIndex++}`);
      values.push(body.site_location?.trim() || null);
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(body.notes?.trim() || null);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(id);
    await pool.query(
      `UPDATE clients SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
      values
    );
    const result = await pool.query(
      `SELECT c.id, c.company, c.employee_id, c.point_of_contact, c.contact_email, c.contact_phone,
              c.product, c.notes, c.start_date, c.billing_address, c.site_location, c.type, c.source,
              c.created_at, c.updated_at,
              e.name AS employee_name
       FROM clients c
       LEFT JOIN employees e ON e.id = c.employee_id
       WHERE c.id = $1`,
      [id]
    );
    const r = result.rows[0] as Record<string, unknown>;
    res.json(r);
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to update client.' });
  }
});

// GET /api/clients/:id/orders — orders for this client (by company name)
app.get('/api/clients/:id/orders', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid client id.' });
    const clientResult = await pool.query('SELECT company FROM clients WHERE id = $1', [id]);
    const company = (clientResult.rows[0] as { company?: string } | undefined)?.company;
    if (!company) return res.status(404).json({ error: 'Client not found.' });
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.company_name, o.category, o.employee_id, o.tracking_number,
              o.estimated_delivery_date, o.shipping_address, o.deliver_to, o.installation_appointment_time,
              o.site_location, o.created_at, o.updated_at,
              e.name AS employee_name,
              CASE
                WHEN o.category = 'Contract' AND EXISTS (SELECT 1 FROM contracts c WHERE c.order_number = o.order_number AND c.status = 'signed') THEN 'Approved'
                ELSE o.status
              END AS status
       FROM orders o
       LEFT JOIN employees e ON e.id = o.employee_id
       WHERE o.company_name = $1
       ORDER BY o.created_at DESC`,
      [company]
    );
    res.json({ orders: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch orders.' });
  }
});

// GET /api/clients/:id/contracts — contracts for this client's orders
app.get('/api/clients/:id/contracts', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid client id.' });
    const clientResult = await pool.query('SELECT company FROM clients WHERE id = $1', [id]);
    const company = (clientResult.rows[0] as { company?: string } | undefined)?.company;
    if (!company) return res.status(404).json({ error: 'Client not found.' });
    const result = await pool.query(
      `SELECT c.id, c.contract_id, c.order_number, c.contract_type, c.status, c.generated_at, c.signed_at, c.created_at
       FROM contracts c
       INNER JOIN orders o ON o.order_number = c.order_number
       WHERE o.company_name = $1
       ORDER BY c.created_at DESC`,
      [company]
    );
    res.json({ contracts: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch contracts.' });
  }
});

// GET /api/clients/:id/invoices — invoices for this client's orders
app.get('/api/clients/:id/invoices', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid client id.' });
    const clientResult = await pool.query('SELECT company FROM clients WHERE id = $1', [id]);
    const company = (clientResult.rows[0] as { company?: string } | undefined)?.company;
    if (!company) return res.status(404).json({ error: 'Client not found.' });
    const result = await pool.query(
      `SELECT i.id, i.order_number, i.invoice_number, i.amount, i.status, i.created_at, i.updated_at
       FROM invoices i
       INNER JOIN orders o ON o.order_number = i.order_number
       WHERE o.company_name = $1
       ORDER BY i.created_at DESC`,
      [company]
    );
    res.json({ invoices: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch invoices.' });
  }
});

// GET /api/orders/:orderNumber/activity-log — activity log for this order (one log per order, persisted)
app.get('/api/orders/:orderNumber/activity-log', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const result = await pool.query(
      `SELECT id, order_number, timestamp, action, "user"
       FROM activity_logs
       WHERE order_number = $1
       ORDER BY timestamp DESC`,
      [orderNumber]
    );
    res.json({ entries: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch activity log.' });
  }
});

// POST /api/orders/:orderNumber/activity-log — append an activity log entry (also adds to site_activity for dashboard)
app.post('/api/orders/:orderNumber/activity-log', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const body = req.body as { action?: string; user?: string };
    const action = (body.action ?? '').trim();
    if (!action) return res.status(400).json({ error: 'action is required.' });
    const user = (body.user ?? 'System').trim() || 'System';
    const result = await pool.query(
      `INSERT INTO activity_logs (order_number, action, "user")
       VALUES ($1, $2, $3)
       RETURNING id, order_number, timestamp, action, "user"`,
      [orderNumber, action, user]
    );
    try {
      await pool.query(
        `INSERT INTO site_activity (action, "user") VALUES ($1, $2)`,
        [`Order ${orderNumber}: ${action}`, user]
      );
    } catch {
      // site_activity table may not exist yet
    }
    const row = result.rows[0];
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to add activity log entry.' });
  }
});

// GET /api/sales/product-counts — product sales from completed orders (TIM-E Bot, BIM-E), all periods
app.get('/api/sales/product-counts', async (req, res) => {
  try {
    const periods = [
      { key: '1month', months: 1 },
      { key: '3months', months: 3 },
      { key: '6months', months: 6 },
      { key: '1year', months: 12 },
    ] as const;

    const result: Record<string, { productData: { product: string; sales: number }[]; totalData: { date: string; total: number }[] }> = {};

    for (const { key, months } of periods) {
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      since.setHours(0, 0, 0, 0);

      const ordersResult = await pool.query(
        `SELECT o.order_number, o.updated_at
         FROM orders o
         WHERE o.category = 'Completed' AND o.updated_at >= $1
         ORDER BY o.updated_at ASC`,
        [since]
      );

      let totalTimE = 0;
      let totalBime = 0;
      const byMonth = new Map<string, { label: string; totalUnits: number }>();

      const sumAllQtyFromFormData = (fd: Record<string, unknown>): number => {
        let sum = 0;
        for (const [k, v] of Object.entries(fd)) {
          if (k.toLowerCase().startsWith('qty') && (typeof v === 'string' || typeof v === 'number')) {
            sum += parseInt(String(v), 10) || 0;
          }
        }
        return sum;
      };

      for (const row of ordersResult.rows as { order_number: string; updated_at: string }[]) {
        const contractResult = await pool.query(
          `SELECT form_data, qty_tim_e_bot, qty_bime FROM contracts
           WHERE order_number = $1 AND status = 'signed'
           ORDER BY signed_at DESC NULLS LAST LIMIT 1`,
          [row.order_number]
        );
        const c = contractResult.rows[0] as { form_data?: unknown; qty_tim_e_bot?: string | null; qty_bime?: string | null } | undefined;
        let qtyTimE = 0;
        let qtyBime = 0;
        let orderTotalUnits = 0;
        if (c) {
          if (c.form_data && typeof c.form_data === 'object') {
            const fd = c.form_data as Record<string, unknown>;
            orderTotalUnits = sumAllQtyFromFormData(fd);
          }
          if (c.qty_tim_e_bot != null && c.qty_tim_e_bot !== '') qtyTimE = parseInt(String(c.qty_tim_e_bot), 10) || 0;
          else if (c.form_data && typeof c.form_data === 'object') {
            const fd = c.form_data as Record<string, unknown>;
            qtyTimE = parseInt(String(fd.qtyTimEBot ?? fd.qty_tim_e_bot ?? 0), 10) || 0;
          }
          if (c.qty_bime != null && c.qty_bime !== '') qtyBime = parseInt(String(c.qty_bime), 10) || 0;
          else if (c.form_data && typeof c.form_data === 'object') {
            const fd = c.form_data as Record<string, unknown>;
            qtyBime = parseInt(String(fd.qtyBIME ?? fd.qty_bime ?? 0), 10) || 0;
          }
          if (orderTotalUnits === 0) orderTotalUnits = qtyTimE + qtyBime;
        }
        totalTimE += qtyTimE;
        totalBime += qtyBime;
        const updatedAt = new Date(row.updated_at);
        const monthKey = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}`;
        const label = updatedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!byMonth.has(monthKey)) byMonth.set(monthKey, { label, totalUnits: 0 });
        const entry = byMonth.get(monthKey)!;
        entry.totalUnits += orderTotalUnits;
      }

      const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const totalData = sortedMonths.map(([, v]) => ({ date: v.label, total: v.totalUnits }));
      if (totalData.length === 0) {
        totalData.push({
          date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total: 0,
        });
      }
      result[key] = {
        productData: [
          { product: 'TIM-E Bot', sales: totalTimE },
          { product: 'BIM-E', sales: totalBime },
        ],
        totalData,
      };
    }

    res.json(result);
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch sales by product.' });
  }
});

// GET /api/orders/:orderNumber/invoices — invoices for this order
app.get('/api/orders/:orderNumber/invoices', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const result = await pool.query(
      `SELECT id, order_number, invoice_number, amount, status, created_at, updated_at,
              (pdf_document IS NOT NULL) AS has_pdf
       FROM invoices
       WHERE order_number = $1
       ORDER BY created_at DESC`,
      [orderNumber]
    );
    res.json({ invoices: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch invoices.' });
  }
});

// POST /api/orders/:orderNumber/invoices — create invoice (optional PDF as base64)
app.post('/api/orders/:orderNumber/invoices', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const body = req.body as { pdfBase64?: string; invoice_number?: string; amount?: number };
    let pdfBuffer: Buffer | null = null;
    if (body.pdfBase64 && typeof body.pdfBase64 === 'string') {
      const base64 = body.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      pdfBuffer = Buffer.from(base64, 'base64');
    }
    const result = await pool.query(
      `INSERT INTO invoices (order_number, invoice_number, amount, status, pdf_document)
       VALUES ($1, $2, $3, 'Pending', $4)
       RETURNING id, order_number, invoice_number, amount, status, created_at, updated_at`,
      [orderNumber, body.invoice_number ?? null, body.amount ?? null, pdfBuffer]
    );
    const row = result.rows[0];
    if (pdfBuffer) {
      await pool.query(`UPDATE orders SET status = 'Invoice Ready' WHERE order_number = $1`, [orderNumber]);
    }
    res.status(201).json({
      id: row.id,
      order_number: row.order_number,
      invoice_number: row.invoice_number,
      amount: row.amount,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      has_pdf: !!pdfBuffer,
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to create invoice.' });
  }
});

// GET /api/invoices/:id/pdf — serve stored PDF
app.get('/api/invoices/:id/pdf', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).send('Invalid invoice id.');
    const result = await pool.query('SELECT pdf_document FROM invoices WHERE id = $1', [id]);
    const row = result.rows[0] as { pdf_document?: Buffer } | undefined;
    if (!row?.pdf_document) return res.status(404).send('No PDF for this invoice.');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(row.pdf_document);
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).send(e.message || 'Failed to fetch PDF.');
  }
});

// POST /api/orders/:orderNumber/invoice-email — send invoice confirmation to erik@techforcerobotics.com
app.post('/api/orders/:orderNumber/invoice-email', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    if (!orderNumber) return res.status(400).json({ error: 'Order number required.' });
    const body = req.body as {
      companyName: string;
      billingEntity?: string;
      billingAddress: string;
      shippingAddress: string;
      products: Array<{ productName: string; serialNumber?: string; quantity?: number }>;
      invoiceDate: string;
      dueDate: string;
      terms: string;
      userEmail?: string;
    };
    if (!body.companyName || body.invoiceDate == null || body.dueDate == null || body.terms == null) {
      return res.status(400).json({ error: 'companyName, invoiceDate, dueDate, and terms are required.' });
    }
    await sendInvoiceConfirmationEmail({
      orderNumber,
      companyName: body.companyName,
      billingEntity: body.billingEntity ?? '',
      billingAddress: body.billingAddress ?? '',
      shippingAddress: body.shippingAddress ?? '',
      products: Array.isArray(body.products) ? body.products : [],
      invoiceDate: String(body.invoiceDate),
      dueDate: String(body.dueDate),
      terms: String(body.terms),
      userEmail: body.userEmail,
    });
    res.json({ ok: true, message: 'Invoice confirmation email sent.' });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to send invoice email.' });
  }
});

// ============================================
// CONTRACTS API — form_data keys to DB columns (snake_case)
// ============================================
const CONTRACT_FORM_DATA_COLUMNS: [string, string][] = [
  ['businessName', 'business_name'],
  ['serviceAddress', 'service_address'],
  ['city', 'city'],
  ['state', 'state'],
  ['zip', 'zip'],
  ['locationContactName', 'location_contact_name'],
  ['locationContactPhone', 'location_contact_phone'],
  ['locationContactNamePhone', 'location_contact_name_phone'],
  ['cityStateZip', 'city_state_zip'],
  ['locationContactEmail', 'location_contact_email'],
  ['authorizedPersonName', 'authorized_person_name'],
  ['authorizedPersonTitle', 'authorized_person_title'],
  ['authorizedPersonEmail', 'authorized_person_email'],
  ['authorizedPersonPhone', 'authorized_person_phone'],
  ['effectiveDate', 'effective_date'],
  ['termStartDate', 'term_start_date'],
  ['implementationCost', 'implementation_cost'],
  ['shippingFee', 'shipping_fee'],
  ['monthlyRoboticServiceCost', 'monthly_robotic_service_cost'],
  ['additionalAccessoriesCost', 'additional_accessories_cost'],
  ['totalMonthlyCost', 'total_monthly_cost'],
  ['implementationCostDue', 'implementation_cost_due'],
  ['discountTarget', 'discount_target'],
  ['discountType', 'discount_type'],
  ['discountValue', 'discount_value'],
  ['qtyTimEBot', 'qty_tim_e_bot'],
  ['qtyTimECharger', 'qty_tim_e_charger'],
  ['qtyBaseMetalMonthly', 'qty_base_metal_monthly'],
  ['qtyInsulatedFoodTransportMonthly', 'qty_insulated_food_transport_monthly'],
  ['qtyWheeledBinMonthly', 'qty_wheeled_bin_monthly'],
  ['qtyUniversalPlatformMonthly', 'qty_universal_platform_monthly'],
  ['qtyDoorOpenersMonthly', 'qty_door_openers_monthly'],
  ['qtyNeuralTechBrainMonthly', 'qty_neural_tech_brain_monthly'],
  ['qtyElevatorHardwareMonthly', 'qty_elevator_hardware_monthly'],
  ['qtyLuggageCartMonthly', 'qty_luggage_cart_monthly'],
  ['qtyConcessionBinTall', 'qty_concession_bin_tall'],
  ['qtyStackingChairCart', 'qty_stacking_chair_cart'],
  ['qtyCargoCart', 'qty_cargo_cart'],
  ['qtyHousekeepingCart', 'qty_housekeeping_cart'],
  ['qtyBIME', 'qty_bime'],
  ['qtyMobileBIME', 'qty_mobile_bime'],
  ['qtyBaseMetalOneTime', 'qty_base_metal_one_time'],
  ['qtyInsulatedFoodTransportOneTime', 'qty_insulated_food_transport_one_time'],
  ['qtyWheeledBinOneTime', 'qty_wheeled_bin_one_time'],
  ['qtyUniversalPlatformOneTime', 'qty_universal_platform_one_time'],
  ['qtyPlasticBags', 'qty_plastic_bags'],
  ['qtyDoorOpenerHardwareOneTime', 'qty_door_opener_hardware_one_time'],
  ['qtyHandheldTablet', 'qty_handheld_tablet'],
  ['techForceSignature', 'tech_force_signature'],
];

function formDataToColumnValues(formData: Record<string, unknown>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [key, col] of CONTRACT_FORM_DATA_COLUMNS) {
    const v = formData[key];
    out[col] = v != null && typeof v === 'string' ? v : v != null ? String(v) : null;
  }
  return out;
}

function rowToFormData(row: Record<string, unknown>): Record<string, string> {
  const formData: Record<string, string> = {};
  for (const [key, col] of CONTRACT_FORM_DATA_COLUMNS) {
    const v = row[col];
    if (v != null && typeof v === 'string') formData[key] = v;
  }
  return formData;
}

// POST /api/contracts — create contract (order_number, contract_id, form_data, contract_type, pdf_generated base64)
app.post('/api/contracts', async (req, res) => {
  try {
    const { order_number, contract_id, form_data, contract_type, pdf_generated } = req.body as {
      order_number?: string;
      contract_id?: string;
      form_data?: Record<string, unknown>;
      contract_type?: string;
      pdf_generated?: string;
    };
    if (!order_number?.trim() || !contract_id?.trim()) {
      return res.status(400).json({ error: 'order_number and contract_id are required.' });
    }
    const pdfBuffer = pdf_generated ? Buffer.from(pdf_generated, 'base64') : null;
    const formObj = form_data && typeof form_data === 'object' ? form_data : {};
    const colValues = formDataToColumnValues(formObj);

    const cols = ['contract_id', 'order_number', 'form_data', 'contract_type', 'pdf_generated', 'status', ...Object.keys(colValues)];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = [
      contract_id.trim(),
      order_number.trim(),
      JSON.stringify(formObj),
      contract_type || null,
      pdfBuffer,
      'pending',
      ...Object.values(colValues),
    ];
    await pool.query(
      `INSERT INTO contracts (${cols.join(', ')}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ success: true, contract_id: contract_id.trim() });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === '23505') return res.status(409).json({ error: 'A contract with this contract_id already exists.' });
    if (e.code === '23503') return res.status(400).json({ error: 'Order not found. Ensure the order exists in the database.' });
    res.status(500).json({ error: e.message || 'Failed to create contract.' });
  }
});

// GET /api/contracts?order_number= — list contracts for an order
app.get('/api/contracts', async (req, res) => {
  try {
    const order_number = (req.query.order_number as string)?.trim();
    if (!order_number) {
      return res.status(400).json({ error: 'order_number query parameter is required.' });
    }
    const result = await pool.query(
      `SELECT id, contract_id, order_number, contract_type, status, generated_at, signed_at, created_at
       FROM contracts WHERE order_number = $1 ORDER BY created_at DESC`,
      [order_number]
    );
    res.json({ contracts: result.rows });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to fetch contracts.' });
  }
});

// GET /api/contracts/:id/pdf — get PDF for a contract (generated or signed)
app.get('/api/contracts/:id/pdf', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid contract id.' });
    const result = await pool.query(
      `SELECT pdf_signed, pdf_generated, status FROM contracts WHERE id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Contract not found.' });
    const pdfBytes = row.pdf_signed || row.pdf_generated;
    if (!pdfBytes) return res.status(404).json({ error: 'No PDF available for this contract.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="contract.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to get PDF.' });
  }
});

// GET /api/contracts/status/:contractId — get contract status by contract_id (for client link to show thank-you if already signed)
app.get('/api/contracts/status/:contractId', async (req, res) => {
  try {
    const contractId = (req.params.contractId as string)?.trim();
    if (!contractId) return res.status(400).json({ error: 'contractId is required.' });
    const result = await pool.query(
      `SELECT status FROM contracts WHERE contract_id = $1`,
      [contractId]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Contract not found.' });
    res.json({ status: row.status || 'pending' });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to get status.' });
  }
});

// GET /api/contracts/:id/form-data — get form data for a contract (e.g. to prefill shipping/products when moving to Delivery)
app.get('/api/contracts/:id/form-data', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid contract id.' });
    const formCols = CONTRACT_FORM_DATA_COLUMNS.map(([, col]) => col).join(', ');
    const result = await pool.query(
      `SELECT form_data, ${formCols} FROM contracts WHERE id = $1`,
      [id]
    );
    const row = result.rows[0] as Record<string, unknown>;
    if (!row) return res.status(404).json({ error: 'Contract not found.' });
    const fromColumns = rowToFormData(row);
    const fromJsonb = typeof row.form_data === 'object' && row.form_data !== null ? (row.form_data as Record<string, string>) : {};
    const form_data = { ...fromColumns, ...fromJsonb };
    res.json({ form_data });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to get form data.' });
  }
});

// GET /api/contracts/:id/link — get shareable contract link (for copy)
app.get('/api/contracts/:id/link', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid contract id.' });
    const formCols = CONTRACT_FORM_DATA_COLUMNS.map(([, col]) => col).join(', ');
    const result = await pool.query(
      `SELECT contract_id, contract_type, form_data, ${formCols} FROM contracts WHERE id = $1`,
      [id]
    );
    const row = result.rows[0] as Record<string, unknown>;
    if (!row) return res.status(404).json({ error: 'Contract not found.' });
    const type = row.contract_type === 'trial' ? 'trial' : 'service';
    const fromColumns = rowToFormData(row);
    const formData = Object.keys(fromColumns).length > 0
      ? fromColumns
      : (typeof row.form_data === 'object' && row.form_data !== null ? (row.form_data as Record<string, string>) : {});
    const encoded = Buffer.from(JSON.stringify(formData), 'utf8').toString('base64');
    const link = `${APP_URL}/contract/${row.contract_id}?type=${type}#${encoded}`;
    res.json({ link });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to get link.' });
  }
});

// PATCH /api/contracts/:contractId/signed — save signed PDF and optional client-submitted billing (contractId = contract_id string, not DB id)
app.patch('/api/contracts/:contractId/signed', async (req, res) => {
  try {
    const contractId = (req.params.contractId as string)?.trim();
    if (!contractId) return res.status(400).json({ error: 'contractId is required.' });
    const body = req.body as {
      pdf_signed?: string;
      billingEntity?: string;
      billingAddress?: string;
      billingCity?: string;
      billingState?: string;
      billingZip?: string;
    };
    const { pdf_signed } = body;
    if (!pdf_signed || typeof pdf_signed !== 'string') {
      return res.status(400).json({ error: 'pdf_signed (base64) is required.' });
    }
    const pdfBuffer = Buffer.from(pdf_signed, 'base64');
    const selectResult = await pool.query(
      `SELECT id, order_number, form_data FROM contracts WHERE contract_id = $1`,
      [contractId]
    );
    if (selectResult.rows.length === 0) return res.status(404).json({ error: 'Contract not found.' });
    const row = selectResult.rows[0] as { id: number; order_number?: string; form_data?: unknown };
    const hasBilling =
      body.billingEntity != null ||
      body.billingAddress != null ||
      body.billingCity != null ||
      body.billingState != null ||
      body.billingZip != null;
    const current = (row.form_data && typeof row.form_data === 'object' ? row.form_data : {}) as Record<string, unknown>;
    const merged = hasBilling
      ? {
          ...current,
          ...(body.billingEntity != null && body.billingEntity !== '' && { billingEntity: String(body.billingEntity).trim() }),
          ...(body.billingAddress != null && body.billingAddress !== '' && { billingAddress: String(body.billingAddress).trim() }),
          ...(body.billingCity != null && body.billingCity !== '' && { billingCity: String(body.billingCity).trim() }),
          ...(body.billingState != null && body.billingState !== '' && { billingState: String(body.billingState).trim() }),
          ...(body.billingZip != null && body.billingZip !== '' && { billingZip: String(body.billingZip).trim() }),
        }
      : null;
    if (merged !== null) {
      await pool.query(
        `UPDATE contracts SET pdf_signed = $1, signed_at = CURRENT_TIMESTAMP, status = 'signed', form_data = $2::jsonb, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $3`,
        [pdfBuffer, JSON.stringify(merged), contractId]
      );
    } else {
      await pool.query(
        `UPDATE contracts SET pdf_signed = $1, signed_at = CURRENT_TIMESTAMP, status = 'signed' WHERE contract_id = $2`,
        [pdfBuffer, contractId]
      );
    }
    if (row?.order_number) {
      await pool.query(
        `UPDATE orders SET status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE order_number = $1 AND category = 'Contract'`,
        [row.order_number]
      );
      // Log once when client signs via link (not when portal later sees the signed contract)
      const signedAtResult = await pool.query(
        `SELECT signed_at FROM contracts WHERE contract_id = $1`,
        [contractId]
      );
      const signedAt = signedAtResult.rows[0]?.signed_at as string | undefined;
      const signedDate = signedAt ? new Date(signedAt).toLocaleString() : new Date().toLocaleString();
      await pool.query(
        `INSERT INTO activity_logs (order_number, action, "user") VALUES ($1, $2, $3)`,
        [row.order_number, `Client submitted signed contract on ${signedDate}`, 'Client']
      );
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to save signed contract.' });
  }
});

// DELETE /api/contracts/:id — delete a contract
app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid contract id.' });
    const result = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Contract not found.' });
    res.json({ success: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({ error: e.message || 'Failed to delete contract.' });
  }
});

// In production, serve the built React app (Heroku builds root first, then server)
if (process.env.NODE_ENV === 'production') {
  const buildDir = path.join(__dirname, '..', '..', 'build');
  app.use(express.static(buildDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database info: http://localhost:${PORT}/api/db-info\n`);
});
