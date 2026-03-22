import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [, , buildKind = 'production'] = process.argv;

const viteBinary = process.platform === 'win32'
  ? resolve(process.cwd(), 'node_modules', '.bin', 'vite.cmd')
  : resolve(process.cwd(), 'node_modules', '.bin', 'vite');

const result = spawnSync(`"${viteBinary}" build`, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    VITE_BASE_PATH: './',
    VITE_BUILD_KIND: buildKind,
  },
  shell: true,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
