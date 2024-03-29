import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-plain_text';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import "ace-builds/webpack-resolver";

class RenderEditor extends Component {
  render() {
    const { height = 'normal' } = this.props;
    return (
      <AceEditor
        value={this.props.input.value}
        mode={this.props.mode}
        theme="github"
        onChange={this.props.input.onChange}
        onValidate={(annotations) => {
          (this.props.validateAnnotations || (() => {}))({ annotations, index: this.props.index });
        }}
        name={`${this.props.input.name}-editor`}
        editorProps={{
          $blockScrolling: true,
        }}
        setOptions={{
          useSoftTabs: true
        }}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={this.props.mode !== 'plain_text'}
        tabSize={2}
        width="95%"
        height={height === 'normal' ? '70vh': '45vh'}
        showPrintMargin={false}
      />
    );
  }
}

RenderEditor.propTypes = {
  input: PropTypes.object.isRequired,
  mode: PropTypes.oneOf(['json', 'plain_text']),
  height: PropTypes.oneOf(['normal', 'small']),
};

export default RenderEditor;
