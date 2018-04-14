import _ from 'lodash'

const LENGED_ITEM_WIDTH = 10
const LENGED_ITEM_HEIGHT = 10
const TOOLTIP_CONFINE = false
const SPLIT_LINE_TYPE = 'solid'
const SORT_METHODS = ['', '升序', '降序']
const SORT_METHODS_CLASS = ['dmpicon-sort-custom', 'dmpicon-sort-asc', 'dmpicon-sort-desc']
const DEFAULT_ECHARTS_OPTIONS = {
  grid: {
    top: 40,
    right: 20,
    bottom: 20,
    left: 20,
    containLabel: true
  },
  lengend: {
    top: 0,
    itemWidth: LENGED_ITEM_WIDTH,
    itemHeight: LENGED_ITEM_HEIGHT
  },
  confine: TOOLTIP_CONFINE,
  sort_method: SORT_METHODS,
  sort_method_class: SORT_METHODS_CLASS,
  animationDuration: 900,
  axisLabel: {
    //interval: 0, //横轴信息全部显示  
    showMaxLabel: true, // 显示最大标记
    //rotate: 45, //-45度角倾斜显示  
    /*formatter(value) {
      return value && value.length > 10 ? `${value.substr(0, 9)}...` : value;
    }*/
  },
}

// legend color themes
// 注意: colors 里面 全部使用大写字符
const defaultKey = 'tech'
export const COLOR_THEMES = {
  [defaultKey]: {
    name: '科技蓝',
    // colors: ['#41DFE3', '#488DFB', '#00B2FF', '#5D80F2', '#34C9FF', '#4EA4FF', '#5F61E6', '#21B2E2', '#8EFCFF', '#3B8FFF', '#22C7FF', '#9495FF'],
    colors: ['rgba(65,223,227,1)', 'rgba(72,141,251,1)', 'rgba(0,178,255,1)', 'rgba(93,128,242,1)',
      'rgba(52,201,255,1)', 'rgba(78,164,255,1)', 'rgba(95,97,230,1)', 'rgba(33,178,226,1)',
      'rgba(142,252,255,1)', 'rgba(59,143,255,1)', 'rgba(34,199,255,1)', 'rgba(148,149,255,1)'],
    type: 0
  },
  gradBlue: {
    name: '蓝色渐变',
    colors: [
      ['rgba(57,232,237,1)', 'rgba(155,255,230,1)'], ['rgba(69,140,247,1)', 'rgba(85,245,255,1)'], ['rgba(0,178,255,1)', 'rgba(146,192,255,1)'], ['rgba(159,159,255,1)', 'rgba(81,121,241,1)'],
      ['rgba(52,201,255,1)', 'rgba(139,242,255,1)'], ['rgba(78,164,255,1)', 'rgba(152,255,250,1)'], ['rgba(95,97,230,1)', 'rgba(202,175,255,1)'], ['rgba(0,178,255,1)', 'rgba(146,222,255,1)'],
      ['rgba(105,212,219,1)', 'rgba(209,252,255,1)'], ['rgba(60,143,253,1)', 'rgba(139,224,255,1)'], ['rgba(34,199,255,1)', 'rgba(129,250,255,1)'], ['rgba(148,149,255,1)', 'rgba(216,199,255,1)']
    ],
    /*
    colors: [
      ['#39E8ED', '#9BFFE6'], ['#458CF7', '#55F5FF'], ['#00B2FF', '#92C0FF'], ['#9F9FFF', '#5179F1'],
      ['#34C9FF', '#8BF2FF'], ['#4EA4FF', '#98FFFA'], ['#5F61E6', '#CAAFFF'], ['#00B2FF', '#92DEFF'],
      ['#69D4DB', '#D1FCFF'], ['#3C8FFD', '#8BE0FF'], ['#22C7FF', '#81FAFF'], ['#9495FF', '#D8C7FF']
    ],
    */
    type: 1,
  },
  gradStandar: {
    name: '标准渐变',
    colors: [
      ['rgba(81,130,228,1)', 'rgba(184,208,255,1)'], ['rgba(247,203,74,1)', 'rgba(255,246,219,1)'], ['rgba(105,212,219,1)', 'rgba(195,251,255,1)'], ['rgba(155,204,102,1)', 'rgba(241,255,226,1)'],
      ['rgba(63,178,126,1)', 'rgba(207,255,233,1)'], ['rgba(248,141,72,1)', 'rgba(255,222,201,1)'], ['rgba(242,82,82,1)', 'rgba(255,208,208,1)'], ['rgba(206,98,214,1)', 'rgba(252,218,255,1)'],
      ['rgba(137,84,212,1)', 'rgba(227,207,255,1)'], ['rgba(81,180,241,1)', 'rgba(191,231,255,1)'], ['rgba(82,179,186,1)', 'rgba(190,251,255,1)'], ['rgba(212,45,107,1)', 'rgba(255,212,228,1)']
    ],
    /*
    colors: [
      ['#5182E4', '#B8D0FF'], ['#F7CB4A', '#FFF6DB'], ['#69D4DB', '#C3FBFF'], ['#9BCC66', '#F1FFE2'],
      ['#3FB27E', '#CFFFE9'], ['#F88D48', '#FFDEC9'], ['#F25252', '#FFD0D0'], ['#CE62D6', '#FCDAFF'],
      ['#8954D4', '#E3CFFF'], ['#51B4F1', '#BFE7FF'], ['#52B3BA', '#BEFBFF'], ['#D42D6B', '#FFD4E4']
    ],
    */
    type: 1,
  },
  simple: {
    name: '简洁明快',
    colors: ['rgba(81,130,228,1)', 'rgba(105,212,219,1)', 'rgba(247,203,74,1)', 'rgba(155,204,102,1)',
      'rgba(63,178,126,1)', 'rgba(248,141,72,1)', 'rgba(242,82,82,1)', 'rgba(206,98,214,1)',
      'rgba(137,84,212,1)', 'rgba(81,180,241,1)', 'rgba(81,179,187,1)', 'rgba(212,45,107,1)'],
    //colors: ['#5182E4', '#69D4DB', '#F7CB4A', '#9BCC66', '#3FB27E', '#F88D48', '#F25252', '#CE62D6', '#8954D4', '#51B4F1', '#51B3BB', '#D42D6B'],
    type: 0
  },
  fall: {
    name: '金秋宜人',
    colors: ['rgba(191,155,48,1)', 'rgba(46,88,110,1)', 'rgba(231,202,130,1)', 'rgba(175,115,75,1)',
      'rgba(64,102,180,1)', 'rgba(38,136,137,1)', 'rgba(192,151,27,1)', 'rgba(100,81,81,1)',
      'rgba(145,137,87,1)', 'rgba(64,116,97,1)', 'rgba(115,91,75,1)', 'rgba(158,142,101,1)'],
    //colors: ['#BF9B30', '#2E586E', '#E7CA82', '#AF734B', '#4066B4', '#268889', '#C0971B', '#645151', '#918957', '#407461', '#735B4B', '#9E8E65'],
    type: 0
  },
  blue: {
    name: '深蓝海底',
    colors: ['rgba(74,114,201,1)', 'rgba(117,96,191,1)', 'rgba(120,169,242,1)', 'rgba(96,113,197,1)',
      'rgba(162,204,248,1)', 'rgba(137,160,211,1)', 'rgba(73,102,183,1)', 'rgba(72,156,226,1)',
      'rgba(71,184,226,1)', 'rgba(96,135,191,1)', 'rgba(105,212,219,1)', 'rgba(57,140,158,1)'],
    //colors: ['#4A72C9', '#7560BF', '#78A9F2', '#6071C5', '#A2CCF8', '#89A0D3', '#4966B7', '#489CE2', '#47B8E2', '#6087BF', '#69D4DB', '#398C9E'],
    type: 0
  },
};

