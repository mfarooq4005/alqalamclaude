/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   AL QALAM INTERNATIONAL — Node.js / Express Backend        ║
 * ║   Version: 2.0  |  Author: AL Qalam EMS Team               ║
 * ║                                                              ║
 * ║   Install: npm install                                       ║
 * ║   Run dev:  npm run dev                                      ║
 * ║   Run prod: npm start   (or pm2 start server.js)            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const mysql        = require('mysql2/promise');
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const rateLimit    = require('express-rate-limit');
const { Server }   = require('socket.io');
const http         = require('http');

const app    = express();
const server = http.createServer(app);

// ── Socket.io (Real-time) ──────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// ── Port ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// ══════════════════════════════════════════════════════════════
//  DATABASE POOL
// ══════════════════════════════════════════════════════════════
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || '127.0.0.1',
  port:               process.env.DB_PORT     || 3306,
  database:           process.env.DB_DATABASE || 'alqalam_db',
  user:               process.env.DB_USERNAME || 'root',
  password:           process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+05:00',
});

// Test DB on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    console.log('✅ MySQL connected:', process.env.DB_DATABASE);
  } catch (e) {
    console.error('❌ MySQL connection failed:', e.message);
    process.exit(1);
  }
})();

// ══════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ══════════════════════════════════════════════════════════════
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Device-Type','X-App-Version'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiter — 100 requests / minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests. Please slow down.' },
}));

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
const JWT_SECRET  = process.env.JWT_SECRET  || 'alqalam_change_me';
const JWT_EXPIRY  = process.env.JWT_EXPIRY  || '24h';
const LATE_TIME   = process.env.ATTENDANCE_LATE_TIME || '08:30';

function success(data, meta = {}) {
  return { success: true, data, ...meta, timestamp: new Date().toISOString() };
}
function fail(error, code = 400) {
  return { success: false, error, timestamp: new Date().toISOString() };
}
function paginate(items, page = 1, per = 20) {
  const total = items.length;
  const pages = Math.ceil(total / per);
  const start = (page - 1) * per;
  return { items: items.slice(start, start + per), total, page, pages, per_page: per };
}

// JWT Auth Middleware
function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json(fail('Unauthorized — no token', 401));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json(fail('Forbidden — insufficient role', 403));
      }
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json(fail('Unauthorized — invalid or expired token', 401));
    }
  };
}

// ══════════════════════════════════════════════════════════════
//  ROUTE: HEALTH CHECK
// ══════════════════════════════════════════════════════════════
app.get('/', (req, res) => res.json(success({
  name: 'AL Qalam International EMS API',
  version: '2.0',
  stack: 'Node.js / Express',
  db: 'MySQL (alqalam_db)',
  endpoints: ['/auth','/students','/fee','/attendance','/staff','/library','/transport','/examination','/notifications','/reports'],
})));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json(success({ status:'ok', db:'connected', version:'2.0', uptime: process.uptime().toFixed(0)+'s' }));
  } catch {
    res.status(503).json(fail('Database unavailable', 503));
  }
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: AUTH
// ══════════════════════════════════════════════════════════════
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json(fail('Username and password required'));

  const [rows] = await pool.query(
    `SELECT u.*, r.name AS role FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.username = ? AND u.is_active = 1 LIMIT 1`, [username]
  );
  if (!rows.length) return res.status(401).json(fail('Invalid credentials'));

  const user = rows[0];
  // For DEMO: allow plain-text comparison if hash starts with $2 (bcrypt) else direct
  const valid = user.password_hash.startsWith('$2')
    ? await bcrypt.compare(password, user.password_hash)
    : password === user.password_hash; // demo mode

  if (!valid) {
    await pool.query(`INSERT INTO login_logs (user_id,username,role,ip_address,action,status,fail_reason) VALUES (?,?,?,?,?,?,?)`,
      [user.id, username, user.role, req.ip, 'login', 'failed', 'Wrong password']);
    return res.status(401).json(fail('Invalid credentials'));
  }

  const payload = { id:user.id, username:user.username, role:user.role, name:user.full_name, branch_id:user.branch_id };
  const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  // Log login
  await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);
  await pool.query(`INSERT INTO login_logs (user_id,username,role,ip_address,action,status) VALUES (?,?,?,?,?,?)`,
    [user.id, username, user.role, req.ip, 'login', 'success']);

  // Emit real-time event
  io.emit('user_login', { name: user.full_name, role: user.role, time: new Date().toISOString() });

  res.json(success({
    token,
    user: { id:user.id, username:user.username, full_name:user.full_name, role:user.role, email:user.email, phone:user.phone, profile_photo:user.profile_photo }
  }));
});

app.post('/auth/logout', auth(), async (req, res) => {
  await pool.query(`INSERT INTO login_logs (user_id,username,role,ip_address,action,status) VALUES (?,?,?,?,?,?)`,
    [req.user.id, req.user.username, req.user.role, req.ip, 'logout', 'success']);
  res.json(success({ message: 'Logged out successfully' }));
});

