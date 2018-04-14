import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import GroupTree from '@components/GroupTree'

import classnames from 'classnames'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { actions as authorityUserGroupActionCreators  } from '../../redux/modules/authority/userGroup'
import { actions as authorityUserActionCreators  } from '../../redux/modules/authority/user'

import _ from 'lodash'

import './config-dialog.less'

class ConfigDialog extends React.Component {
  static defaultProps = {
    onHide: PropTypes.func,
    users: PropTypes.array,
    onSure: PropTypes.func,
  }
  constructor(props) {
    super(props)
    this.state = {
      users: _.cloneDeep(props.users),
      userGroupSelectedId: '',
      userPending: false,
      activeUserIndex: -1,
      activeUserChoosenIndex: -1,
    }
  }

  componentDidMount() {
    const { actions } = this.props
    // 首先清空 用户表
    actions.clearUserList()
    if (this.props.userGroupTree.length === 0) {
      actions.fetchUserGroupTree((json) => {

      })
    }
  }

  render() {
    const { userGroupTree, list } = this.props
    const { userGroupSelectedId, activeUserIndex, activeUserChoosenIndex, users } = this.state
    return <Dialog
      show
      onHide={this.props.onHide}
      className='user-select-config-dialog'
    >
      <Dialog.Header closeButton>
        <Dialog.Title>选择收件人</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="body-section users-selector">
          <div className="title">地址簿</div>
          <div>
            <div className="users-group-panel">
              <GroupTree
                activeId={userGroupSelectedId}
                data={userGroupTree}
                nodeTemplate={this.nodeTemplate.bind(this)}
                nodeHeight={24}
                onClickLeaf={this.handleSelectUserGroup.bind(this)}
              />
            </div>
            <div className="users-panel">
              <div className="users-panel-header">
                <span className="name">用户名</span>
                <span className="email">邮件地址</span>
              </div>
              <div className="users-in-group">
                {this.renderUsersInGroup()}
              </div>
            </div>
          </div>
        </div>
        <div className="body-section switch-btns">
          <button title="添加所以收件人" disabled={list.length === 0} type="button" className="switch-right-all" onClick={this.handleAddActiveUser.bind(this, true)}>=&gt;</button>
          <button title="添加选中收件人" disabled={activeUserIndex < 0} type="button" className="switch-right" onClick={this.handleAddActiveUser.bind(this, false)}>-&gt;</button>
          <button title="移除一个收件人" disabled={activeUserChoosenIndex < 0} type="button" className="switch-left" onClick={this.handleRemoveUser.bind(this, false)}>&lt;-</button>
          <button title="移除所有收件人" disabled={users.length === 0} type="button" className="switch-left-all" onClick={this.handleRemoveUser.bind(this, true)}>&lt;=</button>
        </div>
        <div className="body-section users-list">
          <div className="title">收件人</div>
          <div className="user-selected-list">
            {this.renderUsersSelected()}
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)} >确定</Button>
        <Button bsStyle="default" onClick={this.props.onHide} >取消</Button>
      </Dialog.Footer>
    </Dialog>
  }

  renderUsersSelected() {
    const { users, activeUserChoosenIndex } = this.state
    return (<ul>
      {users.map((user, i) => {
        const cn = classnames({
          active: activeUserChoosenIndex === i,
        })
        return <li key={user.key} className={cn} onClick={this.handleSetChoosenActiveUser.bind(this, i)} onDoubleClick={this.unSelectUser.bind(this, i)}>{user.name}</li>
      })}
    </ul>)
  }

  handleSure() {
    const { users } = this.state
    this.props.onSure && this.props.onSure(users)
  }

  nodeTemplate(node) {
    // console.log(node)
    return <div>{node.name}</div>
  }

  handleSelectUserGroup(node) {
    const { userGroupSelectedId } = this.state
    this.setState({
      userGroupSelectedId: node.id,
      activeUserIndex: -1,
    }, () => {
      if (userGroupSelectedId !== node.id) {
        if (node.id) {
          this.fetchUserList(1, node.id)
        }
      }
    })
  }

  unSelectUser(index) {
    const { users } = this.state
    users.splice(index, 1)
    this.setState({
      users,
      activeUserChoosenIndex: -1,
    })
  }

  // 获取用户列表
  fetchUserList(page = 1, groupId = '') {
    // start pending
    this.setState({ userPending: true })

    this.props.actions.fetchUserList({
      page,
      group_id: groupId,
      page_size: 1000000,
      keyword: '',
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
      // end pending
      this.setState({ userPending: false })
    });
  }

  renderUsersInGroup() {
    const { activeUserIndex } = this.state
    const { list } = this.props
    return (<ul>
      {list.map((user, i) => {
        const cn = classnames({
          active: activeUserIndex === i
        })
        return <li key={user.id} className={cn} onClick={this.handleSetActiveUser.bind(this, i)} onDoubleClick={this.handleAddUser.bind(this, [user])}>
          <span className="name">{user.name}</span>
          <span className="email">{user.email}</span>
        </li>
      })}
    </ul>)
  }

  handleAddUser(newUsers) {
    let { users } = this.state
    users = users.concat(newUsers.map(user => ({
      name: user.name,
      id: user.id,
      email: user.email
    })))
    users = _.uniqBy(users, 'id')
    this.setState({
      users
    })
  }

  handleSetActiveUser(index) {
    this.setState({
      activeUserIndex: index
    })
  }

  handleSetChoosenActiveUser(index) {
    this.setState({
      activeUserChoosenIndex: index
    })
  }

  handleAddActiveUser(all) {
    const { list } = this.props
    const { activeUserIndex } = this.state
    // 添加所有收件人
    if (all) {
      this.handleAddUser(list)
    // 添加已选中的收件人
    } else if (activeUserIndex < list.length && activeUserIndex > -1) {
      this.handleAddUser([list[activeUserIndex]])
    }
  }

  handleRemoveUser(all) {
    if (all) {
      this.setState({
        users: [],
        activeUserChoosenIndex: -1,
      })
    } else {
      const { activeUserChoosenIndex } = this.state
      this.unSelectUser(activeUserChoosenIndex)
    }
  }
}

const stateToProps = state => ({
  ...state.authorityUser,
  ...state.authorityUserGroup,
  // roleList: state.authorityRole.roleList
})
// 坑
const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, authorityUserActionCreators, authorityUserGroupActionCreators), dispatch) })

export default connect(stateToProps, dispatchToProps)(ConfigDialog)
