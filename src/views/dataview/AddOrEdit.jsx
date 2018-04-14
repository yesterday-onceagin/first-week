import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataViewAddOrEditActionCreators } from '../../redux/modules/dataview/addOrEdit';
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail'

import Sortable from 'react-sortablejs'
import Loading from 'react-bootstrap-myui/lib/Loading'
import FixedTopNav from '../../components/FixedTopNav';
import IconButton from '../../components/IconButton';
import FieldGroupPanel from './layouts/FieldGroupPanel';
import LeftFormPanel from './layouts/LeftFormPanel';
import RightAsidePanel from './layouts/RightAsidePanel';
import FilterPanel from './layouts/FilterPanel';
import MainChartPanel from './layouts/MainChartPanel';

import _ from 'lodash';
import generateDisplayFormat from './utils/generateDisplayFormat';
import checkChartType from '../../helpers/checkChartType';
import { getColorTheme, layoutExtendUpgrade } from '../../helpers/dashboardUtils'
import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';

import CHARTS_TYPE from './constants/chartTypes';
import { RELEASE_WRAP, NOOP } from '../../constants/sortable';
import { DEFAULT_DIAGRAM_CONFIG } from './diagramConfig/constants/index'
import { THROUGH_CHART_TYPE } from './constants/incOption'
import { baseAlias } from '../../config';

import 'rt-tree/dist/css/rt-select.css';
import './add-edit.less';

