import lodash from 'lodash';

import { Blueprint } from './blueprint';
import { ClusterState } from './cluster-state';

function shouldDestroy<
  TClusterState extends { hash: string; name: string },
  TBlueprint extends { hash: string; name: string }
>(state: TClusterState[], blueprint: TBlueprint[]): TClusterState[] {
  const blueprintByName = lodash.keyBy(blueprint, 'name');

  const destroy = state.filter(i => !blueprintByName[i.name]);
  const change = state.filter(
    i => blueprintByName[i.name] && blueprintByName[i.name].hash !== i.hash
  );

  return [...destroy, ...change];
}

function shouldCreate<
  TClusterState extends { hash: string; name: string },
  TBlueprint extends { hash: string; name: string }
>(state: TClusterState[], blueprint: TBlueprint[]): TBlueprint[] {
  const stateByName = lodash.keyBy(state, 'name');
  const blueprintByName = lodash.keyBy(blueprint, 'name');

  const create = blueprint.filter(i => !stateByName[i.name]);
  const change = state
    .filter(
      i => blueprintByName[i.name] && blueprintByName[i.name].hash !== i.hash
    )
    .map(i => blueprintByName[i.name]);

  return [...create, ...change];
}

function diff<
  TClusterState extends { hash: string; name: string },
  TBlueprint extends { hash: string; name: string }
>(
  state: TClusterState[],
  blueprint: TBlueprint[]
): {
  change: (TBlueprint & TClusterState)[];
  create: TBlueprint[];
  destroy: TClusterState[];
} {
  const stateByName = lodash.keyBy(state, 'name');
  const blueprintByName = lodash.keyBy(blueprint, 'name');

  return {
    change: state
      .filter(
        i => blueprintByName[i.name] && blueprintByName[i.name].hash !== i.hash
      )
      .map(i => Object.assign({}, i, blueprintByName[i.name])),
    create: blueprint.filter(i => !stateByName[i.name]),
    destroy: state.filter(i => !blueprintByName[i.name])
  };
}

export interface ExecutionPlan {
  actions: ExecutionPlan.Action[];
  project: string;
}