export function getDefaultGradAngle(chartCode) {
  switch (chartCode) {
    case 'horizon_bar':
    case 'horizon_stack_bar':
      return 90
    default:
      // 垂直渐变
      return 0
  }
}

export function getAllColorThemes(gradient = true) {
  if (!gradient) {
    return _.pickBy(COLOR_THEMES, theme => theme.type === 0)
  }
  return COLOR_THEMES
}

export function getThemeByKey(themeKey) {
  return COLOR_THEMES[themeKey] || COLOR_THEMES[defaultKey]
}

export function getColorFromColorTheme({ themeKey, customColors }, index, code, resetAngle) {
  let color = customColors && customColors[index] && customColors[index].value
  if (!color) {
    // 循环使用color
    const themeObj = getThemeByKey(themeKey)
    const len = themeObj.colors.length
    color = themeObj.colors[index % len]
  }
  // 渐变色有个磨人的角度
  if (Array.isArray(color) && (resetAngle || color[2] === undefined || color[2] === null)) {
    color = [...color]
    color[2] = getDefaultGradAngle(code)
  }
  return color
}
// gradientDefaultAngle = 0垂直渐变
// 此方法用于chart sdk 自定义组件的
export function getColorFromTheme({ themeKey, customColors }, index, gradientDefaultAngle = 0) {
  let color = customColors && customColors[index] && customColors[index].value
  if (!color) {
    // 循环使用color
    const themeObj = getThemeByKey(themeKey)
    const len = themeObj.colors.length
    color = themeObj.colors[index % len]
  }
  // 渐变色有个磨人的角度
  if (Array.isArray(color) && (color[2] === undefined || color[2] === null)) {
    color = [...color]
    color[2] = gradientDefaultAngle
  }
  return color
}

