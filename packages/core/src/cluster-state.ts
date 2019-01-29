import Docker from 'dockerode';
import { NetworkInspectInfo, VolumeInfo } from '@clowdy/docker';

import { LABELS } from './labels';
import { dockerClient } from './utils';
import { Schematic } from './schematic';

export interface ClusterState {
  images: ClusterState.Image[];
  networks: ClusterState.Network[];
  project: string;
  proxies: ClusterState.Proxy[];
  services: ClusterState.Service[];
  volumes: ClusterState.Volume[];
}

export class ClusterState {
  static empty(project: string): ClusterState {
    return {
      images: [],
      networks: [],
      project,
      proxies: [],
      services: [],
      volumes: []
    };
  }

  static async from(
    cluster: Schematic.Cluster,
    project: string
  ): Promise<ClusterState> {
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

    const images: ClusterState.Image[] = imageInfos.map(
      ClusterState.Image.from
    );

    const networks: ClusterState.Network[] = networkInfos.map(
      ClusterState.Network.from
    );

    const proxies: ClusterState.Proxy[] = containerInfos
      .filter(info => info.Config.Labels[LABELS.type] === 'Proxy')
      .map(ClusterState.Proxy.from);

    const services: ClusterState.Service[] = containerInfos
      .filter(info => info.Config.Labels[LABELS.type] === 'Service')
      .map(ClusterState.Service.from);

    const volumes: ClusterState.Volume[] = volumeInfos.map(
      ClusterState.Volume.from
    );

    return {
      images,
      networks,
      project,
      proxies,
      services,
      volumes
    };
  }
}

type State<ResourceType extends string> = {
  hash: string;
  name: string;
  project: string;
  resource: ResourceType;
};

function extractPorts(info: Docker.ContainerInspectInfo): number[] {
  return Object.values(info.NetworkSettings.Ports).reduce(
    (arr, portArray) => {
      return arr.concat(...portArray.map(p => Number(p.HostPort)));
    },
    [] as number[]
  );
}

export namespace ClusterState {
  export interface Image extends State<'Image'> {
    info: Docker.ImageInspectInfo;
  }
  export namespace Image {
    export const from = (
      info: Docker.ImageInspectInfo
    ): ClusterState.Image => ({
      hash: info.Config.Labels[LABELS.hash],
      info,
      name: info.Config.Labels[LABELS.name],
      project: info.Config.Labels[LABELS.project],
      resource: 'Image'
    });
  }

  export interface Network extends State<'Network'> {
    info: NetworkInspectInfo;
  }
  export namespace Network {
    export const from = (info: NetworkInspectInfo): ClusterState.Network => ({
      hash: info.Labels[LABELS.hash],
      info,
      name: info.Labels[LABELS.name],
      project: info.Labels[LABELS.project],
      resource: 'Network'
    });
  }

  export interface Proxy extends State<'Proxy'> {
    expose: 'all' | number[];
    info: Docker.ContainerInspectInfo;
    ports: number[];
  }
  export namespace Proxy {
    export const from = (
      info: Docker.ContainerInspectInfo
    ): ClusterState.Proxy => ({
      expose: JSON.parse(info.Config.Labels[LABELS.expose]),
      hash: info.Config.Labels[LABELS.hash],
      info,
      name: info.Config.Labels[LABELS.name],
      ports: extractPorts(info),
      project: info.Config.Labels[LABELS.project],
      resource: 'Proxy'
    });
  }

  export interface Service extends State<'Service'> {
    info: Docker.ContainerInspectInfo;
    mode: Schematic.Mode;
  }
  export namespace Service {
    export const from = (
      info: Docker.ContainerInspectInfo
    ): ClusterState.Service => ({
      hash: info.Config.Labels[LABELS.hash],
      info,
      mode: info.Config.Labels[LABELS.mode] as any,
      name: info.Config.Labels[LABELS.name],
      project: info.Config.Labels[LABELS.project],
      resource: 'Service'
    });
  }

  export interface Volume extends State<'Volume'> {
    info: VolumeInfo;
  }
  export namespace Volume {
    export const from = (info: VolumeInfo): ClusterState.Volume => ({
      hash: info.Labels[LABELS.hash],
      info,
      name: info.Labels[LABELS.name],
      project: info.Labels[LABELS.project],
      resource: 'Volume'
    });
  }
}
