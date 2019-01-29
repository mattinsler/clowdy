import { Omit } from 'lodash';
import Docker from 'dockerode';
import { Readable, Duplex, Writable } from 'stream';
import { ExecaChildProcess } from 'execa';

import { DockerEvent } from './event-types';
export * from './event-types';

export interface ContainerAttachOptions {
  // Override the key sequence for detaching a container.Format is a single character [a-Z] or ctrl-<value> where <value> is one of: a-z, @, ^, [, , or _.
  detachKeys?: string;
  // Replay previous logs from the container.
  logs?: boolean;
}

export interface ContainerCreateOptions {
  name: string;
  command: string | string[];
  env: { [key: string]: string };
  expose: number[];
  image: string;
  links: { [alias: string]: string };
  ports: {
    [externalPort: string]: string;
  };
  volumes: {
    [containerPath: string]: string; // not sure what to do here yet...
  };
}

export interface ContainerExecOptions {
  AttachStdin?: boolean;
  AttachStdout?: boolean;
  AttachStderr?: boolean;
  DetachKeys?: string;
  Tty?: boolean;
  Cmd?: string[];
  Privileged?: boolean;
  User?: string;
  WorkingDir?: string;
}

export type ContainerLogsOptions = Omit<
  Docker.ContainerLogsOptions,
  'follow' | 'stderr' | 'stdout'
>;

export interface ContainerRemoveOptions {
  // Remove the volumes associated with the container.
  v?: boolean;
  // If the container is running, kill it before removing it.
  force?: boolean;
  // Remove the specified link associated with the container.
  link?: boolean;
}

export interface ExecInspectInfo {
  CanRemove: boolean;
  DetachKeys: string;
  ID: string;
  Running: boolean;
  ExitCode: number;
  ProcessConfig: {
    privileged: boolean;
    user: string;
    tty: boolean;
    entrypoint: string;
    arguments: string[];
  };
  OpenStdin: boolean;
  OpenStderr: boolean;
  OpenStdout: boolean;
  ContainerID: string;
  Pid: number;
}

export interface ExecStartOptions {
  Detach?: boolean;
  Tty?: boolean;
}

export interface ImageBuildOptions {
  dockerfile?: string;
  t?: string;
  extrahosts?: string;
  remote?: string;
  q?: boolean;
  nocache?: boolean;
  cachefrom?: string;
  pull?: string;
  rm?: boolean;
  forcerm?: boolean;
  memory?: number;
  memswap?: number;
  cpushares?: number;
  cpusetcpus?: string;
  cpuperiod?: number;
  cpuquota?: number;
  buildargs?: string;
  shmsize?: number;
  squash?: boolean;
  labels?: string;
  networkmode?: string;
  platform?: string;
  target?: string;
}

export interface VolumeCreateOptions {
  Name?: string;
  Driver?: string;
  DriverOpts?: { [key: string]: string };
  Labels?: { [key: string]: string };
}

export interface DockerInfo {
  Architecture: string;
  BridgeNfIp6tables: boolean;
  BridgeNfIptables: boolean;
  CPUSet: boolean;
  CPUShares: boolean;
  CgroupDriver: string;
  ClusterAdvertise: string;
  ClusterStore: string;
  ContainerdCommit: {
    ID: string;
    Expected: string;
  };
  Containers: number;
  ContainersPaused: number;
  ContainersRunning: number;
  ContainersStopped: number;
  CpuCfsPeriod: boolean;
  CpuCfsQuota: boolean;
  Debug: boolean;
  DefaultRuntime: string;
  DockerRootDir: string;
  Driver: string;
  DriverStatus: [string, string][];
  ExperimentalBuild: boolean;
  GenericResources: null;
  HttpProxy: string;
  HttpsProxy: string;
  ID: string;
  IPv4Forwarding: boolean;
  Images: number;
  IndexServerAddress: string;
  InitBinary: string;
  InitCommit: {
    ID: string;
    Expected: string;
  };
  Isolation: string;
  KernelMemory: boolean;
  KernelVersion: string;
  Labels: string[];
  LiveRestoreEnabled: boolean;
  LoggingDriver: string;
  MemTotal: number;
  MemoryLimit: boolean;
  NCPU: number;
  NEventsListener: number;
  NFd: number;
  NGoroutines: number;
  Name: string;
  NoProxy: string;
  OSType: string;
  OomKillDisable: boolean;
  OperatingSystem: string;
  Plugins: {
    Authorization: null | string[];
    Log: null | string[];
    Network: null | string[];
    Volume: null | string[];
  };
  ProductLicense: string;
  RegistryConfig: {
    AllowNondistributableArtifactsCIDRs: string[];
    AllowNondistributableArtifactsHostnames: string[];
    IndexConfigs: {
      [name: string]: {
        Mirrors: string[];
        Name: string;
        Official: boolean;
        Secure: boolean;
      };
    };
    InsecureRegistryCIDRs: string[];
    Mirrors: string[];
  };
  RuncCommit: { ID: string; Expected: string };
  Runtimes: { [name: string]: any };
  SecurityOptions: string[];
  ServerVersion: string;
  SwapLimit: boolean;
  Swarm: {
    ControlAvailable: boolean;
    Error: string;
    LocalNodeState: string;
    NodeAddr: string;
    NodeID: string;
    RemoteManagers: null;
  };
  SystemStatus: null;
  SystemTime: string;
  Warnings: null;
}

