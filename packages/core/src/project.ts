import fs from 'fs';
import vm from 'vm';
import path from 'path';
import lodash from 'lodash';

import { Plugin } from './plugin';
import { Schematic } from './schematic';

export interface Project {
  readonly clusters: ReadonlyMap<string, Schematic.Cluster>;
  readonly images: ReadonlyMap<string, Schematic.Image>;
  readonly name: string;
  readonly services: ReadonlyMap<string, Schematic.Service>;
}

export interface ProjectBuilder {
  image(name: string, directory: string): Schematic.Image;
  image(
    name: string,
    dockerfile: string,
    opts: { context: string }
  ): Schematic.Image;

  plugin(name: string): object;

  project(name: string): void;

  service(name: string, opts: ProjectBuilder.ServiceOptions): Schematic.Service;
  service(
    name: string,
    mode: Schematic.Mode,
    opts: ProjectBuilder.ServiceOptions
  ): Schematic.Service;

  volume(name: string): Schematic.Volume;
}

interface ProjectBuilderInternal extends ProjectBuilder {
  getProject(): Project;
}

export namespace ProjectBuilder {
  export interface ServiceOptions {
    command: string | string[];
    cwd?: string;
    environment?: { [key: string]: string };
    expose?: number[];
    // hooks?: { [name: string]: string };
    image: string;
    links?: { [alias: string]: string };
    // ports?: { [externalPort: string]: string | number };
    // scripts?: { [name: string]: string };
    volumes?: { [containerPath: string]: Schematic.Volume | string };
  }
}

function projectBuilder(name: string): ProjectBuilderInternal {
  let builder: ProjectBuilderInternal;

  const clusters = new Map<string, Schematic.Cluster>();
  const images = new Map<string, Schematic.Image>();
  const plugins = new Map<string, object>();
  const services = new Map<string, Schematic.Service>();

  function plugin(name: string) {
    if (!plugins.has(name)) {
      const plugin = Plugin.get(name);
      plugins.set(name, plugin.initialize(builder));
    }

    return plugins.get(name);
  }

  function image(
    name: string,
    dockerfileOrDirectory: string,
    opts?: { context: string }
  ) {
    const schematic: Schematic.Image = opts
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

    if (images.has(name)) {
      if (!lodash.isEqual(images.get(name), schematic)) {
        throw new Error(
          `Duplicate image name with a different configuration: ${name}`
        );
      }
    } else {
      images.set(name, schematic);
    }

    return schematic;
  }

  function project(projectName: string) {
    name = projectName;
  }

  function service(name: string, ...args: any[]) {
    const [mode, opts] = ((): [
      Schematic.Mode,
      ProjectBuilder.ServiceOptions
    ] => {
      if (args.length === 1) {
        return ['prod', args[0]];
      } else {
        return [args[0], args[1]];
      }
    })();

    const key = `${mode}|${name}`;

    if (services.has(key)) {
      throw new Error(
        `Duplicate service named ${name} already exists in ${mode} mode.`
      );
    }

    if (!/:[^:\/]+$/.exec(opts.image)) {
      opts.image = `${opts.image}:latest`;
    }

    const schematic: Schematic.Service = {
      command: (Array.isArray(opts.command)
        ? opts.command
        : [opts.command]
      ).filter(a => a),
      cwd: opts.cwd,
      environment: opts.environment || {},
      expose: opts.expose || [],
      image: opts.image,
      links: opts.links || {},
      mode,
      name,
      type: 'Service',
      volumes: Object.entries(opts.volumes || {}).reduce(
        (o, [k, v]) => {
          o[k] =
            typeof v === 'string' ? { type: 'Volume.Local', directory: v } : v;
          return o;
        },
        {} as { [path: string]: Schematic.Volume }
      )
    };

    services.set(key, schematic);

    return schematic;
  }

  function volume(name: string): Schematic.Volume {
    return { type: 'Volume.Docker', volumeName: name };
  }

  builder = {
    image,
    plugin,
    project,
    getProject(): Project {
      return {
        clusters,
        images,
        name,
        services
      };
    },
    service,
    volume
  };

  return builder;
}

const ALLOWED_MODULES = new Set<string>([
  'crypto',
  'dns',
  'fs',
  'net',
  'os',
  'path',
  'stream',
  'url',
  'zlib'
]);

function sanitizedRequire(): NodeRequire {
  const requireFunction = (id: string): any => {
    if (ALLOWED_MODULES.has(id)) {
      return require(id);
    }
    throw new Error(`Module ${id} is now allowed to be required.`);
  };

  const resolve = (id: string, options?: { paths?: string[] }): string => {
    throw new Error('Not available');
  };

  const extensions = {
    '.js': (m: NodeModule, filename: string) => {
      throw new Error('Not available');
    },
    '.json': (m: NodeModule, filename: string) => {
      throw new Error('Not available');
    },
    '.node': (m: NodeModule, filename: string) => {
      throw new Error('Not available');
    }
    // [ext: string]: (m: NodeModule, filename: string) => { throw new Error('Not available'); }
  } as any;

  return Object.assign(requireFunction, {
    resolve: Object.assign(resolve, {
      paths: (request: string): string[] | null => {
        throw new Error('Not available');
      }
    }),
    cache: {},
    extensions,
    main: undefined
  }) as any;
}

export class Project {
  static empty(name: string): Project {
    return {
      clusters: new Map<string, Schematic.Cluster>(),
      images: new Map<string, Schematic.Image>(),
      name,
      services: new Map<string, Schematic.Service>()
    };
  }

  static from(filename: string, name: string = undefined): Project {
    filename = path.resolve(filename);
    if (!fs.existsSync(filename)) {
      throw new Error(`Project config file does not exist at ${filename}.`);
    }

    name = name || path.basename(path.dirname(filename));
    const builder = projectBuilder(name);

    vm.runInNewContext(
      fs.readFileSync(filename, 'utf8'),
      {
        ...builder,
        console,
        require: sanitizedRequire(),
        __dirname: path.dirname(filename),
        __filename: filename
      },
      { filename: filename }
    );

    return builder.getProject();
  }
}
