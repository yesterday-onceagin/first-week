import React from 'react';
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'
import Popover from 'react-bootstrap-myui/lib/Popover'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Loading from 'react-bootstrap-myui/lib/Loading'
import Echarts from '../views/dataview/echarts'
import classnames from 'classnames'
import _ from 'lodash'
import pxSuffix from '@helpers/pxSuffix'
import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin'
import { getTextStyle } from '../helpers/dashboardUtils'
import { FILTER_TYPES, SIMPLE_TYPES, NONE_TOOLTIP_CHART_TYPE, NONE_NORMAL_TITLE_CHART_TYPE } from '../constants/dashboard'
import EchartConnect from '../views/dataview/components/EchartConnect'
import LinkDialog from '../views/dataview/components/LinkDialog'
import { getCustomScopeConfig, getCustomConfigData, concatCommonConfig } from '../views/dataview/utils/propConfigHelper'
import transferConfigFromLayoutExtend from '../views/dataview/utils/transferConfigFromLayoutExtend'
// 报告截图使用
const html2canvas = require('../libs/html2canvas')

const _isResized = (dataGrid0, dataGrid1) => (dataGrid0.w !== dataGrid1 || dataGrid0.h !== dataGrid1.h)
// 根据config 获取样式
const _getStyleFromChartConfig = (chart_config) => {
  const style = {
    whole: {},
    title: {},
  }

  const containerConfig = getCustomScopeConfig(chart_config)
  if (containerConfig) {
    // 标题
    const title = containerConfig['container.title']
    const color = containerConfig['container.title.color']
    const fontSize = containerConfig['container.title.fontSize']
    const lineHeight = containerConfig['container.title.lineHeight']
    const fontStyle = containerConfig['container.title.fontStyle']
    const textAlign = containerConfig['container.title.textAlign']
    if (_.get(title, 'show')) {
      style.title = {
        show: title.show,
        color: _.get(color, 'data'),
        fontSize: fontSize && `${fontSize.data}px`,
        lineHeight: lineHeight && `${lineHeight.data}px`,
        textAlign: _.get(textAlign, 'data'),
        ...(_.get(fontStyle, 'data'))
      }
    }
    // 容器
    const background = containerConfig['container.background']
    const backgroundColor = containerConfig['container.background.backgroundColor']
    if (_.get(background, 'show') && backgroundColor) {
      style.whole.backgroundColor = backgroundColor.data
    }

    // 边框
    const border = containerConfig['container.border']
    const borderGroup = containerConfig['container.border.borderStyle']
    if (_.get(border, 'show') && borderGroup) {
      const borderData = borderGroup.data
      style.whole.borderColor = _.get(borderData, 'borderColor')
      style.whole.borderStyle = _.get(borderData, 'borderStyle')
      style.whole.borderWidth = borderData && pxSuffix(_.get(borderData, 'borderWidth', 0))
    }
  }
  return style
}
// 根据layout 获取样式
const _getStyleFromLayout = (layout) => {
  const style = {
    whole: {},
    title: {},
  }

  if (layout.title) {
    const fontStyles = getTextStyle(layout.title.fontStyle.split(','))
    style.title = {
      show: layout.title.show,
      color: layout.title.color,
      lineHeight: `${layout.title.lineHeight}px`,
      fontSize: `${layout.title.fontSize}px`,
      textAlign: layout.title.textAlign,
      ...fontStyles
    }
  }

  if (layout.background && layout.background.show !== false) {
    style.whole.backgroundColor = layout.background.color
  }

  if (layout.border && layout.border.show) {
    style.whole.borderColor = layout.border.color
    style.whole.borderStyle = layout.border.style
    style.whole.borderWidth = pxSuffix(layout.border.width || (layout.border.style ? 1 : 0))
  }
  return style
}
// 获取样式
const _getDiaGramStyle = (layout, chart_config) => {
  const style = {
    whole: null,
    title: null
  }

  // 内置组件配置
  if (chart_config && chart_config.length > 0) {
    return _getStyleFromChartConfig(chart_config)
  } else if (layout && Object.keys(layout).length > 0) {
    return _getStyleFromLayout(layout)
  }

  return style
}

const _getActiveColor = show => (show ? { color: '#24BBF9' } : null)

