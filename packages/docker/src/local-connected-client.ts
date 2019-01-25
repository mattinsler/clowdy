import { EventEmitter } from 'events';

import { ClientImpl } from './client-impl';
import { ReconnectingDocker } from './reconnecting-docker';
import { ConnectionOptions, ConnectedDockerClient } from './types';

function ensureConnected(
  client: ReconnectingDocker,
  fn: Function,
  args: any[]
) {
  if (!client.connected) {
    throw new Error('Not connected');
  }
  return fn(client, ...args);
}

export declare interface LocalConnectedClient extends ConnectedDockerClient {}

export class LocalConnectedClient implements ConnectedDockerClient {
  private client: ReconnectingDocker;

  constructor(opts: ConnectionOptions.Local) {
    this.client = new ReconnectingDocker();
    // attach EventEmitter methods from the client to this instance
    for (const method of Object.keys(EventEmitter.prototype)) {
      if (method[0] !== '_') {
        this[method] = this.client[method].bind(this.client);
      }
    }
  }

  get connected() {
    return this.client.connected;
  }
  get connecting() {
    return this.client.connecting;
  }

  connect() {
    this.client.connect();
  }
  disconnect() {
    this.client.disconnect();
  }

  compose = (...args: any[]) => ({
    create: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.create, [...args, argv]),
    down: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.down, [...args, argv]),
    logs: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.logs, [...args, argv]),
    start: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.start, [...args, argv]),
    stop: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.stop, [...args, argv]),
    rm: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.rm, [...args, argv]),
    run: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.run, [...args, argv]),
    up: (...argv: string[]) =>
      ensureConnected(this.client, ClientImpl.compose.up, [...args, argv])
  });

  containers = {
    attach: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.attach, args),
    create: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.create, args),
    exec: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.exec, args),
    inspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.inspect, args),
    kill: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.logs, args),
    list: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.list, args),
    listAndInspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.listAndInspect, args),
    logs: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.logs, args),
    put: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.put, args),
    remove: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.remove, args),
    restart: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.restart, args),
    start: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.start, args),
    stop: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.containers.stop, args)
  };

  events = {
    stream: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.events.stream, args)
  };

  exec = {
    inspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.exec.inspect, args),
    resize: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.exec.resize, args),
    start: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.exec.start, args)
  };

  info = (...args: any[]) =>
    ensureConnected(this.client, ClientImpl.info, args);

  images = {
    build: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.images.build, args),
    inspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.images.inspect, args),
    list: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.images.list, args),
    listAndInspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.images.listAndInspect, args),
    remove: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.images.remove, args)
  };

  networks = {
    create: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.networks.create, args),
    inspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.networks.inspect, args),
    list: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.networks.list, args),
    remove: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.networks.remove, args)
  };

  version = (...args: any[]) =>
    ensureConnected(this.client, ClientImpl.version, args);

  volumes = {
    create: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.volumes.create, args),
    inspect: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.volumes.inspect, args),
    list: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.volumes.list, args),
    remove: (...args: any[]) =>
      ensureConnected(this.client, ClientImpl.volumes.remove, args)
  };
}
