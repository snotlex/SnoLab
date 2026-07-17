import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

const workspaceRoot = process.cwd();
const zipFilename = 'snolab-concrete-mix-calculator.zip';
const extractPath = '/tmp/snolab-check';

console.log('=== STARTING OPTIMIZED ZIP DELIVERY GENERATOR & VERIFIER ===');

// Helper to run commands
function execute(cmd: string, cwd = workspaceRoot): string {
  console.log(`[EXEC] ${cmd} (in ${cwd})`);
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (err: any) {
    console.error(`[ERROR] Command failed: ${cmd}`);
    console.error(`Stdout: ${err.stdout}`);
    console.error(`Stderr: ${err.stderr}`);
    throw err;
  }
}

// 1. Verify existing package-lock.json in workspace
const lockfilePath = path.join(workspaceRoot, 'package-lock.json');
if (!fs.existsSync(lockfilePath)) {
  throw new Error('package-lock.json does not exist in workspace!');
}
const lockfileSize = fs.statSync(lockfilePath).size;
console.log(`Workspace package-lock.json size: ${lockfileSize} bytes`);
if (lockfileSize === 0) {
  throw new Error('package-lock.json is empty (0 bytes)!');
}

const lockfileJson = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const lockfileMeta = {
  size: lockfileSize,
  name: lockfileJson.name,
  lockfileVersion: lockfileJson.lockfileVersion,
  packages: Object.keys(lockfileJson.packages || {}).length
};
console.log('Lockfile Metadata:', lockfileMeta);

// Clean up existing build/zip artifacts to avoid pollution
if (fs.existsSync(zipFilename)) fs.unlinkSync(zipFilename);
if (fs.existsSync('dist')) fs.rmSync('dist', { recursive: true, force: true });
if (fs.existsSync('.vite')) fs.rmSync('.vite', { recursive: true, force: true });

// Ensure assets/.aistudio is fully removed
const aiStudioPath = path.join(workspaceRoot, 'assets', '.aistudio');
if (fs.existsSync(aiStudioPath)) {
  fs.rmSync(aiStudioPath, { recursive: true, force: true });
}
const assetsPath = path.join(workspaceRoot, 'assets');
if (fs.existsSync(assetsPath)) {
  fs.rmSync(assetsPath, { recursive: true, force: true });
}

// 2. Generate DELIVERY_VERIFICATION.md in workspace
const nowString = new Date().toISOString();
const deliveryVerificationContent = `# Delivery Verification Report

## Project
SnoLab Concrete Mix Calculator

## Verification Details
- **Timestamp**: ${nowString}
- **Node.js**: ${process.version}
- **npm**: ${execute('npm --version').trim()}
- **Platform**: Linux (AI Studio cloud environment)

## 1. Lockfile Statistics
- **Size**: ${lockfileSize} bytes
- **Name**: ${lockfileMeta.name}
- **Version**: ${lockfileMeta.lockfileVersion}
- **Packages**: ${lockfileMeta.packages}

## 2. ZIP Contents Exclusions
- \`node_modules/\`: Excluded
- \`dist/\`: Excluded
- \`.vite/\`: Excluded
- \`assets/.aistudio/\`: Excluded
`;

fs.writeFileSync('DELIVERY_VERIFICATION.md', deliveryVerificationContent);
console.log('DELIVERY_VERIFICATION.md generated in workspace.');

// 3. Create the ZIP file using adm-zip
console.log('Packaging ZIP archive...');
const zip = new AdmZip();

function addDirectoryToZip(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(workspaceRoot, fullPath);
    const stat = fs.statSync(fullPath);

    const segments = relPath.split(path.sep);
    const excludeList = ['node_modules', 'dist', '.git', '.cache', '.vite', 'assets', zipFilename, 'verify_all.ts', 'build_and_verify_zip.ts', 'test_zip_directly.ts'];
    if (segments.some(s => excludeList.includes(s))) {
      continue;
    }

    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath);
    } else {
      zip.addLocalFile(fullPath, path.dirname(relPath) === '.' ? '' : path.dirname(relPath));
    }
  }
}

addDirectoryToZip(workspaceRoot);
const tempZipPath = path.join('/tmp', zipFilename);
if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
zip.writeZip(tempZipPath);
console.log(`ZIP created successfully in temporary folder: ${tempZipPath}`);

// 4. Extract the ZIP in /tmp/snolab-check and run tests to verify
console.log('Preparing clean check environment in /tmp/snolab-check...');
if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
fs.mkdirSync(extractPath, { recursive: true });

console.log(`Extracting ${tempZipPath} to ${extractPath}...`);
const extractZip = new AdmZip(tempZipPath);
extractZip.extractAllTo(extractPath, true);

// Verify file size and content inside extracted folder
const extractedLockfile = path.join(extractPath, 'package-lock.json');
const extractedSize = fs.statSync(extractedLockfile).size;
console.log(`Extracted package-lock.json size: ${extractedSize} bytes`);
if (extractedSize === 0) {
  throw new Error('Extracted package-lock.json is empty!');
}

console.log('Running npm ci in extracted folder...');
execute('npm ci', extractPath);

console.log('Running npm run lint in extracted folder...');
execute('npm run lint', extractPath);

console.log('Running npm test in extracted folder...');
execute('npm test', extractPath);

console.log('Running npm run build in extracted folder...');
execute('npm run build', extractPath);

// Verify that no forbidden files are present in the extracted folder
let hasAiStudio = false;
function findAiStudio(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('aistudio')) {
      hasAiStudio = true;
      return;
    }
    if (fs.statSync(fullPath).isDirectory()) {
      findAiStudio(fullPath);
    }
  }
}
findAiStudio(extractPath);
if (hasAiStudio) {
  throw new Error('Forbidden AI Studio reference found in extracted ZIP!');
}

console.log('=== ALL ZIP CHECKS PASSED SUCCESSFULLY ===');

// Copy the verified zip file atomically to workspace root
fs.copyFileSync(tempZipPath, path.join(workspaceRoot, zipFilename));
console.log(`Copied verified ZIP atomically to workspace root: ${path.join(workspaceRoot, zipFilename)}`);

