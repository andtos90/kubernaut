import Promise from 'bluebird';
import bodyParser from 'body-parser';
import hogan from 'hogan.js';
import Boom from 'boom';
import EventEmitter from 'events';
import DeploymentLogEntry from '../../domain/DeploymentLogEntry';
import { loadAll as yaml2json } from 'js-yaml';
import parseFilters from './lib/parseFilters';
import secretTemplate from './lib/secretTemplate';
import { getIngressManifest } from './lib/ingressTemplating';

export default function(options = {}) {

  function start({ pkg, app, store, kubernetes, auth, logger, broadcast }, cb) {

    app.use('/api/deployments', auth('api'));

    app.get('/api/deployments', async (req, res, next) => {
      try {
        const meta = { date: new Date(), account: req.user };
        await store.audit(meta, 'viewed deployments');
        const filters = parseFilters(req.query, ['registry', 'service', 'version', 'namespace', 'cluster', 'createdBy']);
        const criteria = {
          filters,
          user: {
            id: req.user.id,
            namespace: { permission: 'deployments-read' },
            registry: { permission: 'releases-read' },
          }
        };

        if (req.query.hasOwnProperty('hasNotes') && req.query.hasNotes !== '') {
          criteria['hasNotes'] = req.query.hasNotes === 'true';
        }
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
        const sort = req.query.sort ? req.query.sort : 'created';
        const order = req.query.order ? req.query.order : 'asc';
        const since = req.query.since ? new Date(parseInt(req.query.since, 10)) : undefined;
        const till = req.query.till ? new Date(parseInt(req.query.till, 10)) : undefined;

        if (since) criteria.since = since;
        if (till) criteria.till = till;

        const result = await store.findDeployments(criteria, limit, offset, sort, order);
        res.json(result);
      } catch (err) {
        next(err);
      }
    });

    app.get('/api/deployments/latest-by-namespace/:registry/:service', async (req, res, next) => {
      try {
        const registry = await store.findRegistry({ name: req.params.registry });
        if (!registry) return next(Boom.notFound());
        if(! await store.hasPermissionOnRegistry(req.user, registry.id, 'registries-read')) return next(Boom.forbidden());
        const service = await store.findService({ filters: parseFilters(req.params, ['service', 'registry'], {
          service: 'name'
        }) });
        if (!service) return next(Boom.notFound());
        const meta = { date: new Date(), account: { id: req.user.id } };
        const includeFailed = (req.query || {}).hasOwnProperty('includeFailed');

        const deployments = await store.findLatestDeploymentsByNamespaceForService(registry.id, req.params.service, req.user, includeFailed);

        await Promise.map(deployments, async (latestDeployment, index) => {
          const namespace = await store.getNamespace(latestDeployment.namespace.id);
          try {
            const restarts = await kubernetes.deploymentRestartsInANamespace(namespace.cluster.config, namespace.cluster.context, namespace.name, service.name, logger);
            deployments[index].restarts = restarts;
          } catch (e) {
            logger.error(e);
          }
        }, { concurrency: 6 });

        await store.audit(meta, 'viewed latest deployments for service by namespace', { registry, service });
        res.json(deployments);
      } catch(err) {
        next(err);
      }
    });

    app.get('/api/deployments/namespaces-history-per-release', async (req, res, next) => {
      try {
        const meta = { date: new Date(), account: req.user };
        const filters = parseFilters(req.query, ['release']);
        const criteria = {
          filters,
          user: {
            id: req.user.id,
          }
        };

        if (!filters.release) return next(Boom.badRequest());
        await store.audit(meta, 'viewed historic namespace deployment for releases');
        const result = await store.findNamespaceHistoryForReleases(criteria);
        res.json(result);
      } catch (err) {
        next(err);
      }
    });

    app.get('/api/deployments/:id', async (req, res, next) => {
      try {
        const deployment = await store.getDeployment(req.params.id);
        if (!deployment) return next(Boom.notFound());
        if (! await store.hasPermissionOnNamespace(req.user, deployment.namespace.id, 'deployments-read')) return next(Boom.forbidden());
        if (deployment.attributes.secret && await store.hasPermissionOnNamespace(req.user, deployment.namespace.id, 'secrets-apply')) {
          const meta = { date: new Date(), account: { id: req.user.id } };
          const storedSecret = await store.getVersionOfSecretById(deployment.attributes.secret, meta);
          if (storedSecret) deployment.attributes.secret = storedSecret;
        }
        if (deployment.attributes.ingress && await store.hasPermissionOnNamespace(req.user, deployment.namespace.id, 'ingress-apply')) {
          const storedIngress = await store.getIngressVersion(deployment.attributes.ingress);
          if (storedIngress) deployment.attributes.ingress = storedIngress;
        }
        const meta = { date: new Date(), account: req.user };
        await store.audit(meta, 'viewed deployment', { deployment });
        res.json(deployment);
      } catch (err) {
        next(err);
      }
    });

    app.post('/api/deployments', bodyParser.json(), async (req, res, next) => {

      try {
        const meta = { date: new Date(), account: { id: req.user.id } };
        if (!req.body.cluster) return next(Boom.badRequest('cluster is required'));
        if (!req.body.registry) return next(Boom.badRequest('registry is required'));
        if (!req.body.service) return next(Boom.badRequest('service is required'));
        if (!req.body.version) return next(Boom.badRequest('version is required'));
        if (!req.body.namespace) return next(Boom.badRequest('namespace is required'));
        const toDelete = [];
        const release = await store.findRelease({ registry: req.body.registry, service: req.body.service, version: `${req.body.version}` });
        if (!release) return next(Boom.badRequest(`release ${req.body.registry}/${req.body.service}/${req.body.version} was not found`));

        const namespace = await store.findNamespace({ name: req.body.namespace, cluster: req.body.cluster })
          .then((namespace) => namespace ? store.getNamespace(namespace.id) : namespace);
        if (!namespace) return next(Boom.badRequest(`namespace ${req.body.namespace} was not found`));
        if (! await store.hasPermissionOnNamespace(req.user, namespace.id, 'deployments-write')) return next(Boom.forbidden());

        const registry = await store.findRegistry({ name: req.body.registry });
        if (!registry) return next(Boom.badRequest(`registry ${req.body.registry} was not found`));
        if (! await store.hasPermissionOnRegistry(req.user, registry.id, 'releases-read')) return next(Boom.forbidden());

        const contextOk = await kubernetes.checkContext(namespace.cluster.config, namespace.cluster.context, res.locals.logger);
        if (!contextOk) return next(Boom.badRequest(`context ${namespace.cluster.context} was not found`));

        const namespaceOk = await kubernetes.checkNamespace(namespace.cluster.config, namespace.cluster.context, namespace.name, res.locals.logger);
        if (!namespaceOk) return next(Boom.badRequest(`namespace ${namespace.name} was not found in ${namespace.cluster.name} cluster`));

        const serviceCanDeploytoNamespace = await store.checkServiceCanDeploytoNamespace(namespace, release.service);
        if (!serviceCanDeploytoNamespace) return next(Boom.badRequest(`service ${release.service.name} is not allowed to deploy to namespace ${namespace.name}`));

        const canApplySecretsToNamespace = await store.hasPermissionOnNamespace(req.user, namespace.id, 'secrets-apply');
        if (!canApplySecretsToNamespace && req.body.secret) return next(Boom.forbidden());

        const canApplyIngressToNamespace = await store.hasPermissionOnNamespace(req.user, namespace.id, 'ingress-apply');
        if (!canApplyIngressToNamespace && req.body.ingress) return next(Boom.forbidden());

        let versionOfSecret;
        if (req.body.secret) {
          versionOfSecret = await store.getVersionOfSecretWithDataById(req.body.secret, meta, { opaque: true });
          if (!versionOfSecret) return next(Boom.badRequest(`secret ${req.body.secret} was not found`));
          if (versionOfSecret.service.id !== release.service.id) return next(Boom.forbidden());
          if (versionOfSecret.namespace.id !== namespace.id) return next(Boom.forbidden());
          const secretManifest = getSecretManifest(versionOfSecret);
          versionOfSecret.setYaml(secretManifest);
        }

        let versionOfIngress;
        if (req.body.ingress) {
          versionOfIngress = await store.getIngressVersion(req.body.ingress);
          if (!versionOfIngress) return next(Boom.badRequest(`ingress ${req.body.ingress} was not found`));
          if (versionOfIngress.service.id !== release.service.id) return next(Boom.forbidden());
          const ingressManifest = await getIngressManifest(store, versionOfIngress, namespace.cluster);
          versionOfIngress.setYaml(ingressManifest);

          const latestDeployed = await store.getLatestDeployedIngressToNamespace(release.service, namespace, meta);
          if (latestDeployed) {
            const toDeployEntryNames = versionOfIngress.entries.map(({ name }) => (name));
            const deletedEntries = latestDeployed.entries.filter(({ name }) => (toDeployEntryNames.indexOf(name) === -1));
            deletedEntries.forEach(({ name }) => toDelete.push({ objectType: 'ingress', name }));
          }
        }

        const serviceNamespaceAttrs = await store.getServiceAttributesForNamespace(release.service, namespace);

        const attributes = Object.assign({}, namespace.attributes, release.attributes, serviceNamespaceAttrs, req.body, versionOfSecret ? { secret: versionOfSecret.id } : {});
        const manifest = getManifest(release, attributes, versionOfIngress);
        const data = { namespace, manifest, release, attributes };

        const deployment = await store.saveDeployment(data, meta);
        await store.audit(meta, 'created deployment', { deployment, release, service: release.service, namespace, registry, secretVersion: versionOfSecret });
        if (versionOfSecret) deployment.setSecret(versionOfSecret);
        const emitter = new EventEmitter();
        const log = [];

        emitter.on('data', async data => {
          log.push(data);

          res.locals.logger.info(data.content);
          await store.saveDeploymentLogEntry(new DeploymentLogEntry({ deployment, ...data }));
        }).on('error', async data => {
          log.push(data);

          res.locals.logger.error(data.content);
          await store.saveDeploymentLogEntry(new DeploymentLogEntry({ deployment, ...data }));
        });

        const applyExitCode = await applyManifest(deployment, emitter, toDelete);

        if (applyExitCode === 0) {
          getRolloutStatus(deployment, emitter);
          return res.status(202).json({ id: deployment.id, status: 'pending', log });
        } else {
          return res.status(500).json({ id: deployment.id, status: 'failure', log });
        }
      } catch (err) {
        next(err);
      }
    });

    app.post('/api/deployments/:id/note', bodyParser.json(), async (req, res, next) => {
      try {
        const deployment = await store.getDeployment(req.params.id);
        if (!deployment) return next(Boom.forbidden());
        if (! await store.hasPermissionOnNamespace(req.user, deployment.namespace.id, 'deployments-write')) return next(Boom.forbidden());
        if (req.body.note === undefined) return next(Boom.badRequest('note is required'));
        if (typeof req.body.note !== 'string') return next(Boom.badRequest('note must be a string'));
        const result = await store.setDeploymentNote(deployment.id, req.body.note);
        const meta = { date: new Date(), account: { id: req.user.id } };
        await store.audit(meta, 'saved note to deployment', { deployment });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    });

    app.delete('/api/deployments/:id', async (req, res, next) => {
      try {
        const deployment = await store.getDeployment(req.params.id);
        if (!deployment) return next(Boom.forbidden());
        if (! await store.hasPermissionOnNamespace(req.user, deployment.namespace.id, 'deployments-write')) return next(Boom.forbidden());

        const meta = { date: new Date(), account: { id: req.user.id } };
        await store.deleteDeployment(req.params.id, meta);
        await store.audit(meta, 'deleted note from deployment', { deployment });
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    });

    function getSecretManifest(versionOfSecret) {
      const secretYaml = versionOfSecret ? hogan.compile(secretTemplate).render(versionOfSecret) : '';
      return secretYaml;
    }

    function getManifest(release, attributes, versionOfIngress) {
      let yaml = hogan.compile(release.template.source.yaml).render(attributes);
      const json = yaml2json(yaml);
      if (versionOfIngress && versionOfIngress.yaml) {
        yaml = [yaml, versionOfIngress.yaml].join('\n---\n');
      }
      return { yaml, json };
    }

    async function applyManifest(deployment, emitter, toDelete) {
      const yaml = deployment.secret ? `${deployment.secret.yaml}\n${deployment.manifest.yaml}`: deployment.manifest.yaml;
      const code = await kubernetes.apply(
        deployment.namespace.cluster.config,
        deployment.namespace.cluster.context,
        deployment.namespace.name,
        yaml,
        emitter,
        toDelete,
      );
      await store.saveApplyExitCode(deployment.id, code);
      return code;
    }

    async function getRolloutStatus(deployment, emitter) {
      try {
        await broadcast({
          type: 'deployment',
          id: deployment.id,
          cluster: deployment.namespace.cluster.id,
          release: deployment.release.id,
          service: deployment.release.service.id,
          cluster_name: deployment.namespace.cluster.name,
          service_name: deployment.release.service.name,
          commit: deployment.release.attributes.commit,
          message: broadcast.format.deployment(await store.getDeployment(deployment.id)),
        });
        const code = await kubernetes.rolloutStatus(
          deployment.namespace.cluster.config,
          deployment.namespace.cluster.context,
          deployment.namespace.name,
          deployment.manifest.yaml,
          emitter
        );

        await store.saveRolloutStatusExitCode(deployment.id, code);
        if (code) {
          await broadcast({
            type: 'deployment-failed',
            id: deployment.id,
            cluster: deployment.namespace.cluster.id,
            release: deployment.release.id,
            service: deployment.release.service.id,
            cluster_name: deployment.namespace.cluster.name,
            service_name: deployment.release.service.name,
            commit: deployment.release.attributes.commit,
            message: broadcast.format.deployment(await store.getDeployment(deployment.id)),
          });
        } else {
          await broadcast({
            type: 'deployment-success',
            id: deployment.id,
            cluster: deployment.namespace.cluster.id,
            release: deployment.release.id,
            service: deployment.release.service.id,
            cluster_name: deployment.namespace.cluster.name,
            service_name: deployment.release.service.name,
            commit: deployment.release.attributes.commit,
            message: broadcast.format.deployment(await store.getDeployment(deployment.id)),
          });
        }
        return code;
      } catch (e) {
        logger.error('Error getting rollout status', e);
        return Promise.reject(e);
      }
    }

    cb();
  }

  return {
    start,
  };
}
