import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'
import Sortable from 'react-sortablejs'
import classnames from 'classnames'
import _ from 'lodash'

import Select from 'react-bootstrap-myui/lib/Select'
import DataSource from './dataSource'
import DataSourceIndicator from './dataSourceIndicator'
import ReportSelector from './ReportSelector'
import DisplayItem from './DisplayItem'
import TimedRefresh from './TimedRefresh'
import TipMixin from '@helpers/TipMixin'

import { RELEASE_WRAP, NOOP } from '../../../../constants/sortable';

import './dataSetConfig.less'

const _getDisplayItem = function (dataset, defaultDataSize) {
  return (dataset && dataset.display_item) || JSON.stringify({ top_head: defaultDataSize || '', top_tail: '' })
}

const _getRefreshRate = function (dataset) {
  return (dataset && dataset.refresh_rate) || JSON.stringify({ isOpen: false, time: 0, unit: 'second' })
}

class DataSetConfig extends React.Component {
  static propTypes = {
    isdevtools: PropTypes.bool,
    type: PropTypes.string,
    currentSource: PropTypes.string,
    echart: PropTypes.object,
    chart: PropTypes.object,
    throughChart: PropTypes.object,
    chartId: PropTypes.string,
    dashboardId: PropTypes.string,
    chartCode: PropTypes.string,
    reportSelectors: PropTypes.array,
    dataset: PropTypes.object,
    onDatasetChange: PropTypes.func
  }

