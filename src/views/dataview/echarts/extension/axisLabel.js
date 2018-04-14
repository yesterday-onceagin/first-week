// 对 xaxislabel - x 轴间隔处理
export default function axisLabel(option, $container) {
  const container_width = $container.clientWidth

  if (Array.isArray(option.series) && option.series.length > 0) {
    const total_lenged_items = option.series[0].data.length
    const visiableItems = Math.ceil(container_width * 0.93 / 80)   // 可见个数

    // 如果 数据大于 可见个数
    if (total_lenged_items > visiableItems) {
      const interval = Math.ceil(total_lenged_items / visiableItems) - 1
      // 设置 interval
      if (Array.isArray(option.xAxis)) {
        option.xAxis[0].axisLabel.interval = interval
      } else if (typeof option.xAxis === 'object') {
        option.xAxis.axisLabel.interval = interval
      }
    }
  }
  return option
}
