import fs from 'fs';
import tar from 'tar-fs';
import Docker from 'dockerode';
import JSONStream from 'JSONStream';
import * as TarStream from 'tar-stream';
import { DockerClient } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Blueprint } from '../blueprint';
import { ClusterState } from '../cluster-state';

export class Image {
  static async build(
    client: DockerClient,
    image: Blueprint.Image
  ): Promise<Docker.ImageInspectInfo> {
    if (
      !fs.existsSync(image.config.context) ||
      !fs.statSync(image.config.context).isDirectory()
    ) {
      throw new Error(`${image.config.context} is not a directory`);
    }

    const tarStream = tar.pack(image.config.context, {
      finalize: false,
      finish(pack: TarStream.Pack) {
        fs.createReadStream(image.config.dockerfile).pipe(
          pack.entry(
            {
              name: 'Dockerfile',
              size: fs.statSync(image.config.dockerfile).size
            },
            err => {
              if (err) {
                throw err;
              } else {
                pack.finalize();
              }
            }
          )
        );
      }
    });

    const buildStream = (await client.images.build(tarStream, {
      labels: JSON.stringify({
        [LABELS.project]: image.project,
        [LABELS.name]: image.name,
        [LABELS.hash]: image.hash
      }),
      t: `${image.project}_${image.name}`
    })).pipe(JSONStream.parse());

    buildStream.on('data', data => {
      const { stream } = data;
      if (stream) {
        // might need to stream this somewhere else, not to stdout
        if (process.env.DEBUG) {
          process.stdout.write(stream);
        }
      }
    });

    await new Promise(resolve => {
      buildStream.on('end', resolve);
    });

    return client.images.inspect(`${image.project}_${image.name}`);
  }

  static async destroy(
    client: DockerClient,
    image: ClusterState.Image
  ): Promise<void> {
    await client.images.remove(image.info.Id, { force: true });
  }
}
