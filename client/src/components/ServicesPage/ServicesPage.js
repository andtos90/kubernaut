import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ServicesTable from '../ServicesTable';

class ServicesPage extends Component {

  render() {
    const {
      services,
      fetchServicesPagination,
      toggleSort,
      sort,
      ...filterActions
    } = this.props;

    return (
      <div className='row page-frame'>
        <div className='col-sm'>
          <ServicesTable
            services={services.data}
            loading={services.meta.loading}
            error={services.meta.error}
            fetchServices={fetchServicesPagination}
            toggleSort={toggleSort}
            sort={sort}
            filterActions={filterActions}
          />
        </div>
      </div>
    );
  }
}

ServicesPage.propTypes = {
  services: PropTypes.object,
};

export default ServicesPage;
