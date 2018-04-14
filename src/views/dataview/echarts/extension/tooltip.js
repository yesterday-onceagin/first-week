import { formatDisplay } from '../../utils/generateDisplayFormat'

const _gC = function (color) {
  //渐变
  if (typeof color === 'object') {
    return color.colorStops[0].color
  }
  return color
}
/**
 * toottip
 * @param  option    
 * @param  sub_data -> 只对 radar | pie | scater 图生效
 *         fullScreen : 全屏单图字体需要放大
 */

const format = function (dF, value) {
  return `${formatDisplay(value, dF)}${(dF && dF.column_unit_name && dF.column_unit_name) || ''}`
}

export default function tooltip(option, sub_data, fullScreen, dataOrigin, canvas, $canvas, chartCode, scaleRate) {
  const { displayFormat, dimsForRelated } = dataOrigin || {}
  const dF = displayFormat || {}
  // 调整显示 toottip
  option.tooltip.backgroundColor = window.DEFAULT_ECHARTS_OPTIONS.tooltip.backgroundColor;
  option.tooltip.extraCssText = window.DEFAULT_ECHARTS_OPTIONS.tooltip.extraCssText;
  option.tooltip.enterable = true
  option.tooltip.hideDelay = 500

  const titleColor = window.DEFAULT_ECHARTS_OPTIONS.tooltip.titleColor
  const titleFS = fullScreen ? '20px' : '14px'
  const valueFS = fullScreen ? '18px' : '10px'

  option.tooltip.formatter = (data) => {
    if (data && data.componentType === 'markLine') {
      return `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${data.name}</span>`
    } else if (data && (data.seriesType === 'pie' || data.seriesType === 'funnel')) {
      let valueStr = data.value
      let _dF = null
      if (dimsForRelated) {      // 有维度
        const keys = Object.keys(dF)
        if (keys.length > 0) {
          _dF = dF[keys[0]]
        }
      } else {
        _dF = dF[data.name]
      }
      if (_dF) {
        valueStr = format(_dF, valueStr)
      }
      return `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${data.name}: ${valueStr} (${Number(data.percent).toFixed(2)}%)</span>`
    } else if (data && data.seriesType === 'treemap') {
      let valueStr = data.value
      let _dF = null
      if (dimsForRelated) {      // 有维度
        const keys = Object.keys(dF)
        if (keys.length > 0) {
          _dF = dF[keys[0]]
        }
      }
      if (_dF) {
        valueStr = format(_dF, valueStr)
      }
      return `<span style="font-size: ${14 / scaleRate}px; color: ${_gC(data.color)}">${data.name}: ${valueStr} </span>`
    } else if (data && data.seriesType === 'radar') {
      const groups = []
      const _dF = dF[data.name]
      sub_data.forEach((item, i) => {
        const valueStr = format(_dF, data.value[i])
        groups.push(`<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${item.name}：${valueStr}</span>`)
      })
      return `<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${data.name}</span><br/>${groups.join('<br/>')}`
    } else if (data && (data.seriesType === 'scatter' || data.seriesType === 'effectScatter')) {
      // 散点地图
      if (sub_data && sub_data === 'scatter_map') {
        let valueStr = data.data.value[2]
        const _dF = dF[data.seriesName]
        valueStr = format(_dF, valueStr)
        return `<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${data.seriesName}</span><br/><span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${data.data.name}：${valueStr}</span>`
      }
      const title = data.data.value[data.data.value.length - 1] || ''
      let text = ''

      sub_data && sub_data.forEach((item, i) => {
        const _dF = dF[item]
        let valueStr = data.data.value[i]
        valueStr = format(_dF, valueStr)
        text += i < sub_data.length - 1
          ? `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${item}: ${valueStr}</span><br/>`
          : `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${item}: ${valueStr}</span>`
          // : `<span style="font-size: ${valueFS}; color: ${data.color.colorStops[0].color}">${item}: ${data.data[i]}</span>`
      })
      return title ? `<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${title}</span><br/>${text}` : text
    } else if (chartCode === 'flow_bar') {
      const tar = data[data.length - 1]
      const _dF = dF[tar.seriesName]
      let valueStr = tar.data.value
      valueStr = format(_dF, valueStr)
      return `<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${tar.name}</span><br/>` +
        `<span style="font-size: ${valueFS}; color: ${_gC(tar.color)}">${tar.seriesName}: ${valueStr}</span>`;
    } else if (chartCode === 'double_axis') {
      const tmpl = []
      data.forEach((item, index) => {
        if (index > 1) {
          return
        }
        if (index === 0 && !!item.name) {
          tmpl.push(`<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${item.name}</span>`)
        }
        let valueStr = item.value
        const _dF = dF[item.seriesName]
        valueStr = format(_dF, valueStr)
        tmpl.push(`<span style="font-size: ${valueFS}; color: ${_gC(item.color)}">${item.seriesName}: ${valueStr}</span>`)
      })
      return tmpl.join('<br>')
    }
    const tmpl = []
    data.forEach((item, index) => {
      if (index === 0 && !!item.name) {
        tmpl.push(`<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${item.name}</span>`)
      }
      let valueStr = item.value
      const _dF = dF[item.seriesName]
      valueStr = format(_dF, valueStr)
      // 去掉背景色tooltip
      if (item.seriesName !== '_background_') {
        tmpl.push(`<span style="font-size: ${valueFS}; color: ${_gC(item.color)}">${item.seriesName}: ${valueStr}</span>`)
      }
    })
    return tmpl.join('<br>')
  }

  return option
}
