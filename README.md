# Clowdy

Clowdy is a simpler way to develop applications with Docker. You describe the services your app needs in one config file, `clowdy.config.js`, in the root of your project, and Clowdy runs them for you.

## Service mode (prod, dev, test)

A service can run in one of three modes. By default a service runs in `prod`. The other two are for working on your own code:

- `dev` mounts your source into the container and runs it with live reload.
- `test` runs your test suite.
- `prod` builds a production image and runs that.

You pick the mode per command (`clowdy dev`, `clowdy test`, `clowdy start`), and you can define a service differently for each mode.

## Config file (clowdy.config.js)

The config is a plain JavaScript file that describes the services in your project.

**clowdy.config.js**

```js
const path = require('path');

// Set the project name. You don't have to. It defaults to the current
// directory name.
project('awesome-app');

// Define a service named redis.
// A service that doesn't specify a mode is assumed to be "prod".
service('redis', {
  // Use the latest redis image from Docker Hub.
  image: 'redis',
  // Tell clowdy this service listens on port 6379.
  expose: [6379]
});

// Build an image named node-prod from the ./node-prod directory.
// This expects a Dockerfile to exist in ./node-prod.
image('node-prod', path.resolve(__dirname, 'node-prod'));

service('api', 'dev', {
  image: 'node:10-alpine',
  command: ['yarn', 'dev'],
  cwd: '/src',
  environment: {
    NODE_ENV: 'development'
  },
  expose: [3000],
  links: {
    redis: 'redis'
  },
  volumes: {
    '/src': __dirname
  }
});

service('api', 'prod', {
  image: 'node-prod',
  environment: {
    NODE_ENV: 'production'
  },
  expose: [3000],
  links: {
    redis: 'redis'
  }
});
```

**Commands**

Run `clowdy dev api -Ea` to start the api service in dev mode, expose all of its ports, and attach to the container. To detach without sending keystrokes to the process, use `control-d`.

Run `clowdy start api -E` to shut down the dev container and start the prod one. This builds the `node-prod` image from the directory in its config first.

Run `clowdy destroy` to clean everything up.

## Better experience for node.js development

The `@clowdy/nodejs` plugin wraps the config above so you don't have to repeat it. It knows how to run a Node project in each mode:

```js
/*
  What this does:
  - runs a node:10-alpine container
  - mounts the current directory at /usr/src/app
  - sets NODE_ENV=development
  - runs "yarn install"
  - runs "yarn dev"
  - watches package.json and runs yarn install on changes
  - watches code and restarts the process on changes
*/
plugin('@clowdy/nodejs').dev('api', {
  // add any extra configuration
  expose: [3000]
});

// To mount ./packages/api instead of the current directory:
plugin('@clowdy/nodejs').dev('api', './packages/api', {
  environment: {
    TZ: 'America/New_York'
  },
  expose: [8080]
});

/*
  What this does:
  - same as dev (above)
  - sets NODE_ENV=test
  - runs "yarn install"
  - runs "yarn test"
*/
plugin('@clowdy/nodejs').test('api', {
  environment: {
    // If you use something with its own watcher (mocha, jest, etc.),
    // you can disable the file watcher.
    WATCH_FILES: 'false'
  }
});

/*
  What this does:
  - creates a new docker image based on node:10-alpine
    - this image runs "yarn install" and "yarn build"
    - it then runs "yarn install --production" and copies that code
      to a fresh image (using multi-stage builds)
    - sets the command to "yarn start"
  - sets NODE_ENV=production
*/
plugin('@clowdy/nodejs').prod('api', {
  expose: [80]
});
```

## Run a Minecraft server with Clowdy

Create a `clowdy.config.js` file somewhere. I put mine in my home directory, to hold all of my personal services.

We'll use the `itzg/minecraft-server` image from Docker Hub. The file should look something like this:

```js
const path = require('path');

project('global');

service('minecraft', {
  environment: {
    EULA: 'TRUE'
  },
  expose: [25565],
  image: 'itzg/minecraft-server',
  volumes: {
    '/data': volume('minecraft')
  }
});
```

Now run `clowdy start minecraft -E` from the directory with the config file in it.

That's it! =-)

**Other things to do**

- Check status: `clowdy status`
- See the logs: `clowdy logs minecraft`
- Poke around the container in a shell: `clowdy shell minecraft`
- Stop the server: `clowdy stop minecraft`
- Destroy the container and the Minecraft server data: `clowdy destroy`

## How it works

Clowdy is a small reconcile engine. From your config it builds a blueprint of the containers, networks, volumes, and proxies that should exist, fingerprinting each one with a hash. It reads the actual state back from Docker (everything it creates is tagged with labels), diffs that against the blueprint, and runs the smallest set of actions to make them match. Because it compares by hash, the commands are idempotent: running `clowdy dev api` again converges on the desired state instead of recreating what is already correct.