export interface NetworkInspectInfo {
  Name: string; // 'bridge';
  Id: string; // '052e9f4d4f0ba2b402919b01bd98b49ce2ef0a2254f39e95360c351d92be203c';
  Created: string; // '2018-12-27T06:29:32.044834427Z';
  Scope: string; // 'local';
  Driver: string; // 'bridge';
  EnableIPv6: boolean; // false;
  IPAM: any; // { Driver: 'default'; Options: null; Config: [Array] };
  Internal: boolean; // false;
  Attachable: boolean; // false;
  Ingress: boolean; // false;
  ConfigFrom: { Network: string }; // { Network: '' };
  ConfigOnly: boolean; // false;
  Containers: any; // {};
  Options: { [key: string]: string };
  // Options: {
  //   'com.docker.network.bridge.default_bridge': 'true';
  //   'com.docker.network.bridge.enable_icc': 'true';
  //   'com.docker.network.bridge.enable_ip_masquerade': 'true';
  //   'com.docker.network.bridge.host_binding_ipv4': '0.0.0.0';
  //   'com.docker.network.bridge.name': 'docker0';
  //   'com.docker.network.driver.mtu': '1500';
  // };
  Labels: { [key: string]: string };
  // Labels:
  //    { 'com.docker.compose.network': 'default',
  //      'com.docker.compose.project': 'foo',
  //      'com.docker.compose.version': '1.23.2' }
}

export interface VolumeInfo {
  CreatedAt: string;
  Driver: string;
  Labels: null | { [label: string]: string };
  Mountpoint: string;
  Name: string;
  Options: any;
  Scope: string;
}

export interface DockerEventStream {
  addListener(event: 'data', listener: (event: DockerEvent) => void): this;
  on(event: 'data', listener: (event: DockerEvent) => void): this;
  once(event: 'data', listener: (event: DockerEvent) => void): this;
  prependListener(event: 'data', listener: (event: DockerEvent) => void): this;
  prependOnceListener(
    event: 'data',
    listener: (event: DockerEvent) => void
  ): this;
  removeListener(event: 'data', listener: (event: DockerEvent) => void): this;
  removeAllListeners(): this;
  removeAllListeners(event: 'data'): this;
  listeners(event: 'connected'): Function[];
  rawListeners(event: 'connected'): Function[];
  emit(event: 'data', dockerEvent: DockerEvent): boolean;
  listenerCount(type: 'data'): number;
}

export type DockerEventReadable = Readable & DockerEventStream;

export enum DockerClusterDisconnectedReason {
  DOCKER_NOT_RUNNING = 'DOCKER_NOT_RUNNING',
  DOCKER_STARTING = 'DOCKER_STARTING',
  DISCONNECT_REQUESTED = 'DISCONNECT_REQUESTED',
  UNKNOWN = 'UNKNOWN'
}

export type ContainerHealth = 'starting' | 'healthy' | 'unhealthy' | 'none';
export type ContainerIsolation = 'default' | 'process' | 'hyperv';
export type ContainerStatus =
  | 'created'
  | 'restarting'
  | 'running'
  | 'removing'
  | 'paused'
  | 'exited'
  | 'dead';

