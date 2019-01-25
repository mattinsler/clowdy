import lodash from 'lodash';
import Docker from 'dockerode';
import ObjectHash from 'object-hash';
import { DockerClient, NetworkInspectInfo, VolumeInfo } from '@clowdy/docker';

import { LABELS } from './labels';
import * as Schema from './schema';
import { dockerClient } from './utils';
import { Actions, ActionType } from './resource-actions';
import {
  Container,
  Image,
  Network,
  Proxy,
  Resource,
  Service,
  Volume
} from './resource-types';
import {
  ContainerLifecycle,
  ImageLifecycle,
  NetworkLifecycle,
  VolumeLifecycle
} from './lifecycle';

export namespace State {
  export interface FromSpec {
    containers: Container.State.FromSpec[];
    images: Image.State.FromSpec[];
    networks: Network.State.FromSpec[];
    project: string;
    proxies: Proxy.State.FromSpec[];
    services: Service.State.FromSpec[];
    volumes: Volume.State.FromSpec[];
  }
  export interface FromCluster {
    containers: Container.State.FromCluster[];
    images: Image.State.FromCluster[];
    networks: Network.State.FromCluster[];
    project: string;
    proxies: Proxy.State.FromCluster[];
    services: Service.State.FromCluster[];
    volumes: Volume.State.FromCluster[];
  }
}

function expandServices(
  services: Schema.Service[],
  spec: Pick<Schema.Spec, 'services'>
): Schema.Service[] {
  const serviceMap: { [name: string]: Schema.Service } = services.reduce(
    (o, service) => {
      o[service.name] = service;
      return o;
    },
    {}
  );

  while (true) {
    let changed = false;

    for (const service of Object.values(serviceMap)) {
      for (const link of service.links) {
        if (!serviceMap[link.target]) {
          changed = true;

          if (spec.services[`prod|${link.target}`]) {
            serviceMap[link.target] = spec.services[`prod|${link.target}`];
          } else if (spec.services[`dev|${link.target}`]) {
            serviceMap[link.target] = spec.services[`dev|${link.target}`];
          } else {
            throw new Error(
              `Cannot find a linked service named ${link.target}`
            );
          }
        }
      }
    }

    if (!changed) {
      break;
    }
  }

  return Object.values(serviceMap);
}

function isProxyFromCluster(
  value: Container.State.FromCluster
): value is Proxy.State.FromCluster {
  return value.type === 'Proxy';
}
function isProxyFromSpec(
  value: Container.State.FromSpec
): value is Proxy.State.FromSpec {
  return value.type === 'Proxy';
}

function isServiceFromCluster(
  value: Container.State.FromCluster
): value is Service.State.FromCluster {
  return value.type === 'Service';
}
function isServiceFromSpec(
  value: Container.State.FromSpec
): value is Service.State.FromSpec {
  return value.type === 'Service';
}

export class State {
  // static derive(state: State.FromCluster, spec: Schema.Spec): State.FromSpec {
  //   const proxies: Proxy.State.FromSpec[] = [];
  //   const services: Service.State.FromSpec[] = [];

  //   for (const service of state.services) {
  //     const serviceSpec = spec.services[`${service.env}|${service.name}`];
  //     if (serviceSpec) {
  //       const config: Service.Config = {
  //         command: (Array.isArray(serviceSpec.command)
  //           ? serviceSpec.command
  //           : [serviceSpec.command]
  //         ).filter(a => a),
  //         environment: serviceSpec.environment,
  //         expose: serviceSpec.expose,
  //         image: serviceSpec.image,
  //         links: serviceSpec.links.reduce((o, { alias, target }) => {
  //           o[alias] = target;
  //           return o;
  //         }, {}),
  //         name: serviceSpec.name,

  //       };

  //       services.push({
  //         config,
  //         env: serviceSpec.env,
  //         hash: `sha1${config}`,
  //         name: serviceSpec.name,
  //         project: service.project
  //       });
  //     }
  //   }

  //   return {};
  // }

  static foo(state: State.FromCluster) {}

