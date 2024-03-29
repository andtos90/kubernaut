import { takeEvery, takeLatest, call, put, select, take, race } from 'redux-saga/effects';
import { startSubmit, stopSubmit } from 'redux-form';
import { push, getLocation } from 'connected-react-router';
import {
  extractFromQuery,
  alterQuery,
  makeQueryString,
  parseQueryString,
} from './lib/query';

import {
  initServiceManage,
  updateServiceStatusForNamespace,
  selectNamespaces,
  updateServiceStatusSuccess,
  fetchServices,
  fetchNamespacesPagination,
  selectPaginationState,
  setPagination,
  FETCH_SERVICE_REQUEST,
  FETCH_SERVICE_SUCCESS,
  FETCH_SERVICE_ERROR,
  FETCH_SERVICE_NAMESPACES_STATUS_REQUEST,
  FETCH_SERVICE_NAMESPACES_STATUS_SUCCESS,
  FETCH_SERVICE_NAMESPACES_STATUS_ERROR,
  canManageRequest,
  setCanManage,
  canReadIngressRequest,
  setCanReadIngress,
  fetchTeamForService,
  FETCH_TEAM_REQUEST,
  FETCH_TEAM_SUCCESS,
  FETCH_TEAM_ERROR,
  selectTeam,
  setCanManageTeamForService,
  setCanDelete,
  canDeleteRequest,
  setManageableTeams,
  updateTeamOwnership,
  selectServiceInfo,
  deleteService,
  closeDeleteModal,
  setLogOutput,
} from '../modules/serviceManage';

import {
  getService,
  getServiceNamespacesStatus,
  enableServiceForNamespace,
  disableServiceForNamespace,
  getCanManageAnyNamespace,
  getTeamForService,
  hasPermissionOn,
  hasPermission,
  withPermission,
  associateServiceWithTeam,
  disassociateService,
  getCanManageAnyTeam,
  deleteService as deleteServiceRequest,
} from '../lib/api';

export function* checkPermissionSaga({ payload: { match, ...options }}) {
  try {
    yield put(canManageRequest());
    yield put(canDeleteRequest());
    yield put(canReadIngressRequest());
    const raceResult = yield race({
      success: take(FETCH_SERVICE_SUCCESS),
      failure: take(FETCH_SERVICE_ERROR),
    });
    if (raceResult.failure) {
      yield put(setCanManage(false));
      yield put(setCanDelete(false));
      yield put(setCanReadIngress(false));
      return;
    }

    const canManage = yield call(getCanManageAnyNamespace);
    yield put(setCanManage(canManage.answer));

    const { payload: serviceResult } = raceResult.success;
    const registryId = serviceResult.data.registry.id;
    const canDelete = yield call(hasPermissionOn, 'registries-write', 'registry', registryId);
    yield put(setCanDelete(canDelete.answer));
    const canReadIngress = yield call(hasPermission, 'ingress-read');
    yield put(setCanReadIngress(canReadIngress.answer));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
  }
}

export function* fetchServiceInfoSaga({ payload: { match, ...options } }) {
  if (!match) return;
  const { registry, name: service } = match.params;
  if (!registry || !service) return;
  yield put(FETCH_SERVICE_REQUEST());
  try {
    const data = yield call(getService, { registry, service });
    yield put(FETCH_SERVICE_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_SERVICE_ERROR({ error: error.message }));
  }
}

export function* fetchServiceNamespacesStatusSaga({ payload = { } }) {
  const { registry, name: service, ...options } = payload;
  const { page, limit } = yield select(selectPaginationState);
  const offset = (page - 1) * limit;

  yield put(FETCH_SERVICE_NAMESPACES_STATUS_REQUEST());
  try {
    const data = yield call(getServiceNamespacesStatus, registry, service, offset, limit);
    yield put(FETCH_SERVICE_NAMESPACES_STATUS_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_SERVICE_NAMESPACES_STATUS_ERROR({ error: error.message }));
  }
}

