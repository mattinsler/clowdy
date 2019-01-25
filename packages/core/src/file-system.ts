import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import crypto from 'crypto';

export class Directory {
  public readonly path: string;
  private exists = false;
  private removeOnExitInstalled = false;

  constructor(dirname: string) {
    this.path = path.resolve(dirname);
  }

  private async ensureExists() {
    if (!this.exists) {
      await fs.mkdirs(this.path);
      this.exists = true;
    }
  }

  removeOnExit(): this {
    if (!this.removeOnExitInstalled) {
      process.on('beforeExit', this.removeSync as any);
      this.removeOnExitInstalled = true;
    }
    return this;
  }

  filepath(filename: string) {
    return path.resolve(this.path, filename);
  }

  remove = async (filename?: string) => {
    if (filename) {
      await fs.remove(this.filepath(filename));
    } else {
      await fs.remove(this.path);
      this.exists = false;
    }
  };

  removeSync = (filename?: string) => {
    if (filename) {
      fs.removeSync(this.filepath(filename));
    } else {
      fs.removeSync(this.path);
      this.exists = false;
    }
  };

  async writeFile(
    filename: string,
    data: string | Buffer,
    opts?: string | fs.WriteFileOptions
  ) {
    await this.ensureExists();
    await fs.writeFile(this.filepath(filename), data, opts);
  }

  async writeJsonFile(filename: string, data: object) {
    await this.ensureExists();
    await fs.writeFile(this.filepath(filename), JSON.stringify(data, null, 2));
  }

  async writeYamlFile(filename: string, data: object) {
    await this.ensureExists();
    await fs.writeFile(
      this.filepath(filename),
      yaml.safeDump(data, { skipInvalid: true })
    );
  }
}

export function tempDirectory(root = os.tmpdir()) {
  const tmpdir = path.join(root, crypto.randomBytes(16).toString('hex'));
  return new Directory(tmpdir);
}
