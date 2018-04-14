import { PropComponents } from 'dmp-chart-sdk'

import ColsComp from './components/Cols'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',

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
    }, {
      value: {
        min: 0
      },
      dim: {
        min: 1
      }
    }
  ],
  indicatorDescription: '0个或多个维度，0个或多个数值',

  // 是否支持穿透
  penetrable: true,

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
          label: '滚动设置',
          field: 'scroll',
          show: {
            field: 'checked',
            data: false
          },
          items: [
            {
              field: 'interVal',
              label: '间隔时间',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 1,
                  unit: 's'
                }
              },
              data: 5
            },
            {
              field: 'ln',
              label: '锁定行数',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 0,
                  unit: ''
                }
              },
              data: 0
            },
            {
              field: 'scrollMode',
              component: PropComponents.ScrollMode,
              data: {
                mode: 'page',
                rows: 1
              }
            }
          ]
        },
        {
          label: '单元格',
          field: 'cell',
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
              data: '#FFFFFF'
            },
            {
              field: 'lineHeight',
              label: '行高',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              },
              data: 30
            },
            {
              field: 'textAlign',
              label: '文本对齐',
              component: PropComponents.TextAlign,
              data: 'center'
            },
            {
              label: '合并同类单元格',
              field: 'rowspan',
              component: PropComponents.Checkbox,
              data: false
            }
          ]
        },
        {
          label: '前N行设置',
          field: 'qianN',
          show: {
            field: 'checked',
            data: false
          },
          items: [
            {
              field: 'end',
              label: '行数',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 0,
                  unit: ''
                }
              },
              data: 3
            },
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
            },
            {
              field: 'lineHeight',
              label: '行高',
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              },
              data: 30
            },
            {
              field: 'textAlign',
              label: '文本对齐',
              component: PropComponents.TextAlign,
              data: 'center'
            },
            {
              field: 'background',
              label: '背景颜色',
              component: PropComponents.ColorPicker,
              data: ''
            }
          ]
        }
      ]
    },
    {
      title: '表头',
      field: 'tableHeader',
      show: true,
      spread: false,
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
          data: '#FFFFFF'
        },
        {
          field: 'lineHeight',
          label: '行高',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 12
            }
          },
          data: 30
        },
        {
          field: 'fontStyle',
          label: '样式',
          component: PropComponents.FontStyle,
          data: {
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none'
          }
        },
        {
          field: 'textAlign',
          label: '对齐',
          component: PropComponents.TextAlign,
          data: 'center'
        },
        {
          field: 'background',
          label: '背景颜色',
          component: PropComponents.ColorPicker,
          data: '#092e49'
        }
      ]
    },
    {
      title: '行',
      field: 'rows',
      spread: false,
      items: [
        {
          field: 'splitLine',
          label: '分割线',
          show: {
            field: 'checked',
            data: true
          },
          items: [
            {
              field: 'border',
              component: PropComponents.Border,
              data: {
                borderColor: '#062D3E',
                borderStyle: 'solid',
                borderWidth: 1
              }
            }
          ]
        },
        {
          field: 'oddEven',
          label: '区分奇偶行',
          show: {
            field: 'checked',
            data: true
          },
          items: [
            {
              field: 'oddBackgroundColor',
              label: '奇行背景色',
              component: PropComponents.ColorPicker,
              data: ''
            },
            {
              field: 'evenBackgroundColor',
              label: '偶行背景色',
              component: PropComponents.ColorPicker,
              data: ''
            }
          ]
        }
      ]
    },
    {
      title: '列',
      field: 'cols',
      spread: false,
      items: [
        {
          field: 'list',
          component: ColsComp,
          data: []
        }
      ]
    },
    {
      title: '序号列',
      field: 'indexCol',
      show: false,
      spread: false,
      items: [
        {
          field: 'header',
          label: '表头内容',
          component: PropComponents.Input,
          data: '序号'
        },
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
        },
        {
          field: 'fontStyle',
          label: '样式',
          component: PropComponents.FontStyle,
          data: {
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'normal'
          }
        },
        {
          field: 'colWidth',
          label: '列宽占比',
          component: {
            component: PropComponents.Slider,
            props: {
              min: 0,
              max: 100,
              step: 1
            }
          },
          data: 50
        },
        {
          field: 'radius',
          label: '半径占比',
          component: {
            component: PropComponents.Slider,
            props: {
              min: 0,
              max: 100,
              step: 1
            }
          },
          data: 60
        },
        {
          field: 'background',
          label: '序号背景',
          component: PropComponents.ColorPicker,
          data: '#345A8A'
        }
      ]
    }
  ]
}
