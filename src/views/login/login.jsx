import React from 'react';
import createReactClass from 'create-react-class';
import 'particles.js'

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as commonActionCreators } from '@store/modules/common';
import { actions as userActionCreators } from '@store/modules/organization/user';
import Loading from 'react-bootstrap-myui/lib/Loading';
import classnames from 'classnames'
import { getAuthLinksFromLoginInfo } from '@helpers/loginAuth';
import { getFormatedApp } from '@helpers/appUtils';
import XStorage from '@helpers/XStorage';
import { hex_sha1 } from '@helpers/sha1';
import { baseAlias } from '../../config';

import logoImg from '@static/images/dmp-logo-login.png';
import bgImg from '@static/images/bg-login.jpg';

import './login.less';

let captchaTimer = 0;

const Login = createReactClass({
  displayName: 'Login',

  getInitialState() {
    return {
      loading: false,
      animate: '',                                      // 动画方式
      code: XStorage.getValue('tenant_code') || '',     // 企业代码
      account: XStorage.getValue('account') || '',      // 用户名
      password: '',                                     // 密码
      captcha: '',                                      // 验证码
      keepAlive: 0,                                     // 保持用户在线
      captchaImg: null,                                 // 验证码图像
      captchaAccount: '',                               // 当前验证码对应的用户名
      captchaCode: '',                                  // 当前验证码对应的企业代码
      captchaPending: false,                            // 是否正在获取验证码图像
      needCaptcha: false,                               // 是否需要验证码登录
      errorMsg: '',                                     // 错误提示信息
      loginLoading: false                               // 是否登陆中
    }
  },

  componentDidMount() {
    // 创建背景图粒子效果
    window.particlesJS('particles-js', this.PARTICLES_JSON);

    this.setState({
      animate: 'rollIn'
    });

    // 进行focus
    if (!this.state.code) {
      this.code_input.focus();
    } else if (!this.state.account) {
      this.account_input.focus();
    } else if (!this.state.password) {
      this.password_input.focus();
    }
  },

  render() {
    const {
      code,
      account,
      password,
      captcha,
      captchaImg,
      captchaPending,
      errorMsg,
      needCaptcha,
      animate,
      loginLoading,
      keepAlive,
      loading
    } = this.state;

    const checkboxClass = classnames('icon-checkbox', {
      checked: +keepAlive === 1
    })

    return (
      <div className="dmp-login-page"
        style={{ ...this.STYLE_SHEET.pageContainer, backgroundImage: `url(${bgImg})` }}
        id="dmp-login-page"
      >
        <div id="particles-js" style={this.STYLE_SHEET.particles} />

        <div className="dmp-page-header" style={this.STYLE_SHEET.headerContainer}>
          <img src={logoImg} style={this.STYLE_SHEET.logo} />
        </div>

        {
          !loading && <div className={`${animate} dmp-page-container`} style={this.STYLE_SHEET.content}>
            <ul>
              <li style={this.STYLE_SHEET.inputLi}>
                <input type='text'
                  ref={(node) => { this.code_input = node }}
                  className={code ? 'has-text' : null}
                  style={this.STYLE_SHEET.input}
                  value={code}
                  autoComplete="off"
                  onChange={this.handleChange.bind(this, 'code', '企业代码')}
                  onKeyDown={this.handleKeyDown.bind(this, 'code')}
                />
                <label style={this.STYLE_SHEET.label}>企业代码</label>
              </li>
              <li style={this.STYLE_SHEET.inputLi}>
                <input type='text'
                  ref={(node) => { this.account_input = node }}
                  className={account ? 'has-text' : null}
                  style={this.STYLE_SHEET.input}
                  value={account}
                  autoComplete="off"
                  onChange={this.handleChange.bind(this, 'account', '用户名')}
                  onKeyDown={this.handleKeyDown.bind(this, 'account')}
                />
                <label style={this.STYLE_SHEET.label}>用户名</label>
              </li>
              <li style={this.STYLE_SHEET.inputLi}>
                <input type='password'
                  ref={(node) => { this.password_input = node }}
                  className={password ? 'has-text' : null}
                  style={this.STYLE_SHEET.input}
                  value={password}
                  autoComplete="new-password"
                  onChange={this.handleChange.bind(this, 'password', '密码')}
                  onKeyDown={this.handleKeyDown.bind(this, 'password')}
                />
                <label style={this.STYLE_SHEET.label}>密码</label>
              </li>
              {
                needCaptcha && (
                  <li style={this.STYLE_SHEET.inputLi}>
                    <input type='text'
                      ref={(node) => { this.captcha_input = node }}
                      className={captcha ? 'captcha-input has-text' : 'captcha-input'}
                      style={this.STYLE_SHEET.input}
                      value={captcha}
                      autoComplete="off"
                      maxLength="8"
                      onChange={this.handleChangeCaptcha}
                      onFocus={this.handleFocusCaptcha}
                      onKeyDown={this.handleKeyDown.bind(this, 'captcha')}
                    />
                    <label style={this.STYLE_SHEET.label}>验证码</label>
                    <div className="captcha-show"
                      onMouseDown={this._fetchCaptcha.bind(this, account, code)}
                      style={this.STYLE_SHEET.captchaBox}
                    >
                      {
                        !captchaPending ? (
                          captchaImg ? (
                            <img src={captchaImg} style={this.STYLE_SHEET.captchaImg} />
                          ) : (
                            <span style={this.STYLE_SHEET.captchaText}>
                                重新获取验证码
                            </span>
                          )
                        ) : (
                          <span className="fontelloicon glyphicon-spinner" />
                        )
                      }
                    </div>
                  </li>
                )
              }
              <li style={{ cursor: 'pointer', ...this.STYLE_SHEET.checkboxLi }} onClick={this.handleChangeKeepAlive}>
                <i className={checkboxClass} style={{ margin: '-1px 8px 0 0' }}/>
                在这台计算机上保持登录状态
              </li>
              <li style={this.STYLE_SHEET.btnLi}>
                <div className="error-tips" style={{
                  ...this.STYLE_SHEET.errorTip,
                  display: errorMsg ? 'block' : 'none'
                }}>
                  {errorMsg || ''}
                </div>
                <button type="button"
                  className="btn-login"
                  style={this.STYLE_SHEET.btnLogin}
                  onClick={this.handleVialidLogin}
                >
                  <span style={{ paddingRight: '8px' }}>
                    {loginLoading ? '正在登录...' : '登录'}
                  </span>
                  {
                    loginLoading && (
                      <span className="fontelloicon glyphicon-spinner" />
                    )
                  }
                </button>
              </li>
            </ul>
          </div>
        }
        {this.renderFooter()}
        <Loading show={loading} containerId="dmp-login-page"/>
      </div>
    );
  },

  renderFooter() {
    const currYear = new Date().getFullYear()
    const copyRightTime = currYear > 2016 ? `2016 - ${currYear}` : '2016'
    return (
      <div className="dmp-page-footer" style={this.STYLE_SHEET.footer}>
        Copyright &copy;{copyRightTime} 明源云版权所有<br />粤ICP备15101856号-2
      </div>
    )
  },

  // 改变保持在线
  handleChangeKeepAlive() {
    this.setState(preState => ({
      keepAlive: +preState.keepAlive === 1 ? 0 : 1
    }))
  },

  // 输入框change事件
  handleChange(field, fieldName, e) {
    this.setState({
      [field]: e.target.value,
      errorMsg: e.target.value.length === 0 ? `${fieldName}不能为空` : ''
    });
    // 输入的是企业代码或用户名的情况
    if (field === 'code' || field === 'account') {
      clearTimeout(captchaTimer);

      const _code = field === 'code' ? e.target.value : this.state.code;
      const _account = field === 'account' ? e.target.value : this.state.account;

      captchaTimer = setTimeout(() => {
        this._fetchCaptchaStatus(_account, _code);
      }, 300)
    }
  },

  // 聚焦验证码输入框
  handleFocusCaptcha() {
    const {
      captchaAccount,
      captchaCode,
      captchaImg,
      account,
      code
    } = this.state;
    // 当验证码图像不存在或账号不匹配时重新获取
    if (!captchaImg || captchaAccount !== account || captchaCode !== code) {
      this.setState({
        captcha: ''
      });
      this._fetchCaptcha(account, code);
    }
  },

  // 验证码输入框事件
  handleChangeCaptcha(e) {
    this.setState({
      captcha: e.target.value,
      errorMsg: e.target.value.length === 0 ? '验证码不能为空' : ''
    });
  },

  // 按键事件响应
  handleKeyDown(field, e) {
    // enter 键
    if (e.keyCode === 13) {
      if (field === 'account' || field === 'code') {
        this._fetchCaptchaStatus(this.account_input.value, this.code_input.value, (json) => {
          if (!json.result || json.data === 0) {
            this.handleVialidLogin()
          }
        })
      } else {
        this.handleVialidLogin()
      }
    }
  },

  // 进行登陆
  handleVialidLogin() {
    if (this.state.loginLoading) {
      return;
    }
    const { actions } = this.props
    const { code, account, password, captcha, needCaptcha, keepAlive } = this.state;

    if (!code) {
      this.setState({
        errorMsg: '企业代码不能为空'
      })
      return;
    }

    if (!account) {
      this.setState({
        errorMsg: '用户名不能为空'
      })
      return;
    }

    if (!password) {
      this.setState({
        errorMsg: '密码不能为空'
      })
      return;
    }

    if (needCaptcha && !captcha) {
      this.setState({
        errorMsg: '验证码不能为空'
      })
      return;
    }

    // 登陆loading
    this.setState({
      loginLoading: true
    });

    // 先判断用户的登陆模式
    // data === 1 为使用旧密码，需要明文传输，0则需要使用sha1密文传输
    actions.fetchLoginMode({
      tenant_code: code,
      account
    }, (res) => {
      if (res.result) {
        // 组织登陆参数
        const loginParams = {
          account,
          tenant_code: code,
          password: res.data === 0 ? hex_sha1(password) : password,
          keep_alive: keepAlive
        };

        // 如果需要验证码 则在登陆参数中加上验证码
        if (needCaptcha) {
          loginParams.captcha = captcha;
        }

        // 登陆
        actions.fetchLogin(loginParams, (json) => {
          if (!json.result) {
            this.setState({
              loginLoading: false,
              errorMsg: json.msg
            });

            if (json.msg === '用户名或密码错误') {
              this._fetchCaptchaStatus(account, code);
            } else if (json.msg === '验证码错误') {
              this._fetchCaptcha(account, code);
            }
          } else {
            // 登录成功后移除已保存的auth_links
            XStorage.removeValue('AUTH_LINKS');
            // 保存本次登录的用户名和租户code
            XStorage.setValue('account', account);
            XStorage.setValue('tenant_code', code);

            this._getUserProfileAndLinkTo();
          }
        });
      } else {
        this.setState({
          loginLoading: false,
          errorMsg: res.msg
        });
      }
    });
  },

  // 获取权限信息 并进行页面跳转
  _getUserProfileAndLinkTo() {
    this.props.actions.fetchUserProfile((info) => {
      if (info.result) {
        if (Array.isArray(info.data.app) && info.data.app.length > 0) {
          this.setState({
            loginLoading: false
          });
          const formatedApp = getFormatedApp(info.data.app);
          const authLinks = getAuthLinksFromLoginInfo(formatedApp);
          // 将修改密码页面加入权限允许中
          authLinks.push('/change_password')
          // 保存新的权限信息
          XStorage.setValue('AUTH_LINKS', authLinks);
          // 获取应该跳转到的页面
          let returnUrl = XStorage.getValue('RETURN_URL');
          // returnUrl可以是深层的页面 authLink中提供的仅仅是菜单的link 需要用正则检查
          // 是否访问的是移动端报告页
          const mobileUrlReg = /\/app\/index\/[\w-]+\/mobile/
          if (!returnUrl || (!mobileUrlReg.test(returnUrl) && authLinks.filter(link => (new RegExp(`${link}.*`).test(returnUrl))).length === 0)) {
            returnUrl = '/home'
            // return url 已不在权限中 清除
            XStorage.removeValue('RETURN_URL');
          }
          window.location.href = baseAlias + returnUrl;
        } else {
          // 跳转到 无权限页面。
          window.location.href = `${baseAlias}/norights`;
          this.setState({
            loginLoading: false,
            errorMsg: '该用户没有任何权限'
          });
        }
      } else {
        this.setState({
          loginLoading: false,
          errorMsg: info.msg
        });
      }
    });
  },

  // 获取验证码
  _fetchCaptcha(account, tenantCode) {
    this.captcha_input.focus();

    this.setState({
      captchaPending: true
    });

    this.props.actions.fetchLoginCaptcha({
      account,
      tenant_code: tenantCode,
    }, (json) => {
      if (!json.result) {
        this.setState({
          captchaImg: null,
          captchaAccount: '',
          captchaCode: '',
          captchaPending: false,
          errorMsg: '验证码获取失败，请点击重新获取'
        });
      } else {
        this.setState({
          captchaImg: json.data,
          captchaAccount: account,
          captchaCode: tenantCode,
          captchaPending: false,
          errorMsg: this.state.captcha ? this.state.errorMsg : '请输入验证码'
        });
      }
    })
  },

  // 查询用户是否需要验证码
  _fetchCaptchaStatus(account, tenantCode, callback) {
    this.props.actions.fetchLoginCaptchaStatus({
      account,
      tenant_code: tenantCode,
    }, (json) => {
      if (!json.result) {
        this.setState({
          captchaImg: null,
          captchaCode: '',
          captchaAccount: '',
          needCaptcha: false,
          errorMsg: json.msg
        });
      } else if (json.data === 1) {
        this.setState({
          captchaImg: null,
          captchaCode: '',
          captchaAccount: '',
          needCaptcha: true,
          errorMsg: this.state.errorMsg || '请输入验证码'
        });
      } else {
        this.setState({
          captchaImg: null,
          captchaCode: '',
          captchaAccount: '',
          needCaptcha: false,
          errorMsg: this.state.errorMsg === '请输入验证码' ? '' : this.state.errorMsg
        })
      }
      if (typeof callback === 'function') {
        callback(json);
      }
    });
  },

  // 样式
  STYLE_SHEET: {
    // 页面容器
    pageContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundColor: 'rgba(255, 255, 255, .15)'
    },
    // 粒子效果div容器
    particles: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      zIndex: 1
    },
    // 顶部容器
    headerContainer: {
      height: '50px',
      width: '100%',
      position: 'relative',
      borderBottom: '1px solid #1a5e89'
    },
    // logo图片
    logo: {
      width: '89px',
      height: '34px',
      position: 'absolute',
      left: '20px',
      top: '8px',
      margin: 0,
      padding: 0,
      display: 'block'
    },
    // 内容
    content: {
      width: '280px',
      minHeight: '250px',
      margin: '-200px 0 0 -140px',
      top: '50%',
      left: '50%',
      position: 'absolute',
      zIndex: 10
    },
    // input容器LI
    inputLi: {
      height: '60px',
      marginBottom: '5px',
      position: 'relative'
    },
    input: {
      outline: '0 none',
      position: 'absolute',
      bottom: 0,
      left: 0,
      boxSizing: 'border-box',
      width: '100%',
      height: '28px',
      lineHeight: '28px',
      color: '#fff',
      border: '0 none',
      fontSize: '14px',
      fontWeight: 400,
      background: 'none',
      zIndex: 2,
      transition: 'all .3s'
    },
    label: {
      zIndex: 1,
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: '28px',
      lineHeight: '28px',
      transition: 'all .3s'
    },
    // captch-show 
    captchaBox: {
      position: 'absolute',
      zIndex: 8,
      right: 0,
      bottom: '2px',
      width: '104px',
      height: '26px',
      cursor: 'pointer',
      lineHeight: '26px',
      textAlign: 'center'
    },
    // captchaImg
    captchaImg: {
      display: 'block',
      width: '100%',
      height: '100%'
    },
    captchaText: {
      color: 'rgba(255, 255, 255, .6)',
      fontSize: '12px',
      textAlign: 'right'
    },
    // error tip
    errorTip: {
      color: '#CB3333',
      maxHeight: '60px',
      fontSize: '12px'
    },
    // checkbox Li
    checkboxLi: {
      height: '25px',
      paddingTop: '5px',
      position: 'relative',
      color: '#009dfd',
      fontSize: '12px',
      lineHeight: '20px'
    },
    // btn Li
    btnLi: {
      height: '80px',
      padding: '20px 0 0',
      position: 'relative'
    },
    // 登陆按钮
    btnLogin: {
      textDecoration: 'none',
      width: '100%',
      textAlign: 'center',
      height: '40px',
      lineHeight: '40px',
      color: '#fff',
      fontSize: '14px',
      cursor: 'pointer',
      border: '0 none',
      position: 'relative',
      zIndex: 999,
      marginTop: '10px',
      transition: 'background .3s',
      borderRadius: '4px'
    },
    // footer
    footer: {
      position: 'absolute',
      bottom: '30px',
      width: '100%',
      lineHeight: '20px',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, .6)',
      fontSize: '12px',
      fontFamily: '"PingFang SC", "Helvetica Neue", Helvetica, STHeitiSC-Light, WOL_SB, "Segoe UI Semibold", "Segoe UI", Tahoma, Helvetica, sans-serif'
    }
  },

  // 背景粒子插件配置常量
  PARTICLES_JSON: {
    particles: {
      number: {
        value: 80,
        density: {
          enable: !0,
          value_area: 800
        }
      },
      color: {
        value: '#00befe'
      },
      shape: {
        type: 'circle',
        stroke: {
          width: 0,
          color: '#000000'
        },
        polygon: {
          nb_sides: 5
        },
        image: {
          src: 'img/github.svg',
          width: 100,
          height: 100
        }
      },
      opacity: {
        value: 0.2,
        random: !1,
        anim: {
          enable: !1,
          speed: 1,
          opacity_min: 0.1,
          sync: !1
        }
      },
      size: {
        value: 2,
        random: !0,
        anim: {
          enable: !1,
          speed: 40,
          size_min: 0.1,
          sync: !1
        }
      },
      line_linked: {
        enable: !0,
        distance: 150,
        color: '#00befe',
        opacity: 0.15,
        width: 1
      },
      move: {
        enable: !0,
        speed: 2,
        direction: 'none',
        random: !1,
        straight: !1,
        out_mode: 'out',
        bounce: !1,
        attract: {
          enable: !1,
          rotateX: 600,
          rotateY: 1200
        }
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: {
          enable: !0,
          mode: 'grab'
        },
        onclick: {
          enable: !1,
          mode: 'push'
        },
        resize: !0
      },
      modes: {
        grab: {
          distance: 140,
          line_linked: {
            opacity: 1
          }
        },
        bubble: {
          distance: 400,
          size: 40,
          duration: 2,
          opacity: 8,
          speed: 3
        },
        repulse: {
          distance: 200,
          duration: 0.4
        },
        push: {
          particles_nb: 4
        },
        remove: {
          particles_nb: 2
        }
      }
    },
    retina_detect: !0
  },
})

const stateToProps = () => ({})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, userActionCreators, commonActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(Login);
