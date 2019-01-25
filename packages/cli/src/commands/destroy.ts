import { flags } from '@oclif/command';
import {
  Blueprint,
  ClusterState,
  ExecutionPlan,
  Executor,
  Loadout
} from '@clowdy/core';

import { BaseCommand } from '../base-command';
import { PlanPrinter } from '../plan-printer';

export class DestroyCommand extends BaseCommand {
  static description = 'destroy all resources for this project';

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    plan: flags.boolean({
      char: 'p'
    })
  };

  async run() {
    const { flags } = this.parse(DestroyCommand);

    const state = await ClusterState.from(this.cluster, this.project.name);
    let desired = Loadout.empty();

    const plan = ExecutionPlan.from(
      state,
      Blueprint.from(this.project, desired)
    );

    if (flags.plan === true) {
      PlanPrinter.print(plan);
      return;
    }

    await Executor.execute(plan, this.cluster);
  }
}
