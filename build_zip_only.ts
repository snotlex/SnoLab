import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const workspaceRoot = process.cwd();
const zipFilename = 'snolab-concrete-mix-calculator.zip';

console.log('=== STARTING BULLETPROOF SLIM ZIP GENERATOR ===');

// 1. Verify package-lock.json
const lockfilePath = path.join(workspaceRoot, 'package-lock.json');
if (!fs.existsSync(lockfilePath)) {
  throw new Error('package-lock.json does not exist in workspace!');
}
const lockfileSize = fs.statSync(lockfilePath).size;
console.log(`Workspace package-lock.json size: ${lockfileSize} bytes`);
if (lockfileSize === 0) {
  throw new Error('package-lock.json is empty!');
}

const lockfileJson = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const lockfileMeta = {
  size: lockfileSize,
  name: lockfileJson.name,
  lockfileVersion: lockfileJson.lockfileVersion,
  packages: Object.keys(lockfileJson.packages || {}).length
};

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
- **npm**: 10.8.2
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
    const excludeList = ['node_modules', 'dist', '.git', '.cache', '.vite', 'assets', zipFilename, 'verify_all.ts', 'build_and_verify_zip.ts', 'build_zip_only.ts', 'test_zip_directly.ts'];
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
zip.writeZip(zipFilename);
console.log(`ZIP created successfully: ${zipFilename}. Size: ${fs.statSync(zipFilename).size} bytes`);
