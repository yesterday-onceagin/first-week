import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import ConfigDialog from './ConfigDialog'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as feedsActions } from '@store/modules/feeds/feeds'
import './user-select.less'

class UserSelect extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    users: PropTypes.array,
    onChange: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      users: _.cloneDeep(props.users) || [],
      showConfig: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.state.users, nextProps.users)) {
      this.setState({
        users: _.cloneDeep(nextProps.users)
      })
    }
  }

  render() {
    const { style } = this.props
    const { showConfig, users } = this.state
    return (<div style={style} className="user-select-container">
      <ul className="users-list clearfix">
        { this.renderUserList() }
      </ul>
      <i className="dmpicon-add edit-btn" onClick={this.toggleConfigDialog.bind(this)}/>
      {
        showConfig && <ConfigDialog
          users={users}
          onHide={this.toggleConfigDialog.bind(this)}
          onSure={this.handleSure.bind(this)}
        />
      }
    </div>)
  }

  renderUserList() {
    const { users } = this.state
    return users.map((user, i) => (<li className="user-item">
      <span className="name">{user.name}</span>
      <span className="email">&lt;{user.email}&gt;</span>
      <i className="dmpicon-del" onClick={this.handleDeleteUser.bind(this, i)}/>
    </li>))
  }

  toggleConfigDialog() {
    const { showConfig } = this.state
    this.setState({
      showConfig: !showConfig
    })
  }

  handleSure(users) {
    this.setState({
      users,
      showConfig: false
    }, () => {
      this.commitChange()
    })
  }

  handleDeleteUser(index) {
    const { users } = this.state
    users.splice(index, 1)
    this.setState({
      users
    }, () => {
      this.commitChange()
    })
  }

  commitChange() {
    this.props.onChange && this.props.onChange(this.state.users)
  }
}

const stateToProps = state => ({
  ...state
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(feedsActions, dispatch)
})

export default connect(stateToProps, dispatchToProps, null, { withRef: true })(UserSelect)
