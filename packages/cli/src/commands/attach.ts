import { color } from '@oclif/color';

import { Attach } from '../attach';
import { BaseCommand } from '../base-command';

export class AttachCommand extends BaseCommand {
  static description = `attach a TTY to a running service
  
Attach your console to the running container for the service specified. This
means that you can fully interact with the root process of the service running
inside the container. All keystrokes will be sent to the service's process.

${color.underline('Detaching from the container')}
To detach from the process without effecting the underlying process, press
${color.magenta('control-d')}.

${color.underline('NOTE:')} If you press ${color.magenta('control-c')}, the signal SIGINT will be sent to your service
process (and likely end it).`;

  static examples = [color.gray('attach to the api service'), '$ clowdy attach api'];

  static args = [{ name: 'service', required: true }];

  async run() {
    const { args } = this.parse(AttachCommand);

    await Attach.toService(args.service, this.project.name, this.cluster);
  }
}
