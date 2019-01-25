import path from 'path';
import tar from 'tar-fs';
import fs from 'fs-extra';
import execa from 'execa';
import lodash from 'lodash';
import Docker from 'dockerode';
import hash from 'object-hash';
import JSONStream from 'JSONStream';
import { NetworkInspectInfo, VolumeInfo } from '@clowdy/docker';
import { Readable, PassThrough, TransformOptions, Writable } from 'stream';

import { dockerClient } from './utils';
import * as FileSystem from './file-system';
import {
  Cluster,
  Script,
  Service,
  Spec,
  isDockerVolume,
  Image
} from './schema';

const LABELS = {};

interface ClusterState {
  containers: Docker.ContainerInspectInfo[];
  networks: NetworkInspectInfo[];
  volumes: VolumeInfo[];
}

async function getCurrentState(
  cluster: Cluster,
  name: string
): Promise<ClusterState> {
  const client = dockerClient(cluster);

  const [containers, networks, volumes] = await Promise.all([
    client.containers.listAndInspect({
      filters: {
        label: { 'com.awesome-labs.clowdy.project': name }
      }
    }),
    client.networks.list({
      filters: { label: { 'com.awesome-labs.clowdy.project': name } }
    }),
    client.volumes.list({
      filters: { label: { 'com.awesome-labs.clowdy.project': name } }
    })
  ]);

  return { containers, networks, volumes };
}

function createNetwork() {}

function create(services: Service[], cluster: Cluster) {
  // create network
  // create volume
}

export namespace Operation {
  export namespace Container {
    export interface Create {
      action: 'create';
      resource: 'container';
      data: {
        project: string;
      };
    }
  }
  export type Container = Container.Create;

  export namespace Image {
    export interface Create {
      action: 'create';
      resource: 'image';
      data: {
        name: string;
      };
    }
  }
  export type Image = Image.Create;

  export namespace Network {
    export interface Create {
      resource: 'network';
      action: 'create';
      data: {
        project: string;
        name: string;
      };
    }
    export interface Destroy {
      resource: 'network';
      action: 'destroy';
      data: {
        project: string;
        name: string;
      };
    }
  }
  export type Network = Network.Create | Network.Destroy;

  export namespace Volume {
    export interface Create {
      action: 'create';
      resource: 'volume';
      name: string;
    }
  }
  export type Volume = Volume.Create;
}

export type Operation =
  | Operation.Container
  | Operation.Image
  | Operation.Network
  | Operation.Volume;

async function executeContainer(
  cluster: Cluster,
  { action, data }: Operation.Container
) {
  const client = dockerClient(cluster);

  switch (action) {
    case 'create': {
      // await client.containers.break;
    }
  }
}

async function executeNetwork(
  cluster: Cluster,
  { action, data }: Operation.Network
) {
  const client = dockerClient(cluster);

  switch (action) {
    case 'create': {
      await client.networks.create({
        Name: `${data.project}_${data.name}`,
        Driver: 'bridge',
        Labels: {
          'com.awesome-labs.clowdy.project': data.project,
          'com.awesome-labs.clowdy.hash': `sha1:${hash.sha1(data)}`,
          'com.awesome-labs.clowdy.name': data.name
        }
      });
      break;
    }
    case 'destroy': {
      const networks = await client.networks.list({
        filters: {
          label: {
            'com.awesome-labs.clowdy.project': data.project,
            'com.awesome-labs.clowdy.name': data.name
          }
        }
      });
      await Promise.all(networks.map(n => client.networks.remove(n.Id)));
      break;
    }
  }
}

function executePlan(cluster: Cluster, operations: Operation[]) {
  for (const operation of operations) {
    switch (operation.resource) {
      case 'container': {
        break;
      }
      case 'image': {
        break;
      }
      case 'network': {
        executeNetwork(cluster, operation);
        break;
      }
      case 'volume': {
        break;
      }
    }
  }
}

