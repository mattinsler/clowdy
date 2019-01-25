import { BaseCommand } from '../../base-command';

export class ServiceLogs extends BaseCommand {
  static args = [{ name: 'name', required: true }];

  async run() {
    const { args } = this.parse(ServiceLogs);
    this.clowd.services.logs(args.name, this.defaultCluster);
  }
}
