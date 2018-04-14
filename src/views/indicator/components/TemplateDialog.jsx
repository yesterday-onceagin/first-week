import React from 'react'
import PropTypes from 'prop-types'

import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

class TemplateDialog extends React.Component {
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
    const { show, onHide } = this.props
    const info = this.state.info;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '550px' }}
        className="data-view-list-add-dialog"
        id="data-view-list-add-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>{info.id ? '编辑指标模版基本信息' : '新增指标模版'}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form className="form-horizontal"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.template_form = instance }}
          >
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>模版名称</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="20"
              wrapperClassName="input-wrapper"
              validate='required'
              errorHelp={{ required: '请输入模版名称' }}
            />
            <ValidatedInput type="textarea"
              label={<span><i className="required">&nbsp;</i>模版描述</span>}
              autoComplete="off"
              name="description"
              rows="4"
              value={info.description || ''}
              maxLength="80"
              onChange={this.handleChangeInfo.bind(this, 'description')}
              wrapperClassName="input-wrapper"
            />
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={() => { this.template_form.submit() }}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
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
}

export default TemplateDialog;
