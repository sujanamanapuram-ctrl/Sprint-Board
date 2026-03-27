const { spawn } = require('child_process');
const http = require('http');

const logs = [];
function log(msg) {
    const line = '[' + new Date().toTimeString().slice(0,8) + '] ' + msg;
    console.log(line);
}

const server = http.createServer((req, res) => res.end('ok'));
server.listen(3001, () => log('📡 Server on 3001'));

// Step 1: Search winget for postgresql
log('🔍 Searching winget for PostgreSQL packages...');
const search = spawn('winget', ['search', 'postgresql'], { shell: true });
const results = [];

search.stdout.on('data', d => {
    d.toString().split('\n').forEach(line => {
        if (line.trim()) { log('  ' + line.trim()); results.push(line.trim()); }
    });
});
search.stderr.on('data', d => log('stderr: ' + d.toString().trim()));

search.on('close', () => {
    log('--- Search complete. Now installing PostgreSQL 16 ---');

    // Try multiple known package IDs
    const tryInstall = (ids, idx=0) => {
        if (idx >= ids.length) {
            log('❌ All package IDs failed. Will try direct download.');
            downloadAndInstall();
            return;
        }
        const id = ids[idx];
        log(`📦 Trying: winget install ${id}`);
        const proc = spawn('winget', [
            'install', id,
            '--accept-package-agreements',
            '--accept-source-agreements',
            '--silent'
        ], { shell: true });

        proc.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => log('  ' + l.trim())));
        proc.stderr.on('data', d => log('  err: ' + d.toString().trim()));
        proc.on('close', code => {
            if (code === 0) {
                log('✅ PostgreSQL installed! Package: ' + id);
                verifyService();
            } else {
                log(`⚠️  ${id} failed (code ${code}). Trying next...`);
                tryInstall(ids, idx + 1);
            }
        });
    };

    tryInstall([
        'PostgreSQL.PostgreSQL.16',
        'PostgreSQL.PostgreSQL.15',
        'PostgreSQL.PostgreSQL',
        'EDB.PostgreSQL',
        'postgresql'
    ]);
});

function downloadAndInstall() {
    log('⬇️  Downloading PostgreSQL 16 installer (~300MB)...');
    log('   URL: https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe');
    const dl = spawn('powershell', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
        `$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe' -OutFile "$env:TEMP\\pg_installer.exe" -UseBasicParsing; Write-Host 'Download complete'`
    ], { shell: true });
    dl.stdout.on('data', d => log('  ' + d.toString().trim()));
    dl.stderr.on('data', d => log('  err: ' + d.toString().trim()));
    dl.on('close', code => {
        if (code === 0) {
            log('✅ Downloaded. Running silent install...');
            const inst = spawn('powershell', [
                '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
                `Start-Process "$env:TEMP\\pg_installer.exe" -ArgumentList '--mode unattended --superpassword postgres --serverport 5432 --prefix C:\\PostgreSQL\\16' -Wait; Write-Host 'Install done'`
            ], { shell: true });
            inst.stdout.on('data', d => log('  ' + d.toString().trim()));
            inst.on('close', c => {
                log(c === 0 ? '✅ PostgreSQL installed via direct download!' : `⚠️ Installer exited: ${c}`);
                verifyService();
            });
        } else {
            log('❌ Download failed. Please install PostgreSQL manually from https://www.postgresql.org/download/windows/');
        }
    });
}

function verifyService() {
    log('\n🔍 Checking PostgreSQL service status...');
    const svc = spawn('powershell', [
        '-NoProfile', '-Command',
        'Get-Service -Name "postgresql*","postgresql-*" -ErrorAction SilentlyContinue | Format-Table Name,Status -AutoSize'
    ], { shell: true });
    svc.stdout.on('data', d => log('  ' + d.toString().trim()));
    svc.on('close', () => log('🏁 Done! Next: run setup-db'));
}
