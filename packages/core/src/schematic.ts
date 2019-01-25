export namespace Schematic {
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

    export function isLocal(cluster: Cluster): cluster is Cluster.Local {
      return cluster.type === 'Cluster.Local';
    }

    export function isSSH(cluster: Cluster): cluster is Cluster.SSH {
      return cluster.type === 'Cluster.SSH';
    }
  }

  export type Cluster = Cluster.Local | Cluster.SSH;

  export interface Image {
    type: 'Image';
    name: string;
    context: string;
    dockerfile: string;
  }

  // export interface Link {
  //   type: 'Link';
  //   alias: string;
  //   target: string;
  // }

  export type Mode = 'dev' | 'prod' | 'test';

  // export interface Script {
  //   type: 'Script';
  //   name: string;
  //   command: string | string[];
  //   environment: { [key: string]: string };
  //   image: string;
  //   links: Link[];
  //   volumes: {
  //     [containerPath: string]: Volume;
  //   };
  // }

  export interface Service {
    type: 'Service';

    command: string[];
    environment: {
      // key => value
      [key: string]: string;
    };
    expose: number[];
    image: string;
    links: {
      // alias => target
      [alias: string]: string;
    };
    mode: Mode;
    name: string;
    // ports: {
    //   [externalPort: string]: string;
    // };
    volumes: {
      // container path => volume schematic
      [containerPath: string]: Volume;
    };

    // scripts: { [name: string]: string };
    // hooks: { [name: string]: string };
  }

  // export interface ServiceGroup {
  //   type: 'ServiceGroup';
  //   name: string;
  //   services: string[];
  // }

  export namespace Volume {
    export interface Docker {
      type: 'Volume.Docker';
      volumeName: string;
    }

    export interface Local {
      type: 'Volume.Local';
      directory: string;
    }

    export function isLocal(volume: Volume): volume is Volume.Local {
      return volume.type === 'Volume.Local';
    }

    export function isDocker(volume: Volume): volume is Volume.Docker {
      return volume.type === 'Volume.Docker';
    }
  }

  export type Volume = Volume.Docker | Volume.Local;
}
