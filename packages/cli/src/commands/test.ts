import { EOL } from 'os';
import { color } from '@oclif/color';
import { flags } from '@oclif/command';
import { Blueprint, ClusterState, ExecutionPlan, Executor, Loadout } from '@clowdy/core';

import { Attach } from '../attach';
import { BaseCommand } from '../base-command';
import { PlanPrinter } from '../plan-printer';

export class TestCommand extends BaseCommand {
  static description = `run a service in test mode
  
Launch a service in test mode. Test mode will automatically attach to the
container after launching. Test mode can not expose any ports.

${color.underline('Detaching from the container')}
To detach from the process without effecting the underlying process, press
${color.magenta('control-d')}.

${color.underline('Show plan')}
Use the ${color.magenta('-p')} flag to see what it will do without actually
performing the steps.`;

  static examples = [color.gray('launch the api service for test'), '$ clowdy test api'];

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
      const { args, flags } = this.parse(TestCommand);

      if (!this.project.services.has(`test|${args.service}`)) {
        this.error(
          [
            '',
            `Could not find a service named ${color.magenta(args.service)}`,
            '',
            'Services available for test:',
            ...Array.from(this.project.services.values())
              .filter(s => s.mode === 'test')
              .sort()
              .map(s => `  ${color.cyan(s.name)}`),
            ''
          ].join(EOL)
        );
      }

      const state = await ClusterState.from(this.cluster, this.project.name);
      let desired = Loadout.from({
        mode: { [args.service]: 'test' },
        services: [args.service]
      });

      const plan = ExecutionPlan.from(state, Blueprint.from(this.project, desired));

      if (flags.plan === true) {
        PlanPrinter.print(plan);
        return;
      }

      await Executor.execute(plan, this.cluster);

      await Attach.toService(args.service, this.project.name, this.cluster, {
        logs: false
      });
    } catch (err) {
      this.error(
        [
          err.message,
          '',
          'Services available for test:',
          ...Array.from(this.project.services.values())
            .filter(s => s.mode === 'test')
            .sort()
            .map(s => `  ${color.cyan(s.name)}`),
          ''
        ].join(EOL)
      );
    }
  }
}
