service('mongodb', {
  image: 'mongo:4.0',
  expose: [27017]
});

service('redis', {
  image: 'redis',
  expose: [6379]
});

plugin('@clowdy/nodejs').dev('server', {
  expose: [3000, 5000],
  links: {
    redis: 'redis'
  }
});

plugin('@clowdy/nodejs').test('server', {
  environment: {
    WATCH_FILES: 'false'
  },
  links: {
    redis: 'redis'
  }
});

plugin('@clowdy/nodejs').prod('server', {
  expose: [3000, 5000],
  links: {
    redis: 'redis'
  }
});
