import { EOL } from 'os';
import moment from 'moment';
import prettysize from 'prettysize';
import { color } from '@oclif/color';
import { ClusterState } from '@clowdy/core';

import { BaseCommand } from '../base-command';

const SortByName = (l, r) => l.name.localeCompare(r.name);

export class StatusCommand extends BaseCommand {
  static description = `print the current status of the project
  
Prints the status of all created resources in this project.`;

  async run() {
    const state = await ClusterState.from(this.cluster, this.project.name);

    console.log(
      [
        '',
        `Status for project: ${color.cyan(this.project.name)}`,
        '',
        'SERVICES',
        ...state.services
          .sort(SortByName)
          .map(c => `  ${color.magenta(c.name)} ${color.gray(`(${c.mode} - ${c.info.State.Status})`)}`),
        '',
        'PROXIES',
        ...state.proxies
          .sort(SortByName)
          .map(c => `  ${color.magenta(c.name)} ${color.gray(`(${c.ports.join(', ')} - ${c.info.State.Status})`)}`),
        '',
        'NETWORKS',
        ...state.networks.sort(SortByName).map(n => `  ${color.magenta(n.name)}`),
        '',
        'IMAGES',
        ...state.images
          .sort(SortByName)
          .map(
            i =>
              `  ${color.magenta(i.name)} ${color.gray(
                `(Created ${moment(i.info.Created).fromNow()}, ${prettysize(i.info.Size)})`
              )}`
          ),
        '',
        'VOLUMES',
        ...state.volumes
          .sort(SortByName)
          .map(i => `  ${color.magenta(i.name)} ${color.gray(`(Created ${moment(i.info.CreatedAt).fromNow()})`)}`),
        ''
      ].join(EOL)
    );
  }
}
