import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip'

import Checkbox from './propComponents/Checkbox'
import SwitchButton from '../../../components/SwitchButton'
import IconButton from '../../../components/IconButton'
import NumberInput from '../../../components/NumberInput'
import rc from './components'

import { CONFIG_MAP } from './constants'
import CHART_TYPES, { SIMPLE_CHART_TYPE } from '../constants/chartTypes'
import { SIMPLE_TYPES } from '../../../constants/dashboard'

import EchartConnect from '../components/EchartConnect'
import DataSetConfig from '../components/dataSetConfig/DataSetConfig'
import { getCustomFieldConfig, getCustomConfigData, getMergedCustomConfigData, getPropComponentByField, concatCommonConfig, getFieldValByStrKeys } from '../utils/propConfigHelper'
import transferConfigFromLayoutExtend from '../utils/transferConfigFromLayoutExtend'

import './index.less'

// 获取CHART_TYPES对象
const _getChartTypesObj = () => {
  const obj = {}
  const arr = [].concat(CHART_TYPES['基础'], CHART_TYPES['筛选'], SIMPLE_CHART_TYPE)
  arr.forEach((item) => {
    obj[item.code] = item
  })
  return obj
}

// 判断是否为自定义组件
const _isCustomChart = props => !!(props && props.echart && props.echart.isCustom)

// 判断自定义组件是否设置数据集
const _isDataSetChart = (props) => {
  if (_isCustomChart(props)) {
    return props && props.echart && props.echart.designer && props.echart.designer.dataSourceOrigin && props.echart.designer.dataSourceOrigin === 'dataSet'
  }
  return false
}

// 获取图表名称(扩展组件读取自定义名称)
const _getChartName = (props, chart_code) => {
  let chartName = ''
  if (_isCustomChart(props)) {
    chartName = props.echart.info && props.echart.info.name
  } else {
    const chartType = _getChartTypesObj()[chart_code]
    chartName = chartType && chartType.name
  }
  return chartName
}

// 获取图表配置数据(扩展组件读取属性configData)
const _getChartConfig = (props) => {
  let chartConfig = {}
  if (_isCustomChart(props)) {
    const { diagramLayout, throughChart, chart, echart } = props
    const currChart = throughChart || chart
    const chartCode = _.get(currChart, 'chart_code')
    chartConfig = _.cloneDeep(_.get(diagramLayout, 'chart_config'))
    // 此处套一层深拷贝 避免原始默认配置被引用
    const designerChartConfig = _.cloneDeep(concatCommonConfig(_.get(echart, 'designer.chartConfig'), chartCode))

    // 默认配置数据
    if (!chartConfig || (chartConfig && chartConfig.length === 0)) {
      chartConfig = (designerChartConfig && getCustomConfigData(designerChartConfig)) || []

      // 如果新配置数据为空，且旧配置数据有值的话，则进行旧数据迁移至新配置
      if (diagramLayout && diagramLayout.layout_extend && Object.keys(diagramLayout.layout_extend).length > 0) {
        chartConfig = transferConfigFromLayoutExtend(chartCode, diagramLayout.layout_extend, chartConfig, diagramLayout.colorTheme)
      }
    }

    // 如果配置数据与组件配置属性版本不一致，则升级配置数据
    if (chartConfig) {
      chartConfig = getMergedCustomConfigData(chartConfig, getCustomConfigData(designerChartConfig))
    }
  } else {
    chartConfig = props.diagramLayout && props.diagramLayout.layout_extend && _.cloneDeep(props.diagramLayout.layout_extend)
  }
  return chartConfig
}

