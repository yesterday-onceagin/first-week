import React from 'react';
import ReactDOM from 'react-dom';
import Tip from 'react-bootstrap-myui/lib/Tip';
import { TIP_SHOW_TIME } from '../constants/dmp';
import { tipOptions } from './tipUtils'

const TipMixin = {
  getInitialState() {
    return {
      tipOptions
    }
  },
  componentWillReceiveProps(nextProps) {
    const tipOptions = nextProps.tipOptions

    if (tipOptions && tipOptions.show !== this.state.tipOptions.show) {
      this.setState({
        tipOptions: {
          show: tipOptions.show,
          status: tipOptions.status,
          content: tipOptions.content,
          timeout: tipOptions.timeout || TIP_SHOW_TIME
        }
      })
    }
  },
  componentDidMount() {
    this._isMounted = true
    this._renderTip();
  },
  componentDidUpdate() {
    this._renderTip();
  },
  componentWillUnmount() {
    this._isMounted = false
    if (this.props.tipActions && this.props.tipActions.clearTipStatus) {
      this.props.tipActions.clearTipStatus()
    }
  },
  _renderTip() {
    const tipOptions = this.state.tipOptions,
      tip = tipOptions.show ? (
        <Tip
          status={tipOptions.status}
          show={tipOptions.show}
          animation={false}
          container={document.body}
          onDismiss={this.hideTip.bind(this, null)}
          timeout={tipOptions.timeout}
        >
          <span>{tipOptions.content}</span>
        </Tip>
      ) : <div></div>;

    this._mountTipTarget();
    this._tipInstance = ReactDOM.unstable_renderSubtreeIntoContainer(this, tip, this._tipTarget);
  },
  _mountTipTarget() {
    if (!this._tipTarget) {
      this._tipTarget = document.createElement('div');
      this._getTipContainerDOMNode().appendChild(this._tipTarget);
    }
  },
  _getTipContainerDOMNode() {
    const node = ReactDOM.findDOMNode(this),
      body = document.body
    return node ? node.parentNode || body : body
  },
  hideTip() {
    const msgTipsPop = $('body').find('.msg-tips-pop')
    //需要判断当前component是否已mount，不然可能会出现警告
    if (this._isMounted) {
      this.setState(prevState => ({
        tipOptions: {
          ...prevState.tipOptions,
          show: false
        }
      }), () => {
        msgTipsPop.remove();
      })
    } else {
      msgTipsPop.remove();
    }
  },
  showTip(options) {
    this._isMounted && this.setState(prevState => ({
      tipOptions: {
        ...prevState.tipOptions,
        show: true,
        status: options.status,
        content: options.content,
        timeout: options.timeout || TIP_SHOW_TIME
      }
    }))
  }
};

export default TipMixin;
