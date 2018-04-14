import React from 'react'
import PropTypes from 'prop-types'

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import IconButton from '@components/IconButton';
import FlexDataTable from '@components/FlexDataTable';
import GroupTree from '@components/GroupTree';
import UserGroupDialog from './components/UserGroupDialog';
import UserDialog from './components/UserDialog';

import { actions as userActionCreators } from '../../redux/modules/organization/user';
import { actions as userGroupActionCreators } from '../../redux/modules/organization/userGroup';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin';

import './organization.less';

const OrganizationUser = createReactClass({
  displayName: 'OrganizationUser',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      keyword: '',
      group_id: '',
      userGroupDialog: {
        show: false,
        info: {}
      },
      userDialog: {
        show: false,
        passwordOnly: false,
        info: {}
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('用户管理');
  },

  componentDidMount() {
    const { userGroupTree, actions } = this.props;

    if (!Array.isArray(userGroupTree) || userGroupTree.length === 0) {
      // 获取用户组树
      actions.fetchUserGroupTree((json) => {
        if (json.result) {
          this.setState({ group_id: json.data[0].id });
          this._getUserList(1, json.data[0].id);
        }
      });
    } else {
      this.setState({ group_id: userGroupTree[0].id });
      this._getUserList(1, userGroupTree[0].id);
    }
  },

  render() {
    const { user_pending, user_group_pending, userGroupTree } = this.props;
    const { userGroupDialog, userDialog, group_id } = this.state;

    // 叶子节点模版
    const nodeTemplate = node => (
      <div onClick={this.handleSelectUserGroup.bind(this, node)} style={{
        ...this.STYLE_SHEET.userGroupItemBox,
        paddingRight: `${group_id === node.id ? (node.level !== 0 ? 100 : 70) : 0}px`
      }}>
        {node.name}
        {
          group_id === node.id && (
            <div style={this.STYLE_SHEET.userGroupItemIconBox} className="user-group-item-action-bar">
              <i className="dmpicon-add"
                onClick={this.handleOpenUserGroupDialog.bind(this, node.id, node.path)}
                style={Object.assign({}, { fontWeight: 'bold' }, this.STYLE_SHEET.userGroupItemIcon)}></i>
              <i className="dmpicon-edit"
                onClick={this.handleOpenUserGroupDialog.bind(this, node)}
                style={this.STYLE_SHEET.userGroupItemIcon}></i>
              {
                node.level !== 0 && (
                  <i className="dmpicon-del"
                    onClick={this.handleDeleteUserGroup.bind(this, node)}
                    style={this.STYLE_SHEET.userGroupItemIcon}></i>
                )
              }
            </div>
          )
        }
      </div>
    );

    return (
      <div className="modules-page-container">
        <div className="data-view user-page" id="user-page" style={{ overflow: 'hidden' }}>
          <div className="user-group-list-container" style={this.STYLE_SHEET.userGroupListContainer}>
            <div className="user-group-list-title" style={this.STYLE_SHEET.userGroupListTitle}>
              用户组
            </div>

            <div className="user-group-list-scroll" style={this.STYLE_SHEET.userGroupListScroll}>
              <GroupTree
                activeId={group_id}
                data={userGroupTree}
                nodeTemplate={nodeTemplate}
                nodeHeight={40} />
            </div>
          </div>

          {this.renderUserDataTable()}

          <Loading show={user_pending || user_group_pending} containerId='user-page' />

          {
            userGroupDialog.show && (
              <UserGroupDialog
                show={userGroupDialog.show}
                data={userGroupDialog.info}
                pending={user_group_pending}
                onSure={this.handleSubmitUserGroupDialog.bind(this)}
                onHide={this.handleCloseUserGroupDialog.bind(this)}
              />
            )
          }

          {
            userDialog.show && (
              <UserDialog
                show={userDialog.show}
                data={userDialog.info}
                passwordOnly={userDialog.passwordOnly}
                pending={user_pending}
                onSure={this.handleSubmitUserDialog.bind(this)}
                onHide={this.handleCloseUserDialog.bind(this)}
              />
            )
          }
        </div>
      </div>
    );
  },

  // 渲染用户表格
  renderUserDataTable() {
    const { user_pending, user_group_pending, userList, userTotal, userPage } = this.props
    const { keyword, group_id } = this.state
    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>
        <div childNodes={rowData => (
          rowData.name ? (
            <OverlayTrigger trigger="hover" placement="top"
              overlay={(<Tooltip>{rowData.name}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>{rowData.name}</div>
            </OverlayTrigger>
          ) : null
        )} />
        <div childNodes={rowData => (
          rowData.account ? (
            <OverlayTrigger trigger="hover" placement="top"
              overlay={(<Tooltip>{rowData.account}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>{rowData.account}</div>
            </OverlayTrigger>
          ) : null
        )} />
        <div childNodes={rowData => (
          rowData.email ? (
            <OverlayTrigger trigger="hover" placement="top"
              overlay={(<Tooltip>{rowData.email}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>{rowData.email}</div>
            </OverlayTrigger>
          ) : null
        )} />
        <div childNodes={rowData => (
          <div style={{ width: '100%', height: '100%' }}>
            {rowData.mobile}
          </div>
        )} />
        <div childNodes={rowData => (
          <div style={{ width: '100%', height: '100%', paddingTop: '8px' }} className="user-list-action-bar">
            <IconButton onClick={this.handleOpenUserDialog.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-edit">编辑</IconButton>
            <IconButton onClick={this.handleOpenUserPasswordDialog.bind(this, rowData.id)}
              className="datatable-action"
              iconClass="dmpicon-key">重置密码</IconButton>
            <IconButton onClick={this.handleDeleteUser.bind(this, rowData.id)}
              className="datatable-action"
              iconClass="dmpicon-del">删除</IconButton>
          </div>
        )} />
      </div>
    );

    return (
      <div className="user-list-container" style={this.STYLE_SHEET.userListContainer}>
        <div className="user-list-title" style={this.STYLE_SHEET.userListTitle}>
          用户列表
          <div style={{ float: 'right', padding: '13px 0 13px 30px', lineHeight: 1 }}>
            <IconButton
              onClick={this.handleOpenUserDialog.bind(this, group_id)}
              className="fixed user-add-btn"
              iconClass="dmpicon-add"
            >
              添加用户
            </IconButton>
          </div>

          <div className="form single-search-form" style={{ float: 'right', width: '200px' }}>
            <Input type="text"
              placeholder="请输入姓名/帐号/邮箱"
              value={keyword}
              onChange={this.handleChangeKeyword}
              addonAfter={<i className="dmpicon-search" />}
              className="search-input-box"
            />
            {
              keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}></i>
            }
          </div>
        </div>

        <div className="user-list-box" style={this.STYLE_SHEET.userListBox}>
          <FlexDataTable flexDataTableId="datatable-wrapper"
            tableMinWidth={600}
            headerHeight={40}
            lineHeight={40}
            pending={user_pending || user_group_pending}
            hasNext={!Array.isArray(userList) || userList.length < userTotal}
            dataFields={this.DATA_FIELDS}
            rowTemplate={rowTemplate}
            onFetchData={userTotal > this.PAGE_SIZE ? this.fetchFlowList.bind(this, userPage + 1, group_id) : false}
            fetchAction="scroll"
            data={userList}
          />
        </div>
      </div>
    )
  },

  // 选中用户组
  handleSelectUserGroup(group) {
    // 点击的是已选中的用户组时不处理
    if (group.id === this.state.group_id) {
      return;
    }
    // 更新选中的用户组id
    this.setState({ group_id: group.id });
    // 重新获取用户列表
    this._getUserList(1, group.id);
  },

  // 打开用户组对话框
  handleOpenUserGroupDialog(data, path) {
    if (typeof data === 'string') {
      this.setState({
        userGroupDialog: {
          show: true,
          info: {
            parent_id: data,
            parent_path: path
          }
        }
      });
    } else {
      this.setState({
        userGroupDialog: {
          show: true,
          info: {
            ...data
          }
        }
      });
    }
  },

  // 提交用户组新增/编辑
  handleSubmitUserGroupDialog(data) {
    if (!data.id) {
      // 新增
      this.props.actions.fetchAddUserGroup(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserGroupDialog();
        }
      });
    } else {
      // 编辑
      this.props.actions.fetchUpdateUserGroup(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserGroupDialog();
        }
      });
    }
  },

  // 关闭用户组对话框
  handleCloseUserGroupDialog() {
    this.setState({
      userGroupDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 删除用户组
  handleDeleteUserGroup(group) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该用户组吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteUserGroup(group, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg || '删除成功');
            // 如果删除的是当前选中的用户组
            if (group.id === this.state.group_id) {
              this.setState({ group_id: this.props.userGroupTree[0].id });
              this._getUserList(1, this.props.userGroupTree[0].id);
            }
          }
        })
      }
    });
  },

  // 打开USER对话框
  handleOpenUserDialog(data) {
    if (typeof data === 'string') {
      this.setState({
        userDialog: {
          show: true,
          passwordOnly: false,
          info: {
            group_id: data,
            password: ''
          }
        }
      });
    } else {
      this.setState({
        userDialog: {
          show: true,
          passwordOnly: false,
          info: Object.assign({ group_id: this.state.group_id }, data)
        }
      });
    }
  },

  // 重置用户密码弹窗
  handleOpenUserPasswordDialog(userId) {
    this.setState({
      userDialog: {
        show: true,
        passwordOnly: true,
        info: {
          id: userId,
          password: ''
        }
      }
    })
  },

  // 提交USER新增/编辑
  handleSubmitUserDialog(data) {
    if (!data.id) {
      // 新增
      this.props.actions.fetchAddUser(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserDialog();
        }
      });
    } else if (this.state.userDialog.passwordOnly) {
      // 仅修改密码时
      this.props.actions.fetchResetUserPassword({
        id: data.id,
        password: data.password
      }, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserDialog();
        }
      })
    } else {
      // 编辑
      this.props.actions.fetchUpdateUser(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserDialog();
        }
      });
    }
  },

  // 关闭USER对话框
  handleCloseUserDialog() {
    this.setState({
      userDialog: {
        show: false,
        passwordOnly: false,
        info: {}
      }
    });
  },

  // 删除用户
  handleDeleteUser(userId) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该用户吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteUser(userId, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg || '删除成功');
          }
        })
      }
    });
  },

  // 输入搜索关键字
  handleChangeKeyword(e) {
    this.setState({
      keyword: e.target.value
    }, this._getUserList.bind(this, 1, this.state.group_id));
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation();

    this.setState({
      keyword: ''
    }, this._getUserList.bind(this, 1, this.state.group_id));
  },

  // 获取用户列表
  _getUserList(page = 1, groupId = '') {
    this.props.actions.fetchUserList({
      page,
      group_id: groupId,
      page_size: this.PAGE_SIZE,
      keyword: this.state.keyword || '',
    }, (json) => {
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

  // 数据表格表头字段
  DATA_FIELDS: [{
    idField: true,
    name: '序号'
  }, {
    key: 'name',
    name: '姓名',
    width: '15%',
    minWidth: '100px'
  }, {
    key: 'account',
    name: '帐号',
    width: '100px'
  }, {
    key: 'email',
    name: '邮箱',
    width: '20%',
    minWidth: '100px'
  }, {
    key: 'mobile',
    name: '手机',
    width: '100px'
  }, {
    key: 'actions',
    name: '操作',
    width: '200px',
    minWidth: '200px'
  }],

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
      position: 'relative',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    userGroupItemIconBox: {
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0
    },
    userGroupItemIcon: {
      verticalAlign: 'middle',
      cursor: 'pointer',
      fontSize: '15px',
      marginRight: '15px',
      transition: 'color .3s'
    },
    userListContainer: {
      position: 'absolute',
      left: '292px',
      right: 0,
      top: 0,
      bottom: 0,
      padding: '0 20px'
    },
    userListTitle: {
      height: '50px',
      lineHeight: '50px',
    },
    userListBox: {
      position: 'absolute',
      left: '20px',
      right: '20px',
      top: '50px',
      bottom: 0
    },
    userListActionIcon: {
      transition: 'color .3s',
      fontSize: '16px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      marginRight: '16px'
    },
    userListActionIconLast: {
      transition: 'color .3s',
      fontSize: '16px',
      verticalAlign: 'middle',
      cursor: 'pointer'
    },
    // text-overflow(一个字空间)
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    }
  },

  PAGE_SIZE: 40,
});

const stateToProps = state => ({
  ...state.user,
  ...state.user_group,
  user_pending: state.user.pending,
  user_group_pending: state.user_group.pending
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, userActionCreators, userGroupActionCreators), dispatch) });

export default connect(stateToProps, dispatchToProps)(OrganizationUser);
