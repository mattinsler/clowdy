import { cli } from 'cli-ux';
import { color } from '@oclif/color';
import { flags } from '@oclif/command';
import { Blueprint, ClusterState, ExecutionPlan, Executor, Loadout } from '@clowdy/core';

import { BaseCommand } from '../base-command';
import { PlanPrinter } from '../plan-printer';

export class DestroyCommand extends BaseCommand {
  static description = `destroy all resources for this project

Please be careful when using this command. Use the ${color.magenta('-p')} flag to see what it will do
without actually performing the steps.

Forcefully deletes all resources associated with this project. This includes
any images built, networks or volumes created, and all containers (services and
proxies).`;

  static examples = [color.gray('destroy all resources for this project'), '$ clowdy destroy'];

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    force: flags.boolean({
      char: 'f',
      description: 'Just destroy without mercy'
    }),
    plan: flags.boolean({
      char: 'p',
      description: "Print the plan but don't perform actions"
    })
  };

  async run() {
    const { flags } = this.parse(DestroyCommand);

    const state = await ClusterState.from(this.cluster, this.project.name);
    let desired = Loadout.empty();

    const plan = ExecutionPlan.from(state, Blueprint.from(this.project, desired));

    if (flags.plan === true) {
      PlanPrinter.print(plan);
      return;
    }

    if (flags.force === true || (await cli.confirm('Are you sure you would like to destroy all resources? (yes/no)'))) {
      await Executor.execute(plan, this.cluster);
    }
  }
}
