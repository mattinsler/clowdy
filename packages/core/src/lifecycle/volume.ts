import { color } from '@oclif/color';
import { DockerClient, VolumeInfo } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Volume } from '../resource-types';

export class VolumeLifecycle {
  static create(
    client: DockerClient,
    volume: Volume.State.FromSpec
  ): Promise<VolumeInfo> {
    console.log(
      `${color.green('-')} Volume create: ${volume.project}_${volume.name}`
    );
    return client.volumes.create({
      Labels: {
        [LABELS.project]: volume.project,
        [LABELS.name]: volume.name,
        [LABELS.hash]: volume.hash
      },
      Name: `${volume.project}_${volume.name}`
    });
  }

  static async destroy(
    client: DockerClient,
    volume: Volume.State.FromCluster
  ): Promise<void> {
    console.log(
      `${color.green('-')} Volume destroy: ${volume.project}_${volume.name}`
    );
    await client.volumes.remove(`${volume.project}_${volume.name}`, {
      force: true
    });
  }
}
