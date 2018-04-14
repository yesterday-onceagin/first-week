import { PropComponents, Utils } from 'dmp-chart-sdk'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 默认数据请求条数
  defaultDataSize: 20,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 1,
        max: 1
      },
      value: {
        min: 1,
        max: 1
      }
    }, {
      value: {
        min: 1
      },
      dim: {
        min: 0,
        max: 0
      }
    }
  ],
  indicatorDescription: '1个维度 1个数值 或者0个维度 1个以上数值',

  // 是否支持穿透
  penetrable: true,

  // 是否支持触发联动
  linkage: true,

  // 是否属于被联动图表
  canLinked: true,

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [
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
    {
      title: '图例',
      field: 'legend',
      spread: false,
      show: false,
      items: [
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
          data: '#C7E0FF'
        },
        {
          label: '位置',
          field: 'position',
          component: {
            component: PropComponents.Select,
            props: {
              options: [
                { value: 'top-center', text: '顶部居中' },
                { value: 'top-left', text: '顶部居左' },
                { value: 'top-right', text: '顶部居右' },
                { value: 'bottom-center', text: '底部居中' },
                { value: 'bottom-left', text: '底部居左' },
                { value: 'bottom-right', text: '底部居右' }
              ]
            }
          },
          data: 'top-center'
        },
        {
          field: 'gap',
          label: '间距',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 0
            }
          },
          data: 5
        }
      ]
    },
  ]
}
