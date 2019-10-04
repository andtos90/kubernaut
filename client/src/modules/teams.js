import { createAction, handleActions } from 'redux-actions';

const actionsPrefix = 'KUBERNAUT/TEAMS';
export const fetchTeamsPagination = createAction(`${actionsPrefix}/FETCH_TEAMS_PAGINATION`);
export const FETCH_TEAMS_REQUEST = createAction(`${actionsPrefix}/FETCH_TEAMS_REQUEST`);
export const FETCH_TEAMS_SUCCESS = createAction(`${actionsPrefix}/FETCH_TEAMS_SUCCESS`);
export const FETCH_TEAMS_ERROR = createAction(`${actionsPrefix}/FETCH_TEAMS_ERROR`);

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
};

export default handleActions({
  [FETCH_TEAMS_REQUEST]: () => ({
    ...defaultState,
    meta: {
      loading: true,
    },
  }),
  [FETCH_TEAMS_SUCCESS]: (state, { payload }) => ({
    ...state,
    data: payload.data,
    meta: {
      loading: false,
    },
  }),
  [FETCH_TEAMS_ERROR]: (state, { payload }) => ({
    ...state,
    meta: {
      error: payload.error,
      loading: false,
    },
  }),
}, defaultState);
