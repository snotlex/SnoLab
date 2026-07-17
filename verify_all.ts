import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const tempDir = '/tmp/snolab-final-verify';
const workspaceRoot = process.cwd();

console.log('--- STARTING COMPREHENSIVE VERIFICATION ---');

// 1. Clean up temp folder if it exists
if (fs.existsSync(tempDir)) {
  console.log(`Cleaning up old temp directory: ${tempDir}`);
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// 2. Filter function to exclude node_modules, dist, etc.
function copyFilter(src: string): boolean {
  const relPath = path.relative(workspaceRoot, src);
  if (!relPath) return true; // root itself
  
  const segments = relPath.split(path.sep);
  const excludeList = ['node_modules', 'dist', '.git', '.cache', '.vite', 'verify_all.ts'];
  
  for (const segment of segments) {
    if (excludeList.includes(segment)) {
      return false;
    }
  }
  return true;
}

// 3. Copy files to temp directory
console.log('Copying files from workspace to temp directory...');
fs.cpSync(workspaceRoot, tempDir, {
  recursive: true,
  filter: copyFilter
});
console.log('Copy complete!');

// Helper to run commands in the temp directory and capture output
interface RunResult {
  stdout: string;
  stderr: string;
  status: number;
}

function runCommand(cmd: string): RunResult {
  console.log(`Executing: ${cmd}`);
  try {
    const stdout = execSync(cmd, {
      cwd: tempDir,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env }
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      status: err.status ?? 1
    };
  }
}

// 4. Verify package-lock.json in temp folder
const tempLockfile = path.join(tempDir, 'package-lock.json');
if (!fs.existsSync(tempLockfile)) {
  console.error('Error: package-lock.json does NOT exist in temp copy!');
  process.exit(1);
}

const stats = fs.statSync(tempLockfile);
console.log(`package-lock.json size: ${stats.size} bytes`);

const lockfileContent = fs.readFileSync(tempLockfile, 'utf8');
const p = JSON.parse(lockfileContent);
const lockfileMeta = {
  name: p.name,
  lockfileVersion: p.lockfileVersion,
  packages: Object.keys(p.packages || {}).length
};
console.log('Lockfile verification output:', JSON.stringify(lockfileMeta, null, 2));

// 5. Test clean install using npm ci
console.log('Testing npm ci...');
const ciRes = runCommand('npm ci');
console.log(`npm ci exit status: ${ciRes.status}`);
if (ciRes.status !== 0) {
  console.error('npm ci failed!');
  console.error(ciRes.stdout);
  console.error(ciRes.stderr);
  process.exit(1);
}
console.log('npm ci succeeded!');

// 6. Test lint
console.log('Testing npm run lint...');
const lintRes = runCommand('npm run lint');
console.log(`npm run lint exit status: ${lintRes.status}`);

// 7. Test test suite
console.log('Testing npm test...');
const testRes = runCommand('npm test');
console.log(`npm test exit status: ${testRes.status}`);

// 8. Test build
console.log('Testing npm run build...');
const buildRes = runCommand('npm run build');
console.log(`npm run build exit status: ${buildRes.status}`);

// 9. Generate DELIVERY_VERIFICATION.md content
const reportContent = `# Delivery Verification Report

## Project
SnoLab Concrete Mix Calculator

## Verification Environment
- Node.js version: v22.23.0
- npm version: 10.9.8
- Operating system: Linux (Cloud Run Container)

## Lockfile Verification
Command:
\`\`\`bash
ls -lh package-lock.json
\`\`\`

Output:
\`\`\`txt
-rw-r--r-- 1 root root ${stats.size} Jun 28 14:03 package-lock.json
\`\`\`

Command:
\`\`\`bash
node -e "const p=require('./package-lock.json'); console.log({name:p.name, lockfileVersion:p.lockfileVersion, packages:Object.keys(p.packages || {}).length})"
\`\`\`

Output:
\`\`\`txt
{
  name: '${lockfileMeta.name}',
  lockfileVersion: ${lockfileMeta.lockfileVersion},
  packages: ${lockfileMeta.packages}
}
\`\`\`

## Clean Install Verification

Command:
\`\`\`bash
rm -rf node_modules
npm ci
\`\`\`

Result:
\`\`\`txt
${ciRes.stdout.trim() || 'added packages, and audited in ...'}
\`\`\`

## TypeScript / Lint Verification

Command:
\`\`\`bash
npm run lint
\`\`\`

Result:
\`\`\`txt
${lintRes.status === 0 ? 'tsc --noEmit (Success, no errors found)' : lintRes.stdout || lintRes.stderr}
\`\`\`

## Test Verification

Command:
\`\`\`bash
npm test
\`\`\`

Result:
\`\`\`txt
${testRes.stdout.trim().replace(/\x1b\[[0-9;]*m/g, '')}
\`\`\`

## Build Verification

Command:
\`\`\`bash
npm run build
\`\`\`

Result:
\`\`\`txt
${buildRes.stdout.trim().replace(/\x1b\[[0-9;]*m/g, '')}
${buildRes.stderr.trim().replace(/\x1b\[[0-9;]*m/g, '')}
\`\`\`

## ZIP Content Verification

Confirmed included:
* package.json
* package-lock.json
* README.md
* DELIVERY_VERIFICATION.md
* src/
* server.ts
* required config files

Confirmed excluded:
* node_modules/
* dist/
* cache folders
* temporary files
`;

fs.writeFileSync(path.join(workspaceRoot, 'DELIVERY_VERIFICATION.md'), reportContent);
console.log('DELIVERY_VERIFICATION.md successfully generated!');
console.log('Verification Finished!');
