import { takeLatest, call, put, select } from 'redux-saga/effects';
import { SubmissionError, reset } from 'redux-form';
import { push, getLocation } from 'connected-react-router';

import {
  extractFromQuery,
  alterQuery,
  makeQueryString,
  parseQueryString,
} from './lib/query';
import {
  initialiseAdminIngressPage,
  fetchHostKeys,
  fetchHostKeysPagination,
  FETCH_HOST_KEYS_REQUEST,
  FETCH_HOST_KEYS_SUCCESS,
  FETCH_HOST_KEYS_ERROR,
  fetchVariableKeys,
  fetchVariableKeysPagination,
  FETCH_VARIABLE_KEYS_REQUEST,
  FETCH_VARIABLE_KEYS_SUCCESS,
  FETCH_VARIABLE_KEYS_ERROR,
  fetchClasses,
  fetchClassesPagination,
  FETCH_CLASSES_REQUEST,
  FETCH_CLASSES_SUCCESS,
  FETCH_CLASSES_ERROR,
  setHostPagination,
  setVariablePagination,
  setClassPagination,
  getFormValues,
  submitHostForm,
  submitVariableForm,
  submitClassForm,
  selectHostPaginationState,
  selectVariablePaginationState,
  selectClassPaginationState,
} from '../modules/adminIngress';

import {
  getIngressHosts,
  getIngressVariables,
  getIngressClasses,
  saveIngressHost,
  saveIngressVariable,
  saveIngressClass,
} from '../lib/api';

const pageUrl = '/admin/ingress';

export function* fetchHostKeysSaga({ payload = {} }) {
  const options = payload;
  const { page, limit } = yield select(selectHostPaginationState);
  const offset = (page - 1) * limit;

  yield put(FETCH_HOST_KEYS_REQUEST());
  try {
    const data = yield call(getIngressHosts, { offset, limit });
    yield put(FETCH_HOST_KEYS_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_HOST_KEYS_ERROR({ error: error.message }));
  }
}

export function* fetchVariableKeysSaga({ payload = {} }) {
  const options = payload;
  const { page, limit } = yield select(selectVariablePaginationState);
  const offset = (page - 1) * limit;

  yield put(FETCH_VARIABLE_KEYS_REQUEST());
  try {
    const data = yield call(getIngressVariables, { offset, limit });
    yield put(FETCH_VARIABLE_KEYS_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_VARIABLE_KEYS_ERROR({ error: error.message }));
  }
}

export function* fetchClassesSaga({ payload = {} }) {
  const options = payload;
  const { page, limit } = yield select(selectClassPaginationState);
  const offset = (page - 1) * limit;

  yield put(FETCH_CLASSES_REQUEST());
  try {
    const data = yield call(getIngressClasses, { offset, limit });
    yield put(FETCH_CLASSES_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_CLASSES_ERROR({ error: error.message }));
  }
}

export function* submitHostSaga() {
  try {
    const { newHost: values = {} } = yield select(getFormValues);

    if (!values.name) {
      yield put(submitHostForm.failure());
      return;
    }
    yield call(saveIngressHost, values.name);

    yield put(submitHostForm.success());
    yield put(reset('newIngressKeys'));
    yield put(fetchHostKeys());
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    yield put(submitHostForm.failure(new SubmissionError({ _error: err.message || 'Something bad and unknown happened.' })));
  }
}

export function* submitVariableSaga() {
  try {
    const { newVariable: values = {} } = yield select(getFormValues);

    if (!values.name) {
      yield put(submitVariableForm.failure());
      return;
    }
    yield call(saveIngressVariable, values.name);

    yield put(submitVariableForm.success());
    yield put(reset('newIngressKeys'));
    yield put(fetchVariableKeys());
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    yield put(submitVariableForm.failure(new SubmissionError({ _error: err.message || 'Something bad and unknown happened.' })));
  }
}

export function* submitClassSaga() {
  try {
    const { newClass: values = {} } = yield select(getFormValues);

    if (!values.name) {
      yield put(submitClassForm.failure());
      return;
    }
    yield call(saveIngressClass, values.name);

    yield put(submitClassForm.success());
    yield put(reset('newIngressKeys'));
    yield put(fetchClasses());
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    yield put(submitClassForm.failure(new SubmissionError({ _error: err.message || 'Something bad and unknown happened.' })));
  }
}

export function* paginationSaga() {
  const location = yield select(getLocation);
  const hostPagination = yield select(selectHostPaginationState);
  const variablePagination = yield select(selectVariablePaginationState);
  const classPagination = yield select(selectClassPaginationState);
  yield put(push(`${pageUrl}?${alterQuery(location.search, {
    'h-pagination': makeQueryString({ ...hostPagination }),
    'v-pagination': makeQueryString({ ...variablePagination }),
    'c-pagination': makeQueryString({ ...classPagination }),
  })}`));
}

export function* locationChangeSaga({ payload = {} }) {
  const { location } = payload;
  if (!location) return;

  const hostPagination = parseQueryString(extractFromQuery(location.search, 'h-pagination') || '');
  const variablePagination = parseQueryString(extractFromQuery(location.search, 'v-pagination') || '');
  const classPagination = parseQueryString(extractFromQuery(location.search, 'c-pagination') || '');

  yield put(setHostPagination(hostPagination));
  yield put(setVariablePagination(variablePagination));
  yield put(setClassPagination(classPagination));
  yield put(fetchHostKeys());
  yield put(fetchVariableKeys());
  yield put(fetchClasses());
}

export default [
  takeLatest(fetchHostKeys, fetchHostKeysSaga),
  takeLatest(fetchVariableKeys, fetchVariableKeysSaga),
  takeLatest(fetchClasses, fetchClassesSaga),
  takeLatest(initialiseAdminIngressPage, locationChangeSaga),
  takeLatest(fetchHostKeysPagination, paginationSaga),
  takeLatest(fetchVariableKeysPagination, paginationSaga),
  takeLatest(fetchClassesPagination, paginationSaga),
  takeLatest(submitHostForm.REQUEST, submitHostSaga),
  takeLatest(submitVariableForm.REQUEST, submitVariableSaga),
  takeLatest(submitClassForm.REQUEST, submitClassSaga),
];
