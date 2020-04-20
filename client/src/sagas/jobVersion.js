import { takeLatest, call, put } from 'redux-saga/effects';

import {
  initialiseJobVersionPage,
  FETCH_JOB_VERSION_REQUEST,
  FETCH_JOB_VERSION_SUCCESS,
  FETCH_JOB_VERSION_ERROR,
} from '../modules/jobVersion';
import {
  getJobVersion,
} from '../lib/api';

export function* fetchJobVersionSaga({ payload: { match, ...options } }) {
  if (!match) return;
  const { id } = match.params;
  yield put(FETCH_JOB_VERSION_REQUEST());
  try {
    const data = yield call(getJobVersion, id);
    yield put(FETCH_JOB_VERSION_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_JOB_VERSION_ERROR({ error: error.message }));
  }
}

export default [
  takeLatest(initialiseJobVersionPage, fetchJobVersionSaga),
];