import { takeLatest, call, put, select } from 'redux-saga/effects';
import { reset } from 'redux-form';
import { push, getLocation } from 'connected-react-router';
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
  initialiseReleasesPage,
  fetchReleases,
  fetchReleasesPagination,
  toggleSort,
  FETCH_RELEASES_REQUEST,
  FETCH_RELEASES_SUCCESS,
  FETCH_RELEASES_ERROR,
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
} from '../modules/releases';

import { getReleases } from '../lib/api';

const pageUrl = '/releases';

export function* fetchReleasesDataSaga({ payload = {} }) {
  const options = payload;
  const { page, limit } = yield select(selectPaginationState);
  const offset = (page - 1) * limit;
  const { column, order } = yield select(selectSortState);
  const filters = yield select(selectTableFilters, true);
  yield put(FETCH_RELEASES_REQUEST());
  try {
    const data = yield call(getReleases, { offset, limit, sort: column, order, filters });
    yield put(FETCH_RELEASES_SUCCESS({ data }));
  } catch(error) {
    if (!options.quiet) console.error(error); // eslint-disable-line no-console
    yield put(FETCH_RELEASES_ERROR({ error: error.message }));
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
  yield put(reset('releases_table_filter'));
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
  const { location } = payload;
  if (!location) return;

  const filters = parseFiltersFromQS(extractFromQuery(location.search, 'filters') || '');
  const search = parseSearchFromQS(extractFromQuery(location.search, 'search') || '');
  const sort = parseQueryString(extractFromQuery(location.search, 'sort') || '');
  const pagination = parseQueryString(extractFromQuery(location.search, 'pagination') || '');
  yield put(setFilters(filters));
  yield put(setSearch(search));
  yield put(setSort(sort));
  yield put(setPagination(pagination));
  yield put(fetchReleases());
}

export default [
  takeLatest(fetchReleases, fetchReleasesDataSaga),
  takeLatest(fetchReleasesPagination, paginationSaga),
  takeLatest(addFilter, addFilterSaga),
  takeLatest(removeFilter, removeFilterSaga),
  takeLatest(toggleSort, sortSaga),
  takeLatest(search, searchSaga),
  takeLatest(clearSearch, searchSaga),
  takeLatest(initialiseReleasesPage, locationChangeSaga),
];
