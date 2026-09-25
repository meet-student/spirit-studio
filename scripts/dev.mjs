import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const children = [
  start('api', process.execPath, ['server.mjs'], { cwd: root }),
  start('web', 'pnpm', ['--filter', '@eval/studio', 'dev']),
];

let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

await Promise.race(children.map(child => new Promise(resolve => child.once('exit', resolve))));
stop();

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    ...options,
    cwd: options.cwd instanceof URL ? filePath(options.cwd) : options.cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: process.env.PORT ?? '7337',
      MASTRA_PROXY_PORT: process.env.MASTRA_PROXY_PORT ?? '4111',
      MASTRA_SERVER_HOST: '127.0.0.1',
      MASTRA_SERVER_PORT: process.env.MASTRA_PROXY_PORT ?? '4111',
      MASTRA_API_PREFIX: '/internal/mastra',
      MASTRA_AUTO_DETECT_URL: 'true',
    },
  });
  child.stdout.on('data', chunk => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on('data', chunk => process.stderr.write(`[${name}] ${chunk}`));
  child.once('error', error => {
    process.stderr.write(`[${name}] ${error.message}\n`);
    process.exitCode = 1;
  });
  return child;
}

function filePath(url) {
  return fileURLToPath(url);
}
