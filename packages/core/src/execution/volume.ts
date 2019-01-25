import { DockerClient, VolumeInfo } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Blueprint } from '../blueprint';
import { ClusterState } from '../cluster-state';

export class Volume {
  static create(
    client: DockerClient,
    volume: Blueprint.Volume
  ): Promise<VolumeInfo> {
    return client.volumes.create({
      Labels: {
        [LABELS.project]: volume.project,
        [LABELS.name]: volume.name,
        [LABELS.hash]: volume.hash
      }
      // Name: `${volume.project}_${volume.name}`
    });
  }

  static async destroy(
    client: DockerClient,
    volume: ClusterState.Volume
  ): Promise<void> {
    await client.volumes.remove(volume.info.Name, { force: true });
  }
}
