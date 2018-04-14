import { PropComponents, Utils } from 'dmp-chart-sdk'
//import MyComponent from './components/mycomponent'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则
  indicatorRules: [
    {
      value: {
        max: '1',
        min: '1'
      },
      dim: {
        max: '1',
        min: '1'
      }
    }
  ],
  indicatorDescription: '1个维度 1个数值',

  // 是否支持穿透
  penetrable: true,

  // 是否支持触发联动
  linkage: false,

  // 是否属于被联动图表
  canLinked: false,

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [
    
    { //全局样式
    title: '全局样式',
    field: 'global',
    items: [
      {
        title:"值标签",
        field:'valueLabel',
        items:[
          {
            field: 'fontSize',
            label: '字号',
            component: {
              component: PropComponents.Spinner,
              props: {
                min: 12
              }
            },
            data: 14
          },
          {
            field: 'color',
            label: '颜色',
            component: PropComponents.ColorPicker,
            data: '#FFFFFF'
          }     
        ]
      }
    ]
  },
  {
    title: '配色方案',
    spread: true,
    field: 'theme',
    items: [{
      label: '',
      field: 'colorTheme',
      component: {
        component: PropComponents.ColorThemeConfig,
        props: {
          gradient: true,
          dimensionSwitch: false,
          legends: 'pie_like'
        }
      },
      data: Utils.Theme.generateDefaultColorTheme(),
    }],
  },
]
}
