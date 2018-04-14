import { PropComponents, Utils } from 'dmp-chart-sdk'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: false,

  // 默认数据请求条数
  defaultDataSize: 20,

  // 数据指标规则
  indicatorRules: [
    {
      value: {
        min: 2,
        max: 3
      },
      dim: {
        min: 0
      }
    }
  ],
  indicatorDescription: '0个或多个维度，2个或3个数值',

  // 是否支持穿透
  penetrable: false,

  // 是否支持触发联动
  linkage: false,

  // 是否属于被联动图表
  canLinked: true,

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [
    {
      title: '全局样式',
      field: 'globalStyle',
      spread: false,
      items: [{
        label: '边距',
        field: 'gap',
        items: [
          {
            field: 'margin',
            component: {
              component: PropComponents.GridSpinner,
              props: {
                indent: true,
                options: [
                  {
                    name: 'top',
                    label: '上',
                    max: +Infinity,
                    min: 0,
                    step: 1
                  },
                  {
                    name: 'bottom',
                    label: '下',
                    max: +Infinity,
                    min: 0,
                    step: 1
                  },
                  {
                    name: 'left',
                    label: '左',
                    max: +Infinity,
                    min: 0,
                    step: 1
                  },
                  {
                    name: 'right',
                    label: '右',
                    max: +Infinity,
                    min: 0,
                    step: 1
                  }
                ]
              }
            },
            data: {
              top: 40,
              bottom: 20,
              left: 20,
              right: 20
            }
          }
        ]
      }]
    },
    {
      title: '配色方案',
      spread: false,
      field: 'theme',
      items: [{
        label: '',
        field: 'colorTheme',
        component: {
          component: PropComponents.ColorThemeConfig,
          props: {
            gradient: true,
            dimensionSwitch: true,
            legends: 'scatter_like'
          }
        },
        data: Utils.Theme.generateDefaultColorTheme()
      }],
    },
    {
      title: 'x轴',
      field: 'x',
      spread: false,
      items: [
        {
          label: '轴标签',
          field: 'label',
          show: {
            field: 'show',
            data: true
          },
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
            }
          ]
        },
        {
          label: '轴线',
          field: 'axis',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              field: 'color',
              label: '颜色',
              component: PropComponents.ColorPicker,
              data: '#C7E0FF'
            }
          ]
        }
      ]
    },
    {
      title: 'y轴',
      field: 'y',
      spread: false,
      items: [
        {
          label: '轴标签',
          field: 'label',
          show: {
            field: 'show',
            data: true
          },
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
            }
          ]
        },
        {
          label: '轴线',
          field: 'axis',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              field: 'color',
              label: '颜色',
              component: PropComponents.ColorPicker,
              data: '#C7E0FF'
            }
          ]
        }
      ]
    }
  ]
}
