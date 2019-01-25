import { DockerClient, NetworkInspectInfo } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Blueprint } from '../blueprint';
import { ClusterState } from '../cluster-state';

export class Network {
  static create(
    client: DockerClient,
    network: Blueprint.Network
  ): Promise<NetworkInspectInfo> {
    return client.networks.create({
      Attachable: true,
      CheckDuplicate: false,
      Driver: network.config.driver,
      Labels: {
        [LABELS.project]: network.project,
        [LABELS.name]: network.name,
        [LABELS.hash]: network.hash
      },
      Name: `${network.project}_${network.name}`
    });
  }

  static async destroy(
    client: DockerClient,
    network: ClusterState.Network
  ): Promise<void> {
    await client.networks.remove(network.info.Id);
  }
}
