import createSystem from '../../lib/system';
import Chance from 'chance';
import { makeAccount, makeCluster, makeNamespace, makeDeployment, makeDeploymentLogEntry, makeMeta, makeRootMeta } from '../factories';
import pLimit from 'p-limit';

const limit = pLimit(10);
const chance = new Chance();

process.env.APP_ENV = 'local';

createSystem()
  .remove('server')
  .start(async (err, dependencies) => {
      if (err) throw err;
      const { store, postgres } = dependencies;

      try {
        await store.unlogged();
        await store.nuke();

        const account = await store.saveAccount(makeAccount(), makeRootMeta());
        const cluster = await store.saveCluster(makeCluster(), makeRootMeta());
        const namespace = await store.saveNamespace(makeNamespace({ cluster }), makeRootMeta());

        // Iterate services inside versions, as creating a release locks based on service name
        const tasks = [];
        for (let v = 1; v <= 10; v++) {
          for (let s = 0; s < 10; s++) {
            const name = `service-${chance.word()}-${chance.word()}`;
            const commit = chance.hash().substr(0, 6);
            const data = makeDeployment({
              context: 'test',
              release: {
                service: {
                  name,
                },
                version: `${commit}-${v}`,
              },
            });
            const meta = makeMeta({ account, date: new Date(Date.now() - chance.integer({ min: 0, max: 7 * 24 * 60 * 60 * 1000 })) });

            tasks.push(limit(async () => {
              const release = await store.saveRelease(data.release, meta);
              const deployment = await store.saveDeployment({ ...data, release, namespace }, meta);
              const applyExitCode = chance.integer({ min: 0, max: 3 });
              await store.saveApplyExitCode(deployment.id, applyExitCode);
              if (applyExitCode === 0) await store.saveRolloutStatusExitCode(deployment.id, chance.integer({ min: 0, max: 3 }));
              const logEntries = [];
              for (let l = 0; l < 5; l++) {
                logEntries.push(makeDeploymentLogEntry({ deployment: deployment }));
              }
              for (const logEntry of logEntries) {
                await store.saveDeploymentLogEntry(logEntry);
              }
              console.log(`Inserted ${deployment.release.service.name}/${deployment.release.version}/${deployment.id}`); // eslint-disable-line no-console
            }));
          }
        }
        await Promise.all(tasks);

        await postgres.query('ANALYZE');
      } finally {
        await store.logged();
      }

      process.exit(0);
  });


setInterval(() => {}, Number.MAX_VALUE);

