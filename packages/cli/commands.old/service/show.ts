import { BaseCommand } from '../../base-command';

export class ServiceShow extends BaseCommand {
  static args = [{ name: 'name', required: true }];

  async run() {
    const { args } = this.parse(ServiceShow);
    if (!this.spec.services[args.name]) {
      throw new Error(`Service ${args.name} does not exist`);
    }
    console.log(this.spec.services[args.name]);
  }
}
