import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ServiceReleaseHistory from '../ServiceReleaseHistory';

class ServiceDetailsPage extends Component {
  componentDidMount() {
    this.props.fetchReleasesForService({
      registry: this.props.registryName,
      service: this.props.serviceName,
    });
  }

  render() {
    return (
      <div>
        <h4>{this.props.registryName}/{this.props.serviceName}</h4>
        <div>
          <h6>Releases</h6>
          <ServiceReleaseHistory releases={this.props.releasesList} />
        </div>
      </div>
    );
  }
}

ServiceDetailsPage.propTypes = {
  registryName: PropTypes.string.isRequired,
  serviceName: PropTypes.string.isRequired,
  releasesList: PropTypes.object
};

export default ServiceDetailsPage;
