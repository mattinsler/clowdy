import { BaseCommand } from '../../base-command';

export class ImageBuild extends BaseCommand {
  static args = [{ name: 'name', required: true }];

  async run() {
    const { args } = this.parse(ImageBuild);
    const stream = this.clowd.images.build(args.name, this.defaultCluster);
    stream.on('data', data => data.stream && process.stdout.write(data.stream));
    await stream;
  }
}
