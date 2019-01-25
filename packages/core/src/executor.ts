import { dockerClient } from './utils';
import { Execution } from './execution';
import { Schematic } from './schematic';
import { ExecutionPlan } from './execution-plan';

import cli from 'cli-ux';

function report<T>(message: string, fn: () => Promise<T>) {
  cli.action.start(message);

  const promise = fn();

  promise.then(() => cli.action.stop());
  promise.catch(err => {
    console.log(err.stack);
  });

  return promise;
}

export const Executor = {
  execute: async (
    plan: ExecutionPlan,
    cluster: Schematic.Cluster
  ): Promise<any> => {
    const client = dockerClient(cluster);

    for (const action of plan.actions) {
      await (() => {
        switch (action.resource) {
          case 'Image': {
            switch (action.type) {
              case 'Build':
                return report(
                  `Building image ${action.payload.image.name}`,
                  () => Execution.Image.build(client, action.payload.image)
                );
              case 'Destroy':
                return report(
                  `Destroying image ${action.payload.image.name}`,
                  () => Execution.Image.destroy(client, action.payload.image)
                );
              default:
                throw new Error();
            }
          }
          case 'Network': {
            switch (action.type) {
              case 'Create':
                return report(
                  `Creating network ${action.payload.network.name}`,
                  () => Execution.Network.create(client, action.payload.network)
                );
              case 'Destroy':
                return report(
                  `Destroying network ${action.payload.network.name}`,
                  () =>
                    Execution.Network.destroy(client, action.payload.network)
                );
              default:
                throw new Error();
            }
          }
          case 'Proxy': {
            switch (action.type) {
              case 'Create':
                return report(
                  `Creating proxy ${action.payload.proxy.name}`,
                  () => Execution.Proxy.create(client, action.payload.proxy)
                );
              case 'Destroy':
                return report(
                  `Destroying proxy ${action.payload.proxy.name}`,
                  () => Execution.Proxy.destroy(client, action.payload.proxy)
                );
              default:
                throw new Error();
            }
          }
          case 'Service': {
            switch (action.type) {
              case 'Create':
                return report(
                  `Creating service ${action.payload.service.name}`,
                  () => Execution.Service.create(client, action.payload.service)
                );
              case 'Destroy':
                return report(
                  `Destroying service ${action.payload.service.name}`,
                  () =>
                    Execution.Service.destroy(client, action.payload.service)
                );
              case 'Start':
                return report(
                  `Starting service ${action.payload.service.name}`,
                  () => Execution.Service.start(client, action.payload.service)
                );
              default:
                throw new Error();
            }
          }
          case 'Volume': {
            switch (action.type) {
              case 'Create':
                return report(
                  `Creating volume ${action.payload.volume.name}`,
                  () => Execution.Volume.create(client, action.payload.volume)
                );
              case 'Destroy':
                return report(
                  `Destroying volume ${action.payload.volume.name}`,
                  () => Execution.Volume.destroy(client, action.payload.volume)
                );
              default:
                throw new Error();
            }
          }
        }
      })();
    }
  }
};
