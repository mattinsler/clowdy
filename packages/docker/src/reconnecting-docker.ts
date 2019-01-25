import Docker from 'dockerode';
import { Readable } from 'stream';
import { EventEmitter } from 'events';

import { DockerClusterDisconnectedReason } from './types';

export declare interface ReconnectingDocker {
  addListener(event: 'connected', listener: () => void): this;
  addListener(event: 'connect-failed', listener: () => void): this;
  addListener(event: 'disconnected', listener: () => void): this;

  on(event: 'connected', listener: () => void): this;
  on(event: 'connect-failed', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;

  once(event: 'connected', listener: () => void): this;
  once(event: 'connect-failed', listener: () => void): this;
  once(event: 'disconnected', listener: () => void): this;

  prependListener(event: 'connected', listener: () => void): this;
  prependListener(event: 'connect-failed', listener: () => void): this;
  prependListener(event: 'disconnected', listener: () => void): this;

  prependOnceListener(event: 'connected', listener: () => void): this;
  prependOnceListener(event: 'connect-failed', listener: () => void): this;
  prependOnceListener(event: 'disconnected', listener: () => void): this;

  removeListener(event: 'connected', listener: () => void): this;
  removeListener(event: 'connect-failed', listener: () => void): this;
  removeListener(event: 'disconnected', listener: () => void): this;

  removeAllListeners(): this;
  removeAllListeners(event: 'connected'): this;
  removeAllListeners(event: 'connect-failed'): this;
  removeAllListeners(event: 'disconnected'): this;

  listeners(event: 'connected'): Function[];
  listeners(event: 'connect-failed'): Function[];
  listeners(event: 'disconnected'): Function[];

  rawListeners(event: 'connected'): Function[];
  rawListeners(event: 'connect-failed'): Function[];
  rawListeners(event: 'disconnected'): Function[];

  emit(event: 'connected'): boolean;
  emit(event: 'connect-failed'): boolean;
  emit(event: 'disconnected'): boolean;

  listenerCount(type: 'connected'): number;
  listenerCount(type: 'connect-failed'): number;
  listenerCount(type: 'disconnected'): number;
}

export class ReconnectingDocker extends Docker {
  private _eventsStream?: Readable;
  private _disconnectedReason?: DockerClusterDisconnectedReason;

  private _connected = false;
  private _connecting = false;
  private _disconnectRequested = false;

  private _getEvents(options?: {}): Promise<NodeJS.ReadableStream> {
    throw new Error();
  }

  get connected() {
    return this._connected;
  }
  get connecting() {
    // _connecting is true unless disconnect is requested
    return this._connecting && !this._connected;
  }
  get eventsStream() {
    return this._eventsStream;
  }
  get disconnectedReason() {
    return this._disconnectedReason;
  }

  constructor(options?: Docker.DockerOptions) {
    super(options);
    EventEmitter.call(this);
    for (const method of Object.keys(EventEmitter.prototype)) {
      if (method[0] !== '_') {
        this[method] = EventEmitter.prototype[method];
      }
    }

    this._getEvents = super.getEvents;

    setImmediate(this.connect);
  }

  async getEvents(): Promise<NodeJS.ReadableStream> {
    throw new Error('Use eventsStrean rather than getEvents()');
  }

  connect = async () => {
    if (this._connecting) {
      return;
    }

    this._connecting = true;
    this._disconnectRequested = false;

    const getStream = async (): Promise<false | NodeJS.ReadableStream> => {
      if (this._disconnectRequested) {
        return false;
      }

      try {
        return await this._getEvents();
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          markConnectFailed(DockerClusterDisconnectedReason.DOCKER_NOT_RUNNING);
        } else if (~[500, 502].indexOf(err.statusCode)) {
          markConnectFailed(DockerClusterDisconnectedReason.DOCKER_STARTING);
        } else {
          console.log(err);
          markConnectFailed(DockerClusterDisconnectedReason.UNKNOWN);
        }

        return false;
      }
    };

    const waitForEnd = (stream: NodeJS.ReadableStream) => {
      return new Promise(resolve => {
        stream.on('data', () => {});
        stream.on('end', resolve);
      });
    };

    const markConnectFailed = (reason: DockerClusterDisconnectedReason) => {
      if (this._disconnectedReason !== reason) {
        this._disconnectedReason = reason;
        if (!this._connected) {
          this.emit('connect-failed');
        }
      }
    };

    const markConnected = () => {
      this._connected = true;
      delete this._disconnectedReason;
      this.emit('connected');
    };

    const markDisconnected = () => {
      if (this._connected) {
        this._connected = false;
        this.emit('disconnected');
      }
    };

    while (true) {
      const events = await getStream();
      if (events) {
        this._eventsStream = events as Readable;
        markConnected();
        await waitForEnd(events);
      }
      if (this._disconnectRequested) {
        this._disconnectedReason =
          DockerClusterDisconnectedReason.DISCONNECT_REQUESTED;
      } else if (this._eventsStream) {
        // try to get the stream back immediately when the stream fails, before marking disconnected
        delete this._eventsStream;
        continue;
      }
      delete this._eventsStream;

      markDisconnected();

      if (this._disconnectRequested) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this._connecting = false;
  };

  disconnect() {
    this._disconnectRequested = true;
    if (this._eventsStream) {
      (this._eventsStream as any).destroy();
    }
  }
}
