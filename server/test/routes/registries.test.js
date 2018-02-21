import request from 'request-promise';
import errors from 'request-promise/errors';
import createSystem from '../test-system';
import human from '../../lib/components/logger/human';
import { makeRegistry, makeMeta, } from '../factories';

describe('Registries API', () => {

  let config;
  let system = { stop: cb => cb(), };
  let store = { nuke: new Promise(cb => cb()), };

  const loggerOptions = {};

  beforeAll(cb => {
    system = createSystem()
    .set('config.overrides', { server: { port: 13005, }, })
    .set('transports.human', human(loggerOptions)).dependsOn('config')
    .start((err, components) => {
      if (err) return cb(err);
      config = components.config;
      store = components.store;
      cb();
    });
  });

  beforeEach(async cb => {
    try {
      await store.nuke();
    } catch (err) {
      cb(err);
    }
    cb();
  });

  afterEach(() => {
    loggerOptions.suppress = false;
  });

  afterAll(cb => {
    system.stop(cb);
  });

  describe('GET /api/registries', () => {

    beforeEach(async () => {

      const registries = [];
      for (var i = 0; i < 51; i++) {
        registries.push({
          data: makeRegistry(),
          meta: makeMeta(),
        });
      }

      await Promise.all(registries.map(async registry => {
        await store.saveRegistry(registry.data, registry.meta);
      }));
    });

    it('should return a list of registries', async () => {
      const registries = await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries`,
        method: 'GET',
        json: true,
      });

      expect(registries.count).toBe(52);
      expect(registries.offset).toBe(0);
      expect(registries.limit).toBe(50);
      expect(registries.items.length).toBe(50);
    });

    it('should limit registries list', async () => {

      const registries = await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries`,
        qs: { limit: 40, offset: 0, },
        method: 'GET',
        json: true,
      });

      expect(registries.count).toBe(52);
      expect(registries.offset).toBe(0);
      expect(registries.limit).toBe(40);
      expect(registries.items.length).toBe(40);
    });

    it('should page namepaces list', async () => {

      const registries = await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries`,
        qs: { limit: 50, offset: 10, },
        method: 'GET',
        json: true,
      });

      expect(registries.count).toBe(52);
      expect(registries.offset).toBe(10);
      expect(registries.limit).toBe(50);
      expect(registries.items.length).toBe(42);
    });

  });

  describe('GET /api/registries/:id', () => {

    it('should return the requested registry', async () => {

      const data = makeRegistry();
      const saved = await store.saveRegistry(data, makeMeta());

      const registry = await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries/${saved.id}`,
        method: 'GET',
        json: true,
      });

      expect(registry.id).toBe(saved.id);
    });

    it('should return 404 for missing registries', async () => {

      loggerOptions.suppress = true;

      await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries/does-not-exist`,
        method: 'GET',
        resolveWithFullResponse: true,
        json: true,
      }).then(() => {
        throw new Error('Should have failed with 404');
      }).catch(errors.StatusCodeError, (reason) => {
        expect(reason.response.statusCode).toBe(404);
      });
    });
  });

  describe('POST /api/registries', () => {

    it('should save a registry', async () => {

      const data = makeRegistry();

      const response = await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries`,
        method: 'POST',
        json: data,
      });

      expect(response.id).toBeDefined();

      const registry = await store.getRegistry(response.id);

      expect(registry).toBeDefined();
      expect(registry.name).toBe(data.name);
    });

    it('should reject payloads without a name', async () => {

      loggerOptions.suppress = true;

      await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries`,
        method: 'POST',
        resolveWithFullResponse: true,
        json: {
        },
      }).then(() => {
        throw new Error('Should have failed with 400');
      }).catch(errors.StatusCodeError, (reason) => {
        expect(reason.response.statusCode).toBe(400);
        expect(reason.response.body.message).toBe('name is required');
      });
    });

  });

  describe('DELETE /api/registries/:id', () => {

    it('should delete registries', async () => {

      const data = makeRegistry();
      const saved = await store.saveRegistry(data, makeMeta());

      const response = await request({
        url: `http://${config.server.host}:${config.server.port}/api/registries/${saved.id}`,
        method: 'DELETE',
        resolveWithFullResponse: true,
        json: true,
      });

      expect(response.statusCode).toBe(204);

      const registry = await store.getRegistry(saved.id);
      expect(registry).toBe(undefined);
    });
  });
});