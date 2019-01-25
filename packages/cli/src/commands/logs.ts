import { Logs } from '../logs';
import { BaseCommand } from '../base-command';

export class LogsCommand extends BaseCommand {
  static description = 'print logs from one or more services';

  static args = [{ name: 'service', required: true }];

  async run() {
    const { args } = this.parse(LogsCommand);

    await Logs.from(args.service, this.project.name, this.cluster);
  }
}
