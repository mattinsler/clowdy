import { EOL } from 'os';
import * as tar from 'tar-stream';
import { Cluster, Service, dockerClient } from '@clowdy/core';

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

export class Proxy {
  static async create(
    project: string,
    service: Service,
    cluster: Cluster,
    ports?: number[]
  ) {
    ports =
      ports === undefined
        ? service.expose
        : ports.filter(port => service.expose.indexOf(port) !== -1);

    if (ports.length === 0) {
      return;
    }

    const client = dockerClient(cluster);

    const networks = await client.networks.list({
      filters: {
        label: {
          'com.awesome-labs.clowdy.name': 'default',
          'com.awesome-labs.clowdy.project': project
        }
      }
    });

    const { Id } = await client.containers.create({
      ExposedPorts: ports.reduce((o, port) => {
        o[`${port}/tcp`] = {};
        return o;
      }, {}),
      HostConfig: {
        NetworkMode: networks[0].Id,
        PortBindings: ports.reduce((o, port) => {
          o[`${port}/tcp`] = [
            {
              HostIp: '0.0.0.0',
              HostPort: `${port}`
            }
          ];
          return o;
        }, {})
      },
      Image: 'haproxy:1.9-alpine',
      Labels: {
        'com.awesome-labs.clowdy.name': service.name,
        'com.awesome-labs.clowdy.project': project,
        'com.awesome-labs.clowdy.type': 'Proxy'
      }
    });

    const buffer = await new Promise<Buffer>(resolve => {
      const pack = tar.pack();
      pack.entry(
        { name: 'haproxy.cfg' },
        createHaproxyConfig(`${project}_${service.name}`, ports)
      );
      pack.finalize();

      const buffers: Buffer[] = [];

      pack.on('data', buffer => buffers.push(buffer));
      pack.on('end', () => resolve(Buffer.concat(buffers)));
    });

    await client.containers.put(Id, buffer, { path: '/usr/local/etc/haproxy' });

    await client.containers.start(Id);
  }

  static async destroy(project: string, service: Service, cluster: Cluster) {
    const client = dockerClient(cluster);

    const containers = await client.containers.list({
      filters: {
        label: {
          'com.awesome-labs.clowdy.name': `${service.name}_proxy`,
          'com.awesome-labs.clowdy.project': project,
          'com.awesome-labs.clowdy.type': 'Proxy'
        }
      }
    });

    await Promise.all(
      containers.map(c => client.containers.remove(c.Id, { force: true }))
    );
  }
}
