import reduce, {
  initServiceManage,
  updateServiceStatusSuccess,
  FETCH_SERVICE_REQUEST,
  FETCH_SERVICE_SUCCESS,
  FETCH_SERVICE_ERROR,
  FETCH_SERVICE_NAMESPACES_STATUS_REQUEST,
  FETCH_SERVICE_NAMESPACES_STATUS_SUCCESS,
  FETCH_SERVICE_NAMESPACES_STATUS_ERROR,
  canManageRequest,
  setCanManage,
  FETCH_TEAM_REQUEST,
  FETCH_TEAM_SUCCESS,
  setCanManageTeamForService,
  setManageableTeams,
  canDeleteRequest,
  setCanDelete,
} from '../serviceManage';

describe('ServiceManage reducer', () => {
  it('should initialise page data with default state', () => {
    const defaultState = reduce(undefined, {});
    const state = reduce(undefined, initServiceManage());
    expect(state).toMatchObject(defaultState);
  });

  it('should indicate when service is loading', () => {
    const state = reduce(undefined, FETCH_SERVICE_REQUEST());
    expect(state.meta).toMatchObject({ loading: { sections: { service: true } } });
  });

  it('should update state when service has loaded', () => {
    const initialState = reduce(undefined, {});
    const serviceData = {
      id: '123',
      registry: { name: 'abc' },
      name: 'def',
    };

    const state = reduce(initialState, FETCH_SERVICE_SUCCESS({ data: serviceData }));
    expect(state.id).toBe(serviceData.id);
    expect(state.registry).toBe(serviceData.registry.name);
    expect(state.serviceName).toBe(serviceData.name);
    expect(state.meta).toMatchObject({ loading: { sections: { service: false } } });
  });

  it('should update state when service has errored', () => {
    const initialState = {
      meta: {
        loading: {
          sections: { service: true },
        },
      },
    };
    const state = reduce(initialState, FETCH_SERVICE_ERROR({ error: 'Oh Noes' }));
    expect(state.meta).toMatchObject({
      loading: {
        sections: {
          service: false,
        },
      },
      error: 'Oh Noes',
    });
  });

  it('should set relevant loading state when requesting namespaces', () => {
    const state = reduce(undefined, FETCH_SERVICE_NAMESPACES_STATUS_REQUEST());
    expect(state.meta.loading).toMatchObject({
      sections: { namespaces: true },
    });
  });

  it('should update state when namespaces have loaded', () => {
    const data = { limit: 50, offset: 0, count: 3, items: [1, 2, 3] };
    const state = reduce(undefined, FETCH_SERVICE_NAMESPACES_STATUS_SUCCESS({ data }));
    expect(state.namespaces).toBe(data);
    expect(state.initialValues).toMatchObject({ namespaces: data.items });
    expect(state.meta.loading).toMatchObject({
      sections: { namespaces: false },
    });
  });

  it('should update state when services have errored', () => {
    const state = reduce(undefined, FETCH_SERVICE_NAMESPACES_STATUS_ERROR({ error: 'Oh Noes' }));
    expect(state.meta).toMatchObject({
      loading: {
        sections: {
          namespaces: false,
        },
      },
      error: 'Oh Noes',
    });
  });

  it('should update namespaces data on success of updating status', () => {
    const data = { limit: 50, offset: 0, count: 3, items: [1, 2, 3] };
    const state = reduce(undefined, updateServiceStatusSuccess({ data }));
    expect(state.namespaces).toBe(data);
    expect(state.initialValues).toMatchObject({ namespaces: data.items });
    expect(state.meta.loading).toMatchObject({
      sections: { namespaces: false },
    });
  });

  it('should indicate when authorisation is loading', () => {
    const state = reduce(undefined, canManageRequest());
    expect(state.meta).toMatchObject({ loading: { sections: { canManage: true } } });
  });

  it('should set canManage in state', () => {
    const state = reduce(undefined, setCanManage(true));
    expect(state.canManage).toBe(true);
  });

  it('should indicate when canDelete is loading', () => {
    const state = reduce(undefined, canDeleteRequest());
    expect(state.meta).toMatchObject({ loading: { sections: { canDelete: true } } });
  });

  it('should set canDelete in state', () => {
    const state = reduce(undefined, setCanDelete(true));
    expect(state.canDelete).toBe(true);
  });

  it('should initialise team state', () => {
    const initialState = {
      team: {
        name: 'bob',
      },
      meta: {
        loading: {
          sections: { team: false },
        },
      },
    };

    const state = reduce(initialState, FETCH_TEAM_REQUEST());
    expect(state.team).toMatchObject({
      name: '',
    });
    expect(state.meta).toMatchObject({
      loading: {
        sections: {
          team: true,
        },
      },
    });
  });

  it('should set team state', () => {
    const initialState = reduce(reduce({}, initServiceManage()), FETCH_TEAM_REQUEST());
    const team = {
      name: 'abc',
      services: [{ a: 1 }],
    };

    const state = reduce(initialState, FETCH_TEAM_SUCCESS({ data: team }));
    expect(state.team).toMatchObject({
      name: team.name,
      services: team.services,
    });
    expect(state.meta.loading.sections.team).toBe(false);
  });

  it('should set canManageTeamForService in state', () => {
    const state = reduce(undefined, setCanManageTeamForService(true));
    expect(state.canManageTeamForService).toBe(true);
  });

  it('should update when manageable teams are set', () => {
    const data = [1,2,3];
    const state = reduce({ team: { id: 'abc' } }, setManageableTeams(data));
    expect(state.manageableTeams).toMatchObject(data);
    expect(state.initialValues.team).toBe('abc');
  });
});
