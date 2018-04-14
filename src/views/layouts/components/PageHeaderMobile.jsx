import React from 'react'
import PropTypes from 'prop-types'
import Cookies from 'js-cookie'

import Popover from 'react-bootstrap-myui/lib/Popover'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'

import _ from 'lodash'
import XStorage from '@helpers/XStorage'
import trackLogs from '@helpers/aliyunTrackLogs'
import { baseAlias } from '../../../config'

// 找到当前的模块
const _findCurrModule = (navs, appId, moduleId) => {
  if (!Array.isArray(navs) || navs.length === 0 || !appId) {
    return null
  }

  const currApp = _.find(navs, app => app.id === appId);

  if (currApp) {
    if (Array.isArray(currApp.function) && moduleId) {
      const currModule = _.find(currApp.function, func => func.id === moduleId)
      return currModule || currApp
    }
    return currApp
  }

  return null
}

class PageHeaderMobile extends React.PureComponent {
  static propTypes = {
    trackLogs: PropTypes.object,
    navs: PropTypes.array,
    routerPush: PropTypes.func,
    hideSideMenu: PropTypes.bool,
    sideMenuSpread: PropTypes.bool,
    onToggleSideMenu: PropTypes.func,
    appId: PropTypes.string,
    moduleId: PropTypes.string,
    showErr: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      title: ''
    };
  }

  componentDidMount() {
    const { appId, moduleId, navs } = this.props
    const currModule = _findCurrModule(navs, appId, moduleId)
    this.setState({
      title: currModule ? currModule.name : ''
    })
  }

  componentWillReceiveProps(nextProps) {
    const { appId, moduleId, navs } = nextProps
    if (!_.isEqual(navs, this.props.navs) || appId !== this.props.appId || moduleId !== this.props.moduleId) {
      const currModule = _findCurrModule(navs, appId, moduleId)
      this.setState({
        title: currModule ? currModule.name : ''
      })
    }
  }

  render() {
    const { hideSideMenu, onToggleSideMenu, sideMenuSpread } = this.props
    const { title } = this.state
    return (
      <header
        className="page-top"
        role="banner"
        style={this.STYLE_SHEET.pageTop}
        onTouchEnd={sideMenuSpread ? onToggleSideMenu : null}
      >
        {
          !hideSideMenu && (
            <div
              className="nav-left-btn"
              style={this.STYLE_SHEET.navLeftMenu}
              onTouchEnd={!sideMenuSpread ? onToggleSideMenu : null}
            >
              <a href="javascript:;" style={this.STYLE_SHEET.navRightBtnA}>
                <i className="dmpicon-menu" style={{
                  ...this.STYLE_SHEET.navRightIcon,
                  transform: 'rotateZ(-90deg)'
                }} />
              </a>
            </div>
          )
        }
        {title}
        {this.renderNavLeft()}
      </header>
    );
  }

  // 渲染左侧nav
  renderNavLeft() {
    const { navs } = this.props
    // 启用的APP不足2个时 不显示
    if (!Array.isArray(navs) || navs.length < 2) {
      return null;
    }

    const navMenuItem = {
      display: 'block',
      padding: '0 12px',
      height: '40px',
      lineHeight: '40px',
      position: 'relative'
    };

    return (
      <ul className="app-navleft" style={this.STYLE_SHEET.nav}>
        {
          navs.length > 0 && (
            <OverlayTrigger trigger="click"
              rootClose
              placement="bottom"
              overlay={(
                <Popover className="hidden-nav-list" style={{ transform: 'translateY(-10px)' }}>
                  {
                    navs.map((nav) => {
                      let link = nav.link || '';

                      if (link) {
                        link = `${baseAlias}${link}`;
                      } else {
                        link = 'javascript:;';
                      }

                      return (
                        <a key={nav.id}
                          className={`hidden-nav-list-item ${nav.active ? 'active' : ''}`}
                          target={nav.target || null}
                          href={nav.target === '_blank' ? link : 'javascript:;'}
                          style={navMenuItem}
                          onClick={this.handleChangeApp.bind(this, nav)}
                        >
                          {nav.name}
                        </a>
                      )
                    })
                  }
                </Popover>
              )}
            >
              <li className="nav-left-btn" style={this.STYLE_SHEET.navBtn}>
                <a href="javascript:;" style={this.STYLE_SHEET.navRightBtnA}>
                  <i className="dmpicon-more" style={this.STYLE_SHEET.navRightIcon} />
                </a>
              </li>
            </OverlayTrigger>
          )
        }
        <li className="nav-left-btn" style={this.STYLE_SHEET.navBtn} onClick={this.hanldeLogOut.bind(this)}>
          <a href="javascript:;" className="helper-center" style={this.STYLE_SHEET.navRightBtnA}>
            <i className="dmpicon-exit" style={this.STYLE_SHEET.navRightIcon}/>
          </a>
        </li>
      </ul>
    );
  }

  // app切换
  handleChangeApp(app) {
    // 应用门户没有做过任何配置
    if (!app.url && (!Array.isArray(app.function) || app.function.length === 0)) {
      this.props.showErr('该应用尚未配置报告或外链')
      return;
    }
    // 目标为新窗口的app
    if (app.target === '_blank') {
      return;
    }
    // 关闭可能存在的popover
    document.body.click();
    // 先跳转到对应的app
    this.props.routerPush(`${baseAlias}/app/index/${app.id}`)
  }

  // 登出
  hanldeLogOut() {
    Cookies.remove('token', { domain: `.${window.location.hostname}` })
    sessionStorage.removeItem('DATACLEAN_BUILD_IN_SETTING')
    // logout
    const logs = Object.assign({}, this.props.trackLogs, {
      action: 'logout'
    })
    trackLogs(logs)
    // 清除RETURN_URL
    XStorage.removeValue('RETURN_URL')
    window.location.href = `${baseAlias}/login`
  }

  STYLE_SHEET = {
    // 容器
    pageTop: {
      border: '0 none',
      height: '50px',
      width: '100%',
      margin: 0,
      position: 'relative',
      zIndex: 1000,
      textAlign: 'center',
      fontSize: '18px',
      lineHeight: '50px'
    },
    nav: { height: '50px', position: 'absolute', right: 0, top: 0 },
    navLeftMenu: { height: '50px', position: 'absolute', left: 0, top: 0 },
    // 顶部菜单LI
    navBtn: { height: '50px', float: 'left' },
    // 右侧菜单按钮的A标签
    navRightBtnA: {
      display: 'inline-block',
      position: 'relative',
      transition: 'color .3s',
      fontSize: '14px',
      lineHeight: '50px',
      padding: 0,
      width: '44px',
      height: '50px',
      minWidth: 'initial'
    },
    // 顶部右侧按钮图标
    navRightIcon: {
      fontSize: '18px',
      position: 'absolute',
      top: '50%',
      left: '9px',
      marginTop: '-9px'
    },
    navRightNameText: {
      padding: '0 10px',
      height: '24px',
      lineHeight: '24px',
      display: 'inline-block'
    }
  };
}

export default PageHeaderMobile
