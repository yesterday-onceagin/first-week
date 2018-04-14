import React from 'react'
import PropTypes from 'prop-types'

import Loading from 'react-bootstrap-myui/lib/Loading'
import Dashboard from '../../components/Dashboard'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as itemDetailActionCreators } from '../../redux/modules/dataview/itemDetail'

import { getDashboardLayoutOptions } from '../../helpers/dashboardUtils'

// 应用门户数据报告
class AppDashboard extends React.PureComponent {
  static propTypes = {
    actions: PropTypes.object,
    params: PropTypes.object,
    dashboardData: PropTypes.object,
    onChangeNavBar: PropTypes.func,
    spread: PropTypes.bool,
    dashboardPending: PropTypes.bool,
    chartPending: PropTypes.bool
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      uuid: new Date().getTime(),
      dashboardWidth: window.innerWidth - 40 - (this.props.spread ? 200 : 50),
      dashboardHeight: window.innerHeight - 50 - 50 - 20
    };
  }

  componentWillMount() {
    const { params, onChangeNavBar } = this.props
    if (params.dataview_id) {
      this._getAndSetTitle(params.dataview_id);
    } else {
      // 没有配置时清空navbar
      onChangeNavBar(null);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.spread !== nextProps.spread) {
      // spread改变时触发Dashboard组件内部的reset方法
      this.setState({
        dashboardWidth: window.innerWidth - 40 - (nextProps.spread ? 200 : 50),
        dashboardHeight: window.innerHeight - 50 - 50 - 20
      });
    }

    if (this.props.params.dataview_id !== nextProps.params.dataview_id) {
      if (!nextProps.params.dataview_id) {
        // 没有配置时清空navbar
        this.props.onChangeNavBar(null);
      } else {
        this._getAndSetTitle(nextProps.params.dataview_id);
      }
      this.setState({
        uuid: new Date().getTime()
      });
    }
  }

  render() {
    const { dashboardPending, chartPending, dashboardData, params } = this.props
    const { uuid, dashboardWidth, dashboardHeight } = this.state
    const pending = dashboardPending || chartPending
    const currDashboardData = dashboardData[params.dataview_id]
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    const scaleRatio = +(dashboardWidth / layout.width)
    const containerStyle = {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      transformOrigin: '0 0',
      transform: `scale(${scaleRatio})`
    }
    return (
      <div className="modules-page-container" style={{ marginRight: '-12px' }}>
        <div className="app-dashboard-page auto-y"
          id="app-dashboard-page"
          style={this.STYLE_SHEET.container}
        >
          {
            params.dataview_id ? (
              currDashboardData ? (
                <div className="dashboard-scale-container" style={containerStyle}>
                  <Dashboard
                    uuid={uuid}
                    dataviewId={params.dataview_id}
                    width={dashboardWidth}
                    height={dashboardHeight}
                    editable={false}
                    layoutOptions={layoutOpts}
                    echartsScaleRate={scaleRatio}
                    dashboardId={params.dataview_id}
                    dashboardName={currDashboardData.name}
                  />
                </div>
              ) : this.renderEmpty(pending, '数据报告不存在或已被删除，请重新配置')
            ) : this.renderEmpty(pending, '没有为此页面配置需要展示的数据报告或链接')
          }

          <Loading show={pending} containerId="app-dashboard-page" />
        </div>
      </div>
    );
  }

  // 渲染空状态
  renderEmpty(isPending, text = '') {
    if (isPending) {
      return null
    }
    return <h2>{text}</h2>
  }

  // 获取报告信息
  _getAndSetTitle(id) {
    this.props.actions.fetchDashboardData(id, (json) => {
      if (json.result && json.data) {
        // 向MAIN通知navbar显示内容
        this.props.onChangeNavBar(json.data.name);
      } else {
        this.props.onChangeNavBar(null);
      }
    });
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

export default connect(stateToProps, dispatchToProps)(AppDashboard);
