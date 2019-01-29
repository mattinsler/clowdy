import { EOL } from 'os';
import ColorHash from 'color-hash';
import { LineStream } from 'byline';
import { color } from '@oclif/color';
import { PassThrough, Transform } from 'stream';
import { ClusterState, LABELS, Schematic, dockerClient } from '@clowdy/core';
import { DockerClient, DockerEvent, ContainerLogStream } from '@clowdy/docker';

const LOG_DELAY = 250;
const TAIL_LINES = 50;

const colorHash = new ColorHash();

function logLineParser({ service }: { service: ClusterState.Service }) {
  return new Transform({
    readableObjectMode: true,
    transform(
      chunk: any,
      encoding: string,
      callback: (error?: Error, data?: any) => void
    ) {
      const line = chunk.toString().trim();
      const match = line.match(/^([^ ]+)( (.*))?$/);

      callback(null, {
        log: match[3] || '',
        service,
        ts: match[1]
      });
    }
  });
}

interface Log {
  log: string;
  service: ClusterState.Service;
  ts: string;
}

class LogContainer {
  static async from(
    listOfServices: { client: DockerClient; state: ClusterState.Service }[]
  ): Promise<LogContainer> {
    const container = new LogContainer();

    await Promise.all(
      listOfServices.map(async ({ client, state }) => {
        const stream = await client.containers.logs(state.info.Id, {
          tail: TAIL_LINES,
          timestamps: true
        });

        container.services.set(state.info.Id, { client, state, stream });

        const parse = new LineStream();
        parse
          .pipe(logLineParser({ service: state }))
          .on('data', data => container.buffer.push(data));

        await new Promise(resolve => {
          stream.once('readable', () => {
            let chunk;
            while (null !== (chunk = stream.read())) {
              parse.write(chunk);
            }
            resolve();
          });
        });

        stream.pipe(parse);
      })
    );

    container.flush();

    return container;
  }

  private buffer: Log[] = [];

  private services = new Map<
    string,
    {
      client: DockerClient;
      state: ClusterState.Service;
      stream: ContainerLogStream;
    }
  >();

  readonly stream = new PassThrough({ objectMode: true });

  private constructor() {}

  private flush = () => {
    this.buffer.sort((l, r) => l.ts.localeCompare(r.ts));

    const limit = new Date(Date.now() - LOG_DELAY).toISOString();
    const idx = this.buffer.findIndex(line => line.ts.localeCompare(limit) > 0);

    const buffer = idx === -1 ? [...this.buffer] : this.buffer.slice(0, idx);
    this.buffer = this.buffer.slice(buffer.length);

    for (const log of buffer) {
      this.stream.write(log);
    }

    setTimeout(this.flush, LOG_DELAY);
  };

  async add(client: DockerClient, state: ClusterState.Service) {
    const stream = await client.containers.logs(state.info.Id, {
      timestamps: true
    });

    const parse = new LineStream();
    parse
      .pipe(logLineParser({ service: state }))
      .on('data', data => this.buffer.push(data));

    this.services.set(state.info.Id, { client, state, stream });

    stream.pipe(parse);
  }

  remove(
    id: string
  ):
    | undefined
    | {
        client: DockerClient;
        state: ClusterState.Service;
        stream: ContainerLogStream;
      } {
    if (this.services.has(id)) {
      const { client, state, stream } = this.services.get(id);
      this.services.delete(id);
      stream.destroy();
      return { client, state, stream };
    }
    return undefined;
  }
}

const _serviceColor: { [name: string]: Function } = {};
function serviceColor(name: string) {
  if (!_serviceColor[name]) {
    const [r, g, b] = colorHash.rgb(name);
    _serviceColor[name] = color.rgb(r, g, b);
  }
  return _serviceColor[name];
}

export const Logs = {
  async from(
    serviceNames: string[],
    project: string,
    cluster: Schematic.Cluster,
    opts: {
      timestamp?: boolean;
      id?: boolean;
    } = {}
  ): Promise<void> {
    const client = dockerClient(cluster);

    const filters = {
      label: {
        [LABELS.name]: serviceNames,
        [LABELS.project]: project,
        [LABELS.type]: 'Service'
      }
    };

    const services = (await client.containers.listAndInspect({
      filters
    })).map(ClusterState.Service.from);

    const logContainer = await LogContainer.from(
      services.map(state => ({ client, state }))
    );

    const events = await client.events.stream({ filters });

    events.on('data', async (event: DockerEvent) => {
      if (event.Type === 'container') {
        switch (event.Action) {
          // case 'create':
          //   return console.log(color.magenta(`=> Create ${event.id}`));
          // case 'destroy':
          //   return console.log(color.magenta(`=> Destroy ${event.id}`));
          case 'die':
            const result = logContainer.remove(event.id);
            if (result) {
              console.log(
                color.magenta(
                  `=> Service ${
                    result.state.name
                  }: container ${result.state.info.Id.slice(0, 12)} stopped`
                )
              );
            }
            return;
          // case 'kill':
          //   return console.log(color.magenta(`=> Kill ${event.id}`));
          case 'start':
            const state = ClusterState.Service.from(
              await client.containers.inspect(event.id)
            );
            logContainer.add(client, state);
            return console.log(
              color.magenta(
                `=> Service ${state.name}: container ${state.info.Id.slice(
                  0,
                  12
                )} started`
              )
            );
        }
      }
    });

    logContainer.stream.on('data', ({ log, service, ts }: Log) => {
      const serviceName = serviceColor(service.name)(service.name);

      const timestamp = opts.timestamp
        ? color.gray(new Date(ts).toISOString())
        : '';
      const id = opts.id
        ? serviceColor(service.name)(service.info.Id.slice(0, 12))
        : '';

      process.stdout.write(
        [timestamp, serviceName, id, log].filter(a => a).join(' ') + EOL
      );
    });
  }
};
