import { Omit } from 'lodash';

export namespace Cluster {
  export interface Local {
    type: 'Cluster.Local';
    name: string;
  }

  export interface SSH {
    type: 'Cluster.SSH';
    name: string;
    host: string;
    keyfile?: string;
    port?: number;
    username: string;
  }
}

export type Cluster = Cluster.Local | Cluster.SSH;

// group('etcd', ['etcd']);
// group('core', ['ingress', 'api', 'scheduler']);
// group('partition', ['partition-api', 'partition-presence']);

export interface ServiceGroup {
  type: 'ServiceGroup';
  name: string;
  services: string[];
}

// image('dev', path.join(__dirname, 'docker', 'dev'));
// image('registry.awesome-labs.com/presence', path.join(__dirname, 'docker', 'registry.awesome-labs.com', 'presence'));

export interface Image {
  type: 'Image';
  name: string;
  context: string;
  dockerfile: string;
}

export interface Link {
  type: 'Link';
  alias: string;
  target: string;
}

export interface Script {
  type: 'Script';
  name: string;
  command: string | string[];
  environment: { [key: string]: string };
  image: string;
  links: Link[];
  volumes: {
    [containerPath: string]: Volume;
  };
}

export interface Service extends Omit<Script, 'type'> {
  type: 'Service';
  env: 'dev' | 'test' | 'prod';
  expose: number[];
  ports: {
    [externalPort: string]: string;
  };
  scripts: { [name: string]: string };
  hooks: { [name: string]: string };
}

export namespace Volume {
  export interface Docker {
    type: 'Volume.Docker';
    volumeName: string;
  }

  export interface Local {
    type: 'Volume.Local';
    directory: string;
  }
}

export function isLocalVolume(volume: Volume): volume is Volume.Local {
  return volume.type === 'Volume.Local';
}

export function isDockerVolume(volume: Volume): volume is Volume.Docker {
  return volume.type === 'Volume.Docker';
}

export type Volume = Volume.Docker | Volume.Local;

export interface Spec {
  clusters: { [name: string]: Cluster };
  name: string;
  images: { [name: string]: Image };
  scripts: { [name: string]: Script };
  serviceGroups: { [name: string]: ServiceGroup };
  services: { [name: string]: Service };
}
