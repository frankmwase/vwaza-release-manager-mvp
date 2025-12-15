const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

function run(command, cwd) {
    console.log(`\n> Running: ${command} in ${cwd}`);
    try {
        execSync(command, { stdio: 'inherit', cwd });
    } catch (err) {
        console.error(`Error running command: ${command}`);
        process.exit(1);
    }
}

console.log('--- Vwaza MVP Setup ---');

// 1. Check Env
if (!fs.existsSync(path.join(backendDir, '.env'))) {
    console.warn('\n  WARNING: backend/.env file not found!');
    console.warn('   Please create one based on .env.example (if available) or documentation.');
    // We don't exit here, just warn, as they might have set it up manually.
}

// 2. Install Dependencies
console.log('\n Installing Root Dependencies (concurrently)...');
run('npm install', rootDir);

console.log('\n Installing Backend Dependencies...');
run('npm install', backendDir);

console.log('\n Installing Frontend Dependencies...');
run('npm install', frontendDir);

// 3. Setup Database
console.log('\n  Initializing Database...');
run('npm run setup-db', backendDir);
run('npm run migrate', backendDir);

console.log('\n Setup Complete! Run "npm run dev" to start the project.');