class DiagramConfig extends React.Component {
  static propTypes = {
    dashboardId: PropTypes.string,
    diagramList: PropTypes.array,
    dashboardTabData: PropTypes.object,
    echart: PropTypes.object,                 // 当前选中的图表组件
    chart: PropTypes.object,                  // 当前选中单图信息
    throughChart: PropTypes.object,           // 穿透后的单图信息
    chartData: PropTypes.array,
    diagramLayout: PropTypes.object,
    diagramDataset: PropTypes.object,
    gridLayout: PropTypes.array,
    diagramContainer: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.element
    ]),
    onConfigDataChange: PropTypes.func,
    onDatasetChange: PropTypes.func,
    onUpdateGridLayout: PropTypes.func,
    onUpload: PropTypes.func,
    onChange: PropTypes.func,                 // 更改的时候
    onChangeColorTheme: PropTypes.func,       // 更改配色方案
    onGoEditChart: PropTypes.func,
    showSucc: PropTypes.func,
    showErr: PropTypes.func,
    isdevtools: PropTypes.bool
  };

  constructor(props) {
    super(props)

    const isDataSetChart = _isDataSetChart(props)

    let data = {}
    let chartTypeName = ''
    if (props.chart && props.chart.chart_code) {
      data = _getChartConfig(props)
      chartTypeName = _getChartName(props, props.chart.chart_code)
    }

    this.state = {
      data,
      chartTypeName,
      colorTheme: null,
      throughChartId: props.throughChart ? props.throughChart.id : '',
      posSpread: true,
      tabStatus: isDataSetChart ? 'dataset' : 'style'
    }
  }

  componentWillReceiveProps(nextProps) {
    const { throughChart, chart } = nextProps

    const isDataSetChart = _isDataSetChart(nextProps)

    // 需要更新的state
    const newState = {
      throughChartId: throughChart ? throughChart.id : ''
    }
    // 如果有穿透图则类型名称显示穿透图的
    if (throughChart) {
      newState.chartTypeName = _getChartName(nextProps, nextProps.throughChart.chart_code)
    } else if (chart) {
      newState.chartTypeName = _getChartName(nextProps, nextProps.chart.chart_code)
    }

    const configData = _getChartConfig(nextProps)
    const layoutChanged = configData !== this.state.data
    // 如果layoutExtend有变化
    if (layoutChanged) {
      newState.data = configData
    }

    // 重置tabStatus
    if (!_.isEqual(this.props.chart, chart) || (this.props.chart && chart && this.props.chart.id !== chart.id) || (_.isEqual(this.props.chart, chart) && !_.isEqual(this.props.throughChart, throughChart))) {
      newState.tabStatus = isDataSetChart ? 'dataset' : 'style'
    }

    this.setState(() => newState)
  }

  render() {
    const { diagramDataset, echart, chart, throughChart, onGoEditChart, isdevtools } = this.props
    const isCustomChart = _isCustomChart(this.props)
    const isDataSetChart = _isDataSetChart(this.props)

    const dataRule = echart && echart.designer && echart.designer.indicatorDescription

    const { chartTypeName, tabStatus } = this.state
    const currChart = throughChart || chart

    return currChart ? (
      <div className="diagram-design-panel diagram-config-panel">
        <div style={this.STYLE_SHEET.chartName}>
          {
            (isCustomChart || SIMPLE_TYPES.indexOf(currChart.chart_code) > -1) ?
              <div style={{ textAlign: 'center' }}>
                {chartTypeName}
                {dataRule ? <OverlayTrigger trigger="hover" placement="bottom" overlay={(<Tooltip className="rule-tooltip" style={{ maxWidth: '280px' }}>{dataRule}</Tooltip>)}>
                  <i className="dmpicon-tip rule-tip"></i>
                </OverlayTrigger> : null}
              </div> :
              (<div>
                {chartTypeName}
                <IconButton onClick={() => { onGoEditChart(0, chart) }}
                  style={{ float: 'right', marginTop: '8px' }}
                  className="fixed"
                  iconClass="dmpicon-edit">
                  编辑数据
                </IconButton>
              </div>)
          }
        </div>
        <div className="edit-tab">
          <div className="edit-tab-wrap">
            {
              isDataSetChart ?
                <ul className="edit-tab-nav">
                  <li className={tabStatus === 'style' ? 'active' : ''} onClick={this.handleChangeTabStatus.bind(this, 'style')}>样式</li>
                  <li className={tabStatus === 'dataset' ? 'active' : ''} onClick={this.handleChangeTabStatus.bind(this, 'dataset')}>数据</li>
                </ul> : null
            }

            {tabStatus === 'style' ?
              <div style={{ overflowY: 'scroll' }}>
                {isCustomChart ? this.renderCustomConfig() : this.renderElements()}
                {this.renderGridOptions()}
              </div> : null
            }

            {isDataSetChart && tabStatus === 'dataset' ?
              <DataSetConfig
                isdevtools={isdevtools}
                dataset={diagramDataset && diagramDataset.dataSet}
                echart={echart}
                chartCode={currChart.chart_code}
                chartId={currChart.id}
                dashboardId={this.props.dashboardId}
                chart={chart}
                throughChart={throughChart}
                onDatasetChange={this.handleDatasetChange}
              /> : null
            }
          </div>
        </div>
      </div >
    ) : null
  }

  // 渲染内置组件(逐步淘汰)
  renderElements() {
    const elementNames = this.state.data
    const { diagramLayout } = this.props
    // 是否以维度配色
    const isAffect = diagramLayout && diagramLayout.colorTheme && diagramLayout.colorTheme.affect
    return (
      <div>
        {
          // 渲染 配置
          elementNames && Object.keys(elementNames).sort((a, b) => (CONFIG_MAP[a].key - CONFIG_MAP[b].key)).map((item, index) => {
            // 如果是以维度模式配色 不显示图例配置
            if (isAffect && item === 'legend') {
              return null
            }
            return (
              <div key={`diagram-config-element-${item}-${index}`}>
                {this.renderGroupTitle(CONFIG_MAP[item].name, elementNames[item], item)}
                {elementNames[item].show === false || this.renderGroupConetent(CONFIG_MAP[item].element, elementNames[item])}
              </div>
            )
          })
        }
      </div>
    )
  }

  // 渲染分组标题
  renderGroupTitle(title, group, field) {
    return (
      <div className="diagram-design-config-title"
        style={this.STYLE_SHEET.title}
        onClick={this.handleChangeConfigGroupShow.bind(this, field)}
      >
        <i className="spread-icon dmpicon-arrow-down" style={{
          ...this.STYLE_SHEET.spreadIcon,
          transform: !group.spread ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
        }} />
        {title}
        {
          group.show !== undefined && <SwitchButton
            active={group.show}
            turnOn={this.handleChangeShow.bind(this, field, true)}
            turnOff={this.handleChangeShow.bind(this, field, false)}
            style={this.STYLE_SHEET.switchBtn}
            activeStyle={this.STYLE_SHEET.switchBtn}
            circleStyle={{ width: '14px', height: '14px', top: 0, left: 0 }}
            circleActiveStyle={{ width: '14px', height: '14px', top: 0, left: '20px' }}
            texts={null}
          />
        }
      </div>
    )
  }

  // 渲染分组内容
  renderGroupConetent(element, data) {
    const {
      diagramLayout,
      chartData,
      onUpload,
      throughChart,
      chart,
      showSucc,
      showErr
    } = this.props
    const Element = rc[element]
    const { spread } = data

    return <div className="diagram-design-config-content" style={{
      ...this.STYLE_SHEET.groupCommon,
      maxHeight: spread ? '100000px' : 0,   // for height animation, 因为height: auto 没有动画效果
      borderBottomWidth: spread ? 1 : 0,
      borderBottomColor: '#1b2644',
      padding: spread ? '10px 15px 0px 33px' : '0 15px 0 33px',
      overflow: spread ? 'visible' : 'hidden',
    }}>
      {
        Element && <Element
          chartData={chartData}
          chart={throughChart || chart}
          configInfo={data}
          colorTheme={diagramLayout && diagramLayout.colorTheme}
          targetPercent={diagramLayout && diagramLayout.targetPercent}
          onChange={this.handleDataChange.bind(this)}
          onUpload={onUpload}
          showSucc={showSucc}
          showErr={showErr}
          onChangeColorTheme={this.handleChangeColorTheme.bind(this)} />
      }
    </div>
  }

  // 渲染位置编辑
  renderGridOptions() {
    const { chart, gridLayout } = this.props
    const { posSpread } = this.state
    const currGrid = _.find(gridLayout, c => c.i === chart.id)
    return [
      (
        <div className="diagram-design-config-title"
          style={this.STYLE_SHEET.title}
          key="grid-layout-option-title"
          onClick={() => { this.setState(preState => ({ posSpread: !preState.posSpread })) }}
        >
          尺寸位置
          <i className="spread-icon dmpicon-arrow-down" style={{
            ...this.STYLE_SHEET.spreadIcon,
            transform: !posSpread ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
          }} />
        </div>
      ), (
        <div className="diagram-design-config-content" key="grid-layout-option-content" style={{
          ...this.STYLE_SHEET.groupCommon,
          maxHeight: posSpread ? '100000px' : 0,   // for height animation, 因为height: auto 没有动画效果
          borderBottomWidth: posSpread ? 1 : 0,
          borderBottomColor: '#1b2644',
          padding: posSpread ? '10px 15px 0px 33px' : '0 15px 0 33px',
          overflow: posSpread ? 'visible' : 'hidden',
        }}>
          <div className="content">
            <div className="layout-config-column double-col">
              <div className="layout-config-double-col-sub">
                <span className="layout-config-column-title">宽</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={10}
                  step={1}
                  name="top"
                  value={+currGrid.w}
                  onChange={this.handleChangeGridLayout.bind(this, 'w')}
                />
              </div>
              <div className="layout-config-double-col-sub">
                <span className="layout-config-column-title">高</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={10}
                  step={1}
                  name="bottom"
                  value={+currGrid.h}
                  onChange={this.handleChangeGridLayout.bind(this, 'h')}
                />
              </div>
            </div>
            <div className="layout-config-column double-col">
              <div className="layout-config-double-col-sub">
                <span className="layout-config-column-title">X</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={-Infinity}
                  step={1}
                  name="left"
                  value={+currGrid.x + 4}
                  onChange={this.handleChangeGridLayout.bind(this, 'x')}
                />
              </div>
              <div className="layout-config-double-col-sub">
                <span className="layout-config-column-title">Y</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={-Infinity}
                  step={1}
                  name="right"
                  value={+currGrid.y + 4}
                  onChange={this.handleChangeGridLayout.bind(this, 'y')}
                />
              </div>
            </div>
          </div>
        </div>
      )
    ]
  }

  handleDatasetChange = (dataSetConfig, through_index) => {
    const { chart, throughChart } = this.props
    const currChart = throughChart || chart
    if (currChart && dataSetConfig && dataSetConfig.dataSet && currChart.chart_code !== dataSetConfig.dataSet.chart_code) {
      this.setState({
        data: null
      }, () => {
        this.props.onConfigDataChange(_.cloneDeep(this.state))
        this.props.onDatasetChange(dataSetConfig, through_index)
      })
    } else {
      this.props.onDatasetChange(dataSetConfig, through_index)
    }
  }

  // 更新尺寸位置
  handleChangeGridLayout(key, value) {
    const { chart, gridLayout, onUpdateGridLayout } = this.props
    const idx = _.findIndex(gridLayout, c => c.i === chart.id)
    // FreeLayout中的Margin修正值需要减掉
    if (key === 'x' || key === 'y') {
      value -= 4
    }
    const newLayout = gridLayout.concat([])
    newLayout[idx][key] = value
    onUpdateGridLayout(newLayout)
  }

  handleChangeColorTheme(colorTheme) {
    const { onChangeColorTheme, throughChart } = this.props
    onChangeColorTheme(throughChart ? throughChart.id : '', colorTheme)
  }

  handleDataChange(field, property, value) {
    _.set(this.state.data, `${field}.${property}`, value)
    // 如果 property === 'markline' 则，需要重新请求数据
    const needRefresh = property === 'markline.data' || property === 'displayItem' || property === 'refresh'
    this.props.onChange(this.state, needRefresh)
  }

  handleChangeShow(field, show, e) {
    e.stopPropagation()
    _.set(this.state.data, `${field}.show`, show)
    // 如果展开
    if (show) {
      _.set(this.state.data, `${field}.spread`, true)
    }
    this.props.onChange(this.state)
  }

  handleChangeConfigGroupShow(field) {
    this.setState((preState) => {
      const { data } = preState
      _.set(data, `${field}.spread`, !data[field].spread)
      return { data }
    }, () => {
      if (field !== 'cols') {
        this.props.onChange(this.state)
      }
    })
  }

  // 渲染自定义组件(新的方式)
  renderCustomConfig() {
    const configGroups = this.state.data
    const { chart, throughChart } = this.props
    const currChart = throughChart || chart
    let zaxisCode = ''
    //如果存在已设置的次轴
    if (currChart && currChart.zaxis && currChart.zaxis.length > 0) {
      zaxisCode = currChart.zaxis[0].chart_code
    }
    return (
      <div style={{ marginTop: '10px' }}>
        {
          configGroups && configGroups.map((group, index) => {
            if (group.field === 'zaxisConfig' && zaxisCode) {
              return (
                <div key={`diagram-config-element-group-${index}`}>
                  {this.renderCustomGroupTitle(group.title, group, index)}
                  {group.show === false || this.renderCustomGroupConetent(group, index, zaxisCode)}
                </div>
              )
            } else if (group.field === 'zaxisConfig' && !zaxisCode) {
              return null
            }
            return (
              <div key={`diagram-config-element-group-${index}`}>
                {this.renderCustomGroupTitle(group.title, group, index)}
                {group.show === false || this.renderCustomGroupConetent(group, index)}
              </div>
            )
          })
        }
      </div>
    )
  }

  renderCustomGroupTitle(title, group, groupIndex) {
    return (
      <div className="diagram-design-config-title"
        style={this.STYLE_SHEET.title}
        onClick={this.handleCustomGroupSpread.bind(this, groupIndex, group)}
      >
        <i className="spread-icon dmpicon-arrow-down" style={{
          ...this.STYLE_SHEET.spreadIcon,
          transform: !group.spread ? 'scale(0.75) translateY(-50%) rotateZ(-90deg)' : 'scale(0.75) translateY(-50%)'
        }} />
        {title}
        {
          group.show !== undefined && <SwitchButton
            active={group.show}
            turnOn={this.handleCustomGroupShow.bind(this, groupIndex, true)}
            turnOff={this.handleCustomGroupShow.bind(this, groupIndex, false)}
            style={this.STYLE_SHEET.switchBtn}
            activeStyle={this.STYLE_SHEET.switchBtn}
            circleStyle={{ width: '14px', height: '14px', top: 0, left: 0 }}
            circleActiveStyle={{ width: '14px', height: '14px', top: 0, left: '20px' }}
            texts={null}
          />
        }
      </div>
    )
  }

  renderCustomGroupConetent(group, groupIndex, zaxisCode) {
    const { echart, chart, throughChart, diagramList, dashboardTabData, chartData, onUpload, showSucc, showErr } = this.props
    const currChart = throughChart || chart
    const { spread } = group
    const chartCode = currChart.chart_code
    return <div className="diagram-design-config-content" style={{
      ...this.STYLE_SHEET.groupCommon,
      maxHeight: spread ? '100000px' : 0,   // for height animation, 因为height: auto 没有动画效果
      borderBottomWidth: spread ? 1 : 0,
      borderBottomColor: '#1b2644',
      padding: spread ? '10px 15px 10px 33px' : '0 15px 0 33px',
      overflow: spread ? 'visible' : 'hidden',
    }}>
      {
        group && group.items && group.items.map((item, index) => {
          let Item = null
          if (item && !item.items) { //单配置项
            // 配置项是否使用，依赖于其他配置项
            if (item.ref) {
              const groupData = getCustomFieldConfig([group])
              const refVal = getFieldValByStrKeys(groupData, item.ref)
              if (item.refVal !== refVal) {
                return null
              }
            }

            const PropComponent = echart && echart.designer && echart.designer.chartConfig ? getPropComponentByField(concatCommonConfig(echart.designer.chartConfig, chartCode), item.field) : null
            Item = item.label ? (
              <div className="layout-config-column" key={`diagram-config-element-item-${index}`}>
                <span className="layout-config-column-title">{item && item.label}</span>
                {PropComponent ? <PropComponent
                  {...PropComponent.__PROPS}
                  diagramList={diagramList}
                  dashboardTabData={dashboardTabData}
                  chart={currChart}
                  chartData={chartData}
                  data={item && item.data}
                  onChange={data => this.handlePropChange(data, item, index, groupIndex)}
                  onUpload={onUpload}
                  showSucc={showSucc}
                  showErr={showErr}
                /> : null}
              </div>
            ) : PropComponent ? (
              <PropComponent
                {...PropComponent.__PROPS}
                diagramList={diagramList}
                dashboardTabData={dashboardTabData}
                key={`diagram-config-element-item-${index}`}
                chart={currChart}
                chartData={chartData}
                data={item && item.data}
                onChange={data => this.handlePropChange(data, item, index, groupIndex)}
                onUpload={onUpload}
                showSucc={showSucc}
                showErr={showErr}
              />
            ) : null
          } else if (item && item.items) { //单配置组
            //通过scope与zaxisCode判断次轴样式是否显示
            Item = (
              <div key={`diagram-config-element-item-${index}`}>
                {(!Array.isArray(item.scope) || (Array.isArray(item.scope) && item.scope.indexOf(zaxisCode) > -1)) && <div className="title">
                  {item.label}
                  {item.show ?
                    <Checkbox
                      data={item.show && item.show.data}
                      onChange={data => this.handlePropChange(data, item, index, groupIndex, 'itemGroupShow')}
                    /> : null}
                </div>
                }
                {(((item.show && item.show.data) || (!item.show && item.items)) && (!Array.isArray(item.scope) || (Array.isArray(item.scope) && item.scope.indexOf(zaxisCode) > -1))) ? <div className="content">
                  {
                    item.items && item.items.map((subItem, subItemIndex) => {
                      // 配置项是否使用，依赖于其他配置项
                      if (subItem.ref) {
                        const groupData = getCustomFieldConfig([group])
                        const refVal = getFieldValByStrKeys(groupData, subItem.ref)
                        if (subItem.refVal !== refVal) {
                          return null
                        }
                      }

                      const SubPropComponent = echart && echart.designer && echart.designer.chartConfig ? getPropComponentByField(concatCommonConfig(echart.designer.chartConfig, chartCode), item.field, subItem.field) : null
                      return subItem.label ? (
                        <div className="layout-config-column" key={`diagram-config-element-subitem-${subItemIndex}`}>
                          <span className="layout-config-column-title sub">{subItem && subItem.label}</span>
                          {SubPropComponent ? <SubPropComponent
                            {...SubPropComponent.__PROPS}
                            diagramList={diagramList}
                            dashboardTabData={dashboardTabData}
                            chart={currChart}
                            chartData={chartData}
                            data={subItem && subItem.data}
                            onChange={data => this.handlePropChange(data, item, index, groupIndex, 'itemGroupSub', subItemIndex)}
                            onUpload={onUpload}
                            showSucc={showSucc}
                            showErr={showErr}
                          /> : null}
                        </div>
                      ) : SubPropComponent ? (
                        <div className="sub">
                          <SubPropComponent
                            {...SubPropComponent.__PROPS}
                            diagramList={diagramList}
                            dashboardTabData={dashboardTabData}
                            chart={currChart}
                            chartData={chartData}
                            data={subItem && subItem.data}
                            onChange={data => this.handlePropChange(data, item, index, groupIndex, 'itemGroupSub', subItemIndex)}
                            onUpload={onUpload}
                            showSucc={showSucc}
                            showErr={showErr}
                          />
                        </div>
                      ) : null
                    })
                  }
                </div> : null}
              </div>
            )
          }
          return Item
        })
      }
    </div>
  }

  handleCustomGroupSpread(groupIndex, group) {
    if (group.show !== undefined && !group.show) return;
    this.setState((prevState) => {
      const data = _.cloneDeep(prevState.data)
      data[groupIndex].spread = !prevState.data[groupIndex].spread
      return {
        data
      }
    }, () => {
      this.props.onConfigDataChange(_.cloneDeep(this.state))
    })
  }

  handleCustomGroupShow(groupIndex, show, e) {
    e.stopPropagation()

    this.setState((prevState) => {
      const data = _.cloneDeep(prevState.data)
      data[groupIndex].show = show
      data[groupIndex].spread = show
      return {
        data
      }
    }, () => {
      this.props.onConfigDataChange(_.cloneDeep(this.state))
    })
  }

  handlePropChange(propData, item, itemIndex, groupIndex, specialType, subItemIndex) {
    let needRefresh = false
    this.setState((prevState) => {
      const data = _.cloneDeep(prevState.data)
      if (data[groupIndex] && data[groupIndex].items && data[groupIndex].items[itemIndex]) {
        const dataItem = data[groupIndex].items[itemIndex]
        if (specialType === 'itemGroupShow' && dataItem.show !== undefined) { //单配置组改变show值
          dataItem.show.data = propData
        } else if (specialType === 'itemGroupSub' && dataItem.items && dataItem.items[subItemIndex]) { //单配置组的配置子项改变值
          const dataItemGroupSubItem = dataItem.items[subItemIndex]
          dataItemGroupSubItem.data = (propData && typeof propData === 'object' ? _.cloneDeep(propData) : propData)
        } else { //单配置项改变值
          // 如果辅助线改变了, 需要重新请求数据
          const hasMarkline = ['xMarkline', 'yMarkline', 'zMarkline'].indexOf(dataItem.scope) > -1
          if (hasMarkline && !_.isEqual(_.get(dataItem, 'data.data'), _.get(propData, 'data'))) {
            needRefresh = true
          }
          dataItem.data = (propData && typeof propData === 'object' ? _.cloneDeep(propData) : propData)
        }
      }
      return {
        data
      }
    }, () => {
      this.props.onConfigDataChange(_.cloneDeep(this.state), needRefresh)
    })
  }

  handleChangeTabStatus(tabStatus) {
    if (this.state.tabStatus !== tabStatus) {
      this.setState({
        tabStatus
      })
    }
  }

  STYLE_SHEET = {
    chartName: {
      height: '41px',
      borderBottom: '1px solid #1B2644',
      padding: '0 15px 0 13px',
      lineHeight: '40px',
      color: '#FFFFFF',
      fontSize: '14px'
    },
    title: {
      position: 'relative',
      paddingLeft: '30px',
      height: '30px',
      lineHeight: '29px',
      fontSize: '14px',
      cursor: 'pointer',
      borderBottomColor: '#1b2644',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px'
    },
    spreadIcon: {
      right: 'initial',
      left: '12px',
      marginTop: '-2px',
      transition: 'transform .3s'
    },
    groupCommon: {
      transition: 'max-height .1s linear, padding .1s linear',
      borderBottomStyle: 'solid',
    },
    switchBtn: {
      width: '34px',
      height: '14px',
      lineHeight: '14px',
      float: 'right',
      right: 14,
      top: 8
    }
  }
}

export default EchartConnect(DiagramConfig);
