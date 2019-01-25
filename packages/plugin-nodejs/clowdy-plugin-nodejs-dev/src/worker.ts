import { ChildProcess, spawn } from 'child_process';

let proc: ChildProcess;

// ignore because this is sent with Control-C to the master. we want to wait for sigterm
process.on('SIGINT', () => {});
process.on('SIGTERM', () => proc && process.kill(-proc.pid));

process.on('message', async ([cwd, argv]: [string, string[]]) => {
  if (!proc) {
    proc = spawn(argv[0], argv.slice(1), {
      cwd,
      detached: true,
      env: process.env,
      stdio: 'inherit'
    });

    proc.on('exit', (code: number, signal: string) => process.exit(code));
  }
});
