require('restore-cursor')();

import * as path from 'path';
import * as fs from 'fs-extra';
import { Command, flags } from '@oclif/command';
import { Project, Schematic } from '@clowdy/core';
import { sync as loadJsonFile } from 'load-json-file';

function find<V>(
  iterable: IterableIterator<V>,
  predicate: (value: V) => boolean
) {
  for (const value of iterable) {
    if (predicate(value)) {
      return value;
    }
  }

  return undefined;
}

export interface UserConfigSchema {
  clusters: { [name: string]: Schematic.Cluster };
  defaultCluster?: string;
}

export abstract class BaseCommand extends Command {
  static flags: flags.Input<any> = {
    // cluster: flags.string({
    //   char: 'c'
    // })
  };

  private _defaultClusterName: string;
  private _userConfig: UserConfigSchema;

  private _project: Project;

  private readProject(): Project {
    const clowdyfile = this.projectFilename;
    const project = fs.existsSync(clowdyfile)
      ? Project.from(clowdyfile)
      : Project.empty(path.basename(process.cwd()));

    const config = this.userConfig;
    const clusters = new Map<string, Schematic.Cluster>(
      Object.entries(config.clusters)
    );

    this._defaultClusterName = config.defaultCluster;

    if (!clusters.has('local')) {
      clusters.set('local', { name: 'local', type: 'Cluster.Local' });
    }

    if (!this._defaultClusterName) {
      if (clusters.has('default')) {
        this._defaultClusterName = 'default';
      } else {
        const localCluster = find(
          clusters.values(),
          c => c.type === 'Cluster.Local'
        );
        if (localCluster) {
          this._defaultClusterName = localCluster.name;
        } else {
          clusters.set('default', { name: 'default', type: 'Cluster.Local' });
          this._defaultClusterName = 'default';
        }
      }
    }

    return {
      ...project,
      clusters
    };
  }

  protected get projectFilename(): string {
    return path.join(process.cwd(), 'clowdy.config.js');
  }

  protected get project(): Project {
    if (!this._project) {
      this._project = this.readProject();
    }

    return this._project;
  }

  private readUserConfig(): UserConfigSchema {
    const configfile = this.userConfigFilename;
    if (fs.existsSync(configfile)) {
      const config: any = loadJsonFile(configfile) || {};
      return {
        clusters: config.clusters || {},
        defaultCluster:
          typeof config.defaultCluster === 'string'
            ? config.defaultCluster
            : undefined
      };
    } else {
      return { clusters: {} };
    }
  }

  protected get userConfigFilename(): string {
    return path.join(this.config.configDir, 'config.json');
  }

  protected get userConfig(): UserConfigSchema {
    if (!this._userConfig) {
      this._userConfig = this.readUserConfig();
    }

    return this._userConfig;
  }

  protected saveUserConfig(config: UserConfigSchema) {
    const configfile = this.userConfigFilename;

    // should validate...

    fs.mkdirsSync(path.dirname(configfile));
    fs.writeFileSync(configfile, JSON.stringify(config, null, 2));
  }

  // will return the cluster chosen via flags
  protected get cluster(): Schematic.Cluster {
    return this.defaultCluster;
  }

  protected get defaultClusterName(): string {
    if (!this._defaultClusterName) {
      // call getter on project which will read the project and set up defaults
      this.project;
    }
    return this._defaultClusterName;
  }
  protected get defaultCluster(): Schematic.Cluster {
    return this.project.clusters.get(this.defaultClusterName);
  }

  // protected get clowd(): Clowd {
  //   return new Clowd(this.spec);
  // }
}
