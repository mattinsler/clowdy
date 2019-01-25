import { flags } from '@oclif/command';

import { BaseCommand } from '../../base-command';

export class ServiceStart extends BaseCommand {
  static args = [{ name: 'name', required: true }];

  static flags = {
    attach: flags.boolean({ char: 'a' })
  };

  async run() {
    const { args, flags } = this.parse(ServiceStart);
    const cluster = this.defaultCluster;

    await this.clowd.services.start(args.name, cluster);

    if (flags.attach) {
      await this.clowd.services.logs(args.name, cluster);
    }
  }
}
