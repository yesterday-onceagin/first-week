import _ from 'lodash'

/* export const ALL_CHART_TYPE = [
  // 'pie',                    // 饼图
  'numerical_value',        // 数值图
  // 'cluster_column',         // 柱状图  [辅助线]
  // 'scatter',                // 散点图
  // 'table',                  // 表格
  // 'area',                   // 面积   [辅助线]
  'radar',                  // 雷达
  // 'line',                   // 直线   [辅助线]
  'scatter_map',            // 散点地图
  'double_axis',            // 双轴图  [辅助线]
  'circle_pie',             // 环形饼图
  'circle_rose_pie',        // 环形玫瑰
  'gauge',                  // 仪表盘
  'funnel',                 // 漏斗图
  // 'horizon_bar',            // 横向柱状图  [辅助线]
  'rose_pie',               // 玫瑰
  // 'stack_bar',              // 堆叠柱状图   [辅助线]
  // 'horizon_stack_bar',      // 横向堆叠柱状图   [辅助线]
  'stack_area',             // 堆叠面积    [辅助线]
  // 'stack_line',             // 堆叠折线    [辅助线]
  'flow_bar',               // 瀑布图
  'treemap',                // 树图

  // 'label_map',              // 标签地图

  'simple_text',            // 简单单图-文本框
  'simple_image',           // 简单单图-图片
  'simple_clock',           // 简单单图-时钟

  'checkbox_filter',        // 列表筛选
  'time_interval_filter',   // 时间区间
  'time_filter',            // 时间筛选
  'number_filter',          // 数值区间
  // 'select_filter',          // 下拉筛选
  'timeline'                // 时间轴
] */

export const CONFIG_MAP = {
  global: {
    name: '全局样式',
    element: 'Global',
    key: 0
  },
  icon: {
    name: '图标样式',
    element: 'Icon',
    key: 1
  },
  clock: {
    name: '时间器',
    element: 'Clock',
    key: 2
  },
  dataSeries: {
    name: '数据系列',
    element: 'DataSeries',
    key: 10
  },
  areaConfig: {
    name: '自定义设置',
    element: 'AreaConfig',
    key: 11,
  },
  scatterConfig: {
    name: '动效设置',
    element: 'ScatterConfig',
    key: 12,
  },
  title: {
    name: '标题',
    element: 'Title',
    key: 20
  },
  tableHeader: {
    name: '表头',
    element: 'TableHeader',
    key: 30
  },
  rows: {
    name: '行',
    element: 'TableRow',
    key: 40
  },
  cols: {
    name: '列',
    element: 'TableColumn',
    key: 50
  },
  indexCol: {
    name: '序号列',
    element: 'TableColumn',
    key: 51
  },
  serialCols: {
    name: '序号列',
    element: '',
    key: 60
  },
  gaugeText: {
    name: '文本样式',
    element: 'GaugeText',
    key: 61
  },
  liquidText: {
    name: '文字',
    element: 'LiquidText',
    key: 62
  },
  liquidWave: {
    name: '波浪',
    element: 'LiquidWave',
    key: 63
  },
  legend: {
    name: '图例',
    element: 'Legend',
    key: 65
  },
  eventNode: {
    name: '事件节点',
    element: 'EventNode',
    key: 90
  },
  eventTitle: {
    name: '节点标签',
    element: 'EventTitle',
    key: 100
  },
  x: {
    name: 'x轴',
    element: 'XSeries',
    key: 105
  },
  y: {
    name: 'y轴',
    element: 'YSeries',
    key: 110
  },
  z: {
    name: 'z轴',
    element: 'ZSeries',
    key: 120
  },
  numberValue: {
    name: '数值设置',
    element: 'NumberValue',
    key: 130
  },
  numberPrefix: {
    name: '前缀设置',
    element: 'NumberPrefix',
    key: 135
  },
  numberSuffix: {
    name: '后缀设置',
    element: 'NumberSuffix',
    key: 140
  },
  text: {
    name: '文本',
    element: 'SimpleTextConfig',
    key: 150
  },
  image: {
    name: '图片',
    element: 'SimpleImageConfig',
    key: 160
  },
  background: {
    name: '背景',
    element: 'Background',
    key: 990
  },
  border: {
    name: '边框',
    element: 'Border',
    key: 999
  },
  mapOption: {
    name: '地图配置',
    element: 'MapOption',
    key: 1000
  }
}

