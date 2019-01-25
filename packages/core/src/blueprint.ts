import ObjectHash from 'object-hash';

import { Loadout } from './loadout';
import { Project } from './project';
import { Schematic } from './schematic';
import { ClusterState } from './cluster-state';

type Resource<ResourceType extends string> = {
  hash: string;
  name: string;
  project: string;
  resource: ResourceType;
};

export interface Blueprint {
  images: Blueprint.Image[];
  networks: Blueprint.Network[];
  project: string;
  proxies: Blueprint.Proxy[];
  services: Blueprint.Service[];
  volumes: Blueprint.Volume[];
}

export class Blueprint {
  private static serviceSchematicsWithDependencies(
    project: Project,
    loadout: Loadout
  ): Schematic.Service[] {
    const serviceMap: {
      [name: string]: Schematic.Service;
    } = loadout.services.reduce((o, name) => {
      const mode = loadout.mode[name];
      o[name] = project.services.get(`${mode}|${name}`);
      return o;
    }, {});

    while (true) {
      let changed = false;

      for (const service of Object.values(serviceMap)) {
        for (const target of Object.values(service.links)) {
          if (!serviceMap[target]) {
            changed = true;

            if (project.services.has(`prod|${target}`)) {
              serviceMap[target] = project.services.get(`prod|${target}`);
            } else {
              throw new Error(
                `Cannot find a linked service named ${target} in prod mode.`
              );
            }
          }
        }
      }

      if (!changed) {
        break;
      }
    }

    return Object.values(serviceMap);
  }

  static from(
    project: Project,
    loadout: Loadout,
    state?: ClusterState
  ): Blueprint {
    const images: { [name: string]: Blueprint.Image } = {};
    const networks: { [name: string]: Blueprint.Network } = {};
    const proxies: { [name: string]: Blueprint.Proxy } = {};
    const services: { [name: string]: Blueprint.Service } = {};
    const volumes: { [name: string]: Blueprint.Volume } = {};

    const serviceSchematics = this.serviceSchematicsWithDependencies(
      project,
      loadout
    );

    for (const service of serviceSchematics) {
      services[service.name] = Blueprint.Service.from(service, project.name);
      if (project.images.has(service.image)) {
        images[service.image] = Blueprint.Image.from(
          project.images.get(service.image),
          project.name
        );
      }

      for (const volume of Object.values(service.volumes)) {
        if (volume.type === 'Volume.Docker') {
          const volumeBlueprint = Blueprint.Volume.from(volume, project.name);
          volumes[volumeBlueprint.name] = volumeBlueprint;
        }
      }

      // proxy
      const expose = loadout.expose[service.name];
      if (expose) {
        if (Blueprint.Proxy.portsToExpose(service, expose).length > 0) {
          // has ports to expose
          proxies[service.name] = Blueprint.Proxy.from(
            service,
            expose,
            project.name
          );
        }
      }
    }

    if (Object.keys(services).length > 0) {
      networks['default'] = Blueprint.Network.from('default', project.name);
    }

    return {
      images: Object.values(images),
      networks: Object.values(networks),
      project: project.name,
      proxies: Object.values(proxies),
      services: Object.values(services),
      volumes: Object.values(volumes)
    };
  }
}

export namespace Blueprint {
  export namespace Image {
    export interface Config {
      context: string;
      dockerfile: string;
    }
  }
  export interface Image extends Resource<'Image'> {
    config: Image.Config;
    schematic: Schematic.Image;
  }
  export class Image {
    static from(schematic: Schematic.Image, project: string): Image {
      const config: Image.Config = {
        context: schematic.context,
        dockerfile: schematic.dockerfile
      };

      return {
        config,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name: schematic.name,
        project,
        resource: 'Image',
        schematic
      };
    }
  }

  export type Mode = Schematic.Mode;

  export namespace Network {
    export interface Config {
      driver: string;
    }
  }
  export interface Network extends Resource<'Network'> {
    config: Network.Config;
  }
  export class Network {
    static from(name: string, project: string): Network {
      const config: Network.Config = {
        driver: 'bridge'
      };

      return {
        config,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name,
        project,
        resource: 'Network'
      };
    }
  }

  export namespace Proxy {
    export interface Config {
      // this is needed from the loadout to put on the container labels
      // it needs to be on the container labels so that ClusterState can re-create the Loadout
      expose: 'all' | number[];
      network: string;
      ports: number[];
    }
  }
  export interface Proxy extends Resource<'Proxy'> {
    config: Proxy.Config;
    schematic: Schematic.Service;
  }
  export class Proxy {
    static from(
      schematic: Schematic.Service,
      expose: 'all' | number[],
      project: string
    ): Proxy {
      const config: Proxy.Config = {
        expose,
        network: `${project}_default`,
        ports: Proxy.portsToExpose(schematic, expose)
      };

      return {
        config,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name: schematic.name,
        project,
        resource: 'Proxy',
        schematic
      };
    }

    static portsToExpose(
      schematic: Schematic.Service,
      expose: 'all' | number[]
    ): number[] {
      return expose === 'all'
        ? schematic.expose
        : expose.filter(port => schematic.expose.indexOf(port) !== -1);
    }
  }

  export namespace Service {
    export interface Config {
      command: string[];
      environment: { [name: string]: string };
      expose: number[];
      image: string;
      links: { [alias: string]: string };
      mode: Mode;
      network: string;
      volumes: { [containerPath: string]: Schematic.Volume };
    }
  }
  export interface Service extends Resource<'Service'> {
    config: Service.Config;
    schematic: Schematic.Service;
  }
  export class Service {
    static from(schematic: Schematic.Service, project: string): Service {
      const config: Service.Config = {
        command: schematic.command,
        environment: schematic.environment,
        expose: schematic.expose,
        image: schematic.image,
        links: schematic.links,
        mode: schematic.mode,
        network: `${project}_default`,
        volumes: schematic.volumes
      };

      return {
        config,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name: schematic.name,
        project,
        resource: 'Service',
        schematic
      };
    }
  }

  export namespace Volume {
    export interface Config {
      name: string;
    }
  }
  export interface Volume extends Resource<'Volume'> {
    config: Volume.Config;
    schematic: Schematic.Volume;
  }
  export class Volume {
    static from(schematic: Schematic.Volume.Docker, project: string): Volume {
      const config: Volume.Config = {
        name: schematic.volumeName
      };

      return {
        config,
        hash: `sha1:${ObjectHash.sha1(config)}`,
        name: schematic.volumeName,
        project,
        resource: 'Volume',
        schematic
      };
    }
  }
}
