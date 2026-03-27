const fs = require('fs');
const http = require('http');

// Check PostgreSQL installation
const pgPaths = [
    'C:\\Program Files\\PostgreSQL',
    'C:\\Program Files (x86)\\PostgreSQL'
];

console.log('=== Checking PostgreSQL installation ===');
pgPaths.forEach(p => {
    try {
        const v = fs.readdirSync(p);
        console.log('PG FOUND at ' + p + ': versions = ' + v.join(', '));
    } catch(e) {
        console.log('PG NOT at ' + p);
    }
});

// Check pg module
console.log('\n=== Checking npm modules ===');
try {
    require('pg');
    console.log('pg module: OK');
} catch(e) {
    console.log('pg module: MISSING - ' + e.message);
}

// Check node_modules exists
try {
    const mods = fs.readdirSync('./node_modules').slice(0, 10);
    console.log('node_modules: OK (' + mods.join(', ') + '...)');
} catch(e) {
    console.log('node_modules: MISSING');
}

// Keep alive so preview can capture logs
const server = http.createServer((req, res) => {
    res.end('check done');
});
server.listen(3001, () => {
    console.log('\n=== Check complete — server alive on 3001 ===');
});