// 请在这里配置路径
const ECHART_CONFIT_PATH = {
  'global.top': 40, //边距
  'global.bottom': 20,
  'global.left': 20,
  'global.right': 20,

  'background.spread': false,
  'background.show': true,
  'background.color': 'transparent',

  'border.spread': false,
  'border.show': false,
  'border.color': 'transparent',
  'border.style': 'solid',
  'border.width': '0',

  'title.spread': false,
  'title.show': false,
  'title.fontSize': 16,
  'title.lineHeight': 35,
  'title.color': '#fff',
  'title.fontStyle': '',
  'title.textAlign': 'left',

  'dataSeries.spread': false,
  'dataSeries.displayItem.checked': false,
  'dataSeries.displayItem.type': '前',
  'dataSeries.displayItem.value': 20,
  'dataSeries.refresh.checked': false,
  'dataSeries.refresh.value': 0,
  'dataSeries.refresh.unit': 'H',

  'legend.spread': false,
  'legend.show': false,
  'legend.fontSize': 14,
  'legend.color': '#C7E0FF',
  'legend.position': 'top-center',
  'legend.gap': 5,

  'x.spread': false,
  'x.markline.show': true,
  'x.markline.color': '#41dfe3',
  'x.markline.width': '1',
  'x.markline.style': 'dashed',
  'x.markline.data': [],
  'x.axis.show': true,
  'x.axis.color': '#C7E0FF',
  'x.split.show': false,
  'x.split.color': '#C7E0FF',
  'x.label.show': true,
  'x.label.size': 12,
  'x.label.color': '#C7E0FF',
  'x.label.showAll': false,
  'x.label.angle': 'horizon',
  'x.label.distance': 0,

  'y.spread': false,
  'y.markline.show': true,
  'y.markline.color': '#41dfe3',
  'y.markline.width': '1',
  'y.markline.style': 'dashed',
  'y.markline.data': [],
  'y.axis.show': true,
  'y.axis.color': '#C7E0FF',
  'y.label.show': true,
  'y.label.size': 12,
  'y.label.color': '#C7E0FF',
  'y.label.showAll': false,
  'y.label.angle': 'horizon',
  'y.label.distance': 0,

  'tableHeader.spread': false,
  'tableHeader.show': true,
  'tableHeader.fontSize': 14,
  'tableHeader.lineHeight': 30,
  'tableHeader.color': '#fff',
  'tableHeader.textAlign': 'center',
  'tableHeader.fontStyle': '',
  'tableHeader.background': 'rgb(9, 46, 73)',
  // 表格的行
  'rows.spread': false,

  'rows.splitLine.checked': true,
  'rows.splitLine.color': '#062d3e',
  'rows.splitLine.style': 'solid',
  'rows.splitLine.width': 1,

  'rows.oddEven.checked': true,
  'rows.oddEven.oddBackgroundColor': 'transparent',
  'rows.oddEven.evenBackgroundColor': 'transparent',

  //表格的列, 需要根据数据的多少生成n列
  'cols.spread': false,
  'cols.list[0].styleChecked': false,
  'cols.list[0].fontSize': 14,
  'cols.list[0].color': '#fff',
  'cols.list[0].fontStyle': '',
  'cols.list[0].textAlign': 'center',
  'cols.list[0].colWidth': 100,
  'cols.list[0].background': 'transparent',
  'cols.list[0].type': 'text',
  'cols.list[0].imageWidth': 100,

  // 表格的序号列
  'indexCol.spread': false,
  'indexCol.show': false,
  'indexCol.header': '序号',
  'indexCol.fontSize': 14,
  'indexCol.color': '#fff',
  'indexCol.fontStyle': '',
  'indexCol.colWidth': 50,
  'indexCol.radius': 80,
  'indexCol.background': '#345A8A',
  // 仪表盘
  'gaugeText.fontSize': 24,
  'gaugeText.fontStyle': '',
  'gaugeText.lineHeight': 28,
  'gaugeText.distance': 75,
  'gaugeText.color': '#00FFFF',

  // 水位图文字
  'liquidText.fontSize': 24,
  'liquidText.fontStyle': 'bold',
  'liquidText.lineHeight': 28,
  'liquidText.distance': 0,
  'liquidText.color': '#488DFB',     //外部颜色
  'liquidText.insideColor': '#FFFFFF',  //内部颜色

  // 水位图波浪
  'liquidWave.count': 80,     //波浪宽度
  'liquidWave.wave': 20,     //振幅
  'liquidWave.timeline': 2,  //周期
  'liquidWave.opacity': 0.5, //透明度
  'liquidWave.gap': 150,     //相位
  'liquidWave.direct': 'right',     //相位

  // 简单单图-文本框
  'text.spread': true,
  'text.content': '',
  'text.fontSize': 24,
  'text.color': 'rgba(36,188,250,1)',
  'text.fontStyle': '',
  'text.textAlign': 'left',
  'text.lineHeight': 24,
  // 简单单图-图片
  'image.spread': true,
  'image.url': '',
  'image.ratioLock': true,
  // 图标
  'icon.spread': true,
  'icon.fontSize': 20,
  'icon.color': '#24BBF9',
  'icon.marginRight': 10,
  // 时钟
  'clock.fontSize': 16,
  'clock.color': '#fff',
  'clock.fontStyle': '',
  'clock.format': 'YYYY年MM月DD日 HH:mm:ss',

  //散点地图
  'scatterConfig.condition': 'qianN',
  'scatterConfig.type': 'circle',
  'scatterConfig.showIndex': '1', //1代表前, 2代表后
  'scatterConfig.showNumber': 5,
  'scatterConfig.size': 35,
  'scatterConfig.color': '#41DFE3'
}

