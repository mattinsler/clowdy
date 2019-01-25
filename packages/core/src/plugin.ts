import path from 'path';
import { execSync, spawnSync } from 'child_process';

import { ProjectBuilder } from './project';

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

let _node_modules: string;

export const Plugin = {
  get node_modules() {
    if (!_node_modules) {
      _node_modules = execSync('npm root -g')
        .toString()
        .trim();
    }
    return _node_modules;
  },

  get(name: string): Plugin {
    if (!isClowdy(name)) {
      throw new Error(
        `Using plugin ${name}: Cannot use non-@clowdy plugins for now. Sorry!`
      );
    }

    if (process.env.NODE_ENV === 'development') {
      return require(path.resolve(
        __dirname,
        '..',
        '..',
        `plugin-${packageBase(name)}`
      )) as Plugin;
    }

    const packagePath = path.resolve(
      Plugin.node_modules,
      clowdyPackageName(name)
    );

    try {
      require.resolve(packagePath);
    } catch (err) {
      Plugin.install(name);
    }

    return require(packagePath) as Plugin;
  },

  install(name: string): void {
    if (!isClowdy(name)) {
      throw new Error(
        `Installing plugin ${name}: Cannot use non-@clowdy plugins for now. Sorry!`
      );
    }

    console.log(`Installing ${name} plugin...`);

    const res = spawnSync(
      'npm',
      ['install', '--global', '--parseable', clowdyPackageName(name)],
      {
        env: {
          CI: '1'
        }
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
