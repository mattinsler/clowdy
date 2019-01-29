import { EOL } from 'os';
import Docker from 'dockerode';
import * as tar from 'tar-stream';
import { DockerClient } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Blueprint } from '../blueprint';
import { ClusterState } from '../cluster-state';

function createHaproxyConfig(name: string, ports: number[]) {
  const lines = [
    'global',
    'defaults',
    '  timeout client   30s',
    '  timeout server   30s',
    '  timeout connect   3s',
    ''
  ];

  for (const port of ports) {
    lines.push(
      `frontend ${name}_${port}`,
      `  bind             0.0.0.0:${port}`,
      `  default_backend  ${name}_${port}`,
      `backend ${name}_${port}`,
      '  mode             tcp',
      `  server upstream  ${name}:${port}`,
      ''
    );
  }

  return lines.join(EOL);
}

export const Proxy = {
  IMAGE: 'haproxy:1.9-alpine',

  create: async (
    client: DockerClient,
    proxy: Blueprint.Proxy
  ): Promise<Docker.ContainerInspectInfo> => {
    const { Id } = await client.containers.create({
      ExposedPorts: proxy.config.ports.reduce((o, port) => {
        o[`${port}/tcp`] = {};
        return o;
      }, {}),
      HostConfig: {
        Links: [`${proxy.project}_${proxy.name}:${proxy.name}`],
        // NetworkMode: proxy.config.network,
        PortBindings: proxy.config.ports.reduce((o, port) => {
          o[`${port}/tcp`] = [
            {
              HostIp: '0.0.0.0',
              HostPort: `${port}`
            }
          ];
          return o;
        }, {})
      },
      Image: Proxy.IMAGE,
      Labels: {
        [LABELS.expose]: JSON.stringify(proxy.config.expose),
        [LABELS.hash]: proxy.hash,
        [LABELS.name]: proxy.name,
        [LABELS.project]: proxy.project,
        [LABELS.type]: 'Proxy'
      }
    });

    // console.log(createHaproxyConfig(proxy.name, proxy.config.ports));

    const buffer = await new Promise<Buffer>(resolve => {
      const pack = tar.pack();
      pack.entry(
        { name: 'haproxy.cfg' },
        createHaproxyConfig(
          proxy.name,
          // serviceContainers[0].NetworkSettings.Networks[proxy.config.network]
          //   .IPAddress,
          proxy.config.ports
        )
      );
      pack.finalize();

      const buffers: Buffer[] = [];

      pack.on('data', buffer => buffers.push(buffer));
      pack.on('end', () => resolve(Buffer.concat(buffers)));
    });

    await client.containers.put(Id, buffer, { path: '/usr/local/etc/haproxy' });

    await client.containers.start(Id);

    return client.containers.inspect(Id);
  },

  destroy: async (
    client: DockerClient,
    proxy: ClusterState.Proxy
  ): Promise<void> => {
    await client.containers.remove(proxy.info.Id, { force: true });
  }
};
