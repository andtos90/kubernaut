import React from 'react';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';

export default class Example extends React.Component {
  constructor(props) {
    super(props);
    this.targetRef = React.createRef();

    this.toggle = this.toggle.bind(this);
    this.state = {
      popoverOpen: false
    };
  }

  toggle() {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    });
  }

  render() {
    const iconClass = this.props.iconClass || 'question-circle';
    const icon = <i
      className={`fa fa-${iconClass}`}
      aria-hidden='true'
      ref={this.targetRef}
    ></i>;

    return (
      <div className={this.props.classNames}>
        {icon}
        <Popover
          placement={this.props.placement || 'auto'}
          trigger="focus click hover"
          className="shadow-sm"
          target={this.targetRef}
          isOpen={this.state.popoverOpen}
          toggle={this.toggle}
          delay={{
            show: 0,
            hide: 500,
          }}
        >
          <PopoverHeader>{this.props.title}</PopoverHeader>
          <PopoverBody>{this.props.children || this.props.body}</PopoverBody>
        </Popover>
      </div>
    );
  }
}