const _getChartData = data => ({
  indicators: {
    nums: data.nums || [],
    dims: data.dims || [],
    desires: data.desires || [],
    zaxis: data.zaxis || []
  },
  marklines: data.marklines || [],
  data: data.chart_data,
  defaultValue: data.default_value || '',
  filterConfig: data.filter_config || {},
  conditions: data.conditions
})

// 判断是否为自定义组件
const _isCustomChart = props => !!(props && props.echart && props.echart.isCustom)

// 获取自定义组件默认配置
const _getCustomChartConfig = (props) => {
  let chartConfig = []
  if (_isCustomChart(props)) {
    const { echart, layoutExtend, chart_config, colorTheme } = props;
    chartConfig = _.cloneDeep(chart_config)
    // 默认配置数据
    if (!chartConfig || (chartConfig && chartConfig.length === 0)) {
      const _chartConfig = _.get(echart, 'designer.chartConfig')
      const _chartCode = _.get(echart, 'info.code')
      chartConfig = _chartConfig ? getCustomConfigData(concatCommonConfig(_chartConfig, _chartCode)) : []

      // 如果新配置数据为空，且旧配置数据有值的话，则进行旧数据迁移至新配置
      if (layoutExtend && Object.keys(layoutExtend).length > 0) {
        chartConfig = transferConfigFromLayoutExtend(_chartCode, layoutExtend, chartConfig, colorTheme)
      }
    }
  }
  return chartConfig
}

class DiagramSection extends React.Component {
  static propTypes = {
    echartsScaleRate: PropTypes.number,   // 等比例缩放echarts
    className: PropTypes.string,
    id: PropTypes.string,
    diagramDatasets: PropTypes.object,
    chartData: PropTypes.object,
    data: PropTypes.object,               // data 初始化展示的数据
    dataGrid: PropTypes.object,           // data 初始化展示的数据
    layoutExtend: PropTypes.object,
    chart_config: PropTypes.array,
    diagramDataset: PropTypes.object,
    colorTheme: PropTypes.object,
    isdevtools: PropTypes.bool,
    events: PropTypes.shape({             // 合并了 echarts 的 events
      onEdit: PropTypes.func,             // 编辑
      onDelete: PropTypes.func,           // 删除
      onMove: PropTypes.func,             // 移动
      onCopy: PropTypes.func,             // 复制
      onFetchThroughData: PropTypes.func, // 拉取穿透数据
      onFreshData: PropTypes.func,        // 拉取数据
      onChartChange: PropTypes.func,      // 联动
      onChartAddLink: PropTypes.func,     // 新增联动设置
      onChartDelLink: PropTypes.func      // 删除联动设置
    }),
    serial: PropTypes.number,             // serial 序列号
    editable: PropTypes.bool,             // 是否是编辑状态
    wrapperHeight: PropTypes.number,
    echart: PropTypes.object,             // 自定义组件配置
    func_config: PropTypes.object,
    throughList: PropTypes.array,
    linkList: PropTypes.object,            // 筛选范围设置
    diagramList: PropTypes.array,         // 单图列表
    sourceList: PropTypes.array,
    dataSetTree: PropTypes.array,
    getInstance: PropTypes.func,
    dashboardName: PropTypes.string,
    platform: PropTypes.string,
    onGetRelatedsource: PropTypes.func,
    onConfigChange: PropTypes.func        // 配置更新
  };

  static defaultProps = {
    platform: 'pc',
    serial: -1
  };

