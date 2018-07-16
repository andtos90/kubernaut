import { all } from 'redux-saga/effects';

import accountsSagas from './accounts';
import deploySagas from './deploy';
import dploymentSagas from './deployment';
import deploymentsSagas from './deployments';
import namespaceSagas from './namespace';
import namespacesSagas from './namespaces';
import registriesSagas from './registries';
import releasesSagas from './releases';
import serviceSagas from './service';

export default function* rootSaga() {
  yield all([
    ...accountsSagas,
    ...deploySagas,
    ...dploymentSagas,
    ...deploymentsSagas,
    ...namespaceSagas,
    ...namespacesSagas,
    ...registriesSagas,
    ...releasesSagas,
    ...serviceSagas,
  ]);
}
