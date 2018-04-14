import React from 'react'
import PropTypes from 'prop-types'

import Loading from 'react-bootstrap-myui/lib/Loading'
import Dashboard from '@components/Dashboard'
import EmptyStatus from '@components/EmptyStatus';

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail'

import _ from 'lodash'
import { getDashboardLayoutOptions } from '@helpers/dashboardUtils'

// 应用门户数据报告
class AppDashboardContent extends React.PureComponent {
  static propTypes = {
    dashboardId: PropTypes.string.isRequired,
    hasHeader: PropTypes.bool,
    hasNav: PropTypes.bool,
    dashboardPending: PropTypes.bool,
    chartPending: PropTypes.bool,
    onChangeNavBar: PropTypes.func,
    actions: PropTypes.object,
    dashboardData: PropTypes.object
  };

  static defaultProps = {
    hasHeader: false,
    hasNav: false
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      uuid: new Date().getTime()
    };
  }

  componentDidMount() {
    const { dashboardId, onChangeNavBar } = this.props
    if (!dashboardId && typeof onChangeNavBar === 'function') {
      onChangeNavBar(null)
    }
    dashboardId && this._getDashboardData(dashboardId)
    // 开始监听屏幕变化
    this.onAutoResize()
  }

  componentWillReceiveProps(nextProps) {
    const { dashboardId, onChangeNavBar } = nextProps
    if (this.props.dashboardId !== dashboardId) {
      if (!dashboardId && typeof onChangeNavBar === 'function') {
        onChangeNavBar(null)
      }
      dashboardId && this._getDashboardData(dashboardId)
      this.setState({
        uuid: new Date().getTime()
      });
    }
  }

  componentWillUnmount() {
    // 停止监听页面变化
    this.offAutoResize()
  }

  render() {
    const { dashboardPending, chartPending, dashboardData, dashboardId, hasHeader, hasNav } = this.props
    const { uuid } = this.state
    const pending = dashboardPending || chartPending
    const currDashboardData = dashboardData[dashboardId]
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    const containerHeight = window.innerHeight - (hasNav ? 50 : 0) - (hasHeader ? 50 : 0)
    const dashboardHeight = layout.height || containerHeight
    const dashboardWidth = layout.width || 960
    const scaleRatio = +((window.innerWidth - (layout.height > containerHeight ? 12 : 0)) / layout.width)

    const containerStyle = {
      width: `${dashboardWidth}px`,
      height: `${dashboardHeight}px`,
      transformOrigin: '0 0',
      transform: `scale(${scaleRatio})`,
      // 修复因sclae导致的额外高度
      marginBottom: scaleRatio < 1 ? dashboardHeight * (scaleRatio - 1) : 0
    }
    
    return (
      <div className="app-dashboard-page auto-y hidden-x" id="app-dashboard-page" style={this.STYLE_SHEET.container}>
        {
          dashboardId ? (
            currDashboardData ? (
              <div className="dashboard-scale-container" style={containerStyle}>
                <Dashboard
                  uuid={uuid}
                  dataviewId={dashboardId}
                  width={dashboardWidth}
                  height={dashboardHeight}
                  editable={false}
                  layoutOptions={layoutOpts}
                  echartsScaleRate={scaleRatio}
                  dashboardId={dashboardId}
                  dashboardName={currDashboardData.name}
                  platform="mobile"
                />
              </div>
            ) : this.renderEmpty(pending, '数据报告不存在或已被删除，请重新配置')
          ) : this.renderEmpty(pending, '没有为此页面配置需要展示的数据报告或链接')
        }

        <Loading show={pending} containerId="app-dashboard-page" />
      </div>
    );
  }

  // 渲染空状态
  renderEmpty(isPending, text = '') {
    if (isPending) {
      return null
    }
    return (
      <EmptyStatus
        icon="dmpicon-empty-report"
        textSize="16px"
        text={text}
      />
    )
  }

  onAutoResize() {
    this._debounceResize = this._debounceResize || _.debounce(() => {
      this.setState({
        uuid: new Date().getTime()
      });
    }, 200)
    window.addEventListener('resize', this._debounceResize)
  }

  offAutoResize() {
    window.removeEventListener('resize', this._debounceResize)
  }

  // 获取报告信息
  _getDashboardData(id) {
    const { actions, onChangeNavBar } = this.props
    if (typeof onChangeNavBar === 'function') {
      actions.fetchDashboardData(id, (json) => {
        if (json.result && json.data) {
          onChangeNavBar(json.data.name)
        } else {
          onChangeNavBar(null)
        }
      });
    } else {
      actions.fetchDashboardData(id)
    }
  }

  STYLE_SHEET = {
    container: { height: '100%', width: '100%' }
  }
}

const stateToProps = state => ({
  dashboardData: state.dataViewItemDetail.dashboardData,
  dashboardPending: state.dataViewItemDetail.dashboardPending,
  chartPending: state.dataViewItemDetail.chartPending
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(itemDetailActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(AppDashboardContent);
