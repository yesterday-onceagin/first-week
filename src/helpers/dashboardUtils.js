import _ from 'lodash'
import { generateDefaultColorTheme } from '../constants/echart'
import { CHART_HAS_COLOR_THEME } from '../constants/dashboard'
import CHART_TYPE from '../views/dataview/constants/chartTypes'
import { DEFAULT_DIAGRAM_CONFIG } from '../views/dataview/diagramConfig/constants/index'
// import { hexToRgbaString } from '../views/dataview/utils/colorUtils'
/**
 * 取得layout设置
 * @param {Object} currDashboardData 
 * @return {Object}
 */
const getDashboardLayoutOptions = (currDashboardData) => {
  // 初始化
  currDashboardData = currDashboardData || {
    layout: {},
    background: {},
    platform: 'pc',
    type_selector: 1,
    selectors: {},
    scale_mode: 0 //0:等比缩放宽度铺满 1:等比缩放高度铺满 2:全屏铺满 3:原始尺寸
  };
  const dashboardLayout = {};
  // 补全layout初始值
  dashboardLayout.layout = {
    ratio: currDashboardData.layout.ratio || '16:9', // 数字:数字 或 free, 传什么值就返回什么值 默认为'16:9'
    width: +currDashboardData.layout.width || 960,
    height: +currDashboardData.layout.height || 540
  }
  // 补全background初始值
  dashboardLayout.background = {
    show: currDashboardData.background.show === undefined ? true : currDashboardData.background.show,
    color: currDashboardData.background.color || 'transparent',
    image: currDashboardData.background.image || '',
    size: currDashboardData.background.size || 'stretch',
  }
  // 默认为自定义筛选
  dashboardLayout.type_selector = currDashboardData.type_selector
  dashboardLayout.type = currDashboardData.type_selector === 0 ? 'global' : 'custom'
  dashboardLayout.selectors = currDashboardData.selectors

  // 缩放模式
  dashboardLayout.scale_mode = currDashboardData.scale_mode || 0

  // 新增的报告级筛选
  dashboardLayout.dashboard_filters = currDashboardData.dashboard_filters

  // 报告平台类型
  dashboardLayout.platform = currDashboardData.platform || 'pc'
  
  return dashboardLayout
}

// 根据background配置获得报告的背景图样式
const getDashboardBackgroundStyle = (background) => {
  if (!background.show) {
    return {}
  }

  return {
    backgroundColor: background.color || 'transparent',
    backgroundImage: background.image ? `url(${background.image})` : 'none',
    backgroundRepeat: background.size === 'tile' ? 'repeat' : 'no-repeat',
    backgroundSize: background.size === 'stretch' ? '100% 100%' : 'initial',
    backgroundPosition: background.size === 'center' ? 'center center' : 'initial'
  }
}

/**
 * 获取BORDER STYLE文字描述
 * @param {String} borderStyle 
 * @return {String}
 */
const getBorderStyleDescription = (borderStyle) => {
  switch (borderStyle) {
    case 'dashed':
      return '虚线'
    case 'dotted':
      return '点线'
    case 'solid':
    default:
      return '实线'
  }
}

/**
 * 获取字体样式(textDecoration，fontWeight，fontStyle)
 * @param  {Array}  styleArr [description]
 * @return {Object}          [description]
 */
const getTextStyle = (styleArr = []) => ({
  textDecoration: styleArr.indexOf('underline') > -1 ? 'underline' : 'none',
  fontWeight: styleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
  fontStyle: styleArr.indexOf('italic') > -1 ? 'italic' : 'normal'
})

/**
 * 随机生成单图位置
 * @param {Number} base 
 * @param {Number} range 
 * @param {Number} fix 
 * @return {Number}
 */
const getRandomPosition = (base, range, fix) => (base + Math.floor(Math.random() * range) - fix)

// 转化display_format
const parseDisplayFormat = function (nums) {
  if (nums) {
    nums.forEach((numItem) => {
      if (numItem.display_format && typeof numItem.display_format === 'string') {
        numItem.display_format = JSON.parse(numItem.display_format)
      }
    })
  }
  return nums
}

// 取得display_item
const getDisplayItem = (chart_code) => {
  let allChartTypes = []
  Object.values(CHART_TYPE).forEach((item) => {
    allChartTypes = allChartTypes.concat(item)
  })

  return allChartTypes.find(item => item.code === chart_code)
}

// 获取最大的图层z-index
const getMaxZindex = function (gList) {
  const zList = Array.isArray(gList) ? gList.map(layout => layout.z) : []
  zList.push(1500)
  return Math.max.apply(null, zList)
}

// 1优先使用后台数据
// 2然后在根据图的类型, 添加colorTheme
const getColorTheme = function (chart) {
  try {
    const colorTheme = JSON.parse(chart.colours[0].colour_content)
    if (chart.chart_code === 'double_axis') {
      colorTheme.affect = 0
    }
    // 将所有的颜色转换为rgba
    // colorTheme.customColors.forEach(colorObj => {
    //   colorObj.value = hexToRgbaString(colorObj.value)
    // })
    return colorTheme
  } catch (e) {
    return CHART_HAS_COLOR_THEME.indexOf(chart.chart_code) > -1 ? generateDefaultColorTheme() : null
  }
}

const parseStringObj = (str) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

