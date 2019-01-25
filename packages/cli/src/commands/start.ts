import { EOL } from 'os';
import { color } from '@oclif/color';
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

export class StartCommand extends BaseCommand {
  static description = 'start a service in prod mode';

  static args = [{ name: 'service', required: true }];

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    expose: flags.integer({
      char: 'e',
      multiple: true,
      exclusive: ['expose-all']
    }),
    'expose-all': flags.boolean({
      char: 'E',
      exclusive: ['expose']
    }),
    plan: flags.boolean({
      char: 'p'
    })
  };

  async run() {
    try {
      const { args, flags } = this.parse(StartCommand);

      if (!this.project.services.has(`prod|${args.service}`)) {
        this.error(
          [
            '',
            `Could not find a service named ${color.magenta(args.service)}`,
            '',
            'Services available to start in prod:',
            ...Array.from(this.project.services.values())
              .filter(s => s.mode === 'prod')
              .sort()
              .map(s => `  ${color.cyan(s.name)}`),
            ''
          ].join(EOL)
        );
      }

      const state = await ClusterState.from(this.cluster, this.project.name);
      let desired = Loadout.extend(Loadout.from(state), {
        mode: { [args.service]: 'prod' },
        services: [args.service]
      });

      if (flags.expose && flags.expose.length > 0) {
        desired = Loadout.extend(desired, {
          expose: { [args.service]: flags.expose }
        });
      } else if (flags['expose-all'] === true) {
        desired = Loadout.extend(desired, {
          expose: { [args.service]: 'all' }
        });
      }

      const plan = ExecutionPlan.from(
        state,
        Blueprint.from(this.project, desired)
      );

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
