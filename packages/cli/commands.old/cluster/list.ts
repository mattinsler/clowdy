import * as os from 'os';
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
    const spec = this.spec;

    console.log(
      [
        '',
        '=== CLUSTERS ===',
        ...Object.values(spec.clusters)
          .sort((l, r) => l.name.localeCompare(r.name))
          .map(
            c =>
              `  ${
                this.defaultClusterName === c.name ? '*' : ' '
              } ${formatCluster(c)}`
          ),
        ''
      ].join(os.EOL)
    );
  }
}
