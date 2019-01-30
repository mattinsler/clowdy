import Docker from 'dockerode';
import { DockerClient } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Blueprint } from '../blueprint';
import { ClusterState } from '../cluster-state';

async function getImageId(client: DockerClient, image: string, project: string): Promise<string> {
  const list = await client.images.list({
    filters: {
      label: {
        [LABELS.name]: image,
        [LABELS.project]: project
      }
    }
  });

  return list.length > 0 ? list[0].Id : image;
}

export const Service = {
  create: async (client: DockerClient, service: Blueprint.Service): Promise<Docker.ContainerInspectInfo> => {
    const image = await getImageId(client, service.config.image, service.project);

    const opts: Docker.ContainerCreateOptions = {
      AttachStderr: true,
      AttachStdin: true,
      AttachStdout: true,
      HostConfig: {
        // NetworkMode: service.config.network
      },
      Hostname: service.name,
      Image: image,
      Labels: {
        [LABELS.hash]: service.hash,
        [LABELS.mode]: service.schematic.mode,
        [LABELS.name]: service.name,
        [LABELS.project]: service.project,
        [LABELS.type]: 'Service'
      },
      OpenStdin: true,
      Tty: true,
      name: `${service.project}_${service.name}`
    };

    if (service.config.command.length > 0) {
      opts.Cmd = service.config.command;
    }

    if (service.config.cwd) {
      opts.WorkingDir = service.config.cwd;
    }

    if (Object.keys(service.config.environment).length > 0) {
      opts.Env = Object.entries(service.config.environment).map(([k, v]) => `${k}=${v}`);
    }

    if (service.config.expose.length > 0) {
      opts.ExposedPorts = service.config.expose.reduce((o, port) => {
        o[`${port}/tcp`] = {};
        return o;
      }, {});
    }

    if (Object.keys(service.config.links).length > 0) {
      // const targetContainers: {
      //   [name: string]: Docker.ContainerInspectInfo;
      // } = (await client.containers.listAndInspect({
      //   filters: {
      //     label: {
      //       [LABELS.name]: Object.values(service.config.links),
      //       [LABELS.project]: service.project,
      //       [LABELS.type]: 'Service'
      //     }
      //   }
      // })).reduce((o, c) => {
      //   o[c.Config.Labels[LABELS.name]] = c;
      //   return o;
      // }, {});

      // opts.HostConfig.ExtraHosts = Object.entries(service.config.links).map(
      //   ([alias, target]) =>
      //     `${alias}:${
      //       targetContainers[target].NetworkSettings.Networks[
      //         service.config.network
      //       ].IPAddress
      //     }`
      // );

      opts.HostConfig.Links = Object.entries(service.config.links).map(
        ([alias, target]) => `${service.project}_${target}:${alias}`
        // `${targetContainers[target].Name.replace(/^\/+/, '')}:${alias}`
      );
    }

    if (Object.keys(service.config.volumes).length > 0) {
      opts.HostConfig.Binds = [];
      opts.Volumes = {};

      for (const [containerPath, volume] of Object.entries(service.config.volumes)) {
        opts.HostConfig.Binds.push(
          `${volume.type === 'Volume.Docker' ? volume.volumeName : volume.directory}:${containerPath}`
        );
        opts.Volumes[containerPath.split(':')[0]] = {};
      }
    }

    if (process.env.DEBUG) {
      console.log(opts);
    }

    const info = await client.containers.create(opts);
    await client.containers.start(info.Id);
    return info;
  },

  destroy: async (client: DockerClient, service: ClusterState.Service): Promise<void> => {
    await client.containers.remove(service.info.Id, { force: true });
  },

  start: async (client: DockerClient, service: ClusterState.Service): Promise<void> => {
    await client.containers.start(service.info.Id);
  }
};
