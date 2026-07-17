import fs from 'fs';
import path from 'path';

const lockfilePath = path.join(process.cwd(), 'package-lock.json');

if (!fs.existsSync(lockfilePath)) {
  console.log('package-lock.json does NOT exist!');
  process.exit(1);
}

const stats = fs.statSync(lockfilePath);
console.log(`Lockfile Size: ${stats.size} bytes`);

try {
  const content = fs.readFileSync(lockfilePath, 'utf8');
  if (stats.size === 0) {
    console.log('Lockfile is empty (0 bytes).');
    process.exit(1);
  }
  const p = JSON.parse(content);
  console.log('Lockfile verification output:');
  console.log(JSON.stringify({
    name: p.name,
    lockfileVersion: p.lockfileVersion,
    packages: Object.keys(p.packages || {}).length
  }, null, 2));
} catch (e: any) {
  console.error('Failed to parse package-lock.json:', e.message);
  process.exit(1);
}