app.post('/auth/change-password', auth(), async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json(fail('Both passwords required'));
  if (new_password.length < 8) return res.status(400).json(fail('New password must be at least 8 characters'));

  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const valid   = await bcrypt.compare(current_password, rows[0]?.password_hash || '');
  if (!valid) return res.status(400).json(fail('Current password is wrong'));

  const hash = await bcrypt.hash(new_password, 12);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json(success({ message: 'Password changed successfully' }));
});

app.get('/auth/me', auth(), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.branch_id, r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? LIMIT 1`,
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json(fail('User not found', 404));
  res.json(success(rows[0]));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: STUDENTS
// ══════════════════════════════════════════════════════════════
app.get('/students', auth(['super_admin','admin','principal','teacher','accountant','receptionist']), async (req, res) => {
  const page    = parseInt(req.query.page)  || 1;
  const per     = parseInt(req.query.per_page) || 20;
  const search  = req.query.search || '';
  const classId = req.query.class_id || '';
  const offset  = (page - 1) * per;

  let where = 'WHERE s.branch_id = ?';
  const params = [req.user.branch_id];
  if (search) { where += ' AND (u.full_name LIKE ? OR s.roll_number LIKE ? OR s.registration_no LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (classId) { where += ' AND s.class_id = ?'; params.push(classId); }

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM students s JOIN users u ON s.user_id = u.id ${where}`, params);
  const [students] = await pool.query(
    `SELECT s.id, s.roll_number, s.registration_no, u.full_name, u.email, u.phone,
            c.name AS class_name, sec.name AS section_name, s.status, s.blood_group,
            p.full_name AS parent_name, p.phone AS parent_phone
     FROM students s
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN sections sec ON s.section_id = sec.id
     LEFT JOIN student_parent_link spl ON s.id = spl.student_id AND spl.relation = 'father'
     LEFT JOIN parents par ON spl.parent_id = par.id
     LEFT JOIN users p ON par.user_id = p.id
     ${where} ORDER BY s.roll_number LIMIT ? OFFSET ?`,
    [...params, per, offset]
  );
  res.json(success({ items: students, total, page, pages: Math.ceil(total/per) }));
});

app.get('/students/:id', auth(), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.*, u.full_name, u.email, u.phone, u.gender, u.dob, u.address,
            c.name AS class_name, sec.name AS section_name
     FROM students s JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id LEFT JOIN sections sec ON s.section_id = sec.id
     WHERE s.id = ? LIMIT 1`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json(fail('Student not found', 404));
  res.json(success(rows[0]));
});

app.post('/students', auth(['super_admin','admin','receptionist']), async (req, res) => {
  const { full_name, email, phone, class_id, section_id, roll_number, admission_date, father_name, father_phone } = req.body;
  if (!full_name || !class_id) return res.status(400).json(fail('full_name and class_id are required'));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const password_hash = await bcrypt.hash('Student@123', 10);
    const username = roll_number || `aq_${Date.now()}`;
    const [u] = await conn.query(
      `INSERT INTO users (branch_id, role_id, username, email, password_hash, full_name, phone) VALUES (?,6,?,?,?,?,?)`,
      [req.user.branch_id, username, email||`${username}@alqalam.edu.pk`, password_hash, full_name, phone||null]
    );
    const academic_year_id = 1; // TODO: get current year
    const reg_no = `AQ-REG-${new Date().getFullYear()}-${String(u.insertId).padStart(4,'0')}`;
    await conn.query(
      `INSERT INTO students (user_id, branch_id, roll_number, registration_no, class_id, section_id, academic_year_id, admission_date) VALUES (?,?,?,?,?,?,?,?)`,
      [u.insertId, req.user.branch_id, roll_number||reg_no, reg_no, class_id, section_id||null, academic_year_id, admission_date||new Date().toISOString().split('T')[0]]
    );
    await conn.commit();
    io.emit('student_added', { name: full_name, class: class_id });
    res.status(201).json(success({ message: 'Student created', user_id: u.insertId, registration_no: reg_no }));
  } catch (e) {
    await conn.rollback();
    res.status(500).json(fail(e.message, 500));
  } finally { conn.release(); }
});

app.put('/students/:id', auth(['super_admin','admin','receptionist']), async (req, res) => {
  const { full_name, email, phone, class_id, section_id, status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(`SELECT user_id FROM students WHERE id = ? AND branch_id = ? LIMIT 1`, [req.params.id, req.user.branch_id]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json(fail('Student not found', 404));
    }
    const userId = rows[0].user_id;
    await conn.query(`UPDATE users SET full_name = COALESCE(?,full_name), email = COALESCE(?,email), phone = COALESCE(?,phone) WHERE id = ?`, [full_name||null, email||null, phone||null, userId]);
    await conn.query(`UPDATE students SET class_id = COALESCE(?,class_id), section_id = COALESCE(?,section_id), status = COALESCE(?,status) WHERE id = ?`, [class_id||null, section_id||null, status||null, req.params.id]);
    await conn.commit();
    res.json(success({ message: 'Student updated successfully' }));
  } catch (e) {
    await conn.rollback();
    res.status(500).json(fail(e.message, 500));
  } finally {
    conn.release();
  }
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: CLASSES / SECTIONS
// ══════════════════════════════════════════════════════════════
app.get('/classes', auth(), async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM classes WHERE branch_id = ? ORDER BY display_order, name`, [req.user.branch_id]);
  res.json(success({ items: rows, total: rows.length }));
});