// 弧度转换成echarts [x1, y1, x2, y2]
const _angelToPoints = function (radians) {
  const { cos, sin, PI } = Math
  const offset = PI / 2
  // 根据圆的方程
  return [
    0.5 * cos(radians + offset) + 0.5,
    0.5 * sin(radians + offset) + 0.5,
    0.5 * cos(radians + PI + offset) + 0.5,
    0.5 * sin(radians + PI + offset) + 0.5,
  ]
}

const _getParamFromAngle = function (angle) {
  return _angelToPoints(angle / 180 * Math.PI)
}
// 此方法用于chart sdk
// 生成普通颜色或者渐变色
export function getEchartColorFromTheme(echarts, legendTheme, index, gradientDefaultAngle = 0) {
  let color = getColorFromTheme(legendTheme, index, gradientDefaultAngle)
  if (Array.isArray(color)) {
    const angle = color[2]
    const param = _getParamFromAngle(angle)
    color = new echarts.graphic.LinearGradient(param[0], param[1], param[2], param[3], [{ offset: 0, color: color[0] }, { offset: 1, color: color[1] }])
  }
  return color
}

// 数据库需要把这个对象的 stringify
export function generateDefaultColorTheme(key) {
  key = COLOR_THEMES[key] ? key : defaultKey
  return {
    v: '1',               // 版本
    themeKey: key,
    customColors: [],
    affect: 0,            // 0: 默认(每一种图都有默认根据维度或者数值来设置颜色), 1: 反向(如柱状图 散点图)
  }
}

export function customColorAtIndex(colorTheme, { index, color, colName, formulaMode }) {
  colorTheme.customColors[index] = {
    value: color,
    colName: colName || '',                  // 预留字段
    formulaMode: formulaMode || ''          // 预留字段
  }
  return colorTheme
}