const DEFAULT_COLUMN_OPTIONS = {
  'global.barBackground': 'transparent',
  'global.barDistance': 0.20,
  'global.barLabel': false,
  'global.barLabelSize': 14,    //值标签设置
  'global.barLabelType': 'inside', //值标签的位置
  'global.barLabelColor': '#C7E0FF',
  'global.barLabelDistance': 10,

  'legend.show': true
}

const EXTEND_LINES_OPTIONS = {
  'legend.show': true,
  'global.lineType': 'solid',
  'global.lineSize': 2,
  'global.lineItem': 4,      //圆点半径
  'global.lineSmooth': true,    //近似曲线
  'global.lineLabel.show': false,
  'global.lineLabel.size': 14,
  'global.lineLabel.distance': 10,
}

const EXTEND_PIE_OPTIONS = {
  //轮播设置
  'global.scroll.checked': false,
  'global.scroll.interval': 3,
  // 标签间距
  'global.labelLine.length1': 10,
  'global.labelLine.length2': 10,
  // 维度标签
  'global.labelName.show': true,
  'global.labelName.fontSize': 12,
  // 数值标签
  'global.labelValue.show': true,
  'global.labelValue.fontSize': 12,
  'global.labelValue.lineHeight': 14,
  // 百分比标签
  'global.labelPercent.show': true,
  'global.labelPercent.fontSize': 12,
}

const generateConfig = (keys, exclude = [], extend = {}) => {
  const config = {}
  Object.getOwnPropertyNames(ECHART_CONFIT_PATH).forEach((key) => {
    if (keys.indexOf(key.split('.')[0]) > -1) {
      _.set(config, key, ECHART_CONFIT_PATH[key])
    }
  })
  Object.getOwnPropertyNames(extend).forEach((key) => {
    _.set(config, key, extend[key])
  })
  exclude.forEach((key) => {
    _.unset(config, key)
  })
  return config
}