  static async fromCluster(
    project: string,
    cluster: Schema.Cluster
  ): Promise<State.FromCluster> {
    const client = dockerClient(cluster);

    const [
      containerInfos,
      networkInfos,
      imageInfos,
      volumeInfos
    ] = await Promise.all([
      client.containers.listAndInspect({
        all: true,
        filters: { label: { [LABELS.project]: project } }
      }),
      client.networks.list({
        filters: { label: { [LABELS.project]: project } }
      }),
      client.images.listAndInspect({
        filters: { label: { [LABELS.project]: project } }
      }),
      client.volumes.list({
        filters: { label: { [LABELS.project]: project } }
      })
    ]);

    const containers: Container.State.FromCluster[] = containerInfos.map(
      (info: Docker.ContainerInspectInfo): Container.State.FromCluster => ({
        env: info.Config.Labels[LABELS.env] as any,
        hash: info.Config.Labels[LABELS.hash],
        info,
        name: info.Config.Labels[LABELS.name],
        project: info.Config.Labels[LABELS.project],
        resource: 'Container',
        type: info.Config.Labels[LABELS.type] as any
      })
    );

    const proxies: Proxy.State.FromCluster[] = containers.filter(
      isProxyFromCluster
    );
    const services: Service.State.FromCluster[] = containers.filter(
      isServiceFromCluster
    );

    const images: Image.State.FromCluster[] = imageInfos.map(
      (info: Docker.ImageInspectInfo): Image.State.FromCluster => ({
        hash: info.Config.Labels[LABELS.hash],
        info,
        name: info.Config.Labels[LABELS.name],
        project: info.Config.Labels[LABELS.project],
        resource: 'Image'
      })
    );

    const networks: Network.State.FromCluster[] = networkInfos.map(
      (info: NetworkInspectInfo): Network.State.FromCluster => ({
        hash: info.Labels[LABELS.hash],
        info,
        name: info.Labels[LABELS.name],
        project: info.Labels[LABELS.project],
        resource: 'Network'
      })
    );

    const volumes: Volume.State.FromCluster[] = volumeInfos.map(
      (info: VolumeInfo): Volume.State.FromCluster => ({
        hash: info.Labels[LABELS.hash],
        info,
        name: info.Labels[LABELS.name],
        project: info.Labels[LABELS.project],
        resource: 'Volume'
      })
    );

    return {
      containers: [],
      images,
      networks,
      project,
      proxies,
      services,
      volumes
    };
  }

  static fromSpec(
    project: string,
    spec: Pick<Schema.Spec, 'images' | 'services'>,
    chosenServices: 'all' | Schema.Service[],
    opts: {
      includeDependentServices?: boolean;
    } = {}
  ): State.FromSpec {
    const containers: Container.State.FromSpec[] = [];
    const images: { [name: string]: Image.State.FromSpec } = {};
    const networks: { [name: string]: Network.State.FromSpec } = {};
    const volumes: { [name: string]: Volume.State.FromSpec } = {};

    let services =
      chosenServices === 'all' ? Object.values(spec.services) : chosenServices;

    if (opts.includeDependentServices) {
      services = expandServices(services, spec);
    }

    for (const service of services) {
      const config: Container.Config = {
        command: (Array.isArray(service.command)
          ? service.command
          : [service.command]
        ).filter(a => a),
        environment: service.environment,
        expose: service.expose,
        image: service.image,
        links: service.links.reduce((o, { alias, target }) => {
          o[alias] = target;
          return o;
        }, {}),
        ports: service.ports,
        volumes: service.volumes
      };

      containers.push({
        config,
        env: service.env,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name: service.name,
        project,
        resource: 'Container',
        source: service,
        type: 'Service'
      });

      if (spec.images[service.image]) {
        const config: Image.Config = {
          context: spec.images[service.image].context,
          dockerfile: spec.images[service.image].dockerfile
        };

        images[service.image] = {
          config,
          hash: `sha1:${ObjectHash.sha1(config)}`,
          name: service.image,
          project,
          resource: 'Image'
        };
      }

      for (const volume of Object.values(service.volumes)) {
        if (volume.type === 'Volume.Docker') {
          volumes[volume.volumeName] = {
            config: {
              name: volume.volumeName
            },
            hash: `sha1:${ObjectHash.sha1(config)}`,
            name: volume.volumeName,
            project,
            resource: 'Volume'
          };
        }
      }
    }

    if (services.length > 0) {
      const config: Network.Config = {
        driver: 'bridge'
      };

      networks['default'] = {
        config,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name: 'default',
        project,
        resource: 'Network'
      };
    }

    return {
      containers: [],
      images: Object.values(images),
      networks: Object.values(networks),
      project,
      proxies: containers.filter(isProxyFromSpec),
      services: containers.filter(isServiceFromSpec),
      volumes: Object.values(volumes)
    };
  }
}

