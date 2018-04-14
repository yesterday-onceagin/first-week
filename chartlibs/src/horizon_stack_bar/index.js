import component from './src/index'
import designer from './designer'

export default {
  info: {
    name: '堆叠条形图',         // 图表名称
    code: 'horizon_stack_bar',   // 图表唯一标识符
    type: 'chart'            // 图表类型: filter(过滤器), chart(图表)， auxiliary(辅助图形)
  },
  // 图标
  icons: {
    normal: require('./platform/icon/horizon_stack_bar.svg'),
    disabled: require('./platform/icon/horizon_stack_bar-disabled.svg')
  },
  // 示例封面
  preview: require('./platform/preview/sample.jpg'),
  component,
  designer
}
