import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import FreeLayout from './FreeLayout';
import DiagramSection from './DiagramSection';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail';

import classnames from 'classnames';
import _ from 'lodash';
import { getMaxZindex, getRandomPosition, getDashboardBackgroundStyle, getCsvDataUrl } from '@helpers/dashboardUtils';
import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin'
import preLoadImages from '@helpers/preLoadImages'

import { GRID_MARGIN, SIMPLE_TYPES, FILTER_TYPES } from '@constants/dashboard';
import './dashboard.less';

// 加载自定义图表
import loadCustomChart from '@helpers/loadCustomChart'

const getDisplayObj = (str) => {
  const displayItem = str ? JSON.parse(str) : null

  let displayItemObj = {
    show: false,
    type: '前',
    value: ''
  }
  if (displayItem && (displayItem.top_head || displayItem.top_tail)) {
    displayItemObj = {
      show: true,
      type: displayItem.top_head ? '前' : '后',
      value: displayItem.top_head ? displayItem.top_head : displayItem.top_tail
    }
  }
  return displayItemObj
}

const getFuncConfig = (_item, targetPercent) => ({
  markLine: _item.marklines,
  thumbnail: !!(+_item.thumbnail),
  thumbnail_value: _item.thumbnail_value ? JSON.parse(_item.thumbnail_value) : null,
  autoRefresh: _item.refresh_rate && JSON.parse(_item.refresh_rate),
  gaugeTargetValue: targetPercent && targetPercent.desired_value ? targetPercent.desired_value : _item.desired_value,
  gaugePercent: targetPercent && targetPercent.percentage ? targetPercent.percentage : _item.percentage,
  display_item: getDisplayObj(_item.display_item),
  pieEmpty: +_item.style_type,
})

// 获取所有因tab筛选隐藏的单图
const getHiddenChartsByTab = (dashboardTabData) => {
  let hiddenCharts = []
  const hiddenTabs = []
  const allSimpleTabKeys = _.keys(dashboardTabData)
  _.values(dashboardTabData).forEach((tabItem) => {
    if (Array.isArray(tabItem.data) && tabItem.data.length > 0) {
      const currHiddens = _.concat(..._.filter(tabItem.data, (charts, i) => {
        if (i !== (tabItem.active || 0)) {
          Array.isArray(charts) && charts.forEach((id) => {
            // 判断这个隐藏的是否为tab
            if (allSimpleTabKeys.indexOf(id) > -1) {
              hiddenTabs.push(id)
            }
          })
          return true
        }
        return false
      }))
      hiddenCharts = _.concat(hiddenCharts, currHiddens)
    }
  })
  // 将隐藏的tab中激活的chart也加入
  hiddenTabs.forEach((key) => {
    const tab = _.get(dashboardTabData, key)
    if (tab) {
      hiddenCharts = _.concat(hiddenCharts, tab.data[tab.active])
    }
  })

  return _.uniq(hiddenCharts)
}

