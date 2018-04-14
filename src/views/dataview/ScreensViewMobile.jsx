import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import reactMixin from 'react-mixin'
import _ from 'lodash'

import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button'
import { Form, ValidatedInput } from '../../components/bootstrap-validation'
import Dashboard from '../../components/Dashboard';

import { actions as dataViewMultiScreenActionCreators } from '../../redux/modules/dataview/multiScreen';
import { actions as itemDetailActionCreators } from '../../redux/modules/dataview/itemDetail';

import { getDashboardLayoutOptions } from '../../helpers/dashboardUtils';
import TipMixin from '../../helpers/TipMixin'
import preLoadImages from '../../helpers/preLoadImages'

import { baseAlias } from '../../config'

import './screens-view-mobile.less'

class ScreensViewMobile extends React.Component {
  static propTypes = {
    screenPending: PropTypes.bool,
    multiScreenData: PropTypes.object,
    actions: PropTypes.object,
    params: PropTypes.object,
    location: PropTypes.object,
    route: PropTypes.object,
    onChangeLayoutVisibility: PropTypes.func
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props)
    const { route, location } = props
    this.isShareView = route.path === 'share/:screenId'
    this.tenantCode = location.query.code || ''
    this.timeout = () => { }
    this.state = {
      uuid: new Date().getTime(),
      multiDashboardId: '', // 当前演示大屏ID
      currReportId: '',     //当前演示的报告ID
      currLayout: {},

      scaleConfig: {
        rate: 1
      },
      reload: false, //是否重新请求数据
      // 验证密码
      isPublish: true,
      isEncrypt: null,
      isAuthPass: false,
      inputedPass: '',
      message: '该大屏暂未发布哦~',
      urlJson: []
    }
  }

  componentDidMount() {
    const { onChangeLayoutVisibility } = this.props
    // 隐藏主框架布局
    onChangeLayoutVisibility({
      hidePageHeader: true,
      hideSideMenu: true
    })
    // 如果地址栏携带密码参数 则直接加入请求参数中
    this._fetchMutiScreen(this.props.params.screenId)
    this._loadJsonArray()
  }

  componentWillReceiveProps(nextProps) {
    const { onChangeLayoutVisibility } = this.props
    if (nextProps.params.screenId !== this.props.params.screenId) {
      this.isShareView = nextProps.route.path === 'share/:screenId'
      this.tenantCode = (nextProps.location && nextProps.location.query && nextProps.location.query.code) || ''
      this._fetchMutiScreen(nextProps.params.screenId)
      this._loadJsonArray()
      // 隐藏主框架布局
      onChangeLayoutVisibility({
        hidePageHeader: true,
        hideSideMenu: true
      })
    }
  }

  componentWillUnmount() {
    this.stopAutoScaleViews()
  }

  _loadJsonArray() {
    //获取参数键值对
    const json = this.parseQueryString(window.location.href)
    const arrJson = []
    if (json) {
      Object.keys(json).forEach((key) => {
        if (key.indexOf('df_') > -1) {
          let obj = decodeURI(json[key])
          try {
            obj = JSON.parse(decodeURI(json[key]))
            arrJson.push(obj)
          } catch (e) {
            this.showErr('非法报告跳转条件')
          }
        }
      })
    }
    this.setState({
      urlJson: arrJson
    })
  }

  _fetchMutiScreen(id) {
    const { actions } = this.props
    actions.fetchMultiScreenDetail({
      id,
      isShareView: this.isShareView,
      tenantCode: this.tenantCode
    }, (json) => {
      if (!json.result) {
        if (json.code === 409) {
          // 需要密码的情况
          this.setState({
            isEncrypt: true
          })
        } else if (json.code === 403 || json.code === 404) {
          // 未发布的情况
          this.setState({
            isPublish: false,
            message: json.msg
          })
        } else if (json.code === 401) {
          this.showErr(json.msg || '需要登陆')
          setTimeout(() => {
            window.location.href = `${baseAlias}/login?returnUrl=${encodeURIComponent(window.location.href)}`;
          }, 2000)
        } else {
          this.showErr(json.msg || '获取多屏详情失败');
        }
      } else {
        const { dashboard, screens } = json.data
        this.detailCacheData = json.data
        this.preLoadScreenBackground(screens)
        // 是否为发布
        if (this.isShareView) {
          this.released_on = dashboard && dashboard.released_on
          //2018.3.14加入reload
          this.setState({ isEncrypt: false, reload: false }, () => {
            this.startLoadScreen(id, () => {
              this.startAutoScaleViews()
            })
            clearTimeout(this.timeout)
            this.watchScreenUpdate()
          })
        } else {
          this.startLoadScreen(id, () => {
            this.startAutoScaleViews()
          })
        }
      }
    })
  }

  render() {
    const { isPublish, isEncrypt, isAuthPass, message } = this.state
    if (!isPublish) {
      return this.renderErrorView(message)
    }

    if (this.isShareView) {
      if (isEncrypt === null) {
        return null
      } else if (isEncrypt && !isAuthPass) {
        return this.renderAuth()
      }
      return this.renderDashboardView()
    }
    return this.renderDashboardView()
  }

  //获取参数json键值对
  parseQueryString(url) {
    const str = url.split('?')[1]
    const Json = {}
    if (str) {
      const iterms = str.split('&')
      for (let i = 0; i < iterms.length; i++) {
        const index = iterms[i].indexOf('=')
        const key = iterms[i].substr(0, index)
        const value = iterms[i].substr(index + 1)
        Json[key] = value
      }
    }
    return Json
  }

  renderErrorView(msg) {
    return (
      <div className="empty-view-mobile">
        <div className="tips">{msg}</div>
      </div>
    )
  }

  renderAuth() {
    const { inputedPass } = this.state
    return (
      <div className="auth-view-mobile">
        <div className="pass-wrap">
          <img src={require('../../static/images/logo.png')} width="127" />
          <Form
            validationEvent="onBlur"
            onValidSubmit={this.handleValidPass.bind(this)}
            className="pass-form"
            ref={(c) => { this.pass_form = c }}
          >

            <div style={{ clear: 'both' }}>
              <div style={{ overflow: 'hidden' }}>
                <ValidatedInput
                  id="share-screen-password-input-box"
                  type="password"
                  label={<span><i className="required">&nbsp;</i>请输入密码</span>}
                  autoComplete="off"
                  name="password"
                  value={inputedPass}
                  onChange={this.handleChangePass.bind(this)}
                  wrapperClassName="input-wrapper"
                  validate='required'
                  errorHelp={{
                    required: '请输入密码'
                  }} >
                </ValidatedInput>
              </div>
              <Button
                id="share-screen-password-submit-btn"
                bsStyle="primary"
                bsSize="small"
                style={{ height: '34px', margin: '20px 0 0', width: '60%' }}
                onClick={() => this.pass_form.submit()}
              >
                确认
              </Button>
            </div>
          </Form>
        </div>
      </div>
    )
  }

  renderDashboardView() {
    const { screenPending, multiScreenData } = this.props
    const { uuid, currReportId, multiDashboardId, scaleConfig, urlJson, reload } = this.state
    const layoutOpts = getDashboardLayoutOptions(multiScreenData.reports[currReportId])
    const { layout } = layoutOpts

    const dashboardWidth = (layout.width || 960)
    const dashboardHeight = (layout.height || window.innerHeight)

    const containerStyle = {
      width: `${dashboardWidth}px`,
      height: `${dashboardHeight}px`,
      transformOrigin: '0 0',
      transform: `scale(${scaleConfig.rate})`,
      overflow: 'hidden',
      // 修复因sclae导致的额外高度
      marginBottom: scaleConfig.rate < 1 ? dashboardHeight * (scaleConfig.rate - 1) : 0
    }
    const dashboardName = multiScreenData.reports[currReportId] ? multiScreenData.reports[currReportId].name : ''
    return (
      <div className="multiscreen-detail-mobile-page" id="multiscreen-detail-mobile-page">
        {
          currReportId ? (
            <div className="dashboard-scale-container" style={containerStyle}>
              <Dashboard
                ref={(instance) => { this.dashboardInstance = instance }}
                uuid={uuid}
                dashboardId={multiDashboardId}
                dashboardName={dashboardName}
                dataviewId={currReportId}
                width={dashboardWidth}
                height={dashboardHeight}
                editable={false}
                layoutOptions={layoutOpts}
                echartsScaleRate={scaleConfig.rate}
                isShareView={this.isShareView}
                tenantCode={this.tenantCode}
                urlJson={urlJson}
                reload={reload}
                platform="mobile"
              />
            </div>
          ) : null
        }
        <Loading show={screenPending} containerId="multiscreen-detail-mobile-page" />
      </div>
    )
  }

  startLoadScreen(id, callback) {
    const { screens, dashboard } = this.detailCacheData
    const startReport = screens && screens[0]
    this.setState(() => ({
      multiDashboardId: dashboard && dashboard.id,
      currReportId: startReport && startReport.id,
      currLayout: startReport && startReport.layout
    }), () => {
      if (this.isShareView) {
        this.preLoadScreens(id, screens)
      }
      callback && callback()
    })
  }

  preLoadScreenBackground(screens) {
    const images = []
    screens && screens.forEach((screen) => {
      if (screen && screen.background && screen.background.image) {
        images.push(screen.background.image)
      }
    })
    preLoadImages(images)
  }

  preLoadScreens(id, screens) {
    const resetScreens = screens.slice(1)
    resetScreens && resetScreens.forEach((screen) => {
      this.dashboardInstance.getWrappedInstance()._getChartList(screen.id, id, true)
    })
  }

  watchScreenUpdate() {
    const _this = this
    const timeout = 60000
    const { actions, params } = this.props

    function _checkScreenUpdate() {
      actions.fetchMultiScreenDetail({
        id: params.screenId,
        isShareView: _this.isShareView,
        tenantCode: _this.tenantCode
      }, (json) => {
        if (!json.result) {
          clearTimeout(this.timeout)
          this.timeout = setTimeout(_checkScreenUpdate, timeout)
        } else {
          const { dashboard, screens } = json.data
          _this.detailCacheData = json.data
          _this.preLoadScreenBackground(screens)

          const released_on = parseInt(new Date(dashboard.released_on).getTime(), 10)
          const prev_released_on = parseInt(new Date(_this.released_on).getTime(), 10)
          if (dashboard.released_on && prev_released_on && (released_on > prev_released_on)) {
            _this.setState({
              reload: true
            })
          } else {
            clearTimeout(this.timeout)
            this.timeout = setTimeout(_checkScreenUpdate, timeout)
          }
        }
      })
    }
    clearTimeout(this.timeout)
    this.timeout = setTimeout(_checkScreenUpdate, timeout)
  }

  handleChangePass(e) {
    this.setState({
      inputedPass: e.target.value
    })
  }

  // 输入密码提交
  handleValidPass() {
    const { params, actions } = this.props
    // 先请求多屏详情校验密码
    actions.fetchMultiScreenDetail({
      id: params.screenId,
      isShareView: this.isShareView,
      tenantCode: this.tenantCode,
      pwd: this.state.inputedPass
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '获取多屏详情失败');
      } else {
        const { dashboard, screens } = json.data
        this.detailCacheData = json.data
        this.released_on = dashboard && dashboard.released_on

        this.preLoadScreenBackground(screens)

        this.props.actions.fetchChartList({
          dashboard_id: screens && screens[0] && screens[0].id,
          multi_dashboard_id: dashboard.id,
          isShareView: this.isShareView,
          tenantCode: this.tenantCode
        }, (_json) => {
          if (!_json.result) {
            this.showErr(_json.msg);
          } else {
            this.setState({
              isAuthPass: true
            }, () => {
              this.startLoadScreen(params.screenId, () => {
                this.startAutoScaleViews()
              })
              this.watchScreenUpdate()
            })
          }
        });
      }
    })
  }

  _scaleViews() {
    const widthScaleRate = +(window.innerWidth / (this.state.currLayout.width || 960))
    this.setState({
      scaleConfig: {
        ...this.state.scaleConfig,
        rate: widthScaleRate
      }
    })
  }

  startAutoScaleViews() {
    this._scaleViews()
    this._debounceScaleViews = this._debounceScaleViews || _.debounce(this._scaleViews.bind(this), 200)
    window.addEventListener('resize', this._debounceScaleViews)
  }

  stopAutoScaleViews() {
    window.removeEventListener('resize', this._debounceScaleViews)
    this.setState({
      scaleConfig: {
        ...this.state.scaleConfig,
        rate: 1
      }
    })
  }

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  }
}

reactMixin.onClass(ScreensViewMobile, TipMixin)

const stateToProps = state => ({
  ...state.dataViewMultiScreen
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataViewMultiScreenActionCreators, itemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(ScreensViewMobile)