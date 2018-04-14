import _ from 'lodash';
import { formatDisplay } from '../../utils/generateDisplayFormat';

// 默认的 markline 样式
const MARKLINE_DEFAULT_OPTIONS = {
  silent: false,
  animation: false,
  symbolSize: [0, 0],
  lineStyle: {
    normal: {
      type: 'dashed',
      width: '1',
      color: '#41dfe3',
    },
    emphasis: {
      type: 'dashed',
      width: '1',
      color: '#41dfe3',
    }
  },
  label: {
    normal: {
      show: true,
      position: 'middle',
      formatter: '{b}'
    },
    emphasis: {
      show: true,
      position: 'middle',
      formatter: '{b}'
    }
  },
  data: []
}

// symbol 样式
const MARKLINE_SYMBOL = {
  symbol: 'path://M716.8 25.6v665.6l-204.8 307.2-204.8-307.2V25.6z',
  symbolSize: [8, 15]
}

// 合并
const mergeMarklineOpts = function (markline, opts) {
  if (opts) {
    markline.lineStyle.normal.type = opts.style
    markline.lineStyle.normal.width = opts.width
    markline.lineStyle.normal.color = opts.color

    markline.lineStyle.emphasis.type = opts.style
    markline.lineStyle.emphasis.width = opts.width
    markline.lineStyle.emphasis.color = opts.color

    markline.label.normal.show = opts.show
    markline.label.emphasis.show = opts.show
  }
}

export default function markLine(option, markLine, HORIZON = false, displayFormat = null) {
  // 辅助线 相关数据
  const data = markLine.data

  if (Array.isArray(option.series)) {
    // x、y轴
    const markLine_data = []
    // z轴
    const z_markLine_data = []
    
    Array.isArray(data) && data.forEach((item) => {
      if (item.value !== '' && !Number.isNaN(+item.value)) {
        // 数值
        const value = Number.isSafeInteger(+item.value) ? +item.value : Number(+item.value).toFixed(2)
        // 格式化后的显示
        let fmt_value = value

        if (displayFormat) {
          fmt_value = formatDisplay(value, displayFormat)
        }

        const marklineData = {
          ...MARKLINE_SYMBOL,
          name: `${item.name}: ${fmt_value}`
        }

        HORIZON ? Object.assign(marklineData, {
          xAxis: value
        }) : Object.assign(marklineData, {
          yAxis: value
        })

        if (item.axis_type === 2) {
          z_markLine_data.push(marklineData)
        } else {
          markLine_data.push(marklineData)
        }
      }
    })

    if (option.series[0]) {
      option.series[0].markLine = {
        ..._.cloneDeep(MARKLINE_DEFAULT_OPTIONS),
        data: markLine_data
      }

      // x 轴
      if (HORIZON) {
        mergeMarklineOpts(option.series[0].markLine, markLine.x)
      } else {
        mergeMarklineOpts(option.series[0].markLine, markLine.y)
      }
    }
      
    // set grid.containLabel false
    option.grid.containLabel = markLine.type !== 'double_axis'

    if (option.series[1] && z_markLine_data.length > 0 && markLine.$el) {
      // 对 z_markLine_data 进行 的起点和终点进行计算
      const $el = markLine.$el

      const margin = markLine.margin
      // axis 坐标轴的宽度
      const axisWidth = $el._dom.clientWidth - margin.left - margin.right
      
      const pos = {
        start: axisWidth + (+margin.left),
        end: margin.left
      }

      const markline_data = []

      z_markLine_data.forEach((item) => {
        markline_data.push([{
          ...MARKLINE_SYMBOL,
          x: pos.start,
          yAxis: item.yAxis,
          name: item.name
        }, {
          x: pos.end,
          yAxis: item.yAxis
        }])
      })

      option.series[1].markLine = {
        ..._.cloneDeep(MARKLINE_DEFAULT_OPTIONS),
        data: markline_data
      }

      mergeMarklineOpts(option.series[1].markLine, markLine.z)
    }
  }

  // console.log(option)

  return option
}
