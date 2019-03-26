import { connect } from 'react-redux';
import {
  reduxForm,
  getFormValues,
  getFormAsyncErrors,
} from 'redux-form';

import {
  submitForm,
  fetchServiceSuggestions,
  useServiceSuggestion,
  clearFormFields,
  validateService,
  validateVersion,
  fetchSecretVersions,
} from '../../modules/deploy';
import DeployPage from './DeployPage';

const formName = 'deploy';

const mapStateToProps = (state, props) => {
  const { deploy } = state;
  const currentFormValues = getFormValues(formName)(state) || {};
  const currentFormAsyncErrors = getFormAsyncErrors(formName)(state) || {};

  return {
    initialValues: deploy.initialValues,
    registries: deploy.registries,
    namespacesRich: deploy.namespaces,
    meta: deploy.meta,
    registrySelected: !!currentFormValues.registry,
    serviceSelected: (!!currentFormValues.service && !currentFormAsyncErrors.service),
    namespaceSelected: !!currentFormValues.namespace,
    submitForm,
    serviceSuggestions: deploy.serviceSuggestions,
    deployments: deploy.deployments,
    currentFormValues,
    secretVersions: deploy.secretVersions,
  };
};

export default connect(mapStateToProps, {
  fetchServiceSuggestions,
  useServiceSuggestion,
  clearFormFields,
  validateService,
  validateVersion,
  fetchSecretVersions,
})(reduxForm({
  form: formName,
  enableReinitialize: true,
  destroyOnUnmount: false,
})(DeployPage));
