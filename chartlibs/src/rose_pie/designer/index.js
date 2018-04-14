import { PropComponents, Utils } from 'dmp-chart-sdk'


export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 维度是否可以设置报告跳转
  hasUrlSetting: true,

  // 默认数据请求条数
  defaultDataSize: 20,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        max: 1,
        min: 1
      },
      value: {
        min: 1,
        max: 1
      }
    }, {
      dim: {
        min: 0,
        max: 0
      },
      value: {
        min: 1,
        max: 10
      }
    }
  ],
  indicatorDescription: '1个维度 1个数值，0个维度10个或10个以内数值',

  // 是否支持穿透
  penetrable: true,

  // 是否支持触发联动
  linkage: true,

  // 是否属于被联动图表
  canLinked: true,

  // 默认数据
  previewData: {},

  // 样式配置
  chartConfig: [
    {
      title: '全局样式',
      field: 'global',
      spread: false,
      items: [
        {
          label: '轮播',
          field: 'scroll',
          show: {
            field: 'checked',
            data: false
          },
          component: PropComponents.Checkbox,
          data: false,
          items: [
            {
              label: '轮播间隔',
              field: 'interval',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 0,
                  unit: 's'
                }
              },
              data: 3
            }
          ]
        },
        {
          label: '标签间距',
          field: 'labelLine',
          items: [
            {
              label: '标签距中心',
              field: 'length1',
              component: {
                component: PropComponents.Slider,
                props: {
                  min: 0,
                  max: 100,
                  step: 1,
                }
              },
              data: 10
            },
            {
              label: '轴线距中心',
              field: 'length2',
              component: {
                component: PropComponents.Slider,
                props: {
                  min: 0,
                  max: 100,
                  step: 1
                }
              },
              data: 10
            }
          ]
        },
        {
          label: '标签颜色',
          field: 'labelColor',
          show: {
            field: 'show',
            data: false
          },
          items: [
            {
              label: '颜色',
              field: 'color',
              component: PropComponents.ColorPicker,
              data: 'RGBA(255,255,255,1)'
            }
          ]
        },
        {
          label: '维度标签',
          field: 'labelName',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '字号',
              field: 'fontSize',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              },
              data: 12
            }
          ]
        },
        {
          label: '数值标签',
          field: 'labelValue',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '字号',
              field: 'fontSize',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              },
              data: 12
            },
            {
              label: '行高',
              field: 'lineHeight',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              },
              data: 14
            }
          ]
        },
        {
          label: '百分比标签',
          field: 'labelPercent',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '字号',
              field: 'fontSize',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              },
              data: 12
            }
          ]
        },
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
