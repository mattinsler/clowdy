import { color } from '@oclif/color';
import { flags } from '@oclif/command';

import { Logs } from '../logs';
import { BaseCommand } from '../base-command';

export class LogsCommand extends BaseCommand {
  static description = `tail logs from one or more services
  
Tail the logs of services in this project. Specify a list of service names or
just run "clowdy logs" to watch the logs of all services in the project.

Extra information is available through flags. You can include container IDs as
well as log timestamps on each line.`;

  static strict = false;
  static usage = 'logs [SERVICE ...]';
  static examples = [
    color.gray('watch the logs for all services including timestamps'),
    '$ clowdy logs -t',
    '',
    color.gray('watch the logs for the api service'),
    '$ clowdy logs api',
    '',
    color.gray('watch the logs for a few services including container IDs and timestamps'),
    '$ clowdy logs api web redis -it'
  ];

  static flags: flags.Input<any> = {
    ...BaseCommand.flags,
    timestamp: flags.boolean({
      char: 't',
      description: 'Include timestamps on each line'
    }),
    id: flags.boolean({
      char: 'i',
      description: 'Include service container IDs on each line'
    })
  };

  async run() {
    const { argv, flags } = this.parse(LogsCommand);

    if (argv.some(a => a[0] === '-')) {
      this.error(`Invalid flags: ${argv.filter(a => a[0] === '-').join(', ')}`);
    }

    await Logs.from(argv, this.project.name, this.cluster, flags);
  }
}
