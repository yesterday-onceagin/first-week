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
import FullScreenHeader from './components/FullScreenHeader';

import { actions as dataViewMultiScreenActionCreators } from '../../redux/modules/dataview/multiScreen';
import { actions as itemDetailActionCreators } from '../../redux/modules/dataview/itemDetail';

import { getDashboardLayoutOptions } from '../../helpers/dashboardUtils';
import TipMixin from '../../helpers/TipMixin'
import toggleFullScreen from '../../helpers/toggleFullScreen';
import preLoadImages from '../../helpers/preLoadImages'

import { baseAlias } from '../../config'

import './screensview.less'

class ScreensView extends React.Component {
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

      //全屏
      fullScreen: {
        show: !(location.query.email === '1'),
        full: false,
        visible: true,
        title: '',
        isNeedHistoryBack: false
      },
      autoPlay: {
        play: false,
        value: 5,
        unit: 'M',
      },
      scaleConfig: {
        scaleMode: 0, //0:等比缩放宽度铺满 1:等比缩放高度铺满 2:全屏铺满 3:原始尺寸
        rate: {
          widthRate: 1,
          heightRate: 1
        }
      },
      reload: false, //是否重新请求数据
      // 验证密码
      isPublish: true,
      isEncrypt: null,
      isAuthPass: false,
      inputedPass: '',
      message: '该大屏暂未发布哦~',
      urlJson: [],
      urlArray: []
    }
  }

  componentDidMount() {
    const { onChangeLayoutVisibility, location } = this.props
    // 隐藏主框架布局
    onChangeLayoutVisibility({
      hidePageHeader: true,
      hideSideMenu: true
    })
    // 全屏监测
    this._onFullScreenChange = () => {
      if ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        this._exitFullScreen()
      } else {
        this._enterFullScreen()
      }
    }
    document.addEventListener('fullscreenchange', this._onFullScreenChange)
    document.addEventListener('webkitfullscreenchange', this._onFullScreenChange)
    document.addEventListener('mozfullscreenchange', this._onFullScreenChange)
    // 如果地址栏携带密码参数 则直接加入请求参数中
    this._fetchMutiScreen(this.props.params.screenId, location.query.pwd)
    this._loadJsonArray()
  }

  componentWillReceiveProps(nextProps) {
    const { onChangeLayoutVisibility } = this.props
    if (nextProps.params.screenId !== this.props.params.screenId) {
      this.isShareView = nextProps.route.path === 'share/:screenId'
      this.tenantCode = (nextProps.location && nextProps.location.query && nextProps.location.query.code) || ''
      // 进行跳转时 将多屏和报告的id都清空 避免再isShareView发生变化时 重载Dashbaord组件仍使用旧的state
      this.state.currReportId = ''
      this.state.multiDashboardId = ''
      this._fetchMutiScreen(nextProps.params.screenId)
      this._loadJsonArray()
      // 隐藏主框架布局
      onChangeLayoutVisibility({
        hidePageHeader: true,
        hideSideMenu: true
      })
    }
  }

  componentDidUpdate(preProp, preState) {
    const preAutoPlay = preState.autoPlay
    const { autoPlay } = this.state
    if (!_.isEqual(preAutoPlay, autoPlay)) {
      this._toggleAutoPlay()
    }
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this._onFullScreenChange)
    document.removeEventListener('webkitfullscreenchange', this._onFullScreenChange)
    document.removeEventListener('mozfullscreenchange', this._onFullScreenChange)
    this.stopAutoScaleViews()
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
    }
    return this.renderDashboardView()
  }

  _loadJsonArray() {
    //获取参数键值对
    const json = this.parseQueryString(window.location.href)
    const arrJson = []
    let isNeedBack = false
    if (json) {
      //新增直接跳转的判断
      Object.keys(json).forEach((key) => {
        if (key.indexOf('df_') > -1) {
          let obj = decodeURI(json[key])
          try {
            obj = JSON.parse(decodeURI(json[key]))
            arrJson.push(obj)
          } catch (e) { this.showErr('非法报告跳转条件') }
          isNeedBack = true
        }
      })
    }
    //组装跳转面包屑
    const urlList = localStorage.getItem('urlList')
    const urlArray = urlList ? JSON.parse(urlList) : []
    const newArray = this.generateUrlArray(urlArray)
    if (newArray.length === 0) {
      isNeedBack = false
    }
    localStorage.setItem('urlList', JSON.stringify(newArray))
    this.setState({
      urlJson: arrJson,
      urlArray: newArray,
      fullScreen: {
        ...this.state.fullScreen,
        isNeedHistoryBack: isNeedBack
      }
    })
  }

  _fetchMutiScreen(id, pwd = '') {
    const { actions } = this.props
    const sendParams = {
      id,
      isShareView: this.isShareView,
      tenantCode: this.tenantCode
    }
    // 如果传入了密码参数 则加入请求参数
    if (typeof pwd === 'string' && pwd) {
      sendParams.pwd = pwd
    }
    actions.fetchMultiScreenDetail(sendParams, (json) => {
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

  //生成最新的UrlArray
  generateUrlArray(list) {
    let newArray = []
    const { protocol, host } = window.location
    const url = decodeURI(window.location.href)
    const index = _.findIndex(list, item => `${protocol}//${host}${item.url}` === url)
    if (index && index > -1) {
      list.splice(index + 1, list.length - index)
      newArray = list
    }
    return newArray
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
      <div className="empty-view">
        <div className="tips">{msg}</div>
      </div>
    )
  }

  renderAuth() {
    const { inputedPass } = this.state
    return (
      <div className="auth-view">
        <div className="pass-wrap">
          <img src={require('../../static/images/logo.png')} width="127" />
          <Form
            validationEvent="onBlur"
            onValidSubmit={this.handleValidPass.bind(this)}
            className="pass-form"
            ref={(c) => { this.pass_form = c }}
          >

            <div style={{ clear: 'both' }}>
              <Button
                id="share-screen-password-submit-btn"
                bsStyle="primary"
                bsSize="small"
                style={{ height: '34px', float: 'right', margin: '35px 0 0 20px' }}
                onClick={() => this.pass_form.submit()}
              >
                确认
              </Button>
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
            </div>
          </Form>
        </div>
      </div>
    )
  }

  renderDashboardView() {
    const { screenPending, multiScreenData } = this.props
    const { uuid, currReportId, multiDashboardId, fullScreen, autoPlay, scaleConfig, urlJson, urlArray } = this.state
    const layoutOpts = getDashboardLayoutOptions(multiScreenData.reports[currReportId])
    const { layout } = layoutOpts

    const dashboardWidth = layout.width || 960
    const dashboardHeight = layout.height || window.innerHeight / scaleConfig.rate.heightRate

    const containerStyle = {
      width: `${dashboardWidth}px`,
      height: `${dashboardHeight}px`,
      transformOrigin: '0 0',
      transform: `scale(${scaleConfig.rate.widthRate}, ${scaleConfig.rate.heightRate})`,
      overflow: 'hidden'
    }
    const dashboardName = multiScreenData.reports[currReportId] ? multiScreenData.reports[currReportId].name : ''
    return (
      <div className="multiscreen-detail-page" id="multiscreen-detail-page">
        {
          currReportId ? (
            // 虽然进行了sacle, 但是浏览器渲染的高度还是原始高度, 导致父元素的高度不会适应scale之后的高度, 导致出现没有必要的滚动条
            <div style={{ height: `${dashboardHeight * scaleConfig.rate.heightRate}px` }}>
              <div className="dashboard-scale-container" style={containerStyle} onMouseMove={this.handleKanbanMoseMove.bind(this)}>
                <Dashboard
                  ref={(instance) => { this.dashboardInstance = instance }}
                  uuid={uuid}
                  dashboardId={multiDashboardId}
                  dashboardName={dashboardName || fullScreen.title}
                  dataviewId={currReportId}
                  width={dashboardWidth}
                  height={dashboardHeight}
                  editable={false}
                  layoutOptions={layoutOpts}
                  echartsScaleRate={scaleConfig.rate.widthRate}
                  isShareView={this.isShareView}
                  tenantCode={this.tenantCode}
                  urlJson={urlJson}
                  reload={this.state.reload}
                />
              </div>
            </div>
          ) : null
        }
        <Loading show={screenPending} containerId="multiscreen-detail-page" />
        {
          fullScreen.show && (
            <FullScreenHeader
              show={fullScreen.show}
              full={fullScreen.full}
              visible={fullScreen.visible}
              title={fullScreen.title}
              isNeedHistoryBack={fullScreen.isNeedHistoryBack}
              onFull={() => { toggleFullScreen() }}
              onHide={() => { toggleFullScreen() }}
              autoPlay={autoPlay}
              updateAutoPlay={this.updateAutoPlay.bind(this)}
              isPage={this.detailCacheData && this.detailCacheData.screens && this.detailCacheData.screens.length > 1}
              changePage={this.changePage.bind(this)}
              urlArray={urlArray}
            />
          )
        }
      </div>
    )
  }

  startLoadScreen(id, callback) {
    const { screens, dashboard } = this.detailCacheData
    const startReport = screens && screens[0]
    this.setState(prevState => ({
      multiDashboardId: dashboard && dashboard.id,
      currReportId: startReport && startReport.id,
      currLayout: startReport && startReport.layout,
      scaleConfig: {
        ...this.state.scaleConfig,
        scaleMode: (startReport && startReport.scale_mode) || 0
      },
      fullScreen: {
        ...prevState.fullScreen,
        title: (dashboard && dashboard.name) || (startReport && startReport.name)
      }
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
      this.dashboardInstance.getWrappedInstance()._getChartList(screen.id, id, true, true)
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

  handleKanbanMoseMove(e) {
    const { fullScreen, scaleConfig } = this.state
    const clientW = e.currentTarget.clientWidth * scaleConfig.rate.widthRate
    const { clientX, clientY } = e
    if (clientY < 20 || clientX < 50 || (clientW - clientX) < 50) {
      if (!fullScreen.visible) {
        this.setState({
          fullScreen: {
            ...fullScreen,
            visible: true
          }
        })
      }
    } else if (fullScreen.visible) {
      this.setState({
        fullScreen: {
          ...fullScreen,
          visible: false
        }
      })
    }
  }

  updateAutoPlay(autoPlay) {
    this.setState({
      autoPlay
    })
  }

  changePage(next) {
    this._nextPage(next)

    // 取消自动播放
    this.setState(prevState => ({
      autoPlay: {
        ...prevState.autoPlay,
        play: false
      }
    }))
  }

  _calcScaleRate(mode, layout) {
    const layoutW = layout.width || 960
    const layoutH = layout.height || 540
    switch (mode) {
      // 全屏铺满
      case 2:
        return {
          widthRate: +(window.innerWidth / layoutW).toFixed(2),
          heightRate: +(window.innerHeight / layoutH).toFixed(2),
        }
      // 按宽度
      case 0:
      default:
        return {
          widthRate: +(window.innerWidth / layoutW).toFixed(2),
          heightRate: +(window.innerWidth / layoutW).toFixed(2)
        }
    }
  }

  _nextPage(next) {
    const { multiScreenData, params } = this.props
    const { currReportId } = this.state

    const screen_reports = multiScreenData.screens[params.screenId]
    const len = screen_reports.length
    if (len <= 1) return;

    let currIndex = 0
    let nextIndex = currIndex
    for (let i = 0; i < len; i++) {
      if (currReportId === screen_reports[i]) {
        currIndex = i
        break
      }
    }
    nextIndex = (currIndex + (next ? 1 : -1)) % len
    nextIndex = nextIndex < 0 ? (len - 1) : nextIndex

    const { screens } = this.detailCacheData
    const nextReport = screens.find(screen => screen.id === screen_reports[nextIndex])
    const scaleMode = nextReport.scale_mode || 0

    this.setState(preState => ({
      currReportId: screen_reports[nextIndex],
      currLayout: nextReport.layout,
      scaleConfig: {
        ...preState.scaleConfig,
        scaleMode,
        rate: { ...this._calcScaleRate(scaleMode, nextReport.layout) }
      }
    }))
  }

  _toggleAutoPlay() {
    const { autoPlay } = this.state
    clearInterval(this._autoPlayInterval)
    if (autoPlay.play) {
      const unitToMs = {
        S: 1000,
        M: 1000 * 60,
        H: 1000 * 3600
      }
      const timeMs = autoPlay.value * unitToMs[autoPlay.unit]
      this._autoPlayInterval = setInterval(() => {
        this._nextPage(true)
      }, timeMs)
    }
  }

  _scaleViews() {
    this.setState({
      scaleConfig: {
        ...this.state.scaleConfig,
        rate: { ...this._calcScaleRate(this.state.scaleConfig.scaleMode, this.state.currLayout) }
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
        rate: {
          widthRate: 1,
          heightRate: 1
        }
      }
    })
  }

  _enterFullScreen() {
    this.setState({
      fullScreen: {
        ...this.state.fullScreen,
        show: true,
        full: true
      },
      uuid: new Date().getTime()
    })
  }

  _exitFullScreen() {
    this.setState({
      fullScreen: {
        ...this.state.fullScreen,
        show: true,
        full: false
      },
      uuid: new Date().getTime()
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

reactMixin.onClass(ScreensView, TipMixin)

const stateToProps = state => ({
  ...state.dataViewMultiScreen
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataViewMultiScreenActionCreators, itemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(ScreensView)
