import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

class UserInfoDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
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
        size={{ width: '550px' }}
        backdrop="static"
        className="data-view-user-info-dialog"
        id="data-view-user-info-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>修改个人信息</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form
            className="form-horizontal"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.user_base_info_dialog_form = instance }}
          >
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>姓名</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="20"
              wrapperClassName="input-wrapper"
              validate='required'
              errorHelp={{ required: '请输入姓名' }}
            />
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>邮箱</span>}
              autoComplete="off"
              name="email"
              value={info.email || ''}
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
              value={info.mobile || ''}
              onChange={this.handleChangeInfo.bind(this, 'mobile')}
              maxLength="11"
              wrapperClassName="input-wrapper"
              validate={this._checkMobile}
              errorHelp="手机格式有误"
            />
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary"
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

  // 检查手机号
  _checkMobile = (val) => {
    const re = /^1\d{10}$/
    return !val || re.test(val);
  };
}

export default UserInfoDialog;
