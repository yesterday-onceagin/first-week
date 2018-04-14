import component from './src/index'
import designer from './designer'

export default {
  info: {
    name: '树图',         // 图表名称
    code: 'treemap',   // 图表唯一标识符
    type: 'chart'            // 图表类型: filter(过滤器), chart(图表)， auxiliary(辅助图形)
  },
  component,
  designer
}