app.post('/classes', auth(['super_admin','admin','principal']), async (req, res) => {
  const { name, display_order } = req.body;
  if (!name) return res.status(400).json(fail('name is required'));
  const [result] = await pool.query(
    `INSERT INTO classes (branch_id, name, display_order, is_active) VALUES (?,?,?,1)`,
    [req.user.branch_id, name, display_order || 0]
  );
  res.status(201).json(success({ id: result.insertId, message: 'Class created' }));
});

app.put('/classes/:id', auth(['super_admin','admin','principal']), async (req, res) => {
  const { name, display_order, is_active } = req.body;
  await pool.query(
    `UPDATE classes SET name = COALESCE(?,name), display_order = COALESCE(?,display_order), is_active = COALESCE(?,is_active) WHERE id = ? AND branch_id = ?`,
    [name||null, display_order ?? null, is_active ?? null, req.params.id, req.user.branch_id]
  );
  res.json(success({ message: 'Class updated' }));
});

app.get('/sections', auth(), async (req, res) => {
  const classId = req.query.class_id || null;
  let q = `SELECT sec.*, c.name AS class_name FROM sections sec JOIN classes c ON sec.class_id = c.id WHERE c.branch_id = ?`;
  const p = [req.user.branch_id];
  if (classId) {
    q += ` AND sec.class_id = ?`;
    p.push(classId);
  }
  q += ` ORDER BY sec.name`;
  const [rows] = await pool.query(q, p);
  res.json(success({ items: rows, total: rows.length }));
});

