import { cli } from 'cli-ux';
// import * as timeago from 'timeago';
import { Clowd } from '@clowdy/core';

import { BaseCommand } from '../../base-command';

export class ServicePs extends BaseCommand {
  async run() {
    const clowd = new Clowd(this.spec);

    const containers = await clowd.services.ps(this.defaultCluster);

    cli.table(containers, {
      id: {
        get: container => container.Id.slice(0, 12)
      },
      service: {
        get: container => container.Labels['com.awesome-labs.name']
      },
      // created: {
      //   get: container => timeago.ago(1000 * container.Created)
      // },
      status: {
        get: container => container.Status
      }
    });
  }
}
