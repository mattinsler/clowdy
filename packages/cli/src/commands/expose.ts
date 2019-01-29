import { color } from '@oclif/color';
import { flags } from '@oclif/command';
import { Blueprint, ClusterState, ExecutionPlan, Executor, Loadout } from '@clowdy/core';

import { BaseCommand } from '../base-command';
import { PlanPrinter } from '../plan-printer';

export class ExposeCommand extends BaseCommand {
  static description = `expose ports of a service to localhost
  
Expose creates a proxy container linked to the service containers that you
specify. You can either expose all ports or specific ports of a service.

${color.underline('Show plan')}
Use the ${color.magenta('-p')} flag to see what it will do without actually
performing the steps.`;

  static examples = [
    color.gray('expose all ports declared by the api service to localhost'),
    '$ clowdy expose api',
    '',
    color.gray('expose port 3000 all ports declared by the api service to localhost'),
    '$ clowdy expose -e 3000 api'
  ];

  static args = [{ name: 'service', required: true }];

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    expose: flags.integer({
      char: 'e',
      description: 'Expose a specific port on localhost',
      multiple: true
    }),
    plan: flags.boolean({
      char: 'p',
      description: "Print the plan but don't perform actions"
    })
  };

  async run() {
    const { args, flags } = this.parse(ExposeCommand);

    const state = await ClusterState.from(this.cluster, this.project.name);

    const serviceState = state.services.find(s => s.name === args.service);
    if (!serviceState) {
      this.error(`Service ${args.service} is not current running.`);
    }

    const service = this.project.services.get(`${serviceState.mode}|${serviceState.name}`);
    if (!service) {
      this.error(
        `A service declaration no longer exists for ${serviceState.name} in mode ${
          serviceState.mode
        }. Without a declaration, clowdy can't tell what ports to expose.`
      );
    }

    if (service.expose.length === 0) {
      this.error(`Service ${args.service} doesn't declare any ports to expose.`);
    }

    let desired = Loadout.from(state);

    if (flags.expose) {
      if (flags.expose.length > 0) {
        desired = Loadout.extend(desired, {
          expose: {
            [args.service]: flags.expose
          }
        });
      }
    } else {
      desired = Loadout.extend(desired, {
        expose: {
          [service.name]: 'all'
        }
      });
    }

    const plan = ExecutionPlan.from(state, Blueprint.from(this.project, desired));

    if (flags.plan === true) {
      PlanPrinter.print(plan);
      return;
    }

    await Executor.execute(plan, this.cluster);
  }
}
