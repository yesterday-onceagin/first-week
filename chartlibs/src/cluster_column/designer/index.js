import { PropComponents } from 'dmp-chart-sdk'
import { Utils } from 'dmp-chart-sdk'

const { Theme } = Utils
const { generateDefaultColorTheme } = Theme

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 维度是否可以设置报告跳转
  hasUrlSetting: true,

  // 数值项是否可以设置报告跳转
  hasNumsUrlsetting: true,
  
  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 0
      },
      value: {
        min: 1
      }
    }
  ],
  indicatorDescription: '0个或多个维度，1个或多个数值',

  // 是否支持穿透
  penetrable: true,

  // 是否支持触发联动
  linkage: true,

  // 是否有次轴
  hasZaxis: true,

  // 是否有目标数值
  hasDesiredvalue: true,

  // 是否属于被联动图表
  canLinked: true,

  // 默认数据
  previewData: {},

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
              right: 20,
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
              field: 'distance',
              label: '间距',
              component: {
                component: PropComponents.Slider,
                props: {
                  min: -20,
                  max: 50,
                  step: 1
                }
              },
              data: 5
            }
          ]
        }
      ]
    }, {
      title: '次轴设置',
      spread: false,
      field: 'zaxisConfig',
      items: [{
        label: '折线样式',
        field: 'zaxisStyle',
        scope: ['line', 'area'],
        items: [
          {
            label: '折线粗细',
            field: 'lineWidth',
            component: {
              component: PropComponents.Spinner,
              props: {
                min: 1
              }
            },
            data: 2
          }, {
            label: '圆点半径',
            field: 'circleWidth',
            component: {
              component: PropComponents.Spinner,
              props: {
                min: 1
              }
            },
            data: 4
          }, {
            label: '折线类型',
            field: 'lineType',
            component: {
              component: PropComponents.Select,
              props: {
                options: [
                  { value: 'solid', text: '实线' },
                  { value: 'dashed', text: '虚线' },
                  { value: 'dot', text: '点线' }
                ]
              }
            },
            data: 'solid'
          }, {
            label: '近似曲线',
            field: 'lineSmooth',
            component: PropComponents.Checkbox,
            data: true
          }
        ]
      }, {
        field: 'zaxiValueLabel',
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
            field: 'distance',
            label: '间距',
            component: {
              component: PropComponents.Slider,
              props: {
                min: -20,
                max: 50,
                step: 1
              }
            },
            data: 5
          }
        ]
      }, {
        label: '轴标签',
        field: 'zaxisLabel',
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
        field: 'zaxisLine',
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
        //,
        // {
        //   field: 'markline',
        //   scope: 'yMarkline',
        //   label: '',
        //   component: {
        //     component: PropComponents.MarklineConfig,
        //     props: {
        //       axis: 'y',
        //       dynamic: true, // 支持计算值
        //     }
        //   },
        //   data: {
        //     show: true,
        //     color: '#41dfe3',
        //     width: 1,
        //     style: 'dashed',
        //     data: []
        //   }
        // }
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
        }, {
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
    }]
}
