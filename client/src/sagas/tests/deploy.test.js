import { put, call, select, all } from 'redux-saga/effects';
import { SubmissionError, change, startAsyncValidation, stopAsyncValidation } from 'redux-form';
import { push } from 'connected-react-router';

import {
  fetchRegistriesSaga,
  fetchNamespacesSaga,
  triggerDeploymentSaga,
  fetchServiceSuggestionsSaga,
  useServiceSuggestionsSaga,
  clearFormFieldsSaga,
  validateServiceSaga,
  validateVersionSaga,
  fetchLatestDeploymentsPerNamespaceSaga,
  fetchSecretVersionsSaga,
  canManageSaga,
  fetchTeamForServiceSaga,
} from '../deploy';

import {
  INITIALISE,
  INITIALISE_ERROR,
  SET_LOADING,
  CLEAR_LOADING,
  SET_REGISTRIES,
  SET_NAMESPACES,
  SET_DEPLOYMENTS,
  submitForm,
  fetchServiceSuggestions,
  setServiceSuggestions,
  getDeployFormValues,
  useServiceSuggestion,
  clearServiceSuggestions,
  clearFormFields,
  validateService,
  validateVersion,
  fetchNamespacesForService,
  fetchLatestDeploymentsPerNamespace,
  setSecretVersions,
  selectNamespaces,
  FETCH_TEAM_REQUEST,
  FETCH_TEAM_SUCCESS,
  setCanManage,
} from '../../modules/deploy';

import {
  makeDeployment,
  getRegistries,
  getServiceSuggestions,
  getReleases,
  getNamespacesForService,
  getLatestDeploymentsByNamespaceForService,
  getSecretVersions,
  getLatestDeployedSecretVersion,
  getCanManageAnyNamespace,
  getTeamForService,
} from '../../lib/api';

const formValues = {
  registry: 'abc',
  service: 'abc',
  version: 'abc',
  namespace: 'abc-123',
};

