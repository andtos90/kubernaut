import bodyParser from 'body-parser';
import Boom from 'boom';
import isCSSColorName from 'is-css-color-name';
import isCSSColorHex from 'is-css-color-hex';
import parseFilters from './lib/parseFilters';

export default function(options = {}) {

  function start({ pkg, app, store, kubernetes, auth }, cb) {

    app.use('/api/namespaces', auth('api'));

    app.get('/api/namespaces', async (req, res, next) => {
      try {
        const meta = { date: new Date(), account: req.user };
        await store.audit(meta, 'viewed namespaces');
        const filters = parseFilters(req.query, ['name', 'cluster']);
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
        const criteria = {
          filters,
          user: { id: req.user.id, permission: 'namespaces-read' },
        };
        const result = await store.findNamespaces(criteria, limit, offset);
        res.json(result);
      } catch (err) {
        next(err);
      }
    });

    app.get('/api/namespaces/:id', async (req, res, next) => {
      try {
        const namespaceOk = await store.getNamespace(req.params.id);
        if (!namespaceOk) return next(Boom.notFound(`namespace ${req.params.id} was not found`));
        if (! await store.hasPermissionOnNamespace(req.user, req.params.id, 'namespaces-read')) return next(Boom.forbidden());

        const namespace = await store.getNamespace(req.params.id);
        if (!namespace) return next(Boom.notFound());
        const meta = { date: new Date(), account: req.user };
        await store.audit(meta, 'viewed namespace', { namespace });
        res.json(namespace);
      } catch (err) {
        next(err);
      }
    });

    app.post('/api/namespaces', bodyParser.json(), async (req, res, next) => {
      try {
        if (! await store.hasPermission(req.user, 'namespaces-write')) return next(Boom.forbidden());

        if (!req.body.name) return next(Boom.badRequest('name is required'));
        if (!req.body.cluster) return next(Boom.badRequest('cluster is required'));

        const cluster = await store.findCluster({ name: req.body.cluster });
        if (!cluster) return next(Boom.badRequest(`cluster ${req.body.cluster} was not found`));

        const namespaceOk = await kubernetes.checkNamespace(cluster.config, cluster.context, req.body.name, res.locals.logger);
        if (!namespaceOk) return next(Boom.badRequest(`namespace ${req.body.name} was not found on ${cluster.name} cluster`));

        const colorOk = req.body.color && (isCSSColorHex(req.body.color) || isCSSColorName(req.body.color));
        if (req.body.color && !colorOk) return next(Boom.badRequest(`Unable to verify color`));

        const data = { name: req.body.name, cluster, color: req.body.color };
        const meta = { date: new Date(), account: { id: req.user.id } };
        const namespace = await store.saveNamespace(data, meta);
        await store.audit(meta, 'saved namespace', { namespace });
        res.json(namespace);
      } catch (err) {
        if (err.code && err.code === '23505') return next(Boom.conflict(err.detail)); // unique_violation
        next(err);
      }
    });

    app.post('/api/namespaces/:id', bodyParser.json(), async (req, res, next) => {
      try {
        const namespaceOk = await store.getNamespace(req.params.id);
        if (!namespaceOk) return next(Boom.notFound(`namespace ${req.params.id} was not found`));

        if (!await store.hasPermissionOnNamespace(req.user, req.params.id, 'namespaces-write')) return next(Boom.forbidden());

        const values = ['attributes', 'cluster', 'color'].reduce((acc, prop) => {
          if (!({}).hasOwnProperty.call(req.body, prop)) return acc;
          return (acc[prop] = req.body[prop]), acc;
        }, {});

        if (values.hasOwnProperty('cluster')) {
          const clusterOk = await store.getCluster(values.cluster);
          if (!clusterOk) return next(Boom.badRequest(`cluster ${values.cluster} was not found`));
        }

        if (values.hasOwnProperty('color')) {
          const colorOk = values.color === '' || isCSSColorHex(values.color) || isCSSColorName(values.color);
          if (!colorOk) return next(Boom.badRequest(`Unable to verify color`));
        }

        const namespace = await store.updateNamespace(req.params.id, values);
        const meta = { date: new Date(), account: { id: req.user.id } };
        await store.audit(meta, 'updated namespace', { namespace });
        res.json(namespace);
      } catch (err) {
        next(err);
      }
    });

    app.delete('/api/namespaces/:id', async (req, res, next) => {
      try {
        if (! await store.hasPermissionOnNamespace(req.user, req.params.id, 'namespaces-write')) return next(Boom.forbidden());
        const namespace = await store.getNamespace(req.params.id);
        if (!namespace) return next(Boom.notFound());

        const meta = { date: new Date(), account: { id: req.user.id } };
        await store.deleteNamespace(req.params.id, meta);
        await store.audit(meta,'deleted namespace', { namespace });
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });

    app.get('/api/namespaces/can-deploy-to-for/:serviceId', async (req, res, next) => {
      try {
        const service = await store.getService(req.params.serviceId);
        if (!service) return next(Boom.notFound());
        const registryOk = await store.hasPermissionOnRegistry(req.user, service.registry.id, 'registries-read');
        if (!registryOk) return next(Boom.forbidden());

        const namespaces = await store.namespacesForService({
          user: { id: req.user.id, permission: 'deployments-write' },
          service,
        });
        const meta = { date: new Date(), account: { id: req.user.id } };
        await store.audit(meta, 'checked namespaces service can deploy to', { service });
        res.json(namespaces);
      } catch (err) {
        next(err);
      }
    });

    cb();
  }

  return {
    start,
  };
}
