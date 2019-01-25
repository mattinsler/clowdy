import * as os from 'os';

import { BaseCommand } from '../../base-command';

export class ServiceList extends BaseCommand {
  async run() {
    const spec = this.spec;

    console.log(
      [
        '',
        '=== SERVICES ===',
        ...Object.values(spec.services)
          .sort((l, r) => l.name.localeCompare(r.name))
          .map(s => `    ${s.name}`),
        ''
      ].join(os.EOL)
    );
  }
}
