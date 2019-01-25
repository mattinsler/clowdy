import { EOL } from 'os';
import * as execa from 'execa';
import * as cluster from 'cluster';
import JSONStream from 'JSONStream';
import { color } from '@oclif/color';
import * as chokidar from 'chokidar';

interface WorkerOptions {
  debounce: number;
}

interface Options {
  watchFiles: boolean;
  watchPackage: boolean;
  worker: WorkerOptions;
}

const ReadEnv = {
  boolean(name: string, defaultValue: boolean): boolean {
    return process.env[name] !== undefined
      ? Boolean(~['1', 'yes', 'true'].indexOf(process.env[name].toLowerCase()))
      : defaultValue;
  },
  integer(name: string, defaultValue: number): number {
    return process.env[name] &&
      Number.parseInt(process.env[name], 10).toString() === process.env[name]
      ? Number.parseInt(process.env[name], 10)
      : defaultValue;
  },
  string(name: string, defaultValue: string): string {
    return process.env[name] !== undefined ? process.env[name] : defaultValue;
  }
};

function readOptionsFromEnv(): Options {
  const opts: Options = {
    watchFiles: ReadEnv.boolean('WATCH_FILES', true),
    watchPackage: ReadEnv.boolean('WATCH_PACKAGE', true),
    worker: {
      debounce: ReadEnv.integer('WORKER_DEBOUNCE', 2500)
    }
  };

  if (ReadEnv.boolean('WATCH', true) === false) {
    opts.watchFiles = false;
    opts.watchPackage = false;
  }

  return opts;
}

class Worker {
  private readonly cwd: string;
  private readonly argv: string[];
  private readonly opts: WorkerOptions;

  private worker: cluster.Worker;
  private restartTimeoutId: NodeJS.Timeout;

  constructor(cwd: string, argv: string[], opts: WorkerOptions) {
    this.cwd = cwd;
    this.argv = argv;
    this.opts = opts;
  }

  start(): Promise<void> {
    return new Promise(resolve => {
      this.worker = cluster.fork();

      this.worker.on('online', () => {
        console.log(
          `[Worker ${this.worker.id} ${this.worker.process.pid}] started`
        );
        this.worker.send([this.cwd, this.argv]);
        resolve();
      });

      this.worker.once('exit', () => {
        console.log(
          `[Worker ${this.worker.id} ${this.worker.process.pid}] exited`
        );
        delete this.worker;
      });
    });
  }

  stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.worker) {
        this.worker.once('exit', () => resolve());
        this.worker.kill('SIGTERM');
      } else {
        resolve();
      }
    });
  }

  restart(rightNow = false) {
    const execute = async () => {
      if (this.restartTimeoutId) {
        clearTimeout(this.restartTimeoutId);
        delete this.restartTimeoutId;
      }

      await this.stop();
      await this.start();
    };

    if (rightNow) {
      execute();
    } else {
      if (!this.restartTimeoutId) {
        this.restartTimeoutId = setTimeout(execute, this.opts.debounce);
      }
    }
  }
}

// Runs a yarn install and returns a boolean says whether the installed packages changed
function install(dirname: string): Promise<boolean> {
  console.log('Installing dependencies...');
  return new Promise((resolve, reject) => {
    let changed = false;
    const proc = execa.shell(`yarn install --non-interactive --json`, {
      cwd: dirname
    });

    proc.stdout
      .pipe(JSONStream.parse())
      .on('data', (status: { type: string; data: string | Object }) => {
        if (status.type === 'success') {
          console.log(status.data);
          if (status.data === 'Already up-to-date.') {
            changed = false;
          } else if (status.data === 'Saved lockfile.') {
            changed = true;
          }
        }
      });

    // report errors in here somewhere?

    proc.once('exit', () => {
      if (changed) {
        console.log('Packages changed');
      } else {
        console.log('Packages did not change');
      }
      resolve(changed);
    });
  });
}

export async function master(cwd: string, argv: string[]) {
  const opts = readOptionsFromEnv();

  console.log(
    [
      '',
      color.bold('== NODEJS DEV =='),
      '',
      `  root directory:     ${color.cyan(cwd)}`,
      `  command:            ${color.cyan(JSON.stringify(argv))}`,
      '',
      color.underline('Watches'),
      `  package.json?       ${
        opts.watchPackage ? color.green('yes') : color.red('no')
      }`,
      `  other files?        ${
        opts.watchFiles ? color.green('yes') : color.red('no')
      }`,
      '',
      color.underline('Worker'),
      `  debounce interval:  ${color.cyan(opts.worker.debounce.toString())}`,
      '',
      color.bold('================'),
      ''
    ].join(EOL)
  );

  const worker = new Worker(cwd, argv, opts.worker);

  if (opts.watchPackage) {
    const packageWatcher = chokidar.watch('**/package.json', {
      atomic: 500,
      awaitWriteFinish: true,
      cwd,
      ignored: /node_modules/,
      persistent: true
    });

    packageWatcher.on('ready', async () => {
      packageWatcher.on('all', async (type: string, filename: string) => {
        if (~['change', 'add'].indexOf(type)) {
          if (await install(cwd)) {
            worker.restart(true);
          }
        }
      });

      await install(cwd);
      worker.start();
    });
  }

  if (opts.watchFiles) {
    const fileWatcher = chokidar.watch('.', {
      cwd,
      ignored: /(node_modules|package.json)/,
      persistent: true
    });

    fileWatcher.on('ready', () => {
      fileWatcher.on('all', (type: string, filename: string) => {
        console.log({ type, filename });
        if (~['add', 'change', 'unlink', 'addDir', 'unlinkDir'].indexOf(type)) {
          worker.restart();
        }
      });
    });
  }

  if (!opts.watchFiles && !opts.watchPackage) {
    await install(cwd);
    worker.start();
  }

  process.on('SIGINT', async () => {
    await worker.stop();
    process.exit();
  });
}
