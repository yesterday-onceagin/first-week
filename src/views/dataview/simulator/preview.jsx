import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import RCSlider from 'rc-slider'
import Loading from 'react-bootstrap-myui/lib/Loading'
import LayoutConfigPanel from '../components/LayoutConfigPanel'
import DiagramsAlignmentConfig from '../components/DiagramsAlignmentConfig'
import ChartMenu from '../components/ChartMenu'

import FixedTopNav from '../../../components/FixedTopNav'
import Dashboard from '../../../components/Dashboard'
import DiagramConfig from '../diagramConfig'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as itemDetailActionCreators } from '../../../redux/modules/dataview/itemDetail'

import _ from 'lodash'
import classnames from 'classnames'
import TipMixin from '../../../helpers/TipMixin'
import ConfirmMixin from '../../../helpers/ConfirmsMixin'
import { getDashboardLayoutOptions } from '../../../helpers/dashboardUtils'

import { getCustomScopeConfig } from '../utils/propConfigHelper'

import 'rc-slider/assets/index.css'; //eslint-disable-line
import '../item-detail.less';
import '../../../components/reset-slider.less';
import '../components/chart-type-view.less'

const Slider = RCSlider.createSliderWithTooltip(RCSlider)

const SCALE_MIN = 0.1
const SCALE_MAX = 3

