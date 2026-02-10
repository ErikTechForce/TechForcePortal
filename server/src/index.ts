import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from './config/database.js';
import { sendVerificationEmail } from './config/mailer.js';

dotenv.config();

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
      `SELECT id, username, email, password_hash, email_verified_at FROM users WHERE email = $1`,
      [emailLower]
    );
    const user = result.rows[0];
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
    res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Login failed.' });
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

// PATCH /api/contracts/:contractId/signed — save signed PDF (contractId = contract_id string, not DB id)
app.patch('/api/contracts/:contractId/signed', async (req, res) => {
  try {
    const contractId = (req.params.contractId as string)?.trim();
    if (!contractId) return res.status(400).json({ error: 'contractId is required.' });
    const { pdf_signed } = req.body as { pdf_signed?: string };
    if (!pdf_signed || typeof pdf_signed !== 'string') {
      return res.status(400).json({ error: 'pdf_signed (base64) is required.' });
    }
    const pdfBuffer = Buffer.from(pdf_signed, 'base64');
    const result = await pool.query(
      `UPDATE contracts SET pdf_signed = $1, signed_at = CURRENT_TIMESTAMP, status = 'signed' WHERE contract_id = $2 RETURNING id`,
      [pdfBuffer, contractId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Contract not found.' });
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

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database info: http://localhost:${PORT}/api/db-info\n`);
});
