import React from 'react'
import PropTypes from 'prop-types'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as feedsActions } from '@store/modules/feeds/feeds'
import './mail-feed-config.less'

import Input from 'react-bootstrap-myui/lib/Input'


class MailFeedConfig extends React.Component {
  static propTypes = {
  }

  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    return (<div className="mail-feed-config-wrapper">
      <div className="config-form form">
        <div className="config-row">
          <label className="control-label">
            <span><i className="required">*</i>邮件主题</span>
          </label>
          <div className="input-wrapper">
            <Input type="text" />
          </div>
        </div>
        <div className="config-row">
          <label className="control-label">
            <span><i className="required">*</i>发件人</span>
          </label>
          <div className="input-wrapper">
            <Input type="text" />
          </div>
        </div>
        <div className="config-row">
          <label className="control-label">
            <span><i className="required">*</i>发件人</span>
          </label>
          <div className="input-wrapper">
            <Input type="text" />
          </div>
        </div>
        
      </div>
    </div>)
  }
}

const stateToProps = state => ({
  ...state
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(feedsActions, dispatch)
})

export default connect(stateToProps, dispatchToProps, null, { withRef: true })(MailFeedConfig)
