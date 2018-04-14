import { PropComponents, Utils } from 'dmp-chart-sdk'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 默认数据请求条数
  defaultDataSize: 20,

  // 数据指标规则
  indicatorRules: [{
    dim: {
      min: 1,
      max: 1
    },
    value: {
      min: 1
    }
  }],
  indicatorDescription: '1个维度，1个或多个数值',

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
      title: '全局样式',
      field: 'globalStyle',
      spread: false,
      items: [
        {
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
                bottom: 40,
                left: 40,
                right: 40
              }
            }
          ]
        },
        {
          label: '折线样式',
          field: 'lineStyle',
          items: [
            {
              field: 'lineBorder',
              component: {
                component: PropComponents.Border,
                props: {
                  hideColor: true,
                  styleLabel: '折线粗细'
                }
              },
              data: {
                borderStyle: 'solid',
                borderWidth: 2
              }
            },
            {
              label: '圆点半径',
              field: 'radius',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 1
                }
              },
              data: 4
            },
            {
              label: '近似曲线',
              field: 'lineSmooth',
              component: PropComponents.Checkbox,
              data: true
            }
          ]
        },
        {
          label: '值标签',
          field: 'lineLabel',
          show: {
            field: 'show',
            data: false
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
              field: 'distance',
              label: '间距',
              component: {
                component: PropComponents.Slider,
                props: {
                  min: 0,
                  max: 20,
                  step: 1,
                  tipFormatter: v => `${v}px`
                }
              },
              data: 10
            },
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
            legends: 'line_like'
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
            },
            {
              label: '全部标签',
              field: 'showAll',
              component: PropComponents.Checkbox,
              data: false
            },
            {
              label: '角度',
              field: 'angle',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'horizon', text: '水平' },
                    { value: 'italic', text: '斜角' },
                    { value: 'vertical', text: '垂直' }
                  ]
                }
              },
              data: 'horizon'
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
            },
            {
              label: '角度',
              field: 'angle',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'horizon', text: '水平' },
                    { value: 'italic', text: '斜角' },
                    { value: 'vertical', text: '垂直' }
                  ]
                }
              },
              data: 'horizon'
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
        },
        {
          field: 'markline',
          scope: 'yMarkline',
          label: '',
          component: {
            component: PropComponents.MarklineConfig,
            props: {
              axis: 'y',
              dynamic: true, // 支持计算值
            }
          },
          data: {
            show: true,
            color: '#41dfe3',
            width: 1,
            style: 'dashed',
            data: []
          }
        }
      ]
    }
  ]
}
