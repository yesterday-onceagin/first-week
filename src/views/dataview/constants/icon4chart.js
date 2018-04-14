
export const iconMap = {
  simple_text: 'dmpicon-text',
  simple_image: 'dmpicon-picture',
  simple_clock: 'dmpicon-time',
  simple_border: 'dmpicon-picture',
  simple_tab: 'chart-type-icon tablist',

  select_filter: 'chart-type-icon indicator_select',
  checkbox_filter: 'chart-type-icon checkbox_select',
  timeline: 'chart-type-icon timeline',
  time_interval_filter: 'chart-type-icon indicator_date',
  time_filter: 'chart-type-icon indicator_time',
  number_filter: 'chart-type-icon indicator_number',
  tablist: 'chart-type-icon tablist',
  table: 'chart-type-icon C200',
  numerical_value: 'chart-type-icon C310',
  gauge: 'chart-type-icon gauge',
  split_gauge: 'chart-type-icon split_gauge',
  liquid_fill: 'chart-type-icon liquid_fill',
  treemap: 'chart-type-icon treemap',
  double_axis: 'chart-type-icon double-axis',
  line: 'chart-type-icon C220',
  stack_line: 'chart-type-icon stack-line',
  area: 'chart-type-icon C350',
  stack_area: 'chart-type-icon stack-area',
  cluster_column: 'chart-type-icon C210',
  stack_bar: 'chart-type-icon stack-bar',
  horizon_bar: 'chart-type-icon horizon-bar',
  horizon_stack_bar: 'chart-type-icon horizon-stack-bar',
  flow_bar: 'chart-type-icon C320',
  pie: 'chart-type-icon C230',
  circle_pie: 'chart-type-icon circle-pie',
  rose_pie: 'chart-type-icon rose-pie',
  circle_rose_pie: 'chart-type-icon circle-rose-pie',
  funnel: 'chart-type-icon funnel',
  scatter: 'chart-type-icon C280',
  radar: 'chart-type-icon C290',
  scatter_map: 'chart-type-icon C272',
  
  candlestick: 'chart-type-icon candlestick',
  
  label_map: 'chart-type-icon label_map',
  area_map: 'chart-type-icon area_map',
}

export default function icon4chart(chartCode) {
  return iconMap[chartCode]
}
