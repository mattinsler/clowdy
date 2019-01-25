import { ContainerExecOptions } from '@clowdy/docker';
import { Cluster, LABELS, dockerClient } from '@clowdy/core';

export const Shell = {
  async toContainer(
    idOrName: string,
    cluster: Cluster,
    opts?: Partial<ContainerExecOptions>
  ): Promise<void> {
    const client = dockerClient(cluster);

    const { id } = await client.containers.exec(idOrName, {
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      // DetachKeys: 'ctrl-d',
      Tty: true,
      Cmd: ['/bin/sh'],
      ...opts
    });

    const { stderr, stdin, stdout } = await client.exec.start(id, {
      Tty: true
    });

    process.stdin.setRawMode(true);

    process.stdin.pipe(stdin);
    stderr.pipe(process.stderr);
    stdout.pipe(process.stdout);

    stdout.on('close', () => {
      process.stdin.setRawMode(false);
      process.exit();
    });
  },

  async toService(
    service: string,
    project: string,
    cluster: Cluster,
    opts?: Partial<ContainerExecOptions>
  ): Promise<void> {
    const client = dockerClient(cluster);

    const containers = await client.containers.list({
      filters: {
        label: {
          [LABELS.name]: service,
          [LABELS.project]: project,
          [LABELS.type]: 'Service'
        }
      }
    });

    if (containers.length === 0) {
      console.log(
        `No running service named ${service} in project ${project} to shell in to.`
      );
      return;
    }

    if (containers.length > 1) {
      // use enquirer to choose a container
      console.log(
        `More than one running service named ${service} in project ${project} to shell in to.`
      );
      return;
    }

    await Shell.toContainer(containers[0].Id, cluster, opts);
  }
};
