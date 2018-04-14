import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import { LinkContainer } from 'react-router-bootstrap'
import Navbar from 'react-bootstrap-myui/lib/Navbar'
import Nav from 'react-bootstrap-myui/lib/Nav'
import NavItem from 'react-bootstrap-myui/lib/NavItem'
import Breadcrumb from 'react-bootstrap-myui/lib/Breadcrumb'
import Input from 'react-bootstrap-myui/lib/Input'
import Sortable from 'react-sortablejs'
import PageHeader from './components/PageHeader'
import PageSideMenu from './components/PageSideMenu'
import IconButton from '@components/IconButton'
import ErrorStatus from '@components/ErrorStatus';
import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as userActionCreators } from '@store/modules/organization/user'

import _ from 'lodash'
import classnames from 'classnames'
import TipMixin from '@helpers/TipMixin'
import XStorage from '@helpers/XStorage'
import aliyunTrackLogs from '@helpers/aliyunTrackLogs'
import RavenDmp from '@helpers/RavenDmp'
import { setTheme as setChartTheme } from '@constants/echart'
import { DMP_THEMES } from '@constants/dmp'
import { RELEASE_WRAP, NOOP } from '@constants/sortable'
import { baseAlias, DEV } from '../../config'

import '@libs/loghub-tracking'

import 'react-bootstrap-myui/dist/css/react-bootstrap-myui.min.css'
import '@static/css/reset.less'
import '@static/css/main.less'

import $ from 'jquery'

window.$ = $
window.jQuery = $

let mainSearchTimer = 0

// sentry config
const NEED_SENTRY = !DEV;
const r = new RavenDmp()

