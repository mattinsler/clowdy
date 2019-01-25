import { Project } from './project';
import { Schematic } from './schematic';
import { ClusterState } from './cluster-state';

export interface Loadout {
  expose: { [service: string]: 'all' | number[] };
  mode: { [service: string]: Schematic.Mode };
  services: string[];
}

export class Loadout {
  static empty(): Loadout {
    return {
      expose: {},
      mode: {},
      services: []
    };
  }

  static extend(loadout: Loadout, opts: Partial<Loadout> = {}): Loadout {
    return Loadout.from({
      expose: { ...loadout.expose, ...opts.expose },
      mode: { ...loadout.mode, ...opts.mode },
      services: Array.from(
        new Set([...loadout.services, ...(opts.services || [])])
      )
    });
  }

  static subtract(loadout: Loadout, opts: Partial<Loadout> = {}): Loadout {
    return Loadout.from({
      services: loadout.services.filter(
        s => (opts.services || []).indexOf(s) === -1
      )
    });
  }

  private static fromClusterState(state: ClusterState): Loadout {
    const expose: { [service: string]: 'all' | number[] } = {};
    const mode: { [service: string]: Schematic.Mode } = {};
    const services = new Set<string>();

    for (const serviceState of state.services) {
      services.add(serviceState.name);
      if (mode[serviceState.name]) {
        // running services are either dev or prod mode. "test" is just an environment to test a dev or prod service
        mode[serviceState.name] =
          mode[serviceState.name] === 'prod' || serviceState.mode === 'prod'
            ? 'prod'
            : 'dev';
      } else {
        mode[serviceState.name] = serviceState.mode;
      }
    }

    for (const proxyState of state.proxies) {
      expose[proxyState.name] = proxyState.expose;
    }

    return { expose, mode, services: Array.from(services) };
  }

  private static fromPartial(opts: Partial<Loadout> = {}): Loadout {
    const expose: { [service: string]: 'all' | number[] } = {};
    const mode: { [service: string]: Schematic.Mode } = {};

    const services = Array.from(new Set<string>(opts.services || []));

    for (const service of services) {
      if ((opts.expose || {})[service]) {
        expose[service] = opts.expose[service];
      }
      mode[service] = (opts.mode || {})[service] || 'prod';
    }

    return { expose, mode, services: Array.from(services) };
  }

  static from(opts?: Partial<Loadout>): Loadout;
  static from(state: ClusterState): Loadout;
  static from(...args: any[]): Loadout {
    if (
      args.length === 1 &&
      typeof (args[0] as ClusterState).project === 'string'
    ) {
      return Loadout.fromClusterState(args[0]);
    } else {
      return Loadout.fromPartial(args[0]);
    }
  }

  static validate(loadout: Loadout, project: Project): void {
    for (const name of loadout.services) {
      const mode = loadout.mode[name];
      const key = `${mode}|${name}`;
      if (!project.services.has(key)) {
        throw new Error(
          `Project does not contain a definition for a service named ${name} in ${mode} mode.`
        );
      }
    }
  }
}
