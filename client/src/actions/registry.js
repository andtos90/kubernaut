export const FETCH_REGISTRIES_REQUEST = 'FETCH_REGISTRIES_REQUEST';
export const FETCH_REGISTRIES_SUCCESS = 'FETCH_REGISTRIES_SUCCESS';
export const FETCH_REGISTRIES_ERROR = 'FETCH_REGISTRIES_ERROR';

export function fetchRegistries(options = { page: 1, limit: 20, quiet: false }) {
  return async (dispatch) => {
    const limit = options.limit;
    const offset = (options.page - 1) * limit;
    let data = { limit, offset, count: 0, items: [] };
    dispatch({ type: FETCH_REGISTRIES_REQUEST, data, loading: true });

    try {
      const url = `/api/registries?limit=${limit}&offset=${offset}`;
      const res = await fetch(url, { method: 'GET', timeout: options.timeout, credentials: 'same-origin' });
      if (res.status >= 400) throw new Error(`${url} returned ${res.status} ${res.statusText}`);
      data = await res.json();
    } catch(error) {
      if (options.quiet !== true) console.error(error); // eslint-disable-line no-console
      return dispatch({ type: FETCH_REGISTRIES_ERROR, data, error });
    }

    return dispatch({ type: FETCH_REGISTRIES_SUCCESS, data });
  };
}
