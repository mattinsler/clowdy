import { color } from '@oclif/color';

import { Shell } from '../shell';
import { BaseCommand } from '../base-command';

export class ShellCommand extends BaseCommand {
  static description = 'open a terminal in the service container';

  static examples = [color.gray('open a shell in the api service container'), '$ clowdy shell api'];

  static args = [{ name: 'service', required: true }];

  async run() {
    const { args } = this.parse(ShellCommand);

    await Shell.toService(args.service, this.project.name, this.cluster);
  }
}
