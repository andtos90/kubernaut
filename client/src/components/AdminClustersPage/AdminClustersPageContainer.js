import { connect } from 'react-redux';
import {
  reduxForm,
} from 'redux-form';
import AdminClustersPage from './AdminClustersPage';
import {
  fetchClustersPagination,
  openModal,
  closeModal,
  submitForm,
  triggerExport,
} from '../../modules/clusters';

function mapStateToProps(state, props) {
  const { account } = state;
  return {
    clusters: {
      data: state.clusters.data,
      meta: state.clusters.meta,
    },
    canCreate: state.clusters.canWrite,
    initialValues: state.clusters.initialValues,
    newModalOpen: state.clusters.newModalOpen,
    submitForm,
    canAudit: account && account.permissions && account.permissions['audit-read'],
    hasClustersWrite: account && account.permissions && account.permissions['clusters-write'],
    hasIngressAdminWrite: account && account.permissions && account.permissions['ingress-admin'],
  };
}

export default connect(mapStateToProps, {
  fetchClustersPagination,
  openModal,
  closeModal,
  triggerExport,
})(reduxForm({
  form: 'newCluster',
  enableReinitialize: true,
  destroyOnUnmount: false,
})(AdminClustersPage));
