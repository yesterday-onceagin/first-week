import React from 'react'
import PropTypes from 'prop-types'

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import GroupTree from '@components/GroupTree';
import OrganDialog from './components/OrganDialog';
import FuncDialog from './components/FuncDialog';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as userGroupActionCreators } from '../../redux/modules/organization/userGroup';

import TipMixin from '@helpers/TipMixin';
import './organization.less';

const OrganizationAuth = createReactClass({
  displayName: 'OrganizationAuth',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    // 定义渲染方法常量
    this.AUTH_TYPES_RENDERER = {
      organ: this.renderOrganOption.bind(this)/*,
      func: this.renderFuncOption.bind(this)*/
    };
    return {
      group_id: '',
      organDialog: {
        show: false,
        info: {}
      },
      funcDialog: {
        show: false
      },
      isTopLevel: true
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('权限管理');
  },

  componentDidMount() {
    const { userGroupTree, actions } = this.props;

    if (!Array.isArray(userGroupTree) || userGroupTree.length === 0) {
      // 获取用户组树
      actions.fetchUserGroupTree((json) => {
        if (json.result) {
          this.handleChangeCurrUserGroup(json.data[0]);
        }
      });
    } else {
      this.handleChangeCurrUserGroup(userGroupTree[0])
    }
  },

  componentWillUpdate(nextProps, nextState) {
    const { userGroupTree } = nextProps
    const { group_id } = nextState
    nextState.isTopLevel = Array.isArray(userGroupTree) && userGroupTree.length > 0 && group_id === userGroupTree[0].id
  },

  render() {
    const { userGroupTree, pending, organ_pending, func_pending, project } = this.props;
    const { group_id, organDialog, funcDialog } = this.state;
    const authModuleNum = project.authTypes.length
    // 叶子节点模版
    const userGroupNodeTemplate = node => (
      <div onClick={this.handleChangeCurrUserGroup.bind(this, node)}
        style={this.STYLE_SHEET.userGroupItemBox}
      >
        {node.name}
      </div>
    );

    return (
      <div className="modules-page-container">
        <div className="data-view auth-page" id="auth-page" style={{ overflow: 'hidden' }}>
          <div className="user-group-list-container" style={this.STYLE_SHEET.userGroupListContainer}>
            <div className="user-group-list-title" style={this.STYLE_SHEET.userGroupListTitle}>
              用户组
            </div>

            <div className="user-group-list-scroll" style={this.STYLE_SHEET.userGroupListScroll}>
              <GroupTree
                key="user-group-tree"
                activeId={group_id}
                data={userGroupTree}
                nodeTemplate={userGroupNodeTemplate}
                nodeHeight={40}
              />
            </div>
          </div>

          <div className="auth-container" style={this.STYLE_SHEET.authContainer}>
            {project.authTypes.map(key => (this.AUTH_TYPES_RENDERER[key] ? this.AUTH_TYPES_RENDERER[key](authModuleNum) : null))}
          </div>

          {
            !organDialog.show && !funcDialog.show && (
              <Loading show={pending || organ_pending || func_pending} containerId='auth-page' />
            )
          }

          {
            organDialog.show && (
              <OrganDialog
                show={organDialog.show}
                groupId={group_id}
                onSure={this.handleSubmitOrganDialog}
                onHide={this.handleCloseOrganDialog}
                showErr={this.showErr}
              />
            )
          }

          {
            funcDialog.show && (
              <FuncDialog
                show={funcDialog.show}
                groupId={group_id}
                onSure={this.handleSubmitFuncDialog}
                onHide={this.handleCloseFuncDialog}
                showErr={this.showErr}
              />
            )
          }
        </div>
      </div>
    );
  },

  // 渲染组织机构权限配置
  renderOrganOption(authModuleNum) {
    const { userOrganTree } = this.props
    const { isTopLevel } = this.state
    // 权限叶子节点模版
    const treeNodeTemplate = node => (
      <div>{node.name}</div>
    );
    return (
      <div className="auth-content-box auth-organ" style={{
        ...this.STYLE_SHEET.authBox,
        maxHeight: `${100 / authModuleNum}%`
      }}>
        <div className="auth-box-title" style={this.STYLE_SHEET.authBoxTitle}>
          组织机构访问权限
          {
            !isTopLevel && (
              <AuthComponent pagecode="组织权限" visiblecode="edit">
                <i className="dmpicon-edit"
                  onClick={this.handleOpenOrganDialog}
                  style={this.STYLE_SHEET.authBoxIcon}
                />
              </AuthComponent>
            )
          }
        </div>
        <div className="auth-box-wrap" style={this.STYLE_SHEET.authBoxWrap}>
          {
            Array.isArray(userOrganTree) && userOrganTree.length > 0 ? (
              <GroupTree
                key="auth-content-organ-tree"
                className="auth-content-organ-tree"
                data={userOrganTree}
                nodeTemplate={treeNodeTemplate}
                nodeHeight={24}
              />
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '20px' }}>没有为此用户组设置组织机构权限</div>
            )
          }
        </div>
      </div>
    )
  },

  // 渲染功能权限配置
  renderFuncOption(authModuleNum) {
    const { userFuncTree } = this.props
    const { isTopLevel } = this.state
    // 权限叶子节点模版
    const treeNodeTemplate = node => (
      <div>{node.name}</div>
    );
    return (
      <div className="auth-content-box auth-func" style={{
        ...this.STYLE_SHEET.authBox,
        maxHeight: `${100 / authModuleNum}%`
      }}>
        <div className="auth-box-title" style={this.STYLE_SHEET.authBoxTitle}>
          功能访问权限
          {
            !isTopLevel && (
              <i className="dmpicon-edit"
                onClick={this.handleOpenFuncDialog}
                style={this.STYLE_SHEET.authBoxIcon}
              />
            )
          }
        </div>
        <div className="auth-box-wrap" style={this.STYLE_SHEET.authBoxWrap}>
          {
            Array.isArray(userFuncTree) && userFuncTree.length > 0 ? (
              <GroupTree
                key="auth-content-func-tree"
                className="auth-content-func-tree"
                data={userFuncTree}
                nodeTemplate={treeNodeTemplate}
                nodeHeight={24}
              />
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '20px' }}>没有为此用户组设置访问权限</div>
            )
          }
        </div>
      </div>
    )
  },

  // 打开组织机构权限设置弹窗
  handleOpenOrganDialog() {
    this.setState({
      organDialog: {
        show: true,
        info: {
          group_id: this.state.group_id,
          organ_list: []
        }
      }
    });
  },

  // 提交组织机构权限设置弹窗
  handleSubmitOrganDialog(data) {
    this.props.actions.fetchUpdateUserGroupOrgan(data, (json) => {
      if (json.result) {
        this.showSucc(json.msg);
        this.handleCloseOrganDialog();
        this._getUserGroupOrgan(this.state.group_id);
      } else {
        this.showErr(json.msg);
      }
    });
  },

  // 关闭组织机构权限设置弹窗
  handleCloseOrganDialog() {
    this.setState({
      organDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 打开功能访问权限设置弹窗
  handleOpenFuncDialog() {
    this.setState({
      funcDialog: {
        show: true,
        info: {
          group_id: this.state.group_id,
          func_list: []
        }
      }
    });
  },

  // 提交功能访问权限设置
  handleSubmitFuncDialog(data) {
    this.props.actions.fetchUpdateUserGroupFunc(data, (json) => {
      if (json.result) {
        this.showSucc(json.msg);
        this.handleCloseFuncDialog();
        this._getUserGroupFunc(this.state.group_id);
      } else {
        this.showErr(json.msg);
      }
    });
  },

  // 关闭功能访问权限设置弹窗
  handleCloseFuncDialog() {
    this.setState({
      funcDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 选中用户组
  handleChangeCurrUserGroup(group) {
    // 点击的是已选中的用户组时不处理
    if (!group || group.id === this.state.group_id) {
      return;
    }
    // 设置当前选中的用户组id
    this.setState({ group_id: group.id });
    // 根据用户组id重新获取组织机构
    this._getUserGroupOrgan(group.id);
    // 根据用户组id重新获取权限菜单
    this._getUserGroupFunc(group.id);
  },

  // 获取组织机构树
  _getUserGroupOrgan(group_id) {
    this.props.actions.fetchUserGroupOrgan(group_id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
  },

  // 获取菜单权限树
  _getUserGroupFunc(group_id) {
    this.props.actions.fetchUserGroupFunc(group_id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
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

  STYLE_SHEET: {
    userGroupListContainer: {
      width: '280px',
      height: '100%'
    },
    userGroupListTitle: {
      height: '50px',
      paddingLeft: '30px',
      lineHeight: '49px',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid'
    },
    userGroupListScroll: {
      width: '100%',
      height: '100%',
      overflowX: 'hidden',
      overflowY: 'auto'
    },
    userGroupItemBox: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    authContainer: {
      position: 'absolute',
      left: '292px',
      right: 0,
      top: 0,
      bottom: 0,
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column'
    },
    authBox: {
      minHeight: '50px',
      width: '100%',
      padding: '10px 0',
      display: 'flex',
      flexDirection: 'column'
    },
    authBoxTitle: {
      width: '100%',
      height: '30px',
      lineHeight: '30px',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      position: 'relative',
    },
    authBoxIcon: {
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'color .3s',
      position: 'absolute',
      right: 0,
      top: '7px'
    },
    authBoxWrap: {
      flex: 1,
      marginTop: '10px',
      overflowX: 'hidden',
      overflowY: 'auto'
    },
  },
});

const stateToProps = state => ({
  ...state.user_group,
  project: state.user.project
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(userGroupActionCreators, dispatch) });

export default connect(stateToProps, dispatchToProps)(OrganizationAuth);
