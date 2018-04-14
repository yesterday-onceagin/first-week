import { PropComponents } from 'dmp-chart-sdk'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: false,

  // 默认数据请求条数, 下拉筛选无限制
  // defaultDataSize: 1500,

  // 数据指标规则
  indicatorRules: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '3',
      min: '1',
      formula_mode: ['year', 'month', 'hour', 'minute', 'second']
    }
  }],
  indicatorDescription: '指标支持(1-3个维度, 0个数值),不支持穿透、联动',

  // 是否支持穿透
  penetrable: false,

  // 是否支持触发联动
  linkage: false,

  // 是否属于被联动图表
  canLinked: false,

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: []
}
