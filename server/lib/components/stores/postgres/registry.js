import SQL from './sql';
import Registry from '../../../domain/Registry';
import Account from '../../../domain/Account';
import { v4 as uuid, } from 'uuid';
import sqb from 'sqb';
import sqbpg from 'sqb-serializer-pg';
sqb.use(sqbpg);

export default function(options) {

  const { Op, raw, } = sqb;
  const sqbOptions = { dialect: 'pg', prettyPrint: true, paramType: sqb.ParamType.DOLLAR, };

  function start({ config, logger, db, }, cb) {

    async function getRegistry(id) {
      logger.debug(`Getting registry by id: ${id}`);
      const result = await db.query(SQL.SELECT_REGISTRY_BY_ID, [id,]);
      logger.debug(`Found ${result.rowCount} registries with id: ${id}`);
      return result.rowCount ? toRegistry(result.rows[0]) : undefined;
    }

    async function findRegistry({ name, }) {
      logger.debug(`Finding registry by name: ${name}`);

      const registry = await db.query(SQL.SELECT_REGISTRY_BY_NAME, [
        name,
      ]);

      logger.debug(`Found ${registry.rowCount} registries with name: ${name}`);

      if (registry.rowCount === 0) return;

      return toRegistry(registry.rows[0]);
    }

    async function saveRegistry(data, meta) {
      logger.debug(`Saving registry: ${data.name}`);

      const result = await db.query(SQL.SAVE_REGISTRY, [
        data.name, meta.date, meta.account.id,
      ]);

      await db.refreshEntityCount();

      const registry = {
        ...data, id: result.rows[0].id, createdOn: meta.date, createdBy: meta.account.id,
      };

      logger.debug(`Saved registry: ${registry.name}/${registry.id}`);

      return registry;
    }

    async function listRegistries(limit = 50, offset = 0) {

      logger.debug(`Listing up to ${limit} registries starting from offset: ${offset}`);

      return db.withTransaction(async connection => {
        return Promise.all([
          connection.query(SQL.LIST_REGISTRIES, [ limit, offset, ]),
          connection.query(SQL.COUNT_ACTIVE_ENTITIES, [ 'registry', ]),
        ]).then(([registryResult, countResult,]) => {
          const items = registryResult.rows.map(row => toRegistry(row));
          const count = parseInt(countResult.rows[0].count, 10);
          logger.debug(`Returning ${items.length} of ${count} registries`);
          return { limit, offset, count, items, };
        });
      });
    }

    async function findRegistries(criteria = {}, limit = 50, offset = 0) {

      logger.debug(`Finding up to ${limit} registries matching criteria: ${criteria} starting from offset: ${offset}`);

      const bindVariables = {};

      const findRegistriesBuilder = sqb
        .select('r.id', 'r.name', 'r.created_on', 'cb.id created_by_id', 'cb.display_name created_by_display_name')
        .from('active_registry__vw r', 'account cb')
        .where(Op.eq('r.created_by', raw('cb.id')))
        .orderBy('r.name asc')
        .limit(limit)
        .offset(offset);

      const countRegistriesBuilder = sqb
        .select(raw('count(*) count'))
        .from('active_registry__vw r');

      if (criteria.hasOwnProperty('ids')) {
        buildWhereClause('r.id', criteria.ids, bindVariables, findRegistriesBuilder, countRegistriesBuilder);
      }

      if (criteria.hasOwnProperty('name')) {
        buildWhereClause('r.name', criteria.name, bindVariables, findRegistriesBuilder, countRegistriesBuilder);
      }

      const findRegistriesStatement = findRegistriesBuilder.generate(sqbOptions, bindVariables);
      const countRegistriesStatement = countRegistriesBuilder.generate(sqbOptions, bindVariables);

      return db.withTransaction(async connection => {
        return Promise.all([
          connection.query(findRegistriesStatement.sql, findRegistriesStatement.values),
          connection.query(countRegistriesStatement.sql, countRegistriesStatement.values),
        ]).then(([registryResult, countResult,]) => {
          const items = registryResult.rows.map(row => toRegistry(row));
          const count = parseInt(countResult.rows[0].count, 10);
          logger.debug(`Returning ${items.length} of ${count} registries`);
          return { limit, offset, count, items, };
        });
      });
    }

    function buildWhereClause(column, values, bindVariables, listBuilder, countBuilder) {
      const clauseVariables = [].concat(values).reduce((clauseVariables, value, index) => {
        return Object.assign(clauseVariables, { [uuid()]: value, });
      }, {});

      const placeholders = Object.keys(clauseVariables).map(key => new RegExp(key));

      listBuilder.where(Op.in(column, placeholders));
      countBuilder.where(Op.in(column, placeholders));

      Object.assign(bindVariables, clauseVariables);
    }

    async function deleteRegistry(id, meta) {
      logger.debug(`Deleting registry id: ${id}`);
      await db.query(SQL.DELETE_REGISTRY, [
        id, meta.date, meta.account.id,
      ]);
      await db.query(SQL.REFRESH_ENTITY_COUNT);
      logger.debug(`Deleted registry id: ${id}`);
    }

    function toRegistry(row) {
      return new Registry({
        id: row.id,
        name: row.name,
        createdOn: row.created_on,
        createdBy: new Account({
          id: row.created_by_id,
          displayName: row.created_by_display_name,
        }),
      });
    }

    return cb(null, {
      getRegistry,
      findRegistry,
      findRegistries,
      listRegistries,
      saveRegistry,
      deleteRegistry,
    });
  }

  return {
    start,
  };
}
