import React from 'react'
import PropTypes from 'prop-types'

import DisplayItem from './DisplayItem'
import Refresh from './Refresh'
import ColorThemeSection from './ColorThemeSection'
import GaugeDataSeries from './GaugeDataSeries'

class DataSeries extends React.Component {
  static propTypes = {
    colorTheme: PropTypes.object,
    chart: PropTypes.object
  };

  render() {
    const { colorTheme, chart } = this.props
    const chartCode = chart.chart_code
    // 存在维度条目数 
    // 1、非筛选器（数据系列已经隐藏,此处不判断）
    // 2、非数值图(仪表盘)
    // 3、非热力图
    const hasDisplayItem = this.NO_DISPLAY_ITEM_CODE.indexOf(chartCode) === -1
    // 存在目标值
    const hasDesiredValue = this.HAS_DESIRED_VALUE.indexOf(chartCode) > -1
    const isThroughLayer = chart.through_index > 0

    return (
      <div style={{ marginBottom: '10px' }} className="data-series-config-inner">
        {colorTheme && <ColorThemeSection {...this.props} />}
        {hasDisplayItem && <hr />}
        {hasDisplayItem && <DisplayItem {...this.props} />}
        {!isThroughLayer && <hr />}
        {!isThroughLayer && <Refresh {...this.props} />}
        {hasDesiredValue && <hr />}
        {hasDesiredValue && <GaugeDataSeries {...this.props} />}
      </div>
    )
  }

  NO_DISPLAY_ITEM_CODE = ['numerical_value', 'gauge', 'split_gauge', 'liquid_fill'];
  NO_COLORS_CODE = ['numerical_value', 'table'];
  HAS_DESIRED_VALUE = ['gauge', 'split_gauge', 'liquid_fill', 'radar']
}

export default DataSeries
