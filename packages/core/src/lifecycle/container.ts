import Docker from 'dockerode';
import { color } from '@oclif/color';
import { DockerClient } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Container } from '../resource-types';

export class ContainerLifecycle {
  static async create(
    client: DockerClient,
    container: Container.State.FromSpec
  ): Promise<Docker.ContainerInspectInfo> {
    console.log(
      `${color.green('-')} Container create: ${container.project}_${
        container.name
      }`
    );

    const imageList = await client.images.list({
      filters: {
        label: {
          [LABELS.name]: container.config.image,
          [LABELS.project]: container.project
        }
      }
    });

    // we assume that if an image is available in the spec then it is already built... so just
    // look up the image by name and project and fall back to the image string in the config

    // if (imageList.length === 0) {
    //   throw new Error(
    //     `Could not find an image matching name ${
    //       container.config.image
    //     } in project ${container.project}`
    //   );
    // }

    const opts: Docker.ContainerCreateOptions = {
      HostConfig: {
        NetworkMode: `${container.project}_default`
      },
      Image: imageList.length > 0 ? imageList[0].Id : container.config.image,
      Labels: {
        [LABELS.hash]: container.hash,
        [LABELS.name]: container.name,
        [LABELS.project]: container.project,
        [LABELS.type]: 'Service'
      },
      name: `${container.project}_${container.name}`
    };

    opts.AttachStderr = true;
    opts.AttachStdin = true;
    opts.AttachStdout = true;
    opts.OpenStdin = true;
    opts.Tty = true;

    if (container.config.command.length > 0) {
      opts.Cmd = container.config.command;
    }

    if (Object.keys(container.config.environment).length > 0) {
      opts.Env = Object.entries(container.config.environment).map(
        ([k, v]) => `${k}=${v}`
      );
    }

    if (container.config.expose.length > 0) {
      if (!opts.ExposedPorts) {
        opts.ExposedPorts = {};
      }
      // if (!opts.HostConfig) {
      //   opts.HostConfig = {};
      // }
      // if (!opts.HostConfig.PortBindings) {
      //   opts.HostConfig.PortBindings = {};
      // }

      for (const port of container.config.expose) {
        opts.ExposedPorts[`${port}/tcp`] = {};
        // opts.HostConfig.PortBindings[`${port}/tcp`] = [
        //   {
        //     HostIp: '0.0.0.0',
        //     HostPort: `${port}`
        //   }
        // ];
      }
    }

    if (Object.keys(container.config.links).length > 0) {
      // if (!opts.HostConfig) {
      //   opts.HostConfig = {};
      // }
      opts.HostConfig.Links = Object.entries(container.config.links).map(
        ([alias, target]) => `${target}:${alias}`
      );
    }

    if (Object.keys(container.config.volumes).length > 0) {
      // if (!opts.HostConfig) {
      //   opts.HostConfig = {};
      // }
      opts.HostConfig.Binds = [];
      opts.Volumes = {};

      for (const [containerPath, volume] of Object.entries(
        container.config.volumes
      )) {
        opts.HostConfig.Binds.push(
          `${
            volume.type === 'Volume.Docker'
              ? volume.volumeName
              : volume.directory
          }:${containerPath}`
        );
        opts.Volumes[containerPath.split(':')[0]] = {};
      }
    }

    // console.log(JSON.stringify(opts, null, 2));

    const info = await client.containers.create(opts);
    await client.containers.start(info.Id);

    return info;
  }

  static async destroy(
    client: DockerClient,
    container: Container.State.FromCluster
  ): Promise<void> {
    console.log(
      `${color.green('-')} Container destroy: ${container.project}_${
        container.name
      }`
    );
    // await client.containers.stop(container.info.Id);
    await client.containers.remove(container.info.Id, { force: true });
  }
}