  constructor(props) {
    super(props)

    let through_active = props.data && props.data.through_index !== undefined ? props.data.through_index : -1
    if (through_active === 0) {
      through_active = -1
    }

    const { throughList } = props
    let through_condition = ''
    if (through_active > 0 && throughList && Array.isArray(throughList)) {
      const throughItem = throughList[through_active - 1]
      through_condition = (throughItem && throughItem.col_value) || ''
    }

    this.state = {
      through_active,               // 穿透的层级
      through_condition,            // 穿透传递的参数
      data: props.data,
      func_config: props.func_config,
      pending: false,
      operatorShow: false,
      show: false,
      showLinkDialog: false,
      uuid: new Date().getTime()    // 更新的凭据
    }

    this.resetMarkline = this._resetMarkline.bind(this)
    this.resetThroughActive = this._resetThroughActive.bind(this)
    this._startAutoRefresh()  // 自动刷新
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
    const { data, func_config, echartsScaleRate, colorTheme } = this.props;
    //console.log(clearSelect)
    // 数据不相同则，或者强制刷新, 那么更新 uuid，触发echarts组件更新
    if (echartsScaleRate !== nextProps.echartsScaleRate ||
      !_.isEqual(data, nextProps.data) ||
      !_.isEqual(colorTheme, nextProps.colorTheme) ||
      !_.isEqual(func_config, nextProps.func_config)) {
      this.setState({
        uuid: new Date().getTime(),
        data: nextProps.data,
        func_config: nextProps.func_config
      })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { layoutExtend, chart_config, dataGrid } = this.props
    const { uuid, pending, operatorShow } = this.state
    // uuid变化->触发更新
    if (uuid !== nextState.uuid) {
      return true
    }
    // pending状态变化->触发更新
    if (pending !== nextState.pending) {
      return true
    }
    // show变化->触发更新
    if (operatorShow !== nextState.operatorShow) {
      return true
    }
    // 样式变化->触发更新
    if (layoutExtend && !_.isEqual(layoutExtend, nextProps.layoutExtend)) {
      return true
    }

    if (chart_config && !_.isEqual(chart_config, nextProps.chart_config)) {
      return true
    }

    // 尺寸变化->触发更新
    if (_isResized(dataGrid, nextProps.dataGrid)) {
      return true
    }
    //
    if (!_.isEqual(this.state.data, nextState.data)) {
      return true
    }
    // 其他任何情况->不触发更新
    return false
  }

  componentDidUpdate(preProps) {
    const { layoutExtend, diagramDatasets, diagramDataset, data, serial, events } = this.props
    const diagram = this._getDiaGram();
    const $mainwrap = $(this.main_wrap)
    if (diagram) {
      diagram.resize({
        width: $mainwrap.width(),
        height: $mainwrap.height(),
      })
    }

    if (!_.isEqual(layoutExtend, preProps.layoutExtend)) {
      const refresh = layoutExtend && layoutExtend.dataSeries ? layoutExtend.dataSeries.refresh : null
      const preRefresh = preProps.layoutExtend && preProps.layoutExtend.dataSeries ? preProps.layoutExtend.dataSeries.refresh : null
      // 如果 刷新有变动，应该重新启动定时
      if (!_.isEqual(refresh, preRefresh)) {
        this._startAutoRefresh()  // 自动刷新
      }
    }

    // 数据集自动刷新新机制优先
    if (!_.isEqual(diagramDataset, preProps.diagramDataset)) {
      const refresh = diagramDataset && diagramDataset.dataSet && diagramDataset.dataSet.refresh_rate ? diagramDataset.dataSet.refresh_rate : null
      const preRefresh = preProps.diagramDataset && preProps.diagramDataset.dataSet && preProps.diagramDataset.dataSet.refresh_rate ? preProps.diagramDataset.dataSet.refresh_rate : null
      // 如果 刷新有变动，应该重新启动定时
      if (!_.isEqual(refresh, preRefresh)) {
        this._startAutoRefresh()  // 自动刷新
      }
    }

    // 如果穿透数据集更新，重新加载穿透图表数据
    const { through_active } = this.state
    const { penetrates } = data || {}
    if (through_active > 0) {
      const through_id = penetrates && penetrates[through_active - 1] && penetrates[through_active - 1].id
      if (through_id && diagramDatasets[through_id].dataSet.layers && preProps.diagramDatasets[through_id].dataSet.layers && diagramDatasets[through_id].dataSet.layers.length === preProps.diagramDatasets[through_id].dataSet.layers.length && !_.isEqual(diagramDatasets[through_id], preProps.diagramDatasets[through_id])) {
        this.setState({
          pending: true
        }, () => {
          if (events.onFetchThroughData) {
            events.onFetchThroughData(serial, through_active, this.state.through_condition, 'in', () => {
              this.setState({ pending: false })
            })
          }
        })
      }
    }
  }

  componentWillUnmount() {
    this._disposeAutoRefresh()
  }

  render() {
    //2018.01.26 caocj暂时去掉editable限制
    const { className, /* editable,  */throughList, layoutExtend, echart } = this.props;
    const { data, uuid, through_active, pending } = this.state;
    // 单图容器className
    const diagramClass = classnames('diagram-section-inner', {
      through: Array.isArray(throughList) && throughList.length >= 0 && through_active >= 0
    })
    // 单图样式解析
    const customChartConfig = _getCustomChartConfig(this.props)
    const diagramStyle = _getDiaGramStyle(layoutExtend, customChartConfig)
    // 是否为筛选器单图
    const isFilter = (data && data.chart_code === 'tablist') ? false : FILTER_TYPES.indexOf(data.chart_code) > -1  //后续标题都显示，临时处理
    // 是否为简单单图
    // const isSimple = SIMPLE_TYPES.indexOf(data.chart_code) > -1
    // 该单图类型是否无标题
    const isNoneNormalTitle = NONE_NORMAL_TITLE_CHART_TYPE.indexOf(data.chart_code) > -1
    // 样式中的设置是否有标题
    const styleTitleShow = diagramStyle.title && diagramStyle.title.show
    // 是否应该显示标题
    const notConfigTitle = echart && echart.designer && echart.designer.chartConfig && echart.designer.chartConfig.find(config => config.field === 'containerTitle' && !!config.disabled)
    const shouldTitleShow = (notConfigTitle ? false : styleTitleShow) && !isNoneNormalTitle && !isFilter
    // 顶部的行高占位
    let mainWrapTop = shouldTitleShow ? ((diagramStyle.title && diagramStyle.title.lineHeight) || 0) : 0
    if (Array.isArray(throughList) && throughList.length > 0 && through_active !== -1) {
      mainWrapTop = `${parseFloat(mainWrapTop) + 35}px`
    }

    return (
      <div className={classnames('diagram-section', className)}
        id={`diagram-section-${uuid}`}
        style={diagramStyle.whole}
      >
        <div className={diagramClass}>
          {
            shouldTitleShow && (
              <h2 style={{ ...diagramStyle.title, margin: 0 }}>
                <div className="title" style={{ marginBottom: 0, padding: '0 10px' }}>
                  {data.name}
                </div>
              </h2>
            )
          }
          {this.renderThroughListNav()}
          {this.renderTopRightMenu()}
          <div className="main-wrap" ref={(node) => { this.main_wrap = node }} style={{ top: mainWrapTop }}>
            {this.renderEcharts()}
          </div>
        </div>
        <Loading show={pending} containerId={`diagram-section-${uuid}`} />
      </div>
    );
  }

  renderTopRightMenu() {
    const { data, show, operatorShow, showLinkDialog } = this.state
    const { echart, throughList, linkList, diagramList, dataSetTree, sourceList, isdevtools } = this.props
    // 该单图类型是否无工具栏(包含了简单单图和筛选器)
    const isNoneTool = NONE_TOOLTIP_CHART_TYPE.indexOf(data.chart_code) > -1 || data.chart_code === 'area_map'
    // 筛选器、简单单图不允许有工具 筛选器不允许复制
    const isCustomChart = _isCustomChart(this.props)
    const isSimple = SIMPLE_TYPES.indexOf(data.chart_code) > -1 || (echart && echart.info && echart.info.type === 'auxiliary')
    const penetrable = isCustomChart && echart && echart.designer && echart.designer.penetrable
    const hasPenetrable = Array.isArray(throughList) && throughList.length > 0
    const hasLinkage = linkList && Array.isArray(linkList.list) && linkList.list.length > 0
    //暂时使用常量,迁移完成后使用echart的属性做判断
    const hasFilterSettings = FILTER_TYPES.indexOf(data.chart_code) > -1
    // 除去不能被筛选的图表
    const newList = _.filter(_.cloneDeep(diagramList), (list) => {
      const type = list.chart_type !== 'filter' && list.chart_type !== 'auxiliary'
      return list.id !== data.id && FILTER_TYPES.indexOf(list.chart_code) === -1 && SIMPLE_TYPES.indexOf(list.chart_code) === -1 && type
    })

    // 2018.3.6 新增柱状图、堆叠柱状图编辑约束, 迁移全部完成前的特殊处理
    const dontNeedEdit = ['stack_bar', 'cluster_column', 'horizon_bar', 'horizon_stack_bar'].indexOf(data.chart_code) > -1
    // 2018.1.26联动设置暂时为筛选设置(只对筛选器有效)
    const menuItems = (
      <Popover className="tool-pop">
        {
          !isdevtools && hasFilterSettings ? (
            <div className="item item-no-hover">
              <span onClick={this.handleAction.bind(this, 'createLink')}>筛选设置</span>
              {hasLinkage && <span onClick={this.handleAction.bind(this, 'delLink')}> <i className="dmpicon-del" style={{ verticalAlign: '-5%' }}></i></span>}
            </div>
          ) : null
        }
        {
          (!isdevtools && hasPenetrable) ?
            <div className="item" onClick={this.handleAction.bind(this, 'delThrough')}>
              删除穿透
            </div> : (!isdevtools && penetrable) ?
              <div className="item" onClick={this.handleAction.bind(this, 'createThrough')}>
                添加穿透
              </div> : null
        }
        {
          (isdevtools || isNoneTool || dontNeedEdit) ? null : (
            <div className="item"
              onClick={this.handleOption.bind(this)}>
              <span style={_getActiveColor(show)}>
                工具
              </span>
            </div>
          )
        }
        {
          (isdevtools || hasFilterSettings) ? null : (
            <div className="item" onClick={this.handleAction.bind(this, 'copy')}>
              复制
            </div>
          )
        }
        {
          isdevtools ? null : (
            <div className="item" onClick={this.handleAction.bind(this, 'toImage')}>
              导出图片
            </div>
          )
        }
        {
          (!isdevtools && !hasFilterSettings && !isSimple) && (
            <div className="item" onClick={this.handleAction.bind(this, 'toExcel')}>
              导出数据
            </div>
          )
        }
        <div className="item" onClick={this.handleAction.bind(this, 'delete')}>
          删除
        </div>
      </Popover>
    );

    return (
      <div onMouseDown={(e) => { e.stopPropagation() }}
        onClick={e => e.stopPropagation()}
        className={classnames('tool-wrap', { show: operatorShow, single: (isSimple || isCustomChart) })}
      >
        {
          (isdevtools || isSimple || dontNeedEdit /* || isCustomChart 未迁移完一直保留旧的编辑入口，勿修改*/) ? null : (
            <i className="i-operate dmpicon-edit" onClick={this.handleAction.bind(this, 'edit')} />
          )
        }
        <OverlayTrigger
          container={this.diagram_set}
          trigger="click"
          placement="bottom"
          onEntered={this.handleEnter.bind(this)}
          onExited={this.handleExit.bind(this)}
          delay={0}
          rootClose
          overlay={menuItems}
        >
          <i className="i-operate dmpicon-more-01" ref={(node) => { this.diagram_set = node }} />
        </OverlayTrigger>
        {showLinkDialog && <LinkDialog
          show={showLinkDialog}
          data={data}
          diagramList={newList}
          linkList={linkList}
          sourceList={sourceList}
          dataSetTree={dataSetTree}
          onSure={this.handleSaveLink.bind(this)}
          onClose={this.handleCloseDialog.bind(this)}
          onGetRelatedsource={this.props.onGetRelatedsource}
        />
        }
      </div>
    )
  }

  renderThroughListNav() {
    const { throughList, id, editable, echartsScaleRate } = this.props
    const { through_active, data } = this.state
    // 让throuNav的字体随缩放比例增加
    const throughNavFontSize = Math.max(12 * echartsScaleRate, 12)
    return Array.isArray(throughList) && throughList.length > 0 && through_active != -1 ? (
      <ul className="through-nav" style={{ fontSize: `${throughNavFontSize}px` }}>
        {
          throughList.map((item, index) => {
            const text = index > 0 ? throughList[index - 1] && throughList[index - 1].col_value : item.alias_name || item.col_name
            return index <= through_active ? (
              <li className={through_active === index ? 'active' : ''}
                key={`diagram-through-list-nav-${id}-${index}`}
                onClick={this.handleThroughBack.bind(this, index)}
              >
                {index > 0 ? <i className="dmpicon-arrow-down" /> : null}
                <span className="wrap">
                  <span title={text}>
                    {text}
                  </span>
                  {(editable && through_active === index && through_active > 0) ? <span className="del-icon" onClick={this.handleDeleteThrough.bind(this, index)}></span> : null}
                </span>
              </li>
            ) : null
          })
        }
        {editable && through_active === throughList.length - 1 && data && data.chart_data && data.chart_data.length > 0 ? <li><i className="dmpicon-arrow-down" /><i className="dmpicon-add add-through" onClick={this.handleAction.bind(this, 'addThrough')}></i></li> : null}
      </ul>
    ) : null
  }

  renderEcharts() {
    const { layoutExtend, chart_config, throughList, func_config, events, colorTheme, echart, ...otherProps } = this.props
    const { through_active, data, uuid, show } = this.state
    // 是否为简单单图
    const isSimple = SIMPLE_TYPES.indexOf(data.chart_code) > -1 || (echart && echart.info && echart.info.type === 'auxiliary')
    const _data = _getChartData(_.cloneDeep(data))

    let dom = null
    // 简单单图与其他单图区分
    if (isSimple) {
      dom = (
        <Echarts
          {...otherProps}
          events={events}
          mode="read"
          code={data.chart_code}
          echart={echart}
          uuid={`${data.id}_${uuid}`}
          ref={(instance) => { this.diagram = instance }}
          data={_data}
          layoutOptions={layoutExtend}
          chart_config={chart_config}
          operatorShow={show}
          func_config={func_config}
          legendTheme={colorTheme}
        />
      )
    } else {
      const _events = {
        onThrough: this.handleThrough.bind(this),
        ...events
      };
      const throughabled = throughList && throughList.length > 1 && through_active < throughList.length - 1
      dom = this._getNormalEchart(_data, _events, throughabled, otherProps)
    }
    return dom;
  }

  handleAction(action, evt) {
    evt.stopPropagation();
    const { events, serial, data } = this.props;
    switch (action) {
      case 'copy':
        events.onCopy(serial, data)
        break;
      case 'delete':
        events.onDeleteSection(serial, data)
        break;
      case 'edit':
        events.onEdit(serial, data)
        break;
      case 'createThrough':
        this.handleCreateThrough()
        break;
      case 'addThrough':
        this.handleAddThrough()
        break;
      case 'delThrough':
        this.handleDeleteThrough()
        break;
      case 'createLink':
        this.handleCreateLink()
        break;
      case 'delLink':
        this.handleDeleteLink()
        break;
      case 'toImage':
        this.handleConvert2Image()
        break;
      case 'toExcel':
        events.onExportData(data)
        break;
      default:
        break;
    }
  }

  // 转换为图片
  handleConvert2Image() {
    const { echartsScaleRate, data, dataGrid } = this.props
    const { uuid } = this.state
    const dom = $(`#diagram-section-${uuid}`)
    // 点击关闭弹出菜单（避免被截图）
    document.body.click()
    // 添加转换图片时的特殊class
    dom.addClass('image-converting')
    // 提升FreelayoutItem的zIndex并添加backgroundColor 确保不被遮挡
    dom.parent().css({ zIndex: 99999, backgroundColor: '#141E39' })
    // 定义下载方法
    const downloadFunc = (blob) => {
      // 创建隐藏的可下载链接
      const eleLink = document.createElement('a')
      eleLink.download = `${data.name || data.chart_code}.jpg`
      eleLink.style.display = 'none'
      eleLink.href = URL.createObjectURL(blob)
      // 触发点击
      document.body.appendChild(eleLink)
      eleLink.click();
      // 然后移除
      document.body.removeChild(eleLink)
    }
    // 利用html2canvas库进行转换
    html2canvas(document.getElementById(`diagram-section-${uuid}`), {
      // 将比例固定为1（避免mac双倍屏自动将截图区域扩大）
      scale: 1,
      // 指定真实尺寸（dom的宽高 * 缩放比例）
      width: dom.width() * echartsScaleRate,
      height: dom.height() * echartsScaleRate
    }).then((canvas) => {
      document.body.appendChild(canvas)
      // 移除保存图片时的特殊class
      dom.removeClass('image-converting')
      // 恢复为原本的zIndex 并取消backgroundColor
      dom.parent().css({ zIndex: dataGrid.z, backgroundColor: '' })
      if (typeof canvas.toBlob === 'function') {
        // 利用canvas自身的转Blob对象方法
        canvas.toBlob(downloadFunc, 'image/jpeg');
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
        downloadFunc(blob)
      }
    })
  }

  handleOption(evt) {
    evt.stopPropagation()
    const { show } = this.state
    this.setState({
      show: !show
    })
  }

  handleExit() {
    this.setState({
      operatorShow: false
    })
  }

  handleEnter() {
    this.setState({
      operatorShow: true
    })
  }
  // 穿透进入
  handleThrough(type, data) {
    const { serial, events } = this.props
    const value = 'table,label_map'.indexOf(type) > -1 ? data : data.name.split('&')[0]
    let active = this.state.through_active
    if (active === -1) {
      active = 0
    }
    const newActive = active + 1
    this.setState(prevState => ({
      through_active: newActive,
      through_condition: value,
      pending: true,
      tipOptions: {
        ...prevState.tipOptions,
        show: false
      }
    }), () => {
      if (events.onFetchThroughData) {
        events.onFetchThroughData(serial, newActive, value, 'in', () => {
          this.setState({ pending: false })
        })
      }
    })
  }
  // 穿透返回
  handleThroughBack(active) {
    const { serial, throughList, events } = this.props
    //经常无故触发这个方法，暂时加入判断以防报错 2017-10-28 caocj
    if (!throughList[active] || this.state.through_active === active) {
      return
    }

    const value = throughList[active].col_value
    this.setState(prevState => ({
      through_active: active,
      through_condition: active > 0 ? throughList[active - 1].col_value : '',
      pending: true,
      tipOptions: {
        ...prevState.tipOptions,
        show: false
      }
    }), () => {
      if (events.onFetchThroughData) {
        events.onFetchThroughData(serial, active, value, 'back', () => {
          this.setState(prevState => ({
            pending: false,
            through_active: prevState.through_active === 0 ? -1 : prevState.through_active
          }))
        })
      }
    })
  }
  // 创建穿透
  handleCreateThrough() {
    const { id, events, diagramDataset } = this.props
    this.setState({
      through_active: 0
    }, () => {
      const { dims } = (diagramDataset && diagramDataset.dataSet) || {}
      const layer = dims && dims[0]
      if (layer && events.onChartCreateThrough) {
        events.onChartCreateThrough(id, layer)
      }
    })
  }
  // 添加穿透
  handleAddThrough() {
    const { chartData, echart, events } = this.props
    const penetrable = echart && echart.designer && echart.designer.penetrable
    if (!penetrable) {
      return this.showTip({
        status: 'error',
        content: '该图表不支持穿透'
      })
    }

    if (events.onChartAddThrough) {
      events.onChartAddThrough(chartData)
    }
  }
  // 删除穿透
  handleDeleteThrough(index) {
    const { events, serial, throughList, diagramDataset, data, chartData } = this.props;
    const active = index === undefined ? 0 : index - 1
    const value = throughList[active].col_value

    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>{active === 0 ? '确定要删除当前单图的穿透吗' : '确定要删除当前单图的本级穿透吗'}</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      ok: () => {
        this.setState({
          through_active: active,
          pending: true
        }, () => {
          if (events.onFetchThroughData) {
            events.onFetchThroughData(serial, active, value, 'back', () => {
              this.setState({
                pending: false,
                through_active: active === 0 ? -1 : active,
              }, () => {
                if (diagramDataset) {
                  diagramDataset.chart_id = diagramDataset.dataSet.id
                  diagramDataset.chart = data
                  diagramDataset.throughChart = chartData

                  if (active === 0) {
                    delete diagramDataset.dataSet.layers
                    delete diagramDataset.dataSet.penetrates
                  } else {
                    diagramDataset.dataSet.layers.splice(index)
                    diagramDataset.dataSet.penetrates.splice(index - 1)
                  }
                  events.onDatasetChange(diagramDataset, active)
                }
              })
            })
          }
        })
      }
    })
  }

  handleCloseDialog() {
    this.setState({
      showLinkDialog: false
    })
  }
  // 打开联动设置弹窗
  handleCreateLink() {
    // const { chartData, echart, events } = this.props
    // const linkage = echart && echart.designer && echart.designer.linkage
    // if (!linkage) {
    //   return this.showTip({
    //     status: 'error',
    //     content: '该图表不能触发联动'
    //   })
    // }
    this.setState({
      showLinkDialog: true
    })
    // if (events.onChartAddLink) {
    //   events.onChartAddLink(chartData)
    // }
  }

  handleSaveLink(list, relation) {
    const { chartData, events } = this.props
    const filter_config = {
      list,
      relation
    }
    const callback = (isSuccess) => {
      if (isSuccess) {
        this.setState({
          showLinkDialog: false
        })
      }
    }
    const newData = _.cloneDeep(chartData)
    newData.filter_config = filter_config
    if (events.onChartAddLink) {
      events.onChartAddLink(newData, callback)
    }
  }
  // 删除联动设置
  handleDeleteLink() {
    const { chartData, events } = this.props
    const newData = _.cloneDeep(chartData)
    newData.filter_config = null
    if (events.onChartAddLink) {
      events.onChartDelLink(newData)
    }
  }
  // 一般情况下的Echart DOM
  _getNormalEchart(_data, _events, throughabled, otherProps) {
    const { layoutExtend, chart_config, throughList, func_config, colorTheme, echart, dashboardName } = this.props
    const { data, uuid, show } = this.state
    const diagramStyle = _getDiaGramStyle(layoutExtend, chart_config)
    // 排序（仅饼图和玫瑰饼图）
    if (('pie,rose_pie').indexOf(data.chart_code) > -1) {
      const dataValid = _data && _data.indicators.dims[0] && _data.data
      if (dataValid) {
        const num = _data.indicators.nums[0]
        const dim = _data.indicators.dims[0]
        // 当num和dim中的排序均未设置时，按照num降序排序
        if (num && num.sort === null && dim.sort === null && Array.isArray(_data.data)) {
          const numKey = num.formula_mode ? `${num.formula_mode}_${num.col_name}` : num.col_name
          const numDatas = _data.data.sort((a, b) => (b[numKey] - a[numKey]))
          _data.data = numDatas
        }
      }
    }
    return (
      <Echarts
        {...otherProps}
        mode="read"
        events={_events}
        code={data.chart_code}
        echart={echart}
        uuid={`${data.id}_${uuid}`}
        ref={(instance) => { this.diagram = instance }}
        data={_data}
        layoutOptions={layoutExtend}
        chart_config={chart_config}
        operatorShow={show}
        func_config={func_config}
        showTitle={diagramStyle.title && diagramStyle.title.show}
        legendTheme={colorTheme}
        dashboardName={dashboardName}
        through={throughabled}
        throughList={throughList}
      />
    )
  }
  // 获取单图实例
  _getDiaGram() {
    const $echart = this.diagram.getEcharts()
    if ($echart && typeof $echart.getChart === 'function') {
      return $echart.getChart()
    }
    return null
  }
  // 重设辅助线
  _resetMarkline() {
    const $echart = this.diagram.getEcharts()
    if ($echart && typeof $echart.resetMarkline === 'function') {
      $echart.resetMarkline()
    }
  }

  _resetThroughActive() {
    const { serial, events, throughList } = this.props
    // 如果没有穿透图层 则不需要重置
    if (!Array.isArray(throughList) || throughList.length === 0) {
      return
    }
    this.setState({
      through_active: -1,
      pending: true
    }, () => {
      if (events.onFetchThroughData) {
        events.onFetchThroughData(serial, 0, '', 'back', () => {
          this.setState({ pending: false })
        })
      }
    })
  }

  _startAutoRefresh() {
    this._disposeAutoRefresh()
    const { events, layoutExtend, diagramDataset, id } = this.props
    let autoRefresh = {}

    if (layoutExtend && layoutExtend.dataSeries && layoutExtend.dataSeries.refresh) {
      autoRefresh = layoutExtend.dataSeries.refresh
    }

    // 数据集自动刷新最新机制优先 
    if (diagramDataset && diagramDataset.dataSet && diagramDataset.dataSet.refresh_rate) {
      const { isOpen, time, unit } = JSON.parse(diagramDataset.dataSet.refresh_rate)
      autoRefresh = {
        checked: isOpen,
        value: time,
        unit: unit && unit.toUpperCase().slice(0, 1)
      }
    }

    if (autoRefresh && autoRefresh.checked) {
      let interval = +autoRefresh.value

      const unit = autoRefresh.unit.toUpperCase()
      const units = { S: 1000, M: 1000 * 60, H: 1000 * 3600 }

      interval *= (units[unit] || 1000)
      if (interval > 0) {
        this._refreshInterval = setInterval(() => {
          if (events.onFreshData) {
            events.onFreshData(id, () => {
              this.setState({
                uuid: new Date().getTime()
              })
            })
          }
        }, interval)
      }
    }
  }

  _disposeAutoRefresh() {
    clearInterval(this._refreshInterval)
  }
}

reactMixin.onClass(DiagramSection, TipMixin)
reactMixin.onClass(DiagramSection, ConfirmMixin)

export default EchartConnect(DiagramSection)
