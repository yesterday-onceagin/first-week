import React from 'react'
import PropTypes from 'prop-types'

import Popover from 'react-bootstrap-myui/lib/Popover'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import UserPasswordDialog from './UserPasswordDialog'
import UserInfoDialog from './UserInfoDialog'

import _ from 'lodash'
import Cookies from 'js-cookie'
import XStorage from '@helpers/XStorage'
import trackLogs from '@helpers/aliyunTrackLogs'
import { baseAlias } from '../../../config'
import { DMP_THEMES } from '@constants/dmp'

import defaultLogo from '@static/images/dmp-logo.png'

class PageHeader extends React.PureComponent {
  static propTypes = {
    trackLogs: PropTypes.object,
    userInfo: PropTypes.object,
    projectInfo: PropTypes.object,
    savePass: PropTypes.func,
    saveUserInfo: PropTypes.func,
    saveTheme: PropTypes.func,
    currentTheme: PropTypes.string,
    navs: PropTypes.array,
    routerPush: PropTypes.func,
    disableThemeBtn: PropTypes.oneOf([undefined, null, 1, 0, '1', '0']),
    showErr: PropTypes.func,
    showSucc: PropTypes.func,
    supportLink: PropTypes.string,       // 客服链接
  };

  constructor(props) {
    super(props);
    this.state = {
      passPending: false,
      passDialog: {
        show: false,
        info: {
          old_password: '',
          new_password: '',
          new_confirm_pwd: ''
        }
      },
      userPending: false,
      userDialog: {
        show: false,
        info: this.props.userInfo
      },
      navLeftNum: this.MIN_NAV_NUM
    };
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.userInfo, nextProps.userInfo)) {
      this.setState({
        userDialog: {
          ...this.state.userDialog,
          info: nextProps.userInfo
        }
      });
    }

    if (Array.isArray(nextProps.navs)) {
      this._getNavNum(nextProps.navs, nextProps.userInfo);
    }
  }

  render() {
    const { projectInfo } = this.props
    const { passDialog, passPending, userDialog, userPending } = this.state
    const logoUri = projectInfo.logo_uri || defaultLogo
    return (
      <header className="page-top" role="banner" style={this.STYLE_SHEET.pageTop}>
        <a href={`${baseAlias}/home`} className="brand" style={this.STYLE_SHEET.brand}>
          <img ref={(instance) => { this.logoImg = instance }}
            onError={this.handleSetDefaultLogo.bind(this)}
            src={logoUri}
            style={this.STYLE_SHEET.logoImg}
          />
        </a>

        {this.renderNavLeft()}

        {this.renderNavRight()}

        {
          passDialog.show && (
            <UserPasswordDialog
              show={passDialog.show}
              data={passDialog.info}
              pending={passPending}
              onSure={this.handleValidSubmitPass.bind(this)}
              onHide={this.handleClosePassDialog.bind(this)}
            />
          )
        }
        {
          userDialog.show && (
            <UserInfoDialog
              show={userDialog.show}
              data={userDialog.info}
              pending={userPending}
              onSure={this.handleValidSubmitUserInfo.bind(this)}
              onHide={this.handleCloseUserDialog.bind(this)}
            />
          )
        }
      </header>
    );
  }

  // 渲染左侧nav
  renderNavLeft() {
    const { navs } = this.props
    const { navLeftNum } = this.state

    // 启用的APP不足2个时 不显示
    if (!Array.isArray(navs) || navs.length < 2) {
      return null;
    }
    const _navList = navs.map((nav) => {
      let link = nav.link || '';

      if (link) {
        link = `${baseAlias}${link}`;
      } else {
        link = 'javascript:;';
      }

      return (
        <li key={nav.id}
          className={`nav-left-btn ${nav.active ? 'active' : ''}`}
          style={this.STYLE_SHEET.navBtn}
        >
          <a target={nav.target || null}
            href={nav.target === '_blank' ? link : 'javascript:;'}
            style={this.STYLE_SHEET.navLeftBtnA}
            onClick={this.handleChangeApp.bind(this, nav)}
          >
            {nav.name}
          </a>
        </li>
      );
    });

    // 隐藏超出显示数量的nav
    const _hiddenNavList = navs.slice(navLeftNum);

    const hasHiddenActiveNav = _hiddenNavList.some(nav => nav.active);

    const navMenuItem = {
      display: 'block',
      padding: '0 12px',
      height: '40px',
      lineHeight: '40px',
      position: 'relative'
    };

    return (
      <ul className="app-navleft" style={{ height: '50px', float: 'left' }}>
        {_navList.slice(0, navLeftNum)}
        {
          _hiddenNavList.length > 0 && (
            <OverlayTrigger trigger="click"
              rootClose
              placement="bottom"
              overlay={(
                <Popover className="hidden-nav-list" style={{ transform: 'translateY(-10px)' }}>
                  {
                    _hiddenNavList.map((nav) => {
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
              <li className={`nav-left-btn ${hasHiddenActiveNav ? 'active' : ''}`}
                style={this.STYLE_SHEET.navBtn}>
                <a href="javascript:;" style={this.STYLE_SHEET.navRightBtnA}>
                  <i className="dmpicon-more" style={this.STYLE_SHEET.navRightIcon} />
                </a>
              </li>
            </OverlayTrigger>
          )
        }
      </ul>
    );
  }

  // 渲染右侧NAV
  renderNavRight() {
    const { userInfo, disableThemeBtn, supportLink } = this.props

    return (
      <ul className="app-navright" style={this.STYLE_SHEET.navRight}>
        {
          !disableThemeBtn && (
            <OverlayTrigger
              trigger="click"
              rootClose
              placement="bottom"
              overlay={this.renderThemeMenu()}
            >
              <li className="navright-btn navright-btn-theme" style={this.STYLE_SHEET.navBtn}>
                <a href="javascript:;" style={this.STYLE_SHEET.navRightBtnA}>
                  <i className="dmpicon-skin" style={{
                    ...this.STYLE_SHEET.navRightIcon,
                    fontSize: '23px'
                  }} />
                </a>
              </li>
            </OverlayTrigger>
          )
        }

        <OverlayTrigger
          trigger="click"
          rootClose
          placement="bottom"
          overlay={this.renderUserMenu()}
        >
          <li className="navright-btn user-info" style={this.STYLE_SHEET.navBtn}>
            <a className="user-name" href="javascript:;" style={{
              ...this.STYLE_SHEET.navRightBtnA,
              padding: '0 16px 0 36px',
              width: 'auto'
            }}>
              <i className="dmpicon-user" style={this.STYLE_SHEET.navRightIcon} />
              <span className="user-name-text" style={{
                ...this.STYLE_SHEET.navRightNameText,
                color: userInfo ? 'inherit' : 'transparent'
              }}>
                {userInfo ? userInfo.name : '.'}
              </span>
              <i className="spread-icon dmpicon-arrow-down" style={{ right: '2p' }}/>
            </a>
          </li>
        </OverlayTrigger>

        <li className="navright-btn" style={this.STYLE_SHEET.navBtn}>
          <a href="http://doc.mypaas.com.cn/dmp/" target="_blank" className="helper-center" style={this.STYLE_SHEET.navRightBtnA} title="前往帮助文档中心">
            <i className="dmpicon-helper" style={this.STYLE_SHEET.navRightIcon}/>
          </a>
        </li>

        <li className="navright-btn" style={this.STYLE_SHEET.navBtn}>
          <a href={supportLink} className="support-link" title="联系客服" target="_blank">
            <span className="robot-icon"></span>
          </a>
        </li>
      </ul>
    );
  }

  // 渲染主题切换菜单
  renderThemeMenu() {
    const { currentTheme } = this.props

    const styles = {
      popover: {
        transform: 'translateY(-10px)'
      },
      item: {
        padding: '16px 7px 11px',
        textAlign: 'center',
        transition: 'color .3s',
        cursor: 'pointer'
      },
      img: {
        width: '70px',
        height: '70px',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundClip: 'border-box',
        borderWidth: '1px',
        borderStyle: 'solid',
        transition: 'border-color .3s'
      },
      text: {
        lineHeight: '20px',
        fontSize: '14px',
        display: 'inline-block',
        paddingTop: '9px'
      }
    }

    return (
      <Popover className="theme-menu" style={styles.popover}>
        {
          DMP_THEMES.map(item => (
            <div key={item.key}
              className={`menu-item ${item.key === currentTheme ? 'active' : ''}`}
              style={styles.item}
              onClick={this.handleTheme.bind(this, item.key)}
            >
              <div className="theme-preview theme-white-preview" style={{
                ...styles.img,
                backgroundImage: `url(${require(`../../../static/images/menu-${item.key}.jpg`)})`
              }} />
              <span className="item-text" style={styles.text}>
                {item.name}
              </span>
            </div>
          ))
        }
      </Popover>
    );
  }

  // 渲染用户菜单
  renderUserMenu() {
    const styles = {
      popover: {
        width: '120px',
        transform: 'translateY(-10px)'
      },
      item: {
        height: '50px',
        width: '100%',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer'
      },
      icon: {
        fontSize: '16px',
        transition: 'color .3s'
      },
      text: {
        paddingLeft: '10px',
        transition: 'color .3s'
      }
    }

    return (
      <Popover className="user-menu" style={styles.popover}>
        <span className="user-menu-item" onClick={this.handleOpenUserDialog.bind(this)} style={styles.item}>
          <i className="dmpicon-edit" style={styles.icon} />
          <span style={styles.text}>修改信息</span>
        </span>
        <span className="user-menu-item" onClick={this.handleOpenPassDialog.bind(this)} style={styles.item}>
          <i className="dmpicon-key" style={styles.icon} />
          <span style={styles.text}>修改密码</span>
        </span>
        <span className="user-menu-item" onClick={this.hanldeLogOut.bind(this)} style={styles.item}>
          <i className="dmpicon-exit" style={styles.icon} />
          <span style={styles.text}>退出登录</span>
        </span>
      </Popover>
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

  // 设置默认LOGO图片
  handleSetDefaultLogo() {
    if (this.logoImg) {
      this.logoImg.src = defaultLogo
    }
  }

  // 主题变更
  handleTheme(newTheme) {
    const { currentTheme, saveTheme } = this.props;
    if (newTheme === currentTheme) {
      return;
    }
    saveTheme(newTheme);
  }

  // 打开个人信息修改窗口
  handleOpenUserDialog() {
    // 关闭当前设置窗口
    document.body.click();

    this.setState({
      userDialog: {
        info: {
          ...this.props.userInfo
        },
        show: true
      }
    });
  }

  // 关闭个人信息修改弹窗
  handleCloseUserDialog() {
    this.setState({
      userDialog: {
        ...this.state.userDialog,
        show: false
      }
    });
  }

  // 提交个人信息
  handleValidSubmitUserInfo(data) {
    const { showErr, showSucc, saveUserInfo } = this.props
    this.setState({
      userPending: true
    });

    saveUserInfo(data, (json) => {
      if (!json.result) {
        showErr(json.msg);
        this.setState({
          userPending: false
        });
      } else {
        this.setState({
          userPending: false,
          userDialog: {
            ...this.state.userDialog,
            show: false
          }
        }, () => {
          showSucc(json.msg);
        });
      }
    });
  }

  // 修改密码提交
  handleValidSubmitPass(data) {
    const { savePass, showErr, showSucc } = this.props
    
    this.setState({
      passPending: true
    });

    savePass(data, (json) => {
      if (!json.result) {
        showErr(json.msg)
        this.setState({
          passPending: false
        })
      } else {
        this.setState({
          passPending: false,
          passDialog: {
            ...this.state.passDialog,
            show: false
          }
        }, () => {
          showSucc('密码更改成功！请用新密码重新登录！')
          setTimeout(() => {
            this.hanldeLogOut()
          }, 1500)
        })
      }
    })
  }

  // 打开修改密码窗口
  handleOpenPassDialog() {
    // 关闭当前设置窗口
    document.body.click();

    this.setState({
      passDialog: {
        info: {},
        show: true
      }
    });
  }

  // 关闭密码修改弹窗
  handleClosePassDialog() {
    this.setState({
      passDialog: {
        ...this.state.passDialog,
        show: false
      }
    })
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

  // 获取可显示的nav数量
  _getNavNum(navs, userInfo) {
    const navLen = navs.length
    if (navLen <= this.MIN_NAV_NUM) {
      this.setState({ navLeftNum: this.MIN_NAV_NUM })
      return
    }
    // 取得用户名(没有则保留1个英文字母)
    const username = userInfo && userInfo.name ? userInfo.name : 'a'
    // 计算右侧nav宽度(名称占位 + 左右padding各10 + 16右padding + 36左侧icon + 44theme + 最右16padding)
    const navRightWidth = (username.replace(/[^\x00-\xff]/g, 'aa').length * 8) + 20 + 16 + 36 + 44 + 16
    // 最大可用宽度(窗口宽度 - 右侧占位 navRightWidth - 左侧logo占位200px - ...占位的50px)
    const navMaxWidth = Math.floor(window.innerWidth - navRightWidth - 200 - 50)

    let maxLen = this.MIN_NAV_NUM

    for (let i = 0, sumWidth = 0; i < navLen; i++) {
      // 字体大小为14px 将中文全部替换为半角英文按照7px计算 加padding 12 * 2
      const currentItemWidth = (navs[i].name.replace(/[^\x00-\xff]/g, 'aa').length * 8) + 24
      sumWidth += currentItemWidth
      maxLen = i + 1

      if (sumWidth >= navMaxWidth || (navMaxWidth - sumWidth <= Math.floor(currentItemWidth / 2))) {
        break
      }
    }

    this.setState({
      navLeftNum: maxLen <= this.MIN_NAV_NUM ? this.MIN_NAV_NUM : maxLen
    })
  }

  // 最小菜单显示数
  MIN_NAV_NUM = 4;

  STYLE_SHEET = {
    // 容器
    pageTop: {
      border: '0 none',
      height: '50px',
      width: '100%',
      margin: 0,
      position: 'relative',
      zIndex: 1000
    },
    // logo位
    brand: {
      float: 'left',
      width: '200px',
      height: '50px',
      margin: 0,
      padding: '8px 0 0 20px'
    },
    logoImg: {
      height: '34px',
      width: 'auto',
      display: 'block'
    },
    // 顶部右侧菜单
    navRight: {
      height: '50px',
      paddingRight: '16px',
      float: 'right'
    },
    // 顶部菜单LI
    navBtn: {
      height: '50px',
      float: 'left'
    },
    // 左侧菜单按钮的A标签
    navLeftBtnA: {
      display: 'inline-block',
      position: 'relative',
      minWidth: '50px',
      height: '50px',
      padding: '0 12px',
      lineHeight: '50px',
      transition: 'color .3s',
      fontSize: '14px'
    },
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
      fontSize: '22px',
      position: 'absolute',
      top: '50%',
      left: '11px',
      marginTop: '-11px'
    },
    navRightNameText: {
      padding: '0 10px',
      height: '24px',
      lineHeight: '24px',
      display: 'inline-block'
    },
  };
}

export default PageHeader
