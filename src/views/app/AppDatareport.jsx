import React from 'react';
import PropTypes from 'prop-types'

import Loading from 'react-bootstrap-myui/lib/Loading';
import Dashboard from '../../components/Dashboard';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as itemDetailActionCreators } from '../../redux/modules/dataview/itemDetail';

import _ from 'lodash'
import { getDashboardLayoutOptions } from '../../helpers/dashboardUtils';

// 外链数据报告
class AppDatareport extends React.PureComponent {
  static propTypes = {
    actions: PropTypes.object,
    params: PropTypes.object,
    dashboardData: PropTypes.object,
    onChangeLayoutVisibility: PropTypes.func,
    isMobile: PropTypes.bool,
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
      currDashboardData: {}
    };
  }

  componentWillMount() {
    const { onChangeLayoutVisibility, params } = this.props
    // 隐藏主框架布局
    onChangeLayoutVisibility({
      hidePageHeader: true,
      hideSideMenu: true
    })
    if (!params.dataview_id) {
      document.title = '数据报告';
    } else {
      this._getAndSetTitle(params.dataview_id);
    }
  }

  componentDidMount() {
    if (this.props.isMobile) {
      // 开始监听屏幕变化
      this.onAutoResize()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.dataview_id !== nextProps.params.dataview_id) {
      if (!nextProps.params.dataview_id) {
        document.title = '数据报告';
      } else {
        this._getAndSetTitle(nextProps.params.dataview_id);
      }
      this.setState({
        uuid: new Date().getTime()
      });
    }
  }

  componentWillUnmount() {
    if (this.props.isMobile) {
      // 停止监听页面变化
      this.offAutoResize()
    }
  }

  render() {
    const { dashboardPending, chartPending, dashboardData, isMobile, params } = this.props
    const { uuid } = this.state
    const pending = dashboardPending || chartPending
    const currDashboardData = dashboardData[params.dataview_id]
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    const dashboardWidth = window.innerWidth - 12
    const dashboardHeight = window.innerHeight - 50
    const scaleRatio = +(dashboardWidth / layout.width)
    const containerStyle = {
      width: `${layout.width}px`,
      height: `${layout.height * (isMobile ? scaleRatio : 1)}px`,
      transformOrigin: '0 0',
      transform: `scale(${scaleRatio})`
    }

    return (
      <div className="modules-page-container" style={this.STYLE_SHEET.page}>
        {
          params.dataview_id && (
            <div className="datareport-title" style={this.STYLE_SHEET.title}>
              {currDashboardData ? (currDashboardData.name || '数据报告') : '数据报告'}
            </div>
          )
        }

        <div className="data-view target-blank-datareport-page" id="target-blank-datareport-page" style={this.STYLE_SHEET.box}>
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
                    platform={isMobile ? 'mobile' : 'pc'}
                  />
                </div>
              ) : this.renderEmpty(pending, '数据报告不存在或已被删除，请重新配置')
            ) : this.renderEmpty(pending, '没有为此页面配置需要展示的数据报告或链接')
          }

          <Loading show={pending} containerId="target-blank-datareport-page" />
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
  _getAndSetTitle(id) {
    this.props.actions.fetchDashboardData(id, (json) => {
      if (json.result && json.data) {
        document.title = json.data.name || '数据报告'
      } else {
        document.title = '数据报告';
      }
    });
  }

  STYLE_SHEET = {
    page: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    title: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      height: '50px',
      padding: '17px 12px 0px',
      lineHeight: '22px',
      fontSize: '16px'
    },
    box: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      top: '50px'
    },
  };
}

const stateToProps = state => ({
  dashboardData: state.dataViewItemDetail.dashboardData,
  dashboardPending: state.dataViewItemDetail.dashboardPending,
  chartPending: state.dataViewItemDetail.chartPending
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(itemDetailActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(AppDatareport);
