import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , sourceArg = 'dist', targetArg = sourceArg] = process.argv;

const sourceDir = resolve(process.cwd(), sourceArg);
const targetDir = resolve(process.cwd(), targetArg);

if (!existsSync(sourceDir)) {
  throw new Error(`Source directory does not exist: ${sourceDir}`);
}

if (sourceDir !== targetDir) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

const indexPath = resolve(targetDir, 'index.html');
const notFoundPath = resolve(targetDir, '404.html');
const noJekyllPath = resolve(targetDir, '.nojekyll');

if (!existsSync(indexPath)) {
  throw new Error(`Could not find index.html in ${targetDir}`);
}

writeFileSync(notFoundPath, readFileSync(indexPath, 'utf8'));
writeFileSync(noJekyllPath, '');

console.log(`Prepared static output in ${targetDir}`);
