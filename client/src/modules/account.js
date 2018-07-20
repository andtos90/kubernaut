import { createAction, handleActions } from 'redux-actions';
const actionsPrefix = `KUBERNAUT/ACCOUNT`;
export const fetchAccountInfo = createAction(`${actionsPrefix}/FETCH_ACCOUNT_INFO`);
export const FETCH_ACCOUNT_REQUEST = createAction(`${actionsPrefix}/FETCH_ACCOUNT_REQUEST`);
export const FETCH_ACCOUNT_SUCCESS = createAction(`${actionsPrefix}/FETCH_ACCOUNT_SUCCESS`);
export const FETCH_ACCOUNT_ERROR = createAction(`${actionsPrefix}/FETCH_ACCOUNT_ERROR`);

const defaultState = {
  data: {

  },
  meta: {},
};

export default handleActions({
  [FETCH_ACCOUNT_REQUEST]: () => ({
    ...defaultState,
    meta: {
      loading: true,
    },
  }),
  [FETCH_ACCOUNT_SUCCESS]: (state, { payload }) => ({
    ...state,
    data: payload.data,
    meta: {
      loading: false,
    },
  }),
  [FETCH_ACCOUNT_ERROR]: (state, { payload }) => ({
    ...state,
    meta: {
      error: payload.error,
      loading: false,
    },
  }),
}, defaultState);