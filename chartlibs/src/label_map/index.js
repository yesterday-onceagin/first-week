import component from './src/index'
import designer from './designer/index'

export default {
  info: {
    name: '标签地图',             // 图表名称
    code: 'label_map',          // 图表唯一标识符
    type: 'chart',              // 图表类型: filter(过滤器), chart(图表)， auxiliary(辅助图形)
  },
  component,
  designer
}