const Dashboard = createReactClass({
  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    uuid: PropTypes.number.isRequired,
    dashboardId: PropTypes.string,
    dataviewId: PropTypes.string.isRequired,
    actions: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
    editable: PropTypes.bool,              // 是否处于编辑模式下(即ItemDetail组件中)
    layoutOptions: PropTypes.object,
    events: PropTypes.object,
    echartsScaleRate: PropTypes.number,
    selectedItems: PropTypes.array,
    onUpdateLayout: PropTypes.func,
    onSelectItem: PropTypes.func,
    hoverDiagram: PropTypes.object,
    isShareView: PropTypes.bool,
    tenantCode: PropTypes.string,
    viewPass: PropTypes.string,
    urlJson: PropTypes.array,              // json用于报告跳转后筛选本报告
    diagramList: PropTypes.array,
    sourceList: PropTypes.array,
    dataSetTree: PropTypes.array,
    platform: PropTypes.string
  },

  getDefaultProps() {
    return {
      uuid: new Date().getTime(),
      editable: false,
      layoutOptions: {
        layout: {},
        background: {},
        selector: {}
      },
      events: {},
      selectedItems: [],
      platform: 'pc'
    };
  },

  getInitialState() {
    return {
      loaded: false,
      selector_container: {},       // 单图筛选与数据集绑定, update by caocj 2017-07-13
      selectorList: {},             // 存储下拉项
      selectorConditions: {},       // 存储下拉筛选条件
      filterConditions: {},         // 存储所有筛选器筛选条件
      clearSelect: true,            // 清空单图联动的状态,全屏时不清空
      currentId: {},                // 每个数据集正在联动的单图
    }
  },

  componentDidMount() {
    const { dataviewId, dashboardId, isShareView } = this.props
    if (dataviewId) {
      // console.log('dashboard----did mount', isShareView, dataviewId, dashboardId)
      this.setState({ loaded: false })
      this._getChartList(dataviewId, dashboardId, isShareView)
    }
  },

  componentWillReceiveProps(nextProps) {
    const { chartList, dataviewId } = nextProps
    if (this.props.uuid !== nextProps.uuid && Array.isArray(chartList[dataviewId])) {
      chartList[dataviewId].forEach((item) => {
        if (this[`diagram-section_${item.id}`]) {
          this[`diagram-section_${item.id}`].resetThroughActive()
        }
      })
    }

    if (this.props.dataviewId !== nextProps.dataviewId || this.props.dashboardId !== nextProps.dashboardId || (nextProps.reload && nextProps.reload !== this.props.reload)) {
      //清空筛选状态
      this.setState({
        loaded: false,
        selector_container: {},       // 单图筛选与数据集绑定, update by caocj 2017-07-13
        selectorList: {},             // 存储下拉项
        selectorConditions: {},       // 存储拉下筛选条件
        filterConditions: {},         // 存储所有筛选器筛选条件
        clearSelect: true,            // 清空单图联动的状态
        currentId: {},                // 每个数据集正在联动的单图
      })
      this._getChartList(nextProps.dataviewId, nextProps.dashboardId, nextProps.isShareView)
    }
  },
  componentWillUnmount() {
    // console.log('dashboard unmount will')
    this.props.actions.clearChartThroughIndex()
  },

  render() {
    const { editable, layoutOptions, chartList, dataviewId, platform } = this.props;
    // 设计相关
    const containerStyle = {
      ...this.STYLE_SHEET.conatiner,
      ...getDashboardBackgroundStyle(layoutOptions.background)
    }
    const hasValidView = Array.isArray(chartList[dataviewId]) && chartList[dataviewId].length > 0

    const dashboardContainerClass = classnames('dashboard-for-view-container', {
      loaded: hasValidView,
      editing: editable
    });

    return (
      <div className={dashboardContainerClass}
        id="dashboard-for-view-container"
        style={containerStyle}
        onClick={platform === 'pc' ? this.handleSelectItem.bind(this, null) : null}
      >
        {
          hasValidView ? (
            <FreeLayout
              className="diagram-list"
              margin={[GRID_MARGIN, GRID_MARGIN]}
              onLayoutChange={platform === 'pc' ? this.handleGridLayoutChange : null}
              unChangable={platform !== 'pc'}
            >
              {this.renderSectionItems()}
            </FreeLayout>
          ) : null
        }
      </div>
    )
  },

  // 渲染单图
  renderSectionItems() {
    const {
      items,
      editable,
      echartsScaleRate,
      selectedItems,
      chartList,
      dataviewId,
      gridLayout,
      diagramLayouts,
      diagramDatasets,
      hoverDiagram,
      dashboardTabData,
      dashboardName,
      diagramList,
      sourceList,
      isdevtools,
      platform
    } = this.props
    const { loaded, selectorConditions, filterConditions, selectorList, currentId, clearSelect } = this.state
    // 得到当前报告的gridLayout
    const currGridLayout = gridLayout[dataviewId]
    // 组织事件
    const _events = this._getEvents()
    // 计算单图数量
    const chartNum = Array.isArray(chartList[dataviewId]) ? chartList[dataviewId].length : 0
    // 如果没有单图、没有准备好、girdLayout数组没准备好或长度不等 都返回null
    if (!chartNum || !loaded || !Array.isArray(currGridLayout) || currGridLayout.length !== chartNum) {
      return null
    }

    // 获取所有因tab筛选隐藏的单图
    const hiddenChartsByTab = getHiddenChartsByTab(dashboardTabData)

    return chartList[dataviewId].map((item, index) => {
      // 隐藏
      const isHidden = hiddenChartsByTab.indexOf(item.id) > -1
      // 是否为简单单图
      const isSimple = SIMPLE_TYPES.indexOf(item.chart_code) > -1 || item.chart_type === 'auxiliary'
      // 对item进行处理
      const _item = this._transformChartData(_.cloneDeep(item), items, selectorConditions, selectorList, isSimple, filterConditions);
      if (item.chart_code === 'simple_tab') {
        // 如果是simple_tab的情况 拼接数据
        _item.chart_data = _.cloneDeep(dashboardTabData[item.id]) || {}
      }

      const chartData = _.cloneDeep(_item)

      // 选中样式相关
      const hasSelectedItem = Array.isArray(selectedItems) && selectedItems.length > 0
      const isSelected = !!selectedItems.find(sitem => sitem.id === item.id)
      const diagramClass = classnames('diagram-item-container', {
        unselected: hasSelectedItem && !isSelected,
        selected: isSelected,
        hover: hoverDiagram === item,
        'hidden-by-tab': isHidden
      });

      let layout_extend
      let chart_config
      let colorTheme
      let targetPercent

      if (diagramLayouts[_item.id]) {
        ({ layout_extend, chart_config, colorTheme, targetPercent } = diagramLayouts[_item.id])
      } else {
        layout_extend = {}
        chart_config = []
        colorTheme = null
        targetPercent = null
      }

      // 如果有穿透的层级(从penetrates中copy需要的属性)
      if (_item.through_index > 0) {
        // 获得穿透的那个item
        const throughItem = _item.penetrates[_item.through_index - 1]
        if (throughItem) {
          if (diagramLayouts[throughItem.id]) {
            ({ layout_extend, chart_config, colorTheme, targetPercent } = diagramLayouts[throughItem.id])
          }
          // copy
          _item.chart_code = throughItem.chart_code
          _item.colours = throughItem.colours
          _item.dims = throughItem.dims
          _item.display_item = throughItem.display_item
          _item.desired_value = throughItem.desired_value
          _item.nums = throughItem.nums
          _item.percentage = throughItem.percentage
          _item.style_type = throughItem.style_type
          _item.thumbnail = throughItem.thumbnail
          _item.thumbnail_value = throughItem.thumbnail_value
          _item.refresh_rate = throughItem.refresh_rate
          _item.sort_method = throughItem.sort_method
          _item.desires = throughItem.desires
          _item.zaxis = throughItem.zaxis
        }
      }
      // 功能配置, 样式配置等
      const funcConfig = getFuncConfig(_item, targetPercent);
      // 位置配置
      const dataGrid = currGridLayout[index]
      // 每个单图使用的缩放比例
      // let chartScale = echartsScaleRate
      // // 处理echart单图的缩放
      // if (this.NO_SCALE_CHART_TYPES.indexOf(_item.chart_code) > -1) {
      //   dataGrid = {
      //     // 对位置、大小按照缩放比例进行重新计算
      //     ...dataGrid,
      //     x: ((+dataGrid.x + 4) * echartsScaleRate) - 4,
      //     y: ((+dataGrid.y + 4) * echartsScaleRate) - 4,
      //     w: dataGrid.w * echartsScaleRate,
      //     h: dataGrid.h * echartsScaleRate
      //   }
      //   chartScale = 1
      // }

      return (
        <div
          key={_item.id}
          className={diagramClass}
          style={{ zIndex: dataGrid.z }}
          ref={(instance) => {
            this[`diagram_item_container_${_item.id}`] = instance;
          }}
          data-draggable={isSelected}
          data-resizable={isSelected}
          data-grid={dataGrid}
          // data-scale={chartScale}
          i={_item.id}
          onClick={platform === 'pc' ? this.handleSelectItem.bind(this, item) : null}
        >
          <DiagramSection
            isdevtools={isdevtools}
            serial={index}
            chartRef={(instance) => { this[`diagram-section_${_item.id}`] = instance }}
            chartData={chartData}
            data={_item}
            chart_code={_item && _item.chart_code}
            diagramDatasets={diagramDatasets}
            diagramDataset={diagramDatasets && diagramDatasets[_item.id]}
            layoutExtend={layout_extend}
            chart_config={chart_config}
            colorTheme={colorTheme}
            dataGrid={dataGrid}
            pending={_item.pending}
            sort={_item.sort_method}
            id={_item.id}
            select_mode="show"
            func_config={funcConfig}
            currentId={currentId[_item.source]}
            defaultValue={_item.default_value}
            clearSelect={clearSelect}
            throughList={_item.layers}
            linkList={_item.filter_config}
            editable={editable}
            events={_events}
            echartsScaleRate={echartsScaleRate}
            dashboardName={dashboardName}
            onGetRelatedsource={this.getRelatedsource}
            diagramList={diagramList}
            sourceList={sourceList}
            isHidden={isHidden}
            platform={platform}
          />
          {
            isSelected && (
              <div className="crosshair"><i></i><i></i><i></i><i></i></div>
            )
          }
        </div>
      )
    })
  },

  handleDiagramConfigChange(config, chartId) {
    const { actions, dashboardId } = this.props
    // 保存到本地
    actions.updateChartLayout({
      dashboard_id: dashboardId,
      chart_id: chartId,
      chart_config: config,
    })
    // 保存到服务器
    actions.fetchUpdateChartConfig({
      dashboard_id: dashboardId,
      id: chartId,
      config: JSON.stringify(config)
    })
  },

  // 选中单图
  handleSelectItem(item, e) {
    const { onSelectItem } = this.props
    if (onSelectItem) {
      // 解决: 选中多个单图拖拽或者缩放的结束的时候 导致 只选择了缩放图的bug
      if (this._layoutJustChanged) {
        e && e.stopPropagation()
        this._layoutJustChanged = false
        return
      }
      if (item) {
        e && e.stopPropagation()
      }
      onSelectItem(item, e)
    }
  },

  // 布局变化的回调(auto save)
  handleGridLayoutChange(layout, i) {
    this._layoutJustChanged = true
    this.props.onUpdateLayout(layout)
    // 调用组件
    const el = this[`diagram-section_${i}`]
    //调整辅助线
    el.resetMarkline && el.resetMarkline()
  },

  // 重组chartData
  _transformChartData(_item, items, selectorConditions, selectorList, isSimple, filterConditions) {
    if (isSimple) {
      return _item
    }
    const dataItem = items ? items[_item.id] : null
    if (dataItem) {
      _item.chart_data = dataItem.chart_data
      _item.marklines = dataItem.marklines || _item.marklines || []
      _item.pending = dataItem.pending
      _item.through_index = dataItem.through_index
    } else {
      _item.chart_data = null
      _item.pending = true
    }
    //筛选、联动条件缓存
    if (FILTER_TYPES.indexOf(_item.chart_code) > -1) {
      _item.conditions = filterConditions[_item.id] ? filterConditions[_item.id][_item.id] : []
    } else {
      _item.conditions = selectorConditions[_item.source] ? selectorConditions[_item.source][_item.id] : []
    }
    // 如果是下拉组件做一次dataList整合
    if (_item.chart_code === 'select_filter' && selectorList[_item.id]) {
      // 解析key-value数组
      const currentKeys = Object.keys(selectorList[_item.id][0]);
      // 加入是否需要更新的标签
      if (Array.isArray(filterConditions[_item.id][_item.id])) {
        filterConditions[_item.id][_item.id].forEach((condition) => {
          // 如果处在condition的筛选条件中，代表该下拉框不需要更新
          currentKeys.forEach((key) => {
            if (key === condition.col_name && Array.isArray(_item.chart_data)) {
              // 赋值到chart_data中
              _item.chart_data[0][key] = selectorList[_item.id][0][key];
            }
          })
        })
      }
    }
    return _item;
  },

  // 整合筛选条件,chartList 为需要清空的单图筛选条件 2017-07-12新增source
  _combineConditions(conditions, key, chartList, dataSource) {
    const { selectorConditions } = this.state
    // 定位到数据集对应的conditions
    const data = selectorConditions[dataSource] ? selectorConditions[dataSource] : {}

    selectorConditions[dataSource][key] = conditions
    if (chartList && chartList.length > 0) {
      chartList.forEach((item) => {
        data[item] = []
      })
    }

    let conditionsArr = [];

    Object.getOwnPropertyNames(data).forEach((item) => {
      conditionsArr = conditionsArr.concat(data[item])
    });

    return conditionsArr
  },

  // （旧方法，弃用）
  // 下拉筛选 id为当前下拉筛选的ID,isSubmit为是否发起更新下拉的请求
  // _operaterSelector(conditions, id, type, dataList, isSubmit) {
  //   const { chartList, dataviewId } = this.props
  //   const { selectorList, selector_container, currentId } = this.state

  //   //缓存conditions和dataList
  //   selectorList[id] = dataList
  //   //筛选数据集 对应的其他单图
  //   const data = _.find(chartList[dataviewId], _item => (_item.id === id))
  //   //清空当前数据集单图筛选项
  //   currentId[data.source] = ''
  //   //单图列表
  //   const _chartList = selector_container[data.source]
  //   //筛选条件
  //   const conditionsArr = this._combineConditions(conditions, id, _chartList, data.source)

  //   //发起新的result请求
  //   if (isSubmit) {
  //     this._fetchChartItemData({
  //       chart_code: 'select_filter',
  //       id,
  //       conditions
  //     })
  //   }

  //   this.setState({
  //     clearSelect: true
  //   })

  //   if (Array.isArray(_chartList) && _chartList.length > 0) {
  //     _chartList.forEach((chart) => {
  //       this._fetchChartItemData({
  //         id: chart,
  //         conditions: conditionsArr
  //       }, () => {
  //         //对于穿透单图进行特殊处理
  //         if (this[`diagram-section_${chart}`]) {
  //           this[`diagram-section_${chart}`].resetThroughActive()
  //         }
  //       })
  //     })
  //   }
  // },

  // （旧方法，弃用）
  // 操作6种筛选单图、tab组件需要结合
  // _operaterFilter(conditions, id) {
  //   const { chartList, dataviewId } = this.props
  //   const { selector_container, currentId } = this.state;
  //   // 筛选数据集 对应的其他单图
  //   const data = _.find(chartList[dataviewId], item => (item.id === id));

  //   // 改变默认值
  //   if (data.chart_code === 'time_interval_filter' || data.chart_code === 'number_filter') {
  //     const index = _.findIndex(chartList[dataviewId], item => (item.id === id));
  //     const defaultValue = [];
  //     conditions.forEach((item) => {
  //       defaultValue.push(item.col_value);
  //     })
  //     chartList[dataviewId][index].default_value = defaultValue.toString()
  //   }
  //   // 清空当前数据集单图筛选项
  //   currentId[data.source] = ''
  //   // 单图列表
  //   const _chartList = selector_container[data.source];
  //   const connectOthers = Array.isArray(_chartList) && _chartList.length > 0
  //   this.setState({
  //     clearSelect: true
  //   })

  //   if (connectOthers) {
  //     _chartList.forEach((chart) => {
  //       const _conditions = this._combineConditions(conditions, id, _chartList, data.source)
  //       this._fetchChartItemData({
  //         id: chart,
  //         conditions: _conditions
  //       }, () => {
  //         // 对于穿透单图进行特殊处理
  //         if (this[`diagram-section_${chart}`]) {
  //           this[`diagram-section_${chart}`].resetThroughActive()
  //         }
  //       })
  //     })
  //   }
  // },

  // 单图联动
  _operaterChart(conditions, id, cb) {
    const { chartList, dataviewId, layoutOptions } = this.props
    const { selector_container, currentId } = this.state
    // 筛选数据集
    const data = _.find(chartList[dataviewId], item => (item.id === id));
    // 排除自己 和 不同数据
    const { type, selectors } = layoutOptions
    //selector_container[data.source]为同一数据集下所有单图
    let _chartList = []
    const globalList = _.filter(selector_container[data.source], item => (item !== id))
    if (type === 'global') {
      _chartList = globalList
    } else if (type === 'custom') {
      const customList = selectors[id]
      //取交集 因为删除单图后selectors并没有更新
      _chartList = _.intersection(customList, globalList)
    }

    // 是否存在联动单图
    const connectOthers = Array.isArray(_chartList) && _chartList.length > 0
    // 如果存在被联动单图才设置CurrentId设置当前数据集正在筛选的Id
    if (connectOthers) {
      currentId[data.source] = (conditions.length > 0) ? id : ''
      this.setState({
        clearSelect: false,
      })
    }
    if (!connectOthers && !currentId[data.source]) {
      this.setState({
        clearSelect: true,
      })
    }

    // 需要清空除自己以外的单图筛选
    if (connectOthers) {
      Promise.all(_chartList.map(chart => new Promise((resolve) => {
        const chartObj = {};
        const chartObject = _.find(chartList[dataviewId], item => (item.id === chart))
        const _conditions = this._combineConditions(conditions, id, _chartList, data.source)
        //添加filterConditions约束
        const filterConditions = this._generateFilterConditions(chartObject)
        this._fetchChartItemData({
          ...chartObj,
          id: chart,
          conditions: _conditions,
          filter_conditions: filterConditions
        }, () => {
          chartObj.pending = false
          //对于穿透单图进行特殊处理
          if (this[`diagram-section_${chart}`]) {
            this[`diagram-section_${chart}`].resetThroughActive()
          }
          resolve(true)
        })
      }))).then(() => {
        cb && cb(true)
      })
    } else {
      cb && cb(true)
    }
  },

  //穿透、refresh、fetchItemData等情况初始化condition
  _generateConditions(item, conditions) {
    const { layoutOptions } = this.props
    const { type, selectors } = layoutOptions
    let newConditions = []
    if (conditions) {
      Object.getOwnPropertyNames(conditions).forEach((i) => {
        //目前所有筛选器都是走filter_conditions
        //如果条件存在并且length> 0,但是如果是自定义联动 如果被联动图表中未勾选 需要过滤掉
        let isConcatCondition = true
        if (type === 'custom') {
          isConcatCondition = false
          Object.getOwnPropertyNames(selectors).forEach((s) => {
            if (selectors[s] && selectors[s].indexOf(item.id) > -1) {
              isConcatCondition = true
            }
          })
        }
        if (conditions[i] && isConcatCondition) {
          newConditions = newConditions.concat(conditions[i])
        }
      })
    }
    return newConditions
  },

  // 筛选器新增范围过后， 筛选通用触发方法
  _handleFilterChange(conditions, id, type, dataList, isSubmit, editable) {
    const { chartList, dataviewId } = this.props
    const { selectorList, filterConditions, selectorConditions } = this.state
    //筛选数据集 对应的其他单图
    const data = _.find(chartList[dataviewId], _item => (_item.id === id))
    // 单图列表
    const _chartList = data.filter_config ? data.filter_config.list : []
    // 暂时下拉筛选特殊处理
    if (type === 'select_filter') {
      //缓存conditions和dataList
      selectorList[id] = dataList
      if (!filterConditions[id]) {
        filterConditions[id] = {}
      }
      filterConditions[id][id] = conditions
      //发起新的result请求, select请求一定是同一数据集 所以延用老的condition
      if (isSubmit) {
        this._fetchChartItemData({
          chart_code: 'select_filter',
          id,
          conditions
        })
      }
    }
    const connectOthers = Array.isArray(_chartList) && _chartList.length > 0
    // 清空所有单图联动状态
    this.setState({
      clearSelect: true,
      currentId: {}
    })
    // 清空所有单图联动条件
    Object.getOwnPropertyNames(selectorConditions).forEach((c) => {
      Object.getOwnPropertyNames(selectorConditions[c]).forEach((chart) => {
        selectorConditions[c][chart] = []
      })
    })
    //如果是编辑状态(editable true)则不请求
    if (connectOthers && !editable) {
      _chartList.forEach((chart) => {
        const diagram = _.find(chartList[dataviewId], item => item.id === chart)
        if (diagram) {
          const convertedConditions = this._convertConditions(conditions, diagram, data)
          const _conditions = this._combineFilterConditions(convertedConditions, id, _chartList, chart)
          this._fetchChartItemData({
            id: chart,
            filter_conditions: _conditions
          }, () => {
            // 对于穿透单图进行特殊处理, 并单图联动清空筛选条件
            if (this[`diagram-section_${chart}`]) {
              this[`diagram-section_${chart}`].resetThroughActive(true)
            }
          })
        }
      })
    }
  },

  //转换conditions
  _convertConditions(conditions, diagram, filter) {
    let newConditions = []
    if (diagram && filter) {
      //如果是同一数据集则不用转换
      if (diagram.source === filter.source) {
        newConditions = conditions
      } else {
        //不同数据集取出已关联的状态并赋值
        let relations = {}
        if (filter.filter_config.relation) {
          relations = filter.filter_config.relation
        } else {
          try {
            relations = JSON.parse(filter.filter_config).relation
          } catch (e) {
            relations = {}
          }
        }
        conditions.forEach((item) => {
          const col = item.field_name
          const field_id = relations[col] && relations[col][diagram.source] ? relations[col][diagram.source].id : ''
          //只有存在关联关系才可以触发联动
          if (field_id) {
            const newItem = { ...item }
            newItem.field_id = field_id
            newConditions.push(newItem)
          }
        })
      }
    }
    return newConditions
  },

  //整合所有筛选器的condition 2018.2.2
  _combineFilterConditions(conditions, filter_id, chartList, chart_id) {
    const { filterConditions } = this.state
    // 给filterConditions中的筛选器赋值
    if (!filterConditions[filter_id]) {
      filterConditions[filter_id] = {}
    }
    filterConditions[filter_id][chart_id] = conditions

    let conditionsArr = [];

    Object.getOwnPropertyNames(filterConditions).forEach((item) => {
      //如果chart_id在筛选器filterCondtions内存在筛选条件，则拼接筛选条件
      conditionsArr = conditionsArr.concat(filterConditions[item][chart_id] || [])
    })
    return conditionsArr
  },

  //生成filter查询条件
  _generateFilterConditions(item) {
    const { filterConditions } = this.state
    let conditionsArr = []
    Object.getOwnPropertyNames(filterConditions).forEach((filter_id) => {
      //如果chart_id在筛选器filterCondtions内存在筛选条件，则拼接筛选条件
      conditionsArr = conditionsArr.concat(filterConditions[filter_id][item.id] || [])
    })
    return conditionsArr
  },

  // 获取穿透数据
  _fetchThroughData(itemIndex, active, value, mode, callback) {
    const { selectorConditions } = this.state
    const { dataviewId, chartList, actions, isShareView, tenantCode, urlJson, dashboardId } = this.props
    const item = chartList[dataviewId][itemIndex]
    let conditions = []
    //所有由筛选触发的穿透reset均不拼接condition
    conditions = this._generateConditions(item, selectorConditions[item.source])
    const filterConditions = this._generateFilterConditions(item)
    if (mode === 'in') {
      if (active === 0) {
        item.layers[active].col_value = value
      } else {
        item.layers[active - 1].col_value = value
      }
    }
    // 穿透的条件
    for (let i = 0; i < active; i++) {
      const dim = item.layers[i]
      conditions.push({
        col_name: dim.col_name,
        col_value: dim.col_value,
        operator: '=',
        dim
      })
    }
    const state = active > 0 ? { ...item.penetrates[active - 1] } : { ...item }
    let legendTheme
    try {
      legendTheme = JSON.parse(state.colours[0].colour_content)
    } catch (e) {
      legendTheme = null
    }
    //2017-09-27加上 display_item
    //2018-03-15加上zaxis和desires
    const data = {
      id: state.id,
      dashboard_id: dashboardId,
      dataset_id: state.source,
      chart_code: state.chart_code,
      dims: state.dims,
      nums: state.nums,
      filters: state.filters,
      desires: state.desires,
      zaxis: state.zaxis,
      display_item: state.display_item,
      filter_conditions: filterConditions,
      conditions,
      legendTheme,
      isShareView,
      tenantCode,
      urlJson
    }

    actions.fetchChartThroughData({
      params: data,
      through_index: active,
      chartId: item.id
    }, () => {
      typeof callback === 'function' && callback()
    })
  },

  // 重新获取数据, 如定时刷新
  _freshData(id, cb) {
    const { chartList, dataviewId, dashboardId, items, actions, urlJson } = this.props
    const { selectorConditions, currentId } = this.state
    if (!Array.isArray(chartList[dataviewId])) {
      return
    }
    const item = _.find(chartList[dataviewId], i => (i.id === id))
    if (item) {
      if (items[id] && items[id].through_index > 0) {
        const throughChartItem = items[id]
        actions.fetchChartThroughData({
          params: {
            ...throughChartItem.apiParams
          },
          through_index: throughChartItem.through_index,
          chartId: id,
          dashboard_id: dashboardId,
          urlJson
        }, (json) => {
          if (typeof cb === 'function') {
            cb(json)
          }
        })
      } else if (currentId[item.source] === id) {
        // 如果是当前需要刷新的单图在联动
        this._fetchChartItemData(item, (json) => {
          if (typeof cb === 'function') {
            cb(json)
          }
        })
      } else {
        let conditionsArr = [];
        let filterArr = []
        // 如果不是筛选单图 加上conditions
        if (FILTER_TYPES.indexOf(item.chart_code) === -1) {
          conditionsArr = this._generateConditions(item, selectorConditions[item.source])
          filterArr = this._generateFilterConditions(item)
        }
        this._fetchChartItemData({
          ...item,
          conditions: conditionsArr,
          filter_conditions: filterArr
        }, (json) => {
          if (typeof cb === 'function') {
            cb(json)
          }
        })
      }
    }
  },

  // 获取单图数据
  _fetchChartItemData(params, callback) {
    const { actions, isShareView, tenantCode, urlJson, dashboardId } = this.props
    actions.fetchChartItemData({
      ...params,
      isShareView,
      tenantCode,
      urlJson,
      dashboard_id: dashboardId
    }, callback)
  },

  // 获取单图数据(带联动)
  _fetchItemData(item) {
    const { selectorConditions } = this.state
    let conditionsArr = []
    let filterArr = []
    // 如果不是筛选单图 加上conditions
    if (FILTER_TYPES.indexOf(item.chart_code) === -1) {
      conditionsArr = this._generateConditions(item, selectorConditions[item.source])
      filterArr = this._generateFilterConditions(item)
    }
    // 改成promise，以设定单独完全加载状态
    return new Promise((resolve) => {
      this._fetchChartItemData({
        ...item,
        conditions: conditionsArr,
        filter_conditions: filterArr
      }, () => {
        resolve()
      })
    })
  },

  _preLoadCustomChartImages(customCharts) {
    const _images = []
    customCharts && customCharts.forEach((chart) => {
      try {
        const chartImageLayout = JSON.parse(chart.layout_extend)
        _images.push(chartImageLayout.image.url)
      } catch (error) {
        console.error('invalid simple image chart', error)
      }
    })
    preLoadImages(_images)
  },

  _preLoadCustomChartCode(charlist) {
    charlist.forEach((chart) => {
      if (chart && chart.chart_type && chart.chart_code) {
        loadCustomChart(chart.chart_code)
      }
    })
  },

  // 获取报告数据
  _getChartList(dataviewId, dashboardId, isShareView, isPreLoad) {
    const { actions, tenantCode, viewPass } = this.props
    actions.fetchChartList({
      dashboard_id: dataviewId,
      multi_dashboard_id: dashboardId,
      isShareView,
      tenantCode,
      viewPass
    }, (json) => {
      if (json.result) {
        if (Array.isArray(json.data)) {
          const customCharts = json.data.filter(chart => chart.chart_code === 'simple_image')
          this._preLoadCustomChartImages(customCharts)

          this._setFullSeries(json.data)
          this.setState({ loaded: true })

          // 预加载自定义图表代码文件
          if (isPreLoad) {
            this._preLoadCustomChartCode(json.data)
          }
        }
      } else {
        //dashboard不提示报告未发布 2018.3.22
        this.showTip({
          status: 'error',
          content: json.msg
        })
      }
    });
  },

  // 更新单图筛选
  _changeTab(params) {
    this.props.actions.updateDashboardTabData(params)
  },

  getRelatedsource(callback) {
    const { actions } = this.props
    actions.fetchFilterConfig({
      dashboard_id: this.props.dashboardId
    }, (json) => {
      if (json.result) {
        callback(json.data)
      } else {
        callback([])
      }
    })
  },

  // 补全联动筛选信息
  _setFullSeries(list) {
    const {
      selector_container,
      filterConditions,
      selectorConditions
    } = this.state
    //设置tabList
    let tabListSources = []
    // 堆栈
    const datareportStack = []
    list.forEach((item) => {
      // 判断是否为筛选器
      const isFilter = FILTER_TYPES.indexOf(item.chart_code) > -1;
      const isTab = ['tablist'].indexOf(item.chart_code) > -1

      //筛选设置
      let config = {}
      if (item.filter_config) {
        try {
          config = JSON.parse(item.filter_config)
        } catch (e) {
          config = { list: [] }
        }
      }
      // 设置tabList关联数据集
      if (isTab) {
        tabListSources = tabListSources.concat(config.list)
      }
      // key为数据集
      const key = item.source;
      // 如果item是筛选单图, 设置selector_container
      if (isFilter && !selector_container[key]) {
        selector_container[key] = []
      }
      if (isFilter && !filterConditions[item.id]) {
        filterConditions[item.id] = {}
      }
      // selectCondition数据集, dataSource做key
      if (!selectorConditions[key]) {
        selectorConditions[key] = {}
      }
      // 如果不是筛选单图 则加入selector_container中, 现在筛选范围由筛选设置确定，单图联动范围仍然由数据集决定
      if (!isFilter) {
        if (Array.isArray(selector_container[key])) {
          selector_container[key].push(item.id)
        } else {
          selector_container[key] = [item.id]
        }
      }
      // 拼接默认值的conditions, 2017-08-02加入时间及时间间隔控件默认值, 2018年02月09日新增编辑页默认值不生效
      if (item.default_value && !this.props.editable && 'time_interval_filter,number_filter'.indexOf(item.chart_code) > -1) {
        const defaultConditions = []
        const dims = _.cloneDeep(item.dims)
        item.default_value.split(',').forEach((condition, _index) => {
          if (_index === 0) {
            defaultConditions.push({
              field_id: dims[0].dim,
              col_name: dims[0].col_name,
              field_name: dims[0].col_name,
              formula_mode: dims[0].formula_mode || '',
              col_value: condition,
              operator: '>='
            })
          } else {
            defaultConditions.push({
              field_id: dims[0].dim,
              col_name: dims[0].col_name,
              field_name: dims[0].col_name,
              col_value: condition,
              formula_mode: dims[0].formula_mode || '',
              operator: '<='
            })
          }
        })
        //设置默认default conditions
        if (Array.isArray(config.list)) {
          config.list.forEach((i) => {
            const diagram = _.find(list, chart => chart.id === i)
            const conditions = defaultConditions
            const newConditions = this._convertConditions(conditions, diagram, item)
            filterConditions[item.id][i] = newConditions
          })
        }
      }
    })
    _.uniq(tabListSources)
    //因为默认值的存在，所以要等list setFullSeries完成后才能fetchItemData
    list.forEach((item) => {
      // 判断是否为简单单图
      const isSimple = SIMPLE_TYPES.indexOf(item.chart_code) > -1 || item.chart_type === 'auxiliary'
      // 判断是否为筛选器
      const isFilter = FILTER_TYPES.indexOf(item.chart_code) > -1
      // 非简单单图请求数据, tab组件关联的非筛选器数据延后加载, 在编辑状态下tab组件直接加载
      if (this.props.editable) {
        if (!isSimple) {
          datareportStack.push(this._fetchItemData(item))
        }
      } else if (!isSimple && (isFilter || (!isFilter && tabListSources.indexOf(item.id) === -1))) {
        datareportStack.push(this._fetchItemData(item))
      }
    })
    // 18.3.13 -> 加入单图加载数据完毕状态 （分享页）
    if (new RegExp('/dataview/share.*').test(window.location.pathname)) {
      Promise.all(datareportStack).then(() => {
        // 后端以 all_loaded 为判断标准进行报告截图
        const div = document.createElement('div');
        div.id = 'screenshot_share';
        div.style = 'display:none';
        document.body.appendChild(div);
      })
    }
  },

  // 复制单图 仅复制到当前报告
  _copySection(serial, data) {
    const { actions, dataviewId, chartList, gridLayout } = this.props
    const currChartList = chartList[dataviewId]
    const originPos = _.find(gridLayout[dataviewId], item => (item.i === data.id))
    let newName = `${data.name}-副本`
    const sameNameChartsNum = _.filter(currChartList, item => (
      new RegExp(newName).test(item.name) && data.chart_code === item.chart_code
    )).length
    newName = `${newName}(${sameNameChartsNum + 1})`
    // 生成一个新位置但保持原大小
    const rndX = getRandomPosition(originPos.x, 20, -10)
    const rndY = getRandomPosition(originPos.y, 20, -10)
    const newPos = {
      ...originPos,
      x: rndX,
      y: rndY,
      z: getMaxZindex(gridLayout[dataviewId]) + 1
    }
    actions.fetchCopyChartItem({
      dashboard_id: dataviewId,
      chart_code: data.chart_code,
      chart_id: data.id,
      name: newName,
      position: JSON.stringify({
        col: rndX,
        row: rndY,
        size_x: newPos.w,
        size_y: newPos.h,
        z: newPos.z
      }),
      newPos
    }, (json) => {
      this.showTip({
        status: !json.result ? 'error' : 'success',
        content: json.msg
      })
      if (json.result && (SIMPLE_TYPES.indexOf(data.chart_code) === -1 || data.chart_type !== 'auxiliary')) {
        // 非简单单图-补足联动筛选信息后请求数据
        const key = data.source
        const id = json.data.chart_id
        const { selector_container } = this.state
        // 添加到联动筛选相应的数据集下 因为筛选器不可复制 此处无需处理
        if (Array.isArray(selector_container[key])) {
          selector_container[key].push(id)
        } else {
          selector_container[key] = [id]
        }
        // 以id、chart_code、source获取数据
        this._fetchItemData({
          id,
          chart_code: data.chart_code,
          source: key
        })
      }
    })
  },

  // 转换为excel数据
  _exportChartData(data) {
    const { dims, nums, desires, zaxis, chart_data, chart_code, name } = data
    const hasDims = Array.isArray(dims) && dims.length > 0
    const hasNums = Array.isArray(nums) && nums.length > 0
    const hasData = Array.isArray(chart_data) && chart_data.length > 0
    if ((hasDims || hasNums) && hasData) {
      // 获取完整的csv dataUrl
      const dataUrl = getCsvDataUrl(chart_data, dims, nums, desires, zaxis)
      // 创建一个a标签用于承载下载链接
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${name || chart_code}.csv`
      document.body.appendChild(downloadLink)
      downloadLink.click();
      document.body.removeChild(downloadLink)
    } else {
      this.showTip({
        status: 'error',
        content: '没有数据'
      })
    }
  },

  //删除报告中间层处理
  _deleteSection(serial, data) {
    const { events } = this.props
    let callback = null
    if (data && data.id && data.source) {
      callback = () => {
        const { selectorConditions } = this.state
        const array = this.state.selector_container[data.source]
        _.remove(array, i => (i === data.id))
        //如果data是筛选类型需要做特殊处理,清空筛选条件
        if (FILTER_TYPES.indexOf(data.chart_code > -1) && selectorConditions && selectorConditions[data.source]) {
          selectorConditions[data.source][data.id] = []
        }
        this.setState(preState => ({
          ...preState,
          selector_container: {
            ...preState.selector_container,
            [data.source]: array
          },
          selectorConditions
        }))
      }
    }
    events.onDelete(serial, data, callback)
  },

  handleCreateChartThrough(chart_id, layer) {
    const { actions, dataviewId } = this.props
    actions.createChartThrough({
      dashboard_id: dataviewId,
      chart_id,
      layer
    })
  },

  handleAddChartThrough(chart) {
    const { actions } = this.props

    if (chart.chart_data) {
      delete chart.chart_data
    }

    // 初始化穿透空数据
    chart.penetrates = chart.penetrates || []
    chart.penetrates.push({
      chart_code: 'table',
      dashboard_id: chart.dashboard_id,
      dataset_id: chart.source,
      default_value: '',
      dims: [],
      nums: [],
      filters: chart.filters,
      display_item: '{"top_head":"","top_tail":""}',
      refresh_rate: null,
      name: chart.name,
      source: chart.source
    })

    actions.createAddThrough({
      ...chart
    })
  },

  handleAddChartLink(chart, callback) {
    const { actions, dashboardId } = this.props
    actions.updateFilterConfig({
      chart_id: chart.id,
      dashboard_id: dashboardId,
      filter_config: chart.filter_config,
    }, (json) => {
      callback(true)
      if (json.result) {
        this.showTip({
          status: 'success',
          content: '设置成功'
        })
      } else {
        this.showTip({
          status: 'error',
          content: json.msg
        })
      }
    })
  },

  handleDelChartLink(chart) {
    const { actions, dashboardId } = this.props
    actions.updateFilterConfig({
      chart_id: chart.id,
      dashboard_id: dashboardId,
      filter_config: chart.filter_config,
    }, (json) => {
      if (json.result) {
        this.showTip({
          status: 'success',
          content: '删除成功'
        })
      } else {
        this.showTip({
          status: 'error',
          content: json.msg
        })
      }
    })
  },

  handleChangeChartDatasetDefaultValue(defaultValue, chart_id) {
    const { diagramDatasets, events } = this.props
    const diagramDataset = diagramDatasets && diagramDatasets[chart_id]

    const newDiagramDataset = {
      chart_id,
      dataSet: {
        ...diagramDataset && diagramDataset.dataSet,
        default_value: defaultValue || ''
      }
    }

    events && events.onDatasetChange(newDiagramDataset)
  },

  // 生成events对象
  _getEvents() {
    const { events } = this.props
    return {
      ...events,
      onDeleteSection: this._deleteSection,
      onCopy: this._copySection,
      onSelectorChange: this._handleFilterChange,
      onTimeChange: this._handleFilterChange,
      onDateChange: this._handleFilterChange,
      onCheckboxChange: this._handleFilterChange,
      onNumberChange: this._handleFilterChange,
      onRelateFilter: this._handleFilterChange,     // 联动筛选通用方法
      onFilterChange: this._handleFilterChange,     // 筛选器新增范围过后， 筛选通用触发方法
      onChartChange: this._operaterChart,           // 单图联动独立处理
      onFreshData: this._freshData,                 // 拉取数据 （非echarts）
      onFetchThroughData: this._fetchThroughData,   // 拉取穿透 （非echarts）
      onChangeTab: this._changeTab,
      onChartCreateThrough: this.handleCreateChartThrough,  //图表创建穿透
      onChartAddThrough: this.handleAddChartThrough,        //图表创建穿透
      onChartAddLink: this.handleAddChartLink,              //图表联动设置
      onChartDelLink: this.handleDelChartLink,              //删除联动设置
      onChangeDatasetDefaultValue: this.handleChangeChartDatasetDefaultValue,  //修改图表数据集默认值
      onConfigChange: this.handleDiagramConfigChange, //更新配置
      onExportData: this._exportChartData,            // 导出单图数据
    }
  },

  NO_SCALE_CHART_TYPES: [
    'double_axis',
    'cluster_column',
    'horizon_bar',
    'stack_bar',
    'horizon_stack_bar',
    'pie',
    'rose_pie',
    'circle_pie',
    'circle_rose_pie',
    'funnel',
    'scatter',
    'radar',
    'area',
    'stack_area',
    'line',
    'stack_line',
    'flow_bar',
    'treemap',
    'scatter_map'
  ],

  STYLE_SHEET: {
    conatiner: {
      height: '100%',
      width: '100%'
    }
  }
})

const stateToProps = state => ({
  ...state.dataViewItemDetail
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(itemDetailActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps, null, { withRef: true })(Dashboard)