describe('Deploy sagas', () => {
  it('should fetch registries for form', () => {
    const data = { items: [{ name: 'abc' }], count:  1 };
    const gen = fetchRegistriesSaga(INITIALISE({ quiet: true }));
    expect(gen.next().value).toMatchObject(put(SET_LOADING()));
    expect(gen.next().value).toMatchObject(call(getRegistries));
    expect(gen.next(data).value).toMatchObject(put(SET_REGISTRIES({ data: ['abc'] })));
    expect(gen.next().value).toMatchObject(put(CLEAR_LOADING()));
    expect(gen.next().done).toBe(true);
  });

  it('should handle errors in fetching registries', () => {
    const error = new Error('ouch');
    const gen = fetchRegistriesSaga(INITIALISE({ quiet: true }));
    expect(gen.next().value).toMatchObject(put(SET_LOADING()));
    expect(gen.next().value).toMatchObject(call(getRegistries));
    expect(gen.throw(error).value).toMatchObject(put(INITIALISE_ERROR({ error })));
    expect(gen.next().value).toMatchObject(put(CLEAR_LOADING()));
    expect(gen.next().done).toBe(true);
  });

  it('should fetch namespaces for a service to deploy to', () => {
    const data = { items: [{ name: 'abc', cluster: 'bob' }], count:  1 };
    const gen = fetchNamespacesSaga(fetchNamespacesForService({ serviceId: '1', quiet: true }));
    expect(gen.next().value).toMatchObject(call(getNamespacesForService, '1'));
    expect(gen.next(data).value).toMatchObject(put(SET_NAMESPACES({ data: data.items })));
    expect(gen.next().done).toBe(true);
  });

  it('should handle errors in fetching namespaces', () => {
    const error = new Error('ouch');
    const gen = fetchNamespacesSaga(fetchNamespacesForService({ serviceId: '1', quiet: true }));
    expect(gen.next().value).toMatchObject(call(getNamespacesForService, '1'));
    expect(gen.throw(error).value).toMatchObject(put(INITIALISE_ERROR({ error })));
    expect(gen.next().done).toBe(true);
  });

  it('should submit form values and trigger a deployment', () => {
    const options = { quiet: true };
    const namespaces = [{ id: 'abc-123', name: 'abc', cluster: { name: 'def' } }];
    const gen = triggerDeploymentSaga(submitForm.request(formValues), options);
    expect(gen.next().value).toMatchObject(select(selectNamespaces));
    expect(gen.next(namespaces).value).toMatchObject(call(makeDeployment, { ...formValues, cluster: 'def', namespace: 'abc' }, options));
    expect(gen.next({ id: 'abc' }).value).toMatchObject(put(submitForm.success()));
    expect(gen.next().value).toMatchObject(put(push('/deployments/abc')));
    expect(gen.next().done).toBe(true);
  });

  it('should handle failures submitting form values', () => {
    const options = { quiet: true };
    const namespaces = [{ id: 'abc-123', name: 'abc', cluster: { name: 'def' } }];
    const error = new Error('ouch');
    const formError = new SubmissionError({ _error: error.message });
    const gen = triggerDeploymentSaga(submitForm.request(formValues), options);
    expect(gen.next().value).toMatchObject(select(selectNamespaces));
    expect(gen.next(namespaces).value).toMatchObject(call(makeDeployment, { ...formValues, cluster: 'def', namespace: 'abc' }, options));
    expect(gen.throw(error).value).toMatchObject(put(submitForm.failure(formError)));
    expect(gen.next().done).toBe(true);
  });

  it('should fetch service name suggestions based on user input in form', () => {
    const formValues = { service: 'app-', registry: 'default' };
    const searchResults = [{ name: 'app-1' }, { name: 'app-2' }];
    const gen = fetchServiceSuggestionsSaga(fetchServiceSuggestions());
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(call(getServiceSuggestions, formValues.registry, formValues.service));
    expect(gen.next(searchResults).value).toMatchObject(put(setServiceSuggestions(['app-1', 'app-2'])));
    expect(gen.next().done).toBe(true);
  });

  it('should handle errors fetching service name suggestions', () => {
    const formValues = { service: 'app-', registry: 'default' };

    const gen = fetchServiceSuggestionsSaga(fetchServiceSuggestions({ quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(call(getServiceSuggestions, formValues.registry, formValues.service));
    gen.throw(new Error('ouch'));
    expect(gen.next().done).toBe(true);
  });

  it('should use a selected service suggestion and then clear suggestions', () => {
    const registry = 'abc';
    const gen = useServiceSuggestionsSaga(useServiceSuggestion('app-1'));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next({ registry }).value).toMatchObject(put(change('deploy', 'service', 'app-1')));
    expect(gen.next().value).toMatchObject(put(clearServiceSuggestions()));
    expect(gen.next().value).toMatchObject(put(validateService()));
    expect(gen.next().value).toMatchObject(put(fetchLatestDeploymentsPerNamespace({ service: 'app-1', registry })));
    expect(gen.next().done).toBe(true);
  });

  it('clears field data on changes', () => {
    const gen = clearFormFieldsSaga(clearFormFields({ source: 'service' }));
    // expect(gen.next().value).toMatchObject(put(clearFields('deploy', false, false, 'version', 'cluster', 'namespace', 'secret')));
    expect(gen.next().value).toMatchObject(all([
      put(change('deploy', 'version', '')),
      put(change('deploy', 'namespace', '')),
      put(change('deploy', 'secret', '')),
      put(change('deploy', 'ingress', ''))
    ]));
  });

  it('validates service field entry and error', () => {
    const formValues = { registry: 'default', service: 'abc' };
    const gen = validateServiceSaga(validateService({ quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(put(startAsyncValidation('deploy', 'service')));
    expect(gen.next().value).toMatchObject(call(getReleases, { ...formValues }));
    expect(gen.next({ count: 0 }).value).toMatchObject(put(stopAsyncValidation('deploy', { service: `'${formValues.registry}/${formValues.service}' does not exist`})));
    expect(gen.next().done).toBe(true);
  });

  it('validates service field entry when valid', () => {
    const formValues = { registry: 'default', service: 'abc' };
    const response = { count: 1, items: [{ service: { id: 'abc' } }] };
    const gen = validateServiceSaga(validateService({ quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(put(startAsyncValidation('deploy', 'service')));
    expect(gen.next().value).toMatchObject(call(getReleases, { ...formValues }));
    expect(gen.next(response).value).toMatchObject(put(stopAsyncValidation('deploy')));
    expect(gen.next().value).toMatchObject(put(fetchNamespacesForService({ serviceId: 'abc' })));
    expect(gen.next().value).toMatchObject(put(fetchLatestDeploymentsPerNamespace({ service: 'abc', registry: 'default' })));
    expect(gen.next().done).toBe(true);
  });

  it('handles and error validating service value', () => {
    const formValues = { registry: 'default', service: 'abc' };
    const gen = validateServiceSaga(validateService({ quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(put(startAsyncValidation('deploy', 'service')));
    expect(gen.next().value).toMatchObject(call(getReleases, { ...formValues }));
    expect(gen.throw(new Error('ouch')).value).toMatchObject(put(stopAsyncValidation('deploy', { service: 'There was an error looking up services' })));
    expect(gen.next().done).toBe(true);
  });

  it('validates version field entry and error', () => {
    const newValue = '1';
    const formValues = { registry: 'default', service: 'abc' };
    const gen = validateVersionSaga(validateVersion({ newValue, quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(put(startAsyncValidation('deploy', 'version')));
    expect(gen.next().value).toMatchObject(call(getReleases, { ...formValues, version: newValue }));
    expect(gen.next({ count: 0 }).value).toMatchObject(put(stopAsyncValidation('deploy', { version: `'${formValues.registry}/${formValues.service}@${newValue}' does not exist`})));
    expect(gen.next().done).toBe(true);
  });

  it('validates version field entry when valid', () => {
    const newValue = '1';
    const formValues = { registry: 'default', service: 'abc' };
    const gen = validateVersionSaga(validateVersion({ newValue, quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(put(startAsyncValidation('deploy', 'version')));
    expect(gen.next().value).toMatchObject(call(getReleases, { ...formValues, version: newValue }));
    expect(gen.next({ count: 1 }).value).toMatchObject(put(stopAsyncValidation('deploy')));
    expect(gen.next().done).toBe(true);
  });

  it('handles and error validating version value', () => {
    const newValue = '1';
    const formValues = { registry: 'default', service: 'abc' };
    const gen = validateVersionSaga(validateVersion({ newValue, quiet: true }));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next(formValues).value).toMatchObject(put(startAsyncValidation('deploy', 'version')));
    expect(gen.next().value).toMatchObject(call(getReleases, { ...formValues, version: newValue }));
    expect(gen.throw(new Error('ouch')).value).toMatchObject(put(stopAsyncValidation('deploy', { version: 'There was an error looking up versions' })));
    expect(gen.next().done).toBe(true);
  });

  it('fetches current deployment information for a service', () => {
    const service = 'abc';
    const registry = '123';
    const data = { a: 1 };
    const gen = fetchLatestDeploymentsPerNamespaceSaga(fetchLatestDeploymentsPerNamespace({ service, registry, quiet: true}));
    expect(gen.next().value).toMatchObject(call(getLatestDeploymentsByNamespaceForService, { registry, service }));
    expect(gen.next(data).value).toMatchObject(put(SET_DEPLOYMENTS({ data })));
    expect(gen.next().done).toBe(true);
  });

  it('fetches secret version data', () => {
    const payload = { registry: 'default', service: 'bob', version: '123', namespaceId: 'abcdef' };

    const gen = fetchSecretVersionsSaga(payload);
    expect(gen.next().value).toMatchObject(call(getSecretVersions, 'default', 'bob', 'abcdef'));
    expect(gen.next({a:1}).value).toMatchObject(put(setSecretVersions({a:1})));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next({}).value).toMatchObject(call(getLatestDeployedSecretVersion, 'default', 'bob', '123', 'abcdef'));
    expect(gen.next().done).toBe(true);
  });

  it('fetches secret version data & sets latest deployed version of secret', () => {
    const payload = { registry: 'default', service: 'bob', version: '123', namespaceId: 'abcdef' };

    const gen = fetchSecretVersionsSaga(payload);
    expect(gen.next().value).toMatchObject(call(getSecretVersions, 'default', 'bob', 'abcdef'));
    expect(gen.next({a:1}).value).toMatchObject(put(setSecretVersions({a:1})));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next({}).value).toMatchObject(call(getLatestDeployedSecretVersion, 'default', 'bob', '123', 'abcdef'));
    expect(gen.next({ id: 'abcd' }).value).toMatchObject(put(change('deploy', 'secret', 'abcd')));
    expect(gen.next().done).toBe(true);
  });

  it('fetches secret version data & uses existing form value', () => {
    const payload = { registry: 'default', service: 'bob', version: '123', namespaceId: 'abcdef' };

    const gen = fetchSecretVersionsSaga(payload);
    expect(gen.next().value).toMatchObject(call(getSecretVersions, 'default', 'bob', 'abcdef'));
    expect(gen.next({a:1}).value).toMatchObject(put(setSecretVersions({a:1})));
    expect(gen.next().value).toMatchObject(select(getDeployFormValues));
    expect(gen.next({ secret: 'abcd' }).done).toBe(true);
  });

  describe('Can manage', () => {
    it('should fetch and set can manage status', () => {
      const gen = canManageSaga({});
      expect(gen.next().value).toMatchObject(call(getCanManageAnyNamespace));
      expect(gen.next({ answer: true }).value).toMatchObject(put(setCanManage(true)));
    });
  });

  describe('Team', () => {
    it('should fetch team info for a service', () => {
      const registry = 'default';
      const service = 'bob';
      const team = { name: 'abc', services: [{ name: service }]};

      const gen = fetchTeamForServiceSaga({ payload: { registry, service } });
      expect(gen.next().value).toMatchObject(put(FETCH_TEAM_REQUEST()));
      expect(gen.next().value).toMatchObject(call(getTeamForService, { registry, service}));
      expect(gen.next(team).value).toMatchObject(put(FETCH_TEAM_SUCCESS({ data: team })));
    });
  });
});
