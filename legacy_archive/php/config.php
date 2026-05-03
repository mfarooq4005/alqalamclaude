<?php
/**
 * AL Qalam International EMS — Central Config
 * Reads from .env file automatically
 * Usage: require_once 'config.php';
 *        echo Config::get('DB_HOST');
 *        $pdo = Config::db();
 */

// Load .env
function loadEnv(string $path = __DIR__.'/.env'): void {
    if (!file_exists($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if (str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $val] = array_map('trim', explode('=', $line, 2));
        $val = trim($val, '"\'');
        // Strip inline comments
        if (str_contains($val, '#')) $val = trim(substr($val, 0, strpos($val, '#')));
        $val = trim($val);
        $_ENV[$key] = $val;
        putenv("$key=$val");
    }
}
loadEnv();

class Config {
    public static function get(string $key, mixed $default = null): mixed {
        return $_ENV[$key] ?? getenv($key) ?: $default;
    }

    // ── Database Connection ──────────────────────────────────
    private static ?PDO $pdo = null;
    public static function db(): PDO {
        if (self::$pdo) return self::$pdo;
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            self::get('DB_HOST','127.0.0.1'),
            self::get('DB_PORT','3306'),
            self::get('DB_DATABASE','alqalam_ems')
        );
        self::$pdo = new PDO($dsn, self::get('DB_USERNAME','root'), self::get('DB_PASSWORD',''), [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        // Set timezone
        self::$pdo->exec("SET time_zone = '+05:00'");
        return self::$pdo;
    }

    // ── JWT Helpers ─────────────────────────────────────────
    public static function jwtEncode(array $payload): string {
        $header  = base64_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
        $payload['exp'] = time() + (int)self::get('JWT_EXPIRY', 86400);
        $pay     = base64_encode(json_encode($payload));
        $sig     = hash_hmac('sha256', "$header.$pay", self::get('JWT_SECRET','secret'));
        return "$header.$pay.$sig";
    }
    public static function jwtDecode(string $token): array|false {
        [$h,$p,$s] = explode('.', $token.'..');
        if (hash_hmac('sha256',"$h.$p", self::get('JWT_SECRET','secret')) !== $s) return false;
        $data = json_decode(base64_decode($p), true);
        if (!$data || $data['exp'] < time()) return false;
        return $data;
    }

    // ── WhatsApp via Twilio ──────────────────────────────────
    public static function sendWhatsApp(string $phone, string $message): array {
        $sid   = self::get('TWILIO_SID');
        $auth  = self::get('TWILIO_AUTH_TOKEN');
        $from  = self::get('TWILIO_WHATSAPP_FROM','whatsapp:+14155238886');
        if (!$sid || str_starts_with($sid,'AC0000')) {
            return ['error'=>'WhatsApp not configured. Add Twilio keys to .env'];
        }
        $url  = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query(['From'=>$from,'To'=>"whatsapp:+92$phone",'Body'=>$message]),
            CURLOPT_USERPWD        => "$sid:$auth",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $res  = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return isset($res['sid']) ? ['sent'=>true,'sid'=>$res['sid']] : ['error'=>$res['message']??'Failed'];
    }

    // ── School Info ──────────────────────────────────────────
    public static function school(): array {
        return [
            'name'         => self::get('SCHOOL_NAME','AL Qalam International'),
            'branch'       => self::get('SCHOOL_BRANCH_NAME','Main Campus'),
            'phone'        => self::get('SCHOOL_PHONE','021-XXXXXXXX'),
            'email'        => self::get('SCHOOL_EMAIL','info@alqalam.edu.pk'),
            'address'      => self::get('SCHOOL_ADDRESS','Karachi'),
            'bank_name'    => self::get('SCHOOL_BANK_NAME','MCB Bank'),
            'bank_account' => self::get('SCHOOL_BANK_ACCOUNT',''),
            'bank_iban'    => self::get('SCHOOL_BANK_IBAN',''),
        ];
    }

    // ── Fee Settings ─────────────────────────────────────────
    public static function fee(): array {
        return [
            'late_per_day'      => (int)self::get('FEE_LATE_CHARGE_PER_DAY', 20),
            'grace_days'        => (int)self::get('FEE_GRACE_PERIOD_DAYS', 5),
            'annual_increase'   => (float)self::get('FEE_ANNUAL_INCREASE_PERCENT', 10),
            'sibling_discount'  => (float)self::get('FEE_SIBLING_DISCOUNT_PERCENT', 10),
            'advance_discount'  => (float)self::get('FEE_ADVANCE_DISCOUNT_PERCENT', 5),
            'challan_prefix'    => self::get('FEE_CHALLAN_PREFIX','CH'),
            'receipt_prefix'    => self::get('FEE_RECEIPT_PREFIX','RCP'),
            'voucher_prefix'    => self::get('FEE_VOUCHER_PREFIX','VCH'),
        ];
    }
}

// ── Convenience functions ────────────────────────────────────
function db(): PDO { return Config::db(); }
function env(string $k, mixed $d=null): mixed { return Config::get($k,$d); }

function respond(mixed $data, int $code=200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['success'=>$code<400,'data'=>$data,'timestamp'=>date('c')]);
    exit;
}
function apiError(string $msg, int $code=400): void { respond(['error'=>$msg],$code); }

function requireAuth(array $roles=[]): array {
    $token = trim(str_replace('Bearer ','', $_SERVER['HTTP_AUTHORIZATION']??''));
    $user  = Config::jwtDecode($token);
    if (!$user) apiError('Unauthorized',401);
    if ($roles && !in_array($user['role'],$roles)) apiError('Forbidden — insufficient role',403);
    return $user;
}
?>
