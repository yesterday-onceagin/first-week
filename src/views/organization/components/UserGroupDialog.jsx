import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

class UserGroupDialog extends React.Component {
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
    const { show, onHide, data, pending } = this.props
    const { info } = this.state;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '550px' }}
        className="data-view-user-group-dialog"
        id="data-view-user-group-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>{data.id ? '修改用户组' : '添加用户组'}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form className="form-horizontal"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.user_group_info_dialog_form = instance }}
          >
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>名称</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="20"
              wrapperClassName="input-wrapper"
              validate='required'
              errorHelp={{ required: '请输入名称' }}
            />
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            bsStyle="primary"
            loading={pending}
            onClick={() => { this.user_group_info_dialog_form.submit() }}
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
}

export default UserGroupDialog;
