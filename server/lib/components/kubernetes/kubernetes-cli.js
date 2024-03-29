import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  KubeConfig,
  CoreV1Api,
  AppsV1Api,
  BatchV1Api,
  BatchV1beta1Api,
  NetworkingV1beta1Api,
  loadAllYaml,
} from '@kubernetes/client-node';
import _ from 'lodash';
import Promise from 'bluebird';

const ssaHeaders = {
  'content-type': 'application/apply-patch+yaml'
};

function splitTheYaml(yaml, emitter) {
  const docs = loadAllYaml(yaml);
  return docs.filter(_.identity).reduce((acc, doc) => {
    if (!doc.kind) {
      emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: 'Found doc in yaml without a \'kind\' defined. Ignoring.' });
      return acc;
    }
    if (!doc.metadata || !doc.metadata.name) {
      emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: 'Found doc in yaml without a \'metadata.name\' defined. Ignoring.' });
      return acc;
    }
    acc[doc.kind.toLowerCase()] = acc[doc.kind.toLowerCase()] ? acc[doc.kind.toLowerCase()].concat(doc) : [doc];
    return acc;
  }, {});
}

function createClients(configLocation, context) {
  const kc = new KubeConfig();
  kc.loadFromFile(configLocation);
  kc.setCurrentContext(context);

  return {
    k8sApi: kc.makeApiClient(CoreV1Api),
    k8sAppsApi: kc.makeApiClient(AppsV1Api),
    k8sBatchV1Api: kc.makeApiClient(BatchV1Api),
    k8sBatchV1Beta1Api: kc.makeApiClient(BatchV1beta1Api),
    k8sNetworkingV1Beta1Api: kc.makeApiClient(NetworkingV1beta1Api),
  };
}

async function patchResponseStatus(resultPromise, emitter) {
  try {
    const { body, response } = await resultPromise;
    if (response.statusCode === 201) {
      emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${body.kind.toLowerCase()}/${body.metadata.name} created` });
      return;
    }

    if (response.statusCode === 200) {
      emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${body.kind.toLowerCase()}/${body.metadata.name} configured` });
      return;
    }
  } catch (errResult) {
    if (!errResult.response && !errResult.response.body && !errResult.response.body.message) throw errResult;

    emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: errResult.response.body.message });
    throw new Error(errResult.response.body.message);
  }
}

