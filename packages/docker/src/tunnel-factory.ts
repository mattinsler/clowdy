import fs from 'fs';
import net from 'net';
import http from 'http';
import ssh2 from 'ssh2';

export interface TunnelInstance {
  close(): void;

  connectToRemotePort(port: number): Promise<net.Socket>;
  connectToRemoteUnixSocket(filename: string): Promise<net.Socket>;
  // createConnectionToRemotePort(port: number) => {
  //   return (
  //     opts: http.ClientRequestArgs,
  //     oncreate: (err: Error, socket: net.Socket) => void
  //   ): net.Socket => {
  //     setImmediate(async () => {
  //       const channel = await this.connectToRemotePort(port);
  //       oncreate(null, channel);
  //     });
  //     return null;
  //   };
  // };

  // createConnectionToRemoteUnixSocket = (filename: string) => {
}

class SshTunnelInstance implements TunnelInstance {
  private client: ssh2.Client;

  constructor(client: ssh2.Client) {
    this.client = client;
  }

  close() {
    // track opens and closes to end only when actually done?
    // maybe should do this by tracking open and closed channels...
    this.client.end();
  }

  connectToRemotePort(port: number): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      this.client.forwardOut(
        '127.0.0.1',
        port,
        '127.0.0.1',
        port,
        (err, channel) => {
          if (err) {
            return reject(err);
          }
          resolve(channel as any);
        }
      );
    });
  }

  connectToRemoteUnixSocket(filename: string): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      this.client.openssh_forwardOutStreamLocal(filename, (err, channel) => {
        if (err) {
          return reject(err);
        }
        resolve(channel as any);
      });
    });
  }

  createConnectionToRemotePort = (port: number) => {
    return (
      opts: http.ClientRequestArgs,
      oncreate: (err: Error, socket: net.Socket) => void
    ): net.Socket => {
      setImmediate(async () => {
        const channel = await this.connectToRemotePort(port);
        oncreate(null, channel);
      });
      return null;
    };
  };

  createConnectionToRemoteUnixSocket = (filename: string) => {
    return (
      opts: http.ClientRequestArgs,
      oncreate: (err: Error, socket: net.Socket) => void
    ): net.Socket => {
      setImmediate(async () => {
        const channel = await this.connectToRemoteUnixSocket(filename);
        oncreate(null, channel);
      });
      return null;
    };
  };

  // exposeLocalPort(port: number) {}
  // exposeLocalUnixSocket(filename: string) {}
}

export class Tunnel {
  private static cache: { [key: string]: TunnelInstance } = {};

  private constructor() {}

  static async to(opts: {
    host: string;
    keyfile?: string;
    port?: number;
    username: string;
  }) {
    const key = JSON.stringify({
      host: opts.host,
      keyfile: opts.keyfile,
      port: opts.port,
      username: opts.username
    });

    if (!this.cache[key]) {
      this.cache[key] = await new Promise<TunnelInstance>((resolve, reject) => {
        const host = opts.port ? `${opts.host}:${opts.port}` : opts.host;

        const client = new ssh2.Client();
        client.once('close', () => delete this.cache[key]);
        client.once('error', reject);
        client.once('ready', () => resolve(new SshTunnelInstance(client)));

        const connectOpts: ssh2.ConnectConfig = {
          host: opts.host,
          port: opts.port,
          username: opts.username
        };
        if (opts.keyfile) {
          connectOpts.privateKey = fs.readFileSync(opts.keyfile);
        } else {
          connectOpts.agent = process.env.SSH_AUTH_SOCK;
        }

        client.connect(connectOpts);
      });
    }

    return this.cache[key];
  }

  // const { socketPath } = forwardRemoteUnixSocket(
  //   cluster,
  //   '/var/run/docker.sock'
  // );
}