export function* updateServiceStatusSaga({ payload = {} }) {
  const {
    namespaceId,
    serviceId,
    newValue,
    ...options
  } = payload;

  const { offset, limit } = yield select(selectNamespaces);
  yield put(startSubmit('serviceManage'));
  try {
    let data;
    if (newValue) data = yield call(enableServiceForNamespace, namespaceId, serviceId, offset, limit, true);
    else data = yield call(disableServiceForNamespace, namespaceId, serviceId, offset, limit, true);
    yield put(updateServiceStatusSuccess({ data }));
    yield put(stopSubmit('serviceManage'));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(stopSubmit('serviceManage'));
  }
}

export function* paginationSaga() {
  const location = yield select(getLocation);
  const pagination = yield select(selectPaginationState);
  yield put(push(`${location.pathname}?${alterQuery(location.search, { pagination: makeQueryString({ ...pagination }) })}`));
}

export function* locationChangeSaga({ payload = {} }) {
  const { match, location} = payload;
  if(!match || !location) return;
  const pagination = parseQueryString(extractFromQuery(location.search, 'pagination') || '');
  yield put(setPagination(pagination));
  yield put(fetchServices(match.params));
  yield put(fetchTeamForService({ registry: match.params.registry, service: match.params.name }));
}

export function* fetchTeamForServiceSaga({ payload = {} }) {
  const { registry, service } = payload;
  try {
    yield put(FETCH_TEAM_REQUEST());
    const data = yield call(getTeamForService, { registry, service });
    yield put(FETCH_TEAM_SUCCESS({ data }));
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    yield put(FETCH_TEAM_ERROR());
  }
}

export function* fetchTeamPermissionsSaga() {
  try {
    const result = yield race({
      success: take(FETCH_TEAM_SUCCESS),
      failure: take(FETCH_TEAM_ERROR),
    });

    if (result.success) {
      // Service has a team: check user can manage _that_ team, if not, no point providing options.
      const team = yield select(selectTeam);
      const { answer } = yield call(hasPermissionOn, 'teams-manage', 'team', team.id);
      yield put(setCanManageTeamForService(answer));
      if (!answer) return;

      const manageableTeams = yield call(withPermission, 'teams-manage', 'team');
      yield put(setManageableTeams(manageableTeams));
    } else if (result.failure) {
      // Service has _no_ team, therefore it only matters if the user can manage _any_ team.
      const { answer } = yield call(getCanManageAnyTeam);
      yield put(setCanManageTeamForService(answer));
      if (!answer) return;

      const manageableTeams = yield call(withPermission, 'teams-manage', 'team');
      yield put(setManageableTeams(manageableTeams));
    }
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
}

export function* updateTeamOwnershipSaga({ payload = {} }) {
  const { value, ...options } = payload;
  const { id: serviceId, registry, service } = yield select(selectServiceInfo);

  try {
    if (value) {
      yield call(associateServiceWithTeam, serviceId, value);
      yield put(fetchTeamForService({ registry, service }));
    } else {
      yield call(disassociateService, serviceId);
      yield put(fetchTeamForService({ registry, service }));
    }
  } catch (error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
  }
}

export function* deleteServiceSaga({ payload = {} }) {
  const options = payload;
  try {
    if (options.continue) {
      yield put(closeDeleteModal());
      yield put(push('/services'));
      return;
    }

    const { registry, service } = yield select(selectServiceInfo);
    const { log } = yield call(deleteServiceRequest, registry, service);
    yield put(setLogOutput({ log }));
  } catch (error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
  }
}

export default [
  takeEvery(initServiceManage, checkPermissionSaga),
  takeEvery(initServiceManage, fetchServiceInfoSaga),
  takeEvery(updateServiceStatusForNamespace, updateServiceStatusSaga),
  takeEvery(fetchServices, fetchServiceNamespacesStatusSaga),
  takeEvery(fetchNamespacesPagination, paginationSaga),
  takeEvery(initServiceManage, locationChangeSaga),
  takeLatest(fetchTeamForService, fetchTeamForServiceSaga),
  takeLatest(FETCH_TEAM_REQUEST, fetchTeamPermissionsSaga),
  takeLatest(updateTeamOwnership, updateTeamOwnershipSaga),
  takeLatest(deleteService, deleteServiceSaga),
];
