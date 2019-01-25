import path from 'path';
import { spawnSync } from 'child_process';

import { ProjectBuilder } from './project';

export interface Plugin {
  initialize(builder: ProjectBuilder): object;
}

export class Plugin {
  static get(name: string): Plugin {
    if (Plugin.isClowdy(name)) {
      const basename = name.replace(/^@clowdy\//, '');
      if (process.env.NODE_ENV === 'development') {
        return require(path.resolve(
          __dirname,
          '..',
          '..',
          `plugin-${basename}`
        )) as Plugin;
      } else {
        throw new Error('Not implemented, set "NODE_ENV=development" please');
      }
    }

    const packageName = Plugin.packageName(name);
    const pluginPath = path.resolve(process.cwd(), 'node_modules', packageName);

    try {
      require.resolve(pluginPath);
    } catch (err) {
      Plugin.install(name);
    }

    return require(pluginPath) as Plugin;
  }

  static install(name: string): void {
    console.log(`Installing ${name} plugin...`);

    const installName = Plugin.packageInstallName(name);
    const res = spawnSync('yarn', ['add', '--dev', installName], {
      cwd: process.cwd()
    });

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

  static isClowdy(name: string): boolean {
    return name.startsWith('@clowdy/');
  }

  // @clowdy/foo => @clowdy/plugin-foo
  // foo => clowdy-plugin-foo
  static packageName(name: string): string {
    if (name.startsWith('@clowdy/')) {
      return `@clowdy/plugin-${name.replace(/^@clowdy\//, '')}`;
    } else {
      return `clowdy-plugin-${name}`;
    }
  }

  static packageInstallName(name: string): string {
    if (name.startsWith('@clowdy/')) {
      const basename = name.replace(/^@clowdy\//, '');

      if (process.env.NODE_ENV === 'development') {
        return path.resolve(__dirname, '..', '..', `plugin-${basename}`);
      } else {
        return `@clowdy/plugin-${basename}`;
      }
    } else {
      return `clowdy-plugin-${name}`;
    }
  }
}
