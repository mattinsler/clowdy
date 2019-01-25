import * as inquirer from 'inquirer';
import { Cluster, Spec } from '@clowdy/core';

import { BaseCommand } from '../../base-command';

const promptOptsForName = ({
  clusters,
  type
}: {
  clusters: { [name: string]: Cluster };
  type: string;
}) => ({
  type: 'input',
  name: 'name',
  message: `What do you want to name your ${type} cluster?`,
  filter(value: string) {
    return value.trim();
  },
  validate(value: string) {
    if (value.length === 0) {
      return 'Name cannot be empty.';
    }
    if (clusters[value]) {
      return 'That name is already taken.';
    }
    return true;
  }
});

async function promptForLocal(clusters: {
  [name: string]: Cluster;
}): Promise<Cluster.Local> {
  const { name } = await inquirer.prompt(
    promptOptsForName({ clusters, type: 'Local' })
  );
  return {
    type: 'Cluster.Local',
    name
  };
}

async function promptForSSH(clusters: {
  [name: string]: Cluster;
}): Promise<Cluster.SSH> {
  const { name, host, keyfile, port, username } = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: 'Host:',
      filter(value: string) {
        return value.trim();
      },
      validate(value: string) {
        if (value.length === 0) {
          return 'Host cannot be empty.';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'port',
      message: 'Port:',
      default: 22,
      filter(value: number | string) {
        if (typeof value === 'string') {
          value = value.trim();
          return Number.parseInt(value).toString() === value
            ? Number.parseInt(value)
            : value;
        }
        return value;
      },
      validate(value: number | string) {
        if (typeof value === 'string') {
          if (value.length === 0) {
            return 'Port cannot be empty.';
          } else {
            return 'Port must be a number.';
          }
        } else {
          if (value < 10 || value > 65536) {
            return 'Invalid port.';
          }
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'username',
      message: 'Username:',
      filter(value: string) {
        return value.trim();
      },
      validate(value: string) {
        if (value.length === 0) {
          return 'Username cannot be empty.';
        }
        return true;
      }
    },
    promptOptsForName({ clusters, type: 'SSH' })
  ]);

  return {
    type: 'Cluster.SSH',
    name,
    host,
    keyfile,
    port,
    username
  };
}

export class ClusterAdd extends BaseCommand {
  async run() {
    const userConfig = this.userConfig;

    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'What type of cluster?',
      choices: ['Local', 'SSH']
    });

    const cluster =
      type === 'Local'
        ? await promptForLocal(userConfig.clusters)
        : type === 'SSH'
        ? await promptForSSH(userConfig.clusters)
        : null;

    this.saveUserConfig({
      ...userConfig,
      clusters: {
        ...userConfig.clusters,
        [cluster.name]: cluster
      }
    });
  }
}