const _stopPropagation = function (e) {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

const DmpSimulatorPreview = createReactClass({
  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    chartlibs: PropTypes.array,
    chartPending: PropTypes.bool,
    dashboardPending: PropTypes.bool,
    dataReportPending: PropTypes.bool,
    chartList: PropTypes.object,
    params: PropTypes.object,
    gridLayout: PropTypes.object,
    diagramLayouts: PropTypes.object,
    items: PropTypes.object,
    reportDatasetsId: PropTypes.string,
    actions: PropTypes.object,
    dashboardTabData: PropTypes.object,
    diagramDatasets: PropTypes.object
  },

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      designScale: 1,
      currDashboardData: getDashboardLayoutOptions(),
      selectedDiagrams: [],                          // 当前选中的单图
      reportDatasets: {},
      hoverDiagram: null,
      needSave: false,                              // 是否需要保存
      panelVisible: {
        layer: false,                               // 图层面板是否显示
        config: true                                // 设置面板是否显示
      }
    }
  },

  componentDidMount() {
    this.handleScaleFitToView()

    this._handleKeyDown = this.handleKeyDown
    this._handleKeyUp = this.handleKeyUp

    document.addEventListener('keydown', this._handleKeyDown)
    document.addEventListener('keyup', this._handleKeyUp)
  },

  componentWillReceiveProps(newProps) {
    const { params, chartList } = newProps
    const nextDataList = chartList[params.kanban_id] || []
    const dataList = this.props.chartList[params.kanban_id]
    // 原有的dataList必须为数组的情况才判断是否长度增加(dataList不为数组代表接口还未返回)
    if (Array.isArray(dataList) && nextDataList.length > dataList.length) {
      this.setState({
        selectedDiagrams: [nextDataList[nextDataList.length - 1]]
      })
      // 如果只有选中一个单图, 需要更新下单图的配置属性等等
    } else if (this.state.selectedDiagrams.length === 1) {
      this.setState(() => {
        const selectedDiagram = nextDataList.find(item => item.id === this.state.selectedDiagrams[0].id)
        return {
          selectedDiagrams: [selectedDiagram]
        }
      })
    }
  },

  componentDidUpdate() {
    this._updateDesignBoxPadding()
  },

  render() {
    const { dashboardPending, chartPending } = this.props
    const {
      currDashboardData,
      designScale,
      panelVisible,
    } = this.state

    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts

    const wrapperClass = classnames('design-page-container', {
      'hide-layer-panel': !panelVisible.layer,
      'hide-config-panel': !panelVisible.config
    })

    const designBoxClass = classnames('dataview-design-box')

    const designBoxStyle = {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      transform: `scale(${designScale})`
    }

    return (
      <div className="modules-page-container data-view-item-detail-page no-flex"
        id="data-view-item-detail-page"
        ref={(instance) => { this.modulePageContainer = instance }}
        style={{
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {this.renderFixedNav()}
        <div className={wrapperClass}>
          <div className="design-main-wrapper">
            <div className="kanban-size-container"
              ref={(instance) => { this.kanbanSizeContainer = instance }}
              onClick={this.handleDiagramClick.bind(this, null)}
            >
              <div className="design-box-padding" ref={(ins) => { this.designboxPaddingContainer = ins }}>
                <div className={designBoxClass}
                  id="dataview-design-box"
                  ref={(instance) => { this.dataviewDesignBox = instance }}
                  style={designBoxStyle}
                >
                  {this.renderDashboard()}
                </div>
              </div>
            </div>
            <div className="kanban-bottom-bar">
              <div className="zoom-control-wrapper">
                <i title="缩小" onClick={this.handleReduceScale} className="dmpicon-minus" />
                <div className="sliderbar">
                  <Slider
                    className="custom"
                    min={SCALE_MIN}
                    max={SCALE_MAX}
                    step={0.1}
                    value={designScale}
                    tipFormatter={value => `${(value * 100).toFixed(0)}%`}
                    onChange={this.handleChangeDesignScale}
                  />
                </div>
                <i title="放大"
                  onClick={this.handleAddScale}
                  className="dmpicon-add-01"
                  style={{ marginRight: '30px' }}
                />
                <i title="原始大小"
                  onClick={this.handleChangeDesignScale.bind(this, 1)}
                  className="dmpicon-no-scale"
                />
                <i title="适应窗口"
                  onClick={this.handleScaleFitToView}
                  className="dmpicon-fix-screen"
                />
              </div>
            </div>
          </div>
          {this.renderDesignPanel()}
        </div>
        <Loading show={dashboardPending || chartPending} containerId="data-view-item-detail-page" />
      </div>
    );
  },

  // 组件菜单
  renderFixedNav() {
    const { chartlibs } = this.props
    return (
      <FixedTopNav disableBack={true}>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAAAiCAYAAAA07nWtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3JpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDplNWFhNWFiNy0zZWZjLWE0NGUtYWFhMy00YmUzNTZhYTE0ZDMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzY0REZCMjVFQzNGMTFFNjk3OTJBMzRBRDg2NDMyNDYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzY0REZCMjRFQzNGMTFFNjk3OTJBMzRBRDg2NDMyNDYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDplMTdjOGQ3YS0wMGI3LTU1NGQtYTkwMi0xNzNhNWQyNDVjZDciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ZTVhYTVhYjctM2VmYy1hNDRlLWFhYTMtNGJlMzU2YWExNGQzIi8+IDwv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" style={{ margin: '6px 0 0 10px' }} />
        <div className="nav-left-container nav-btn-container">
          {chartlibs && chartlibs.map(chart => (
            <ChartMenu chart={chart} chart_code={chart.code} key={chart.code} className="nav-left-btn" onClick={this.handleAddChart.bind(this, chart.code, chart.name)}>
              <i className="dmpicon-diamond nav-left-btn-icon" />
              {chart.name}
            </ChartMenu>
          ))}
        </div>
      </FixedTopNav>
    )
  },

  // 渲染报告
  renderDashboard() {
    const { params, dataReportPending } = this.props
    // 如果报告正在加载中则显示一个loading图标
    if (dataReportPending) {
      return (
        <div style={{ width: '100%', height: '100%' }}>
          <div role="loading-modal">
            <div className="loading-backdrop fade in"></div>
            <div className="loading-wrapper fade in" style={{ marginTop: '-20px', marginLeft: '-18px' }}>
              <span className="fontelloicon glyphicon-spinner2"></span>
            </div>
          </div>
        </div>
      );
    }
    const { uuid, currDashboardData, designScale, selectedDiagrams, hoverDiagram } = this.state
    const events = {
      onEdit: () => { },
      onDelete: this.handleDeleteSection,
      onDatasetChange: this.handleDiagramDatasetChange
    }
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    return (
      <Dashboard
        isdevtools={true}
        uuid={uuid}
        dataviewId={params.kanban_id}
        width={layout.width}
        height={layout.height}
        editable={true}
        events={events}
        layoutOptions={layoutOpts}
        selectedItems={selectedDiagrams}
        onSelectItem={this.handleDiagramClick}
        echartsScaleRate={designScale}
        hoverDiagram={hoverDiagram}
        onUpdateLayout={this.handleUpdateLayout}
        dashboardId={params.kanban_id}
        dashboardName={params.kanban_name}
      />
    )
  },

  // 渲染设计面板
  renderDesignPanel() {
    const { gridLayout, diagramLayouts, diagramDatasets, params, items, chartList, reportDatasetsId, dashboardTabData } = this.props
    const { selectedDiagrams, currDashboardData } = this.state
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    const currChart = (selectedDiagrams.length === 1) ? selectedDiagrams[0] : null
    let throughChart = null
    let chartData = []
    let diagramLayout = currChart ? _.cloneDeep(diagramLayouts[currChart.id]) : null
    let diagramDataset = currChart ? _.cloneDeep(diagramDatasets[currChart.id]) : null

    // 判断是否有items
    if (currChart && items && items[currChart.id]) {
      const chartItem = items[currChart.id]
      // 取得chartData
      chartData = chartItem.chart_data
      // 判断是否有穿透 必须在有currChart和items的前提下
      if (Array.isArray(currChart.penetrates) && currChart.penetrates.length > 0 && chartItem.through_index > 0) {
        throughChart = currChart.penetrates[chartItem.through_index - 1]
        throughChart.through_index = chartItem.through_index
        diagramLayout = diagramLayouts[throughChart.id]
        diagramDataset = diagramDatasets[throughChart.id]
      }
    }
    const currGridLayout = _.cloneDeep(gridLayout[params.kanban_id])
    //2018.1.9新增 报告配置默认数据集为第一张单图对应数据集
    const diagramList = chartList[currDashboardData.id]
    let reportDatasetId = ''
    if (reportDatasetsId) {
      reportDatasetId = reportDatasetsId
    } else {
      reportDatasetId = Array.isArray(diagramList) && diagramList.length > 0 ? diagramList[0].source : ''
    }

    return (
      <div className="dataview-design-container"
        onKeyDown={_stopPropagation}
        onKeyUp={_stopPropagation}
      >
        <DiagramConfig
          isdevtools={true}
          diagramList={diagramList}
          dashboardTabData={_.cloneDeep(dashboardTabData)}
          chart={currChart}
          throughChart={throughChart}
          chart_code={throughChart ? throughChart.chart_code : (currChart && currChart.chart_code)}
          chartData={chartData}
          diagramLayout={diagramLayout}
          diagramDataset={diagramDataset}
          gridLayout={currGridLayout}
          diagramContainer={this.kanbanSizeContainer}
          onConfigDataChange={this.handleDiagramConfigChange}
          onDatasetChange={this.handleDiagramDatasetChange}
          onUpdateGridLayout={this.handleUpdateLayout}
          onUpload={() => { }}
          onGoEditChart={() => { }}
          showSucc={this.showSucc}
          showErr={this.showErr}
        />
        <LayoutConfigPanel
          isdevtools={true}
          dashboardId={currDashboardData.id}
          show={selectedDiagrams.length === 0}
          reportDatasetId={reportDatasetId}
          diagramList={diagramList}
          gridLayout={currGridLayout}
          onConfirmChange={() => { }}
          onChangeSelector={() => { }}
          onUpdateGridLayout={this.handleUpdateLayout}
          dashboardData={currDashboardData}
          onUpload={() => { }}
          onChange={this.handleChangeLayoutOptions}
          onScreenshot={() => { }}
          showSucc={this.showSucc}
          showErr={this.showErr}
        />
        <DiagramsAlignmentConfig
          show={selectedDiagrams.length > 1}
          selectedDiagrams={selectedDiagrams}
          gridLayout={gridLayout[params.kanban_id]}
          designInfo={layout}
          onUpdateLayout={this.handleUpdateLayout}
        />
        <span className="switch-item switch-for-config dmpicon-double-arrow-right"
          onClick={this.handleTogglePanel.bind(this, 'config')}
        />
      </div>
    )
  },

  // 更新gridLayout（用于传入组件 auto save）
  handleUpdateLayout(layouts) {
    const { actions, params } = this.props
    if (layouts.length > 0) {
      // 提交到本地
      actions.updateGridLayout({
        id: params.kanban_id,
        gridLayout: layouts
      })
    }
  },

  // 图表编辑属性修改
  handleDiagramConfigChange(config) {
    const { actions, params } = this.props
    const { selectedDiagrams } = this.state
    const opts = _.cloneDeep(config)

    const currDiagram = selectedDiagrams[0]
    const currChartId = opts.throughChartId ? opts.throughChartId : currDiagram.id
    const topChartId = currDiagram.id

    const scopeConfig = getCustomScopeConfig(opts.data)
    const { xMarkline, yMarkline, zMarkline } = scopeConfig

    // 辅助线
    const marklines = []
    if (xMarkline) {
      xMarkline.data.data.forEach((item) => {
        marklines.push({
          ...item,
          axis_type: '1'
        })
      })
    }
    if (yMarkline) {
      yMarkline.data.data.forEach((item) => {
        marklines.push({
          ...item,
          axis_type: '1'
        })
      })
    }
    if (zMarkline) {
      zMarkline.data.data.forEach((item) => {
        marklines.push({
          ...item,
          axis_type: '2'
        })
      })
    }

    // 进行提交到本地
    actions.updateChartLayout({
      dashboard_id: params.kanban_id,
      chart_id: currChartId,
      chart_config: opts.data,
      chart_code: currDiagram.chart_code,
      // display_item: display_item ? JSON.stringify(display_item) : null,
      marklines,
      topChartId
    })
  },

  // 数据集
  handleDiagramDatasetChange(dataSetConfig, through_index) {
    const { diagramDatasets, actions, params } = this.props
    const { chart, throughChart, ...otherDataSetConfig } = dataSetConfig
    const dataSetOpts = _.cloneDeep(otherDataSetConfig)
    let dataSet = dataSetOpts && dataSetOpts.dataSet

    //更新前同步筛选器的改动到穿透图层里
    if (Array.isArray(dataSet.filters) && dataSet.filters.length > 0) {
      dataSet.penetrates && dataSet.penetrates.length > 0 && dataSet.penetrates.forEach((layer) => {
        layer.filters = dataSet.filters
      })
    }

    // 提交到本地
    actions.updateDatasetConfig({
      chart,
      throughChart,
      chart_id: dataSetOpts.chart_id,
      through_index: through_index || 0,
      dataSet: {
        ...dataSet,
        dashboard_id: params.kanban_id
      }
    })

    // 如果修改子级穿透数据集，则修改当前父级图表的数据集
    if (throughChart && chart) {
      const chartDataSet = diagramDatasets && diagramDatasets[chart.id] && diagramDatasets[chart.id].dataSet
      let penetrates = chartDataSet.penetrates && chartDataSet.penetrates.concat()
      if (penetrates) {
        penetrates = penetrates.map((penetrate) => {
          if (penetrate.id === dataSetOpts.chart_id) {
            return _.extend(penetrate, dataSet)
          }
          return penetrate
        })
      }

      dataSet = {
        ...chartDataSet,
        layers: dataSet.layers,
        penetrates
      }
    }

    // 提交到服务器
    if (dataSet.name) {
      delete dataSet.name
    }
    actions.saveDataset({
      ...dataSet,
      dashboard_id: params.kanban_id,
      through_index: through_index || 0
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  // 切换选中的单图
  handleDiagramClick(diagram, toggle) {
    const { selectedDiagrams, kanbanFullSize } = this.state
    // 全屏不可选中
    if (kanbanFullSize) {
      return
    }
    // 清空
    if (!diagram) {
      if (Array.isArray(selectedDiagrams) && selectedDiagrams.length > 0) {
        this.setState({
          selectedDiagrams: []
        })
      }
      return
    }

    // 多选
    if (this._ctrlkeyDown || toggle === true) {
      const selectIndex = selectedDiagrams.indexOf(diagram)
      // toggle
      if (selectIndex > -1) {
        selectedDiagrams.splice(selectIndex, 1)
      } else {
        selectedDiagrams.push(diagram)
      }
      this.setState({
        selectedDiagrams
      })
    } else {
      this.setState({
        selectedDiagrams: [diagram]
      })
    }
  },

  // 变更报告设计(auto save)
  handleChangeLayoutOptions(options) {
    this.setState((preState) => {
      const newData = preState.currDashboardData

      // 遍历options中的field
      _.keys(options).forEach((field) => {
        if (typeof options[field] === 'object') {
          newData[field] = {
            ...newData[field],
            ...options[field]
          }
        } else {
          newData[field] = options[field]
        }
      })
      return { currDashboardData: newData }
    })
  },

  // 删除单图
  handleDeleteSection(serial, data, callback) {
    const { actions, params } = this.props
    data = data || this.state.selectedDiagrams
    if (!Array.isArray(data)) {
      data = [data]
    }
    if (data.length === 0) {
      return
    }
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该单图吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      ok: () => {
        Promise.all(data.map(item => new Promise((resolve, reject) => {
          actions.fetchDeleteChartItem({
            dashboard_id: params.kanban_id,
            id: item.id,
            chart_code: item.chart_code
          }, (json) => {
            if (!json.result) {
              reject(json.msg || '删除失败')
            } else {
              resolve(json.msg)
            }
          })
        }))).then(() => {
          this.showSucc('删除成功')
          //dashboard层回调
          callback && callback()
          // 2017.12.14新增对于currentDashboardData操作
          const newSelectors = _.cloneDeep(this.state.currDashboardData.selectors)
          Object.getOwnPropertyNames(newSelectors).forEach((sel) => {
            newSelectors[sel] = _.filter(newSelectors[sel], f => !data.some(item => item.id === f))
          })
          // 过滤掉被删除的单图
          this.setState({
            selectedDiagrams: this.state.selectedDiagrams.filter(diagram => !data.some(item => item.id === diagram.id)),
            currDashboardData: {
              ...this.state.currDashboardData,
              selectors: newSelectors
            }
          })
        }).catch((msg) => {
          this.showErr(msg)
        })
      }
    })
  },

  // 新增单图
  handleAddChart(chartCode, chartName, echart) {
    const { actions, params, chartList } = this.props
    const { type } = (echart && echart.info) || {}

    if (!chartName) {
      chartName = '未命名图表'
    }

    // 单图编号
    const nextNo = chartList[params.kanban_id].filter(item => item.chart_code === chartCode).length + 1

    const newItem = {
      name: `${chartName}-${nextNo}`,
      dashboard_id: params.kanban_id,
      chart_code: chartCode,
      chart_type: type || '',
      position: '',
      config: '',
      layout: '',
      layout_extend: ''
    }

    actions.fetchSaveChartItem(newItem, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  // 隐藏一个面板
  handleTogglePanel(name) {
    this.setState({
      panelVisible: {
        ...this.state.panelVisible,
        [name]: !this.state.panelVisible[name]
      }
    })
  },

  // 缩放画布
  handleChangeDesignScale(value) {
    this.setState({
      designScale: value
    })
  },

  // 缩小画布
  handleReduceScale() {
    let designScale = this.state.designScale - 0.5
    designScale = Math.max(SCALE_MIN, designScale)
    this.setState({
      designScale
    })
  },

  // 放大画布
  handleAddScale() {
    let designScale = this.state.designScale + 0.5
    designScale = Math.min(SCALE_MAX, designScale)
    this.setState({
      designScale
    })
  },

  // 画布适应窗口
  handleScaleFitToView(callback) {
    const wrapper = this.kanbanSizeContainer
    const layout = this._getDesignLayout()
    const perfectScaleHorizon = (wrapper.clientWidth - 100) / layout.width
    const perfectScaleVercical = (wrapper.clientHeight - 100) / layout.height
    this.setState({
      designScale: Math.min(perfectScaleVercical, perfectScaleHorizon)
    }, () => {
      typeof callback === 'function' && callback()
    })
  },

  setHoverDiagram(item) {
    this.setState({
      hoverDiagram: item
    })
  },

  // 获取layouts
  _getLayouts(gridLayouts) {
    const { chartList, params, gridLayout } = this.props
    if (!Array.isArray(chartList[params.kanban_id]) || chartList[params.kanban_id].length === 0) {
      return []
    }
    return chartList[params.kanban_id].map((item, index) => {
      const pos = gridLayouts ? gridLayouts[index] : gridLayout[params.kanban_id][index]
      return {
        id: item.id,
        position: JSON.stringify({
          col: pos.x,
          row: pos.y,
          size_x: pos.w,
          size_y: pos.h,
          z: pos.z
        })
      }
    })
  },

  // 取得报告设计样式
  _getDesignLayout() {
    const { currDashboardData } = this.state
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    return layout
  },

  // 在didupdate 中使用
  _updateDesignBoxPadding() {
    const padding = this._calcPaddingByScale()
    const wrapper = this.designboxPaddingContainer
    wrapper.style.padding = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
    wrapper.style.height = `${padding.innerHeight + padding.top + padding.bottom}px`
    wrapper.style.width = `${padding.innerWidth + padding.left + padding.right}px`
  },

  // 计算合适的padding值
  _calcPaddingByScale() {
    const { designScale, panelVisible } = this.state
    const layout = this._getDesignLayout()
    const containerWidth = window.innerWidth - (panelVisible.layer ? 150 : 0) - (panelVisible.config ? 360 : 0)
    const containerHeight = window.innerHeight - 80
    const paddingHorizon = (containerWidth - (layout.width * designScale)) / 2
    const paddingVertical = (containerHeight - (layout.height * designScale)) / 2
    return {
      top: paddingVertical < 50 ? 50 : paddingVertical,
      right: paddingHorizon <= 50 ? 50 : 0,
      bottom: paddingVertical < 50 ? 50 : 0,
      left: paddingHorizon < 50 ? 50 : paddingHorizon,
      innerWidth: layout.width * designScale,
      innerHeight: layout.height * designScale
    }
  },

  _getMaxZindex() {
    const { gridLayout } = this.props
    const zList = gridLayout.map(layout => (layout.z))
    return Math.max.apply(null, zList)
  },

  handleKeyDown(e) {
    // 兼容苹果command
    let isMac = false
    if (navigator.appVersion.indexOf('Mac') !== -1) {
      isMac = true
    }
    const isCommand = isMac && (e.keyCode === 91 || e.keyCode === 93)
    if (e.keyCode === 17 || isCommand) {
      this._ctrlkeyDown = true
    }
    switch (e.keyCode) {
      // ctrl
      case 17:
        this._ctrlkeyDown = true
        break
      // mac: command, win: system
      case 91:
      case 93:
        if (isCommand) {
          this._ctrlkeyDown = true
        }
        break
      default:
        break
    }
  },

  handleKeyUp(e) {
    // 兼容苹果command
    let isMac = false
    if (navigator.appVersion.indexOf('Mac') !== -1) {
      isMac = true
    }
    const isCommand = isMac && (e.keyCode === 91 || e.keyCode === 93)
    if (e.keyCode === 17 || isCommand) {
      this._ctrlkeyDown = false
    }
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }
})

const stateToProps = state => ({
  ...state.dataViewItemDetail
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, itemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DmpSimulatorPreview)