// 图表的类型配置
export const DEFAULT_DIAGRAM_CONFIG = {
  // 时间轴
  timeline: generateConfig(['background', 'border'], [], {
    'global.spread': false,
    'global.interval': 10,
    'global.height': 1,
    'global.size': 2,
    'global.isCarousel': false,
    'global.default_bg_color': '#6E8CAF',
    'global.default_selected_color': '#00FFFF',
    'global.layout': 'horizon',
    'global.distance': 5,
    'eventNode.spread': false,
    'eventNode.node_size': 8,
    'eventNode.node_color': '#6E8CAF',
    'eventNode.selected_node_color': '#00FFFF',
    'eventTitle.spread': false,
    'eventTitle.distance': 5,
    'eventTitle.size': 12,
    'eventTitle.color': '#6E8CAF',
    'eventTitle.selected_size': 12,
    'eventTitle.selected_color': '#00FFFF'
  }),
  // 表格
  /*table: generateConfig(['dataSeries', 'title', 'background', 'border', 'tableHeader', 'rows', 'cols', 'indexCol'], [], {
    'global.spread': false,
    'global.scroll.checked': false,
    'global.scroll.interVal': 5,
    'global.scroll.ln': 0,
    'global.cell.checked': true,
    'global.cell.fontSize': 14,
    'global.cell.color': '#fff',
    'global.cell.lineHeight': 30,
    'global.cell.textAlign': 'center',
    'global.qianN.checked': false,
    'global.qianN.end': 3,
    'global.qianN.fontSize': 14,
    'global.qianN.color': '#fff',
    'global.qianN.lineHeight': 30,
    'global.qianN.textAlign': 'center',
    'global.qianN.background': 'transparent',
  }),*/
  // 数值图
  // numerical_value: generateConfig(['dataSeries', 'title', 'background', 'border'], ['dataSeries.displayItem'], {
  //   'global.spread': false,
  //   'global.scroll.checked': true,
  //   'global.position': 'top',
  //   'global.align': 'center',
  //   'title.show': true,
  //   'title.color': '#c8c9c9',
  //   'numberPrefix.content': '',
  //   'numberPrefix.fontSize': 32,
  //   'numberPrefix.lineHeight': 40,
  //   'numberPrefix.color': '#C7E0FF',
  //   'numberValue.fontSize': 32,
  //   'numberValue.lineHeight': 40,
  //   'numberValue.color': '#00FFFF',
  //   'numberValue.fontStyle': '',
  //   'numberValue.textAlign': 'left',
  //   'numberValue.background': 'transparent',
  //   'numberValue.margin': 5,
  //   'numberValue.borderRadius': 2,
  //   'numberSuffix.show': true,
  //   'numberSuffix.fontSize': 32,
  //   'numberSuffix.lineHeight': 40,
  //   'numberSuffix.color': '#C7E0FF'
  // }),
  //水位图
  liquid_fill: generateConfig(['dataSeries', 'liquidText', 'liquidWave', 'background', 'border'], [
    'title.textAlign',
    'dataSeries.displayItem'
  ], {
      'dataSeries.desired_value': ''
    }),
  //仪表盘
  split_gauge: generateConfig(['dataSeries', 'title', 'background', 'border', 'gaugeText'], [
    'title.textAlign',
    'dataSeries.displayItem'
  ], {
      'title.show': true,
      'title.distance': 50,  //标题距离中间的距离
      'global.spread': false,
      'global.radius': 90,
      'global.pointer.length': 70,
      'global.pointer.color': 'RGBA(255,255,255,0.3)',
      'global.color': 'RGBA(38,51,87,1)',
      'dataSeries.desired_value': '',
      'dataSeries.percentage': false
    }),
  //占比饼图 
  gauge: generateConfig(['dataSeries', 'title', 'background', 'border', 'gaugeText'], [
    'title.textAlign',
    'dataSeries.displayItem'
  ], {
      'title.show': true,
      'global.spread': false,
      'global.radius': 75,
      'global.color': '#C7E0FF',
      'dataSeries.desired_value': '',
      'dataSeries.percentage': true
    }),
  // 散点图 没有辅助线、没有x轴网格线
  // scatter: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'x', 'y'], ['x.split', 'x.markline', 'y.markline', 'y.label.showAll', 'x.label.showAll', 'x.label.angle', 'y.label.angle']),
  // 瀑布图
  flow_bar: generateConfig(['dataSeries', 'title', 'background', 'border', 'x', 'y'], ['x.split', 'x.markline', 'y.markline']),
  // 散点地图
  scatter_map: generateConfig(['dataSeries', 'scatterConfig', 'title', 'background', 'border'], [], {
    'global.scatter.type': 'circle',
    'global.scatter.size': 16,
    'global.scatter.color': '#C7E0FF',
    'global.scatter.showName': false,
    'global.scatter.showLabel': false,
    'global.scatter.fontSize': 12,
    'global.scatter.labelColor': '#FFF'
  }),
  // 雷达图
  radar: generateConfig(['dataSeries', 'title', 'background', 'border', 'legend'], [], {
    'dataSeries.displayItem.checked': true,
    'dataSeries.desired_value': '',
  }),
  // 饼图
  // pie: generateConfig(['dataSeries', 'title', 'background', 'border', 'legend'], [], {
  //   'dataSeries.displayItem.checked': true,
  //   ...EXTEND_PIE_OPTIONS
  // }),
  // 环形饼图
  // circle_pie: generateConfig(['dataSeries', 'title', 'background', 'border', 'legend'], [], {
  //   'dataSeries.displayItem.checked': true,
  //   ...EXTEND_PIE_OPTIONS
  // }),
  // 玫瑰饼图
  // rose_pie: generateConfig(['dataSeries', 'title', 'background', 'border', 'legend'], [], {
  //   'dataSeries.displayItem.checked': true,
  //   ...EXTEND_PIE_OPTIONS
  // }),
  // 环形玫瑰饼图
  // circle_rose_pie: generateConfig(['dataSeries', 'title', 'background', 'border', 'legend'], [], {
  //   'dataSeries.displayItem.checked': true,
  //   ...EXTEND_PIE_OPTIONS
  // }),
  // 漏斗图
  // funnel: generateConfig(['dataSeries', 'title', 'background', 'border', 'legend'], [], {
  //   'dataSeries.displayItem.checked': true
  // }),
  // 树图
  // treemap: generateConfig(['dataSeries', 'title', 'background', 'border'], [], {
  //   'dataSeries.displayItem.checked': true,
  //   'global.label.fontSize': 12,
  //   'global.label.color': '#fff',
  // }),
  // 柱形图
  /*
  cluster_column: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'x', 'y', 'legend'], ['x.split', 'x.markline'], {
    ...DEFAULT_COLUMN_OPTIONS,
    'global.bottom': 0,
  }),
  */
  // 横向柱状图
  // horizon_bar: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'x', 'y', 'legend'], ['x.split', 'y.markline'], {
  //   ...DEFAULT_COLUMN_OPTIONS,
  //   'global.barLabelAlign': 'right',
  // }),
  // 堆叠柱状图
  /*
  stack_bar: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'x', 'y', 'legend'], ['x.split', 'x.markline'], {
    ...DEFAULT_COLUMN_OPTIONS,
    'global.bottom': 0,
  }),
  */
  // 横向堆叠柱状图
  // horizon_stack_bar: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'x', 'y', 'legend'], ['x.split', 'y.markline'], DEFAULT_COLUMN_OPTIONS),
  // 折线图
  // line: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'legend', 'x', 'y'], ['x.split', 'x.markline'], EXTEND_LINES_OPTIONS),
  // 面积图
  // area: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'legend', 'x', 'y'], ['x.split', 'x.markline'], EXTEND_LINES_OPTIONS),
  // 堆叠面积
  // stack_area: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'legend', 'x', 'y'], ['x.split', 'x.markline'], {
  //   'legend.show': true,
  //   ...EXTEND_LINES_OPTIONS
  // }),
  // 堆叠折线
  // stack_line: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'legend', 'x', 'y'], ['x.split', 'x.markline'], {
  //   'legend.show': true,
  //   ...EXTEND_LINES_OPTIONS
  // }),
  // 双轴图
  double_axis: generateConfig(['global', 'dataSeries', 'title', 'background', 'border', 'x', 'y', 'z', 'legend'], ['x.split', 'x.markline'], {
    'global.barBackground': 'transparent',
    'global.barDistance': 0.20,
    'global.lineType': 'solid',
    'global.lineSize': 2,
    'global.lineItem': 4,      //圆点半径
    'global.lineSmooth': true,    //近似曲线
    'global.barLabel': false,
    'global.barLabelSize': 14,    //值标签设置
    'global.barLabelColor': '#C7E0FF',
    'global.barLabelDistance': 10,
    'global.lineLabel': false,
    'global.lineLabelSize': 14,
    'global.lineLabelColor': '#C7E0FF',
    'global.lineLabelDistance': 10,

    'z.spread': false,
    'z.markline.show': true,
    'z.markline.color': '#41dfe3',
    'z.markline.width': '1',
    'z.markline.style': 'dashed',
    'z.markline.data': [],
    'z.axis.show': true,
    'z.axis.color': '#C7E0FF',
    'z.label.show': true,
    'z.label.size': 14,
    'z.label.color': '#C7E0FF',
    'z.label.distance': 0,

    'legend.show': true
  }),

  // 标签地图
  // label_map: generateConfig(['background', 'border', 'title'], [], {
  //   'global.spread': false,
  //   'global.nameColor': 'RGBA(79,236,255,1)',
  //   'global.valueColor': '#C7E0FF',
  //   'global.borderColor': '#20ADE2',
  //   'global.hoverColor': 'RGBA(242,252,253,1)',
  //   'global.markColor': '#FFFFFF',
  //   'global.markHoverColor': 'RGBA(255,255,255,1)',
  //   'global.markShadowColor': 'RGBA(43,211,255,0.6)',
  //   'global.markHoverShadowColor': 'RGBA(255,224,67,1)',
  //   'global.mapColor': 'RGBA(16,41,78,1)',
  //   'global.mapBorderColor': 'RGBA(0,219,255,1)'
  // }),

  // 列表筛选
  checkbox_filter: generateConfig(['background', 'border']),
  // 时间区间筛选
  // time_interval_filter: generateConfig(['background', 'border']),
  // 时间筛选
  time_filter: generateConfig(['background', 'border']),
  // 数值区间
  number_filter: generateConfig(['background', 'border']),
  // 下拉筛选
  //select_filter: generateConfig(['background', 'border']),

  // 简单单图-文本框
  // simple_text: generateConfig(['background', 'border', 'text']),
  // 简单单图-图片
  simple_image: generateConfig(['image']),
  // 简单单图-时钟
  simple_clock: generateConfig(['background', 'border', 'icon', 'clock'])
}
