import Modem from 'docker-modem';

import { LocalClient } from './local-client';
import { LocalConnectedClient } from './local-connected-client';
// import { SshClient } from './ssh-client';
// import { SshConnectedClient } from './ssh-connected-client';
import {
  ConnectionOptions,
  ConnectedDockerClient,
  DockerClient
} from './types';

export * from './types';

export const followProgress = Modem.prototype.followProgress;

export function client(
  opts: ConnectionOptions = { type: 'local' }
): DockerClient {
  switch (opts.type) {
    case 'local':
      return new LocalClient(opts);
    // case 'Cluster.SSH':
    //   return new SshClient(cluster);
  }
  throw new Error(`Unsupported cluster type: ${opts.type}.`);
}

export function connectedClient(
  opts: ConnectionOptions = { type: 'local' }
): ConnectedDockerClient {
  switch (opts.type) {
    case 'local':
      return new LocalConnectedClient(opts);
    // case 'ssh':
    //   return new SshConnectedClient(opts);
  }

  throw new Error(`Unsupported cluster type: ${opts.type}.`);
}
