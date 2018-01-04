import React, { Component, } from 'react';
import { Pagination, } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { Human, Ago, } from '../DisplayDate';
import './DeploymentsTable.css';

class DeploymentsTable extends Component {

  render() {
    const { error = null, loading = false, deployments = {}, fetchDeployments, } = this.props;

    const handleSelectPage = (page) => {
      fetchDeployments({ page, limit: deployments.limit, });
    };

    const pagination = () =>
      <div className='text-center'>
        <Pagination
          className='deployments-table-pagination'
          items={deployments.pages}
          activePage={deployments.currentPage}
          onSelect={handleSelectPage}
        />
      </div>
    ;

    const noPagination = () =>
      <div className='text-center'>
        <Pagination
          className='deployments-table-pagination invisible'
          items={1}
        />
      </div>
    ;

    const errorTableBody = () =>
      <tbody className='deployments-table__body deployments-table__body--error'>
        <tr className='deployments-table__body__row'>
          <td className='deployments-table__body__row__info' colSpan='4'>Error loading deployments</td>
        </tr>
      </tbody>
    ;

    const loadingTableBody = () =>
      <tbody className='deployments-table__body deployments-table__body--loading'>
        <tr className='deployments-table__body__row'>
          <td className='deployments-table__body__row__info' colSpan='4'>Loading deployments…</td>
        </tr>
      </tbody>
    ;

    const emptyTableBody = () =>
      <tbody className='deployments-table__body deployments-table__body--empty'>
        <tr className='deployments-table__body__row'>
          <td className='deployments-table__body__row__info' colSpan='4'>There are no deployments</td>
        </tr>
      </tbody>
    ;

    const DeploymentsTableBody = () =>
      <tbody className='deployments-table__body deployments-table__body--data'>
      {
        deployments.items.map(deployment => {
          return <tr className='deployments-table__body__row' key={deployment.id} id={deployment.id} >
            <td className='deployments-table__body__row__created'>
              <span className="deployments-table__body__row__created__on"><Human date={deployment.createdOn} /></span>
              <span className="deployments-table__body__row__created__ago"><Ago date={deployment.createdOn} /></span>
            </td>
            <td className='deployments-table__body__row__namespace-name'>{deployment.release.service.namespace.name}</td>
            <td className='deployments-table__body__row__service-name'>{deployment.release.service.name}</td>
            <td className='deployments-table__body__row__version'>{deployment.release.version}</td>
            <td className='deployments-table__body__row__context'>{deployment.context}</td>
          </tr>;
        })
      }
      </tbody>
    ;


    return (
      <div>
        {
          (() => {
            if (deployments.count > deployments.limit) return pagination();
            else return noPagination();
          })()
        }
        <table className='deployments-table table table-condensed table-hover'>
          <thead className='deployments-table__heading'>
            <tr>
              <th className='deployments-table__heading__created'>Created</th>
              <th className='deployments-table__heading__namespace-name'>Namespace</th>
              <th className='deployments-table__heading__service-name'>Service</th>
              <th className='deployments-table__heading__version'>Version</th>
              <th className='deployments-table__heading__context'>Context</th>
            </tr>
          </thead>
          {
            (() => {
              if (error) return errorTableBody();
              else if (loading) return loadingTableBody();
              else if (!deployments.count) return emptyTableBody();
              else return DeploymentsTableBody();
            })()
          }
        </table>
        {
          (() => {
            if (deployments.count > deployments.limit) return pagination();
            else return noPagination();
          })()
        }
      </div>
    );
  }
}

DeploymentsTable.propTypes = {
  error: PropTypes.object,
  loading: PropTypes.bool,
  deployments: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    items: PropTypes.array.isRequired,
  }),
  fetchDeployments: PropTypes.func,
};

export default DeploymentsTable;