function plan(
  current: ClusterState,
  desired: {
    images: { [name: string]: Image };
    services: { [name: string]: Service };
  }
) {
  const operations = [];

  // find networks with label that matches... default?
  if (
    !current.networks.find(
      n => n.Labels['com.awesome-labs.clowdy.name'] === 'default'
    )
  ) {
    operations.push({
      type: 'network',
      action: 'create'
    });
  }

  // figure out containers
  for (const service of Object.values(desired.services)) {
    current.containers.find(
      c =>
        c.Config.Labels['com.awesome-labs.clowdy.type'] === 'service' &&
        c.Config.Labels['com.awesome-labs.clowdy.name'] === service.name
    );
  }

  // check for volumes
  // if () {
  //   operations.push({
  //     type: '',
  //     action: ''
  //   });
  // }

  return operations;
}

type ReadablePromiseFn<T> = (
  stream: Writable,
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void;

declare interface ReadablePromise<T> extends Readable, Promise<T> {
  new (fn: ReadablePromiseFn<T>): ReadablePromise<T>;
  new (opts: TransformOptions, fn: ReadablePromiseFn<T>): ReadablePromise<T>;
}

class ReadablePromise<T> extends PassThrough {
  constructor(...args: any[]) {
    super(typeof args[0] === 'function' ? {} : args[0]);
    const { promise, resolve, reject } = (() => {
      let resolve, reject;
      const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      return { promise, resolve, reject };
    })();
    Object.assign(this, promise);

    (typeof args[0] === 'function' ? args[0] : args[1])(this, resolve, reject);
  }
}

function createReadablePromise<T>(
  streamOpts: TransformOptions,
  fn: () => Readable | Promise<Readable>,
  opts?: { transform?: (data: any) => any }
): ReadablePromise<T>;
function createReadablePromise<T>(
  fn: () => Readable | Promise<Readable>,
  opts?: { transform?: (data: any) => any }
): ReadablePromise<T>;
function createReadablePromise<T>(...args: any[]): ReadablePromise<T> {
  const streamOpts = typeof args[0] === 'function' ? {} : args[0];
  const fn = typeof args[0] === 'function' ? args[0] : args[1];
  const opts = (typeof args[0] === 'function' ? args[1] : args[2]) || {};

  return new ReadablePromise<T>(streamOpts, async (stream, resolve, reject) => {
    let source: Readable;

    try {
      source = await fn();
    } catch (err) {
      return reject(err);
    }

    const onData = data => {
      if (opts.transform) {
        try {
          stream.write(opts.transform(data));
        } catch (err) {
          onError(err);
        }
      } else {
        stream.write(data);
      }
    };

    const onError = err => {
      source.removeListener('data', onData);
      source.removeListener('error', onError);
      source.removeListener('end', onEnd);
      stream.emit('error', err);
      reject(err);
      stream.destroy();
    };

    const onEnd = () => {
      stream.end();
      resolve();
    };

    source.on('data', onData);
    source.on('error', onError);
    source.on('end', onEnd);
  });
}

const PREFIX = 'com.awesome-labs';

function tempDirectory(): FileSystem.Directory {
  return FileSystem.tempDirectory(
    path.join(process.cwd(), '.clowd')
  ).removeOnExit();
}

function waitForProc(proc: execa.ExecaChildProcess): execa.ExecaChildProcess {
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);

  return proc;
}

export class Clowd {
  private spec: Spec;

  constructor(spec: Spec) {
    this.spec = spec;
  }

  private async getRunningServices(
    cluster: Cluster
  ): Promise<{ [name: string]: Service }> {
    const containers = (await dockerClient(cluster).containers.list({
      filters: {
        label: {
          [`${PREFIX}.schema`]: this.spec.name,
          [`${PREFIX}.type`]: 'service'
        }
      }
    }))
      .map(c => this.services.get(c.Labels[`${PREFIX}.service`]))
      .filter(a => a);

    return lodash.keyBy(containers, 'name');
  }

