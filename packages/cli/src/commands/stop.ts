import { flags } from '@oclif/command';
import { Blueprint, ClusterState, ExecutionPlan, Executor, Loadout } from '@clowdy/core';

import { BaseCommand } from '../base-command';
import { PlanPrinter } from '../plan-printer';

export class StartCommand extends BaseCommand {
  static description = 'stop a service';

  static args = [{ name: 'service', required: true }];

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    plan: flags.boolean({
      char: 'p',
      description: "Print the plan but don't perform actions"
    })
  };

  async run() {
    try {
      const { args, flags } = this.parse(StartCommand);

      const state = await ClusterState.from(this.cluster, this.project.name);
      let desired = Loadout.subtract(Loadout.from(state), {
        services: [args.service]
      });

      const plan = ExecutionPlan.from(state, Blueprint.from(this.project, desired));

      if (flags.plan === true) {
        PlanPrinter.print(plan);
        return;
      }

      await Executor.execute(plan, this.cluster);
    } catch (err) {
      console.log(err.stack);
    }
  }
}
