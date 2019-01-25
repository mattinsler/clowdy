import * as Schema from '../src/schema';
import { Plan, State } from '../src/plan';

const VOLUMES: { [name: string]: Schema.Volume } = {
  node_modules: {
    type: 'Volume.Docker',
    volumeName: 'node_modules'
  },
  source: {
    directory: '/src/',
    type: 'Volume.Local'
  }
};

const IMAGES: { [name: string]: Schema.Image } = {
  'test-nodejs': {
    context: '/docker/test-nodejs',
    dockerfile: '/docker/test-nodejs/Dockerfile',
    name: 'test-nodejs',
    type: 'Image'
  }
};

const SERVICES: { [name: string]: Schema.Service } = {
  server: {
    command: ['yarn', 'start'],
    env: 'prod',
    environment: { PORT: '3000' },
    expose: [3000],
    hooks: {},
    image: 'test-nodejs',
    links: [],
    name: 'server',
    ports: {},
    scripts: {},
    type: 'Service',
    volumes: {
      '/usr/src/app': VOLUMES.source,
      '/usr/src/app/node_modules': VOLUMES.node_modules
    }
  },
  worker: {
    command: ['yarn', 'run', 'worker'],
    env: 'prod',
    environment: {},
    expose: [],
    hooks: {},
    image: 'test-nodejs',
    links: [],
    name: 'worker',
    ports: {},
    scripts: {},
    type: 'Service',
    volumes: {
      '/usr/src/app': VOLUMES.source,
      '/usr/src/app/node_modules': VOLUMES.node_modules
    }
  }
};

const SPEC: Schema.Spec = {
  clusters: {},
  images: IMAGES,
  name: 'test',
  scripts: {},
  serviceGroups: {},
  services: SERVICES
};

const matchAction = (
  resource: string,
  type: string,
  matchingObject: object
) => ({
  action: {
    resource,
    type
  },
  payload: Object.entries(matchingObject).reduce((o, [k, v]) => {
    o[k] = expect.objectContaining(v);
    return o;
  }, {})
});

describe('Plan', () => {
  describe('#from', () => {
    it('creates a basic service cloud', () => {
      const current: State.FromCluster = {
        containers: [],
        images: [],
        networks: [],
        project: 'test',
        volumes: [],

        proxies: [],
        services: []
      };
      const desired = State.fromSpec(SPEC.name, SPEC, [SERVICES.server]);

      const plan = Plan.from(current, desired);

      expect(plan).toEqual({
        actions: [
          matchAction('Network', 'Create', { network: { name: 'default' } }),
          matchAction('Image', 'Build', { image: { name: 'test-nodejs' } }),
          matchAction('Volume', 'Create', {
            volume: { name: 'node_modules' }
          }),
          matchAction('Container', 'Create', { container: { name: 'server' } })
        ],
        project: 'test'
      });
    });

    it('destroys a basic service cloud', () => {
      const current: State.FromCluster = {
        containers: [
          {
            env: 'prod',
            hash: '',
            info: null,
            name: 'server',
            project: 'test',
            resource: 'Container',
            type: 'Service'
          }
        ],
        images: [
          {
            hash: '',
            info: null,
            name: 'test-nodejs',
            project: 'test',
            resource: 'Image'
          }
        ],
        networks: [
          {
            hash: '',
            info: null,
            name: 'default',
            project: 'test',
            resource: 'Network'
          }
        ],
        project: 'test',
        volumes: [
          {
            hash: '',
            info: null,
            name: 'node_modules',
            project: 'test',
            resource: 'Volume'
          }
        ],

        proxies: [],
        services: [
          {
            env: 'prod',
            hash: '',
            info: null,
            name: 'server',
            project: 'test',
            resource: 'Container',
            type: 'Service'
          }
        ]
      };
      const desired: State.FromSpec = {
        containers: [],
        images: [],
        networks: [],
        project: 'test',
        volumes: [],

        proxies: [],
        services: []
      };

      const plan = Plan.from(current, desired);

      expect(plan).toEqual({
        actions: [
          matchAction('Container', 'Destroy', {
            container: { name: 'server' }
          }),
          matchAction('Volume', 'Destroy', {
            volume: { name: 'node_modules' }
          }),
          matchAction('Network', 'Destroy', { network: { name: 'default' } })
        ],
        project: 'test'
      });
    });

    it('only destroys a volume when no services are still using it', () => {
      const current: State.FromCluster = {
        containers: [
          {
            env: 'prod',
            hash: '',
            info: null,
            name: 'server',
            project: 'test',
            resource: 'Container',
            type: 'Service'
          },
          {
            env: 'prod',
            hash: '',
            info: null,
            name: 'worker',
            project: 'test',
            resource: 'Container',
            type: 'Service'
          }
        ],
        images: [
          {
            hash: '',
            info: null,
            name: 'test-nodejs',
            project: 'test',
            resource: 'Image'
          }
        ],
        networks: [
          {
            hash: 'sha1:ddef89e03ada07355cc4a3754545f006f208c453',
            info: null,
            name: 'default',
            project: 'test',
            resource: 'Network'
          }
        ],
        project: 'test',
        volumes: [
          {
            hash: '',
            info: null,
            name: 'node_modules',
            project: 'test',
            resource: 'Volume'
          }
        ],

        proxies: [],
        services: [
          {
            env: 'prod',
            hash: '',
            info: null,
            name: 'server',
            project: 'test',
            resource: 'Container',
            type: 'Service'
          },
          {
            env: 'prod',
            hash: '',
            info: null,
            name: 'worker',
            project: 'test',
            resource: 'Container',
            type: 'Service'
          }
        ]
      };
      const desired = State.fromSpec(SPEC.name, SPEC, [SERVICES.worker]);

      const plan = Plan.from(current, desired);

      expect(plan).toEqual({
        actions: [
          matchAction('Container', 'Destroy', {
            container: { name: 'server' }
          })
        ],
        project: 'test'
      });
    });
  });
});

describe('State', () => {
  describe('#fromSpec', () => {
    it('', () => {
      const state = State.fromSpec(SPEC.name, SPEC, [SERVICES.server]);

      expect(state).toEqual({
        containers: [
          expect.objectContaining({
            // config: {},
            name: 'server',
            project: 'test',
            resource: 'Container',
            source: SERVICES.server
          })
        ],
        images: [
          expect.objectContaining({
            config: {
              directory: '/docker/test-nodejs'
            },
            name: 'test-nodejs',
            project: 'test',
            resource: 'Image'
          })
        ],
        networks: [
          expect.objectContaining({
            config: {
              driver: 'bridge'
            },
            name: 'default',
            project: 'test',
            resource: 'Network'
          })
        ],
        project: 'test',
        volumes: expect.arrayContaining([
          expect.objectContaining({
            config: {
              name: 'node_modules'
            },
            name: 'node_modules',
            project: 'test',
            resource: 'Volume'
          })
        ])
      });
    });
  });
});
