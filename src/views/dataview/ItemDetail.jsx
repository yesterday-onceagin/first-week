import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import RCSlider from 'rc-slider'
import Loading from 'react-bootstrap-myui/lib/Loading'
import LayoutConfigPanel from './components/LayoutConfigPanel'
import ChartLayerManager from './components/ChartLayerManager'
import DiagramsAlignmentConfig from './components/DiagramsAlignmentConfig'
import ChartTypeNav from './components/ChartTypeNav'

import Dashboard from '@components/Dashboard'
import FixedTopNav from '@components/FixedTopNav'
import IconButton from '@components/IconButton'
import DiagramConfig from './diagramConfig'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail'
import { actions as commonActionCreators } from '@store/modules/common'

import _ from 'lodash'
import classnames from 'classnames'
import TipMixin from '@helpers/TipMixin'
import ConfirmMixin from '@helpers/ConfirmsMixin'
import { getDashboardLayoutOptions, rememberEditID } from '@helpers/dashboardUtils'
import { baseAlias } from '../../config'

import { getCustomScopeConfig } from './utils/propConfigHelper'

// 报告截图使用
const html2canvas = require('../../libs/html2canvas')

import 'rc-slider/assets/index.css'; //eslint-disable-line
import './item-detail.less';
import '@components/reset-slider.less';

const Slider = RCSlider.createSliderWithTooltip(RCSlider)

const SCALE_MIN = 0.1
const SCALE_MAX = 3

const WINDOW_OBJECT = window

const _stopPropagation = function (e) {
  e.stopPropagation()
  e.nativeEvent.stopImmediatePropagation()
}

const _isArrayValid = arr => Array.isArray(arr) && arr.length > 0

