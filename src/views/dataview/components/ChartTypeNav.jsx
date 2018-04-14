import React from 'react'
import PropTypes from 'prop-types'

import ChartMenu from './ChartMenu'

class ChartTypeNav extends React.PureComponent {
  static propTypes = {
    onAddChart: PropTypes.func.isRequired,
    onGoAddSection: PropTypes.func            // 临时 迁移完成后不再跳转编辑新增页
  };

  static defaultProps = {

  };

  render() {
    const { onAddChart, onGoAddSection } = this.props
    return (
      <div className="nav-left-container nav-btn-container">
        <div className="nav-left-btn" onClick={onGoAddSection}>
          <i className="dmpicon-chart nav-left-btn-icon" />
          图表
        </div>
        <div className="nav-left-btn">
          <i className="dmpicon-chart-map nav-left-btn-icon" />
          地图
          <div className="popover-wrapper">
            <ul style={this.STYLE_SHEET.ChartMenuContainer}>
              <ChartMenu element="li" chart_code="area_map" onClick={onAddChart.bind(this, 'area_map', '区域地图')}>
                <div className="icon-container"><i className="chart-type-icon area_map" /></div>
                <div className="name">区域地图</div>
              </ChartMenu>
              <ChartMenu element="li" chart_code="label_map" onClick={onAddChart.bind(this, 'label_map', '标签地图')}>
                <div className="icon-container"><i className="chart-type-icon label_map" /></div>
                <div className="name">标签地图</div>
              </ChartMenu>
            </ul>
          </div>
        </div>

        <ChartMenu element="li" className="nav-left-btn" chart_code="simple_image" onClick={onAddChart.bind(this, 'simple_image', '图片')}>
          <i className="nav-left-btn-icon dmpicon-picture" />
          <div className="name">图片</div>
        </ChartMenu>

        <ChartMenu element="li" className="nav-left-btn" chart_code="simple_text" onClick={onAddChart.bind(this, 'simple_text', '文本')}>
          <i className="nav-left-btn-icon dmpicon-text" />
          <div className="name">文本</div>
        </ChartMenu>

        <div className="nav-left-btn">
          <i className="dmpicon-filter nav-left-btn-icon" />
          筛选器
          <div className="popover-wrapper">
            <ul style={this.STYLE_SHEET.ChartMenuContainer}>
              <ChartMenu element="li" chart_code="select_filter" onClick={onAddChart.bind(this, 'select_filter', '下拉筛选')}>
                <div className="icon-container"><i className="chart-type-icon indicator_select" /></div>
                <div className="name">下拉筛选</div>
              </ChartMenu>
              <ChartMenu element="li" chart_code="time_interval_filter" onClick={onAddChart.bind(this, 'time_interval_filter', '时间区间筛选')}>
                <div className="icon-container"><i className="chart-type-icon indicator_date" /></div>
                <div className="name">时间区间筛选</div>
              </ChartMenu>
              <ChartMenu element="li" chart_code="tablist" onClick={onAddChart.bind(this, 'tablist', 'Tab列表')}>
                <div className="icon-container"><i className="chart-type-icon tablist" /></div>
                <div className="name">Tab列表</div>
              </ChartMenu>
            </ul>
          </div>
        </div>

        <div className="nav-left-btn">
          <i className="dmpicon-shape nav-left-btn-icon" />
          辅助图形
          <div className="popover-wrapper">
            <ul style={this.STYLE_SHEET.ChartMenuContainer}>
              <ChartMenu element="li" chart_code="simple_clock" onClick={onAddChart.bind(this, 'simple_clock', '时间器')}>
                <div className="icon-container"><i className="dmpicon-time" />12:00</div>
                <div className="name">时间器</div>
              </ChartMenu>
              <ChartMenu element="li" chart_code="simple_tab" onClick={onAddChart.bind(this, 'simple_tab', 'Tab组件')}>
                <div className="icon-container simple-tab-chart-menu">
                  <div className="simple-tab-create-icon">
                    <span>Tab</span>
                    <span>Tab</span>
                    <span>Tab</span>
                  </div>
                </div>
                <div className="name">Tab组件</div>
              </ChartMenu>
            </ul>
          </div>
        </div>

        <div className="nav-left-btn">
          <i className="dmpicon-diamond nav-left-btn-icon" />
          更多组件
          <div className="popover-wrapper">
            <ul style={{
              ...this.STYLE_SHEET.ChartMenuContainer,
              width: '520px',
              flexWrap: 'wrap'
            }}>
              <ChartMenu element="li" chart_code="table" onClick={onAddChart.bind(this, 'table', '表格')}>
                <div className="icon-container"><i className="chart-type-icon C200" /></div>
                <div className="name">表格</div>
              </ChartMenu>
              <ChartMenu element="li" chart_code="numerical_value" onClick={onAddChart.bind(this, 'numerical_value', '数值图')}>
                <div className="icon-container"><i className="chart-type-icon C310" /></div>
                <div className="name">数值图</div>
              </ChartMenu>
              <ChartMenu element="li" chart_code="cluster_column" onClick={onAddChart.bind(this, 'cluster_column', '柱状图')}>
                <div className="icon-container"><i className="chart-type-icon C210" /></div>
                <div className="name">柱状图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="stack_bar" onClick={onAddChart.bind(this, 'stack_bar', '堆叠柱状图')}>
                <div className="icon-container"><i className="chart-type-icon stack-bar" /></div>
                <div className="name">堆叠柱状图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="horizon_bar" onClick={onAddChart.bind(this, 'horizon_bar', '条形图')}>
                <div className="icon-container"><i className="chart-type-icon horizon-bar" /></div>
                <div className="name">条形图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="horizon_stack_bar" onClick={onAddChart.bind(this, 'horizon_stack_bar', '堆叠条形图')}>
                <div className="icon-container"><i className="chart-type-icon horizon-stack-bar" /></div>
                <div className="name">堆叠条形图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="pie" onClick={onAddChart.bind(this, 'pie', '饼图')}>
                <div className="icon-container"><i className="chart-type-icon C230" /></div>
                <div className="name">饼图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="circle_pie" onClick={onAddChart.bind(this, 'circle_pie', '环形饼图')}>
                <div className="icon-container"><i className="chart-type-icon circle-pie" /></div>
                <div className="name">环形饼图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="rose_pie" onClick={onAddChart.bind(this, 'rose_pie', '玫瑰图')}>
                <div className="icon-container"><i className="chart-type-icon rose-pie" /></div>
                <div className="name">玫瑰图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="circle_rose_pie" onClick={onAddChart.bind(this, 'circle_rose_pie', '环形玫瑰图')}>
                <div className="icon-container"><i className="chart-type-icon circle-rose-pie" /></div>
                <div className="name">环形玫瑰图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="funnel" onClick={onAddChart.bind(this, 'funnel', '漏斗图')}>
                <div className="icon-container"><i className="chart-type-icon funnel" /></div>
                <div className="name">漏斗图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="scatter" onClick={onAddChart.bind(this, 'scatter', '散点图')}>
                <div className="icon-container"><i className="chart-type-icon C280" /></div>
                <div className="name">散点图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="line" onClick={onAddChart.bind(this, 'line', '折线图')}>
                <div className="icon-container"><i className="chart-type-icon C220" /></div>
                <div className="name">折线图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="stack_line" onClick={onAddChart.bind(this, 'stack_line', '堆叠折线图')}>
                <div className="icon-container"><i className="chart-type-icon stack-line" /></div>
                <div className="name">堆叠折线图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="area" onClick={onAddChart.bind(this, 'area', '面积图')}>
                <div className="icon-container"><i className="chart-type-icon C350" /></div>
                <div className="name">面积图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="stack_area" onClick={onAddChart.bind(this, 'stack_area', '堆叠面积图')}>
                <div className="icon-container"><i className="chart-type-icon stack-area" /></div>
                <div className="name">堆叠面积图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="candlestick" onClick={onAddChart.bind(this, 'candlestick', 'K线图')}>
                <div className="icon-container"><i className="chart-type-icon candlestick" /></div>
                <div className="name">K线图</div>
              </ChartMenu>

              <ChartMenu element="li" chart_code="treemap" onClick={onAddChart.bind(this, 'treemap', '树图')}>
                <div className="icon-container"><i className="chart-type-icon treemap" /></div>
                <div className="name">树图</div>
              </ChartMenu>

            </ul>
          </div>
        </div>
      </div>
    )
  }

  static CHART_NAV_TREE = [

  ];

  STYLE_SHEET = {
    ChartMenuContainer: {
      display: 'flex',
      flexDirection: 'row',
      maxWidth: '520px',
      padding: '10px',
      alignItems: 'flex-start'
    }
  };
}

export default ChartTypeNav
