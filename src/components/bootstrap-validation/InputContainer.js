import React from 'react';

export default class InputContainer extends React.Component {
  componentWillMount() {
    this._inputs = {};
  }

  componentWillUnmount() {

  }

  registerInput(input) {
    const type = input.props.type;
    const name = input.props.name;

    if (!name) {
      throw new Error(`Input ${input} has no "name" prop`);
    }

    if (type === 'radio') {
      this._inputs[name] = this._inputs[name] || [];
      this._inputs[name].push(input);
    } else {
      this._inputs[name] = input;
    }
  }

  unregisterInput(input) {
    const type = input.props.type;
    const name = input.props.name;

    if (!name) {
      throw new Error(`Input ${input} has no "name" prop`);
    }

    if (type === 'radio') {
      this._inputs[name] = this._inputs[name].filter(ipt => ipt !== input);
    } else {
      delete this._inputs[input.props.name];
    }
  }
}
