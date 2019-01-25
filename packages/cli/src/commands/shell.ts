import {
  Blueprint,
  ClusterState,
  ExecutionPlan,
  Executor,
  Loadout,
  dockerClient
} from '@clowdy/core';

import { BaseCommand } from '../base-command';

export class ShellCommand extends BaseCommand {
  // static description = 'attach a TTY to a running service';
  static hidden = true;

  static args = [{ name: 'service', required: true }];

  async run() {
    const { args } = this.parse(ShellCommand);
    const client = dockerClient(this.cluster);

    // client.containers.
  }
}
