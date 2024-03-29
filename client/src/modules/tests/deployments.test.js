import filterTests from './lib/filterTests';
import reduce, * as allExports  from '../deployments';
const {
  FETCH_DEPLOYMENTS_REQUEST,
  FETCH_DEPLOYMENTS_SUCCESS,
  FETCH_DEPLOYMENTS_ERROR,
} = allExports;

describe('Deployments Reducer', () => {

  it('should indicate when deployments are loading', () => {
    const state = reduce(undefined, FETCH_DEPLOYMENTS_REQUEST());
    expect(state.data).toMatchObject({});
    expect(state.meta).toMatchObject({ loading: true });
  });

  it('should update state when deployments have loaded', () => {
    const initialState = {
      data: {},
      meta: {
        loading: true,
      },
    };
    const state = reduce(initialState, FETCH_DEPLOYMENTS_SUCCESS({ data: { limit: 50, offset: 0, count: 3, items: [1, 2, 3] }}));
    expect(state.data.limit).toBe(50);
    expect(state.data.offset).toBe(0);
    expect(state.data.count).toBe(3);
    expect(state.data.items).toMatchObject([1, 2, 3]);
    expect(state.meta).toMatchObject({ loading: false });
  });

  it('should update state when deployments have errored', () => {
    const initialState = {
      data: [],
      meta: {
        loading: true,
      },
    };
    const state = reduce(initialState, FETCH_DEPLOYMENTS_ERROR({ error: 'Oh Noes' }));
    expect(state.data).toMatchObject(initialState.data);
    expect(state.meta).toMatchObject({ error: 'Oh Noes' });
  });

  filterTests(allExports);
});
