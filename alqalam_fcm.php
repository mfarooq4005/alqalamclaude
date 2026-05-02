<?php
/**
 * ═══════════════════════════════════════════════════════════════
 *  AL QALAM INTERNATIONAL — FCM Push Notification Service
 *  Include this file in alqalam_backend.php:
 *    require_once __DIR__ . '/alqalam_fcm.php';
 *
 *  Also add to config.php:
 *    define('FCM_SERVER_KEY', 'YOUR_FCM_SERVER_KEY_HERE');
 *    define('FCM_API_URL',    'https://fcm.googleapis.com/fcm/send');
 * ═══════════════════════════════════════════════════════════════
 */

// ── Push Token Table SQL (run once in your DB) ─────────────────
/*
CREATE TABLE IF NOT EXISTS push_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    role        VARCHAR(30) NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    platform    ENUM('ios','android') NOT NULL DEFAULT 'android',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user  (user_id),
    INDEX idx_role  (role)
);
*/

// ════════════════════════════════════════════════════════════════
//  CORE FCM SENDER
// ════════════════════════════════════════════════════════════════

/**
 * Send push notification to one or more Expo push tokens.
 * Uses Expo Push Service (free, no FCM key needed).
 */
function sendPushNotification(
    array  $tokens,          // array of Expo push tokens
    string $title,
    string $body,
    array  $data    = [],
    string $sound   = 'alqalam_notification.wav',
    string $channel = 'alqalam-default'
): array {
    if (empty($tokens)) return ['sent' => 0, 'errors' => []];

    // Build messages array (max 100 per request per Expo docs)
    $messages = [];
    foreach ($tokens as $token) {
        if (!str_starts_with($token, 'ExponentPushToken[')) continue;
        $messages[] = [
            'to'           => $token,
            'title'        => $title,
            'body'         => $body,
            'sound'        => $sound,
            'channelId'    => $channel,
            'data'         => $data,
            'badge'        => 1,
            'priority'     => 'high',
        ];
    }

    if (empty($messages)) return ['sent' => 0, 'errors' => ['No valid Expo tokens']];

    // Send to Expo Push API
    $ch = curl_init('https://exp.host/--/api/v2/push/send');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($messages),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Accept-Encoding: gzip, deflate',
        ],
        CURLOPT_TIMEOUT        => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("[FCM] Expo push failed: HTTP $httpCode — $response");
        return ['sent' => 0, 'errors' => ["HTTP $httpCode"]];
    }

    $result = json_decode($response, true);
    $sent   = 0;
    $errors = [];

    foreach ($result['data'] ?? [] as $item) {
        if ($item['status'] === 'ok') {
            $sent++;
        } else {
            $errors[] = $item['message'] ?? 'Unknown error';
            error_log('[FCM] Push error: ' . json_encode($item));
        }
    }

    return ['sent' => $sent, 'errors' => $errors];
}

// ════════════════════════════════════════════════════════════════
//  TOKEN MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Register or update a push token for a user.
 * Called from mobile app after login.
 */