export class ExecutionPlan {
  static from(state: ClusterState, blueprint: Blueprint): ExecutionPlan {
    state = lodash.cloneDeep(state);

    const diffs = {
      images: diff(state.images, blueprint.images),
      // networks: diff(state.networks, blueprint.networks),
      proxies: diff(state.proxies, blueprint.proxies),
      services: diff(state.services, blueprint.services),
      volumes: diff(state.volumes, blueprint.volumes)
    };

    const actions: ExecutionPlan.Action[] = [];

    // DESTROY //

    // proxies
    // actions.push(
    //   ...[...diffs.proxies.destroy, ...diffs.proxies.change].map(
    //     ExecutionPlan.Action.Proxy.destroy
    //   )
    // );

    const destroyProxies = shouldDestroy(state.proxies, blueprint.proxies);
    actions.push(...destroyProxies.map(ExecutionPlan.Action.Proxy.destroy));
    state.proxies = state.proxies.filter(
      p => !destroyProxies.find(dp => dp.name === p.name)
    );

    // services
    // actions.push(
    //   ...[...diffs.services.destroy, ...diffs.services.change].map(
    //     ExecutionPlan.Action.Service.destroy
    //   )
    // );

    const destroyServices = shouldDestroy(state.services, blueprint.services);
    actions.push(...destroyServices.map(ExecutionPlan.Action.Service.destroy));
    state.services = state.services.filter(
      s => !destroyServices.find(ds => ds.name === s.name)
    );

    // volumes
    // actions.push(
    //   ...diffs.volumes.destroy.map(ExecutionPlan.Action.Volume.destroy)
    // );

    const destroyVolumes = shouldDestroy(state.volumes, blueprint.volumes);
    actions.push(...destroyVolumes.map(ExecutionPlan.Action.Volume.destroy));
    state.volumes = state.volumes.filter(
      v => !destroyVolumes.find(dv => dv.name === v.name)
    );

    // images
    // actions.push(
    //   ...[...diffs.images.destroy, ...diffs.images.change].map(
    //     ExecutionPlan.Action.Image.destroy
    //   )
    // );

    const destroyImages = shouldDestroy(state.images, blueprint.images);
    actions.push(...destroyImages.map(ExecutionPlan.Action.Image.destroy));
    state.images = state.images.filter(
      i => !destroyImages.find(di => di.name === i.name)
    );

    // networks
    // actions.push(
    //   ...[...diffs.networks.destroy, ...diffs.networks.change].map(
    //     ExecutionPlan.Action.Network.destroy
    //   )
    // );

    // CREATE //

    // networks
    // actions.push(
    //   ...[...diffs.networks.change, ...diffs.networks.create].map(
    //     ExecutionPlan.Action.Network.create
    //   )
    // );

    // images
    // actions.push(
    //   ...[...diffs.images.change, ...diffs.images.create].map(
    //     ExecutionPlan.Action.Image.build
    //   )
    // );

    const createImages = shouldCreate(state.images, blueprint.images);
    actions.push(...createImages.map(ExecutionPlan.Action.Image.build));

    // volumes
    // actions.push(
    //   ...diffs.volumes.create.map(ExecutionPlan.Action.Volume.create)
    // );

    const createVolumes = shouldCreate(state.volumes, blueprint.volumes);
    actions.push(...createVolumes.map(ExecutionPlan.Action.Volume.create));

    //services
    // const SortServiceStartOrder = (
    //   l: Blueprint.Service,
    //   r: Blueprint.Service
    // ) => {
    //   if (Object.values(r.schematic.links).indexOf(l.name) !== -1) {
    //     return -1;
    //   } else if (Object.values(l.schematic.links).indexOf(r.name) !== -1) {
    //     return 1;
    //   }
    //   return 0;
    // };

    const ServiceCreateStartOrder = (
      l:
        | ExecutionPlan.Action.Service.Create
        | ExecutionPlan.Action.Service.Start,
      r:
        | ExecutionPlan.Action.Service.Create
        | ExecutionPlan.Action.Service.Start
    ) => {
      if (
        Object.values(r.payload.service.schematic.links).indexOf(
          l.payload.service.name
        ) !== -1
      ) {
        return -1;
      } else if (
        Object.values(l.payload.service.schematic.links).indexOf(
          r.payload.service.name
        ) !== -1
      ) {
        return 1;
      }
      return 0;
    };

    const createServices = shouldCreate(state.services, blueprint.services);
    const stoppedServices: (ClusterState.Service &
      Blueprint.Service)[] = state.services
      .filter(s => !s.info.State.Running)
      .map(s => ({
        ...s,
        ...blueprint.services.find(bs => bs.name === s.name)
      }));

    actions.push(
      ...[
        ...createServices.map(ExecutionPlan.Action.Service.create),
        ...stoppedServices.map(ExecutionPlan.Action.Service.start)
      ].sort(ServiceCreateStartOrder)
    );

    // const stoppedServices = state.services.filter(s => !s.info.State.Running);
    // const stoppedServiceNames = new Set(stoppedServices.map(s => s.name));

    // for (const service of [
    //   ...diffs.services.change,
    //   ...diffs.services.create,
    //   ...blueprint.services.filter(s => stoppedServiceNames.has(s.name))
    // ].sort(SortServiceStartOrder)) {
    //   if (stoppedServiceNames.has(service.name)) {
    //     actions.push(
    //       ExecutionPlan.Action.Service.start({
    //         ...stoppedServices.find(s => s.name === service.name),
    //         ...service
    //       })
    //     );
    //   } else {
    //     actions.push(ExecutionPlan.Action.Service.create(service));
    //   }
    // }

    // proxies
    // actions.push(
    //   ...[...diffs.proxies.change, ...diffs.proxies.create].map(
    //     ExecutionPlan.Action.Proxy.create
    //   )
    // );

    const createProxies = shouldCreate(state.proxies, blueprint.proxies);
    actions.push(...createProxies.map(ExecutionPlan.Action.Proxy.create));

    return {
      actions,
      project: blueprint.project
    };
  }
}

