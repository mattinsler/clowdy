const http = require('http');
const app = require('./app');

http
  .createServer((req, res) => {
    res.end('Hello, world port 3000!');
  })
  .listen(3000, () => console.log(`Listening on port 3000`));

app.listen(5000, () => console.log(`Listening on port 5000`));
