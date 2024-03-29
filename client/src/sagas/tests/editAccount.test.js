import { call, put, select } from 'redux-saga/effects';
import { startSubmit, stopSubmit, reset } from 'redux-form';
import { push } from 'connected-react-router';

import {
  fetchAccountInfoSaga,
  fetchNamespacesSaga,
  fetchRegistriesSaga,
  fetchTeamsSaga,
  updateRolesForNamespaceSaga,
  addNewNamespaceSaga,
  deleteRolesForNamespaceSaga,
  updateRolesForRegistrySaga,
  addNewRegistrySaga,
  deleteRolesForRegistrySaga,
  updateRolesForTeamSaga,
  addNewTeamSaga,
  deleteRolesForTeamSaga,
  checkPermissionSaga,
  fetchSystemRolesSaga,
  updateSystemRoleSaga,
  updateGlobalRoleSaga,
  deleteAccountSaga,
} from '../editAccount';

import {
  fetchAccountInfo,
  updateRolesForNamespace,
  addNewNamespace,
  deleteRolesForNamespace,
  deleteRolesForRegistry,
  deleteRolesForTeam,
  updateRolesForRegistry,
  updateRolesForTeam,
  addNewRegistry,
  addNewTeam,
  selectAccount,
  updateSystemRole,
  updateGlobalRole,
  FETCH_ACCOUNT_REQUEST,
  FETCH_ACCOUNT_SUCCESS,
  FETCH_ACCOUNT_ERROR,
  FETCH_SYSTEM_ROLES_REQUEST,
  FETCH_SYSTEM_ROLES_SUCCESS,
  FETCH_SYSTEM_ROLES_ERROR,
  FETCH_NAMESPACES_REQUEST,
  FETCH_NAMESPACES_SUCCESS,
  FETCH_NAMESPACES_ERROR,
  FETCH_REGISTRIES_REQUEST,
  FETCH_REGISTRIES_SUCCESS,
  FETCH_REGISTRIES_ERROR,
  FETCH_TEAMS_REQUEST,
  FETCH_TEAMS_SUCCESS,
  FETCH_TEAMS_ERROR,
  UPDATE_ROLE_FOR_NAMESPACE_SUCCESS,
  UPDATE_ROLE_FOR_REGISTRY_SUCCESS,
  UPDATE_ROLE_FOR_SYSTEM_SUCCESS,
  UPDATE_ROLE_FOR_TEAM_SUCCESS,
  setCanEdit,
  setCanDelete,
  setCanManageTeam,
  deleteAccount,
  closeDeleteModal,
} from '../../modules/editAccount';

import {
  getAccountById,
  getAccountRolesForNamesaces,
  getAccountRolesForRegistries,
  addRoleForNamespace,
  removeRoleForNamespace,
  addRoleForRegistry,
  removeRoleForRegistry,
  hasPermission,
  getSystemRoles,
  addRoleForSystem,
  removeRoleForSystem,
  addGlobalRole,
  removeGlobalRole,
  getCanManageAnyTeam,
  getAccountRolesForTeams,
  addRoleForTeam,
  removeRoleForTeam,
  deleteAccount as deleteAccountRequest,
} from '../../lib/api';

const quietOptions = { quiet: true };

