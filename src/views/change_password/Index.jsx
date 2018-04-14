import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin';

import FixedTopNav from '@components/FixedTopNav'
import { Form, ValidatedInput } from '@components/bootstrap-validation';
import Button from 'react-bootstrap-myui/lib/Button';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as userActionCreators } from '@store/modules/organization/user';

import TipMixin from '@helpers/TipMixin';
import { getAuthLinksFromLoginInfo } from '@helpers/loginAuth';
import { getFormatedApp } from '@helpers/appUtils';

import { baseAlias } from '../../config'
import defaultLogo from '@static/images/dmp-logo.png'
import './index.less'

class PasswordChange extends React.PureComponent {
  static propTypes = {
    onChangeLayoutVisibility: PropTypes.func,
    actions: PropTypes.object,
    userProfile: PropTypes.object,
    project: PropTypes.object
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props)
    this.state = {
      pending: false,
      info: {}
    };
  }

  componentWillMount() {
    const { onChangeLayoutVisibility } = this.props
    // 布局的隐藏
    onChangeLayoutVisibility({
      hidePageHeader: true,  // 头部
      hideSideMenu: true     // 左侧菜单
    })
  }

  render() {
    const { project } = this.props
    const { info, pending } = this.state
    const logoUri = project.logo_uri || defaultLogo
    return (
      <div className="modules-page-container password-change-page no-flex" style={{ position: 'relative' }}>
        <FixedTopNav>
          <img ref={(instance) => { this.logoImg = instance }}
            onError={this.handleSetDefaultLogo.bind(this)}
            src={logoUri}
            className="top-nav-brand"
          />
        </FixedTopNav>
        <div className="password-change-form-wrap">
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
              validate={this._validateConfirmPass.bind(this)}
              errorHelp={{ required: '请保持和新密码一致' }}
            />
          </Form>
          <Button type="button" bsStyle="primary" loading={pending} onClick={() => { this.user_pass_form.submit() }}>
            确定
          </Button>
        </div>
      </div>
    )
  }

  // 设置默认LOGO图片
  handleSetDefaultLogo() {
    if (this.logoImg) {
      this.logoImg.src = defaultLogo
    }
  }

  // 修改信息响应事件
  handleChangeInfo(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  }

  // 保存提交
  handleSaveInfo() {
    const { userProfile, actions } = this.props
    const { info } = this.state
    const formatedApp = getFormatedApp(userProfile.app);
    const authLinks = getAuthLinksFromLoginInfo(formatedApp);
    const firstLink = authLinks.length > 0 ? (baseAlias + authLinks[0]) : `${baseAlias}/norights`
    this.setState({ pending: true })
    actions.fetchChangeUserPassword(info, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
        this.setState({ pending: false })
      } else {
        this.showSucc(json.msg)
        setTimeout(() => {
          this.setState({ pending: false })
          this.context.router.replace(firstLink)
        }, 1000);
      }
    })
  }

  // 检测确认密码
  _validateConfirmPass(value) {
    const { info } = this.state;
    return value === info.new_password;
  }

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  }

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  }
}

reactMixin.onClass(PasswordChange, TipMixin)

const stateToProps = state => ({
  project: state.user.project,
  userProfile: state.user.userProfile
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(userActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(PasswordChange);
