import { connect } from 'react-redux';
import {
  fetchDeploymentsPagination,
  toggleSort,
  addFilter,
  removeFilter,
  search,
  clearSearch,
  showFilters,
  hideFilters,
} from '../../modules/deployments';

import DeploymentsPage from './DeploymentsPage';

function mapStateToProps(state, props) {
  return {
    deployments: {
      data: state.deployments.data,
      meta: state.deployments.meta,
    },
    sort: state.deployments.sort,
  };
}

const mapDispatchToProps = {
  fetchDeploymentsPagination,
  toggleSort,
  addFilter,
  removeFilter,
  search,
  clearSearch,
  showFilters,
  hideFilters,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    areStatesEqual: (next, prev) => (
      next.deployments.data === prev.deployments.data &&
      next.deployments.meta === prev.deployments.meta &&
      next.deployments.sort === prev.deployments.sort
    )
  }
)(DeploymentsPage);