  constructor(props) {
    super(props)
    const defaultDataSize = props.echart && props.echart.designer && props.echart.designer.defaultDataSize
    const { dataset } = props

    this.state = {
      id: _.get(dataset, 'chartId', ''),
      chart_code: _.get(props, 'chartCode', ''),
      source: _.get(dataset, 'source', ''),
      dims: _.get(dataset, 'dims', []),
      nums: _.get(dataset, 'nums', []),
      filters: _.get(dataset, 'filters', []),
      zaxis: _.get(dataset, 'zaxis', []),
      desires: _.get(dataset, 'desires', []),
      layers: _.get(dataset, 'layers', []),
      penetrates: _.get(dataset, 'penetrates', []),
      display_item: _getDisplayItem(dataset, defaultDataSize),
      refresh_rate: _getRefreshRate(dataset),
      default_value: _.get(dataset, 'default_value', ''),
      reportSelectors: _.get(props, 'reportSelectors', []),       //报告级筛选
      func_spread: true,
      chartType_spread: true
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps, this.props)) {
      const defaultDataSize = nextProps.echart && nextProps.echart.designer && nextProps.echart.designer.defaultDataSize
      const { dataset } = nextProps
      this.setState({
        id: _.get(dataset, 'chartId', ''),
        chart_code: _.get(nextProps, 'chartCode', ''),
        source: _.get(dataset, 'source', ''),
        dims: _.get(dataset, 'dims', []),
        nums: _.get(dataset, 'nums', []),
        filters: _.get(dataset, 'filters', []),
        zaxis: _.get(dataset, 'zaxis', []),
        desires: _.get(dataset, 'desires', []),
        layers: _.get(dataset, 'layers', []),
        penetrates: _.get(dataset, 'penetrates', []),
        display_item: _getDisplayItem(dataset, defaultDataSize),
        refresh_rate: _getRefreshRate(dataset),
        default_value: _.get(dataset, 'default_value', ''),
      })
    }
  }

  render() {
    const { echart, chartId, throughChart, type, currentSource, isdevtools, dashboardId } = this.props
    const { chart_code, source, dims, nums, filters, zaxis, desires, display_item, refresh_rate, func_spread, chartType_spread, reportSelectors } = this.state
    const sourceId = type === 'report_config' ? currentSource : source
    const onChangeSourceFunc = type === 'report_config' ? this.handleReportSelectorChange : this.handleDatasetChange
    //可以添加次轴
    const isHasZaxis = echart && echart.designer && echart.designer.hasZaxis
    const isHasDesire = echart && echart.designer && echart.designer.hasDesiredvalue

    let customCharts = []
    const customFilters = []
    const hiddenDisplayItem = echart && echart.designer && echart.designer.hiddenDisplayItem
    Object.keys(window.__CUSTOM_CHARTS).forEach((code) => {
      const customChart = window.__CUSTOM_CHARTS[code]
      if (customChart && customChart.info) {
        if (customChart.info.type === 'chart') {
          customCharts.push(customChart)
        }
        if (customChart.info.type === 'filter') {
          customFilters.push(customChart)
        }
      }
    })
    customCharts = customCharts.concat(customFilters)

    return (
      <div className="dataset-section" >
        <div className="dataset-source">
          <Sortable options={RELEASE_WRAP} onChange={NOOP} style={{ height: '100%' }}>
            <DataSource
              isdevtools={isdevtools}
              disabled={!!throughChart}
              sourceId={sourceId}
              isFieldUsed={this.isFieldUsed}
              onChangeSource={onChangeSourceFunc}
            />
          </Sortable>
        </div>

        <div className="dataset-config">
          {type === 'report_config' ? <ReportSelector
            sourceId={sourceId}
            dashboardId={dashboardId}
            reportSelectors={reportSelectors}
            onChangeIndicator={this.handleReportSelectorChange}
          /> :
            <Sortable options={RELEASE_WRAP} onChange={NOOP}>
              <DataSourceIndicator
                isdevtools={isdevtools}
                sourceId={sourceId}
                dims={dims}
                numerices={nums}
                filters={filters}
                zaxis={zaxis}
                desires={desires}
                disableFilter={!!throughChart || isdevtools}
                hasZaxis={isHasZaxis}
                hasDesire={isHasDesire}
                echart={echart}
                chartCode={chart_code}
                chartId={chartId}
                dashboardId={dashboardId}
                onChangeIndicator={this.handleDatasetChange}
              />

              {!isdevtools ? <div className="indicator-section display-item-section">
                <div className="title" onClick={this.toggleIndicatorGroup.bind(this, 'chartType_spread')}>
                  <i className={chartType_spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
                  图表类型
                </div>
                <div className={classnames('indicator-fields', { 'indicator-fields-hide': !chartType_spread })}>
                  <Select
                    value={chart_code}
                    maxHeight={160}
                    width={'100%'}
                    openSearch={false}
                    onSelected={this.handleChangeChartType.bind(this)}>
                    {customCharts && customCharts.map((chart) => {
                      const { code, name } = chart.info || {}
                      return <option key={code} value={code}>{name}</option>
                    })}
                  </Select>
                </div>
              </div> : null}

              {!isdevtools ? <div className="indicator-section display-item-section">
                <div className="title" onClick={this.toggleIndicatorGroup.bind(this, 'func_spread')}>
                  <i className={func_spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
                  功能配置
                </div>
                <div className={classnames('indicator-fields', { 'indicator-fields-hide': !func_spread })}>
                  {
                    !hiddenDisplayItem  && <DisplayItem
                    config={display_item && JSON.parse(display_item)}
                    onChangeItemNums={this.handleDatasetChange} />
                  }
                  {!throughChart ?
                    <TimedRefresh
                      config={refresh_rate && JSON.parse(refresh_rate)}
                      onChangeRefresh={this.handleDatasetChange} />
                    : null
                  }
                </div>
              </div> : null}
            </Sortable>}
        </div>
      </div >
    )
  }

  toggleIndicatorGroup(type) {
    this.setState({
      [type]: !this.state[type]
    })
  }

  //判断当前计算字段是否在使用
  isFieldUsed = (id) => {
    const { dims, nums, filters } = this.state
    const allFields = dims && dims.concat(nums).concat(filters)
    return allFields.find(field => field.id === id || field.dim === id || field.num === id || field.dataset_field_id === id)
  }

  //修改报告级筛选数据
  handleReportSelectorChange = (key, config) => {
    const { onDatasetChange } = this.props
    //报告级筛选数据集变化
    onDatasetChange && onDatasetChange(key, config)
  }

  // 校验指标规则
  checkIndicatorRules(indicatorRules) {
    const { dims, nums } = this.state
    const dimLen = dims.length
    const numLen = nums.length

    let hitRule = true
    if (indicatorRules) {
      for (let i = 0; i < indicatorRules.length; i++) {
        const rule = indicatorRules[i]
        const { dim, value } = rule

        let flag = true

        // 数量限制
        if (flag && dim.min !== undefined) {
          flag = dimLen >= dim.min
        }

        if (flag && dim.max !== undefined) {
          flag = dimLen <= dim.max
        }

        if (flag && value.min !== undefined) {
          flag = numLen >= value.min
        }

        if (flag && value.max !== undefined) {
          flag = numLen <= value.max
        }

        // 维度类型限制
        if (flag && dim.field_type) {
          if (Array.isArray(dim.field_type)) {
            flag = dims.every(_dim => dim.field_type.indexOf(_dim.data_type) > -1)
          } else {
            flag = dims.every(_dim => _dim.data_type === dim.field_type)
          }
        }

        //维度日期类型字段模式限制
        const dateFields = dims.filter(field => field.data_type === '日期')
        if (flag && dim.datefield_formula_mode && Array.isArray(dim.datefield_formula_mode)) {
          flag = dateFields.every(_dim => dim.datefield_formula_mode.indexOf(_dim.formula_mode) > -1)
        }

        hitRule = flag
        if (!flag) {
          continue
        } else {
          break
        }
      }
    }

    return hitRule
  }

  handleChangeChartType(option) {
    const { chart, throughChart } = this.props
    const { layers, zaxis, desires } = this.state
    const customchart = window.__CUSTOM_CHARTS[option.value]
    const { indicatorRules, indicatorDescription, penetrable, hasZaxis, hasDesiredvalue } = (customchart && customchart.designer) || {}

    if (layers && layers.length > 1 && ((chart && !throughChart) || (throughChart && throughChart.through_index < layers.length - 1)) && !penetrable) {
      this.showErr('无法切换,该图表不支持穿透功能')
      this.setState(prevState => ({
        chart_code: prevState.chart_code
      }))
    } else if (!this.checkIndicatorRules(indicatorRules)) {
      this.showErr(`无法切换,需满足${indicatorDescription}`)
      this.setState(prevState => ({
        chart_code: prevState.chart_code
      }))
    } else if (zaxis && zaxis.length > 0 && !hasZaxis) {
      this.showErr('无法切换,该图表类型不支持次轴功能,请删除次轴字段后再切换')
      this.setState(prevState => ({
        chart_code: prevState.chart_code
      }))
    } else if (desires && desires.length > 0 && !hasDesiredvalue) {
      this.showErr('无法切换,该图表类型不支持目标值功能,请删除目标值字段后再切换')
      this.setState(prevState => ({
        chart_code: prevState.chart_code
      }))
    } else {
      this.setState({
        chart_code: option.value
      }, () => {
        this.handleDatasetChange('chart_code', this.state.chart_code)
      })
    }
  }

  // 修改数据集配置
  handleDatasetChange = (key, config) => {
    const { echart, chartId, chart, throughChart, onDatasetChange } = this.props
    const defaultDataSize = echart && echart.designer && echart.designer.defaultDataSize

    let keys = {}
    if (typeof key === 'object') {
      keys = { ...key }
      if (keys.numerices) {
        keys.nums = keys.numerices
      }
    } else if (typeof key === 'string') {
      if (key === 'numerices') key = 'nums'
      if (key === 'source') {
        keys = {
          [key]: config,
          dims: [],
          nums: [],
          filters: [],
          desires: [],
          zaxis: [],
          display_item: JSON.stringify({ top_head: defaultDataSize || '', top_tail: '' })
        }
      } else {
        keys[key] = config
      }
    }

    // 为坑爹的后台组织数据，添加属性dim和num
    keys.dims && keys.dims.forEach((field, index) => {
      field.rank = index
      if (field.dim === undefined) {
        field.dim = field.id
      }
    })

    keys.nums && keys.nums.forEach((field, index) => {
      field.rank = index
      if (field.num === undefined) {
        field.num = field.id || field.dim
      }
    })
    keys.zaxis && keys.zaxis.forEach((field, index) => {
      field.rank = index
      if (field.num === undefined) {
        field.num = field.id || field.dim
      }
    })
    keys.desires && keys.desires.forEach((field, index) => {
      field.rank = index
      if (field.dataset_field_id === undefined) {
        field.dataset_field_id = field.id || field.num || field.dim
      }
    })
    this.setState({
      ...keys
    }, () => {
      // 指标规则限制
      const { indicatorRules, indicatorDescription } = (echart && echart.designer) || {}
      if (this.checkIndicatorRules(indicatorRules)) {
        const datasetConfig = {
          ..._.cloneDeep(this.state),
          ...keys
        }

        if (datasetConfig.tipOptions) {
          delete datasetConfig.tipOptions
        }

        const { ...dataSet } = datasetConfig
        if (dataSet) {
          delete dataSet.chartType_spread
          delete dataSet.func_spread
          delete dataSet.reportSelectors
        }
        // 如果有穿透但是数据集源ID修改的话，则删除穿透
        if (!throughChart && chart && dataSet.layers && dataSet.layers.length > 0 && chart.source !== dataSet.source) {
          delete dataSet.layers
          delete dataSet.penetrates
        }

        // 如果当前是穿透子级且有维度，layers存在null值时，修正
        if (throughChart && dataSet.dims && dataSet.dims.length > 0 && dataSet.layers && dataSet.layers[throughChart.through_index] === null) {
          dataSet.layers[throughChart.through_index] = dataSet.dims[0]
          dataSet.layers[throughChart.through_index].rank = throughChart.through_index
        }

        onDatasetChange && onDatasetChange({
          throughChart,
          chart,
          dataSet,
          chart_id: chartId,
        }, ((throughChart && throughChart.through_index) || 0))
      } else if (key !== 'source') {
        this.showErr(`配置异常，该图表支持 (${indicatorDescription})`)
      }
    })
  }

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }
}


reactMixin.onClass(DataSetConfig, TipMixin)

export default DataSetConfig
