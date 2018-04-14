
const defaultConfig = {
  // 辅助线
  markLine: { show: false },
  // 缩略轴
  thumbnail: { show: false },
  // 颜色配置 both: 可是设置切换维度和数值
  colorTheme: { both: false },
}

const chartsConfig = {
  table: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  numerical_value: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  line: {
    markLine: { show: true },
    thumbnail: { show: true },
    colorTheme: { both: false },
  },
  stack_line: {
    markLine: { show: true },
    thumbnail: { show: true },
    colorTheme: { both: false },
  },
  cluster_column: {
    markLine: { show: true },
    thumbnail: { show: true },
    colorTheme: { both: true },
  },
  pie: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  rose_pie: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  area: {
    markLine: { show: true },
    thumbnail: { show: true },
    colorTheme: { both: false },
  },
  stack_area: {
    markLine: { show: true },
    thumbnail: { show: true },
    colorTheme: { both: false },
  },
  scatter: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: true },
  },
  radar: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  scatter_map: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  label_map: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  gauge: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  funnel: {
    markLine: { show: false },
    thumbnail: { show: false },
    colorTheme: { both: false },
  },
  // 条形图
  horizon_bar: {
    markLine: { show: true },
    thumbnail: { show: false },
    colorTheme: { both: true },
  },
  // 堆叠图
  stack_bar: {
    markLine: { show: true },
    thumbnail: { show: true },
    colorTheme: { both: true },
  },
  // 堆叠条形图
  horizon_stack_bar: {
    markLine: { show: true },
    thumbnail: { show: false },
    colorTheme: { both: true },
  },
  flow_bar: {
    markLine: { show: true },
    thumbnail: { show: false },
    colorTheme: { both: false },
  }
}

export function getChartConfig(code) {
  return chartsConfig[code] || defaultConfig
}

export default chartsConfig
