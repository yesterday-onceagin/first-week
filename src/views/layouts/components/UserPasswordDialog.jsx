import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import { Form, ValidatedInput } from '@components/bootstrap-validation';

class UserPasswordDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    pending: PropTypes.bool,
    data: PropTypes.object,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props)
    this.state = {
      info: {
        ...props.data
      }
    };
  }

  render() {
    const { show, onHide, pending } = this.props
    const { info } = this.state;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '550px' }}
        className="uers-pass-edit-dialog"
        id="uers-pass-edit-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>修改密码</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="user-pass-dialog-wrapper">
            <Form
              className="form-horizontal"
              validationEvent="onBlur"
              onValidSubmit={this.handleSaveInfo.bind(this)}
              ref={(instance) => { this.user_pass_form = instance }}
            >
              <ValidatedInput
                type="password"
                label={<span><i className="required">*</i>原密码</span>}
                autoComplete="new-password"
                name="old_password"
                id="old_password"
                value={info.old_password || ''}
                onChange={this.handleChangeInfo.bind(this, 'old_password')}
                placeholder="原密码"
                wrapperClassName="input-wrapper"
                validate='required'
                errorHelp={{ required: '请输入原密码' }}
              />
              <ValidatedInput
                type="password"
                label={<span><i className="required">*</i>新密码</span>}
                autoComplete="new-password"
                name="new_password"
                value={info.new_password || ''}
                onChange={this.handleChangeInfo.bind(this, 'new_password')}
                placeholder="新密码"
                validate='required'
                wrapperClassName="input-wrapper"
                errorHelp={{ required: '请输入新密码' }}
              />
              <ValidatedInput
                type="password"
                label={<span><i className="required">*</i>确认密码</span>}
                autoComplete="new-password"
                name="new_confirm_pwd"
                value={info.new_confirm_pwd || ''}
                onChange={this.handleChangeInfo.bind(this, 'new_confirm_pwd')}
                placeholder="确认密码"
                wrapperClassName="input-wrapper"
                validate={this._validateConfirmPass}
                errorHelp={{ required: '请保持和新密码一致' }}
              />
            </Form>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="button"
            bsStyle="primary"
            loading={pending}
            onClick={() => { this.user_pass_form.submit() }}
          >
            确定
          </Button>
          <Button type="button" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  // 修改信息响应事件
  handleChangeInfo = (field, e) => {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  };

  // 保存提交
  handleSaveInfo = () => {
    this.props.onSure(this.state.info);
  };

  // 检测确认密码
  _validateConfirmPass = (value) => {
    const { info } = this.state;
    return value === info.new_password;
  };
}

export default UserPasswordDialog;
