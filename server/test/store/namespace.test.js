import expect from 'expect';
import { v4 as uuid } from 'uuid';
import createSystem from '../test-system';
import { makeCluster, makeNamespace, makeRootMeta, makeRelease } from '../factories';

describe('Namespace Store', () => {

  let system = { stop: cb => cb() };
  let store = { nuke: () => new Promise(cb => cb()) };

  before(async () => {
    system = createSystem().remove('server');
    ({ store } = await system.start());
  });

  beforeEach(async () => {
    await store.nuke();
  });

  after(async () => {
    await store.nuke();
    await system.stop();
  });

  describe('Save namespace', () => {

    it('should create a namespace', async () => {
      const cluster = await saveCluster();
      const data = await makeNamespace({ cluster });
      const namespace = await saveNamespace(data);
      expect(namespace).toBeDefined();
      expect(namespace.id).toBeDefined();
    });

    it('should prevent duplicate namespaces', async () => {
      const cluster = await saveCluster();
      const data = makeNamespace({
        name: 'same-namespace',
        cluster,
      });

      await saveNamespace(data);
      await expect(
        saveNamespace(data)
      ).rejects.toHaveProperty('code', '23505');
    });

    it('should permit duplicate namespaces in different clusters', async () => {
      const cluster1 = await saveCluster(makeCluster({ name: 'cluster-1' }));
      const cluster2 = await saveCluster(makeCluster({ name: 'cluster-2' }));

      const data1 = makeNamespace({
        name: 'same-namespace',
        cluster: cluster1,
      });
      const data2 = makeNamespace({
        name: 'same-namespace',
        cluster: cluster2,
      });

      await saveNamespace(data1);
      await saveNamespace(data2);
    });
  });

  describe('Update Namespace', () => {
    it('should update a namespace', async () => {
      const firstCluster = await saveCluster();
      const secondCluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster: firstCluster,
        attributes: {
          a: '123',
        }
      }));
      expect(namespace).toBeDefined();
      expect(namespace.id).toBeDefined();
      expect(namespace.cluster.id).toBe(firstCluster.id);
      expect(namespace.attributes).toBeDefined();
      expect(Object.keys(namespace.attributes).length).toBe(1);
      expect(namespace.attributes).toMatchObject({
        a: '123',
      });

      const updatedNamespace = await updateNamespace(namespace.id, {
        cluster: secondCluster.id,
        color: 'aliceblue',
        attributes: {
          a: 'abc',
          b: '123',
        },
      });

      expect(updatedNamespace).toBeDefined();
      expect(updatedNamespace.id).toBe(namespace.id);
      expect(updatedNamespace.cluster.id).toBe(secondCluster.id);
      expect(updatedNamespace.color).toBe('aliceblue');
      expect(updatedNamespace.attributes).toBeDefined();
      expect(updatedNamespace.attributes).toMatchObject({
        a: 'abc',
        b: '123',
      });
    });
  });

  describe('Get Namespace', () => {

    it('should retrieve namespace by id', async () => {
      const cluster = await saveCluster();
      const data = makeNamespace({ cluster });
      const meta = makeRootMeta();
      const saved = await saveNamespace(data, meta);
      const namespace = await getNamespace(saved.id);

      expect(namespace).toBeDefined();
      expect(namespace.id).toBe(saved.id);
      expect(namespace.name).toBe(data.name);
      expect(namespace.cluster.id).toBe(data.cluster.id);
      expect(namespace.createdOn.toISOString()).toBe(meta.date.toISOString());
      expect(namespace.createdBy.id).toBe(meta.account.id);
      expect(namespace.createdBy.displayName).toBe(meta.account.displayName);
      expect(namespace.attributes).toMatchObject({});
    });

    it('should retrieve namespace attributes', async () => {
      const cluster = await saveCluster();
      const attributes = { a: '1', b: '2' };
      const data = makeNamespace({ cluster, attributes });
      const meta = makeRootMeta();
      const saved = await saveNamespace(data, meta);
      const namespace = await getNamespace(saved.id);

      expect(namespace).toBeDefined();
      expect(namespace.id).toBe(saved.id);
      expect(namespace.attributes).toMatchObject(attributes);
    });

    it('should return undefined when namespace not found', async () => {
      const namespace = await getNamespace(uuid());
      expect(namespace).toBe(undefined);
    });
  });

  describe('Find Namespace', () => {

    it('should find a namespace by name and cluster', async () => {
      const cluster = await saveCluster();
      const data = makeNamespace({ cluster });
      const saved = await saveNamespace(data);
      const namespace = await findNamespace({ name: data.name, cluster: data.cluster.name });

      expect(namespace).toBeDefined();
      expect(namespace.id).toBe(saved.id);
    });

    it('should return undefined when namespace not found in cluster', async () => {
      const cluster = await saveCluster();
      const data = makeNamespace({ name: 'missing', cluster });
      await saveNamespace(data);

      const namespace = await findNamespace({ name: 'missing', cluster: 'wrong-cluster' });
      expect(namespace).toBe(undefined);
    });
  });

  describe('Find Namespaces', () => {

    it('should list namespaces, ordered by name asc, cluster name asc', async () => {

      const clusterA = await saveCluster(makeCluster({ name: 'A' }));
      const clusterB = await saveCluster(makeCluster({ name: 'B' }));

      const namespaces = [
        {
          data: makeNamespace({
            name: 'a',
            cluster: clusterA,
          }),
          meta: makeRootMeta({ date: new Date('2014-07-01T10:11:12.000Z') }),
        },
        {
          data: makeNamespace({
            name: 'c',
            cluster: clusterA,
          }),
          meta: makeRootMeta({ date: new Date('2015-07-01T10:11:12.000Z') }),
        },
        {
          data: makeNamespace({
            name: 'b',
            cluster: clusterA,
          }),
          meta: makeRootMeta({ date: new Date('2013-07-01T10:11:12.000Z') }),
        },
        {
          data: makeNamespace({
            name: 'a',
            cluster: clusterB,
          }),
          meta: makeRootMeta({ date: new Date('2012-07-01T10:11:12.000Z') }),
        },
      ];

      await Promise.all(namespaces.map(namespace => {
        return saveNamespace(namespace.data, namespace.meta);
      }));

      const results = await findNamespaces();
      expect(results.items.map(n => `${n.name}-${n.cluster.name}`)).toEqual(['a-A', 'a-B', 'b-A', 'c-A']);
      expect(results.count).toBe(4);
      expect(results.limit).toBe(50);
      expect(results.offset).toBe(0);
    });

    it('should exclude inactive namespaces', async () => {
      const results1 = await findNamespaces();
      expect(results1.count).toBe(0);

      const cluster = await saveCluster();
      const saved = await saveNamespace(makeNamespace({ cluster }));
      const results2 = await findNamespaces();
      expect(results2.count).toBe(1);

      await deleteNamespace(saved.id);
      const results3 = await findNamespaces();
      expect(results3.count).toBe(0);
    });

    it('should filter namespaces by ids', async () => {
      const cluster = await saveCluster();
      const namespace1 = makeNamespace({ name: 'ns1', cluster });
      const namespace2 = makeNamespace({ name: 'ns2', cluster });

      const saved1 = await saveNamespace(namespace1);
      const saved2 = await saveNamespace(namespace2);

      const results1 = await findNamespaces({ ids: [ saved1.id ] });
      expect(results1.count).toBe(1);
      expect(results1.items[0].id).toBe(saved1.id);

      const results2 = await findNamespaces({ ids: [ saved2.id ] });
      expect(results2.count).toBe(1);
      expect(results2.items[0].id).toBe(saved2.id);

      const results3 = await findNamespaces({ ids: [ saved1.id, saved2.id ] });
      expect(results3.count).toBe(2);
      expect(results3.items[0].id).toBe(saved1.id);
      expect(results3.items[1].id).toBe(saved2.id);
    });

    it('should filter namespaces by criteria', async () => {
      const cluster1 = await saveCluster();
      const cluster2 = await saveCluster();
      const namespace1 = makeNamespace({ name: 'ns1', cluster: cluster1 });
      const namespace2 = makeNamespace({ name: 'ns2', cluster: cluster1 });
      const namespace3 = makeNamespace({ name: 'ns1', cluster: cluster2 });

      const saved1 = await saveNamespace(namespace1);
      const saved2 = await saveNamespace(namespace2);
      const saved3 = await saveNamespace(namespace3);

      const results1 = await findNamespaces({ name: namespace1.name, cluster: namespace1.cluster.name });
      expect(results1.count).toBe(1);
      expect(results1.items[0].id).toBe(saved1.id);

      const results2 = await findNamespaces({ name: namespace2.name, cluster: namespace2.cluster.name });
      expect(results2.count).toBe(1);
      expect(results2.items[0].id).toBe(saved2.id);

      const results3 = await findNamespaces({ name: namespace3.name, cluster: namespace3.cluster.name });
      expect(results3.count).toBe(1);
      expect(results3.items[0].id).toBe(saved3.id);
    });

    describe('Pagination', () => {

      beforeEach(async () => {
        const cluster = await saveCluster();

        const namespaces = [];
        for (var i = 0; i < 51; i++) {
          namespaces.push({
            data: makeNamespace({
              name: `namespace-${i}`,
              cluster,
            }),
          });
        }

        await Promise.all(namespaces.map(async namespace => {
          return saveNamespace(namespace.data);
        }));
      });

      it('should limit namespaces to 50 by default', async () => {
        const results = await findNamespaces();
        expect(results.items.length).toBe(50);
        expect(results.count).toBe(51);
        expect(results.limit).toBe(50);
        expect(results.offset).toBe(0);
      });

      it('should limit namespaces to the specified number', async () => {
        const results = await findNamespaces({}, 10, 0);
        expect(results.items.length).toBe(10);
        expect(results.count).toBe(51);
        expect(results.limit).toBe(10);
        expect(results.offset).toBe(0);
      });

      it('should page namespaces list', async () => {
        const results = await findNamespaces({}, 50, 10);
        expect(results.items.length).toBe(41);
        expect(results.count).toBe(51);
        expect(results.limit).toBe(50);
        expect(results.offset).toBe(10);
      });
    });
  });

  describe('Delete Namespace', () => {

    it('should soft delete namespace', async () => {
      const cluster = await saveCluster();
      const data = makeNamespace({ cluster });
      const saved = await saveNamespace(data);
      await deleteNamespace(saved.id);

      const namespace = await getNamespace(saved.id);
      expect(namespace).toBe(undefined);
    });
  });

  describe('Restricting service deployment to namespace', () => {
    it('should enable a service to deploy to a namespace', async () => {
      const cluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster,
      }));
      const release = await saveRelease();

      await store.enableServiceForNamespace(namespace, release.service, makeRootMeta());
    });

    it('should not fail enabling a service already permitted', async () => {
      const cluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster,
      }));
      const release = await saveRelease();

      await store.enableServiceForNamespace(namespace, release.service, makeRootMeta());
      await store.enableServiceForNamespace(namespace, release.service, makeRootMeta());
    });

    it('should prevent a service not allowed to deploy to a namesace', async () => {
      const cluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster,
      }));
      const release = await saveRelease();

      const canDeploy = await store.checkServiceCanDeploytoNamespace(namespace, release.service);
      expect(canDeploy).toBe(false);
    });

    it('should allow a service that can deploy to a namespace', async () => {
      const cluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster,
      }));
      const release = await saveRelease();
      await store.enableServiceForNamespace(namespace, release.service, makeRootMeta());

      const canDeploy = await store.checkServiceCanDeploytoNamespace(namespace, release.service);
      expect(canDeploy).toBe(true);
    });

    it('should disable a service previously allowed', async () => {
      const cluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster,
      }));
      const release = await saveRelease();
      const release2 = await saveRelease();
      await store.enableServiceForNamespace(namespace, release.service, makeRootMeta());
      await store.enableServiceForNamespace(namespace, release2.service, makeRootMeta());

      let canDeploy = await store.checkServiceCanDeploytoNamespace(namespace, release.service);
      expect(canDeploy).toBe(true);

      await store.disableServiceForNamespace(namespace, release.service, makeRootMeta());

      canDeploy = await store.checkServiceCanDeploytoNamespace(namespace, release.service);
      expect(canDeploy).toBe(false);

      const otherServiceCanDeploy = await store.checkServiceCanDeploytoNamespace(namespace, release2.service);
      expect(otherServiceCanDeploy).toBe(true);
    });
  });

  describe('Listing namespaces a service is allowed to deploy to', () => {
    it('should list only the namespaces a service can deploy to', async () => {
      const cluster = await saveCluster();
      const namespace = await saveNamespace(await makeNamespace({
        cluster,
      }));
      await saveNamespace(await makeNamespace({
        cluster,
      }));
      const release = await saveRelease();

      await store.enableServiceForNamespace(namespace, release.service, makeRootMeta());

      const namespaces = await store.namespacesForService({
        service: release.service,
      });
      expect(namespaces).toBeDefined();
      expect(namespaces.count).toBe(1);
      expect(namespaces.items[0].id).toBe(namespace.id);
    });
  });

  function saveCluster(cluster = makeCluster(), meta = makeRootMeta()) {
    return store.saveCluster(cluster, meta);
  }

  function saveNamespace(namespace = makeNamespace(), meta = makeRootMeta()) {
    return store.saveNamespace(namespace, meta);
  }

  function saveRelease(release = makeRelease(), meta = makeRootMeta()) {
    return store.saveRelease(release, meta);
  }

  function getNamespace(id) {
    return store.getNamespace(id);
  }

  function findNamespace(criteria) {
    return store.findNamespace(criteria);
  }

  function findNamespaces(criteria, page, limit) {
    return store.findNamespaces(criteria, page, limit);
  }

  function deleteNamespace(id, meta = makeRootMeta()) {
    return store.deleteNamespace(id, meta);
  }

  function updateNamespace(id, data) {
    return store.updateNamespace(id, data);
  }
});
