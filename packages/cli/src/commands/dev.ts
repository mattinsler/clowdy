import { EOL } from 'os';
import { color } from '@oclif/color';
import { flags } from '@oclif/command';
import { Blueprint, ClusterState, ExecutionPlan, Executor, Loadout } from '@clowdy/core';

import { Attach } from '../attach';
import { BaseCommand } from '../base-command';
import { PlanPrinter } from '../plan-printer';

export class DevCommand extends BaseCommand {
  static description = `run a service in dev mode

Launch a service in dev mode.

${color.underline('Detaching from the container')}
To detach from the process without effecting the underlying process, press
${color.magenta('control-d')}.

${color.underline('Show plan')}
Use the ${color.magenta('-p')} flag to see what it will do without actually
performing the steps.`;

  static examples = [
    color.gray('launch the api service in dev mode'),
    '$ clowdy dev api',
    '',
    color.gray('launch the api service in dev mode, expose all ports and attach to'),
    color.gray('the container'),
    '$ clowdy dev api -aE',
    '',
    color.gray('launch the api service in dev mode and expose ports 3000 and 5000'),
    '$ clowdy dev api -e 3000 -e 5000'
  ];

  static args = [{ name: 'service', required: true }];

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    attach: flags.boolean({
      char: 'a',
      default: false,
      description: 'Attach to the container after it starts running'
    }),
    expose: flags.integer({
      char: 'e',
      description: 'Expose a port from this service on localhost',
      exclusive: ['expose-all'],
      multiple: true
    }),
    'expose-all': flags.boolean({
      char: 'E',
      description: 'Expose all ports from this service on localhost',
      exclusive: ['expose']
    }),
    plan: flags.boolean({
      char: 'p',
      description: "Print the plan but don't perform actions"
    })
  };

  async run() {
    try {
      const { args, flags } = this.parse(DevCommand);

      if (!this.project.services.has(`dev|${args.service}`)) {
        this.error(
          [
            '',
            `Could not find a service named ${color.magenta(args.service)}`,
            '',
            'Services available for dev:',
            ...Array.from(this.project.services.values())
              .filter(s => s.mode === 'dev')
              .sort()
              .map(s => `  ${color.cyan(s.name)}`),
            ''
          ].join(EOL)
        );
      }

      const state = await ClusterState.from(this.cluster, this.project.name);
      let desired = Loadout.extend(Loadout.from(state), {
        mode: { [args.service]: 'dev' },
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

      const plan = ExecutionPlan.from(state, Blueprint.from(this.project, desired));

      if (flags.plan === true) {
        PlanPrinter.print(plan);
        return;
      }

      await Executor.execute(plan, this.cluster);

      if (flags.attach) {
        await Attach.toService(args.service, this.project.name, this.cluster);
      }
    } catch (err) {
      this.error(
        [
          err.message,
          '',
          'Services available for dev:',
          ...Array.from(this.project.services.values())
            .filter(s => s.mode === 'dev')
            .sort()
            .map(s => `  ${color.cyan(s.name)}`),
          ''
        ].join(EOL)
      );
    }
  }
}
