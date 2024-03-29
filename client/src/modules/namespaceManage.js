import { createAction, handleActions, combineActions } from 'redux-actions';
import computeLoading from './lib/computeLoading';
const actionsPrefix = 'KUBERNAUT/NAMESPACE_MANAGE';
export const initialise = createAction(`${actionsPrefix}/INITIALISE`);
export const updateServiceStatusForNamespace = createAction(`${actionsPrefix}/UPDATE_SERVICE_STATUS`);
export const updateServiceStatusSuccess = createAction(`${actionsPrefix}/UPDATE_SERVICE_STATUS_SUCCESS`);
export const fetchServices = createAction(`${actionsPrefix}/FETCH_SERVICES`);
export const fetchServicesPagination = createAction(`${actionsPrefix}/FETCH_SERVICES_PAGINATION`);
export const setPagination = createAction(`${actionsPrefix}/SET_PAGINATION`);
export const canManageRequest = createAction(`${actionsPrefix}/CAN_MANAGE_REQUEST`);
export const setCanManage = createAction(`${actionsPrefix}/SET_CAN_MANAGE`);
export const canEditRequest = createAction(`${actionsPrefix}/CAN_EDIT_REQUEST`);
export const setCanEdit = createAction(`${actionsPrefix}/SET_CAN_EDIT`);
export const FETCH_NAMESPACE_REQUEST = createAction(`${actionsPrefix}/FETCH_NAMESPACE_REQUEST`);
export const FETCH_NAMESPACE_SUCCESS = createAction(`${actionsPrefix}/FETCH_NAMESPACE_SUCCESS`);
export const FETCH_NAMESPACE_ERROR = createAction(`${actionsPrefix}/FETCH_NAMESPACE_ERROR`);
export const FETCH_SERVICES_NAMESPACE_STATUS_REQUEST = createAction(`${actionsPrefix}/FETCH_SERVICES_NAMESPACE_STATUS_REQUEST`);
export const FETCH_SERVICES_NAMESPACE_STATUS_SUCCESS = createAction(`${actionsPrefix}/FETCH_SERVICES_NAMESPACE_STATUS_SUCCESS`);
export const FETCH_SERVICES_NAMESPACE_STATUS_ERROR = createAction(`${actionsPrefix}/FETCH_SERVICES_NAMESPACE_STATUS_ERROR`);

export const selectServices = (state) => (state.namespaceManage.services);
export const selectPaginationState = (state) => (state.namespaceManage.pagination);

const defaultState = {
  id: '',
  name: '',
  color: '',
  cluster: '',
  meta: {
    loading: {
      sections: {
        namespace: false,
        services: false,
        canManage: false,
        canEdit: false,
      },
      loadingPercent: 100,
    },
  },
  services: {
    count: 0,
    limit: 0,
    pages: 0,
    page: 0,
    items: [],
  },
  pagination: {
    page: 1,
    limit: 20,
  },
  canManage: false,
  initialValues: {},
};

export default handleActions({
  [initialise]: () => ({
    ...defaultState,
  }),
  [FETCH_NAMESPACE_REQUEST]: (state) => ({
    ...state,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'namespace', true),
    },
  }),
  [FETCH_NAMESPACE_SUCCESS]: (state, { payload: { data } }) => ({
    ...state,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'namespace', false),
    },
    id: data.id,
    name: data.name,
    cluster: data.cluster.name,
    color: data.color || data.cluster.color,
  }),
  [FETCH_NAMESPACE_ERROR]: (state, { payload }) => ({
    ...state,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'namespace', false),
      error: payload.error,
    },
  }),
  [FETCH_SERVICES_NAMESPACE_STATUS_REQUEST]: (state) => ({
    ...state,
    services: defaultState.services,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'services', true),
    },
  }),
  [FETCH_SERVICES_NAMESPACE_STATUS_SUCCESS]: (state, { payload }) => ({
    ...state,
    services: payload.data,
    initialValues: {
      services: payload.data.items,
    },
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'services', false),
    },
  }),
  [FETCH_SERVICES_NAMESPACE_STATUS_ERROR]: (state, { payload }) => ({
    ...state,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'services', false),
      error: payload.error,
    },
  }),
  [updateServiceStatusSuccess]: (state, { payload }) => ({
    ...state,
    services: payload.data,
    initialValues: {
      services: payload.data.items,
    },
  }),
  [combineActions(fetchServicesPagination, setPagination)]: (state, { payload }) => ({
    ...state,
    pagination: {
      page: payload.page || defaultState.pagination.page,
      limit: payload.limit || defaultState.pagination.limit,
    },
  }),
  [canManageRequest]: (state) => ({
    ...state,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'canManage', true),
    }
  }),
  [setCanManage]: (state, { payload }) => ({
    ...state,
    canManage: payload,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'canManage', false),
    },
  }),
  [canEditRequest]: (state) => ({
    ...state,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'canEdit', true),
    }
  }),
  [setCanEdit]: (state, { payload }) => ({
    ...state,
    canEdit: payload,
    meta: {
      ...state.meta,
      loading: computeLoading(state.meta.loading, 'canEdit', false),
    },
  }),
}, defaultState);
