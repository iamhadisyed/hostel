<?php
/**
 * ============================================================================
 * Laravel Shared Hosting Artisan Runner (Temporary Script)
 * ============================================================================
 * 
 * ⚠️ CRITICAL SECURITY WARNING:
 * This script is intended ONLY for temporary execution of Artisan commands
 * on shared hosting environments where SSH or terminal access is unavailable.
 * 
 * DELETE THIS FILE FROM YOUR SERVER AS SOON AS YOU HAVE FINISHED RUNNING COMMANDS!
 * You can also click the "Self-Destruct / Delete File" button in the dashboard.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CONFIGURATION: Set your secret access token here
// ----------------------------------------------------------------------------
// Change this to a secure secret of your choice before uploading to production.
$defaultSecret = 'hostel_artisan_2026_admin';

// Can also be overridden via environment variable if defined:
$SECRET_KEY = getenv('ARTISAN_RUNNER_SECRET') ?: $defaultSecret;

// Allow unlimited execution time for heavy migrations / optimizations
@set_time_limit(300);
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '512M');

// Start session for authentication state
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ----------------------------------------------------------------------------
// 2. LOCATE LARAVEL BASE PATH & AUTOLOADER
// ----------------------------------------------------------------------------
$possiblePaths = [
    __DIR__ . '/../',                    // Standard: file in backend/public/
    __DIR__ . '/',                       // File in backend root
    __DIR__ . '/../backend/',            // File in docroot with backend sibling
    __DIR__ . '/../laravel-app/',        // GoDaddy recommended: ~/laravel-app
    dirname(__DIR__) . '/',
];

$laravelRoot = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path . 'vendor/autoload.php') && file_exists($path . 'bootstrap/app.php')) {
        $laravelRoot = realpath($path);
        break;
    }
}

// ----------------------------------------------------------------------------
// 3. AUTHENTICATION HANDLING
// ----------------------------------------------------------------------------
// Support token via GET (?secret=...), POST, or Session
if (isset($_GET['secret']) && $_GET['secret'] === $SECRET_KEY) {
    $_SESSION['artisan_runner_auth'] = true;
}

if (isset($_POST['login_secret'])) {
    if ($_POST['login_secret'] === $SECRET_KEY) {
        $_SESSION['artisan_runner_auth'] = true;
        header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
        exit;
    } else {
        $authError = 'Invalid Secret Token. Please check the secret configured in this script.';
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['artisan_runner_auth']);
    header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
    exit;
}

$isAuthenticated = !empty($_SESSION['artisan_runner_auth']);

// ----------------------------------------------------------------------------
// 4. ACTION HANDLING (Self-Destruct & Command Execution)
// ----------------------------------------------------------------------------
$output = null;
$commandExecuted = null;
$executionTime = null;
$executionStatus = null;
$selfDestructed = false;

if ($isAuthenticated) {
    // A. Self-Destruct
    if (isset($_POST['action']) && $_POST['action'] === 'self_destruct') {
        $filePath = __FILE__;
        if (@unlink($filePath)) {
            $selfDestructed = true;
            unset($_SESSION['artisan_runner_auth']);
        } else {
            $output = "ERROR: Failed to delete file automatically. Please remove " . htmlspecialchars($filePath) . " manually via cPanel File Manager.";
            $executionStatus = 'error';
        }
    }

    // B. Command Execution
    if (isset($_POST['command']) && !empty(trim($_POST['command']))) {
        $command = trim($_POST['command']);

        // Remove leading 'php artisan' or 'artisan' if user entered it
        $command = preg_replace('/^(php\s+)?artisan\s+/', '', $command);

        if (!$laravelRoot) {
            $output = "ERROR: Could not locate Laravel installation (vendor/autoload.php or bootstrap/app.php).";
            $executionStatus = 'error';
        } else {
            $startTime = microtime(true);
            try {
                // Register Composer Autoloader
                require_once $laravelRoot . '/vendor/autoload.php';

                // Bootstrap Laravel
                $app = require_once $laravelRoot . '/bootstrap/app.php';
                $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
                $kernel->bootstrap();

                // Execute Command
                $exitCode = \Illuminate\Support\Facades\Artisan::call($command);
                $rawOutput = \Illuminate\Support\Facades\Artisan::output();

                // Strip ANSI escape codes for clean web display
                $output = preg_replace('/\x1b\[[0-9;]*m/', '', $rawOutput);
                if (empty(trim($output))) {
                    $output = "Command executed successfully with exit code {$exitCode}. (No console output returned)";
                }

                $commandExecuted = 'php artisan ' . $command;
                $executionTime = round(microtime(true) - $startTime, 3);
                $executionStatus = ($exitCode === 0) ? 'success' : 'warning';
            } catch (\Throwable $e) {
                $commandExecuted = 'php artisan ' . $command;
                $executionTime = round(microtime(true) - $startTime, 3);
                $executionStatus = 'error';
                $output = "EXCEPTION: " . $e->getMessage() . "\n\nFile: " . $e->getFile() . ":" . $e->getLine() . "\n\nStack Trace:\n" . $e->getTraceAsString();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Artisan Runner — Shared Hosting</title>
    <style>
        :root {
            --bg: #090d16;
            --surface: #111827;
            --surface-hover: #1f2937;
            --border: #1f293d;
            --border-accent: #374151;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --danger: #ef4444;
            --danger-hover: #dc2626;
            --success: #10b981;
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
        body { background: var(--bg); color: var(--text-main); min-height: 100vh; padding: 24px 16px; }
        .container { max-width: 960px; margin: 0 auto; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .badge-env { font-size: 11px; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; font-size: 13px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s ease; text-decoration: none; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: var(--primary-hover); }
        .btn-danger { background: var(--danger); color: white; }
        .btn-danger:hover { background: var(--danger-hover); }
        .btn-outline { background: transparent; border: 1px solid var(--border-accent); color: var(--text-muted); }
        .btn-outline:hover { background: var(--surface-hover); color: var(--text-main); }
        .alert-warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; }
        .alert-danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; }
        .alert-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; border-radius: 8px; padding: 16px 20px; font-size: 14px; text-align: center; }
        .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px; }
        .grid-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .preset-btn { background: #162032; border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; text-align: left; cursor: pointer; transition: all 0.15s ease; color: var(--text-main); width: 100%; }
        .preset-btn:hover { background: #1e293b; border-color: var(--primary); transform: translateY(-1px); }
        .preset-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #93c5fd; }
        .preset-cmd { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: var(--text-muted); }
        .command-bar { display: flex; gap: 10px; margin-bottom: 24px; }
        .command-input { flex: 1; background: #0c1220; border: 1px solid var(--border-accent); border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #fff; font-family: ui-monospace, SFMono-Regular, monospace; outline: none; }
        .command-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        .terminal { background: #050811; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-top: 20px; }
        .terminal-header { background: #0e1626; border-bottom: 1px solid var(--border); padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .terminal-cmd { font-family: ui-monospace, SFMono-Regular, monospace; color: #60a5fa; font-weight: 600; }
        .terminal-meta { font-size: 11px; color: var(--text-muted); }
        .terminal-body { padding: 16px; max-height: 450px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; word-break: break-all; }
        .login-box { max-width: 420px; margin: 80px auto; }
        .login-input { width: 100%; background: #0c1220; border: 1px solid var(--border-accent); border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #fff; margin-bottom: 14px; outline: none; }
        .login-input:focus { border-color: var(--primary); }
    </style>
</head>
<body>
<div class="container">

<?php if ($selfDestructed): ?>
    <div class="card">
        <div class="alert-success">
            <h2 style="margin-bottom: 8px;">✅ File Successfully Deleted</h2>
            <p><code><?php echo htmlspecialchars(basename(__FILE__)); ?></code> has been permanently removed from this server.</p>
            <p style="margin-top: 10px; font-size: 12px; color: var(--text-muted);">Artisan runner is no longer accessible. You can safely close this browser window.</p>
        </div>
    </div>
<?php elseif (!$isAuthenticated): ?>
    <div class="card login-box">
        <h2 style="font-size: 18px; margin-bottom: 6px;">🔒 Artisan Runner Authentication</h2>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
            Enter the secret token configured in this script to access the command runner.
        </p>

        <?php if (!empty($authError)): ?>
            <div class="alert-danger"><?php echo htmlspecialchars($authError); ?></div>
        <?php endif; ?>

        <form method="POST">
            <input type="password" name="login_secret" class="login-input" placeholder="Enter Secret Token..." autofocus required autocomplete="off">
            <button type="submit" class="btn btn-primary" style="width: 100%;">Unlock Dashboard</button>
        </form>

        <p style="font-size: 11px; color: var(--text-muted); margin-top: 18px; text-align: center;">
            Default Secret configured: <code><?php echo htmlspecialchars($SECRET_KEY); ?></code>
        </p>
    </div>
<?php else: ?>

    <div class="header">
        <div class="title">
            <span>⚡ Laravel Artisan Runner</span>
            <span class="badge-env"><?php echo $laravelRoot ? 'Connected: ' . htmlspecialchars(basename($laravelRoot)) : 'Path Error'; ?></span>
        </div>
        <div style="display: flex; gap: 8px;">
            <form method="POST" onsubmit="return confirm('⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will immediately delete this runner file (artisan-runner.php) from your server.');" style="display: inline;">
                <input type="hidden" name="action" value="self_destruct">
                <button type="submit" class="btn btn-danger">🗑️ Self-Destruct (Delete File)</button>
            </form>
            <a href="?logout=1" class="btn btn-outline">Logout</a>
        </div>
    </div>

    <div class="alert-warning">
        <strong>⚠️ CRITICAL SECURITY REMINDER:</strong> This file allows executing database migrations and cache commands over HTTP. Once your shared hosting setup/migration is complete, click <strong>"Self-Destruct"</strong> above or delete <code><?php echo htmlspecialchars(basename(__FILE__)); ?></code> from your server.
    </div>

    <div class="card">
        <div class="section-title">Quick Actions (Shared Hosting Presets)</div>
        <div class="grid-presets">
            <form method="POST">
                <input type="hidden" name="command" value="migrate --force">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Run Migrations</div>
                    <div class="preset-cmd">migrate --force</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="migrate:status">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Migration Status</div>
                    <div class="preset-cmd">migrate:status</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="storage:link">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Create Storage Symlink</div>
                    <div class="preset-cmd">storage:link</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="optimize:clear">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Clear All Caches</div>
                    <div class="preset-cmd">optimize:clear</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="config:cache">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Cache Configuration</div>
                    <div class="preset-cmd">config:cache</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="route:cache">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Cache Routes</div>
                    <div class="preset-cmd">route:cache</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="about">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Environment / About</div>
                    <div class="preset-cmd">about</div>
                </button>
            </form>

            <form method="POST">
                <input type="hidden" name="command" value="vouchers:manage-cycles">
                <button type="submit" class="preset-btn">
                    <div class="preset-title">Daily Voucher Cycles</div>
                    <div class="preset-cmd">vouchers:manage-cycles</div>
                </button>
            </form>
        </div>

        <div class="section-title">Custom Command</div>
        <form method="POST" class="command-bar">
            <input type="text" name="command" class="command-input" placeholder="e.g. migrate:rollback --step=1, db:seed --force, route:list" required autocomplete="off">
            <button type="submit" class="btn btn-primary">Run Command</button>
        </form>

        <?php if ($output !== null): ?>
            <div class="terminal">
                <div class="terminal-header">
                    <span class="terminal-cmd">$ <?php echo htmlspecialchars($commandExecuted ?? 'command'); ?></span>
                    <span class="terminal-meta">Status: <strong style="color: <?php echo $executionStatus === 'success' ? '#34d399' : ($executionStatus === 'warning' ? '#fbbf24' : '#f87171'); ?>;"><?php echo strtoupper($executionStatus); ?></strong> | Duration: <?php echo $executionTime; ?>s</span>
                </div>
                <div class="terminal-body"><?php echo htmlspecialchars($output); ?></div>
            </div>
        <?php endif; ?>
    </div>

<?php endif; ?>

</div>
</body>
</html>
