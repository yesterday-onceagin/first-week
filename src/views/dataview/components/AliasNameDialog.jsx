import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

class AliasNameDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: '', // id 
      col_name: '', // name 
      alias_name: '',
      alias: '', // 别名
    }
  }

  componentDidMount() {
    const { info } = this.props
    this.setState({
      ...info,
      alias: info.alias || info.col_name
    })
  }

  render() {
    const { show, onClose } = this.props;
    const { col_name, alias_name, alias } = this.state;

    return show && <Dialog
      show={show}
      onHide={onClose}
      backdrop="static"
      size={{ width: '420px' }}
      className="alias-name-dialog">
      <Dialog.Header closeButton>
        <Dialog.Title>别名</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="alias-name-dialog-wrapper">
          <Form onValidSubmit={this.handleValidSubmit.bind(this)} validationEvent="onBlur" className="form-wapper" ref={(instance) => { this.alias_name_form = instance }}>
            <div className="group-row">
              <label style={{ marginBottom: '6px' }}>{`修改“${alias_name || col_name || ''}”的别名：`}</label>
              <div className="group-wrap">
                <ValidatedInput
                  type="text"
                  autoComplete="off"
                  name="aliasName"
                  validate="required"
                  placeholder="别名"
                  errorHelp="请输入别名"
                  value={alias}
                  onChange={this.handleChangeValue.bind(this)} />
              </div>
            </div>
          </Form>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={() => { this.alias_name_form.submit(); }} >确定</Button>
        <Button bsStyle="default" onClick={onClose}>取消</Button>
      </Dialog.Footer>
    </Dialog>;
  }

  handleChangeValue(e) {
    this.setState({
      alias: e.target.value
    })
  }

  handleValidSubmit() {
    const { onSure } = this.props
    onSure(this.state)
  }
}

AliasNameDialog.propTypes = {
  /**
   * 显示
   * bool
   */
  show: PropTypes.bool,
  /**
   * 确定
   * function
   */
  onSure: PropTypes.func,
  /**
   * 关闭
   * function
   */
  onClose: PropTypes.func,
  /**
   * info
   */
  info: PropTypes.object

}

export default AliasNameDialog;