app.post('/sections', auth(['super_admin','admin','principal']), async (req, res) => {
  const { class_id, name } = req.body;
  if (!class_id || !name) return res.status(400).json(fail('class_id and name required'));
  const [classRows] = await pool.query(
    `SELECT id FROM classes WHERE id = ? AND branch_id = ? LIMIT 1`,
    [class_id, req.user.branch_id]
  );
  if (!classRows.length) return res.status(404).json(fail('Class not found in your branch', 404));
  const [result] = await pool.query(
    `INSERT INTO sections (class_id, name, is_active) VALUES (?,?,1)`,
    [class_id, name]
  );
  res.status(201).json(success({ id: result.insertId, message: 'Section created' }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: FEE
// ══════════════════════════════════════════════════════════════
app.get('/fee/challans', auth(['super_admin','admin','accountant','principal']), async (req, res) => {
  const page = parseInt(req.query.page)||1, per = 20, offset = (page-1)*per;
  const { status, month, class_id } = req.query;
  let where = 'WHERE s.branch_id = ?';
  const params = [req.user.branch_id];
  if (status) { where += ' AND fp.status = ?'; params.push(status); }
  if (class_id) { where += ' AND st.class_id = ?'; params.push(class_id); }
  const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM fee_payments fp JOIN students st ON fp.student_id=st.id JOIN users s ON st.user_id=s.id ${where}`, params);
  const [rows] = await pool.query(
    `SELECT fp.id, fp.invoice_no, s.full_name AS student_name, st.roll_number, c.name AS class_name,
            fp.amount_due, fp.amount_paid, fp.late_fee_applied, fp.discount, fp.payment_date,
            fp.due_date, fp.payment_method, fp.receipt_no, fp.status
     FROM fee_payments fp
     JOIN students st ON fp.student_id = st.id
     JOIN users s ON st.user_id = s.id
     JOIN classes c ON st.class_id = c.id
     ${where} ORDER BY fp.created_at DESC LIMIT ? OFFSET ?`,
    [...params, per, offset]
  );
  res.json(success({ items: rows, total, page, pages: Math.ceil(total/per) }));
});

app.post('/fee/collect', auth(['super_admin','admin','accountant']), async (req, res) => {
  const { student_id, amount_paid, payment_method, bank_name, transaction_ref, receipt_no } = req.body;
  if (!student_id || !amount_paid) return res.status(400).json(fail('student_id and amount_paid required'));

  const methods = ['cash','bank_transfer','cheque','online'];
  const method  = methods.includes(payment_method) ? payment_method : 'cash';
  const rcpNo   = receipt_no || `RCP-${Date.now()}`;

  const [result] = await pool.query(
    `UPDATE fee_payments SET amount_paid=?, payment_method=?, receipt_no=?, payment_date=CURDATE(),
     status=IF(?>=amount_due,'paid','partial'), collected_by=?
     WHERE student_id=? AND status IN('pending','partial') ORDER BY due_date ASC LIMIT 1`,
    [amount_paid, method, rcpNo, amount_paid, req.user.id, student_id]
  );
  if (result.affectedRows === 0) return res.status(404).json(fail('No pending fee found for this student'));

  // Emit real-time
  io.emit('fee_collected', { student_id, amount: amount_paid, method, time: new Date().toISOString() });

  // WhatsApp notification (async, don't block response)
  const [st] = await pool.query(`SELECT u.phone, u.full_name FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=?`, [student_id]);
  if (st.length && process.env.TWILIO_SID && !process.env.TWILIO_SID.startsWith('ACxxxx')) {
    sendWhatsApp(st[0].phone, `✅ Fee Received\nStudent: ${st[0].full_name}\nAmount: Rs. ${parseInt(amount_paid).toLocaleString()}\nReceipt: ${rcpNo}\nMethod: ${method}\n\n— AL Qalam International`).catch(()=>{});
  }

  res.json(success({ message:'Fee collected', receipt_no: rcpNo, payment_method: method }));
});

app.get('/fee/arrears', auth(['super_admin','admin','accountant','principal']), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT fa.*, u.full_name AS student_name, s.roll_number, c.name AS class_name
     FROM fee_arrears fa
     JOIN students s ON fa.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE fa.branch_id = ? AND fa.status != 'cleared'
     ORDER BY fa.balance DESC`, [req.user.branch_id]
  );
  res.json(success({ items: rows, total: rows.length }));
});

app.get('/fee/student/:studentId', auth(), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT fp.*, u.full_name AS student_name
     FROM fee_payments fp
     JOIN students s ON fp.student_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE fp.student_id = ? AND s.branch_id = ?
     ORDER BY fp.due_date DESC`,
    [req.params.studentId, req.user.branch_id]
  );
  res.json(success({ items: rows, total: rows.length }));
});

app.post('/fee/challans/generate', auth(['super_admin','admin','accountant']), async (req, res) => {
  const { class_id, month, amount_due, due_date } = req.body;
  if (!class_id || !month) return res.status(400).json(fail('class_id and month are required'));

  const [classRows] = await pool.query(
    `SELECT id FROM classes WHERE id = ? AND branch_id = ? LIMIT 1`,
    [class_id, req.user.branch_id]
  );
  if (!classRows.length) return res.status(404).json(fail('Class not found in your branch', 404));

  const [feeStructureRows] = await pool.query(
    `SELECT id FROM fee_structures WHERE branch_id = ? AND class_id = ? AND is_active = 1 LIMIT 1`,
    [req.user.branch_id, class_id]
  );
  if (!feeStructureRows.length) {
    return res.status(400).json(fail('No active fee structure configured for this class', 400));
  }
  const feeStructureId = feeStructureRows[0].id;

  const [students] = await pool.query(
    `SELECT s.id AS student_id, s.roll_number, u.full_name
     FROM students s JOIN users u ON s.user_id = u.id
     WHERE s.branch_id = ? AND s.class_id = ? AND s.status = 'active'`,
    [req.user.branch_id, class_id]
  );
  if (!students.length) return res.status(404).json(fail('No active students found for selected class', 404));

  const amt = Number(amount_due || 5000);
  const dueDate = due_date || `${month}-10`;
  let generated = 0;
  for (const st of students) {
    const invoiceNo = `INV-${month}-${String(st.student_id).padStart(5, '0')}`;
    await pool.query(
      `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_no, amount_due, amount_paid, due_date, status, remarks)
       VALUES (?,?,?,?,0,?,'pending',?)
       ON DUPLICATE KEY UPDATE
         amount_due = IF(status IN ('pending','overdue'), VALUES(amount_due), amount_due),
         due_date = IF(status IN ('pending','overdue'), VALUES(due_date), due_date),
         remarks = IF(status IN ('pending','overdue'), VALUES(remarks), remarks)`,
      [st.student_id, feeStructureId, invoiceNo, amt, dueDate, month]
    );
    generated++;
  }
  io.emit('challans_generated', { class_id, month, total: generated });
  res.status(201).json(success({ message: 'Challans generated successfully', class_id, month, generated }));
});

app.post('/fee/advance', auth(['super_admin','admin','accountant']), async (req, res) => {
  const { student_id, amount, valid_for, payment_mode, bank_name, cheque_no, receipt_no } = req.body;
  if (!student_id || !amount) return res.status(400).json(fail('student_id and amount required'));
  await pool.query(
    `INSERT INTO fee_advance_payments (student_id, branch_id, amount, paid_date, valid_for, receipt_no, payment_mode, bank_name, cheque_no, collected_by)
     VALUES (?,?,?,CURDATE(),?,?,?,?,?,?)`,
    [student_id, req.user.branch_id, amount, valid_for||null, receipt_no||`ADV-${Date.now()}`, payment_mode||'cash', bank_name||null, cheque_no||null, req.user.id]
  );
  res.status(201).json(success({ message: 'Advance payment recorded' }));
});

app.post('/fee/closing/generate', auth(['super_admin','admin','accountant']), async (req, res) => {
  const { branch_id, month } = req.body;
  if (!month) return res.status(400).json(fail('month is required (YYYY-MM format)'));
  const [rows] = await pool.query(`CALL GenerateFeeClosingReport(?, ?)`, [branch_id||req.user.branch_id, month]);
  res.json(success(rows[0]?.[0] || { message: 'Report generated', month }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: ATTENDANCE (Students)
// ══════════════════════════════════════════════════════════════
app.get('/attendance/today', auth(['super_admin','admin','principal','teacher']), async (req, res) => {
  const { class_id } = req.query;
  let where = 'WHERE sa.date = CURDATE() AND s.branch_id = ?';
  const params = [req.user.branch_id];
  if (class_id) { where += ' AND s.class_id = ?'; params.push(class_id); }
  const [rows] = await pool.query(
    `SELECT sa.*, u.full_name, s.roll_number, c.name AS class_name
     FROM student_attendance sa
     JOIN students s ON sa.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id ${where}`, params
  );
  const present = rows.filter(r=>r.status==='present').length;
  const absent  = rows.filter(r=>r.status==='absent').length;
  res.json(success({ items:rows, total:rows.length, present, absent, percentage: rows.length ? Math.round(present/rows.length*100) : 0 }));
});

app.post('/attendance/bulk', auth(['super_admin','admin','teacher']), async (req, res) => {
  const { class_id, date, records } = req.body; // records: [{student_id, status, remarks}]
  if (!class_id || !records?.length) return res.status(400).json(fail('class_id and records required'));
  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const values = records.map(r => [r.student_id, attendanceDate, r.status||'absent', r.remarks||null, req.user.id]);
  await pool.query(
    `INSERT INTO student_attendance (student_id, date, status, remarks, marked_by) VALUES ?
     ON DUPLICATE KEY UPDATE status=VALUES(status), remarks=VALUES(remarks), marked_by=VALUES(marked_by)`,
    [values]
  );
  // Real-time push to dashboard
  io.to(`class_${class_id}`).emit('attendance_updated', { class_id, date: attendanceDate, count: records.length });
  res.json(success({ message: `Attendance saved for ${records.length} students`, date: attendanceDate }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: STAFF ATTENDANCE (Self check-in)
// ══════════════════════════════════════════════════════════════
app.post('/staff/checkin', auth(), async (req, res) => {
  const now      = new Date();
  const hh       = now.getHours(), mm = now.getMinutes();
  const [lH, lM] = LATE_TIME.split(':').map(Number);
  const isLate   = hh > lH || (hh === lH && mm > lM);
  const lateMin  = isLate ? (hh*60+mm) - (lH*60+lM) : 0;
  const status   = isLate ? 'late' : 'present';
  const checkIn  = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;
  const today    = now.toISOString().split('T')[0];

  await pool.query(
    `INSERT INTO staff_attendance (user_id, branch_id, date, check_in, status, late_minutes, device_type, ip_address)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), status=VALUES(status), late_minutes=VALUES(late_minutes)`,
    [req.user.id, req.user.branch_id, today, checkIn, status, lateMin, req.headers['x-device-type']||'web', req.ip]
  );

  // Real-time broadcast to admin dashboard
  io.emit('staff_checkin', { name: req.user.name, role: req.user.role, time: checkIn, status, late_minutes: lateMin });

  res.json(success({ check_in: checkIn, status, late_minutes: lateMin, message: isLate ? `Marked late by ${lateMin} minutes` : 'Checked in on time ✅' }));
});

app.post('/staff/checkout', auth(), async (req, res) => {
  const now     = new Date();
  const checkOut = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;
  const today   = now.toISOString().split('T')[0];

  const [result] = await pool.query(
    `UPDATE staff_attendance SET check_out = ? WHERE user_id = ? AND date = ?`,
    [checkOut, req.user.id, today]
  );
  if (result.affectedRows === 0) return res.status(400).json(fail('No check-in found for today. Please check in first.'));

  io.emit('staff_checkout', { name: req.user.name, time: checkOut });
  res.json(success({ check_out: checkOut, message: 'Checked out successfully ✅' }));
});

app.get('/staff/attendance/today', auth(['super_admin','admin','principal','hr_manager']), async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM v_staff_attendance_today ORDER BY check_in ASC`);
  const present = rows.filter(r=>['present','late'].includes(r.status)).length;
  const absent  = rows.filter(r=>r.status==='absent').length;
  const late    = rows.filter(r=>r.status==='late').length;
  res.json(success({ items:rows, present, absent, late, total: rows.length }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: STAFF / TEACHERS
// ══════════════════════════════════════════════════════════════
app.get('/staff', auth(['super_admin','admin','principal','hr_manager']), async (req, res) => {
  const page = parseInt(req.query.page)||1, per=20, offset=(page-1)*per;
  const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM teachers t JOIN users u ON t.user_id=u.id WHERE t.branch_id=?`, [req.user.branch_id]);
  const [rows] = await pool.query(
    `SELECT t.*, u.full_name, u.email, u.phone, u.gender, r.name AS role_name
     FROM teachers t JOIN users u ON t.user_id=u.id JOIN roles r ON u.role_id=r.id
     WHERE t.branch_id=? ORDER BY t.joining_date DESC LIMIT ? OFFSET ?`,
    [req.user.branch_id, per, offset]
  );
  res.json(success({ items: rows, total, page }));
});

app.post('/staff', auth(['super_admin','admin','principal','hr_manager']), async (req, res) => {
  const { full_name, email, phone, role_name, qualification, joining_date, basic_salary } = req.body;
  if (!full_name || !email) return res.status(400).json(fail('full_name and email are required'));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [roleRows] = await conn.query(`SELECT id FROM roles WHERE name = ? LIMIT 1`, [role_name || 'teacher']);
    if (!roleRows.length) {
      await conn.rollback();
      return res.status(400).json(fail('Invalid role_name'));
    }
    const username = `${(role_name || 'staff').slice(0,3)}_${Date.now()}`;
    const password_hash = await bcrypt.hash('Staff@123', 10);
    const [u] = await conn.query(
      `INSERT INTO users (branch_id, role_id, username, email, password_hash, full_name, phone, is_active)
       VALUES (?,?,?,?,?,?,?,1)`,
      [req.user.branch_id, roleRows[0].id, username, email, password_hash, full_name, phone || null]
    );
    await conn.query(
      `INSERT INTO teachers (user_id, branch_id, qualification, joining_date, basic_salary, status)
       VALUES (?,?,?,?,?, 'active')`,
      [u.insertId, req.user.branch_id, qualification || null, joining_date || new Date().toISOString().split('T')[0], basic_salary || 0]
    );
    await conn.commit();
    res.status(201).json(success({ message: 'Staff member created', user_id: u.insertId, username }));
  } catch (e) {
    await conn.rollback();
    res.status(500).json(fail(e.message, 500));
  } finally {
    conn.release();
  }
});

app.put('/staff/:id', auth(['super_admin','admin','principal','hr_manager']), async (req, res) => {
  const { full_name, email, phone, qualification, joining_date, basic_salary, status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(`SELECT user_id FROM teachers WHERE id = ? AND branch_id = ? LIMIT 1`, [req.params.id, req.user.branch_id]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json(fail('Staff member not found', 404));
    }
    const userId = rows[0].user_id;
    await conn.query(`UPDATE users SET full_name = COALESCE(?,full_name), email = COALESCE(?,email), phone = COALESCE(?,phone) WHERE id = ?`, [full_name||null, email||null, phone||null, userId]);
    await conn.query(
      `UPDATE teachers SET qualification = COALESCE(?,qualification), joining_date = COALESCE(?,joining_date), basic_salary = COALESCE(?,basic_salary), status = COALESCE(?,status) WHERE id = ?`,
      [qualification||null, joining_date||null, basic_salary ?? null, status||null, req.params.id]
    );
    await conn.commit();
    res.json(success({ message: 'Staff member updated' }));
  } catch (e) {
    await conn.rollback();
    res.status(500).json(fail(e.message, 500));
  } finally {
    conn.release();
  }
});

app.get('/salary/sheet', auth(['super_admin','admin','accountant','hr_manager']), async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json(fail('month param required (YYYY-MM)'));
  const [rows] = await pool.query(
    `SELECT ss.*, u.full_name, u.phone FROM salary_sheets ss JOIN users u ON ss.user_id=u.id
     WHERE ss.branch_id=? AND ss.month=? ORDER BY u.full_name`, [req.user.branch_id, month]
  );
  const totalNet = rows.reduce((s,r)=>s+parseFloat(r.net_salary||0),0);
  res.json(success({ items: rows, total_net: totalNet, month }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: LIBRARY
// ══════════════════════════════════════════════════════════════
app.get('/library/books', auth(), async (req, res) => {
  const search = req.query.search || '';
  let where = 'WHERE b.branch_id = ?';
  const params = [req.user.branch_id];
  if (search) { where += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  const [rows] = await pool.query(
    `SELECT b.*, (b.total_copies - b.issued_copies) AS available FROM library_books b ${where} ORDER BY b.title`,
    params
  );
  res.json(success({ items: rows, total: rows.length }));
});

app.post('/library/issue', auth(['super_admin','admin','librarian']), async (req, res) => {
  const { book_id, student_id, due_date } = req.body;
  if (!book_id || !student_id) return res.status(400).json(fail('book_id and student_id required'));
  const [[book]] = await pool.query(`SELECT * FROM library_books WHERE id=? AND (total_copies - issued_copies) > 0`, [book_id]);
  if (!book) return res.status(400).json(fail('Book not available'));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`UPDATE library_books SET issued_copies = issued_copies + 1 WHERE id=?`, [book_id]);
    await conn.query(`INSERT INTO library_issues (book_id, student_id, issue_date, due_date, issued_by) VALUES (?,?,CURDATE(),?,?)`,
      [book_id, student_id, due_date||null, req.user.id]);
    await conn.commit();
    res.status(201).json(success({ message: 'Book issued successfully' }));
  } catch(e) {
    await conn.rollback();
    res.status(500).json(fail(e.message, 500));
  } finally { conn.release(); }
});

app.put('/library/return/:issueId', auth(['super_admin','admin','librarian']), async (req, res) => {
  const [result] = await pool.query(
    `UPDATE library_issues SET return_date=CURDATE(), status='returned' WHERE id=? AND status='issued'`,
    [req.params.issueId]
  );
  if (!result.affectedRows) return res.status(404).json(fail('Issue record not found or already returned'));
  const [[issue]] = await pool.query(`SELECT book_id FROM library_issues WHERE id=?`, [req.params.issueId]);
  await pool.query(`UPDATE library_books SET issued_copies = issued_copies - 1 WHERE id=?`, [issue.book_id]);
  res.json(success({ message: 'Book returned successfully' }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: TRANSPORT
// ══════════════════════════════════════════════════════════════
app.get('/transport/routes', auth(), async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM transport_routes WHERE branch_id=? AND is_active=1`, [req.user.branch_id]);
  res.json(success({ items: rows, total: rows.length }));
});

app.get('/transport/routes/:id/students', auth(['super_admin','admin','transport_manager']), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ts.*, u.full_name AS student_name, s.roll_number, c.name AS class_name
     FROM transport_students ts
     JOIN students s ON ts.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE ts.route_id = ? AND ts.status='active'`, [req.params.id]
  );
  res.json(success({ items: rows, total: rows.length }));
});

app.post('/transport/enroll', auth(['super_admin','admin','transport_manager']), async (req, res) => {
  const { student_id, route_id, pickup_stop } = req.body;
  if (!student_id || !route_id) return res.status(400).json(fail('student_id and route_id required'));
  await pool.query(
    `INSERT INTO transport_students (student_id, route_id, pickup_stop, enrolled_date, status) VALUES (?,?,?,CURDATE(),'active')
     ON DUPLICATE KEY UPDATE route_id=VALUES(route_id), pickup_stop=VALUES(pickup_stop), status='active'`,
    [student_id, route_id, pickup_stop||null]
  );
  res.status(201).json(success({ message: 'Student enrolled in transport route' }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: EXAMINATION
// ══════════════════════════════════════════════════════════════
app.get('/examination/exams', auth(), async (req, res) => {
  const { class_id, status } = req.query;
  let where = 'WHERE e.branch_id = ?';
  const params = [req.user.branch_id];
  if (class_id) { where += ' AND e.class_id = ?'; params.push(class_id); }
  if (status)   { where += ' AND e.status = ?';   params.push(status); }
  const [rows] = await pool.query(
    `SELECT e.*, et.name AS exam_type_name, c.name AS class_name, ay.label AS year
     FROM exams e JOIN exam_types et ON e.exam_type_id=et.id
     JOIN classes c ON e.class_id=c.id JOIN academic_years ay ON e.academic_year_id=ay.id
     ${where} ORDER BY e.start_date DESC`, params
  );
  res.json(success({ items: rows, total: rows.length }));
});

app.get('/examination/schedule/:examId', auth(), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT es.*, sub.name AS subject_name, c.name AS class_name,
            u.full_name AS invigilator_name
     FROM exam_schedule es
     JOIN subjects sub ON es.subject_id = sub.id
     JOIN classes c ON es.class_id = c.id
     LEFT JOIN teachers t ON es.invigilator_id = t.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE es.exam_id = ? ORDER BY es.exam_date, es.start_time`, [req.params.examId]
  );
  res.json(success({ items: rows, total: rows.length }));
});

