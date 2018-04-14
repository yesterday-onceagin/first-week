import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import { Form, ValidatedInput } from '../../../components/bootstrap-validation'

class GenerateUrlDialog extends React.Component {
  static ICON_STYLE_SHEET = {
    fontFamily: "'dmpicon' !important",
    speak: 'none',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontVariant: 'normal',
    textTransform: 'none',
    lineHeight: 1,
    color: '#24BBF9',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  }
  constructor(props) {
    super(props)
    const { protocol, host } = window.location
    const str = this.generateString(props.reportSelectors)
    this.state = {
      url: `${protocol}//${host}/dataview/share/${props.screenId}?code=${localStorage.getItem('tenant_code')}${str}`,
    }
  }

  static propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    screenId: PropTypes.string,
    reportSelectors: PropTypes.array
  }

  render() {
    const { onClose } = this.props
    const { url } = this.state

    return (
      <Dialog
        show={true}
        onHide={onClose}
        backdrop="static"
        size={{ width: '450px', height: '260px' }}>
        <Dialog.Header closeButton>
          <Dialog.Title>生成报告url</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form validationEvent="onBlur"
            onValidSubmit={this.handleValidSubmit.bind(this)}
            ref={(c) => { this.multi_screen_publish_form = c }}
            className="custom-publish-dialog-wrapper">
            <ValidatedInput type="textarea"
              label={<div><span><i className="required">*</i>链接</span><span onClick={this.cloneTextArea.bind(this)} style={{ float: 'right', fontSize: '12px', color: '#24BBF9', cursor: 'pointer' }}>复制</span></div>}
              autoComplete="off"
              readOnly={true}
              ref={(node) => { this.textAreaNode = node }}
              name="url"
              value={url}
              wrapperClassName="input-wrapper textarea-wrapper"
              style={{ height: '80px' }}
            />
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={onClose}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }
  handleValidSubmit() {
  }
  cloneTextArea() {
    this.textAreaNode.input.select()
    document.execCommand('Copy')
  }

  generateString(selectors) {
    const valueArr = []
    let valueStr = ''
    selectors.forEach((item) => {
      const obj = {
        col_value: item.col_value,
        col_name: item.col_name,
        operator: item.operator
      }
      valueArr.push(obj)
    })
    valueArr.forEach((item) => {
      valueStr = `${valueStr}&df_${item.col_name}=${JSON.stringify(item)}`
    })
    console.log(valueStr)
    return valueStr
  }
}

export default GenerateUrlDialog
