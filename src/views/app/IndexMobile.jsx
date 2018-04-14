import React from 'react'
import PropTypes from 'prop-types'

import Loading from 'react-bootstrap-myui/lib/Loading'
import EmptyStatus from '@components/EmptyStatus'
import NavTabBar from './components/NavTabBar'
import AppDashboardContent from './components/AppDashboardContent'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as userActionCreators } from '../../redux/modules/organization/user'
import { actions as appMenuActionCreators } from '../../redux/modules/app_menu/app_menu';

import _ from 'lodash'

import './index-mobile.less'

class AppIndexMobile extends React.PureComponent {
  static propTypes = {
    params: PropTypes.object,
    actions: PropTypes.object,
    userProfile: PropTypes.object,
    topMenus: PropTypes.array,
    onChangeLayoutVisibility: PropTypes.func
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      pending: true,
      currApp: {},
      appMenu: [],
      currFunc: null
    };
  }

  componentDidMount() {
    const { params, onChangeLayoutVisibility } = this.props
    // 隐藏主框架布局
    onChangeLayoutVisibility({
      hidePageHeader: true,
      hideSideMenu: true
    })
    // 获取APP数据
    this._getApp(params.id)
  }

  componentWillReceiveProps(nextProps) {
    const { params } = nextProps
    if (params.id !== this.props.params.id) {
      this.setState({ pending: true }, () => {
        this._getApp(params.id)
      })
    }
  }

  render() {
    const { appMenu, currApp, currFunc, pending } = this.state
    const hasNav = Array.isArray(appMenu) && appMenu.length > 0
    const toRender = currFunc || currApp
    return (
      <div
        className="modules-page-container mobile-application-page no-flex"
        id="mobile-application-page"
        style={this.STYLE_SHEET.page}
      >
        {
          !pending && (
            <div className="mobile-application-main-view" style={{
              ...this.STYLE_SHEET.mainView,
              bottom: hasNav ? '50px' : 0
            }}>
              {toRender ? this.renderContent() : (
                <EmptyStatus
                  icon="dmpicon-empty-report"
                  textSize="16px"
                  text="应用门户不存在或未启用"
                />
              )}
            </div>
          )
        }

        {
          hasNav && !pending && (
            <NavTabBar
              navs={appMenu}
              currId={toRender.id}
              onChangeNav={this.handleChangeCurrTab.bind(this)}
            />
          )
        }

        <Loading show={pending} containerId="mobile-application-page" />
      </div>
    )
  }

  // 渲染内容部分
  renderContent() {
    const { userProfile } = this.props
    const { appMenu, currApp, currFunc } = this.state
    // 是否有底导航
    const hasNav = Array.isArray(appMenu) && appMenu.length > 0
    // 需要渲染的内容func优先于app
    const toRender = currFunc || currApp
    // 请求外链的方式
    const type = currFunc ? 'func' : 'app'

    const { url, id } = toRender
    // 如果是外链类型
    if (/^https?:\/\//.test(url)) {
      const currentTheme = userProfile ? (userProfile.theme || 'theme-black') : 'theme-black';
      const { protocol, host } = window.location
      const linkUrl = `${protocol}//${host}/api/app_menu/${type}/link_to?id=${id}&theme=${currentTheme}`;
      return (
        <iframe src={linkUrl} frameBorder="0" style={{ border: '0 none', width: '100%', height: '100%' }}></iframe>
      )
    } else if (url) {
      return <AppDashboardContent dashboardId={url} hasNav={hasNav} />
    }
    return (
      <EmptyStatus
        icon="dmpicon-empty-report"
        textSize="16px"
        text="没有为此页面配置需要展示的数据报告或链接"
      />
    )
  }

  // 切换激活的tab
  handleChangeCurrTab(id) {
    const { appMenu } = this.state
    const currFunc = _.find(appMenu, func => func.id === id)
    this.setState({ currFunc })
  }

  // 获取APP
  _getApp(appId) {
    const { actions } = this.props
    actions.fetchApplication(appId, (json) => {
      // 确保应用时已启用的
      if (json.result && json.data && json.data.enable === 1) {
        const currApp = json.data
        const appMenu = _.get(json.data, 'function') || []
        let currFunc = null
        // 如果有菜单 那么设置第一个为当前激活的APP
        if (currApp.name) {
          document.title = currApp.name
        }
        if (appMenu.length > 0) {
          currFunc = appMenu[0]
        }
        this.setState({
          pending: false,
          currApp,
          appMenu,
          currFunc
        })
      } else {
        this.setState({
          pending: false,
          currApp: null,
          appMenu: [],
          currFunc: null
        })
      }
    })
  }

  DEFAULT_TITLE = '移动应用门户';

  STYLE_SHEET = {
    page: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 9
    },
    // topNavTitle: {
    //   position: 'absolute',
    //   top: 0,
    //   left: 0,
    //   lineHeight: '50px',
    //   textAlign: 'center',
    //   width: '100%',
    //   fontSize: '16px'
    // },
    mainView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0
    }
  };
}

const stateToProps = state => ({
  ...state.app_menu,
  userProfile: state.user.userProfile
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, appMenuActionCreators, userActionCreators), dispatch) })

export default connect(stateToProps, dispatchToProps)(AppIndexMobile);
