// import { flags } from '@oclif/command';
// import {
//   Blueprint,
//   ClusterState,
//   ExecutionPlan,
//   Executor,
//   Loadout
// } from '@clowdy/core';

import { BaseCommand } from '../base-command';
// import { PlanPrinter } from '../plan-printer';

export class CleanCommand extends BaseCommand {
  static hidden = true;

  async run() {}

  //   static flags: flags.Input<any> = {
  //     ...BaseCommand.flags,
  //     plan: flags.boolean({
  //       char: 'p'
  //     })
  //   };

  //   async run() {
  //     // const current = await State.fromCluster(
  //     //   this.spec.name,
  //     //   this.cluster
  //     // );
  //     // const desired = State.fromSpec(this.spec.name, this.spec, []);

  //     // const plan = Plan.from(current, desired);
  //     // await Plan.execute(plan, this.cluster);

  //     // const client = dockerClient(this.cluster);

  //     // const images = await client.images.list({
  //     //   filters: {
  //     //     label: {
  //     //       'com.awesome-labs.clowdy.project': this.spec.name
  //     //     }
  //     //   }
  //     // });

  //     // await Promise.all(images.map(i => client.images.remove(i.Id)));

  //     const { flags } = this.parse(CleanCommand);

  //     const state = await ClusterState.from(
  //       this.cluster,
  //       this.project.name
  //     );
  //     let desired = Loadout.empty();

  //     const plan = ExecutionPlan.from(
  //       state,
  //       Blueprint.from(this.project, desired)
  //     );

  //     if (flags.plan === true) {
  //       PlanPrinter.print(plan);
  //       return;
  //     }

  //     await Executor.execute(plan, this.cluster);
  //   }
}
