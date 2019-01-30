import path from 'path';
import fs from 'fs-extra';
import EnvPaths from 'env-paths';
import { spawnSync } from 'child_process';

import { ProjectBuilder } from './project';

const envPaths = EnvPaths('clowdy');
const YARN = require.resolve('yarn/bin/yarn.js');

export interface Plugin {
  initialize(builder: ProjectBuilder): object;
}

function isClowdy(name: string): boolean {
  return name.startsWith('@clowdy/');
}

function packageBase(name: string): string {
  return name.replace(/^@clowdy\//, '');
}

function clowdyPackageName(name: string): string {
  return `@clowdy/plugin-${packageBase(name)}`;
}

let directoriesCreated = false;

function directories() {
  const dirs = {
    data: envPaths.data,
    node_modules: path.resolve(envPaths.data, 'node_modules'),
    yarnCacheDir: path.resolve(envPaths.cache, 'yarn')
  };

  if (!directoriesCreated) {
    for (const dir of Object.values(dirs)) {
      fs.mkdirsSync(dir);
    }
    directoriesCreated = true;
  }

  return dirs;
}

export const Plugin = {
  get cacheDir() {
    return directories().yarnCacheDir;
  },

  get lockFile() {
    return path.resolve(directories().data, 'yarn.lock');
  },

  get node_modules() {
    return directories().node_modules;
  },

  get rootDir() {
    return directories().data;
  },

  get(name: string): Plugin {
    if (!isClowdy(name)) {
      throw new Error(`Using plugin ${name}: Cannot use non-@clowdy plugins for now. Sorry!`);
    }

    if (process.env.NODE_ENV === 'development') {
      return require(path.resolve(__dirname, '..', '..', `plugin-${packageBase(name)}`)) as Plugin;
    }

    const packagePath = path.resolve(Plugin.node_modules, clowdyPackageName(name));

    try {
      require.resolve(packagePath);
    } catch (err) {
      Plugin.install(name);
    }

    return require(packagePath) as Plugin;
  },

  install(name: string): void {
    if (!isClowdy(name)) {
      throw new Error(`Installing plugin ${name}: Cannot use non-@clowdy plugins for now. Sorry!`);
    }

    console.log(`Installing ${name} plugin...`);

    const res = spawnSync(
      YARN,
      [
        'add',
        '--non-interactive',
        `--mutex=file:${Plugin.lockFile}`,
        `--preferred-cache-folder=${Plugin.cacheDir}`,
        '--json',
        clowdyPackageName(name)
      ],
      {
        cwd: Plugin.rootDir
      }
    );

    if (res.status !== 0 || res.error) {
      if (process.env.DEBUG) {
        console.log(`== PLUGIN INSTALL: ${name} ==`);
        console.log(`| STATUS: ${res.status}`);
        console.log('| OUTPUT [start]');
        console.log(
          res.output
            .filter(a => a)
            .map(a => a.toString())
            .join('')
        );
        console.log('| OUTPUT [end]');
        console.log('==========');
      }
      throw new Error(`Could not install the ${name} plugin.`);
    }

    console.log(`Installed ${name} plugin`);
  }
};