  private createEnvoyConfig(service: Service) {
    const config = {
      admin: {
        access_log_path: '/tmp/admin_access.log',
        address: {
          socket_address: {
            protocol: 'TCP',
            address: '127.0.0.1',
            port_value: 9901
          }
        }
      },
      static_resources: {
        listeners: [],
        clusters: []
      }
    };

    for (const port of service.expose) {
      config.static_resources.listeners.push({
        address: {
          socket_address: {
            protocol: 'TCP',
            address: '0.0.0.0',
            port_value: port
          }
        },
        filter_chains: [
          {
            filters: [
              {
                name: 'envoy.tcp_proxy',
                config: {
                  cluster: `svc_${service.name}_${port}`,
                  stat_prefix: `svc_${service.name}_${port}`
                }
              }
            ]
          }
        ]
      });

      config.static_resources.clusters.push({
        name: `svc_${service.name}_${port}`,
        connect_timeout: '0.25s',
        type: 'LOGICAL_DNS',
        lb_policy: 'round_robin',
        hosts: [
          {
            socket_address: {
              protocol: 'TCP',
              address: service.name,
              port_value: port
            }
          }
        ]
      });
    }

    return config;
  }

  private async createComposeFile(
    dir: FileSystem.Directory,
    scriptOrServices: (Script | Service)[]
  ): Promise<string> {
    const services: (Script | Service)[] = Array.isArray(scriptOrServices)
      ? scriptOrServices
      : [scriptOrServices];

    const config = {
      version: '3.7',
      services: {},
      volumes: {}
    };

    for (const service of services) {
      for (const link of service.links) {
        if (!config.services[`proxy-to-${link.target}`]) {
          const envoyConfig = this.createEnvoyConfig(
            this.services.get(link.target)
          );
          await dir.writeYamlFile(`${link.target}-envoy.yml`, envoyConfig);

          config.services[`proxy-to-${link.target}`] = {
            image: 'envoyproxy/envoy-alpine:latest',
            labels: [
              `${PREFIX}.name=${link.target}`,
              `${PREFIX}.schema=${this.spec.name}`,
              `${PREFIX}.type=proxy`
            ],
            volumes: [
              `${dir.filepath(
                `${link.target}-envoy.yml`
              )}:/etc/envoy/envoy.yaml:ro`
            ]
          };
        }
      }

      config.services[service.name] = {
        image: service.image,
        command: service.command,
        labels: [
          `${PREFIX}.name=${service.name}`,
          `${PREFIX}.schema=${this.spec.name}`,
          `${PREFIX}.service=${service.name}`,
          `${PREFIX}.type=${service.type.toLowerCase()}`
          // `${PREFIX}.spec=${JSON.stringify(service)}`
        ],
        // SERVICE:ALIAS
        links: service.links.map(
          link => `proxy-to-${link.target}:${link.alias}`
        ),
        // links: service.links.map(link => `${link.target}:${link.alias}`),
        // SOURCE:TARGET
        volumes: Object.entries(service.volumes).map(([k, v]) => {
          return [isDockerVolume(v) ? v.volumeName : v.directory, k].join(':');
        })
      };

      // this is confusing... it can also be a script
      if (service.type === 'Service') {
        config.services[service.name].ports = Object.entries(service.ports).map(
          ([k, v]) => `${k}:${v}`
        );
      }

      for (const volume of Object.values(service.volumes).filter(
        isDockerVolume
      )) {
        config.volumes[volume.volumeName] = {};
      }
    }

    await dir.writeYamlFile('docker-compose.yml', config);

    return dir.filepath('docker-compose.yml');
  }

