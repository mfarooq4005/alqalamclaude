<?php
/**
 * AL Qalam International EMS — PHP REST API Backend
 * Use with XAMPP: place in htdocs/alqalam/
 * Requires: MySQL + PHP 8.0+
 *
 * Base URL: http://localhost/alqalam/alqalam_api.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// ===== DATABASE CONFIG =====
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'alqalam_ems');

// WhatsApp (Twilio) Config — optional
define('TWILIO_SID', 'YOUR_TWILIO_SID');
define('TWILIO_AUTH', 'YOUR_TWILIO_AUTH');
define('TWILIO_WHATSAPP', 'whatsapp:+14155238886');

function db() {
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    return $pdo;
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $code < 400, 'data' => $data]);
    exit;
}

function error($msg, $code = 400) {
    respond(['error' => $msg], $code);
}

// ===== JWT AUTH =====
function generateToken($userId, $role) {
    $payload = base64_encode(json_encode(['uid' => $userId, 'role' => $role, 'exp' => time() + 86400]));
    $sig = hash_hmac('sha256', $payload, 'AQ_SECRET_2024');
    return $payload . '.' . $sig;
}

function verifyToken($token) {
    [$payload, $sig] = explode('.', $token . '.');
    if (hash_hmac('sha256', $payload, 'AQ_SECRET_2024') !== $sig) return false;
    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time()) return false;
    return $data;
}

function requireAuth($roles = []) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $auth);
    $user = verifyToken($token);
    if (!$user) error('Unauthorized', 401);
    if ($roles && !in_array($user['role'], $roles)) error('Forbidden', 403);
    return $user;
}

// ===== ROUTER =====
$method = $_SERVER['REQUEST_METHOD'];
$path = trim($_GET['path'] ?? '', '/');
$body = json_decode(file_get_contents('php://input'), true) ?? [];

switch ("$method:$path") {

    // ===== AUTH =====
    case 'POST:auth/login':
        $stmt = db()->prepare("SELECT * FROM users WHERE username=? LIMIT 1");
        $stmt->execute([$body['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user || !password_verify($body['password'], $user['password'])) {
            error('Invalid credentials', 401);
        }
        respond([
            'token' => generateToken($user['id'], $user['role']),
            'user' => ['id' => $user['id'], 'name' => $user['full_name'], 'role' => $user['role']]
        ]);

    // ===== STUDENTS =====
    case 'GET:students':
        $auth = requireAuth(['admin','principal','teacher','accountant']);
        $cls = $_GET['class'] ?? '';
        $q = $_GET['q'] ?? '';
        $sql = "SELECT s.*, u.full_name, u.email FROM students s JOIN users u ON s.user_id=u.id WHERE 1=1";
        $params = [];
        if ($cls) { $sql .= " AND s.class_id=?"; $params[] = $cls; }
        if ($q) { $sql .= " AND u.full_name LIKE ?"; $params[] = "%$q%"; }
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'GET:students/':
        $auth = requireAuth();
        $id = explode('/', $path)[1];
        $stmt = db()->prepare("SELECT s.*, u.full_name, u.email FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=?");
        $stmt->execute([$id]);
        respond($stmt->fetch(PDO::FETCH_ASSOC));

    // ===== FEE STRUCTURE =====
    case 'GET:fee/structure':
        requireAuth(['admin','accountant','principal']);
        $stmt = db()->query("SELECT fs.*, c.name as class_name FROM fee_structure fs JOIN classes c ON fs.class_id=c.id ORDER BY c.grade_level");
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'PUT:fee/structure':
        requireAuth(['admin','principal']);
        $id = $body['id'];
        $stmt = db()->prepare("UPDATE fee_structure SET tuition_fee=?, exam_fee=?, library_fee=?, sports_fee=?, lab_fee=? WHERE id=?");
        $stmt->execute([$body['tuition'],$body['exam'],$body['library'],$body['sports'],$body['lab'],$id]);
        respond(['updated' => true]);

    // ===== CHALLANS =====
    case 'GET:fee/challans':
        requireAuth(['admin','accountant','principal']);
        $month = $_GET['month'] ?? date('Y-m');
        $status = $_GET['status'] ?? '';
        $sql = "SELECT fc.*, s.admission_no, u.full_name, c.name as class_name FROM fee_challans fc
                JOIN students s ON fc.student_id=s.id JOIN users u ON s.user_id=u.id JOIN classes c ON s.class_id=c.id
                WHERE DATE_FORMAT(fc.due_date,'%Y-%m')=?";
        $params = [$month];
        if ($status) { $sql .= " AND fc.status=?"; $params[] = $status; }
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'POST:fee/challans/generate':
        requireAuth(['admin','accountant']);
        $month = $body['month'];
        $class_id = $body['class_id'] ?? null;
        $due_date = $body['due_date'];
        // Get students
        $sql = "SELECT s.id, s.class_id, fs.total_fee FROM students s JOIN fee_structure fs ON s.class_id=fs.class_id WHERE s.status='active'";
        $params = [];
        if ($class_id) { $sql .= " AND s.class_id=?"; $params[] = $class_id; }
        $students = db()->prepare($sql);
        $students->execute($params);
        $students = $students->fetchAll(PDO::FETCH_ASSOC);
        $count = 0;
        $insert = db()->prepare("INSERT IGNORE INTO fee_challans (student_id, month_year, amount, due_date, status) VALUES (?,?,?,?,'pending')");
        foreach ($students as $s) {
            // Apply scholarship discount
            $disc = db()->prepare("SELECT discount_percent FROM scholarships WHERE student_id=? AND status='active' AND valid_till>=CURDATE()");
            $disc->execute([$s['id']]);
            $scholarship = $disc->fetch(PDO::FETCH_ASSOC);
            $amount = $s['total_fee'];
            if ($scholarship) $amount = $amount * (1 - $scholarship['discount_percent']/100);
            $insert->execute([$s['id'], $month, $amount, $due_date]);
            $count++;
        }
        respond(['generated' => $count, 'month' => $month]);

    // ===== FEE COLLECTION =====
    case 'POST:fee/collect':
        requireAuth(['admin','accountant']);
        $challan_id = $body['challan_id'];
        $amount = $body['amount'];
        $method = $body['method'];
        $collected_by = requireAuth()['uid'];
        // Generate receipt number
        $rcpNo = 'RCP-'.date('Y').'-'.str_pad(mt_rand(1000,9999),4,'0',STR_PAD_LEFT);
        db()->beginTransaction();
        try {
            $stmt = db()->prepare("UPDATE fee_challans SET status='paid', paid_date=NOW(), paid_amount=? WHERE id=?");
            $stmt->execute([$amount, $challan_id]);
            $stmt = db()->prepare("INSERT INTO fee_receipts (challan_id, receipt_no, amount, payment_method, received_by, created_at) VALUES (?,?,?,?,?,NOW())");
            $stmt->execute([$challan_id, $rcpNo, $amount, $method, $collected_by]);
            // Add to income ledger
            $stmt = db()->prepare("INSERT INTO income_ledger (date, category, description, amount, payment_method, created_by) VALUES (NOW(), 'Fee Income', CONCAT('Fee Receipt: ', ?), ?, ?, ?)");
            $stmt->execute([$rcpNo, $amount, $method, $collected_by]);
            db()->commit();
            respond(['receipt_no' => $rcpNo, 'collected' => true]);
        } catch (Exception $e) {
            db()->rollBack();
            error('Transaction failed: '.$e->getMessage());
        }

    // ===== DEFAULTERS =====
    case 'GET:fee/defaulters':
        requireAuth(['admin','accountant','principal']);
        $stmt = db()->query("SELECT fc.*, s.admission_no, u.full_name, p.phone as parent_phone, c.name as class_name,
            DATEDIFF(NOW(), fc.due_date) as days_overdue
            FROM fee_challans fc JOIN students s ON fc.student_id=s.id JOIN users u ON s.user_id=u.id
            JOIN classes c ON s.class_id=c.id LEFT JOIN users p ON s.parent_user_id=p.id
            WHERE fc.status='overdue' ORDER BY days_overdue DESC");
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    // ===== FINES =====
    case 'GET:fines':
        requireAuth(['admin','teacher','principal']);
        $sid = $_GET['student_id'] ?? '';
        $sql = "SELECT sf.*, u.full_name, c.name as class_name FROM student_fines sf JOIN students s ON sf.student_id=s.id JOIN users u ON s.user_id=u.id JOIN classes c ON s.class_id=c.id WHERE 1=1";
        $params = [];
        if ($sid) { $sql .= " AND sf.student_id=?"; $params[] = $sid; }
        $stmt = db()->prepare($sql." ORDER BY sf.issued_date DESC");
        $stmt->execute($params);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'POST:fines':
        $auth = requireAuth(['admin','teacher','principal']);
        $stmt = db()->prepare("INSERT INTO student_fines (student_id, fine_type, amount, description, issued_by, issued_date, status) VALUES (?,?,?,?,?,NOW(),'pending')");
        $stmt->execute([$body['student_id'],$body['type'],$body['amount'],$body['description'],$auth['uid']]);
        // Add notification
        $nStmt = db()->prepare("INSERT INTO notifications (user_id, type, title, message) SELECT s.parent_user_id, 'fine', 'Fine Issued', ? FROM students s WHERE s.id=?");
        $nStmt->execute(["A fine of Rs.{$body['amount']} has been issued: {$body['description']}", $body['student_id']]);
        respond(['issued' => true, 'id' => db()->lastInsertId()]);

    case 'PUT:fines/pay':
        requireAuth(['admin','accountant']);
        $stmt = db()->prepare("UPDATE student_fines SET status='paid', paid_date=NOW() WHERE id=?");
        $stmt->execute([$body['id']]);
        respond(['paid' => true]);

    // ===== SCHOLARSHIPS =====
    case 'GET:scholarships':
        requireAuth(['admin','principal','accountant']);
        $stmt = db()->query("SELECT sc.*, u.full_name, c.name as class_name FROM scholarships sc JOIN students s ON sc.student_id=s.id JOIN users u ON s.user_id=u.id JOIN classes c ON s.class_id=c.id WHERE sc.status='active'");
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'POST:scholarships':
        requireAuth(['admin','principal']);
        $stmt = db()->prepare("INSERT INTO scholarships (student_id, scholarship_type, discount_percent, approved_by, valid_till, status) VALUES (?,?,?,?,?,'active')");
        $stmt->execute([$body['student_id'],$body['type'],$body['discount'],requireAuth()['uid'],$body['valid_till']]);
        respond(['added' => true]);

    // ===== SALARY =====
    case 'GET:salary':
        requireAuth(['admin','principal','accountant']);
        $month = $_GET['month'] ?? date('Y-m');
        $stmt = db()->prepare("SELECT ss.*, u.full_name, u.employee_id, u.designation FROM salary_sheets ss JOIN users u ON ss.staff_id=u.id WHERE DATE_FORMAT(ss.month_year,'%Y-%m')=?");
        $stmt->execute([$month]);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'PUT:salary/pay':
        requireAuth(['admin','accountant']);
        $stmt = db()->prepare("UPDATE salary_sheets SET status='paid', paid_date=NOW() WHERE id=?");
        $stmt->execute([$body['id']]);
        // Add to expense ledger
        $s = db()->prepare("SELECT ss.net_salary, u.full_name FROM salary_sheets ss JOIN users u ON ss.staff_id=u.id WHERE ss.id=?");
        $s->execute([$body['id']]);
        $row = $s->fetch(PDO::FETCH_ASSOC);
        $exp = db()->prepare("INSERT INTO expense_ledger (date, category, description, amount, approved_by) VALUES (NOW(),'Salary',?,?,?)");
        $exp->execute(["Salary: {$row['full_name']}", $row['net_salary'], requireAuth()['uid']]);
        respond(['paid' => true]);

    // ===== NOTIFICATIONS =====
    case 'GET:notifications':
        $auth = requireAuth();
        $stmt = db()->prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$auth['uid']]);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'PUT:notifications/read':
        $auth = requireAuth();
        if ($body['all'] ?? false) {
            $stmt = db()->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?");
            $stmt->execute([$auth['uid']]);
        } else {
            $stmt = db()->prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?");
            $stmt->execute([$body['id'], $auth['uid']]);
        }
        respond(['updated' => true]);

    // ===== WHATSAPP (Twilio) =====
    case 'POST:notifications/whatsapp':
        requireAuth(['admin','accountant','principal']);
        $phone = $body['phone'];
        $message = $body['message'];
        // Twilio WhatsApp API
        $url = "https://api.twilio.com/2010-04-01/Accounts/".TWILIO_SID."/Messages.json";
        $data = ['From' => TWILIO_WHATSAPP, 'To' => "whatsapp:+92$phone", 'Body' => $message];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_USERPWD, TWILIO_SID.":".TWILIO_AUTH);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        curl_close($ch);
        $resp = json_decode($result, true);
        if ($resp['sid'] ?? false) respond(['sent' => true, 'sid' => $resp['sid']]);
        else error('WhatsApp send failed. Check Twilio config.');

    // ===== INCOME/EXPENSES =====
    case 'GET:accounts/income':
        requireAuth(['admin','accountant','principal']);
        $month = $_GET['month'] ?? date('Y-m');
        $stmt = db()->prepare("SELECT * FROM income_ledger WHERE DATE_FORMAT(date,'%Y-%m')=? ORDER BY date DESC");
        $stmt->execute([$month]);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'POST:accounts/income':
        $auth = requireAuth(['admin','accountant']);
        $stmt = db()->prepare("INSERT INTO income_ledger (date, category, description, amount, payment_method, created_by) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$body['date'],$body['category'],$body['description'],$body['amount'],$body['method'],$auth['uid']]);
        respond(['added' => true, 'id' => db()->lastInsertId()]);

    case 'GET:accounts/expenses':
        requireAuth(['admin','accountant','principal']);
        $month = $_GET['month'] ?? date('Y-m');
        $stmt = db()->prepare("SELECT * FROM expense_ledger WHERE DATE_FORMAT(date,'%Y-%m')=? ORDER BY date DESC");
        $stmt->execute([$month]);
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));

    case 'POST:accounts/expenses':
        $auth = requireAuth(['admin','accountant','principal']);
        $stmt = db()->prepare("INSERT INTO expense_ledger (date, category, description, amount, approved_by, created_by) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$body['date'],$body['category'],$body['description'],$body['amount'],$body['approved_by'],$auth['uid']]);
        respond(['added' => true]);

    // ===== ATTENDANCE =====
    case 'POST:attendance':
        $auth = requireAuth(['teacher','admin']);
        $records = $body['records'];
        $stmt = db()->prepare("INSERT INTO attendance (student_id, date, status, marked_by) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE status=?, marked_by=?");
        foreach ($records as $r) {
            $stmt->execute([$r['student_id'],$r['date'],$r['status'],$auth['uid'],$r['status'],$auth['uid']]);
        }
        // Check if any student below 75%
        foreach ($records as $r) {
            if ($r['status'] === 'absent') {
                $pct = db()->prepare("SELECT (SUM(status='present')/COUNT(*))*100 as pct FROM attendance WHERE student_id=? AND MONTH(date)=MONTH(NOW())");
                $pct->execute([$r['student_id']]);
                $row = $pct->fetch(PDO::FETCH_ASSOC);
                if ($row['pct'] < 75) {
                    $n = db()->prepare("INSERT INTO notifications (user_id, type, title, message) SELECT s.parent_user_id, 'attendance', 'Low Attendance Alert', ? FROM students s WHERE s.id=?");
                    $n->execute(["Your child's attendance has fallen below 75% this month.", $r['student_id']]);
                }
            }
        }
        respond(['saved' => count($records)]);

    // ===== INVENTORY / WALLET =====
    case 'POST:inventory/request':
        $auth = requireAuth(['teacher']);
        $stmt = db()->prepare("INSERT INTO item_requests (item_id, requested_by, quantity, purpose, return_date, status, created_at) VALUES (?,?,?,?,?,?,NOW(),'pending')");
        $stmt->execute([$body['item_id'],$auth['uid'],$body['quantity'],$body['purpose'],$body['return_date']??null]);
        respond(['requested' => true, 'id' => db()->lastInsertId()]);

    case 'PUT:inventory/approve':
        requireAuth(['admin','store_keeper']);
        $reqId = $body['request_id'];
        db()->beginTransaction();
        $req = db()->prepare("SELECT * FROM item_requests WHERE id=?");
        $req->execute([$reqId]);
        $r = $req->fetch(PDO::FETCH_ASSOC);
        // Decrement stock
        $upd = db()->prepare("UPDATE inventory_items SET current_stock=current_stock-? WHERE id=? AND current_stock>=?");
        $upd->execute([$r['quantity'],$r['item_id'],$r['quantity']]);
        if (!db()->prepare("SELECT ROW_COUNT()")->execute()) { db()->rollBack(); error('Insufficient stock'); }
        // Add to wallet
        $w = db()->prepare("INSERT INTO user_wallets (user_id, item_id, quantity, issued_date, return_date, status) VALUES (?,?,?,NOW(),?,'active')");
        $w->execute([$r['requested_by'],$r['item_id'],$r['quantity'],$r['return_date']]);
        // Update request status
        $upd2 = db()->prepare("UPDATE item_requests SET status='issued' WHERE id=?");
        $upd2->execute([$reqId]);
        // Notify teacher
        $n = db()->prepare("INSERT INTO notifications (user_id, type, title, message) SELECT item_id, 'item', 'Item Request Approved', ? FROM item_requests WHERE id=?");
        $n->execute(["Your item request has been approved and added to your wallet.", $reqId]);
        db()->commit();
        respond(['approved' => true]);

    default:
        error("Endpoint not found: $method:$path", 404);
}
?>