app.post('/examination/results', auth(['super_admin','admin','teacher','exam_controller']), async (req, res) => {
  const { student_id, exam_id, subject_id, marks_obtained, total_marks, remarks } = req.body;
  if (!student_id || !exam_id || !subject_id) return res.status(400).json(fail('student_id, exam_id, subject_id required'));
  const grade = calcGrade(marks_obtained, total_marks||100);
  await pool.query(
    `INSERT INTO results (student_id, exam_id, subject_id, marks_obtained, total_marks, grade, remarks, entered_by)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), grade=VALUES(grade), remarks=VALUES(remarks)`,
    [student_id, exam_id, subject_id, marks_obtained, total_marks||100, grade, remarks||null, req.user.id]
  );
  io.emit('result_entered', { student_id, exam_id, subject_id, marks: marks_obtained });
  res.status(201).json(success({ message: 'Result saved', grade }));
});

function calcGrade(marks, total) {
  const pct = (marks / total) * 100;
  if (pct >= 90) return 'A+'; if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';  if (pct >= 33) return 'E';
  return 'F';
}

// ══════════════════════════════════════════════════════════════
//  ROUTE: NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
app.get('/notifications', auth(), async (req, res) => {
  const unread = req.query.unread === '1';
  let where = 'WHERE n.recipient_id = ?';
  const params = [req.user.id];
  if (unread) { where += ' AND n.is_read = 0'; }
  const [rows] = await pool.query(
    `SELECT n.*, u.full_name AS sender_name FROM notifications n
     LEFT JOIN users u ON n.sender_id = u.id ${where} ORDER BY n.created_at DESC LIMIT 50`, params
  );
  res.json(success({ items: rows, unread_count: rows.filter(r=>!r.is_read).length }));
});

