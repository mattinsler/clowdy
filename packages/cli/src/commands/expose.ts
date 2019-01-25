// import { EOL } from 'os';
// import { color } from '@oclif/color';
import {
  Blueprint,
  ClusterState,
  ExecutionPlan,
  Executor,
  Loadout
} from '@clowdy/core';

import { BaseCommand } from '../base-command';

export class ExposeCommand extends BaseCommand {
  static description = 'expose ports on a service to localhost';

  static args = [{ name: 'service', required: true }];
  // take flags to specify one or more ports... otherwise expose all ports of service

  async run() {
    // const { args } = this.parse(ExposeCommand);
    // const service = this.spec.services[args.service];

    // if (!service) {
    //   this.error(
    //     [
    //       `Could not find a service named ${color.red(args.service)}`,
    //       '',
    //       'Available services:',
    //       ...Object.keys(this.spec.services)
    //         .sort()
    //         .map(s => `- ${color.cyan(s)}`)
    //     ].join(EOL)
    //   );
    // }

    // if (service.expose.length === 0) {
    //   this.error('No ports to expose');
    // }

    // await Proxy.create(this.spec.name, service, this.cluster);

    const { args } = this.parse(ExposeCommand);

    // if (!this.project.services.has(`dev|${args.service}`)) {
    //   this.error(
    //     [
    //       '',
    //       `Could not find a service named ${color.magenta(args.service)}`,
    //       '',
    //       'Services available for dev:',
    //       ...Array.from(this.project.services.values())
    //         .filter(s => s.mode === 'dev')
    //         .sort()
    //         .map(s => `  ${color.cyan(s.name)}`),
    //       ''
    //     ].join(EOL)
    //   );
    // }

    const state = await ClusterState.from(this.cluster, this.project.name);

    const serviceState = state.services.find(s => s.name === args.service);
    if (!serviceState) {
      this.error('');
    }

    const service = this.project.services.get(
      `${serviceState.mode}|${serviceState.name}`
    );
    if (!service) {
      this.error('');
    }

    if (service.expose.length === 0) {
      this.error('No ports to expose');
    }

    let desired = Loadout.extend(Loadout.from(state), {
      expose: {
        [service.name]: 'all'
      }
    });

    const plan = ExecutionPlan.from(
      state,
      Blueprint.from(this.project, desired)
    );

    await Executor.execute(plan, this.cluster);
  }
}
