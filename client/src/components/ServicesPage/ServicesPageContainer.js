import { connect } from 'react-redux';
import {
  fetchServicesPagination,
  toggleSort,
  initialise,
  addFilter,
  removeFilter,
  search,
  clearSearch,
  showFilters,
  hideFilters,
} from '../../modules/services';

import ServicesPage from './ServicesPage';

function mapStateToProps(state, props) {
  return {
    services: {
      data: state.services.data,
      meta: state.services.meta,
    },
    sort: state.services.sort,
  };
}

const mapDispatchToProps = {
  fetchServicesPagination,
  toggleSort,
  initialise,
  addFilter,
  removeFilter,
  search,
  clearSearch,
  showFilters,
  hideFilters,
};

export default connect(mapStateToProps, mapDispatchToProps)(ServicesPage);
