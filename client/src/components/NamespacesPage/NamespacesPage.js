import React, { Component } from 'react';
import PropTypes from 'prop-types';

import NamespacesTable from '../NamespacesTable';

class NamespacesPage extends Component {

  componentDidMount() {
    this.props.fetchNamespaces();
  }

  render() {
    const { namespaces, fetchNamespaces } = this.props;

    return (
      <div className='row'>
        <div className='col-12'>
          <NamespacesTable namespaces={namespaces.data} loading={namespaces.meta.loading} error={namespaces.meta.error} fetchNamespaces={fetchNamespaces} />
        </div>
      </div>
    );
  }
}

NamespacesPage.propTypes = {
  namespaces: PropTypes.object,
};

export default NamespacesPage;