export interface ContainerFilters {
  // ancestor=(<image-name>[:<tag>], <image id>, or <image@digest>)
  ancestor?: string | string[];
  // before=(<container id> or <container name>)
  before?: string | string[];
  // expose=(<port>[/<proto>]|<startport-endport>/[<proto>])
  expose?: string | string[];
  // exited=<int> containers with exit code of <int>
  exited?: number | number[];
  // health=(starting|healthy|unhealthy|none)
  health?: ContainerHealth | ContainerHealth[];
  // id=<ID> a container's ID
  id?: string | string[];
  // isolation=(default|process|hyperv) (Windows daemon only)
  isolation?: ContainerIsolation | ContainerIsolation[];
  // is-task=(true|false)
  'is-task'?: boolean;
  // label=key or label="key=value" of a container label
  label?: { [label: string]: string | string[] | true };
  // name=<name> a container's name
  name?: string | string[];
  // network=(<network id> or <network name>)
  network?: string | string[];
  // publish=(<port>[/<proto>]|<startport-endport>/[<proto>])
  publish?: string | string[];
  // since=(<container id> or <container name>)
  since?: string | string[];
  // status=(created|restarting|running|removing|paused|exited|dead)
  status?: ContainerStatus;
  // volume=(<volume name> or <mount point destination>)
  volume?: string | string[];
}

export interface ContainerListOptions {
  // Return all containers. By default, only running containers are shown
  all?: true;
  // Filters to process on the container list, encoded as JSON (a map[string][]string). For example, {"status": ["paused"]} will only return paused containers.
  filters?: ContainerFilters;
  // Return this number of most recently created containers, including non-running ones.
  limit?: number;
  // Return the size of container as fields SizeRw and SizeRootFs.
  size?: true;
}

export interface EventsStreamFilters {
  // config=<string> config name or ID
  config?: string | string[];
  // container=<string> container name or ID
  container?: string | string[];
  // daemon=<string> daemon name or ID
  daemon?: string | string[];
  // event=<string> event type
  event?: string | string[];
  // image=<string> image name or ID
  image?: string | string[];
  // label=<string> image or container label
  label?: { [label: string]: string | string[] | true };
  // network=<string> network name or ID
  network?: string | string[];
  // node=<string> node ID
  node?: string | string[];
  // plugin= plugin name or ID
  plugin?: string | string[];
  // scope= local or swarm
  scope?: ('local' | 'swarm') | ('local' | 'swarm')[];
  // secret=<string> secret name or ID
  secret?: string | string[];
  // service=<string> service name or ID
  service?: string | string[];
  // type=<string> object to filter by, one of container, image, volume, network, daemon, plugin, node, service, secret or config
  type?:
    | (
        | 'container'
        | 'image'
        | 'volume'
        | 'network'
        | 'daemon'
        | 'plugin'
        | 'node'
        | 'service'
        | 'secret'
        | 'config')
    | (
        | 'container'
        | 'image'
        | 'volume'
        | 'network'
        | 'daemon'
        | 'plugin'
        | 'node'
        | 'service'
        | 'secret'
        | 'config')[];
  // volume=<string> volume name
  volume?: string | string[];
}

export interface EventsStreamOptions {
  // A JSON encoded value of filters (a map[string][]string) to process on the event list. Available filters:
  filters?: EventsStreamFilters;
  // Show events created since this timestamp then stream new events.
  since?: string;
  // Show events created until this timestamp then stop streaming.
  until?: string;
}

export interface ImageFilters {
  // before=(<image-name>[:<tag>], <image id> or <image@digest>)
  before?: string | string[];
  // dangling=true
  dangling?: true;
  // label=key or label="key=value" of an image label
  label?: { [label: string]: string | string[] | true };
  // reference=(<image-name>[:<tag>])
  reference?: string | string[];
  // since=(<image-name>[:<tag>], <image id> or <image@digest>)
  since?: string | string[];
}

export interface ImageListOptions {
  // Show all images. Only images from a final layer (no children) are shown by default.
  all?: true;
  // Show digest information as a RepoDigests field on each image.
  digests?: true;
  // A JSON encoded value of the filters (a map[string][]string) to process on the images list.
  filters?: ImageFilters;
}

export type NetworkScope = 'global' | 'local' | 'swarm';
export type NetworkType = 'builtin' | 'custom';

