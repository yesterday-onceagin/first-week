
// 为柱状图 + 折线图 + 面积图 添加 x 轴线的 放大和缩小

export default function dataZoom(option, $container, thumbnail_value) {
  // rotate 为 0 
  if (Array.isArray(option.xAxis)) {
    option.xAxis[0].axisLabel.rotate = 0
  } else if (typeof option.xAxis === 'object' && option.xAxis.axisLabel) {
    option.xAxis.axisLabel.rotate = 0
  }

  // 计算得出 end 的最佳值
  const container_width = $container.clientWidth
  const min_Lenged_width = 20 // 最小宽度 (px)
  const total_lenged_items = option.series[0] ? option.series.length * option.series[0].data.length : 0 // lenged 个数
  const step_lenged_width = container_width * 0.93 / total_lenged_items
  
  let end = parseInt(step_lenged_width * 100 / min_Lenged_width)
  end = end > 100 ? 100 : end

  // 设置 interval ( x轴数据是否显示全部 )
  if (step_lenged_width < 70) {
    if (Array.isArray(option.xAxis)) {
      option.xAxis[0].axisLabel.interval = 'auto'
    } else if (typeof option.xAxis === 'object' && option.xAxis.axisLabel) {
      option.xAxis.axisLabel.interval = 'auto'
    }
  }

  return Object.assign(option, {
    dataZoom: [{
      type: 'inside',
      start: thumbnail_value ? (thumbnail_value.start || 0) : 0,
      end: thumbnail_value ? (thumbnail_value.end || end) : end
    }, {
      start: thumbnail_value ? (thumbnail_value.start || 0) : 0,
      end: thumbnail_value ? (thumbnail_value.end || end) : end,
      bottom: 0,
      backgroundColor: 'transparent',
      dataBackground: {
        lineStyle: {
          color: '#666'
        },
        areaStyle: {
          color: 'rgb(113, 115, 146)'
        }
      },
      borderColor: 'rgba(73, 143, 225, 0.3)',
      fillerColor: 'rgba(77, 131, 229, 0.15)',
      textStyle: {
        color: window.DEFAULT_ECHARTS_OPTIONS.datazoom_text_color
      }
    }]
  })
}

