import component from './src/index'
import designer from './designer'

export default {
  info: {
    name: 'K线图',         // 图表名称
    code: 'candlestick',   // 图表唯一标识符
    type: 'chart'            // 图表类型: filter(过滤器), chart(图表)， auxiliary(辅助图形)
  },
  // 图标
  icons: {
    normal: require('./platform/icon/candlestick.svg'),
    disabled: require('./platform/icon/candlestick-disabled.svg')
  },
  // 示例封面
  preview: require('./platform/preview/sample.jpg'),
  component,
  designer
}