describe('editAccount sagas', () => {
  describe('fetchAccountInfoSaga', () => {
    it('should fetch and succeed at getting account data', () => {
      const data = { a: 1 };
      const accountId = '123';
      const match = { params: { accountId } };
      const gen = fetchAccountInfoSaga(fetchAccountInfo({ match }));
      expect(gen.next().value).toMatchObject(put(FETCH_ACCOUNT_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountById, accountId));
      expect(gen.next(data).value).toMatchObject(put(FETCH_ACCOUNT_SUCCESS({ data })));
      expect(gen.next().done).toBe(true);
    });

    it('should handle errors', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const error = new Error('ouch');
      const gen = fetchAccountInfoSaga(fetchAccountInfo({ ...quietOptions, match }));
      expect(gen.next().value).toMatchObject(put(FETCH_ACCOUNT_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountById, accountId));
      expect(gen.throw(error).value).toMatchObject(put(FETCH_ACCOUNT_ERROR({ error: error.message })));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('fetchSystemRolesSaga', () => {
    it('should fetch system roles', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const rolesData = { limit: 50, offset: 0, count: 3, items: [1, 2, 3] };

      const gen = fetchSystemRolesSaga(fetchAccountInfo({ match }));
      expect(gen.next().value).toMatchObject(put(FETCH_SYSTEM_ROLES_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getSystemRoles, accountId));
      expect(gen.next(rolesData).value).toMatchObject(put(FETCH_SYSTEM_ROLES_SUCCESS({ rolesData } )));
      expect(gen.next().done).toBe(true);
    });

    it('should tolerate errors fetching system roles', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const error = new Error('ouch');
      const gen = fetchSystemRolesSaga(fetchAccountInfo({ ...quietOptions, match }));
      expect(gen.next().value).toMatchObject(put(FETCH_SYSTEM_ROLES_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getSystemRoles, accountId));
      expect(gen.throw(error).value).toMatchObject(put(FETCH_SYSTEM_ROLES_ERROR({ error: error.message })));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('fetchNamespacesSaga', () => {
    it('should fetch namespaces', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const namespacesData = { limit: 50, offset: 0, count: 3, items: [1, 2, 3] };

      const gen = fetchNamespacesSaga(fetchAccountInfo({ match }));
      expect(gen.next().value).toMatchObject(put(FETCH_NAMESPACES_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountRolesForNamesaces, accountId));
      expect(gen.next(namespacesData).value).toMatchObject(put(FETCH_NAMESPACES_SUCCESS({ rolesData: namespacesData } )));
      expect(gen.next().done).toBe(true);
    });

    it('should tolerate errors fetching namespaces', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const error = new Error('ouch');
      const gen = fetchNamespacesSaga(fetchAccountInfo({ ...quietOptions, match }));
      expect(gen.next().value).toMatchObject(put(FETCH_NAMESPACES_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountRolesForNamesaces, accountId));
      expect(gen.throw(error).value).toMatchObject(put(FETCH_NAMESPACES_ERROR({ error: error.message })));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('fetchRegistriesSaga', () => {
    it('should fetch registries', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const registriesData = { limit: 50, offset: 0, count: 3, items: [1, 2, 3] };

      const gen = fetchRegistriesSaga(fetchAccountInfo({ match }));
      expect(gen.next().value).toMatchObject(put(FETCH_REGISTRIES_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountRolesForRegistries, accountId));
      expect(gen.next(registriesData).value).toMatchObject(put(FETCH_REGISTRIES_SUCCESS({ rolesData: registriesData } )));
      expect(gen.next().done).toBe(true);
    });

    it('should tolerate errors fetching registries', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const error = new Error('ouch');
      const gen = fetchRegistriesSaga(fetchAccountInfo({ ...quietOptions, match }));
      expect(gen.next().value).toMatchObject(put(FETCH_REGISTRIES_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountRolesForRegistries, accountId));
      expect(gen.throw(error).value).toMatchObject(put(FETCH_REGISTRIES_ERROR({ error: error.message })));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('fetchTeamsSaga', () => {
    it('should fetch registries', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const teamsData = { limit: 50, offset: 0, count: 3, items: [1, 2, 3] };

      const gen = fetchTeamsSaga(fetchAccountInfo({ match }));
      expect(gen.next().value).toMatchObject(put(FETCH_TEAMS_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountRolesForTeams, accountId));
      expect(gen.next(teamsData).value).toMatchObject(put(FETCH_TEAMS_SUCCESS({ rolesData: teamsData } )));
      expect(gen.next().done).toBe(true);
    });

    it('should tolerate errors fetching registries', () => {
      const accountId = '123';
      const match = { params: { accountId } };
      const error = new Error('ouch');
      const gen = fetchTeamsSaga(fetchAccountInfo({ ...quietOptions, match }));
      expect(gen.next().value).toMatchObject(put(FETCH_TEAMS_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getAccountRolesForTeams, accountId));
      expect(gen.throw(error).value).toMatchObject(put(FETCH_TEAMS_ERROR({ error: error.message })));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('updateRolesForNamespaceSaga', () => {
    it('should add a role to a namespace', () => {
      const namespaceId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const accountData = { a: 1 };
      const gen = updateRolesForNamespaceSaga(updateRolesForNamespace({
        namespaceId,
        accountId,
        role,
        newValue: true,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountNamespacesRoles')));
      expect(gen.next().value).toMatchObject(call(addRoleForNamespace, accountId, namespaceId, role, { quiet: true}));
      expect(gen.next(accountData).value).toMatchObject(put(UPDATE_ROLE_FOR_NAMESPACE_SUCCESS({ data: accountData })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountNamespacesRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('should remove a role to a namespace', () => {
      const namespaceId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const accountData = { a: 1 };
      const gen = updateRolesForNamespaceSaga(updateRolesForNamespace({
        namespaceId,
        accountId,
        role,
        newValue: false,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountNamespacesRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForNamespace, accountId, namespaceId, role, { quiet: true}));
      expect(gen.next(accountData).value).toMatchObject(put(UPDATE_ROLE_FOR_NAMESPACE_SUCCESS({ data: accountData })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountNamespacesRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('should handle an error', () => {
      const namespaceId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const gen = updateRolesForNamespaceSaga(updateRolesForNamespace({
        namespaceId,
        accountId,
        role,
        newValue: false,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountNamespacesRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForNamespace, accountId, namespaceId, role, { quiet: true}));
      expect(gen.throw(new Error('ouch')).value).toMatchObject(put(stopSubmit('accountNamespacesRoles')));
      expect(gen.next().value).toMatchObject(put(reset('accountNamespacesRoles')));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('updateRolesForRegistrySaga', () => {
    it('should add a role to a registry', () => {
      const registryId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const accountData = { a: 1 };
      const gen = updateRolesForRegistrySaga(updateRolesForRegistry({
        registryId,
        accountId,
        role,
        newValue: true,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountRegistriesRoles')));
      expect(gen.next().value).toMatchObject(call(addRoleForRegistry, accountId, registryId, role, { quiet: true}));
      expect(gen.next(accountData).value).toMatchObject(put(UPDATE_ROLE_FOR_REGISTRY_SUCCESS({ data: accountData })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountRegistriesRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('should remove a role to a registry', () => {
      const registryId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const accountData = { a: 1 };
      const gen = updateRolesForRegistrySaga(updateRolesForRegistry({
        registryId,
        accountId,
        role,
        newValue: false,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountRegistriesRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForRegistry, accountId, registryId, role, { quiet: true}));
      expect(gen.next(accountData).value).toMatchObject(put(UPDATE_ROLE_FOR_REGISTRY_SUCCESS({ data: accountData })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountRegistriesRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('should handle an error', () => {
      const registryId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const gen = updateRolesForRegistrySaga(updateRolesForRegistry({
        registryId,
        accountId,
        role,
        newValue: false,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountRegistriesRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForRegistry, accountId, registryId, role, { quiet: true}));
      expect(gen.throw(new Error('ouch')).value).toMatchObject(put(stopSubmit('accountRegistriesRoles')));
      expect(gen.next().value).toMatchObject(put(reset('accountRegistriesRoles')));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('updateRolesForTeamSaga', () => {
    it('should add a role to a team', () => {
      const teamId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const accountData = { a: 1 };
      const gen = updateRolesForTeamSaga(updateRolesForTeam({
        teamId,
        accountId,
        role,
        newValue: true,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountTeamsRoles')));
      expect(gen.next().value).toMatchObject(call(addRoleForTeam, accountId, teamId, role, { quiet: true}));
      expect(gen.next(accountData).value).toMatchObject(put(UPDATE_ROLE_FOR_TEAM_SUCCESS({ data: accountData })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountTeamsRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('should remove a role to a team', () => {
      const teamId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const accountData = { a: 1 };
      const gen = updateRolesForTeamSaga(updateRolesForTeam({
        teamId,
        accountId,
        role,
        newValue: false,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountTeamsRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForTeam, accountId, teamId, role, { quiet: true}));
      expect(gen.next(accountData).value).toMatchObject(put(UPDATE_ROLE_FOR_TEAM_SUCCESS({ data: accountData })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountTeamsRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('should handle an error', () => {
      const teamId = 'abc';
      const role = 'bob';
      const accountId = '123';
      const gen = updateRolesForTeamSaga(updateRolesForTeam({
        teamId,
        accountId,
        role,
        newValue: false,
        quiet: true,
      }));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountTeamsRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForTeam, accountId, teamId, role, { quiet: true}));
      expect(gen.throw(new Error('ouch')).value).toMatchObject(put(stopSubmit('accountTeamsRoles')));
      expect(gen.next().value).toMatchObject(put(reset('accountTeamsRoles')));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('addNewNamespaceSaga', () => {
    it('add a new namespace and role', () => {
      const namespaceId = 'abc';
      const role = 'bob';

      const gen = addNewNamespaceSaga(addNewNamespace());
      gen.next(); // form selector
      expect(gen.next({ newNamespace: namespaceId, roleForNewNamespace: role }).value).toMatchObject(put(updateRolesForNamespace({
        namespaceId,
        role,
        newValue: true,
      })));
      expect(gen.next().done).toBe(true);
    });

    it('add returns when missing namespace', () => {
      const gen = addNewNamespaceSaga(addNewNamespace());
      gen.next(); // form selector
      expect(gen.next({ roleForNewNamespace: 'bob' }).done).toBe(true);
    });

    it('add returns when missing role', () => {
      const gen = addNewNamespaceSaga(addNewNamespace());
      gen.next(); // form selector
      expect(gen.next({ newNamespace: 'bob' }).done).toBe(true);
    });
  });

  describe('addNewRegistrySaga', () => {
    it('add a new registry and role', () => {
      const registryId = 'abc';
      const role = 'bob';

      const gen = addNewRegistrySaga(addNewRegistry());
      gen.next(); // form selector
      expect(gen.next({ newRegistry: registryId, roleForNewRegistry: role }).value).toMatchObject(put(updateRolesForRegistry({
        registryId,
        role,
        newValue: true,
      })));
      expect(gen.next().done).toBe(true);
    });

    it('add returns when missing registry', () => {
      const gen = addNewRegistrySaga(addNewRegistry());
      gen.next(); // form selector
      expect(gen.next({ roleForNewRegistry: 'bob' }).done).toBe(true);
    });

    it('add returns when missing role', () => {
      const gen = addNewRegistrySaga(addNewRegistry());
      gen.next(); // form selector
      expect(gen.next({ newRegistry: 'bob' }).done).toBe(true);
    });
  });

  describe('addNewTeamSaga', () => {
    it('add a new team and role', () => {
      const teamId = 'abc';
      const role = 'bob';

      const gen = addNewTeamSaga(addNewTeam());
      gen.next(); // form selector
      expect(gen.next({ newTeam: teamId, roleForNewTeam: role }).value).toMatchObject(put(updateRolesForTeam({
        teamId,
        role,
        newValue: true,
      })));
      expect(gen.next().done).toBe(true);
    });

    it('add returns when missing team', () => {
      const gen = addNewTeamSaga(addNewTeam());
      gen.next(); // form selector
      expect(gen.next({ roleForNewTeam: 'bob' }).done).toBe(true);
    });

    it('add returns when missing role', () => {
      const gen = addNewTeamSaga(addNewTeam());
      gen.next(); // form selector
      expect(gen.next({ newTeam: 'bob' }).done).toBe(true);
    });
  });

  describe('deleteRolesForNamespaceSaga', () => {
    it('deletes all roles for a namespace', () => {
      const namespaceId = 'abc';
      const gen = deleteRolesForNamespaceSaga(deleteRolesForNamespace({ namespaceId }));
      gen.next(); //Form selector
      expect(gen.next({ a: true, b: true }).value).toMatchObject(call(updateRolesForNamespaceSaga, { payload: {
        namespaceId,
        role: 'a',
        newValue: false,
      } }));
      expect(gen.next().value).toMatchObject(call(updateRolesForNamespaceSaga, { payload: {
        namespaceId,
        role: 'b',
        newValue: false,
      } }));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('deleteRolesForRegistrySaga', () => {
    it('deletes all roles for a registry', () => {
      const registryId = 'abc';
      const gen = deleteRolesForRegistrySaga(deleteRolesForRegistry({ registryId }));
      gen.next(); //Form selector
      expect(gen.next({ a: true, b: true }).value).toMatchObject(call(updateRolesForRegistrySaga, { payload: {
        registryId,
        role: 'a',
        newValue: false,
      } }));
      expect(gen.next().value).toMatchObject(call(updateRolesForRegistrySaga, { payload: {
        registryId,
        role: 'b',
        newValue: false,
      } }));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('deleteRolesForTeamSaga', () => {
    it('deletes all roles for a team', () => {
      const teamId = 'abc';
      const gen = deleteRolesForTeamSaga(deleteRolesForTeam({ teamId }));
      gen.next(); //Form selector
      expect(gen.next({ a: true, b: true }).value).toMatchObject(call(updateRolesForTeamSaga, { payload: {
        teamId,
        role: 'a',
        newValue: false,
      } }));
      expect(gen.next().value).toMatchObject(call(updateRolesForTeamSaga, { payload: {
        teamId,
        role: 'b',
        newValue: false,
      } }));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('updateSystemRoleSaga', () => {
    it('grants a system role', () => {
      const role = 'developer';
      const value = true;
      const accountId = 'abc123';
      const payload = { role, newValue: value };
      const updateResult = { bob: 1 };

      const gen = updateSystemRoleSaga(updateSystemRole(payload));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(call(addRoleForSystem, accountId, role, {}));
      expect(gen.next(updateResult).value).toMatchObject(put(UPDATE_ROLE_FOR_SYSTEM_SUCCESS({ data: updateResult })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountSystemRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('revokes a system role', () => {
      const role = 'developer';
      const value = false;
      const accountId = 'abc123';
      const payload = { role, newValue: value };
      const updateResult = { bob: 1 };

      const gen = updateSystemRoleSaga(updateSystemRole(payload));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(call(removeRoleForSystem, accountId, role, {}));
      expect(gen.next(updateResult).value).toMatchObject(put(UPDATE_ROLE_FOR_SYSTEM_SUCCESS({ data: updateResult })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountSystemRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('handle an error', () => {
      const role = 'developer';
      const value = true;
      const accountId = 'abc123';
      const payload = { role, newValue: value, quiet: true };

      const gen = updateSystemRoleSaga(updateSystemRole(payload));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(call(addRoleForSystem, accountId, role, {}));
      expect(gen.throw(new Error('bob')).value).toMatchObject(put(stopSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(put(reset('accountSystemRoles')));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('updateGlobalRoleSaga', () => {
    it('grants a system role', () => {
      const role = 'developer';
      const value = true;
      const accountId = 'abc123';
      const payload = { role, newValue: value };
      const updateResult = { bob: 1 };

      const gen = updateGlobalRoleSaga(updateGlobalRole(payload));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(call(addGlobalRole, accountId, role, {}));
      expect(gen.next(updateResult).value).toMatchObject(put(UPDATE_ROLE_FOR_SYSTEM_SUCCESS({ data: updateResult })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountSystemRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('revokes a system role', () => {
      const role = 'developer';
      const value = false;
      const accountId = 'abc123';
      const payload = { role, newValue: value };
      const updateResult = { bob: 1 };

      const gen = updateGlobalRoleSaga(updateGlobalRole(payload));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(call(removeGlobalRole, accountId, role, {}));
      expect(gen.next(updateResult).value).toMatchObject(put(UPDATE_ROLE_FOR_SYSTEM_SUCCESS({ data: updateResult })));
      expect(gen.next().value).toMatchObject(put(stopSubmit('accountSystemRoles')));
      expect(gen.next().done).toBe(true);
    });

    it('handle an error', () => {
      const role = 'developer';
      const value = true;
      const accountId = 'abc123';
      const payload = { role, newValue: value, quiet: true };

      const gen = updateGlobalRoleSaga(updateGlobalRole(payload));
      expect(gen.next().value).toMatchObject(select(selectAccount));
      expect(gen.next({ id: accountId }).value).toMatchObject(put(startSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(call(addGlobalRole, accountId, role, {}));
      expect(gen.throw(new Error('bob')).value).toMatchObject(put(stopSubmit('accountSystemRoles')));
      expect(gen.next().value).toMatchObject(put(reset('accountSystemRoles')));
      expect(gen.next().done).toBe(true);
    });
  });

  describe('deleteAccountSaga', () => {
    it('should delete an account', () => {
      const gen = deleteAccountSaga(deleteAccount({ id: 'abc' }));
      expect(gen.next().value).toMatchObject(call(deleteAccountRequest, 'abc'));
      expect(gen.next().value).toMatchObject(put(closeDeleteModal()));
      expect(gen.next().value).toMatchObject(put(push('/accounts')));
      expect(gen.next().done).toBe(true);
    });
  });

  it('should check permission', () => {
    const gen = checkPermissionSaga(fetchAccountInfo());
    expect(gen.next().value).toMatchObject(call(hasPermission, 'accounts-write'));
    expect(gen.next({ answer: true }).value).toMatchObject(put(setCanEdit(true)));
    expect(gen.next().value).toMatchObject(call(hasPermission, 'accounts-delete'));
    expect(gen.next({ answer: true }).value).toMatchObject(put(setCanDelete(true)));
    expect(gen.next().value).toMatchObject(call(getCanManageAnyTeam));
    expect(gen.next({ answer: true }).value).toMatchObject(put(setCanManageTeam(true)));
    expect(gen.next().done).toBe(true);
  });
});
