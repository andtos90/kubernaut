import { takeLatest, call, put, select } from 'redux-saga/effects';
import { reset } from 'redux-form';
import { push, getLocation, LOCATION_CHANGE } from 'connected-react-router';
import { doesLocationMatch } from '../paths';
import {
  parseFiltersFromQS,
  parseSearchFromQS,
  stringifyFiltersForQS,
  stringifySearchForQS,
} from '../modules/lib/filter';
import {
  extractFromQuery,
  alterQuery,
  makeQueryString,
  parseQueryString,
 } from './lib/query';
import {
  fetchDeployments,
  fetchDeploymentsPagination,
  toggleSort,
  FETCH_DEPLOYMENTS_REQUEST,
  FETCH_DEPLOYMENTS_SUCCESS,
  FETCH_DEPLOYMENTS_ERROR,
  selectSortState,
  selectTableFilters,
  selectSearchFilter,
  selectPaginationState,
  addFilter,
  removeFilter,
  search,
  clearSearch,
  setFilters,
  setSearch,
  setSort,
  setPagination,
} from '../modules/deployments';

import { getDeployments } from '../lib/api';

const pageUrl = '/deployments';

export function* fetchDeploymentsDataSaga({ payload = {} }) {
  const options = payload;
  const { page, limit } = yield select(selectPaginationState);
  const offset = (page - 1) * limit;
  const { column, order } = yield select(selectSortState);
  const filters = yield select(selectTableFilters, true);

  try {
    yield put(FETCH_DEPLOYMENTS_REQUEST());
    const data = yield call(getDeployments, { offset, limit, sort: column, order, filters });
    yield put(FETCH_DEPLOYMENTS_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_DEPLOYMENTS_ERROR({ error: error.message }));
  }
}

export function* sortSaga({ payload = {} }) {
  const location = yield select(getLocation);
  const sort = yield select(selectSortState);
  yield put(push(`${pageUrl}?${alterQuery(location.search, {
    sort: makeQueryString({ ...sort }),
    pagination: null,
  })}`));
}

export function* addFilterSaga() {
  yield put(reset('deployments_table_filter'));
  const location = yield select(getLocation);
  const filters = yield select(selectTableFilters);
  yield put(push(`${pageUrl}?${alterQuery(location.search, {
    filters: stringifyFiltersForQS(filters),
    pagination: null,
    search: null,
  })}`));
}

export function* removeFilterSaga() {
  const location = yield select(getLocation);
  const filters = yield select(selectTableFilters);
  yield put(push(`${pageUrl}?${alterQuery(location.search, {
    filters: stringifyFiltersForQS(filters),
    pagination: null,
  })}`));
}

export function* searchSaga() {
  const location = yield select(getLocation);
  const searchFilter = yield select(selectSearchFilter);
  yield put(push(`${pageUrl}?${alterQuery(location.search, {
    search: stringifySearchForQS(searchFilter),
    pagination: null,
  })}`));
}

export function* paginationSaga() {
  const location = yield select(getLocation);
  const pagination = yield select(selectPaginationState);
  yield put(push(`${pageUrl}?${alterQuery(location.search, { pagination: makeQueryString({ ...pagination }) })}`));
}

export function* locationChangeSaga({ payload = {} }) {
  const urlMatch = doesLocationMatch(payload.location, 'deployments');
  if (!urlMatch) return;

  const filters = parseFiltersFromQS(extractFromQuery(payload.location.search, 'filters') || '');
  const search = parseSearchFromQS(extractFromQuery(payload.location.search, 'search') || '');
  const sort = parseQueryString(extractFromQuery(payload.location.search, 'sort') || '');
  const pagination = parseQueryString(extractFromQuery(payload.location.search, 'pagination') || '');
  yield put(setFilters(filters));
  yield put(setSearch(search));
  yield put(setSort(sort));
  yield put(setPagination(pagination));
  yield put(fetchDeployments());
}

export default [
  takeLatest(fetchDeployments, fetchDeploymentsDataSaga),
  takeLatest(fetchDeploymentsPagination, paginationSaga),
  takeLatest(toggleSort, sortSaga),
  takeLatest(addFilter, addFilterSaga),
  takeLatest(removeFilter, removeFilterSaga),
  takeLatest(search, searchSaga),
  takeLatest(clearSearch, searchSaga),
  takeLatest(LOCATION_CHANGE, locationChangeSaga),
];