const Main = createReactClass({
  displayName: 'Main',

  mixins: [TipMixin],

  propTypes: {
    trackLogs: PropTypes.object,
    sideMenus: PropTypes.array,
    topMenus: PropTypes.array,
    userProfile: PropTypes.object,
    userInfo: PropTypes.object,
    project: PropTypes.object,
    app_id: PropTypes.string,
    module_id: PropTypes.string,
    userProfileOK: PropTypes.bool,
    userProfilePending: PropTypes.bool
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  chineseEntering: false,

  getInitialState() {
    return {
      spread: false,
      hidePageTitle: false,   // 隐藏 面包屑导航标题
      hidePageHeader: false,  // 隐藏 页头
      hideSideMenu: false,    // 隐藏 左侧菜单
      navBarTitles: {
        titles: '',
        btns: [],
        titleTabs: []
      },
      navBarSearch: {         // 搜索
        show: false,
        keyword: '',
        searchFunc: null
      },
      hasError: false,
      supportLink: '',        //客服链接
    }
  },

  componentDidMount() {
    //分享页面获取权限
    const isSharePage = new RegExp(`^${baseAlias}/dataview/share/`).test(this.props.location.pathname)
    if (isSharePage) {
      this.props.actions.mockFetchUserProfile()
      this._setTheme('theme-black')
      setTimeout(() => {
        this._deleteBaseLoading()
      }, 50)
      return;
    }

    // 获取企业编码数据
    this.props.actions.fetchUserProfile((json) => {
      if (json.result) {
        // 主题不存在或不在设定的主题内 默认设置为theme-black
        if (!json.data.theme || DMP_THEMES.map(t => t.key).indexOf(json.data.theme) === -1) {
          json.data.theme = 'theme-black';
        }
        this._setTheme(json.data.theme)
        const { pathname } = this.props.location
        if (pathname === '/' || new RegExp(`^${baseAlias}/login.*`).test(pathname)) {
          this.context.router.replace(`${baseAlias}/home`)
        }
        setTimeout(() => {
          this._deleteBaseLoading()
        }, 50)
      } else {
        this.showErr(json.msg);
      }
    });

    // 获取客服链接
    this.props.actions.fetchSupportLink((json) => {
      if (json.result) {
        this.setState({
          supportLink: json.data
        })
      }
    })
  },

  componentWillReceiveProps(nextProps) {
    // 如果页面的路径发生更改，应该重置 hidePageTitle + hidePageHeader + hideSideMenu
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        hidePageTitle: false,
        hidePageHeader: false,
        hideSideMenu: false,
      })
      // 恢复主题
      DMP_THEMES.forEach((t) => {
        $('body').removeClass(t.key)
      })
      $('body').addClass(this.theme);
    }

    if (!_.isEqual(nextProps.trackLogs, this.props.trackLogs)) {
      // 如果 window.LOGIN_UNTRACK_MARK = true
      if (XStorage.getValue('LOGIN_UNTRACK_MARK')) {
        const logs = Object.assign({}, nextProps.trackLogs, {
          action: 'login'
        })
        aliyunTrackLogs(logs)
        // 重置
        XStorage.removeValue('LOGIN_UNTRACK_MARK')
      }

      // 是否为 分享页面
      const isSharePage = new RegExp(`^${baseAlias}/dataview/share/`).test(nextProps.location.pathname)
      if (isSharePage) {
        const trackLogsStr = localStorage.getItem('trackLogs')
        const trackLog = trackLogsStr ? JSON.parse(trackLogsStr) : nextProps.trackLogs
        // 查看 发布后的报告
        const logs = Object.assign({}, trackLog, {
          action: 'view_dashboard'
        })
        aliyunTrackLogs(logs)
      }
    }
  },

  componentDidUpdate(prevProps) {
    // 匹配当前模块
    this.matchCurrentModule();
    // 路由跳转时关闭所有的tips
    if (!_.isEqual(this.props.location, prevProps.location)) {
      $('body .msg-tips-pop').remove();
    }
  },

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true });
    
    if (NEED_SENTRY) {
      r.init()
      r.capture(error, { extra: errorInfo });
    }
  },

  render() {
    const { userProfilePending, userProfileOK } = this.props
    const { hasError } = this.state
    const { pathname } = window.location
    const pageContainerStyle = {
      position: 'fixed',
      left: '0px',
      top: '0px',
      right: '0px',
      bottom: '0px',
      zIndex: 999
    };

    // 发生了错误时显示
    if (hasError) {
      return <div style={pageContainerStyle}>
        <div style={{ width: '800px', height: '351px', position: 'absolute', left: 0, top: 0, bottom: 0, right: 0, margin: 'auto' }}>
          <ErrorStatus
            fontSize={30}
            text="发生了未知的错误，请刷新浏览器再尝试"
          />
        </div>
      </div>
    }

    if (userProfilePending) {
      return <div style={pageContainerStyle} />
    }

    // 登陆页面
    if (new RegExp(`^${baseAlias}/login.*`).test(pathname)) {
      return userProfileOK ? <div style={pageContainerStyle} /> : <div>{this.props.children}</div>
    }

    // license 页面
    if (new RegExp(`^${baseAlias}/nolicense.*`).test(pathname)) {
      return <div>{this.props.children}</div>
    }

    // 主题、配置参数加载完成后再渲染页面
    return userProfileOK ? this.renderManage() : <div style={pageContainerStyle} />
  },

  // 渲染主页面
  renderManage() {
    const { topMenus, userInfo, children, actions, userProfile, project, trackLogs } = this.props
    const { spread, hidePageHeader, hideSideMenu, supportLink } = this.state

    const pageProps = {
      spread,
      currentTheme: userProfile ? (userProfile.theme || 'theme-black') : 'theme-black',
      onChangeNavBarSearch: this.handleSetNavBarSearchBox,
      onChangeIconButton: this.handleChangeIconButton,
      onChangeNavBar: this.handleChangeNavBar,
      onChangePageTitleVisibility: this.handleSetPageTitleHidden,
      onChangeLayoutVisibility: this.handleSetLayoutHidden
    }

    const STYLE_SHEET_PAGE_MAIN = {
      ...this.STYLE_SHEET.pageMain,
      padding: hideSideMenu ? '0' : '0 20px 20px'
    }

    return (
      <div role="page">
        {
          !hidePageHeader && (
            <PageHeader
              navs={topMenus}
              userInfo={userInfo}
              projectInfo={project}
              trackLogs={trackLogs}
              savePass={actions.fetchChangeUserPassword}
              saveUserInfo={actions.fetchUpdateUser}
              saveTheme={this.onSaveUserTheme}
              routerPush={this.context.router.push}
              currentTheme={userProfile ? (userProfile.theme || 'theme-black') : 'theme-black'}
              disableThemeBtn={userProfile.disable_skin_button}
              showErr={this.showErr}
              showSucc={this.showSucc}
              supportLink={supportLink}
            />
          )
        }
        <div className="container page-container" id="pageContainer">
          {!hideSideMenu && this.renderPageSide()}
          <div className="page-main" id="pageMain" style={STYLE_SHEET_PAGE_MAIN}>
            {
              !hidePageHeader &&
              <Sortable options={RELEASE_WRAP} onChange={NOOP}>
                {this.renderPageNavBar()}
              </Sortable>
            }
            {React.cloneElement(children, pageProps)}
          </div>
        </div>
      </div>
    )
  },

  // 渲染侧边
  renderPageSide() {
    const { sideMenus, location, actions } = this.props;
    return (
      <div className="page-side" id="pageMenus">
        {
          Array.isArray(sideMenus) && sideMenus.length > 0 && (
            <PageSideMenu
              menus={sideMenus}
              location={location}
              onChange={actions.setSideMenuModule}
              onToggleSideMenu={this.handleToggleSideMenu}
            />
          )
        }
      </div>
    )
  },

  // 生成导航标题
  renderPageNavBar() {
    const {
      hidePageTitle,
      navBarSearch
    } = this.state;

    const {
      titles,
      btns,
      titleTabs
    } = this.state.navBarTitles;

    const buttons = btns.map((item, index) => {
      const { func, style, ref, icon, text, pagecode, visiblecode,  ...otherProps } = item;
      return (
        <AuthComponent
          pagecode={pagecode}
          visiblecode={visiblecode || 'view'}
          key={`icon-button-in-nav-bar-${index}-${pagecode}`}
        >
          <IconButton
            onClick={func}
            isNavBar={true}
            hasSubIcon={Array.isArray(otherProps.subs) && otherProps.subs.length > 0}
            className={`fixed  ${style || ''}`}
            ref={ref}
            {...otherProps}
            iconClass={icon || 'dmpicon-add'}
          >
            {text || ''}
          </IconButton>
        </AuthComponent>
      );
    });

    const pageTitleClass = classnames('page-title', {
      hidden: hidePageTitle
    })

    if (Array.isArray(titles)) {
      if (titles.length === 1 && titleTabs && titleTabs.length > 0) {
        return (
          <Navbar className={pageTitleClass}>
            <Navbar.Header>
              <Navbar.Brand>
                <Nav activeKey={titles[0].name} className="page-title-navtab">
                  {
                    titleTabs && titleTabs.map((tab, i) => (
                      <NavItem eventKey={tab.name} key={`${tab.name}-${i}`} onClick={tab.func}>
                        {tab.name}
                      </NavItem>
                    ))
                  }
                </Nav>
              </Navbar.Brand>
            </Navbar.Header>
            {
              Array.isArray(buttons) && buttons.length > 0 ? (
                <div style={this.STYLE_SHEET.navBtns}>
                  {buttons}
                </div>
              ) : null
            }
            {navBarSearch.show && this.renderNavBarSearchBox()}
          </Navbar>
        );
      }

      const breadcrumbs = titles.map((item, index) => (
        index === titles.length - 1 ? (
          <Breadcrumb.Item active key={`title-breadcrumbs-item-${index}`}>{item.name}</Breadcrumb.Item>
        ) : (
          typeof item.url === 'undefined' ?
            <Breadcrumb.Item onClick={item.func}>
              {index === 0 ? <i className="dmpicon-return" /> : null}
              {item.name}
            </Breadcrumb.Item> :
            <LinkContainer to={baseAlias + item.url} key={`title-breadcrumbs-item-${index}`}>
              <Breadcrumb.Item>
                {index === 0 ? <i className="dmpicon-return" /> : null}
                {item.name}
              </Breadcrumb.Item>
            </LinkContainer>
        )
      ));

      return (
        <Navbar className={pageTitleClass}>
          <Breadcrumb className="page-breadcrumb page-breadcrumb-top">
            {breadcrumbs}
          </Breadcrumb>
          {
            Array.isArray(buttons) && buttons.length > 0 ? (
              <div style={this.STYLE_SHEET.navBtns}>
                {buttons}
              </div>
            ) : null
          }
          {navBarSearch.show && this.renderNavBarSearchBox()}
        </Navbar>
      );
    }

    return (
      <Navbar className={pageTitleClass}>
        <Navbar.Header>
          <Navbar.Brand>{titles}</Navbar.Brand>
        </Navbar.Header>
        {
          Array.isArray(buttons) && buttons.length > 0 ? (
            <div style={this.STYLE_SHEET.navBtns}>
              {buttons}
            </div>
          ) : null
        }
        {navBarSearch.show && this.renderNavBarSearchBox()}
      </Navbar>
    );
  },

  // 渲染搜索框
  renderNavBarSearchBox() {
    const { navBarSearch } = this.state;

    const containerStyle = {
      float: 'right',
      width: '240px',
      margin: '15px 20px 0 0',
    };

    return (
      <div className="form single-search-form small" style={containerStyle} key="main-nav-search-box">
        <Input type="text"
          id="main-nav-search-input-box"
          key="main-nav-search-input"
          tabIndex={1}
          placeholder="请输入关键字"
          value={navBarSearch.keyword}
          onFocus={this.handleStartSearchInput}
          onChange={this.handleChangeKeyword}
          onBlur={this.handleStopSearchInput}
          addonAfter={<i className="dmpicon-search" />}
          className="search-input-box"
        />
        {
          navBarSearch.keyword && (
            <i className="dmpicon-close" onClick={this.handleClearKeyword} />
          )
        }
      </div>
    )
  },

  // 开始搜索输入
  handleStartSearchInput(e) {
    // 中文搜索执行的方法
    const compositionFunc = (isEntering, e) => {
      this.chineseEntering = isEntering
      if (!isEntering) {
        this.handleChangeKeyword(e)
      }
    }
    $('#main-nav-search-input-box').off('compositionstart').on('compositionstart', compositionFunc.bind(this, true))
    $('#main-nav-search-input-box').off('compositionend').on('compositionend', compositionFunc.bind(this, false))
  },

  // 结束搜索输入
  handleStopSearchInput(e) {
    $('#main-nav-search-input-box').off('compositionstart')
    $('#main-nav-search-input-box').off('compositionend')
  },

  // 输入搜索关键字
  handleChangeKeyword(e) {
    const { navBarSearch } = this.state
    const v = e.target.value;

    clearTimeout(mainSearchTimer);

    this.setState({
      navBarSearch: {
        ...navBarSearch,
        keyword: v
      }
    }, () => {
      // 不在中文输入法下才触发搜索
      if (!this.chineseEntering) {
        mainSearchTimer = setTimeout(() => {
          typeof navBarSearch.searchFunc === 'function' && navBarSearch.searchFunc(v);
        }, 500);
      }
    });
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation();

    clearTimeout(mainSearchTimer);

    const { navBarSearch } = this.state

    this.setState({
      navBarSearch: {
        ...navBarSearch,
        keyword: ''
      }
    }, () => {
      typeof navBarSearch.searchFunc === 'function' && navBarSearch.searchFunc('');
    });
  },

  // 设置navbar搜索框
  handleSetNavBarSearchBox(opts) {
    this.setState({
      navBarSearch: {
        ...this.state.navBarSearch,
        ...opts
      }
    });
  },

  // 切换navTitle显示/隐藏
  handleSetPageTitleHidden(isHide) {
    this.setState({
      hidePageTitle: isHide
    });
  },

  // 更改button状态
  handleChangeIconButton(ref, state) {
    const index = _.findIndex(this.state.navBarTitles.btn, item => item.ref === ref)
    if (index === -1) {
      return
    }
    console.log(arguments)
    this.setState((preState) => {
      const navBarTitles = _.cloneDeep(preState.navBarTitles)
      navBarTitles.btns[index] = {
        ...navBarTitles.btns[index],
        ...state
      }
      return {
        navBarTitles
      }
    })
  },

  /*
  * 由子页面触发改变导航栏
  * @titles: String/Array
  * @btns: Array
  */
  handleChangeNavBar(titles = '', btns = [], titleTabs = []) {
    // titles = '' or [{name: 'titleName', url: '/xxxx/xxx'}, {name: 'titleName', url: '/xxxx/xxx'}] or 'titleName'
    if (typeof titles === 'function') {
      titles = titles(this.state.navBarTitles.titles)
    }
    if (typeof btns === 'function') {
      btns = btns(this.state.navBarTitles.btns)
    }
    this.setState({
      navBarTitles: {
        titles,
        btns,
        titleTabs
      }
    });
  },

  // 侧边菜单收起/展开切换
  handleToggleSideMenu(spread) {
    this.setState({
      spread
    })
  },

  // 隐藏
  handleSetLayoutHidden({ hidePageHeader, hideSideMenu }) {
    this.setState({
      hidePageHeader,
      hideSideMenu
    })

    // 重置主题到 黑色皮肤
    DMP_THEMES.forEach((t) => {
      $('body').removeClass(t.key)
    })
    $('body').addClass('theme-black');
  },

  // 通过url匹配模块
  matchCurrentModule() {
    const { userProfile, actions } = this.props;

    if (userProfile) {
      actions.setSideMenuModule()
    }
  },

  // 设置用户主题
  onSaveUserTheme(theme) {
    this.props.actions.fetchSetUserTheme(theme, (json) => {
      if (json.result) {
        this.showSucc('主题设置成功');
        // 关闭当前设置窗口
        document.body.click();

        this._setTheme(theme);
      }
    })
  },

  showSucc(msg, timeout) {
    this.showTip({
      status: 'success',
      content: msg,
      timeout
    })
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  // 设置主题
  _setTheme(theme) {
    if (!theme) {
      theme = 'theme-black';
    }
    if ($) {
      DMP_THEMES.forEach((t) => {
        if (t.key !== theme) {
          $('body').removeClass(t.key);
        } else {
          // 同步到 state
          this.theme = theme
          $('body').addClass(theme);
        }
      });
      setChartTheme(theme.split('-')[1])
    }
  },

  // 删除页面基础的loading图标
  _deleteBaseLoading() {
    const loadingDom = document.getElementById('base-page-loading')
    const loadingStyleDom = document.getElementById('base-page-loading-style')
    if (loadingDom) {
      document.body.removeChild(loadingDom)
    }
    if (loadingStyleDom) {
      document.body.removeChild(loadingStyleDom)
    }
  },

  STYLE_SHEET: {
    pageMain: {
      overflow: 'hidden',
      flex: 1,
      width: '100%',
      height: '100%',
      minWidth: 'initial',
      maxWidth: 'initial',
      padding: '0 20px 20px',
      flexDirection: 'column',
      display: 'flex'
    },
    navBtns: {
      padding: '16px 12px 10px 0',
      float: 'right',
      height: '50px'
    }
  },
  
  // 主题
  theme: 'theme-black'
})

const stateToProps = state => ({
  ...state.user
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(userActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(Main);
