import { PropComponents } from 'dmp-chart-sdk'
import { Utils } from 'dmp-chart-sdk'

const { Theme } = Utils
const { generateDefaultColorTheme } = Theme

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 报告是否可以设置报告跳转
  hasUrlSetting: true,
  
  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 0,
        max: 2
      },
      value: {
        min: 2
      }
    }
  ],
  indicatorDescription: '2个以内维度，2个或多个数值',

  // 是否支持穿透
  penetrable: true,

  // 是否支持触发联动
  linkage: true,

  // 是否有次轴
  hasZaxis: false,

  // 是否有目标数值
  hasDesiredvalue: true,

  // 是否属于被联动图表
  canLinked: true,

  // 默认数据
  previewData: {
    data: [
      {
        project: '示例1',
        value1: 100,
        value2: 50
      },
      {
        project: '示例2',
        value1: 90,
        value2: 70
      },
      {
        project: '示例3',
        value1: 70,
        value2: 70
      },
      {
        project: '示例4',
        value1: 80,
        value2: 30
      }
    ],
    indicators: {
      dims: [
        {
          col_name: 'project'
        }
      ],
      nums: [
        {
          col_name: 'value1'
        }, {
          col_name: 'value2'
        }
      ],
      desires: []
    }
  },

  // 图表配置
  chartConfig: [
    {
      title: '全局样式',
      field: 'global',
      spread: false,
      items: [
        {
          label: '边距',
          field: 'padding',
          items: [{
            field: 'grid',
            label: '',
            component: {
              component: PropComponents.GridSpinner,
              props: {
                indent: false,
                options: [
                  {
                    name: 'top',
                    label: '上',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  },
                  {
                    name: 'bottom',
                    label: '下',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  },
                  {
                    name: 'left',
                    label: '左',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  },
                  {
                    name: 'right',
                    label: '右',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  }
                ]
              }
            },
            data: {
              top: 40,
              right: 40,
              bottom: 20,
              left: 20
            }
          }]
        },
        {
          label: '柱子样式',
          field: 'barStyle',
          items: [
            {
              field: 'distance',
              label: '柱间间距',
              component: {
                component: PropComponents.Slider,
                props: {
                  min: 0,
                  max: 1,
                  step: 0.01
                }
              },
              data: 0.6
            },
            {
              field: 'background',
              label: '柱子背景',
              component: PropComponents.ColorPicker,
              data: 'RGBA(69,145,255,0.1)'
            }
          ]
        }, {
          field: 'barLabel',
          label: '值标签',
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
              data: 12
            }, {
              field: 'color',
              label: '颜色',
              component: PropComponents.ColorPicker,
              data: '#C7E0FF'
            }, {
              field: 'position',
              label: '位置',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'inside', text: '居中' },
                    { value: 'insideLeft', text: '左侧' },
                    { value: 'insideRight', text: '右侧' }
                  ]
                }
              },
              data: 'inside'
            }
          ]
        }
      ]
    }, {
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
            dimensionSwitch: true,
            legends: 'bar_like'
          }
        },
        data: generateDefaultColorTheme(),
      }],
    }, {
      title: '图例',
      field: 'legend',
      show: false,
      spread: false,
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
        }, {
          label: '颜色',
          field: 'color',
          component: PropComponents.ColorPicker,
          data: '#C7E0FF',
        }, {
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
                { value: 'bottom-right', text: '底部居右' },
              ]
            }
          },
          data: 'top-center'
        }, {
          label: '间距',
          field: 'gap',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 0
            }
          },
          data: 5
        }
      ]
    }, {
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
              label: '字号',
              field: 'fontSize',
              data: 12,
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              }
            }, {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }, {
              label: '角度',
              field: 'angle',
              data: 'horizon',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'horizon', text: '水平' },
                    { value: 'italic', text: '斜角' },
                    { value: 'vertical', text: '垂直' },
                  ]
                }
              }
            }
          ]
        }, {
          label: '轴线',
          field: 'axis',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }
          ]
        }
      ]
    }, {
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
              label: '字号',
              field: 'fontSize',
              data: 12,
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              }
            }, {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }, {
              label: '全部标签',
              field: 'showAll',
              data: false,
              component: PropComponents.Checkbox
            }, {
              label: '角度',
              field: 'angle',
              data: 'horizon',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'horizon', text: '水平' },
                    { value: 'italic', text: '斜角' },
                    { value: 'vertical', text: '垂直' },
                  ]
                }
              }
            }
          ]
        }, {
          label: '轴线',
          field: 'axis',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }
          ]
        }, {
          field: 'markline',
          scope: 'xMarkline',
          label: '',
          component: {
            component: PropComponents.MarklineConfig,
            props: {
              axis: 'x',
              dynamic: false, // 不支持计算值
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
