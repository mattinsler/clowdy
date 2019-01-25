import * as os from 'os';

import { BaseCommand } from '../../base-command';

export class ImageList extends BaseCommand {
  async run() {
    const spec = this.spec;

    console.log(
      [
        '',
        '=== IMAGES ===',
        ...Object.values(spec.images)
          .sort((l, r) => l.name.localeCompare(r.name))
          .map(s => `    ${s.name}`),
        ''
      ].join(os.EOL)
    );
  }
}
