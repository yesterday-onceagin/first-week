import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';
import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import IconButton from '@components/IconButton';
import FlexDataTable from '@components/FlexDataTable';
import Loading from 'react-bootstrap-myui/lib/Loading';
import UserDialog from './components/UserDialog';
import { Tree } from 'rt-tree';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as authorityUserActionCreators } from '../../redux/modules/authority/user';
import { actions as authorityRoleActionCreators } from '../../redux/modules/authority/role';
import { actions as authorityUserGroupActionCreators  } from '../../redux/modules/authority/userGroup';

import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin';
import 'rt-tree/dist/css/rt-select.css';
import './index.less';

let timer = null;

class AuthFlexTable extends React.Component {
  static PropTypes = {
    editable: PropTypes.bool
  };

  static defaultProps = {
    editable: true
  };

  render() {
    let { editable, dataFields, rowTemplate, ...otherProps } = this.props

    if (!editable) {
      dataFields.splice(7, 1)
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
          <div childNodes={rowData => (
            rowData.group_name ? (
              <OverlayTrigger trigger="hover" placement="top"
                overlay={(<Tooltip>{rowData.group_name}</Tooltip>)}>
                <div style={this.STYLE_SHEET.textLimit}>
                  <span style={this.STYLE_SHEET.groupText}>{rowData.group_name}</span>
                </div>
              </OverlayTrigger>
            ) : null
          )} />
          <div childNodes={rowData => (
            rowData.role_names.length > 0 ? (
              <OverlayTrigger trigger="hover" placement="top"
                overlay={(<Tooltip>{rowData.role_names.join('、')}</Tooltip>)}>
                <div style={this.STYLE_SHEET.textLimit}>{rowData.role_names.join('、')}</div>
              </OverlayTrigger>
            ) : null
          )} />
        </div>
      );
    }

    return <FlexDataTable
      {...otherProps}
      rowTemplate={rowTemplate}
      dataFields={dataFields}
    />
  }

  STYLE_SHEET = {
    // text-overflow(一个字空间)
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    },
    groupText: {
      display: 'inline-block',
      maxWidth: '145px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      float: 'left'
    }
  }
}

