import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'
import Sortable from 'react-sortablejs'
import classnames from 'classnames'
import _ from 'lodash'
import uniqueId from 'lodash/uniqueId'

import CustomDropDown from '../CustomDropDown'
import AliasNameDialog from '../AliasNameDialog'
import FormatConfigDialog from '../FormatConfigDialog'
import UrlSettingDialog from '../UrlSettingDialog'
import ChartFilterDialog from '../ChartFilterDialog'
import generateDisplayFormat, { generateUrlSetting } from '../../utils/generateDisplayFormat'
import { convertFolderTree } from '../../utils/treeDataHelper'
import { ZAXIS_CHART_TYPE } from '../../constants/incOption'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail'
import { actions as dataViewListActionCreators } from '@store/modules/dataview/list';
import TipMixin from '@helpers/TipMixin'

import expressionHasAggregateOperator from '@helpers/expressionHasAggregateOperator'

import { CONTAINER_WRAP, RELEASE_WRAP, NOOP } from '../../../../constants/sortable'

// 为坑爹的后台转换dim为id属性
const addIdProp = (arr, tag) => arr.map(item => ({ ...item, id: item[tag] }))

const indicator_groups = [
  {
    name: '维度',
    code: 'dims',
    spread: true
  },
  {
    name: '数值',
    code: 'numerices',
    spread: true
  }
]
const _findZaxisChart = (code) => {
  const chart = _.find(ZAXIS_CHART_TYPE, item => item.code === code)
  return chart
}
class DataSourceIndicator extends React.Component {
  static propTypes = {
    sourceId: PropTypes.string,
    dims: PropTypes.array,
    numerices: PropTypes.array,
    filters: PropTypes.array,
    zaxis: PropTypes.array,
    desires: PropTypes.array,
    dataFeildList: PropTypes.object,
    filterOptions: PropTypes.object,
    echart: PropTypes.object,
    chartId: PropTypes.string,
    chartCode: PropTypes.string,
    disableFilter: PropTypes.bool,
    hasZaxis: PropTypes.bool,     //2018-02-28 是否可以添加次轴
    hasDesire: PropTypes.bool,    //2018-02-28 是否可以添加目标值
    onChangeIndicator: PropTypes.func,
    dashboardId: PropTypes.string
  }

  constructor(props) {
    super(props)

    const indicatorGroups = indicator_groups.concat()
    if (!props.disableFilter) {
      indicatorGroups.push({
        name: '筛选器',
        code: 'filters',
        spread: true
      })
    }
    //获取次轴图表类型
    const zaxisCode = props.zaxis && props.zaxis.length > 0 ? props.zaxis[0].chart_code : 'line'
    const chart = _findZaxisChart(zaxisCode)
    this.state = {
      indicator_groups: indicatorGroups,
      indicators: {
        dims: addIdProp(props.dims, 'dim') || [],            //度量
        numerices: addIdProp(props.numerices, 'num') || [],  //数值
        filters: props.filters,       //筛选器,
        zaxis: props.zaxis,
        desires: props.desires
      },
      zaxis_indicator: {
        name: '数值',
        code: 'zaxis',
        chartType: chart || {
          rule: [{
            value: {
              min: '1'
            }
          }],
          code: zaxisCode,
          icon: 'C220',
          description: '折线图(1个或多个数值)'
        },  //次轴图表类型
        spread: true,
        show: props.zaxis && props.zaxis.length > 0
      },
      showDropdown: false,
      desire_indicator: {
        name: '数值',
        code: 'desires',
        spread: true,
        show: false
      },
      alias_dialog: {   // 别名窗口
        show: false,
        type: '',
        active: ''
      },
      formatConfigDialog: {
        show: false,
        type: '',
        active: ''
      },
      urlSettingDialog: {
        show: false,
        type: '',
        active: ''
      },
      through_active: -1
    }
  }