function registerPushToken(int $userId, string $role, string $token, string $platform = 'android'): void {
    $db = Config::db();
    $db->prepare('
        INSERT INTO push_tokens (user_id, role, token, platform, updated_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), role=VALUES(role), platform=VALUES(platform), updated_at=NOW()
    ')->execute([$userId, $role, $token, $platform]);
}

/**
 * Get push tokens for specific users or roles.
 */
function getPushTokens(array $userIds = [], array $roles = []): array {
    $db     = Config::db();
    $tokens = [];

    if (!empty($userIds)) {
        $ph   = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = $db->prepare("SELECT token FROM push_tokens WHERE user_id IN ($ph)");
        $stmt->execute($userIds);
        $tokens = array_merge($tokens, $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    if (!empty($roles)) {
        $ph   = implode(',', array_fill(0, count($roles), '?'));
        $stmt = $db->prepare("SELECT token FROM push_tokens WHERE role IN ($ph)");
        $stmt->execute($roles);
        $tokens = array_merge($tokens, $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    return array_unique($tokens);
}

/**
 * Get tokens for all users of a given role.
 */
function getTokensByRole(string $role): array {
    $db   = Config::db();
    $stmt = $db->prepare("SELECT token FROM push_tokens WHERE role = ?");
    $stmt->execute([$role]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

/**
 * Get tokens for a specific user.
 */
function getTokensByUser(int $userId): array {
    $db   = Config::db();
    $stmt = $db->prepare("SELECT token FROM push_tokens WHERE user_id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

// ════════════════════════════════════════════════════════════════
//  NOTIFICATION TRIGGERS (call these from your business logic)
// ════════════════════════════════════════════════════════════════

/**
 * Trigger: New challan generated for a student.
 * Notifies parent(s) linked to that student.
 */
function notifyNewChallan(
    int    $studentId,
    string $studentName,
    string $class,
    float  $amount,
    string $challanNo,
    string $month
): void {
    $db = Config::db();

    // Get parent user_ids linked to this student
    $stmt = $db->prepare("SELECT parent_user_id FROM student_parents WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $parentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($parentIds)) return;

    $tokens = getPushTokens($parentIds);
    if (empty($tokens)) return;

    sendPushNotification(
        tokens:  $tokens,
        title:   '🧾 New Fee Challan — AL Qalam',
        body:    "$studentName ($class) ka $month challan generate hua — Rs. " . number_format($amount),
        data:    ['type' => 'new_challan', 'screen' => '/(parent)/fee', 'challan' => $challanNo],
        channel: 'alqalam-fee'
    );

    // Also log in DB notifications table
    logDbNotification(
        title:      "New Challan: $studentName",
        message:    "$month — Rs. " . number_format($amount) . " — $challanNo",
        type:       'fee',
        targetRole: 'parent',
        targetIds:  $parentIds
    );
}

/**
 * Trigger: Monthly fee reminder (run via cron on 5th of each month).
 * Notifies parents of all students with pending fee.
 */
function notifyFeeReminder(): void {
    $db    = Config::db();
    $month = date('F Y');

    // Get all pending fees with parent contact info
    $stmt = $db->query("
        SELECT f.student_id, s.name AS student_name, s.class, s.section,
               f.amount, sp.parent_user_id
        FROM fees f
        JOIN students s ON s.id = f.student_id
        JOIN student_parents sp ON sp.student_id = f.student_id
        WHERE f.status = 'pending'
          AND MONTH(f.created_at) = MONTH(CURDATE())
          AND YEAR(f.created_at)  = YEAR(CURDATE())
    ");

    $rows = $stmt->fetchAll();
    if (empty($rows)) return;

    // Group by parent to avoid duplicate notifications
    $byParent = [];
    foreach ($rows as $row) {
        $pid = $row['parent_user_id'];
        if (!isset($byParent[$pid])) $byParent[$pid] = [];
        $byParent[$pid][] = $row;
    }

    foreach ($byParent as $parentId => $fees) {
        $tokens = getTokensByUser((int)$parentId);
        if (empty($tokens)) continue;

        $names  = implode(', ', array_map(fn($r) => $r['student_name'], $fees));
        $total  = array_sum(array_map(fn($r) => $r['amount'], $fees));

        sendPushNotification(
            tokens:  $tokens,
            title:   "💰 Fee Reminder — $month",
            body:    "$names ki fee Rs. " . number_format($total) . " abhi pending hai",
            data:    ['type' => 'fee_due', 'screen' => '/(parent)/fee'],
            channel: 'alqalam-fee'
        );
    }
}

/**
 * Trigger: Attendance marked — notify parents if student was absent.
 */
function notifyAbsence(int $studentId, string $studentName, string $class, string $date): void {
    $db = Config::db();

    $stmt = $db->prepare("SELECT parent_user_id FROM student_parents WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $parentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($parentIds)) return;

    $tokens = getPushTokens($parentIds);
    if (empty($tokens)) return;

    $dateFormatted = date('d M Y', strtotime($date));

    sendPushNotification(
        tokens:  $tokens,
        title:   '⚠️ Absence Alert — AL Qalam',
        body:    "$studentName ($class) $dateFormatted ko absent hai",
        data:    ['type' => 'attendance_absent', 'screen' => '/(parent)/attendance', 'student_id' => $studentId],
        channel: 'alqalam-attendance'
    );
}

/**
 * Trigger: Attendance percentage dropped below 75%.
 */
function notifyLowAttendance(int $studentId, string $studentName, string $class, float $percentage): void {
    $tokens = getPushTokens([], []);  // Get parent tokens for this student
    $db     = Config::db();

    $stmt = $db->prepare("SELECT parent_user_id FROM student_parents WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $parentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $tokens = getPushTokens($parentIds);
    if (empty($tokens)) return;

    $pct = number_format($percentage, 1);

    sendPushNotification(
        tokens:  $tokens,
        title:   '🔴 Low Attendance Warning',
        body:    "$studentName ($class) ki attendance $pct% hai — class teacher se rabta karein",
        data:    ['type' => 'attendance_low', 'screen' => '/(parent)/attendance'],
        channel: 'alqalam-attendance'
    );
}

/**
 * Trigger: Exam result published.
 */
function notifyResultPublished(string $examTitle, string $targetClass = 'all'): void {
    $db = Config::db();

    // Notify students of that class
    if ($targetClass === 'all') {
        $studentTokens = getTokensByRole('student');
        $parentTokens  = getTokensByRole('parent');
    } else {
        $stmt = $db->prepare("SELECT u.id FROM users u JOIN students s ON s.user_id=u.id WHERE s.class=? AND u.role='student' AND u.status='active'");
        $stmt->execute([$targetClass]);
        $ids           = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $studentTokens = getPushTokens($ids);
        $parentTokens  = [];
    }

    $allTokens = array_unique(array_merge($studentTokens, $parentTokens));
    if (empty($allTokens)) return;

    sendPushNotification(
        tokens:  $allTokens,
        title:   '📊 Result Published — AL Qalam',
        body:    "$examTitle ke nataij publish ho gaye — abhi check karein",
        data:    ['type' => 'result_published', 'screen' => '/(student)/results', 'exam' => $examTitle],
        channel: 'alqalam-academic'
    );
}

/**
 * Trigger: General school announcement to all or specific role.
 */
function notifyAnnouncement(string $title, string $message, string $targetRole = 'all'): void {
    $tokens = $targetRole === 'all'
        ? array_unique(array_merge(
            getTokensByRole('student'),
            getTokensByRole('parent'),
            getTokensByRole('teacher')
          ))
        : getTokensByRole($targetRole);

    if (empty($tokens)) return;

    sendPushNotification(
        tokens:  $tokens,
        title:   "📢 $title",
        body:    $message,
        data:    ['type' => 'announcement', 'screen' => '/(student)/index'],
        channel: 'alqalam-default'
    );
}

/**
 * Trigger: Teacher leave application status update.
 */
function notifyLeaveStatus(int $teacherUserId, string $teacherName, string $status, string $leaveType): void {
    $tokens = getTokensByUser($teacherUserId);
    if (empty($tokens)) return;

    $emoji  = $status === 'approved' ? '✅' : '❌';
    $word   = $status === 'approved' ? 'Approved' : 'Rejected';

    sendPushNotification(
        tokens:  $tokens,
        title:   "$emoji Leave $word — AL Qalam",
        body:    "Aapki $leaveType leave application $word ho gayi",
        data:    ['type' => 'leave_approved', 'screen' => '/(teacher)/profile'],
        channel: 'alqalam-default'
    );
}

// ════════════════════════════════════════════════════════════════
//  DB NOTIFICATION LOGGER
// ════════════════════════════════════════════════════════════════

function logDbNotification(
    string $title,
    string $message,
    string $type       = 'info',
    string $targetRole = 'all',
    array  $targetIds  = []
): void {
    $db = Config::db();

    if (empty($targetIds)) {
        $db->prepare("INSERT INTO notifications (title, message, type, target_role, created_at) VALUES (?,?,?,?,NOW())")
           ->execute([$title, $message, $type, $targetRole]);
    } else {
        $stmt = $db->prepare("INSERT INTO notifications (title, message, type, target_role, target_user_id, created_at) VALUES (?,?,?,?,?,NOW())");
        foreach ($targetIds as $uid) {
            $stmt->execute([$title, $message, $type, $targetRole, $uid]);
        }
    }
}

// ════════════════════════════════════════════════════════════════
//  API ENDPOINT: /notifications/register-token  (POST)
//  Called by mobile app right after login
// ════════════════════════════════════════════════════════════════

function handlePushTokenRegistration(array $body): void {
    $user = requireAuth();

    $token    = $body['token']    ?? '';
    $platform = $body['platform'] ?? 'android';

    if (empty($token)) {
        apiError('Push token is required', 400);
    }

    registerPushToken((int)$user['uid'], $user['role'], $token, $platform);

    success(['message' => 'Token registered successfully']);
}

// ════════════════════════════════════════════════════════════════
//  CRON JOB ENTRY POINTS (run via cPanel cron)
// ════════════════════════════════════════════════════════════════

/**
 * Run this via cron at 9:00 AM on 5th of each month:
 *   php /path/to/alqalam_fcm.php --job=fee_reminder
 */
if (PHP_SAPI === 'cli' && isset($argv[1])) {
    parse_str(ltrim($argv[1], '--'), $args);

    switch ($args['job'] ?? '') {
        case 'fee_reminder':
            require_once __DIR__ . '/config.php';
            notifyFeeReminder();
            echo "Fee reminders sent\n";
            break;

        case 'attendance_check':
            // Check all students with <75% attendance and notify parents
            require_once __DIR__ . '/config.php';
            $db   = Config::db();
            $stmt = $db->query("
                SELECT s.id, s.name, s.class, s.section,
                       (COUNT(CASE WHEN a.status='present' THEN 1 END) + COUNT(CASE WHEN a.status='late' THEN 1 END)) * 100.0 / NULLIF(COUNT(a.id),0) AS pct
                FROM students s
                JOIN attendance a ON a.student_id = s.id AND a.type='student'
                GROUP BY s.id
                HAVING pct < 75 AND pct IS NOT NULL
            ");
            foreach ($stmt->fetchAll() as $row) {
                notifyLowAttendance($row['id'], $row['name'], $row['class'], (float)$row['pct']);
                sleep(1); // Rate limiting
            }
            echo "Attendance alerts sent\n";
            break;
    }
    exit(0);
}
