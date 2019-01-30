import * as ClowdyDocker from '@clowdy/docker';
import dockerParseImage from 'docker-parse-image';

import { Schematic } from './schematic';

// export const followProgress = ClowdyDocker.followProgress;

export function dockerClient(cluster: Schematic.Cluster): ClowdyDocker.DockerClient {
  switch (cluster.type) {
    case 'Cluster.Local':
      return ClowdyDocker.client({ type: 'local' });
    case 'Cluster.SSH':
      return ClowdyDocker.client({ ...cluster, type: 'ssh' });
  }
}

export function connectedDockerClient(cluster: Schematic.Cluster): ClowdyDocker.ConnectedDockerClient {
  switch (cluster.type) {
    case 'Cluster.Local':
      return ClowdyDocker.connectedClient({ type: 'local' });
    case 'Cluster.SSH':
      return ClowdyDocker.connectedClient({ ...cluster, type: 'ssh' });
  }
}

export interface ImageTag {
  fullname: string;
  name: string;
  namespace: string | null;
  registry: string | null;
  repository: string;
  tag: string | null;
}

export const ImageTag = {
  parse(tag: string): ImageTag {
    return dockerParseImage(tag);
  }
};