export namespace ExecutionPlan {
  export namespace Action {
    export namespace Image {
      export interface Build {
        payload: { image: Blueprint.Image };
        resource: 'Image';
        type: 'Build';
      }
      export interface Destroy {
        payload: { image: ClusterState.Image };
        resource: 'Image';
        type: 'Destroy';
      }
      export const build = (image: Blueprint.Image): Image.Build => ({
        payload: { image },
        resource: 'Image',
        type: 'Build'
      });
      export const destroy = (image: ClusterState.Image): Image.Destroy => ({
        payload: { image },
        resource: 'Image',
        type: 'Destroy'
      });
    }
    export type Image = Image.Build | Image.Destroy;

    export namespace Network {
      export interface Create {
        payload: { network: Blueprint.Network };
        resource: 'Network';
        type: 'Create';
      }
      export interface Destroy {
        payload: { network: ClusterState.Network };
        resource: 'Network';
        type: 'Destroy';
      }
      export const create = (network: Blueprint.Network): Network.Create => ({
        payload: { network },
        resource: 'Network',
        type: 'Create'
      });
      export const destroy = (
        network: ClusterState.Network
      ): Network.Destroy => ({
        payload: { network },
        resource: 'Network',
        type: 'Destroy'
      });
    }
    export type Network = Network.Create | Network.Destroy;

    export namespace Proxy {
      export interface Create {
        payload: { proxy: Blueprint.Proxy };
        resource: 'Proxy';
        type: 'Create';
      }
      export interface Destroy {
        payload: { proxy: ClusterState.Proxy };
        resource: 'Proxy';
        type: 'Destroy';
      }
      export const create = (proxy: Blueprint.Proxy): Proxy.Create => ({
        payload: { proxy },
        resource: 'Proxy',
        type: 'Create'
      });
      export const destroy = (proxy: ClusterState.Proxy): Proxy.Destroy => ({
        payload: { proxy },
        resource: 'Proxy',
        type: 'Destroy'
      });
    }
    export type Proxy = Proxy.Create | Proxy.Destroy;

    export namespace Service {
      export interface Create {
        payload: { service: Blueprint.Service };
        resource: 'Service';
        type: 'Create';
      }
      export interface Destroy {
        payload: { service: ClusterState.Service };
        resource: 'Service';
        type: 'Destroy';
      }
      export interface Start {
        payload: { service: ClusterState.Service & Blueprint.Service };
        resource: 'Service';
        type: 'Start';
      }
      export const create = (service: Blueprint.Service): Service.Create => ({
        payload: { service },
        resource: 'Service',
        type: 'Create'
      });
      export const destroy = (
        service: ClusterState.Service
      ): Service.Destroy => ({
        payload: { service },
        resource: 'Service',
        type: 'Destroy'
      });
      export const start = (
        service: ClusterState.Service & Blueprint.Service
      ): Service.Start => ({
        payload: { service },
        resource: 'Service',
        type: 'Start'
      });
    }
    export type Service = Service.Create | Service.Destroy | Service.Start;

    export namespace Volume {
      export interface Create {
        payload: { volume: Blueprint.Volume };
        resource: 'Volume';
        type: 'Create';
      }
      export interface Destroy {
        payload: { volume: ClusterState.Volume };
        resource: 'Volume';
        type: 'Destroy';
      }
      export const create = (volume: Blueprint.Volume): Volume.Create => ({
        payload: { volume },
        resource: 'Volume',
        type: 'Create'
      });
      export const destroy = (volume: ClusterState.Volume): Volume.Destroy => ({
        payload: { volume },
        resource: 'Volume',
        type: 'Destroy'
      });
    }
    export type Volume = Volume.Create | Volume.Destroy;
  }

  export type Action =
    | Action.Image
    | Action.Network
    | Action.Proxy
    | Action.Service
    | Action.Volume;
}
