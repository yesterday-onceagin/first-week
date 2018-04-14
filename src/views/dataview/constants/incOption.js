
export const INDICATOR_TYPE = ['数值', '枚举', '地址', '字符串', '日期']

export const INDICATOR_TYPE_LOGO = ['日期', '数值', '文本']

export const INDICATOR_TYPE_LOGO_MAP = {
  数值: '数值',
  枚举: '文本',
  字符串: '文本',
  地址: '文本',
  日期: '日期'
}

// 枚举 类型的 
export const DIMENSIONS = {
  数值: [],
  枚举: [],
  字符串: [],
  地址: [],
  日期: [{
    opt: 'day',
    text: '按日'
  }, {
    opt: 'month',
    text: '按月'
  }, {
    opt: 'year',
    text: '按年'
  }, {
    opt: 'hour',
    text: '按时'
  }, {
    opt: 'minute',
    text: '按分'
  }, {
    opt: 'second',
    text: '按秒'
  // }, {
  //   opt: null,
  //   text: '默认值'
  }]
}

// 数值类型
export const NUMBER = {
  数值: [{
    opt: 'sum',
    text: '求和'
  }, {
    opt: 'count',
    text: '计数'
  }, {
    opt: 'avg',
    text: '平均值'
  }, {
    opt: 'max',
    text: '最大值'
  }, {
    opt: 'min',
    text: '最小值'
  }, {
    opt: 'distinct',
    text: '去重计数'
  // }, {
  //   opt: null,
  //   text: '默认值'
  }],
  枚举: [{
    opt: 'count',
    text: '计数'
  }, {
    opt: 'distinct',
    text: '去重计数'
  // }, {
  //   opt: null,
  //   text: '默认值'
  }],
  字符串: [{
    opt: 'count',
    text: '计数'
  }, {
    opt: 'distinct',
    text: '去重计数'
  // }, {
  //   opt: null,
  //   text: '默认值'
  }],
  地址: [{
    opt: 'count',
    text: '计数'
  }, {
    opt: 'distinct',
    text: '去重计数'
  // }, {
  //   opt: null,
  //   text: '默认值'
  }],
  日期: [{
    opt: 'count',
    text: '计数'
  }, {
    opt: 'distinct',
    text: '去重计数'
  // }, {
  //   opt: null,
  //   text: '默认值'
  }]
}

export const NUMERAL = {
  数值: []
}

export const OPTION_MAPS = {
  去重计数: 'distinct',
  最大值: 'max',
  最小值: 'min',
  求和: 'sum',
  平均值: 'avg',
  计数: 'count',
  按年: 'year',
  按月: 'month',
  按日: 'day',
  按时: 'hour',
  按分: 'minute',
  按秒: 'second',
  // 默认值: null
}

export const RESERVE_OPTION_MAPS = {
  distinct: '去重计数',
  min: '最小值',
  max: '最大值',
  sum: '求和',
  avg: '平均值',
  count: '计数',
  year: '按年',
  month: '按月',
  day: '按日',
  hour: '按时',
  minute: '按分',
  second: '按秒'
}

export const SORT_CHART_TYPE = [
  'cluster_column',
  'stack_bar',
  'line',
  'stack_line',
  'table',
  'rose_pie',
  'pie',
  'circle_pie',
  'circle_rose_pie',
  'flow_bar',
  'area',
  'stack_area',
  'horizon_bar',
  'horizon_stack_bar',
  'funnel',
  'treemap',
  'double_axis',
  'area_map',
  'label_map'
]
export const SELECTOR_CHART_TYPE = [
  'cluster_column',
  'stack_bar',
  'horizon_bar',
  'horizon_stack_bar',
  'flow_bar',
  'line',
  'stack_line',
  'rose_pie',
  'pie',
  'circle_pie',
  'circle_rose_pie',
  'funnel',
  'area',
  'stack_area',
  'treemap',
  'double_axis',
  'label_map'
]

export const THROUGH_CHART_TYPE = [
  'table',
  'cluster_column',
  'stack_bar',
  'line',
  'stack_line',
  'pie',
  'circle_pie',
  'circle_rose_pie',
  'rose_pie',
  'area',
  'stack_area',
  'horizon_bar',
  'horizon_stack_bar',
  'funnel',
  'treemap',
  'double_axis',
  'flow_bar',
  'scatter_map',
  'label_map'
]

// 次轴图标类型选择 dropdown,暂时只支持折线一种
export const ZAXIS_CHART_TYPE = [
  {
    rule: [{
      value: {
        min: '1'
      }
    }],
    code: 'line',
    icon: 'C220',
    description: '折线图(1个或多个数值)'
  }, {
    rule: [{
      value: {
        min: '1'
      }
    }],
    code: 'bar',
    icon: 'C210',
    description: '柱状图(1个或多个数值)'
  }, {
    rule: [{
      value: {
        min: '1'
      }
    }],
    code: 'area',
    icon: 'C350',
    description: '面积图(1个或多个数值)'
  }
]

// 地址类型 dropDown
export const ADDRESS = {
  数值: [],
  枚举: [],
  字符串: [],
  地址: [],
  日期: []
}

// 页面
export const DEFAULT_INC_OPTION = {
  图层: DIMENSIONS,
  维度: DIMENSIONS,
  数值: NUMBER,
  计算高级: NUMERAL,
  地址: ADDRESS
}