// layoutExtend数据升级
// options = { dimsLen, numsLen }  表格的列配置需要根据数据动态生成
const layoutExtendUpgrade = ({ layout_extend, chart_code, options }) => {
  const cols = options ? (options.dimsLen + options.numsLen) : 1
  const layoutExtend = _.cloneDeep(layout_extend)
  const defaultConfig = _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[chart_code])

  if (chart_code === 'table') {
    if (!layoutExtend.cols) {
      layoutExtend.cols = defaultConfig && defaultConfig.cols
    }
    // 兼容 cols 为list的情况
    if (layoutExtend.cols && !Array.isArray(layoutExtend.cols.list)) {
      const oldList = layoutExtend.cols
      layoutExtend.cols = defaultConfig.cols
      layoutExtend.cols.list = oldList
    }
    // 剪短
    if (layoutExtend.cols && layoutExtend.cols.list) {
      layoutExtend.cols.list = layoutExtend.cols.list.slice(0, cols)
    }
    // 变长
    for (let i = 1; i < cols; i++) {
      if (defaultConfig && defaultConfig.cols && defaultConfig.cols.list) {
        defaultConfig.cols.list[i] = {
          ...defaultConfig.cols.list[0]
        }
      }
    }
  }
  /*
  配置项减少的情况如何处理？(如果减少的二级分类甚至更深层的情况？)
  */

  // 检查配置的一级分类
  const defaultOptionKeys = _.keys(defaultConfig)
  if (defaultOptionKeys && defaultOptionKeys.length > 0) {
    _.keys(layoutExtend).forEach((key) => {
      // 不在默认配置中定义的项删除
      if (defaultOptionKeys.indexOf(key) === -1) {
        _.unset(layoutExtend, key)
      }
    });
  }

  // 合并
  const newLayout = _.defaultsDeep(layoutExtend, defaultConfig)
  return newLayout
}

/**
 * Legend options convert
 * @param  {Object}           layoutExtend.legend
 * @param  {Array}            chartData.legend
 * @return {Object}
 */
const getLegendOption = (opts, data, colorTheme, scale = 1) => {
  // 是否按维度着色
  const isAffect = colorTheme && colorTheme.affect
  const o = {
    show: false,        // 默认不显示
    ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
    textStyle: {
      ...window.DEFAULT_ECHARTS_OPTIONS.textStyle
    },
    data
  }
  if (opts) {
    o.show = opts.show
    o.itemWidth = opts.fontSize * 0.8333333333333334 * scale
    o.itemHeight = opts.fontSize * 0.8333333333333334 * scale
    o.itemGap = +opts.gap * scale
    o.textStyle.fontSize = +opts.fontSize * scale
    o.textStyle.color = opts.color
    // 获得位置
    const posArr = (opts.position || 'top-center').split('-');
    ([o.top, o.left] = posArr)
  }
  // 按维度着色时不限时图例
  if (isAffect) {
    o.show = false
  }
  return o
}

/**
 * 获取边距配置
 * @param {Object} opts (layoutOptions.global)
 * @param {Object} defaultConfig
 */
const getGridOption = (opts, defaultConfig, scale = 1) => {
  const gridOption = defaultConfig || window.DEFAULT_ECHARTS_OPTIONS.grid
  if (opts) {
    const { top, bottom, left, right } = opts
    gridOption.top = top >= 0 ? (top * scale) : 0
    gridOption.right = right >= 0 ? (right * scale) : 0
    gridOption.bottom = bottom >= 0 ? (bottom * scale) : 0
    gridOption.left = left >= 0 ? (left * scale) : 0
  }
  return gridOption
}

// 进入编辑的时候, 由于没有跳转到新页面, 故可以记录id, 当返回到设计页面的时候 可以 选中当时编辑的单图
const rememberEditID = function (id) {
  window.sessionStorage.KANBAN_EDIT_ID = id
}

const getLastEditID = function (clear) {
  const id = window.sessionStorage.KANBAN_EDIT_ID
  if (clear) {
    window.sessionStorage.removeItem('KANBAN_EDIT_ID')
  }
  return id
}

// 获取csv需要的完整dataUrl
// 传入dims，nums，chart_data
const getCsvDataUrl = (data = [], dims = [], nums = [], desires = [], zaxis = []) => {
  const titles = []
  const titleKeys = []
  // 定义取key的方法
  const pickKeys = (arr, isDesire = false) => {
    if (Array.isArray(arr) && arr.length > 0) {
      arr.forEach((item) => {
        const itemName = item.alias || item.alias_name || item.col_name
        const itemKey = item.formula_mode ? `${item.formula_mode}_${item.col_name}` : item.col_name
        titles.push(`"${itemName}"`)
        titleKeys.push(`${isDesire ? 'desire_' : ''}${itemKey}`)
      })
    }
  }
  // 将维度记录到title和titleKey
  pickKeys(dims)
  // 将数值记录到title和titleKey
  pickKeys(nums)
  // 将次轴记录到title和titleKey
  pickKeys(zaxis)
  // 将目标值记录到title和titleKey
  pickKeys(desires, true)
  // 拼接第一行（作为title行）
  const titleStr = `${titles.join(',')}`
  // 拼接内容
  let contentStr = ''
  if (Array.isArray(data)) {
    contentStr = data.map(d => `${titleKeys.map(key => `"${d[key]}"`).join(',')}\n`).join('')
  }
  // 文件内容的完整字符串
  const fileStr = `\ufeff${titleStr}\n${contentStr}`
  // 完整dataUrl
  return `data:text/csv;charset=utf-8,${encodeURIComponent(fileStr)}`
}

export {
  getDashboardLayoutOptions,
  getDashboardBackgroundStyle,
  getBorderStyleDescription,
  getTextStyle,
  getRandomPosition,
  parseDisplayFormat,
  getMaxZindex,
  getColorTheme,
  parseStringObj,
  getDisplayItem,
  layoutExtendUpgrade,
  getLegendOption,
  getGridOption,
  rememberEditID,
  getLastEditID,
  getCsvDataUrl
}
