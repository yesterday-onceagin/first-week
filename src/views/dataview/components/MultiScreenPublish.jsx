import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import reactMixin from 'react-mixin'

import Button from 'react-bootstrap-myui/lib/Button'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Input from 'react-bootstrap-myui/lib/Input'
import Row from 'react-bootstrap-myui/lib/Row'
import Col from 'react-bootstrap-myui/lib/Col'
import { Select as TreeSelect, Tree } from 'rt-tree'
import { convertUserTree } from '../utils/treeDataHelper'
import classnames from 'classnames'
import { Form, ValidatedInput } from '../../../components/bootstrap-validation'
import SwitchButton from '../../../components/SwitchButton'

import { actions as dataViewMultiScreenActionCreators } from '../../../redux/modules/dataview/multiScreen';
import TipMixin from '../../../helpers/TipMixin'
import 'rt-tree/dist/css/rt-select.css'

class MultiScreenPublish extends React.Component {
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
    this.state = {
      isPublished: false,   // 是否已发布
      isPublishing: false,
      encryptType: 0,     // 权限类型
      url: '',
      password: '',
      screenId: '',
      userGroupTree: [],   //用户层级列表
      selectedUser: []     //选中的用户
    }
  }

  static propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    onPublish: PropTypes.func,
    screenId: PropTypes.string
  }

  componentWillMount() {
    this.fetchUserGroupTree()
  }
  componentWillReceiveProps(nextProps) {
    const { protocol, host } = window.location
    if (nextProps.show && nextProps.screenId) {
      this.setState({
        screenId: nextProps.screenId,
        url: `${protocol}//${host}/dataview/share/${nextProps.screenId}?code=${localStorage.getItem('tenant_code')}`
      }, () => {
        this.fetchMultiScreenDetail()
      })
    }
  }

  render() {
    const { show, onClose } = this.props
    const { isPublished, isPublishing, encryptType, url, password, userGroupTree } = this.state
    const infoNode = encryptType === 0 ? (
      <div className="clearfix">
        <i className="dmpicon-tip float-l" style={{ color: '#58678E', margin: '2px 4px 0 2px', fontSize: '14px' }}/>
        <span className="float-l" style={{ color: '#91B1D7', width: '380px' }}>
          发布报告以后，报告展示数据都可以在不登录的情况下访问，如果不想公开报告请设置密码或者授权用户访问方式
        </span>
      </div>
    ) : ''

    return (
      <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '450px' }}>
        <Dialog.Header closeButton>
          <Dialog.Title>发布</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form validationEvent="onBlur"
            onValidSubmit={this.handleValidSubmit.bind(this)}
            ref={(c) => { this.multi_screen_publish_form = c }}
            className = "custom-publish-dialog-wrapper">

            <Row>
              <Col xs={2} style={{ width: '60px', margin: '0 0 10px 12px' }}>发布</Col>
              <Col xs={10} style={{ width: 'auto' }}>
                <SwitchButton
                  active={isPublished}
                  style={{ width: '40px', height: '20px' }}
                  activeStyle={{ width: '40px', height: '20px' }}
                  circleStyle={{ width: '20px', height: '20px', top: 0, left: 0 }}
                  circleActiveStyle={{ width: '20px', height: '20px', top: 0, left: '20px' }}
                  texts={{ on: '', off: '' }}
                  turnOn={this.handleChangePublish.bind(this, 'isPublished', { target: { value: true } })}
                  turnOff={this.handleChangePublish.bind(this, 'isPublished', { target: { value: false } })}
                />
              </Col>
            </Row>

            <ValidatedInput type="textarea"
              label={<div><span><i className="required">*</i>链接</span><span onClick={this.cloneTextArea.bind(this)} style={{ float: 'right', fontSize: '12px', color: '#24BBF9', cursor: 'pointer' }}>复制</span></div>}
              autoComplete="off"
              readOnly={true}
              disabled={!isPublished}
              ref={(node) => { this.textAreaNode = node }}
              name="url"
              value={isPublished ? url : ''}
              wrapperClassName="input-wrapper textarea-wrapper"
              style={{ height: '80px' }}
            />
            <div className="form-group" style={{ paddingBottom: 0 }}>
              <label className="control-label"><span><i className="required">*</i>查看权限设置</span></label>
            </div>
            <div style={{ margin: '-8px 0 -10px 12px', overflow: 'hidden' }}>
              <Input
                type='radio'
                label='全部可见'
                style={{ marginBottom: 0, height: '30px' }}
                checked={encryptType === 0}
                wrapperClassName={isPublished ? 'checkbox-visable' : 'checkbox-disable'}
                disabled={!isPublished}
                onClick={this.handleRadioChange.bind(this, 'encryptType', 0)}
              />
            </div>
            <div className = "screen-publish-password"style={{ margin: '0 0 0 12px', height: '30px' }}>
              <div style={{ float: 'left', width: '30%', height: '30px' }}>
                <Input
                  type="radio"
                  style={{ height: '30px' }}
                  label="验证密码"
                  checked={encryptType === 1}
                  wrapperClassName={isPublished ? 'checkbox-visable' : 'checkbox-disable'}
                  disabled={!isPublished}
                  onClick={this.handleRadioChange.bind(this, 'encryptType', 1)}
                />
              </div>
              <div style={{ float: 'left', width: '70%', height: '30px', paddingTop: '3px' }}>
                <ValidatedInput
                  type="password"
                  autoComplete="off"
                  name="password"
                  // 加密方式不是密码验证时 不显示密码
                  value={encryptType === 1 ? password : ''}
                  readOnly={encryptType !== 1}
                  disabled={!isPublished}
                  onChange={this.handleChangePublish.bind(this, 'password')}
                  wrapperClassName="password-input-wrapper"
                  validate={this.validatePassword.bind(this)}
                  style={{ height: '30px' }}
                  errorHelp={{ required: '请输入验证密码' }}
                />
              </div>
            </div>
            <div style={{ margin: '10px 0 0 12px', height: '40px' }}>
              <div style={{ float: 'left', width: '30%', height: '40px' }}>
                <Input type="radio"
                  style={{ height: '30px' }}
                  label="用户组可见"
                  checked={encryptType === 2}
                  wrapperClassName={isPublished ? 'checkbox-visable' : 'checkbox-disable'}
                  disabled={!isPublished}
                  onClick={this.handleRadioChange.bind(this, 'encryptType', 2)}
                />
              </div>
              <div style={{ float: 'left', width: '70%', paddingLeft: '12px', paddingTop: '5px' }}>
                <TreeSelect search ref={(instance) => { this.tree_select = instance }} style={{ width: '100%' }} menuStyle={{ width: '100%', height: '200px' }}>
                  <Tree
                    multiple
                    data={userGroupTree || []}
                    defaultExpanded={this.getDefaultExpanded()}
                    selected={this.state.selectedUser.map(screen => screen)}
                    customerNode={{ onAdd: this.onAdd.bind(this), hover: false }}
                  />
                </TreeSelect>
              </div>
            </div>
            <div style={{ margin: '0 0 0 12px', overflow: 'hidden' }}>
              <Input
                type='radio'
                label='第三方授权'
                style={{ marginBottom: 0, height: '30px' }}
                checked={encryptType === 3}
                wrapperClassName={isPublished ? 'checkbox-visable' : 'checkbox-disable'}
                disabled={!isPublished}
                onClick={this.handleRadioChange.bind(this, 'encryptType', 3)}
              />
            </div>
            <div style={{ height: '40px', fontSize: '12px', margin: '-5px 0 10px 12px' }}>{infoNode}</div>
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" loading={isPublishing} onClick={() => this.multi_screen_publish_form.submit()}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  cloneTextArea() {
    this.textAreaNode.input.select()
    document.execCommand('Copy')
  }
  getDefaultExpanded() {
    return []
  }
  onAdd(data) {
    const selectedUserIds = this.state.selectedUser
    const checked = selectedUserIds.indexOf(data.id) !== -1
    const iconClass = classnames('icon-checkbox', { checked })
    return <i className={iconClass} onClick={this.onChangeSelected.bind(this, data.id, !checked)} />
  }
 
  onChangeSelected(data, checked) {
    const selectedUserIds = this.state.selectedUser

    if (checked) {
      this.setState(prevState => ({
        selectedUser: selectedUserIds.indexOf(data.id) === -1 ? prevState.selectedUser.concat([data]) : prevState.selectedUser
      }))
    } else {
      this.setState(prevState => ({
        selectedUser: prevState.selectedUser.filter(screen => screen !== data)
      }))
    }
  }

  fetchMultiScreenDetail() {
    this.props.actions.fetchMultiScreenDetail({ id: this.state.screenId }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '获取详情失败');
      } else {
        const { dashboard } = json.data
        this.setState({
          isPublished: dashboard.status === 1,
          encryptType: dashboard.type_access_released,
          password: dashboard.share_secret_key,
          selectedUser: dashboard.user_groups
        })
      }
    })
  }

  fetchUserGroupTree() {
    this.props.actions.fetchUserGroupTree((json) => {
      if (!json.result) {
        this.showErr(json.msg || '获取用户树失败');
      } else {
        const { data } = json
        this.setState({
          userGroupTree: convertUserTree(data)
        })
      }
    })
  }

  validatePassword() {
    const { encryptType, password } = this.state
    const new_password = password && password.replace(/^\s+|\s+$/g, '')

    if (encryptType === 1 && !new_password) {
      return false
    }
    return true
  }

  handleChangePublish(field, e) {
    const values = e.target.value
    this.setState({
      [field]: values
    }, () => {
      if (field === 'isPublished') {
        this.setState({
          password: '',
          selectedUser: [],
          encryptType: 0
        })
      }
    })
  }

  handleRadioChange(field, value) {
    this.setState({
      [field]: value
    })
  }

  handleValidSubmit() {
    const { screenId, isPublished, password, encryptType, selectedUser } = this.state
    const params = {
      id: screenId,
      status: isPublished ? 1 : 0,
      view_passwd: encryptType === 1 ? (password || '') : '',
      type_access_released: encryptType,
      user_groups: selectedUser
    }
    this.setState({ isPublishing: true })
    this.props.actions.publishMutilScreen(params, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '发布失败');
      } else {
        this.props.onPublish()
      }

      this.setState({ isPublishing: false })
    })
  }

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }
}

reactMixin.onClass(MultiScreenPublish, TipMixin)

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataViewMultiScreenActionCreators, dispatch)
})

export default connect(null, dispatchToProps)(MultiScreenPublish)
