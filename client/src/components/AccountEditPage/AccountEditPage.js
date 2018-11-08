import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col, Progress } from 'reactstrap';
import Title from '../Title';
import AccountNamespacesRolesForm from '../AccountNamespacesRolesForm';
import AccountRegistriesRolesForm from '../AccountRegistriesRolesForm';
import Account from '../../lib/domain/Account';

class AccountEditPage extends Component {

  render() {
    const {
      meta,
      account: accountData,
    } = this.props;
    if (meta.loading.loadingPercent !== 100) return (
      <Container>
        <Row className="d-flex justify-content-center">
          <Col sm="12" className="mt-5">
            <Progress animated color="info" value={meta.loading.loadingPercent} />
          </Col>
        </Row>
      </Container>
    );

    const account = new Account(accountData);

    return (
      <Container>
        <Title title={`Edit account: ${account.displayName}`} />
        <Row className="mt-3">
            <h4>Editing: {account.displayName}</h4>
        </Row>
        <Row>
            <p><strong>Created:</strong> {account.createdOn}</p>
        </Row>
        <Row className="mt-3">
          <Col sm="12">
            <h5>Namespaces:</h5>
            <AccountNamespacesRolesForm
              accountData={accountData}
              namespaces={this.props.namespaces}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col sm="12">
            <h5>Registries:</h5>
              <AccountRegistriesRolesForm
                accountData={accountData}
                registries={this.props.registries}
              />
          </Col>
        </Row>
      </Container>
    );
  }
}

AccountEditPage.propTypes = {
  accountId: PropTypes.string.isRequired,
  account: PropTypes.object.isRequired,
  meta: PropTypes.object.isRequired,
};

export default AccountEditPage;
