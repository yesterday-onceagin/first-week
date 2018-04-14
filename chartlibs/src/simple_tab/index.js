import component from './src/index'
import designer from './designer/index'

export default {
  info: {
    name: 'Tab组件',         // 图表名称
    code: 'simple_tab',     // 图表唯一标识符
    type: 'simple',         // 图表类型: filter(过滤器), chart(图表)， auxiliary(辅助图形)
  },
  component,
  designer
}
