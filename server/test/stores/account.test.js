import createSystem from '../test-system';
import postgres from '../../lib/components/stores/postgres';
import { makeIdentity, makeAccount, makeMeta, } from '../factories';

describe('Account Store', () => {

  const suites = [
    {
      name: 'Memory',
      system: createSystem()
        .remove('server'),
    },
    {
      name: 'Postgres',
      system: createSystem()
        .set('config.overrides', {
          postgres: {
            tenant: {
              user: 'account_test',
              password: 'password',
            },
          },
        })
        .remove('server')
        .remove('store.account')
        .remove('store.deployment')
        .remove('store.account')
        .include(postgres),
    },
  ];

  suites.forEach(suite => {

    describe(`${suite.name} Store`, () => {

      let system = { stop: cb => cb(), };
      let store = { nuke: () => new Promise(cb => cb()), };

      beforeAll(cb => {
        system = suite.system.start((err, components) => {
          if (err) return cb(err);
          store = components.store;
          cb();
        });
      });

      beforeEach(cb => {
        store.nuke().then(cb).catch(cb);
      });

      afterAll(cb => {
        store.nuke().then(() => {
          system.stop(cb);
        }).catch(cb);
      });

      describe('Save Account', () => {

        it('should create an account', async () => {
          const data = makeAccount();
          const meta = makeMeta();
          const account = await saveAccount(data, meta);

          expect(account).toBeDefined();
          expect(account.id).toBeDefined();
          expect(account.createdOn).toBe(meta.date);
          expect(account.createdBy).toBe(meta.user);
        });

        it('should permit duplicate display names', async () => {
          const data1 = makeAccount({ displayName: 'John', });
          await saveAccount(data1);

          const data2 = makeAccount({ displayName: 'John', });
          await saveAccount(data2);
        });

      });

      describe('Get Account', () => {

        it('should retrieve account by id', async () => {
          const data = makeAccount({ displayName: 'Foo Bar', });
          const meta = makeMeta();
          const saved = await saveAccount(data, meta);
          const account = await getAccount(saved.id);

          expect(account).toBeDefined();
          expect(account.id).toBe(saved.id);
          expect(account.displayName).toBe('Foo Bar');
          expect(account.createdOn.toISOString()).toBe(meta.date.toISOString());
          expect(account.createdBy).toBe(meta.user);
        });

        it('should return undefined when account not found', async () => {
          const account = await getAccount('missing');
          expect(account).toBe(undefined);
        });

        it('should return undefined when account deleted', async () => {
          const saved = await saveAccount();
          await deleteAccount(saved.id);

          const account = await getAccount(saved.id);
          expect(account).toBe(undefined);
        });
      });

      describe('Find Account', () => {

        it('should find an account by identity, provider and type', async () => {
          const saved = await saveAccount();
          const data = makeIdentity({ name: 'foo', provider: 'bar', type: 'baz', });
          await saveIdentity(saved.id, data);

          const account = await findAccount({ name: 'foo', provider: 'bar', type: 'baz', });
          expect(account).toBeDefined();
          expect(account.id).toBe(saved.id);
        });

        it('should return undefined when identity name not found', async () => {
          const saved = await saveAccount();
          const data = makeIdentity({ name: 'foo', provider: 'bar', type: 'baz', });
          await saveIdentity(saved.id, data);

          const account = await findAccount({ name: 'missing', provider: 'bar', type: 'baz', });
          expect(account).toBe(undefined);
        });

        it('should return undefined when provider not found', async () => {
          const saved = await saveAccount();
          const data = makeIdentity({ name: 'foo', provider: 'bar', type: 'baz', });
          await saveIdentity(saved.id, data);

          const account = await findAccount({ name: 'foo', provider: 'missing', type: 'baz',});
          expect(account).toBe(undefined);
        });

        it('should return undefined when type not found', async () => {
          const saved = await saveAccount();
          const data = makeIdentity({ name: 'foo', provider: 'bar', type: 'baz', });
          await saveIdentity(saved.id, data);

          const account = await findAccount({ name: 'foo', provider: 'bar', type: 'missing',});
          expect(account).toBe(undefined);
        });

        it('should return undefined when account deleted', async () => {
          const saved = await saveAccount();
          const data = makeIdentity({ name: 'foo', provider: 'bar', type: 'baz', });
          await saveIdentity(saved.id, data);
          await deleteAccount(saved.id);

          const account = await findAccount({ identity: 'foo', provider: 'bar', type: 'baz', });
          expect(account).toBe(undefined);
        });

        it('should return undefined when identity and provider were deleted', async () => {
          const savedAccount = await saveAccount();
          const data = makeIdentity({ name: 'foo', provider: 'bar', type: 'baz', });
          const identity = await saveIdentity(savedAccount.id, data);
          await deleteIdentity(identity.id);

          const account = await findAccount({ identity: 'foo', provider: 'bar', type: 'baz', });
          expect(account).toBe(undefined);
        });

      });

      describe('List Accounts', () => {

        it('should list accounts, ordered by display name desc', async () => {

          const accounts = [
            {
              data: makeAccount({ displayName: 'a', }),
              meta: makeMeta({ user: 'first', date: new Date('2015-07-01T10:11:12.000Z'), }),
            },
            {
              data: makeAccount({ displayName: 'c', }),
              meta: makeMeta({ user: 'third', date: new Date('2012-07-01T10:11:12.000Z'), }),
            },
            {
              data: makeAccount({ displayName: 'b', }),
              meta: makeMeta({ user: 'second', date: new Date('2014-07-01T10:11:12.000Z'), }),
            },
          ];

          await Promise.all(accounts.map(async account => {
            await saveAccount(account.data, account.meta);
          }));

          const results = await listAccounts();
          const users = ['first', 'second', 'third',];
          expect(results.length).toBe(users.length);
          users.forEach((user, index) => {
            expect(results[index].createdBy).toBe(user);
          });

        });

        describe('Pagination', () => {

          beforeEach(async () => {
            const accounts = [];
            for (var i = 0; i < 51; i++) {
              accounts.push({
                data: makeAccount(),
                meta: makeMeta(),
              });
            }

            await Promise.all(accounts.map(async account => {
              await saveAccount(account.data, account.meta);
            }));
          });

          it('should limit accounts to 50 by default', async () => {
            const results = await listAccounts();
            expect(results.length).toBe(50);
          });

          it('should limit accounts to the specified number', async () => {
            const results = await listAccounts(10, 0);
            expect(results.length).toBe(10);
          });

          it('should page results', async () => {
            const results = await listAccounts(50, 10);
            expect(results.length).toBe(41);
          });
        });
      });

      describe('Save Identity', () => {

        it('should create an identity', async () => {
          const account = await saveAccount();
          const identity = await saveIdentity(account.id, makeIdentity(), makeMeta());
          expect(identity).toBeDefined();
        });

        it('should prevent duplicate active identities for an account', async () => {
          const account = await saveAccount();
          const data = makeIdentity();

          await saveIdentity(account.id, data);
          await expect(
            saveIdentity(account.id, data)
          ).rejects.toHaveProperty('code', '23505');
        });

        it('should prevent duplicate active identities for different accounts', async () => {
          const account1 = await saveAccount();
          const account2 = await saveAccount();
          const data1 = makeIdentity({ name: 'duplicate-name', provider: 'duplicate-provider', type: 'duplicate-type', });
          const data2 = makeIdentity({ name: 'duplicate-name', provider: 'duplicate-provider', type: 'duplicate-type', });

          await saveIdentity(account1.id, data1);
          await expect(
            saveIdentity(account2.id, data2)
          ).rejects.toHaveProperty('code', '23505');
        });

        it('should permit duplicate identity names for different providers', async () => {
          const account = await saveAccount();
          const data1 = makeIdentity({ name: 'duplidate-name', });
          const data2 = makeIdentity({ name: 'duplidate-name', });

          await saveIdentity(account.id, data1);
          await saveIdentity(account.id, data2);
        });

        it('should permit duplicate providers for an account', async () => {
          const account = await saveAccount();
          const data1 = makeIdentity({ provider: 'duplicate-provider', });
          const data2 = makeIdentity({ provider: 'duplicate-provider', });

          await saveIdentity(account.id, data1);
          await saveIdentity(account.id, data2);
        });

        it('should permit duplicate deleted identities', async () => {
          const account = await saveAccount();
          const data = makeIdentity();

          const saved = await saveIdentity(account.id, data);
          await deleteIdentity(saved.id);
          await saveIdentity(account.id, data);
        });

        it('should report an error if account does not exist', async () => {
          const data = makeIdentity();

          await expect(
            saveIdentity('missing', data)
          ).rejects.toHaveProperty('code', '23502');
        });

        it('should report an error if account was deleted', async () => {
          const account = await saveAccount();
          await deleteAccount(account.id);
          const data = makeIdentity();

          await expect(
            saveIdentity(account.id, data)
          ).rejects.toHaveProperty('code', '23502');
        });

      });

      describe('Grant Role', () => {

        it('should grant role to account', async () => {
          const saved = await saveAccount();

          const role = await grantRole(saved.id, 'admin');
          expect(role.id).toBeDefined();

          const account = await getAccount(saved.id);
          expect(account).toBeDefined();
          expect(Object.keys(account.roles)).toEqual(['admin',]);
          expect(account.roles.admin.permissions).toEqual(["role_revoke", "role_grant", "releases_write", "releases_read", "deployments_write", "deployments_read", "client", "accounts_write", "accounts_read",]);
        });

        it('should fail if account does not exist', async () => {
          await expect(
            grantRole('missing', 'admin')
          ).rejects.toHaveProperty('code', '23502');
        });

        it('should fail if role does not exist', async () => {
          const saved = await saveAccount();
          await expect(
            grantRole(saved.id, 'missing')
          ).rejects.toHaveProperty('code', '23502');
        });

        it('should tolerate duplicate roles', async () => {
          const saved = await saveAccount();
          await grantRole(saved.id, 'admin');
          await grantRole(saved.id, 'admin');

          const account = await getAccount(saved.id);
          expect(account).toBeDefined();
          expect(Object.keys(account.roles)).toEqual(['admin',]);
        });
      });


      describe('Revoke Role', () => {

        it('should revoke role from account', async () => {
          const saved = await saveAccount();
          const role = await grantRole(saved.id, 'admin');
          await revokeRole(role.id);

          const account = await getAccount(saved.id);
          expect(account).toBeDefined();
          expect(Object.keys(account.roles)).toEqual([]);
        });

        it('should tolerate missing role', async () => {
          await revokeRole('missing');
        });

        it('should tolerate previously revoked role', async () => {
          const account = await saveAccount();

          const role = await grantRole(account.id, 'admin');
          await revokeRole(role.id);
          await revokeRole(role.id);
        });
      });

      function saveAccount(account = makeAccount(), meta = makeMeta()) {
        return store.saveAccount(account, meta);
      }

      function getAccount(id) {
        return store.getAccount(id);
      }

      function findAccount(criteria) {
        return store.findAccount(criteria);
      }

      function listAccounts(limit, offset) {
          return store.listAccounts(limit, offset);
      }

      function deleteAccount(id, meta = makeMeta()) {
        return store.deleteAccount(id, meta);
      }

      function saveIdentity(accountId, identity, meta = makeMeta()) {
        return store.saveIdentity(accountId, identity, meta);
      }

      function deleteIdentity(id, meta = makeMeta()) {
        return store.deleteIdentity(id, meta);
      }

      function grantRole(id, name, meta = makeMeta()) {
        return store.grantRole(id, name, meta);
      }

      function revokeRole(id, meta = makeMeta()) {
        return store.revokeRole(id, meta);
      }

    });
  });
});