export interface NetworkFilters {
  // driver=<driver-name> Matches a network's driver.
  driver?: string | string[];
  // id=<network-id> Matches all or part of a network ID.
  id?: string | string[];
  // label=<key> or label=<key>=<value> of a network label.
  label?: { [label: string]: string | string[] | true };
  // name=<network-name> Matches all or part of a network name.
  name?: string | string[];
  // scope=["swarm"|"global"|"local"] Filters networks by scope (swarm, global, or local).
  scope?: NetworkScope | NetworkScope[];
  // type=["custom"|"builtin"] Filters networks by type. The custom keyword returns all user-defined networks.
  type?: NetworkType | NetworkType[];
}

export interface NetworkListOptions {
  // JSON encoded value of the filters (a map[string][]string) to process on the networks list.
  filters?: NetworkFilters;
}

export interface VolumeFilters {
  // dangling=<boolean> When set to true (or 1), returns all volumes that are not in use by a container. When set to false (or 0), only volumes that are in use by one or more containers are returned.
  dangling?: boolean;
  // driver=<volume-driver-name> Matches volumes based on their driver.
  driver?: string | string[];
  // label=<key> or label=<key>:<value> Matches volumes based on the presence of a label alone or a label and a value.
  label?: { [label: string]: string | string[] | true };
  // name=<volume-name> Matches all or part of a volume name.
  name?: string | string[];
}

export interface VolumeListOptions {
  // JSON encoded value of the filters (a map[string][]string) to process on the volumes list.
  filters?: VolumeFilters;
}

export namespace ConnectionOptions {
  export interface Local {
    type: 'local';
  }

  export interface SSH {
    type: 'ssh';
    host: string;
    keyfile?: string;
    port?: number;
    username: string;
  }
}

export type ConnectionOptions = ConnectionOptions.Local | ConnectionOptions.SSH;

export interface NetworkCreateOptions {
  // The network's name.
  Name: string;
  // Check for networks with duplicate names. Since Network is primarily keyed based on a random ID and not on the name, and network name is strictly a user-friendly alias to the network which is uniquely identified using ID, there is no guaranteed way to check for duplicates. CheckDuplicate is there to provide a best effort checking of any networks which has the same name but it is not guaranteed to catch all name collisions.
  CheckDuplicate?: boolean;
  // Name of the network driver plugin to use.
  Driver?: string;
  // Restrict external access to the network.
  Internal?: boolean;
  // Globally scoped network is manually attachable by regular containers from workers in swarm mode.
  Attachable?: boolean;
  // Ingress network is the network which provides the routing-mesh in swarm mode.
  Ingress?: boolean;
  IPAM?: any;
  // Enable IPv6 on the network.
  EnableIPv6?: boolean;
  // Network specific options to be used by the drivers.
  Options?: { [key: string]: string };
  // User-defined key/value metadata.
  Labels?: { [key: string]: string };
}

export interface ContainerAttachStream extends Duplex {
  readonly stderr: Readable;
  readonly stdin: Writable;
  readonly stdout: Readable;
}

export interface ContainerLogStream extends Readable {
  readonly stderr: Readable;
  readonly stdout: Readable;
}

export interface DockerComposeClient {
  create(...argv: string[]): ExecaChildProcess;
  down(...argv: string[]): ExecaChildProcess;
  logs(...argv: string[]): ExecaChildProcess;
  start(...argv: string[]): ExecaChildProcess;
  stop(...argv: string[]): ExecaChildProcess;
  rm(...argv: string[]): ExecaChildProcess;
  run(...argv: string[]): ExecaChildProcess;
  up(...argv: string[]): ExecaChildProcess;
}

export interface DockerClient {
  compose(
    composeFilename: string,
    opts?: {
      projectName?: string;
    }
  ): DockerComposeClient;

  containers: {
    attach(
      idOrName: string,
      opts?: ContainerAttachOptions
    ): Promise<ContainerAttachStream>;
    create(
      opts: Docker.ContainerCreateOptions
    ): Promise<Docker.ContainerInspectInfo>;
    exec(
      idOrName: string,
      opts?: ContainerExecOptions
    ): Promise<{ id: string }>;
    inspect(idOrName: string): Promise<Docker.ContainerInspectInfo>;
    kill(idOrName: string, signal?: string): Promise<void>;
    list(opts?: ContainerListOptions): Promise<Docker.ContainerInfo[]>;
    listAndInspect(
      opts?: ContainerListOptions
    ): Promise<Docker.ContainerInspectInfo[]>;
    logs(
      idOrName: string,
      opts?: ContainerLogsOptions
    ): Promise<ContainerLogStream>;
    put(
      idOrName: string,
      file: string | Buffer | Readable,
      opts: { path: string; noOverwriteDirNonDir?: string }
    ): Promise<void>;
    remove(idOrName: string, opts?: ContainerRemoveOptions): Promise<void>;
    restart(idOrName: string, secondsBeforeKill?: number): Promise<void>;
    start(idOrName: string): Promise<void>;
    stop(idOrName: string): Promise<void>;
  };

