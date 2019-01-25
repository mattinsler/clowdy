import path from 'path';
import lodash from 'lodash';
import { spawnSync } from 'child_process';

import {
  Cluster,
  ServiceGroup,
  Image,
  Link,
  Script,
  Service,
  Spec,
  Volume
} from './schema';

interface Plugin {
  initialize(builder: SchemaBuilder): object;
}

function installPlugin(name: string) {
  console.log(`Installing ${name} plugin...`);

  const packageName = (() => {
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
  })();

  const res = spawnSync('yarn', ['add', '--dev', packageName], {
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

function getPlugin(name: string): Plugin {
  const packageName = (() => {
    if (name.startsWith('@clowdy/')) {
      return `@clowdy/plugin-${name.replace(/^@clowdy\//, '')}`;
    } else {
      return `clowdy-plugin-${name}`;
    }
  })();

  const pluginPath = path.resolve(process.cwd(), 'node_modules', packageName);

  try {
    require.resolve(pluginPath);
  } catch (err) {
    installPlugin(name);
  }

  return require(pluginPath) as Plugin;
}

export namespace SchemaBuilder {
  export interface ServiceOptions {
    command: string | string[];
    environment?: { [key: string]: string };
    expose?: number[];
    hooks?: { [name: string]: string };
    image: string;
    links?: { [alias: string]: string };
    ports?: { [externalPort: string]: string | number };
    scripts?: { [name: string]: string };
    volumes?: { [containerPath: string]: Volume | string };
  }
}

export class SchemaBuilder {
  private _name: string;
  private _clusters: { [name: string]: Cluster } = {};
  private _serviceGroups: { [name: string]: ServiceGroup } = {};
  private _images: { [name: string]: Image } = {};
  private _scripts: { [name: string]: Script } = {};
  private _services: { [name: string]: Service } = {};

  private _plugins: { [name: string]: object } = {};

  constructor(projectName: string) {
    this._name = projectName;

    this.image = this.image.bind(this);
    this.plugin = this.plugin.bind(this);
    this.service = this.service.bind(this);
    this.volume = this.volume.bind(this);
  }

  get spec(): Spec {
    return {
      name: this._name,
      clusters: this._clusters,
      serviceGroups: this._serviceGroups,
      images: this._images,
      scripts: this._scripts,
      services: this._services
    };
  }

  // cluster = (
  //   name: string,
  //   opts: {
  //     ssh?: Pick<Cluster.SSH, 'host' | 'keyfile' | 'port' | 'username'>;
  //   } = {}
  // ): Cluster => {
  //   if (this._clusters[name]) {
  //     throw new Error();
  //   }

  //   this._clusters[name] = opts.ssh
  //     ? {
  //         ...opts.ssh,
  //         type: 'Cluster.SSH',
  //         name
  //       }
  //     : {
  //         type: 'Cluster.Local',
  //         name
  //       };

  //   return this._clusters[name];
  // };

  // group = (name: string, services: string[]): ServiceGroup => {
  //   if (this._serviceGroups[name]) {
  //     throw new Error();
  //   }

  //   this._serviceGroups[name] = {
  //     type: 'ServiceGroup',
  //     name,
  //     services
  //   };

  //   return this._serviceGroups[name];
  // };

  image(name: string, directory: string): void;
  image(name: string, dockerfile: string, opts: { context: string }): void;
  image(
    name: string,
    dockerfileOrDirectory: string,
    opts?: { context: string }
  ) {
    const image: Image = opts
      ? {
          context: opts.context,
          dockerfile: dockerfileOrDirectory,
          name,
          type: 'Image'
        }
      : {
          context: dockerfileOrDirectory,
          dockerfile: path.join(dockerfileOrDirectory, 'Dockerfile'),
          name,
          type: 'Image'
        };

    if (this._images[name]) {
      if (!lodash.isEqual(this._images[name], image)) {
        throw new Error(
          `Duplicate image name with a different configuration: ${name}`
        );
      }
    } else {
      this._images[name] = image;
    }
  }

  plugin(name: string) {
    if (this._plugins[name]) {
      return this._plugins[name];
    }

    const plugin = getPlugin(name);
    this._plugins[name] = plugin.initialize(this);

    return this._plugins[name];
  }

  // script = (
  //   name: string,
  //   opts: {
  //     command: string | string[];
  //     environment?: { [key: string]: string };
  //     image: string;
  //     links?: { [alias: string]: string };
  //     volumes?: { [containerPath: string]: Volume | string };
  //   }
  // ): Script => {
  //   if (this._scripts[name]) {
  //     throw new Error();
  //   }

  //   this._scripts[name] = {
  //     ...opts,
  //     type: 'Script',
  //     name,
  //     environment: opts.environment || {},
  //     links: Object.entries(opts.links || {}).map(([k, v]) => {
  //       return {
  //         type: 'Link',
  //         alias: k,
  //         target: v
  //       } as Link;
  //     }),
  //     volumes: Object.entries(opts.volumes || {}).reduce(
  //       (o, [k, v]) => {
  //         o[k] =
  //           typeof v === 'string' ? { type: 'Volume.Local', directory: v } : v;
  //         return o;
  //       },
  //       {} as { [path: string]: Volume }
  //     )
  //   };

  //   return this._scripts[name];
  // };

  service(name: string, opts: SchemaBuilder.ServiceOptions): void;
  service(
    name: string,
    env: 'dev' | 'test' | 'prod',
    opts: SchemaBuilder.ServiceOptions
  ): void;
  service(name: string, ...args: any[]) {
    const [env, opts] = ((): [
      'dev' | 'test' | 'prod',
      SchemaBuilder.ServiceOptions
    ] => {
      if (args.length === 1) {
        return ['prod', args[0]];
      } else {
        return [args[0], args[1]];
      }
    })();

    const key = `${env}|${name}`;

    if (this._services[key]) {
      throw new Error(
        `Duplicate ${env} service name with a different configuration: ${name}`
      );
    }

    this._services[key] = {
      ...opts,
      type: 'Service',
      env,
      name,
      environment: opts.environment || {},
      expose: opts.expose || [],
      hooks: opts.hooks || {},
      links: Object.entries(opts.links || {}).map(([k, v]) => {
        return {
          type: 'Link',
          alias: k,
          target: v
        } as Link;
      }),
      ports: Object.entries(opts.ports || {}).reduce((o, [k, v]) => {
        o[k] = v.toString();
        return o;
      }, {}),
      scripts: opts.scripts || {},
      volumes: Object.entries(opts.volumes || {}).reduce(
        (o, [k, v]) => {
          o[k] =
            typeof v === 'string' ? { type: 'Volume.Local', directory: v } : v;
          return o;
        },
        {} as { [path: string]: Volume }
      )
    };
  }

  volume(name: string): Volume {
    return { type: 'Volume.Docker', volumeName: name };
  }
}
