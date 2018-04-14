import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import { Form, ValidatedInput } from '@components/bootstrap-validation';

class UserDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    pending: PropTypes.bool,
    passwordOnly: PropTypes.bool,
    data: PropTypes.object,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props)
    const { data } = props
    this.state = {
      info: {
        ...data,
        name: data.name || '',
        account: data.account || '',
        email: data.email || '',
        mobile: data.mobile || ''
      },
      errorTips: {}
    };
  }

  render() {
    const { show, onHide, data, pending, passwordOnly } = this.props
    // 没有ID为新增用户 需要输入密码 否则不需要
    const dialogTitle = passwordOnly ? '重置用户密码' : (data.id ? '修改用户信息' : '添加用户')
    const dialogHeight = passwordOnly ? '214px' : (!data.id ? '510px' : '436px')

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '550px', height: dialogHeight }}
        className="data-view-user-info-dialog"
        id="data-view-user-info-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form className="form-horizontal"
            autoComplete="off"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.user_base_info_dialog_form = instance }}
          >
            {passwordOnly ? this.renderPasswordOnlyForm() : this.renderNormalForm()}
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            bsStyle="primary"
            loading={pending}
            onClick={() => { this.user_base_info_dialog_form.submit() }}
          >
            确定
          </Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  // 渲染只有密码的表单
  renderPasswordOnlyForm() {
    const { info } = this.state;

    return (
      <ValidatedInput
        type="password"
        label={<span><i className="required">*</i>新密码</span>}
        autoComplete="new-password"
        name="password"
        value={info.password}
        onChange={this.handleChangeInfo.bind(this, 'password')}
        validate='required'
        wrapperClassName="input-wrapper"
        errorHelp={{ required: '请输入新密码' }}
      />
    )
  }

  // 渲染通常模式下的表单
  renderNormalForm() {
    const { data } = this.props
    const { info, errorTips } = this.state;
    return (
      <div>
        <ValidatedInput type="text"
          label={<span><i className="required">*</i>姓名</span>}
          autoComplete="off"
          name="name"
          value={info.name}
          onChange={this.handleChangeInfo.bind(this, 'name')}
          maxLength="20"
          wrapperClassName="input-wrapper"
          validate='required'
          errorHelp={{ required: '请输入姓名' }}
        />
        <ValidatedInput type="text"
          label={<span><i className="required">*</i>帐号</span>}
          autoComplete="off"
          name="account"
          value={info.account}
          readOnly={!!data.id}
          onChange={this.handleChangeInfo.bind(this, 'account')}
          maxLength="20"
          wrapperClassName="input-wrapper"
          validate={this._checkAccount}
          errorHelp={errorTips.account || '请输入帐号'}
        />
        {
          !data.id && (
            <ValidatedInput
              type="password"
              label={<span><i className="required">*</i>密码</span>}
              autoComplete="new-password"
              name="password"
              value={info.password}
              onChange={this.handleChangeInfo.bind(this, 'password')}
              validate='required'
              wrapperClassName="input-wrapper"
              errorHelp={{ required: '请输入密码' }}
            />
          )
        }
        <ValidatedInput type="text"
          label={<span><i className="required">*</i>邮箱</span>}
          autoComplete="off"
          name="email"
          value={info.email}
          onChange={this.handleChangeInfo.bind(this, 'email')}
          maxLength="30"
          wrapperClassName="input-wrapper"
          validate='required,isEmail'
          errorHelp={{ required: '请输入邮箱', isEmail: '邮箱格式有误' }}
        />
        <ValidatedInput type="text"
          label={<span><i className="required">&nbsp;</i>手机号</span>}
          autoComplete="off"
          name="mobile"
          value={info.mobile}
          onChange={this.handleChangeInfo.bind(this, 'mobile')}
          maxLength="11"
          wrapperClassName="input-wrapper"
          validate={this._checkMobile}
          errorHelp="手机格式有误"
        />
      </div>
    )
  }

  // 修改信息响应事件
  handleChangeInfo = (field, e) => {
    const newValue = e.target.value
    this.setState({
      info: {
        ...this.state.info,
        [field]: newValue
      }
    })
  };

  // 保存提交
  handleSaveInfo = () => {
    this.props.onSure(this.state.info);
  };

  // 检查账号
  _checkAccount = (val) => {
    if (!val.trim()) {
      this.setState({
        errorTips: {
          ...this.state.errorTips,
          account: '请输入账号'
        }
      });
      return false;
    } else if (/[^\w\d]/g.test(val)) {
      this.setState({
        errorTips: {
          ...this.state.errorTips,
          account: '仅支持英文数字下划线'
        }
      });
      return false;
    }
    return true;
  };

  // 检查手机号
  _checkMobile = (val) => {
    const re = /^1\d{10}$/
    return !val || re.test(val);
  };
}

export default UserDialog;
