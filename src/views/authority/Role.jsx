import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import DataTable from 'react-bootstrap-myui/lib/DataTable';
import AuthSet from './components/AuthSet';
import AddUserDialog from './components/AddUserDialog';
import { Form, ValidatedInput } from '@components/bootstrap-validation';
import IconButton from '@components/IconButton';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as authorityRoleActionCreators } from '../../redux/modules/authority/role';

import TipMixin from '@helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin';
import { DEFAULT_PAGINATION_OPTIONS } from '../../constants/paginationOptions';

import _ from 'lodash';

import './index.less';

let timer = null

class AuthFlexTabel extends React.Component {
  static PropTypes = {
    editable: PropTypes.bool
  };

  static defaultProps = {
    editable: true
  }

  render() {
    let { editable, dataFields, rowTemplate, ...otherProps } = this.props

    if (!editable) {
      dataFields.splice(5, 1)
      rowTemplate = <tr>
        <td>%id%</td>
        <td>%name%</td>
        <td>%account%</td>
        <td>%email%</td>
        <td>%mobile%</td>
      </tr>
    }

    return <DataTable
      {...otherProps}
      dataFields={dataFields}
      rowTemplate={rowTemplate}
    />
  }
}

const AuthorityRole = createReactClass({
  displayName: 'AuthorityRole',
  mixins: [TipMixin, ConfirmsMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      keyword: '',
      userKeyword: '',
      roleActive: 0,
      moudeleActive: 0,
      categoryActive: 0,
      roleDialog: {
        show: false,
        pending: false
      },
      info: {
        id: '',
        name: '',
        description: ''
      },
      addUserDialog: {
        show: false,
        select: []
      },
      currentAuth: [],
      currentAuthSelect: []
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('角色管理');
  },

  componentDidMount() {
    // 请求 角色 列表
    this.fetchRoleList()
    // 请求权限列表
    this.props.actions.fetchAuthList((json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  render() {
    const { keyword, roleActive, moudeleActive, addUserDialog, userKeyword, currentAuthSelect } = this.state
    const { auth_pending, authList, un_user_pending, un_role_user, un_page, un_total, user_pending, roleList } = this.props

    const pagination = {
      total: un_total,
      page: un_page,
      pageSize: this.PAGE_SIZE
    }

    return (
      <div className="modules-page-container">
        <div className="data-view authority-role-page" id="authority-role-page">
          <div className="left-wrap">
            <div className="form single-search-form">
              <div style={{ width: '230px', position: 'relative' }}>
                <Input type="text"
                  placeholder="请输入关键词搜索"
                  value={keyword}
                  onChange={this.handleChangeKeyword.bind(this, 'keyword')}
                  addonAfter={<i className="dmpicon-search" />}
                  className="search-input-box"
                />
                {
                  keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword.bind(this, 'keyword')}></i>
                }
              </div>
              <AuthComponent pagecode="角色管理" visiblecode="edit">
                <OverlayTrigger
                  trigger="hover"
                  placement="top"
                  overlay={(<Tooltip>新增角色</Tooltip>)}
                >
                  <i className="dmpicon-add" onClick={this.handleAddRole} />
                </OverlayTrigger>
              </AuthComponent>
            </div>
            <div className="role-list" id="role-list">
              {
                roleList.length > 0 ? roleList.map((item, key) => (
                  <div
                    key={key}
                    className={`item ${key === roleActive ? 'active' : ''}`}
                    onClick={this.handleSelectTab.bind(this, 'roleActive', key)}
                  >
                    {this.ADMIN_ROLE_ID.indexOf(item.id) > -1 && <i className="dmpicon-key" style={this.STYLE_SHEET.keyIcon}></i>}
                    <OverlayTrigger
                      trigger="hover"
                      placement="top"
                      overlay={(<Tooltip>{item.name}</Tooltip>)}
                    >
                      <span className="limit-name">{item.name}</span>
                    </OverlayTrigger>
                    <AuthComponent pagecode="角色管理" visiblecode="edit">
                      <span className="btn-opts">
                        {this.ADMIN_ROLE_ID.indexOf(item.id) === -1 && <i className="dmpicon-edit" onClick={this.handleEditRole.bind(this, item)}></i>}
                        {this.ADMIN_ROLE_ID.indexOf(item.id) === -1 && <i className="dmpicon-del" onClick={this.handleDelRole.bind(this, item)}></i>}
                      </span>
                    </AuthComponent>
                  </div>
                )) : (
                    <div className="nothing">
                      <span>
                        {keyword ? '没有符合条件的角色' : '暂无角色'}
                        {/* {keyword ? '没有符合条件的角色，请' : '暂无角色，请先'} */}
                        {/* <a href="javascript:;" style={{ marginLeft: '5px' }} onClick={this.handleAddRole}>
                        添加角色
                      </a> */}
                      </span>
                    </div>
                  )
              }
            </div>
          </div>
          <div className="main-wrap" id="main-wrap">
            <div className="inner-wrap">
              {
                roleList.length > 0 && <div>
                  <div className="title">{roleList[roleActive] ? roleList[roleActive].name : ''}</div>
                  <div className="module-tabs">
                    {
                      this.MODULE.map((item, key) => (
                        <div
                          key={key}
                          className={`item ${key === moudeleActive ? 'active' : ''}`}
                          onClick={this.handleSelectTab.bind(this, 'moudeleActive', key)}
                        >
                          {item}
                        </div>
                      ))
                    }
                    {
                      moudeleActive === 1 && [
                        <AuthComponent pagecode="角色管理" visiblecode="edit">
                          <div key={0} style={{ float: 'right', lineHeight: 1 }}>
                            <IconButton
                              onClick={this.handleOpenAddUserDialog}
                              className="fixed user-add-btn"
                              iconClass="dmpicon-add"
                            >
                              为角色添加用户
                            </IconButton>
                          </div>
                        </AuthComponent>,
                        <div key={1} className="form single-search-form" style={{ float: 'right', width: '200px' }}>
                          <Input type="text"
                            placeholder="请输入名字搜索"
                            value={userKeyword}
                            onChange={this.handleChangeKeyword.bind(this, 'userKeyword')}
                            addonAfter={<i className="dmpicon-search" />}
                            className="search-input-box"
                          />
                          {
                            userKeyword && <i className="dmpicon-close" onClick={this.handleClearKeyword.bind(this, 'userKeyword')}></i>
                          }
                        </div>
                      ]
                    }
                  </div>
                  {moudeleActive === 0 &&
                    <AuthComponent pagecode="角色管理" editProp="editable" editablecode="edit">
                      <AuthSet
                        data={authList}
                        select={currentAuthSelect}
                        pending={auth_pending}
                        disabled={roleList[roleActive] ? this.ADMIN_ROLE_ID.indexOf(roleList[roleActive].id) > -1 : false}
                        onGetInstance={(instance) => { this.authset = instance }}
                      />
                    </AuthComponent>
                  }
                  {moudeleActive === 1 && this.renderUserList()}
                </div>
              }
              {
                roleList.length > 0 && moudeleActive === 0 && this.ADMIN_ROLE_ID.indexOf(roleList[roleActive].id) === -1 &&
                <div className="footer">
                  <AuthComponent pagecode="角色管理" visiblecode="edit">
                    <Button bsStyle="primary" bsSize="small" onClick={this.handleSaveAuth}>保存</Button>
                  </AuthComponent>
                </div>
              }
            </div>
            <Loading show={user_pending} containerId="main-wrap" />
          </div>
        </div>
        {this.renderRoleDialog()}
        {
          addUserDialog.show && (
            <AddUserDialog
              show={addUserDialog.show}
              userList={un_role_user}
              pending={un_user_pending}
              pagination={pagination}
              onFetchUserList={this.handleFetchUserList}
              onSure={this.handleSubmitUserDialog}
              onHide={this.handleCloseUserDialog}
            />
          )
        }
      </div>
    );
  },

  renderUserList() {
    const { role_user, total, page } = this.props

    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      text: '姓名',
      name: 'name',
    }, {
      text: '帐号',
      name: 'account',
    }, {
      text: '邮箱',
      name: 'email',
    }, {
      text: '手机',
      name: 'mobile'
    }, {
      text: '操作描述',
      name: 'action'
    }];

    const rowTemplate = <tr>
      <td>%id%</td>
      <td>%name%</td>
      <td>%account%</td>
      <td>%email%</td>
      <td>%mobile%</td>
      <td style={{ width: '150px' }} childrenNode={rowData => (
        <a href="javascript:;" onClick={this.handleDelUser.bind(this, rowData)}>移除</a>
      )}></td>
    </tr>

    const pagination = {
      ...DEFAULT_PAGINATION_OPTIONS,
      activePage: page,
      onChangePage: this.handleChangePage,
      total
    }

    return <div className="table-panel">
      <AuthComponent pagecode="角色管理" editProp="editable" editablecode="edit">
        <AuthFlexTabel
          tableWrapperId='datatable-wrapper'
          pagination={pagination}
          hover
          serialNumber
          bordered={false}
          dataFields={dataFields}
          rowTemplate={rowTemplate}
          emptyText="没有可显示的数据！"
          data={role_user || []}
        />
      </AuthComponent>
    </div>
  },

  renderRoleDialog() {
    const { roleDialog, info } = this.state
    return <Dialog
      show={roleDialog.show}
      onHide={this.handleCloseDialog}
      backdrop="static"
      size={{ width: '550px', height: '320px' }}
      className="data-view-role-dialog"
      id="data-view-role-dialog"
    >
      <Dialog.Header closeButton>
        <Dialog.Title>{info.id ? '编辑角色' : '添加角色'}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Form className="form-horizontal"
          autoComplete="off"
          validationEvent="onBlur"
          onValidSubmit={this.handleSaveInfo}
          ref={(instance) => { this.form = instance }}
        >
          <ValidatedInput type="text"
            label={<span><i className="required">*</i>名称</span>}
            autoComplete="off"
            name="name"
            value={info.name}
            onChange={this.handleChangeInfo.bind(this, 'name')}
            maxLength="20"
            wrapperClassName="input-wrapper"
            validate='required'
            errorHelp={{ required: '请输入名称' }}
          />
          <ValidatedInput type="textarea"
            label={[<span key={0}>描述</span>, <i key={1} style={this.STYLE_SHEET.suffix}>{info.description ? info.description.length : 0} / 100</i>]}
            autoComplete="off"
            name="account"
            value={info.description}
            onChange={this.handleChangeInfo.bind(this, 'description')}
            maxLength="100"
            style={{ height: '80px' }}
            wrapperClassName="input-wrapper"
          />

        </Form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          bsStyle="primary"
          loading={roleDialog.pending}
          onClick={() => { this.form.submit() }}
        >
          确定
        </Button>
        <Button bsStyle="default" onClick={this.handleCloseDialog}>取消</Button>
      </Dialog.Footer>
    </Dialog>
  },

  handleSaveAuth() {
    const activeRole = this.props.roleList[this.state.roleActive]
    const auth = this.authset.getAuth()

    this.props.actions.saveRoleAuth({
      role_id: activeRole.id,
      funcs: _.flatten(Object.values(auth))
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.showSucc('保存成功！')
      }
    })
  },

  handleChangePage(selectEvent) {
    const activeRole = this.props.roleList[this.state.roleActive]
    this.fetchRoleUser(activeRole.id, selectEvent.eventKey)
  },

  handleFetchUserList(value, page) {
    const activeRole = this.props.roleList[this.state.roleActive]
    this.fetchUnRoleUser(activeRole.id, page, value)
  },

  handleDelUser(rowData, e) {
    e.stopPropagation();

    this.showConfirm({
      content: '确定要从角色中移除该用户吗？',
      checkbox: false,
      ok: () => {
        const activeRole = this.props.roleList[this.state.roleActive]
        this.props.actions.deleteRoleUser({
          role_id: activeRole.id,
          user_id: rowData.id
        }, (json) => {
          if (!json.result) {
            this.showErr(json.msg)
          } else {
            this.fetchRoleUser(activeRole.id, 1)
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
    // 当前的 role_id
    const activeRole = this.props.roleList[this.state.roleActive]

    this.fetchUnRoleUser(activeRole.id, 1)
  },

  // 提交USER新增
  handleSubmitUserDialog(data) {
    // 当前的 role_id
    const activeRole = this.props.roleList[this.state.roleActive]
    const ids = data.map(item => item.id)

    this.setState({
      addUserDialog: {
        select: data,
        show: false
      }
    })

    // 模拟增加用户
    this.props.actions.addRoleUser({
      role_ids: [activeRole.id],
      user_id: ids[0]
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.fetchRoleUser(activeRole.id, 1)
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

  handleEditRole(item, e) {
    e.stopPropagation();
    this.setState({
      roleDialog: {
        show: true,
        pending: false
      },
      info: {
        ...this.state.info,
        ...item
      }
    })
  },

  handleDelRole(item, e) {
    e.stopPropagation();
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该角色吗？</span>,
      content: '我已知晓并确认风险, 确定删除！',
      checkbox: true,
      ok: () => {
        this.props.actions.deleteRole(item.id, (json) => {
          if (!json.result) {
            this.showErr(json.msg)
          } else {
            this.showSucc('删除成功！')
            this.fetchRoleList()
          }
        })
      }
    });
  },

  handleChangeInfo(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  },

  handleChange(category, field, value) {
    this.state.auth[category][field] = value
    this.setState({
      auth: this.state.auth
    })
  },

  handleSaveInfo() {
    const { id, name, description } = this.state.info
    const params = id ? { id, name, description } : { name, description }

    // start loading
    this.setState({
      roleDialog: {
        ...this.state.roleDialog,
        pending: true
      }
    })

    this.props.actions.saveRoleItem(params, (json) => {
      // roledialog 状态
      let show = true
      const pending = false

      if (json.result) {
        show = false
        this.fetchRoleList()
      } else {
        this.showErr(json.msg)
      }
      this.setState({
        roleDialog: {
          show,
          pending
        }
      })
    })
  },

  handleCloseDialog() {
    this.setState({
      roleDialog: {
        show: false,
        pending: false
      }
    })
  },

  handleSelectTab(field, index) {
    if (field === 'roleActive') {
      // 当前选择的角色
      const activeRole = this.props.roleList[index]
      this.state.moudeleActive = 0
      this.state.roleActive = index
      // 请求权限
      this.fetchRoleUser(activeRole.id, 1)
      this.fetchRoleAuth(activeRole.id)
    } else {
      this.state.moudeleActive = index
    }

    this.setState({
      moudeleActive: this.state.moudeleActive,
      roleActive: this.state.roleActive
    })
  },

  handleAddRole() {
    this.setState({
      roleDialog: {
        show: true,
        pending: false
      },
      info: {
        id: '',
        name: '',
        description: ''
      }
    })
  },

  handleChangeKeyword(field, e) {
    clearTimeout(timer)
    const { value } = e.target

    this.setState({
      [field]: value
    })

    timer = setTimeout(() => {
      if (field === 'userKeyword') {
        const activeRole = this.props.roleList[this.state.roleActive]
        this.fetchRoleUser(activeRole.id, 1, value)
      } else {
        // 重置为0
        this.state.roleActive = 0
        this.fetchRoleList(value)
      }
    }, 300)
  },

  handleClearKeyword(field) {
    this.setState({ [field]: '' })
    // 避免 setstate 过慢
    this.state[field] = ''
    if (field === 'userKeyword') {
      const activeRole = this.props.roleList[this.state.roleActive]
      this.fetchRoleUser(activeRole.id, 1, '')
    } else {
      this.fetchRoleList('')
    }
  },

  fetchRoleList(value) {
    const keyword = value || this.state.keyword

    this.props.actions.fetchRoleList({
      page: 1,
      page_size: 10000,
      keyword
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else if (json.data.items) {
        // 判断是否存在 
        const lockRoleList = json.data.items.filter(item => this.LOCK_ROLE_ID.indexOf(item.id) > -1)
        let activeRole = json.data.items[0]

        if (lockRoleList.length > 0) {
          const sort_customer_roleList = lockRoleList.map(item => ({
            ...item,
            rank: this.LOCK_ROLE_ID.indexOf(item.id)
          }))
          // 排序
          sort_customer_roleList.sort((a, b) => a.rank - b.rank)
          activeRole = sort_customer_roleList[0]
        }

        // 如果存在 role
        if (activeRole) {
          this.fetchRoleUser(activeRole.id, 1)
          this.fetchRoleAuth(activeRole.id)
        }
      }
    })
  },

  fetchRoleUser(role_id, page, value) {
    this.props.actions.fetchRoleUser({
      role_id,
      page,
      keyword: value || this.state.userKeyword,
      page_size: DEFAULT_PAGINATION_OPTIONS.pageSize
    })
  },

  fetchRoleAuth(role_id) {
    const addItem = (arr, item) => {
      if (item.actions && item.actions.length > 0) {
        arr.push({
          func_code: item.func_code,
          func_action_codes: item.actions.map(action => action.action_code)
        })
      }
    }

    this.props.actions.fetchRoleAuth({ role_id }, (json) => {
      if (json.result) {
        const newAuthSelect = []
        if (json.data) {
          json.data.forEach((item) => {
            if (item.children && item.children.length > 0) {
              item.children.forEach((data) => {
                addItem(newAuthSelect, data)
              })
            } else {
              addItem(newAuthSelect, item)
            }
          })
        }
        // 将原有权限赋值
        this.setState({
          currentAuthSelect: newAuthSelect
        })
      } else {
        this.showErr(json.msg)
      }
    })
  },

  fetchUnRoleUser(role_id, page = 1, keyword = '') {
    this.props.actions.fetchUnRoleUser({
      page,
      keyword,
      nor_role_id: role_id,
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

  PAGE_SIZE: 20,

  MODULE: ['权限', '用户列表'],

  STYLE_SHEET: {
    suffix: {
      position: 'absolute',
      bottom: '8px',
      right: '6px'
    },
    keyIcon: {
      position: 'absolute',
      top: '13px',
      left: '15px'
    }
  },

  ADMIN_ROLE_ID: ['00000001-0000-0000-0000-000000000001', '39e47d2d-3f20-d160-776e-9db51a51eaee', '39e47d2d-3f20-422b-94c9-e286d7190967'],
  LOCK_ROLE_ID: ['00000001-0000-0000-0000-000000000001', '39e47d2d-3f20-d160-776e-9db51a51eaee', '39e47d2d-3f20-422b-94c9-e286d7190967', '39e47d2d-3f20-d160-776e-1db51a51ea33']
});

const stateToProps = state => ({
  ...state.authorityRole
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(authorityRoleActionCreators, dispatch) });

export default connect(stateToProps, dispatchToProps)(AuthorityRole);
