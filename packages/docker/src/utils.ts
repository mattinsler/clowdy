import Docker from 'dockerode';

import {
  // ContainerCreateOptions,
  ContainerListOptions,
  EventsStreamOptions,
  ImageListOptions,
  NetworkListOptions,
  VolumeListOptions
} from './types';

function booleanFilter(value: boolean) {
  return [value];
}
function booleanFilters(filters: { [key: string]: boolean }) {
  return Object.entries(filters).reduce((o, [k, v]) => {
    if (v !== undefined) {
      o[k] = booleanFilter(v);
    }
    return o;
  }, {});
}

function keyValueFilter(value: { [key: string]: string | string[] | true }) {
  return Object.entries(value).reduce((arr, [k, v]) => {
    return arr.concat(v === true ? k : listFilter(v).map(a => `${k}=${a}`));
  }, []);
}
function keyValueFilters(filters: {
  [key: string]: { [key: string]: string | string[] | true };
}) {
  return Object.entries(filters).reduce((o, [k, v]) => {
    if (v !== undefined) {
      o[k] = keyValueFilter(v);
    }
    return o;
  }, {});
}

function listFilter(value: string | string[] | number | number[]) {
  return Array.isArray(value) ? value : [value];
}
function listFilters(filters: {
  [key: string]: string | string[] | number | number[];
}) {
  return Object.entries(filters).reduce((o, [k, v]) => {
    if (v !== undefined) {
      o[k] = listFilter(v);
    }
    return o;
  }, {});
}

export function eventsStreamOptions({
  filters,
  since,
  until
}: EventsStreamOptions = {}): object {
  const opts: any = {};

  if (filters !== undefined) {
    opts.filters = JSON.stringify({
      ...keyValueFilters({ label: filters.label }),
      ...listFilters({
        config: filters.config,
        container: filters.container,
        daemon: filters.daemon,
        event: filters.event,
        image: filters.image,
        network: filters.network,
        node: filters.node,
        plugin: filters.plugin,
        scope: filters.scope,
        secret: filters.secret,
        service: filters.service,
        type: filters.type,
        volume: filters.volume
      })
    });
  }

  if (since !== undefined) {
    opts.since = since;
  }

  if (until !== undefined) {
    opts.until = until;
  }

  return opts;
}

export function listContainerOptions({
  all,
  filters,
  limit,
  size
}: ContainerListOptions = {}): object {
  const opts: any = {};

  if (all !== undefined) {
    opts.all = all;
  }

  if (filters !== undefined) {
    opts.filters = JSON.stringify({
      ...booleanFilters({ 'is-task': filters['is-task'] }),
      ...keyValueFilters({ label: filters.label }),
      ...listFilters({
        ancestor: filters.ancestor,
        before: filters.before,
        expose: filters.expose,
        exited: filters.exited,
        health: filters.health,
        id: filters.id,
        isolation: filters.isolation,
        name: filters.name,
        network: filters.network,
        publish: filters.publish,
        since: filters.since,
        status: filters.status,
        volume: filters.volume
      })
    });
  }

  if (limit !== undefined) {
    opts.limit = limit;
  }

  if (size !== undefined) {
    opts.size = size;
  }

  return opts;
}

export function listImageOptions({
  all,
  digests,
  filters
}: ImageListOptions = {}): object {
  const opts: any = {};

  if (all !== undefined) {
    opts.all = all;
  }

  if (digests !== undefined) {
    opts.digests = digests;
  }

  if (filters !== undefined) {
    opts.filters = JSON.stringify({
      ...booleanFilters({ dangling: filters.dangling }),
      ...keyValueFilters({ label: filters.label }),
      ...listFilters({
        before: filters.before,
        reference: filters.reference,
        since: filters.since
      })
    });
  }

  return opts;
}

export function listNetworkOptions({
  filters
}: NetworkListOptions = {}): object {
  const opts: any = {};

  if (filters !== undefined) {
    opts.filters = JSON.stringify({
      ...keyValueFilters({ label: filters.label }),
      ...listFilters({
        driver: filters.driver,
        id: filters.id,
        name: filters.name,
        scope: filters.scope,
        type: filters.type
      })
    });
  }

  return opts;
}

export function listVolumeOptions({ filters }: VolumeListOptions = {}): object {
  const opts: any = {};

  if (filters !== undefined) {
    opts.filters = JSON.stringify({
      ...booleanFilters({ dangling: filters.dangling }),
      ...keyValueFilters({ label: filters.label }),
      ...listFilters({
        driver: filters.driver,
        name: filters.name
      })
    });
  }

  return opts;
}

// interface ContainerConfig {
//   command: string[];
//   containerName?: string;
//   env?: {
//     [key: string]: string;
//   };
//   hostname?: string;
//   image: string;
//   labels?: { [name: string]: string };
//   volumes?: {
//     // mapping of path inside the container to path on the host
//     // '/home/foobar': '/tmp/434r52322223rcvcss/foobar/home'
//     // -- add :ro to make the volume readonly
//     // '/home/foobar:ro': '/tmp/434r52322223rcvcss/foobar/home'
//     [mountDir: string]: string;
//   };
// }

// export function adaptContainerCreateOptions(
//   options: ContainerCreateOptions
// ): Docker.ContainerCreateOptions {
//   const opts: Docker.ContainerCreateOptions = {
//     name: options.name,
//     Cmd: Array.isArray(options.command) ? options.command : [options.command]
//     // Domainname: '',
//     // Entrypoint: '',
//     // Env

//     // Cmd: options.command,
//     // Hostname: config.hostname,
//     // Image: config.image,
//     // Labels: {
//     //   ...config.labels
//     // },
//     // OpenStdin: true,
//     // Tty: false

//     // HostConfig: {
//     //   ExtraHosts: ['labs.awesome-labs.com:172.17.0.1'],
//     // },
//   };

//   if (config.env) {
//     opts.Env = Object.entries(config.env).map(([k, v]) => `${k}=${v}`);
//   }

//   if (config.volumes) {
//     if (!opts.HostConfig) {
//       opts.HostConfig = {};
//     }
//     opts.HostConfig.Binds = [];
//     opts.Volumes = {};

//     for (const k of Object.keys(config.volumes)) {
//       const v = config.volumes[k];
//       opts.HostConfig.Binds!.push(`${v}:${k}`);
//       opts.Volumes[k.split(':')[0]] = {};
//     }
//   }

//   return opts;
// }
