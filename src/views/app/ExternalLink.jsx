import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as userActionCreators } from '../../redux/modules/organization/user';

import TipMixin from '../../helpers/TipMixin';


const ExternalLink = createReactClass({
  displayName: 'ExternalLink',

  mixins: [TipMixin],

  propTypes: {
    onChangePageTitleVisibility: PropTypes.func,
    isMobile: PropTypes.bool,
    userProfile: PropTypes.object,
    params: PropTypes.object
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentWillMount() {
    // 向MAIN通知隐藏title栏
    this.props.onChangePageTitleVisibility(true);
  },

  componentDidUpdate() {
    // 向MAIN通知隐藏title栏
    this.props.onChangePageTitleVisibility(true);
  },

  componentWillUnmount() {
    // 恢复显示
    this.props.onChangePageTitleVisibility(false);
  },

  render() {
    const { params, isMobile, userProfile } = this.props
    const { type, id } = params

    const currentTheme = userProfile ? (userProfile.theme || 'theme-black') : 'theme-black';

    const url = `${window.location.protocol}//${window.location.host}/api/app_menu/${type}/link_to?id=${id}&theme=${currentTheme}`;

    return (
      <div className="modules-page-container">
        <div className="appscenarios-external-page data-view" style={{ paddingTop: isMobile ? 0 : '20px' }}>
          <iframe src={url} frameBorder="0" style={{ border: '0 none', width: '100%', height: '100%' }}></iframe>
        </div>
      </div>
    );
  },

  showErr(message) {
    this.showTip({
      status: 'error',
      content: message
    });
  },

  showSucc(message) {
    this.showTip({
      status: 'success',
      content: message
    });
  },
})


const stateToProps = state => ({
  userProfile: state.user.userProfile
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(userActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(ExternalLink);
