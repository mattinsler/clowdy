import { BaseCommand } from '../../base-command';

export class ServiceStop extends BaseCommand {
  static args = [{ name: 'name', required: true }];

  async run() {
    const { args } = this.parse(ServiceStop);
    this.clowd.services.stop(args.name, this.defaultCluster);
  }
}
