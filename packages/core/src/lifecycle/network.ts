import { color } from '@oclif/color';
import { DockerClient } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Network } from '../resource-types';

export class NetworkLifecycle {
  static async create(
    client: DockerClient,
    network: Network.State.FromSpec
  ): Promise<void> {
    console.log(
      `${color.green('-')} Network create: ${network.project}_${network.name}`
    );
    await client.networks.create({
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
    network: Network.State.FromCluster
  ): Promise<void> {
    console.log(
      `${color.green('-')} Network destroy: ${network.project}_${network.name}`
    );
    await client.networks.remove(network.info.Id);
  }
}