  images = {
    build: (name: string, cluster?: Cluster): ReadablePromise<void> => {
      return createReadablePromise(
        { objectMode: true },
        async () => {
          const image = this.images.get(name);
          if (!image) {
            throw new Error(`Image ${name} does not exist`);
          }

          if (!fs.statSync(image.context).isDirectory()) {
            throw new Error(`${image.context} is not a directory`);
          }

          const tarStream = tar.pack(image.context);
          const docker = dockerClient(cluster);
          const buildStream = await docker.images.build(tarStream, {
            t: image.name
          });

          return buildStream.pipe(JSONStream.parse());
        },
        {
          transform(data) {
            if (!(data instanceof Object)) {
              data = {};
            }
            if (data.error) {
              throw data.error;
            }
            return data;
          }
        }
      );
    },

    // exists: async (name: string, cluster?: Cluster): Promise<boolean> => {
    //   try {
    //     const img = await DockerTunnel.docker(cluster)
    //       .getImage(name)
    //       .inspect();
    //     // console.log(img);
    //     return true;
    //   } catch (err) {
    //     return false;
    //   }
    // },

    get: (name: string) => this.spec.images[name],
    has: (name: string) => !!this.spec.images[name],
    list: () => Object.keys(this.spec.images)
  };

  private executeScript = async (script: Script, cluster: Cluster) => {
    const servicesRunning = await this.getRunningServices(cluster);

    // if (servicesRunning[script]) {

    // }

    const dir = tempDirectory();
    const composeFile = await this.createComposeFile(
      dir,
      Object.values({
        ...servicesRunning,
        [`script-${script.name}`]: {
          ...script,
          name: `script-${script.name}`
        }
      })
    );

    await waitForProc(
      dockerClient(cluster)
        .compose(
          composeFile,
          { projectName: this.spec.name }
        )
        .run('--rm', `script-${script.name}`)
    );
  };

  scripts = {
    execute: async (name: string, cluster?: Cluster): Promise<void> => {
      const script = this.scripts.get(name);
      if (!script) {
        throw new Error();
      }

      // if (!(await this.images.exists(script.image, cluster))) {
      //   throw new Error(`Image ${script.image} does not exist on cluster.`);
      // }

      const servicesRunning = await this.getRunningServices(cluster);
      // this.ensureLinksRunning([script], servicesRunning);

      const dir = tempDirectory();
      const composeFile = await this.createComposeFile(
        dir,
        Object.values({
          ...servicesRunning,
          [`script-${script.name}`]: {
            ...script,
            name: `script-${script.name}`
          }
        })
      );

      await waitForProc(
        dockerClient(cluster)
          .compose(
            composeFile,
            { projectName: this.spec.name }
          )
          .run('--rm', `script-${script.name}`)
      );
    },

    get: (name: string) => this.spec.scripts[name],
    has: (name: string) => !!this.spec.scripts[name],
    list: () => Object.keys(this.spec.scripts)
  };

