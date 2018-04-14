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
import SelectionButton from '@components/SelectionButton';
import UserGroupDialog from './components/UserGroupDialog';
import AddUserDialog from './components/AddUserDialog';
import RoleSetDialog from './components/RoleSetDialog';

import AuthComponent from '@components/AuthComponent';

import { actions as authorityUserGroupActionCreators } from '../../redux/modules/authority/userGroup';
import { actions as authorityUserActionCreators } from '../../redux/modules/authority/user';
import { actions as authorityRoleActionCreators } from '../../redux/modules/authority/role';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin';

import './index.less';

class AuthFlexTable extends React.Component {
  static PropTypes = {
    editable: PropTypes.bool
  };

  static defaultProps = {
    editable: true
  }

  render() {
    let { editable, dataFields, rowTemplate, ...otherProps } = this.props

    if (!editable) {
      rowTemplate = (
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
        </div>
      )
      dataFields = [{
        key: 'id',
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
      }]
    }

    return <FlexDataTable
      {...otherProps}
      dataFields={dataFields}
      rowTemplate={rowTemplate}
    />
  }

  STYLE_SHEET = {
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    }
  }
}

const AuthorityUserGroup = createReactClass({
  displayName: 'AuthorityUserGroup',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      keyword: '',
      group_id: '',
      group_name: '',
      user_pending: false,
      userGroupDialog: {
        show: false,
        info: {}
      },
      addUserDialog: {
        show: false,
        select: []
      },
      roleDialog: {
        pending: false,
        show: false,
        select: []
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('用户组管理');
  },

  componentDidMount() {
    const { userGroupTree, actions } = this.props;

    if (!Array.isArray(userGroupTree) || userGroupTree.length === 0) {
      // 获取用户组树
      actions.fetchUserGroupTree((json) => {
        if (json.result) {
          this.setState({
            group_id: json.data[0].id,
            group_name: json.data[0].name
          });
          this.fetchUserList(1, json.data[0].id);
          // 初始化数据
          this.fetchInitData(json.data[0].id)
        }
      });
    } else {
      this.setState({ group_id: userGroupTree[0].id, group_name: userGroupTree[0].name });
      this.fetchUserList(1, userGroupTree[0].id);
      // 初始化数据
      this.fetchInitData(userGroupTree[0].id)
    }

    // 获取 角色列表
    this.props.actions.fetchRoleList({
      page: 1,
      page_size: 10000,
      keyword: ''
    })
  },

  render() {
    const { userGroupTree, roleList, un_group_list, un_group_total, un_group_page, un_group_pending, user_group_pending } = this.props;
    const { userGroupDialog, addUserDialog, roleDialog, group_id, group_name } = this.state;

    const group = {
      id: group_id,
      name: group_name
    }

    // 叶子节点模版
    const nodeTemplate = node => (
      <div className="clearfix" style={{
        ...this.STYLE_SHEET.userGroupItemBox,
        // paddingRight: `${group_id === node.id ? (node.level !== 0 ? 100 : 70) : 0}px`
      }}>
        <span className="node-text">{node.name}</span>
        {
          group_id === node.id && this.DEFAULT_GROUP_ID !== node.id && (
            <AuthComponent pagecode="用户组管理" visiblecode="edit">
              <div style={this.STYLE_SHEET.userGroupItemIconBox} className="user-group-item-action-bar">
                <i className="dmpicon-add"
                  title="添加用户组"
                  onClick={this.handleOpenUserGroupDialog.bind(this, node.id, node.path)}
                  style={Object.assign({}, { fontWeight: 'bold' }, this.STYLE_SHEET.userGroupItemIcon)}></i>
                <i className="dmpicon-edit"
                  onClick={this.handleOpenUserGroupDialog.bind(this, node)}
                  title="编辑用户组"
                  style={this.STYLE_SHEET.userGroupItemIcon}></i>
                {
                  node.level !== 0 && (
                    <i className="dmpicon-del"
                      title="删除"
                      onClick={this.handleDeleteUserGroup.bind(this, node)}
                      style={this.STYLE_SHEET.userGroupItemIcon}></i>
                  )
                }
              </div>
            </AuthComponent>
          )
        }
      </div>
    );

    const pagination = {
      total: un_group_total,
      page: un_group_page,
      pageSize: this.PAGE_SIZE
    }

    return (
      <div className="modules-page-container">
        <div className="data-view authority-user-group-page" id="authority-user-group-page">
          <div className="user-group-list-container" style={this.STYLE_SHEET.userGroupListContainer}>
            <div className="user-group-list-title" style={this.STYLE_SHEET.userGroupListTitle}>
              用户组
            </div>

            <div className="user-group-list-scroll" style={this.STYLE_SHEET.userGroupListScroll}>
              <GroupTree
                activeId={group_id}
                data={userGroupTree}
                nodeTemplate={nodeTemplate}
                onClickLeaf={this.handleSelectUserGroup.bind(this)}
                nodeHeight={40} />
            </div>
          </div>

          {this.renderUserDataTable()}

          {
            userGroupDialog.show && (
              <UserGroupDialog
                show={userGroupDialog.show}
                data={userGroupDialog.info}
                pending={user_group_pending}
                onSure={this.handleSubmitUserGroupDialog}
                onHide={this.handleCloseUserGroupDialog}
              />
            )
          }
          {
            addUserDialog.show && (
              <AddUserDialog
                show={addUserDialog.show}
                userList={un_group_list}
                pending={un_group_pending}
                pagination={pagination}
                onFetchUserList={this.handleFetchUserList}
                onSure={this.handleSubmitUserDialog}
                onHide={this.handleCloseUserDialog}
              />
            )
          }
          {
            roleDialog.show && (
              <RoleSetDialog
                show={roleDialog.show}
                pending={roleDialog.pending}
                group={group}
                roleList={roleList}
                selectList={roleDialog.select}
                onSure={this.handleSureRole}
                onHide={this.handleCloseRoleDialog}
                onCreate={this.handleCreateRole}
              />
            )
          }
        </div>
      </div>
    );
  },

  // 渲染用户表格
  renderUserDataTable() {
    const { list, total, page, roleList, userGroupTree } = this.props
    const { keyword, group_id, roleDialog, user_pending } = this.state
    // 已选角色列表
    const selectItems = roleList.filter(item => roleDialog.select.indexOf(item.id) > -1)
    // 是不是顶级用户组
    const isTopGroud = userGroupTree && userGroupTree[0] ? (group_id === userGroupTree[0].id) : true
    // 是不是默认组
    const isDefaultGroup = group_id === this.DEFAULT_GROUP_ID
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
          <div style={{ width: '100%', height: '100%', display: isDefaultGroup ? 'none' : 'block' }}>
            <a href="javascript:;" onClick={this.handleDeleteUser.bind(this, rowData.id)}>移除</a>
          </div>
        )} />
      </div>
    );

    const opItem = this.DATA_FIELDS[this.DATA_FIELDS.length - 1]

    if (isDefaultGroup) {
      opItem.name = ''
      opItem.width = '0px'
    } else {
      opItem.name = '操作'
      opItem.width = '100px'
    }

    return (
      <div className="right-wrap" style={this.STYLE_SHEET.userListContainer}>
        <div className="header-wrap">
          <div className="title-wrap">
            管理组权限
            {
              !isTopGroud && <AuthComponent pagecode="用户组管理" visiblecode="edit">
                <IconButton
                  className="fixed user-add-btn"
                  onClick={this.handleOpenRoleDialog}
                  iconClass="dmpicon-edit"
                >
                  设置角色
                </IconButton>
              </AuthComponent>
            }
          </div>
          {
            selectItems.length > 0 && !isTopGroud && <div className="roles-wrap">
              {
                selectItems.map((item, key) =>
                  <AuthComponent pagecode="用户组管理" editProp="editable" editablecode="edit">
                    <SelectionButton key={key} selected={true} onClick={this.handleRemove.bind(this, item)}>{item.name}</SelectionButton>
                  </AuthComponent>)
              }
            </div>
          }
        </div>
        <div className="user-list-container">
          <div className="user-list-title" style={this.STYLE_SHEET.userListTitle}>
            用户列表
            <AuthComponent pagecode="用户组管理" visiblecode="edit">
              <div style={{ float: 'right', padding: '13px 0 13px 30px', lineHeight: 1 }}>
                <IconButton
                  onClick={this.handleOpenAddUserDialog.bind(this, group_id)}
                  className="fixed user-add-btn"
                  iconClass="dmpicon-add"
                >
                  为用户组添加用户
                </IconButton>
              </div>
            </AuthComponent>

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
            <AuthComponent pagecode="用户组管理" editProp="editable">
              <AuthFlexTable flexDataTableId="datatable-wrapper"
                tableMinWidth={600}
                headerHeight={40}
                lineHeight={40}
                hasNext={!Array.isArray(list) || list.length < total}
                dataFields={this.DATA_FIELDS}
                rowTemplate={rowTemplate}
                onFetchData={total > this.PAGE_SIZE ? this.fetchUserList.bind(this, page + 1, group_id) : false}
                fetchAction="scroll"
                data={list}
              />
            </AuthComponent>
            <Loading show={user_pending} containerId="datatable-wrapper" />
          </div>
        </div>
      </div>
    )
  },

  handleCreateRole() {
    const { group_name } = this.state

    this.props.actions.saveRoleItem({
      name: `${group_name}角色`,
      description: ''
    }, (json) => {
      this.hideConfirm();
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        // 建立 角色和 用户组的关系
        this.props.actions.saveUserGroupRoles({
          role_ids: [json.data.id],
          group_id: this.state.group_id
        }, (_json) => {
          if (_json.result) {
            this.context.router.push(`/authority/add/${json.data.id}/${json.data.name}`)
          } else {
            this.showErr(_json.msg)
          }
        })
      }
    })
  },

  handleRemove(item) {
    const select = this.state.roleDialog.select.slice()
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要将删除该角色吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        const newSelect = select.filter(id => item.id !== id)

        this.props.actions.saveUserGroupRoles({
          role_ids: newSelect,
          group_id: this.state.group_id
        }, (json) => {
          if (!json.result) {
            this.showErr(json.msg)
          } else {
            this.setState({
              roleDialog: {
                ...this.state.roleDialog,
                select: newSelect
              }
            })
          }
        })
      }
    });
  },

  handleOpenRoleDialog() {
    this.setState({
      roleDialog: {
        ...this.state.roleDialog,
        show: true
      }
    })
  },

  handleSureRole(select) {
    // start pending 
    this.setState({
      roleDialog: {
        ...this.state.roleDialog,
        pending: true
      }
    })

    this.props.actions.saveUserGroupRoles({
      role_ids: select,
      group_id: this.state.group_id
    }, (json) => {
      let show = true
      let newSelect = []

      if (json.result) {
        show = false
        newSelect = select.slice()
      } else {
        this.showErr(json.msg)
      }

      this.setState({
        roleDialog: {
          show,
          pending: false,
          select: newSelect
        }
      })
    })
  },

  handleCloseRoleDialog() {
    this.setState({
      roleDialog: {
        ...this.state.roleDialog,
        show: false
      }
    })
  },

  // 选中用户组
  handleSelectUserGroup(group) {
    // 点击的是已选中的用户组时不处理
    if (group.id === this.state.group_id) {
      return;
    }
    // 更新选中的用户组id
    this.setState({
      group_id: group.id,
      group_name: group.name,
      keyword: ''
    });
    // 强制清空避免 查询列表数据
    this.state.keyword = ''
    // 重新获取用户列表
    this.fetchUserList(1, group.id);
    // 初始化数据
    this.fetchInitData(group.id)
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
      info: <span style={{ lineHeight: '30px' }}>确定要将删除用户组吗？</span>,
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
              this.setState({
                group_id: this.props.userGroupTree[0].id,
                group_name: this.props.userGroupTree[0].name
              });
              this.fetchUserList(1, this.props.userGroupTree[0].id);
              this.fetchInitData(this.props.userGroupTree[0].id)
            }
          }
        })
      }
    });
  },

  // 打开USER对话框
  handleOpenAddUserDialog() {
    this.setState({
      addUserDialog: {
        ...this.state.addUserDialog,
        show: true
      }
    });

    // 获取当前组以外的用户
    this.fetchUnGroupUser(this.state.group_id)
  },

  // 提交USER新增
  handleSubmitUserDialog(data) {
    // 模拟增加用户
    this.props.actions.addGroupUser({
      group_id: this.state.group_id,
      user_ids: data.map(item => item.id)
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.setState({
          keyword: '',
          addUserDialog: {
            ...this.state.addUserDialog,
            select: data,
            show: false
          }
        })
        this.fetchUserList(1, this.state.group_id)
      }
    })
  },

  // 关闭USER对话框
  handleCloseUserDialog() {
    this.setState({
      addUserDialog: {
        ...this.state.addUserDialog,
        show: false
      }
    });
  },

  // 删除用户
  handleDeleteUser(userId) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要将用户从用户组中移除吗？</span>,
      content: '我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.deleteGroupUser({ user_id: userId }, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '移除失败');
          } else {
            this.showSucc('移除成功');
            this.fetchUserList(1, this.state.group_id)
          }
        })
      }
    });
  },

  // 输入搜索关键字
  handleChangeKeyword(e) {
    this.setState({
      keyword: e.target.value
    }, this.fetchUserList.bind(this, 1, this.state.group_id));
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation();

    this.setState({
      keyword: ''
    }, this.fetchUserList.bind(this, 1, this.state.group_id));
  },

  handleFetchUserList(value, page) {
    this.fetchUnGroupUser(this.state.group_id, page, value)
  },

  // 获取用户列表
  fetchUserList(page = 1, groupId = '') {
    // start pending
    this.setState({ user_pending: true })

    this.props.actions.fetchUserList({
      page,
      group_id: groupId,
      page_size: this.PAGE_SIZE,
      keyword: this.state.keyword || '',
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
      // end pending
      this.setState({ user_pending: false })
    });
  },

  fetchInitData(groupId) {
    // 清空上次的 select
    this.setState({
      roleDialog: {
        ...this.state.roleDialog,
        select: []
      }
    })
    // 获取当前组的角色
    this.props.actions.fetchGroupRoles({
      group_id: groupId
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.setState({
          roleDialog: {
            ...this.state.roleDialog,
            select: json.data.items.map(item => item.id)
          }
        })
      }
    })
  },

  fetchUnGroupUser(group_id, page = page || 1, keyword = keyword || '') {
    this.props.actions.fetchUnGroupUser({
      page,
      keyword,
      nor_group_id: group_id,
      page_size: this.PAGE_SIZE
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

  // 数据表格表头字段
  DATA_FIELDS: [{
    key: 'id',
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
    width: '100px',
    minWidth: '100px'
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
      height: 'calc(100% - 50px)',
      overflowX: 'hidden',
      overflowY: 'auto'
    },
    userGroupItemBox: {
      position: 'relative',
      // overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    userGroupItemIconBox: {
      height: '100%',
      display: 'inline-block',
      // position: 'absolute',
      right: 0,
      top: 0
    },
    userGroupItemIcon: {
      verticalAlign: 'middle',
      cursor: 'pointer',
      fontSize: '15px',
      marginRight: '8px',
      transition: 'color .3s'
    },
    userListContainer: {
      position: 'absolute',
      left: '292px',
      right: 0,
      top: 0,
      bottom: 0,
      padding: '0 20px',
      display: 'flex',
      flex: 1,
      flexDirection: 'column'
    },
    userListTitle: {
      height: '50px',
      lineHeight: '50px',
    },
    userListBox: {
      position: 'absolute',
      left: '0px',
      right: '0px',
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

  DEFAULT_GROUP_ID: '00000000-0000-0000-1000-000000000000'
});


const stateToProps = state => ({
  ...state.authorityUser,
  ...state.authorityUserGroup,
  roleList: state.authorityRole.roleList
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, authorityUserActionCreators, authorityUserGroupActionCreators, authorityRoleActionCreators), dispatch) });

export default connect(stateToProps, dispatchToProps)(AuthorityUserGroup);