const DataViewItemDetail = createReactClass({
  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    onChangeLayoutVisibility: PropTypes.func,
    params: PropTypes.object,
    actions: PropTypes.object
  },

  contextTypes: {
    router: PropTypes.object.isRequired
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
        layer: true,                                // 图层面板是否显示
        config: true                                // 设置面板是否显示
      }
    }
  },

  componentDidMount() {
    const { params, actions, onChangeLayoutVisibility } = this.props
    // 布局的隐藏
    onChangeLayoutVisibility({
      hidePageHeader: true,  // 头部
      hideSideMenu: true     // 左侧菜单
    })
    // 如果进入的是上次的报告
    this._getDashboardData(params.kanban_id)

    this._handleKeyDown = this.handleKeyDown

    this._handleKeyUp = this.handleKeyUp

    document.addEventListener('keydown', this._handleKeyDown)
    document.addEventListener('keyup', this._handleKeyUp)
    // 更新数据集
    actions.fetchDataset()
  },

  componentWillReceiveProps(newProps) {
    const { params, chartList, gridLayout } = newProps
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
    // 仅移动端需要处理 grid发生变化时自适应画布高度
    if (_.get(this.state.currDashboardData, 'platform', 'pc') === 'mobile') {
      const nextGridLayout = gridLayout[params.kanban_id]
      const currGridLayout = this.props.gridLayout[params.kanban_id]
      if (Array.isArray(nextGridLayout) && !_.isEqual(nextGridLayout, currGridLayout)) {
        this._mobileHeightFit(nextGridLayout)
      }
    }
  },

  componentWillUnmount() {
    document.removeEventListener('keydown', this._handleKeyDown)
    document.removeEventListener('keyup', this._handleKeyUp)
  },

  componentDidUpdate() {
    this._updateDesignBoxPadding()
  },

  render() {
    const { dashboardPending, chartPending } = this.props
    const { currDashboardData, designScale, panelVisible, } = this.state

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
          {this.renderLayerManager()}
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

  // 渲染顶部导航
  renderFixedNav() {
    // 右侧按钮
    const rightBtns = [
      { text: '预览', icon: 'dmpicon-full', func: this.handleGoPreview },
      { text: '保存', icon: 'dmpicon-save', func: this.handleGoBackList }
    ]
    return (
      <FixedTopNav onBack={this.handleGoBackList}>
        <ChartTypeNav
          onGoAddSection={this.handleGoAddSection}
          onAddChart={this.handleAddChart}
        />
        <div className="nav-right-container nav-btn-container">
          {
            rightBtns.map((item, index) => (
              <IconButton
                key={`fixed-top-nav-right-btn-${index}`}
                isNavBar={true}
                onClick={item.func}
                className="nav-right-btn fixed-top-nav-btn"
                iconClass={item.icon}
              >
                {item.text}
              </IconButton>
            ))
          }
        </div>
      </FixedTopNav>
    )
  },

  // 渲染报告
  renderDashboard() {
    const { params, dataReportPending, chartList, dataSetTree } = this.props
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
      onEdit: this.handleEditSection,
      onDelete: this.handleDeleteSection,
      onDatasetChange: this.handleDiagramDatasetChange
    }
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    const diagramList = chartList[currDashboardData.id]
    //获取所有单图使用的数据集列表
    const sourceList = []
    diagramList && diagramList.forEach((item) => {
      if (sourceList.indexOf(item.source) === -1 && item.source) {
        sourceList.push(item.source)
      }
    })
    return (
      <Dashboard
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
        diagramList={diagramList}
        sourceList={sourceList}
        dataSetTree={dataSetTree}
      />
    )
  },

  renderLayerManager() {
    const { gridLayout, chartList, params } = this.props
    const { currDashboardData, selectedDiagrams } = this.state
    return <div className="design-left-wrapper">
      <div>
        <ChartLayerManager
          selectedDiagrams={selectedDiagrams}
          diagramList={chartList[currDashboardData.id]}
          onSelectChart={this.handleDiagramClick}
          onUpdateGridLayout={this.handleUpdateLayout}
          onHoverDiagram={this.setHoverDiagram}
          gridLayout={gridLayout[params.kanban_id]}
          onDeleteSelectedDiagrams={this.handleDeleteSection}
          onChangeLayerName={this.handleChangeLayerName}
        />
      </div>
      <span className="switch-item switch-for-zindex dmpicon-double-arrow-left"
        onClick={this.handleTogglePanel.bind(this, 'layer')}
      />
    </div>
  },

  // 渲染设计面板
  renderDesignPanel() {
    const { gridLayout, diagramLayouts, diagramDatasets, actions, params, items, chartList, reportDatasetsId, dashboardTabData } = this.props
    const { selectedDiagrams, currDashboardData } = this.state
    const layoutOpts = getDashboardLayoutOptions(currDashboardData)
    const { layout } = layoutOpts
    const currChart = (selectedDiagrams.length === 1) ? selectedDiagrams[0] : null
    let throughChart = null
    let chartData = []
    let diagramLayout = null
    let diagramDataset = null
    // 当前单图的chart_code
    let currChartCode = ''
    if (currChart) {
      currChartCode = currChart.chart_code
      diagramLayout = _.cloneDeep(diagramLayouts[currChart.id])
      diagramDataset = _.cloneDeep(diagramDatasets[currChart.id])
      // 判断是否items中存在数据
      if (_.get(items, currChart.id)) {
        const chartItem = items[currChart.id]
        // 取得chartData
        chartData = chartItem.chart_data
        // 判断是否有穿透 必须在有currChart和items的前提下
        if (_isArrayValid(currChart.penetrates) && chartItem.through_index > 0) {
          throughChart = currChart.penetrates[chartItem.through_index - 1]
          throughChart.through_index = chartItem.through_index
          currChartCode = throughChart.chart_code
          diagramLayout = diagramLayouts[throughChart.id]
          diagramDataset = diagramDatasets[throughChart.id]
        }
      }
    }
    
    const currGridLayout = _.cloneDeep(gridLayout[params.kanban_id])
    //2018.1.9新增 报告配置默认数据集为第一张单图对应数据集
    const diagramList = chartList[currDashboardData.id]
    let reportDatasetId = ''
    if (reportDatasetsId) {
      reportDatasetId = reportDatasetsId
    } else if (_isArrayValid(diagramList)) {
      diagramList.every((dia) => {
        if (dia.source) {
          reportDatasetId = dia.source
          return false
        }
        return true
      })
    }

    return (
      <div className="dataview-design-container"
        onKeyDown={_stopPropagation}
        onKeyUp={_stopPropagation}
      >
        <DiagramConfig
          dashboardId={currDashboardData.id}
          diagramList={diagramList}
          dashboardTabData={_.cloneDeep(dashboardTabData)}
          chart={currChart}
          throughChart={throughChart}
          chart_code={currChartCode}
          chartData={chartData}
          diagramLayout={diagramLayout}
          diagramDataset={diagramDataset}
          gridLayout={currGridLayout}
          diagramContainer={this.kanbanSizeContainer}
          onConfigDataChange={this.handleDiagramConfigChange}
          onDatasetChange={this.handleDiagramDatasetChange}
          onUpdateGridLayout={this.handleUpdateLayout}
          onUpload={actions.fetchUploadImage}
          onChange={this.handleDiagramChange}
          onChangeColorTheme={this.handleChangeColorTheme}
          onGoEditChart={this.handleEditSection}
          showSucc={this.showSucc}
          showErr={this.showErr}
        />
        <LayoutConfigPanel
          dashboardId={currDashboardData.id}
          show={selectedDiagrams.length === 0}
          reportDatasetId={reportDatasetId}
          diagramList={_.cloneDeep(diagramList)}
          gridLayout={currGridLayout}
          onConfirmChange={this.handleSelectorChangeConfirm}
          onChangeSelector={this.handleChangeSelector}
          onReportDataSetChange={this.handleReportDatasetChange}
          dashboardData={currDashboardData}
          onUpload={actions.fetchUploadImage}
          onChange={this.handleChangeLayoutOptions}
          onScreenshot={this.handleScreenshot}
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
    const { actions, params, gridLayout } = this.props
    // 记录下旧的布局 在保存失败时回滚使用
    const oldLayouts = _.cloneDeep(gridLayout[params.kanban_id])
    const _layouts = this._getLayouts(layouts)
    if (layouts.length > 0) {
      // 提交到本地
      actions.updateGridLayout({
        id: params.kanban_id,
        gridLayout: layouts
      })
      // 提交到服务器
      actions.fetchUpdateGridLayout({
        layouts: _layouts
      }, (json) => {
        if (!json.result) {
          this.showErr(json.msg || '操作失败')
          actions.updateGridLayout({
            id: params.kanban_id,
            gridLayout: oldLayouts
          })
        }
      });
    }
  },

  // 修改配色方案
  handleChangeColorTheme(throughChartId, colorTheme) {
    const { actions, params } = this.props
    const { selectedDiagrams } = this.state
    const currDiagram = selectedDiagrams[0]
    const currChartId = throughChartId || currDiagram.id
    // 提交到本地
    actions.updateChartLayout({
      dashboard_id: params.kanban_id,
      chart_id: currChartId,
      chart_code: currDiagram.chart_code,
      colorTheme
    })
    // 提交到服务器
    actions.fetchUpdateChartConfig({
      dashboard_id: params.kanban_id,
      id: currChartId,
      colours: [{
        colour_content: JSON.stringify(colorTheme),
        dashboard_chart_id: currChartId
      }]
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '操作失败')
      }
    })
  },

  // diagram 设置保存(auto save) 未迁移的单图使用
  handleDiagramChange(options, needRefresh) {
    const { actions, params, items } = this.props
    const { selectedDiagrams } = this.state
    const opts = _.cloneDeep(options)

    const currDiagram = selectedDiagrams[0]
    const currChartId = opts.throughChartId ? opts.throughChartId : currDiagram.id
    const topChartId = currDiagram.id

    const marklines = []
    let display_item = null

    // 如果 x
    if (_.get(opts, 'data.x.markline')) {
      opts.data.x.markline.data.forEach((item) => {
        marklines.push({
          ...item,
          axis_type: '1'
        })
      })
    }
    // 如果 y
    if (_.get(opts, 'data.y.markline')) {
      opts.data.y.markline.data.forEach((item) => {
        marklines.push({
          ...item,
          axis_type: '1'
        })
      })
    }

    // 如果 z
    if (_.get(opts, 'data.z.markline')) {
      opts.data.z.markline.data.forEach((item) => {
        marklines.push({
          ...item,
          axis_type: '2'
        })
      })
    }
    // 如果存在displayItem, displayItem需要给后台传默认值, 如果没有dataSeries则去掉display_item
    if (_.get(opts, 'data.dataSeries.displayItem')) {
      if (opts.data.dataSeries.displayItem.checked) {
        display_item = {
          top_head: opts.data.dataSeries.displayItem.type === '前' ? opts.data.dataSeries.displayItem.value : '',
          top_tail: opts.data.dataSeries.displayItem.type === '后' ? opts.data.dataSeries.displayItem.value : ''
        }
      } else {
        display_item = {
          top_head: '',
          top_tail: ''
        }
      }
    }
    const displayItemStr = display_item ? JSON.stringify(display_item) : null
    // 进行提交到本地
    actions.updateChartLayout({
      dashboard_id: params.kanban_id,
      chart_id: currChartId,
      layout_extend: opts.data,
      chart_code: currDiagram.chart_code,
      display_item: displayItemStr,
      marklines,
      topChartId
    })
    // 提交到服务器
    actions.fetchUpdateChartConfig({
      dashboard_id: params.kanban_id,
      id: currChartId,
      layout_extend: opts.data ? JSON.stringify(opts.data) : opts.data,
      display_item: displayItemStr,
      marklines
    }, (json) => {
      // 保存成功后 如果需要刷新的话
      if (json.result && needRefresh) {
        const throughChartItem = _.get(items, topChartId)
        // 如果是穿透的情况
        if (currChartId !== topChartId && throughChartItem) {
          actions.fetchChartThroughData({
            params: {
              ...throughChartItem.apiParams,
              display_item: displayItemStr,
              dashboard_id: params.kanban_id,
            },
            through_index: throughChartItem.through_index,
            chartId: topChartId
          })
        } else {
          actions.fetchChartItemData({ id: topChartId, dashboard_id: params.kanban_id })
        }
      } else if (!json.result) {
        this.showErr(json.msg || '操作失败')
      }
    })
  },

  // 图表编辑属性修改
  handleDiagramConfigChange(config, needRefresh) {
    const { actions, params, items } = this.props
    const { selectedDiagrams } = this.state
    const opts = _.cloneDeep(config)
    const currDiagram = selectedDiagrams[0]
    const currChartId = opts.throughChartId ? opts.throughChartId : currDiagram.id
    const topChartId = currDiagram.id

    const scopeConfig = opts && opts.data && getCustomScopeConfig(opts.data)
    const { xMarkline, yMarkline, zMarkline } = scopeConfig || {}
    // 系统字段
    const marklines = []
    // const display_item = null
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
    // const display_item = null
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
    // 提交到服务器
    actions.fetchUpdateChartConfig({
      dashboard_id: params.kanban_id,
      id: currChartId,
      config: opts.data ? JSON.stringify(opts.data) : opts.data,
      // display_item: display_item ? JSON.stringify(display_item) : null,
      marklines
    }, (json) => {
      // 保存成功后 如果需要刷新的话
      if (json.result && needRefresh) {
        const throughChartItem = _.get(items, topChartId)
        // 如果是穿透的情况
        if (currChartId !== topChartId && throughChartItem) {
          actions.fetchChartThroughData({
            params: {
              ...throughChartItem.apiParams,
              // display_item: display_item ? JSON.stringify(display_item) : null
            },
            through_index: throughChartItem.through_index,
            chartId: topChartId
          })
        } else {
          actions.fetchChartItemData({ id: topChartId, dashboard_id: params.kanban_id })
        }
      } else if (!json.result) {
        this.showErr(json.msg || '操作失败')
      }
    })
  },

  // 报告筛选数据集
  handleReportDatasetChange(key, config) {
    const { actions } = this.props
    if (key === 'source') {
      // 提交到本地
      actions.updateReportDatasetConfig({
        sourceId: config
      })
    } else if (key === 'selectors') {
      this.setState({
        currDashboardData: {
          ...this.state.currDashboardData,
          dashboard_filters: config
        }
      })
    }
  },

  // 数据集
  handleDiagramDatasetChange(dataSetConfig, through_index) {
    const { diagramDatasets, actions, params } = this.props
    const { chart, throughChart, ...otherDataSetConfig } = dataSetConfig
    const dataSetOpts = _.cloneDeep(otherDataSetConfig)
    const currThroughIndex = through_index || 0
    let dataSet = _.get(dataSetOpts, 'dataSet')
    //更新前同步筛选器的改动到穿透图层里
    if (_isArrayValid(dataSet.filters) && _isArrayValid(dataSet.penetrates)) {
      dataSet.penetrates.forEach((layer) => {
        layer.filters = dataSet.filters
      })
    }
    // 提交到本地
    actions.updateDatasetConfig({
      chart,
      throughChart,
      chart_id: dataSetOpts.chart_id,
      through_index: currThroughIndex,
      dataSet: {
        ...dataSet,
        dashboard_id: params.kanban_id
      }
    })
    // 如果修改子级穿透数据集，则修改当前父级图表的数据集
    if (throughChart && chart) {
      const chartDataSet = _.get(diagramDatasets, [chart.id, 'dataSet'])
      let { penetrates } = chartDataSet
      if (_isArrayValid(penetrates)) {
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
      through_index: currThroughIndex
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  // 切换选中的单图
  handleDiagramClick(diagram, toggle) {
    const { selectedDiagrams } = this.state
    // 清空
    if (!diagram) {
      if (_isArrayValid(selectedDiagrams)) {
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
  // 2018.3.7 调整了参数 仅传入一个object
  handleChangeLayoutOptions(options) {
    this.setState((preState) => {
      const newData = _.cloneDeep(preState.currDashboardData)
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
    }, () => {
      const { params, actions } = this.props
      const layoutOpts = getDashboardLayoutOptions(this.state.currDashboardData);
      // 更新layout设置
      actions.fetchUpdateDashboardLayout({
        id: params.kanban_id,
        ...layoutOpts
      }, (json) => {
        if (!json.result) {
          this.showErr(json.msg || '操作失败')
        }
      })
    })
  },

  //由自定义联动改为全局联动
  handleSelectorChangeConfirm(callback) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定设置为全局联动吗？</span>,
      content: '此项操作会清空自定义联动选项，我已知晓并确认风险',
      ok: () => {
        callback()
      }
    })
  },

  // 联动设置
  handleChangeSelector(type, value) {
    this.setState({
      currDashboardData: {
        ...this.state.currDashboardData,
        type_selector: type === 'custom' ? 1 : 0,
        selectors: type === 'custom' ? value : {}
      }
    }, () => {
      const { params, actions } = this.props
      const layoutOpts = getDashboardLayoutOptions(this.state.currDashboardData);
      // 更新layout设置
      actions.fetchUpdateDashboardLayout({
        id: params.kanban_id,
        ...layoutOpts
      }, (json) => {
        if (!json.result) {
          this.showErr(json.msg || '操作失败')
        }
      })
    })
  },

  // 跳转到预览
  handleGoPreview() {
    const { params } = this.props
    const path = `/dataview/preview/${params.kanban_id}`
    WINDOW_OBJECT.open(path, '_blank')
  },

  // 跳转到报告列表
  handleGoBackList() {
    this.context.router.push(`${baseAlias}/dataview/${this.props.params.folderId}`);
  },

  // 跳转到新增单图页面
  handleGoAddSection() {
    const { params } = this.props
    const kanbanName = encodeURIComponent(params.kanban_name)
    this.context.router.push(`${baseAlias}/dataview/chart/${params.folderId}/${params.kanban_id}/${kanbanName}/add`);
  },

  // 编辑单图
  handleEditSection(serial, data) {
    const { params } = this.props
    const kanbanName = encodeURIComponent(params.kanban_name)
    const chartName = encodeURIComponent(data.name)
    const path = `${baseAlias}/dataview/chart/${params.folderId}/${params.kanban_id}/${kanbanName}/add/${data.id}/${chartName}`;
    rememberEditID(data.id)
    this.context.router.push(path);
  },

  // 修改单图名称
  handleChangeLayerName(chart, name, callback) {
    const { params, actions } = this.props
    actions.fetchSaveChartName({
      dashboard_id: params.kanban_id,
      id: chart.id,
      name
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.showSucc(json.msg || '修改成功')
        callback && callback()
      }
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

  // 调整图表尺寸位置
  handleDiagramCoord: _.debounce(function (keycode) {
    const { params, gridLayout } = this.props
    const { selectedDiagrams } = this.state

    const currGridLayout = gridLayout && gridLayout[params.kanban_id]
    const layouts = currGridLayout && currGridLayout.map((layout) => {
      const { x, y } = layout
      if (selectedDiagrams.find(diagram => diagram.id === layout.i)) {
        return {
          ...layout,
          x: keycode === 37 ? x - 1 : keycode === 39 ? x + 1 : x,
          y: keycode === 38 ? y - 1 : keycode === 40 ? y + 1 : y
        }
      }
      return layout
    })

    this.handleUpdateLayout(layouts)
  }, 250),

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

  // 截取报告图片(auto save)
  handleScreenshot(start, succ, failure) {
    const { params, actions } = this.props
    const id = params.kanban_id
    const { fetchUploadImage } = actions
    // 定义上传方法
    const uploadFunc = (blob) => {
      const formData = new FormData();
      formData.append('image_file', blob, `dashboard-cover-${id}.jpg`)
      // 上传图片
      fetchUploadImage(formData, (json) => {
        if (json.result) {
          succ(json.data)
          this.setState({
            currDashboardData: {
              ...this.state.currDashboardData,
              cover: json.data
            }
          })
          actions.fetchUpdateDashboardLayout({
            ...getDashboardLayoutOptions(this.state.currDashboardData),
            id: params.kanban_id,
            cover: json.data
          })
        } else {
          failure()
          this.showErr(json.msg)
        }
      })
    }
    // 先将画布自适应
    this.handleScaleFitToView(() => {
      setTimeout(() => {
        const { designScale } = this.state;
        // 先隐藏网格线
        const dom = $('#dataview-design-box') //eslint-disable-line
        dom.addClass('dashboard-cover-taking')
        // 开始 添加pending
        start()
        // 利用html2canvas库进行转换
        html2canvas(document.getElementById('dataview-design-box'), {
          // 将比例固定为1（避免mac双倍屏自动将截图区域扩大）
          scale: 1,
          // 指定真实尺寸（dom的宽高 * 缩放比例）
          width: dom.width() * designScale,
          height: dom.height() * designScale
        }).then((canvas) => {
          dom.removeClass('dashboard-cover-taking')
          if (typeof canvas.toBlob === 'function') {
            // 利用canvas自身的转Blob对象方法
            canvas.toBlob(uploadFunc, 'image/jpeg');
          } else {
            // 将canvas转换为DataUrl
            const imageData = canvas.toDataURL('image/jpeg', 0.8)
            // 将去掉DataUrl头部的数据转换为blob
            const imageByte = window.atob(imageData.replace(/^data:image\/jpeg;base64,/, ''))
            const len = imageByte.length
            const arr = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              arr[i] = imageByte.charCodeAt(i)
            }
            const blob = new Blob([arr], { type: 'image/jpeg' })
            uploadFunc(blob)
          }
        })
      }, 1000)
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

  // 移动端自适应高度
  _mobileHeightFit(layouts) {
    const { currDashboardData } = this.state
    // 如果是移动端应用 实时计算画布高度并回填
    if (currDashboardData.platform === 'mobile') {
      const maxHeight = Math.max(...layouts.map(pos => ((+pos.y) + (+pos.h) + 4)))
      // 如果高度发生了变化
      if (maxHeight !== _.get(currDashboardData, 'layout.height')) {
        // 更新到报告layout
        this.handleChangeLayoutOptions({
          layout: {
            height: maxHeight <= 500 ? 500 : maxHeight
          }
        })
      }
    }
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

  // 获取报告详情
  _getDashboardData(id) {
    this.props.actions.fetchDashboardData(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '报告数据获取失败');
      } else {
        this.setState({
          currDashboardData: json.data || getDashboardLayoutOptions()
        })
        // 自动设置到auto scale
        this.handleScaleFitToView()
      }
    });
  },

  _getMaxZindex() {
    const { gridLayout } = this.props
    const zList = gridLayout.map(layout => (layout.z))
    return Math.max.apply(null, zList)
  },

  handleKeyDown(e) {
    if (document.body.classList.contains('dialog-open')) {
      return
    }
    // 兼容苹果command
    const isCommand = (navigator.appVersion.indexOf('Mac') !== -1) && (e.keyCode === 91 || e.keyCode === 93)
    if (e.keyCode === 17 || isCommand) {
      this._ctrlkeyDown = true
    }
    switch (e.keyCode) {
      /* 这一部分与上面的if重复了
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
        break */
      // delete backspace
      case 46:
      case 8:
        this.handleDeleteSection()
        break
      case 37:
      case 38:
      case 39:
      case 40:
        this.handleDiagramCoord(e.keyCode)
        break;
      default:
        break
    }
  },

  handleKeyUp(e) {
    // 兼容苹果command
    const isCommand = (navigator.appVersion.indexOf('Mac') !== -1) && (e.keyCode === 91 || e.keyCode === 93)
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
  actions: bindActionCreators(Object.assign({}, commonActionCreators, itemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataViewItemDetail);
