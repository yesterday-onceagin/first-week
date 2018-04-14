import React from 'react'
import PropTypes from 'prop-types'
import './error-alert.less';

class ErrorAlert extends React.Component {
  static propTypes = {
    show: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      show: props.show,
      spread: true,
      errorStack: []
    }

    this.appendError = this.appendError
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.show !== this.state.show) {
      this.setState({
        show: nextProps.show
      })
    }
  }

  render() {
    const { show, spread, errorStack } = this.state
    return show ? <div className="myui-alert">
      {
        spread && <div className="alert-wrap">
          {errorStack.map((item, index) => this.renderSingleError(item, index))}
        </div>
      }
    </div> : null
  }

  renderSingleError(item, index) {
    return <div className="alert-item" key={index}>
      <div className="content">
        {item}
      </div>
      <div className="close-btn" onClick={this.removeErrorItem.bind(this, index)}>
        <i className="dmpicon-add-01" />
      </div>
    </div>
  }

  appendError(error) {
    this.setState((preState) => {
      preState.errorStack.push(error)
      return {
        errorStack: preState.errorStack
      }
    })
  }

  removeErrorItem(index) {
    this.setState((preState) => {
      preState.errorStack.splice(index, 1)
      return {
        show: preState.errorStack.length !== 0,
        errorStack: preState.errorStack
      }
    })
  }
}

export default ErrorAlert
