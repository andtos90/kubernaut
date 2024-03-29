import { takeEvery, call, put, all, select } from 'redux-saga/effects';
import { SubmissionError } from 'redux-form';
import { push } from 'connected-react-router';

import {
  initForm,
  submitForm,
  selectNamespaceId,
  FETCH_NAMESPACE_REQUEST,
  FETCH_NAMESPACE_SUCCESS,
  FETCH_NAMESPACE_ERROR,
  FETCH_CLUSTERS_REQUEST,
  FETCH_CLUSTERS_SUCCESS,
  FETCH_CLUSTERS_ERROR,
  canEditRequest,
  setCanEdit,
  canManageRequest,
  setCanManage,
} from '../modules/namespaceEdit';
import { getNamespace, getClusters, editNamespace, hasPermissionOn } from '../lib/api';

export function* initFormSaga(action) {
  yield all([
    call(checkPermissionSaga, action),
    call(fetchNamespaceInfoSaga, action),
    call(fetchClustersSaga, action),
  ]);
}

export function* checkPermissionSaga({ payload: { match, ...options } }) {
  if (!match) return;
  const { namespaceId } = match.params;
  if (!namespaceId) return;
  try {
    yield put(canEditRequest());
    yield put(canManageRequest());
    const hasPermission = yield call(hasPermissionOn, 'namespaces-write', 'namespace', namespaceId);
    const canManage = yield call(hasPermissionOn, 'namespaces-manage', 'namespace', namespaceId);
    yield put(setCanEdit(hasPermission.answer));
    yield put(setCanManage(canManage.answer));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
  }
}

export function* fetchClustersSaga({ payload }) {
  yield put(FETCH_CLUSTERS_REQUEST());
  try {
    const data = yield call(getClusters);
    yield put(FETCH_CLUSTERS_SUCCESS({ data }));
  } catch(error) {
    if (!payload.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_CLUSTERS_ERROR({ error: error.message }));
  }
}

export function* fetchNamespaceInfoSaga({ payload: { match, ...options } }) {
  if (!match) return;
  const { namespaceId } = match.params;
  yield put(FETCH_NAMESPACE_REQUEST());
  try {
    const data = yield call(getNamespace, namespaceId);
    yield put(FETCH_NAMESPACE_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_NAMESPACE_ERROR({ error: error.message }));
  }
}

export function* editNamespaceSaga({ payload: formValues }, options = {}) {
  const id = yield select(selectNamespaceId);
  const { attributes = [], ...data } = formValues;

  data.attributes = attributes.reduce((acc, { name, value }) => {
    return (acc[name] = value, acc);
  }, {});
  try {
    yield call(editNamespace, id, data, options);
  } catch(err) {
    if (!options.quiet) console.error(err); // eslint-disable-line no-console
    return yield put(submitForm.failure(new SubmissionError({ _error: err.message || 'Something bad and unknown happened.' })));
  }
  yield put(submitForm.success());
  yield put(push(`/namespaces/${id}`));
}

export default [
  takeEvery(initForm, initFormSaga),
  takeEvery(submitForm.REQUEST, editNamespaceSaga),
];
