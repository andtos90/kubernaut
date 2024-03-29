import SQL from './sql';
import Cluster from '../../domain/Cluster';
import Account from '../../domain/Account';
import { v4 as uuid } from 'uuid';
import sqb from 'sqb';

export default function(options) {

  const { Op, raw } = sqb;

  function start({ config, logger, db }, cb) {

    async function saveCluster(data, meta) {
      logger.debug(`Saving cluster: ${data.name}`);
      const newClusterId = uuid();
      const builder = sqb
        .insert('cluster', {
          id: newClusterId,
          name: data.name,
          config: data.config,
          color: data.color,
          created_by: meta.account.id,
          created_on: meta.date,
          priority: data.priority,
          context: data.context,
        });

      await db.query(db.serialize(builder, {}).sql);

      const cluster = await getCluster(newClusterId);

      logger.debug(`Saved cluster: ${cluster.name}/${cluster.id}`);

      return cluster;
    }

    async function getCluster(id) {
      logger.debug(`Getting cluster by id: ${id}`);
      const builder = sqb
        .select('c.id', 'c.name', 'c.config', 'c.context', 'c.created_on', 'c.color', 'cb.id created_by_id', 'cb.display_name created_by_display_name', 'c.priority')
        .from('active_cluster__vw c', 'account cb')
        .where(Op.eq('c.created_by', raw('cb.id')))
        .where(Op.eq('c.id', id));

      const result = await db.query(db.serialize(builder, {}).sql);

      logger.debug(`Found ${result.rowCount} clusters with id: ${id}`);
      return result.rowCount ? toCluster(result.rows[0]) : undefined;
    }

    async function findCluster(criteria) {
      const list = await findClusters(criteria, 1, 0);
      if (list.count > 1) throw new Error(`Expected 0 or 1 clusters but found ${list.count}}`);
      return list.count === 1 ? list.items[0] : undefined;
    }

    async function findClusters(criteria = {}, limit = 50, offset = 0) {

      logger.debug(`Finding up to ${limit} clusters matching criteria: ${JSON.stringify(criteria)} starting from offset: ${offset}`);

      const bindVariables = {};

      const findClustersBuilder = sqb
        .select('c.id', 'c.name', 'c.config', 'c.context', 'c.created_on', 'c.color', 'cb.id created_by_id', 'cb.display_name created_by_display_name', 'c.priority')
        .from(criteria.deleted ? 'cluster c' : 'active_cluster__vw c', 'account cb')
        .where(Op.eq('c.created_by', raw('cb.id')))
        .orderBy('c.priority asc', 'c.name asc')
        .limit(limit)
        .offset(offset);

      const countClustersBuilder = sqb
        .select(raw('count(*) count'))
        .from(criteria.deleted ? 'cluster c' : 'active_cluster__vw c');

      if (criteria.hasOwnProperty('name')) {
        db.buildWhereClause('c.name', criteria.name, bindVariables, findClustersBuilder, countClustersBuilder);
      }

      if (criteria.deleted) {
        [findClustersBuilder, countClustersBuilder].forEach(builder => builder.where(Op.not('c.deleted_by', null)));
      }

      const findClustersStatement = db.serialize(findClustersBuilder, bindVariables);
      const countClustersStatement = db.serialize(countClustersBuilder, bindVariables);

      return db.withTransaction(async connection => {
        return Promise.all([
          connection.query(findClustersStatement.sql, findClustersStatement.values),
          connection.query(countClustersStatement.sql, countClustersStatement.values),
        ]).then(([clusterResult, countResult]) => {
          const items = clusterResult.rows.map(row => toCluster(row));
          const count = parseInt(countResult.rows[0].count, 10);
          logger.debug(`Returning ${items.length} of ${count} clusters`);
          return { limit, offset, count, items };
        });
      });
    }

    async function deleteCluster(id, meta) {
      logger.debug(`Deleting cluster id: ${id}`);
      await db.query(SQL.DELETE_CLUSTER, [
        id, meta.date, meta.account.id,
      ]);
      logger.debug(`Deleted cluster id: ${id}`);
    }

    function restoreCluster(id) {
      logger.debug(`Restoring cluster with id ${id}`);
      const builder = sqb
        .update('cluster', {
          deleted_by: null,
          deleted_on: null,
        })
        .where(Op.eq('id', id));

      return db.query(db.serialize(builder, {}).sql);
    }

    function updateCluster(id, values) {
      logger.debug(`Updating cluster with id ${id}`);

      const builder = sqb
        .update('cluster', values)
        .where(Op.eq('id', id));

      return db.query(db.serialize(builder, {}).sql);
    }

    function toCluster(row) {
      return new Cluster({
        id: row.id,
        name: row.name,
        config: row.config,
        context: row.context,
        createdOn: row.created_on,
        color: row.color,
        createdBy: new Account({
          id: row.created_by_id,
          displayName: row.created_by_display_name,
        }),
        priority: row.priority,
      });
    }

    return cb(null, {
      getCluster,
      findCluster,
      findClusters,
      saveCluster,
      deleteCluster,
      restoreCluster,
      updateCluster,
    });
  }

  return {
    start,
  };
}
