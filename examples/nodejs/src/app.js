const polka = require('polka');
const redis = require('redis');
const morgan = require('morgan');
const Rebridge = require('rebridge');
const send = require('@polka/send-type');
const bodyParser = require('body-parser');

const client = redis.createClient({ host: 'redis' });
const db = new Rebridge(client, { mode: 'deasync' });

const app = polka()
  .use(morgan('dev'))
  .use(bodyParser.json());

db.items = [];

app.delete('/', (req, res) => {
  db.items = [];
  send(res, 200, { items: db.items._value });
});

app.get('/', (req, res) => {
  send(res, 200, { items: db.items._value });
});

app.post('/', (req, res) => {
  db.items.push(req.body.ts);
  send(res, 200, { items: db.items._value });
});

module.exports = app;