function diff<
  T extends string,
  TCurrentState extends Resource.State<T>,
  TDesiredState extends Resource.State<T>
>(
  current: TCurrentState[],
  desired: TDesiredState[]
): {
  change: (TCurrentState & TDesiredState)[];
  create: TDesiredState[];
  destroy: TCurrentState[];
} {
  const currentByName = lodash.keyBy(current, 'name');
  const desiredByName = lodash.keyBy(desired, 'name');

  return {
    change: current
      .filter(
        i => desiredByName[i.name] && desiredByName[i.name].hash !== i.hash
      )
      .map(i => Object.assign({}, i, desiredByName[i.name])),
    create: desired.filter(i => !currentByName[i.name]),
    destroy: current.filter(i => !desiredByName[i.name])
  };
}

// there should probably be a state validation...

export interface Plan {
  actions: Plan.Action[];
  project: string;
}

export namespace Plan {
  export type Action = ActionType;
}

export class Plan {
  static Actions = Actions;

  static from(current: State.FromCluster, desired: State.FromSpec): Plan {
    /*
      - compute diffs
      - decompose to operations
      - order operations (could order at a higher level if necessary)
        - network is before everything else...
        - containers
          - use links to compute service state ordering...
          - should allow for services to signal when they are "up"
      - return
    */

    const diffs = {
      containers: diff(current.containers, desired.containers),
      images: diff(current.images, desired.images),
      networks: diff(current.networks, desired.networks),
      proxies: diff(current.proxies, desired.proxies),
      services: diff(current.proxies, desired.services),
      volumes: diff(current.volumes, desired.volumes)
    };

    const actions: ActionType[] = [];

    actions.push(
      ...diffs.containers.destroy.map(container =>
        Actions.Container.destroy({ container })
      )
    );

    actions.push(
      ...diffs.volumes.destroy.map(volume => Actions.Volume.destroy({ volume }))
    );

    actions.push(
      ...diffs.networks.destroy.map(network =>
        Actions.Network.destroy({ network })
      )
    );
    actions.push(
      ...diffs.networks.change.map(network =>
        Actions.Network.destroy({ network })
      )
    );
    actions.push(
      ...diffs.networks.change.map(network =>
        Actions.Network.create({ network })
      )
    );
    actions.push(
      ...diffs.networks.create.map(network =>
        Actions.Network.create({ network })
      )
    );

    actions.push(
      ...diffs.images.create.map(image => Actions.Image.build({ image }))
    );

    actions.push(
      ...diffs.volumes.create.map(volume => Actions.Volume.create({ volume }))
    );

    actions.push(
      ...[...diffs.containers.create]
        .sort((l, r) => {
          if (r.source.links.find(link => link.target === l.name)) {
            return -1;
          } else if (l.source.links.find(link => link.target === r.name)) {
            return 1;
          }
          return 0;
        })
        .map(container => Actions.Container.create({ container }))
    );

    return { actions, project: current.project };
  }

  private static handleAction(client: DockerClient, action: ActionType) {
    if (Actions.Container.create.is(action)) {
      return ContainerLifecycle.create(client, action.payload.container);
    } else if (Actions.Container.destroy.is(action)) {
      return ContainerLifecycle.destroy(client, action.payload.container);
    }

    if (Actions.Image.build.is(action)) {
      return ImageLifecycle.build(client, action.payload.image);
    }

    if (Actions.Network.create.is(action)) {
      return NetworkLifecycle.create(client, action.payload.network);
    } else if (Actions.Network.destroy.is(action)) {
      return NetworkLifecycle.destroy(client, action.payload.network);
    }

    if (Actions.Volume.create.is(action)) {
      return VolumeLifecycle.create(client, action.payload.volume);
    } else if (Actions.Volume.destroy.is(action)) {
      return VolumeLifecycle.destroy(client, action.payload.volume);
    }

    throw new Error();
  }

  static async execute(plan: Plan, cluster: Schema.Cluster): Promise<void> {
    const client = dockerClient(cluster);

    for (const action of plan.actions) {
      await Plan.handleAction(client, action);
    }
  }
}
