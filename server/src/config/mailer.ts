import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'noreply@techforcerobotics.com';

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export async function sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email not sent: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).');
    return;
  }
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: 'Verify your TechForce Portal email',
      text: `Please verify your email by opening this link in your browser:\n\n${verificationLink}\n\nIf you did not create an account, you can ignore this email.`,
      html: `
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>If you did not create an account, you can ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send verification email:', err);
    throw err;
  }
}

export async function sendTaskAssignedEmail(
  to: string,
  taskName: string,
  taskId: number,
  taskLink: string
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email not sent: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).');
    return;
  }
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: `Task assigned to you: ${taskName}`,
      text: `A task has been assigned to you.\n\nTask: ${taskName} (#${taskId})\n\nView task: ${taskLink}`,
      html: `
        <p>A task has been assigned to you.</p>
        <p><strong>Task:</strong> ${escapeHtml(taskName)} (#${taskId})</p>
        <p><a href="${taskLink}">View task</a></p>
      `,
    });
  } catch (err) {
    console.error('Failed to send task-assigned email:', err);
    throw err;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface InvoiceConfirmationPayload {
  orderNumber: string;
  companyName: string;
  billingEntity: string;
  billingAddress: string;
  shippingAddress: string;
  products: Array<{ productName: string; serialNumber?: string; quantity?: number }>;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  userEmail?: string;
}

export async function sendInvoiceConfirmationEmail(payload: InvoiceConfirmationPayload): Promise<void> {
  const to = 'karl@pierpointmgmt.com';
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email not sent: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).');
    return;
  }
  const qty = (p: { productName: string; serialNumber?: string; quantity?: number }) => (p.quantity != null && p.quantity > 0 ? p.quantity : 1);
  const productLine = (p: { productName: string; serialNumber?: string; quantity?: number }) =>
    `${qty(p)} x ${p.productName}${p.serialNumber ? ` (${p.serialNumber})` : ''}`;
  const productsList = payload.products
    .map((p) => `• ${escapeHtml(productLine(p))}`)
    .join('<br/>');
  const text = [
    `Order: ${payload.orderNumber}`,
    `Company: ${payload.companyName}`,
    '',
    'Billing entity:',
    payload.billingEntity || '—',
    '',
    'Billing address:',
    payload.billingAddress,
    '',
    'Shipping address:',
    payload.shippingAddress,
    '',
    'Products:',
    ...payload.products.map((p) => `• ${productLine(p)}`),
    '',
    `Invoice date: ${payload.invoiceDate}`,
    `Due date: ${payload.dueDate}`,
    `Terms: ${payload.terms}`,
    ...(payload.userEmail
      ? ['', 'Please send a copy of the QuickBooks Invoice to this email address: ' + payload.userEmail]
      : []),
  ].join('\n');
  const html = `
    <p><strong>Order:</strong> ${escapeHtml(payload.orderNumber)}</p>
    <p><strong>Company:</strong> ${escapeHtml(payload.companyName)}</p>
    <h3>Billing entity</h3>
    <p>${escapeHtml(payload.billingEntity || '—')}</p>
    <h3>Billing address</h3>
    <pre>${escapeHtml(payload.billingAddress)}</pre>
    <h3>Shipping address</h3>
    <pre>${escapeHtml(payload.shippingAddress)}</pre>
    <h3>Products</h3>
    <p>${productsList || '—'}</p>
    <p><strong>Invoice date:</strong> ${escapeHtml(payload.invoiceDate)}</p>
    <p><strong>Due date:</strong> ${escapeHtml(payload.dueDate)}</p>
    <p><strong>Terms:</strong> ${escapeHtml(payload.terms)}</p>
    ${payload.userEmail ? `<p>Please send a copy of the QuickBooks Invoice to this email address: ${escapeHtml(payload.userEmail)}</p>` : ''}
  `;
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: `Invoice confirmation: Order ${payload.orderNumber} – ${payload.companyName}`,
      text,
      html,
    });
  } catch (err) {
    console.error('Failed to send invoice confirmation email:', err);
    throw err;
  }
}
