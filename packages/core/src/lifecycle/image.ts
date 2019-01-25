import fs from 'fs';
import tar from 'tar-fs';
import Docker from 'dockerode';
import JSONStream from 'JSONStream';
import { color } from '@oclif/color';
import * as TarStream from 'tar-stream';
import { DockerClient } from '@clowdy/docker';

import { LABELS } from '../labels';
import { Image } from '../resource-types';

export class ImageLifecycle {
  static async build(
    client: DockerClient,
    image: Image.State.FromSpec
  ): Promise<Docker.ImageInspectInfo> {
    console.log(
      `${color.green('-')} Image build: ${image.project}_${image.name}`
    );

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
          pack.entry({ name: 'Dockerfile' })
        );
      }
    });

    const buildStream = (await client.images.build(tarStream, {
      t: `${image.project}_${image.name}`,
      labels: JSON.stringify({
        [LABELS.project]: image.project,
        [LABELS.name]: image.name,
        [LABELS.hash]: image.hash
      })
    })).pipe(JSONStream.parse());

    buildStream.on('data', ({ stream }) => {
      if (stream) {
        process.stdout.write(stream);
      }
    });

    await new Promise(resolve => {
      buildStream.on('end', resolve);
    });

    return client.images.inspect(`${image.project}_${image.name}`);
  }

  // static async destroy(
  //   client: DockerClient,
  //   image: Image.State.FromSpec
  // ): Promise<void> {
  //   await client.images.
  // }
}
