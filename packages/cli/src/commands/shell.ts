import { Shell } from '../shell';
import { BaseCommand } from '../base-command';

export class ShellCommand extends BaseCommand {
  static description = 'attach a TTY to a running service';

  static args = [{ name: 'service', required: true }];

  async run() {
    const { args } = this.parse(ShellCommand);

    await Shell.toService(args.service, this.project.name, this.cluster);
  }
}
