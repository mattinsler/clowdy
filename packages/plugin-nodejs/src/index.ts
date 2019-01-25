import path from 'path';
import { ProjectBuilder } from '@clowdy/core';

function parse(
  args:
    | [string, Partial<ProjectBuilder.ServiceOptions>?]
    | [Partial<ProjectBuilder.ServiceOptions>?]
): {
  dirname: string;
  opts: Partial<ProjectBuilder.ServiceOptions>;
} {
  let dirname: string;
  let opts: Partial<ProjectBuilder.ServiceOptions>;

  if (typeof args[0] === 'string') {
    dirname = args[0];
    opts = args[1] || {};
  } else {
    dirname = '.';
    opts = args[0] || {};
  }

  dirname = path.isAbsolute(dirname)
    ? dirname
    : path.resolve(process.cwd(), dirname);

  return { dirname, opts };
}

export function initialize(
  builder: ProjectBuilder
): {
  dev(name: string, opts?: Partial<ProjectBuilder.ServiceOptions>): void;
  dev(
    name: string,
    dirname: string,
    opts?: Partial<ProjectBuilder.ServiceOptions>
  ): void;
  test(name: string, opts?: Partial<ProjectBuilder.ServiceOptions>): void;
  test(
    name: string,
    dirname: string,
    opts?: Partial<ProjectBuilder.ServiceOptions>
  ): void;
  prod(name: string, opts?: Partial<ProjectBuilder.ServiceOptions>): void;
  prod(
    name: string,
    dirname: string,
    opts?: Partial<ProjectBuilder.ServiceOptions>
  ): void;
} {
  return {
    dev(
      name: string,
      ...args:
        | [string, Partial<ProjectBuilder.ServiceOptions>?]
        | [Partial<ProjectBuilder.ServiceOptions>?]
    ) {
      const { dirname, opts } = parse(args);

      builder.image(
        'clowdy-plugin-nodejs-dev',
        path.resolve(__dirname, '..', 'clowdy-plugin-nodejs-dev')
      );

      builder.service(name, 'dev', {
        command: opts.command || ['yarn', 'dev'],
        environment: {
          NODE_ENV: 'development',
          ...opts.environment
          // YARN_CACHE_FOLDER: '/yarncache'
        },
        expose: opts.expose,
        image: opts.image || 'clowdy-plugin-nodejs-dev',
        links: {
          ...opts.links
        },
        volumes: {
          '/usr/src/app': dirname,
          '/usr/src/app/node_modules': builder.volume('node_modules'),
          // '/usr/local/share/.cache/yarn/v2': builder.volume('yarn_cache'),
          ...opts.volumes
        }
      });
    },

    test(
      name: string,
      ...args:
        | [string, Partial<ProjectBuilder.ServiceOptions>?]
        | [Partial<ProjectBuilder.ServiceOptions>?]
    ) {
      const { dirname, opts } = parse(args);

      builder.image(
        'clowdy-plugin-nodejs-dev',
        path.resolve(__dirname, '..', 'clowdy-plugin-nodejs-dev')
      );

      builder.service(name, 'test', {
        command: opts.command || ['yarn', 'test'],
        environment: {
          NODE_ENV: 'test',
          ...opts.environment
          // YARN_CACHE_FOLDER: '/yarncache'
        },
        expose: opts.expose,
        image: opts.image || 'clowdy-plugin-nodejs-dev',
        links: {
          ...opts.links
        },
        volumes: {
          '/usr/src/app': dirname,
          '/usr/src/app/node_modules': builder.volume('node_modules'),
          // '/usr/local/share/.cache/yarn/v2': builder.volume('yarn_cache'),
          ...opts.volumes
        }
      });
    },

    prod(
      name: string,
      ...args:
        | [string, Partial<ProjectBuilder.ServiceOptions>?]
        | [Partial<ProjectBuilder.ServiceOptions>?]
    ) {
      const { dirname, opts } = parse(args);
      const imageName = `${
        builder.project.name
      }_${name}_clowdy-plugin-nodejs-prod`;

      builder.image(
        imageName,
        path.resolve(
          __dirname,
          '..',
          'clowdy-plugin-nodejs-prod',
          'Dockerfile'
        ),
        {
          context: dirname
        }
      );

      builder.service(name, 'prod', {
        command: opts.command || ['yarn', 'start'],
        environment: {
          NODE_ENV: 'production',
          ...opts.environment
          // YARN_CACHE_FOLDER: '/yarncache'
        },
        expose: opts.expose,
        image: opts.image || imageName,
        links: {
          ...opts.links
        },
        volumes: {
          // '/usr/local/share/.cache/yarn/v2': builder.volume('yarn_cache'),
          ...opts.volumes
        }
      });
    }
  };
}
