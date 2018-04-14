export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',

  // 数据是否可排序
  sortable: false,

  // 默认数据请求条数
  defaultDataSize: 0,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 1,
        max: 1,
        field_type: '日期',
        datefield_formula_mode: ['day']
      },
      value: {
        min: 0,
        max: 0
      }
    }
  ],
  indicatorDescription: '1个维度(日期), 0个数值',

  // 是否支持穿透
  penetrable: false,

  // 是否支持触发联动
  linkage: true,

  // 是否属于被联动图标
  canLinked: false,

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [
    {
      field: 'containerTitle',
      disabled: true
    }
  ]
}
