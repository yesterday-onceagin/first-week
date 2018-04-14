import React from 'react';
import ReactDOM from 'react-dom';
import Confirm from 'react-bootstrap-myui/lib/Confirm';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import createChainedFunction from 'react-bootstrap-myui/lib/utils/createChainedFunction'

const ConfirmsMixin = {
  getInitialState() {
    return {
      confirmOptions: {
        show: false,
        title: '提示',
        info: '',
        content: '',
        ok: null,
        checkbox: false,
        checked: false
      }
    }
  },
  componentDidMount() {
    this._renderConfirm();
    this.__handleKeyDown__ = (e) => {
      if (e.keyCode === 13) {
        this.hideConfirm()
        if (this.state.confirmOptions.ok) {
          this.state.confirmOptions.ok()
        }
      }
    }
  },
  componentDidUpdate() {
    this._renderConfirm()
  },
  _renderConfirm() {
    const confirmOptions = this.state.confirmOptions,
      confirmDialog = (
        <Confirm
          backdrop={confirmOptions.backdrop}
          show={confirmOptions.show}
          onHide={this.hideConfirm.bind(this, null)}
          animation={false}
          size={{ width: '500px', height: '240px', ...confirmOptions.size }}>
          <Confirm.Header closeButton>
            <Confirm.Title>{confirmOptions.title}</Confirm.Title>
          </Confirm.Header>
          <div className="confirm-modal confirm-body">
            <div className="tips-wrap clearfix">
              <div className="tipsIcon">
                <span className="tips-warn"></span>
              </div>
              <div className="tipsContent">
                <h4 className="modal-title">
                  {confirmOptions.info}
                </h4>
                {
                  confirmOptions.checkbox ? (
                    <Input type="checkbox" label={confirmOptions.content} checked={confirmOptions.checked} onClick={this.handleCheckbox.bind(this, null)} />
                  ) : <p className="tips-small">{confirmOptions.content}</p>
                }
              </div>
            </div>
          </div>
          <Confirm.Footer>
            <Button bsStyle={confirmOptions.checkbox ? 'default' : 'primary'}
              onClick={createChainedFunction(this.hideConfirm.bind(this, null), confirmOptions.ok)}
              disabled={confirmOptions.checkbox ? !confirmOptions.checked : false}>
              确定
            </Button>
            <Button bsStyle={confirmOptions.checkbox ? 'warning' : 'default'}
              onClick={createChainedFunction(this.hideConfirm.bind(this, null), confirmOptions.close)}>
              取消
            </Button>
          </Confirm.Footer>
        </Confirm>
      );

    this._mountConfirmTarget();
    this._confirmInstance = ReactDOM.unstable_renderSubtreeIntoContainer(this, confirmDialog, this._confirmTarget);
  },
  _mountConfirmTarget() {
    if (!this._confirmTarget) {
      this._confirmTarget = document.createElement('div');
      this._getConfirmContainerDOMNode().appendChild(this._confirmTarget);
    }
  },
  _getConfirmContainerDOMNode() {
    const node = ReactDOM.findDOMNode(this),
      body = document.body
    return node ? node.parentNode || body : body
  },
  handleCheckbox() {
    this.setState(prevState => ({
      confirmOptions: {
        ...prevState.confirmOptions,
        checked: !prevState.confirmOptions.checked
      }
    }));
  },
  hideConfirm() {
    this.setState(prevState => ({
      confirmOptions: {
        ...prevState.confirmOptions,
        checked: false,
        show: false
      }
    }))
    document.removeEventListener('keydown', this.__handleKeyDown__)
  },
  showConfirm(options) {
    this.setState(prevState => ({
      confirmOptions: {
        ...prevState.confirmOptions,
        show: true,
        title: options.title || '提示',
        info: options.info,
        content: options.content,
        backdrop: options.backdrop || 'static',
        ok: options.ok,
        close: options.close || null,
        checkbox: !!options.checkbox,
        checked: false,
        size: options.size,
      }
    }))
    document.addEventListener('keydown', this.__handleKeyDown__)
  }
};

export default ConfirmsMixin;
