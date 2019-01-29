import execa from 'execa';
import Docker from 'dockerode';
import JSONStream from 'JSONStream';
import { PassThrough, Readable } from 'stream';

import {
  eventsStreamOptions,
  listContainerOptions,
  listImageOptions,
  listNetworkOptions,
  listVolumeOptions
} from './utils';
import {
  ContainerAttachOptions,
  ContainerAttachStream,
  ContainerExecOptions,
  ContainerListOptions,
  ContainerLogStream,
  ContainerLogsOptions,
  ContainerRemoveOptions,
  DockerEventReadable,
  DockerInfo,
  ExecInspectInfo,
  ExecStartOptions,
  EventsStreamOptions,
  ImageBuildOptions,
  ImageListOptions,
  NetworkCreateOptions,
  VolumeInfo,
  NetworkInspectInfo,
  NetworkListOptions,
  VolumeCreateOptions,
  VolumeListOptions
} from './types';

interface ComposeOpts {
  projectName?: string;
}

function compose(
  filename: string,
  opts: ComposeOpts,
  command: string,
  argv: string[]
) {
  const switches = ['-f', filename];
  if (opts.projectName) {
    switches.push('-p', opts.projectName);
  }

  return execa('docker-compose', [...switches, command, ...argv]);
}

export const ClientImpl = {
  compose: {
    create: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'create',
        argv
      ),
    down: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'down',
        argv
      ),
    logs: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'logs',
        argv
      ),
    start: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'start',
        argv
      ),
    stop: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'stop',
        argv
      ),
    rm: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'rm',
        argv
      ),
    run: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'run',
        argv
      ),
    up: (
      client: Docker,
      filename: string,
      opts: ComposeOpts = {},
      argv: string[]
    ): execa.ExecaChildProcess =>
      compose(
        filename,
        opts,
        'up',
        argv
      )
  },

  containers: {
    attach: async (
      client: Docker,
      idOrName: string,
      opts?: ContainerAttachOptions
    ): Promise<ContainerAttachStream> => {
      const info = await ClientImpl.containers.inspect(client, idOrName);

      const attachStream = await client.getContainer(idOrName).attach(
        Object.assign({}, opts, {
          stderr: true,
          stdin: true,
          stdout: true,
          stream: true
        })
      );

      const stderr = new PassThrough();
      const stdin = new PassThrough();
      const stdout = new PassThrough();
      const stream = new PassThrough();

      if (info.Config.Tty) {
        attachStream.pipe(stdout);
      } else {
        client.modem.demuxStream(attachStream, stdout, stderr);
      }

      stderr.pipe(stream);
      stdout.pipe(stream);
      stdin.pipe(attachStream);

      attachStream.on('end', () => {
        stdin.end();
        stderr.end();
        stdout.end();
        stream.end();

        stdin.destroy();
        stderr.destroy();
        stdout.destroy();
        stream.destroy();
      });

      return Object.assign(stream, { stderr, stdin, stdout });
    },
    create: async (
      client: Docker,
      opts: Docker.ContainerCreateOptions
    ): Promise<Docker.ContainerInspectInfo> =>
      (await client.createContainer(opts)).inspect(),
    exec: (
      client: Docker,
      idOrName: string,
      opts: ContainerExecOptions = {}
    ): Promise<{ id: string }> => client.getContainer(idOrName).exec(opts),
    inspect: (
      client: Docker,
      idOrName: string
    ): Promise<Docker.ContainerInspectInfo> =>
      client.getContainer(idOrName).inspect(),
    kill: (client: Docker, idOrName: string, signal?: string): Promise<void> =>
      client.getContainer(idOrName).kill({ signal }),
    list: (
      client: Docker,
      opts?: ContainerListOptions
    ): Promise<Docker.ContainerInfo[]> =>
      client.listContainers(listContainerOptions(opts)),
    listAndInspect: async (
      client: Docker,
      opts?: ContainerListOptions
    ): Promise<Docker.ContainerInspectInfo[]> =>
      Promise.all(
        (await ClientImpl.containers.list(client, opts)).map(c =>
          ClientImpl.containers.inspect(client, c.Id)
        )
      ),
    logs: async (
      client: Docker,
      idOrName: string,
      opts: ContainerLogsOptions = {}
    ): Promise<ContainerLogStream> => {
      const info = await ClientImpl.containers.inspect(client, idOrName);

      const logStream = await client.getContainer(idOrName).logs(
        Object.assign(
          {
            tail: 100,
            timestamps: true
          },
          opts,
          {
            follow: true,
            stderr: true,
            stdout: true
          }
        )
      );

      const stderr = new PassThrough();
      const stdout = new PassThrough();
      const stream = new PassThrough();

      if (info.Config.Tty) {
        logStream.pipe(stdout);
      } else {
        client.modem.demuxStream(logStream, stdout, stderr);
      }

      stdout.pipe(stream);
      stderr.pipe(stream);

      logStream.on('end', () => {
        stderr.end();
        stdout.end();
        stream.end();

        stderr.destroy();
        stdout.destroy();
        stream.destroy();
      });

      return Object.assign(stream, { stderr, stdout });
    },
    put: async (
      client: Docker,
      idOrName: string,
      file: string | Buffer | Readable,
      opts: { path: string; noOverwriteDirNonDir?: string }
    ): Promise<void> => {
      const res = await client.getContainer(idOrName).putArchive(file, opts);
    },
    remove: (
      client: Docker,
      idOrName: string,
      opts?: ContainerRemoveOptions
    ): Promise<void> => client.getContainer(idOrName).remove(opts),
    restart: (
      client: Docker,
      idOrName: string,
      secondsBeforeKill?: number
    ): Promise<void> =>
      client.getContainer(idOrName).restart({ t: secondsBeforeKill }),
    start: (client: Docker, idOrName: string): Promise<void> =>
      client.getContainer(idOrName).start(),
    stop: (client: Docker, idOrName: string): Promise<void> =>
      client.getContainer(idOrName).stop()
  },

  events: {
    stream: async (
      client: Docker,
      opts?: EventsStreamOptions
    ): Promise<Readable> =>
      (await client.getEvents(eventsStreamOptions(opts))).pipe(
        JSONStream.parse()
      ) as Promise<DockerEventReadable>
  },

  exec: {
    inspect: (client: Docker, id: string): Promise<ExecInspectInfo> =>
      client.getExec(id).inspect(),
    resize: (
      client: Docker,
      id: string,
      opts: { h: number; w: number }
    ): Promise<void> => client.getExec(id).resize(opts),

    start: async (client: Docker, id: string, opts: ExecStartOptions = {}) => {
      if (opts.Detach) {
        return client.getExec(id).start(opts);
      }

      const tty =
        opts.Tty ||
        (await ClientImpl.exec.inspect(client, id)).ProcessConfig.tty;

      const attachStream = (await client.getExec(id).start({
        ...opts,
        hijack: true
      })).output as NodeJS.ReadWriteStream;

      const stderr = new PassThrough();
      const stdin = new PassThrough();
      const stdout = new PassThrough();
      const stream = new PassThrough();

      if (tty) {
        attachStream.pipe(stdout);
      } else {
        client.modem.demuxStream(attachStream, stdout, stderr);
      }

      stderr.pipe(stream);
      stdout.pipe(stream);
      stdin.pipe(attachStream);

      attachStream.on('end', () => {
        stdin.end();
        stderr.end();
        stdout.end();
        stream.end();

        stdin.destroy();
        stderr.destroy();
        stdout.destroy();
        stream.destroy();
      });

      return Object.assign(stream, { stderr, stdin, stdout });
    }
  },

  info: (client: Docker): Promise<DockerInfo> => client.info(),

  images: {
    build: (
      client: Docker,
      stream: Readable,
      opts?: ImageBuildOptions
    ): Promise<Readable> =>
      client.buildImage(stream, opts) as Promise<Readable>,
    inspect: (
      client: Docker,
      idOrName: string
    ): Promise<Docker.ImageInspectInfo> => client.getImage(idOrName).inspect(),
    list: (
      client: Docker,
      opts?: ImageListOptions
    ): Promise<Docker.ImageInfo[]> => client.listImages(listImageOptions(opts)),
    listAndInspect: async (
      client: Docker,
      opts?: ImageListOptions
    ): Promise<Docker.ImageInspectInfo[]> =>
      Promise.all(
        (await ClientImpl.images.list(client, opts)).map(c =>
          ClientImpl.images.inspect(client, c.Id)
        )
      ),
    remove: (
      client: Docker,
      idOrName: string,
      opts?: { force?: boolean; noprune?: boolean }
    ): Promise<void> => client.getImage(idOrName).remove(opts),
    pull: (client: Docker, name: string, opts = {}): Promise<Readable> =>
      client.pull(name, opts) as Promise<Readable>
  },

  networks: {
    create: async (
      client: Docker,
      opts: NetworkCreateOptions
    ): Promise<NetworkInspectInfo> => {
      const { id } = await client.createNetwork(opts);
      return ClientImpl.networks.inspect(client, id);
    },
    inspect: (client: Docker, id: string): Promise<NetworkInspectInfo> =>
      client.getNetwork(id).inspect(),
    list: (
      client: Docker,
      opts?: NetworkListOptions
    ): Promise<NetworkInspectInfo[]> =>
      client.listNetworks(listNetworkOptions(opts)),
    remove: (client: Docker, id: string): Promise<void> =>
      client.getNetwork(id).remove()
  },

  version: (client: Docker): Promise<Docker.DockerVersion> => client.version(),

  volumes: {
    create: (
      client: Docker,
      opts: VolumeCreateOptions = {}
    ): Promise<VolumeInfo> => client.createVolume(opts),
    inspect: (client: Docker, name: string): Promise<VolumeInfo> =>
      client.getVolume(name).inspect(),
    list: async (
      client: Docker,
      opts?: VolumeListOptions
    ): Promise<VolumeInfo[]> =>
      ((await client.listVolumes(listVolumeOptions(opts))) as any).Volumes,
    remove: (
      client: Docker,
      idOrName: string,
      opts?: { force?: boolean }
    ): Promise<void> => client.getVolume(idOrName).remove(opts)
  }
};
