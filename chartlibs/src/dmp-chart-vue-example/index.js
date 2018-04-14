import { Connect, getVueComponent } from 'dmp-chart-sdk'

import component from './src/index'
import designer from './designer'

export default {
  info: {
    name: '测试组件',                 // 图表名称
    code: 'dmp-chart-vue-example',   // 图表唯一标识符
    type: 'chart'                    // 图表类型: filter(过滤器), chart(图表)， auxiliary(辅助图形)
  },
  component: Connect()(getVueComponent(component)),
  designer
}
