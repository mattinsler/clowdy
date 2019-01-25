import * as inquirer from 'inquirer';
import { Cluster, Spec } from '@clowdy/core';

import { BaseCommand } from '../../base-command';

export class ClusterRemove extends BaseCommand {
  static aliases = ['cluster:rm'];

  async run() {
    const userConfig = this.userConfig;

    if (Object.keys(userConfig.clusters).length > 0) {
      const { clusters } = await inquirer.prompt({
        type: 'checkbox',
        name: 'clusters',
        message: 'Remove which clusters?',
        choices: Object.keys(userConfig.clusters)
      });
      console.log(clusters);
    }
  }
}
