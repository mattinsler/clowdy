const assert = require('assert');
const request = require('supertest');

const app = require('../src/app');

function hasKey(key) {
  return res => {
    if (!(key in res.body)) {
      throw new Error(`Missing key "${key}" in response.`);
    }
  };
}

describe('Routes', () => {
  describe('DELETE /', () => {
    it('Response with JSON', () =>
      request(app.handler)
        .delete('/')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200));
  });

  describe('GET /', () => {
    it('Responds with JSON', () =>
      request(app.handler)
        .get('/')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200));

    it('Responds with an "items" array', () =>
      request(app.handler)
        .get('/')
        .set('Accept', 'application/json')
        .expect(res => assert(Array.isArray(res.body.items))));
  });

  describe('POST /', () => {
    it('Responds with JSON', () =>
      request(app.handler)
        .post('/')
        .send({ ts: Date.now() })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200));

    it('Responds with an "items" array', () =>
      request(app.handler)
        .post('/')
        .send({ ts: Date.now() })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(res => assert(Array.isArray(res.body.items))));
  });
});
