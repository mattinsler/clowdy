import { EOL } from 'os';
import { color } from '@oclif/color';
import { ExecutionPlan } from '@clowdy/core';

function indent(text: string, spaces: number): string {
  const indentation = new Array(spaces + 1).join(' ');

  return text
    .split(EOL)
    .map(line => `${indentation}${line}`)
    .join(EOL);
}

function formatConfig(config: object): string[] {
  if (process.env.DEBUG) {
    return [color.gray(JSON.stringify(config, null, 2))];
  } else {
    return [];
  }
}

function expose(ports: 'all' | number[]): string {
  return ports === 'all' ? 'all ports' : `ports ${ports.join(', ')}`;
}

function formatPlanAction(action: ExecutionPlan.Action) {
  switch (action.resource) {
    case 'Image': {
      switch (action.type) {
        case 'Build':
          return `  ${color.blueBright('Build')} image ${color.magenta(
            action.payload.image.name
          )}`;
        case 'Destroy':
          return `  ${color.red('Destroy')} image ${color.magenta(
            action.payload.image.name
          )}`;
        case 'Pull':
          return `  ${color.blueBright('Pull')} image ${color.magenta(
            action.payload.image
          )}`;
        default:
          throw new Error();
      }
    }
    case 'Network': {
      switch (action.type) {
        case 'Create':
          return `  ${color.green('Create')} network ${color.magenta(
            action.payload.network.name
          )}`;
        case 'Destroy':
          return `  ${color.red('Destroy')} network ${color.magenta(
            action.payload.network.name
          )}`;
        default:
          throw new Error();
      }
    }
    case 'Proxy': {
      switch (action.type) {
        case 'Create':
          return `  ${color.green('Create')} proxy ${color.magenta(
            action.payload.proxy.name
          )} ${color.gray(`(${expose(action.payload.proxy.config.expose)})`)}`;
        case 'Destroy':
          return `  ${color.red('Destroy')} proxy ${color.magenta(
            action.payload.proxy.name
          )} ${color.gray(`(${expose(action.payload.proxy.expose)})`)}`;
        default:
          throw new Error();
      }
    }
    case 'Service': {
      switch (action.type) {
        case 'Create':
          return indent(
            [
              `${color.green('Create')} service ${color.magenta(
                action.payload.service.name
              )} ${color.gray(`(${action.payload.service.schematic.mode})`)}`,
              ...formatConfig(action.payload.service.config)
            ].join(EOL),
            2
          );

        case 'Destroy':
          return `  ${color.red('Destroy')} service ${color.magenta(
            action.payload.service.name
          )} ${color.gray(`(${action.payload.service.mode})`)}`;
        case 'Start':
          return `  ${color.blueBright('Start')} service ${color.magenta(
            action.payload.service.name
          )} ${color.gray(`(${action.payload.service.schematic.mode})`)}`;
        default:
          throw new Error();
      }
    }
    case 'Volume': {
      switch (action.type) {
        case 'Create':
          return `  ${color.green('Create')} volume ${color.magenta(
            action.payload.volume.name
          )}`;
        case 'Destroy':
          return `  ${color.red('Destroy')} volume ${color.magenta(
            action.payload.volume.name
          )}`;
        default:
          throw new Error();
      }
    }
  }
}

export class PlanPrinter {
  static print(plan: ExecutionPlan) {
    console.log(
      [
        '',
        `Plan for project: ${color.cyan(plan.project)}`,
        '',

        ...plan.actions.map(formatPlanAction),
        ...(plan.actions.length === 0 ? [] : [''])
      ].join(EOL)
    );
  }
}