const DataViewAddOrEdit = createReactClass({
  displayName: 'DataViewAddOrEdit',

  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    actions: PropTypes.object,
    params: PropTypes.object,
    onChangeLayoutVisibility: PropTypes.func
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      chart_data: null,                     // 图表数据
      conditions: [],                       // 用作级联条件筛选
      default_value: '',                    // 默认值
      dataList: [],                         // 级联拉下缓存
      chart_uuid: new Date().getTime(),     // echarts 组件更新 【凭证 】
      through_active: -1,                   // 穿透的图层
      sort_method: '',
      indicators: {
        图层: [],
        维度: [],
        数值: []
      },
      filters: [],
      heatOption: {                         // 热力图
        zoom: 6,
        center: [116.397428, 39.90923],
        max: 20
      },
      layoutExtend: {},                     // 配置
      switchingDataSet: false,              // 切换数据集
      preIndicators: null,                  // 上次的指标记录
      info: {                               // 存储到数据库的字段  
        source: '',                         // 数据集Id
        name: '',
        chart_code: ''
      },
      dashboard_id: this.props.params.kanban_id
    }
  },

  componentWillMount() {
    const { onChangeLayoutVisibility } = this.props

    // 布局的隐藏
    onChangeLayoutVisibility({
      hidePageHeader: true,  // 头部
      hideSideMenu: true     // 左侧菜单
    })
  },

  componentDidMount() {
    const { actions, params } = this.props
    if (params.id) {
      actions.fetchDataset(this.initComponent)
    } else {
      actions.fetchDataset()
    }
    this.THROUGH_LIST_STATE = {}
    window.onresize = this._resizeChart
  },

  componentWillReceiveProps(nextProps) {
    const { spread } = this.props
    if (spread !== nextProps.spread) {
      this._resizeChart();
    }
  },

  componentDidUpdate() {
    window.onresize = this._resizeChart
  },

  componentWillUnmount() {
    this.THROUGH_LIST_STATE = {}
    // 清空单图详情数据
    this.props.actions.clearChartData()
  },

  render() {
    const { pending, dataFeildList, params } = this.props;
    const {
      indicators,
      chart_pending,
      info,
      through_active,
      switchingDataSet,
      preIndicators
    } = this.state;
    const mode = this._mode()
    const saveDisable = !info.chart_code || switchingDataSet
    const ruleData = mode === 'base' ? {
      value: indicators['数值'].length,
      dim: indicators['维度'].length,
    } : {
        address: 1
      }
    // 如果只有维度的情况下。并且维度个数为1.则将该维度的type、formula传入
    if (indicators['数值'].length === 0 && indicators['维度'].length === 1 && mode === 'base') {
      const indicator = indicators['维度'][0]

      Object.assign(ruleData, { type: indicator.data_type })
      indicator.formula_mode && Object.assign(ruleData, { formula_mode: indicator.formula_mode })
    }

    //传入FieldGroupPanel作为请求参数
    const data = this._convertData()
    // 加入display_item 限制查询条目数, 如果本身没有设置的情况下。应该取本地配置
    const chart = this._getChartFromChartList(info.chart_code)
    if (chart) {
      Object.assign(data, {
        display_item: chart.display_item
      })
    }
    return (
      <div className="modules-page-container">
        <Sortable options={RELEASE_WRAP} onChange={NOOP}>
          <FixedTopNav onBack={this.handleBack}>
            <IconButton
              onClick={this.handleSave}
              className='fixed green'
              iconClass='dmpicon-save'
              disabled={saveDisable}
              style={{ margin: '13px 30px', float: 'right' }}
            >
              保存
            </IconButton>
          </FixedTopNav>
        </Sortable>
        <div className="data-view-add-edit-page" id="data-view-compile-page" style={{ position: 'relative' }}>
          <div className="page-view-wrap">
            <LeftFormPanel
              data={info}
              isFieldUsed={this.isFieldUsed}
              dataFeildList={dataFeildList}
              onChange={this.handleLeftForm}
              onChangeTree={this.handleChangeDataSet}
              onFetchNumeralIndicators={this.fetchNumeralIndicators}
            />
            <div className="main-view-wrap">
              <Sortable options={RELEASE_WRAP} onChange={NOOP}>
                <div className="center">
                  <FieldGroupPanel
                    dashboardId={params.kanban_id}
                    indicators={indicators}
                    preIndicators={preIndicators}
                    switchingDataSet={switchingDataSet}
                    through_active={through_active}
                    chartCode={info.chart_code}
                    chartId={this.props.params.id}
                    onResize={this._resizeChart}
                    onChange={this.handleFieldGroupPanel}
                    getData={data}
                  />
                  {this.renderEchartsPanel()}
                </div>
                <div className="right">
                  <RightAsidePanel
                    data={info}
                    ruleData={ruleData}
                    switchingDataSet={switchingDataSet}
                    throughAble={indicators['图层'].length > 0}
                    onSelectType={this.handleSelectType}
                  />
                </div>
              </Sortable>
            </div>
          </div>
          {
            chart_pending && (
              <div style={{ position: 'absolute', left: '0px', top: '0px', right: '0px', bottom: '0px', zIndex: 999 }} />
            )
          }
          <Loading show={pending} containerId="data-view-compile-page" />
        </div>
        {
          chart_pending && (
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999 }} />
          )
        }
        <Loading show={pending} containerId="data-view-compile-page" />
      </div>
    );
  },

  // 渲染 图表区域
  renderEchartsPanel() {
    const { params, chartDataInfo } = this.props
    const {
      chart_uuid,
      chart_pending,
      info,
      chart_data,
      indicators,
      dataList,
      conditions,
      filters,
      layoutExtend,
      through_active,
      default_value,
      switchingDataSet
    } = this.state
    // 排序（仅饼图和玫瑰饼图）
    if (('pie,rose_pie').indexOf(info.chart_code) > -1) {
      const dataValid = chart_data && chart_data.indicators.dims[0] && chart_data.data
      if (dataValid) {
        const num = chart_data.indicators.nums[0]
        const dim = chart_data.indicators.dims[0]
        // 当num和dim中的排序均未设置时，按照num降序排序
        if (num.sort === null && dim.sort === null && Array.isArray(chart_data.data)) {
          const numKey = num.formula_mode ? `${num.formula_mode}_${num.col_name}` : num.col_name
          const numDatas = chart_data.data.sort((a, b) => b[numKey] - a[numKey])
          chart_data.data = numDatas
        }
      }
    }
    // 需要刷新的条件
    const needRefresh = switchingDataSet && (indicators['维度'].length > 0 || indicators['数值'].length > 0)

    let colorTheme = null
    // 如果chartDataInfo有数据从chartDataInfo中取
    if (chartDataInfo) {
      if (through_active > 0) {
        colorTheme = getColorTheme({
          ...chartDataInfo.penetrates[through_active - 1],
          chart_code: info.chart_code
        })
      } else {
        colorTheme = getColorTheme({
          ...chartDataInfo,
          chart_code: info.chart_code
        })
      }
    }

    return (
      <div className="chart-area-wrap">
        <div className="chart-left-side">
          <Sortable options={RELEASE_WRAP} onChange={NOOP}>
            <FilterPanel
              chartId={params.id}
              filters={filters}
              onChange={this.handleChangeFilterPanel}
            />
          </Sortable>
        </div>
        <div className="main-wrap">
          <Sortable options={RELEASE_WRAP} onChange={NOOP}>
            <MainChartPanel
              indicators={indicators}
              chartId={params.id}
              chartRef={(instance) => { this.mainChart = instance }}
              chart_pending={chart_pending}
              mode={this._mode()}
              info={info}
              chart_code={info.chart_code}
              chart_data={chart_data}
              chart_uuid={chart_uuid}
              dataList={dataList}
              needRefresh={needRefresh}
              layoutOptions={layoutExtend}
              through_active={through_active}
              default_value={default_value}
              conditions={conditions}
              onRefresh={this.handleRefresh}
              onChange={this.handleChangeMainChartPanel}
              colorTheme={colorTheme}
            />
          </Sortable>
        </div>
      </div>
    )
  },

  handleRefresh() {
    // 释放 更改数据集的状态
    this.state.switchingDataSet = false;
    this.state.preIndicators = null
    // 同步更新到穿透
    Object.values(this.THROUGH_LIST_STATE).forEach((state) => {
      state.switchingDataSet = false
      state.preIndicators = null
    })

    this.setState({
      ...this.state
    }, this.autoMapChartType)
  },

  // 更新单图名称 需要同步到 穿透图层
  handleLeftForm(data) {
    Object.values(this.THROUGH_LIST_STATE).forEach((state) => {
      state.info.name = data
    })
    this.setState(preState => ({
      info: {
        ...preState.info,
        name: data
      }
    }))
  },

  // 切换数据源
  handleChangeDataSet(value, callback) {
    const { info, indicators, switchingDataSet } = this.state

    // 如果上次的数据集存在 并且 info.chart_code 存在的情况下,
    if (info.chart_code && info.source && !switchingDataSet) {
      this.state.switchingDataSet = true
      this.state.preIndicators = _.cloneDeep(indicators)
    }

    // 如果 没有切换
    if (!this.state.switchingDataSet) {
      this.THROUGH_LIST_STATE = {}
      this.state.through_active = -1
      this._refreshChart()
      this.state.chart_data = null
      this.state.info.chart_code = ''
    } else if (this.state.through_active > 0) {
      // 如果目前的穿透层不在第一层
      this.state.conditions = []
      this.state.through_active = 0
    }

    this.state.filters = []
    this.state.info.source = value
    this.state.indicators = {
      图层: [],
      维度: [],
      数值: []
    }

    this.props.actions.fetchDatasetField({ dataset_id: value }, (json) => {
      if (json.result) {
        callback && callback(json.data)
      } else {
        this.showErr(json.msg)
      }
    })
  },

  handleSelectType(chartType, isNeedUpdateLayout) {
    this.state.info.chart_code = chartType.code
    //切换类型设置默认值 清空默认值
    if (isNeedUpdateLayout) {
      this.state.default_value = ''
      // 这里不需要再设置layoutExtend的默认值了，因为在fetchChartData中已经处理了
    }
    this._refreshChart()
    this._fetchChartData()
    // 需要同步到 穿透图层
    if (this.state.through_active > -1 && this.state.indicators['图层'].length > 1) {
      const through = this.state.indicators['图层'][this.state.through_active]
      if (through) {
        this.THROUGH_LIST_STATE[through.id].info.chart_code = chartType.code
      }
    }
  },

  // 跳转
  handleBack() {
    const { params } = this.props
    const kanbanName = encodeURIComponent(params.kanban_name)
    this.context.router.push(`${baseAlias}/dataview/report/${params.folderId}/${params.kanban_id}/${kanbanName}`)
  },

  handleSave() {
    const { params, actions } = this.props
    let layers = this.state.indicators['图层']
    let data = this._convertData(this.state);

    if (!data.name) {
      this.showErr('请输入图表标题')
      const nameInput = document.querySelector('#data-view-chart-title-input')
      nameInput && nameInput.focus()
      return
    }
    // 保存的时候，应该要将穿透退回到第一层
    if (layers.length > 0) {
      const penetrates = []
      // 图层加上
      layers = layers.map((item, index) => ({
        ...item,
        dim: item.id,
        alias: item.alias_name || item.col_name,
        rank: index
      }))

      const firstLayerState = layers[0]
      data = this._convertData(this.THROUGH_LIST_STATE[firstLayerState.id])

      Object.assign(data, { layers })
      layers.forEach((item, index) => {
        if (index > 0) {
          const state = this.THROUGH_LIST_STATE[item.id]
          penetrates.push(this._convertData(state, index - 1))
        }
      })
      // merge 穿透的 图层 设置
      Object.assign(data, { penetrates })
    }

    actions.saveChartData(data, (json) => {
      if (json.result) {
        this.showScc(json.msg || '保存成功')
        // 完成之后退出到报告页面
        if (data.id) {
          // 如果有id则删除redux中itemDetail下原有的items下的数据
          actions.deleteChartItemData(data.id)
        }
        setTimeout(() => {
          const kanbanName = encodeURIComponent(params.kanban_name)
          this.context.router.push(`${baseAlias}/dataview/report/${params.folderId}/${params.kanban_id}/${kanbanName}`)
        }, 1000)
      } else {
        this.showErr(json.msg || '保存失败')
      }
    })
  },

  handleChangeMainChartPanel(type, data, other) {
    switch (type) {
      case 'heatmap': {
        this.state.heatOption = _.cloneDeep(data.heatOption)
        break;
      }
      case 'chartOther': {
        this.setState({
          ...this.state,
          ...data
        })
        break;
      }
      case 'chartSelect': {
        this.setState({
          ...this.state,
          ...data
        }, this._fetchChartData)
        break;
      }
      case 'throughIn': {
        this.handleChartThrough(data, other)
        break;
      }
      case 'throughBack': {
        this.handleChangeThroughNav(data)
        break;
      }
      default:
        break;
    }
  },

  handleChangeThroughNav(active) {
    const through = this.state.indicators['图层'][active]
    const currThrough = this.state.indicators['图层'][this.state.through_active]
    const key = through.id
    const conditions = []
    for (let i = 0; i < active; i++) {
      const dim = this.state.indicators['图层'][i]
      conditions.push({
        col_name: dim.col_name,
        col_value: dim.col_value,
        operator: '=',
        dim
      })
    }

    // 同步当前state
    this.THROUGH_LIST_STATE[currThrough.id] = _.cloneDeep(this.state)
    this.THROUGH_LIST_STATE[key].through_active = active
    this.THROUGH_LIST_STATE[key].chart_uuid = new Date().getTime()
    this.THROUGH_LIST_STATE[key].chart_data = null

    this.state = _.cloneDeep(this.THROUGH_LIST_STATE[key])
    this.state.conditions = conditions

    this._fetchChartData()
  },

  handleChartThrough(type, data) {
    const { through_active, indicators } = this.state
    const throughabled = through_active < indicators['图层'].length - 1 && THROUGH_CHART_TYPE.indexOf(type) > -1
    const value = 'table,label_map'.indexOf(type) > -1 ? data : data.name.split('&')[0]
    if (throughabled) {
      const active = through_active + 1
      const through = this.state.indicators['图层'][active]
      const currThrough = this.state.indicators['图层'][through_active]
      const conditions = []

      // 将当前的state存储到through_list
      this.state.indicators['图层'][through_active].col_value = value
      this.THROUGH_LIST_STATE[currThrough.id] = _.cloneDeep(this.state)
      // 2017-09-17 新增col_value的赋值 by caocj
      // 应该需要同步 所有的图层
      Object.keys(this.THROUGH_LIST_STATE).forEach((key) => {
        this.THROUGH_LIST_STATE[key].indicators['图层'][through_active].col_value = value
      })

      this.THROUGH_LIST_STATE[through.id].through_active = active
      this.THROUGH_LIST_STATE[through.id].chart_uuid = new Date().getTime()
      this.state = _.cloneDeep(this.THROUGH_LIST_STATE[through.id])
      // 穿透的条件
      for (let i = 0; i < active; i++) {
        const item = this.state.indicators['图层'][i]
        conditions.push({
          col_name: item.col_name,
          col_value: item.col_value,
          operator: '=',
          dim: Object.assign(item, { dim: item.id })
        })
      }

      this.state.conditions = conditions
      this.autoMapChartType()
    }
  },

  handleFieldGroupPanel(type, data) {
    const {
      preIndicators,
      switchingDataSet,
      indicators
    } = this.state

    let change_through = false
    let callback = this.autoMapChartType
    switch (type) {
      case 'selectDropDown':
        //按年按月按日变化时 需要autoMapChartType
        this.state.indicators = _.cloneDeep(data.indicators)
        if (this.state.through_active > 0) {
          // 如果已经穿透则需要同步到穿透图层表
          const through = this.state.indicators['图层'][this.state.through_active]
          this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data.indicators)
        }
        callback = () => {
          this.autoMapChartType()
          this._fetchChartData();
        }
        break;
      case 'changeSort':
        if (this.state.through_active > 0) {
          // 如果已经穿透则需要同步到穿透图层表
          const through = this.state.indicators['图层'][this.state.through_active]
          this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data.indicators)
        }
        callback = this._fetchChartData
        break;
      case 'configFormat':
      case 'changeAlias':
        callback = null;
        break;
      case 'remove_indicator':
        break;
      case 'remove_through': {
        const firstIndicators = this.THROUGH_LIST_STATE[data.through_id].indicators
        const chart_code = this.THROUGH_LIST_STATE[data.through_id].info.chart_code
        // 同步 第一层 字段数据
        data.indicators['维度'] = _.cloneDeep(firstIndicators['维度'])
        data.indicators['数值'] = _.cloneDeep(firstIndicators['数值'])
        // 同步 到第一层的 chart_code
        this.state.info.chart_code = chart_code
        // 清空 conditions
        this.state.conditions = []
        // 删除穿透
        if (!switchingDataSet) {
          this.state.chart_uuid = new Date().getTime()
        } else {
          // 同样清空维度
          this.state.indicators['维度'] = []
          this.setState({
            indicators: _.cloneDeep(this.state.indicators)
          })
        }
        this.THROUGH_LIST_STATE = {}
        // 清空本地单图穿透数据
        this.props.actions.clearChartDataThrough()
        change_through = true
        break;
      }
      case 'add_through': {
        // 添加穿透
        // 1、原有state
        // 2、indicators[‘图层’].
        // 3、如果当前处于变更数据集的情况下，并且没有维度且没有图层的时候。则应该同步图层数据到 维度
        const through = indicators['图层'][data.through_index]
        if (indicators['图层'].length === 1) {
          if (indicators['维度'].length === 0 && preIndicators && switchingDataSet) {
            this.state.indicators['维度'].push(through)
            this.setState({
              indicators: _.cloneDeep(this.state.indicators)
            })
          }
          const firstLayerId = indicators['图层'][0].id
          this.THROUGH_LIST_STATE[firstLayerId] = this.state
        } else if (through.id !== indicators['图层'][0].id) {
          this.THROUGH_LIST_STATE = {
            ...this.THROUGH_LIST_STATE,
            [through.id]: this._getThroughState(data.through_index)
          }
        }
        if (!switchingDataSet) {
          this.state.chart_uuid = new Date().getTime()
        }
        // 清空 callback，避免重新设置 code
        callback = null
        change_through = true
        break;
      }
      case 'delete_through': {
        // 删除后，默认指向第一层. 此时要切换 图层, 更新当前state
        Reflect.deleteProperty(this.THROUGH_LIST_STATE, data.through_id)
        // 更新当前活动的 through_active
        Object.keys(this.THROUGH_LIST_STATE).forEach((item) => {
          // 必须在此处更新图层信息 如果选中的不是第一层 那在下面将第一层信息给到data的时候不能更新图层变化
          this.THROUGH_LIST_STATE[item] = {
            ...this.THROUGH_LIST_STATE[item],
            through_active: 0,
            indicators: {
              ...this.THROUGH_LIST_STATE[item].indicators,
              图层: data.indicators['图层']
            }
          }
        })
        const firstLayerId = this.state.indicators['图层'][0].id
        data = this.THROUGH_LIST_STATE[firstLayerId]
        // 清空 conditions
        this.state.conditions = []
        change_through = true
        break;
      }
      case 'sort_through':
        if (data.through_active === 0) {
          const firstLayerId = this.state.indicators['图层'][0].id
          this.THROUGH_LIST_STATE[firstLayerId].through_active = data.through_active           // 更新当前活动的 through_active
          data = this.THROUGH_LIST_STATE[firstLayerId]
        } else {
          const through = this.state.indicators['图层'][data.through_active]
          this.THROUGH_LIST_STATE[through.id].through_active = data.through_active    // 更新当前活动的 through_active 
          data = this.THROUGH_LIST_STATE[through.id]
        }
        change_through = true
        break;
      case 'alias_change':
        if (this.state.through_active > 0) {
          // 如果已经穿透则需要同步到穿透图层表
          const through = this.state.indicators['图层'][this.state.through_active]
          this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data)
        }
        callback = this._fetchChartData;
        break;
      case 'formatConfig_change':
        if (this.state.through_active > 0) {
          // 如果已经穿透则需要同步到穿透图层表
          const through = this.state.indicators['图层'][this.state.through_active]
          this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data)
        }
        this.state.chart_uuid = new Date().getTime()
        break;
      case 'sort':
        if (this.state.through_active > 0) {
          // 如果已经穿透则需要同步到穿透图层表
          const through = this.state.indicators['图层'][this.state.through_active]
          this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data.indicators)
        }
        Reflect.deleteProperty(data, 'chart_uuid')
        break;
      case 'add':
        // 如果已经存在穿透的情况下
        if (switchingDataSet && preIndicators) {
          // 如果不存在图层，且data.indicators[‘维度’].length == 1
          callback = null
          if (preIndicators['图层'].length > 0 && indicators['维度'].length === 1 && indicators['数值'].length === 0) {
            const item = indicators['维度'][0]
            this.state.indicators['图层'].push(item)
            this.setState({
              indicators: _.cloneDeep(this.state.indicators)
            })
            const firstLayerId = this.state.indicators['图层'][0].id

            // 新增的时候，应该去掉 id
            this.THROUGH_LIST_STATE[firstLayerId] = this.state
          } else {
            this.setState({
              ...this.state
            })
            if (this.state.through_active > -1) {
              const through = this.state.indicators['图层'][this.state.through_active]
              this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data.indicators)
            }
          }
        } else if (this.state.through_active > -1 && this.state.indicators['图层'].length > 1) {
          const through = this.state.indicators['图层'][this.state.through_active]
          this.THROUGH_LIST_STATE[through.id].indicators = _.cloneDeep(data.indicators)
        }
        break;
      default:
        // 其他维度和数值类的操作. 则需要同步到对应THROUGH_LIST_state中去
        if (data.through_id) {
          this.THROUGH_LIST_STATE[data.through_id] = {
            ...this.THROUGH_LIST_STATE[data.through_id],
            indicators: _.cloneDeep(indicators)
          }
        }
        break;
    }

    // 如果正处于更换数据集状态
    if (switchingDataSet && preIndicators) {
      const match = this._matchPreIndicators()
      if (match) {
        // 同步更新到穿透
        Object.values(this.THROUGH_LIST_STATE).forEach((state) => {
          state.switchingDataSet = false
          state.preIndicators = null
        })

        this.state.switchingDataSet = false
        this.state.preIndicators = null
        this.state.chart_data = null
        this.state.chart_uuid = new Date().getTime()

        callback = this._fetchChartData
      }
    }

    if (callback) {
      this.state = {
        ...this.state,
        ...data
      }
      callback && callback();
    } else if (!switchingDataSet) {
      this.setState({
        ...this.state,
        ...data
      })
    } else {
      this.state = {
        ...this.state,
        ...data
      }
    }

    if (change_through) {
      // 同步 到state
      Object.keys(this.THROUGH_LIST_STATE).forEach((item) => {
        this.THROUGH_LIST_STATE[item] = {
          ...this.THROUGH_LIST_STATE[item],
          indicators: {
            ...this.THROUGH_LIST_STATE[item].indicators,
            图层: data.indicators['图层']
          }
        }
      })
    }
  },

  handleChangeFilterPanel(type, data) {
    let callback = null
    this.setState({
      ...this.state,
      filters: data
    }, () => {
      switch (type) {
        case 'save':
        case 'delete':
          //如果存在穿透
          if (this.state.through_active > -1) {
            Object.keys(this.THROUGH_LIST_STATE).forEach((item) => {
              this.THROUGH_LIST_STATE[item].filters = this.state.filters
            })
          }
          //操作如果有穿透并且当前穿透不在第一层
          if (this.state.through_active > 0) {
            this.handleChangeThroughNav(0)
          }
          callback = this._fetchChartData;
          break;
        default:
          callback = null;
          break;
      }
      callback && callback()
    })
  },

  fetchNumeralIndicators(params, callback) {
    const { actions } = this.props
    const { info } = this.state

    // 同步已选字段
    const syncIndicator = (state, json) => {
      if (params.mode === 'edit') {
        ['维度', '数值', '图层'].forEach((inc) => {
          state.indicators[inc].forEach((i) => {
            if (i.id === params.id) {
              i.alias = params.alias_name
              i.alias_name = params.alias_name
              i.col_name = json.data ? json.data : i.col_name
            }
            return i
          })
        })
        state.filters && state.filters.forEach((i) => {
          if (i.dataset_field_id === params.id) {
            i.alias = params.alias_name
            i.alias_name = params.alias_name
            i.col_name = json.data ? json.data : i.col_name
          }
          return i
        })
      } else if (params.mode === 'delete') {
        _.remove(state.filters, i => (i.dataset_field_id === params.id))
      }
    }

    actions.fetchNumeralIndicators(params, (json) => {
      if (json.result) {
        this.showScc('操作成功')
        actions.fetchDatasetField({ dataset_id: info.source }, (data) => {
          if (data.result) {
            // 通知到 子组件 重新获取数据
            callback(params.dataset_id, true);
            //col_name的值从json穿过来
            syncIndicator(this.state, json);
            //根据是否穿透决定如何赋值
            if (this.state.through_active > -1) {
              Object.keys(this.THROUGH_LIST_STATE).forEach((item) => {
                this.THROUGH_LIST_STATE[item].tree = this.state.tree
                syncIndicator(this.THROUGH_LIST_STATE[item], json)
              })
            }
          }
          this.setState({
            ...this.state,
          }, () => {
            if (this.state.through_active > -1) {
              this.handleChangeThroughNav(0)
            } else if (['delete', 'edit'].indexOf(params.mode) > -1) {
              this._fetchChartData()
            }
          })
        })
      } else {
        callback(params.dataset_id, false);
        this.showErr(json.msg || '操作失败')
      }
    })
  },

  //判断当前计算字段是否在使用
  isFieldUsed(id) {
    let canDelete = true
    const { through_active, indicators } = this.state
    const isUsed = (data) => {
      ['维度', '数值', '图层'].forEach((inc) => {
        data[inc].forEach((i) => {
          if (i.id === id) {
            canDelete = false
          }
        })
      })
    }

    isUsed(indicators)
    if (through_active > -1) {
      Object.values(this.THROUGH_LIST_STATE).forEach((item) => {
        isUsed(item.indicators)
      })
    }

    return canDelete
  },

  // 自动匹配图表类型
  autoMapChartType(refresh = true) {
    const { indicators, info, switchingDataSet } = this.state
    const mode = this._mode()
    let isMatched = false
    if (switchingDataSet) {
      this.setState({ ...this.state })
      return false;
    }
    if (indicators['数值'].length === 0 && indicators['维度'].length === 0) {
      this.state.info.chart_code = ''
      this.state.chart_data = null
      this._refreshChart()
      this.setState({ ...this.state })
    } else {
      if (info.chart_code) {
        const chart = this._getChartFromChartList(info.chart_code)
        if (chart) {
          const rule = mode === 'base' ? {
            dim: indicators['维度'].length,
            value: indicators['数值'].length
          } : { address: 1 }

          isMatched = indicators['图层'].length > 0 && THROUGH_CHART_TYPE.indexOf(info.chart_code) === -1
            ? false : checkChartType(chart.rule, rule)

          if (isMatched && rule.dim === 1 && rule.value === 0 && chart.rule[0].dim.formula_mode) {
            const formula_mode = indicators['维度'][0].formula_mode
            isMatched = chart.rule[0].dim.formula_mode.indexOf(formula_mode) > -1
          }
        }
      }

      if (!isMatched) {
        this.state.info.chart_code = 'table'
        if (mode === 'map' && indicators['图层'].length > 0) {
          this.state.info.chart_code = 'table'
        }
      }
      if (refresh) {
        this.handleSelectType({
          code: this.state.info.chart_code
        }, !isMatched)
      }
    }
  },

  // 编辑初始化，回填数据到 state
  initComponent() {
    const { actions, params } = this.props

    actions.fetchInfo({ id: params.id }, (json) => {
      if (json.result) {
        this.handleChangeDataSet(json.data.source, (dataFeildList) => {
          const state = this._transformState(this.state, json.data, dataFeildList);
          const layers = json.data.layers || []
          const penetrates = json.data.penetrates.slice(0, layers.length)

          // 如果存在穿透
          if (layers.length > 0) {
            this.THROUGH_LIST_STATE = {
              [layers[0].dim]: state
            }
            penetrates.forEach((item, index) => {
              const _state = _.cloneDeep(state)
              // 重置 indicators
              _state.indicators['图层'] = state.indicators['图层'].slice()
              _state.indicators['维度'] = []
              _state.indicators['数值'] = []
              // 穿透层级对应的state
              const __state = this._transformState(_state, item, dataFeildList)
              // 同步变更穿透的第一个维度
              if (layers[index + 1]) {
                this.THROUGH_LIST_STATE = {
                  ...this.THROUGH_LIST_STATE,
                  [layers[index + 1].dim]: __state
                }
              }
            })
          }
          this.state = state
          this.setState({ ...this.state }, () => {
            if (json.data.chart_code) {
              this.handleSelectType({ code: json.data.chart_code }, false)
            }
          })
        })
      } else {
        this.showErr(json.msg)
      }
    })
  },

  // 数据转换
  _transformState(state, data, dataFeildList) {
    const { actions, params } = this.props
    const fields = ['dims', 'nums', 'map', 'layers']
    const newState = _.cloneDeep(state)

    const getNewItem = (item, key) => {
      const indicator = this._findItemById(item[this.FILED_ITEM_MAP[key]], dataFeildList)
      return {
        ...indicator,
        alias: item.alias,
        formula_mode: item.formula_mode || (item.formula_mode === null ? null : ''),
        sort: item.sort,
        content: item.content
      }
    }

    const initIndicators = (key) => {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        newState.indicators[this.FILED_MAP[key]] = []
        data[key].forEach((item) => {
          const newIndicator = getNewItem(item, key)
          if (key === 'nums') {
            Object.assign(newIndicator, {
              display_format: item.display_format ? JSON.parse(item.display_format) : generateDisplayFormat()
            })
          }
          newState.indicators[this.FILED_MAP[key]].push(newIndicator)
        })
        if (key === 'layers') {
          newState.through_active = 0
        }
      } else if (key === 'map' && data[key]) {
        const newIndicator = getNewItem(data[key], key)
        newState.indicators[this.FILED_MAP[key]] = [newIndicator]
      }
    }

    fields.forEach((item) => {
      initIndicators(item)
    })

    newState.info = {
      ...newState.info,
      source: data.source || '',
      name: data.name,
      chart_code: data.chart_code,
    }

    //默认值设置
    newState.default_value = data.default_value
    newState.filters = data.filters

    // 布局转换成对象 并处理兼容合并
    let defaultLayoutExtend = {}
    try {
      defaultLayoutExtend = JSON.parse(data.layout_extend)
      if (data.chart_code) {
        defaultLayoutExtend = layoutExtendUpgrade({
          layout_extend: defaultLayoutExtend,
          chart_code: data.chart_code,
          options: { dimsLen: data.dims.length, numsLen: data.nums.length }
        })
      }
    } catch (e) {
      defaultLayoutExtend = data.chart_code ? _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[data.chart_code]) : null
    }

    newState.layoutExtend = defaultLayoutExtend

    Array.isArray(newState.filters) && newState.filters.forEach((filter) => {
      filter.mode = 'edit'
      //是否是字符串、枚举
      const isStr = (filter.data_type === '枚举' || filter.data_type === '字符串')
      let values = []

      if (['in', 'not in', 'between'].indexOf(filter.operator) > -1) {
        values = filter.col_value ? JSON.parse(filter.col_value) : []
      } else {
        values = filter.col_value ? filter.col_value.split(',') : []
      }
      //枚举、字符串做特殊空处理
      if (values.length > 0 && isStr) {
        values = values.map((v) => {
          if (v === '') {
            v = '(空)'
          }
          return v
        })
      }
      filter.colValue = values
      if (isStr) {
        actions.fetchFilterOptions({
          chart_id: params.id || '',
          dataset_field_id: filter.dataset_field_id,
          dataset_id: filter.dataset_id,
        })
      }
    })

    // 穿透 id 赋值给 newState
    newState.id = data.id

    return newState
  },

  // 获取单图的数据
  _fetchChartData(successCb) {
    const {
      info,
      indicators,
      conditions,
      switchingDataSet,
      preIndicators,
      through_active
    } = this.state
    if (info.chart_code && !switchingDataSet) {
      // 设置 pending 状态
      this.setState({
        ...this.state,
        chart_pending: true,
        chart_data: null
      })
      const data = this._convertData(this.state, through_active - 1)
      // 加入display_item 限制查询条目数, 如果本身没有设置的情况下。应该取本地配置
      const chart = this._getChartFromChartList(info.chart_code)
      if (chart) {
        Object.assign(data, {
          display_item: chart.display_item
        })
      }

      this.props.actions.fetchChartData(data, (json) => {
        let chart_data = null

        if (!json.result) {
          this.showErr(json.msg);
        } else if (json.msg !== '') {
          this.showTip({
            timeout: 5000,
            content: json.msg
          })
        }
        chart_data = {
          indicators: {
            dims: indicators['维度'],
            nums: indicators['数值']
          },
          data: !json.result ? json.msg : json.data.data,
          conditions
        }

        this.state.chart_data = chart_data
        this.state.chart_pending = false
        this._refreshChart()
        const layoutExtend = (typeof data.layout_extend === 'string' && data.layout_extend) ? JSON.parse(data.layout_extend) : _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[data.chart_code])
        this.setState({
          chart_data,
          switchingDataSet,
          preIndicators,
          layoutExtend,
          chart_pending: false
        })

        successCb && successCb()
      })
    }
  },

  _refreshChart() {
    // 如果没有切换数据集
    if (!this.state.switchingDataSet) {
      this.state.chart_uuid = new Date().getTime()
    }
  },

  _convertData(state, through_index) {
    state = state || this.state
    const { params, chartDataInfo } = this.props
    const { info, heatOption, indicators, conditions, filters, through_active, default_value } = state
    let layoutExtend
    let colours = null

    const mode = this._mode()
    const data = _.cloneDeep(info)
    const defaultConfig = info.chart_code ? _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[info.chart_code]) : null
    // 如果当前的chart_code 和之前的 chart_code不一样，则清空当前的配置
    if (through_index > -1) {
      if (chartDataInfo && chartDataInfo.penetrates[through_index]) {
        if (info.chart_code !== chartDataInfo.penetrates[through_index].chart_code) {
          layoutExtend = defaultConfig
        } else {
          const throughLayoutStr = chartDataInfo.penetrates[through_index].layout_extend
          const throughLayout = throughLayoutStr ? JSON.parse(throughLayoutStr) : defaultConfig
          layoutExtend = throughLayout && this._removeMarkLineConfig(throughLayout, indicators['数值'])
          colours = chartDataInfo.penetrates[through_index].colours
        }
      } else {
        layoutExtend = defaultConfig
      }
    } else if (chartDataInfo && (info.chart_code === chartDataInfo.chart_code)) {
      // code 更改
      const layoutStr = chartDataInfo.layout_extend
      const layout = layoutStr ? JSON.parse(layoutStr) : defaultConfig
      colours = chartDataInfo.colours
      layoutExtend = layout && this._removeMarkLineConfig(layout, indicators['数值'])
    } else {
      layoutExtend = defaultConfig
    }

    const display_item = {
      top_head: '',
      top_tail: ''
    }

    if (layoutExtend && layoutExtend.dataSeries && layoutExtend.dataSeries.displayItem && layoutExtend.dataSeries.displayItem.checked) {
      const { type, value } = layoutExtend.dataSeries.displayItem
      if (type === '前') {
        display_item.top_head = value
        display_item.top_tail = ''
      } else {
        display_item.top_head = ''
        display_item.top_tail = value
      }
    }

    Object.assign(data, {
      filters,
      default_value,
      layout_extend: _.keys(layoutExtend).length > 0 ? JSON.stringify(layoutExtend) : '',
      display_item: JSON.stringify(display_item),
      dashboard_id: params.kanban_id,
      dataset_id: info.source
    })

    // 解决编辑穿透后保存的时候 穿透配色方案丢失的问题: 复制之前的即可
    if (colours) {
      data.colours = colours
    }

    const getFieldGroup = field => indicators[this.FILED_MAP[field]].map((item, i) => {
      item.rank = i;
      return {
        ...item,
        [this.FILED_ITEM_MAP[field]]: item.id,
        alias: item.alias || item.alias_name || item.col_name
      }
    })

    if (mode === 'base') {
      // 如果图标类型是下拉筛选可能需要加入conditions,2017-08-01加入filter
      Object.assign(data, {
        dims: getFieldGroup('dims'),
        nums: getFieldGroup('nums')
      })
      // 下拉筛选 或者 穿透的时候
      if (info.chart_code === 'select_filter' || through_active > -1) {
        Object.assign(data, {
          conditions
        })
      } else {
        Object.assign(data, {
          filters: filters.map(item => ({
            ...item,
            dataset_field: item.dim
          }))
        })
      }
    } else {
      // 地址类的指标只需传递 id 就可以了
      const address = indicators['维度'][0]
      if (address) {
        Object.assign(data, {
          dims: getFieldGroup('dims'),
          nums: [],
          map: {
            content: JSON.stringify(heatOption),
            address: address.id || '',
            alias: address.alias || address.alias_name || address.col_name || '',
          }
        })
      }
    }

    // 穿透id 赋值
    if (state.id) {
      data.id = state.id
    }

    return data
  },

  _removeMarkLineConfig(layout, nums) {
    if (layout.x && layout.x.markline) {
      const newMarkline = layout.x.markline.data.filter(item => item.mode === '固定值' || nums.find(num => num.id === item.num))
      layout.x.markline.data = newMarkline
    }
    if (layout.y && layout.y.markline) {
      const newMarkline = layout.y.markline.data.filter(item => item.mode === '固定值' || nums.find(num => num.id === item.num))
      layout.y.markline.data = newMarkline
    }
    if (layout.z) {
      const newMarkline = layout.z.markline.data.filter(item => item.mode === '固定值' || nums.find(num => num.id === item.num))
      layout.z.markline.data = newMarkline
    }
    return layout
  },

  _resizeChart() {
    const echarts = this.mainChart ? this.mainChart.getEcharts() : null
    if (echarts && echarts.getChart && typeof echarts.getChart === 'function') {
      const echart = echarts.getChart()
      echart && echart.resize({
        width: $('#chart-view-wrap').find('.graph-inner-box').width(),
        height: $('#chart-view-wrap').find('.graph-inner-box').height()
      })
    }
  },

  // 根据id 从左侧的tree中找出对应的数据
  _findItemById(id, dataFeildList) {
    const data = dataFeildList || this.props.dataFeildList
    let item = null
    if (data) {
      _.values(data).every((group) => {
        group.every((_data) => {
          if (_data.id === id) {
            item = _.cloneDeep(_data)
            return false
          }
          return true
        })
        // 找到item返回false 中断循环
        return !item
      })
    }
    return item
  },

  // 根据 chart_code 获取 chart
  _getChartFromChartList(chart_code) {
    let chart = null
    let chartList = []

    Object.values(CHARTS_TYPE).forEach((chartGroup) => {
      chartList = chartList.concat(chartGroup)
    })

    // code 相符
    chart = chartList.find(item => item.code === chart_code)

    return chart
  },

  // 判断图表类型 2017-6-27 bycaocj 新增筛选类型暂时归为base类型
  _mode(data) {
    const indicators = data || this.state.indicators
    let mode = 'base'
    // 维度长度为 1, 数值长度为 0
    if (indicators['维度'].length === 1 && indicators['数值'].length === 0) {
      const address = indicators['维度'][0]
      if (address.data_type === '地址') {
        mode = 'map'
      }
    }
    return mode
  },

  _getNumObjById(id) {
    const nums = this.state.indicators['数值']
    for (let i = 0; i < nums.length; i++) {
      if (nums[i].id === id) {
        return nums[i]
      }
    }
  },

  _getThroughState(index) {
    const newState = _.cloneDeep(this.state)
    const through_item = this.state.indicators['图层'][index]
    const dims = this.state.indicators['维度'].slice(0, 1) // 初始化，只带当前的

    dims.splice(0, 1, through_item)

    newState.id = ''
    newState.confirmOptions.show = false
    newState.tipOptions.show = false
    newState.indicators['维度'] = dims
    newState.indicators['数值'] = []
    newState.heatOption = {
      zoom: 6,
      center: [116.397428, 39.90923],
      max: 20
    }
    return newState
  },

  // 判断 indicators 是否在更换数据集前后个数相同
  _matchPreIndicators() {
    const {
      preIndicators,
      indicators
    } = this.state
    // preIndicators 
    const preMode = this._mode(preIndicators)
    let match = false

    if (preMode === 'map') {
      match = this._mode(indicators)
    } else {
      match = preIndicators['维度'].length === indicators['维度'].length && preIndicators['数值'].length === indicators['数值'].length && preIndicators['图层'].length === indicators['图层'].length
    }
    return match
  },

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  },

  showScc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  // 全局的state. 穿透后 state 的相关配置要 覆盖原有 state
  THROUGH_LIST_STATE: {},

  FILED_MAP: {
    dims: '维度',
    nums: '数值',
    map: '维度',
    layers: '图层'
  },

  FILED_ITEM_MAP: {
    dims: 'dim',
    nums: 'num',
    map: 'address',
    layers: 'dim'
  },
})

const stateToProps = state => ({
  ...state.dataViewAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataViewAddOrEditActionCreators, {
    deleteChartItemData: itemDetailActionCreators.deleteChartItemData
  }), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataViewAddOrEdit)
