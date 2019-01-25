import { color } from '@oclif/color';
import { DockerEvent } from '@clowdy/docker';
import { Cluster, LABELS, dockerClient } from '@clowdy/core';

export const Logs = {
  async from(
    service: string,
    project: string,
    cluster: Cluster
  ): Promise<void> {
    const client = dockerClient(cluster);

    // const events = await client.events.stream();
    const events = await client.events.stream({
      filters: {
        //     label: {
        //       [LABELS.name]: service,
        //       [LABELS.project]: project,
        //       [LABELS.type]: 'Service'
        //     },
        type: 'container'
      }
    });

    const containerToLogs = {};

    events.on('data', (event: DockerEvent) => {
      if (event.Type === 'container') {
        // console.log(event);
        switch (event.Action) {
          case 'create':
            return console.log(color.magenta(`=> Create ${event.id}`));
          case 'destroy':
            return console.log(color.magenta(`=> Destroy ${event.id}`));
          case 'die':
            return console.log(color.magenta(`=> Die ${event.id}`));
          case 'kill':
            return console.log(color.magenta(`=> Kill ${event.id}`));
          case 'start':
            return console.log(color.magenta(`=> Start ${event.id}`));
        }
      }
    });

    // const containers = await client.containers.list({
    //   filters: {
    //     label: {
    //       [LABELS.name]: service,
    //       [LABELS.project]: project,
    //       [LABELS.type]: 'Service'
    //     }
    //   }
    // });

    // if (containers.length === 0) {
    //   console.log(
    //     `No running service named ${service} in project ${project} to show logs from.`
    //   );
    //   return;
    // }

    // const { stderr, stdin, stdout } = await client.containers.attach(
    //   containers[0].Id,
    //   {
    //     detachKeys: 'ctrl-d',
    //     logs: true
    //   }
    // );

    // stderr.pipe(process.stderr);
    // stdout.pipe(process.stdout);

    // stdout.on('close', () => process.exit());
  }
};
