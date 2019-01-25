import { Attach } from '../attach';
import { BaseCommand } from '../base-command';

export class AttachCommand extends BaseCommand {
  static description = 'attach a TTY to a running service';

  static args = [{ name: 'service', required: true }];

  async run() {
    const { args } = this.parse(AttachCommand);

    await Attach.toService(args.service, this.project.name, this.cluster);
  }
}