  componentDidMount() {
    this.preLoadFilterOptions()
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.disableFilter, this.props.disableFilter)) {
      const indicatorGroups = indicator_groups.concat()

      if (!nextProps.disableFilter) {
        indicatorGroups.push({
          name: '筛选器',
          code: 'filters',
          spread: true
        })
      }

      this.setState({
        indicator_groups: indicatorGroups
      })
    }

    // 如果报告列表tree发生了变化
    //修改高级计算字段时，更新已选字段
    const { dataFeildList, sourceId } = this.props
    if (sourceId && nextProps.sourceId === sourceId && dataFeildList && nextProps.dataFeildList && !_.isEqual(nextProps.dataFeildList[sourceId], dataFeildList[sourceId])) {
      const indicators = {}
      Object.keys(this.state.indicators).forEach((indicator) => {
        indicators[indicator] = this.state.indicators[indicator].map(field => ({
          ...field,
          ...this._findFieldDataById(field.dataset_field_id, null, nextProps)
        }))
      })
      this.setState({
        indicators: {
          ...indicators
        }
      })
    }

    if (!_.isEqual(nextProps.dims, this.props.dims)) {
      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          dims: addIdProp(nextProps.dims, 'dim')
        }
      }))
    }

    if (!_.isEqual(nextProps.numerices, this.props.numerices)) {
      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          numerices: addIdProp(nextProps.numerices, 'num')
        }
      }))
    }

    if (!_.isEqual(nextProps.filters, this.props.filters)) {
      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          filters: nextProps.filters
        }
      }), () => {
        this.preLoadFilterOptions()
      })
    }

    if (!_.isEqual(nextProps.zaxis, this.props.zaxis)) {
      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          zaxis: addIdProp(nextProps.zaxis, 'num')
        }
      }))
    }

    if (!_.isEqual(nextProps.desires, this.props.desires)) {
      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          desires: addIdProp(nextProps.desires, 'dataset_field_id')
        },
        zaxis_indicator: {
          ...prevState.zaxis_indicator,
          show: nextProps.zaxis && nextProps.zaxis.length > 0
        }
      }))
    }
  }

  render() {
    const { filterOptions, echart, chartCode, chartId, diagramDatasets, isdevtools, hasZaxis, hasDesire } = this.props
    const { indicator_groups, indicators, zaxis_indicator, desire_indicator, alias_dialog, formatConfigDialog, urlSettingDialog, through_active } = this.state
    const diagramDataset = diagramDatasets && diagramDatasets[chartId]
    // 指标规则
    let disable = {}
    const indicatorRules = echart && echart.designer && echart.designer.indicatorRules
    if (indicatorRules) {
      disable = {
        dims: !indicatorRules.find(rule => (rule.value && rule.dim.min !== 'undefined' && rule.dim.max !== 0)),
        numerices: !indicatorRules.find(rule => (rule.value && rule.value.min !== 'undefined' && rule.value.max !== 0)),
        zaxis: false
      }
    }
    const sortableOptions = indicator => ({
      ...CONTAINER_WRAP,
      group: {
        ...CONTAINER_WRAP.group,
        put: !disable[indicator.code],
        pull: !disable[indicator.code]
      },
      filter: '.addfield-tips',   // 过滤排序元素
      onAdd: this.handleFieldAdd.bind(this, indicator),
      onStart: this.handleFieldSort.bind(this, 'start', indicator),
      onMove: this.handleFieldSort.bind(this, 'move', indicator),
      onEnd: this.handleFieldSort.bind(this, 'end', indicator)
    })

    const filterSortableOptions = indicator => ({
      ...RELEASE_WRAP,
      filter: '.addfield-tips',   // 过滤排序元素
      onAdd: this.handleAddFilter.bind(this, indicator)
    })
    return (
      <div className="datafieldfilter-wrap">
        {
          indicator_groups.map((indicator, index) => (
            (indicator.name === '维度' || indicator.name === '数值') && <div className="indicator-section" key={index}>
              <div className="title" onClick={this.toggleIndicatorGroup.bind(this, index)}>
                <i className={indicator.spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
                {indicator.name}
                {indicator.name === '数值' && hasZaxis && !zaxis_indicator.show && <span className="indicator-zaxis" onClick={this.addZaxis.bind(this)}>添加次轴</span>}
              </div>
              <div className={classnames('indicator-fields', { 'indicator-fields-hide': !indicator.spread })} data-indicator={indicator.code}>
                <Sortable options={sortableOptions(indicator)} onChange={NOOP}>
                  {
                    indicators[indicator.code] && indicators[indicator.code].map((field, fieldIndex) => {
                      const { layers } = (diagramDataset && diagramDataset.dataSet) || {}
                      const indicatorOnly = indicator.name === '维度' && layers && layers.length > 0
                      const locked = fieldIndex === 0 && indicatorOnly

                      return (
                        <div className="field-wrap" key={field.id}>
                          <CustomDropDown
                            isdevtools={isdevtools}
                            layout="vertical"
                            style={{ opacity: 0 }}
                            group={indicator.name}
                            code={indicator.code}
                            data={field}
                            active={through_active}
                            locked={locked}
                            data-id={field.id}
                            chartId={chartId}
                            type={chartCode}
                            key={uniqueId()}
                            serial={fieldIndex}
                            hasUrlSettings={(echart && echart.designer && echart.designer.hasUrlSetting) || false}
                            hasNumsUrlsettings={(echart && echart.designer && echart.designer.hasNumsUrlsetting) || false}
                            sortable={(echart && echart.designer && echart.designer.sortable) || false}
                            onSelect={this.handleSelectDropItem.bind(this, indicator, fieldIndex)}
                            onRemove={this.handleRemove.bind(this, indicator)}
                            onSort={this.handleChangeSort.bind(this, indicator)}
                            onSearch={this.handleSearchDimValues.bind(this)} />
                        </div>
                      )
                    })
                  }
                  <div className={classnames('addfield-tips', {
                    'addfield-tips-disable': disable && disable[indicator.code]
                  })}>
                    拖入{indicator.name}字段
                  </div>
                </Sortable>
              </div>
            </div>
          ))
        }
        {
          zaxis_indicator && zaxis_indicator.show && <div className="indicator-section">
            <div className="title" onClick={this.toggleZaxisGroup.bind(this, 'zaxis')}>
              <div style={{ position: 'absolute', top: '-8px', left: '12px' }}>
                <div className="indicator-dropdown" id="indicator-dropdown">
                  <div className="indicator-dropdown-value" onClick={this.handleDropdown.bind(this)} style={{ background: this.state.showDropdown ? '#1A2646' : 'transparent' }}>
                    <span title={zaxis_indicator.chartType.description}><i className={`chart-type-icon ${zaxis_indicator.chartType.icon}`} /></span>
                  </div>
                  <div className="indicator-dropdown-list" style={{ display: this.state.showDropdown ? 'block' : 'none' }}>
                    <ul>
                      {
                        ZAXIS_CHART_TYPE.map((item, i) => {
                          const isActive = classnames({
                            active: zaxis_indicator.chartType.code === item.code
                          })
                          return (
                            <li key={`zaxis-${i}`} className={isActive} onClick={this.handleChartType.bind(this, item)}>
                              <span title={item.description}><i className={`chart-type-icon ${item.icon}`} /></span>
                            </li>
                          )
                        })
                      }
                    </ul>
                  </div>
                </div>
              </div>
              <i className={zaxis_indicator.spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
              <span style={{ marginLeft: '32px' }}>{zaxis_indicator.name}</span>
              {hasZaxis && <span className="indicator-zaxis" onClick={this.delZaxis.bind(this)}>删除次轴</span>}
            </div>
            <div className={classnames('indicator-fields', { 'indicator-fields-hide': !zaxis_indicator.spread })} data-indicator={zaxis_indicator.code}>
              <Sortable options={sortableOptions(zaxis_indicator)} onChange={NOOP}>
                {
                  indicators[zaxis_indicator.code] && indicators[zaxis_indicator.code].map((field, fieldIndex) => (
                    <div className="field-wrap" key={`zaxis_${field.id}`}>
                      <CustomDropDown
                        isdevtools={isdevtools}
                        layout="vertical"
                        style={{ opacity: 0 }}
                        group={zaxis_indicator.name}
                        data={field}
                        active={through_active}
                        locked={false}
                        data-id={field.id}
                        chartId={chartId}
                        type={chartCode}
                        key={uniqueId()}
                        serial={fieldIndex}
                        sortable={(echart && echart.designer && echart.designer.sortable) || false}
                        onSelect={this.handleSelectDropItem.bind(this, zaxis_indicator, fieldIndex)}
                        onRemove={this.handleRemove.bind(this, zaxis_indicator)}
                        onSort={this.handleChangeSort.bind(this, zaxis_indicator)}
                        onSearch={this.handleSearchDimValues.bind(this)} />
                    </div>
                  ))
                }
                <div className={classnames('addfield-tips', {
                  'addfield-tips-disable': false
                })}>
                  拖入数值字段
                </div>
              </Sortable>
            </div>
          </div>
        }
        {
          hasDesire && <div className="indicator-section">
            <div className="title" onClick={this.toggleZaxisGroup.bind(this, 'desires')}>
              <i className={desire_indicator.spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
              目标值
            </div>
            <div className={classnames('indicator-fields', { 'indicator-fields-hide': !desire_indicator.spread })} data-indicator={desire_indicator.code}>
              <Sortable options={sortableOptions(desire_indicator)} onChange={NOOP}>
                {
                  indicators[desire_indicator.code] && indicators[desire_indicator.code].map((field, fieldIndex) => (
                    <div className="field-wrap" key={field.id}>
                      <CustomDropDown
                        isdevtools={isdevtools}
                        layout="vertical"
                        style={{ opacity: 0 }}
                        group={desire_indicator.name}
                        code={desire_indicator.code}
                        data={field}
                        active={through_active}
                        locked={false}
                        data-id={field.id}
                        chartId={chartId}
                        type={chartCode}
                        key={uniqueId()}
                        serial={fieldIndex}
                        sortable={(echart && echart.designer && echart.designer.sortable)}
                        onSelect={this.handleSelectDropItem.bind(this, desire_indicator, fieldIndex)}
                        onRemove={this.handleRemove.bind(this, desire_indicator)}
                        onSort={this.handleChangeSort.bind(this, desire_indicator)}
                        onSearch={this.handleSearchDimValues.bind(this)} />
                    </div>
                  ))
                }
                <div className={classnames('addfield-tips', {
                  'addfield-tips-disable': false
                })}>
                  拖入数值字段
                </div>
              </Sortable>
            </div>
          </div>
        }
        {
          indicator_groups.map((indicator, index) => (
            indicator.name === '筛选器' && <div className="indicator-section" key={index}>
              <div className="title" onClick={this.toggleIndicatorGroup.bind(this, index)}>
                <i className={indicator.spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
                {indicator.name}
                {indicator.name === '数值' && hasZaxis && <span className="indicator-zaxis" onClick={this.addZaxis.bind(this)}>{indicators.zaxis.length === 0 ? '添加次轴' : ''}</span>}
              </div>
              <div className={classnames('indicator-fields', { 'indicator-fields-hide': !indicator.spread })} data-indicator={indicator.code}>
                <Sortable options={filterSortableOptions(indicator)} onChange={NOOP} disabled={true}>
                  {
                    indicators[indicator.code] && indicators[indicator.code].map((field, fieldIndex) => {
                      const { operator, col_value, data_type } = field
                      let colValue = []
                      if (['in', 'not in', 'between'].indexOf(operator) > -1) {
                        colValue = col_value ? JSON.parse(col_value) : []
                      } else {
                        // 比如本周, 本月, 今年等等都是数字
                        if (typeof col_value === 'number') {
                          colValue[0] = col_value
                        } else {
                          colValue = col_value ? col_value.split(',') : []
                        }
                      }

                      //枚举、字符串做特殊空处理
                      const isStr = data_type === '枚举' || data_type === '字符串'
                      if (colValue.length > 0 && isStr) {
                        colValue = colValue.map((v) => {
                          if (v === '') {
                            v = '(空)'
                          }
                          return v
                        })
                      }

                      return (
                        <div className="field-wrap" key={fieldIndex}>
                          <ChartFilterDialog
                            type={field.data_type}
                            alias={field.alias_name}
                            operator={field.operator}
                            colValue={colValue}
                            colName={field.col_name}
                            filterOptions={filterOptions[field.dataset_field_id]}
                            show={field.show}
                            mode={field.mode}
                            onSave={this.handleSaveFilter.bind(this)}
                            onClose={this.handleCloseFilter.bind(this)}
                            onDel={this.handleDelFilter.bind(this)}
                          />
                        </div>
                      )
                    })
                  }
                  <div className="addfield-tips">
                    拖入{indicator.name}字段
                  </div>
                </Sortable>
              </div>
            </div>
          ))
        }
        {
          alias_dialog.show && (
            <AliasNameDialog
              show={alias_dialog.show}
              info={indicators[alias_dialog.type][alias_dialog.active]}
              onSure={this.handleSureDialog.bind(this, 'alias')}
              onClose={this.handleCloseDialog.bind(this, 'alias')}
            />
          )
        }
        {
          formatConfigDialog.show && <FormatConfigDialog
            show={formatConfigDialog.show}
            chart_code={chartCode}
            configItem={indicators[formatConfigDialog.type][formatConfigDialog.active]}
            onSure={this.handleSureDialog.bind(this, 'formatConfig')}
            onClose={this.handleCloseDialog.bind(this, 'formatConfig')}
          />
        }
        {
          urlSettingDialog.show && <UrlSettingDialog
            show={urlSettingDialog.show}
            chart_code={chartCode}
            configItem={indicators[urlSettingDialog.type][urlSettingDialog.active]}
            configType={urlSettingDialog.type}
            configDims={indicators.dims}
            loadReportFilters={this.loadReportFilters.bind(this)}
            onSure={this.handleSureDialog.bind(this, 'urlSettingConfig')}
            onClose={this.handleCloseDialog.bind(this, 'urlSettingConfig')}
            getReportList={this._fetchReportList.bind(this)}
            showErr={this.showErr.bind(this)}
          />
        }
      </div>
    )
  }

  //控制
  handleDropdown(e) {
    e.stopPropagation()
    this.setState(prevState => ({
      showDropdown: !prevState.showDropdown
    }))
  }
  //
  handleChartType(chart, e) {
    e.stopPropagation()
    const { zaxis } = this.state.indicators
    //chart_code赋值
    zaxis.forEach((item) => {
      item.chart_code = chart.code
    })
    this.setState(prevState => ({
      showDropdown: false,
      zaxis_indicator: {
        ...prevState.zaxis_indicator,
        chartType: chart
      },
      indicators: {
        ...prevState.indicators,
        zaxis
      }
    }), () => {
      this.props.onChangeIndicator('zaxis', this.state.indicators.zaxis)
    })
  }

  //显示目标值设置项
  handleShowDesire() {
    this.setState(prevState => ({
      desire_indicator: {
        ...prevState.desire_indicator,
        show: !prevState.desire_indicator.show
      }
    }))
  }
  // 添加次轴
  addZaxis(e) {
    e.stopPropagation()
    this.setState(prevState => ({
      zaxis_indicator: {
        ...prevState.zaxis_indicator,
        show: true
      }
    }))
  }

  //删除次轴
  delZaxis(e) {
    e.stopPropagation()
    this.setState(prevState => ({
      indicators: {
        ...prevState.indicators,
        zaxis: []
      },
      zaxis_indicator: {
        ...prevState.zaxis_indicator,
        show: false
      }
    }), () => {
      this.props.onChangeIndicator('zaxis', this.state.indicators.zaxis)
    })
  }
  // 预加载filterOptions
  preLoadFilterOptions() {
    const { filterOptions, actions } = this.props
    const { indicators } = this.state
    indicators.filters && indicators.filters.forEach((filter) => {
      const isStr = (filter.data_type === '枚举' || filter.data_type === '字符串')
      if (isStr && (!filterOptions || (filterOptions && !filterOptions[filter.dataset_field_id]))) {
        actions.fetchFilterOptions({
          chart_id: filter.dashboard_chart_id,
          dataset_field_id: filter.dataset_field_id,
          dataset_id: filter.dataset_id
        })
      }
    })
  }

  //加载报告筛选条件
  loadReportFilters(id, callback) {
    //id为dashboard_id
    this.props.actions.getReportFilter({ dashboard_id: id }, (json) => {
      if (json.result) {
        callback(json.data)
      } else {
        this.showErr(json.msg)
      }
    })
  }

  // 显示/隐藏指标区域
  toggleIndicatorGroup(index) {
    const { indicator_groups } = this.state
    const indicatorGroups = indicator_groups.concat()
    indicatorGroups[index].spread = !indicatorGroups[index].spread
    this.setState({
      indicator_groups: indicatorGroups
    })
  }
  toggleZaxisGroup(field) {
    if (field === 'zaxis') {
      this.setState(prevState => ({
        zaxis_indicator: {
          ...prevState.zaxis_indicator,
          spread: !prevState.zaxis_indicator.spread
        }
      }))
    } else if (field === 'desires') {
      this.setState(prevState => ({
        desire_indicator: {
          ...prevState.desire_indicator,
          spread: !prevState.desire_indicator.spread
        }
      }))
    }
  }

  // 拖拽-添加字段
  handleFieldAdd(indicator, e) {
    const { indicators } = this.state
    const fieldId = e.clone.dataset.id
    const field = this._findFieldDataById(fieldId, indicator)
    if (!field) return
    // 目标值只能有一个数值字段
    if (indicator.code === 'desires' && indicators[indicator.code].length > 0) {
      this.showErr('目标值字段唯一')
      return
    }
    // 计算字段中如果含有高级字段，不能拖放到维度区域
    if (field.type === '计算高级' && (indicator.name === '维度' || indicator.name === '图层') && expressionHasAggregateOperator(JSON.parse(field.expression))) {
      return this.showErr(`含有聚合函数的高级计算字段不能拖动到${indicator.name}上`)
    }

    const indicatorFields = this.state.indicators[indicator.code]
    let isExist = indicatorFields.find(f => f.id === fieldId)
    //次轴和数值类型
    if (indicator.code === 'zaxis' && !isExist) {
      isExist = this.state.indicators.numerices.find((f => f.id === fieldId))
    }
    if (indicator.code === 'numerices' && !isExist) {
      isExist = this.state.indicators.zaxis.find((f => f.id === fieldId))
    }
    if (isExist) {
      return this.showErr('该字段已经被选择')
    }

    // 穿透图层中是否存在该维度
    const { diagramDatasets, chartId } = this.props
    const diagramDataset = diagramDatasets && diagramDatasets[chartId]
    const { layers } = diagramDataset && diagramDataset.dataSet || []
    const isLayerExist = !!(layers && layers.find(layer => layer && layer.dim === field.id))
    if (indicator.code === 'dims' && indicatorFields && indicatorFields.length == 0 && isLayerExist) {
      return this.showErr('不能重复使用该维度进行穿透')
    }

    const newIndicatorFields = indicatorFields.concat()
    newIndicatorFields.push(Object.assign(field, {
      formula_mode: '',
      display_format: generateDisplayFormat(),
      chart_code: indicator.code === 'zaxis' ? this.state.zaxis_indicator.chartType.code : ''
    }))

    this.setState(prevState => ({
      indicators: {
        ...prevState.indicators,
        [indicator.code]: newIndicatorFields
      }
    }), () => {
      this.props.onChangeIndicator(indicator.code, this.state.indicators[indicator.code])
    })
  }

  // 拖拽-排序字段
  handleFieldSort(mode, indicator, evt) {
    const { chartId, diagramDatasets } = this.props
    switch (mode) {
      case 'start': {
        this.SORT_SOURCE_GROUP = indicator.code
        this.SORT_TARGET_GROUP = ''
        break;
      }
      case 'move': {
        const indicatorWrap = evt.to && evt.to.parentNode
        if (indicatorWrap && indicatorWrap.className === 'indicator-fields') {
          this.SORT_TARGET_GROUP = indicatorWrap && indicatorWrap.dataset && indicatorWrap.dataset.indicator
        } else {
          this.SORT_TARGET_GROUP = ''
        }
        break;
      }
      case 'end': {
        const { newIndex, oldIndex } = evt
        const diagramDataset = diagramDatasets && diagramDatasets[chartId]
        const { layers } = (diagramDataset && diagramDataset.dataSet) || {}

        if (this.SORT_SOURCE_GROUP === this.SORT_TARGET_GROUP) {
          const clone_data = this.state.indicators[this.SORT_SOURCE_GROUP].slice()
          const newIndicatorFields = this.state.indicators[this.SORT_SOURCE_GROUP].concat()
          const len = newIndicatorFields.length
          const throughDimLocked = layers && layers.length > 0 && this.SORT_TARGET_GROUP === 'dims' && oldIndex * newIndex === 0
          if (oldIndex === newIndex || newIndex >= len || throughDimLocked) {
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            return false;
          }

          newIndicatorFields[newIndex] = clone_data[oldIndex]   // 交换位置
          newIndicatorFields[oldIndex] = clone_data[newIndex]

          const code = this.SORT_SOURCE_GROUP
          this.setState(prevState => ({
            indicators: {
              ...prevState.indicators,
              [code]: newIndicatorFields
            }
          }), () => {
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            this.props.onChangeIndicator(indicator.code, this.state.indicators[indicator.code])
          })
        } else {
          // 不能拖入到筛选器中
          const visiableThrough = layers && layers.length > 0
          const case1 = visiableThrough && this.SORT_TARGET_GROUP === 'dims' && !!this.SORT_SOURCE_GROUP && newIndex === 0
          const case2 = visiableThrough && this.SORT_SOURCE_GROUP === 'dims' && !!this.SORT_TARGET_GROUP && oldIndex === 0
          const case3 = visiableThrough && this.SORT_SOURCE_GROUP === 'dims' && !this.SORT_TARGET_GROUP && oldIndex === 0
          const throughDimLocked = case1 || case2 || case3
          if ((this.SORT_TARGET_GROUP === 'filters' && !!this.SORT_SOURCE_GROUP) || throughDimLocked) {
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            return false
          }

          const oldField = this.state.indicators[this.SORT_SOURCE_GROUP][oldIndex]
          const isNumeral = oldField && this.SORT_TARGET_GROUP === 'dims' && oldField.type === '计算高级' //是否是高级计算并且是 数值拖动到维度
          let isExist = oldField && !!this.SORT_TARGET_GROUP &&
            this.state.indicators[this.SORT_TARGET_GROUP].find(field => field.id === oldField.id) &&
            this.state.indicators[this.SORT_SOURCE_GROUP].length > oldIndex

          if (isNumeral && expressionHasAggregateOperator(JSON.parse(oldField.expression))) {
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            return this.showErr('含有聚合函数的高级计算字段不能拖动到维度上')
          }
          // 次轴和number
          if (this.SORT_SOURCE_GROUP === 'desires' && (this.SORT_TARGET_GROUP === 'zaxis' || this.SORT_TARGET_GROUP === 'numerices')) {
            //只要2个满足一个就不能拖
            isExist = this.state.indicators.zaxis.find(field => field.id === oldField.id) ||
              this.state.indicators.numerices.find(field => field.id === oldField.id)
          }
          // 目标值唯一
          if (this.SORT_TARGET_GROUP === 'desires') {
            if (this.state.indicators.desires.length > 0) {
              return this.showErr('目标值字段唯一')
            }
          }
          if (isExist) {
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            return this.showErr('重复字段!')
          }

          const sourceIndicatorFields = this.state.indicators[this.SORT_SOURCE_GROUP].concat()
          sourceIndicatorFields.splice(oldIndex, 1)

          let targetIndicatorFields
          if (!!this.SORT_TARGET_GROUP && this.state.indicators[this.SORT_TARGET_GROUP]) {
            const newField = oldField
            targetIndicatorFields = this.state.indicators[this.SORT_TARGET_GROUP].concat()
            const _isExist = targetIndicatorFields.find(_item => _item.id === newField.id)

            newField.formula_mode = ''
            newField.sort = null
            if (newField.content) {
              newField.content.sort = null
            }
            // 设置次轴chart_code
            if (this.SORT_TARGET_GROUP === 'zaxis') {
              newField.chart_code = this.state.zaxis_indicator.chartType.code
            } else {
              newField.chart_code = ''
            }
            if (!_isExist && newField) {
              targetIndicatorFields.splice(newIndex, 0, newField)
            }
          }

          const sourceCode = this.SORT_SOURCE_GROUP
          const targetCode = this.SORT_TARGET_GROUP

          this.setState((prevState) => {
            const indicators = {
              ...prevState.indicators,
              [sourceCode]: sourceIndicatorFields,
            }
            if (targetCode) {
              indicators[targetCode] = targetIndicatorFields
            }
            return {
              indicators
            }
          }, () => {
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            this.props.onChangeIndicator(this.state.indicators)
          })
        }
        break;
      }
      default:
        this.SORT_SOURCE_GROUP = ''
        this.SORT_TARGET_GROUP = ''
        break;
    }
  }

  // 点击字段
  handleSelectDropItem(indicator, index, formula_mode) {
    if (formula_mode === '别名') {
      const indicatorFields = this.state.indicators[indicator.code]
      const newIndicatorFields = indicatorFields.concat()

      const currField = newIndicatorFields[index]
      newIndicatorFields[index].alias = currField.alias || currField.alias_name || currField.col_name

      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          [indicator.code]: newIndicatorFields
        },
        alias_dialog: {
          show: true,
          type: indicator.code,
          active: index
        }
      }))
    } else if (formula_mode === '数值显示格式') {
      this.setState(prevState => ({
        formatConfigDialog: {
          ...prevState.formatConfigDialog,
          type: indicator.code,
          active: index,
          show: true
        }
      }))
    } else if (formula_mode === '跳转设置') {
      this.setState(prevState => ({
        urlSettingDialog: {
          ...prevState.urlSettingDialog,
          type: indicator.code,
          active: index,
          show: true
        }
      }))
    } else {
      if (formula_mode === '删除') return;
      const indicatorFields = this.state.indicators[indicator.code]
      const newIndicatorFields = indicatorFields.concat()
      const currField = newIndicatorFields[index]
      if (currField) {
        newIndicatorFields[index].formula_mode = formula_mode || (formula_mode === null ? null : '')
        this.setState(prevState => ({
          indicators: {
            ...prevState.indicators,
            [indicator.code]: newIndicatorFields
          }
        }), () => {
          this.props.onChangeIndicator(indicator.code, this.state.indicators[indicator.code])
        })
      }
    }
  }

  // 删除字段
  handleRemove(indicator, name, index) {
    const indicatorFields = this.state.indicators[indicator.code]
    const newIndicatorFields = indicatorFields.concat()
    newIndicatorFields.splice(index, 1)

    this.setState(prevState => ({
      indicators: {
        ...prevState.indicators,
        [indicator.code]: newIndicatorFields
      }
    }), () => {
      this.props.onChangeIndicator(indicator.code, this.state.indicators[indicator.code])
    })
  }

  // 设置字段排序方式
  handleChangeSort(indicator, name, index, sort) {
    const newDimsFields = this.state.indicators.dims.concat()
    const newNumericesFields = this.state.indicators.numerices.concat()
    const newZaxisFields = this.state.indicators.zaxis.concat()
    const newDesireFields = this.state.indicators.desires.concat()
    //保证只有一个排序
    if (indicator.code === 'numerices') {
      const currField = newNumericesFields[index]
      currField.sort = sort || ''
      newNumericesFields.forEach((item, i) => {
        if (i !== index) {
          item.sort = null
        }
      })

      newDimsFields.forEach((item) => {
        item.sort = null
        if (item.content) {
          item.content.sort = null
        }
      })
      newZaxisFields.forEach((item) => {
        item.sort = null
      })
      newDesireFields.forEach((item) => {
        item.sort = null
      })
    } else if (indicator.code === 'zaxis') {
      const currField = newZaxisFields[index]
      currField.sort = sort || ''
      newZaxisFields.forEach((item, i) => {
        if (i !== index) {
          item.sort = null
        }
      })

      newDimsFields.forEach((item) => {
        item.sort = null
        if (item.content) {
          item.content.sort = null
        }
      })
      newNumericesFields.forEach((item) => {
        item.sort = null
      })
      newDesireFields.forEach((item) => {
        item.sort = null
      })
    } else if (indicator.code === 'desires') {
      const currField = newDesireFields[index]
      currField.sort = sort || ''
      newDesireFields.forEach((item, i) => {
        if (i !== index) {
          item.sort = null
        }
      })

      newDimsFields.forEach((item) => {
        item.sort = null
        if (item.content) {
          item.content.sort = null
        }
      })
      newNumericesFields.forEach((item) => {
        item.sort = null
      })
      newZaxisFields.forEach((item) => {
        item.sort = null
      })
    } else if (indicator.code === 'dims') {
      const currField = newDimsFields[index]

      //赋值
      if (Array.isArray(sort)) {
        currField.sort = 'CUSTOM'
        if (currField.content) {
          currField.content.sort = sort
        } else {
          currField.content = {}
          currField.content.sort = sort
        }
      } else {
        currField.sort = sort || ''
      }

      newDimsFields.forEach((item, i) => {
        if (i !== index) {
          item.sort = null
          if (item.content) {
            item.content.sort = null
          }
        }
      })

      newNumericesFields.forEach((item) => {
        item.sort = null
      })
      newZaxisFields.forEach((item) => {
        item.sort = null
      })
      newDesireFields.forEach((item) => {
        item.sort = null
      })
    }

    this.setState(prevState => ({
      indicators: {
        ...prevState.indicators,
        dims: newDimsFields,
        numerices: newNumericesFields,
        zaxis: newZaxisFields,
        desires: newDesireFields
      }
    }), () => {
      this.props.onChangeIndicator(this.state.indicators)
    })
  }

  handleSearchDimValues(params, callback) {
    const { sourceId, chartCode, actions, dashboardId } = this.props
    const { dims, filters } = this.state.indicators

    const newDims = []
    dims && dims.forEach((i) => {
      if (i.id === params.dim) {
        i.dim = i.id
        newDims.push(i)
      }
    })
    const dataset = {
      dashboard_id: dashboardId,
      dataset_id: sourceId,
      chart_code: chartCode,
      dims: newDims,
      nums: [],
      conditions: [],
      display_item: JSON.stringify({ top_head: '', top_tail: '' }),
      filters
    }

    actions.fetchDimValues(dataset, (json) => {
      if (json.result) {
        callback(true, this.convertDimData(json.data.data, params.col_name))
      } else {
        callback(false, [])
      }
    })
  }

  convertDimData(data, colName) {
    const list = []
    data.forEach((item) => {
      list.push(item[colName])
    })
    return list
  }

  // 添加筛选字段
  handleAddFilter(indicator, evt) {
    const { actions, chartId } = this.props
    const filters = this.state.indicators.filters.concat()
    const { id } = evt.clone.dataset
    const field = this._findFieldDataById(id, indicator)
    const isExist = filters.find(i => i.dataset_field_id === id)

    if (field) {
      Object.assign(field, { formula_mode: '' })
    }

    if (field && field.type === '计算高级') {
      return this.showErr('高级计算字段不能设置为筛选器')
    } else if (isExist) {
      return this.showErr('该字段已经被设置为筛选器')
    } else if (field && !isExist) {
      filters.push({
        dashboard_chart_id: chartId,
        dataset_field_id: field.id,
        dataset_id: field.dataset_id,
        col_name: field.col_name,
        alias_name: field.alias_name,
        field_group: field.field_group,
        type: field.type,
        data_type: field.data_type,
        col_value: '',
        colValue: [],
        expression: null,
        operator: '',
        show: true,
        mode: 'add' //模式为新增filter
      })

      // 获取filterOptions
      if (field.data_type === '枚举' || field.data_type === '字符串') {
        actions.fetchFilterOptions({
          chart_id: chartId,
          dataset_field_id: field.id,
          dataset_id: field.dataset_id
        })
      }

      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          filters
        }
      }))
    }
  }

  handleSaveFilter(operator, value, col_name) {
    const filters = this.state.indicators.filters.concat()
    const index = _.findIndex(filters, item => col_name === item.col_name)

    if (index > -1) {
      //传到后台前 转换（空）为字符串''
      let json_value = ''
      let col_value = []

      if (value.length > 0) {
        col_value = value.map(i => (i === '(空)' ? '' : i))
      }

      if (col_value.length > 0) {
        json_value = ['in', 'not in', 'between'].indexOf(operator) > -1
          ? JSON.stringify(col_value)
          : col_value[0]
      }

      filters[index].col_value = json_value
      filters[index].colValue = value
      filters[index].operator = operator
      filters[index].show = false
      filters[index].mode = 'edit'

      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          filters
        }
      }), () => {
        this.props.onChangeIndicator('filters', this.state.indicators.filters)
      })
    }
  }

  handleDelFilter(col_name) {
    const filters = this.state.indicators.filters.concat()
    _.remove(filters, item => col_name === item.col_name)

    this.setState(prevState => ({
      indicators: {
        ...prevState.indicators,
        filters
      }
    }), () => {
      this.props.onChangeIndicator('filters', this.state.indicators.filters)
    })
  }

  handleCloseFilter(show, col_name, mode) {
    const filters = this.state.indicators.filters.concat()
    const index = _.findIndex(filters, item => col_name === item.col_name)

    if (mode === 'add') {
      filters.splice(index, 1)
    } else {
      filters[index].show = false
    }

    this.setState(prevState => ({
      indicators: {
        ...prevState.indicators,
        filters
      }
    }), () => {
      this.props.onChangeIndicator('filters', this.state.indicators.filters)
    })
  }

  // 弹窗
  handleSureDialog(mode, data) {
    const { alias_dialog, formatConfigDialog, urlSettingDialog } = this.state
    if (mode === 'alias') {
      const orginal = this.state.indicators[alias_dialog.type][alias_dialog.active]
      const org_alias = orginal.alias || orginal.alias_name || orginal.col_name
      const duplication = this._checkAliasDuplication(data.alias)
      // 名字没有改
      if (org_alias === data.alias) {
        this.handleCloseDialog('alias')
      } else if (org_alias !== data.alias && !duplication) {
        this.handleCloseDialog('alias')

        const indicatorFields = this.state.indicators[alias_dialog.type]
        const newIndicatorFields = indicatorFields.concat()
        newIndicatorFields[alias_dialog.active] = data

        this.setState(prevState => ({
          indicators: {
            ...prevState.indicators,
            [alias_dialog.type]: newIndicatorFields
          }
        }), () => {
          this.props.onChangeIndicator(alias_dialog.type, this.state.indicators[alias_dialog.type])
        })
      } else if (duplication) {
        this.showErr('别名和其他字段重复，请重新设置别名！')
      } else {
        this.handleCloseDialog('alias')
      }
    } else if (mode === 'formatConfig') {
      this.handleCloseDialog('formatConfig')

      const indicatorFields = this.state.indicators[formatConfigDialog.type]
      const newIndicatorFields = indicatorFields.concat()
      newIndicatorFields[formatConfigDialog.active].display_format = generateDisplayFormat(data)

      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          [formatConfigDialog.type]: newIndicatorFields
        }
      }), () => {
        this.props.onChangeIndicator(formatConfigDialog.type, this.state.indicators[formatConfigDialog.type])
      })
    } else if (mode === 'urlSettingConfig') {
      this.handleCloseDialog('urlSettingConfig')

      const indicatorFields = this.state.indicators[urlSettingDialog.type]
      const newIndicatorFields = indicatorFields.concat()
      newIndicatorFields[urlSettingDialog.active].dashboard_jump_config = generateUrlSetting(data)

      this.setState(prevState => ({
        indicators: {
          ...prevState.indicators,
          [urlSettingDialog.type]: newIndicatorFields
        }
      }), () => {
        this.props.onChangeIndicator(urlSettingDialog.type, this.state.indicators[urlSettingDialog.type])
      })
    }
  }

  // 关闭弹窗
  handleCloseDialog(mode) {
    if (mode === 'alias') {
      this.setState(prevState => ({
        alias_dialog: {
          ...prevState.alias_dialog,
          show: false
        }
      }))
    } else if (mode === 'formatConfig') {
      this.setState(prevState => ({
        formatConfigDialog: {
          ...prevState.formatConfigDialog,
          show: false
        }
      }))
    } else if (mode === 'urlSettingConfig') {
      this.setState(prevState => ({
        urlSettingDialog: {
          ...prevState.urlSettingDialog,
          show: false
        }
      }))
    }
  }

  // 获取数据集字段数据
  _findFieldDataById(id, indicator, props) {
    const { sourceId, dataFeildList } = props || this.props
    let field = null
    if (dataFeildList && dataFeildList[sourceId]) {
      Object.values(dataFeildList[sourceId]).every(group => group.every((data) => {
        if (data.id === id) {
          field = _.cloneDeep(data)
          return false
        }
        return true
      }))
    }
    return field
  }

  _checkAliasDuplication(alias) {
    let duplication = false
    Object.values(this.state.indicators).forEach((indicators) => {
      indicators.forEach((indicator) => {
        const _alias = indicator.alias || indicator.alias_name || indicator.col_name
        if (_alias === alias) {
          return duplication = true
        }
      })
    })
    return duplication
  }

  _fetchReportList(callback) {
    const { isdevtools, actions } = this.props
    if (!isdevtools) {
      actions.fetchDataviewList({}, (json) => {
        if (!json.result) {
          this.showErr(json.msg || '获取报告列表失败');
        } else {
          const { tree } = json.data
          const convertTree = tree ? convertFolderTree(tree, false) : []
          callback(convertTree)
        }
      })
    }
  }

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }

  showScc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  }
}

reactMixin.onClass(DataSourceIndicator, TipMixin)

const stateToProps = state => ({
  ...state.dataViewItemDetail
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataViewListActionCreators, itemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataSourceIndicator)
