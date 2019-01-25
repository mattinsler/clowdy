// import * as execa from 'execa';
// import { Readable } from 'stream';
// import * as Docker from 'dockerode';

// import { listQueryOpts } from './utils';
// import { ConnectionOptions, DockerClient, ListQueryFilters } from './types';

// export class SshClient implements DockerClient {
//   private client: Docker;

//   constructor(opts: ConnectionOptions.SSH) {
//     this.client = new Docker();
//   }

//   compose(
//     composeFilename: string,
//     opts: {
//       projectName?: string;
//     } = {}
//   ) {
//     const switches = ['-f', composeFilename];
//     if (opts.projectName) {
//       switches.push('-p', opts.projectName);
//     }

//     return {
//       down: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'down', ...argv]),
//       logs: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'logs', ...argv]),
//       start: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'start', ...argv]),
//       stop: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'stop', ...argv]),
//       rm: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'rm', ...argv]),
//       run: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'run', ...argv]),
//       up: (...argv: string[]) =>
//         execa('docker-compose', [...switches, 'up', ...argv])
//     };
//   }

//   containers = {
//     logs: (idOrName: string) =>
//       this.client.getContainer(idOrName).logs({
//         follow: true,
//         stderr: true,
//         stdout: true,
//         tail: 100,
//         timestamps: true
//       }) as Promise<Readable>,
//     inspect: (idOrName: string) => this.client.getContainer(idOrName).inspect(),
//     list: (filters?: ListQueryFilters): Promise<Docker.ContainerInfo[]> =>
//       this.client.listContainers(listQueryOpts({ filters })),
//     listAndInspect: async (filters?: ListQueryFilters) =>
//       Promise.all(
//         (await this.containers.list(filters)).map(c =>
//           this.client.getContainer(c.Id).inspect()
//         )
//       )
//   };

//   events = {
//     stream: () => this.client.getEvents() as Promise<Readable>
//   };

//   info = () => this.client.info();

//   networks = {
//     inspect: (id: string) => this.client.getNetwork(id).inspect(),
//     list: () => this.client.listNetworks(),
//     listAndInspect: async () => {
//       const networks = await this.networks.list();
//       return Promise.all(networks.map(n => this.networks.inspect(n.Id)));
//     }
//   };

//   version = () => this.client.version();

//   volumes = {
//     inspect: (name: string) => this.client.getVolume(name).inspect(),
//     list: async () => ((await this.client.listVolumes()) as any).Volumes
//   };
// }
