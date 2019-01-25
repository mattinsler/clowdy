process.on('unhandledRejection', err => console.log(err));

import * as cluster from 'cluster';

if (cluster.isMaster) {
  const idx = process.argv.findIndex(v => require.resolve(v) === __filename);
  require('./master').master(process.cwd(), process.argv.slice(idx + 1));
} else {
  require('./worker');
}
