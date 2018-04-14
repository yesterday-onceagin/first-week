import React from 'react'
import PropTypes from 'prop-types'

import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import { Form, ValidatedInput } from '@components/bootstrap-validation'

import classnames from 'classnames'
import _ from 'lodash'

import { APPLICATION_PLATFORMS } from '@constants/dmp'

class AppDialog extends React.PureComponent {
  static propTypes = {
    show: PropTypes.bool,
    data: PropTypes.object,
    pending: PropTypes.bool,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  };

  static defaultProps = {
    show: false,
    pending: false
  };

  constructor(props) {
    super(props);

    this.state = {
      info: {
        platform: 'pc',
        ...props.data
      },
      nameError: ''
    };
  }

  render() {
    const { show, onHide, pending } = this.props
    const { info, nameError } = this.state;

    return (
      <Dialog
        show={show}
        onHide={pending ? null : onHide}
        backdrop="static"
        size={{ width: '550px' }}
        className="data-view-list-add-dialog" id="data-view-list-add-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>创建应用</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form className="form-horizontal"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.add_application_form = instance }}
          >
            <div className="form-group">
              <label className="control-label">
                <span><i className="required">*</i>平台类型</span>
              </label>
              <div className="input-wrapper">
                {
                  _.keys(APPLICATION_PLATFORMS).map((platform, index) => {
                    const radioClass = classnames('icon-radio', {
                      checked: info.platform === platform
                    })
                    const eParams = {
                      target: {
                        value: platform
                      }
                    }
                    return (
                      <span key={`app-add-platform-radio-${platform.key}-${index}`}
                        className="platform-select"
                        style={this.STYLE_SHEET.platformSelect}
                        onClick={this.handleChangeInfo.bind(this, 'platform', eParams)}
                      >
                        <i className={radioClass} style={this.STYLE_SHEET.iconRadio}/>
                        {APPLICATION_PLATFORMS[platform].name}
                      </span>
                    )
                  })
                }
              </div>
            </div>
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>应用名称</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="14"
              wrapperClassName="input-wrapper"
              validate={this._checkName}
              errorHelp={nameError} />
            <ValidatedInput type="textarea"
              label={<span><i className="required">&nbsp;</i>应用描述</span>}
              autoComplete="off"
              name="description"
              rows="4"
              value={info.description || ''}
              maxLength="80"
              onChange={this.handleChangeInfo.bind(this, 'description')}
              wrapperClassName="input-wrapper" />
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary"
            loading={pending}
            onClick={() => { this.add_application_form.submit() }}>
            确定
          </Button>
          <Button bsStyle="default" onClick={pending ? null : onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  handleChangeInfo = (field, e) => {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  };

  handleSaveInfo = () => {
    this.props.onSure(this.state.info);
  };

  // 检查名称
  _checkName = (val) => {
    if (!val.trim()) {
      this.setState({
        nameError: '请输入应用名称'
      });
      return false;
    } else if (val.replace(/[^\x00-\xff]/g, 'aa').length > 16) {
      // 将双字节字符转为两个英文字符后统计长度 >= 16
      this.setState({
        nameError: '名称长度不允许超过8个中文'
      });
      return false;
    }
    return true;
  };

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

export default AppDialog;
