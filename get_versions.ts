import { execSync } from 'child_process';

try {
  const nodeVersion = execSync('node -v', { encoding: 'utf8' }).trim();
  const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
  console.log(`Node version: ${nodeVersion}`);
  console.log(`npm version: ${npmVersion}`);
} catch (e: any) {
  console.error('Failed to get versions:', e.message);
}
