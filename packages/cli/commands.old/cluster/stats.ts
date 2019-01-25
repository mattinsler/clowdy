import * as os from 'os';
import { cli } from 'cli-ux';
import * as logUpdate from 'log-update';
import * as prettysize from 'prettysize';
import { Cluster, connectedDockerClient } from '@clowdy/core';
import { ConnectedDockerClient, DockerInfo } from '@clowdy/docker';

import { BaseCommand } from '../../base-command';

function formatCluster(cluster: Cluster) {
  switch (cluster.type) {
    case 'Cluster.Local':
      return `${cluster.name} (localhost)`;
    case 'Cluster.SSH':
      return `${cluster.name} (${cluster.username}@${cluster.host})`;
  }
}

export class ClusterStats extends BaseCommand {
  async run() {
    const clusters = Object.values(this.spec.clusters)
      .filter(c => c.type === 'Cluster.Local')
      .sort((l, r) => l.name.localeCompare(r.name));

    if (clusters.length === 0) {
      return;
    }

    const infos: { [name: string]: DockerInfo } = {};
    const clients: { [name: string]: ConnectedDockerClient } = clusters.reduce(
      (o, cluster) => {
        const client = connectedDockerClient(cluster);

        o[cluster.name] = client;
        client.on('connected', async () => {
          render();
          infos[cluster.name] = await client.info();
          render();
        });
        client.on('disconnected', render);

        return o;
      },
      {}
    );

    function render() {
      const lines: string[] = [];

      cli.table(
        clusters,
        {
          name: {
            get: formatCluster
          },
          status: {
            get: (cluster: Cluster) => {
              const client = clients[cluster.name];
              if (client.connecting) {
                // return chalk.gray('connecting');
                return 'connecting';
              } else if (client.connected) {
                return 'connected';
              }
              return '';
            }
          },
          containers: {
            header: 'Containers Running',
            get: (cluster: Cluster) => {
              return infos[cluster.name]
                ? infos[cluster.name].ContainersRunning
                : '';
            }
          },
          cpus: {
            header: 'CPUs',
            get: (cluster: Cluster) => {
              return infos[cluster.name] ? infos[cluster.name].NCPU : '';
            }
          },
          memory: {
            get: (cluster: Cluster) => {
              return infos[cluster.name]
                ? prettysize(infos[cluster.name].MemTotal, { places: 3 })
                : '';
            }
          }
        },
        {
          printLine: (line: string) => lines.push(line)
        }
      );

      logUpdate(lines.join(os.EOL));
    }

    render();
  }
}