async function applyDocs(clients, docsByType = {}, namespace, emitter) {
  const {
    k8sApi,
    k8sAppsApi,
    k8sBatchV1Beta1Api,
    k8sBatchV1Api,
    k8sNetworkingV1Beta1Api,
  } = clients;

  for (const docType in docsByType) {
    if (docType === 'secret') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sApi.patchNamespacedSecret(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'service') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sApi.patchNamespacedService(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'deployment') {
      for (const doc of docsByType[docType]) {
        _.update(doc, 'spec.template.spec.containers', (c) => {
          return c.map((containerSpec) => ({
            ...containerSpec,
            ports: containerSpec.ports && containerSpec.ports.map((portSpec) => ({
              ...portSpec,
              protocol: portSpec.protocol || 'TCP', // server side apply needs protocol, and they don't respect the default for some reason (at least, not at 1.17 anyway)
            })),
          }));
        });

        await patchResponseStatus(k8sAppsApi.patchNamespacedDeployment(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'cronjob') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sBatchV1Beta1Api.patchNamespacedCronJob(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'job') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sBatchV1Api.patchNamespacedJob(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'statefulset') {
      for (const doc of docsByType[docType]) {
        _.update(doc, 'spec.template.spec.containers', (c) => {
          return c.map((containerSpec) => ({
            ...containerSpec,
            ports: containerSpec.ports && containerSpec.ports.map((portSpec) => ({
              ...portSpec,
              protocol: portSpec.protocol || 'TCP', // server side apply needs protocol, and they don't respect the default for some reason (at least, not at 1.17 anyway)
            })),
          }));
        });

        await patchResponseStatus(k8sAppsApi.patchNamespacedStatefulSet(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'ingress') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sNetworkingV1Beta1Api.patchNamespacedIngress(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'configmap') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sApi.patchNamespacedConfigMap(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    if (docType === 'persistentvolumeclaim') {
      for (const doc of docsByType[docType]) {
        await patchResponseStatus(k8sApi.patchNamespacedPersistentVolumeClaim(doc.metadata.name, namespace, doc, undefined, undefined, 'kubernaut', 'true', { headers: ssaHeaders }), emitter);
      }
      continue;
    }

    emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: `[${docType}] detected and is unsupported at this time.` });
  }
}

async function deleteObjects(clients, toDelete, namespace, emitter) {
  const {
    k8sApi,
    k8sAppsApi,
    k8sBatchV1Beta1Api,
    k8sBatchV1Api,
    k8sNetworkingV1Beta1Api,
  } = clients;

  for (const toDeleteItem of toDelete) {
    const { objectType, name } = toDeleteItem;

    try {
      if (objectType === 'secret') {
        await k8sApi.deleteNamespacedSecret(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'service') {
        await k8sApi.deleteNamespacedService(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'deployment') {
        await k8sAppsApi.deleteNamespacedDeployment(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'cronjob') {
        await k8sBatchV1Beta1Api.deleteNamespacedCronJob(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'job') {
        await k8sBatchV1Api.deleteNamespacedJob(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'statefulset') {
        await k8sAppsApi.deleteNamespacedStatefulSet(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'ingress') {
        await k8sNetworkingV1Beta1Api.deleteNamespacedIngress(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'configmap') {
        await k8sApi.deleteNamespacedConfigMap(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }

      if (objectType === 'persistentvolumeclaim') {
        await k8sApi.deleteNamespacedPersistentVolumeClaim(name, namespace);
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} deleted`});
        continue;
      }
    } catch (errResult) {
      if (!errResult.response && !errResult.response.body && !errResult.response.body.message) throw errResult;

      if (errResult.statusCode && errResult.statusCode === 404) {
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `${objectType}/${name} not found`});
        continue;
      }

      emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: errResult.response.body.message });
      throw new Error(errResult.response.body.message);
    }

    emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: `[${objectType}] is unsupported for deletion at this time.` });
  }
}

function getStatus(deployment, emitter) {
  if (deployment.metadata.generation <= deployment.status.observedGeneration) {
    const condition = deployment.status.conditions.find((c) => (c.type === 'Progressing'));

    if (condition && condition.reason === 'ProgressDeadlineExceeded') {
      emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: `deployment ${deployment.metadata.name} exceeded its progress deadline` });
      throw new Error(`deployment ${deployment.metadata.name} exceeded its progress deadline`);
    }

    if (deployment.spec.replicas && (deployment.status.updatedReplicas || 0) < deployment.spec.replicas) {
      emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `Waiting for deployment ${deployment.metadata.name} rollout to finish: ${(deployment.status.updatedReplicas || 0)} out of ${deployment.spec.replicas} new replicas have been updated...` });
      return false;
    }

    if (deployment.status.replicas > (deployment.status.updatedReplicas || 0)) {
      emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `Waiting for deployment ${deployment.metadata.name} rollout to finish: ${deployment.status.replicas - (deployment.status.updatedReplicas || 0)} old replicas are pending termination...` });
      return false;
		}

		if ((deployment.status.availableReplicas || 0) < (deployment.status.updatedReplicas || 0)) {
      emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `Waiting for deployment ${deployment.metadata.name} rollout to finish: ${(deployment.status.availableReplicas || 0)} of ${(deployment.status.updatedReplicas || 0)} updated replicas are available...` });
      return false;
		}

    emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `deployment ${deployment.metadata.name} successfully rolled out` });
    return true;
  }

  emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: 'Waiting for deployment spec update to be observed...' });
  return false;
}

function getStatusStatefulSet(statefulset, emitter) {
  if (statefulset.spec.updateStrategy.type !== 'RollingUpdate') {
    emitter.emit('error', { writtenOn: new Date(), writtenTo: 'stderr', content: `statefulset ${statefulset.metadata.name} - rollout status is only available for RollingUpdate strategy type` });
    return true;
  }

  if (statefulset.status.observedGeneration === 0 || (statefulset.metadata.generation > statefulset.status.observedGeneration)) {
    emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `Waiting for statefulset ${statefulset.metadata.name} spec update to be observed...` });
    return false;
  }

  if (statefulset.spec.replicas !== undefined  && ((statefulset.status.readyReplicas || 0) < statefulset.spec.replicas)) {
    emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `Waiting for statefulset ${statefulset.metadata.name} ${statefulset.spec.replicas - (statefulset.status.readyReplicas || 0)} pods to be ready...` });
    return false;
  }

  if (statefulset.spec.updateStrategy.type === 'RollingUpdate' && statefulset.spec.updateStrategy.rollingUpdate !== undefined) {
    if (statefulset.spec.replicas !== undefined && statefulset.spec.updateStrategy.rollingUpdate.partition !== undefined) {
      if ((statefulset.status.updatedReplicas || 0) < (statefulset.spec.replicas - statefulset.spec.updateStrategy.rollingUpdate.partition)) {
        emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `Waiting for statefulset ${statefulset.metadata.name} partitioned roll out to finish: ${(statefulset.status.updatedReplicas || 0)} out of ${statefulset.spec.replicas - statefulset.spec.updateStrategy.rollingUpdate.partition} new pods have been updated...` });
        return false;
      }
    }
    emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `statefulset ${statefulset.metadata.name} partitioned roll out complete: ${(statefulset.status.updatedReplicas || 0)} new pods have been updated...` });
    return true;
  }

  emitter.emit('data', { writtenOn: new Date(), writtenTo: 'stdout', content: `statefulset ${statefulset.metadata.name} rolling update complete ${statefulset.status.replicas} pods at revision ${statefulset.status.currentRevision}...` });
  return true;
}

async function _rolloutStatus(clients, namespace, name, emitter) {
  const { k8sAppsApi } = clients;

  let keepWaiting = true;
  let latestState = (await k8sAppsApi.readNamespacedDeployment(name, namespace)).body;
  let oldState = latestState;

  try {
    keepWaiting = !getStatus(latestState, emitter);

    while (keepWaiting) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      oldState = latestState;
      latestState = (await k8sAppsApi.readNamespacedDeployment(name, namespace)).body;
      if (!_.isEqual(oldState, latestState)) {
        keepWaiting = !getStatus(latestState, emitter);
      }
    }
  } catch (e) {
    return 1;
  }

  return 0;
}

async function _rolloutStatusSS(clients, namespace, name, emitter) {
  const { k8sAppsApi } = clients;

  let keepWaiting = true;
  let latestState = (await k8sAppsApi.readNamespacedStatefulSet(name, namespace)).body;
  let oldState = latestState;

  try {
    keepWaiting = !getStatusStatefulSet(latestState, emitter);

    while (keepWaiting) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      oldState = latestState;
      latestState = (await k8sAppsApi.readNamespacedStatefulSet(name, namespace)).body;
      if (!_.isEqual(oldState, latestState)) {
        keepWaiting = !getStatusStatefulSet(latestState, emitter);
      }
    }
  } catch (e) {
    return 1;
  }

  return 0;
}

export default function(options = {}) {

  function start(deps, cb) {

    async function apply(config, context, namespace, manifest, emitter, toDelete) {
      const clients = createClients(config, context);
      const parsedDocs = splitTheYaml(manifest, emitter);
      try {
        await applyDocs(clients, parsedDocs, namespace, emitter);
        if (toDelete && toDelete.length) await deleteObjects(clients, toDelete, namespace, emitter);
        return 0;
      } catch (err) {
        // logger.error(err);
        return 1;
      }
    }

    async function rolloutStatus(config, context, namespace, manifest, emitter) {
      const parsedDocs = splitTheYaml(manifest, emitter);
      if (!parsedDocs.deployment && !parsedDocs.statefulset) return 0;
      const clients = createClients(config, context);

      const statusChecks = [];
      if (parsedDocs.deployment) {
        parsedDocs.deployment.forEach(doc => statusChecks.push(_rolloutStatus(clients, namespace, doc.metadata.name, emitter)));
      }
      if (parsedDocs.statefulset) {
        parsedDocs.statefulset.forEach(doc => statusChecks.push(_rolloutStatusSS(clients, namespace, doc.metadata.name, emitter)));
      }

      const results = await Promise.all(statusChecks);

      return results.find(code => code === 1) || 0;
    }

    function checkConfig(config, logger) {
      const fullPath = path.resolve(os.homedir(), config);
      return new Promise((resolve, reject) => {
        fs.access(fullPath, fs.constants.R_OK, (err) => {
          return err ? resolve(false) : resolve(true);
        });
      });
    }

    function checkContext(config, context, logger) {
      const kc = new KubeConfig();
      kc.loadFromFile(config);

      return kc.getContextObject(context);
    }

    function checkCluster(config, context, logger) {
      const kc = new KubeConfig();
      kc.loadFromFile(config);
      kc.setCurrentContext(context);
      return kc.getCurrentCluster();
    }

    async function checkNamespace(config, context, namespace, logger) {
      const { k8sApi } = createClients(config, context);
      try {
        const nsResult = await k8sApi.readNamespace(namespace);
        return nsResult.body;
      } catch (e) {
        return null;
      }
    }

    async function removeCronjob(config, context, namespace, cronjobName, logger) {
      const clients = createClients(config, context);
      try {
        logger.debug(`Checking for any cronjobs with relevant label ${cronjobName} in namespace ${namespace} given context ${context}) actually exists.`);

        const cronJobsResult = (await clients.k8sBatchV1Beta1Api.listNamespacedCronJob(namespace, undefined, undefined, undefined, `metadata.name=${cronjobName}`)).body;

        if (cronJobsResult.items.length === 0) return;

        await clients.k8sBatchV1Beta1Api.deleteNamespacedCronJob(cronjobName, namespace);
      } catch (e) {
        logger.error(e);
        throw e;
      }
    }

    async function getLastLogsForCronjob(config, context, namespace, cronjobName, logger) {
      const clients = createClients(config, context);

      try {
        logger.debug(`Checking for any jobs with relevant label ${cronjobName} in namespace ${namespace} given context ${context}) actually exists.`);

        const jobsResult = (await clients.k8sBatchV1Api.listNamespacedJob(namespace, undefined, undefined, undefined, undefined, `cronjobName=${cronjobName}`)).body;

        if (jobsResult.items.length === 0) return null;

        // Array containing only most recent execution
        const job = _.last(_.sortBy(jobsResult.items, (j) => new Date(j.createdAt)));

        const podSelector = job.spec.selector.matchLabels;
        if (!podSelector || (Object.keys(podSelector).length === 0)) return null;

        const podSelectorString = _.reduce(podSelector, (acc, val, key) => {
          return acc.concat(`${key}=${val}`);
        }, []).join(',');
        const podResult = (await clients.k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, podSelectorString)).body;

        if (podResult.items.length === 0) return null;
        const pod = podResult.items[0];
        const podName = pod.metadata.name;

        const containers = job.spec.template.spec.containers || [];
        const initContainers = job.spec.template.spec.initContainers || [];

        const logsPerContainer = await Promise.mapSeries(containers, async (container) => {
          let current;
          logger.debug(`Collecting logs for job pod ${podName} from container ${container.name}`);
          try {
            current = (await clients.k8sApi.readNamespacedPodLog(podName, namespace, container.name, undefined, undefined, undefined, undefined, undefined, undefined, 30)).body;
          } catch (e) {}

          return {
            name: container.name,
            logs: {
              current,
            },
          };
        });

        const logsPerInitContainer = await Promise.mapSeries(initContainers, async (container) => {
          let current;
          logger.debug(`Collecting logs for job pod ${podName} from initContainer ${container.name}`);
          try {
            current = (await clients.k8sApi.readNamespacedPodLog(podName, namespace, container.name, undefined, undefined, undefined, undefined, undefined, undefined, 30)).body;
          } catch (e) {}

          return {
            name: container.name,
            logs: {
              current,
            },
          };
        });

        return {
          name: job.metadata.name,
          createdAt: job.metadata.creationTimestamp,
          logsPerContainer,
          logsPerInitContainer,
        };
      } catch (e) {
        logger.error(e);
        throw e;
      }
    }

    async function deploymentRestartsInANamespace(config, context, namespace, deploymentName, logger) {
      const clients = createClients(config, context);
      let podResult;
      try {
        logger.debug(`Checking deployment (${deploymentName} in namespace ${namespace} given context ${context}) actually exists - this prevents a memory explosion when checking non-existent scale`);
        const deployments = (await clients.k8sAppsApi.listNamespacedDeployment(namespace, undefined, undefined, undefined, `metadata.name=${deploymentName}`)).body;
        if (deployments.items.length === 0) return null;

        logger.debug(`Fetching scale info for ${deploymentName} in namespace ${namespace} given context ${context}`);
        const scaleResult = await clients.k8sAppsApi.readNamespacedDeploymentScale(deploymentName, namespace);
        const podSelector = scaleResult.body.status.selector;
        logger.debug(`Using pod selector [${podSelector}]`);
        podResult = await clients.k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, podSelector);
      } catch (e) {
        logger.error(e);
        throw e;
      }

      const restartsPerPod = await Promise.mapSeries(podResult.body.items, async (pod) => {
        return _.get(pod, 'status.containerStatuses', []).reduce((acc, cStatus) => (Math.max(acc, cStatus.restartCount)), 0);
      });

      return restartsPerPod.reduce((acc, podRestarts) => (acc + podRestarts), 0);
    }

    async function getLastLogsForDeployment(config, context, namespace, deploymentName, logger) {
      const clients = createClients(config, context);
      let podResult;
      try {
        logger.debug(`Checking deployment (${deploymentName} in namespace ${namespace} given context ${context}) actually exists - this prevents a memory explosion when checking non-existent scale`);
        const deployments = (await clients.k8sAppsApi.listNamespacedDeployment(namespace, undefined, undefined, undefined, `metadata.name=${deploymentName}`)).body;
        if (deployments.items.length === 0) return [];

        logger.debug(`Fetching scale info for ${deploymentName} in namespace ${namespace} given context ${context}`);
        const scaleResult = await clients.k8sAppsApi.readNamespacedDeploymentScale(deploymentName, namespace);
        const podSelector = scaleResult.body.status.selector;
        logger.debug(`Using pod selector [${podSelector}]`);
        podResult = await clients.k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, podSelector);
      } catch (e) {
        logger.error(e);
        throw e;
      }


      const logsPerPod = await Promise.mapSeries(podResult.body.items, async (pod) => {
        const podEvents = (await clients.k8sApi.listNamespacedEvent(namespace, undefined, undefined, undefined, `involvedObject.name=${pod.metadata.name}`)).body.items;
        const containers = pod.spec.containers;
        const logsPerContainer = await Promise.mapSeries(containers, async (container) => {
          let previous;
          let current;
          try {
            previous = (await clients.k8sApi.readNamespacedPodLog(pod.metadata.name, namespace, container.name, undefined, undefined, undefined, true, undefined, undefined, 30)).body;
          } catch (e) {}
          try {
            current = (await clients.k8sApi.readNamespacedPodLog(pod.metadata.name, namespace, container.name, undefined, undefined, undefined, undefined, undefined, undefined, 30)).body;
          } catch (e) {}

          const logs = {
            current,
            previous,
          };

          return {
            name: container.name,
            logs,
          };
        });

        const restarts = _.get(pod, 'status.containerStatuses', []).reduce((acc, cStatus) => (Math.max(acc, cStatus.restartCount)), 0);

        return {
          name: pod.metadata.name,
          status: pod.status.phase,
          restarts,
          createdAt: pod.metadata.creationTimestamp,
          logsPerContainer,
          events: podEvents,
        };
      });

      return logsPerPod;
    }

    return cb(null, {
      apply,
      checkConfig,
      checkContext,
      checkCluster,
      checkNamespace,
      rolloutStatus,
      getLastLogsForDeployment,
      getLastLogsForCronjob,
      createClients,
      deploymentRestartsInANamespace,
      removeCronjob,
    });
  }

  return {
    start,
  };
}
