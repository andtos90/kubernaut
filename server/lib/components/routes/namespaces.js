import bodyParser from 'body-parser';
import Boom from 'boom';

export default function(options = {}) {

  function start({ pkg, app, store, kubernetes, auth, }, cb) {

    app.use('/api/namespaces', auth('api'));

    app.get('/api/namespaces', async (req, res, next) => {
      try {
        const namespaces = req.user.listNamespaceIdsWithPermission('namespaces-read');
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
        const result = await store.findNamespaces({ namespaces, }, limit, offset);
        res.json(result);
      } catch (err) {
        next(err);
      }
    });

    app.get('/api/namespaces/:id', async (req, res, next) => {
      try {
        const namespace = await store.getNamespace(req.params.id);
        if (!namespace) return next(Boom.notFound());
        if (!req.user.hasPermissionOnNamespace(namespace.id, 'namespaces-read')) return next(Boom.forbidden());
        res.json(namespace);
      } catch (err) {
        next(err);
      }
    });

    app.post('/api/namespaces', bodyParser.json(), async (req, res, next) => {
      try {
        if (!req.user.isNamespaceAdmin()) return next(Boom.forbidden());
        if (!req.body.name) return next(Boom.badRequest('name is required'));
        if (!req.body.cluster) return next(Boom.badRequest('cluster is required'));

        const cluster = await store.findCluster({ name: req.body.cluster, });
        if (!cluster) return next(Boom.badRequest(`cluster ${req.body.cluster} was not found`));

        const namespaceOk = await kubernetes.checkNamespace(cluster.config, cluster.context, req.body.name, res.locals.logger);
        if (!namespaceOk) return next(Boom.badRequest(`namespace ${req.body.name} was not found on ${cluster.name} cluster`));

        const data = { name: req.body.name, context: req.body.context, };
        const meta = { date: new Date(), account: { id: req.user.id, }, };
        const namespace = await store.saveNamespace(data, meta);
        res.json(namespace);
      } catch (err) {
        next(err);
      }
    });

    app.delete('/api/namespaces/:id', async (req, res, next) => {
      try {
        if (!req.user.isNamespaceAdmin()) return next(Boom.forbidden());
        const meta = { date: new Date(), account: { id: req.user.id, }, };
        await store.deleteNamespace(req.params.id, meta);
        res.status(204).send();
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
