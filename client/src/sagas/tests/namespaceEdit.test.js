import { put, call, all, select } from 'redux-saga/effects';
import { SubmissionError } from 'redux-form';
import { push } from 'connected-react-router';
import {
  initFormSaga,
  fetchClustersSaga,
  fetchNamespaceInfoSaga,
  editNamespaceSaga,
  checkPermissionSaga,
} from '../namespaceEdit';

import {
  initForm,
  submitForm,
  selectNamespaceId,
  FETCH_NAMESPACE_REQUEST,
  FETCH_NAMESPACE_SUCCESS,
  FETCH_NAMESPACE_ERROR,
  FETCH_CLUSTERS_REQUEST,
  FETCH_CLUSTERS_SUCCESS,
  FETCH_CLUSTERS_ERROR,
  canEditRequest,
  setCanEdit,
  canManageRequest,
  setCanManage,
} from '../../modules/namespaceEdit';

import {
  getNamespace, getClusters, editNamespace, hasPermissionOn,
} from '../../lib/api';

describe('NamespaceEdit sagas', () => {
  it('should initialise the form', () => {
    const initAction = initForm({ match: {} });
    const gen = initFormSaga(initForm(initAction));
    expect(gen.next().value).toMatchObject(all([
      call(checkPermissionSaga, initForm(initAction)),
      call(fetchNamespaceInfoSaga, initForm(initAction)),
      call(fetchClustersSaga, initForm(initAction)),
    ]));
  });

  const namespaceId = 'abc';
  const initPayload = { match: { params: { namespaceId } }, quiet: true };

  it('should fetch namespace info', () => {
    const namespaceData = { name: 'bob', id: namespaceId, attributes: {} };

    const gen = fetchNamespaceInfoSaga(initForm(initPayload));
    expect(gen.next().value).toMatchObject(put(FETCH_NAMESPACE_REQUEST()));
    expect(gen.next().value).toMatchObject(call(getNamespace, namespaceId));
    expect(gen.next(namespaceData).value).toMatchObject(put(FETCH_NAMESPACE_SUCCESS({ data: namespaceData } )));
    expect(gen.next().done).toBe(true);
  });

  it('should tolerate errors fetching namespace info', () => {
    const error = new Error('ouch');
    const gen = fetchNamespaceInfoSaga(initForm(initPayload));
    expect(gen.next().value).toMatchObject(put(FETCH_NAMESPACE_REQUEST()));
    expect(gen.next().value).toMatchObject(call(getNamespace, namespaceId));
    expect(gen.throw(error).value).toMatchObject(put(FETCH_NAMESPACE_ERROR({ error: error.message })));
    expect(gen.next().done).toBe(true);
  });

  it('should fetch clusters info', () => {
    const clustersData = { items: [1,2,3] };

    const gen = fetchClustersSaga(initForm(initPayload));
    expect(gen.next().value).toMatchObject(put(FETCH_CLUSTERS_REQUEST()));
    expect(gen.next().value).toMatchObject(call(getClusters));
    expect(gen.next(clustersData).value).toMatchObject(put(FETCH_CLUSTERS_SUCCESS({ data: clustersData } )));
    expect(gen.next().done).toBe(true);
  });

  it('should tolerate errors fetching clusters info', () => {
    const error = new Error('ouch');
    const gen = fetchClustersSaga(initForm(initPayload));
    expect(gen.next().value).toMatchObject(put(FETCH_CLUSTERS_REQUEST()));
    expect(gen.next().value).toMatchObject(call(getClusters));
    expect(gen.throw(error).value).toMatchObject(put(FETCH_CLUSTERS_ERROR({ error: error.message })));
    expect(gen.next().done).toBe(true);
  });

  it('should submit form values', () => {
    const options = { quiet: true };
    const uuid = 'abc-123';
    const gen = editNamespaceSaga(submitForm.request({}), options);
    expect(gen.next().value).toMatchObject(select(selectNamespaceId));
    expect(gen.next(uuid).value).toMatchObject(call(editNamespace, uuid, {}, options));
    expect(gen.next().value).toMatchObject(put(submitForm.success()));
    expect(gen.next().value).toMatchObject(put(push(`/namespaces/${uuid}`)));
    expect(gen.next().done).toBe(true);
  });

  it('should handle failures submitting form values', () => {
    const options = { quiet: true };
    const error = new Error('ouch');
    const formError = new SubmissionError({ _error: error.message });
    const gen = editNamespaceSaga(submitForm.request({}), options);
    expect(gen.next().value).toMatchObject(select(selectNamespaceId));
    expect(gen.next('uuid').value).toMatchObject(call(editNamespace, 'uuid', {}, options));
    expect(gen.throw(error).value).toMatchObject(put(submitForm.failure(formError)));
    expect(gen.next().done).toBe(true);
  });

  describe('check permission', () => {
    const initPayload = { match: { params: { namespaceId } }, quiet: true };

    it('fetches and sets permission information', () => {
      const gen = checkPermissionSaga(initForm(initPayload));
      expect(gen.next().value).toMatchObject(put(canEditRequest()));
      expect(gen.next().value).toMatchObject(put(canManageRequest()));
      expect(gen.next().value).toMatchObject(call(hasPermissionOn, 'namespaces-write', 'namespace', namespaceId));
      expect(gen.next({ answer: true }).value).toMatchObject(call(hasPermissionOn, 'namespaces-manage', 'namespace', namespaceId));
      expect(gen.next({ answer: true }).value).toMatchObject(put(setCanEdit(true)));
      expect(gen.next().value).toMatchObject(put(setCanManage(true)));
      expect(gen.next().done).toBe(true);
    });
  });
});
