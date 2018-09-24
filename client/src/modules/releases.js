import { createAction, handleActions } from 'redux-actions';
import {
  createFilterActions,
  createFilterSelectors,
  createDefaultFilterState,
  createFilterReducers,
} from './lib/filter';
const actionsPrefix = 'KUBERNAUT/RELEASES';
const filterActions = createFilterActions(actionsPrefix);
export const fetchReleasesPagination = createAction(`${actionsPrefix}/FETCH_RELEASES_PAGINATION`);
export const initialise = createAction(`${actionsPrefix}/INITIALISE`);
export const FETCH_RELEASES_REQUEST = createAction(`${actionsPrefix}/FETCH_RELEASES_REQUEST`);
export const FETCH_RELEASES_SUCCESS = createAction(`${actionsPrefix}/FETCH_RELEASES_SUCCESS`);
export const FETCH_RELEASES_ERROR = createAction(`${actionsPrefix}/FETCH_RELEASES_ERROR`);
export const {
  addFilter,
  removeFilter,
  search,
  clearSearch,
  showFilters,
  hideFilters,
} = filterActions;

export const {
  selectTableFilters
} = createFilterSelectors('releases.filter');

const defaultFilterState = createDefaultFilterState({
  defaultColumn: 'service',
});
const defaultState = {
  data: {
    limit: 0,
    offset: 0,
    count: 0,
    pages: 0,
    page: 0,
    items: [],
  },
  meta: {},
  filter: defaultFilterState,
};

export default handleActions({
  [initialise]: () => ({
    ...defaultState,
  }),
  [FETCH_RELEASES_REQUEST]: (state) => ({
    ...state,
    data: {
      ...defaultState.data,
    },
    meta: {
      loading: true,
    },
  }),
  [FETCH_RELEASES_SUCCESS]: (state, { payload }) => ({
    ...state,
    data: payload.data,
    meta: {
      loading: false,
    },
  }),
  [FETCH_RELEASES_ERROR]: (state, { payload }) => ({
    ...state,
    meta: {
      error: payload.error,
      loading: false,
    },
  }),
  ...createFilterReducers(filterActions, defaultFilterState),
}, defaultState);
