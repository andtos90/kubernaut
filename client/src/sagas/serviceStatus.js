import { takeLatest, call, put, select, take, delay, cancel, fork } from 'redux-saga/effects';
import { push, replace, LOCATION_CHANGE } from 'connected-react-router';
import { getFormValues } from 'redux-form';

import {
  initServiceStatusPage,
  fetchLatestDeployments,
  fetchStatus,
  setCanManage,
  setCanReadIngress,
  FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_REQUEST,
  FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_SUCCESS,
  FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_ERROR,
  FETCH_STATUS_REQUEST,
  FETCH_STATUS_SUCCESS,
  FETCH_STATUS_ERROR,
  fetchTeamForService,
  FETCH_TEAM_REQUEST,
  FETCH_TEAM_SUCCESS,
  selectLatestDeployments,
  changeToNamespace,
  startPolling,
  stopPolling,
} from '../modules/serviceStatus';

import {
  getLatestDeploymentsByNamespaceForService,
  getCanManageAnyNamespace,
  getTeamForService,
  getStatusForService,
  hasPermission,
} from '../lib/api';

export function* initServiceStatusPageSaga({ payload = {} }) {
  const { match, location } = payload;
  if (!match || !location) return;
  const { registry, name: service, namespaceId } = match.params;
  if (!registry) throw new Error('provide a registry');
  if (!service) throw new Error('provide a service');

  if (!namespaceId) {
    yield put(fetchLatestDeployments({ registry, service }));
    yield take(FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_SUCCESS);
    const namespaces = yield select(selectLatestDeployments);
    if (namespaces && namespaces.length) {
      const toGoto = namespaces[0];
      yield put(replace(`${location.pathname}/${toGoto.id}`));
      return;
    }
  }

  yield put(fetchLatestDeployments({ registry, service }));
  yield put(fetchStatus({ registry, service, namespaceId }));
}

export function* fetchLatestDeploymentsByNamespaceForServiceSaga({ payload = {} }) {
  const { registry, service, ...options } = payload;
  if (!registry) throw new Error('provide a registry');
  if (!service) throw new Error('provide a service');

  const quiet = options.quiet;
  yield put(FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_REQUEST());

  try {
    const data = yield call(getLatestDeploymentsByNamespaceForService, {
      registry,
      service,
      includeFailed: true,
    });
    yield put(FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_SUCCESS({ data }));
  } catch(error) {
    if (!quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_LATEST_DEPLOYMENTS_BY_NAMESPACE_ERROR({ error: error.message }));
  }
}

export function* canManageSaga() {
  try {
    const canManage = yield call(getCanManageAnyNamespace);
    yield put(setCanManage(canManage.answer));
  } catch(error) {
    console.error(error); // eslint-disable-line no-console
  }
}

export function* canReadIngressSaga() {
  try {
    const canReadIngress = yield call(hasPermission, 'ingress-read');
    yield put(setCanReadIngress(canReadIngress.answer));
  } catch(error) {
    console.error(error); // eslint-disable-line no-console
  }
}

export function* fetchTeamForServiceSaga({ payload = {} }) {
  const { registry, service } = payload;
  try {
    yield put(FETCH_TEAM_REQUEST());
    const data = yield call(getTeamForService, { registry, service });
    yield put(FETCH_TEAM_SUCCESS({ data }));
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
}

export function* fetchStatusSaga({ payload = {} }) {
  const { registry, service, namespaceId, quiet, noLoading = false } = payload;
  try {
    if (!noLoading) yield put(FETCH_STATUS_REQUEST());
    const data = yield call(getStatusForService, { registry, service, namespaceId });
    yield put(FETCH_STATUS_SUCCESS({ data }));
  } catch (error) {
    if (!quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_STATUS_ERROR());
  }
}

export function* changeToNamespaceSaga({ payload = {} }) {
  const { namespaceId, registry, service} = payload;
  yield put(push(`/services/${registry}/${service}/status/${namespaceId}`));
}

export function* pollingSaga(registry, service, namespaceId) {
  while(true) {
    yield put(fetchStatus({
      registry,
      service,
      namespaceId,
      noLoading: true,
    }));

    yield delay(5000);
  }
}

export function* stopPollingSaga() {
  yield put(stopPolling());
}

export function* initPollingSaga({ payload = {} }) {
  const { registry, service } = payload;
  const namespaceId = (yield select(getFormValues('serviceStatus'))).namespace;

  const poller = yield fork(pollingSaga, registry, service, namespaceId);
  yield take(stopPolling);
  yield cancel(poller);
}

export default [
  takeLatest(initServiceStatusPage, initServiceStatusPageSaga),
  takeLatest(initServiceStatusPage, canManageSaga),
  takeLatest(initServiceStatusPage, canReadIngressSaga),
  takeLatest(fetchLatestDeployments, fetchLatestDeploymentsByNamespaceForServiceSaga),
  takeLatest(fetchTeamForService, fetchTeamForServiceSaga),
  takeLatest(fetchStatus, fetchStatusSaga),
  takeLatest(changeToNamespace, changeToNamespaceSaga),
  takeLatest(startPolling, initPollingSaga),
  takeLatest(LOCATION_CHANGE, stopPollingSaga),
];
