import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

import _ from 'lodash'
import classnames from 'classnames'

import { APPLICATION_PLATFORMS } from '@constants/dmp'

class ReportNameDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    name: PropTypes.string,
    onClose: PropTypes.func,
    onSure: PropTypes.func,
    isEmptyTpl: PropTypes.bool
  };

  static defaultProps = {
    isEmptyTpl: false,
    show: false
  };

  constructor(props) {
    super(props)
    this.state = {
      name: '',
      platform: 'pc',
      savePending: false
    }
  }

  render() {
    const { show, onClose, isEmptyTpl } = this.props;
    const { savePending, name, platform } = this.state;
    return show && <Dialog
      show={show}
      onHide={savePending ? null : onClose}
      backdrop="static"
      size={{ width: '420px' }}
    >
      <Dialog.Header closeButton>
        <Dialog.Title>报告名称</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div>
          <Form
            onValidSubmit={this.handleValidSubmit.bind(this)}
            validationEvent="onBlur"
            ref={(instance) => { this.nameForm = instance }}
          >
            <div>
              <label style={{ marginBottom: '6px' }}><i className="required">*</i>名称</label>
              <div>
                <ValidatedInput
                  type="text"
                  autoComplete="off"
                  name="name"
                  validate="required"
                  disabled={savePending}
                  placeholder="名称"
                  errorHelp="请输入名称"
                  value={name}
                  onChange={this.handleChangeValue.bind(this, 'name')} />
              </div>
            </div>
            {
              isEmptyTpl && (
                <div className="form-group">
                  <label className="control-label">
                    <span><i className="required">*</i>平台类型</span>
                  </label>
                  <div className="input-wrapper">
                    {
                      _.keys(APPLICATION_PLATFORMS).map((_platform, index) => {
                        const radioClass = classnames('icon-radio', {
                          checked: platform === _platform
                        })
                        const eParams = {
                          target: {
                            value: _platform
                          }
                        }
                        return (
                          <span key={`app-add-platform-radio-${_platform.key}-${index}`}
                            className="platform-select"
                            style={this.STYLE_SHEET.platformSelect}
                            onClick={this.handleChangeValue.bind(this, 'platform', eParams)}
                          >
                            <i className={radioClass} style={this.STYLE_SHEET.iconRadio}/>
                            {APPLICATION_PLATFORMS[_platform].name}
                          </span>
                        )
                      })
                    }
                  </div>
                </div>
              )
            }
          </Form>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" loading={savePending} onClick={() => { this.nameForm.submit(); }}>确定</Button>
        <Button bsStyle="default" onClick={savePending ? null : onClose}>取消</Button>
      </Dialog.Footer>
    </Dialog>;
  }

  handleChangeValue(field, e) {
    this.setState({
      [field]: e.target.value
    })
  }

  // 提交创建
  handleValidSubmit() {
    const { name, platform } = this.state
    this.setState({
      savePending: true
    }, () => {
      this.props.onSure(name, platform, () => {
        this.setState({
          savePending: false
        })
      })
    })
  }

  STYLE_SHEET = {
    platformSelect: {
      display: 'inline-block',
      lineHeight: '20px',
      marginRight: '20px',
      float: 'left',
      cursor: 'pointer'
    },
    iconRadio: {
      margin: '-2px 6px 0 0'
    }
  };
}

export default ReportNameDialog;
