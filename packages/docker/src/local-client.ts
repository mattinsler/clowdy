import Docker from 'dockerode';
import { Readable } from 'stream';

import { ClientImpl } from './client-impl';
import {
  ConnectionOptions,
  ContainerAttachOptions,
  ContainerListOptions,
  ContainerLogsOptions,
  ContainerRemoveOptions,
  DockerClient,
  EventsStreamOptions,
  ImageBuildOptions,
  ImageListOptions,
  NetworkCreateOptions,
  NetworkListOptions,
  VolumeCreateOptions,
  VolumeListOptions
} from './types';

export class LocalClient implements DockerClient {
  private client: Docker;

  constructor(opts: ConnectionOptions.Local) {
    this.client = new Docker();
  }

  compose = (
    composeFilename: string,
    opts?: {
      projectName?: string;
    }
  ) => ({
    create: (...argv: string[]) =>
      ClientImpl.compose.create(this.client, composeFilename, opts, argv),
    down: (...argv: string[]) =>
      ClientImpl.compose.down(this.client, composeFilename, opts, argv),
    logs: (...argv: string[]) =>
      ClientImpl.compose.logs(this.client, composeFilename, opts, argv),
    start: (...argv: string[]) =>
      ClientImpl.compose.start(this.client, composeFilename, opts, argv),
    stop: (...argv: string[]) =>
      ClientImpl.compose.stop(this.client, composeFilename, opts, argv),
    rm: (...argv: string[]) =>
      ClientImpl.compose.rm(this.client, composeFilename, opts, argv),
    run: (...argv: string[]) =>
      ClientImpl.compose.run(this.client, composeFilename, opts, argv),
    up: (...argv: string[]) =>
      ClientImpl.compose.up(this.client, composeFilename, opts, argv)
  });

  containers = {
    attach: (idOrName: string, opts?: ContainerAttachOptions) =>
      ClientImpl.containers.attach(this.client, idOrName, opts),
    create: (opts: Docker.ContainerCreateOptions) =>
      ClientImpl.containers.create(this.client, opts),
    inspect: (idOrName: string) =>
      ClientImpl.containers.inspect(this.client, idOrName),
    kill: (idOrName: string, signal?: string) =>
      ClientImpl.containers.kill(this.client, idOrName, signal),
    list: (opts?: ContainerListOptions) =>
      ClientImpl.containers.list(this.client, opts),
    listAndInspect: (opts?: ContainerListOptions) =>
      ClientImpl.containers.listAndInspect(this.client, opts),
    logs: (idOrName: string, opts?: ContainerLogsOptions) =>
      ClientImpl.containers.logs(this.client, idOrName, opts),
    put: (
      idOrName: string,
      file: string | Buffer | Readable,
      opts: { path: string; noOverwriteDirNonDir?: string }
    ) => ClientImpl.containers.put(this.client, idOrName, file, opts),
    remove: (idOrName: string, opts?: ContainerRemoveOptions) =>
      ClientImpl.containers.remove(this.client, idOrName, opts),
    restart: (idOrName: string, secondsBeforeKill?: number) =>
      ClientImpl.containers.restart(this.client, idOrName, secondsBeforeKill),
    start: (idOrName: string) =>
      ClientImpl.containers.start(this.client, idOrName),
    stop: (idOrName: string) =>
      ClientImpl.containers.stop(this.client, idOrName)
  };

  events = {
    stream: (opts?: EventsStreamOptions) =>
      ClientImpl.events.stream(this.client, opts)
  };

  images = {
    build: (stream: Readable, opts?: ImageBuildOptions) =>
      ClientImpl.images.build(this.client, stream, opts),
    inspect: (idOrName: string) =>
      ClientImpl.images.inspect(this.client, idOrName),
    list: (opts?: ImageListOptions) =>
      ClientImpl.images.list(this.client, opts),
    listAndInspect: (opts?: ImageListOptions) =>
      ClientImpl.images.listAndInspect(this.client, opts),
    remove: (idOrName: string, opts?: { force?: boolean; noprune?: boolean }) =>
      ClientImpl.images.remove(this.client, idOrName, opts)
  };

  info = () => ClientImpl.info(this.client);

  networks = {
    create: (opts: NetworkCreateOptions) =>
      ClientImpl.networks.create(this.client, opts),
    inspect: (id: string) => ClientImpl.networks.inspect(this.client, id),
    list: (opts?: NetworkListOptions) =>
      ClientImpl.networks.list(this.client, opts),
    remove: (id: string) => ClientImpl.networks.remove(this.client, id)
  };

  version = () => ClientImpl.version(this.client);

  volumes = {
    create: (opts?: VolumeCreateOptions) =>
      ClientImpl.volumes.create(this.client, opts),
    inspect: (name: string) => ClientImpl.volumes.inspect(this.client, name),
    list: (opts?: VolumeListOptions) =>
      ClientImpl.volumes.list(this.client, opts),
    remove: (idOrName: string, opts?: { force?: boolean }) =>
      ClientImpl.volumes.remove(this.client, idOrName, opts)
  };
}