  services = {
    attach: (name: string, cluster: Cluster) => {
      const service = this.services.get(name);
      if (!service) {
        throw new Error();
      }

      return dockerClient(cluster).containers.attach(
        `${this.spec.name}_${service.name}`,
        { logs: true }
      );
    },

    get: (name: string) => this.spec.services[name],
    has: (name: string) => !!this.spec.services[name],
    list: () => Object.keys(this.spec.services),

    // make this into a ReadablePromise
    logs: async (name: string | string[], cluster?: Cluster) => {
      name = Array.isArray(name) ? name : [name];
      let services = (name.length === 0
        ? this.services.list().filter(s => !s.includes(':'))
        : name
      ).map(s => this.services.get(s));
      if (!services.every(s => !!s)) {
        throw new Error();
      }

      const dir = tempDirectory();
      const composeFile = await this.createComposeFile(dir, services);

      await waitForProc(
        dockerClient(cluster)
          .compose(
            composeFile,
            { projectName: this.spec.name }
          )
          .logs()
      );
    },

    // plan: async (name: string | string[], cluster?: Cluster): Promise<void> => {
    //   const services = (Array.isArray(name) ? name : [name]).map(s =>
    //     this.services.get(s)
    //   );
    //   if (!services.every(s => !!s)) {
    //     throw new Error();
    //   }

    //   const servicesRunning = await this.getRunningServices(cluster);

    //   const dir = tempDirectory(process.cwd());
    //   const composeFile = await this.createComposeFile(
    //     dir,
    //     Object.values({
    //       ...servicesRunning,
    //       ...lodash.keyBy(services, 'name')
    //     })
    //   );

    //   console.log(dir.path);
    // },

    ps: async (cluster?: Cluster) => {
      return dockerClient(cluster).containers.list({
        filters: {
          label: {
            [`${PREFIX}.schema`]: this.spec.name,
            [`${PREFIX}.type`]: 'service'
          }
        }
      });
    },

    start: async (name: string | string[], cluster: Cluster): Promise<void> => {
      const services = (Array.isArray(name) ? name : [name]).map(s =>
        this.services.get(s)
      );
      if (!services.every(s => !!s)) {
        throw new Error();
      }

      // const prestartServices = services.filter(s => s.hooks.prestart);
      // if (prestartServices.length > 0) {
      //   for (const service of prestartServices) {
      //     await this.executeScript(
      //       {
      //         command: service.scripts[service.hooks.prestart],
      //         image: service.image,
      //         links: service.links,
      //         name: `${service.name}-${service.hooks.prestart}`,
      //         type: 'Script',
      //         volumes: service.volumes
      //       },
      //       cluster
      //     );
      //   }
      // }

      // // check that images exist

      // const servicesRunning = await this.getRunningServices(cluster);
      // // this.ensureLinksRunning(services, servicesRunning);

      // const dir = tempDirectory();
      // const composeFile = await this.createComposeFile(
      //   dir,
      //   Object.values({
      //     ...servicesRunning,
      //     ...keyBy(services, 'name')
      //   })
      // );

      // await waitForProc(
      //   dockerClient(cluster)
      //     .compose(
      //       composeFile,
      //       { projectName: this.spec.name }
      //     )
      //     .up('-d', ...services.map(s => s.name))
      //   // .up('--no-start', ...services.map(s => s.name))
      // );
    },

    stop: async (name: string | string[], cluster?: Cluster): Promise<void> => {
      const services = (Array.isArray(name) ? name : [name]).map(s =>
        this.services.get(s)
      );
      if (!services.every(s => !!s)) {
        throw new Error();
      }

      const servicesRunning = await this.getRunningServices(cluster);
      // if (services.some(s => !servicesRunning[s.name])) {
      //   throw new Error(`Cannot stop a service that isn't running.`);
      // }

      const dir = tempDirectory();
      const composeFile = await this.createComposeFile(
        dir,
        Object.values({
          ...servicesRunning,
          ...lodash.keyBy(services, 'name')
        })
      );

      await waitForProc(
        dockerClient(cluster)
          .compose(
            composeFile,
            { projectName: this.spec.name }
          )
          .rm('-f', '-s', '-v', ...services.map(s => s.name))
      );
    }

    // replace: async (
    //   from: string,
    //   to: string,
    //   cluster?: Cluster
    // ): Promise<void> => {
    //   const [serviceFrom, serviceTo] = [from, to].map(s =>
    //     this.services.get(s)
    //   );
    //   if (!(serviceFrom && serviceTo)) {
    //     throw new Error();
    //   }

    //   const servicesRunning = await this.getRunningServices(cluster);

    //   if (!servicesRunning[serviceFrom.name]) {
    //     throw new Error(
    //       `Service must be running in order to replace it. Service "${from}" is not running.`
    //     );
    //   }

    //   const dir = tempDirectory(process.cwd());
    //   const composeFile = await this.createComposeFile(
    //     dir,
    //     Object.values({
    //       ...servicesRunning,
    //       [serviceFrom.name]: {
    //         ...serviceTo,
    //         name: serviceFrom.name
    //       }
    //     })
    //   );

    //   await waitForProc(
    //     DockerTunnel.compose(
    //       composeFile,
    //       { cluster, projectName: this.state.name }
    //     ).up('-d', '--no-deps', serviceFrom.name)
    //     // docker-compose up -d --no-deps --build <service_name>
    //   );
    // }
  };
}
