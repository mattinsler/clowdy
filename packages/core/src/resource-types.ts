import Docker from 'dockerode';
import { NetworkInspectInfo, VolumeInfo } from '@clowdy/docker';

import * as Schema from './schema';

export namespace Resource {
  export interface State<ResourceType extends string> {
    hash: string;
    name: string;
    project: string;
    resource: ResourceType;
  }
}

export namespace Container {
  export interface Config {
    command: string[];
    environment: { [key: string]: string };
    expose: number[];
    // hostname: string; ???
    image: string;
    // alias => targt
    links: { [alias: string]: string };
    ports: {
      // external => internal
      [externalPort: string]: string;
    };
    volumes: {
      [containerPath: string]: Schema.Volume;
    };
  }

  export interface State extends Resource.State<'Container'> {
    env: 'dev' | 'test' | 'prod';
    type: 'Proxy' | 'Service';
  }

  export namespace State {
    export interface FromSpec extends Resource.State<'Container'> {
      config: Config;
      env: 'dev' | 'test' | 'prod';
      source: Schema.Service;
      type: 'Proxy' | 'Service';
    }

    export interface FromCluster extends Resource.State<'Container'> {
      env: 'dev' | 'test' | 'prod';
      info: Docker.ContainerInspectInfo;
      type: 'Proxy' | 'Service';
    }

    export interface Full extends Resource.State<'Container'> {
      config: Config;
      env: 'dev' | 'test' | 'prod';
      info: Docker.ContainerInspectInfo;
      source: Schema.Service;
      type: 'Proxy' | 'Service';
    }
  }
}

export namespace Proxy {
  export interface Config extends Container.Config {}

  export interface State extends Container.State {
    type: 'Proxy';
  }

  export namespace State {
    export interface FromSpec extends Container.State.FromSpec {
      type: 'Proxy';
    }

    export interface FromCluster extends Container.State.FromCluster {
      type: 'Proxy';
    }

    export interface Full extends Container.State.Full {
      type: 'Proxy';
    }
  }
}

export namespace Service {
  export interface Config extends Container.Config {}

  export interface State extends Container.State {
    type: 'Service';
  }

  export namespace State {
    export interface FromSpec extends Container.State.FromSpec {
      type: 'Service';
    }

    export interface FromCluster extends Container.State.FromCluster {
      type: 'Service';
    }

    export interface Full extends Container.State.Full {
      type: 'Service';
    }
  }
}

export namespace Image {
  export interface Config {
    context: string;
    dockerfile: string;
  }

  export interface State extends Resource.State<'Image'> {}

  export namespace State {
    export interface FromSpec extends Resource.State<'Image'> {
      config: Config;
      // source: Schema.Service;
    }

    export interface FromCluster extends Resource.State<'Image'> {
      info: Docker.ImageInspectInfo;
    }

    export interface Full extends Resource.State<'Image'> {
      config: Config;
      info: Docker.ImageInspectInfo;
      // source: Schema.Service;
    }
  }
}

export namespace Network {
  export interface Config {
    driver: string;
  }

  export interface State extends Resource.State<'Network'> {}

  export namespace State {
    export interface FromSpec extends Resource.State<'Network'> {
      config: Config;
    }

    export interface FromCluster extends Resource.State<'Network'> {
      info: NetworkInspectInfo;
    }

    export interface Full extends Resource.State<'Network'> {
      config: Config;
      info: NetworkInspectInfo;
    }
  }
}

export namespace Volume {
  export interface Config {
    name: string;
  }

  export interface State extends Resource.State<'Volume'> {}

  export namespace State {
    export interface FromSpec extends Resource.State<'Volume'> {
      config: Config;
    }

    export interface FromCluster extends Resource.State<'Volume'> {
      info: VolumeInfo;
    }

    export interface Full extends Resource.State<'Volume'> {
      config: Config;
      info: VolumeInfo;
    }
  }
}
