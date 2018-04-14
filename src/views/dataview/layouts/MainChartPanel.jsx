import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button';
import classnames from 'classnames';
import Echarts from '../echarts';
import EchartConnect from '../components/EchartConnect'

class MainChartPanel extends Component {
  static PropTypes = {
    indicators: PropTypes.object,
    colorTheme: PropTypes.object,
    chartId: PropTypes.string,
    mode: PropTypes.string,
    through_active: PropTypes.number,
    chart_uuid: PropTypes.number,
    chart_data: PropTypes.array,
    onChange: PropTypes.func,
    echart: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      info: props.info,
      heatOption: props.heatOption,
      dataList: props.dataList,
      conditions: props.conditions,
      default_value: props.default_value
    }

    this.getEcharts = () => this.echarts.getEcharts()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.setState({
        info: nextProps.info,
        heatOption: nextProps.heatOption,
        dataList: nextProps.dataList,
        conditions: nextProps.conditions,
        default_value: nextProps.default_value
      })

      // 如果更改了刷新状态
      if (this.props.needRefresh !== nextProps.needRefresh) {
        const echarts = this.getEcharts()

        if (echarts && typeof echarts.getChart === 'function') {
          const $echarts = echarts.getChart()
          const $container = $(this.getEcharts().graphDom)
          $echarts && $echarts.resize({
            width: $container.width(),
            height: nextProps.needRefresh ? ($container.height() - 80) : ($container.height() + 80)
          })
        }
      }
    }
  }

  render() {
    const { indicators, mode, through_active, chart_uuid, chart_data, chartId, chart_pending, needRefresh, onRefresh, layoutOptions, colorTheme, echart, designTime } = this.props
    const { info, default_value, dataList, conditions, heatOption } = this.state

    const innerClass = classnames('chart-view-wrap', {
      map: mode === 'map',
      through: through_active > 0 && indicators['图层'] && indicators['图层'].length > 1
    })

    const wrapClass = classnames('inner-box-wrap', {
      refresh: needRefresh
    })

    let through = through_active > -1
      && indicators['图层'].length > 1
      && through_active < indicators['图层'].length - 1;

    // 自定义组件校验是否允许穿透
    if (through && echart && echart.designer) {
      through = !!echart.designer.penetrable
    }

    const events = {
      onUpdate: this.handleHeatUpdate.bind(this),               // 热力图的 位置和 权重设置.
      onSort: this.handleChangeSort.bind(this),                 // 柱状图等排序
      onThrough: this.handleChartThrough.bind(this),            // 穿透
      onSelectorChange: this.handleChangeSelect.bind(this),     // 下拉列表
      onTimeChange: this.handleChangeOther.bind(this),          // 时间
      onDateChange: this.handleChangeOther.bind(this),          // 日期
      onNumberChange: this.handleChangeOther.bind(this),        // 数值改变 （筛选）
    }

    const _chart_data = chart_data

    //如果是下拉筛选
    const hasDataList = Array.isArray(dataList) && dataList.length > 0
    const hasConditions = Array.isArray(conditions) && conditions.length > 0
    if (info.chart_code === 'select_filter' && hasDataList && hasConditions) {
      conditions.forEach((condition) => {
        //如果处在condition的筛选条件中，代表该下拉框不需要更新
        Object.keys(dataList[0]).forEach((key) => {
          if (key === condition.col_name && chart_data) {
            _chart_data.data[0][key] = dataList[0][key]
          }
        })
      })
    }

    return <div className={wrapClass}>
      <div className={innerClass} id="chart-view-wrap">
        <Echarts
          clearSelects
          ref={(instance) => { this.echarts = instance }}
          select_mode="edit"
          code={info.chart_code || 'table'}
          echart={echart}
          sort={info.sort_method}
          id={chartId}
          option={heatOption}
          key={chart_uuid}
          uuid={chart_uuid}
          data={_chart_data}
          layoutOptions={layoutOptions}
          defaultValue={default_value}
          through={through}
          events={events}
          legendTheme={colorTheme}
          editable={true}
          designTime={designTime}
        />
        <Loading show={chart_pending} containerId="chart-view-wrap" />
      </div>
      {
        needRefresh && (
          <div style={this.STYLE_SHEET.refreshBtn}>
            <Button bsStyle="primary" bsSize="small" onClick={onRefresh}>刷新数据</Button>
          </div>
        )
      }
      {this.renderThroughNav()}
    </div>
  }

  renderThroughNav() {
    const { indicators, through_active } = this.props
    return Array.isArray(indicators['图层']) && indicators['图层'].length > 1 ? <ul className="through-nav">
      {indicators['图层'].map((item, index) => {
        const text = index > 0 ? indicators['图层'][index - 1].col_value : item.alias_name || item.col_name
        return index <= through_active && through_active > 0 ? <li key={index} className={through_active == index ? 'active' : ''}>
          {index > 0 && <i className="dmpicon-arrow-down" />}
          <span onClick={this.handleChangeThroughNav.bind(this, index)}>{text}</span>
        </li> : null
      })}
    </ul> : null
  }

  // 热力图
  handleHeatUpdate(data) {
    this.state.heatOption = {
      ...data,
      max: +data.max
    }
    this.props.onChange('heatmap', this.state)
  }

  // 柱状图、折线等排序
  handleChangeSort(sort) {
    this.state.info.sort_method = sort
    this.props.onChange('chartSort', this.state)
  }

  handleChartThrough(type, data) {
    this.props.onChange('throughIn', type, data)
  }

  handleChangeThroughNav(active) {
    this.props.onChange('throughBack', active)
  }

  //用于监控下拉框变化
  handleChangeSelect(conditions, id, type, dataList) {
    if (conditions) {
      this.setState({
        conditions,
        dataList,               // 给selector赋值
      }, () => {
        this.props.onChange('chartSelect', this.state)
      })
    }
  }

  //操作默认值变化
  handleChangeOther(conditions) {
    const defaultValue = []
    conditions.forEach((item) => {
      defaultValue.push(item.col_value)
    })
    this.setState({
      ...this.state,
      default_value: defaultValue.toString(),
    }, () => {
      this.props.onChange('chartOther', this.state)
    })
  }

  STYLE_SHEET = {
    refreshBtn: {
      marginTop: '10px', textAlign: 'center'
    }
  }
}

export default EchartConnect(MainChartPanel, { designTime: true })
