import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Field, FieldArray } from 'redux-form';
import {
  Badge,
  Container,
  Row,
  Col,
  FormGroup,
  Label,
  Button,
  Progress,
} from 'reactstrap';
import Title from '../Title';
import RenderSelect from '../RenderSelect';
import RenderInput from '../RenderInput';

class NamespaceEditPage extends Component {

  render() {
    const { meta } = this.props;
    if (meta.loading.loadingPercent !== 100) return (
      <Container className="page-frame">
        <Row className="d-flex justify-content-center">
          <Col sm="12" className="mt-5">
            <Progress animated color="info" value={meta.loading.loadingPercent} />
          </Col>
        </Row>
      </Container>
    );

    if (!this.props.canEdit) {
      return (
        <Container className="page-frame">
          <Row>
            <Col xs="12">
              <p>You are not authorised to view this page.</p>
            </Col>
          </Row>
        </Container>
      );
    }

    const error = this.props.error;
    const namespace = this.props.namespace;
    const headingBadge = <Badge
        style={{ backgroundColor: namespace.color }}
        pill
      >{namespace.clusterName}/{namespace.name}
      </Badge>;

    const renderAttributes = (props) => {

    return (
        <div>
          <h6>Attributes:</h6>
          {props.fields.map((attribute, index) => (
            <FormGroup className="row" key={attribute}>
              <Col sm="3">
                <Field
                  name={`${attribute}.name`}
                  className="form-control"
                  component={RenderInput}
                  type="text"
                  autocomplete="foo-no-really"
                  />
              </Col>
              <Col sm="1"><p>:</p></Col>
              <Col sm="5">
                <Field
                  name={`${attribute}.value`}
                  className="form-control"
                  component={RenderInput}
                  type="text"
                  autoComplete="foo-no-really"
                  />
              </Col>
              <Col>
                <Button
                  outline
                  color="danger"
                  onClick={(e) => { e.preventDefault(); props.fields.remove(index); }}
                ><i className={`fa fa-trash`} aria-hidden='true'></i>
                </Button>
              </Col>
            </FormGroup>
          ))}
          <Row>
            <Col sm="2">
              <Button
                outline
                color="info"
                onClick={(e) => { e.preventDefault(); props.fields.push({}); }}
              >Add new attribute
              </Button>
            </Col>
          </Row>
        </div>
      );
    };
    return (
      <Container className="page-frame">
        <Title title={`Edit namespace: ${namespace.clusterName}/${namespace.name}`} />
        <Row>
          <h4>{headingBadge}</h4>
        </Row>
        <Row>
          <Col sm="12">
            <form>
              <FormGroup className="row">
                <Label for="color" className="col-sm-2 col-form-label text-right">Color:</Label>
                <Col sm="5">
                  <Field
                    name="color"
                    className="form-control"
                    component={RenderInput}
                    type="text"
                    />
                </Col>
              </FormGroup>
              <FormGroup className="row">
                <Label for="cluster" className="col-sm-2 col-form-label text-right">Cluster:</Label>
                <Col sm="5">
                  <Field
                    name="cluster"
                    className="form-control"
                    component={RenderSelect}
                    options={this.props.clusterOptions}
                    />
                </Col>
              </FormGroup>
              <FormGroup className="row">
                <Label for="context" className="col-sm-2 col-form-label text-right">Context:</Label>
                <Col sm="5">
                  <Field
                    name="context"
                    className="form-control"
                    component={RenderInput}
                    type="text"
                    />
                </Col>
              </FormGroup>
              <FieldArray
                name="attributes"
                component={renderAttributes}
              />
              <Row className="mt-2">
                <Col sm="2">
                  <Button
                    outline
                    color="info"
                    onClick={this.props.handleSubmit(this.props.submitForm)}
                  >Save
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col sm="12">
                  {error && <span className="help-block"><span className="text-danger">{error}</span></span>}
                </Col>
              </Row>
            </form>
          </Col>
        </Row>
      </Container>
    );
  }
}

NamespaceEditPage.propTypes = {
  namespaceId: PropTypes.string.isRequired,
  canEdit: PropTypes.bool.isRequired,
  namespace: PropTypes.object.isRequired,
  clusterOptions: PropTypes.array.isRequired,
};

export default NamespaceEditPage;