  events: {
    stream(opts?: EventsStreamOptions): Promise<DockerEventReadable>;
  };

  exec: {
    inspect(id: string): Promise<ExecInspectInfo>;
    resize(id: string, opts: { h: number; w: number }): Promise<void>;
    start(id: string, opts: ExecStartOptions & { Detach: true }): Promise<void>;
    start(id: string, opts?: ExecStartOptions): Promise<ContainerAttachStream>;
  };

  images: {
    build(stream: Readable, opts?: ImageBuildOptions): Promise<Readable>;
    inspect(idOrName: string): Promise<Docker.ImageInspectInfo>;
    list(opts?: ImageListOptions): Promise<Docker.ImageInfo[]>;
    listAndInspect(opts?: ImageListOptions): Promise<Docker.ImageInspectInfo[]>;
    remove(
      idOrName: string,
      opts?: { force?: boolean; noprune?: boolean }
    ): Promise<void>;
    pull(name: string): Promise<Readable>;
  };

  info(): Promise<DockerInfo>;

  networks: {
    create(opts: NetworkCreateOptions): Promise<NetworkInspectInfo>;
    // connect(): Promise<void>;
    // disconnect(id: string; opts?: { Container?: string; Force?: boolean; }): Promise<void>;
    inspect(id: string): Promise<NetworkInspectInfo>;
    list(opts?: NetworkListOptions): Promise<NetworkInspectInfo[]>;
    remove(id: string): Promise<void>;
  };

  version(): Promise<Docker.DockerVersion>;

  volumes: {
    create(opts?: VolumeCreateOptions): Promise<VolumeInfo>;
    inspect(name: string): Promise<VolumeInfo>;
    list(opts?: VolumeListOptions): Promise<VolumeInfo[]>;
    remove(idOrName: string, opts?: { force?: boolean }): Promise<void>;
  };
}

export interface ConnectedDockerClient extends DockerClient {
  connected: boolean;
  connecting: boolean;

  connect(): void;
  disconnect(): void;

  addListener(event: 'connected', listener: () => void): this;
  addListener(event: 'connect-failed', listener: () => void): this;
  addListener(event: 'disconnected', listener: () => void): this;

  on(event: 'connected', listener: () => void): this;
  on(event: 'connect-failed', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;

  once(event: 'connected', listener: () => void): this;
  once(event: 'connect-failed', listener: () => void): this;
  once(event: 'disconnected', listener: () => void): this;

  prependListener(event: 'connected', listener: () => void): this;
  prependListener(event: 'connect-failed', listener: () => void): this;
  prependListener(event: 'disconnected', listener: () => void): this;

  prependOnceListener(event: 'connected', listener: () => void): this;
  prependOnceListener(event: 'connect-failed', listener: () => void): this;
  prependOnceListener(event: 'disconnected', listener: () => void): this;

  removeListener(event: 'connected', listener: () => void): this;
  removeListener(event: 'connect-failed', listener: () => void): this;
  removeListener(event: 'disconnected', listener: () => void): this;

  removeAllListeners(): this;
  removeAllListeners(event: 'connected'): this;
  removeAllListeners(event: 'connect-failed'): this;
  removeAllListeners(event: 'disconnected'): this;

  listeners(event: 'connected'): Function[];
  listeners(event: 'connect-failed'): Function[];
  listeners(event: 'disconnected'): Function[];

  rawListeners(event: 'connected'): Function[];
  rawListeners(event: 'connect-failed'): Function[];
  rawListeners(event: 'disconnected'): Function[];

  emit(event: 'connected'): boolean;
  emit(event: 'connect-failed'): boolean;
  emit(event: 'disconnected'): boolean;

  listenerCount(type: 'connected'): number;
  listenerCount(type: 'connect-failed'): number;
  listenerCount(type: 'disconnected'): number;
}
