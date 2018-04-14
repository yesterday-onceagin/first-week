import React from 'react'
import PropTypes from 'prop-types'

import ErrorStatus from '@components/ErrorStatus'
import EchartsMap from './map'
import fmtChartData from '../utils/fmtChartData';
import { getCustomConfigData, concatCommonConfig, getMergedCustomConfigData } from '../utils/propConfigHelper'
import transferConfigFromLayoutExtend from '../utils/transferConfigFromLayoutExtend'
import _ from 'lodash'
import RavenDmp from '@helpers/RavenDmp'

import { DEV } from '../../../config'

import './index.less';

// sentry config
const NEED_SENTRY = !DEV;
const r = new RavenDmp()

const _hasNoData = function (_data) {
  return !_data.data || typeof _data.data === 'string' || _data.data.length === 0
}

class Echarts extends React.Component {
  static propTypes = {
    echartsScaleRate: PropTypes.number,                   // 全屏模式下需要缩放charts
    chart_config: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]),
    legendTheme: PropTypes.object,                        // 主题
    code: PropTypes.string,                               // 类型
    echart: PropTypes.object,                             // 图表对象
    data: PropTypes.oneOfType([                           // 数据
      PropTypes.array,
      PropTypes.object
    ]),
    events: PropTypes.object,                             // 相关事件
    option: PropTypes.object,                             // 配置
    mode: PropTypes.string,                               // 模式，如果是可以交互的模式，则为['editabled', 'read']  
    through: PropTypes.bool,                              // 是否穿透
    pending: PropTypes.bool,
    func_config: PropTypes.object,
    dashboardName: PropTypes.string,
    editable: PropTypes.bool                               // 是否处在编辑状态
  };

  constructor(props) {
    super(props)
    this.state = {
      hasError: false
    }
    // 暴露的static 方法
    this.getEcharts = () => this.echart
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true });

    if (NEED_SENTRY) {
      r.init({ ...this.props })
      r.capture(error, { extra: errorInfo });
    }
  }

  render() {
    const { hasError } = this.state
    // 捕捉到错误后直接崩溃状态
    if (hasError) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '260px', height: '200px', overflow: 'hidden' }}>
            <ErrorStatus size={14} text="图表崩溃了，请尝试重新配置该图表" />
          </div>
        </div>
      )
    }
    const { code, echart, data, pending, echartsScaleRate, func_config, chart_config, dashboardName, editable, ...otherProps } = this.props
    let _data = data
    let originData = data

    // 如果是标签
    const hasIndicators = data && data.indicators
    const hasData = data && data.data && typeof data.data === 'object'
    // 如果是内置组件，则进行数据转换；如果是扩展组件，返回原始数据
    if (EchartsMap && EchartsMap[code] && hasIndicators && hasData) {
      _data = {
        data: fmtChartData(code, data.indicators, data.data, data.conditions, data.data.marklines)
      }
    }

    // 如果有默认数据
    if (_data && (_hasNoData(_data) || (data.data && data.data.length === 0)) && echart && echart.designer && echart.designer.previewData) {
      const previewData = _.cloneDeep(echart.designer.previewData)
      _data = previewData
      originData = previewData
    }

    //显示的时候  
    let dom = null
    // 转换后的数据发现未同步，- 还未生成
    // 转换前的数据：还未生成
    // 转换前的数据：为空  
    // 转换后，发现未同步
    if (_data) {
      if (_hasNoData(_data) || (data.data && data.data.length === 0)) {
        dom = (
          <div className="error-tips" >
            <i className="dmpicon-empty-chart" style={{ fontSize: '48px', paddingBottom: '5px' }} />
            暂无数据
          </div>
        )
      } else {
        const Element = (echart && echart.component) || EchartsMap[code]
        const chartConfig = _.cloneDeep(func_config)
        // 过滤 堆叠的 计算值类型 辅助线
        if (this.DEFAULT_STACK_CODE.indexOf(code) > -1 && chartConfig) {
          chartConfig.markLine = chartConfig.markLine.filter(item => item.mode === '固定值')
        }

        let chartConfigData = chart_config
        if (!chart_config) {
          chartConfigData = echart && echart.designer && echart.designer.chartConfig ? getCustomConfigData(concatCommonConfig(echart.designer.chartConfig, code)) : []

          // 如果新配置数据为空，且旧配置数据有值的话，则进行旧数据迁移至新配置
          if (otherProps.layoutOptions && Object.keys(otherProps.layoutOptions).length > 0) {
            chartConfigData = transferConfigFromLayoutExtend(code, otherProps.layoutOptions, chartConfigData, otherProps.legendTheme)
          }
        }
        // 如果配置数据与组件配置属性版本不一致，则升级配置数据, 比如增加了某一项配置
        if (echart && echart.isCustom) {
          const defaultConfig = getCustomConfigData(concatCommonConfig(echart.designer.chartConfig, code)) || []
          chartConfigData = getMergedCustomConfigData(chartConfigData, defaultConfig)
        }
        dom = <Element
          {...otherProps}
          code={code}
          ref={(instance) => { this.echart = instance }}
          func_config={chartConfig}
          scaleRate={echartsScaleRate}
          originData={originData}
          chart_config={chartConfigData}
          data={_data.data}
          editable={editable}
          dashboardName={dashboardName} />
      }
    }

    return (
      <div
        className="graph-wrapper"
        key={data && data.id ? `${code}_${data.id}` : `${code}`}
      >
        {pending ? <div className="error-tips">加载中...</div> : dom}
      </div>
    )
  }

  // 堆叠图类型  
  DEFAULT_STACK_CODE = ['stack_line', 'stack_area', 'stack_bar', 'horizon_stack_bar'];
}

export default Echarts;
