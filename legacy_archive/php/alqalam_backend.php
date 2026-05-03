<?php
/**
 * ═══════════════════════════════════════════════════════════════
 *  AL QALAM INTERNATIONAL — Complete REST API Backend v2.0
 *  Works for: Web EMS + Android/iOS Mobile Apps
 *  Base URL: http://localhost/alqalam/alqalam_backend.php
 * ═══════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/alqalam_fcm.php';   // Push Notification Service

// ── CORS — allow Web + Mobile apps ──────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-App-Version, X-Device-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── Router ───────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts  = explode('/', str_replace('alqalam_backend.php/', '', $uri));
$route  = $parts[0] ?? '';
$sub    = $parts[1] ?? '';
$id     = $parts[2] ?? null;

// ── Input ────────────────────────────────────────────────────
$body  = json_decode(file_get_contents('php://input'), true) ?? [];
$query = $_GET;

// ── Rate Limiting (simple, file-based) ──────────────────────
function checkRateLimit(string $ip, int $max = 100, int $window = 60): void {
    $file = sys_get_temp_dir() . '/aq_rl_' . md5($ip);
    $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['count' => 0, 'start' => time()];
    if (time() - $data['start'] > $window) { $data = ['count' => 0, 'start' => time()]; }
    $data['count']++;
    file_put_contents($file, json_encode($data));
    if ($data['count'] > $max) apiError('Rate limit exceeded. Try again in a minute.', 429);
}
checkRateLimit($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');

// ── Helpers ──────────────────────────────────────────────────
function success($data, $meta = [], int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success'   => true,
        'data'      => $data,
        'meta'      => $meta,
        'timestamp' => date('c'),
        'version'   => '2.0',
    ]);
    exit;
}

function paginate(array $items, int $page = 1, int $per = 20): array {
    $total = count($items);
    $pages = max(1, ceil($total / $per));
    $offset = ($page - 1) * $per;
    return [
        'items' => array_slice($items, $offset, $per),
        'pagination' => [
            'total'       => $total,
            'per_page'    => $per,
            'current_page'=> $page,
            'total_pages' => $pages,
            'has_next'    => $page < $pages,
            'has_prev'    => $page > 1,
        ],
    ];
}

function getPage(): int { return max(1, (int)($_GET['page'] ?? 1)); }
function getPer(): int  { return min(100, max(5, (int)($_GET['per'] ?? 20))); }

// ═══════════════════════════════════════════════════════════════
//  AUTH MODULE
// ═══════════════════════════════════════════════════════════════
function handleAuth(string $sub, string $method, array $body): void {
    $db = Config::db();

    // POST /auth/login
    if ($sub === 'login' && $method === 'POST') {
        $username = trim($body['username'] ?? '');
        $password  = $body['password'] ?? '';
        if (!$username || !$password) apiError('Username and password required', 422);

        $stmt = $db->prepare('SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            // Log failed attempt
            $db->prepare('INSERT INTO login_logs (username, ip, status, created_at) VALUES (?,?,?,NOW())')
               ->execute([$username, $_SERVER['REMOTE_ADDR'] ?? '', 'failed']);
            apiError('Invalid credentials', 401);
        }

        $token = Config::jwtEncode([
            'uid'      => $user['id'],
            'username' => $user['username'],
            'role'     => $user['role'],
            'name'     => $user['name'],
        ]);

        $refresh = bin2hex(random_bytes(32));
        $db->prepare('UPDATE users SET last_login = NOW(), refresh_token = ? WHERE id = ?')
           ->execute([$refresh, $user['id']]);
        $db->prepare('INSERT INTO login_logs (username, ip, status, created_at) VALUES (?,?,?,NOW())')
           ->execute([$username, $_SERVER['REMOTE_ADDR'] ?? '', 'success']);

        success([
            'token'         => $token,
            'refresh_token' => $refresh,
            'expires_in'    => (int)Config::get('JWT_EXPIRY', 86400),
            'user' => [
                'id'       => $user['id'],
                'name'     => $user['name'],
                'username' => $user['username'],
                'email'    => $user['email'] ?? '',
                'role'     => $user['role'],
                'avatar'   => $user['avatar'] ?? null,
                'phone'    => $user['phone'] ?? '',
            ],
            'permissions' => getRolePermissions($user['role']),
        ]);
    }

    // POST /auth/refresh
    if ($sub === 'refresh' && $method === 'POST') {
        $rt = $body['refresh_token'] ?? '';
        if (!$rt) apiError('Refresh token required', 422);
        $stmt = $db->prepare('SELECT * FROM users WHERE refresh_token = ? AND is_active = 1');
        $stmt->execute([$rt]);
        $user = $stmt->fetch();
        if (!$user) apiError('Invalid refresh token', 401);
        $token = Config::jwtEncode(['uid'=>$user['id'],'username'=>$user['username'],'role'=>$user['role'],'name'=>$user['name']]);
        success(['token' => $token, 'expires_in' => (int)Config::get('JWT_EXPIRY', 86400)]);
    }

    // POST /auth/logout
    if ($sub === 'logout' && $method === 'POST') {
        $user = requireAuth();
        $db->prepare('UPDATE users SET refresh_token = NULL WHERE id = ?')->execute([$user['uid']]);
        success(['message' => 'Logged out successfully']);
    }

    // POST /auth/change-password
    if ($sub === 'change-password' && $method === 'POST') {
        $user  = requireAuth();
        $old   = $body['old_password'] ?? '';
        $new   = $body['new_password'] ?? '';
        if (!$old || !$new) apiError('Both old and new passwords required', 422);
        if (strlen($new) < 8) apiError('Password must be at least 8 characters', 422);
        $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
        $stmt->execute([$user['uid']]);
        $row = $stmt->fetch();
        if (!password_verify($old, $row['password'])) apiError('Old password incorrect', 401);
        $db->prepare('UPDATE users SET password = ? WHERE id = ?')
           ->execute([password_hash($new, PASSWORD_BCRYPT), $user['uid']]);
        success(['message' => 'Password changed successfully']);
    }

    // GET /auth/me
    if ($sub === 'me' && $method === 'GET') {
        $user = requireAuth();
        $stmt = $db->prepare('SELECT id,name,username,email,role,phone,avatar,last_login,created_at FROM users WHERE id = ?');
        $stmt->execute([$user['uid']]);
        $data = $stmt->fetch();
        $data['permissions'] = getRolePermissions($data['role']);
        success($data);
    }

    apiError("Auth endpoint '$sub' not found", 404);
}

function getRolePermissions(string $role): array {
    $matrix = [
        'super_admin'       => ['*'],
        'admin'             => ['dashboard','students','teachers','attendance','results','fee','staff_attendance','inventory','admissions','timetable','transport','library','examination','cms','reports','settings'],
        'principal'         => ['dashboard','students','teachers','attendance','results','staff_attendance','admissions','timetable','examination','cms','reports'],
        'accountant'        => ['dashboard','fee','reports'],
        'hr_manager'        => ['dashboard','teachers','staff_attendance','reports'],
        'store_keeper'      => ['inventory'],
        'librarian'         => ['library'],
        'transport_manager' => ['transport'],
        'exam_controller'   => ['dashboard','examination','results','timetable','reports'],
        'receptionist'      => ['dashboard','admissions','students','cms'],
        'teacher'           => ['teacher_dashboard','student_attendance','results','lesson_plans','self_attendance','leave'],
        'student'           => ['student_dashboard','my_results','my_fee','my_attendance'],
        'parent'            => ['parent_dashboard','child_fee','child_attendance','child_results'],
    ];
    return $matrix[$role] ?? [];
}

// ═══════════════════════════════════════════════════════════════
//  STUDENTS MODULE
// ═══════════════════════════════════════════════════════════════
function handleStudents(string $sub, string $method, ?string $id, array $body, array $query): void {
    requireAuth(['super_admin','admin','principal','accountant','receptionist','teacher']);
    $db = Config::db();

    if ($method === 'GET' && !$id) {
        $where = ['1=1']; $params = [];
        if ($q = $query['q'] ?? '') { $where[] = '(s.name LIKE ? OR s.gr_no LIKE ? OR s.father_name LIKE ?)'; $params = array_merge($params, ["%$q%","%$q%","%$q%"]); }
        if ($cls = $query['class'] ?? '') { $where[] = 's.class = ?'; $params[] = $cls; }
        if ($sec = $query['section'] ?? '') { $where[] = 's.section = ?'; $params[] = $sec; }
        if ($status = $query['status'] ?? '') { $where[] = 's.status = ?'; $params[] = $status; }
        if ($sess = $query['session'] ?? '') { $where[] = 's.session = ?'; $params[] = $sess; }

        $sql = 'SELECT s.*, f.status as fee_status, 
                ROUND(AVG(CASE a.status WHEN "present" THEN 100 WHEN "late" THEN 50 ELSE 0 END),1) as attendance_pct
                FROM students s
                LEFT JOIN fee_challans f ON f.student_id = s.id AND f.month = DATE_FORMAT(NOW(),"%%Y-%%m")
                LEFT JOIN student_attendance a ON a.student_id = s.id AND a.date >= DATE_SUB(NOW(),INTERVAL 30 DAY)
                WHERE ' . implode(' AND ', $where) . ' GROUP BY s.id ORDER BY s.name';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $all = $stmt->fetchAll();

        $paged = paginate($all, getPage(), getPer());
        success($paged['items'], $paged['pagination']);
    }

    if ($method === 'GET' && $id) {
        $stmt = $db->prepare('SELECT s.*, 
            (SELECT COUNT(*) FROM fee_challans WHERE student_id=s.id AND status="paid") as paid_months,
            (SELECT COUNT(*) FROM fee_challans WHERE student_id=s.id AND status="overdue") as overdue_months,
            (SELECT SUM(amount) FROM fee_challans WHERE student_id=s.id AND status="overdue") as overdue_amount
            FROM students s WHERE s.id = ? OR s.gr_no = ?');
        $stmt->execute([$id, $id]);
        $student = $stmt->fetch();
        if (!$student) apiError('Student not found', 404);

        // Get fee history
        $fstmt = $db->prepare('SELECT * FROM fee_challans WHERE student_id = ? ORDER BY created_at DESC LIMIT 12');
        $fstmt->execute([$student['id']]);
        $student['fee_history'] = $fstmt->fetchAll();

        // Get attendance summary
        $astmt = $db->prepare('SELECT status, COUNT(*) as count FROM student_attendance WHERE student_id = ? AND date >= DATE_SUB(NOW(),INTERVAL 30 DAY) GROUP BY status');
        $astmt->execute([$student['id']]);
        $student['attendance_summary'] = $astmt->fetchAll();

        success($student);
    }

    if ($method === 'POST') {
        requireAuth(['super_admin','admin','principal','receptionist']);
        $required = ['name','father_name','class','section','dob','gender','phone'];
        foreach ($required as $f) { if (empty($body[$f])) apiError("Field '$f' is required", 422); }

        $grNo = 'AQ-' . date('Y') . '-' . str_pad(rand(1000,9999), 4, '0', STR_PAD_LEFT);
        $stmt = $db->prepare('INSERT INTO students (gr_no,name,father_name,mother_name,class,section,dob,gender,phone,whatsapp,email,address,blood_group,religion,session,status,created_at)
                              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())');
        $stmt->execute([
            $grNo, $body['name'], $body['father_name'], $body['mother_name'] ?? '',
            $body['class'], $body['section'], $body['dob'], $body['gender'],
            $body['phone'], $body['whatsapp'] ?? $body['phone'], $body['email'] ?? '',
            $body['address'] ?? '', $body['blood_group'] ?? '', $body['religion'] ?? 'Islam',
            $body['session'] ?? date('Y') . '-' . (date('Y')+1), 'active',
        ]);
        $newId = $db->lastInsertId();
        success(['id' => $newId, 'gr_no' => $grNo, 'message' => 'Student admitted successfully'], [], 201);
    }

    if ($method === 'PUT' && $id) {
        requireAuth(['super_admin','admin','principal']);
        $allowed = ['name','father_name','mother_name','class','section','phone','whatsapp','email','address','blood_group','status'];
        $sets = []; $params = [];
        foreach ($allowed as $f) { if (isset($body[$f])) { $sets[] = "$f = ?"; $params[] = $body[$f]; } }
        if (!$sets) apiError('Nothing to update', 422);
        $params[] = $id;
        $db->prepare('UPDATE students SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = ? OR gr_no = ?')
           ->execute(array_merge($params, [$id]));
        success(['message' => 'Student updated']);
    }

    if ($method === 'DELETE' && $id) {
        requireAuth(['super_admin','admin']);
        $db->prepare('UPDATE students SET status = "withdrawn", updated_at = NOW() WHERE id = ? OR gr_no = ?')
           ->execute([$id, $id]);
        success(['message' => 'Student withdrawn']);
    }

    apiError('Students endpoint not found', 404);
}

// ═══════════════════════════════════════════════════════════════
//  FEE MODULE
// ═══════════════════════════════════════════════════════════════
function handleFee(string $sub, string $method, ?string $id, array $body, array $query): void {
    $user = requireAuth(['super_admin','admin','accountant','principal']);
    $db = Config::db();

    // GET /fee/dashboard
    if ($sub === 'dashboard' && $method === 'GET') {
        $month = $query['month'] ?? date('Y-m');
        $stmt = $db->prepare("SELECT 
            SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) as collected,
            SUM(CASE WHEN status='overdue' THEN amount ELSE 0 END) as overdue,
            SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) as pending,
            COUNT(*) as total_challans,
            COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
            COUNT(CASE WHEN status='overdue' THEN 1 END) as overdue_count
            FROM fee_challans WHERE month = ?");
        $stmt->execute([$month]);
        $summary = $stmt->fetch();

        // Daily collection (last 30 days)
        $dstmt = $db->query("SELECT DATE(paid_at) as date, SUM(amount) as amount FROM fee_payments WHERE paid_at >= DATE_SUB(NOW(),INTERVAL 30 DAY) GROUP BY DATE(paid_at) ORDER BY date");
        $summary['daily_trend'] = $dstmt->fetchAll();

        // Fee heads breakdown
        $hstmt = $db->prepare("SELECT fee_head, SUM(amount) as total FROM fee_challan_items fci JOIN fee_challans fc ON fc.id = fci.challan_id WHERE fc.month = ? AND fc.status = 'paid' GROUP BY fee_head ORDER BY total DESC");
        $hstmt->execute([$month]);
        $summary['fee_heads'] = $hstmt->fetchAll();

        success($summary);
    }

    // GET /fee/challans
    if ($sub === 'challans' && $method === 'GET') {
        $where = ['1=1']; $params = [];
        if ($m = $query['month'] ?? '') { $where[] = 'fc.month = ?'; $params[] = $m; }
        if ($s = $query['status'] ?? '') { $where[] = 'fc.status = ?'; $params[] = $s; }
        if ($cls = $query['class'] ?? '') { $where[] = 's.class = ?'; $params[] = $cls; }
        if ($q = $query['q'] ?? '') { $where[] = '(s.name LIKE ? OR fc.challan_no LIKE ?)'; $params = array_merge($params, ["%$q%","%$q%"]); }

        $stmt = $db->prepare("SELECT fc.*, s.name as student_name, s.gr_no, s.class, s.section, s.phone FROM fee_challans fc JOIN students s ON s.id = fc.student_id WHERE " . implode(' AND ', $where) . " ORDER BY fc.created_at DESC");
        $stmt->execute($params);
        $all = $stmt->fetchAll();
        $paged = paginate($all, getPage(), getPer());
        success($paged['items'], $paged['pagination']);
    }

    // POST /fee/challans/generate
    if ($sub === 'generate' && $method === 'POST') {
        requireAuth(['super_admin','admin','accountant']);
        $month = $body['month'] ?? date('Y-m');
        $class = $body['class'] ?? null;

        $where = $class ? 'class = ?' : '1=1';
        $params = $class ? [$class] : [];
        $students = $db->prepare("SELECT id, class FROM students WHERE status='active' AND $where");
        $students->execute($params);
        $students = $students->fetchAll();

        $generated = 0; $skipped = 0;
        foreach ($students as $s) {
            $exists = $db->prepare('SELECT id FROM fee_challans WHERE student_id = ? AND month = ?');
            $exists->execute([$s['id'], $month]);
            if ($exists->fetch()) { $skipped++; continue; }

            $fee = $db->prepare('SELECT * FROM fee_structure WHERE class = ? LIMIT 1');
            $fee->execute([$s['class']]);
            $feeRow = $fee->fetch();
            if (!$feeRow) continue;

            $challanNo = Config::fee()['challan_prefix'] . '-' . date('Y') . '-' . str_pad(rand(10000,99999),5,'0',STR_PAD_LEFT);
            $dueDate   = date('Y-m-10', strtotime($month . '-01'));
            $db->prepare('INSERT INTO fee_challans (challan_no,student_id,month,amount,due_date,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,NOW())')
               ->execute([$challanNo, $s['id'], $month, $feeRow['total'], $dueDate, 'pending', $user['uid']]);
            $generated++;
        }
        success(['generated' => $generated, 'skipped' => $skipped, 'month' => $month]);
    }

    // POST /fee/collect — record payment
    if ($sub === 'collect' && $method === 'POST') {
        requireAuth(['super_admin','admin','accountant']);
        $challanId = $body['challan_id'] ?? null;
        $amount    = (float)($body['amount'] ?? 0);
        $method_pay= $body['payment_method'] ?? 'cash';
        $remarks   = $body['remarks'] ?? '';
        if (!$challanId || $amount <= 0) apiError('Challan ID and amount required', 422);

        $ch = $db->prepare('SELECT fc.*, s.name, s.class FROM fee_challans fc JOIN students s ON s.id=fc.student_id WHERE fc.id = ?');
        $ch->execute([$challanId]);
        $challan = $ch->fetch();
        if (!$challan) apiError('Challan not found', 404);

        $receiptNo = Config::fee()['receipt_prefix'] . '-' . date('Y') . '-' . str_pad($db->query('SELECT COUNT(*)+1 FROM fee_payments')->fetchColumn(), 5, '0', STR_PAD_LEFT);
        $db->prepare('INSERT INTO fee_payments (challan_id,receipt_no,amount,payment_method,paid_at,received_by,remarks) VALUES (?,?,?,?,NOW(),?,?)')
           ->execute([$challanId, $receiptNo, $amount, $method_pay, $user['uid'], $remarks]);

        $status = $amount >= $challan['amount'] ? 'paid' : 'partial';
        $db->prepare('UPDATE fee_challans SET status = ?, paid_at = NOW(), updated_at = NOW() WHERE id = ?')
           ->execute([$status, $challanId]);

        // WhatsApp notification
        if ($challan['phone'] ?? false) {
            $msg = "✅ *Fee Received — AL Qalam International*\nStudent: {$challan['name']}\nClass: {$challan['class']}\nReceipt: {$receiptNo}\nAmount: Rs." . number_format($amount) . "\nDate: " . date('d-M-Y') . "\nThank you!";
            Config::sendWhatsApp($challan['phone'], $msg);
        }

        success(['receipt_no' => $receiptNo, 'status' => $status, 'message' => 'Payment recorded']);
    }

    // GET /fee/defaulters
    if ($sub === 'defaulters' && $method === 'GET') {
        $grace = Config::fee()['grace_days'];
        $stmt  = $db->query("SELECT fc.*, s.name, s.gr_no, s.class, s.section, s.phone,
            DATEDIFF(NOW(), fc.due_date) as days_overdue,
            DATEDIFF(NOW(), fc.due_date) * " . Config::fee()['late_per_day'] . " as late_fee
            FROM fee_challans fc JOIN students s ON s.id = fc.student_id
            WHERE fc.status IN ('pending','overdue') AND DATEDIFF(NOW(), fc.due_date) > $grace
            ORDER BY days_overdue DESC");
        success($stmt->fetchAll());
    }

    // GET /fee/arrears/:studentId
    if ($sub === 'arrears' && $method === 'GET' && $id) {
        $stmt = $db->prepare("SELECT fc.*, s.name FROM fee_challans fc JOIN students s ON s.id=fc.student_id WHERE fc.student_id = ? AND fc.status IN ('overdue','partial') ORDER BY fc.month");
        $stmt->execute([$id]);
        $arrears = $stmt->fetchAll();
        $total = array_sum(array_column($arrears, 'amount'));
        success(['arrears' => $arrears, 'total_due' => $total]);
    }

    // GET /fee/reports/monthly
    if ($sub === 'report' && $method === 'GET') {
        $type  = $query['type'] ?? 'monthly';
        $month = $query['month'] ?? date('Y-m');
        $data  = [];
        if ($type === 'monthly') {
            $stmt = $db->prepare("SELECT s.class, COUNT(*) as students, SUM(fc.amount) as expected, SUM(CASE WHEN fc.status='paid' THEN fc.amount ELSE 0 END) as collected, SUM(CASE WHEN fc.status IN ('overdue','pending') THEN fc.amount ELSE 0 END) as pending FROM fee_challans fc JOIN students s ON s.id=fc.student_id WHERE fc.month = ? GROUP BY s.class ORDER BY s.class");
            $stmt->execute([$month]);
            $data = $stmt->fetchAll();
        } elseif ($type === 'closing') {
            $stmt = $db->prepare("SELECT DATE(paid_at) as date, payment_method, COUNT(*) as transactions, SUM(amount) as total FROM fee_payments WHERE DATE(paid_at) = CURDATE() GROUP BY DATE(paid_at), payment_method");
            $stmt->execute();
            $data = $stmt->fetchAll();
        }
        success($data);
    }

    apiError("Fee endpoint '$sub' not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  ATTENDANCE MODULE
// ═══════════════════════════════════════════════════════════════
function handleAttendance(string $sub, string $method, ?string $id, array $body): void {
    $user = requireAuth();
    $db   = Config::db();

    // POST /attendance/student — mark student attendance
    if ($sub === 'student' && $method === 'POST') {
        requireAuth(['super_admin','admin','teacher','principal']);
        $date  = $body['date'] ?? date('Y-m-d');
        $class = $body['class'] ?? '';
        $records = $body['records'] ?? []; // [{student_id, status}]
        if (!$records) apiError('Attendance records required', 422);

        $stmt = $db->prepare('INSERT INTO student_attendance (student_id, date, class, status, marked_by, created_at) VALUES (?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)');
        foreach ($records as $r) {
            $stmt->execute([$r['student_id'], $date, $class, $r['status'], $user['uid']]);
        }
        success(['marked' => count($records), 'date' => $date]);
    }

    // GET /attendance/student
    if ($sub === 'student' && $method === 'GET') {
        $date  = $id ?? date('Y-m-d');
        $class = $_GET['class'] ?? '';
        $where = ['a.date = ?']; $params = [$date];
        if ($class) { $where[] = 'a.class = ?'; $params[] = $class; }
        $stmt = $db->prepare('SELECT a.*, s.name, s.gr_no, s.phone FROM student_attendance a JOIN students s ON s.id=a.student_id WHERE ' . implode(' AND ', $where));
        $stmt->execute($params);
        success($stmt->fetchAll());
    }

    // POST /attendance/staff — mark staff check-in/out
    if ($sub === 'staff' && $method === 'POST') {
        $action = $body['action'] ?? 'checkin'; // checkin | checkout | manual
        $date   = date('Y-m-d');
        $now    = date('H:i:s');
        $staffId = $body['staff_id'] ?? $user['uid'];

        if ($action === 'checkin') {
            $exists = $db->prepare('SELECT id FROM staff_attendance WHERE staff_id=? AND date=?');
            $exists->execute([$staffId, $date]);
            if ($exists->fetch()) apiError('Already checked in today', 409);

            $lateTime = Config::get('ATTENDANCE_LATE_TIME', '08:30:00');
            $status   = $now > $lateTime ? 'late' : 'present';
            $db->prepare('INSERT INTO staff_attendance (staff_id, date, check_in, status, created_at) VALUES (?,?,?,?,NOW())')
               ->execute([$staffId, $date, $now, $status]);
            success(['status' => $status, 'check_in' => $now, 'message' => $status === 'late' ? 'Marked as Late' : 'Checked In']);
        }

        if ($action === 'checkout') {
            $row = $db->prepare('SELECT id, check_in FROM staff_attendance WHERE staff_id=? AND date=?');
            $row->execute([$staffId, $date]);
            $att = $row->fetch();
            if (!$att) apiError('No check-in found for today', 404);
            $db->prepare('UPDATE staff_attendance SET check_out=?, updated_at=NOW() WHERE id=?')
               ->execute([$now, $att['id']]);
            success(['check_out' => $now, 'check_in' => $att['check_in']]);
        }

        if ($action === 'manual' && in_array($user['role'], ['super_admin','admin','hr_manager'])) {
            $db->prepare('INSERT INTO staff_attendance (staff_id, date, check_in, check_out, status, notes, created_at) VALUES (?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE status=VALUES(status), notes=VALUES(notes)')
               ->execute([$staffId, $body['date'] ?? $date, $body['check_in'] ?? null, $body['check_out'] ?? null, $body['status'] ?? 'present', $body['notes'] ?? '']);
            success(['message' => 'Manual attendance marked']);
        }
    }

    // GET /attendance/staff
    if ($sub === 'staff' && $method === 'GET') {
        requireAuth(['super_admin','admin','principal','hr_manager']);
        $date = $id ?? date('Y-m-d');
        $stmt = $db->prepare('SELECT sa.*, u.name, u.role, u.phone FROM staff_attendance sa JOIN users u ON u.id=sa.staff_id WHERE sa.date = ? ORDER BY u.name');
        $stmt->execute([$date]);
        success($stmt->fetchAll());
    }

    // GET /attendance/staff/monthly
    if ($sub === 'staff-monthly' && $method === 'GET') {
        requireAuth(['super_admin','admin','principal','hr_manager']);
        $month  = $_GET['month'] ?? date('Y-m');
        $stmt   = $db->prepare("SELECT u.id, u.name, u.role, COUNT(CASE WHEN sa.status='present' THEN 1 END) as present, COUNT(CASE WHEN sa.status='late' THEN 1 END) as late, COUNT(CASE WHEN sa.status='absent' THEN 1 END) as absent, COUNT(CASE WHEN sa.status='leave' THEN 1 END) as on_leave FROM users u LEFT JOIN staff_attendance sa ON sa.staff_id=u.id AND DATE_FORMAT(sa.date,'%Y-%m')=? WHERE u.role NOT IN ('student','parent') GROUP BY u.id ORDER BY u.name");
        $stmt->execute([$month]);
        success($stmt->fetchAll());
    }

    apiError("Attendance endpoint '$sub' not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  STAFF / HR MODULE
// ═══════════════════════════════════════════════════════════════
function handleStaff(string $sub, string $method, ?string $id, array $body): void {
    requireAuth(['super_admin','admin','principal','hr_manager']);
    $db = Config::db();

    if ($method === 'GET' && !$id) {
        $where = ["role NOT IN ('student','parent')"]; $params = [];
        if ($q = $_GET['q'] ?? '') { $where[] = '(name LIKE ? OR username LIKE ?)'; $params = ["%$q%","%$q%"]; }
        if ($role = $_GET['role'] ?? '') { $where[] = 'role = ?'; $params[] = $role; }
        $stmt = $db->prepare('SELECT id,name,username,email,role,phone,status,last_login,created_at FROM users WHERE ' . implode(' AND ', $where) . ' ORDER BY name');
        $stmt->execute($params);
        $all   = $stmt->fetchAll();
        $paged = paginate($all, getPage(), getPer());
        success($paged['items'], $paged['pagination']);
    }

    if ($method === 'POST') {
        requireAuth(['super_admin','admin']);
        if (empty($body['name']) || empty($body['username']) || empty($body['password']) || empty($body['role'])) apiError('name, username, password, role required', 422);
        if ($db->prepare('SELECT id FROM users WHERE username=?')->execute([$body['username']]) && $db->query('SELECT FOUND_ROWS()')->fetchColumn()) apiError('Username taken', 409);
        $db->prepare('INSERT INTO users (name,username,email,password,role,phone,status,created_at) VALUES (?,?,?,?,?,?,?,NOW())')
           ->execute([$body['name'], $body['username'], $body['email'] ?? '', password_hash($body['password'], PASSWORD_BCRYPT), $body['role'], $body['phone'] ?? '', 'active']);
        success(['id' => $db->lastInsertId(), 'message' => 'Staff member created'], [], 201);
    }

    if ($method === 'PUT' && $id) {
        requireAuth(['super_admin','admin']);
        $sets = []; $params = [];
        $allowed = ['name','email','phone','role','status'];
        foreach ($allowed as $f) { if (isset($body[$f])) { $sets[] = "$f=?"; $params[] = $body[$f]; } }
        if (isset($body['password'])) { $sets[] = 'password=?'; $params[] = password_hash($body['password'], PASSWORD_BCRYPT); }
        if (!$sets) apiError('Nothing to update', 422);
        $params[] = $id;
        $db->prepare('UPDATE users SET ' . implode(',', $sets) . ', updated_at=NOW() WHERE id=?')->execute($params);
        success(['message' => 'Staff updated']);
    }

    apiError("Staff endpoint '$sub' not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  SALARY MODULE
// ═══════════════════════════════════════════════════════════════
function handleSalary(string $sub, string $method, ?string $id, array $body): void {
    requireAuth(['super_admin','admin','hr_manager','accountant']);
    $db = Config::db();

    if ($method === 'GET') {
        $month = $_GET['month'] ?? date('Y-m');
        $stmt  = $db->prepare("SELECT ss.*, u.name, u.role, u.phone FROM salary_sheets ss JOIN users u ON u.id=ss.staff_id WHERE ss.month=? ORDER BY u.name");
        $stmt->execute([$month]);
        $data  = $stmt->fetchAll();
        $total = array_sum(array_column($data, 'net_salary'));
        success($data, ['month' => $month, 'total_payroll' => $total]);
    }

    if ($method === 'POST' && $sub === 'generate') {
        $month = $body['month'] ?? date('Y-m');
        $staff = $db->query("SELECT * FROM staff_profiles sp JOIN users u ON u.id=sp.user_id WHERE u.status='active'")->fetchAll();
        $generated = 0;
        foreach ($staff as $s) {
            $exists = $db->prepare('SELECT id FROM salary_sheets WHERE staff_id=? AND month=?');
            $exists->execute([$s['user_id'], $month]);
            if ($exists->fetch()) continue;
            $db->prepare('INSERT INTO salary_sheets (staff_id, month, basic, allowances, deductions, net_salary, status, created_at) VALUES (?,?,?,?,?,?,?,NOW())')
               ->execute([$s['user_id'], $month, $s['basic_salary'], $s['allowances'], $s['deductions'], $s['basic_salary'] + $s['allowances'] - $s['deductions'], 'pending']);
            $generated++;
        }
        success(['generated' => $generated, 'month' => $month]);
    }

    if ($method === 'PUT' && $id) {
        $db->prepare('UPDATE salary_sheets SET status=?, paid_at=NOW(), updated_at=NOW() WHERE id=?')
           ->execute([$body['status'] ?? 'paid', $id]);
        success(['message' => 'Salary status updated']);
    }

    apiError("Salary endpoint not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  LIBRARY MODULE
// ═══════════════════════════════════════════════════════════════
function handleLibrary(string $sub, string $method, ?string $id, array $body): void {
    requireAuth(['super_admin','admin','librarian','principal']);
    $db = Config::db();

    if ($sub === 'books' || !$sub) {
        if ($method === 'GET') {
            $q    = $_GET['q'] ?? '';
            $cat  = $_GET['category'] ?? '';
            $where = ['1=1']; $params = [];
            if ($q)   { $where[] = '(title LIKE ? OR author LIKE ? OR isbn LIKE ?)'; $params = array_merge($params,["%$q%","%$q%","%$q%"]); }
            if ($cat) { $where[] = 'category = ?'; $params[] = $cat; }
            $stmt = $db->prepare('SELECT * FROM library_books WHERE ' . implode(' AND ', $where) . ' ORDER BY title');
            $stmt->execute($params);
            $all = $stmt->fetchAll();
            $paged = paginate($all, getPage(), getPer());
            success($paged['items'], $paged['pagination']);
        }
        if ($method === 'POST') {
            $db->prepare('INSERT INTO library_books (isbn,title,author,publisher,category,total_copies,available_copies,price,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())')
               ->execute([$body['isbn']??'', $body['title'], $body['author']??'', $body['publisher']??'', $body['category']??'', $body['copies']??1, $body['copies']??1, $body['price']??0]);
            success(['id'=>$db->lastInsertId(),'message'=>'Book added'],[], 201);
        }
    }

    if ($sub === 'issue' && $method === 'POST') {
        $bookId  = $body['book_id'];
        $issueTo = $body['issued_to']; // student_id or staff_id
        $type    = $body['type'] ?? 'student';
        $returnBy = $body['return_by'] ?? date('Y-m-d', strtotime('+14 days'));

        $book = $db->prepare('SELECT * FROM library_books WHERE id=?');
        $book->execute([$bookId]);
        $book = $book->fetch();
        if (!$book) apiError('Book not found', 404);
        if ($book['available_copies'] <= 0) apiError('No copies available', 409);

        $db->prepare('INSERT INTO library_issues (book_id,issued_to,issue_type,issue_date,return_by,status,created_at) VALUES (?,?,?,CURDATE(),?,?,NOW())')
           ->execute([$bookId, $issueTo, $type, $returnBy, 'issued']);
        $db->prepare('UPDATE library_books SET available_copies=available_copies-1 WHERE id=?')->execute([$bookId]);
        success(['message' => 'Book issued', 'return_by' => $returnBy]);
    }

    if ($sub === 'return' && $method === 'POST') {
        $issueId = $body['issue_id'];
        $db->prepare('UPDATE library_issues SET status="returned", returned_at=NOW() WHERE id=?')->execute([$issueId]);
        $bookId = $db->prepare('SELECT book_id FROM library_issues WHERE id=?');
        $bookId->execute([$issueId]);
        $db->prepare('UPDATE library_books SET available_copies=available_copies+1 WHERE id=?')->execute([$bookId->fetchColumn()]);
        success(['message' => 'Book returned']);
    }

    if ($sub === 'overdue' && $method === 'GET') {
        $stmt = $db->query("SELECT li.*, lb.title, lb.author FROM library_issues li JOIN library_books lb ON lb.id=li.book_id WHERE li.status='issued' AND li.return_by < CURDATE() ORDER BY li.return_by");
        success($stmt->fetchAll());
    }

    apiError("Library endpoint '$sub' not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  TRANSPORT MODULE
// ═══════════════════════════════════════════════════════════════
function handleTransport(string $sub, string $method, ?string $id, array $body): void {
    requireAuth(['super_admin','admin','transport_manager','principal']);
    $db = Config::db();

    if ($sub === 'routes' && $method === 'GET') {
        $stmt = $db->query('SELECT r.*, COUNT(ts.id) as student_count FROM transport_routes r LEFT JOIN transport_students ts ON ts.route_id=r.id GROUP BY r.id ORDER BY r.name');
        success($stmt->fetchAll());
    }
    if ($sub === 'routes' && $method === 'POST') {
        $db->prepare('INSERT INTO transport_routes (name, vehicle_no, driver_name, driver_phone, monthly_fee, status, created_at) VALUES (?,?,?,?,?,?,NOW())')
           ->execute([$body['name'], $body['vehicle_no']??'', $body['driver_name']??'', $body['driver_phone']??'', $body['monthly_fee']??0, 'active']);
        success(['id'=>$db->lastInsertId(),'message'=>'Route added'], [], 201);
    }
    if ($sub === 'students' && $method === 'GET') {
        $stmt = $db->query('SELECT ts.*, s.name, s.class, s.section, s.phone, tr.name as route_name FROM transport_students ts JOIN students s ON s.id=ts.student_id JOIN transport_routes tr ON tr.id=ts.route_id ORDER BY s.name');
        $all = $stmt->fetchAll();
        $paged = paginate($all, getPage(), getPer());
        success($paged['items'], $paged['pagination']);
    }

    apiError("Transport endpoint '$sub' not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  EXAMINATION MODULE
// ═══════════════════════════════════════════════════════════════
function handleExamination(string $sub, string $method, ?string $id, array $body): void {
    requireAuth(['super_admin','admin','principal','exam_controller','teacher']);
    $db = Config::db();

    if ($sub === 'schedule' && $method === 'GET') {
        $type  = $_GET['type'] ?? '';
        $where = $type ? 'WHERE exam_type=?' : 'WHERE 1=1';
        $stmt  = $db->prepare("SELECT * FROM exam_schedule $where ORDER BY exam_date");
        $stmt->execute($type ? [$type] : []);
        success($stmt->fetchAll());
    }
    if ($sub === 'schedule' && $method === 'POST') {
        $db->prepare('INSERT INTO exam_schedule (exam_type,class,section,subject,exam_date,start_time,venue,total_marks,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())')
           ->execute([$body['exam_type'], $body['class'], $body['section']??'', $body['subject'], $body['exam_date'], $body['start_time']??'09:00', $body['venue']??'', $body['total_marks']??100]);
        success(['id'=>$db->lastInsertId()], [], 201);
    }
    if ($sub === 'results' && $method === 'POST') {
        requireAuth(['super_admin','admin','teacher','exam_controller']);
        $records = $body['results'] ?? [];
        $stmt    = $db->prepare('INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks, entered_by, created_at) VALUES (?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), grade=VALUES(grade)');
        foreach ($records as $r) {
            $grade = getGrade((float)$r['marks'], (float)($r['total']??100));
            $stmt->execute([$r['exam_id'], $r['student_id'], $r['marks'], $grade, $r['remarks']??'', requireAuth()['uid']]);
        }
        success(['saved' => count($records)]);
    }
    if ($sub === 'results' && $method === 'GET') {
        $studentId = $_GET['student_id'] ?? null;
        $examId    = $_GET['exam_id'] ?? null;
        if ($studentId) {
            $stmt = $db->prepare('SELECT er.*, es.subject, es.exam_type, es.exam_date, es.total_marks, s.name FROM exam_results er JOIN exam_schedule es ON es.id=er.exam_id JOIN students s ON s.id=er.student_id WHERE er.student_id=? ORDER BY es.exam_date DESC');
            $stmt->execute([$studentId]);
        } else {
            $stmt = $db->prepare('SELECT er.*, s.name, s.gr_no FROM exam_results er JOIN students s ON s.id=er.student_id WHERE er.exam_id=? ORDER BY er.marks_obtained DESC');
            $stmt->execute([$examId]);
        }
        success($stmt->fetchAll());
    }

    apiError("Examination endpoint '$sub' not found", 404);
}

function getGrade(float $marks, float $total): string {
    $pct = ($marks / $total) * 100;
    return match(true) {
        $pct >= 90 => 'A+', $pct >= 80 => 'A', $pct >= 70 => 'B',
        $pct >= 60 => 'C', $pct >= 50 => 'D', default => 'F',
    };
}

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATIONS MODULE
// ═══════════════════════════════════════════════════════════════
function handleNotifications(string $sub, string $method, ?string $id, array $body): void {
    $user = requireAuth();
    $db   = Config::db();

    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT * FROM notifications WHERE (target_role=? OR target_role='all') AND (target_user_id IS NULL OR target_user_id=?) ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$user['role'], $user['uid']]);
        $notifs = $stmt->fetchAll();
        $unread = count(array_filter($notifs, fn($n) => !$n['is_read']));
        success($notifs, ['unread' => $unread]);
    }

    if ($method === 'POST' && $sub === 'send') {
        requireAuth(['super_admin','admin','principal']);
        $db->prepare('INSERT INTO notifications (title, message, type, target_role, target_user_id, created_by, created_at) VALUES (?,?,?,?,?,?,NOW())')
           ->execute([$body['title'], $body['message'], $body['type']??'info', $body['target_role']??'all', $body['target_user_id']??null, $user['uid']]);

        // WhatsApp blast if requested
        if ($body['send_whatsapp'] ?? false) {
            $phones = $db->prepare("SELECT phone FROM users WHERE role=? AND status='active'");
            $phones->execute([$body['target_role']]);
            foreach ($phones->fetchAll() as $p) {
                if ($p['phone']) Config::sendWhatsApp($p['phone'], "*{$body['title']}*\n{$body['message']}");
            }
        }
        success(['message' => 'Notification sent'], [], 201);
    }

    if ($method === 'PUT' && $id === 'read-all') {
        $db->prepare("UPDATE notifications SET is_read=1 WHERE (target_role=? OR target_role='all') AND (target_user_id IS NULL OR target_user_id=?)")
           ->execute([$user['role'], $user['uid']]);
        success(['message' => 'All marked as read']);
    }

    apiError("Notifications endpoint not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  REPORTS MODULE (Analytics & Export)
// ═══════════════════════════════════════════════════════════════
function handleReports(string $sub, string $method, array $query): void {
    requireAuth(['super_admin','admin','principal','accountant','hr_manager','exam_controller']);
    $db = Config::db();

    if ($sub === 'dashboard') {
        $month = $query['month'] ?? date('Y-m');
        $data  = [
            'total_students'   => $db->query("SELECT COUNT(*) FROM students WHERE status='active'")->fetchColumn(),
            'total_staff'      => $db->query("SELECT COUNT(*) FROM users WHERE role NOT IN ('student','parent') AND status='active'")->fetchColumn(),
            'fee_collected'    => $db->prepare("SELECT SUM(amount) FROM fee_payments WHERE DATE_FORMAT(paid_at,'%Y-%m')=?")->execute([$month]) ? $db->query("SELECT SUM(amount) FROM fee_payments WHERE DATE_FORMAT(paid_at,'%Y-%m')='$month'")->fetchColumn() : 0,
            'attendance_today' => $db->query("SELECT ROUND(COUNT(CASE WHEN status='present' THEN 1 END)/COUNT(*)*100,1) FROM student_attendance WHERE date=CURDATE()")->fetchColumn(),
            'books_issued'     => $db->query("SELECT COUNT(*) FROM library_issues WHERE status='issued'")->fetchColumn(),
            'transport_students' => $db->query("SELECT COUNT(*) FROM transport_students")->fetchColumn(),
        ];
        success($data);
    }

    if ($sub === 'financial') {
        $year = $query['year'] ?? date('Y');
        $stmt = $db->prepare("SELECT DATE_FORMAT(paid_at,'%Y-%m') as month, SUM(amount) as income FROM fee_payments WHERE YEAR(paid_at)=? GROUP BY month ORDER BY month");
        $stmt->execute([$year]);
        $income = $stmt->fetchAll();
        $stmt2  = $db->prepare("SELECT DATE_FORMAT(date,'%Y-%m') as month, SUM(amount) as expense FROM expenses WHERE YEAR(date)=? GROUP BY month ORDER BY month");
        $stmt2->execute([$year]);
        $expenses = $stmt2->fetchAll();
        success(['income' => $income, 'expenses' => $expenses, 'year' => $year]);
    }

    apiError("Reports endpoint '$sub' not found", 404);
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ROUTER
// ═══════════════════════════════════════════════════════════════
try {
    match($route) {
        'auth'         => handleAuth($sub, $method, $body),
        'students'     => handleStudents($sub, $method, $id, $body, $query),
        'fee'          => handleFee($sub, $method, $id, $body, $query),
        'attendance'   => handleAttendance($sub, $method, $id, $body),
        'staff'        => handleStaff($sub, $method, $id, $body),
        'salary'       => handleSalary($sub, $method, $id, $body),
        'library'      => handleLibrary($sub, $method, $id, $body),
        'transport'    => handleTransport($sub, $method, $id, $body),
        'examination'  => handleExamination($sub, $method, $id, $body),
        'notifications'=> $sub === 'register-token'
                           ? handlePushTokenRegistration($body)
                           : handleNotifications($sub, $method, $id, $body),
        'reports'      => handleReports($sub, $method, $query),
        'health'       => success(['status'=>'ok','server'=>php_uname('n'),'php'=>PHP_VERSION,'time'=>date('c')]),
        default        => apiError("Endpoint '/$route' not found. Valid: auth, students, fee, attendance, staff, salary, library, transport, examination, notifications, reports", 404),
    };
} catch (PDOException $e) {
    apiError('Database error: ' . (Config::get('APP_DEBUG') ? $e->getMessage() : 'Internal server error'), 500);
} catch (Throwable $e) {
    apiError('Server error: ' . (Config::get('APP_DEBUG') ? $e->getMessage() : 'Internal server error'), 500);
}
