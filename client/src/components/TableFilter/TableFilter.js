import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Field } from 'redux-form';
import { Row, Col, Form, FormGroup, Button, Badge, Label } from 'reactstrap';
import RenderInput from '../RenderInput';
import RenderSelect from '../RenderSelect';

class TableFilter extends Component {
  constructor(props) {
    super(props);

    this.filterSearchInput = React.createRef();
  }

  componentDidMount() {
    this.filterSearchInput.current.getRenderedComponent().focusInput();
  }


  render() {
    if (!this.props.show) return (
      <Row className="mb-2 py-2">
        <Col xs="12">
          <Row className="mb-2">
            <Col sm={{ size: 1, offset: 11 }}>
              <Button
                color="light"
                onClick={() => this.props.showFilters()}
              >Filter
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    );

    return (
      <Row className="mb-2 border py-2">
        <Col xs="12">
          <Row className="mb-2 justify-content-between no-gutters">
            <Col sm="11" xs="10">
              <Form inline>
                <FormGroup className="mb-sm-1">
                  <Field
                    name="searchVal"
                    component={RenderInput}
                    className="form-control"
                    autoComplete="foo-no-really"
                    label="Search"
                    type="text"
                    forwardRef
                    ref={this.filterSearchInput}
                  />
                </FormGroup>
                <FormGroup className="mr-2 mb-sm-1">
                  <Field
                    name="column"
                    component={RenderSelect}
                    className="form-control"
                    options={this.props.columns}
                  />
                </FormGroup>
                <FormGroup className="mr-4 mb-sm-1">
                  <Label for="exact" className="mr-sm-2">Exact</Label>
                  <Field
                    name="exact"
                    component="input"
                    type="checkbox"
                    className="form-control"
                  />
                </FormGroup>
                <FormGroup className="mr-4 mb-sm-1">
                  <Label for="not" className="mr-sm-2">Not</Label>
                  <Field
                    name="not"
                    component="input"
                    type="checkbox"
                    className="form-control"
                  />
                </FormGroup>
                <Button
                  color="dark"
                  type="submit"
                  className="mr-2 mb-sm-1"
                  onClick={this.props.handleSubmit((values) => {
                    if (!values.searchVal) return this.props.clearSearch();
                    this.props.search(values);
                  })}
                >Search</Button>
                <Button
                  outline
                  className="mr-2 mb-sm-1"
                  color="dark"
                  onClick={this.props.handleSubmit((values) => this.props.addFilter({
                    form: values,
                  }))}
                ><i className='fa fa-plus' aria-hidden='true'></i> Add to filters</Button>
                <Button
                  color="light"
                  type="submit"
                  className="mr-2 mb-sm-1"
                  onClick={(e) => { e.preventDefault(); this.props.clearSearch(); }}
                >Clear Search</Button>
              </Form>
            </Col>
            <Col xs="1">
              <Button
                color="light"
                onClick={(e) => {e.preventDefault(); this.props.hideFilters(); }}
                className="d-none d-md-block"
              >Hide</Button>
              <Button
                color="light"
                onClick={(e) => {e.preventDefault(); this.props.hideFilters(); }}
                className="d-block d-md-none"
              ><i className='fa fa-times' aria-hidden='true'></i></Button>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-start flex-wrap">
              <div className="mr-2">
                <h6>Filters:</h6>
              </div>
              {this.props.filters.map((filter) => {
                const displayName = (this.props.columns.find(({ value }) => (value === filter.key)) || {}).display;
                const filterValue = filter.exact ? [].concat(filter.value).map(f => `"${f}"`) : filter.value;
                const closeEl = <i
                    onClick={() => this.props.removeFilter(filter.uuid)}
                    className='fa fa-times clickable'
                    aria-hidden='true'
                  ></i>;

                return (
                  <div key={filter.uuid}>
                    <Badge color={filter.not ? 'danger' : 'success'} className="mr-2">
                      <span>{displayName} : {filterValue.toString()} {closeEl}</span>
                    </Badge>
                  </div>
                );
              })}
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

TableFilter.propTypes = {
  columns: PropTypes.array.isRequired,
  show: PropTypes.bool.isRequired,
  filters: PropTypes.arrayOf(PropTypes.shape({
    uuid: PropTypes.string.isRequired,
    not: PropTypes.bool,
    exact: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
  })).isRequired,
};

export default TableFilter;
