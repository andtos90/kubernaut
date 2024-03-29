import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import TablePagination from '../TablePagination';
import { Ago } from '../DisplayDate';
import { AccountLink, RegistryLink, ServiceLink } from '../Links';
import TableFilter, { CreateQuickFilters } from '../TableFilter';

class ServicesTable extends Component {

  render() {
    const {
      error = null,
      loading = false,
      services = {},
      fetchServices,
      toggleSort,
      sort,
      filterActions
    } = this.props;

    const errorTableBody = () =>
      <tbody >
        <tr>
          <td colSpan='5'>Error loading services</td>
        </tr>
      </tbody>
    ;

    const loadingTableBody = () =>
      <tbody>
        <tr>
          <td colSpan='5'>Loading services…</td>
        </tr>
      </tbody>
    ;

    const emptyTableBody = () =>
      <tbody>
        <tr>
          <td colSpan='5'>There are no services</td>
        </tr>
      </tbody>
    ;

    const { QuickFilters } = CreateQuickFilters(filterActions.addFilter);

    const servicesTableBody = () =>
      <tbody>
      {
        services.items.map(service => (
          <tr key={service.id}>
            <td className="cellFilterActionsParent">
              <ServiceLink service={service} />
              <QuickFilters value={service.name} column='name' />
            </td>
            <td className="cellFilterActionsParent">
              <RegistryLink registry={service.registry} />
              <QuickFilters value={service.registry.name} column='registry' />
            </td>
            <td><span><Ago date={service.createdOn} /></span></td>
            <td className="cellFilterActionsParent">
              <AccountLink account={service.createdBy} />
              <QuickFilters value={service.createdBy.displayName} column='createdBy' />
            </td>
          </tr>
        ))
      }
      </tbody>
    ;

    const arrowClass = sort.order === 'asc' ? 'arrow-up' : 'arrow-down';
    const arrowEl = <i className={`fa fa-${arrowClass}`} aria-hidden='true'></i>;
    const sortIcons = {
      name: sort.column === 'name' ? arrowEl : null,
      registry: sort.column === 'registry' ? arrowEl : null,
      createdOn: sort.column === 'createdOn' ? arrowEl : null,
      createdBy: sort.column === 'createdBy' ? arrowEl : null,
    };

    return (
      <div>
        <TableFilter
          formPrefix="services"
          statePath="services.filter"
          columns={[
            { value: 'name', display: 'Service' },
            { value: 'registry', display: 'Registry' },
            { value: 'createdBy', display: 'Created By' },
          ]}
          {...filterActions}
        />
        <Table hover size="sm">
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')}>Service {sortIcons['name']}</th>
              <th onClick={() => toggleSort('registry')}>Registry {sortIcons['registry']}</th>
              <th onClick={() => toggleSort('createdOn')}>Created {sortIcons['createdOn']}</th>
              <th onClick={() => toggleSort('createdBy')}>Created By {sortIcons['createdBy']}</th>
            </tr>
          </thead>
          {
            (() => {
              if (error) return errorTableBody();
              else if (loading) return loadingTableBody();
              else if (!services.count) return emptyTableBody();
              else return servicesTableBody();
            })()
          }
        </Table>
        <TablePagination
          pages={services.pages}
          page={services.page}
          limit={services.limit}
          fetchContent={fetchServices}
        />
      </div>
    );
  }
}

ServicesTable.propTypes = {
  error: PropTypes.object,
  loading: PropTypes.bool,
  services: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    items: PropTypes.array.isRequired,
  }),
  fetchServices: PropTypes.func,
  toggleSort: PropTypes.func,
  sort: PropTypes.shape({
    column: PropTypes.string.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }),
};

export default ServicesTable;