app.put('/notifications/:id/read', auth(), async (req, res) => {
  await pool.query(`UPDATE notifications SET is_read=1, read_at=NOW() WHERE id=? AND recipient_id=?`, [req.params.id, req.user.id]);
  res.json(success({ message: 'Marked as read' }));
});

app.put('/notifications/read-all', auth(), async (req, res) => {
  await pool.query(`UPDATE notifications SET is_read=1, read_at=NOW() WHERE recipient_id=? AND is_read=0`, [req.user.id]);
  res.json(success({ message: 'All notifications marked as read' }));
});

app.post('/notifications/send', auth(['super_admin','admin','principal']), async (req, res) => {
  const { type, recipient_id, message, link } = req.body;
  if (!recipient_id || !message) return res.status(400).json(fail('recipient_id and message required'));
  await pool.query(
    `INSERT INTO notifications (recipient_id, sender_id, type, title, message, link) VALUES (?,?,?,?,?,?)`,
    [recipient_id, req.user.id, type||'general', type||'Notice', message, link||null]
  );
  // Push via Socket.io
  io.to(`user_${recipient_id}`).emit('notification', { type, message, from: req.user.name });
  res.status(201).json(success({ message: 'Notification sent' }));
});

// ══════════════════════════════════════════════════════════════
//  ROUTE: REPORTS
// ══════════════════════════════════════════════════════════════
app.get('/reports/:type', auth(['super_admin','admin','accountant','principal']), async (req, res) => {
  const { type } = req.params;
  const { month, year } = req.query;

  if (type === 'monthly-fee') {
    const [rows] = await pool.query(
      `SELECT c.name AS class_name,
              COUNT(DISTINCT st.id) AS total_students,
              SUM(fp.amount_due) AS demanded,
              SUM(fp.amount_paid) AS collected,
              SUM(fp.amount_due - fp.amount_paid) AS arrears,
              ROUND(SUM(fp.amount_paid)/NULLIF(SUM(fp.amount_due),0)*100,2) AS collection_rate
       FROM fee_payments fp
       JOIN students st ON fp.student_id=st.id
       JOIN classes c ON st.class_id=c.id
       WHERE st.branch_id=? AND DATE_FORMAT(COALESCE(fp.payment_date,fp.due_date),'%Y-%m')=?
       GROUP BY c.name ORDER BY c.display_order`, [req.user.branch_id, month||new Date().toISOString().slice(0,7)]
    );
    return res.json(success({ items: rows, type: 'monthly-fee', month }));
  }

  if (type === 'attendance-summary') {
    const [rows] = await pool.query(
      `SELECT DATE(sa.date) AS date,
              SUM(sa.status='present') AS present,
              SUM(sa.status='absent') AS absent,
              SUM(sa.status='late') AS late,
              COUNT(*) AS total
       FROM student_attendance sa
       JOIN students st ON sa.student_id=st.id
       WHERE st.branch_id=? AND YEAR(sa.date)=?
       GROUP BY DATE(sa.date) ORDER BY date DESC LIMIT 30`,
      [req.user.branch_id, year||new Date().getFullYear()]
    );
    return res.json(success({ items: rows, type: 'attendance-summary' }));
  }

  res.status(404).json(fail(`Report type '${type}' not found`));
});

