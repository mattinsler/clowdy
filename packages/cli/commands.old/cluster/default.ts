import * as inquirer from 'inquirer';
import { Cluster } from '@clowdy/core';

import { BaseCommand } from '../../base-command';

function formatCluster(cluster: Cluster) {
  switch (cluster.type) {
    case 'Cluster.Local':
      return `${cluster.name} (localhost)`;
    case 'Cluster.SSH':
      return `${cluster.name} (${cluster.username}@${cluster.host})`;
  }
}

export class ClusterList extends BaseCommand {
  async run() {
    const { spec, userConfig } = this;

    const { cluster } = await inquirer.prompt({
      type: 'list',
      name: 'cluster',
      choices: Object.values(spec.clusters)
        .sort((l, r) => l.name.localeCompare(r.name))
        .map(c => ({ name: formatCluster(c), value: c.name }))
    });

    this.saveUserConfig({
      ...userConfig,
      defaultCluster: cluster
    });
  }
}
