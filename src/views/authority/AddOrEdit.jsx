import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import AuthSet from './components/AuthSet';
import Loading from 'react-bootstrap-myui/lib/Loading';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as authorityRoleActionCreators } from '../../redux/modules/authority/role';
  
import TipMixin from '@helpers/TipMixin';

import _ from 'lodash';

import './index.less';

const AuthorityRole = createReactClass({
  displayName: 'AuthorityRole',
  mixins: [TipMixin],
  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentWillMount() {
    const { params } = this.props
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar(params.name, [{
      text: '保存',
      icon: 'dmpicon-save',
      style: 'green',
      func: this.handleSaveAuth,
      ref: 'save-btn'
    }]);
  },

  componentDidMount() {
    this.props.actions.fetchAuthList((json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.CATEGORY = json.data.map(item => item.func_name)
      }
    })
  },

  render() {
    const { authList, auth_pending } = this.props
    return <div className="modules-page-container">
      <div className="data-view authority-add-page" id="authority-add-page">
        <AuthSet
          data={authList}
          select={[]}
          pending={auth_pending}
          onGetInstance={(instance) => { this.authset = instance }}
        />
        <Loading show={auth_pending} containerId="authority-add-page"/>
      </div>
    </div>
  },

  handleSaveAuth() {
    const { params, actions } = this.props
    const auth = this.authset.getAuth()

    actions.saveRoleAuth({
      role_id: params.id,
      funcs: _.flatten(Object.values(auth))
    }, (json) => {
      if (json.result) {
        this.showSucc('保存成功！')
        setTimeout(() => {
          this.context.router.go(-1)
        }, 1500)
      } else {
        this.showErr(json.msg)
      }
    })
  },

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

});

const stateToProps = state => ({
  ...state.authorityRole
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(authorityRoleActionCreators, dispatch) });

export default connect(stateToProps, dispatchToProps)(AuthorityRole);