// ══════════════════════════════════════════════════════════════
//  WHATSAPP HELPER (Twilio)
// ══════════════════════════════════════════════════════════════
async function sendWhatsApp(phone, message) {
  const sid   = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  if (!sid) return;
  const axios = require('axios');
  return axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    new URLSearchParams({ From: from, To: `whatsapp:+92${phone}`, Body: message }),
    { auth: { username: sid, password: token } }
  );
}

// ══════════════════════════════════════════════════════════════
//  SOCKET.IO — Real-time events
// ══════════════════════════════════════════════════════════════
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  console.log(`🔌 WS Connected: ${socket.user?.name} [${socket.user?.role}]`);
  // Join user's personal room
  socket.join(`user_${socket.user.id}`);
  // Join role room
  socket.join(`role_${socket.user.role}`);

  // Admin joins admin dashboard room
  if (['admin','super_admin','principal'].includes(socket.user.role)) {
    socket.join('admin_dashboard');
  }

  socket.on('join_class', (classId) => socket.join(`class_${classId}`));
  socket.on('disconnect', () => console.log(`🔌 WS Disconnected: ${socket.user?.name}`));
});

// ══════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json(fail(process.env.APP_ENV === 'production' ? 'Internal server error' : err.message, 500));
});

app.use((req, res) => res.status(404).json(fail(`Route not found: ${req.method} ${req.path}`, 404)));

// ══════════════════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════════════════
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   🏫 AL Qalam International EMS — Node.js API   ║
║   http://localhost:${PORT}                          ║
║   Env: ${process.env.APP_ENV || 'development'}                         ║
║   DB: ${process.env.DB_DATABASE || 'alqalam_db'}                      ║
╚══════════════════════════════════════════════════╝
  `);
});