const AuthorityUser = createReactClass({
  displayName: 'AuthorityUser',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      keyword: '',
      userDialog: {
        show: false,
        passwordOnly: false,
        pending: false,
        info: {}
      },
      groupDialog: {
        show: false,
        pending: false,
        info: {}
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('用户管理');
  },

  componentDidMount() {
    // 获取用户
    this.fetchList()
    // 获取所有用户组
    this.props.actions.fetchUserGroupTree()

    // 获取所有的角色
    this.props.actions.fetchRoleList({
      page: 1,
      page_size: 10000,
      keyword: ''
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  render() {
    const { userDialog, groupDialog } = this.state
    const { roleList } = this.props

    return (
      <div className="modules-page-container">
        <div className="data-view authority-user-page" id="authority-user-page">
          {this.renderUserDataTable()}
          {
            userDialog.show && (
              <UserDialog
                show={userDialog.show}
                data={userDialog.info}
                roleList={roleList}
                passwordOnly={userDialog.passwordOnly}
                pending={userDialog.pending}
                onSure={this.handleSubmitUserDialog}
                onHide={this.handleCloseUserDialog}
              />
            )
          }
          {groupDialog.show && this.renderGroupDialog()}
        </div>
      </div>
    );
  },

  renderUserDataTable() {
    const { pending, list, total, page } = this.props
    const { keyword } = this.state

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
          rowData.group_name ? (
            <OverlayTrigger trigger="hover" placement="top"
              overlay={(<Tooltip>{rowData.group_name}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>
                <span style={this.STYLE_SHEET.groupText}>{rowData.group_name}</span>
                <AuthComponent pagecode="用户管理" visiblecode="edit">
                  <i className="dmpicon-edit" style={this.STYLE_SHEET.editIcon} onClick={this.handleChangeGroup.bind(this, rowData)}/>
                </AuthComponent>
              </div>
            </OverlayTrigger>
          ) : null
        )} />
        <div childNodes={rowData => (
          rowData.role_names.length > 0 ? (
            <OverlayTrigger trigger="hover" placement="top"
              overlay={(<Tooltip>{rowData.role_names.join('、')}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>{rowData.role_names.join('、')}</div>
            </OverlayTrigger>
          ) : null
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
    )

    return (
      <div className="user-list-container">
        <div className="user-list-title" style={this.STYLE_SHEET.userListTitle}>
          用户列表
          <AuthComponent pagecode="用户管理" visiblecode="edit">
            <div style={{ float: 'right', padding: '13px 0 13px 30px', lineHeight: 1 }}>
              <IconButton
                onClick={this.handleOpenUserDialog.bind(this, null)}
                className="fixed user-add-btn"
                iconClass="dmpicon-add"
              >
                添加用户
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

        <div className="user-list-box">
          <AuthComponent pagecode="用户管理" editProp="editable" editablecode="edit">
            <AuthFlexTable flexDataTableId="datatable-wrapper"
              tableMinWidth={600}
              headerHeight={40}
              lineHeight={40}
              rowTemplate={rowTemplate}
              hasNext={!Array.isArray(list) || list.length < total}
              dataFields={this.DATA_FIELDS}
              onFetchData={total > this.PAGE_SIZE ? this.fetchList.bind(this, page + 1) : false}
              fetchAction="scroll"
              data={list}
            />
          </AuthComponent>
          <Loading show={pending} containerId="datatable-wrapper"/>
        </div>
      </div>
    )
  },

  renderGroupDialog() {
    const userGroupTree = this.props.userGroupTree
    const { show, info, pending } = this.state.groupDialog

    return <Dialog
      show={show}
      onHide={this.handleCloseGroupDialog}
      backdrop="static"
      size={{ width: '450px', height: '400px' }}
      className="data-view-user-group-dialog"
      id="data-view-user-group-dialog"
    >
      <Dialog.Header closeButton>
        <Dialog.Title>修改 [{info.name}] 的用户组</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body style={this.STYLE_SHEET.userGroupDialogScroll}>
        <Tree
          defaultExpanded={Array.isArray(userGroupTree) && userGroupTree.length > 0 ? [userGroupTree[0].id] : []}
          data={Array.isArray(userGroupTree) && userGroupTree.length > 0 ? userGroupTree : []}
          selected={[info.group_id || '']}
          bordered={false}
          onChange={this.handleChangeTree}
        />
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          bsStyle="primary"
          loading={pending}
          onClick={this.handleSureGroupDialog}
        >
          确定
        </Button>
        <Button bsStyle="default" onClick={this.handleCloseGroupDialog}>取消</Button>
      </Dialog.Footer>
    </Dialog>
  },

  handleChangeTree(value) {
    this.setState({
      groupDialog: {
        ...this.state.groupDialog,
        info: {
          ...this.state.groupDialog.info,
          group_id: value[0]
        }
      }
    })
  },

  handleChangeGroup(data) {
    this.setState({
      groupDialog: {
        show: true,
        info: {
          group_id: data.group_id || '',
          id: data.id || '',
          name: data.name || '',
          account: data.account || '',
          email: data.email || '',
          mobile: data.mobile || '',
          role_ids: data.role_ids || []
        }
      }
    })
  },

  handleCloseGroupDialog() {
    this.setState({
      groupDialog: {
        show: false,
        info: {}
      }
    })
  },

  handleSureGroupDialog() {
    // start pending
    this.setState({
      groupDialog: {
        ...this.state.groupDialog,
        pending: true
      }
    })

    const data = this.state.groupDialog.info
    this.props.actions.saveUser(data, (json) => {
      let show = false

      if (!json.result) {
        show = true
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
        // 当前行
        this.fetchList()
      }

      // end pending
      this.setState({
        groupDialog: {
          ...this.state.groupDialog,
          pending: false,
          show
        }
      })
    });
  },

  handleDeleteUser(userId) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该用户吗？</span>,
      content: '我已知晓并确认风险, 确定删除！',
      checkbox: true,
      ok: () => {
        this.props.actions.deleteUser(userId, (json) => {
          if (!json.result) {
            this.showErr(json.msg)
          } else {
            this.showSucc('删除成功！')
            this.fetchList()
          }
        })
      }
    });
  },

  handleChangeKeyword(e) {
    clearTimeout(timer)
    const value = e.target.value

    this.setState({
      keyword: value
    })

    timer = setTimeout(() => {
      this.fetchList(1, value)
    }, 300)
  },

  handleClearKeyword() {
    this.setState({
      keyword: ''
    })

    this.fetchList(1, '')
  },

  // 提交USER新增/编辑
  handleSubmitUserDialog(data) {
    // start pending
    this.setState({
      userDialog: {
        ...this.state.userDialog,
        pending: true
      }
    })
    // 添加
    if (!data.id) {
      // 复制 group_id
      data.group_id = this.DEFAULT_GROUP_ID
      // 新增
      this.props.actions.saveUser(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserDialog();
          this.fetchList()
        }
      });
    } else if (this.state.userDialog.passwordOnly) {
      // 仅修改密码时
      this.props.actions.resetUserPassword({
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
      this.props.actions.saveUser(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseUserDialog();
          // 当前行
          this.fetchList()
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
        pending: false,
        info: {}
      }
    });
  },

  // 打开USER对话框
  handleOpenUserDialog(data) {
    let info = this.state.userDialog.info

    info = data ? Object.assign({}, { ...info, ...data }) : info

    this.setState({
      userDialog: {
        show: true,
        passwordOnly: false,
        info
      }
    });
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

  fetchList(page = page || 1, keyword = keyword || this.state.keyword) {
    this.props.actions.fetchUserList({
      page,
      keyword,
      page_size: this.PAGE_SIZE
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  showErr(msg) {
    // end pending 
    this.setState({
      userDialog: {
        ...this.state.userDialog,
        pending: false
      }
    })

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

  DATA_FIELDS: [{
    idField: true,
    name: '序号'
  }, {
    key: 'name',
    name: '姓名',
    width: '120px'
  }, {
    key: 'account',
    name: '帐号',
    width: '100px'
  }, {
    key: 'email',
    name: '邮箱',
    width: '120px'
  }, {
    key: 'mobile',
    name: '手机',
    width: '100px'
  }, {
    key: 'group_name',
    name: '用户组',
    width: '200px'
  }, {
    key: 'role_names',
    name: '角色',
    width: '150px'
  }, {
    key: 'actions',
    name: '操作',
    width: '200px',
  }],

  STYLE_SHEET: {
    userListTitle: {
      height: '50px',
      lineHeight: '50px',
      padding: '0 15px',
      color: '#8EA4B0'
    },
    userGroupDialogScroll: {
      height: '311px',
      overflowY: 'scroll',
      paddingTop: 0,
      paddingBottom: 0
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
    editIcon: {
      marginLeft: '5px',
      cursor: 'pointer',
      color: '#6E8CAF'
    },
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    },
    groupText: {
      display: 'inline-block',
      maxWidth: '145px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      float: 'left'
    }
  },

  PAGE_SIZE: 40,

  DEFAULT_GROUP_ID: '00000000-0000-0000-1000-000000000000'

});

const stateToProps = state => ({
  ...state.authorityUser,
  roleList: state.authorityRole.roleList
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, authorityUserActionCreators, authorityRoleActionCreators),  dispatch) });

export default connect(stateToProps, dispatchToProps)(AuthorityUser);