export function setTheme() {
  const LENGED_COLOR = '#c8c9c9'
  const AXIS_LINE_COLOR = '#79A1D0'
  const SPLIT_LINE_COLOR = 'rgba(73, 143, 225, 0.08)'
  const RADAR_SPLIT_LINE_COLOR = 'rgba(91, 134, 185, .5)'
  const SPLIT_AREA_COLORS = ['transparent', 'rgba(91, 134, 185, .2)']
  // 默认是科技蓝
  const COLOR = ['#41DFE3', '#488DFB', '#00B2FF', '#5D80F2', '#34C9FF', '#4EA4FF', '#5F61E6', '#21B2E2', '#8EFCFF', '#3B8FFF', '#22C7FF', '#9495FF']
  const TABLE_HEADER_COLOR = '#092e49'
  const SCATTRER_SHADOW_COLOR = 'transparent'
  const SCATTRER_START_COLOR = '#15c9ff'
  const SCATTRER_END_COLOR = '#527DFD'
  const SCATTER_MAP_COLOR = ['#265092', '#3581d4', '#17244b']
  const MAPSTYLEK = 'blue_night'
  const TOOLTIP = {
    backgroundColor: '#22325d',
    extraCssText: 'box-shadow: 2px 2px 8px #141E39;max-height: 450px;overflow-y:auto; transform: translateZ(1px);',
    titleColor: '#fff'
  }
  const DATAZOOM_TEXT_COLOR = '#fff'
  const SCATTER_MAP_TEXT_COLOR = '#fff'
  const DATAVIEW_COLOR = ['#141E39', '#24BBF9']
  const PIELEGEND = {
    iconColor: '#aaa',
    inactiveColor: '#2f4554',
    textColor: '#fff'
  }

  const NUMBER_VALUE_STYLE = {
    titleColor: 'rgba(200,201,201,1)',
    valueColor: 'rgba(0,255,255,1)'
  }

  const DIAGRAM_STYLE = {
    titleColor: 'rgba(36, 188, 250, 1)',
    tableHead: {
      color: 'rgba(121, 161, 208, 1)',
      background: 'rgba(9, 46, 73, 0.3)'
    },
    tableBody: {
      color: 'rgba(255,255,255,1)',
      horizonBorderColor: 'rgba(6,45,62,1)',
      verticalBorderColor: 'rgba(6,45,62,1)'
    }
  }

  window.DEFAULT_ECHARTS_OPTIONS = {
    ...DEFAULT_ECHARTS_OPTIONS,
    color: COLOR,
    colorThemes: COLOR_THEMES,
    getColorFromColorTheme,
    textStyle: {
      color: LENGED_COLOR
    },
    axisLine: {
      lineStyle: {
        color: AXIS_LINE_COLOR
      }
    },
    splitLine: {
      lineStyle: {
        color: SPLIT_LINE_COLOR,
        type: SPLIT_LINE_TYPE
      }
    },
    splitArea: {
      areaStyle: {
        // 使用深浅的间隔色
        color: SPLIT_AREA_COLORS
      }
    },
    radar_splitLine: {
      lineStyle: {
        color: RADAR_SPLIT_LINE_COLOR
      }
    },
    axisLabel: {
      ...DEFAULT_ECHARTS_OPTIONS.axisLabel
    },
    table_header_color: TABLE_HEADER_COLOR,
    scattrer_shadow_color: SCATTRER_SHADOW_COLOR,
    scattrer_start_color: SCATTRER_START_COLOR,
    scattrer_end_color: SCATTRER_END_COLOR,
    scatter_map_color: SCATTER_MAP_COLOR,
    tooltip: TOOLTIP,
    datazoom_text_color: DATAZOOM_TEXT_COLOR,
    scatter_map_text_color: SCATTER_MAP_TEXT_COLOR,
    dataview_color: DATAVIEW_COLOR,
    pieLegend: {
      pageIconColor: PIELEGEND.iconColor,
      pageIconInactiveColor: PIELEGEND.inactiveColor,
      pageTextStyle: PIELEGEND.textColor
    },
    numberValueStyle: NUMBER_VALUE_STYLE,
    digramStyle: DIAGRAM_STYLE
  }
  window.MAPSTYLEK = MAPSTYLEK
}

//散点图半径的最大值
export const MAX_SCATTER_RADIUS = 50
//散点图半径的最小值
export const MIN_SCATTER_RADIUS = 35
