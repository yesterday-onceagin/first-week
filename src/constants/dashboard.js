/*
* 数据报告的相关常量
*/

// 单图间距
const GRID_MARGIN = 4;

// GRID宽度份数
const GRID_COL_NUM = 12;

// 插件需要的参数
const GRID_COLS = {
  lg: GRID_COL_NUM,
  md: GRID_COL_NUM,
  sm: GRID_COL_NUM,
  xs: GRID_COL_NUM,
  xxs: GRID_COL_NUM
}
// 宽高比
const RATIO = 2;

// 筛选器默认宽度/高度
const DEFAULT_FILTER_W = 3;
const DEFAULT_FILTER_H = 2;

// 单图默认宽度/高度
const DEFAULT_CHART_W = 3;
const DEFAULT_CHART_H = 3;

// 筛选器类型
const FILTER_TYPES = [
  'select_filter',
  'number_filter',
  'time_filter',
  'time_interval_filter',
  'checkbox_filter',
  'timeline',
  'tablist'
];

// 简单单图类型
const SIMPLE_TYPES = [
  'simple_text',
  'simple_image',
  'simple_clock',
  'simple_border',
  'simple_tab',
];

const NONE_NORMAL_TITLE_CHART_TYPE = [
  'numerical_value',
  'gauge',
  'split_gauge',
  'liquid_fill'
];

const NONE_TOOLTIP_CHART_TYPE = [
  ...SIMPLE_TYPES,
  ...FILTER_TYPES,
  'treemap',
  'scatter',
  'scatter_map',
  'radar',
  'gauge',
  'split_gauge',
  'liquid_fill',
  'number_filter',
  'time_filter',
  'select_filter',
  'checkbox_filter',
  'time_interval_filter',
  'table',
  'numerical_value',
  'label_map'
];

const getLayoutWH = function (chartCode) {
  const isFilter = FILTER_TYPES.indexOf(chartCode) > -1
  const isSimple = SIMPLE_TYPES.indexOf(chartCode) > -1
  if (chartCode === 'label_map') {
    return { w: 720, h: 540 }
  }
  if (isFilter || isSimple) {
    if (chartCode === 'simple_text') {
      return { w: 220, h: 100 }
    } else if (chartCode === 'simple_clock') {
      return { w: 300, h: 60 }
    } else if (chartCode === 'simple_tab') {
      return { w: 220, h: 42 }
    }
    return { w: 360, h: 270 }
  }
  return { w: 480, h: 360 }
}
// 拥有colorTheme 的单图类型
const CHART_HAS_COLOR_THEME = [
  'pie', 'cluster_column', 'scatter', 'area',
  'radar', 'line', 'scatter_map', 'double_axis',
  'circle_pie', 'circle_rose_pie', 'gauge', 'split_gauge', 'liquid_fill', 'funnel', 'horizon_bar',
  'rose_pie', 'stack_bar', 'horizon_stack_bar', 'stack_area', 'stack_line',
  'flow_bar', 'treemap'
]

// 可以切换维度和数值的单图类型
const CHART_HAS_AFFECT = [
  'scatter',
  'cluster_column',
  'horizon_bar',
  'stack_bar',
  'horizon_stack_bar'
]

export {
  GRID_MARGIN,
  GRID_COL_NUM,
  GRID_COLS,
  RATIO,
  DEFAULT_FILTER_W,
  DEFAULT_FILTER_H,
  DEFAULT_CHART_W,
  DEFAULT_CHART_H,
  FILTER_TYPES,
  SIMPLE_TYPES,
  getLayoutWH,
  NONE_TOOLTIP_CHART_TYPE,
  NONE_NORMAL_TITLE_CHART_TYPE,
  CHART_HAS_COLOR_THEME,
  CHART_HAS_AFFECT
};
